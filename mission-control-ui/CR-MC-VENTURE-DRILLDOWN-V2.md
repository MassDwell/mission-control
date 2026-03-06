# Change Request: CR-MC-VENTURE-DRILLDOWN-V2

**Title:** Mission Control UI — Robust Venture Drilldown (V2)  
**Date:** 2026-03-05 11:49 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P1 (Decision-Grade Visibility)  
**Scope:** Mission Control UI venture detail view  
**Timeline:** 2-3 weeks  
**Status:** PROPOSED (awaiting approval)  

---

## EXECUTIVE SUMMARY

Upgrade Mission Control venture detail drawer from minimal (name/status/last event) to **decision-grade** full view with:
- ✅ Multi-section detail view (header, timeline, artifacts, workstreams, blockers, checklists, metrics)
- ✅ SSOT-only data (no fabrication, no external deps)
- ✅ Activity timeline filtered by venture
- ✅ Workstream execution view (linked to venture)
- ✅ Blocker tracking with SLA timers
- ✅ Phase gate checklists (spec → deploy)
- ✅ Venture metrics + KPIs (if available)

**Result:** Operators can inspect any venture, understand its status, see blockers, and understand next actions — without hunting through files.

---

## PROBLEM STATEMENT

Current venture drilldown shows:
- Name
- Status badge
- Owner
- Last event (1 line)

Operators cannot:
- See what's blocking this venture
- Understand its timeline/lifecycle
- Review artifacts (PRD, CR, repo)
- See linked workstreams
- Check phase gate readiness
- Understand success criteria
- Track execution progress

Result: Operators default to CLI/file browser for venture inspection.

---

## HARD CONSTRAINTS (OPERATOR LOCK)

### 1. Read-Only UI
- ✅ No mutations to SSOT files from UI
- ✅ No changes to /canon, /config, /scripts
- ✅ Venture detail is **inspection only**, not edit

### 2. SSOT Authority
- ✅ All displayed data must come from SSOT JSON files
- ✅ Never invent missing fields
- ✅ Never show schema keys like "timestamp" or "items"
- ✅ If data missing → show "No data available"
- ✅ Always cite source file + lastUpdated timestamp

### 3. No External Dependencies
- ✅ No Supabase
- ✅ No external services
- ✅ API reads SSOT directly

### 4. Fail Loud
- ✅ If SSOT unreadable → show error, not fake data
- ✅ Missing fields → explicit "Not available" message
- ✅ No silent failures

---

## SSOT INPUT FILES

**Current (Verified to Exist):**
```
✅ data/mission-control/venture_scoreboard.json
   (Ventures with: name, stage, status, owner, priority, links, last_event, metrics, timeline_weeks, started_date)

✅ data/mission-control/workstreams.json
   (Active work: phases, stages, assignments)

✅ data/mission-control/venture_work_links.json
   (Maps: venture_id → workstream_ids)

✅ data/mission-control/blocked_work.json
   (Blockers: type, owner, created_at, SLA)

✅ data/mission-control/venture_velocity.json
   (Metrics: stage counts, success rates, time-to-MVP)

✅ data/mission-control/agent_activity.json
   (Activity log: all events, venture-tagged if available)
```

**Proposed (To Be Created):**
```
📝 data/mission-control/ventures.json
   (Optional enrichment: checklists, metrics, detailed timelines)
```

---

## FEATURE REQUIREMENTS

### A. Stage Tile Click → Venture List (Enhance Current)

**Current behavior (keep):**
- Click stage tile → drilldown drawer opens
- Shows ventures in that stage

**Enhance:**
- Add venture count to drawer header
- Add lastUpdated timestamp (from venture_scoreboard.json)
- Add quick badges on each row:
  - **Priority**: High/Med/Low (color-coded)
  - **Health**: Healthy/Warning/Critical (derived from blockers)
  - **Owner**: Agent name (moonshot/codesmith/clawson)
  - **Blocked**: Yes/No (if any blockers reference this venture)
- Sort options: Last Event (default), Priority (desc), Owner (a-z)

**Example row:**
```
LeadScore.ai | [High Priority] [Healthy] [Codesmith] [Not Blocked]
Last event: Week 1 backend build started (2h ago)
```

---

### B. Venture Click → Venture Detail Drawer (NEW, Primary Feature)

When a venture is clicked in the drilldown, open a **full-width or right-panel drawer** with these sections (in order):

#### **1) HEADER SECTION**
```
┌─────────────────────────────────────────┐
│ LeadScore.ai [leadscore]                │
│                                         │
│ Stage: In Progress  │  Status: Active   │
│ Owner: Codesmith    │  Priority: High   │
│ Health: Healthy ✅  │  Created: 2d ago  │
│                                         │
│ Last Updated: 2026-03-05T06:15Z         │
│ Source: venture_scoreboard.json          │
└─────────────────────────────────────────┘
```

**Fields:**
- Venture name + slug (from venture_scoreboard.json)
- Current stage (one of: Opportunity, Qualified, In Progress, Due Diligence, Negotiation, Approval, Closing, Closed)
- Status badge (active | paused | killed | launched)
- Owner (agent name)
- Priority (High/Med/Low)
- Health badge (Healthy | ⚠️ Warning | 🚨 Critical)
  - Healthy = no critical blockers
  - Warning = 1+ warning blockers
  - Critical = 1+ critical blockers OR stale data
- Timeline (e.g., "3 days in current stage" or "Week 1 of 8")
- Last Updated timestamp + source file citation

---

#### **2) TIMELINE SECTION** (Most Important)
```
┌─ TIMELINE ──────────────────────────────┐
│ View: [Last 24h] [Last 7d] [Last 30d]   │
│                                          │
│ 11:23 AM  Clawson: SEV-1 verification  │
│ [INFO]    complete — Gmail OAuth       │
│           Bulletproof                  │
│                                          │
│ 2:15 PM   Personal Assistant: Gmail    │
│ [INFO]    OAuth token healthy          │
│                                          │
│ 6:15 AM   Codesmith: Week 1 backend    │
│ [INFO]    build started                │
│                                          │
│ Show all (39 total) ↓                   │
└─────────────────────────────────────────┘
```

**Implementation:**
- Pull from `agent_activity.json` where:
  - `description` OR `action` contains venture name/slug
  - OR (future) `meta.venture_id` matches
- Show: timestamp, severity badge, agent, action, description
- Provide time filter: Last 24h / 7d / 30d / all
- Sort: descending (newest first)
- Source citation: "agent_activity.json (lastUpdated)"

---

#### **3) ARTIFACTS & LINKS SECTION**
```
┌─ ARTIFACTS & LINKS ─────────────────────┐
│                                          │
│ 📄 Product Requirements Document        │
│    /ventures/leadscore/docs/prd.md      │
│    [Copy Path]                          │
│                                          │
│ 📋 Change Request                       │
│    CR-LEADSCORE-001                     │
│    /ventures/leadscore/...              │
│    [Copy Path]                          │
│                                          │
│ 💾 Repository                           │
│    /ventures/leadscore                  │
│    [Copy Path]                          │
│                                          │
│ 🎬 Demo URL                             │
│    Not available yet                    │
└─────────────────────────────────────────┘
```

**Implementation:**
- From `venture_scoreboard.json.links`:
  - `prd` → Show link + copy button
  - `cr` → Show CR number + link + copy button
  - `repo_path` → Show path + copy button
  - `demo_url` → Show if present, else "Not available"
- If no links: "No artifacts linked yet"
- Copy buttons should copy path to clipboard with feedback
- Source: "venture_scoreboard.json"

---

#### **4) WORKSTREAMS SECTION** (Execution View)
```
┌─ LINKED WORKSTREAMS ────────────────────┐
│ 3 workstreams driving this venture      │
│                                          │
│ ✓ backend-api-scaffolding               │
│   Phase: Implementation  │  90% done    │
│   Assigned: codesmith    │  ETA: 3/8   │
│   Last: Added error handling (1h ago)   │
│   [View Details]                        │
│                                          │
│ ◔ worker-job-processor                  │
│   Phase: Investigation  │  20% done     │
│   Assigned: codesmith    │  ETA: 3/12  │
│   Last: Scoping batch architecture (2h)│
│   [View Details]                        │
│                                          │
│ ○ web-dashboard-alpha                   │
│   Phase: Design         │  5% done      │
│   Assigned: codesmith    │  ETA: 3/15  │
│   Last: User flow review (1d ago)       │
│   [View Details]                        │
│                                          │
│ No workstreams → "No workstreams linked"│
└─────────────────────────────────────────┘
```

**Implementation:**
- From `venture_work_links.json[venture_id]` → get list of workstream IDs
- For each, look up in `workstreams.json`:
  - workstream name/id
  - phase/stage
  - percent_complete (if available)
  - assigned_to (agent)
  - eta (date)
  - last_event (most recent activity)
- Status indicator (● = planned, ◔ = in progress, ✓ = done)
- [View Details] button → opens Workstream Detail subview (see below)
- If none: "No workstreams linked yet"
- Source: "venture_work_links.json + workstreams.json"

**Workstream Detail Subview (Click [View Details]):**
```
┌─ WORKSTREAM: backend-api-scaffolding ───┐
│                                          │
│ Assigned: codesmith                      │
│ Timeline: Phase 1 of 4 (Backend)        │
│ ETA: 2026-03-08                         │
│ Progress: 90% (18 of 20 tasks)          │
│                                          │
│ Stage Progression:                      │
│ ✓ Design         │ Started: 3/2, Done: 3/3  │
│ ✓ Scaffolding    │ Started: 3/3, Done: 3/5  │
│ ◔ Implementation │ Started: 3/5, In progress│
│ ○ Testing        │ Not started               │
│                                          │
│ Recent Events:                          │
│ • Added error handling (1h ago)         │
│ • Completed config module (3h ago)      │
│ • Started endpoints (6h ago)            │
│                                          │
│ Blockers: None                          │
│                                          │
│ [Back to Venture] [View in Timeline]    │
└─────────────────────────────────────────┘
```

---

#### **5) BLOCKERS SECTION** (Decision View)
```
┌─ BLOCKERS ──────────────────────────────┐
│ 0 blockers                              │
│ This venture is unblocked ✅            │
│                                          │
│ (If blockers exist:)                    │
│ ┌─ CRITICAL ──────────────────────────┐ │
│ │ Approval: CEO sign-off required    │ │
│ │ Owner: Steve Vettori              │ │
│ │ Created: 3d 2h ago                │ │
│ │ SLA: Overdue by 8h ⚠️             │ │
│ │ Next Action: Email Steve recap    │ │
│ │ [View Full] [Resolve]             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ WARNING ───────────────────────────┐ │
│ │ Dependency: Waiting for AAC Steel │ │
│ │ Owner: Thayana Fernandes          │ │
│ │ Created: 1d 4h ago                │ │
│ │ SLA: 6h remaining ⏱️              │ │
│ │ Next Action: Check delivery date  │ │
│ │ [View Full] [Resolve]             │ │
│ └──────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Implementation:**
- From `blocked_work.json.items` where venture_id matches OR linked workstream ID matches
- For each blocker:
  - type (approval | dependency | auth | failure | other)
  - owner (who's responsible for unblocking)
  - created_at (when did it block)
  - severity (critical | warning | info)
  - next_action (string: what needs to happen)
  - SLA timer: how long blocked + "Overdue by X" or "Y remaining"
- Color code by severity
- [View Full] → show extended details
- If no blockers: "No blockers. This venture is unblocked ✅"
- Source: "blocked_work.json"

---

#### **6) CHECKLIST SECTION** (Phase Gate)
```
┌─ PHASE GATE CHECKLIST ──────────────────┐
│ Current Phase: Implementation           │
│                                          │
│ ✅ Specification complete               │
│ ✅ PRD approved                         │
│ ✅ CR reviewed and approved             │
│ ◔ Backend scaffolding (90% done)        │
│ ◔ Worker integration (20% done)         │
│ ○ Frontend dashboard (0% done)          │
│ ○ Tests passing (TBD)                   │
│ ○ Deploy verified (TBD)                 │
│ ○ Beta launch (TBD)                     │
│                                          │
│ Readiness: 67% → Can proceed to next ✅│
│                                          │
│ Not tracked yet → "Not tracked yet"     │
└─────────────────────────────────────────┘
```

**Implementation:**
- Checklists are stage-dependent (Opportunity vs In Progress vs Closed)
- Derive checkmarks from SSOT fields:
  - ✅ if field is present + truthy
  - ◔ if field is present but partial (e.g., 50%)
  - ○ if field absent/null
  - ⚠️ if field is stale (last_event > 7 days old)
- **Never fabricate** missing fields
- If field doesn't exist: "Not tracked yet"
- Readiness percentage: (checked items / total items) × 100
- Source: "venture_scoreboard.json + workstreams.json"

**Example mappings by stage:**

| Stage | Checklist | Derives From |
|-------|-----------|--------------|
| **In Progress** | Spec ✅, PRD ✅, CR ✅, Backend ◔, Worker ◔, Web ○, Tests ○, Deploy ○ | links, stage, workstreams |
| **Opportunity** | Idea ✅, Research ◔, Memo ?, | last_event, started_date |
| **Closed** | All ✅ | stage == "Closed" |

---

#### **7) METRICS SECTION** (KPIs & Success Criteria)
```
┌─ VENTURE METRICS ───────────────────────┐
│                                          │
│ Success Targets:                        │
│ • Accuracy: 85% (target)                │
│ • NPS: 30+ (target)                     │
│ • Customers: 5 (target)                 │
│ • MRR: $1,000/mo (target)               │
│                                          │
│ Execution Metrics:                      │
│ • Time to MVP: 8 weeks (target)         │
│ • Current Time in Stage: 2 days         │
│ • Deploy Count: 0                       │
│ • Incident Count: 0                     │
│ • Last Deploy: N/A                      │
│                                          │
│ (If no metrics: "No venture metrics yet")│
└─────────────────────────────────────────┘
```

**Implementation:**
- From `venture_scoreboard.json.metrics`:
  - accuracy_target, nps_target, customers_target, mrr_target
- From `venture_velocity.json`:
  - time-to-MVP, current stage duration
- If fields exist: show them
- If missing: omit, don't show "null" or schema names
- Source: "venture_scoreboard.json + venture_velocity.json"

---

## DATA ADDITIONS: PROPOSED ventures.json

**Status:** Optional (nice-to-have, not blocking)

**Purpose:** Centralize venture-specific metadata that doesn't fit in venture_scoreboard.json

**Proposed Schema:**
```json
{
  "lastUpdated": "2026-03-05T12:00:00.000Z",
  "ventures": [
    {
      "venture_id": "leadscore",
      "checklist": {
        "spec_complete": { checked: true, date: "2026-03-04", notes: "Spec approved" },
        "prd_approved": { checked: true, date: "2026-03-04", notes: "3 iterations" },
        "cr_approved": { checked: true, date: "2026-03-05", notes: "CR-LEADSCORE-001" },
        "backend_scaffolding": { checked: 0.9, date: "2026-03-05T10:30Z", notes: "18 of 20 tasks" },
        "worker_integration": { checked: 0.2, date: "2026-03-05T09:00Z", notes: "Architecture review" },
        "frontend_dashboard": { checked: 0, date: null, notes: "Not started" },
        "tests_passing": { checked: null, date: null, notes: "Not tracked" },
        "deploy_verified": { checked: null, date: null, notes: "Not tracked" }
      },
      "timelines": {
        "started_date": "2026-03-05",
        "target_completion": "2026-04-30",
        "phases": [
          {
            "name": "Backend Scaffolding",
            "order": 1,
            "started": "2026-03-05",
            "target_end": "2026-03-08",
            "actual_end": null,
            "status": "in_progress"
          }
        ]
      },
      "health_summary": {
        "status": "healthy",
        "last_health_check": "2026-03-05T06:15Z",
        "critical_blockers": 0,
        "warning_blockers": 0,
        "stale_data": false
      }
    }
  ]
}
```

**Note:** Create this file if/when checklists and detailed phase tracking are needed. For MVP, venture_scoreboard.json is sufficient.

---

## API ENDPOINTS (Extend /api/ventures/:venture_id)

**Current response (to enhance):**
```json
{
  "venture": {...},
  "related_workstreams": [...],
  "blockers": [...],
  "recent_activity": [...]
}
```

**Enhanced response (add these):**
```json
{
  "venture": {...},
  "related_workstreams": [...],
  "blockers": [...],
  "recent_activity": [...],
  "health": {
    "status": "healthy|warning|critical",
    "critical_blocker_count": 0,
    "warning_blocker_count": 0,
    "stale_data_since": null
  },
  "sources": {
    "venture": "venture_scoreboard.json",
    "workstreams": "venture_work_links.json + workstreams.json",
    "blockers": "blocked_work.json",
    "activity": "agent_activity.json"
  }
}
```

---

## UI IMPLEMENTATION ROADMAP

### Phase 1: Data Layer (Week 1)
- [ ] Extend `/api/ventures/:venture_id` endpoint
- [ ] Add health calculation logic
- [ ] Add activity filtering by venture
- [ ] Add workstream linking logic
- [ ] Test endpoints with curl

### Phase 2: UI Components (Week 2)
- [ ] Create venture detail drawer component
- [ ] Build header section (name, stage, owner, health)
- [ ] Build timeline section (activity stream, time filters)
- [ ] Build artifacts section (links + copy buttons)
- [ ] Build workstreams section (list + detail subview)
- [ ] Build blockers section (severity-coded list)
- [ ] Integrate into existing drilldown

### Phase 3: Detail Sections (Week 2-3)
- [ ] Build checklist section (phase gates)
- [ ] Build metrics section (KPIs)
- [ ] Add data source citations (every section)
- [ ] Add error handling (missing data → "No data available")
- [ ] Test Operator Lock constraints

### Phase 4: Polish & Testing (Week 3)
- [ ] Responsive layout (desktop / tablet)
- [ ] Performance (load <500ms for 100+ ventures)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] All tests passing (unit + integration + smoke)
- [ ] Verification report + screenshots

---

## TESTING CHECKLIST

**Functional:**
- [ ] Click venture in drilldown → detail drawer opens
- [ ] All sections render correctly (header, timeline, artifacts, workstreams, blockers, checklist, metrics)
- [ ] Missing data shows "No data available" (not schema keys)
- [ ] Copy buttons work (artifacts section)
- [ ] Time filters work (timeline: 24h / 7d / 30d)
- [ ] [View Details] workstream subview opens/closes correctly
- [ ] Blockers show correct severity colors
- [ ] Checklist shows correct progress % and readiness
- [ ] Metrics display correctly (or "No metrics yet")

**Data Integrity:**
- [ ] All data sourced from SSOT files only
- [ ] Source file + lastUpdated shown for each section
- [ ] No mutations to SSOT files
- [ ] No external API calls (no Supabase)
- [ ] Fail-loud on read errors (show error, not fake data)

**Operator Lock:**
- [ ] Read-only UI (no edits possible)
- [ ] No changes to /canon, /config, /scripts
- [ ] No synthetic data generation
- [ ] No schema field names shown to user
- [ ] All metrics verified against SSOT sources

**Performance:**
- [ ] Drawer opens < 500ms
- [ ] Timeline renders < 100ms (for 40+ activities)
- [ ] All sections < 1s total load
- [ ] No UI lag on scroll/filter

**Quality Gates:**
- [ ] ESLint clean (0 errors)
- [ ] No console errors
- [ ] No hardcoded paths
- [ ] Drift audit clean
- [ ] All tests passing

---

## CONSTRAINTS & GUARDRAILS

### Hard Rules (Non-Negotiable)
1. ✅ **SSOT Authority** — All data from JSON files, never invented
2. ✅ **Read-Only** — No mutations to system files
3. ✅ **No External Deps** — No Supabase, no external APIs
4. ✅ **Fail Loud** — Errors shown, not silent failures
5. ✅ **Data Citations** — Every section shows source file + timestamp

### Soft Guidelines
- Keep component modular (detail drawer = composed of sections)
- Reuse existing styles/colors where possible
- Dark theme consistent with current MC UI
- Keyboard accessible (Tab, Enter, Esc)

---

## SUCCESS CRITERIA

✅ **Operator can inspect any venture without hunting files**  
✅ **All data verifiable from SSOT sources**  
✅ **Missing data shown explicitly ("No data available")**  
✅ **Timeline shows venture-specific activity**  
✅ **Workstreams and blockers visible at a glance**  
✅ **Phase gate checklist shows readiness**  
✅ **Metrics/KPIs visible if available**  
✅ **No mutations to system files**  
✅ **No external dependencies**  
✅ **Fail-loud pattern enforced**  
✅ **All tests passing**  
✅ **Drift audit clean**  

---

## ROLLBACK PLAN

```bash
# Simple rollback: revert to pre-CR version
git revert <commit-hash>

# This removes the detail drawer but keeps:
# - Stage tile drilldown (list view)
# - API endpoints
# - SSOT files intact

# Restart server
cd mission-control-ui && npm start
```

**Impact:** Users see venture list but cannot drill into detail. System operational.

---

## APPROVAL & HANDOFF

**Requested By:** Steve Vettori (2026-03-05 11:49 EST)  
**Status:** PROPOSED  
**Awaiting:** Approval to proceed

**Next:** Codesmith begins Phase 1 (data layer + API endpoints)

---

**CR ID:** CR-MC-VENTURE-DRILLDOWN-V2  
**Date:** 2026-03-05 11:49 EST  
**Scope:** ~2-3 weeks, 1 engineer (Codesmith)  
**Risk:** Low (read-only, SSOT-only, well-scoped)  
**Acceptance:** Full venture detail view with all sections, SSOT-sourced, fail-loud constraints enforced
