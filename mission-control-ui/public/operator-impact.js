/**
 * CR-MC-PALANTIR: Operator Impact Tracker
 * Phase 4: Engagement Loop 3 — shows operator's influence on the system
 * Data source: /api/impact?horizon=today|week|month|all
 * Refreshes every 10s
 */

(function() {
  'use strict';

  const REFRESH_MS = 10000;
  let refreshId    = null;
  let horizon      = 'today';

  async function fetchImpact(h) {
    try {
      const res = await fetch(`/api/impact?horizon=${h}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[IMPACT] Fetch error:', err.message);
      return null;
    }
  }

  function buildActionList(actions) {
    if (!actions || actions.length === 0) {
      return '<div style="font-size:11px;color:#5a6478;padding:4px 0;">No operator actions recorded</div>';
    }
    return `<ul class="impact-action-list">
      ${actions.slice(0, 5).map(a => `
        <li class="impact-action-item">${escapeHTML(a.action || '')}</li>
      `).join('')}
    </ul>`;
  }

  function escapeHTML(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function render() {
    const container = document.getElementById('impact-content');
    if (!container) return;

    const data = await fetchImpact(horizon);
    if (!data) {
      container.innerHTML = '<div class="insights-empty">Impact data unavailable</div>';
      return;
    }

    const horizonLabel = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' }[horizon] || 'Today';
    const ws = data.week_stats || {};

    container.innerHTML = `
      <div class="palantir-panel-body">
        <div class="impact-horizon-tabs">
          ${['today','week','month','all'].map(h => `
            <button class="impact-tab${h === horizon ? ' active' : ''}" data-horizon="${h}">
              ${({ today:'Today', week:'Week', month:'Month', all:'All' })[h]}
            </button>
          `).join('')}
        </div>

        <div class="impact-section-title">Actions Taken (${horizonLabel})</div>
        ${buildActionList(data.actions_list)}

        <div class="impact-multiplier">
          <div class="impact-multiplier-value">${data.influence_multiplier ?? 0}x</div>
          <div class="impact-multiplier-label">
            Influence Multiplier<br>
            <span style="font-size:9px;color:#5a6478;">(Each action triggered ${data.influence_multiplier ?? 0} downstream)</span>
          </div>
        </div>

        <div class="impact-section-title">System Response</div>
        <div class="impact-system-response">
          <div class="impact-response-item">${data.downstream_events ?? 0} total activity events</div>
          <div class="impact-response-item">System health: ${data.system_health ?? 0}%</div>
          <div class="impact-response-item">${data.actions_taken ?? 0} operator commands executed</div>
        </div>

        <div class="impact-week-stats">
          <div class="impact-week-stat">Launched: <span>${ws.ventures_launched ?? 0}</span></div>
          <div class="impact-week-stat">Blockers Resolved: <span>${ws.blockers_resolved ?? 0}</span></div>
          <div class="impact-week-stat">Automations: <span>${ws.automations_created ?? 0}</span></div>
          <div class="impact-week-stat">Stages Advanced: <span>${ws.stages_advanced ?? 0}</span></div>
        </div>
      </div>
    `;

    // Attach tab handlers
    container.querySelectorAll('.impact-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        horizon = tab.getAttribute('data-horizon');
        render();
      });
    });
  }

  function init() {
    console.log('[IMPACT] Initializing operator impact tracker...');
    render();
    refreshId = setInterval(render, REFRESH_MS);
  }

  function destroy() {
    if (refreshId) clearInterval(refreshId);
  }

  window.OperatorImpact = { init, destroy, refresh: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
