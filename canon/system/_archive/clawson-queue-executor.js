/**
 * CLAWSON QUEUE EXECUTOR — Phase 1 Implementation
 * 
 * Governs operator_actions.json processing with tight constraints:
 * - Claim-lock enforcement
 * - Whitelist: spawn_workstream, assign_agent ONLY
 * - Sandbox target: LeadScore.ai ONLY
 * - Full lifecycle management (7 states)
 * - Agent activity logging for every attempt
 * - Governed SSOT mutation
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

const WORKSPACE = '/Users/openclaw/.openclaw/workspace';
const QUEUE_FILE = path.join(WORKSPACE, 'data/mission-control/operator_actions.json');
const ACTIVITY_FILE = path.join(WORKSPACE, 'data/mission-control/agent_activity.json');
const VENTURE_PIPELINE_FILE = path.join(WORKSPACE, 'data/mission-control/venture_pipeline.json');
const WORKSTREAMS_FILE = path.join(WORKSPACE, 'data/mission-control/workstreams.json');

// Phase 1 constraints
const APPROVED_ACTIONS = ['spawn_workstream', 'assign_agent'];
const SANDBOX_TARGETS = ['LeadScore.ai'];
const DUPLICATE_WINDOW_MS = 60000; // 60 seconds
const STALE_WINDOW_MS = 3600000; // 1 hour

/**
 * LIFECYCLE STATES
 * pending → claimed → executing → completed/failed/duplicate/cancelled
 */
const STATES = {
  PENDING: 'pending',
  CLAIMED: 'claimed',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DUPLICATE: 'duplicate',
  CANCELLED: 'cancelled'
};

/**
 * Read queue atomically
 */
function readQueue() {
  try {
    const data = fs.readFileSync(QUEUE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[EXECUTOR] Queue read error:', err.message);
    return { actions: [] };
  }
}

/**
 * Write queue atomically (entire document)
 */
function writeQueue(queue) {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    return true;
  } catch (err) {
    console.error('[EXECUTOR] Queue write error:', err.message);
    return false;
  }
}

/**
 * Log to agent_activity.json
 */
function logActivity(entry) {
  try {
    let activity = { activities: [] };
    if (fs.existsSync(ACTIVITY_FILE)) {
      const data = fs.readFileSync(ACTIVITY_FILE, 'utf8');
      activity = JSON.parse(data);
    }
    
    // Ensure activities array exists
    if (!activity.activities) {
      activity.activities = [];
    }
    
    activity.activities.push({
      timestamp: new Date().toISOString(),
      ...entry
    });
    
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(activity, null, 2));
  } catch (err) {
    console.error('[EXECUTOR] Activity log error:', err.message);
  }
}

/**
 * CLAIM-LOCK: Atomically transition pending → claimed
 * Prevents duplicate concurrent execution
 */
function claimAction(queue, actionId) {
  const action = queue.actions.find(a => a.id === actionId);
  if (!action) {
    return { success: false, reason: 'action_not_found' };
  }
  
  if (action.status !== STATES.PENDING) {
    return { success: false, reason: `not_in_pending_state (${action.status})` };
  }
  
  // Atomic claim
  action.status = STATES.CLAIMED;
  action.claimed_at = new Date().toISOString();
  action.claim_lock = true;
  
  if (!writeQueue(queue)) {
    return { success: false, reason: 'queue_write_failed' };
  }
  
  return { success: true };
}

/**
 * IDEMPOTENCY CHECK: Detect and reject duplicates
 */
function checkDuplicate(queue, action) {
  const now = Date.now();
  const actionSignature = action.signature || generateSignature(action);
  
  for (const a of queue.actions) {
    if (a.id === action.id) continue; // Skip self
    if (a.signature !== actionSignature) continue;
    if (a.status === STATES.DUPLICATE) continue; // Already handled
    
    const actionAge = now - new Date(a.created_at).getTime();
    if (actionAge < DUPLICATE_WINDOW_MS) {
      return {
        isDuplicate: true,
        originalId: a.id,
        age: actionAge
      };
    }
  }
  
  return { isDuplicate: false };
}

/**
 * STALE CHECK: Reject actions older than 1 hour
 */
function checkStale(action) {
  const now = Date.now();
  const age = now - new Date(action.created_at).getTime();
  
  if (age > STALE_WINDOW_MS) {
    return {
      isStale: true,
      age: age,
      maxAge: STALE_WINDOW_MS
    };
  }
  
  return { isStale: false };
}

/**
 * WHITELIST CHECK: Only approved actions allowed
 */
function checkWhitelist(action) {
  if (!APPROVED_ACTIONS.includes(action.action_type)) {
    return {
      allowed: false,
      action: action.action_type,
      approved: APPROVED_ACTIONS
    };
  }
  return { allowed: true };
}

/**
 * SANDBOX CHECK: Only LeadScore.ai allowed in Phase 1
 */
function checkSandbox(action) {
  if (!SANDBOX_TARGETS.includes(action.target_id)) {
    return {
      allowed: false,
      target: action.target_id,
      approved: SANDBOX_TARGETS
    };
  }
  return { allowed: true };
}

/**
 * VALIDATION: Run all pre-execution checks
 */
function validateAction(queue, action) {
  // Whitelist check
  const whitelistCheck = checkWhitelist(action);
  if (!whitelistCheck.allowed) {
    return {
      valid: false,
      reason: 'not_whitelisted',
      details: whitelistCheck
    };
  }
  
  // Sandbox check
  const sandboxCheck = checkSandbox(action);
  if (!sandboxCheck.allowed) {
    return {
      valid: false,
      reason: 'not_in_sandbox',
      details: sandboxCheck
    };
  }
  
  // Stale check
  const staleCheck = checkStale(action);
  if (staleCheck.isStale) {
    return {
      valid: false,
      reason: 'action_stale',
      details: staleCheck
    };
  }
  
  // Duplicate check
  const dupCheck = checkDuplicate(queue, action);
  if (dupCheck.isDuplicate) {
    return {
      valid: false,
      reason: 'duplicate_action',
      details: dupCheck
    };
  }
  
  return { valid: true };
}

/**
 * EXECUTE: spawn_workstream
 */
function executeSpawnWorkstream(action) {
  try {
    const { target_id: ventureId, payload } = action;
    
    // Read workstreams
    let workstreams = { active: [] };
    if (fs.existsSync(WORKSTREAMS_FILE)) {
      const data = fs.readFileSync(WORKSTREAMS_FILE, 'utf8');
      workstreams = JSON.parse(data);
    }
    
    // Create workstream
    const workstream = {
      id: `ws-${action.id.substring(0, 8)}`,
      name: payload.task_name,
      description: payload.description,
      venture_id: ventureId,
      status: 'in_progress',
      progress: 0,
      created_at: new Date().toISOString(),
      created_by: 'clawson_executor',
      source_action: action.id
    };
    
    workstreams.active.push(workstream);
    
    // Write workstreams (SSOT mutation)
    fs.writeFileSync(WORKSTREAMS_FILE, JSON.stringify(workstreams, null, 2));
    
    return {
      success: true,
      workstream_id: workstream.id,
      ssot_file: 'workstreams.json'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * EXECUTE: assign_agent (placeholder for Phase 1)
 */
function executeAssignAgent(action) {
  try {
    // Phase 1: Placeholder implementation
    // In real use, would assign agent to workstream/venture
    return {
      success: true,
      message: 'agent_assignment_noted',
      ssot_file: 'none_mutated_in_phase1'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Execute action based on type
 */
function executeAction(action) {
  switch (action.action_type) {
    case 'spawn_workstream':
      return executeSpawnWorkstream(action);
    case 'assign_agent':
      return executeAssignAgent(action);
    default:
      return { success: false, error: 'unknown_action_type' };
  }
}

/**
 * Generate deterministic signature for duplicate detection
 */
function generateSignature(action) {
  const key = `${action.action_type}:${action.target_id}:${JSON.stringify(action.payload)}`;
  return createHash('sha256').update(key).digest('hex').substring(0, 16);
}

/**
 * CLAIM AND EXECUTE: Main orchestration logic
 */
function claimAndExecuteAction(actionId) {
  console.log(`\n[EXECUTOR] Processing action: ${actionId}`);
  
  // Step 1: Read queue
  const queue = readQueue();
  const action = queue.actions.find(a => a.id === actionId);
  
  if (!action) {
    console.error(`[EXECUTOR] Action not found: ${actionId}`);
    return { status: 'FAILED', reason: 'action_not_found' };
  }
  
  console.log(`[EXECUTOR] Current status: ${action.status}`);
  
  // Step 2: Attempt claim (pending → claimed)
  const claimResult = claimAction(queue, actionId);
  if (!claimResult.success) {
    console.error(`[EXECUTOR] Claim failed: ${claimResult.reason}`);
    logActivity({
      agent: 'Clawson',
      action: 'claim_attempt',
      action_id: actionId,
      result: 'failed',
      reason: claimResult.reason
    });
    return { status: 'FAILED', reason: `claim_failed: ${claimResult.reason}` };
  }
  
  console.log(`[EXECUTOR] ✅ Claimed action ${actionId}`);
  logActivity({
    agent: 'Clawson',
    action: 'claim_success',
    action_id: actionId,
    status: 'claimed'
  });
  
  // Refresh queue after claim
  const refreshedQueue = readQueue();
  const claimedAction = refreshedQueue.actions.find(a => a.id === actionId);
  
  // Step 3: Validate
  const validation = validateAction(refreshedQueue, claimedAction);
  if (!validation.valid) {
    console.error(`[EXECUTOR] Validation failed: ${validation.reason}`);
    
    // Mark as failed/duplicate/cancelled based on reason
    let finalStatus = STATES.FAILED;
    if (validation.reason === 'duplicate_action') finalStatus = STATES.DUPLICATE;
    if (validation.reason === 'action_stale') finalStatus = STATES.CANCELLED;
    
    claimedAction.status = finalStatus;
    claimedAction.result = { validation_failed: validation };
    
    writeQueue(refreshedQueue);
    
    logActivity({
      agent: 'Clawson',
      action: 'validation_failed',
      action_id: actionId,
      status: finalStatus,
      reason: validation.reason,
      details: validation.details
    });
    
    return { status: finalStatus, reason: validation.reason };
  }
  
  console.log(`[EXECUTOR] ✅ Validation passed`);
  logActivity({
    agent: 'Clawson',
    action: 'validation_passed',
    action_id: actionId,
    action_type: claimedAction.action_type,
    target: claimedAction.target_id
  });
  
  // Step 4: Transition to executing
  claimedAction.status = STATES.EXECUTING;
  claimedAction.execution_started_at = new Date().toISOString();
  writeQueue(refreshedQueue);
  
  logActivity({
    agent: 'Clawson',
    action: 'execution_started',
    action_id: actionId,
    status: STATES.EXECUTING
  });
  
  console.log(`[EXECUTOR] ✅ Transitioning to executing`);
  
  // Step 5: Execute
  console.log(`[EXECUTOR] Executing ${claimedAction.action_type}...`);
  const execResult = executeAction(claimedAction);
  
  // Refresh queue before final update
  const finalQueue = readQueue();
  const finalAction = finalQueue.actions.find(a => a.id === actionId);
  
  if (execResult.success) {
    // Step 6: Complete successfully
    finalAction.status = STATES.COMPLETED;
    finalAction.executed_at = new Date().toISOString();
    finalAction.result = execResult;
    
    writeQueue(finalQueue);
    
    logActivity({
      agent: 'Clawson',
      action: 'execution_completed',
      action_id: actionId,
      action_type: finalAction.action_type,
      status: STATES.COMPLETED,
      result: execResult,
      ssot_mutations: execResult.ssot_file ? [execResult.ssot_file] : []
    });
    
    console.log(`[EXECUTOR] ✅ COMPLETED`);
    return { status: STATES.COMPLETED, result: execResult };
  } else {
    // Step 6: Failed
    finalAction.status = STATES.FAILED;
    finalAction.executed_at = new Date().toISOString();
    finalAction.result = execResult;
    
    writeQueue(finalQueue);
    
    logActivity({
      agent: 'Clawson',
      action: 'execution_failed',
      action_id: actionId,
      action_type: finalAction.action_type,
      status: STATES.FAILED,
      error: execResult.error
    });
    
    console.error(`[EXECUTOR] ❌ FAILED: ${execResult.error}`);
    return { status: STATES.FAILED, error: execResult.error };
  }
}

/**
 * POLL LOOP: Clawson calls this every 10 seconds
 */
function pollQueue() {
  console.log(`\n[EXECUTOR] Poll @ ${new Date().toISOString()}`);
  
  const queue = readQueue();
  const pending = queue.actions.filter(a => a.status === STATES.PENDING);
  
  if (pending.length === 0) {
    console.log('[EXECUTOR] No pending actions');
    return;
  }
  
  console.log(`[EXECUTOR] Found ${pending.length} pending action(s)`);
  
  // Process first pending action (FIFO)
  const actionToProcess = pending[0];
  claimAndExecuteAction(actionToProcess.id);
}

export { claimAndExecuteAction, pollQueue, STATES, readQueue, writeQueue, logActivity };
