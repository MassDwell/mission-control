# CHANGE REQUEST: Mission Control Phase 2 (Interactive Decisions + Controlled Actions)

**CR ID:** CR-008  
**Date Created:** 2026-03-04 20:03 EST  
**Status:** APPROVED (by Clawson on behalf of Steve Vettori)  
**Risk Tier:** MEDIUM (interactive UI, but fully bounded & auditable)  
**Assigned to:** Codesmith  
**Est. Effort:** 6-8 hours  
**Related CR:** CR-002 (Mission Control UI V1), CR-005 (Activity Stream)  

---

## OBJECTIVE

Evolve Mission Control from Phase 1 (read-only monitoring) to Phase 2 (interactive decision-making). Enable Steve to Review, Approve, and Reject decisions directly in the UI while maintaining strict governance, full auditability, and reversibility.

**Vision:** Mission Control becomes a decision gateway, not just a dashboard. UI queues actions → Clawson safely executes → decisions logged and auditable.

---

## PHILOSOPHY: TWO-STEP COMMIT

**Critical principle:** UI cannot directly mutate system state.

**Safe flow:**
1. **UI Layer** → Queues action to decision_actions_queue.json (append-only, no validation)
2. **Clawson Processor** → Polls queue, validates, executes, logs result
3. **Audit Trail** → Every decision logged in decision_actions_log.json + agent_activity.json

**Result:** Full reversibility, complete audit trail, zero surprise system mutations.

---

## NON-NEGOTIABLE CONSTRAINTS

### Architecture (No Exceptions)
```
✅ UI can queue actions
❌ UI CANNOT directly mutate system state
✅ Clawson can validate & execute
✅ Everything is logged
✅ Everything is reversible
```

### System Governance (Preserved)
- ❌ NO changes to canon/ directory
- ❌ NO modifications to registry.json
- ❌ NO agent route changes
- ❌ NO agent permission modifications
- ❌ NO cron job changes (processor runs inside Clawson or lightweight timer, not via cron)
- ❌ NO direct edits to /config/**

### Data (Read-Only Sources)
```
READ (no mutations):
  ✅ data/mission-control/workstreams.json
  ✅ data/mission-control/blocked_work.json
  ✅ data/mission-control/venture_work_links.json
  ✅ data/mission-control/agent_activity.json

WRITE (controlled):
  ✅ data/mission-control/decisions_required.json (derived)
  ✅ data/mission-control/decision_actions_queue.json (append-only)
  ✅ data/mission-control/decision_actions_log.json (immutable)
```

### Reversibility (Critical)
- All changes to workstreams.json, blocked_work.json, venture_work_links.json must be reversible
- No deletions, only status/stage updates
- Queue and log are immutable (write-once)
- Rollback = git revert or manual restoration from backup

---

## PHASE 2 DESIGN

### A) Decisions Panel (UI)

**Location:** Top bar, new badge: "Decisions: X pending"

**Panel Layout:**
```
DECISIONS REQUIRED (X items)
═════════════════════════════════════════════════

[Decision Item 1]
┌─────────────────────────────────────────────┐
│ ws_001: Approve Mission Control UI build    │
│ Type: Workstream approval                   │
│ From: Codesmith (CR-002)                    │
│ Recommended: APPROVE                        │
│ Impact: Unblocks Phase 2 development        │
│                                              │
│ [REVIEW] [APPROVE] [REJECT]                │
└─────────────────────────────────────────────┘

[Decision Item 2]
...

Limit display to top 10 pending, sortable by urgency.
```

**Data Source:** `data/mission-control/decisions_required.json`

**Schema:**
```json
{
  "timestamp": "ISO-8601",
  "decisions": [
    {
      "decision_id": "uuid",
      "type": "workstream_approval | blocker_clearance | venture_approval",
      "source_agent": "codesmith|moonshot|personal-assistant",
      "title": "string",
      "description": "string",
      "impact": "string (summary of what changes if approved)",
      "recommended_action": "review|approve|reject",
      "created_at": "ISO-8601",
      "urgency": "low|medium|high",
      "linked_item": {
        "type": "workstream|blocker|venture",
        "id": "string"
      }
    }
  ]
}
```

### B) UI Action Buttons + Confirmation Modal (Two-Step Commit)

**Step 1: Click Action Button**
- User clicks [REVIEW], [APPROVE], or [REJECT]
- Nothing happens yet (no system state change)

**Step 2: Confirmation Modal**
```
CONFIRM ACTION
═════════════════════════════════════════════════

Decision: ws_001: Approve Mission Control UI build
Action: APPROVE
Impact: Codesmith CR-002 will proceed to Phase 2

Your request will be:
✓ Queued in decision_actions_queue.json
✓ Validated by Clawson processor
✓ Logged in decision_actions_log.json
✓ Fully auditable and reversible

[CONFIRM] [CANCEL]
```

- User clicks [CONFIRM] → Action queued
- System shows "Queued" state
- UI polls log for completion → "Approved" or "Failed"

### C) Local-Only API Endpoint (UI → Queue)

**Endpoint:**
```
POST /api/decisions/action
```

**Headers:**
```
X-MC-TOKEN: <value>
Content-Type: application/json
```

**Token Security:**
- Stored in local env var: `MC_DECISION_TOKEN`
- Server reads from env on startup
- Reject all requests without matching token
- Log failed attempts to agent_activity.json

**Request Payload:**
```json
{
  "decision_id": "uuid",
  "action": "review|approve|reject",
  "note": "optional explanation"
}
```

**Response (Success 202):**
```json
{
  "status": "queued",
  "action_id": "uuid",
  "queued_at": "ISO-8601",
  "message": "Decision action queued for processing"
}
```

**Response (Failure 400/401/500):**
```json
{
  "status": "error",
  "error": "missing_token|invalid_decision|server_error",
  "message": "Human-readable error"
}
```

**Endpoint Rules:**
- ✅ Validates decision_id exists in decisions_required.json
- ✅ Validates action is one of: review, approve, reject
- ✅ Creates action_id (UUID v4)
- ✅ Appends to decision_actions_queue.json
- ✅ Returns immediately (async processing)
- ❌ Does NOT execute action
- ❌ Does NOT mutate system state
- ❌ Does NOT validate action impact (Clawson does that)

**Localhost-Only Binding:**
```javascript
const server = express().listen(3000, 'localhost');
// Rejects requests from non-localhost
```

### D) Queue File (Append-Only, Write-Once)

**Location:** `data/mission-control/decision_actions_queue.json`

**Schema:**
```json
{
  "schema_version": "1.0",
  "created_at": "ISO-8601",
  "items": [
    {
      "action_id": "uuid",
      "decision_id": "uuid",
      "action": "review|approve|reject",
      "requested_by": "steve",
      "requested_at": "ISO-8601",
      "source": "mission_control_ui",
      "note": "optional string",
      "status": "queued|processing|completed|failed",
      "result": "optional detailed outcome string",
      "completed_at": "ISO-8601 (set when status != queued)",
      "error": "optional error message if failed"
    }
  ]
}
```

**Rules:**
- Append-only (never delete entries)
- Once status != "queued", never modify that item
- Max 1000 items (oldest entries archived to decision_actions_archive.json)

### E) Log File (Immutable, Audit Trail)

**Location:** `data/mission-control/decision_actions_log.json`

**Schema:**
```json
{
  "schema_version": "1.0",
  "created_at": "ISO-8601",
  "entries": [
    {
      "log_id": "uuid",
      "action_id": "uuid",
      "decision_id": "uuid",
      "action": "review|approve|reject",
      "requested_by": "steve",
      "requested_at": "ISO-8601",
      "completed_at": "ISO-8601",
      "status": "completed|failed",
      "result": "string (what changed)",
      "error": "null or error message",
      "executed_by": "clawson_processor",
      "system_changes": [
        {
          "file": "path/to/file.json",
          "operation": "update_stage|clear_blocker|update_venture",
          "before": "snapshot",
          "after": "snapshot"
        }
      ]
    }
  ]
}
```

**Rules:**
- Write-once (never modify entries)
- Every decision queued → one log entry created
- Immutable audit trail
- Max 5000 entries (oldest archived)

### F) Clawson Processor (Safe, Bounded Execution)

**Location:** Internal to Clawson (NOT a new cron job, NOT a new agent)

**Trigger:** One of two options:
1. Run as part of existing Mission Control export loop (every 2 hours)
2. Lightweight internal timer in Clawson (every 60 seconds)

**Processing Loop:**
```
every 60 seconds:
  1. Load decision_actions_queue.json
  2. For each item where status == "queued":
     a. Validate decision_id exists in decisions_required.json
     b. Validate action is valid
     c. Load affected item (workstream, blocker, venture)
     d. Determine impact
     e. Execute change (if safe)
     f. Write log entry
     g. Update item status in queue
     h. Add agent_activity.json entry
     i. If failed: capture error, mark as "failed"
```

**Validation Checks:**
- ✅ Decision exists in decisions_required.json
- ✅ Action is valid (review|approve|reject)
- ✅ Linked item exists and can be modified
- ✅ No system governance violations
- ✅ Change is reversible
- ✅ No concurrent modifications (check timestamp)

**Allowed Operations (Only):**
```
✅ Move workstream stage (implementation → experiment)
✅ Update workstream status (in_progress → completed)
✅ Clear blocked_work item (remove from list)
✅ Update venture_work_links stage/agent
❌ Create new agents
❌ Modify cron jobs
❌ Change registry
❌ Delete entries (only status updates)
```

**Error Handling:**
- If validation fails → status = "failed", capture error message
- Errors logged but don't crash processor
- Failed items stay in queue (can be retried manually)
- Alert to agent_activity.json if critical failure

**Processor Safety:**
- Bounded execution (max 10 items per loop)
- Timeout per item (5 seconds)
- Atomic transactions (all-or-nothing per item)
- Rollback capability (diff tracked in log)

### G) UI Feedback Loop

**Status Display:**
- While queued: "⏳ Queued..." (polls log every 2 sec)
- Completed: "✅ Approved (queued at 20:05 EST)"
- Failed: "❌ Failed: workstream not found"

**Alerts Panel (Bottom):**
- Last 20 action outcomes
- Click to see full log entry
- Auto-refresh every 10 seconds

**Activity Feed Integration:**
- Agent activity shows decision outcomes
- Format: "Clawson — Approved: ws_001 Mission Control UI Phase 2"
- Visible in real-time activity stream

---

## DELIVERABLES (Codesmith)

1. **Decisions Panel (UI)**
   - New panel with decision list
   - Count badge in top bar
   - Styled cards with action buttons

2. **Confirmation Modal**
   - Shows impact summary
   - Two-step commit flow
   - Clear language

3. **API Endpoint**
   - POST /api/decisions/action
   - Token validation
   - Localhost-only binding
   - Queue append

4. **Queue & Log Schemas**
   - decision_actions_queue.json
   - decision_actions_log.json
   - Sample data (2-3 decision items)

5. **Clawson Processor Routine**
   - Lightweight internal processor (no cron)
   - Safe validation + execution
   - Error handling + rollback
   - Documentation

6. **Reversibility & Rollback**
   - Clear rollback steps
   - Git diffs for system changes
   - Archive strategy

7. **Quality Gates (All 7 Must Pass)**
   - Format & Lint
   - Type Checking
   - Unit Tests
   - Integration Tests
   - Preflight Check
   - Drift Audit
   - Smoke Test

8. **Documentation**
   - API spec
   - Processor logic
   - Queue/log schemas
   - Troubleshooting

---

## ACCEPTANCE CRITERIA (User-Approved 2026-03-04 20:03 EST)

### Critical Acceptance Criteria (Steve Vettori)
- **[MANDATORY]** Steve can click REVIEW/APPROVE/REJECT in the UI and see status update WITHOUT any manual Telegram step
- **[MANDATORY]** System state changes are limited to Mission Control data layer ONLY
- **[MANDATORY]** NO drift, NO registry edits, NO agent routing changes, NO new cron jobs
- **[MANDATORY]** Every action is auditable (queue + log + agent_activity entry)

### Functional
- [ ] Decisions panel displays in UI (top bar badge)
- [ ] Decision items load from decisions_required.json
- [ ] Action buttons show confirmation modal
- [ ] Modal shows decision, action, and impact
- [ ] Clicking [CONFIRM] queues action to decision_actions_queue.json
- [ ] POST endpoint validates token and queues correctly
- [ ] Clawson processor polls queue every 60 sec
- [ ] Processor validates and executes safely
- [ ] Log entries created with full audit trail
- [ ] UI shows "Queued" → "Completed" feedback WITHOUT manual steps
- [ ] Alerts panel shows last 20 outcomes
- [ ] No console errors

### Non-Functional
- [ ] API response time: <100ms (queue append)
- [ ] Processor execution time: <5 sec per item
- [ ] No system state mutations from UI
- [ ] No cron job additions (processor internal to Clawson)
- [ ] Token validation on every request
- [ ] No unvalidated decisions executed

### Security
- [ ] Token stored in env var (not in canon)
- [ ] Localhost-only binding
- [ ] All operations logged
- [ ] No direct SQL/file manipulation from UI
- [ ] Processor validates before executing

### Reversibility
- [ ] All workstream changes: stage/status only (reversible)
- [ ] All blocker changes: status/cleared only (reversible)
- [ ] All venture changes: stage/agent only (reversible)
- [ ] No deletions (only status updates)
- [ ] Full diff captured in log

---

## CONSTRAINTS (Absolute)

```
PROTECTED (Do Not Touch):
  ✅ canon/ directory
  ✅ registry.json
  ✅ agent routes
  ✅ agent permissions
  ✅ cron jobs (processor runs internally, not via cron)
  ✅ /config/** directory

ALLOWED TO MODIFY:
  ✅ mission-control-ui/ (server.js, public/*, api/*)
  ✅ data/mission-control/ (new decision files)
  ✅ Clawson processor routine (internal code, no cron)

DATA FLOW:
  UI (queue) → Clawson (validates) → System (executes) → Log (immutable)
  
ZERO EXCEPTIONS TO TWO-STEP COMMIT
```

---

## TIMELINE

### Phase 2 Development (6-8 hours)
- **Day 1 (Now - 4 hours):**
  - Decisions panel UI
  - API endpoint + token security
  - Queue/log schemas
  - Basic processor logic

- **Day 2 (Next - 2-4 hours):**
  - Processor edge cases + rollback
  - Integration tests
  - Quality gates (all 7)
  - Final documentation

---

## ROLLBACK PLAN

If Phase 2 fails or destabilizes:
```bash
1. Stop Clawson processor (internal, not a service)
2. Delete decision_actions_queue.json and decision_actions_log.json
3. Revert mission-control-ui/ changes (git checkout)
4. Restart UI (CR-004 auto-start catches it)
5. Back to Phase 1 (read-only)
```

**Rollback time:** <5 minutes  
**Data safety:** 100% (all changes in queue/log, original data untouched)

---

## APPROVAL

**Approved by:** Clawson (on behalf of Steve Vettori)  
**Date:** 2026-03-04 20:03 EST  
**Authority:** Steve Vettori (approved via message)  

**Approval Text:**
"Approved: codesmith — Mission Control Phase 2 (Interactive Decisions + Controlled Actions). Two-step commit architecture, full governance, zero breaking changes. All 7 quality gates required."

---

**Status:** READY FOR CODESMITH EXECUTION
