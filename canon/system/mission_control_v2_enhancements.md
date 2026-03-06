# MISSION CONTROL V2 OPERATIONAL ENHANCEMENTS

**Version:** 2.3.0 (Amendment with Enhancements)  
**Date:** 2026-03-04 15:08 EST  
**Type:** Amendment to existing architecture (not replacement)  
**Status:** Extending V2.2.0 capabilities

---

## ENHANCEMENT 1: WORKSTREAM FLOW VISIBILITY

### Purpose
Provide clear visibility into how work flows between agents: Moonshot → Clawson → Codesmith → Experiment

### Workstream Definition

Each active venture/idea is tracked as a **workstream** — a single path of work from idea through results.

```json
{
  "workstream": {
    "workstream_id": "ws_001",
    "title": "Idea: Customer API Integration",
    "origin_agent": "moonshot",
    "moonshot_id": "idea_001",
    "current_stage": "specification",
    "current_agent": "moonshot",
    "status": "in_progress",
    "last_update": "2026-03-04T15:00:00Z",
    "timeline": {
      "started": "2026-03-01",
      "estimated_completion": "2026-03-08"
    },
    "stages_completed": ["idea"],
    "next_stage": "proposal"
  }
}
```

### Workstream Stages

```
1. idea           → Moonshot identifies + researches
2. specification  → Moonshot writes memo + PRD + experiment
3. proposal       → Moonshot → Clawson (decision point)
4. approval_pending → Waiting for Clawson APPROVE/REVISE/REJECT
5. change_request → Clawson → Codesmith (formal CR)
6. implementation → Codesmith building (quality gates)
7. experiment     → Moonshot validates metrics
8. results        → Final decision (GO/ITERATE/PIVOT/NO-GO)
```

### Mission Control Display: ACTIVE WORKSTREAMS

```
ACTIVE WORKSTREAMS

ws_001: Customer API Integration
├─ Origin: Moonshot
├─ Stage: specification (Day 3 of 7)
├─ Current Agent: Moonshot
├─ Status: ✅ In Progress
└─ Next: Proposal (by March 8)

ws_002: Performance Analytics
├─ Origin: Moonshot
├─ Stage: implementation (Week 1 of 3)
├─ Current Agent: Codesmith
├─ Status: ✅ Building
├─ Quality Gates: 5/7 passing
└─ Est. Complete: March 15

ws_003: Data Export Pipeline
├─ Origin: Moonshot
├─ Stage: approval_pending
├─ Current Agent: Clawson
├─ Status: ⏳ Awaiting Decision
└─ Decision needed: APPROVE/REVISE/REJECT
```

### Data Schema

**File:** `data/mission-control/workstreams.json`

```json
{
  "timestamp": "2026-03-04T15:08:00Z",
  "active_workstreams": [
    {
      "workstream_id": "ws_001",
      "title": "Customer API Integration",
      "origin_agent": "moonshot",
      "moonshot_id": "idea_001",
      "current_stage": "specification",
      "current_agent": "moonshot",
      "status": "in_progress",
      "last_update": "2026-03-04T15:00:00Z",
      "timeline": {
        "started": "2026-03-01",
        "estimated_completion": "2026-03-08",
        "days_elapsed": 3,
        "days_remaining": 4
      },
      "stages_completed": ["idea"],
      "next_stage": "proposal",
      "linked_work": {
        "cr_id": null,
        "build_id": null
      }
    }
  ],
  "summary": {
    "total_active": 0,
    "by_stage": {
      "idea": 0,
      "specification": 0,
      "proposal": 0,
      "approval_pending": 0,
      "change_request": 0,
      "implementation": 0,
      "experiment": 0,
      "results": 0
    }
  }
}
```

### Update Frequency
- **Real-time:** Stage changes, status updates
- **Hourly:** Progress tracking, days remaining
- **Daily:** Summary counts

---

## ENHANCEMENT 2: BLOCKED WORK DETECTION

### Purpose
Surface tasks and workstreams that cannot progress due to approvals, dependencies, or external requirements

### Blocked Status Conditions

```
awaiting_approval    → Waiting for Clawson decision
missing_dependency   → Waiting for external service/data
external_requirement → Blocked by non-system factor
resource_unavailable → Waiting for agent capacity/bandwidth
internal_blocker     → Waiting for other work to complete
```

### Mission Control Display: BLOCKED WORK

```
🚫 BLOCKED WORK (3 items)

⏳ Moonshot Idea #14
   Blocker: Awaiting Clawson approval
   Since: 2 days
   Action: Clawson review needed
   Unblocks: When APPROVE/REVISE/REJECT

⏳ Codesmith Build #5
   Blocker: Missing API credentials
   Since: 1 day
   Action: Waiting for external service
   Unblocks: When credentials provided

⏳ Moonshot Experiment #3
   Blocker: Production environment not ready
   Since: 3 hours
   Action: DevOps dependency
   Unblocks: When env deployed
```

### Data Schema

**File:** `data/mission-control/blocked_work.json`

```json
{
  "timestamp": "2026-03-04T15:08:00Z",
  "blocked_items": [
    {
      "blocked_id": "blocked_001",
      "workstream_id": "ws_002",
      "type": "venture_approval",
      "title": "Data Export Pipeline — Awaiting Clawson",
      "blocked_since": "2026-03-02T10:00:00Z",
      "days_blocked": 2.2,
      "blocker_type": "awaiting_approval",
      "blocker_details": {
        "waiting_for": "Clawson decision",
        "options": ["APPROVE", "REVISE", "REJECT"],
        "current_owner": "Clawson"
      },
      "priority": "medium",
      "impact": "Blocks engineering work",
      "unblocks_when": "Clawson makes decision",
      "escalation_threshold_hours": 24
    }
  ],
  "summary": {
    "total_blocked": 3,
    "by_type": {
      "awaiting_approval": 1,
      "missing_dependency": 1,
      "external_requirement": 1,
      "resource_unavailable": 0
    },
    "oldest_blocker_hours": 72,
    "critical_blockers": 0
  }
}
```

### Alert Rules

```
⚠️ ESCALATE if:
  • Approval waiting >24 hours
  • External blocker >48 hours
  • Critical work blocked >4 hours
  • Multiple blockers on same workstream
```

### Integration with Sections

**Appears in:**
- Active Work section (highlighted)
- System Health alerts (if critical)
- Workstream Flow (status marker)

---

## ENHANCEMENT 3: OPPORTUNITY VELOCITY METRIC

### Purpose
Top-line venture performance metric: **validated ventures per quarter**

### Definition

```
Opportunity Velocity = Ventures reaching GO status per quarter

Example: 3 ventures validated in Q1 2026 = 3 OV

Trend: UP if more ideas → GO each week
       DOWN if fewer ideas → GO each week
       STABLE if consistent rate
```

### Schema

```json
{
  "opportunity_velocity": {
    "value": 0,
    "unit": "ventures_per_quarter",
    "quarter": "Q1_2026",
    "start_date": "2026-03-04",
    "end_date": "2026-06-03",
    "timestamp": "2026-03-04T15:08:00Z",
    "source": "moonshot_pipeline",
    "trend": "stable",
    "trailing_quarters": {
      "q1_2026": 0,
      "estimate_q2_2026": 3,
      "estimate_q3_2026": 5
    },
    "success_rate": 0.4,
    "ideas_in_pipeline": 12
  }
}
```

### Mission Control Header Display

```
TOP BAR:
System Health ✅ | Opportunity Velocity: 0 (Q1) ⚪ | Agents: 4/4
```

As ventures validate:
```
TOP BAR:
System Health ✅ | Opportunity Velocity: 1 (Q1) ↑ | Agents: 4/4
```

### Update Frequency
- **Daily:** Count update if venture reaches GO
- **Weekly:** Trend calculation
- **Quarterly:** Reset for new quarter

---

## ENHANCEMENT 4: PIPELINE → WORK LINKING

### Purpose
Automatically surface ventures in **Active Work** section when they move to execution stages

### Linking Rule

When a venture enters any of these stages:
```
stage 5: change_request
stage 6: implementation
stage 7: experiment
```

It **automatically appears in Active Work** with:
- Venture ID
- Current stage
- Assigned agent
- Estimated completion
- Status

### Example: Active Work with Pipeline Linking

```
🚀 ACTIVE WORK

BUILD IN PROGRESS
├─ Venture: Data Export Pipeline (ws_002)
├─ Stage: Implementation (Week 1 of 3)
├─ Agent: Codesmith
├─ Quality Gates: 5/7 passing
└─ Est. Complete: March 15

EXPERIMENT RUNNING
├─ Venture: Customer API Integration (ws_001)
├─ Stage: Experiment (Week 2 of 2)
├─ Agent: Moonshot (monitoring)
├─ Metric: API adoption rate
├─ Target: >50% adoption
└─ Est. Results: March 10

BLOCKED WORK
├─ Venture: Performance Analytics (ws_003)
├─ Stage: Approval pending
├─ Waiting: Clawson decision
└─ Since: 2 days
```

### Data Schema

**File:** `data/mission-control/venture_work_links.json`

```json
{
  "timestamp": "2026-03-04T15:08:00Z",
  "linked_work": [
    {
      "venture_id": "idea_001",
      "workstream_id": "ws_001",
      "stage": "implementation",
      "assigned_agent": "codesmith",
      "cr_id": "cr_001",
      "estimated_completion": "2026-03-15",
      "progress_percent": 60,
      "status": "in_progress"
    }
  ]
}
```

### Update Frequency
- **Real-time:** When venture moves to execution stage
- **Hourly:** Progress updates

---

## ENHANCEMENT 5: UI STRUCTURE SPECIFICATION (FUTURE BUILD)

### Purpose
Define layout for Codesmith to build the future Mission Control UI dashboard

### Layout Specification

```
┌──────────────────────────────────────────────────────────────┐
│                      TOP BAR                                  │
│  System Health ✅ | Opportunity Velocity | Agents Status      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────┬────────────────────┐
│                  │                      │                    │
│   LEFT PANEL     │   CENTER PANEL       │   RIGHT PANEL      │
│                  │                      │                    │
│   Agent Activity │ Active Work          │ Venture Pipeline   │
│   ─────────────  │ Workstream Flow      │ ────────────────   │
│   • Clawson      │ Blocked Work         │ Stage 1: Idea Gen  │
│   • Codesmith    │                      │ Stage 2: Spec      │
│   • Moonshot     │ (Real-time progress) │ Stage 3: Proposal  │
│   • PA           │                      │ ... (7 stages)     │
│                  │                      │                    │
└──────────────────┴──────────────────────┴────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    BOTTOM PANEL                               │
│  Blocked Work Alerts + System Alerts + Recent Activity        │
└──────────────────────────────────────────────────────────────┘
```

### Component Specifications

**TOP BAR (Header)**
```
Width: Full
Height: 60px
Elements:
  • System Health indicator (green/yellow/red)
  • Opportunity Velocity metric + trend
  • Agent status count (X/4 online)
  • Current timestamp
```

**LEFT PANEL (Agent Status)**
```
Width: 20%
Height: Scrollable
Elements:
  • Agent cards (4 total)
  • Status dot + name
  • Uptime % + current task
  • Tasks executed today
  • Click → drill-down details
```

**CENTER PANEL (Active Work)**
```
Width: 50%
Height: Scrollable
Sections:
  1. Workstream Flow (active workstreams)
  2. Blocked Work (with escalation markers)
  3. Task progress bars
  4. Real-time updates
```

**RIGHT PANEL (Venture Pipeline)**
```
Width: 30%
Height: Scrollable
Sections:
  1. Pipeline stages (7 columns)
  2. Idea counts per stage
  3. Success rate progress
  4. Click stage → see ideas in that stage
```

**BOTTOM PANEL (Alerts)**
```
Width: Full
Height: 100-200px (expandable)
Shows:
  • Blocked work items (red)
  • System alerts (yellow)
  • Recent completions (green)
  • Oldest blocker counter
```

### Interaction Spec

```
Click on workstream:
  → Show full workstream details
  → View timeline
  → See linked CR/build

Click on agent:
  → Show detailed session logs
  → View model used
  → See tasks executed

Click on blocker:
  → Show details
  → Suggested action
  → Escalation history

Real-time updates:
  → Workstream progress (every minute)
  → Agent status (heartbeat)
  → Blocked work (every 5 min)
  → Pipeline counts (every hour)
```

---

## ENHANCEMENT 6: DATA STRUCTURE ADDITIONS

### New Files Under `data/mission-control/`

```
data/mission-control/
├── metrics.json (existing)
├── workstreams.json (NEW)
│   └─ Active workstreams + stage tracking
├── blocked_work.json (NEW)
│   └─ Blocked items + escalation info
├── venture_velocity.json (NEW)
│   └─ Opportunity velocity metric + trends
├── venture_work_links.json (NEW)
│   └─ Pipeline → Work mapping
├── hourly/ (existing)
│   ├─ 2026-03-04-14.json
│   ├─ 2026-03-04-15.json
│   └─ ...
├── daily/ (existing)
│   ├─ 2026-03-04.json
│   └─ ...
└── weekly/ (existing)
    └─ 2026-w10.json
```

### Storage Snapshots

**Snapshot frequency:**
- **workstreams.json:** Updated real-time, snapshot hourly
- **blocked_work.json:** Updated real-time, snapshot every 15 min
- **venture_velocity.json:** Updated daily, snapshot daily
- **venture_work_links.json:** Updated real-time, snapshot hourly

**Archival:**
```
data/mission-control/
└── archive/
    ├── workstreams/
    │   └─ 2026-03-04-15.json
    ├── blocked_work/
    │   └─ 2026-03-04-15-30.json
    └── venture_velocity/
        └─ 2026-03-04.json
```

---

## ENHANCEMENT 7: GOVERNANCE & VALIDATION

### Schema Validation

All new structures must pass:
- ✅ JSON schema validation
- ✅ Type checking (workstream_id, agent names, etc)
- ✅ Timestamp validation (ISO8601)
- ✅ Reference validation (workstream → venture links)
- ✅ Stage validation (only valid stages in stage field)

### Breaking Change Assessment

**No breaking changes:**
- ✅ Existing sections remain intact
- ✅ Existing data structures unchanged
- ✅ Backward compatible (new files added, not modified)
- ✅ Gradual rollout possible

### Drift Protection

Drift audit updated to check:
- ✅ New files (`workstreams.json`, `blocked_work.json`, etc) exist
- ✅ Canonical paths preserved
- ✅ No unauthorized structures created
- ✅ Version alignment (2.3.0)

### Compilation Impact

```
✅ Configs recompiled (v1.0.0-20260304_150407)
✅ No new cron jobs required (update existing export jobs)
✅ No new agent routes
✅ No new integrations
✅ Version bumped to 2.3.0
```

---

## VERSION HISTORY

```
v2.0.0 (2026-03-04 14:48 EST)
  • Initial architecture + schema

v2.1.0 (2026-03-04 14:59 EST)
  • CRM isolation policy
  • Baseline reset (2026-03-04)
  • Metrics refocus (executive only)

v2.2.0 (2026-03-04 15:02 EST)
  • Refocus to command center
  • Agent Activity → PRIMARY
  • Active Work section → PRIMARY
  • Business metrics → SECONDARY

v2.3.0 (2026-03-04 15:08 EST) — THIS AMENDMENT
  • Workstream Flow Visibility
  • Blocked Work Detection
  • Opportunity Velocity Metric
  • Pipeline → Work Linking
  • UI Structure Specification
  • Data structure additions
  • Enhanced governance
```

---

## SUMMARY OF CHANGES

### Files Modified
- ✅ `canon/system/mission_control_v2.md` (v2.2.0 → v2.3.0)

### Files Created
- ✅ `canon/system/mission_control_v2_enhancements.md` (this file)

### Data Structures Added
- ✅ `data/mission-control/workstreams.json`
- ✅ `data/mission-control/blocked_work.json`
- ✅ `data/mission-control/venture_velocity.json`
- ✅ `data/mission-control/venture_work_links.json`

### Schema Extensions
- ✅ Workstream object definition
- ✅ Blocked item object definition
- ✅ Opportunity velocity metric definition
- ✅ Work link definition

### UI Specifications
- ✅ Layout structure (5 panels)
- ✅ Component specifications
- ✅ Interaction model
- ✅ Ready for future Codesmith implementation

### Governance
- ✅ Schema validation rules
- ✅ Breaking change assessment: None
- ✅ Drift protection: Enhanced
- ✅ Version: 2.3.0
- ✅ Compilation: Ready

---

_Amendment Date: 2026-03-04 15:08 EST_  
_Amendment Type: Enhancements (non-breaking)_  
_Status: Ready for implementation_
