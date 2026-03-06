# Change Request: CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS

**Title:** Mission Control — Operator Visual Refinement + Operations Action Layer + Unified Command Bus  
**Date:** 2026-03-05 20:31 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith (execution), Clawson (orchestration/governance)  
**Priority:** P0 (CRITICAL ARCHITECTURE)  
**Scope:** 10-part system upgrade  
**Timeline:** 2 weeks  
**Status:** APPROVED FOR IMMEDIATE EXECUTION  

---

## EXECUTIVE SUMMARY

Upgrade Mission Control in two strategic ways:

1. **Operator Mode Visual Refinement** — Premium, calm, executive control surface (not engineering wall)
2. **Operations Mode Action Layer** — Real execution (pause, advance, kill, spawn, assign, clear, etc.)
3. **Unified Command Bus** — CRITICAL: Telegram + Dashboard share ONE pipeline (zero drift, dedupe, audit)

**Key Innovation:** All user-issued actions (Telegram or UI) enter a single queue. Only Clawson executes. This guarantees no duplicate commands, no race conditions, no inconsistent state.

---

## PART 1: OPERATOR DASHBOARD VISUAL REFINEMENT

### Design Objectives
- Visually calm + high signal/low noise
- More whitespace + fewer competing colors
- Clearer visual hierarchy + easier to scan in <5 seconds
- Premium card layout (larger padding, cleaner spacing, softer shadows)

### Operator Mode Layout

**Minimal Top Summary Row:**
```
System Health | Active Ventures | Blockers | Critical Insights | Active Agents
(clean, readable, ~30px tall)
```

**Primary Cards (Large, Premium):**
- Blocked Work (if blockers exist)
- Critical Insights (top 3)
- Operator Guidance (top 2)
- Venture Summary (stage distribution)

**Secondary Cards (Collapsed by Default):**
- Agent Status
- Momentum
- Opportunity Discovery

### Premium Card Treatment
```css
.operator-card {
  padding: 24px;           /* Increased from 12px */
  margin: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);  /* Softer */
  border: 1px solid #444;  /* Subtle */
  background: #1a1a1a;
  line-height: 1.8;        /* Breathier */
  font-size: 14px;
}

.card-title {
  font-size: 18px;         /* Larger */
  font-weight: 600;
  margin-bottom: 16px;
  color: #fff;
}

.card-number {
  font-size: 32px;         /* Key numbers prominent */
  font-weight: 700;
  color: #0f0;
}
```

### Visual Hierarchy (Operator Mode)
```
🔴 RED (critical alerts only)
🟡 YELLOW (action required)
⚪ NEUTRAL (healthy, calm)
🔵 BLUE (opportunities)
```

Healthy panels should feel **quiet**.

### Better Empty States
```
"No blockers right now"         (calm, positive)
"No urgent insights"            (not threatening)
"All agents online"             (simple, reassuring)
```

Instead of empty shells or placeholders.

---

## PART 2: OPERATIONS DASHBOARD ACTION LAYER

### Supported Actions

**Venture Actions:**
- Pause Venture
- Advance Venture Stage
- Kill Venture
- Trigger Experiment
- Approve / Reject Decision Gate

**Workstream Actions:**
- Spawn Workstream
- Mark Workstream Complete
- Reopen Workstream

**Blocker Actions:**
- Clear Blocker
- Update Blocker Status

**Agent Actions:**
- Assign Agent to Workstream

### Action Exposure Points

Every action exposed through:
- Venture drilldown panel
- Blocker drilldown panel
- Workstream drilldown panel

### Action Schema

Every action must include:
```json
{
  "action_type": "advance_stage|kill_venture|spawn_workstream|...",
  "target_type": "venture|workstream|blocker|agent",
  "target_id": "leadscore-ai",
  "operator": "Steve",
  "timestamp": "ISO-8601",
  "source_channel": "mission_control|telegram",
  "status": "pending|executed|rejected|failed",
  "result": null
}
```

---

## PART 3: UNIFIED COMMAND BUS (CRITICAL ARCHITECTURE)

### The Problem Solved
Telegram commands and Mission Control UI actions were operating as separate systems → potential duplicate commands, race conditions, inconsistent state.

### The Solution: Single Command Queue

**File:** `/workspace/data/mission-control/operator_actions.json`

**Schema:**
```json
{
  "lastUpdated": "ISO-8601",
  "actions": [
    {
      "id": "uuid",
      "source": "telegram|mission_control",
      "operator": "Steve",
      "action_type": "advance_stage",
      "target_type": "venture",
      "target_id": "leadscore-ai",
      "payload": { "next_stage": "build" },
      "status": "pending|executed|rejected|failed",
      "created_at": "ISO-8601",
      "executed_at": null,
      "result": null,
      "signature": "hash(action_type+target_type+target_id+payload)"
    }
  ]
}
```

### Rules (NON-NEGOTIABLE)

1. **ALL user-issued actions must enter this queue first**
2. **Telegram commands write to this queue**
3. **Mission Control actions write to this queue**
4. **Clawson is the ONLY orchestrator allowed to execute queued actions**
5. **No direct state mutation from UI buttons**
6. **No direct state mutation from Telegram shortcuts**
7. **State changes happen ONLY after queue execution**

### Guarantees
- ✅ No duplicate commands
- ✅ No race conditions
- ✅ No inconsistent state between Telegram and UI
- ✅ Complete auditability
- ✅ Single source of truth for all operator decisions

---

## PART 4: IDEMPOTENCY + DEDUPLICATION

### Dedupe Rules

**If two actions are functionally identical within 60 seconds, treat as duplicate.**

Example:
```
Telegram: "Advance LeadScore.ai to Build"
UI: [Click Advance Stage button]
Time delta: 30 seconds

→ Only first executes
→ Second marked: status=rejected, result="duplicate_action"
```

### Deterministic Action Signature

```javascript
signature = hash(action_type + target_type + target_id + normalize(payload))

// Example:
// advance_stage + venture + leadscore-ai + {next_stage: build}
// → signature = "abc123def456..."
```

**Dedupe window:** 60 seconds

**Lookup:** Check operator_actions.json for matching signature in last 60 seconds

```javascript
function isDuplicate(action) {
  const recentWindow = 60 * 1000; // 60 seconds
  const now = Date.now();
  
  const existingAction = actions.find(a => 
    a.signature === action.signature &&
    (now - new Date(a.created_at).getTime()) < recentWindow &&
    a.status !== 'rejected'
  );
  
  return existingAction ? true : false;
}
```

---

## PART 5: STATE CHANGE AUTHORITY

### SSOT-Only Mutations

All mutations must update SSOT files ONLY:
- venture_pipeline.json
- workstreams.json
- blocked_work.json
- venture_scoreboard.json
- agent_activity.json

### Client Pattern

**Mission Control UI** = client of SSOT (read-only, actions via queue)  
**Telegram** = client of SSOT (read-only, commands via queue)  
**Clawson (Executor)** = writes to SSOT (after queue execution)

### NO Shadow State

- No UI-only variables that affect displayed data
- No in-memory caches that diverge from SSOT
- No Telegram shortcuts that skip the queue

---

## PART 6: ACTION LOGGING + AUDIT TRAIL

### agent_activity.json Appends

Every executed action appends to `agent_activity.json`:

```json
{
  "agent": "Clawson",
  "action": "Advance Venture Stage",
  "description": "LeadScore.ai: Proposal → Build (via mission_control)",
  "severity": "info",
  "source": "mission_control",
  "timestamp": "ISO-8601"
}
```

If from Telegram:
```json
{
  "agent": "Clawson",
  "action": "Pause Venture",
  "description": "LeadScore.ai paused (via telegram)",
  "severity": "info",
  "source": "telegram",
  "timestamp": "ISO-8601"
}
```

### Both Channels in Same Stream

Telegram + UI actions appear in single activity log.

Operator can see:
- When action issued (timestamp)
- Which channel (source)
- Result (executed, rejected, failed)
- What changed (description)

---

## PART 7: UI SAFETY + CONFIRMATION

### High-Impact Actions Require Confirmation Modal

**Require Modal For:**
- Kill Venture
- Advance Stage
- Clear Blocker
- Spawn Workstream

**Modal Must Show:**
- Action summary
- Target object
- Expected consequence
- Confirmation button + Cancel button

### Post-Submission Feedback

After clicking Confirm:
```
Status: Queued
  ↓
Status: Executing
  ↓
Status: Executed (or Failed)
```

Show live status update.

### Duplicate Detection UI

If action already submitted:
```
"Action already submitted from another channel
Status: Queued
ID: abc123def456..."
```

---

## PART 8: TELEGRAM SAFETY

### Clawson Telegram Command Handler

When Steve issues operational command in Telegram:

1. Parse command (e.g., `/advance leadscore-ai build`)
2. Create action object
3. Write to operator_actions.json queue
4. Return queue receipt (don't mutate state directly)

### Response Example

```
Queued action:
• Action: Advance Venture Stage
• Target: LeadScore.ai → Build
• Source: telegram
• Status: Pending
• ID: abc123def456
```

(No immediate state change; wait for Clawson executor)

---

## PART 9: OPERATOR DASHBOARD VISUAL ENHANCEMENTS

### Additional Premium Touches

- **Cleaner card spacing** — 24px padding instead of 12px
- **Larger key numbers** — 32px font for KPIs (agent count, blocker count, etc.)
- **Stronger typography** — 600+ font-weight for titles
- **Lighter visual density** — Line-height 1.8, more breathing room
- **Hide secondary metadata by default** — Timestamps, details only on hover
- **Visually distinct "Today's Priorities" section** — Top 3 critical items above fold
- **More premium layout treatment** — Soft shadows, subtle borders, spacious grid

### Visual Target

Operator mode should feel:
```
✨ More beautiful
🧘 Calmer  
🤝 More trustworthy
📉 Less cluttered
```

Not:
```
📊 Engineering telemetry wall
🔥 Alert fatigue
⚡ Chaotic data
```

---

## PART 10: VERIFICATION

Verification report must provide:

1. ✅ Updated Operator mode screenshots (premium, calm layout)
2. ✅ Updated Operations mode screenshots (action buttons visible)
3. ✅ operator_actions.json queue file created and working
4. ✅ Telegram command → queue → execution flow example
5. ✅ Mission Control action → queue → execution flow example
6. ✅ Duplicate action rejection example (60-second dedupe)
7. ✅ Confirmation there is NO direct state mutation outside Clawson
8. ✅ Confirmation all actions update SSOT only (no shadow state)
9. ✅ Confirmation activity log captures both channels (Telegram + UI)

---

## IMPLEMENTATION PHASES

### Phase 1 (Days 1-3): Visual Refinement
- [ ] Operator mode redesign (premium cards, whitespace, typography)
- [ ] CSS updates for calm aesthetic
- [ ] Empty state messaging
- [ ] Screenshot documentation

### Phase 2 (Days 3-5): Action Layer
- [ ] Implement 10 action types (pause, advance, kill, spawn, assign, clear, etc.)
- [ ] Confirmation modals
- [ ] Action buttons in drilldowns
- [ ] Status feedback UI

### Phase 3 (Days 5-10): Unified Command Bus
- [ ] Create operator_actions.json queue
- [ ] Implement queue write logic (UI + Telegram)
- [ ] Implement deduplication (60-second window, signature-based)
- [ ] Implement Clawson executor (only entity allowed to mutate SSOT)
- [ ] Ensure NO direct UI mutations

### Phase 4 (Days 10-12): Telegram Integration
- [ ] Route Telegram commands through queue
- [ ] Implement Clawson command handler
- [ ] Return queue receipts
- [ ] Activity log both channels

### Phase 5 (Days 12-14): Testing + Verification
- [ ] Full integration testing
- [ ] Duplicate action rejection tests
- [ ] SSOT-only mutation verification
- [ ] Activity log audit trail
- [ ] Screenshots + verification report

---

## SUCCESS CRITERIA

✅ Operator mode is visually calmer and more premium  
✅ Operations mode supports real execution  
✅ Telegram and Mission Control share unified command bus  
✅ No duplicate or conflicting actions can occur (60-second dedupe)  
✅ All state changes are auditable (both channels logged)  
✅ No data drift between UI and Telegram workflows  
✅ Only Clawson can execute queued actions  
✅ SSOT is sole source of truth (no shadow state)  
✅ Confirmation modals for high-impact actions  
✅ Queue receipt shown to users (feedback loop)  

---

## ACCEPTANCE CRITERIA

✅ Operator mode screenshots show premium, calm layout  
✅ Operations mode screenshots show action buttons  
✅ operator_actions.json queue operational  
✅ Telegram→queue→execution works (test case provided)  
✅ UI→queue→execution works (test case provided)  
✅ Duplicate rejection test shows 60-second dedupe  
✅ Zero direct UI mutations (code audit shows all via queue)  
✅ All mutations are SSOT-only  
✅ Activity log shows both Telegram + UI actions  
✅ No state inconsistency between channels  

---

**CR ID:** CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS  
**Date:** 2026-03-05 20:31 EST  
**Timeline:** 2 weeks  
**Risk:** Medium (major architectural change, but well-scoped)  
**Impact:** CRITICAL — Solves Telegram/UI sync problem, prevents duplicate actions, guarantees audit trail
