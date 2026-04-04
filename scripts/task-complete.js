#!/usr/bin/env node
/**
 * task-complete.js — Proof-of-completion enforcement
 *
 * Emits a structured task completion envelope to the Hermes event bus.
 * Automatically downgrades terminal_state if evidence is missing or insufficient.
 *
 * Usage:
 *   node task-complete.js '<json envelope>'
 *
 * Envelope schema:
 * {
 *   "objective": "string",
 *   "terminal_state": "completed_verified|completed_unverified|partial|blocked|failed|timed_out",
 *   "task_type": "code|deploy|artifact|config|ui|general",
 *   "evidence": {
 *     // code:    { diff_present, files_changed, test_status, lint_status, build_status }
 *     // deploy:  { push_confirmed, deployment_listed, deployment_ready, url }
 *     // artifact:{ file_path, file_exists, file_size_bytes }
 *     // config:  { schema_valid, compile_passed, service_healthy }
 *     // ui:      { assertion_passed, screenshot_path, check_result }
 *     // general: { description }
 *   },
 *   "blockers": [],
 *   "changed_files": [],
 *   "commands_run": [],
 *   "next_step": "string"
 * }
 *
 * Terminal states:
 *   completed_verified   — evidence present and machine-checkable; all required fields pass
 *   completed_unverified — claimed done but evidence missing or incomplete
 *   partial              — some work done, objective not fully met
 *   blocked              — cannot proceed due to dependency or missing input
 *   failed               — execution error, explicit failure
 *   timed_out            — exceeded time budget without completion
 */

import fs from 'fs';

const EVENT_BUS = '/Users/openclaw/.openclaw/workspace/data/hermes/event-bus.jsonl';
const MAX_LINES = 500;

const VALID_STATES = [
  'completed_verified',
  'completed_unverified',
  'partial',
  'blocked',
  'failed',
  'timed_out',
];

const VALID_TASK_TYPES = ['code', 'deploy', 'artifact', 'config', 'ui', 'general'];

// Evidence requirements per task type
const EVIDENCE_REQUIREMENTS = {
  code: ['diff_present', 'files_changed'],
  deploy: ['push_confirmed', 'deployment_listed', 'deployment_ready'],
  artifact: ['file_path', 'file_exists'],
  config: ['schema_valid', 'service_healthy'],
  ui: ['assertion_passed'],
  general: ['description'],
};

function validateEvidence(task_type, evidence) {
  const required = EVIDENCE_REQUIREMENTS[task_type] || [];
  const missing = [];
  const warnings = [];

  for (const field of required) {
    if (!(field in evidence)) {
      missing.push(field);
    } else if (evidence[field] === false || evidence[field] === null || evidence[field] === '') {
      warnings.push(`${field} = ${JSON.stringify(evidence[field])}`);
    }
  }

  // Extra checks
  if (task_type === 'artifact' && evidence.file_exists && evidence.file_path) {
    try {
      const stat = fs.statSync(evidence.file_path);
      if (stat.size === 0) warnings.push('file_size_bytes = 0 (empty file)');
      evidence.file_size_bytes = stat.size;
      evidence.file_verified = true;
    } catch {
      warnings.push(`file not readable at path: ${evidence.file_path}`);
      evidence.file_verified = false;
    }
  }

  if (task_type === 'deploy' && evidence.deployment_ready === false) {
    warnings.push('deployment_ready = false — deploy not confirmed healthy');
  }

  return { missing, warnings };
}

function determineDowngrade(requested_state, task_type, evidence, blockers) {
  if (requested_state !== 'completed_verified') {
    return { state: requested_state, downgrade_reason: null };
  }

  const { missing, warnings } = validateEvidence(task_type, evidence);

  if (missing.length > 0) {
    return {
      state: 'completed_unverified',
      downgrade_reason: `Missing required evidence fields: ${missing.join(', ')}`,
      missing,
      warnings,
    };
  }

  if (warnings.length > 0) {
    return {
      state: 'completed_unverified',
      downgrade_reason: `Evidence present but failed checks: ${warnings.join('; ')}`,
      missing: [],
      warnings,
    };
  }

  if (blockers && blockers.length > 0) {
    return {
      state: 'blocked',
      downgrade_reason: `Blockers present: ${blockers.join('; ')}`,
      missing: [],
      warnings: [],
    };
  }

  return { state: 'completed_verified', downgrade_reason: null, missing: [], warnings: [] };
}

function emitEvent(event) {
  fs.mkdirSync('/Users/openclaw/.openclaw/workspace/data/hermes', { recursive: true });

  try {
    const existing = fs.existsSync(EVENT_BUS)
      ? fs.readFileSync(EVENT_BUS, 'utf8').split('\n').filter(Boolean)
      : [];
    if (existing.length >= MAX_LINES) {
      const trimmed = existing.slice(-400);
      fs.writeFileSync(EVENT_BUS, trimmed.join('\n') + '\n', 'utf8');
    }
  } catch {}

  fs.appendFileSync(EVENT_BUS, JSON.stringify(event) + '\n', 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

const raw = process.argv[2];
if (!raw) {
  console.error('Usage: node task-complete.js \'<json envelope>\'');
  process.exit(1);
}

let envelope;
try {
  envelope = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON envelope:', e.message);
  process.exit(1);
}

// Validate required top-level fields
const required = ['objective', 'terminal_state', 'task_type', 'evidence'];
const topMissing = required.filter(f => !(f in envelope));
if (topMissing.length > 0) {
  console.error(`Envelope missing required fields: ${topMissing.join(', ')}`);
  process.exit(1);
}

if (!VALID_STATES.includes(envelope.terminal_state)) {
  console.error(`Invalid terminal_state: "${envelope.terminal_state}". Must be one of: ${VALID_STATES.join(', ')}`);
  process.exit(1);
}

if (!VALID_TASK_TYPES.includes(envelope.task_type)) {
  console.error(`Invalid task_type: "${envelope.task_type}". Must be one of: ${VALID_TASK_TYPES.join(', ')}`);
  process.exit(1);
}

const { state, downgrade_reason, missing, warnings } = determineDowngrade(
  envelope.terminal_state,
  envelope.task_type,
  envelope.evidence || {},
  envelope.blockers || []
);

const wasDowngraded = state !== envelope.terminal_state;
const finalEnvelope = {
  ...envelope,
  terminal_state: state,
  _original_claimed_state: wasDowngraded ? envelope.terminal_state : undefined,
  _downgrade_reason: downgrade_reason || undefined,
  _evidence_warnings: warnings?.length ? warnings : undefined,
  _evidence_missing: missing?.length ? missing : undefined,
  ts: new Date().toISOString(),
};

// ── Emit task record for Hermes learning layer ────────────────────────────────
try {
  const { execFileSync } = await import('child_process');
  const taskRecord = {
    task_id:                     envelope.task_id || `tc-${Date.now()}`,
    workflow_type:                envelope.task_type === 'ui' ? 'code' : (envelope.task_type || 'general'),
    objective:                    envelope.objective,
    acceptance_criteria:          envelope.acceptance_criteria || [],
    plan_summary:                 envelope.plan_summary || '',
    start_ts:                     envelope.start_ts || null,
    end_ts:                       finalEnvelope.ts,
    files_touched:                envelope.changed_files || [],
    commands_run:                 envelope.commands_run || [],
    terminal_state:               state,
    evidence:                     finalEnvelope.evidence || {},
    failures_encountered:         envelope.failures_encountered || [],
    retries:                      envelope.retries || 0,
    human_intervention_required:  envelope.human_intervention_required || false,
    root_cause_guess:             envelope.root_cause_guess || '',
    lesson_candidate:             envelope.lesson_candidate || '',
    artifacts_created:            envelope.artifacts_created || [],
  };
  execFileSync(process.execPath, [
    '/Users/openclaw/.openclaw/workspace/scripts/task-record-emit.js',
    JSON.stringify(taskRecord),
  ], { stdio: 'inherit' });
} catch (e) {
  // Non-fatal: don't block completion reporting if record emit fails
  console.warn(`[task-complete] Warning: failed to emit task record: ${e.message}`);
}

// Emit to event bus
const eventType = wasDowngraded ? 'task_completion_downgraded' : 'task_completion';
const eventStatus = state === 'completed_verified' ? 'ok'
  : state === 'completed_unverified' ? 'warn'
  : state === 'partial' ? 'warn'
  : 'fail';

emitEvent({
  ts: finalEnvelope.ts,
  source: 'task-complete',
  type: eventType,
  status: eventStatus,
  detail: wasDowngraded
    ? `DOWNGRADED ${envelope.terminal_state}→${state}: ${envelope.objective}`
    : `${state.toUpperCase()}: ${envelope.objective}`,
  data: finalEnvelope,
});

// Print summary
console.log('\n══════════════════════════════════════════════');
console.log('  TASK COMPLETION REPORT');
console.log('══════════════════════════════════════════════');
console.log(`  Objective:      ${envelope.objective}`);
console.log(`  Terminal State: ${state.toUpperCase()}${wasDowngraded ? ` (claimed: ${envelope.terminal_state})` : ''}`);
if (downgrade_reason) console.log(`  ⚠ Downgrade:   ${downgrade_reason}`);
if (warnings?.length) warnings.forEach(w => console.log(`  ⚠ Warning:     ${w}`));
if (envelope.changed_files?.length) console.log(`  Changed Files:  ${envelope.changed_files.join(', ')}`);
if (envelope.blockers?.length) console.log(`  Blockers:       ${envelope.blockers.join('; ')}`);
if (envelope.next_step) console.log(`  Next Step:      ${envelope.next_step}`);
console.log('══════════════════════════════════════════════\n');

// Exit with non-zero if downgraded from completed_verified or failed/timed_out
if (wasDowngraded || state === 'failed' || state === 'timed_out') {
  process.exit(2); // 2 = downgraded/failure (not a script error)
}
process.exit(0);
