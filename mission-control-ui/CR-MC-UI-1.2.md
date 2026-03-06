# Change Request: CR-MC-UI-1.2

**Title:** Mission Control UI V1.2: Interactive Venture Pipeline with Drilldowns, Search, Keyboard Nav  
**Date:** 2026-03-05 06:20 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P1 (Operator Console Critical)  
**Scope:** Mission Control UI enhancement (localhost:3000)  
**Timeline:** 2-3 weeks (Sprint-based)  
**Status:** APPROVED — Ready for Codesmith assignment  

---

## Executive Summary

Upgrade Mission Control UI from static dashboard to **world-class operator console** with:
- ✅ Clickable venture pipeline (stage tiles)
- ✅ Drilldown drawer with search + filters
- ✅ Keyboard navigation (←/→ stages, ↑/↓ items, Enter/Esc modals)
- ✅ Venture detail view (PRD/CR links, metrics, activity, blockers)
- ✅ All data from local JSON (SSOT), zero external dependencies

**Goal:** Operator should be able to navigate entire venture pipeline with keyboard + click, see real-time status, and access all venture artifacts (docs, code, activity) from one place.

---

## Problem Statement

Current Mission Control UI shows venture pipeline as static tiles with no interaction. Operators cannot:
- Drill into a stage to see which ventures are actually there
- Search for a specific venture across all stages
- View venture details (owner, status, links, activity)
- Navigate with keyboard (requires mouse clicks only)
- Understand venture lifecycle or current blockers at a glance

Result: Operators use file browser / CLI instead of dashboard.

---

## Solution Overview

### A. Data Layer: venture_scoreboard.json

**Location:** `/Users/openclaw/.openclaw/workspace/data/mission-control/venture_scoreboard.json`

**Purpose:** Canonical source of truth for all ventures (status, stage, metadata, links)

**Schema:**
```json
{
  "lastUpdated": "2026-03-05T11:20:00.000Z",
  "stage_order": [
    "Opportunity",
    "Qualified",
    "In Progress",
    "Due Diligence",
    "Negotiation",
    "Approval",
    "Closing",
    "Closed"
  ],
  "ventures": [
    {
      "venture_id": "leadscore",
      "name": "LeadScore.ai",
      "description": "AI lead qualification system for B2B SaaS",
      "stage": "In Progress",
      "status": "active",
      "owner_agent": "codesmith",
      "priority": "high",
      "mrr": 0,
      "mrr_target": 5000,
      "timeline_weeks": 8,
      "started_date": "2026-03-05",
      "tags": ["AI", "B2B", "SaaS", "Qualification"],
      "icps": ["VP Sales", "Sales Ops Manager"],
      "links": {
        "prd": "/ventures/leadscore/docs/prd.md",
        "cr": "/ventures/leadscore/CR-LEADSCORE-001.md",
        "repo_path": "/ventures/leadscore",
        "demo_url": null
      },
      "last_event": {
        "timestamp": "2026-03-05T06:15:00.000Z",
        "summary": "Week 1 backend build started",
        "severity": "info"
      },
      "metrics": {
        "accuracy_target": 0.85,
        "nps_target": 30,
        "customers_target": 5,
        "mrr_target": 1000
      }
    }
  ],
  "summary": {
    "total_ventures": 1,
    "by_stage": {
      "Opportunity": 0,
      "Qualified": 0,
      "In Progress": 1,
      "Due Diligence": 0,
      "Negotiation": 0,
      "Approval": 0,
      "Closing": 0,
      "Closed": 0
    },
    "by_status": {
      "active": 1,
      "paused": 0,
      "killed": 0,
      "launched": 0
    }
  }
}
```

---

### B. API Layer: New Endpoints (Read-Only, SSOT Direct)

All endpoints must read directly from SSOT files (no stale caching).

#### GET /api/ventures
Returns all ventures with optional filtering

**Query params:**
- `stage` — Filter by stage (e.g., "In Progress")
- `search` — Text search (fuzzy match on name, description, tags)
- `status` — Filter by status (active, paused, killed, launched)
- `owner_agent` — Filter by owner (codesmith, moonshot, clawson)
- `sort` — Sort by: `last_event_desc` (default), `name_asc`, `mrr_desc`, `priority_high`

**Response (200):**
```json
{
  "timestamp": "ISO-8601",
  "ventures": [
    {
      "venture_id": "leadscore",
      "name": "LeadScore.ai",
      "stage": "In Progress",
      "status": "active",
      "owner_agent": "codesmith",
      "priority": "high",
      "mrr": 0,
      "mrr_target": 5000,
      "last_event": {
        "timestamp": "ISO-8601",
        "summary": "Week 1 backend started"
      }
    }
  ],
  "total": 1,
  "filters_applied": {
    "stage": null,
    "search": null,
    "status": "active",
    "owner_agent": null
  }
}
```

**Error (500):**
```json
{
  "error": "SSOT file missing or unreadable",
  "path": "/path/to/venture_scoreboard.json",
  "timestamp": "ISO-8601"
}
```

#### GET /api/ventures/stage/:stage
Returns all ventures in a specific stage

**Params:**
- `:stage` — Stage name (URL-encoded, e.g., "In%20Progress")

**Response:**
```json
{
  "timestamp": "ISO-8601",
  "stage": "In Progress",
  "count": 1,
  "ventures": [...]
}
```

#### GET /api/ventures/:venture_id
Returns full venture detail with related data

**Response (200):**
```json
{
  "venture": {...full venture object with all fields...},
  "related_workstreams": [
    {
      "workstream_id": "...",
      "name": "...",
      "status": "...",
      "assigned_to": "...",
      "blocked_count": 0
    }
  ],
  "blockers": [
    {
      "blocker_id": "...",
      "title": "...",
      "status": "...",
      "target_resolution": "ISO-8601"
    }
  ],
  "recent_activity": [
    {
      "timestamp": "ISO-8601",
      "agent": "...",
      "action": "...",
      "severity": "info"
    }
  ],
  "timestamp": "ISO-8601"
}
```

**Error (404):**
```json
{
  "error": "Venture not found",
  "venture_id": "nonexistent",
  "timestamp": "ISO-8601"
}
```

#### GET /api/stages
Returns stage definitions with venture counts

**Response:**
```json
{
  "timestamp": "ISO-8601",
  "stages": [
    {
      "name": "Opportunity",
      "order": 0,
      "count": 0,
      "ventures": []
    },
    {
      "name": "In Progress",
      "order": 2,
      "count": 1,
      "ventures": [
        {
          "venture_id": "leadscore",
          "name": "LeadScore.ai"
        }
      ]
    }
  ]
}
```

#### GET /api/debug/ssot (Existing, Enhanced)
Returns SSOT file status (keep permanent)

**Response includes:**
```json
{
  "ssot_root": "/Users/openclaw/.openclaw/workspace/data/mission-control",
  "files": {
    "venture_scoreboard.json": {
      "absolute_path": "...",
      "mtime": "ISO-8601",
      "lastUpdated_in_json": "ISO-8601",
      "size_bytes": 12345
    },
    "workstreams.json": {...},
    "blocked_work.json": {...}
  },
  "query_time": "ISO-8601"
}
```

**Implementation Notes:**
- All endpoints read SSOT directly (no in-memory cache)
- mtime-based caching allowed only if `If-Modified-Since` header used
- Return 304 Not Modified if not changed
- Log any file read errors to activity.json as CRITICAL
- Response time must be < 500ms for up to 200 ventures

---

### C. UI Layer: Interactive Components

#### 1. Venture Pipeline (Enhancement)
**Current:** Static tile layout showing counts  
**New:** 
- Each tile is clickable (pointer cursor, hover effect)
- Selected tile has highlight border + glow
- Click tile → opens Drilldown Drawer

#### 2. Drilldown Drawer
**Position:** Right side of screen (overlay or side panel, 400px wide)  
**Content:**
- Header: Stage title + venture count
- Search input (fuzzy search ventures in this stage)
- Filter buttons: Status (Active/Paused/Killed/Launched), Owner, Priority
- Sort dropdown: Last Event (desc), Name (asc), MRR (desc)
- Venture list (scrollable):
  - Venture name
  - Status badge (color-coded)
  - Owner (agent name)
  - Last event summary + relative time (e.g., "12m ago")
  - Click row → opens Detail Drawer

**Keyboard:**
- `Esc` — Close drilldown
- `↑/↓` — Navigate list items
- `Enter` — Open detail for selected item
- `/` — Focus search input

#### 3. Venture Detail Drawer (Deep Dive)
**Position:** Full-width overlay or expanded panel  
**Content:**
- **Venture Header:**
  - Name, description, stage, status, owner_agent, priority, tags
  - MRR (if any) + "MRR Target" label
- **Links Section:**
  - PRD link (clickable to /ventures/*/docs/prd.md)
  - CR link (clickable to /ventures/*/CR-*.md)
  - Repo path (with copy-to-clipboard button)
  - Demo URL (if present)
- **Related Workstreams** (from workstreams.json):
  - Show workstreams where venture_id matches OR venture_work_links.json maps them
  - Include workstream status, assignee, blocked count
- **Blockers** (from blocked_work.json):
  - Show any blockers referencing this venture_id or linked workstream ids
  - Display blocker title, status, resolution target
- **Recent Activity** (from agent_activity.json):
  - Last 10 items where:
    - (meta.venture_id == venture_id) OR
    - action/description contains venture name or ID
  - Show timestamp, agent, action, severity badge
- **Metrics Panel:**
  - Success targets (accuracy, NPS, customer count, MRR)
  - Timeline (started date, weeks until target)

**Keyboard:**
- `Esc` — Close detail drawer (returns to drilldown)
- `←/→` — Navigate to previous/next venture in list
- Click outside drawer — Close detail drawer

#### 4. Search + Filters (Global)
**Position:** Top of drilldown drawer  
**Features:**
- Text search: fuzzy match on name, description, tags
- Status filter: checkboxes or dropdown (active, paused, killed, launched)
- Owner filter: dropdown (list of agents)
- Priority filter: checkboxes (low, medium, high)
- Results update in real-time (React-style reactivity)

**Example:** Type "score" → shows LeadScore.ai; select status="active" → filters to active only

#### 5. Keyboard Navigation (Operator Console)

**Global Shortcuts:**
- `←` / `→` — Move stage selection (tiles highlight on change)
- `Enter` — Open drilldown for currently selected stage
- `Esc` — Close detail drawer; if none, close drilldown

**Within Drilldown List:**
- `↑` / `↓` — Move selection in venture list
- `Enter` — Open detail view for selected venture
- `/` — Focus search input (like Slack/Linear, do not require Ctrl)
- Must NOT interfere with typing in input fields

**Within Detail Drawer:**
- `←` / `→` — Navigate to adjacent ventures in list
- `Esc` — Close detail, return to drilldown

**Escape Chain (Nested Modals):**
- First `Esc` — Close detail drawer
- Second `Esc` (if detail was open) — Close drilldown
- No delay between Escapes (immediate)

**Implementation Notes:**
- Global key handlers via `document.addEventListener('keydown')`
- Do NOT fire if user is typing in `<input>` or `<textarea>`
- Debounce list navigation (max 1 change per 50ms)

#### 6. Deep Linking & URL Hash Routing

**Support URL hash navigation:**
- `#stage=Qualified` — Auto-select stage, open drilldown
- `#venture=leadscore` — Open detail view directly (with stage context)
- `#stage=In%20Progress&venture=leadscore` — Both parameters

**On Page Load:**
- Parse URL hash (if present)
- If `stage=X`, auto-select that stage tile
- If `venture=Y`, auto-open detail view (find stage from venture_scoreboard.json)
- Update hash when user clicks stage or venture (enable bookmarking)

**Example URLs:**
```
http://localhost:3000/#stage=In%20Progress
http://localhost:3000/#venture=leadscore
http://localhost:3000/#stage=Qualified&venture=leadscore
```

---

#### 7. Data Freshness & Connectivity (Fail Loud)

**Top Bar Status Indicator:**
- Show: `SSOT lastUpdated` (max timestamp of venture_scoreboard.json + workstreams.json)
- Show: Age in minutes (e.g., "3m ago", "2h 15m ago")
- Update every 10 seconds

**Warning Thresholds (7 AM–9 PM EST only):**
- **WARNING BANNER:** If age > 30 minutes
  - Amber background, visible text: "⚠️ Data stale >30min"
  - Do NOT show outside business hours
- **CRITICAL BANNER:** If age > 3 hours
  - Red background, pulsing animation: "🚨 Data severely stale (>3h)"
  - Do NOT show outside business hours

**Connection Failure:**
- If `/api/ventures` fetch fails: Show CRITICAL banner
- Display: "🚨 DATA DISCONNECTED — Last successful: [timestamp]"
- Show red banner regardless of time of day
- Log CRITICAL activity event

**Implementation:**
- Fetch SSOT status via `/api/debug/ssot` every 30 seconds
- Compare max(lastUpdated) to now()
- Show/hide banners based on thresholds
- Same logic as existing staleness checker (from CR hardening)

---

#### 8. Observability (Minimal, Non-Spammy)

**Activity Logging:**
- When drilldown opens: Log one INFO event
  ```
  agent="System"
  action="Mission Control UI drilldown opened"
  description="{stage: 'In Progress', ventures_shown: 1}"
  severity="info"
  source="mission_control_ui"
  ```
- Throttle: Max 1 log per minute (do NOT spam on every open)
- Use timestamp-based throttle: track last_log_time per user session

**Metrics (Optional):**
- Track: drilldown opens per stage (optional, for future dashboards)
- Track: search query frequency (optional)
- Keep in-memory only (do NOT persist to activity.json to avoid bloat)

---

## Data Source Contract

**Single Source of Truth:** `/Users/openclaw/.openclaw/workspace/data/mission-control/venture_scoreboard.json`

**No Supabase.** No external DB.

**Read Behavior:**
- API reads file directly on every request
- If file missing/unreadable: return HTTP 500 + log critical activity event
- If file stale (>30m old): warn in response header + log warning activity event

**Update Behavior:**
- Export script (`mission-control-checkin.sh`) refreshes `venture_scoreboard.json` every 2 hours
- Appends ventures from other SSOT sources as needed
- Preserves manually-added venture metadata (links, owner, metrics)

---

## Implementation Roadmap

### Phase 1: API Endpoints (Week 1)
- Create `/api/ventures` with search/filter/sort
- Create `/api/ventures/:venture_id` with activity + blockers
- Create `/api/stages` for stage definitions
- Update `/api/debug/ssot` to include venture_scoreboard validation

### Phase 2: UI Components (Week 2)
- Clickable stage tiles (CSS + click handler)
- Drilldown drawer component (HTML/CSS/JS)
- Venture list renderer with search/filter
- Detail drawer component
- Keyboard navigation system

### Phase 3: Polish & Testing (Week 3)
- Keyboard nav edge cases (wrapping, multi-char search)
- Responsive design (small screens)
- Animation transitions (stage selection, drawer open/close)
- Error handling (missing files, stale data)
- User testing + feedback loop

---

## Quality Gates (Must Pass Before Merge)

### Code Quality
- [ ] ESLint clean (0 warnings)
- [ ] CSS valid (no errors)
- [ ] No console.error in production code
- [ ] No hardcoded paths (use process.env or config)
- [ ] Null checks for venture_scoreboard.json fields

### Unit Tests
- [ ] Data parsing: Load venture_scoreboard.json, validate schema
- [ ] Search filter: "leadscore" matches ventures with that name
- [ ] Status filter: Filter ventures by status (active/paused/killed/launched)
- [ ] Blockers lookup: Get blockers for a venture (via workstreams + blocked_work.json)
- [ ] Activity lookup: Get last 10 activities mentioning a venture

### Integration Tests
- [ ] GET /api/ventures returns expected keys
- [ ] GET /api/ventures/stage/:stage returns ventures in that stage
- [ ] GET /api/ventures/:venture_id returns detail + workstreams + blockers + activity
- [ ] GET /api/stages returns stage order + counts

### UI/E2E Smoke Tests
- [ ] Page loads without errors
- [ ] Stage tiles are clickable
- [ ] Clicking stage opens drilldown
- [ ] Search filters ventures in real-time
- [ ] Keyboard navigation works (at least ↑/↓ in list)
- [ ] Detail view loads and shows links
- [ ] No undefined/null values in UI

### Performance
- [ ] Render time < 200ms for 100 ventures
- [ ] Search response < 100ms
- [ ] Keyboard nav (↑/↓) feels responsive (no lag)
- [ ] Detail view loads < 500ms

### Preflight + Drift
- [ ] No changes to /canon, /config, /ventures core
- [ ] Drift audit still passes
- [ ] venture_scoreboard.json is in SSOT directory
- [ ] No Supabase dependencies added
- [ ] All exports/imports clean

---

## Testing Checklist

### Functional
- [ ] Click stage tile → drilldown opens with correct ventures
- [ ] Search "leadscore" → filters to LeadScore.ai only
- [ ] Filter status="active" → shows only active ventures
- [ ] Sort by MRR desc → ventures ordered by revenue
- [ ] Click venture row → detail drawer opens
- [ ] Detail drawer shows all fields + links
- [ ] Click PRD link → file path shown (or opens viewer)
- [ ] Esc closes detail → returns to drilldown
- [ ] Esc closes drilldown → returns to pipeline

### Keyboard
- [ ] ← / → changes selected stage
- [ ] / focuses search input
- [ ] ↑ / ↓ navigates venture list
- [ ] Enter opens detail drawer
- [ ] Esc closes drawers (correct order)
- [ ] Multi-char search works (e.g., "lead score")

### Data Integrity
- [ ] venture_scoreboard.json is read-only (no mutations)
- [ ] /canon, /config unchanged
- [ ] API reads SSOT directly (no stale cache)
- [ ] Missing links handled gracefully
- [ ] Stale data warnings shown

### Performance
- [ ] Search results < 100ms
- [ ] Drawer open/close < 200ms
- [ ] No UI lag on keyboard nav

---

## Constraints & Guardrails

### Hard Constraints
1. **NO Supabase.** Local JSON only.
2. **NO mutations to SSOT files from UI.** Read-only.
3. **NO external dependencies** added (no new npm packages without approval).
4. **ALL API requests read SSOT directly** (no stale in-memory caches).
5. **Fail loud:** If data stale or fetch fails, show visible banner + log activity.

### Code Style
- Follow existing Mission Control UI patterns (React-like, minimal dependencies)
- Use CSS Grid/Flexbox (no Bootstrap/Tailwind unless already in use)
- Dark theme colors (use existing CSS vars: --bg-dark, --accent-blue, etc.)
- Keyboard handlers via document.addEventListener (global handlers, no framework)

---

## Success Criteria (Acceptance)

✅ **Interactive pipeline:** Click stage tile → drilldown opens with ventures in that stage  
✅ **Search:** Type "leadscore" → filters to LeadScore.ai (fuzzy match on name/tags/description)  
✅ **Filter & Sort:** Select status, owner, priority; sort by last event, name, MRR  
✅ **Detail view:** Click venture → shows PRD/CR/repo links, related workstreams, blockers, recent activity  
✅ **Links work:** PRD/CR links are clickable or have copy-to-clipboard buttons  
✅ **Related data:** Shows workstreams and blockers linked to venture (via venture_id or workstream mapping)  
✅ **Activity trail:** Shows last 10 activities mentioning venture (name or ID in action/description)  
✅ **Keyboard navigation:**  
  - `←/→` Change stage selection
  - `Enter` Open drilldown / detail
  - `/` Focus search in drilldown
  - `↑/↓` Navigate venture list
  - `Esc` Close drawers (nested escape)
✅ **Deep linking:** `#stage=Qualified` and `#venture=leadscore` work (URL bookmarkable)  
✅ **Data freshness:** Warning banner if age > 30m, CRITICAL if > 3h (business hours only)  
✅ **Connection status:** Show "DATA DISCONNECTED" if fetch fails  
✅ **Activity logging:** Log drilldown opens (throttled, max 1/min)  
✅ **All data from SSOT:** venture_scoreboard.json, workstreams.json, blocked_work.json, agent_activity.json  
✅ **No mutations:** Read-only UI, /canon and /config unchanged  
✅ **Performance:** <500ms load time for 200 ventures, <100ms search response  
✅ **Quality gates:** ESLint clean, unit tests pass, drift audit clean  

---

## Files to Create/Modify

### New Files
- `mission-control-ui/public/drilldown.css` — Drilldown + detail drawer styles
- `mission-control-ui/public/drilldown.js` — Drilldown component + keyboard nav logic
- `mission-control-ui/api/ventures.js` — Venture query + filter logic

### Modified Files
- `mission-control-ui/server.js` — Add `/api/ventures*` routes
- `mission-control-ui/public/script.js` — Integrate drilldown + keyboard nav
- `mission-control-ui/public/style.css` — Add tile click styles + drawer styles
- `scripts/mission-control-export.js` — Populate venture_scoreboard.json (if needed)
- `scripts/mission-control-checkin.sh` — Ensure export refreshes scoreboard

### Data Files
- `data/mission-control/venture_scoreboard.json` — New SSOT (if not present)

---

## Approval & Sign-Off

**Requested By:** Steve Vettori  
**Approved By:** [Clawson — pending]  
**Status:** APPROVED — Ready for Codesmith build  

**Next Step:** Codesmith begins Phase 1 (API endpoints)

---

---

## Verification Requirements (Before Merge)

Codesmith must provide a "Venture Drilldown Verification Report" with:

### 1. API Endpoint Outputs
```bash
curl -s http://localhost:3000/api/ventures | jq . | head -30
curl -s http://localhost:3000/api/ventures/stage/In%20Progress | jq . | head -30
curl -s http://localhost:3000/api/ventures/leadscore | jq . | head -30
curl -s http://localhost:3000/api/debug/ssot | jq . | head -20
```

### 2. UI Verification (Screenshots or GIF)
- Stage tile click → drilldown opens with venture list
- Search input filters list in real-time
- Keyboard navigation works (↑/↓ navigate, Enter opens detail)
- Detail drawer shows:
  - Venture name, stage, owner, priority
  - PRD/CR/Repo links (clickable or copy button)
  - Related workstreams section
  - Blockers section
  - Recent activity section

### 3. File Changes
- List of all new/modified files
- Line counts (e.g., "+450 lines mission-control-ui/public/drilldown.js")
- Confirm no changes to /canon, /config, /ventures core

### 4. Rollback Steps
```bash
git revert <commits>
# OR
git checkout HEAD -- mission-control-ui/ scripts/mission-control-export.js
npm test  # Verify tests still pass
```

### 5. Test Results
- ESLint output (0 errors)
- Unit test output (all pass)
- Integration test output (all pass)
- Drift audit output (clean)

---

## Rollback Plan

If critical issues discovered post-deploy:

```bash
# 1. Revert code
git revert <commit-hash>  # The CR-MC-UI-1.2 merge commit

# 2. Restart server
pkill -f "node server.js"
cd mission-control-ui && npm install && node server.js &

# 3. Verify
curl -s http://localhost:3000/api/ventures | jq '.total'

# Impact: Removes drilldown/detail/keyboard nav. Venture tiles revert to static counts.
```

**Data files** (venture_scoreboard.json) are unaffected by code rollback.

---

**CR ID:** CR-MC-UI-1.2  
**Date:** 2026-03-05 06:20 EST  
**Scope:** ~2-3 weeks, 1 engineer (Codesmith)  
**Risk:** Low (local data only, read-only UI, well-scoped, comprehensive spec)  
**Acceptance:** Full interactive venture pipeline with keyboard + click nav, search, filters, detail view, deep linking, data freshness warnings
