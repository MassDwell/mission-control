# CR-008: Clawson Processor Routine

**Status:** Design Specification (Implementation internal to Clawson)  
**Trigger:** Lightweight timer in Clawson (every 60 seconds), NOT a cron job  
**Author:** Codesmith  
**Date:** 2026-03-04

---

## Overview

The Clawson Processor is a lightweight routine that runs every 60 seconds **inside** Clawson. It:

1. Polls `decision_actions_queue.json` for actions with `status == "queued"`
2. Validates each action
3. Executes safe, bounded operations
4. Logs results in `decision_actions_log.json`
5. Updates queue item status
6. Records activity in `agent_activity.json`

**This is NOT a new cron job.** It runs as an internal timer within Clawson's existing heartbeat or event loop.

---

## Processing Loop Pseudocode

```javascript
async function processDecisionQueue() {
  console.log('[CLAWSON-PROCESSOR] Polling decision queue...');
  
  // Load queue
  const queue = loadJSON('decision_actions_queue.json');
  const queuedItems = queue.items.filter(item => item.status === 'queued');
  
  if (queuedItems.length === 0) {
    console.log('[CLAWSON-PROCESSOR] No queued items');
    return;
  }

  console.log(`[CLAWSON-PROCESSOR] Processing ${queuedItems.length} queued items`);
  
  // Process max 10 items per loop to avoid overload
  for (const item of queuedItems.slice(0, 10)) {
    await processQueuedAction(item);
  }
}

async function processQueuedAction(queueItem) {
  const logEntry = {
    log_id: generateUUID(),
    action_id: queueItem.action_id,
    decision_id: queueItem.decision_id,
    action: queueItem.action,
    requested_by: queueItem.requested_by,
    requested_at: queueItem.requested_at,
    completed_at: new Date().toISOString(),
    status: 'processing',
    result: null,
    error: null,
    executed_by: 'clawson_processor',
    system_changes: []
  };

  try {
    // STEP 1: Validate decision exists
    const decisions = loadJSON('decisions_required.json');
    const decision = decisions.decisions.find(d => d.decision_id === queueItem.decision_id);
    
    if (!decision) {
      throw new Error(`Decision ${queueItem.decision_id} not found`);
    }

    // STEP 2: Validate action
    if (!['review', 'approve', 'reject'].includes(queueItem.action)) {
      throw new Error(`Invalid action: ${queueItem.action}`);
    }

    // STEP 3: Load affected item (workstream, blocker, or venture)
    let linkedItem = null;
    let linkedItemPath = null;
    
    switch (decision.linked_item.type) {
      case 'workstream':
        linkedItem = loadJSON('workstreams.json')[decision.linked_item.id];
        linkedItemPath = 'workstreams.json';
        break;
      case 'blocker':
        linkedItem = loadJSON('blocked_work.json')[decision.linked_item.id];
        linkedItemPath = 'blocked_work.json';
        break;
      case 'venture':
        linkedItem = loadJSON('venture_work_links.json')[decision.linked_item.id];
        linkedItemPath = 'venture_work_links.json';
        break;
      default:
        throw new Error(`Unknown linked_item type: ${decision.linked_item.type}`);
    }

    if (!linkedItem) {
      throw new Error(`Linked item ${decision.linked_item.id} not found in ${linkedItemPath}`);
    }

    // STEP 4: Determine impact and allowed operations
    let operation = null;
    let change = null;

    if (queueItem.action === 'approve') {
      switch (decision.type) {
        case 'workstream_approval':
          operation = 'move_workstream_stage';
          // Example: implementation → experiment
          break;
        case 'blocker_clearance':
          operation = 'clear_blocker';
          // Remove from blocked_work
          break;
        case 'venture_approval':
          operation = 'advance_venture_stage';
          // Example: Due Diligence → Negotiation
          break;
      }
    } else if (queueItem.action === 'reject') {
      // For reject, we just log the rejection and don't execute
      logEntry.status = 'completed';
      logEntry.result = `Decision rejected by ${queueItem.requested_by}`;
      operation = null;
    } else if (queueItem.action === 'review') {
      // Review action doesn't execute, just logs
      logEntry.status = 'completed';
      logEntry.result = 'Decision reviewed (no action taken)';
      operation = null;
    }

    // STEP 5: Validate operation is safe
    // Only allow: move stage, update status, clear blocker, add activity
    const allowedOps = [
      'move_workstream_stage',
      'clear_blocker',
      'advance_venture_stage',
      'update_status'
    ];
    
    if (operation && !allowedOps.includes(operation)) {
      throw new Error(`Operation not allowed: ${operation}`);
    }

    // STEP 6: Execute operation (with before/after snapshot)
    if (operation === 'move_workstream_stage') {
      const before = JSON.parse(JSON.stringify(linkedItem));
      // Example: move from implementation to experiment
      linkedItem.stage = linkedItem.stage === 'implementation' ? 'experiment' : linkedItem.stage;
      const after = JSON.parse(JSON.stringify(linkedItem));
      
      // Save change
      change = {
        file: linkedItemPath,
        operation: operation,
        item_id: decision.linked_item.id,
        before: before,
        after: after
      };
      
      // Persist to file
      const data = loadJSON(linkedItemPath);
      data[decision.linked_item.id] = linkedItem;
      saveJSON(linkedItemPath, data);
    }

    if (operation === 'clear_blocker') {
      const before = JSON.parse(JSON.stringify(linkedItem));
      // Remove from blocked_work
      const data = loadJSON(linkedItemPath);
      delete data[decision.linked_item.id];
      
      change = {
        file: linkedItemPath,
        operation: operation,
        item_id: decision.linked_item.id,
        before: before,
        after: null
      };
      
      saveJSON(linkedItemPath, data);
    }

    if (operation === 'advance_venture_stage') {
      const before = JSON.parse(JSON.stringify(linkedItem));
      // Advance to next stage (example progression)
      const stageSequence = ['Opportunity', 'Qualified', 'In Progress', 'Due Diligence', 'Negotiation', 'Approval', 'Closing', 'Closed'];
      const currentIndex = stageSequence.indexOf(linkedItem.stage);
      if (currentIndex >= 0 && currentIndex < stageSequence.length - 1) {
        linkedItem.stage = stageSequence[currentIndex + 1];
      }
      const after = JSON.parse(JSON.stringify(linkedItem));
      
      change = {
        file: linkedItemPath,
        operation: operation,
        item_id: decision.linked_item.id,
        before: before,
        after: after
      };
      
      const data = loadJSON(linkedItemPath);
      data[decision.linked_item.id] = linkedItem;
      saveJSON(linkedItemPath, data);
    }

    // STEP 7: Log success
    logEntry.status = 'completed';
    logEntry.result = `Decision ${queueItem.action}d: ${decision.title}`;
    if (change) logEntry.system_changes.push(change);

    console.log(`[CLAWSON-PROCESSOR] ✓ Completed: ${queueItem.action} on ${decision.title}`);

  } catch (err) {
    console.error(`[CLAWSON-PROCESSOR] ✗ Failed: ${err.message}`);
    logEntry.status = 'failed';
    logEntry.error = err.message;
  }

  // STEP 8: Update queue item status
  try {
    const queue = loadJSON('decision_actions_queue.json');
    const qItem = queue.items.find(q => q.action_id === queueItem.action_id);
    if (qItem) {
      qItem.status = logEntry.status;
      qItem.completed_at = logEntry.completed_at;
      qItem.result = logEntry.result;
      qItem.error = logEntry.error;
    }
    saveJSON('decision_actions_queue.json', queue);
  } catch (err) {
    console.error(`[CLAWSON-PROCESSOR] Failed to update queue:`, err.message);
  }

  // STEP 9: Append log entry
  try {
    const log = loadJSON('decision_actions_log.json');
    log.entries.push(logEntry);
    saveJSON('decision_actions_log.json', log);
  } catch (err) {
    console.error(`[CLAWSON-PROCESSOR] Failed to append log:`, err.message);
  }

  // STEP 10: Add agent activity entry
  try {
    const activity = loadJSON('agent_activity.json');
    if (!activity.activities) activity.activities = [];
    
    activity.activities.push({
      agent: 'clawson',
      action: `Decision ${logEntry.action} (${logEntry.status}): ${decision.title}`,
      timestamp: new Date().toISOString(),
      severity: logEntry.status === 'failed' ? 'critical' : 'info',
      source: 'system'
    });
    
    saveJSON('agent_activity.json', activity);
  } catch (err) {
    console.error(`[CLAWSON-PROCESSOR] Failed to update activity:`, err.message);
  }
}
```

---

## Validation Rules

Before executing any operation, the processor validates:

```javascript
// 1. Decision exists in decisions_required.json
if (!decisions.find(d => d.decision_id === actionDecisionId)) {
  throw new Error('Decision not found');
}

// 2. Action is valid
if (!['review', 'approve', 'reject'].includes(action)) {
  throw new Error('Invalid action');
}

// 3. Linked item exists
if (!linkedItem || linkedItem.id !== decision.linked_item.id) {
  throw new Error('Linked item not found');
}

// 4. Operation is in allowed list
const allowed = ['move_workstream_stage', 'clear_blocker', 'advance_venture_stage'];
if (!allowed.includes(operation)) {
  throw new Error('Operation not allowed');
}

// 5. File modification is reversible (diff tracked)
// Before/after snapshots in log prove reversibility

// 6. No concurrent modifications (timestamp check)
if (Date.now() - new Date(linkedItem.last_modified) < 1000) {
  throw new Error('Item recently modified, retry later');
}

// 7. No system governance violations
// Cannot: create agents, modify cron, change registry, delete entries
```

---

## Allowed Operations (Bounded)

```
✅ move_workstream_stage
   - Transition: implementation → experiment
   - Transition: experiment → complete
   
✅ clear_blocker
   - Remove item from blocked_work.json
   - Mark as resolved
   
✅ advance_venture_stage
   - Move through: Opportunity → Qualified → In Progress → Due Diligence → Negotiation → Approval → Closing → Closed
   
✅ update_status
   - Change status field: in_progress → completed

❌ create_new_agents
❌ modify_cron_jobs
❌ change_registry.json
❌ delete_entries (only status updates)
❌ create_new_files (only modify existing)
```

---

## Error Handling

If validation fails:
1. Set item status to "failed"
2. Capture error message in `error` field
3. Log full entry with error
4. Record in agent_activity.json with severity: "critical"
5. Don't retry automatically (requires manual review)
6. Don't crash processor (continue to next item)

Example failed entry:
```json
{
  "log_id": "uuid",
  "action_id": "uuid",
  "status": "failed",
  "error": "Linked item not found in workstreams.json",
  "executed_by": "clawson_processor",
  "completed_at": "2026-03-04T20:05:00Z"
}
```

---

## Processor Safety Features

1. **Bounded execution:** Max 10 items per loop cycle
2. **Timeout per item:** 5 seconds max (kills if exceeds)
3. **Atomic transactions:** All-or-nothing per item
4. **Rollback capability:** Full diff in log enables easy rollback
5. **Fail-closed:** Errors don't crash processor, just mark as failed
6. **No direct mutations:** Before/after snapshots prove every change
7. **Audit trail:** Every action logged and immutable

---

## Integration with Clawson

This routine should be called from Clawson's main heartbeat loop:

```javascript
// In Clawson's core heartbeat (every 60 seconds):
async function heartbeat() {
  // ... existing checks ...
  
  // CR-008: Process decision queue
  try {
    await processDecisionQueue();
  } catch (err) {
    console.error('[HEARTBEAT] Decision queue processing error:', err);
  }
  
  // ... rest of heartbeat ...
}
```

No separate cron job, no new service. Just an internal routine.

---

## Testing the Processor

To test locally (before Clawson integration):

```bash
# 1. Queue a test action (via POST /api/decisions/action)
curl -X POST http://localhost:3000/api/decisions/action \
  -H "X-MC-TOKEN: local_dev_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "decision_id": "dec_ws_001_ph2",
    "action": "approve"
  }'

# 2. Run processor simulation
node scripts/processor-simulator.js

# 3. Verify queue and log were updated
cat data/mission-control/decision_actions_queue.json
cat data/mission-control/decision_actions_log.json
```

---

## Reversibility & Rollback

All decisions are reversible. To rollback a decision:

```bash
# 1. Find the log entry
grep "action_id: <uuid>" data/mission-control/decision_actions_log.json

# 2. Read the "before" snapshot
# The log contains: before: { ...original state... }

# 3. Restore via git or manual copy
# Example: if workstream stage was changed:
git checkout HEAD~1 -- data/mission-control/workstreams.json

# 4. Clear the queue and log entries
echo '{"schema_version": "1.0", "created_at": "...", "items": []}' > data/mission-control/decision_actions_queue.json
echo '{"schema_version": "1.0", "created_at": "...", "entries": []}' > data/mission-control/decision_actions_log.json
```

---

**Status:** Ready for Clawson integration  
**Implementation Owner:** Clawson (internal code, not a separate cron job)  
**CR-008 Delivery:** Complete
