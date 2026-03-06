/**
 * CR-MC-3MODE-OPERATOR-CONSOLE
 * Mode Manager — 3-Mode Architecture
 * Phases 1-5: Mode state, panel visibility, focus mode, layout persistence,
 *             data integrity (canonical agents)
 */

(function(window) {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────

  const MODE_KEY     = 'mc_current_mode';
  const LAYOUT_KEY   = 'mc_3mode_layout';
  const IMPACT_KEY_PREFIX = 'operator_actions_';

  const MODES = ['operator', 'operations', 'intelligence'];

  // Panels visible per mode
  const PANEL_MODES = {
    operator: [
      'panel-active-work',
      'panel-blocked-work',
      'panel-operator-guidance',
      'panel-founder-decisions',
      'panel-agent-activity',
      'panel-venture-pipeline',
      'panel-insights'
    ],
    operations: [
      'panel-active-work',
      'panel-blocked-work',
      'panel-operator-guidance',
      'panel-founder-decisions',
      'panel-workstream-flow',
      'panel-venture-pipeline',
      'panel-agent-activity',
      'panel-insights'
    ],
    intelligence: [
      'panel-active-work',
      'panel-blocked-work',
      'panel-operator-guidance',
      'panel-founder-decisions',
      'panel-insights',
      'panel-opportunity-discovery',
      'panel-momentum',
      'panel-operator-impact',
      'panel-agent-activity',
      'panel-workstream-flow',
      'panel-venture-pipeline'
    ]
  };

  // All known panel IDs
  const ALL_PANEL_IDS = [
    'panel-active-work',
    'panel-blocked-work',
    'panel-operator-guidance',
    'panel-founder-decisions',
    'panel-insights',
    'panel-opportunity-discovery',
    'panel-momentum',
    'panel-operator-impact',
    'panel-agent-activity',
    'panel-workstream-flow',
    'panel-venture-pipeline'
  ];

  // Canonical agents (Phase 5 - Task 1)
  const CANONICAL_AGENTS = ['clawson', 'codesmith', 'moonshot', 'personal-assistant'];

  // ─── State ────────────────────────────────────────────────────────

  let currentMode    = 'operator';
  let focusedPanel   = null;
  let focusBackdrop  = null;
  let hintToastTimer = null;

  // ─── Mode Management ──────────────────────────────────────────────

  /**
   * Set mode, update UI, persist to localStorage.
   * @param {string} mode - 'operator' | 'operations' | 'intelligence'
   * @param {boolean} [init=false] - suppress animation on first load
   */
  function setMode(mode, init) {
    if (!MODES.includes(mode)) {
      console.warn('[MODE-MANAGER] Unknown mode:', mode);
      return;
    }

    currentMode = mode;
    localStorage.setItem(MODE_KEY, mode);

    // Update mode-btn highlights
    document.querySelectorAll('.mode-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Apply mode class to body (drives CSS grid per mode)
    document.body.classList.remove('mode-operator', 'mode-operations', 'mode-intelligence');
    document.body.classList.add('mode-' + mode);

    // Animate transition (skip on init)
    if (!init) {
      document.body.classList.add('mc-mode-transitioning');
      setTimeout(function() {
        document.body.classList.remove('mc-mode-transitioning');
      }, 300);
    }

    // Update panel visibility via CSS (mode classes handle display:none in CSS,
    // but we also set it here for safe override during layout restore)
    updatePanelVisibility(mode);

    // Restore persisted layout for this mode
    restoreLayout(mode);

    // Update mode label indicator in top bar
    updateModeIndicator(mode);

    console.log('[MODE-MANAGER] Mode set to:', mode);
  }

  /**
   * Update visible mode indicator in top bar.
   */
  function updateModeIndicator(mode) {
    const indicator = document.getElementById('mc-mode-indicator');
    if (!indicator) return;
    indicator.textContent = mode.toUpperCase();
    indicator.className = 'mode-label-indicator mode-indicator-' + mode;
  }

  /**
   * Show/hide panels based on mode.
   * The CSS drives primary visibility via .mode-{mode} body classes,
   * but this JS ensures panels not in the list are truly hidden.
   */
  function updatePanelVisibility(mode) {
    const visible = PANEL_MODES[mode] || [];

    ALL_PANEL_IDS.forEach(function(panelId) {
      const el = document.getElementById(panelId);
      if (!el) return;

      if (visible.includes(panelId)) {
        // Remove any hard display:none we may have set
        if (el.dataset.mcHidden === '1') {
          el.style.display = '';
          el.dataset.mcHidden = '0';
        }
        // Force visibility via CSS (the !important rules in mode-styles.css will take over)
      } else {
        el.style.display = 'none';
        el.dataset.mcHidden = '1';
      }
    });

    // Failsafe: Verify panels are visible after a brief delay for CSS cascade
    setTimeout(function() {
      const visible = PANEL_MODES[mode] || [];
      let hiddenCount = 0;
      
      ALL_PANEL_IDS.forEach(function(panelId) {
        const el = document.getElementById(panelId);
        if (!el) return;
        
        if (visible.includes(panelId)) {
          const computed = window.getComputedStyle(el);
          if (computed.display === 'none') {
            console.warn('[MODE-MANAGER] Panel ' + panelId + ' still hidden after CSS cascade, forcing visibility');
            el.style.display = 'grid';
            hiddenCount++;
          }
        }
      });
      
      if (hiddenCount > 0) {
        console.warn('[MODE-MANAGER] Failsafe: Fixed ' + hiddenCount + ' panels that remained hidden');
      }
    }, 100);
  }

  // ─── Layout Persistence ───────────────────────────────────────────

  /**
   * Save current panel layout for the current mode to localStorage.
   */
  function saveLayout() {
    var raw = localStorage.getItem(LAYOUT_KEY);
    var layout = {};
    try { layout = JSON.parse(raw) || {}; } catch(_e) {}

    layout[currentMode] = layout[currentMode] || {};

    ALL_PANEL_IDS.forEach(function(panelId) {
      const el = document.getElementById(panelId);
      if (!el) return;
      layout[currentMode][panelId] = {
        width:     el.style.width     || null,
        height:    el.style.height    || null,
        collapsed: el.classList.contains('mc-collapsed'),
        fullwidth: el.classList.contains('mc-fullwidth')
      };
    });

    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    } catch(err) {
      console.warn('[MODE-MANAGER] Failed to save layout:', err.message);
    }
  }

  /**
   * Restore panel layout for a given mode from localStorage.
   */
  function restoreLayout(mode) {
    var raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return;

    var layout = {};
    try { layout = JSON.parse(raw); } catch(_e) { return; }

    var modeLayout = layout[mode];
    if (!modeLayout) return;

    ALL_PANEL_IDS.forEach(function(panelId) {
      var state = modeLayout[panelId];
      if (!state) return;

      var el = document.getElementById(panelId);
      if (!el) return;

      if (state.width)  el.style.width  = state.width;
      if (state.height) el.style.height = state.height;

      if (state.collapsed && !el.classList.contains('mc-collapsed')) {
        el.classList.add('mc-collapsed');
        var body = el.querySelector('.mc-panel-body');
        if (body) body.style.display = 'none';
        var btn = el.querySelector('[data-action="collapse"]');
        if (btn) btn.textContent = '+';
      }

      if (state.fullwidth && !el.classList.contains('mc-fullwidth')) {
        el.classList.add('mc-fullwidth');
        var dashboard = document.getElementById('mc-dashboard-grid');
        if (dashboard) dashboard.classList.add('mc-single-panel-mode');
        ALL_PANEL_IDS.forEach(function(sid) {
          if (sid !== panelId) {
            var sibling = document.getElementById(sid);
            if (sibling) sibling.style.display = 'none';
          }
        });
      }
    });
  }

  // ─── Focus Mode ───────────────────────────────────────────────────

  /**
   * Enter focus mode for a panel.
   * @param {HTMLElement} panel
   */
  function enterFocusMode(panel) {
    if (focusedPanel) exitFocusMode();

    focusedPanel = panel;

    // Create backdrop
    focusBackdrop = document.createElement('div');
    focusBackdrop.className = 'mc-focus-backdrop';
    focusBackdrop.addEventListener('click', exitFocusMode);
    document.body.appendChild(focusBackdrop);

    // Elevate panel
    panel.classList.add('mc-focus-mode');

    // Dim siblings
    ALL_PANEL_IDS.forEach(function(panelId) {
      var el = document.getElementById(panelId);
      if (el && el !== panel) el.classList.add('mc-focus-dimmed');
    });

    // Show ESC hint
    showHint('Press ESC to exit focus mode');
  }

  /**
   * Exit focus mode.
   */
  function exitFocusMode() {
    if (!focusedPanel) return;

    focusedPanel.classList.remove('mc-focus-mode');
    focusedPanel = null;

    if (focusBackdrop) {
      focusBackdrop.remove();
      focusBackdrop = null;
    }

    ALL_PANEL_IDS.forEach(function(panelId) {
      var el = document.getElementById(panelId);
      if (el) el.classList.remove('mc-focus-dimmed');
    });
  }

  /**
   * Show a brief hint toast at the bottom of the screen.
   */
  function showHint(message) {
    // Remove existing hint
    var existing = document.querySelector('.mc-hint-toast');
    if (existing) existing.remove();
    if (hintToastTimer) clearTimeout(hintToastTimer);

    var toast = document.createElement('div');
    toast.className = 'mc-hint-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    hintToastTimer = setTimeout(function() {
      if (toast.parentNode) toast.remove();
    }, 3000);
  }

  // ─── Canonical Agents (Phase 5 - Task 1) ─────────────────────────

  /**
   * Render canonical 4-agent grid in agent-activity panel.
   * Reads from /api/agents SSOT endpoint.
   */
  async function renderCanonicalAgents() {
    const container = document.getElementById('agent-activity-content');
    if (!container) return;

    let agentsData = { agents: [] };
    try {
      const res = await fetch('/api/agents');
      if (res.ok) agentsData = await res.json();
    } catch(_e) {
      console.warn('[MODE-MANAGER] Could not fetch agents');
    }

    const agentMap = {};
    (agentsData.agents || []).forEach(function(a) {
      agentMap[a.id || a.name] = a;
    });

    // Build cards for all 4 canonical agents (always show all 4)
    const activeCanonical = CANONICAL_AGENTS.map(function(id) {
      return agentMap[id] || { id: id, name: id, status: 'unknown', current_task: '—' };
    });

    if (activeCanonical.length !== 4) {
      console.warn('[MODE-MANAGER] Expected 4 canonical agents, got', activeCanonical.length);
    }

    let html = '';

    // Error banner if count mismatch
    const liveCount = (agentsData.agents || []).filter(function(a) {
      return CANONICAL_AGENTS.includes(a.id || a.name);
    }).length;

    if (agentsData.agents && agentsData.agents.length > 0 && liveCount !== 4) {
      html += '<div class="mc-agent-count-error">⚠ Expected 4 canonical agents, found ' + liveCount + ' in SSOT</div>';
    }

    html += '<div class="mc-agent-grid">';

    activeCanonical.forEach(function(agent) {
      const status  = agent.status || 'unknown';
      const name    = agent.name || agent.id || '?';
      const task    = agent.current_task || agent.task || '—';

      html += '<div class="mc-agent-card status-' + status + '">'
            + '<div class="mc-agent-name"><span class="mc-agent-status-dot"></span>' + name + '</div>'
            + '<div class="mc-agent-task">' + task + '</div>'
            + '<div class="mc-progress-bar"><div class="mc-progress-fill" style="width:' + (agent.progress || 0) + '%"></div></div>'
            + '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // ─── Operator Impact (Phase 4 - Task 4) ──────────────────────────

  function getCurrentWeek() {
    var d = new Date();
    var jan1 = new Date(d.getFullYear(), 0, 1);
    return d.getFullYear() + '-W' + Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  }

  function trackOperatorAction(actionType) {
    var key = IMPACT_KEY_PREFIX + getCurrentWeek();
    var actions = {};
    try { actions = JSON.parse(localStorage.getItem(key) || '{}'); } catch(_e) {}
    actions[actionType] = (actions[actionType] || 0) + 1;
    try { localStorage.setItem(key, JSON.stringify(actions)); } catch(_e) {}
    updateImpactPanel();
  }

  function calculateDownstreamEffects(actions) {
    // Each operator action ripples: approvals → 3x, blockers cleared → 2x, etc.
    const weights = {
      ventures_approved:  3,
      blockers_cleared:   2,
      agents_optimized:   4,
      workstreams_moved:  1.5
    };
    let total = 0;
    Object.keys(actions).forEach(function(k) {
      total += (actions[k] || 0) * (weights[k] || 1);
    });
    return total;
  }

  function updateImpactPanel() {
    const container = document.getElementById('impact-content');
    if (!container) return;

    const key = IMPACT_KEY_PREFIX + getCurrentWeek();
    let actions = {};
    try { actions = JSON.parse(localStorage.getItem(key) || '{}'); } catch(_e) {}

    const totalActions = Object.values(actions).reduce(function(a, b) { return a + b; }, 0);
    const downstream   = calculateDownstreamEffects(actions);
    const multiplier   = totalActions > 0 ? (downstream / totalActions) : 0;

    const stats = [
      { label: 'Ventures Approved', key: 'ventures_approved',  icon: '🚀' },
      { label: 'Blockers Cleared',  key: 'blockers_cleared',   icon: '✅' },
      { label: 'Agents Optimized',  key: 'agents_optimized',   icon: '🤖' },
      { label: 'Workstreams Moved', key: 'workstreams_moved',  icon: '🌊' }
    ];

    let html = '<div style="display:flex;flex-direction:column;gap:4px;">';

    stats.forEach(function(s) {
      const val = actions[s.key] || 0;
      html += '<div class="mc-impact-stat">'
            + '<span class="impact-label">' + s.icon + ' ' + s.label + '</span>'
            + '<span class="impact-value">' + val + '</span>'
            + '</div>';
    });

    html += '</div>';

    if (multiplier > 0) {
      html += '<div class="mc-influence-multiplier">⚡ Influence Multiplier: ' + multiplier.toFixed(1) + 'x</div>';
    } else {
      html += '<div class="mc-influence-multiplier" style="color:var(--text-muted);border-color:var(--border-color)">Take action to build influence</div>';
    }

    container.innerHTML = html;
  }

  // ─── Momentum (Phase 4 - Task 3) ─────────────────────────────────

  async function updateMomentumPanel() {
    const container = document.getElementById('momentum-content');
    if (!container) return;

    let momentum = null;
    try {
      const res = await fetch('/api/momentum');
      if (res.ok) momentum = await res.json();
    } catch(_e) { /* silent */ }

    // Fallback computed
    const direction  = (momentum && momentum.direction) || 'stable';
    const completed  = (momentum && momentum.this_week_completed) || 0;
    const velocityStr = (momentum && momentum.velocity_label) || completed + ' workstreams this week';

    const arrowMap = { accelerating: '↑', stable: '→', slowing: '↓' };
    const arrow    = arrowMap[direction] || '→';

    let html = '<div class="mc-momentum-status ' + direction + '">'
             + '<span class="mc-momentum-arrow ' + direction + '">' + arrow + '</span>'
             + '<div>'
             + '<div class="mc-momentum-text" style="color:' + (direction === 'accelerating' ? 'var(--color-healthy)' : direction === 'slowing' ? 'var(--color-critical)' : 'var(--color-attention)') + '">' + direction.charAt(0).toUpperCase() + direction.slice(1) + '</div>'
             + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + velocityStr + '</div>'
             + '</div>'
             + '</div>';

    if (momentum && momentum.metrics) {
      html += '<div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">';
      momentum.metrics.forEach(function(m) {
        html += '<div style="display:flex;justify-content:space-between;font-size:11px;">'
              + '<span style="color:var(--text-muted)">' + m.label + '</span>'
              + '<span style="color:var(--text-secondary)">' + m.value + '</span>'
              + '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ─── Event Wiring ─────────────────────────────────────────────────

  /**
   * Wire all mode-manager event listeners after DOM ready.
   */
  function bindEvents() {
    // Mode toggle buttons
    document.querySelectorAll('.mode-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setMode(btn.dataset.mode);
      });
    });

    // Focus buttons
    document.querySelectorAll('.mc-focus-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var panel = btn.closest('.mc-panel');
        if (!panel) return;

        if (focusedPanel === panel) {
          exitFocusMode();
        } else {
          enterFocusMode(panel);
        }
      });
    });

    // ESC key — exit focus mode
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && focusedPanel) {
        exitFocusMode();
      }
    });

    // Save layout on panel resize (observe size changes)
    if (window.ResizeObserver) {
      var resizeObserver = new ResizeObserver(function() {
        saveLayout();
      });
      ALL_PANEL_IDS.forEach(function(panelId) {
        var el = document.getElementById(panelId);
        if (el) resizeObserver.observe(el);
      });
    }

    // Also debounce on window resize
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(saveLayout, 1000);
    });

    // Track decisions badge click as operator action
    var decisionsBadge = document.getElementById('decisions-badge');
    if (decisionsBadge) {
      decisionsBadge.addEventListener('click', function() {
        // Don't track here — tracked on submit
      });
    }
  }

  // ─── Expose trackOperatorAction globally ─────────────────────────
  // Called by decision submit, blocker resolve, etc.

  window.MCMode = {
    setMode:             setMode,
    getCurrentMode:      function() { return currentMode; },
    enterFocusMode:      enterFocusMode,
    exitFocusMode:       exitFocusMode,
    showHint:            showHint,
    trackOperatorAction: trackOperatorAction,
    updateImpactPanel:   updateImpactPanel,
    updateMomentumPanel: updateMomentumPanel,
    renderCanonicalAgents: renderCanonicalAgents,
    saveLayout:          saveLayout,
    CANONICAL_AGENTS:    CANONICAL_AGENTS
  };

  // ─── Initialise ───────────────────────────────────────────────────

  function init() {
    bindEvents();

    // Restore saved mode (or default to 'operator')
    var savedMode = localStorage.getItem(MODE_KEY) || 'operator';
    setMode(savedMode, true /* init — no animation */);

    // Initial data loads for mode-manager panels
    renderCanonicalAgents();
    updateImpactPanel();
    updateMomentumPanel();

    // Refresh canonical agents every 10s
    setInterval(renderCanonicalAgents, 10000);
    // Refresh momentum every 30s
    setInterval(updateMomentumPanel, 30000);

    console.log('[MODE-MANAGER] Initialized. Mode:', savedMode);
  }

  // Boot after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
