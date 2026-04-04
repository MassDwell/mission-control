# CHANGE REQUEST: Mission Control Agent Activity Stream

**CR ID:** CR-005  
**Date Created:** 2026-03-04 16:33 EST  
**Status:** APPROVED (by Clawson on behalf of Steve Vettori)  
**Risk Tier:** LOW  
**Assigned to:** Codesmith  
**Est. Effort:** 2-3 hours  
**Related CR:** CR-002 (Mission Control UI V1)  

---

## OBJECTIVE

Upgrade the Mission Control Agent Activity panel to display a real-time activity stream showing recent system actions. Convert static agent status into a dynamic scrolling feed of what's actually happening.

**Current state:** Agent Activity panel shows uptime/status only.

**New state:** Real-time scrolling feed of agent actions (newest first, 50-item limit).

---

## SCOPE

### Data Source (Read-Only)
```
data/mission-control/agent_activity.json
```

### What Codesmith Can Modify
- `mission-control-ui/public/` (HTML/CSS/JS)
- `mission-control-ui/api/` (data loading)
- `mission-control-ui/` directory only
- New routes in server.js for activity feed endpoint

### What Codesmith CANNOT Modify
- ❌ canon/ directory
- ❌ registry.json
- ❌ agent definitions
- ❌ agent_activity.json (read-only data source)
- ❌ system governance
- ❌ cron jobs
- ❌ compiled config

---

## REQUIREMENTS

### 1. Activity Entry Schema Validation

Each activity entry in `agent_activity.json` must have:

```json
{
  "agent": "string",           // Required: clawson, codesmith, moonshot, personal-assistant, system
  "action": "string",          // Required: description of what happened
  "timestamp": "ISO-8601",     // Required: when it happened
  "severity": "info|warning|critical", // Required: default=info if missing
  "source": "agent|system"     // Required: default=agent if missing
}
```

**Codesmith must:**
- ✓ Validate all fields are present
- ✓ Add default severity="info" if missing
- ✓ Add default source="agent" if missing
- ✓ Handle missing/malformed entries gracefully (skip them)
- ✓ Sort by timestamp descending (newest first)

### 2. Activity Feed Display

**Panel:** LEFT panel (Agent Activity section)

**Layout:**
```
AGENT ACTIVITY
═════════════════════════════════════════

Clawson — Deployed CR-004: Mission Control UI Auto-Start
  🕐 2026-03-04 16:27 EST | ℹ️ info

Codesmith — Started CR-002 (Mission Control UI build)
  🕐 2026-03-04 15:44 EST | ℹ️ info

Personal Assistant — Completed inbox cleanup (14 archived)
  🕐 2026-03-04 16:23 EST | ℹ️ info

Moonshot — Generated venture memo (idea_001)
  🕐 2026-03-04 14:52 EST | ⚠️ warning [if applicable]

System — Compiled configuration (v1.0.0-20260304_151816)
  🕐 2026-03-04 15:13 EST | ℹ️ info

[scroll continues]
```

### 3. UI Behavior

**Scrolling Feed:**
- ✓ Display newest activities at top
- ✓ Oldest activities at bottom
- ✓ Limit display to last 50 entries
- ✓ Scrollable container (if more than fits)
- ✓ Max height: ~300px (responsive, can scroll)

**Severity Indicators:**
- `info` → ℹ️ Gray text, normal styling
- `warning` → ⚠️ Yellow/amber highlight
- `critical` → ✕ Red highlight, bold text

**Timestamp Format:**
- Show relative time: "2 minutes ago", "1 hour ago", "2026-03-04 16:27 EST"
- Tooltip: Full ISO timestamp on hover

**Auto-Refresh:**
- Feed updates every 10 seconds (same as main dashboard)
- New entries appear at top smoothly
- Old entries pushed down
- Scrollbar resets to top on each refresh

### 4. API Endpoint

**Create:** `GET /api/activity-feed`

**Response:**
```json
{
  "timestamp": "2026-03-04T16:33:00Z",
  "feed": [
    {
      "agent": "clawson",
      "action": "Deployed CR-004: Mission Control UI Auto-Start",
      "timestamp": "2026-03-04T16:27:00Z",
      "severity": "info",
      "source": "clawson",
      "relative_time": "6 minutes ago"
    },
    { ... }
  ],
  "total_entries": 43,
  "displayed": 50,
  "since": "2026-03-04T16:27:00Z"
}
```

### 5. Data Loading

**Update `api/data.js`:**
- ✓ Load agent_activity.json
- ✓ Parse and validate entries
- ✓ Add default severity/source if missing
- ✓ Sort by timestamp descending
- ✓ Limit to last 50 for display
- ✓ Calculate relative_time field
- ✓ Return with metadata

**Caching:**
- Load fresh from disk on each `/api/activity-feed` request
- No caching (real-time updates)

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Activity feed displays in LEFT panel (Agent Activity section)
- [ ] Shows newest activities at top
- [ ] Displays at least 50 activities (if available)
- [ ] Scrollable if more than viewport height
- [ ] Auto-updates every 10 seconds with latest activities
- [ ] Severity badges display correctly (info, warning, critical)
- [ ] Timestamps show relative time + ISO on hover
- [ ] Missing fields handled gracefully (defaults applied)
- [ ] `/api/activity-feed` endpoint returns valid JSON
- [ ] No console errors

### Non-Functional
- [ ] Load time: <200ms for activity feed rendering
- [ ] Smooth scrolling (no jank)
- [ ] Responsive design (mobile-friendly fallback)
- [ ] No memory leaks (clean up old DOM elements)

### Quality Gates
- [ ] Format & Lint: Clean code, proper syntax
- [ ] Type Checking: Correct field types, no type mismatches
- [ ] Unit Tests: Activity parsing, severity defaults, sorting
- [ ] Integration Tests: Full feed renders with sample data
- [ ] Preflight: No external dependencies, no config changes
- [ ] Drift Audit: No modifications to canon/ or config/
- [ ] Smoke Test: Feed loads and displays without errors

---

## FILES TO MODIFY

### Existing Files (CR-002 continuation)
1. `mission-control-ui/api/data.js`
   - Add `loadActivityFeed()` function
   - Validate and parse agent_activity.json
   - Apply defaults for missing fields
   - Return sorted + limited results

2. `mission-control-ui/server.js`
   - Add `GET /api/activity-feed` endpoint
   - Call loadActivityFeed() and return JSON

3. `mission-control-ui/public/script.js`
   - Add `renderActivityFeed(data)` function
   - Update `setInterval` to fetch from `/api/activity-feed`
   - Implement smooth scrolling behavior
   - Calculate and update relative times

4. `mission-control-ui/public/index.html`
   - Add scrollable activity feed container in LEFT panel
   - Replace static agent list with dynamic feed

5. `mission-control-ui/public/style.css`
   - Add `.activity-feed` styling
   - Add `.activity-item` styling
   - Add severity badge colors (info, warning, critical)
   - Add scrollbar styling
   - Responsive breakpoints

### New Files
- None (all changes within mission-control-ui/)

---

## VALIDATION & TESTING

### Manual Tests (Smoke)
1. Load dashboard at http://localhost:3000
2. Navigate to LEFT panel (Agent Activity)
3. Verify feed displays with real data from agent_activity.json
4. Verify newest activities at top
5. Verify severity badges show correct colors
6. Verify timestamps display relative time
7. Wait 10 seconds → verify feed auto-updates
8. Scroll feed → verify scrolling works smoothly
9. Check console → no errors

### Data Validation
- [ ] All entries have agent field
- [ ] All entries have action field
- [ ] All entries have timestamp field
- [ ] Severity field is one of: info, warning, critical
- [ ] Source field is one of: agent, system
- [ ] Timestamps are valid ISO-8601
- [ ] Feed is sorted by timestamp (newest first)

---

## DELIVERABLES

1. **Updated Code Files**
   - Modified: api/data.js, server.js, public/script.js, public/index.html, public/style.css
   - Changes: Activity feed implementation, validation, sorting, UI rendering

2. **Validation Report**
   - Test results (all criteria met)
   - Performance metrics (load time, memory)
   - Known issues (if any)
   - Rollback instructions

3. **Rollback Plan**
   - Revert files to CR-002 Day 1 Checkpoint state
   - Restore static agent activity panel
   - Remove `/api/activity-feed` endpoint
   - `git checkout HEAD~1 mission-control-ui/` (if using git)

4. **Documentation**
   - API endpoint spec (`/api/activity-feed`)
   - Activity schema validation rules
   - UI behavior notes
   - Troubleshooting guide

---

## TIMELINE

### Day 1 (Today - 3 hours max)
1. [ ] Update api/data.js (activity loading + validation)
2. [ ] Add server.js endpoint
3. [ ] Implement renderActivityFeed() in script.js
4. [ ] Update HTML layout and CSS
5. [ ] Manual testing + quality gates
6. [ ] Report results

---

## NOTES

- **No data modification:** Activity feed is read-only from agent_activity.json
- **Graceful degradation:** If data is missing, show placeholder
- **Real-time updates:** Fresh from disk every 10 seconds (no caching)
- **Severity escalation:** Critical items highlighted, warnings amber, info gray
- **Permanent feature:** Once deployed, dashboard will show live activity stream

---

## ARCHITECTURE IMPACT

### Changes
- ✓ New UI rendering in LEFT panel
- ✓ New API endpoint: `/api/activity-feed`
- ✓ New data validation function: `loadActivityFeed()`

### No Breaking Changes
- ✓ Existing endpoints unchanged
- ✓ No system governance affected
- ✓ No agent definitions changed
- ✓ No registry modifications
- ✓ No cron job changes
- ✓ Read-only data access

---

## APPROVAL

**Approved by:** Clawson  
**On behalf of:** Steve Vettori  
**Date:** 2026-03-04 16:33 EST  
**Decision:** APPROVED

**Approval Text:**
"Approved: codesmith — Mission Control Agent Activity Stream (real-time feed in dashboard, 50-item limit, severity highlighting)"

---

**Status:** READY FOR CODESMITH EXECUTION
