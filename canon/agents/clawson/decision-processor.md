# Clawson Decision Processor

**Component:** Internal decision action processor (runs inside Clawson session)  
**Purpose:** Poll decision_actions_queue.json, validate & execute safe actions, log results  
**Activation:** Immediate (no cron job, internal timer)  
**Polling Interval:** Every 60 seconds  

---

## Processor Loop

```
Every 60 seconds:
  1. Load decision_actions_queue.json
  2. Load decisions_required.json (for validation)
  3. Load workstreams.json, blocked_work.json, venture_work_links.json (for execution)
  
  For each item in queue where status == "queued":
    a. Validate decision_id exists in decisions_required.json
    b. Validate action is one of: review, approve, reject
    c. Load the linked workstream/blocker/venture
    d. Validate linked item exists and is modifiable
    
    if VALID:
      e. Determine action outcome
      f. Execute change (atomic operation)
      g. Create before/after snapshots
      h. Write log entry to decision_actions_log.json
      i. Update queue item status: "queued" → "processing" → "completed"
      j. Add agent_activity.json entry
      k. If successful: set status = "completed"
      l. If failed: set status = "failed", capture error
    
    if INVALID:
      m. Set status = "failed", capture validation error
      n. Log error to decision_actions_log.json
```

---

## Validation Rules

Before executing ANY action:

```
✅ MUST PASS:
  1. decision_id exists in decisions_required.json
  2. action is one of: review, approve, reject
  3. linked_item type is valid (workstream|blocker|venture)
  4. linked_item id exists and is accessible
  5. No concurrent modifications (check timestamp)
  6. Action doesn't violate governance (no cron changes, no registry edits)

❌ IF ANY CHECK FAILS:
  → Set status = "failed"
  → Capture error message
  → Do NOT execute change
  → Log error
```

---

## Allowed Operations (ONLY)

```
✅ WORKSTREAM OPERATIONS:
  → Update status: "in_progress" → "completed"
  → Move stage: "implementation" → "experiment"
  → Update progress_percent (0-100)
  → Add notes

✅ BLOCKER OPERATIONS:
  → Clear blocker: remove from blocked_work.json
  → Update status: "blocked" → "acknowledged"

✅ VENTURE OPERATIONS:
  → Move stage in venture_work_links.json
  → Update agent assignment
  → Update status

❌ FORBIDDEN OPERATIONS:
  → Create new agents
  → Modify cron jobs
  → Edit registry.json
  → Delete entries (status updates only)
  → Change file paths
  → Modify credentials
```

---

## Action Execution: By Type

### Review Action
**What it does:** Mark decision as reviewed, no system change

```
Input: decision_id, linked_item
Output: Log entry "Reviewed decision X"
System change: NONE (informational only)
Status: completed
```

### Approve Action
**What it does:** Move workstream stage forward OR mark venture/blocker as approved

```
INPUT: decision_id (references ws_001, venture_001, or blocker_001)

IF workstream:
  FIND: workstream_id in workstreams.json
  UPDATE: current_stage → next_stage
  UPDATE: status → "in_progress" or "completed"
  SNAPSHOT: before + after states

IF venture:
  FIND: venture_id in venture_work_links.json
  UPDATE: stage forward
  SNAPSHOT: before + after

IF blocker:
  NO CHANGE (blocker is acknowledged, not cleared)
  Log: "Blocker reviewed and approved for resolution"

OUTPUT: Log entry with snapshots
Status: completed
```

### Reject Action
**What it does:** Mark decision as rejected, no forward progress

```
INPUT: decision_id

IF workstream:
  STATUS: "rejected"
  NOTE: "Rejected at [stage]"
  SNAPSHOT: Decision snapshot + reason

IF venture:
  STATUS: "no-go"
  REASON: From decision context

IF blocker:
  STATUS: "acknowledged"
  DECISION: "Blocker remains active (user rejected resolution)"

OUTPUT: Log entry
Status: completed
```

---

## Logging: decision_actions_log.json

**Every action creates ONE immutable log entry:**

```json
{
  "log_id": "uuid",
  "action_id": "uuid (from queue)",
  "decision_id": "string",
  "action": "review|approve|reject",
  "requested_by": "steve",
  "requested_at": "ISO-8601",
  "completed_at": "ISO-8601 (now)",
  "status": "completed|failed",
  "result": "string (what changed)",
  "error": null,
  "executed_by": "clawson_processor",
  "system_changes": [
    {
      "file": "data/mission-control/workstreams.json",
      "operation": "update_stage | update_status | update_percent",
      "before": {snapshot},
      "after": {snapshot}
    }
  ]
}
```

---

## Agent Activity: agent_activity.json

**Every completed action gets ONE activity entry:**

```json
{
  "agent": "clawson",
  "action": "Executed decision action: APPROVED ws_001 Phase 2 (moved stage: implementation → experiment)",
  "level": "info",
  "timestamp": "ISO-8601"
}
```

---

## Error Handling

```
If action fails:
  1. Set status = "failed"
  2. Capture error message
  3. Write log entry with error
  4. Add activity entry: "Decision action FAILED: [error]"
  5. Do NOT retry automatically
  6. User can manually retry from UI
  7. Keep item in queue for audit trail
```

---

## Rollback Capability

**Every log entry captures before/after snapshots.**

To rollback an action:
```bash
# 1. Find log entry
grep -i "ws_001" data/mission-control/decision_actions_log.json

# 2. Get before snapshot from log
# 3. Manually restore workstreams.json from before snapshot
# 4. Delete corresponding queue item
# 5. Add rollback note to activity log

Result: System returns to pre-decision state
```

---

## Queue Update Rules

```
When processing a queue item:

1. Set status = "processing" (optional, for visibility)
2. Execute action
3. If success:
   → Set status = "completed"
   → Set completed_at = now
   → Set result = "outcome description"
   → Item stays in queue (audit trail)
4. If failure:
   → Set status = "failed"
   → Set error = "error message"
   → Item stays in queue (for manual review/retry)
```

---

## Safety Guarantees

```
✅ All operations are atomic (all-or-nothing)
✅ All changes are logged with snapshots
✅ All changes are reversible (rollback via snapshots)
✅ No system state changes without logging
✅ No governance violations (only allowed ops)
✅ No concurrent modification conflicts
✅ No credential changes
✅ No cron job changes
✅ Timeout per action: 5 seconds max
✅ Max 10 items per loop
✅ Fail-safe: errors logged, don't cascade
```

---

## Activation

Processor runs immediately on Clawson startup:
1. Check for queued items
2. Start polling every 60 seconds
3. Process any pending actions
4. Continue indefinitely (until shutdown)

**No cron job needed** — Runs as internal Clawson background task.
