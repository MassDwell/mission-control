# Change Request: CR-OPERATOR-COMMAND-UPGRADE

**Title:** Mission Control → Operator Command System Upgrade  
**Date:** 2026-03-05 19:00 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P0 (Strategic Architecture)  
**Scope:** 8-part system upgrade (data integrity, visual simplification, guidance engines)  
**Timeline:** 2 weeks  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

Refactor Mission Control dashboard into **Operator Command** — an internal system optimized for founder decision-making.

**Scope (8 Parts):**
1. Fix data drift (agent count, placeholders, SSOT paths, refresh cadence)
2. Visual simplification (reduce noise, 3 primary panels)
3. Panel resizing + layout persistence
4. Panel tooltips (hover help)
5. Operator Guidance Engine (NEW — recommends actions)
6. Founder Decision Engine (NEW — strategic recommendations)
7. Performance optimization (<200ms load)
8. Final verification + checklist

**Key Changes:**
- Rename: "Palantir Mode" → "Operator Command" (internal only)
- Fix: Agent count (dynamic from registry, not hardcoded 6)
- Remove: All placeholder values (replace with real metrics)
- Lock: SSOT paths (one source of truth)
- Check: Data refresh cadence (2h export, 10s UI refresh, 3h stale alert)
- Add: Two new AI-powered guidance panels
- Enhance: Panel tooltips, resizing, layout persistence

**Result:** Dashboard feels like a professional command center. Fast, clean, actionable.

---

## PART 1: FIX CURRENT DATA DRIFT

### 1.1 Agent Count (CRITICAL FIX)

**Problem:** Agent count hardcoded to 6 (incorrect).  
**Solution:** Always compute dynamically from registry.

**Implementation:**
```javascript
function getActiveAgentCount() {
  const agents = readSSO('agents_runtime.json');
  if (!agents || !agents.agents) return 0;
  
  const activeAgents = agents.agents.filter(a => a.status === 'active');
  return activeAgents.length;
}

// Correct value: 4 agents
// (Clawson, Codesmith, Moonshot, Personal Assistant)
```

**Verification:**
- Remove all hardcoded "6" from codebase
- Verify count = 4 when UI loads
- Verify count updates if agent status changes
- Log to console: "Active agents: 4"

### 1.2 Remove Placeholder Values

**Placeholders to Remove:**
- `timestamp` (replace with real data timestamps)
- `total` (replace with real counts from SSOT)
- `active` (replace with real active counts)
- `items` (replace with real item lists)

**Where Found:**
- System Health panel
- Workstream Flow panel
- Venture Pipeline panel
- Agent Activity panel

**Example Fix:**
```javascript
// BEFORE (bad)
{
  timestamp: "placeholder",
  total: 0,
  active: 0,
  items: []
}

// AFTER (good)
{
  timestamp: "2026-03-05T19:00:00Z",  // from SSOT lastUpdated
  ventures: {
    total: 1,
    by_stage: {
      'idea': 0,
      'investigation': 0,
      'approval': 0,
      'implementation': 1,
      'launch': 0,
      'killed': 0
    }
  }
}
```

### 1.3 Validate SSOT Paths

**Single Source of Truth Directory:**
```
/workspace/data/mission-control/
├── workstreams.json
├── blocked_work.json
├── venture_velocity.json
├── venture_work_links.json
├── agent_activity.json
├── agents_runtime.json
├── system_insights.json
└── venture_pipeline.json
```

**No Alternate Paths Allowed:**
- ❌ Remove: `data/legacy/` references
- ❌ Remove: `cache/` references
- ❌ Remove: Hardcoded paths
- ✅ Keep: SSOT directory only

**Audit:**
```bash
grep -r "data/workstreams\|data/blocked\|data/venture" . --include="*.js"
# Should find only SSOT paths
```

### 1.4 Verify Data Refresh Cadence

**Mission Control Export Cycle:**
- Frequency: Every 2 hours (120 seconds)
- LaunchAgent: `com.openclaw.mc-export`
- Script: `/scripts/mission-control-export.js`
- Output: Updates all 8 SSOT files

**UI Refresh Cycle:**
- Frequency: Every 10 seconds
- Method: WebSocket or polling
- No stale data > 10 seconds

**Stale Data Detection:**
- If any file not updated > 3 hours (during 7 AM–9 PM EST)
- Show WARNING banner: "Data stale (last update: Xh ago)"
- Show CRITICAL banner: "Data stale (>3h) — contact system admin"

**Implementation:**
```javascript
function checkDataStaleness() {
  const ssotFiles = [
    'workstreams.json',
    'blocked_work.json',
    'venture_velocity.json'
  ];
  
  const now = Date.now();
  const stalethreshold3h = 3 * 60 * 60 * 1000;
  
  ssotFiles.forEach(file => {
    const mtime = fs.statSync(`${SSOT_PATH}/${file}`).mtime;
    const age = now - mtime.getTime();
    
    if (age > stalethreshold3h) {
      logAlert(`STALE: ${file} (age: ${Math.floor(age/3600000)}h)`);
    }
  });
}
```

---

## PART 2: DASHBOARD VISUAL SIMPLIFICATION

### 2.1 Collapsed Default View for Secondary Panels

**Secondary Panels (Auto-Collapse):**
- Opportunity Discovery
- Momentum
- Operator Impact
- Agent Activity (optional)

**Behavior:**
- Show header only
- Click to expand
- Remember state in localStorage

### 2.2 Highlight 3 Primary Panels

**Primary Panels (Always Expanded):**
1. **Active Work** — What we're building
2. **Blocked Work** — What's stopping us
3. **Operator Guidance** (NEW) — What to do next

**Visual Treatment:**
- Larger, more prominent
- Higher visual weight
- Expanded by default
- First in eye scan (top-left)

### 2.3 Lower Visual Weight for Secondary Panels

**Secondary Panels (Visually Reduced):**
- Smaller font
- Muted colors
- Collapsed by default
- Lower in layout

### 2.4 Color Hierarchy

**Critical (Red):**
- Blocked venture
- Blocker overdue (>30d)
- Agent offline
- Build stalled (>8h)

**Action Required (Yellow):**
- Workstream not updated (>6h)
- Agent idle (>4h)
- Moderate blocker
- Metrics trending down

**Informational (Neutral Gray):**
- Normal agent status
- On-track workstreams
- Positive momentum
- Completed actions

**Goal:** Scan dashboard in <5 seconds and understand critical status.

---

## PART 3: PANEL RESIZING + OPERATOR LAYOUT

### 3.1 Drag Resize Handles

**Feature:**
- Every panel has resize handle (bottom-right corner)
- Drag to resize
- Min size: 300x200
- Max size: unlimited

### 3.2 Expand / Collapse Button

**Feature:**
- Header button: [-] collapse, [+] expand
- Collapses panel to header only
- Remember state in localStorage

### 3.3 Full-Width Toggle

**Feature:**
- Header button: [⇔] full-width
- Panel expands to 100% width
- Other panels in row hidden

### 3.4 Panel Reordering (Optional)

**Feature:**
- Drag panel header to reorder
- Update grid layout
- Save to localStorage

### 3.5 Layout Persistence

**Storage:**
```json
{
  "operator_command_layout": {
    "panels": {
      "active-work": { "width": 600, "height": 500, "collapsed": false },
      "blocked-work": { "width": 600, "height": 300, "collapsed": false },
      "guidance": { "width": 300, "height": 200, "collapsed": false },
      ...
    },
    "lastUpdated": "ISO-8601"
  }
}
```

**Save:** On every resize (debounced 1s)  
**Restore:** On page load

---

## PART 4: PANEL TOOLTIPS

### 4.1 Tooltip Content (Per Panel)

**Active Work:**
```
Shows all active workstreams with progress and owner.
Use this to track build velocity and identify stalled work.
Watch for: Red blockers, >8h without updates.
Actions: Expand workstream, assign resources, clear blockers.
```

**Blocked Work:**
```
Shows all blockers preventing progress.
Use this to identify system bottlenecks and resolve them.
Watch for: Red overdue blockers (>30 days), high severity.
Actions: Resolve blocker, escalate to leadership, update status.
```

**Operator Guidance:**
```
AI-powered recommendations for next actions.
Use this to prioritize what to do next.
Watch for: High-priority guidance items, growth opportunities.
Actions: Click recommendation to drill down, approve action, defer.
```

**Ventures:**
```
Shows venture pipeline stage distribution.
Use this to understand portfolio momentum.
Watch for: Stalled ventures, accumulation in investigation phase.
Actions: Advance stage, kill low-score ventures, allocate resources.
```

**Agent Activity:**
```
Real-time log of system actions.
Use this to understand what agents are doing.
Watch for: Error patterns, unusual activity spikes.
Actions: Investigate anomalies, review logs, adjust agent behavior.
```

### 4.2 Tooltip Implementation

**HTML:**
```html
<div class="panel-header">
  <h3>Active Work</h3>
  <button class="tooltip-btn" title="Show help">?</button>
</div>

<div class="tooltip" style="display:none;">
  <p>Shows all active workstreams...</p>
  <p>Watch for: ...</p>
  <p>Actions: ...</p>
</div>
```

**CSS:**
```css
.tooltip-btn {
  cursor: help;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #666;
  background: transparent;
  color: #999;
}

.tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #444;
  padding: 12px;
  border-radius: 4px;
  width: 300px;
  font-size: 12px;
  line-height: 1.6;
  z-index: 100;
}
```

---

## PART 5: OPERATOR GUIDANCE ENGINE (NEW)

### Purpose
Provide operator with recommended next actions based on system state.

### Inputs (Read from SSOT)
- `workstreams.json` — active work items
- `blocked_work.json` — blocking issues
- `venture_velocity.json` — stage distribution
- `agent_activity.json` — recent actions
- `agents_runtime.json` — agent capacity

### Logic (Example Rules)

**Rule 1: Unblock Stalled Workstream**
```
IF workstream.last_event > 8 hours ago
THEN recommend "Unblock workstream: {name}" (Priority: HIGH)
```

**Rule 2: Assign Idle Agent**
```
IF agent.last_heartbeat > 4 hours ago AND agent.status = idle
THEN recommend "Assign new task to {agent}" (Priority: MEDIUM)
```

**Rule 3: Rebalance Pipeline**
```
IF stage.investigation has 3+ ventures AND stage.build is empty
THEN recommend "Advance {highest_score_venture} to PRD" (Priority: MEDIUM)
```

**Rule 4: Growth Opportunity**
```
IF venture.growth_metric > 80% AND venture.stage = beta
THEN recommend "Launch {venture} to production" (Priority: HIGH)
```

**Rule 5: Resource Allocation**
```
IF venture.blocked_count > 2 AND venture.priority = high
THEN recommend "Allocate additional resources to {venture}" (Priority: MEDIUM)
```

### Output Format

**Panel Display:**
```
OPERATOR GUIDANCE

1. HIGH: Unblock workstream "backend-api-scaffolding"
   Status: Stalled for 12 hours
   Action: Click to open blocker console

2. MEDIUM: Assign new task to Moonshot
   Status: Idle for 4 hours, capacity available
   Action: Click to see available work

3. MEDIUM: Advance LeadScore.ai to implementation
   Status: Investigation complete, score 38/40
   Action: Click to advance venture stage

4. LOW: Run experiment on new feature
   Status: Growth metrics suggest testing opportunity
   Action: Click to propose experiment
```

### Implementation

**File:** `api/operator-guidance.js`

```javascript
function generateOperatorGuidance() {
  const guidance = [];
  
  // Rule 1: Stalled workstreams
  const workstreams = readSSO('workstreams.json');
  workstreams.forEach(ws => {
    const age = Date.now() - new Date(ws.last_event).getTime();
    if (age > 8 * 60 * 60 * 1000) {
      guidance.push({
        priority: 'HIGH',
        action: `Unblock workstream: ${ws.name}`,
        status: `Stalled for ${Math.floor(age/3600000)} hours`,
        detail_url: `/detail/workstream/${ws.id}`
      });
    }
  });
  
  // Rule 2: Idle agents
  const agents = readSSO('agents_runtime.json');
  agents.agents.forEach(agent => {
    const age = Date.now() - new Date(agent.last_heartbeat).getTime();
    if (age > 4 * 60 * 60 * 1000 && agent.status === 'active') {
      guidance.push({
        priority: 'MEDIUM',
        action: `Assign new task to ${agent.name}`,
        status: `Idle for ${Math.floor(age/3600000)} hours`,
        detail_url: `/detail/agent/${agent.id}`
      });
    }
  });
  
  // ... more rules ...
  
  // Sort by priority, limit to 4
  return guidance.sort((a, b) => {
    const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }).slice(0, 4);
}

// Endpoint
app.get('/api/operator-guidance', (req, res) => {
  const guidance = generateOperatorGuidance();
  res.json({
    guidance,
    count: guidance.length,
    timestamp: new Date().toISOString(),
    sources: { workstreams: 'workstreams.json', agents: 'agents_runtime.json', ... }
  });
});
```

---

## PART 6: FOUNDER DECISION ENGINE (NEW)

### Purpose
Answer strategic questions:
- What venture should be advanced next?
- What experiment should we run?
- How should resources be allocated?

### Inputs (Read from SSOT)
- Venture stage distribution (venture_velocity.json)
- Agent activity + capacity (agent_activity.json, agents_runtime.json)
- Blocker signals (blocked_work.json)
- Momentum indicators (recent completions)

### Logic (Example Heuristics)

**Decision 1: Which Venture to Advance**
```
Score each INVESTIGATION venture:
  + investigation_complete? (+40 points)
  + opportunity_score >= 28? (+30 points)
  + team_ready? (+20 points)
  + no_critical_blockers? (+10 points)
  
Return highest-scoring venture + confidence level
```

**Decision 2: What Experiment to Run**
```
Check ventures in BETA:
  IF growth_metric trending down
  THEN recommend "Run pricing experiment on {venture}" (confidence: 75%)
  
  IF activation_rate < 50%
  THEN recommend "Test new onboarding flow" (confidence: 60%)
```

**Decision 3: Resource Allocation**
```
Calculate agent utilization:
  IF agent_A assigned to 4 workstreams
     AND agent_B is idle for 4h
  THEN recommend "Move 1 workstream from A to B" (confidence: 85%)
```

### Output Format

**Panel Display:**
```
FOUNDER DECISION ENGINE

RECOMMENDED ACTION:
Advance LeadScore.ai from Investigation to Approval

Confidence: 95%
Reasoning:
  ✓ Investigation research complete
  ✓ Market opportunity score: 38/40
  ✓ Team committed and ready
  ✓ No critical blockers
  
Timeline: Ready now
MRR Impact: $5K target within 8 weeks

[APPROVE] [DEFER] [LEARN MORE]
```

### Implementation

**File:** `api/founder-decisions.js`

```javascript
function generateFounderDecisions() {
  const decisions = {};
  
  // Decision 1: Which venture to advance
  const ventures = readSSO('venture_velocity.json');
  const investigationVentures = ventures.filter(v => v.stage === 'investigation');
  
  let topVenture = null;
  let topScore = 0;
  
  investigationVentures.forEach(v => {
    let score = 0;
    if (v.investigation_complete) score += 40;
    if (v.opportunity_score >= 28) score += 30;
    if (v.team_ready) score += 20;
    if (!v.has_critical_blockers) score += 10;
    
    if (score > topScore) {
      topScore = score;
      topVenture = v;
    }
  });
  
  if (topVenture) {
    decisions.next_venture = {
      recommendation: `Advance ${topVenture.name} to Approval`,
      confidence: Math.min(topScore / 100, 1.0),
      reasoning: [
        'Investigation complete',
        `Opportunity score: ${topVenture.opportunity_score}/40`,
        'Team ready',
        'No critical blockers'
      ],
      action_url: `/api/ventures/${topVenture.id}/advance`
    };
  }
  
  // ... more decisions ...
  
  return decisions;
}

// Endpoint
app.get('/api/founder-decisions', (req, res) => {
  const decisions = generateFounderDecisions();
  res.json({
    decisions,
    timestamp: new Date().toISOString(),
    sources: { ventures: 'venture_velocity.json', agents: 'agents_runtime.json', ... }
  });
});
```

---

## PART 7: PERFORMANCE OPTIMIZATION

### Requirements
- UI load: <200ms
- Auto-refresh: Without flicker
- No blocking API calls
- All data from local JSON (SSOT)

### Implementation

**1. Lazy Load Panels**
```javascript
// Only fetch data for visible panels
const visiblePanels = new Set();

function loadPanel(panelId) {
  if (!visiblePanels.has(panelId)) {
    fetch(`/api/${panelId}`)
      .then(res => res.json())
      .then(data => renderPanel(panelId, data));
    visiblePanels.add(panelId);
  }
}

// Load on visibility
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadPanel(entry.target.id);
    }
  });
});

document.querySelectorAll('[data-panel]').forEach(el => observer.observe(el));
```

**2. Cache API Responses**
```javascript
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

async function cachedFetch(url) {
  const now = Date.now();
  const cached = cache.get(url);
  
  if (cached && now - cached.time < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetch(url).then(r => r.json());
  cache.set(url, { data, time: now });
  return data;
}
```

**3. Debounce Refresh**
```javascript
let refreshTimeout;
function scheduleRefresh() {
  clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => {
    updateAllPanels();
  }, 10000); // 10 second refresh
}

// Trigger on data change
document.addEventListener('data-change', scheduleRefresh);
```

**4. No Blocking Calls**
```javascript
// GOOD: Async, non-blocking
fetch('/api/workstreams')
  .then(res => res.json())
  .then(data => renderWorkstreams(data));

// BAD: Synchronous, blocks UI
const data = require('./workstreams.json'); // Don't do this
```

---

## PART 8: FINAL VERIFICATION

### Verification Checklist

- [ ] Agent count correct (4 agents, dynamic from registry)
- [ ] All panels connected to SSOT (`/workspace/data/mission-control/`)
- [ ] No placeholder metrics (replace with real computed values)
- [ ] Panel resizing functional (drag, collapse, full-width)
- [ ] Tooltips working (hover shows help)
- [ ] Operator Guidance generating insights (4 recommendations)
- [ ] Founder Decision Engine recommending actions
- [ ] Data refresh cadence correct (2h export, 10s UI, 3h stale alert)
- [ ] Performance <200ms load
- [ ] No console errors
- [ ] ESLint clean
- [ ] All tests passing

### Deliverables

**1. Screenshot of Final Dashboard**
- Show 3 primary panels (Active Work, Blocked Work, Guidance)
- Show 1-2 secondary panels (collapsed by default)
- Show color hierarchy (red/yellow/neutral)
- Show panel resize handles
- Show tooltip on one panel

**2. Verification Checklist**
- Signed off on all 12 items above
- Agent count confirmed = 4
- SSOT paths verified
- No placeholder values
- Performance <200ms confirmed

**3. Panel + Data Source List**
```
Active Work → workstreams.json
Blocked Work → blocked_work.json
Ventures → venture_velocity.json
Operator Guidance → (computed from SSOT)
Founder Decisions → (computed from SSOT)
...
```

---

## IMPLEMENTATION PHASES

### Phase 1 (Days 1-2): Data Drift Fixes
- [ ] Fix agent count (dynamic, not hardcoded)
- [ ] Remove all placeholder values
- [ ] Validate SSOT paths
- [ ] Verify data refresh cadence

### Phase 2 (Days 2-4): Visual Simplification + Resizing
- [ ] Collapse secondary panels by default
- [ ] Highlight 3 primary panels
- [ ] Implement panel resizing
- [ ] Add resize handles and buttons
- [ ] Implement localStorage persistence

### Phase 3 (Days 4-6): Tooltips + New Engines
- [ ] Add tooltips to all panels
- [ ] Implement Operator Guidance Engine
- [ ] Implement Founder Decision Engine
- [ ] Wire up endpoints

### Phase 4 (Days 6-8): Polish + Performance
- [ ] Optimize load time (<200ms)
- [ ] Implement caching + lazy loading
- [ ] Remove stale data warnings
- [ ] Full UI polish

### Phase 5 (Days 8-10): Testing + Verification
- [ ] Full regression testing
- [ ] Verification checklist
- [ ] Screenshots + documentation
- [ ] ESLint clean

---

## ACCEPTANCE CRITERIA

✅ Agent count dynamic + correct (4 agents)  
✅ All placeholder values removed + replaced with real metrics  
✅ SSOT paths validated (one source of truth)  
✅ Data refresh cadence correct (2h/10s/3h)  
✅ 3 primary panels highlighted + always visible  
✅ Secondary panels collapsed by default  
✅ Panel resizing working (drag, collapse, fullwidth)  
✅ Layout persisted to localStorage  
✅ Panel tooltips working (hover → help)  
✅ Operator Guidance Engine generating 4 recommendations  
✅ Founder Decision Engine providing strategic guidance  
✅ Color hierarchy applied (red/yellow/neutral)  
✅ Performance <200ms load  
✅ No console errors  
✅ ESLint clean  
✅ All tests passing  

---

**CR ID:** CR-OPERATOR-COMMAND-UPGRADE  
**Date:** 2026-03-05 19:00 EST  
**Timeline:** 2 weeks, 1 FTE  
**Risk:** Low (incremental improvements to existing system)  
**Acceptance:** Operator Command system ready for founder operations
