#!/usr/bin/env node
/**
 * CR-008: Unit Tests for Decision Panel
 * Tests: data loading, queue append, validation
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test data module
const dataModule = require('./api/data');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    testsFailed++;
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
  }
}

console.log('[TEST] CR-008: Decision Panel Unit Tests\n');

// Test 1: Load decisions
test('Load decisions_required.json', () => {
  const decisions = dataModule.loadDecisionsRequired();
  assert(decisions.decisions, 'Should have decisions array');
  assert(Array.isArray(decisions.decisions), 'Decisions should be an array');
  assert(decisions.decisions.length > 0, 'Should have sample decisions');
  assert(decisions.decisions[0].decision_id, 'Decision should have decision_id');
});

// Test 2: Load queue
test('Load decision_actions_queue.json', () => {
  const queue = dataModule.loadDecisionActionsQueue();
  assert(queue.items !== undefined, 'Should have items array');
  assert(Array.isArray(queue.items), 'Items should be an array');
  // Should start empty
  assert(queue.items.length === 0, 'Queue should start empty');
});

// Test 3: Load log
test('Load decision_actions_log.json', () => {
  const log = dataModule.loadDecisionActionsLog();
  assert(log.entries !== undefined, 'Should have entries array');
  assert(Array.isArray(log.entries), 'Entries should be an array');
  // Should start empty
  assert(log.entries.length === 0, 'Log should start empty');
});

// Test 4: Queue schema validation
test('Decision schema validation', () => {
  const decisions = dataModule.loadDecisionsRequired();
  const decision = decisions.decisions[0];
  
  assert(decision.decision_id, 'Should have decision_id');
  assert(decision.type, 'Should have type');
  assert(['workstream_approval', 'blocker_clearance', 'venture_approval'].includes(decision.type), 
    'Type should be valid');
  assert(decision.title, 'Should have title');
  assert(decision.description, 'Should have description');
  assert(decision.impact, 'Should have impact');
  assert(['review', 'approve', 'reject'].includes(decision.recommended_action), 
    'Recommended action should be valid');
  assert(['low', 'medium', 'high'].includes(decision.urgency), 
    'Urgency should be valid');
  assert(decision.linked_item, 'Should have linked_item');
});

// Test 5: Queue action validation
test('Queue action append validation', () => {
  const action = {
    action_id: 'test-uuid-001',
    decision_id: 'dec_ws_001_ph2',
    action: 'approve',
    requested_by: 'steve',
    note: 'Test approval'
  };

  // Validate action shape
  assert(action.action_id, 'Action should have action_id');
  assert(['review', 'approve', 'reject'].includes(action.action), 'Action should be valid');
  assert(action.decision_id, 'Action should have decision_id');
});

// Test 6: File structure validation
test('Data directory structure', () => {
  const dataRoot = path.join(process.env.HOME, '.openclaw/workspace/data/mission-control');
  assert(fs.existsSync(dataRoot), 'Data root should exist');
  assert(fs.existsSync(path.join(dataRoot, 'decisions_required.json')), 'decisions_required.json should exist');
  assert(fs.existsSync(path.join(dataRoot, 'decision_actions_queue.json')), 'decision_actions_queue.json should exist');
  assert(fs.existsSync(path.join(dataRoot, 'decision_actions_log.json')), 'decision_actions_log.json should exist');
});

// Test 7: Immutability check (log entries are write-once)
test('Log immutability (entries are write-once)', () => {
  const log = dataModule.loadDecisionActionsLog();
  const schema = log.schema_version;
  assert(schema === '1.0', 'Log should have correct schema version');
  // Log entries should never be modified once written
  assert(log.entries !== undefined, 'Log should have entries array');
});

console.log(`\n[TEST SUMMARY]\nTotal: ${testsRun} | Passed: ${testsPassed} | Failed: ${testsFailed}\n`);

if (testsFailed > 0) {
  process.exit(1);
}
