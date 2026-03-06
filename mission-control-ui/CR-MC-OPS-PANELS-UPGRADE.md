# Change Request: CR-MC-OPS-PANELS-UPGRADE

**Title:** Mission Control — Operations Panels Upgrade (Agent Activity / Active Work / Blocked Work)  
**Date:** 2026-03-05 12:09 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P1 (Operational Excellence)  
**Scope:** Complete redesign of 3 main panels + 2 supporting panels  
**Timeline:** 3-4 weeks  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

Transform Mission Control from static dashboard into **real operational console** by upgrading 5 core panels:

- ✅ **Agent Activity Panel** → Live timeline with filters, search, drilldown
- ✅ **Active Work Panel** → Real workstreams table with health status
- ✅ **Blocked Work Panel** → Blocker console with SLA timers + severity colors
- ✅ **Workstream Flow Panel** → Stage distribution visualization
- ✅ **System Status Panel** → Agent health monitor (heartbeats, errors)

**Result:** Operators can see entire system state (what's happening, who owns it, what's blocked, agent health) in one dashboard.

---

## CURRENT STATE (Problems)

### Agent Activity Panel
- Static list with no filters
- Shows: timestamp, agent, severity (minimal)
- Cannot drill into event details
- Cannot search or filter by venture/severity
- No real-time updates

### Active Work Panel
- Shows placeholder data: "timestamp", "total", "items"
- No actual workstreams displayed
- No phase/progress visibility
- No owner accountability
- Cannot inspect individual workstreams

### Blocked Work Panel
- Shows: timestamp, total, items (schema keys, not data)
- No actual blockers visible
- No severity color coding
- No SLA timers
- No owner/next-action visibility

### Workstream Flow Panel
- Generic progress bars
- No stage breakdown
- No hover details
- No filtering by stage

### System Status Panel
- Missing entirely
- No visibility into agent health
- No heartbeat tracking
- No error monitoring

---

## SECTION 1: AGENT ACTIVITY PANEL UPGRADE

### Current → New

**Before:**
```
timestamp
agent
severity
```

**After:**
```
Live Timeline with Filters + Search + Drilldown
```

### Features

#### Live Timeline Feed
- Real-time streaming (updates every 10 seconds or via WebSocket)
- Newest events at top (descending timestamp)
- Show: timestamp, agent, severity badge, action, description
- Click event → opens Activity Drawer

#### Filters
- **By Agent:** Clawson | Codesmith | Moonshot | Personal Assistant | (All)
- **By Severity:** Info | Warning | Critical | (All)
- **By Venture:** LeadScore.ai | (All)
- **Time Range:** Last 24h | Last 7d | Last 30d | All

#### Search
- Global text search across action + description
- Press `/` to focus search
- Real-time filtering

#### Event Row Display
```
[11:23 AM] [INFO] Clawson — SEV-1 verification complete
                    Description: Gmail OAuth Bulletproof
                    Venture: N/A
```

#### Activity Drawer (Click Event)
```
┌─ ACTIVITY EVENT ───────────────────────┐
│ Timestamp: 2026-03-05T11:23:36Z         │
│ Agent: Clawson                          │
│ Severity: [INFO] (blue badge)           │
│ Action: SEV-1 verification complete     │
│ Description: Gmail OAuth Bulletproof    │
│                                         │
│ Related Venture: N/A                    │
│ Related Workstream: N/A                 │
│ Related CR: N/A                         │
│ Responsible Agent: System               │
│                                         │
│ Source: agent_activity.json (lastUpdated: 11:23Z) │
│                                         │
│ [Close]                                 │
└─────────────────────────────────────────┘
```

### SSOT Mapping
- Source: `agent_activity.json`
- Fields: timestamp, agent, action, description, severity, venture_id (if present)
- Display: cite source + lastUpdated per event

### Keyboard Navigation
- **/** → Focus search
- **Enter** → Open selected event (if filtered to 1)
- **Esc** → Close drawer
- **↑/↓** → Navigate events (optional, if list view)

---

## SECTION 2: ACTIVE WORK PANEL UPGRADE

### Current → New

**Before:**
```
timestamp
total
items
```

**After:**
```
Real Workstreams Table with Health Status
```

### Active Workstreams Table

**Columns:**

| Column | Source | Notes |
|--------|--------|-------|
| **Workstream ID** | workstreams.json | Linked name |
| **Venture** | venture_work_links.json | Which venture this work serves |
| **Phase** | workstreams.json | Current phase (Discovery/Design/Build/Test/Deploy/Experiment) |
| **Owner** | workstreams.json | Assigned agent (Codesmith/Moonshot/etc.) |
| **Progress %** | workstreams.json | 0-100 |
| **Last Event** | agent_activity.json | Most recent activity for this workstream (filtered) |
| **ETA** | workstreams.json | Target completion date |
| **Health** | calculated | healthy ✅ / warning ⚠️ / critical 🚨 |

**Example Row:**
```
backend-api-scaffolding | LeadScore.ai | Build | Codesmith | 90% | Added error handling (1h ago) | 2026-03-08 | ✅ Healthy
```

### Health Calculation
- ✅ **Healthy:** No blockers, recent activity, on schedule
- ⚠️ **Warning:** 1+ warning blockers OR >3 days without update
- 🚨 **Critical:** 1+ critical blockers OR >7 days without update OR overdue ETA

### Workstream Drawer (Click Row)

```
┌─ WORKSTREAM: backend-api-scaffolding ───┐
│                                          │
│ METADATA                                 │
│ ─────────────────────────────────────────│
│ Venture: LeadScore.ai                    │
│ Stage: Implementation (Week 1 of 8)      │
│ Assigned Agent: Codesmith                │
│ Created: 2026-03-05                      │
│ Last Updated: 2026-03-05T10:30Z          │
│                                          │
│ PHASE PROGRESSION                        │
│ ─────────────────────────────────────────│
│ ✓ Discovery     (2026-03-02 → 2026-03-03) │
│ ✓ Design        (2026-03-03 → 2026-03-05) │
│ ◔ Build         (2026-03-05 → 2026-03-08) │
│ ○ Test          (pending)                │
│ ○ Deploy        (pending)                │
│ ○ Experiment    (pending)                │
│                                          │
│ WORKSTREAM EVENTS                        │
│ ─────────────────────────────────────────│
│ [11:30 AM] Added error handling          │
│ [09:15 AM] Completed config module       │
│ [06:45 AM] Started endpoints             │
│ [Show all (20 total)]                    │
│                                          │
│ DEPENDENCIES                             │
│ ─────────────────────────────────────────│
│ Linked Ventures: LeadScore.ai            │
│ Linked Workstreams: none                 │
│                                          │
│ HEALTH                                   │
│ ─────────────────────────────────────────│
│ Status: Healthy ✅                       │
│ Blocked: No                              │
│ Stale: No                                │
│ SLA: On Track                            │
│                                          │
│ Source: workstreams.json (lastUpdated: 11:30Z) │
│ [Close]                                  │
└─────────────────────────────────────────┘
```

### SSOT Mapping
- Source: `workstreams.json` + `venture_work_links.json` + `agent_activity.json`
- Fields: id, venture_id, phase, owner, progress, eta, last_event, blockers
- Display: cite source + lastUpdated per section

### Keyboard Navigation
- **/** → Search workstreams
- **Enter** → Open selected workstream
- **Esc** → Close drawer
- **↑/↓** → Navigate table rows

---

## SECTION 3: BLOCKED WORK PANEL UPGRADE

### Current → New

**Before:**
```
timestamp
total
items
```

**After:**
```
Blocker Console with Severity Colors + SLA Timers
```

### Blocker Console Table

**Columns:**

| Column | Source | Notes |
|--------|--------|-------|
| **Blocker ID** | blocked_work.json | Unique identifier |
| **Venture** | blocked_work.json | Which venture is blocked |
| **Workstream** | blocked_work.json | Which workstream is blocked |
| **Owner** | blocked_work.json | Who's responsible for unblocking |
| **Created** | blocked_work.json | When did it block |
| **Duration** | calculated | How long blocked (hours/days) |
| **Severity** | blocked_work.json | info 🔵 / warning 🟡 / critical 🔴 |
| **Next Action** | blocked_work.json | What needs to happen |

**Example Row:**
```
BLK-001 | LeadScore.ai | backend-api-scaffolding | Steve Vettori | 3d ago | 3d 2h | 🔴 CRITICAL | Email Steve recap
```

### Severity Color Coding
- 🔵 **Info** (blue) — FYI, no action needed yet
- 🟡 **Warning** (amber) — Needs attention this week
- 🔴 **Critical** (red) — Overdue, action required now

### Blocker Drawer (Click Row)

```
┌─ BLOCKER: BLK-001 ──────────────────────┐
│                                          │
│ BLOCKER DETAILS                          │
│ ─────────────────────────────────────────│
│ ID: BLK-001                              │
│ Type: Approval                           │
│ Severity: 🔴 CRITICAL                    │
│ Status: Active (Blocking)                │
│                                          │
│ WHAT'S BLOCKED                           │
│ ─────────────────────────────────────────│
│ Venture: LeadScore.ai                    │
│ Workstream: backend-api-scaffolding      │
│                                          │
│ WHO'S RESPONSIBLE                        │
│ ─────────────────────────────────────────│
│ Owner: Steve Vettori                     │
│ Assigned to: Clawson (escalation)        │
│                                          │
│ TIMELINE                                 │
│ ─────────────────────────────────────────│
│ Created: 2026-03-02T14:30Z               │
│ Duration Blocked: 3 days 2 hours         │
│ SLA Target: 24 hours                     │
│ Status: 🔴 OVERDUE by 56 hours           │
│                                          │
│ REQUIRED ACTION                          │
│ ─────────────────────────────────────────│
│ Action: Email Steve recap of blockers    │
│ Description: Waiting for CEO sign-off    │
│ on venture direction before backend      │
│ scaffolding can proceed.                 │
│                                          │
│ RESOLUTION                               │
│ ─────────────────────────────────────────│
│ Target Resolution: 2026-03-06            │
│ Assignee: Clawson (send to Steve)        │
│                                          │
│ Source: blocked_work.json (lastUpdated: 11:30Z) │
│ [Close]                                  │
└─────────────────────────────────────────┘
```

### SSOT Mapping
- Source: `blocked_work.json`
- Fields: blocker_id, venture_id, workstream_id, owner, created_at, severity, blocker_type, next_action, sla_hours
- Display: cite source + lastUpdated per section

### Keyboard Navigation
- **/** → Search blockers
- **Enter** → Open selected blocker
- **Esc** → Close drawer
- **↑/↓** → Navigate table rows
- **Filter by severity** (Info/Warning/Critical)

---

## SECTION 4: WORKSTREAM FLOW PANEL

### Current → New

**Before:**
```
Generic progress bars
```

**After:**
```
Stage Distribution Flow
```

### Visualization

```
WORKSTREAM STAGE FLOW

Discovery     Design       Build        Test         Deploy       Experiment
   0 WS        1 WS        3 WS         0 WS         0 WS         0 WS
   
   ○            ○          ◔ ◔ ◔         ○            ○            ○

Total: 4 workstreams across 6 stages
```

### Hover Tooltip (Stage Click)

When hovering/clicking a stage:

```
STAGE: Build (3 workstreams)

• backend-api-scaffolding (LeadScore.ai, 90%, Codesmith)
• worker-job-processor (LeadScore.ai, 20%, Codesmith)
• web-dashboard-alpha (LeadScore.ai, 5%, Codesmith)

[View Details] → Opens Active Work drawer filtered to this stage
```

### SSOT Mapping
- Source: `workstreams.json` + `venture_work_links.json`
- Fields: phase, count per phase, ventures in phase, owners
- Display: cite source + lastUpdated

---

## SECTION 5: SYSTEM STATUS PANEL

### Add: Agent Health Monitor

```
┌─ AGENT HEALTH MONITOR ──────────────────┐
│                                          │
│ Clawson (main)                           │
│ Status: ✅ Online                        │
│ Last Heartbeat: Now                      │
│ Workstreams Owned: 0                     │
│ Recent Errors: None                      │
│                                          │
│ Codesmith                                │
│ Status: ✅ Online                        │
│ Last Heartbeat: 5m ago                   │
│ Workstreams Owned: 4                     │
│ Recent Errors: None                      │
│                                          │
│ Moonshot                                 │
│ Status: ⏳ Idle (>1h)                    │
│ Last Heartbeat: 1h 23m ago               │
│ Workstreams Owned: 0                     │
│ Recent Errors: None                      │
│                                          │
│ Personal Assistant                       │
│ Status: ⏳ Idle (>30m)                   │
│ Last Heartbeat: 45m ago                  │
│ Workstreams Owned: 2                     │
│ Recent Errors: None                      │
│                                          │
│ Source: (heartbeat tracking not yet      │
│ available — tracked via activity log)    │
│                                          │
│ [Refresh]                                │
└─────────────────────────────────────────┘
```

### Fields

- **Agent Name** — From registry.json
- **Status** — ✅ Online | ⏳ Idle | 🔴 Offline (based on last activity timestamp)
- **Last Heartbeat** — Most recent activity timestamp from agent_activity.json
- **Workstreams Owned** — Count from workstreams.json where owner = agent
- **Recent Errors** — Count of CRITICAL entries for this agent in last 24h
- If heartbeat not available: "Heartbeat not tracked"

### SSOT Mapping
- Source: `canon/registry.json` + `agent_activity.json` + `workstreams.json`
- Fields: agent_id, last_activity_timestamp, owned_workstreams, error_count
- Display: cite source + lastUpdated

---

## SECTION 6: API ENDPOINTS

### Minimal Extensions (No DB)

#### GET /api/workstreams
**Purpose:** List all active workstreams

**Response:**
```json
{
  "timestamp": "ISO-8601",
  "workstreams": [
    {
      "id": "backend-api-scaffolding",
      "venture_id": "leadscore-ai",
      "phase": "build",
      "owner": "codesmith",
      "progress": 90,
      "eta": "2026-03-08",
      "last_event": "...",
      "health": "healthy",
      "blocked": false
    }
  ],
  "total": 1,
  "sources": {
    "workstreams": "workstreams.json",
    "blockers": "blocked_work.json",
    "activity": "agent_activity.json"
  }
}
```

#### GET /api/workstreams/:id
**Purpose:** Full workstream detail

**Response:**
```json
{
  "timestamp": "ISO-8601",
  "workstream": {...},
  "phases": [...],
  "events": [...],
  "blockers": [...],
  "dependencies": {...},
  "health": {...},
  "sources": {...}
}
```

#### GET /api/blockers
**Purpose:** List all blockers

**Response:**
```json
{
  "timestamp": "ISO-8601",
  "blockers": [
    {
      "id": "BLK-001",
      "venture_id": "leadscore-ai",
      "workstream_id": "backend-api-scaffolding",
      "owner": "steve",
      "created_at": "ISO-8601",
      "duration_hours": 74,
      "severity": "critical",
      "blocker_type": "approval",
      "next_action": "..."
    }
  ],
  "total": 0,
  "sources": {
    "blockers": "blocked_work.json"
  }
}
```

#### GET /api/blockers/:id
**Purpose:** Full blocker detail

**Response:**
```json
{
  "timestamp": "ISO-8601",
  "blocker": {...},
  "venture": {...},
  "workstream": {...},
  "owner_agent": {...},
  "sla": {...},
  "resolution_target": "ISO-8601",
  "sources": {...}
}
```

### Implementation Notes
- All endpoints read SSOT files directly (no cache or short TTL)
- Return 500 if SSOT unreadable with path + error
- Return 404 if resource not found
- No external API calls

---

## SECTION 7: UI DESIGN REQUIREMENTS

### Visual Consistency
- Maintain existing Mission Control dark theme
- Use existing color palette (blue, amber, red for severity)
- Keep typography consistent (existing font sizes, weights)

### Drawer Pattern
- Use same pattern as Venture Detail Drawer (right-side panel or modal)
- Smooth slide-in animation
- Close button (X) + keyboard Esc support
- Click outside to close (optional)

### Keyboard Shortcuts
- **/** → Focus search in current panel
- **Enter** → Open selected item (drawer)
- **Esc** → Close drawer
- **↑/↓** → Navigate table/list rows
- **h** → Filter by "Health" status (optional)

### Auto-Refresh
- Keep 10-second refresh interval for all panels
- If one panel fails to refresh, others continue
- Show error banner in failed panel: "Failed to load. [Retry]"
- No blocking updates

### Responsive Design
- Desktop: Full layout with all 5 panels
- Tablet: Stacked panels, drawers full-width
- Mobile: Single panel at a time (tab navigation)

### Error Handling
- If endpoint fails: Show error banner with [Retry] button
- If SSOT file unreadable: Show "Data unavailable — checked [filename]"
- Never show null/undefined values
- Never show schema keys to user
- Graceful degradation (other panels still update)

---

## IMPLEMENTATION ROADMAP

### Phase 1 (Week 1): API Endpoints + Agent Activity
- [ ] Extend `/api/workstreams` endpoint
- [ ] Extend `/api/blockers` endpoint
- [ ] Upgrade Agent Activity Panel (timeline + filters + search)
- [ ] Create Activity Drawer component
- [ ] Write unit tests

### Phase 2 (Week 1-2): Active Work + Blocked Work
- [ ] Upgrade Active Work Panel (real workstreams table)
- [ ] Create Workstream Drawer component
- [ ] Upgrade Blocked Work Panel (blocker console)
- [ ] Create Blocker Drawer component
- [ ] Write integration tests

### Phase 3 (Week 2): Flow Visualization + Agent Health
- [ ] Upgrade Workstream Flow Panel (stage distribution)
- [ ] Create System Status Panel (agent health monitor)
- [ ] Write tests for visualizations

### Phase 4 (Week 3): Polish + Testing
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] Keyboard navigation (all panels)
- [ ] Error handling + retry logic
- [ ] Performance optimization (<500ms load per panel)
- [ ] All tests passing
- [ ] ESLint clean
- [ ] Drift audit clean

---

## TESTING CHECKLIST

### Functional
- [ ] Agent Activity shows live events with correct timestamps
- [ ] Filters work: Agent | Severity | Venture
- [ ] Search works: text search across action + description
- [ ] Click event → drawer opens with full payload
- [ ] Active Work shows real workstreams (not placeholders)
- [ ] Click workstream → drawer shows phases, events, blockers
- [ ] Blocked Work shows real blockers with severity colors
- [ ] Click blocker → drawer shows SLA timer, responsible agent
- [ ] Workstream Flow shows correct stage distribution
- [ ] Hover stage → tooltip shows ventures + workstreams
- [ ] Click stage → filtered Active Work drawer opens
- [ ] System Status shows agent health (online/idle/offline)
- [ ] All data sourced from SSOT (no fabrication)

### Data Integrity
- [ ] All fields backed by SSOT files
- [ ] Missing data shows "No data available + filename"
- [ ] Sources cited per section (file + lastUpdated)
- [ ] No mutations to SSOT files
- [ ] No external API calls

### Operator Lock
- [ ] Read-only UI (no edits possible)
- [ ] No changes to /canon, /config, /scripts
- [ ] No synthetic data generation
- [ ] Fail-loud on errors
- [ ] No Supabase dependencies

### Performance
- [ ] All panels load < 500ms
- [ ] Auto-refresh 10s (no lag)
- [ ] Drawers open < 200ms
- [ ] No UI freezing on failed refresh

### Quality Gates
- [ ] ESLint: 0 errors, 0 warnings
- [ ] All tests passing (unit + integration)
- [ ] Drift audit clean
- [ ] No hardcoded paths
- [ ] Accessibility (keyboard, ARIA labels)

---

## CONSTRAINTS & GUARDRAILS

### Hard Rules
1. ✅ **SSOT Authority** — All data from JSON files only
2. ✅ **Read-Only** — No mutations to system
3. ✅ **No External Deps** — No Supabase, no external APIs
4. ✅ **Fail-Loud** — Errors shown, not silent failures
5. ✅ **Data Citations** — Every section shows source file + timestamp

### Soft Guidelines
- Keep components modular
- Reuse existing styles where possible
- Dark theme consistent with current UI
- Keyboard accessible (Tab, Enter, Esc)
- Performance-conscious (avoid unnecessary re-renders)

---

## SUCCESS CRITERIA

✅ **Agent Activity shows live events with filters + search**  
✅ **Active Work shows real workstreams (not placeholders)**  
✅ **Blocked Work shows real blockers with severity colors**  
✅ **Workstream Flow shows stage distribution**  
✅ **System Status shows agent health**  
✅ **All data from SSOT files only**  
✅ **Missing data shown as "No data available"**  
✅ **All drawers work with keyboard nav**  
✅ **No mutations to system files**  
✅ **No external dependencies**  
✅ **All tests passing**  
✅ **Performance <500ms**  
✅ **ESLint clean**  
✅ **Drift audit clean**  

---

## ROLLBACK PLAN

```bash
# Simple rollback: revert to pre-CR version
git revert <commit-range>

# This removes:
# - 5 upgraded panels
# - All drawers
# - New API endpoints

# Restores:
# - Original static panels
# - SSOT files intact
# - All data preserved

# Restart server
cd mission-control-ui && npm start
```

**Impact:** Users see original static panels. System operational. No data loss.

---

## APPROVAL & HANDOFF

**Requested By:** Steve Vettori (2026-03-05 12:09 EST)  
**Status:** APPROVED FOR IMPLEMENTATION  
**Awaiting:** Codesmith begins Phase 1  

---

**CR ID:** CR-MC-OPS-PANELS-UPGRADE  
**Date:** 2026-03-05 12:09 EST  
**Scope:** ~3-4 weeks, 1 engineer (Codesmith)  
**Risk:** Low (read-only, SSOT-only, well-scoped)  
**Acceptance:** All 5 operational panels upgraded, all data SSOT-sourced, fail-loud constraints enforced
