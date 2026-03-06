# PAPERCLIP TRANSITION ARCHITECTURE

**Date:** Friday, March 6, 2026 @ 11:35 AM EST  
**Status:** STRATEGIC PIVOT — Mission Control de-scoped as primary action console  
**Goal:** Deploy Paperclip as canonical orchestration layer above OpenClaw

---

## EXECUTIVE SUMMARY

**Problem:** Mission Control UI has fundamental architectural failures (event binding, action queueing, interactive execution). Continuing custom UI fixes is inefficient.

**Solution:** Paperclip becomes the canonical operator/orchestration layer. OpenClaw remains the execution substrate. SSOT and command bus discipline preserved.

**Architecture:**
```
OPERATOR (Human)
    ↓
PAPERCLIP (Orchestration Layer) ← Primary control plane
    ↓
COMMAND BUS (operator_actions.json)
    ↓
OPENCLAWEXECUTION SUBSTRATE (Clawson, Codesmith, Moonshot, etc.)
    ↓
SSOT (venture_pipeline.json, workstreams.json, etc.)
```

**Mission Control Role:** Read-only visibility/dashboard only. No action initiation.

---

## PART 1: CANONICAL CONTROL-PLANE DEFINITION

### Control Plane Responsibilities

**Paperclip (Primary Control Plane):**
- ✅ Accept operator commands (HTTP, CLI, voice, etc.)
- ✅ Validate command intent
- ✅ Route commands to command bus
- ✅ Track execution status
- ✅ Provide operator feedback (success/failure/progress)
- ✅ Prevent invalid state transitions
- ✅ Enforce governance rules (approvals, risk gates, etc.)
- ✅ Maintain audit trail

**OpenClaw (Execution Substrate):**
- ✅ Execute commands queued by Paperclip
- ✅ Manage SSOT files (venture_pipeline.json, workstreams.json, etc.)
- ✅ Run agents (Clawson, Codesmith, Moonshot)
- ✅ Maintain command bus queue
- ✅ Provide execution logs

**Mission Control (Visibility Layer):**
- ✅ Display real-time operational state (read SSOT files only)
- ✅ Show command queue status
- ✅ Show agent activity logs
- ✅ **NOT** responsible for command initiation
- ✅ **NOT** responsible for state mutations

### Command Flow Architecture

```
1. OPERATOR INPUT (Paperclip accepts)
   └─ Source: REST API, CLI, voice, web form, Telegram, etc.
   └─ Input: Structured command (action_type, target, parameters)
   └─ Validation: Intent check, parameter validation, auth

2. COMMAND QUEUEING (Paperclip → Command Bus)
   └─ Destination: operator_actions.json
   └─ Payload: id, action_type, target_type, target_id, source (paperclip), operator, timestamp
   └─ Deduplication: Check 60-second window for identical actions
   └─ Response to operator: "Command queued, id=<uuid>"

3. EXECUTION (OpenClaw reads queue)
   └─ Reader: Clawson agent polls operator_actions.json every 10 seconds
   └─ Executor: Processes one action at a time (no parallel execution)
   └─ Mutation: Updates SSOT files (venture_pipeline.json, workstreams.json)
   └─ Logging: Appends to agent_activity.json with source=<paperclip|telegram|etc>

4. FEEDBACK (Paperclip monitors execution)
   └─ Status tracking: Polls operator_actions.json for execution status
   └─ Activity log: Reads agent_activity.json for operation details
   └─ User notification: Reports execution status back to operator
   └─ Visibility: Mission Control displays updated state (reads SSOT)
```

### Governance Rules (Paperclip Enforces)

**Pre-execution validation:**
- ✅ Action type is valid (advance_stage, pause_venture, spawn_workstream, etc.)
- ✅ Target exists in SSOT (venture_pipeline.json, workstreams.json)
- ✅ Operator has permission
- ✅ No conflicting state (e.g., can't pause already-paused venture)
- ✅ No missing dependencies (e.g., can't advance with critical blockers unless overridden)

**Deduplication rule:**
- ✅ Check for identical actions within 60-second window
- ✅ Signature = hash(action_type + target_type + target_id + normalized_payload)
- ✅ Reject duplicates with reason: "duplicate_action"

**Audit trail requirement:**
- ✅ Every command logged with: timestamp, operator, source, action, parameters, result
- ✅ Immutable log (append-only)
- ✅ Searchable by: operator, action_type, target, timestamp range

---

## PART 2: MISSION CONTROL MINIMAL ROLE (During Transition)

### What Mission Control Keeps
- ✅ Real-time dashboard (5-KPI summary)
- ✅ Venture Pipeline visualization (read-only)
- ✅ Active Work panel (read-only)
- ✅ Blocked Work panel (read-only)
- ✅ Agent Activity feed (read-only)
- ✅ System Health metrics
- ✅ Command Queue status display (pending/executing actions visible)

### What Mission Control Loses
- ❌ Action buttons ("Pause Venture", "Advance Stage", "Spawn Workstream")
- ❌ Editable fields (direct state mutation)
- ❌ Click-to-execute workflows
- ❌ Inline decision panels with "Take action →" buttons
- ❌ Any write access to SSOT files

### Implementation (Mission Control v2)
```
Remove from operator-premium.js:
- All button click handlers
- All form submission handlers
- All fetch POST requests to /api/command-bus/submit

Keep in operator-premium.js:
- Data fetch (GET /api/*)
- Display rendering
- Auto-refresh (10s interval)
- Real-time panel updates

Add notification:
"Command execution now available through Paperclip CLI or API"
```

---

## PART 3: PAPERCLIP DEPLOYMENT PLAN

### Phase 1: Foundation (Week 1)
**Goal:** Deploy Paperclip REST API + CLI

**Deliverables:**
1. Paperclip REST server (Node.js/Express)
   - Endpoint: POST /commands/submit
   - Payload: { action_type, target_type, target_id, parameters }
   - Response: { status, id, message }

2. Paperclip CLI
   - Command: `paperclip exec <action> <target> [params]`
   - Example: `paperclip exec advance-stage LeadScore.ai`

3. Integration with command bus
   - Write to operator_actions.json via same queue
   - Polling for execution status
   - Feedback to operator

**Status check:**
- ✅ Paperclip server running on port 3001
- ✅ CLI installed and authenticated
- ✅ Commands flowing to operator_actions.json
- ✅ OpenClaw executing them correctly

### Phase 2: Operator Interface (Week 2)
**Goal:** Paperclip becomes primary command interface

**Deliverables:**
1. Web form for Paperclip (HTML/JS, not Mission Control)
   - Simple form: dropdown (action), text (target), button (submit)
   - Submits to Paperclip REST API
   - Shows execution status

2. Telegram integration
   - Bot listens for `/paperclip <command>` format
   - Routes to Paperclip API
   - Reports back to user

3. Dashboard integration
   - Mission Control shows Paperclip commands queued/executing
   - Removes all action buttons from Mission Control itself

**Status check:**
- ✅ Paperclip API receiving commands from multiple sources
- ✅ Command execution tracking visible in Mission Control
- ✅ Operator can initiate actions through Paperclip, not Mission Control

### Phase 3: Mission Control Cleanup (Week 3)
**Goal:** Remove all action-execution code from Mission Control

**Deliverables:**
1. Remove from operator-premium.js:
   - Button click handlers
   - CommandBusClient.submit() calls
   - Form handlers
   - State mutation logic

2. Update to read-only:
   - All panels become data display only
   - Remove edit controls
   - Remove action buttons

3. Update messaging:
   - "To execute commands, use Paperclip (CLI, API, or web form)"
   - Link to Paperclip documentation

**Status check:**
- ✅ Mission Control has no write access to command bus
- ✅ All action buttons removed or disabled
- ✅ Console shows zero action-initiation errors

---

## PART 4: ROLLBACK PLAN (If Needed)

### Rollback Trigger
If Paperclip deployment fails or OpenClaw execution breaks:

**1. Immediate (< 5 minutes):**
- Disable Paperclip (stop process)
- Keep Mission Control as read-only dashboard
- Operators use manual Clawson commands (CLI or direct JSON edits)
- **Status:** Operations remain possible but less convenient

**2. Short-term (< 1 hour):**
- Revert Mission Control to pre-transition state (restore action buttons)
- Keep operator_actions.json as SSOT
- **Status:** Back to Mission Control as primary (with known issues)

**3. Long-term (1-24 hours):**
- Analyze Paperclip failure root cause
- Fix and re-deploy
- **Status:** Successful second attempt

### Rollback Mechanics
```bash
# Revert Mission Control code
git revert <commit-hash-that-removed-buttons>
git push

# Restart Mission Control
pkill -f "node.*mission-control-ui"
cd /workspace/mission-control-ui && node server.js &

# Operators can resume using Mission Control UI
```

**Risk:** Medium. Mission Control's action layer has known bugs, but reverting gets operators back to baseline faster than fixing Paperclip in emergency mode.

---

## PART 5: SSOT + COMMAND BUS DISCIPLINE

### Rules That Don't Change
1. **SSOT Authority**
   - ✅ venture_pipeline.json is source of truth for ventures
   - ✅ workstreams.json is source of truth for work
   - ✅ blocked_work.json is source of truth for blockers
   - ✅ operator_actions.json is source of truth for queued commands

2. **Command Bus**
   - ✅ All actions must enter operator_actions.json
   - ✅ Clawson is sole executor (no parallel execution)
   - ✅ No direct state mutation outside command bus
   - ✅ Deduplication enforced (60-second window)

3. **Audit Trail**
   - ✅ agent_activity.json logs all executed actions
   - ✅ Immutable (append-only)
   - ✅ Includes: timestamp, operator, source (paperclip/telegram/etc), action, result

4. **Multi-channel Consistency**
   - ✅ Paperclip, Telegram, and any future channel use same queue
   - ✅ No data drift (single SSOT files, single queue)
   - ✅ Same dedup rules apply to all sources

---

## PART 6: CANONICAL CONTROL-PLANE CHECKLIST

### Paperclip Must Provide
- [ ] REST API for command submission
- [ ] CLI for local execution
- [ ] Command validation (intent, parameters, permissions)
- [ ] Deduplication (60-second window, signature-based)
- [ ] Execution status tracking
- [ ] Audit trail (immutable log)
- [ ] Operator feedback (success/failure/progress)
- [ ] Error handling (invalid actions, permission denied, etc.)
- [ ] Rate limiting (prevent command spam)
- [ ] Documentation (API spec, CLI examples, architecture)

### OpenClaw Must Maintain
- [ ] Execution substrate (run agents)
- [ ] SSOT authority (manage all truth files)
- [ ] Command bus queue (operator_actions.json)
- [ ] Activity logging (agent_activity.json)
- [ ] Deduplication verification (catch duplicates)
- [ ] Atomic state mutations (all-or-nothing)
- [ ] Rollback capability (git-tracked SSOT changes)

### Mission Control Must Provide
- [ ] Real-time visibility (read SSOT files)
- [ ] Command queue visualization
- [ ] Agent activity stream
- [ ] System health metrics
- [ ] NO action initiation
- [ ] NO state mutation
- [ ] NO command submission to queue

---

## TIMELINE

| Phase | Dates | Deliverables |
|-------|-------|--------------|
| **1: Foundation** | Week of 3/6 | Paperclip API + CLI live, commands flowing |
| **2: Operator Interface** | Week of 3/13 | Web form + Telegram integration working |
| **3: Cleanup** | Week of 3/20 | Mission Control buttons removed, read-only mode |
| **4: Verification** | Week of 3/27 | Full integration tested, no regressions |

---

## SUCCESS CRITERIA

✅ Paperclip receives commands from multiple sources (API, CLI, Telegram, web form)  
✅ Commands enter operator_actions.json via unified queue  
✅ OpenClaw executes commands correctly  
✅ SSOT files mutate properly  
✅ audit trail complete and immutable  
✅ Mission Control shows all status (read-only)  
✅ No action buttons in Mission Control  
✅ Operators can manage system through Paperclip  
✅ Rollback possible in < 5 minutes if needed  
✅ Zero command-execution bugs from UI layer  

---

## RISK ASSESSMENT

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|-----------|
| Paperclip API unstable | Low | High | Extensive testing, rollback ready |
| Command dedup doesn't work | Low | Medium | Implement same logic as Mission Control |
| SSOT files get corrupted | Low | Critical | Git tracking, atomic writes only |
| Operator loses visibility | Low | Medium | Mission Control dashboard remains |

---

**Status:** Ready for approval and Phase 1 execution.

All canonical control-plane rules preserved. SSOT and command bus discipline maintained.

Paperclip becomes the operator's interface. OpenClaw remains the execution engine. Mission Control becomes the visibility window.
