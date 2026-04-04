#!/usr/bin/env node
/**
 * coding-checkpoint.js — Checkpointed coding workflow state tracker
 *
 * Writes stage state to disk so long coding sessions survive context collapse.
 * Each stage must be explicitly completed before the next begins.
 *
 * Usage:
 *   node coding-checkpoint.js init   <task_id> <objective>
 *   node coding-checkpoint.js stage  <task_id> <stage> [notes]
 *   node coding-checkpoint.js status <task_id>
 *   node coding-checkpoint.js list
 *   node coding-checkpoint.js close  <task_id> <terminal_state> [summary]
 *
 * Stages (in order):
 *   understand  — task parsed, acceptance criteria defined
 *   inspect     — repo/files explored, relevant code located
 *   plan        — change plan written, approach decided
 *   implement   — files changed, code written
 *   verify      — tests/lint/build run, diff reviewed
 *   summarize   — diff summarized, criteria checked
 *   complete    — task-complete.js called with evidence
 */

import fs from 'fs';
import path from 'path';

const STATE_DIR = '/Users/openclaw/.openclaw/workspace/data/coding-checkpoints';
const EVENT_BUS = '/Users/openclaw/.openclaw/workspace/data/task-records/event-bus.jsonl';
const STALL_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

const STAGES = ['understand', 'inspect', 'plan', 'implement', 'verify', 'summarize', 'complete'];

fs.mkdirSync(STATE_DIR, { recursive: true });
fs.mkdirSync('/Users/openclaw/.openclaw/workspace/data/task-records', { recursive: true });

function stateFile(task_id) {
  return path.join(STATE_DIR, `${task_id}.json`);
}

function loadState(task_id) {
  const f = stateFile(task_id);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(stateFile(state.task_id), JSON.stringify(state, null, 2), 'utf8');
}

function emitEvent(type, status, detail, data = {}) {
  const event = { ts: new Date().toISOString(), source: 'coding-checkpoint', type, status, detail, data };
  try {
    fs.appendFileSync(EVENT_BUS, JSON.stringify(event) + '\n', 'utf8');
  } catch {}
}

function formatAge(ms) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'init': {
    const [task_id, ...objParts] = args;
    const objective = objParts.join(' ');
    if (!task_id || !objective) {
      console.error('Usage: coding-checkpoint.js init <task_id> <objective>');
      process.exit(1);
    }
    if (loadState(task_id)) {
      console.error(`Task ${task_id} already exists. Use 'status' to check it.`);
      process.exit(1);
    }
    const state = {
      task_id,
      objective,
      created_at: new Date().toISOString(),
      current_stage: 'understand',
      stages_completed: [],
      stage_history: [],
      terminal_state: null,
      last_heartbeat: new Date().toISOString(),
    };
    saveState(state);
    emitEvent('coding_task_started', 'ok', `Task started: ${objective}`, { task_id, objective });
    console.log(`✓ Task ${task_id} initialized`);
    console.log(`  Objective: ${objective}`);
    console.log(`  First stage: understand`);
    break;
  }

  case 'stage': {
    const [task_id, stage, ...notesParts] = args;
    const notes = notesParts.join(' ') || '';
    if (!task_id || !stage) {
      console.error('Usage: coding-checkpoint.js stage <task_id> <stage> [notes]');
      process.exit(1);
    }
    const state = loadState(task_id);
    if (!state) { console.error(`Task ${task_id} not found`); process.exit(1); }
    if (state.terminal_state) { console.error(`Task ${task_id} already closed: ${state.terminal_state}`); process.exit(1); }
    if (!STAGES.includes(stage)) {
      console.error(`Invalid stage: "${stage}". Must be one of: ${STAGES.join(', ')}`);
      process.exit(1);
    }

    const stageIdx = STAGES.indexOf(stage);
    const currentIdx = STAGES.indexOf(state.current_stage);
    if (stageIdx < currentIdx) {
      console.warn(`⚠ Stage "${stage}" is before current stage "${state.current_stage}" — recording anyway`);
    }

    state.stages_completed.push(stage);
    state.stage_history.push({
      stage,
      completed_at: new Date().toISOString(),
      notes: notes || null,
    });
    const nextStage = STAGES[stageIdx + 1] || null;
    state.current_stage = nextStage || state.current_stage;
    state.last_heartbeat = new Date().toISOString();
    saveState(state);

    emitEvent('coding_stage_completed', 'ok', `Stage "${stage}" completed: ${state.objective}`, {
      task_id, stage, next_stage: nextStage, notes,
    });

    console.log(`✓ Stage "${stage}" completed for task ${task_id}`);
    if (nextStage) console.log(`  Next stage: ${nextStage}`);
    else console.log(`  All stages done — run task-complete.js with evidence`);
    break;
  }

  case 'heartbeat': {
    const [task_id] = args;
    if (!task_id) { console.error('Usage: coding-checkpoint.js heartbeat <task_id>'); process.exit(1); }
    const state = loadState(task_id);
    if (!state) { console.error(`Task ${task_id} not found`); process.exit(1); }
    if (state.terminal_state) { console.log(`Task ${task_id} already closed: ${state.terminal_state}`); break; }
    state.last_heartbeat = new Date().toISOString();
    saveState(state);
    console.log(`✓ Heartbeat recorded for ${task_id}`);
    break;
  }

  case 'status': {
    const [task_id] = args;
    if (!task_id) { console.error('Usage: coding-checkpoint.js status <task_id>'); process.exit(1); }
    const state = loadState(task_id);
    if (!state) { console.error(`Task ${task_id} not found`); process.exit(1); }
    const age = Date.now() - new Date(state.last_heartbeat).getTime();
    const stalled = !state.terminal_state && age > STALL_THRESHOLD_MS;
    console.log(`\nTask: ${state.task_id}`);
    console.log(`Objective: ${state.objective}`);
    console.log(`Current Stage: ${state.current_stage}`);
    console.log(`Stages Done: ${state.stages_completed.join(' → ') || 'none'}`);
    console.log(`Terminal State: ${state.terminal_state || 'in_progress'}`);
    console.log(`Last Heartbeat: ${state.last_heartbeat} (${formatAge(age)} ago)${stalled ? ' ⚠ STALLED' : ''}`);
    if (stalled) {
      emitEvent('coding_task_stalled', 'warn',
        `Task stalled >10min at stage "${state.current_stage}": ${state.objective}`,
        { task_id: state.task_id, stage: state.current_stage, stale_ms: age });
    }
    break;
  }

  case 'list': {
    const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) { console.log('No active coding tasks.'); break; }
    console.log(`\nCoding Tasks (${files.length}):`);
    for (const f of files) {
      const state = JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), 'utf8'));
      const age = Date.now() - new Date(state.last_heartbeat).getTime();
      const stalled = !state.terminal_state && age > STALL_THRESHOLD_MS;
      const status = state.terminal_state || (stalled ? '⚠ STALLED' : 'in_progress');
      console.log(`  ${state.task_id}  [${status}]  stage: ${state.current_stage}  hb: ${formatAge(age)} ago`);
      console.log(`    ${state.objective}`);
    }
    break;
  }

  case 'close': {
    const [task_id, terminal_state, ...summaryParts] = args;
    const summary = summaryParts.join(' ') || '';
    if (!task_id || !terminal_state) {
      console.error('Usage: coding-checkpoint.js close <task_id> <terminal_state> [summary]');
      process.exit(1);
    }
    const state = loadState(task_id);
    if (!state) { console.error(`Task ${task_id} not found`); process.exit(1); }
    if (state.terminal_state) {
      console.error(`Task ${task_id} already closed: ${state.terminal_state}`);
      process.exit(1);
    }
    state.terminal_state = terminal_state;
    state.closed_at = new Date().toISOString();
    state.summary = summary || null;
    saveState(state);
    emitEvent('coding_task_closed', terminal_state.includes('verified') ? 'ok' : 'warn',
      `Task closed [${terminal_state}]: ${state.objective}`,
      { task_id, terminal_state, summary });
    console.log(`✓ Task ${task_id} closed: ${terminal_state}`);
    break;
  }

  default:
    console.error(`Unknown command: ${cmd}`);
    console.error('Commands: init, stage, heartbeat, status, list, close');
    process.exit(1);
}
