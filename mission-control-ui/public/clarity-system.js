/**
 * clarity-system.js — CR-MC-TOOLTIP-CLARITY-SYSTEM
 *
 * Phase 1: Tooltip System (all 10 panels)
 * Phase 2: Progressive Disclosure (secondary panels collapse by default)
 * Phase 3: Focus Mode (70vw/70vh, ESC to exit, backdrop dimming)
 * Phase 4: Signal Highlight Strip (top 4 critical signals, 10s refresh)
 */

(function (window) {
  'use strict';

  /* ──────────────────────────────────────────────────────────────────────────
     CONSTANTS
     ────────────────────────────────────────────────────────────────────────── */

  // Panel IDs → tooltip config keys
  const PANEL_KEY_MAP = {
    'panel-active-work':           'active-work',
    'panel-blocked-work':          'blocked-work',
    'panel-operator-guidance':     'operator-guidance',
    'panel-founder-decisions':     'founder-decisions',
    'panel-insights':              'insights',
    'panel-opportunity-discovery': 'opportunity-discovery',
    'panel-momentum':              'momentum',
    'panel-operator-impact':       'operator-impact',
    'panel-agent-activity':        'agent-activity',
    'panel-workstream-flow':       'workstream-flow',
    'panel-venture-pipeline':      'venture-pipeline'
  };

  // Secondary panels that should be collapsed by default
  const SECONDARY_PANEL_IDS = [
    'panel-insights',
    'panel-opportunity-discovery',
    'panel-momentum',
    'panel-operator-impact',
    'panel-agent-activity',
    'panel-workstream-flow',
    'panel-venture-pipeline'
  ];

  // LocalStorage key for expansion state
  const EXPAND_STATE_KEY = 'mc_clarity_expand_state';

  // Signal strip panel → anchor map
  const SIGNAL_PANEL_TARGETS = {
    blocked:     'panel-blocked-work',
    agents:      'panel-agent-activity',
    growth:      'panel-momentum',
    opportunity: 'panel-opportunity-discovery'
  };

  /* ──────────────────────────────────────────────────────────────────────────
     PHASE 1: TOOLTIP SYSTEM
     ────────────────────────────────────────────────────────────────────────── */

  let tooltipConfig = null;
  let activeTooltipEl = null;
  let tooltipShowTimer = null;

  /**
   * Load panel_tooltips.json config.
   */
  async function loadTooltipConfig() {
    try {
      const res = await fetch('/config/panel_tooltips.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      tooltipConfig = data.panels || {};
    } catch (err) {
      console.warn('[CLARITY] Could not load panel_tooltips.json:', err.message);
      tooltipConfig = {};
    }
  }

  /**
   * Build tooltip popup HTML from config entry.
   */
  function buildTooltipHTML(config) {
    if (!config) return '<p style="color:#666">No info available.</p>';

    let html = '';
    html += `<div class="tp-title">${config.title}</div>`;
    html += `<p class="tp-desc">${config.description}</p>`;

    if (config.watch_for && config.watch_for.length) {
      html += `<div class="tp-section-label">Watch For</div>`;
      html += '<ul class="tp-list">';
      config.watch_for.forEach(function (item) {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }

    if (config.actions && config.actions.length) {
      html += `<div class="tp-section-label">Actions</div>`;
      html += '<ul class="tp-list">';
      config.actions.forEach(function (item) {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }

    if (config.data_sources && config.data_sources.length) {
      const refresh = config.refresh_interval ? `<span class="tp-refresh">↻ ${config.refresh_interval}</span>` : '';
      html += `<div class="tp-sources">Sources: ${config.data_sources.join(', ')}${refresh}</div>`;
    }

    return html;
  }

  /**
   * Show tooltip popup for a button.
   */
  function showTooltip(btn, panelKey) {
    // Remove any existing popups
    hideAllTooltips();

    const config = tooltipConfig[panelKey] || null;
    const popup = document.createElement('div');
    popup.className = 'clarity-tooltip-popup';
    popup.innerHTML = buildTooltipHTML(config);
    popup.setAttribute('data-tooltip-for', panelKey);

    // Insert into panel header (parent of button)
    const header = btn.closest('.mc-panel-header');
    if (!header) return;
    header.appendChild(popup);

    btn.classList.add('active');
    activeTooltipEl = popup;

    // Trigger CSS transition
    requestAnimationFrame(function () {
      popup.classList.add('visible');
    });
  }

  /**
   * Hide all visible tooltips.
   */
  function hideAllTooltips() {
    document.querySelectorAll('.clarity-tooltip-popup').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('.clarity-tooltip-btn.active').forEach(function (el) {
      el.classList.remove('active');
    });
    activeTooltipEl = null;
  }

  /**
   * Inject ⓘ tooltip button into panel header if not already present.
   */
  function injectTooltipButton(panelEl, panelKey) {
    const header = panelEl.querySelector('.mc-panel-header');
    if (!header) return;

    // Check if a tooltip button already exists (old ? buttons or clarity btn)
    const existing = header.querySelector('.clarity-tooltip-btn, .tooltip-btn[data-panel]');

    if (existing) {
      // Upgrade existing button to clarity style if needed
      existing.className = 'clarity-tooltip-btn';
      existing.textContent = 'ⓘ';
      existing.setAttribute('data-clarity-panel', panelKey);
      existing.removeAttribute('data-panel');
      return;
    }

    // Inject new button
    const btn = document.createElement('button');
    btn.className = 'clarity-tooltip-btn';
    btn.textContent = 'ⓘ';
    btn.setAttribute('data-clarity-panel', panelKey);
    btn.setAttribute('aria-label', 'Panel information');

    // Insert before the mc-panel-controls div, or append to header
    const controls = header.querySelector('.mc-panel-controls');
    if (controls) {
      header.insertBefore(btn, controls);
    } else {
      header.appendChild(btn);
    }
  }

  /**
   * Wire up all tooltip buttons with hover + 300ms delay + mobile tap.
   */
  function wireTooltipButtons() {
    document.querySelectorAll('.clarity-tooltip-btn').forEach(function (btn) {
      const panelKey = btn.getAttribute('data-clarity-panel');
      if (!panelKey) return;

      // Desktop: hover with 300ms delay
      btn.addEventListener('mouseenter', function () {
        if (tooltipShowTimer) clearTimeout(tooltipShowTimer);
        tooltipShowTimer = setTimeout(function () {
          showTooltip(btn, panelKey);
        }, 300);
      });

      btn.addEventListener('mouseleave', function () {
        if (tooltipShowTimer) clearTimeout(tooltipShowTimer);
        // Small delay before hiding to allow moving onto popup
        setTimeout(function () {
          const popup = document.querySelector(`.clarity-tooltip-popup[data-tooltip-for="${panelKey}"]`);
          if (popup && !popup.matches(':hover') && !btn.matches(':hover')) {
            hideAllTooltips();
          }
        }, 150);
      });

      // Mobile: tap toggle
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (tooltipShowTimer) clearTimeout(tooltipShowTimer);
        const existing = document.querySelector(`.clarity-tooltip-popup[data-tooltip-for="${panelKey}"]`);
        if (existing) {
          hideAllTooltips();
        } else {
          showTooltip(btn, panelKey);
        }
      });
    });

    // Click outside to dismiss
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.clarity-tooltip-btn') && !e.target.closest('.clarity-tooltip-popup')) {
        hideAllTooltips();
      }
    });
  }

  /**
   * Remove legacy inline tooltip-popup divs (replaced by JS-generated ones).
   */
  function removeLegacyTooltipPopups() {
    document.querySelectorAll('.tooltip-popup').forEach(function (el) {
      el.remove();
    });
  }

  /**
   * Initialize tooltip system for all panels.
   */
  async function initTooltips() {
    await loadTooltipConfig();

    removeLegacyTooltipPopups();

    Object.entries(PANEL_KEY_MAP).forEach(function ([panelId, panelKey]) {
      const panelEl = document.getElementById(panelId);
      if (!panelEl) return;
      injectTooltipButton(panelEl, panelKey);
    });

    wireTooltipButtons();
    console.log('[CLARITY] Tooltip system initialized for', Object.keys(PANEL_KEY_MAP).length, 'panels');
  }

  /* ──────────────────────────────────────────────────────────────────────────
     PHASE 2: PROGRESSIVE DISCLOSURE
     ────────────────────────────────────────────────────────────────────────── */

  /**
   * Summary content generators for each secondary panel.
   * Returns HTML chip(s) to display when panel is collapsed.
   */
  const SUMMARY_GENERATORS = {
    'panel-insights': function () {
      const list = document.getElementById('insights-list');
      if (!list) return defaultChip('System insights');
      const items = list.querySelectorAll('.insight-item, .insight-row, li');
      const count = items.length;
      return count > 0
        ? `<span class="clarity-summary-chip">🧠 ${count} insight${count !== 1 ? 's' : ''} detected</span>`
        : defaultChip('No insights');
    },
    'panel-opportunity-discovery': function () {
      const content = document.getElementById('opportunities-content');
      if (!content) return defaultChip('Scanning…');
      const items = content.querySelectorAll('.opportunity-item, .insight-item, li');
      const count = items.length;
      return count > 0
        ? `<span class="clarity-summary-chip">🔭 ${count} opportunit${count !== 1 ? 'ies' : 'y'} found</span>`
        : defaultChip('Scanning for opportunities');
    },
    'panel-momentum': function () {
      const content = document.getElementById('momentum-content');
      if (!content) return defaultChip('Loading momentum…');
      const completions = content.querySelector('[data-metric="completions"], .completions-value');
      const val = completions ? completions.textContent.trim() : null;
      return val
        ? `<span class="clarity-summary-chip">📈 ${val} completions this week</span>`
        : `<span class="clarity-summary-chip">📈 Weekly momentum</span>`;
    },
    'panel-operator-impact': function () {
      const content = document.getElementById('impact-content');
      if (!content) return defaultChip('Operator metrics');
      const decisions = content.querySelector('[data-metric="decisions"], .decisions-value');
      const val = decisions ? decisions.textContent.trim() : null;
      return val
        ? `<span class="clarity-summary-chip">🎯 ${val} decisions made</span>`
        : `<span class="clarity-summary-chip">🎯 Your impact metrics</span>`;
    },
    'panel-agent-activity': function () {
      const content = document.getElementById('agent-activity-content');
      if (!content) return defaultChip('Activity feed');
      const items = content.querySelectorAll('.activity-item, .feed-item, li');
      const count = items.length;
      return count > 0
        ? `<span class="clarity-summary-chip">🤖 ${count} recent agent action${count !== 1 ? 's' : ''}</span>`
        : `<span class="clarity-summary-chip">🤖 Agent activity feed</span>`;
    },
    'panel-workstream-flow': function () {
      const content = document.getElementById('workstream-flow-content');
      if (!content) return defaultChip('Workstream flow');
      const items = content.querySelectorAll('.flow-stage, .stage-item, .flow-item');
      return `<span class="clarity-summary-chip">🌊 Workstream pipeline flow</span>`;
    },
    'panel-venture-pipeline': function () {
      const ideas = document.getElementById('scoreboard-ideas');
      const running = document.getElementById('scoreboard-running');
      const live = document.getElementById('scoreboard-live');
      if (ideas && running && live) {
        return [
          `<span class="clarity-summary-chip">💡 ${ideas.textContent} ideas</span>`,
          `<span class="clarity-summary-chip">⚙️ ${running.textContent} running</span>`,
          `<span class="clarity-summary-chip">🟢 ${live.textContent} live</span>`
        ].join('');
      }
      return `<span class="clarity-summary-chip">🚀 Venture pipeline</span>`;
    }
  };

  function defaultChip(label) {
    return `<span class="clarity-summary-chip">${label}</span>`;
  }

  /**
   * Inject summary div below panel header (hidden by default, shown when collapsed).
   */
  function injectSummaryDiv(panelEl, panelId) {
    if (panelEl.querySelector('.clarity-panel-summary')) return;

    const summary = document.createElement('div');
    summary.className = 'clarity-panel-summary';
    summary.setAttribute('data-panel-summary', panelId);

    const header = panelEl.querySelector('.mc-panel-header');
    if (header && header.nextSibling) {
      panelEl.insertBefore(summary, header.nextSibling);
    } else {
      panelEl.appendChild(summary);
    }
  }

  /**
   * Update summary content for a panel.
   */
  function updateSummary(panelId) {
    const gen = SUMMARY_GENERATORS[panelId];
    if (!gen) return;
    const summary = document.querySelector(`[data-panel-summary="${panelId}"]`);
    if (!summary) return;
    summary.innerHTML = gen();
  }

  /**
   * Load saved expansion state from localStorage.
   */
  function loadExpandState() {
    try {
      const raw = localStorage.getItem(EXPAND_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  /**
   * Save expansion state for a panel to localStorage.
   */
  function saveExpandState(panelId, expanded) {
    try {
      const state = loadExpandState();
      state[panelId] = expanded;
      localStorage.setItem(EXPAND_STATE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  /**
   * Collapse a secondary panel (update button + body).
   */
  function collapsePanel(panelEl, panelId, animate) {
    const body = panelEl.querySelector('.mc-panel-body');
    const btn = panelEl.querySelector('[data-action="collapse"]');

    panelEl.classList.add('mc-collapsed');
    if (body) body.style.display = 'none';
    if (btn) { btn.textContent = '+'; btn.title = 'Expand'; }

    updateSummary(panelId);
    saveExpandState(panelId, false);
    if (window.MCStorage) window.MCStorage.saveLayout();
  }

  /**
   * Expand a secondary panel.
   */
  function expandPanel(panelEl, panelId) {
    const body = panelEl.querySelector('.mc-panel-body');
    const btn = panelEl.querySelector('[data-action="collapse"]');

    panelEl.classList.remove('mc-collapsed');
    if (body) body.style.display = '';
    if (btn) { btn.textContent = '−'; btn.title = 'Collapse'; }

    saveExpandState(panelId, true);
    if (window.MCStorage) window.MCStorage.saveLayout();
  }

  /**
   * Initialize progressive disclosure: collapse secondary panels by default,
   * restore from localStorage, wire expand/collapse buttons.
   */
  function initProgressiveDisclosure() {
    const savedState = loadExpandState();

    SECONDARY_PANEL_IDS.forEach(function (panelId) {
      const panelEl = document.getElementById(panelId);
      if (!panelEl) return;

      injectSummaryDiv(panelEl, panelId);

      // Determine initial state: if no saved state, collapse by default
      const savedExpanded = savedState[panelId];
      const shouldExpand = savedExpanded === true;

      if (shouldExpand) {
        expandPanel(panelEl, panelId);
      } else {
        // Only collapse if MCStorage hasn't already restored a collapsed state
        // (to avoid double-collapsing conflict)
        if (!panelEl.classList.contains('mc-collapsed')) {
          collapsePanel(panelEl, panelId, false);
        } else {
          updateSummary(panelId);
        }
      }
    });

    // Hook the existing collapse buttons to also update summaries
    document.querySelectorAll('[data-action="collapse"]').forEach(function (btn) {
      const panelId = btn.getAttribute('data-panel');
      const panelEl = panelId ? document.getElementById(panelId) : null;
      if (!panelEl) return;

      btn.addEventListener('click', function () {
        // After the existing handler runs, update summary
        requestAnimationFrame(function () {
          updateSummary(panelId);
        });
      });
    });

    // Update summaries periodically when panels have loaded content
    setInterval(function () {
      SECONDARY_PANEL_IDS.forEach(function (panelId) {
        const panelEl = document.getElementById(panelId);
        if (panelEl && panelEl.classList.contains('mc-collapsed')) {
          updateSummary(panelId);
        }
      });
    }, 15000);

    console.log('[CLARITY] Progressive disclosure initialized for', SECONDARY_PANEL_IDS.length, 'panels');
  }

  /* ──────────────────────────────────────────────────────────────────────────
     PHASE 3: FOCUS MODE
     ────────────────────────────────────────────────────────────────────────── */

  let activeFocusPanelId = null;

  /**
   * Create the focus backdrop element.
   */
  function ensureFocusBackdrop() {
    let backdrop = document.getElementById('clarity-focus-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'clarity-focus-backdrop';
      backdrop.className = 'clarity-focus-backdrop';
      backdrop.addEventListener('click', exitFocusMode);
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  /**
   * Activate focus mode for a panel.
   */
  function activateFocusMode(panelId) {
    exitFocusMode(); // Exit any existing focus mode first

    const panel = document.getElementById(panelId);
    if (!panel) return;

    panel.classList.add('focus-mode');
    document.body.classList.add('focus-mode-active');
    activeFocusPanelId = panelId;

    const backdrop = ensureFocusBackdrop();
    backdrop.classList.add('active');

    // Expand the panel body if it was collapsed
    const body = panel.querySelector('.mc-panel-body');
    if (body) body.style.display = '';

    console.log('[CLARITY] Focus mode activated:', panelId);
  }

  /**
   * Exit focus mode.
   */
  function exitFocusMode() {
    document.querySelectorAll('.mc-panel.focus-mode').forEach(function (p) {
      p.classList.remove('focus-mode');
    });
    document.body.classList.remove('focus-mode-active');

    const backdrop = document.getElementById('clarity-focus-backdrop');
    if (backdrop) backdrop.classList.remove('active');

    activeFocusPanelId = null;
  }

  /**
   * Inject focus button (⛶) into panel headers that are missing it.
   */
  function injectFocusButtons() {
    Object.keys(PANEL_KEY_MAP).forEach(function (panelId) {
      const panelEl = document.getElementById(panelId);
      if (!panelEl) return;

      const controls = panelEl.querySelector('.mc-panel-controls');
      if (!controls) return;

      // Check if focus button already exists
      const existing = controls.querySelector('.mc-focus-btn, .clarity-focus-btn');
      if (existing) {
        // Upgrade existing button class
        existing.classList.add('clarity-focus-btn');
        existing.setAttribute('data-focus-panel', panelId);
        return;
      }

      // Inject new focus button as first child of controls
      const btn = document.createElement('button');
      btn.className = 'clarity-focus-btn';
      btn.textContent = '⛶';
      btn.setAttribute('data-focus-panel', panelId);
      btn.setAttribute('title', 'Focus Mode');
      controls.insertBefore(btn, controls.firstChild);
    });
  }

  /**
   * Wire focus buttons.
   */
  function wireFocusButtons() {
    document.querySelectorAll('[data-focus-panel]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const panelId = btn.getAttribute('data-focus-panel');
        if (activeFocusPanelId === panelId) {
          exitFocusMode();
        } else {
          activateFocusMode(panelId);
        }
      });
    });
  }

  /**
   * Initialize focus mode.
   */
  function initFocusMode() {
    ensureFocusBackdrop();
    injectFocusButtons();
    wireFocusButtons();

    // ESC to exit
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeFocusPanelId) {
        e.preventDefault();
        exitFocusMode();
      }
    });

    console.log('[CLARITY] Focus mode initialized');
  }

  /* ──────────────────────────────────────────────────────────────────────────
     PHASE 4: SIGNAL HIGHLIGHT STRIP
     ────────────────────────────────────────────────────────────────────────── */

  let signalStripEl = null;

  /**
   * Create signal strip element and inject below top-bar.
   * Uses existing DOM element if present (from index.html static markup).
   */
  function ensureSignalStrip() {
    // Use existing element if already in DOM
    const existing = document.getElementById('clarity-signal-strip');
    if (existing) {
      signalStripEl = existing;
      return;
    }

    if (signalStripEl && document.contains(signalStripEl)) return;

    signalStripEl = document.createElement('div');
    signalStripEl.className = 'signal-strip';
    signalStripEl.id = 'clarity-signal-strip';

    const dashboardContainer = document.querySelector('.dashboard-container');
    const topBar = dashboardContainer ? dashboardContainer.querySelector('.top-bar') : null;
    const grid = document.getElementById('mc-dashboard-grid');

    if (topBar && topBar.parentNode) {
      topBar.parentNode.insertBefore(signalStripEl, topBar.nextSibling);
    } else if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(signalStripEl, grid);
    } else {
      document.body.insertBefore(signalStripEl, document.body.firstChild);
    }
  }

  /**
   * Fetch data needed for signal generation.
   * Returns { blockers, agents, opportunities, momentum }
   */
  async function fetchSignalData() {
    const results = {};

    try {
      const [blockersRes, agentsRes, oppsRes, momentumRes] = await Promise.allSettled([
        fetch('/api/blockers'),
        fetch('/api/agents'),
        fetch('/api/opportunities'),
        fetch('/api/momentum')
      ]);

      if (blockersRes.status === 'fulfilled' && blockersRes.value.ok) {
        results.blockers = await blockersRes.value.json();
      }
      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        results.agents = await agentsRes.value.json();
      }
      if (oppsRes.status === 'fulfilled' && oppsRes.value.ok) {
        results.opportunities = await oppsRes.value.json();
      }
      if (momentumRes.status === 'fulfilled' && momentumRes.value.ok) {
        results.momentum = await momentumRes.value.json();
      }
    } catch (err) {
      console.warn('[CLARITY] Signal data fetch error:', err.message);
    }

    return results;
  }

  /**
   * Generate signals from data. Returns array sorted by priority (max 4).
   * Priority: critical → action → info → opportunity
   */
  function generateSignals(data) {
    const signals = [];

    /* Rule 1: Critical Blockers */
    if (data.blockers) {
      const items = data.blockers.items || data.blockers.blockers || [];
      const critical = items.filter(function (item) {
        return item.severity === 'critical' || item.priority === 'critical';
      });
      if (critical.length > 0) {
        // Find oldest
        const oldest = critical.reduce(function (a, b) {
          const aAge = a.age_hours || a.ageHours || 0;
          const bAge = b.age_hours || b.ageHours || 0;
          return aAge > bAge ? a : b;
        }, critical[0]);
        const age = oldest.age_hours || oldest.ageHours || null;
        const ageStr = age !== null ? ` — ${Math.round(age)}h old` : '';
        signals.push({
          severity: 'critical',
          icon: '🔴',
          text: `Blocked Work (${critical.length} critical item${critical.length !== 1 ? 's' : ''})${ageStr}`,
          target: SIGNAL_PANEL_TARGETS.blocked,
          priority: 1
        });
      }
    }

    /* Rule 2: Idle Agent Capacity */
    if (data.agents) {
      const agentList = data.agents.agents || [];
      const idleAgents = agentList.filter(function (agent) {
        const ownedWs = agent.owned_workstreams != null ? agent.owned_workstreams : null;
        return (agent.status === 'active' || agent.status === 'online') &&
               ownedWs === 0;
      });
      if (idleAgents.length > 0) {
        const names = idleAgents.map(function (a) { return a.name || a.id; }).join(', ');
        signals.push({
          severity: 'action',
          icon: '🟡',
          text: `${idleAgents.length} agent${idleAgents.length !== 1 ? 's' : ''} idle (${names})`,
          target: SIGNAL_PANEL_TARGETS.agents,
          priority: 2
        });
      }
    }

    /* Rule 3: Growth Spike (completions_24h > 5) */
    if (data.momentum) {
      const completions = data.momentum.completions_24h ||
                          data.momentum.completionsToday ||
                          (data.momentum.metrics && data.momentum.metrics.completions_24h) ||
                          0;
      const prevCompletions = data.momentum.completions_prev_24h ||
                              (data.momentum.metrics && data.momentum.metrics.completions_prev_24h) ||
                              0;
      if (completions > 5) {
        const pct = prevCompletions > 0
          ? Math.round(((completions - prevCompletions) / prevCompletions) * 100)
          : null;
        const pctStr = pct !== null && pct > 0 ? ` (+${pct}% vs yesterday)` : '';
        signals.push({
          severity: 'info',
          icon: '🟢',
          text: `Growth spike: ${completions} completions today${pctStr}`,
          target: SIGNAL_PANEL_TARGETS.growth,
          priority: 3
        });
      }
    }

    /* Rule 4: New Opportunities */
    if (data.opportunities) {
      const opps = data.opportunities.opportunities ||
                   data.opportunities.items ||
                   (Array.isArray(data.opportunities) ? data.opportunities : []);
      const newOpps = opps.filter(function (opp) {
        return opp.is_new === true || opp.status === 'new' ||
               (opp.detected_at && isRecent(opp.detected_at, 24));
      });
      if (newOpps.length > 0) {
        signals.push({
          severity: 'opportunity',
          icon: '🔵',
          text: `${newOpps.length} new venture opportunit${newOpps.length !== 1 ? 'ies' : 'y'} detected`,
          target: SIGNAL_PANEL_TARGETS.opportunity,
          priority: 4
        });
      } else if (opps.length > 0) {
        // Show total opportunities even if not "new"
        signals.push({
          severity: 'opportunity',
          icon: '🔵',
          text: `${opps.length} venture opportunit${opps.length !== 1 ? 'ies' : 'y'} in discovery`,
          target: SIGNAL_PANEL_TARGETS.opportunity,
          priority: 4
        });
      }
    }

    // Sort by priority and cap at 4
    signals.sort(function (a, b) { return a.priority - b.priority; });
    return signals.slice(0, 4);
  }

  /**
   * Check if a timestamp is within N hours.
   */
  function isRecent(timestamp, hours) {
    try {
      const dt = new Date(timestamp);
      const now = new Date();
      return (now - dt) < (hours * 3600 * 1000);
    } catch (_) {
      return false;
    }
  }

  /**
   * Render signals into the strip.
   */
  function renderSignalStrip(signals) {
    if (!signalStripEl) return;

    if (!signals || signals.length === 0) {
      signalStripEl.innerHTML =
        '<div class="signal-strip-empty">All systems nominal — no critical signals</div>';
      return;
    }

    signalStripEl.innerHTML = signals.map(function (s) {
      return `<div class="signal-item signal-${s.severity}" data-signal-target="${s.target || ''}">
        <span class="signal-icon">${s.icon}</span>
        <span class="signal-text">${s.text}</span>
      </div>`;
    }).join('');

    // Wire click handlers to scroll to relevant panel
    signalStripEl.querySelectorAll('.signal-item[data-signal-target]').forEach(function (item) {
      const targetId = item.getAttribute('data-signal-target');
      if (!targetId) return;
      item.addEventListener('click', function () {
        const target = document.getElementById(targetId);
        if (!target) return;

        // Expand panel if collapsed
        if (target.classList.contains('mc-collapsed')) {
          const panelId = target.id;
          expandPanel(target, panelId);
        }

        // Scroll to panel
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Brief highlight flash
        target.style.transition = 'box-shadow 0.3s';
        target.style.boxShadow = '0 0 0 2px rgba(99, 179, 237, 0.6)';
        setTimeout(function () {
          target.style.boxShadow = '';
        }, 1500);
      });
    });
  }

  /**
   * Full signal strip update cycle.
   */
  async function updateSignalStrip() {
    try {
      const data = await fetchSignalData();
      const signals = generateSignals(data);
      renderSignalStrip(signals);
    } catch (err) {
      console.warn('[CLARITY] Signal strip update error:', err.message);
    }
  }

  /**
   * Initialize signal strip.
   */
  function initSignalStrip() {
    ensureSignalStrip();

    // Initial render (empty placeholder)
    renderSignalStrip([]);

    // First real update (slight delay to let other panels initialize)
    setTimeout(updateSignalStrip, 2000);

    // Auto-refresh every 10 seconds
    setInterval(updateSignalStrip, 10000);

    console.log('[CLARITY] Signal strip initialized');
  }

  /* ──────────────────────────────────────────────────────────────────────────
     MAIN INIT
     ────────────────────────────────────────────────────────────────────────── */

  async function init() {
    console.log('[CLARITY] Initializing CR-MC-TOOLTIP-CLARITY-SYSTEM...');

    // Phase 1: Tooltips (async - loads config)
    await initTooltips();

    // Phase 2: Progressive Disclosure
    initProgressiveDisclosure();

    // Phase 3: Focus Mode
    initFocusMode();

    // Phase 4: Signal Strip
    initSignalStrip();

    console.log('[CLARITY] All 4 phases initialized ✓');
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external use
  window.ClaritySystem = {
    exitFocusMode:      exitFocusMode,
    activateFocusMode:  activateFocusMode,
    updateSignalStrip:  updateSignalStrip,
    hideAllTooltips:    hideAllTooltips,
    expandPanel:        expandPanel,
    collapsePanel:      collapsePanel
  };

})(window);
