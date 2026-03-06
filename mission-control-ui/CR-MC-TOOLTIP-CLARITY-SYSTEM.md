# Change Request: CR-MC-TOOLTIP-CLARITY-SYSTEM

**Title:** Mission Control — Tooltip + Clarity System (Anti-Overload UI)  
**Date:** 2026-03-05 19:30 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P0 (UX/Clarity)  
**Scope:** UI-only enhancement (no data removal, only visibility control)  
**Timeline:** 1 week  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

Reduce dashboard visual overload while maintaining complete data access.

Implement:
1. **Tooltip System** — Context help on every panel
2. **Progressive Disclosure** — Collapse secondary panels, show summaries
3. **Focus Mode** — Deep-dive into single panel
4. **Signal Highlight Strip** — Surface critical signals at top

**Key Principle:** No data is removed. Only when data is displayed is controlled.

**Result:** Dashboard feels cleaner on first glance. Full information available on demand.

---

## PART 1: PANEL TOOLTIP SYSTEM

### Purpose
Every panel has contextual help explaining:
- What the panel represents
- What signals to watch
- What actions to take
- Which data sources power it

### Tooltip Behavior
- **Trigger:** Hover over ⓘ icon next to panel title
- **Delay:** 300ms (avoid accidental triggers)
- **Width:** 320px
- **Mobile:** Tap support (touch to show, tap elsewhere to dismiss)
- **Dismiss:** Auto-dismiss on mouse exit

### Configuration File

**Location:** `/mission-control-ui/config/panel_tooltips.json`

**Schema:**
```json
{
  "panels": {
    "active-work": {
      "title": "Active Work",
      "description": "Shows all active workstreams with progress, owner, and estimated time to completion.",
      "watch_for": [
        "Red blockers (critical issues preventing progress)",
        "Workstreams with >8 hours since last update (stalled work)",
        "Progress bars not advancing"
      ],
      "actions": [
        "Click workstream to drill into details",
        "Use drag handles to reorder priorities",
        "Expand blocker details to understand blockers",
        "Reassign workstreams to adjust load"
      ],
      "data_sources": ["workstreams.json", "blocked_work.json", "agent_activity.json"],
      "refresh_interval": "10 seconds"
    },
    "blocked-work": {
      "title": "Blocked Work",
      "description": "Shows all blockers preventing progress. Blockers are color-coded by severity.",
      "watch_for": [
        "Red blockers (critical, require immediate attention)",
        "Blockers overdue (>30 days in SLA)",
        "Multiple blockers on same venture (indicates systemic issue)"
      ],
      "actions": [
        "Click blocker to see full context",
        "Update blocker status when resolved",
        "Escalate critical blockers to leadership",
        "Identify root cause patterns"
      ],
      "data_sources": ["blocked_work.json", "workstreams.json"],
      "refresh_interval": "10 seconds"
    },
    "operator-guidance": {
      "title": "Operator Guidance",
      "description": "AI-powered recommendations for the next action. Updated every 10 seconds based on system state.",
      "watch_for": [
        "HIGH priority recommendations (require action today)",
        "Multiple recommendations on same venture (indicates bottleneck)",
        "Recommendations disappearing (signals resolved)"
      ],
      "actions": [
        "Click recommendation to drill into context",
        "Follow HIGH priority recommendations first",
        "Dismiss recommendations if already handled",
        "Use as decision guide for resource allocation"
      ],
      "data_sources": ["workstreams.json", "agents_runtime.json", "blocked_work.json", "agent_activity.json"],
      "refresh_interval": "10 seconds"
    },
    "system-health": {
      "title": "System Health",
      "description": "Real-time status of all agents. Shows online/idle/offline status and recent error count.",
      "watch_for": [
        "Red status (agent offline)",
        "Yellow status (agent idle >1 hour)",
        "Error count increasing"
      ],
      "actions": [
        "Click agent to see recent actions",
        "Assign new work to idle agents",
        "Investigate error patterns"
      ],
      "data_sources": ["agents_runtime.json", "agent_activity.json"],
      "refresh_interval": "10 seconds"
    },
    "venture-velocity": {
      "title": "Venture Velocity",
      "description": "Pipeline stage distribution. Shows how many ventures are in each stage.",
      "watch_for": [
        "Accumulation in one stage (bottleneck)",
        "Ventures not advancing (stalled pipeline)",
        "Sudden drops (ventures killed or merged)"
      ],
      "actions": [
        "Click stage to filter ventures",
        "Advance stuck ventures to next stage",
        "Kill low-score ventures to unblock pipeline"
      ],
      "data_sources": ["venture_velocity.json", "venture_scoreboard.json"],
      "refresh_interval": "10 seconds"
    },
    "agent-activity": {
      "title": "Agent Activity",
      "description": "Real-time log of agent actions. Shows what the system is doing moment-to-moment.",
      "watch_for": [
        "Error events (red severity)",
        "Unusual activity patterns",
        "Actions completing (green checkmarks)"
      ],
      "actions": [
        "Click activity to see full details",
        "Investigate error patterns",
        "Track agent behavior over time"
      ],
      "data_sources": ["agent_activity.json"],
      "refresh_interval": "Real-time (1-2 second updates)"
    },
    "momentum": {
      "title": "Momentum",
      "description": "Weekly progress metrics. Shows growth trajectory, completion velocity, and trend direction.",
      "watch_for": [
        "Trend arrows (up=accelerating, level=stable, down=slowing)",
        "Completion count week-over-week",
        "Sudden momentum drops (indicates problem)"
      ],
      "actions": [
        "Use momentum to set weekly goals",
        "Celebrate high momentum (team morale)",
        "Investigate momentum drops (find blockers)"
      ],
      "data_sources": ["agent_activity.json (completions)"],
      "refresh_interval": "Hourly"
    },
    "opportunity-discovery": {
      "title": "Opportunity Discovery",
      "description": "New venture ideas, automation opportunities, and market signals. Auto-generated by Moonshot agent.",
      "watch_for": [
        "New high-TAM opportunities",
        "Automation opportunities (time savings)",
        "Market signals supporting current ventures"
      ],
      "actions": [
        "Click opportunity to create new venture",
        "Estimate TAM and team requirements",
        "Prioritize by potential MRR"
      ],
      "data_sources": ["agent_activity.json (from Moonshot)"],
      "refresh_interval": "Daily (Moonshot runs weekly)"
    },
    "operator-impact": {
      "title": "Operator Impact",
      "description": "Tracks actions taken and downstream effects. Shows influence multiplier (how many 2nd-order effects per action).",
      "watch_for": [
        "Influence multiplier trending up (more leverage)",
        "Action count increasing (more engaged)",
        "Impact by action type (what's most effective)"
      ],
      "actions": [
        "Use to prioritize high-leverage actions",
        "Celebrate high-impact decisions",
        "Learn from low-impact actions"
      ],
      "data_sources": ["agent_activity.json (actions by operator)"],
      "refresh_interval": "Real-time"
    },
    "founder-decision-engine": {
      "title": "Founder Decision Engine",
      "description": "Strategic recommendations for venture advancement, resource allocation, and experiments.",
      "watch_for": [
        "HIGH confidence recommendations (>80%)",
        "Consensus recommendations (multiple signals point same direction)",
        "Opportunities with short time windows"
      ],
      "actions": [
        "Click recommendation to approve/defer",
        "Review confidence level and reasoning",
        "Use to guide weekly strategy meetings"
      ],
      "data_sources": ["venture_velocity.json", "agents_runtime.json", "agent_activity.json"],
      "refresh_interval": "10 seconds"
    },
    "relationship-graph": {
      "title": "Relationship Graph",
      "description": "Visual representation of venture-workstream-agent relationships. Shows dependencies and connections.",
      "watch_for": [
        "Single points of failure (one agent, one workstream)",
        "Highly connected nodes (critical components)",
        "Isolated nodes (unused resources or orphaned work)"
      ],
      "actions": [
        "Click node to drill into details",
        "Identify dependencies before decisions",
        "Rebalance load based on graph structure",
        "Plan resource allocation based on dependencies"
      ],
      "data_sources": ["venture_work_links.json", "workstreams.json", "agents_runtime.json"],
      "refresh_interval": "10 seconds"
    }
  }
}
```

### Implementation

**HTML (Panel Header):**
```html
<div class="panel-header">
  <h3>Active Work</h3>
  <button class="tooltip-btn" data-panel="active-work" title="Show help">ⓘ</button>
</div>

<div class="tooltip-popup" id="tooltip-active-work" style="display:none;">
  <!-- Populated from panel_tooltips.json -->
</div>
```

**CSS:**
```css
.tooltip-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #666;
  background: transparent;
  color: #999;
  cursor: help;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
}

.tooltip-popup {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
  z-index: 1000;
  font-size: 12px;
  line-height: 1.6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-popup h4 {
  margin: 0 0 8px 0;
  font-weight: bold;
  color: #fff;
}

.tooltip-popup p {
  margin: 0 0 8px 0;
  color: #ccc;
}

.tooltip-popup ul {
  margin: 8px 0;
  padding-left: 16px;
  color: #999;
}

.tooltip-popup li {
  margin: 4px 0;
}
```

**JavaScript:**
```javascript
// Load tooltips from config
let tooltipConfig = {};

fetch('/config/panel_tooltips.json')
  .then(r => r.json())
  .then(config => {
    tooltipConfig = config.panels;
    initTooltips();
  });

function initTooltips() {
  document.querySelectorAll('.tooltip-btn').forEach(btn => {
    btn.addEventListener('mouseenter', showTooltip);
    btn.addEventListener('mouseleave', hideTooltip);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  
  // Mobile tap support
  document.querySelectorAll('.tooltip-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      showTooltip.call(btn);
    });
  });
  
  document.addEventListener('click', hideAllTooltips);
}

function showTooltip(e) {
  const btn = this;
  const panelId = btn.dataset.panel;
  const tooltip = document.getElementById(`tooltip-${panelId}`);
  const config = tooltipConfig[panelId];
  
  if (!config) return;
  
  // Render tooltip content
  tooltip.innerHTML = `
    <h4>${config.title}</h4>
    <p>${config.description}</p>
    
    <strong style="color: #fff;">Watch for:</strong>
    <ul>${config.watch_for.map(w => `<li>${w}</li>`).join('')}</ul>
    
    <strong style="color: #fff;">Actions:</strong>
    <ul>${config.actions.map(a => `<li>${a}</li>`).join('')}</ul>
    
    <p style="font-size: 11px; color: #666; margin-top: 8px;">
      Data sources: ${config.data_sources.join(', ')}<br/>
      Updates: ${config.refresh_interval}
    </p>
  `;
  
  tooltip.style.display = 'block';
}

function hideTooltip(e) {
  const panelId = e.target.dataset.panel;
  const tooltip = document.getElementById(`tooltip-${panelId}`);
  if (tooltip) tooltip.style.display = 'none';
}

function hideAllTooltips() {
  document.querySelectorAll('.tooltip-popup').forEach(t => {
    t.style.display = 'none';
  });
}
```

---

## PART 2: PROGRESSIVE DISCLOSURE LAYOUT

### Primary Panels (Always Expanded)
- Active Work
- Blocked Work
- Operator Guidance
- System Health

### Secondary Panels (Collapsed by Default)
- Momentum
- Opportunity Discovery
- Operator Impact
- Venture Velocity
- Relationship Graph

### Collapsed State Display

**Momentum (Collapsed):**
```
Momentum
▲ Growth signals detected (2)
[Expand]
```

**Opportunity Discovery (Collapsed):**
```
Opportunity Discovery
3 new venture signals
[Expand]
```

**Operator Impact (Collapsed):**
```
Operator Impact
2 operator interventions this week
[Expand]
```

### Implementation

**HTML:**
```html
<div class="panel secondary" id="momentum">
  <div class="panel-header">
    <h3>Momentum</h3>
    <button class="expand-btn">+</button>
  </div>
  <div class="panel-collapsed-summary">
    <span class="momentum-indicator">▲ Growth signals detected (2)</span>
  </div>
  <div class="panel-body" style="display:none;">
    <!-- Full momentum panel content -->
  </div>
</div>
```

**CSS:**
```css
.panel.secondary .panel-body {
  display: none;
}

.panel.secondary.expanded .panel-body {
  display: block;
}

.panel.secondary .panel-collapsed-summary {
  padding: 12px;
  font-size: 12px;
  color: #999;
  border-top: 1px solid #333;
}

.panel.secondary.expanded .panel-collapsed-summary {
  display: none;
}

.expand-btn {
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 16px;
}

.panel.secondary.expanded .expand-btn {
  transform: rotate(45deg);
}
```

**JavaScript:**
```javascript
document.querySelectorAll('.panel.secondary .expand-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const panel = e.target.closest('.panel');
    const isExpanded = panel.classList.contains('expanded');
    
    if (isExpanded) {
      panel.classList.remove('expanded');
      localStorage.setItem(`panel_expanded_${panel.id}`, 'false');
    } else {
      panel.classList.add('expanded');
      localStorage.setItem(`panel_expanded_${panel.id}`, 'true');
    }
  });
});

// Restore expansion state on load
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.panel.secondary').forEach(panel => {
    const isExpanded = localStorage.getItem(`panel_expanded_${panel.id}`) === 'true';
    if (isExpanded) {
      panel.classList.add('expanded');
    }
  });
});
```

---

## PART 3: PANEL FOCUS MODE

### Behavior
- Click panel header → expands to 70% width
- Other panels dim to 30% opacity
- Panel becomes scrollable
- ESC key exits focus mode

### Implementation

**HTML:**
```html
<div class="panel" id="active-work">
  <div class="panel-header">
    <h3>Active Work</h3>
    <button class="focus-btn" title="Focus Mode">⛶</button>
  </div>
  <!-- ... content ... -->
</div>
```

**CSS:**
```css
.panel.focus-mode {
  position: fixed;
  top: 100px;
  left: 50%;
  width: 70vw;
  height: calc(100vh - 150px);
  transform: translateX(-50%);
  z-index: 2000;
  overflow: auto;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.panel:not(.focus-mode) {
  opacity: 1;
  transition: opacity 200ms;
}

.dashboard.focus-mode-active .panel:not(.focus-mode) {
  opacity: 0.3;
  pointer-events: none;
}
```

**JavaScript:**
```javascript
document.querySelectorAll('.focus-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const panel = e.target.closest('.panel');
    activateFocusMode(panel.id);
  });
});

function activateFocusMode(panelId) {
  const panel = document.getElementById(panelId);
  panel.classList.add('focus-mode');
  document.body.classList.add('focus-mode-active');
}

function exitFocusMode() {
  document.querySelectorAll('.panel.focus-mode').forEach(p => {
    p.classList.remove('focus-mode');
  });
  document.body.classList.remove('focus-mode-active');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    exitFocusMode();
  }
});
```

---

## PART 4: SIGNAL HIGHLIGHT STRIP

### Purpose
Surface only the most important signals at the top of dashboard.

### Location
Directly below navigation bar.

### Display
Max 4 signals. Examples:

```
🔴 Blocked Work (2 items) — 6h old
🟡 LeadScore momentum spike (+32%)
🟢 Codesmith idle capacity (2h)
🔵 New venture opportunity: "AI Analytics"
```

### Color Coding
- 🔴 Red = Critical (requires immediate action)
- 🟡 Yellow = Action required (needs attention today)
- 🟢 Green = Informational (FYI)
- 🔵 Blue = Opportunity (potential action)

### Data Sources
- `blocked_work.json` — Critical blockers
- `venture_velocity.json` — Growth signals
- `agents_runtime.json` — Idle capacity
- `agent_activity.json` — Opportunities

### Implementation

**HTML:**
```html
<div class="signal-strip">
  <div class="signal-item signal-critical">
    <span class="signal-icon">🔴</span>
    <span class="signal-text">Blocked Work (2 items) — 6h old</span>
  </div>
  <div class="signal-item signal-opportunity">
    <span class="signal-icon">🔵</span>
    <span class="signal-text">New venture opportunity: "AI Analytics"</span>
  </div>
</div>
```

**CSS:**
```css
.signal-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 8px;
  padding: 8px 12px;
  background: #0a0a0a;
  border-bottom: 1px solid #333;
  font-size: 12px;
}

.signal-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.signal-item.signal-critical {
  background: rgba(255, 50, 50, 0.1);
  border-left: 3px solid #ff3333;
}

.signal-item.signal-action {
  background: rgba(255, 170, 0, 0.1);
  border-left: 3px solid #ffaa00;
}

.signal-item.signal-info {
  background: rgba(0, 200, 0, 0.1);
  border-left: 3px solid #00cc00;
}

.signal-item.signal-opportunity {
  background: rgba(50, 100, 255, 0.1);
  border-left: 3px solid #3366ff;
}

.signal-icon {
  font-size: 14px;
}

.signal-text {
  color: #ccc;
}

.signal-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
```

**JavaScript:**
```javascript
function generateSignalStrip() {
  const signals = [];
  
  // Rule 1: Critical blockers
  const blockers = readSSO('blocked_work.json');
  const criticalBlockers = blockers.filter(b => b.severity === 'critical');
  if (criticalBlockers.length > 0) {
    const oldestAge = Math.max(...criticalBlockers.map(b => 
      Date.now() - new Date(b.created_at).getTime()
    ));
    signals.push({
      severity: 'critical',
      icon: '🔴',
      text: `Blocked Work (${criticalBlockers.length} item${criticalBlockers.length > 1 ? 's' : ''}) — ${formatAge(oldestAge)} old`,
      action_url: '#blocked-work'
    });
  }
  
  // Rule 2: Growth spikes
  const activities = readSSO('agent_activity.json');
  const completions24h = activities.filter(a => 
    a.action.includes('completed') && 
    a.timestamp > Date.now() - 24 * 60 * 60 * 1000
  ).length;
  
  if (completions24h > 5) {
    const growth = Math.floor((completions24h / 5 - 1) * 100);
    signals.push({
      severity: 'info',
      icon: '🟢',
      text: `Growth spike (+${growth}% completions today)`,
      action_url: '#momentum'
    });
  }
  
  // Rule 3: Idle agent capacity
  const agents = readSSO('agents_runtime.json');
  const idleAgents = agents.agents.filter(a => 
    a.status === 'active' && 
    a.owned_workstreams === 0
  );
  if (idleAgents.length > 0) {
    const idleDuration = Math.max(...idleAgents.map(a => 
      Date.now() - new Date(a.last_heartbeat).getTime()
    ));
    signals.push({
      severity: 'action',
      icon: '🟡',
      text: `${idleAgents.length} agent${idleAgents.length > 1 ? 's' : ''} idle capacity (${formatAge(idleDuration)})`,
      action_url: '#system-health'
    });
  }
  
  // Rule 4: New opportunities
  const opportunities = countNewOpportunities();
  if (opportunities > 0) {
    signals.push({
      severity: 'opportunity',
      icon: '🔵',
      text: `${opportunities} new venture opportunity${opportunities > 1 ? 'ies' : ''} detected`,
      action_url: '#opportunity-discovery'
    });
  }
  
  // Limit to 4 signals
  return signals.slice(0, 4);
}

function renderSignalStrip() {
  const signals = generateSignalStrip();
  const strip = document.querySelector('.signal-strip');
  
  if (signals.length === 0) {
    strip.innerHTML = '<div style="color: #666; padding: 8px;">No critical signals</div>';
    return;
  }
  
  strip.innerHTML = signals.map(signal => `
    <div class="signal-item signal-${signal.severity}">
      <span class="signal-icon">${signal.icon}</span>
      <span class="signal-text">${signal.text}</span>
    </div>
  `).join('');
  
  strip.querySelectorAll('.signal-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      const target = document.querySelector(signals[i].action_url);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Update every 10 seconds
setInterval(renderSignalStrip, 10000);
window.addEventListener('DOMContentLoaded', renderSignalStrip);
```

---

## PART 5: TOOLTIP COVERAGE

All 10 panels must have tooltips:

- ✅ Active Work
- ✅ Blocked Work
- ✅ Operator Guidance
- ✅ System Health
- ✅ Venture Velocity
- ✅ Agent Activity
- ✅ Momentum
- ✅ Opportunity Discovery
- ✅ Operator Impact
- ✅ Founder Decision Engine
- ✅ Relationship Graph (optional, 11th panel)

All tooltips defined in `panel_tooltips.json` (see Part 1).

---

## PART 6: PERFORMANCE

Requirements:
- UI load < 200ms
- No blocking API calls
- Auto-refresh every 10 seconds
- No UI flicker during refresh
- All data from SSOT JSON only

No changes needed — inherited from Operator Command system.

---

## PART 7: FINAL VERIFICATION

Checklist:
- [ ] Every panel has tooltip (ⓘ icon visible)
- [ ] Hovering shows help text (300ms delay)
- [ ] Progressive disclosure working (secondary panels collapsed)
- [ ] Collapsed panels show summary indicators
- [ ] Focus mode activates (70% width, others dim)
- [ ] ESC exits focus mode
- [ ] Signal highlight strip shows top 4 signals
- [ ] Signals color-coded (red/yellow/green/blue)
- [ ] Panel tooltips match operator intent (Part 1 config)
- [ ] Performance <200ms
- [ ] No console errors

Deliverables:
- Screenshot of dashboard with tooltip visible
- Screenshot of collapsed secondary panels
- Screenshot of signal highlight strip
- Tooltip configuration file (`panel_tooltips.json`)
- Verification checklist (all items signed off)

---

## ACCEPTANCE CRITERIA

✅ All 10 panels have tooltips  
✅ Tooltip behavior correct (hover, 300ms delay, 320px, mobile support)  
✅ Progressive disclosure working (primary expanded, secondary collapsed)  
✅ Collapsed panels show summaries  
✅ Focus mode working (70%, dims others, ESC exits)  
✅ Signal strip showing top 4 signals  
✅ Color coding applied (red/yellow/green/blue)  
✅ Signals generated from SSOT  
✅ Performance <200ms  
✅ No console errors  
✅ ESLint clean  

---

**CR ID:** CR-MC-TOOLTIP-CLARITY-SYSTEM  
**Date:** 2026-03-05 19:30 EST  
**Timeline:** 1 week, 1 FTE  
**Risk:** Low (UI enhancements only)  
**Acceptance:** Dashboard feels clean + intuitive, with full information available on demand
