# Clawson Command Bus Processor
## CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS

**Role:** Clawson is the SOLE executor of all queued operator actions.
**Queue file:** `/workspace/data/mission-control/operator_actions.json`

---

## Processing Loop

Clawson should poll `/api/command-bus/pending` regularly (e.g., every 30s or on new action events).

### Step 1: Fetch pending actions
```
GET /api/command-bus/pending
→ { actions: [...], count: N }
```

### Step 2: For each pending action:

1. Mark executing: `POST /api/command-bus/execute/:id` (pre-flight)
   - Actually: first mark executing via internal API, then execute

2. Execute against SSOT:
   - `pause_venture`       → write ventures.json / venture_pipeline.json
   - `resume_venture`      → write ventures.json
   - `advance_stage`       → POST /api/ventures/:slug/advance
   - `kill_venture`        → POST /api/ventures/:slug/kill
   - `spawn_workstream`    → POST /api/commands/spawn-workstream
   - `assign_agent`        → POST /api/commands/assign-agent
   - `clear_blocker`       → write blocked_work.json
   - `complete_workstream` → write workstreams.json
   - `reopen_workstream`   → write workstreams.json
   - `trigger_experiment`  → POST /api/commands/trigger-experiment
   - `approve_decision`    → POST /api/decisions/action (action=approve)
   - `reject_decision`     → POST /api/decisions/action (action=reject)

3. Mark result:
   - Success: `POST /api/command-bus/execute/:id` with `{ result: "description" }`
   - Failure:  `POST /api/command-bus/fail/:id` with `{ error: "message" }`
   - Reject:   `POST /api/command-bus/reject/:id` with `{ reason: "message" }`

---

## Rules (NON-NEGOTIABLE)

1. ✅ Only Clawson executes queued actions
2. ✅ Only write to SSOT files (venture_pipeline.json, workstreams.json, etc.)
3. ✅ Log every execution to agent_activity.json (automatic via command-bus)
4. ✅ Never skip the queue (even for "obvious" actions)
5. ✅ Reject duplicate actions (already handled by submit endpoint)
6. ✅ Handle both `mission_control` and `telegram` sources equally

---

## Telegram Command Handler

When Steve sends a Telegram command, Clawson should:

1. Parse the intent:
   - `/advance leadscore-ai build` → advance_stage, target: leadscore-ai, payload: {next_stage: build}
   - `/pause leadscore-ai` → pause_venture, target: leadscore-ai
   - `/kill leadscore-ai reason: market too small` → kill_venture
   - `/clear-blocker blocker-id-123` → clear_blocker
   - `/spawn-workstream leadscore-ai "API Integration" owner: codesmith` → spawn_workstream

2. POST to command bus:
```
POST /api/command-bus/submit
{
  "action_type": "advance_stage",
  "target_type": "venture",
  "target_id":   "leadscore-ai",
  "operator":    "Steve",
  "source":      "telegram",
  "payload":     { "next_stage": "build" }
}
```

3. Return queue receipt to Steve:
```
✅ Action Queued

• Action: Advance Venture Stage
• Target: leadscore-ai → build
• Source: telegram
• Status: Pending
• ID: abc123de…

Clawson will execute and confirm.
```

4. After Clawson executes, notify Steve:
```
✅ Executed

• Action: Advance Venture Stage
• LeadScore.ai: Proposal → Build
• Executed at: 2026-03-05T20:45:00Z
```

---

## Deduplication

If Steve sends the same command from both Telegram and Mission Control UI within 60 seconds:

```
❌ Duplicate Action

This action was already submitted from mission_control 30 seconds ago.
Status: Pending
ID: abc123de…

No action taken. Wait for the original to execute.
```

---

## Activity Log

Every action (from any channel) appears in agent_activity.json:
```json
{
  "agent": "Clawson",
  "action": "Advance Venture Stage",
  "description": "leadscore-ai: Proposal → Build (via telegram)",
  "severity": "info",
  "source": "telegram",
  "timestamp": "2026-03-05T20:45:00.000Z"
}
```

Both channels flow into ONE unified log. Steve can see the complete audit trail.
