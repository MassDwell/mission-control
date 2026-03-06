/**
 * CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS
 * Operator Premium UI + Operations Action Layer
 *
 * Phase 1: Premium operator summary row (5 KPIs)
 * Phase 2: Operations action layer (10 action types)
 * Phase 9: Today's Priorities section
 *
 * All actions route through CommandBusClient (unified queue).
 * NO direct state mutations.
 */

(function(window) {
  'use strict';

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Operator KPI Summary Row ─────────────────────────────────────────────────

  /**
   * Build and inject the 5-KPI operator summary row.
   * Placed above the panel grid in operator mode.
   */
  async function buildOperatorSummaryRow() {
    // Fetch data for KPIs
    let blockers    = 0;
    let ventures    = 0;
    let agents      = 0;
    let insights    = 0;
    let health      = '—';

    try {
      const [blockersRes, agentsRes, insightsRes, ventureRes] = await Promise.allSettled([
        fetch('/api/blockers'),
        fetch('/api/agents'),
        fetch('/api/insights'),
        fetch('/api/venture-pipeline'),
      ]);

      if (blockersRes.status === 'fulfilled' && blockersRes.value.ok) {
        const d = await blockersRes.value.json();
        blockers = (d.blockers || []).filter(b => b.severity === 'critical').length;
      }
      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        const d = await agentsRes.value.json();
        agents = (d.agents || []).filter(a => a.status === 'online').length;
        const total = (d.agents || []).length;
        health = total > 0 ? `${agents}/${total}` : '0/0';
      }
      if (insightsRes.status === 'fulfilled' && insightsRes.value.ok) {
        const d = await insightsRes.value.json();
        insights = (d.insights || []).filter(i => ['critical','warning'].includes(i.type)).length;
      }
      if (ventureRes.status === 'fulfilled' && ventureRes.value.ok) {
        const d = await ventureRes.value.json();
        ventures = d.ventures_live || (d.pipeline ? Object.values(d.pipeline).reduce((a,b) => a + (b||0), 0) : 0);
      }
    } catch (err) {
      console.warn('[OPERATOR-PREMIUM] KPI fetch error:', err.message);
    }

    return `
      <div class="operator-summary-row" id="operator-kpi-row">
        <div class="operator-kpi" title="Active ventures across all stages">
          <div class="operator-kpi-number kpi-info">${escHtml(String(ventures))}</div>
          <div class="operator-kpi-label">Ventures</div>
        </div>
        <div class="operator-kpi" title="Critical blockers requiring immediate attention">
          <div class="operator-kpi-number ${blockers > 0 ? 'kpi-critical' : 'kpi-healthy'}">${escHtml(String(blockers))}</div>
          <div class="operator-kpi-label">Blockers</div>
        </div>
        <div class="operator-kpi" title="Active agents (online/total)">
          <div class="operator-kpi-number kpi-healthy">${escHtml(health)}</div>
          <div class="operator-kpi-label">Agents</div>
        </div>
        <div class="operator-kpi" title="Critical + warning insights">
          <div class="operator-kpi-number ${insights > 0 ? 'kpi-warn' : 'kpi-healthy'}">${escHtml(String(insights))}</div>
          <div class="operator-kpi-label">Insights</div>
        </div>
        <div class="operator-kpi" title="Command bus — pending actions">
          <div class="operator-kpi-number" id="kpi-queue-count">—</div>
          <div class="operator-kpi-label">Queue</div>
        </div>
      </div>
    `;
  }

  /**
   * Refresh queue count in KPI row.
   */
  async function refreshQueueKPI() {
    const el = document.getElementById('kpi-queue-count');
    if (!el) return;
    try {
      const res = await fetch('/api/command-bus/stats');
      if (!res.ok) return;
      const stats = await res.json();
      const pending = stats.pending || 0;
      el.textContent = String(pending);
      el.className = `operator-kpi-number ${pending > 0 ? 'kpi-warn' : 'kpi-healthy'}`;
    } catch { /* ignore */ }
  }

  // ─── Today's Priorities Section ───────────────────────────────────────────────

  async function buildTodaysPriorities() {
    let priorities = [];

    try {
      const [blockersRes, insightsRes, guidanceRes] = await Promise.allSettled([
        fetch('/api/blockers'),
        fetch('/api/insights'),
        fetch('/api/operator-guidance'),
      ]);

      if (blockersRes.status === 'fulfilled' && blockersRes.value.ok) {
        const d = await blockersRes.value.json();
        const critical = (d.blockers || []).filter(b => b.severity === 'critical').slice(0, 2);
        critical.forEach(b => priorities.push({
          badge: 'critical',
          text:  b.title || b.description || 'Critical blocker',
          source: 'blocker',
        }));
      }

      if (insightsRes.status === 'fulfilled' && insightsRes.value.ok) {
        const d = await insightsRes.value.json();
        const urgent = (d.insights || []).filter(i => i.type === 'critical').slice(0, 1);
        urgent.forEach(i => priorities.push({
          badge: 'critical',
          text:  i.title || i.description || 'Critical insight',
          source: 'insight',
        }));
      }

      if (guidanceRes.status === 'fulfilled' && guidanceRes.value.ok) {
        const d = await guidanceRes.value.json();
        const top = (d.guidance || []).slice(0, 2);
        top.forEach(g => priorities.push({
          badge: g.severity === 'critical' ? 'critical' : g.severity === 'warning' ? 'warning' : 'info',
          text:  g.action || g.description || '',
          source: 'guidance',
        }));
      }
    } catch (err) {
      console.warn('[OPERATOR-PREMIUM] Priorities fetch error:', err.message);
    }

    // Limit to top 3
    priorities = priorities.slice(0, 3);

    if (priorities.length === 0) {
      return `
        <div class="operator-priorities-section">
          <div class="operator-priorities-title">Today's Priorities</div>
          <div class="operator-empty-state" style="padding: 12px 0;">
            <span class="operator-empty-state-icon">✅</span>
            <span class="operator-empty-state-text">No urgent priorities right now</span>
          </div>
        </div>
      `;
    }

    const items = priorities.map(p => `
      <div class="operator-priority-item">
        <span class="operator-priority-badge priority-badge-${escHtml(p.badge)}">${escHtml(p.badge.toUpperCase())}</span>
        <span class="operator-priority-text">${escHtml(p.text)}</span>
        <span class="operator-priority-source">${escHtml(p.source)}</span>
      </div>
    `).join('');

    return `
      <div class="operator-priorities-section" id="todays-priorities">
        <div class="operator-priorities-title">Today's Priorities</div>
        ${items}
      </div>
    `;
  }

  // ─── Operations Action Layer ───────────────────────────────────────────────────

  /**
   * Inject action buttons into venture drilldown (operations mode).
   * Called when a venture detail opens.
   */
  function injectVentureActions(ventureId, ventureData) {
    const mount = document.getElementById('command-center-mount');
    if (!mount) return;

    // In operations mode, enhance the command center with queue-based actions
    if (!document.body.classList.contains('mode-operations')) return;

    const status = ventureData?.status || 'active';
    const stage  = ventureData?.stage  || '—';
    const isPaused = status === 'paused';
    const isKilled = status === 'killed';

    const actionHtml = `
      <div class="action-btn-group" id="ops-venture-actions" data-venture="${escHtml(ventureId)}">
        ${!isPaused && !isKilled ? `
          <button class="action-btn action-btn-warn" data-action="pause_venture" title="Pause this venture">
            ⏸ Pause Venture
          </button>
        ` : ''}
        ${isPaused ? `
          <button class="action-btn action-btn-primary" data-action="resume_venture" title="Resume venture">
            ▶ Resume
          </button>
        ` : ''}
        ${!isKilled ? `
          <button class="action-btn action-btn-primary" data-action="advance_stage" title="Advance to next pipeline stage">
            → Advance Stage
          </button>
          <button class="action-btn" data-action="spawn_workstream" title="Create new workstream for this venture">
            + Spawn Workstream
          </button>
          <button class="action-btn" data-action="assign_agent" title="Assign an agent to a workstream">
            👤 Assign Agent
          </button>
          <button class="action-btn" data-action="trigger_experiment" title="Trigger an experiment">
            🧪 Trigger Experiment
          </button>
          <button class="action-btn action-btn-danger" data-action="kill_venture" title="Kill this venture permanently">
            ✕ Kill Venture
          </button>
        ` : `<span style="font-size:11px;color:#4a5568;padding:6px 0;">Venture is killed</span>`}
      </div>
    `;

    // Inject after existing command center content
    let actionsEl = document.getElementById('ops-venture-actions');
    if (actionsEl) actionsEl.remove();

    mount.insertAdjacentHTML('beforeend', actionHtml);

    // Wire up action buttons
    document.getElementById('ops-venture-actions')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action_type = btn.dataset.action;
      let payload = {};

      // For advance_stage, try to get next stage from current stage
      if (action_type === 'advance_stage' && ventureData?.stage) {
        payload.current_stage = ventureData.stage;
      }
      if (action_type === 'kill_venture') {
        const reason = prompt('Reason for killing this venture? (required)');
        if (!reason) return;
        payload.reason = reason;
      }
      if (action_type === 'spawn_workstream') {
        const name = prompt('Workstream name?');
        if (!name) return;
        payload.name = name;
      }

      if (window.CommandBusClient) {
        await CommandBusClient.submit({
          action_type,
          target_type: 'venture',
          target_id:   ventureId,
          payload,
        });
      }
    });
  }

  /**
   * Inject blocker action buttons into blocker drilldown.
   */
  function injectBlockerActions(blockerId, blockerData) {
    if (!document.body.classList.contains('mode-operations')) return;
    const severity = blockerData?.severity || 'info';

    return `
      <div class="action-btn-group" id="ops-blocker-actions" data-blocker="${escHtml(blockerId)}">
        <button class="action-btn action-btn-primary" data-action="clear_blocker" data-target="${escHtml(blockerId)}" data-target-type="blocker">
          ✓ Clear Blocker
        </button>
        <button class="action-btn" data-action="assign_agent" data-target="${escHtml(blockerId)}" data-target-type="blocker">
          👤 Assign Agent
        </button>
      </div>
    `;
  }

  /**
   * Inject workstream action buttons into workstream drilldown.
   */
  function injectWorkstreamActions(workstreamId, wsData) {
    if (!document.body.classList.contains('mode-operations')) return;
    const status = wsData?.status || 'active';

    return `
      <div class="action-btn-group" id="ops-ws-actions" data-workstream="${escHtml(workstreamId)}">
        ${status !== 'completed' ? `
          <button class="action-btn action-btn-primary" data-action="complete_workstream" data-target="${escHtml(workstreamId)}" data-target-type="workstream">
            ✓ Mark Complete
          </button>
        ` : `
          <button class="action-btn" data-action="reopen_workstream" data-target="${escHtml(workstreamId)}" data-target-type="workstream">
            ↩ Reopen
          </button>
        `}
        <button class="action-btn" data-action="assign_agent" data-target="${escHtml(workstreamId)}" data-target-type="workstream">
          👤 Assign Agent
        </button>
      </div>
    `;
  }

  // ─── Mode-based Empty States ──────────────────────────────────────────────────

  const PREMIUM_EMPTY_STATES = {
    blockers: {
      icon: '🟢',
      text: 'No blockers right now',
      sub: 'Ventures are moving freely',
    },
    insights: {
      icon: '✅',
      text: 'No urgent insights',
      sub: 'Systems are healthy',
    },
    agents: {
      icon: '🤖',
      text: 'All agents online',
      sub: '',
    },
    workstreams: {
      icon: '🏗',
      text: 'No active workstreams',
      sub: 'Spawn one to get started',
    },
  };

  function premiumEmptyHtml(type) {
    const state = PREMIUM_EMPTY_STATES[type] || { icon: '—', text: 'Nothing here', sub: '' };
    return `
      <div class="operator-empty-state">
        <div class="operator-empty-state-icon">${state.icon}</div>
        <div class="operator-empty-state-text">${state.text}</div>
        ${state.sub ? `<div class="operator-empty-state-sub">${state.sub}</div>` : ''}
      </div>
    `;
  }

  // ─── Mode Manager Integration ─────────────────────────────────────────────────

  async function onModeChange(newMode) {
    document.body.className = document.body.className
      .replace(/mode-\w+/g, '')
      .trim();
    document.body.classList.add(`mode-${newMode}`);

    if (newMode === 'operator') {
      await renderOperatorEnhancements();
    } else {
      removeOperatorEnhancements();
    }
  }

  async function renderOperatorEnhancements() {
    // Inject KPI summary row above panel grid
    const panelGrid = document.querySelector('.panels-grid, #panels-grid, .main-panels');
    if (!panelGrid) return;

    // Remove existing if any
    document.getElementById('operator-kpi-row')?.closest('.operator-summary-row')?.remove();
    document.getElementById('todays-priorities')?.closest('.operator-priorities-section')?.remove();

    const kpiHtml = await buildOperatorSummaryRow();
    const prioritiesHtml = await buildTodaysPriorities();

    panelGrid.insertAdjacentHTML('beforebegin', kpiHtml);
    panelGrid.insertAdjacentHTML('beforebegin', prioritiesHtml);

    // Auto-refresh queue KPI every 5 seconds
    setInterval(refreshQueueKPI, 5000);
  }

  function removeOperatorEnhancements() {
    document.getElementById('operator-kpi-row')?.closest('.operator-summary-row')?.remove();
    document.getElementById('todays-priorities')?.closest('.operator-priorities-section')?.remove();
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    // Listen for mode changes
    document.addEventListener('mc:mode-changed', (e) => {
      onModeChange(e.detail?.mode || 'operator');
    });

    // Wire venture detail open for operations action injection
    document.addEventListener('mc:venture-detail-opened', (e) => {
      const { venture_id, venture } = e.detail || {};
      if (venture_id) {
        injectVentureActions(venture_id, venture);
      }
    });

    // Wire action-executed events to refresh KPI
    document.addEventListener('mc:action-executed', () => {
      refreshQueueKPI();
    });

    // Apply current mode on init
    const currentMode = localStorage.getItem('mc_current_mode') || 'operator';
    if (currentMode === 'operator') {
      renderOperatorEnhancements();
    }
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  window.OperatorPremium = {
    buildOperatorSummaryRow,
    buildTodaysPriorities,
    injectVentureActions,
    injectBlockerActions,
    injectWorkstreamActions,
    premiumEmptyHtml,
    refreshQueueKPI,
    onModeChange,
  };

})(window);
