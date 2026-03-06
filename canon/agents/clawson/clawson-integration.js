/**
 * CLAWSON INTEGRATION — Queue Executor Polling Loop
 * 
 * Integrates the validated queue executor into Clawson's main loop.
 * Polls operator_actions.json every 10 seconds for pending actions.
 * Executes via Clawson executor (claim-lock, validate, execute, log).
 * 
 * Constraints (Phase 1):
 * - Whitelist: spawn_workstream, assign_agent ONLY
 * - Sandbox: LeadScore.ai ONLY
 * - No direct Paperclip SSOT writes
 * - Command bus sole mutation path
 * - Full activity logging
 */

import { claimAndExecuteAction, pollQueue, readQueue } from '../../system/clawson-queue-executor.js';
import fs from 'fs';
import path from 'path';

const WORKSPACE = '/Users/openclaw/.openclaw/workspace';
const QUEUE_FILE = path.join(WORKSPACE, 'data/mission-control/operator_actions.json');
const INTEGRATION_LOG = path.join(WORKSPACE, 'data/logs/clawson-integration.log');

// Polling configuration (Phase 1)
const POLL_INTERVAL_MS = 10000; // 10 seconds
const MAX_ACTIONS_PER_POLL = 5; // Process max 5 actions per poll cycle
const ENABLE_POLLING = true;

let pollingActive = false;
let pollCount = 0;
let lastPollTime = null;
let actionsProcessed = 0;
let actionsFailed = 0;

/**
 * Log integration events
 */
function logIntegration(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  try {
    fs.appendFileSync(INTEGRATION_LOG, logEntry);
    console.log(logEntry.trim());
  } catch (err) {
    console.error('[CLAWSON] Integration log error:', err.message);
  }
}

/**
 * POLLING CYCLE: Check for pending actions and execute
 */
function executePollCycle() {
  if (!ENABLE_POLLING) {
    return;
  }
  
  const pollTime = new Date().toISOString();
  lastPollTime = pollTime;
  pollCount++;
  
  logIntegration(`POLL CYCLE #${pollCount} @ ${pollTime}`, 'debug');
  
  try {
    // Read queue
    const queue = readQueue();
    const pending = queue.actions.filter(a => a.status === 'pending');
    
    if (pending.length === 0) {
      logIntegration(`Poll #${pollCount}: No pending actions`, 'debug');
      return;
    }
    
    logIntegration(`Poll #${pollCount}: Found ${pending.length} pending action(s)`, 'info');
    
    // Process up to MAX_ACTIONS_PER_POLL
    const toProcess = pending.slice(0, MAX_ACTIONS_PER_POLL);
    
    for (const action of toProcess) {
      logIntegration(`Processing action: ${action.id} (${action.action_type} on ${action.target_id})`, 'info');
      
      try {
        const result = claimAndExecuteAction(action.id);
        
        if (result.status === 'completed') {
          logIntegration(`✅ Action completed: ${action.id}`, 'info');
          actionsProcessed++;
        } else if (result.status === 'failed') {
          logIntegration(`⚠️ Action failed: ${action.id} (reason: ${result.reason || result.error})`, 'warn');
          actionsFailed++;
        } else {
          logIntegration(`⚠️ Action ${result.status}: ${action.id}`, 'warn');
        }
      } catch (err) {
        logIntegration(`❌ Execution error for ${action.id}: ${err.message}`, 'error');
        actionsFailed++;
      }
    }
    
    logIntegration(`Poll #${pollCount} complete (${toProcess.length} processed, ${actionsProcessed} total completed)`, 'info');
    
  } catch (err) {
    logIntegration(`Poll cycle error: ${err.message}`, 'error');
  }
}

/**
 * START POLLING: Begin 10-second polling loop
 */
function startPolling() {
  if (pollingActive) {
    logIntegration('Polling already active', 'warn');
    return;
  }
  
  pollingActive = true;
  logIntegration('CLAWSON POLLING LOOP STARTED (10s interval)', 'info');
  logIntegration(`Constraints: whitelist=[spawn_workstream,assign_agent], sandbox=[LeadScore.ai]`, 'info');
  
  // Execute first poll immediately
  executePollCycle();
  
  // Then set up recurring polls
  const pollInterval = setInterval(() => {
    executePollCycle();
  }, POLL_INTERVAL_MS);
  
  // Store interval ID for cleanup
  global.clawsonPollInterval = pollInterval;
  
  logIntegration(`Polling interval set: ${POLL_INTERVAL_MS}ms (${POLL_INTERVAL_MS / 1000}s)`, 'info');
  
  return pollInterval;
}

/**
 * STOP POLLING: Gracefully stop polling loop
 */
function stopPolling() {
  if (!pollingActive) {
    logIntegration('Polling not active', 'warn');
    return;
  }
  
  if (global.clawsonPollInterval) {
    clearInterval(global.clawsonPollInterval);
    global.clawsonPollInterval = null;
  }
  
  pollingActive = false;
  logIntegration('CLAWSON POLLING LOOP STOPPED', 'info');
  logIntegration(`Final stats: polls=${pollCount}, processed=${actionsProcessed}, failed=${actionsFailed}`, 'info');
}

/**
 * GET STATUS: Return polling status
 */
function getStatus() {
  return {
    pollingActive,
    pollCount,
    actionsProcessed,
    actionsFailed,
    lastPollTime,
    pollInterval: POLL_INTERVAL_MS,
    maxActionsPerPoll: MAX_ACTIONS_PER_POLL,
    constraints: {
      whitelist: ['spawn_workstream', 'assign_agent'],
      sandbox: ['LeadScore.ai'],
      ssotMutationPath: 'command_bus_only',
      paperclipDirectWrites: 'prohibited'
    }
  };
}

/**
 * HEALTH CHECK: Verify polling loop health
 */
function healthCheck() {
  try {
    const queue = readQueue();
    const pending = queue.actions.filter(a => a.status === 'pending');
    const completed = queue.actions.filter(a => a.status === 'completed');
    const failed = queue.actions.filter(a => a.status === 'failed');
    
    return {
      status: pollingActive ? 'healthy' : 'stopped',
      queueHealth: {
        total: queue.actions.length,
        pending,
        completed: completed.length,
        failed: failed.length
      },
      pollingHealth: {
        active: pollingActive,
        lastPoll: lastPollTime,
        pollCount,
        successRate: actionsProcessed > 0 ? (actionsProcessed / (actionsProcessed + actionsFailed) * 100).toFixed(2) + '%' : 'N/A'
      }
    };
  } catch (err) {
    return {
      status: 'error',
      error: err.message
    };
  }
}

// Export for integration
export { startPolling, stopPolling, getStatus, healthCheck, executePollCycle, POLL_INTERVAL_MS };

// If run directly (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n' + '='.repeat(80));
  console.log('CLAWSON POLLING LOOP — Direct Execution Test');
  console.log('='.repeat(80) + '\n');
  
  startPolling();
  
  // Keep process alive
  console.log('Polling loop started. Press Ctrl+C to stop.\n');
  
  // Status check every 30 seconds
  setInterval(() => {
    const status = getStatus();
    console.log(`[STATUS] Poll #${status.pollCount} | Processed: ${status.actionsProcessed} | Failed: ${status.actionsFailed}`);
  }, 30000);
}
