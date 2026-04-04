# Execution Architecture Design — Command Bus to SSOT

**Date:** Friday, March 6, 2026 @ 12:26 PM EST  
**Context:** Phase 2.5 identified missing executor (queue reader/processor)  
**Scope:** Architecture clarification ONLY (no implementation yet)  
**Decision Required:** Which model to proceed with

---

## PROBLEM STATEMENT

**Current State (Phase 2.5 Result):**
- ✅ Paperclip → Adapter → Command Bus queueing works perfectly
- ❌ Command Bus → OpenClaw execution is NOT wired
- ❌ No executor reads operator_actions.json
- ❌ No process converts "pending" → "executed"
- ❌ No SSOT mutations happen (blocked at execution layer)

**Missing Component:**
A service/process that:
1. Reads operator_actions.json continuously
2. Finds pending actions
3. Executes them safely (spawn_workstream, assign_agent, advance_stage, pause_venture)
4. Updates SSOT files through governed path
5. Logs all executions to agent_activity.json
6. Handles failures without breaking the queue

**Question:** What should this executor be?

---

## THREE CANDIDATE MODELS

### MODEL A: CLAWSON AS EXECUTOR

**Architecture:**
```
operator_actions.json
    ↓
Clawson polling loop (every 10 seconds)
    ↓
Find pending actions
    ↓
Validate + Execute
    ↓
Mutate SSOT (venture_pipeline.json, workstreams.json, etc.)
    ↓
Log to agent_activity.json
    ↓
Update operator_actions.json status
```

**Implementation:**
- Add polling task to Clawson's main loop
- Clawson reads queue every ~10 seconds
- For each pending action: validate → execute → mutate SSOT → log
- No new process needed
- Clawson remains sole SSOT authority

**PROS:**
- ✅ Single source of authority (Clawson already owns SSOT)
- ✅ No new service to deploy/monitor
- ✅ Natural fit with Clawson's COO role
- ✅ Simpler mental model (one orchestrator)
- ✅ Easier to audit (one governance point)
- ✅ Built-in SSOT discipline (Clawson knows all constraints)
- ✅ No inter-process coordination needed
- ✅ Minimal implementation (~50 lines of code in Clawson's polling loop)

**CONS:**
- ⚠️ Adds polling task to Clawson's responsibilities
- ⚠️ If Clawson dies, queue processing stops (until restart)
- ⚠️ Harder to scale if queue grows significantly (but current volume is low)
- ⚠️ Mixes coordination + execution in one agent (but both are Clawson's job anyway)
- ⚠️ Polling adds small CPU overhead (10s interval is cheap)

**OPERATIONAL RISK:** LOW
- Single point of failure: Clawson restart recovers it
- SSOT discipline: Clawson already enforces it
- Governance: Centralized, auditable
- Failure recovery: Straightforward (restart Clawson)

**SSOT DISCIPLINE FIT:** ⭐⭐⭐⭐⭐
- Clawson already owns all SSOT files
- Single mutation path (through Clawson)
- Built-in governance

**PAPERCLIP ORCHESTRATION FIT:** ⭐⭐⭐⭐⭐
- Clawson doesn't need to know about Paperclip
- Clawson just reads queue, executes commands
- Source tracking (source: "paperclip") provides auditability
- Treats all sources equally (Telegram, Paperclip, manual, etc.)

**RECOMMENDATION:** ⭐⭐⭐ STRONGLY RECOMMENDED

---

### MODEL B: DEDICATED COMMAND-BUS WORKER

**Architecture:**
```
operator_actions.json
    ↓
Standalone command-bus-worker process
    ↓
Find pending actions
    ↓
Call Clawson API / RPC to execute
    ↓
Clawson mutates SSOT
    ↓
Worker logs execution
```

**Implementation:**
- New Node.js service (command-bus-worker.js)
- Polls operator_actions.json
- Validates actions
- Calls Clawson via API/RPC for execution
- Clawson performs SSOT mutations
- Worker updates queue status

**PROS:**
- ✅ Clear separation of concerns
- ✅ Worker can fail independently (fault isolation)
- ✅ Can scale worker independently from Clawson
- ✅ Worker has single responsibility (queue processing)
- ✅ Easier to test worker logic separately
- ✅ Can use different runtime/language if needed

**CONS:**
- ⚠️ New service to deploy + monitor
- ⚠️ Two processes instead of one (more complexity)
- ⚠️ Inter-process RPC/API calls (latency, failure modes)
- ⚠️ Coordination between worker and Clawson
- ⚠️ Extra failure scenarios (worker dies, RPC fails, timeout, etc.)
- ⚠️ More infrastructure overhead
- ⚠️ Overkill for current volume (~10 actions in queue)

**OPERATIONAL RISK:** MEDIUM
- Two failure points: worker OR Clawson
- If worker dies: queue stalls (even if Clawson is healthy)
- If RPC fails: action is stuck mid-execution
- Recovery requires managing two processes
- More debugging needed

**SSOT DISCIPLINE FIT:** ⭐⭐⭐⭐
- SSOT still handled by Clawson (good)
- But worker mediates queue (adds a coordinator)
- Extra hop for mutation (introduces latency)

**PAPERCLIP ORCHESTRATION FIT:** ⭐⭐⭐⭐
- Worker is agnostic to source (good)
- But Clawson doesn't directly know about queue anymore
- Adds abstraction layer

**RECOMMENDATION:** ⭐ NOT RECOMMENDED (for current scale)
- Overkill for ~10-15 actions/day
- Adds complexity for minimal benefit
- Worth revisiting if queue grows to 1000+ actions/day
- Better suited for distributed system (not single-machine OpenClaw)

---

### MODEL C: HYBRID (CLAWSON + WORKER)

**Architecture:**
```
operator_actions.json
    ↓
Worker polls queue
    ↓
Worker validates + claims action
    ↓
Worker calls Clawson API for execution
    ↓
Clawson mutates SSOT
    ↓
Worker marks action complete
```

**Implementation:**
- Clawson has execution API (execute_action endpoint)
- Separate worker service polls and manages queue
- Worker handles claiming, retry logic, failure handling
- Clawson handles SSOT mutations only
- Separation of queue management from SSOT

**PROS:**
- ✅ Very clear separation of concerns
- ✅ Worker specialized for queue management
- ✅ Clawson focused on SSOT (core role)
- ✅ Fault isolation
- ✅ Scalable (can run multiple workers)
- ✅ Advanced queue features possible (retry, DLQ, etc.)

**CONS:**
- ⚠️ Most complex architecture
- ⚠️ Two services to maintain
- ⚠️ Most failure modes
- ⚠️ Most coordination needed
- ⚠️ RPC/API overhead
- ⚠️ Hardest to reason about
- ⚠️ Overkill for current needs
- ⚠️ Over-engineering

**OPERATIONAL RISK:** HIGH
- Multiple failure combinations
- Two processes that must coordinate
- Hardest to debug
- Longest MTTR (mean time to recovery)

**SSOT DISCIPLINE FIT:** ⭐⭐⭐⭐
- SSOT centralized in Clawson (good)
- But adds worker layer that must be trusted

**PAPERCLIP ORCHESTRATION FIT:** ⭐⭐⭐
- Good separation
- But adds indirection
- Harder to audit full path (worker → Clawson → SSOT)

**RECOMMENDATION:** ❌ NOT RECOMMENDED
- Too complex for current use case
- Only consider after 6+ months at scale
- For now, adds risk and complexity with no benefit

---

## EXECUTION LIFECYCLE (Model A Implementation)

### State Machine

```
PENDING (queued by Paperclip, Telegram, etc.)
  ↓
VALIDATED (Clawson checks: safe, not duplicate, not stale)
  ├─ [INVALID] → REJECTED (marked, logged, skipped)
  ├─ [DUPLICATE] → REJECTED (marked, logged, skipped)
  ├─ [STALE > 1 hour] → EXPIRED (marked, logged, skipped)
  └─ [VALID] → EXECUTING
    ↓
EXECUTING (Clawson mutates SSOT, logs changes)
  ├─ [SUCCESS] → EXECUTED (marked with timestamp, logged)
  ├─ [PARTIAL] → FAILED (partial change visible, marked, logged, manual review needed)
  └─ [ERROR] → FAILED (no SSOT change, marked, logged, operator can retry)
```

### Execution Flow (Per Action)

```
1. READ operator_actions.json
   → Find all actions with status="pending"

2. VALIDATE each pending action
   ├─ Is action_type in [spawn_workstream, assign_agent, advance_stage, pause_venture]?
   ├─ Does target (venture/workstream) exist in SSOT?
   ├─ Is there a duplicate in queue (same signature, < 60s old)?
   ├─ Is action stale (> 1 hour old)?
   └─ If any validation fails → REJECT & SKIP

3. EXECUTE (mutate SSOT via governed path)
   ├─ venture_pipeline.json: update venture state
   ├─ workstreams.json: add/update workstream
   ├─ agent_activity.json: log execution
   └─ operator_actions.json: update status to "executed"

4. LOG
   → Write to agent_activity.json with:
      {
        "timestamp": ISO8601,
        "agent": "Clawson",
        "action": action_type,
        "source": source (paperclip|telegram|etc),
        "operator": operator,
        "result": "success|failure",
        "details": { ... }
      }

5. UPDATE operator_actions.json
   → Set status="executed", executed_at=ISO8601, result={...}

6. ON ERROR
   → Mark status="failed", result={error details}
   → Log to agent_activity.json
   → Move to next action (don't retry, don't crash)
```

---

## SAFEGUARDS AGAINST EXECUTION FAILURES

### 1. Duplicate Execution Prevention
- Signature check before execution (hash of action_type + target + parameters)
- 60-second dedup window
- Already implemented in adapter

### 2. Partial Execution Prevention
- All SSOT mutations atomic (update one file completely)
- Use fs.writeFileSync for atomic writes
- Log before mutation (rollback possible)

### 3. Queue Corruption Prevention
- Read operator_actions.json (don't modify queue while reading)
- Write back after processing ALL actions (batch update)
- Keep original queue until all processed actions logged

### 4. Out-of-Order Execution Prevention
- Process actions in order (FIFO from array)
- Don't skip or reorder
- Mark failures and continue (don't block later actions)

### 5. Unauthorized SSOT Writes Prevention
- Clawson is ONLY process that writes to SSOT
- Adapter writes ONLY to operator_actions.json
- All other processes read-only
- Git tracks all SSOT changes (audit trail)

---

## GOVERNANCE + AUTHORITY (Model A)

### What Clawson CAN Do
- ✅ Read operator_actions.json
- ✅ Validate action intent
- ✅ Mutate SSOT files (venture_pipeline.json, workstreams.json, etc.)
- ✅ Log executions to agent_activity.json
- ✅ Update operator_actions.json status
- ✅ Reject invalid/duplicate/stale actions
- ✅ Handle failures gracefully

### What Clawson CANNOT Do
- ❌ Write to operator_actions.json except status updates
- ❌ Delete actions (only update status)
- ❌ Modify command after creation
- ❌ Bypass dedup window
- ❌ Execute unauthorized action types
- ❌ Mutate SSOT directly (only through action execution)

### Audit Trail
```
agent_activity.json
  └─ Every executed action logged with:
     • timestamp
     • source (paperclip|telegram|manual)
     • action_type
     • target
     • operator identity
     • result (success|failure)
```

### Failure Recording
```
operator_actions.json
  └─ Every failed action marked with:
     • status="failed"
     • result={error message, stack trace if applicable}
     • executed_at=ISO8601 (when attempt was made)
     • Preserved in queue for manual review
```

---

## MINIMAL IMPLEMENTATION PATH (Model A)

### Phase 1: Clawson Queue Polling (Week 1)
1. Add `pollOperatorActions()` method to Clawson
2. Call every 10 seconds in Clawson's main loop
3. Find pending actions
4. Execute safe subset (spawn_workstream, assign_agent)
5. Log results

### Phase 2: Expand Command Set (Week 2, if Phase 1 succeeds)
1. Add advance_stage execution
2. Add pause_venture execution
3. Test with real venture state
4. Monitor for issues

### Phase 3: Governance + Safety Gates (Week 3, if Phase 1-2 succeed)
1. Add operator approval gates (optional)
2. Add rate limiting
3. Add retry logic for transient failures
4. Add alerting for failures

### Phase 4: Operator Integration (Week 4, if Phase 1-3 succeed)
1. Expose status via Mission Control (read-only)
2. Allow operator to view queue
3. Allow operator to view execution logs
4. Do NOT allow operator to mutate queue directly

---

## OUT OF SCOPE (Phase 3+, NOT NOW)

- ❌ Operator approval gates for every action
- ❌ Advanced retry logic (transient failure retry)
- ❌ Dead letter queue (failed action handling)
- ❌ Distributed queue (multiple executors)
- ❌ Event-driven architecture (at scale)
- ❌ Adaptive command set expansion
- ❌ Workflow orchestration (multi-step commands)
- ❌ Approval chains / governance layers
- ❌ Rate limiting / throttling
- ❌ Circuit breakers

**These are Phase 3+ work. Scope Phase 1 tightly.**

---

## ROLLBACK PATH (Model A)

### If Clawson Executor Breaks
```bash
# Option 1: Temporary disable
# Edit Clawson's polling loop to skip processing (mark all as "processing_disabled")
# Queue remains intact
# Manual restart: re-enable polling

# Option 2: Full rollback (< 5 minutes)
# Delete operator_actions.json
# Restore from git
# git checkout HEAD -- data/mission-control/operator_actions.json
```

### If SSOT Gets Corrupted
```bash
# Full rollback (< 2 minutes)
git checkout HEAD -- data/mission-control/
# Revert all SSOT mutations, queue state restored
```

### If Paperclip Submitted Malicious Command
```bash
# Option 1: Manual removal
jq '.actions |= map(select(.id != "malicious-id"))' operator_actions.json > /tmp/clean.json && mv /tmp/clean.json operator_actions.json

# Option 2: Full revert if unsure
git checkout HEAD -- data/mission-control/
```

---

## FINAL RECOMMENDATION

### **MODEL A: CLAWSON AS EXECUTOR**

**Verdict: STRONGLY RECOMMENDED ⭐⭐⭐**

**Reasons:**
1. **Simplest:** No new services, no coordination overhead
2. **Safest:** Single point of authority (Clawson owns SSOT)
3. **Proven:** Clawson already orchestrates system
4. **Scalable enough:** Current queue volume (~10-15 actions/day) requires minimal polling
5. **Governable:** One process to audit, one failure mode to handle
6. **Minimal code:** ~50 lines in polling loop
7. **Easy to debug:** End-to-end execution path is clear
8. **Paperclip-ready:** Clawson doesn't need to know Paperclip exists, just processes queue

**Implementation Cost:**
- Time: 1 week
- Code: ~50 lines in Clawson
- Infrastructure: None (no new services)
- Maintenance: Minimal

**Operational Risk:** LOW
- Single restart recovers it
- No inter-process failures
- Clear execution path

**Next Step:**
- Approve Model A
- Proceed to implementation (Phase 1: basic queue polling + 2 safe action types)
- Test with sandbox venture (LeadScore.ai)
- Expand command set after validation

---

## ALTERNATIVE IF MODEL A FAILS

If after 2 weeks Model A shows scaling issues (> 100 actions/day), then:
- Consider Model B (dedicated worker)
- But keep executor simple (RPC call to Clawson for mutations)
- Still centralize SSOT in Clawson

---

## NOT RECOMMENDED

- ❌ Model B (too complex now, revisit at 10x scale)
- ❌ Model C (over-engineered, adds risk)
- ❌ Paperclip direct SSOT writes (violates architecture)
- ❌ Multiple executors (too early)

---

**This is pure architecture. No code written. No implementation started. Ready for approval to proceed to Phase 1: Clawson Queue Polling.**
