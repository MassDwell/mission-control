# Change Request: CR-MC-3MODE-OPERATOR-CONSOLE

**Title:** Mission Control — 3-Mode Operator Console UI  
**Date:** 2026-03-05 18:36 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P0 (UX/Usability)  
**Scope:** UI-only redesign (no backend changes)  
**Timeline:** 2 weeks  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

Mission Control is visually dense and cognitively noisy. Upgrade to a 3-mode architecture inspired by professional control systems (Palantir, trading terminals, air traffic control).

**Three Modes:**
1. **OPERATOR** (default) — Calm, daily-use view. Glanceable in <3 seconds.
2. **OPERATIONS** — Active workflow management. Real-time execution view.
3. **INTELLIGENCE** — Full Palantir-style deep intelligence + system telemetry.

**Key Changes:**
- Mode toggle in header (instant switching, no page reload)
- Panel show/hide based on mode
- Visual hierarchy (large, medium, small panels)
- Focus mode (expand panel to 80% screen)
- Color priority system (green/yellow/red/blue)
- Dopamine loop elements (progress bars, momentum, operator impact)
- Data integrity fixes (4 agents, SSOT lock)

**Result:** Professional operations console. Clean, readable, powerful, addictive to operate.

---

## MODE 1: OPERATOR MODE (Default)

### Purpose
Calm, daily-use view. Steve glances at system health without cognitive overload.

### Display (Show Only These Panels)
- **System Health** (small) — Agent status, green/yellow/red
- **Blocked Work** (small) — Critical blockers with red highlights
- **Active Agents** (small) — 4 agents with status indicators
- **Ventures Running** (medium) — Stage distribution + MRR
- **Critical Insights** (small) → Auto-collapsed, expands on hover

### Hide (These Panels)
- Relationship Graph
- Momentum Panel
- Opportunity Discovery
- Impact Tracker
- Full Agent Activity Feed
- Deep Workstream Metrics

### Layout
```
┌─ OPERATOR MODE ─────────────────────────────────┐
│ System Health │ Blocked Work │ Active Agents    │
├─────────────────────────────────────────────────┤
│ Ventures Running (Stage Distribution)           │
├─────────────────────────────────────────────────┤
│ Critical Insights (Collapsed, Click to Expand)  │
└─────────────────────────────────────────────────┘
```

### Visual Style
- Minimal, clean typography
- Large whitespace
- Color-coded status indicators
- No animations (static, calm)
- Readable at a glance

### Interaction
- Click any panel → Focus Mode (expands to 80%)
- ESC → Back to normal
- No default scrolling

---

## MODE 2: OPERATIONS MODE

### Purpose
Active workflow management. Steve is actively managing workstreams and operations.

### Display
- System Health (small)
- Blocked Work (medium) — Full blocker console with SLA timers
- Agent Activity (medium) — Real-time activity feed
- Active Work (large) — Workstreams table (primary focus)
- Workstream Flow (medium) — Stage distribution
- Venture Pipeline (medium) — Venture stage visualization

### Layout
```
┌─ OPERATIONS MODE ────────────────────────────────┐
│ System Health │ Blocked Work                     │
├──────────────────────────────────────────────────┤
│ Active Work (Primary - Large Panel)              │
├──────────────────────────────────────────────────┤
│ Workstream Flow │ Venture Pipeline               │
├──────────────────────────────────────────────────┤
│ Agent Activity (Real-time Feed)                  │
└──────────────────────────────────────────────────┘
```

### Focus
Active Work panel is primary (largest). Everything else supports it.

---

## MODE 3: INTELLIGENCE MODE

### Purpose
Palantir-style deep intelligence view. Full system telemetry.

### Display (All Panels)
- Relationship Graph (large) — Venture/workstream/agent relationships
- Momentum Panel (medium) — Progress + velocity
- Opportunity Discovery (medium) — New venture ideas
- Impact Tracker (medium) — Operator actions + downstream effects
- Insights Engine (medium) — Auto-detected issues + recommendations
- Agent Activity (medium) — Full activity timeline
- Venture Pipeline (large) — Full pipeline visualization
- Workstream Flow (medium) — Stage distribution
- System Health (small) — Agent + system metrics
- Blocked Work (medium) — Blocker console

### Layout
Comprehensive grid. All panels visible. Maximum information density.

---

## PANEL VISUAL HIERARCHY

**Not all panels equal weight.**

### Large Panels (Primary Focus)
- Active Work (in OPERATIONS mode)
- Relationship Graph (in INTELLIGENCE mode)
- Venture Pipeline (in all modes except OPERATOR)

Sizing: 60-70% screen height + width

### Medium Panels (Supporting)
- Insights Engine
- Momentum
- Opportunity Discovery
- Workstream Flow
- Venture Pipeline (in OPERATOR mode)
- Blocked Work (in OPERATIONS mode)
- Impact Tracker

Sizing: 40-50% screen height/width

### Small Panels (Reference)
- System Health
- Agent Activity (compact view)
- Active Agents
- Impact (daily counts)
- Blocked Work (in OPERATOR mode)

Sizing: 20-30% screen height/width

---

## FOCUS MODE (Panel Expansion)

### Feature
Clicking any panel expands it to 80% of viewport.

### Behavior
- Click panel header → Full panel view
- Other panels fade out (opacity: 0.2)
- Click panel again or ESC → Return to normal
- No page reload
- Instant transition

### Use Case
- Inspect Active Work in detail
- Review Relationship Graph
- Analyze full activity timeline

---

## COLOR PRIORITY SYSTEM

### Semantic Colors (Use Everywhere)

**🟢 Green** (Healthy)
- Agent online
- No blockers
- Build on track
- MRR growing

**🟡 Yellow** (Attention Needed)
- Agent idle (>1h)
- Workstream stalled (>8h)
- MRR trending below target
- Moderate blocker

**🔴 Red** (Blocked / Critical)
- Agent offline
- Critical blocker
- Venture killed
- MRR < target after 90 days
- Build overdue

**🔵 Blue** (Opportunity)
- New venture idea
- Opportunity for automation
- Fast growth detected
- Positive momentum

### Implementation
- System Health indicators: colored dots
- Venture tiles: colored border (green/yellow/red)
- Workstream rows: left border color (status)
- Insight cards: left border color (severity)
- Alert badges: background color

### Scanner Principle
Operators should scan dashboard using color. No reading required.

---

## DOPAMINE LOOP (Addictiveness)

### Element 1: Progress Bars

Every venture displays **3 progress bars:**

```
LeadScore.ai

Build Progress:     ████████░░ 80%
Validation:         ███████░░░ 70%
MRR Progress:       ██░░░░░░░░ 20%
```

Updates in real-time as metrics change.

### Element 2: Weekly Momentum Indicator

Display momentum status:

```
Momentum: ↑ Accelerating (5 workstreams completed this week)
Momentum: → Stable (1-2 completions/week)
Momentum: ↓ Slowing (0 completions this week)
```

Calculated from workstreams completed / week.

Visual icon changes (arrow up/stable/down) with emoji.

### Element 3: Operator Impact Panel

Track Steve's actions:

```
YOUR IMPACT (This Week)

✓ Ventures Approved:  2
✓ Blockers Cleared:   3
✓ Agents Optimized:   1
✓ Workstreams Moved:  5

Influence Multiplier: 2.8x
(Each action triggered 2.8 downstream changes)
```

Daily/weekly counts. Visible win conditions.

### Effect
- Feedback loop: Steve takes action → sees result
- Motivates continued engagement
- Addictive without being manipulative
- Genuine metric tracking

---

## DATA INTEGRITY FIXES

### Active Agents (Always Show 4)

**Must Display:**
- Clawson (orchestrator)
- Codesmith (engineering)
- Moonshot (ventures)
- Personal Assistant (operations)

**Must Remove:**
- sales_processor (legacy)
- reporting_engine (legacy)
- money_printer (archived)
- experimental bots
- kommo connectors

**Implementation:**
- Read from `agents_runtime.json` (canonical source)
- Filter status == "active"
- Display ordered: Clawson, Codesmith, Moonshot, Personal Assistant
- Never show dead agents

### SSOT Data Path Lock

**Single Source of Truth:** `/workspace/data/mission-control/`

**All panels must read from:**
- agent_activity.json
- workstreams.json
- blocked_work.json
- venture_scoreboard.json
- agents_runtime.json
- system_insights.json
- venture_pipeline.json

**Remove References To:**
- Supabase
- Legacy data directories
- Duplicate asset paths
- Cached data

**Verification:**
- Grep codebase for "supabase" (should be 0 matches in active code)
- All API calls hit `/api/*` endpoints (which read SSOT)
- No hardcoded data paths

---

## PANEL RESIZING CONTROLS

### Features

**A. Drag Resize**
- Bottom-right corner has resize handle (⋰ icon)
- Drag to resize panel
- Min size: 300x200
- Max size: 100% viewport

**B. Collapse / Expand**
- Header button: [-] collapse, [+] expand
- Collapsed panels show header only

**C. Full-Width Toggle**
- Header button: [⇔] full-width
- Panel expands to 100% width
- Other panels in row hidden

**D. Layout Persistence**
- Save to `localStorage: 'mc_layout'`
- Save on every resize (debounced 1s)
- Restore on page load
- Per-mode layout (OPERATOR, OPERATIONS, INTELLIGENCE each have own layout)

### Implementation
```javascript
// On resize
debounce(() => {
  const layout = {
    [mode]: {
      'panel_id': { width, height, collapsed, fullwidth }
    }
  };
  localStorage.setItem('mc_layout', JSON.stringify(layout));
}, 1000);

// On load
function restoreLayout(mode) {
  const layout = JSON.parse(localStorage.getItem('mc_layout') || '{}');
  Object.entries(layout[mode] || {}).forEach(([panelId, state]) => {
    const panel = document.getElementById(panelId);
    panel.style.width = state.width + 'px';
    panel.style.height = state.height + 'px';
    if (state.collapsed) panel.classList.add('collapsed');
  });
}
```

---

## MODE SWITCHING (Technical)

### Behavior
- Top-left corner has 3 buttons: [ OPERATOR ] [ OPERATIONS ] [ INTELLIGENCE ]
- Current mode highlighted
- Click to switch
- **Instant switch** (no page reload)
- Panels show/hide with CSS transitions (200ms fade)

### Implementation
```javascript
// Mode toggle
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const newMode = e.target.dataset.mode;
    setMode(newMode);
    
    // Update button highlight
    document.querySelectorAll('.mode-btn').forEach(b => 
      b.classList.remove('active')
    );
    e.target.classList.add('active');
    
    // Update panels (CSS display: none/block)
    updatePanelVisibility(newMode);
    
    // Restore layout for mode
    restoreLayout(newMode);
  });
});

function updatePanelVisibility(mode) {
  const panelsToShow = {
    'operator': ['system-health', 'blocked-work', 'active-agents', 'ventures', 'insights'],
    'operations': ['system-health', 'blocked-work', 'agent-activity', 'active-work', 'flow', 'ventures'],
    'intelligence': ['graph', 'momentum', 'discovery', 'impact', 'insights', 'activity', 'ventures', 'flow', 'health', 'blockers']
  };
  
  document.querySelectorAll('[data-panel]').forEach(panel => {
    const panelId = panel.dataset.panel;
    const isVisible = panelsToShow[mode].includes(panelId);
    panel.style.display = isVisible ? 'block' : 'none';
  });
}
```

---

## IMPLEMENTATION PHASES

### Phase 1 (Days 1-2): Mode Architecture
- [ ] Add mode toggle (3 buttons in header)
- [ ] Implement mode state management
- [ ] Add CSS for panel show/hide per mode
- [ ] Implement instant switching (no reload)

### Phase 2 (Days 2-4): Panel Configuration
- [ ] Configure OPERATOR mode panels (5 panels)
- [ ] Configure OPERATIONS mode panels (6 panels)
- [ ] Configure INTELLIGENCE mode (10 panels)
- [ ] Implement visual hierarchy (large/medium/small sizing)

### Phase 3 (Days 4-6): Focus Mode + Resizing
- [ ] Implement focus mode (80% expansion)
- [ ] Add panel resizing controls (drag, collapse, full-width)
- [ ] Implement localStorage persistence
- [ ] Test layout restoration

### Phase 4 (Days 6-8): Colors + Dopamine Loop
- [ ] Implement color system (green/yellow/red/blue)
- [ ] Add progress bars to ventures
- [ ] Add momentum indicator
- [ ] Add operator impact tracker

### Phase 5 (Days 8-10): Data Integrity + Testing
- [ ] Fix active agents (show 4, remove legacy)
- [ ] Lock to SSOT data path
- [ ] Remove Supabase references
- [ ] Full regression testing
- [ ] ESLint clean

---

## TESTING CHECKLIST

### Functional
- [ ] Mode toggle works instantly (no reload)
- [ ] Panels show/hide correctly per mode
- [ ] Focus mode expands + ESC closes
- [ ] Resizing works (drag, collapse, full-width)
- [ ] Layout persists (reload → layout restored)
- [ ] Color system applied everywhere
- [ ] Progress bars update in real-time
- [ ] Momentum indicator calculated correctly
- [ ] Operator impact tracked + displayed

### Data Integrity
- [ ] Active agents = 4 (Clawson, Codesmith, Moonshot, Personal Assistant)
- [ ] No legacy agents showing
- [ ] All data from SSOT path
- [ ] No Supabase references in code
- [ ] All metrics calculated from source files

### UX/Interaction
- [ ] OPERATOR mode glanceable in <3 seconds
- [ ] OPERATIONS mode supports active workflow
- [ ] INTELLIGENCE mode shows full telemetry
- [ ] Color scanning works (no reading required)
- [ ] Dopamine loop elements engaging
- [ ] No visual glitches or layout shifts
- [ ] Smooth transitions between modes

### Performance
- [ ] Mode switching <200ms
- [ ] Panel show/hide instant
- [ ] No console errors
- [ ] localStorage works (test across sessions)

---

## ACCEPTANCE CRITERIA

✅ 3 modes fully implemented (OPERATOR, OPERATIONS, INTELLIGENCE)  
✅ Instant mode switching (no page reload)  
✅ Correct panels per mode (show/hide working)  
✅ Visual hierarchy implemented (large/medium/small)  
✅ Focus mode working (80% expansion + ESC)  
✅ Panel resizing (drag, collapse, full-width)  
✅ Layout persists to localStorage (survive reload)  
✅ Color priority system applied everywhere  
✅ Progress bars displaying + updating  
✅ Momentum indicator calculated correctly  
✅ Operator impact tracker working  
✅ Active agents = 4 (only canonical agents)  
✅ All data from SSOT path only  
✅ No Supabase references  
✅ No legacy agents  
✅ ESLint clean  
✅ All tests passing  

---

## DELIVERABLES

**1. Screenshots**
- OPERATOR Mode (calm, clean, <3 second glance)
- OPERATIONS Mode (active workflow management)
- INTELLIGENCE Mode (full Palantir-style view)
- Focus Mode (panel expanded to 80%)
- Panel resizing demonstration

**2. Verification**
- Active agents count = 4 (confirmed)
- SSOT data path verified (all panels reading from `/workspace/data/mission-control/`)
- Mode switching instant (no console errors)
- Layout persists (test reload)

**3. Activity Log Entry**
- "Implemented Mission Control 3-Mode Operator Console: OPERATOR (default, calm), OPERATIONS (workflow), INTELLIGENCE (full telemetry). Instant mode switching, focus mode, panel resizing, color priority, dopamine loop elements. 4 canonical agents. SSOT lock. Ready for production."

---

**CR ID:** CR-MC-3MODE-OPERATOR-CONSOLE  
**Date:** 2026-03-05 18:36 EST  
**Timeline:** 2 weeks, 1 FTE  
**Risk:** Low (UI-only, no backend changes)  
**Acceptance:** Mission Control feels professional, calm, powerful, addictive to operate
