#!/usr/bin/env node
/**
 * task-record-emit.js — Emit a structured task record for Hermes ingestion
 *
 * Called by coding agents, task-complete.js, and coding-checkpoint.js
 * at the end of any significant task run (success or failure).
 *
 * Usage:
 *   node task-record-emit.js '<json record>'
 *
 * Required fields:
 *   task_id, terminal_state, workflow_type, objective
 *
 * Full schema:
 * {
 *   "task_id":                    "string",
 *   "workflow_type":              "code|deploy|config|artifact|debug|ops|general",
 *   "objective":                  "string",
 *   "acceptance_criteria":        ["string"],
 *   "plan_summary":               "string",
 *   "start_ts":                   "ISO",
 *   "end_ts":                     "ISO",
 *   "files_touched":              ["path"],
 *   "commands_run":               ["string"],
 *   "terminal_state":             "completed_verified|completed_unverified|partial|blocked|failed|timed_out",
 *   "evidence":                   {},
 *   "failures_encountered":       ["string"],
 *   "retries":                    0,
 *   "human_intervention_required":false,
 *   "root_cause_guess":           "string",
 *   "lesson_candidate":           "string",
 *   "artifacts_created":          ["path"]
 * }
 */

import fs from 'fs';
import path from 'path';

const TASK_RECORDS_DIR = '/Users/openclaw/.openclaw/workspace/data/task-records';
const EVENT_BUS        = '/Users/openclaw/.openclaw/workspace/data/task-records/event-bus.jsonl';

const REQUIRED = ['task_id', 'terminal_state', 'workflow_type', 'objective'];
const VALID_STATES = ['completed_verified', 'completed_unverified', 'partial', 'blocked', 'failed', 'timed_out'];
const VALID_TYPES  = ['code', 'deploy', 'config', 'artifact', 'debug', 'ops', 'general'];

function emitEvent(type, status, detail, data = {}) {
  const event = { ts: new Date().toISOString(), source: 'task-record-emit', type, status, detail, data };
  try {
    fs.mkdirSync(path.dirname(EVENT_BUS), { recursive: true });
    fs.appendFileSync(EVENT_BUS, JSON.stringify(event) + '\n', 'utf8');
  } catch {}
}

const [,, rawJson] = process.argv;

if (!rawJson) {
  console.error('Usage: task-record-emit.js \'<json record>\'');
  process.exit(1);
}

let record;
try {
  record = JSON.parse(rawJson);
} catch (e) {
  console.error(`[task-record-emit] Parse error: ${e.message}`);
  process.exit(1);
}

// Validate required fields
const missing = REQUIRED.filter(f => !record[f]);
if (missing.length > 0) {
  console.error(`[task-record-emit] Missing required fields: ${missing.join(', ')}`);
  process.exit(1);
}

// Validate enum fields
if (!VALID_STATES.includes(record.terminal_state)) {
  console.error(`[task-record-emit] Invalid terminal_state: ${record.terminal_state}`);
  console.error(`  Valid: ${VALID_STATES.join(', ')}`);
  process.exit(1);
}

if (record.workflow_type && !VALID_TYPES.includes(record.workflow_type)) {
  console.warn(`[task-record-emit] Unknown workflow_type: ${record.workflow_type} (allowed but flagged)`);
}

// Apply defaults
record.end_ts = record.end_ts || new Date().toISOString();
record.retries = record.retries ?? 0;
record.human_intervention_required = record.human_intervention_required ?? false;
record.failures_encountered = record.failures_encountered ?? [];
record.files_touched = record.files_touched ?? [];
record.commands_run = record.commands_run ?? [];
record.artifacts_created = record.artifacts_created ?? [];
record.acceptance_criteria = record.acceptance_criteria ?? [];
record.evidence = record.evidence ?? {};

// Write record
fs.mkdirSync(TASK_RECORDS_DIR, { recursive: true });
const recordPath = path.join(TASK_RECORDS_DIR, `${record.task_id}.json`);

// If record already exists, merge (don't overwrite a verified record with unverified)
if (fs.existsSync(recordPath)) {
  const existing = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  const existingPriority = VALID_STATES.indexOf(existing.terminal_state);
  const newPriority      = VALID_STATES.indexOf(record.terminal_state);
  // Lower index = better state; only overwrite if new state is same or better
  if (newPriority > existingPriority) {
    console.warn(`[task-record-emit] Existing record ${record.task_id} has better state (${existing.terminal_state}); not downgrading to ${record.terminal_state}`);
    process.exit(0);
  }
  console.log(`[task-record-emit] Updating existing record ${record.task_id}`);
}

fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf8');

emitEvent('task_record_written', 'ok',
  `Task record written: ${record.task_id} [${record.terminal_state}]`,
  { task_id: record.task_id, terminal_state: record.terminal_state, workflow_type: record.workflow_type }
);

console.log(`[task-record-emit] ✓ Record written: ${recordPath}`);
console.log(`  task_id:        ${record.task_id}`);
console.log(`  terminal_state: ${record.terminal_state}`);
console.log(`  workflow_type:  ${record.workflow_type}`);
console.log(`  objective:      ${record.objective.slice(0, 80)}`);
