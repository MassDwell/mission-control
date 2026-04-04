# CHANGE REQUEST: Mission Control UI V1 Build

**CR ID:** CR-002  
**Date Created:** 2026-03-04 15:17 EST  
**Status:** APPROVED (by Clawson on behalf of Steve Vettori)  
**Risk Tier:** MEDIUM  
**Assigned to:** Codesmith  
**Est. Effort:** 3-5 days  

---

## OBJECTIVE

Build a lightweight, read-only Mission Control dashboard interface that provides real-time operational visibility into the AI system using existing Mission Control V2.3.0 data structures.

This is **Phase 3** of Mission Control development (after architecture in Phase 1, and enhancement in Phase 2).

---

## REQUIREMENTS

### Data Sources (Read-Only)

```
data/mission-control/workstreams.json
  └─ Active workstreams + stage tracking
  └─ Read every 10 seconds

data/mission-control/blocked_work.json
  └─ Blocked items + escalation info
  └─ Read every 10 seconds

data/mission-control/venture_velocity.json
  └─ Opportunity velocity metric + trends
  └─ Read every 10 seconds

data/mission-control/venture_work_links.json
  └─ Pipeline → work mapping
  └─ Read every 10 seconds
```

**No modifications to any data structures.**

---

## UI LAYOUT SPECIFICATION

### TOP BAR (60px, Full Width)
```
[System Health Status] | [Opportunity Velocity] | [Agents Status] | [Time]

Elements:
  • System Health: Green/Yellow/Red dot + uptime %
  • Opportunity Velocity: Current ventures/quarter + trend arrow
  • Agents: "4/4 Online" or count of online agents
  • Current timestamp (updates every 10s)
```

### LEFT PANEL (20% width, Scrollable)
```
AGENT ACTIVITY

[Agent 1: Clawson]
  • Status: ● Online
  • Uptime: 98.5%
  • Current: [task name or "Idle"]
  • Tasks today: 12

[Agent 2: Codesmith]
  • Status: ● Online
  • Uptime: 100%
  • Current: [task name or "Idle"]
  • Tasks today: 0

[Agent 3: Moonshot]
  • Status: ● Online
  • Uptime: 95%
  • Current: [task name or "Idle"]
  • Tasks today: 0

[Agent 4: Personal Assistant]
  • Status: ● Online
  • Uptime: 99%
  • Current: [task name or "Idle"]
  • Tasks today: 8
```

### CENTER PANEL (50% width, Scrollable)
```
ACTIVE WORK

[Workstream Card 1]
┌─────────────────────────┐
│ ws_001: Name            │
│ Stage: specification    │
│ Agent: moonshot         │
│ Progress: ▓▓░░░░░░░░ 30%│
│ Est. Complete: Mar 8    │
└─────────────────────────┘

[Workstream Card 2]
... (repeat as needed)

BLOCKED WORK

[Blocked Item 1]
┌─────────────────────────┐
│ ⚠️ Awaiting Approval    │
│ Item: Idea #14          │
│ Since: 2 days           │
│ Impact: Blocks build    │
└─────────────────────────┘

[Blocked Item 2]
... (repeat as needed)
```

### RIGHT PANEL (30% width, Scrollable)
```
VENTURE PIPELINE

Stage 1: Idea Generation
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢ (visual bar)

Stage 2: Specification
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢

Stage 3: Proposal
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢

Stage 4: Approval Pending
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢

Stage 5: Change Request
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢

Stage 6: Implementation
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢

Stage 7: Experiment
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢

Stage 8: Results
  Count: 0
  ▢▢▢▢▢▢▢▢▢▢

Success Rate: —— (target: ≥40%)
```

### BOTTOM PANEL (100-200px, Expandable)
```
ALERTS + SYSTEM STATUS

[No alerts] ✅
or
[Alert 1] ⚠️ Mission Control data stale (>1 min)
[Alert 2] ⚠️ Cron job failed: mission_control_morning_brief
[Alert 3] ❌ Agent offline: [agent_name]
```

---

## TECHNICAL STACK

### Backend
- **Framework:** Node.js (Express or similar)
- **Port:** localhost:3000 (configurable)
- **File Watcher:** Watch `data/mission-control/` for changes
- **Refresh:** Auto-read JSON every 10 seconds

### Frontend
- **Framework:** Vanilla JavaScript (no framework overhead)
- **Styling:** Minimal CSS (dark theme recommended)
- **Auto-Refresh:** Fetch data every 10 seconds, update DOM
- **Layout:** CSS Grid for 5-panel layout

### File Structure
```
mission-control-ui/
├── server.js (Express server)
├── package.json (dependencies)
├── public/
│   ├── index.html (main layout)
│   ├── style.css (styling)
│   └── script.js (frontend logic)
├── api/
│   └── data.js (read Mission Control JSON files)
└── README.md (deployment instructions)
```

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] UI loads on localhost:3000
- [ ] Displays all 5 panels (TOP, LEFT, CENTER, RIGHT, BOTTOM)
- [ ] Reads from 4 data structure files (read-only)
- [ ] Auto-refreshes every 10 seconds
- [ ] Shows current timestamp
- [ ] Agent activity displays correctly (4 agents)
- [ ] Workstreams display with stage + timeline
- [ ] Blocked work displays with reason + duration
- [ ] Pipeline shows 8 stages with counts
- [ ] Opportunity velocity displays with trend
- [ ] System health indicator shows (green/yellow/red)

### Non-Functional
- [ ] Loads in <2 seconds
- [ ] Refresh takes <500ms
- [ ] No console errors
- [ ] No data modifications (read-only confirmed)
- [ ] No authentication required (localhost only)
- [ ] Responsive layout (readable at 1024x768 min)

### Quality
- [ ] Code passes linting
- [ ] No blocking console warnings
- [ ] Graceful error handling (missing data)
- [ ] README with deployment instructions
- [ ] Example screenshot included

---

## ARCHITECTURE CONSTRAINTS

**Must preserve:**
- ✅ Existing Mission Control data structures (4 JSON files)
- ✅ Existing cron jobs (9 total, no modifications)
- ✅ Existing agents (Clawson, Codesmith, Moonshot, Personal Assistant)
- ✅ Existing routes (no new Telegram routes)
- ✅ Drift protection (no unauthorized files)

**Cannot do:**
- ❌ Modify any data structure files
- ❌ Add new cron jobs
- ❌ Add new agents
- ❌ Modify registry.json
- ❌ Create system integrations

---

## DEPLOYMENT INSTRUCTIONS (Expected Output)

```
# Mission Control UI V1

## Installation
1. cd mission-control-ui
2. npm install
3. node server.js

## Access
Open: http://localhost:3000

## Configuration
Port: Edit server.js, line 3 (default 3000)
Data path: Edit api/data.js, line 1 (default data/mission-control)
Refresh rate: Edit public/script.js, line 5 (default 10000ms)

## Deployment
- Requires Node.js 14+
- Requires read access to data/mission-control/
- No authentication needed (localhost only)
- No external dependencies
```

---

## QUALITY GATES (Mandatory for Deployment)

All 7 gates must PASS before merge to main:

1. **Format & Lint**
   - [ ] No trailing whitespace
   - [ ] Consistent indentation (2 spaces)
   - [ ] No unused variables
   - [ ] Comments where needed

2. **Type Checking** (if using JSDoc)
   - [ ] Function signatures documented
   - [ ] Return types specified
   - [ ] No type mismatches

3. **Unit Tests**
   - [ ] Data loading tests (mock JSON files)
   - [ ] Panel rendering tests
   - [ ] Refresh logic tests
   - [ ] Error handling tests
   - [ ] Coverage: >80%

4. **Integration Tests**
   - [ ] Full UI renders with sample data
   - [ ] Auto-refresh cycle works
   - [ ] All panels populate correctly
   - [ ] No data modifications

5. **Preflight Check**
   - [ ] No config file modifications needed
   - [ ] No environment variables required
   - [ ] Runs standalone (no system calls)
   - [ ] No external API dependencies

6. **Drift Audit**
   - [ ] No unauthorized files created
   - [ ] Code only in mission-control-ui/ directory
   - [ ] No modifications to canon/ or config/
   - [ ] No changes to data structures

7. **Smoke Test**
   - [ ] Server starts on localhost:3000
   - [ ] Page loads without errors
   - [ ] Data refreshes every 10 seconds
   - [ ] All 5 panels render
   - [ ] No console errors

---

## TIMELINE

**Week 1:**
- [ ] Day 1-2: Setup, file structure, Express server
- [ ] Day 2-3: Frontend HTML/CSS layout (5 panels)
- [ ] Day 3: Data reading & parsing (JSON files)
- [ ] Day 4: Frontend JS logic (auto-refresh, DOM updates)

**Week 2:**
- [ ] Day 1: Styling & responsive design
- [ ] Day 1-2: Testing (unit + integration)
- [ ] Day 2-3: Quality gates (all 7)
- [ ] Day 3: Documentation & README

**Target Completion:** 5 business days

---

## DELIVERABLES (Upon Completion)

1. **Running Dashboard**
   - Localhost:3000 accessible
   - Reads live Mission Control data
   - Auto-refreshes every 10 seconds
   - All 5 panels functional

2. **UI Screenshot**
   - Example of populated dashboard
   - Shows all panels with sample data
   - Include legend/help text if applicable

3. **Deployment Instructions**
   - Installation steps
   - Configuration options
   - Port/data path customization
   - Troubleshooting guide

4. **Architecture Confirmation**
   - No system modifications
   - No new agents/routes/cron
   - Read-only operation verified
   - Drift protection maintained

5. **Validation Report**
   - All quality gates passed (7/7)
   - Test coverage report
   - Performance metrics (<2s load, <500ms refresh)
   - Known limitations (if any)

---

## NOTES

- This is a **read-only dashboard** — no user input, no form submissions
- Data is refreshed from disk every 10 seconds — eventual consistency model
- Error handling: Gracefully display "Data not yet available" if JSON files missing
- Mobile: Not required; desktop-only layout acceptable
- Dark theme recommended for dashboard aesthetic
- Localhost-only: No need for authentication or HTTPS

---

## APPROVAL

**Approved by:** Clawson  
**On behalf of:** Steve Vettori  
**Date:** 2026-03-04 15:17 EST  
**Decision:** APPROVED

**Approval Text:**
"Approved: codesmith — Mission Control UI V1 build with 5-panel dashboard, read-only data consumption, 10s auto-refresh"

---

## SIGN-OFF

**Codesmith:** [Awaiting work start]  
**Expected Completion:** 2026-03-11 (5 business days)  
**Status:** READY TO BUILD

---

_Change Request Template: canon/system/change_request_template.md_  
_Quality Gates: canon/system/engineering_quality_gates.md_  
_Mission Control Spec: canon/system/mission_control_v2.md + mission_control_v2_enhancements.md_
