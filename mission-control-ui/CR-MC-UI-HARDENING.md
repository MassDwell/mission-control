# Change Request: CR-MC-UI-HARDENING

**Title:** Mission Control — UI Hardening & Layout Control  
**Date:** 2026-03-05 17:54 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P0 (Blocking usability)  
**Scope:** Panel resizing, expand/collapse, layout persistence  
**Timeline:** 1 week  
**Status:** APPROVED FOR IMMEDIATE EXECUTION  

---

## EXECUTIVE SUMMARY

Mission Control panels are too small and fixed. Operators need dynamic layout control to make the dashboard useful.

**Implement:**
- ✅ Resizable panels (drag handles)
- ✅ Expand/collapse with full-width modes
- ✅ Layout persistence (browser localStorage)
- ✅ Threshold tuning (8h stalled, 4+ workstreams, actual evidence for growth)
- ✅ Panel priority ordering

**Result:** Mission Control feels like an operator console, not a fixed dashboard. Layout customizable per operator workflow.

---

## OBJECTIVE 1: RESIZABLE PANELS

### Panels to Support
- Agent Activity (timeline)
- Active Work (workstreams table)
- Blocked Work (blocker console)
- Venture Pipeline (stage flow)
- Insights (detection panel)
- Opportunity Discovery (feed)
- Momentum Tracker (progress)
- Operator Impact (metrics)

### Implementation

**UI Pattern:**
```
┌──────────────────────────────────────┐
│ [Title] [...actions...]    [↗ expand] │  ← Header with control
├──────────────────────────────────────┤
│                                       │
│  Panel Content                        │
│                                       │
│                                       │
└──────────────────────────────────────┘  ← Resize handle (drag)
```

**Drag Handle:**
- Bottom-right corner of each panel
- Visual indicator: `⋰` or `↘` icon
- Cursor change on hover: `cursor: nwse-resize`
- Drag activates panel resize
- Minimum size: 300x200px
- Maximum size: 100vw x 100vh

**Keyboard Support:**
- Tab to focus panel
- Arrow keys to resize (if focused)

### CSS & JS

**CSS:**
```css
.panel {
  resize: both;
  overflow: auto;
  position: relative;
  border: 1px solid #333;
}

.panel::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: url('data:image/svg+xml;...') no-repeat center;
}
```

**JS (using native browser resize):**
- Use CSS `resize: both` for native browser behavior
- OR implement manual drag handler (ResizeObserver)
- Store size in localStorage on every resize

---

## OBJECTIVE 2: EXPAND/COLLAPSE

### Features

**Collapse:**
- Button in panel header: `[-]` or `collapse`
- Collapses to header only (0 height)
- Saves collapsed state to localStorage

**Expand:**
- Button in panel header: `[+]` or `expand`
- Expands to last saved height
- Or default height if first time

**Full-Width Mode:**
- Button in panel header: `[⇔]` or `fullwidth`
- Expands panel to fill entire dashboard width
- Other panels hidden
- Shows `[← back]` button to restore grid

**Full-Screen Mode** (optional, for detailed inspection)
- Button in panel header: `[⛶]` or `fullscreen`
- Panel takes entire viewport
- Shows modal overlay
- Close with ESC or [X] button

### Implementation

**Header Controls:**
```html
<div class="panel-header">
  <h3>Agent Activity</h3>
  <div class="controls">
    <button class="toggle-fullwidth" title="Full Width">⇔</button>
    <button class="toggle-collapse" title="Collapse">-</button>
  </div>
</div>
```

**Collapse/Expand:**
```javascript
panel.addEventListener('collapse', () => {
  panel.classList.add('collapsed');
  localStorage.setItem(`panel_${id}_collapsed`, 'true');
});
```

**Full-Width Mode:**
```javascript
panel.addEventListener('fullwidth', () => {
  dashboard.classList.add('single-panel-mode');
  panel.classList.add('fullwidth');
  otherPanels.forEach(p => p.style.display = 'none');
  localStorage.setItem(`panel_${id}_fullwidth`, 'true');
});
```

---

## OBJECTIVE 3: LAYOUT PERSISTENCE

### LocalStorage Schema

**Key:** `mission_control_layout`

**Value:**
```json
{
  "panels": {
    "agent_activity": {
      "width": 450,
      "height": 600,
      "collapsed": false,
      "fullwidth": false,
      "x": 0,
      "y": 0
    },
    "active_work": {
      "width": 600,
      "height": 500,
      "collapsed": false,
      "fullwidth": false,
      "x": 450,
      "y": 0
    },
    ...
  },
  "lastUpdated": "2026-03-05T22:00:00Z"
}
```

### Implementation

**On Page Load:**
```javascript
function restoreLayout() {
  const layout = JSON.parse(localStorage.getItem('mission_control_layout') || '{}');
  
  Object.entries(layout.panels || {}).forEach(([panelId, state]) => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    panel.style.width = `${state.width}px`;
    panel.style.height = `${state.height}px`;
    
    if (state.collapsed) {
      panel.classList.add('collapsed');
    }
    
    if (state.fullwidth) {
      // Restore full-width mode
      panel.classList.add('fullwidth');
      // Hide siblings
    }
  });
}

restoreLayout();
```

**On Change:**
```javascript
function saveLayout() {
  const layout = {
    panels: {},
    lastUpdated: new Date().toISOString()
  };
  
  document.querySelectorAll('.panel').forEach(panel => {
    layout.panels[panel.id] = {
      width: panel.offsetWidth,
      height: panel.offsetHeight,
      collapsed: panel.classList.contains('collapsed'),
      fullwidth: panel.classList.contains('fullwidth'),
      x: panel.offsetLeft,
      y: panel.offsetTop
    };
  });
  
  localStorage.setItem('mission_control_layout', JSON.stringify(layout));
}

// Debounced save on resize
window.addEventListener('resize', () => {
  clearTimeout(saveLayoutTimeout);
  saveLayoutTimeout = setTimeout(saveLayout, 1000);
});
```

---

## OBJECTIVE 4: THRESHOLD TUNING

### Detection Rules (Updated)

**Stalled Workstream:**
- Changed from: 12 hours
- Changed to: **8 hours**
- If last_event timestamp > 8h old
- Severity: warning

**Agent Overload:**
- Changed from: 5+ workstreams
- Changed to: **4+ workstreams**
- If agent owns ≥4 workstreams AND any workstream is blocked
- Severity: warning

**Fast Growth:**
- Changed from: ≥80% in 6h (placeholder threshold)
- Changed to: **Actual venture metric evidence only**
- Rules:
  1. Check `venture_scoreboard.json` for explicit `progress` field increase
  2. Check `agent_activity.json` for completion events (not estimated)
  3. If actual metric (not interpolated) > 50% in 6h: trigger
  4. Only trigger if: completion event OR explicit progress update in SSOT
- Severity: positive

---

## OBJECTIVE 5: PANEL PRIORITY ORDERING

### Dashboard Layout (New)

**Reorder panels by operator preference:**

1. **Top Left: Active Work** (highest priority)
   - Real workstreams, progress, owners, ETAs
   - This is what operator executes on

2. **Top Right: Blocked Work** (second highest)
   - Blockers, severity, SLA timers
   - What's preventing progress

3. **Middle Left: Insights** (critical intelligence)
   - Auto-detected issues, stalled work, overload
   - What needs attention now

4. **Middle Right: Opportunity Discovery** (exploration)
   - New ideas, automation opportunities
   - What's on the horizon

5. **Bottom Left: Momentum** (motivational)
   - Progress visualization, velocity
   - Showing forward progress

6. **Bottom Right: Operator Impact** (tracking)
   - Your influence multiplier, downstream effects
   - How your actions compound

**Reasoning:** Operator cares most about execution (work) → blockers (problems) → intelligence (guidance) → discovery (exploration) → motivation (psychology).

---

## OBJECTIVE 6: COMPREHENSIVE VERIFICATION

### Tests to Run

**A. All Endpoints Live**

Test each endpoint:
```bash
curl -s http://localhost:3000/api/workstreams | jq .
curl -s http://localhost:3000/api/workstreams/backend-api-scaffolding | jq .
curl -s http://localhost:3000/api/blockers | jq .
curl -s http://localhost:3000/api/blockers/blocker-001 | jq .
curl -s http://localhost:3000/api/system-status | jq .
curl -s http://localhost:3000/api/workstream-flow | jq .
curl -s http://localhost:3000/api/agents | jq .
curl -s http://localhost:3000/api/insights | jq .
curl -s http://localhost:3000/api/momentum | jq .
curl -s http://localhost:3000/api/impact | jq .
curl -s http://localhost:3000/api/opportunities | jq .
curl -s http://localhost:3000/api/ventures | jq .
curl -s http://localhost:3000/api/ventures/leadscore-ai | jq .
```

**Verify:**
- ✅ All endpoints return 200
- ✅ All responses have `lastUpdated` field
- ✅ No null/undefined values
- ✅ All data sourced from SSOT (check sources field)

**B. Active Agent Count (Dynamic)**

Test:
```bash
# Run this 3 times, 30 seconds apart
curl -s http://localhost:3000/api/agents | jq '.agents | length'
# Should show: 4 (all active)
```

Verify:
- ✅ Count always reflects agents_runtime.json
- ✅ No hardcoded values
- ✅ Matches canonical agent list (Clawson, Codesmith, Moonshot, Personal Assistant)

**C. No Placeholder Data**

Search UI for:
- ❌ "N/A" without explanation
- ❌ "0" for metrics without source
- ❌ "TBD" or "PENDING"
- ❌ "example" or "sample"
- ❌ "[object Object]"

If found, trace to SSOT source and fix.

**D. All Data SSOT-Backed**

Verify every metric comes from a SSOT file:
```
Agent Activity → agent_activity.json ✅
Active Work → workstreams.json ✅
Blocked Work → blocked_work.json ✅
Venture Pipeline → venture_scoreboard.json ✅
System Status → agents_runtime.json ✅
Insights → system_insights.json ✅
Momentum → venture_scoreboard.json + agent_activity.json ✅
Operator Impact → agent_activity.json ✅
Opportunities → agent_activity.json ✅
```

**E. Layout Persistence**

Test:
1. Open dashboard
2. Resize Agent Activity panel to 800px wide
3. Collapse Blocked Work panel
4. Set Active Work to full-width
5. Refresh page (F5)
6. Verify:
   - Agent Activity is still 800px wide ✅
   - Blocked Work is still collapsed ✅
   - Active Work is still full-width ✅

---

## IMPLEMENTATION PHASES

### Phase 1 (Days 1-2): Panel Resizing + Collapse
- [ ] Add CSS for resizable panels
- [ ] Implement drag handles (ResizeObserver or native resize)
- [ ] Add expand/collapse buttons
- [ ] Add full-width toggle
- [ ] Update panel headers with controls

### Phase 2 (Days 2-3): Layout Persistence
- [ ] Implement localStorage schema
- [ ] Save layout on every change (debounced)
- [ ] Restore layout on page load
- [ ] Test across browser sessions

### Phase 3 (Days 3-4): Threshold Tuning
- [ ] Update system_insights.json detection rules
- [ ] Update insight computation logic (8h, 4+ WS, actual evidence)
- [ ] Test all thresholds with real data

### Phase 4 (Days 4-5): Panel Reordering
- [ ] Reorder dashboard grid layout
- [ ] CSS grid reorganization
- [ ] Test panel hierarchy looks right

### Phase 5 (Days 5-7): Verification & Testing
- [ ] Test all 13 endpoints (live, 200, no placeholders)
- [ ] Verify agent count is dynamic
- [ ] Verify no synthetic data
- [ ] Verify layout persistence across sessions
- [ ] Full regression testing
- [ ] ESLint clean
- [ ] No console errors

---

## DELIVERABLES

**1. Code Implementation**
- Commit with all 5 phases
- Resizable panels with drag handles
- Expand/collapse/full-width controls
- LocalStorage persistence
- Updated thresholds
- Panel reordering

**2. Screenshots**
- Dashboard with resized panels
- Collapsed panel example
- Full-width mode example
- Layout persisted after refresh

**3. Verification Report**
```markdown
# Mission Control UI Hardening — Verification Report

## Endpoints Tested (13 total)
- ✅ /api/workstreams (200, 3 items, SSOT-backed)
- ✅ /api/workstreams/backend-api-scaffolding (200, full detail)
- ✅ /api/blockers (200, 0 items)
- ✅ /api/blockers/:id (200/404 handled)
- ✅ /api/system-status (200, 4 agents)
- ✅ /api/workstream-flow (200, 6 stages)
- ✅ /api/agents (200, dynamic count = 4)
- ✅ /api/insights (200, 3 insights)
- ✅ /api/momentum (200, velocity metrics)
- ✅ /api/impact (200, operator actions)
- ✅ /api/opportunities (200, ideas + automations)
- ✅ /api/ventures (200, 1 venture)
- ✅ /api/ventures/leadscore-ai (200, full detail)

## Agent Count Verification
- Test 1: 4 agents ✅
- Test 2: 4 agents ✅
- Test 3: 4 agents ✅
- Source: agents_runtime.json (dynamic, not hardcoded)

## Placeholder Data Check
- Searched for: "N/A", "0", "TBD", "PENDING", "example", "[object Object]"
- Results: 0 placeholder values found ✅

## SSOT Sourcing
- Agent Activity → agent_activity.json ✅
- Active Work → workstreams.json ✅
- Blocked Work → blocked_work.json ✅
- All metrics traceable ✅

## Layout Persistence
- Resize panel → reload → size persists ✅
- Collapse panel → reload → stays collapsed ✅
- Full-width mode → reload → stays full-width ✅
- localStorage key: `mission_control_layout` ✅
```

---

## SUCCESS CRITERIA

✅ All 8 panels resizable with drag handles  
✅ All panels support expand/collapse  
✅ All panels support full-width mode  
✅ Layout persisted to localStorage  
✅ Layout restored on page reload  
✅ Thresholds updated (8h, 4+, actual evidence)  
✅ Panels reordered by priority (Work → Blockers → Insights → Discovery → Momentum → Impact)  
✅ All 13 endpoints returning live data  
✅ Agent count dynamic and always 4  
✅ Zero placeholder data in UI  
✅ All metrics SSOT-backed  
✅ No console errors  
✅ ESLint clean  
✅ Layout persistence verified across 3 sessions  

---

**CR ID:** CR-MC-UI-HARDENING  
**Date:** 2026-03-05 17:54 EST  
**Timeline:** 1 week, 1 FTE (Codesmith)  
**Risk:** Low (UI enhancements, no data changes)  
**Acceptance:** Dashboard is operator-usable with dynamic layout control + all data verified live + zero placeholders
