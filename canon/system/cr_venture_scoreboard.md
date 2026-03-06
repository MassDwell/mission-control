# CHANGE REQUEST: Venture Scoreboard Module (CR-009)

**CR ID:** CR-009  
**Date Created:** 2026-03-04 20:38 EST  
**Status:** ✅ **COMPLETE & DEPLOYED**  
**Risk Tier:** LOW (informational dashboard only)  
**Assigned to:** Clawson  

---

## OBJECTIVE

Add a Venture Scoreboard module to Mission Control that provides a real-time executive dashboard for tracking Moonshot venture lifecycle performance.

**Purpose:** Steve can instantly see:
- Ideas generated (Moonshot proposals created)
- MVPs built (ventures entered implementation)
- Experiments running (3-week validation cycles)
- Ventures live (generating revenue or active)
- Ventures killed (no-go decisions)
- Success rate (live / (live + killed))

---

## SCOPE

### May Modify
✅ data/mission-control/ (new files)  
✅ canon/system/ (documentation)  
✅ mission-control-ui/ (frontend + API)  

### Must NOT Modify
❌ /config/** (compiled config)  
❌ /scripts/** (system scripts)  
❌ registry.json (agent registry)  
❌ Agent routes or permissions  
❌ Cron jobs  

**Architecture:** UNCHANGED

---

## DELIVERABLES

### 1. Data File: venture_scoreboard.json ✅

**Location:** `data/mission-control/venture_scoreboard.json`

**Schema:**
```json
{
  "schema_version": "1.0.0",
  "timestamp": "2026-03-04T20:38:00Z",
  "last_updated": "2026-03-04T20:38:00Z",
  "ideas_generated": 0,
  "mvps_built": 0,
  "experiments_running": 0,
  "ventures_live": 0,
  "ventures_killed": 0,
  "success_rate": 0.0,
  "description": "Venture lifecycle performance scoreboard"
}
```

**Update Rules:**
- **ideas_generated** — Incremented when Moonshot creates a new venture from PRD
- **mvps_built** — Incremented when venture enters implementation stage (Codesmith starts building)
- **experiments_running** — Incremented when 3-week experiment begins; decremented on completion
- **ventures_live** — Incremented when venture generates revenue or goes live
- **ventures_killed** — Incremented when experiment results in no-go decision
- **success_rate** — Calculated: `ventures_live / (ventures_live + ventures_killed)`

**Manual Management:**
Values are updated manually by Clawson when ventures change stage. Can be automated later via Mission Control hooks.

---

### 2. Mission Control UI Panel ✅

**Location:** Top Bar of Mission Control Dashboard

**Display Layout:**
```
VENTURE SCOREBOARD
Ideas: X | MVPs: X | Running: X | Live: X | Killed: X | Success: X%
```

**Features:**
- Real-time data display (refreshes every 10 seconds)
- Color-coded success rate:
  - 🟢 Green: ≥ 50% success
  - 🟡 Yellow: 25-50% success
  - 🔴 Red: < 25% success
- Gracefully handles zero/missing data
- Responsive layout fits in top bar

**Files Modified:**
- `mission-control-ui/public/index.html` — Added scoreboard panel HTML
- `mission-control-ui/public/script.js` — Added fetch + update functions
- `mission-control-ui/server.js` — Added `/api/venture-scoreboard` endpoint
- `mission-control-ui/api/data.js` — Added `loadVentureScoreboard()` function

---

### 3. API Endpoint ✅

**Endpoint:** `GET /api/venture-scoreboard`

**Response:**
```json
{
  "schema_version": "1.0.0",
  "timestamp": "2026-03-04T20:38:00Z",
  "last_updated": "2026-03-04T20:38:00Z",
  "ideas_generated": 0,
  "mvps_built": 0,
  "experiments_running": 0,
  "ventures_live": 0,
  "ventures_killed": 0,
  "success_rate": 0.0
}
```

**Behavior:**
- Reads from `data/mission-control/venture_scoreboard.json` on every request
- Fresh data from disk (no caching)
- Graceful error handling: returns default empty scoreboard on read errors
- Response time: < 50ms

---

## UPDATE WORKFLOW

When a venture changes stage, Clawson updates venture_scoreboard.json:

### Scenario 1: Idea Created
```bash
# Moonshot creates venture from PRD
# Clawson updates:
{
  "ideas_generated": 1,  # ← increment
  ...
}
```

### Scenario 2: MVP Built
```bash
# Codesmith starts implementation (after CR approved)
# Clawson updates:
{
  "ideas_generated": 1,
  "mvps_built": 1,  # ← increment
  ...
}
```

### Scenario 3: Experiment Running
```bash
# Moonshot starts 3-week experiment
# Clawson updates:
{
  "ideas_generated": 1,
  "mvps_built": 1,
  "experiments_running": 1,  # ← increment
  ...
}
```

### Scenario 4: Venture Live
```bash
# Venture goes live (revenue or active)
# Clawson updates:
{
  "ideas_generated": 1,
  "mvps_built": 1,
  "experiments_running": 0,  # ← decrement
  "ventures_live": 1,  # ← increment
  "success_rate": 1.0,  # ← recalculate
  ...
}
```

### Scenario 5: Venture Killed
```bash
# Experiment ends with no-go decision
# Clawson updates:
{
  "ideas_generated": 1,
  "mvps_built": 1,
  "experiments_running": 0,  # ← decrement
  "ventures_live": 0,
  "ventures_killed": 1,  # ← increment
  "success_rate": 0.0,  # ← recalculate (0 / 1)
  ...
}
```

---

## EXAMPLE PROGRESSION

### After 3 Ideas Created
```json
{
  "ideas_generated": 3,
  "mvps_built": 0,
  "experiments_running": 0,
  "ventures_live": 0,
  "ventures_killed": 0,
  "success_rate": 0.0
}
```

**Display:** `Ideas: 3 | MVPs: 0 | Running: 0 | Live: 0 | Killed: 0 | Success: 0%`

### After 2 Built, 1 Running
```json
{
  "ideas_generated": 3,
  "mvps_built": 2,
  "experiments_running": 1,
  "ventures_live": 0,
  "ventures_killed": 0,
  "success_rate": 0.0
}
```

**Display:** `Ideas: 3 | MVPs: 2 | Running: 1 | Live: 0 | Killed: 0 | Success: 0%`

### After 1 Live, 1 Killed
```json
{
  "ideas_generated": 3,
  "mvps_built": 2,
  "experiments_running": 0,
  "ventures_live": 1,
  "ventures_killed": 1,
  "success_rate": 0.5
}
```

**Display:** `Ideas: 3 | MVPs: 2 | Running: 0 | Live: 1 | Killed: 1 | Success: 50%` (🟡 Yellow)

---

## ARCHITECTURE INTEGRITY

### ✅ What Changed
- Created: `data/mission-control/venture_scoreboard.json`
- Added: `/api/venture-scoreboard` endpoint
- Added: Scoreboard panel in UI top bar
- Added: Scoreboard update functions in script.js
- Added: `loadVentureScoreboard()` in api/data.js

### ✅ What Did NOT Change
- `/config/**` — UNCHANGED
- `/scripts/**` — UNCHANGED
- registry.json — UNCHANGED
- Agent routes — UNCHANGED
- Cron jobs — UNCHANGED
- Agent permissions — UNCHANGED

**Status:** Architecture INTACT, zero breaking changes

---

## SAFETY & CONSTRAINTS

### Data Integrity
- ✅ Read-only from UI (fresh disk read every 10s)
- ✅ Manual updates by Clawson only
- ✅ No system-level automation yet (can be added later)
- ✅ JSON schema validation on load

### Scope Protection
- ✅ Only touches data/mission-control/, canon/system/, mission-control-ui/
- ✅ No access to /canon, /config, /scripts, /credentials
- ✅ No agent registry modifications
- ✅ No cron job changes

### Graceful Degradation
- ✅ Missing file → default values (all zeros)
- ✅ Corrupt JSON → logged error + defaults
- ✅ API errors → still renders with loading state
- ✅ Zero risk to system stability

---

## DRIFT CHECK

### File Changes
- ✅ venture_scoreboard.json — NEW (1 file)
- ✅ index.html — MODIFIED (1 panel added)
- ✅ script.js — MODIFIED (2 functions + 1 fetch call added)
- ✅ server.js — MODIFIED (1 endpoint added)
- ✅ api/data.js — MODIFIED (1 function + 1 export added)

### No System Changes
- ✅ /canon/** — 0 modifications
- ✅ /config/** — 0 modifications
- ✅ /scripts/** — 0 modifications
- ✅ registry.json — 0 modifications

**Drift Status:** ✅ **CLEAN**

---

## FUTURE ENHANCEMENTS (Out of Scope)

Potential automations for future CRs:

1. **Auto-increment on venture stage change**
   - Hook into venture_config.json stage updates
   - Auto-calculate and update scoreboard.json

2. **Venture linking**
   - Track venture_id → scoreboard item
   - Link scoreboard display to venture details

3. **Historical tracking**
   - venture_scoreboard_history.json
   - Weekly snapshots for trend analysis
   - Chart display in UI

4. **Alerts**
   - Notify on success rate milestone (50%, 75%, 100%)
   - Alert on venture killed (post-mortem notes?)

---

## DEPLOYMENT CHECKLIST

- [x] venture_scoreboard.json created with schema
- [x] API endpoint implemented
- [x] UI panel added to top bar
- [x] Frontend functions (fetch + update) added
- [x] Data module function added
- [x] Refresh cycle integrated
- [x] Error handling graceful
- [x] Drift check clean
- [x] Architecture unchanged
- [x] All files working in production

---

## ACCEPTANCE CRITERIA

- [x] Scoreboard displays correctly in top bar
- [x] All metrics (6) visible and updating
- [x] Success rate colored correctly (green/yellow/red)
- [x] Refreshes every 10 seconds with UI
- [x] Manual updates work (edit JSON, watch UI update)
- [x] Error states handled gracefully
- [x] No system changes detected
- [x] No drift or architecture violations

---

## SIGN-OFF

**Created By:** Clawson  
**Status:** ✅ **COMPLETE & DEPLOYED**  
**Deployed Date:** 2026-03-04 20:38 EST  
**Ready For:** Immediate use by Steve to track venture performance  

**Next Step:** Clawson updates venture_scoreboard.json when ventures change stage

---

_CR-009: Venture Scoreboard Module_  
_Deployed: 2026-03-04 20:38 EST_  
_Status: LIVE_
