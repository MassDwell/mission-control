#!/usr/bin/env node
/**
 * CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS
 * Integration Test Suite
 *
 * Tests:
 *   1. Submit action (mission_control source)
 *   2. Submit same action from telegram (should DEDUPLICATE)
 *   3. Different action (no dedupe)
 *   4. Mark executed → verify activity log
 *   5. Reject action
 *   6. Queue stats
 *   7. Invalid action_type rejection
 *   8. Invalid source rejection
 *   9. Missing target_id rejection
 *  10. SSOT-only check (no shadow state)
 */

'use strict';

const bus = require('./api/command-bus');
const fs  = require('fs');
const path = require('path');
const os   = require('os');

const DATA_ROOT = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');
const QUEUE_FILE = path.join(DATA_ROOT, 'operator_actions.json');
const ACTIVITY_FILE = path.join(DATA_ROOT, 'agent_activity.json');

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

// Save original state
const origQueue = fs.readFileSync(QUEUE_FILE, 'utf-8');

console.log('═══════════════════════════════════════════════════════════');
console.log('  CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS — Test Suite  ');
console.log('═══════════════════════════════════════════════════════════\n');

// Reset queue before tests
fs.writeFileSync(QUEUE_FILE, JSON.stringify({
  schema_version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  actions: []
}, null, 2));

// ─── TEST 1: Submit from mission_control ─────────────────────────────────────
console.log('TEST 1: Submit action (mission_control)');
const r1 = bus.submitAction({
  action_type: 'advance_stage',
  target_type: 'venture',
  target_id:   'leadscore-ai',
  operator:    'Steve',
  source:      'mission_control',
  payload:     { next_stage: 'build' }
});
assert(r1.queued === true, 'Action queued successfully');
assert(r1.action?.status === 'pending', 'Status is pending');
assert(r1.action?.source === 'mission_control', 'Source is mission_control');
assert(r1.action?.signature?.length === 16, 'Signature is 16 chars');
const actionId1 = r1.action.id;

// ─── TEST 2: Duplicate from telegram (60s window) ────────────────────────────
console.log('\nTEST 2: Duplicate detection (telegram → same action)');
const r2 = bus.submitAction({
  action_type: 'advance_stage',
  target_type: 'venture',
  target_id:   'leadscore-ai',
  operator:    'Steve',
  source:      'telegram',  // different source, same action!
  payload:     { next_stage: 'build' }
});
assert(r2.duplicate === true, 'Duplicate detected');
assert(r2.existing?.id === actionId1, 'Points to original action');
assert(r2.existing?.source === 'mission_control', 'Shows original source');

// ─── TEST 3: Different action (should NOT dedupe) ────────────────────────────
console.log('\nTEST 3: Different action (no dedupe)');
const r3 = bus.submitAction({
  action_type: 'pause_venture',
  target_type: 'venture',
  target_id:   'leadscore-ai',
  operator:    'Steve',
  source:      'telegram',
  payload:     {}
});
assert(r3.queued === true, 'Different action queued separately');
assert(r3.action?.action_type === 'pause_venture', 'Correct action type');

// ─── TEST 4: Mark executed + activity log ────────────────────────────────────
console.log('\nTEST 4: Mark executed → activity log');
const executed = bus.markExecuted(actionId1, 'LeadScore.ai: Proposal → Build');
assert(executed.status === 'executed', 'Status is executed');
assert(executed.result === 'LeadScore.ai: Proposal → Build', 'Result recorded');
assert(executed.executed_at !== null, 'executed_at timestamp set');

// Check activity log
try {
  const actData = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf-8'));
  const entries = actData.activities || actData.feed || [];
  const clawsonEntry = entries.find(e => e.agent === 'Clawson' && e.source === 'mission_control');
  assert(clawsonEntry !== undefined, 'Clawson entry in activity log');
  assert(clawsonEntry?.action === 'Advance Venture Stage', 'Action name correct');
  assert(clawsonEntry?.source === 'mission_control', 'Source recorded correctly');
} catch (err) {
  assert(false, `Activity log check failed: ${err.message}`);
}

// ─── TEST 5: Reject action ────────────────────────────────────────────────────
console.log('\nTEST 5: Reject action');
const r5id = r3.action.id;
const rejected = bus.markRejected(r5id, 'duplicate_action');
assert(rejected.status === 'rejected', 'Status is rejected');
assert(rejected.result === 'duplicate_action', 'Rejection reason recorded');

// ─── TEST 6: Queue stats ──────────────────────────────────────────────────────
console.log('\nTEST 6: Queue stats');
const stats = bus.getQueueStats();
assert(stats.total === 2, `Total = 2 (got ${stats.total})`);
assert(stats.executed === 1, `Executed = 1 (got ${stats.executed})`);
assert(stats.rejected === 1, `Rejected = 1 (got ${stats.rejected})`);
assert(stats.pending === 0, `Pending = 0 (got ${stats.pending})`);

// ─── TEST 7: Invalid action type ─────────────────────────────────────────────
console.log('\nTEST 7: Invalid action_type');
let threw = false;
try {
  bus.submitAction({
    action_type: 'hack_everything',  // invalid
    target_id: 'test',
    source: 'telegram',
    payload: {}
  });
} catch (err) {
  threw = true;
  assert(err.message.includes('Invalid action_type'), 'Throws on invalid action type');
}
assert(threw, 'Error thrown for invalid action type');

// ─── TEST 8: Invalid source ───────────────────────────────────────────────────
console.log('\nTEST 8: Invalid source');
threw = false;
try {
  bus.submitAction({
    action_type: 'pause_venture',
    target_id: 'test',
    source: 'direct_api',  // invalid — bypassing queue not allowed
    payload: {}
  });
} catch (err) {
  threw = true;
  assert(err.message.includes('Invalid source'), 'Throws on invalid source');
}
assert(threw, 'Error thrown for invalid source');

// ─── TEST 9: Missing target_id ────────────────────────────────────────────────
console.log('\nTEST 9: Missing target_id');
threw = false;
try {
  bus.submitAction({
    action_type: 'pause_venture',
    source: 'telegram',
    payload: {}
    // target_id missing!
  });
} catch (err) {
  threw = true;
  assert(err.message.includes('target_id'), 'Throws on missing target_id');
}
assert(threw, 'Error thrown for missing target_id');

// ─── TEST 10: Signature determinism ──────────────────────────────────────────
console.log('\nTEST 10: Signature determinism');
const sig1 = bus.computeSignature('advance_stage', 'venture', 'leadscore-ai', { next_stage: 'build' });
const sig2 = bus.computeSignature('advance_stage', 'venture', 'leadscore-ai', { next_stage: 'build' });
const sig3 = bus.computeSignature('advance_stage', 'venture', 'leadscore-ai', { next_stage: 'launch' }); // different payload
assert(sig1 === sig2, 'Same inputs → same signature');
assert(sig1 !== sig3, 'Different payload → different signature');

// ─── TEST 11: Recent actions query ────────────────────────────────────────────
console.log('\nTEST 11: Recent actions query');
const recent = bus.getRecentActions(10);
assert(recent.length === 2, `getRecentActions returns 2 (got ${recent.length})`);
assert(recent[0].created_at >= recent[1].created_at, 'Newest first ordering');

// ─── TEST 12: All action types valid ─────────────────────────────────────────
console.log('\nTEST 12: All 12 action types registered');
assert(bus.VALID_ACTION_TYPES.length === 12, `12 action types (got ${bus.VALID_ACTION_TYPES.length})`);
assert(bus.VALID_ACTION_TYPES.includes('kill_venture'), 'kill_venture registered');
assert(bus.VALID_ACTION_TYPES.includes('spawn_workstream'), 'spawn_workstream registered');
assert(bus.VALID_ACTION_TYPES.includes('approve_decision'), 'approve_decision registered');
assert(bus.VALID_ACTION_TYPES.includes('trigger_experiment'), 'trigger_experiment registered');

// ─── Cleanup ──────────────────────────────────────────────────────────────────
fs.writeFileSync(QUEUE_FILE, origQueue);
console.log('\n(Queue restored to original state)');

// ─── Results ─────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed | ${failed} failed`);
if (failed === 0) {
  console.log('  ✅ ALL TESTS PASSED — Command Bus is operational');
} else {
  console.log(`  ❌ ${failed} TEST(S) FAILED`);
}
console.log('═══════════════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
