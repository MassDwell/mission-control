/**
 * CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS
 * Command Bus API — Unified action queue for Mission Control + Telegram
 *
 * Architecture:
 *   - ALL operator actions (UI or Telegram) enter this queue first
 *   - Clawson is the ONLY executor (no direct state mutations allowed)
 *   - 60-second deduplication window (signature-based)
 *   - All executed actions logged to agent_activity.json
 *   - SSOT files: venture_pipeline.json, workstreams.json, blocked_work.json,
 *                 venture_scoreboard.json, agent_activity.json
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const os   = require('os');
const { randomUUID } = require('crypto');

// ─── Paths ────────────────────────────────────────────────────────────────────

const DATA_ROOT    = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');
const QUEUE_FILE   = path.join(DATA_ROOT, 'operator_actions.json');
const ACTIVITY_FILE = path.join(DATA_ROOT, 'agent_activity.json');

// SSOT target files (only Clawson may write these via this bus)
const SSOT_FILES = {
  venture_pipeline: path.join(DATA_ROOT, 'venture_pipeline.json'),
  workstreams:      path.join(DATA_ROOT, 'workstreams.json'),
  blocked_work:     path.join(DATA_ROOT, 'blocked_work.json'),
  venture_scoreboard: path.join(DATA_ROOT, 'venture_scoreboard.json'),
  agent_activity:   path.join(DATA_ROOT, 'agent_activity.json'),
  ventures:         path.join(DATA_ROOT, 'ventures.json'),
};

// Valid action types
const VALID_ACTION_TYPES = [
  'pause_venture',
  'resume_venture',
  'advance_stage',
  'kill_venture',
  'spawn_workstream',
  'assign_agent',
  'clear_blocker',
  'complete_workstream',
  'reopen_workstream',
  'trigger_experiment',
  'approve_decision',
  'reject_decision',
];

// High-impact actions requiring confirmation
const HIGH_IMPACT_ACTIONS = [
  'kill_venture',
  'advance_stage',
  'clear_blocker',
  'spawn_workstream',
  'trigger_experiment',
];

// Deduplication window (60 seconds)
const DEDUP_WINDOW_MS = 60 * 1000;

// ─── Queue I/O ────────────────────────────────────────────────────────────────

function loadQueue() {
  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[CMD-BUS] Failed to load queue:', err.message);
    return { lastUpdated: new Date().toISOString(), actions: [] };
  }
}

function saveQueue(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Signature + Deduplication ────────────────────────────────────────────────

/**
 * Compute a deterministic signature for an action.
 * hash(action_type + target_type + target_id + normalize(payload))
 */
function computeSignature(action_type, target_type, target_id, payload) {
  const normalized = JSON.stringify(
    Object.keys(payload || {}).sort().reduce((acc, k) => {
      acc[k] = payload[k];
      return acc;
    }, {})
  );
  const raw = `${action_type}:${target_type}:${target_id}:${normalized}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Check if a matching action already exists within the dedup window.
 * Returns the duplicate action or null.
 */
function findDuplicate(actions, signature) {
  const now = Date.now();
  return actions.find(a =>
    a.signature === signature &&
    (now - new Date(a.created_at).getTime()) < DEDUP_WINDOW_MS &&
    a.status !== 'rejected'
  ) || null;
}

// ─── Queue Write (UI + Telegram → queue ONLY) ─────────────────────────────────

/**
 * Submit an action to the command bus queue.
 * Returns { queued: true, action } or { duplicate: true, existing }
 *
 * @param {object} params
 *   action_type:  one of VALID_ACTION_TYPES
 *   target_type:  'venture' | 'workstream' | 'blocker' | 'agent'
 *   target_id:    string ID of target object
 *   operator:     'Steve' (or other)
 *   source:       'mission_control' | 'telegram'
 *   payload:      arbitrary action payload (next_stage, reason, etc.)
 */
function submitAction(params) {
  const {
    action_type,
    target_type,
    target_id,
    operator = 'Steve',
    source,
    payload = {}
  } = params;

  // Validation
  if (!VALID_ACTION_TYPES.includes(action_type)) {
    throw new Error(`Invalid action_type: ${action_type}. Valid: ${VALID_ACTION_TYPES.join(', ')}`);
  }
  if (!source || !['mission_control', 'telegram'].includes(source)) {
    throw new Error(`Invalid source: ${source}. Must be 'mission_control' or 'telegram'`);
  }
  if (!target_id) {
    throw new Error('target_id is required');
  }

  const queue = loadQueue();
  const signature = computeSignature(action_type, target_type, target_id, payload);

  // Deduplication check
  const duplicate = findDuplicate(queue.actions, signature);
  if (duplicate) {
    console.log(`[CMD-BUS] Duplicate detected: ${action_type} on ${target_id} (${signature}) — original: ${duplicate.id}`);
    return { duplicate: true, existing: duplicate };
  }

  // Create action record
  const action = {
    id:          randomUUID(),
    source,
    operator,
    action_type,
    target_type: target_type || 'venture',
    target_id,
    payload,
    status:      'pending',
    created_at:  new Date().toISOString(),
    executed_at: null,
    result:      null,
    signature,
  };

  queue.actions.push(action);
  saveQueue(queue);

  console.log(`[CMD-BUS] Action queued: ${action.id} — ${action_type} on ${target_id} (${source})`);
  return { queued: true, action };
}

// ─── Queue Execution (Clawson ONLY) ──────────────────────────────────────────

/**
 * Get all pending actions (for Clawson executor to process).
 */
function getPendingActions() {
  const queue = loadQueue();
  return queue.actions.filter(a => a.status === 'pending');
}

/**
 * Mark an action as executing.
 */
function markExecuting(actionId) {
  const queue = loadQueue();
  const action = queue.actions.find(a => a.id === actionId);
  if (!action) throw new Error(`Action not found: ${actionId}`);
  action.status = 'executing';
  saveQueue(queue);
  return action;
}

/**
 * Mark an action as executed (success).
 * Also logs to agent_activity.json.
 */
function markExecuted(actionId, result) {
  const queue = loadQueue();
  const action = queue.actions.find(a => a.id === actionId);
  if (!action) throw new Error(`Action not found: ${actionId}`);

  action.status      = 'executed';
  action.executed_at = new Date().toISOString();
  action.result      = result || 'success';
  saveQueue(queue);

  // Log to agent_activity.json
  appendActivityLog({
    agent:       'Clawson',
    action:      formatActionName(action.action_type),
    description: buildDescription(action),
    severity:    'info',
    source:      action.source,
    timestamp:   action.executed_at,
  });

  console.log(`[CMD-BUS] Executed: ${actionId} — ${action.action_type} (${action.source})`);
  return action;
}

/**
 * Mark an action as rejected (e.g., duplicate, validation failure).
 */
function markRejected(actionId, reason) {
  const queue = loadQueue();
  const action = queue.actions.find(a => a.id === actionId);
  if (!action) throw new Error(`Action not found: ${actionId}`);

  action.status      = 'rejected';
  action.executed_at = new Date().toISOString();
  action.result      = reason || 'rejected';
  saveQueue(queue);

  console.log(`[CMD-BUS] Rejected: ${actionId} — ${reason}`);
  return action;
}

/**
 * Mark an action as failed.
 */
function markFailed(actionId, errorMsg) {
  const queue = loadQueue();
  const action = queue.actions.find(a => a.id === actionId);
  if (!action) throw new Error(`Action not found: ${actionId}`);

  action.status      = 'failed';
  action.executed_at = new Date().toISOString();
  action.result      = errorMsg || 'failed';
  saveQueue(queue);

  // Log failure to activity
  appendActivityLog({
    agent:       'Clawson',
    action:      formatActionName(action.action_type),
    description: `FAILED: ${buildDescription(action)} — ${errorMsg}`,
    severity:    'warning',
    source:      action.source,
    timestamp:   action.executed_at,
  });

  console.log(`[CMD-BUS] Failed: ${actionId} — ${errorMsg}`);
  return action;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

function appendActivityLog(entry) {
  try {
    let data = { lastUpdated: '', activities: [] };
    if (fs.existsSync(ACTIVITY_FILE)) {
      data = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf-8'));
    }
    // Support both 'activities' (primary) and 'feed' (legacy) keys
    if (!data.activities) data.activities = data.feed || [];

    const logEntry = { ...entry };  // No extra id field needed (matches existing format)

    data.activities.unshift(logEntry);
    // Also update feed array for backwards compatibility
    if (Array.isArray(data.feed)) {
      data.feed.unshift(logEntry);
      if (data.feed.length > 500) data.feed = data.feed.slice(0, 500);
    }
    // Keep last 500 entries
    if (data.activities.length > 500) data.activities = data.activities.slice(0, 500);
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CMD-BUS] Failed to append activity log:', err.message);
  }
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

function formatActionName(action_type) {
  const names = {
    pause_venture:       'Pause Venture',
    resume_venture:      'Resume Venture',
    advance_stage:       'Advance Venture Stage',
    kill_venture:        'Kill Venture',
    spawn_workstream:    'Spawn Workstream',
    assign_agent:        'Assign Agent',
    clear_blocker:       'Clear Blocker',
    complete_workstream: 'Complete Workstream',
    reopen_workstream:   'Reopen Workstream',
    trigger_experiment:  'Trigger Experiment',
    approve_decision:    'Approve Decision Gate',
    reject_decision:     'Reject Decision Gate',
  };
  return names[action_type] || action_type;
}

function buildDescription(action) {
  const parts = [`${action.target_id}`];
  if (action.payload?.next_stage)  parts.push(`→ ${action.payload.next_stage}`);
  if (action.payload?.reason)      parts.push(`(${action.payload.reason})`);
  if (action.payload?.name)        parts.push(`"${action.payload.name}"`);
  if (action.payload?.owner)       parts.push(`owner: ${action.payload.owner}`);
  return `${parts.join(' ')} (via ${action.source})`;
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

/**
 * Get action status by ID.
 */
function getAction(actionId) {
  const queue = loadQueue();
  return queue.actions.find(a => a.id === actionId) || null;
}

/**
 * Get recent actions (last N, newest first).
 */
function getRecentActions(limit = 50) {
  const queue = loadQueue();
  return queue.actions
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

/**
 * Get queue stats.
 */
function getQueueStats() {
  const queue = loadQueue();
  const actions = queue.actions;
  return {
    total:     actions.length,
    pending:   actions.filter(a => a.status === 'pending').length,
    executing: actions.filter(a => a.status === 'executing').length,
    executed:  actions.filter(a => a.status === 'executed').length,
    rejected:  actions.filter(a => a.status === 'rejected').length,
    failed:    actions.filter(a => a.status === 'failed').length,
    lastUpdated: queue.lastUpdated,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  submitAction,
  getPendingActions,
  markExecuting,
  markExecuted,
  markRejected,
  markFailed,
  getAction,
  getRecentActions,
  getQueueStats,
  computeSignature,
  VALID_ACTION_TYPES,
  HIGH_IMPACT_ACTIONS,
  appendActivityLog,
  formatActionName,
};
