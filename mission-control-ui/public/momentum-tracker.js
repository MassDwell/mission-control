/**
 * CR-MC-PALANTIR: Momentum Tracker Panel
 * Phase 4: Engagement Loop 1 — tracks venture & workstream velocity
 * Data source: /api/momentum
 * Refreshes every 10s
 */

(function() {
  'use strict';

  const REFRESH_MS = 10000;
  let refreshId = null;

  async function fetchMomentum() {
    try {
      const res = await fetch('/api/momentum');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[MOMENTUM] Fetch error:', err.message);
      return null;
    }
  }

  async function render() {
    const container = document.getElementById('momentum-content');
    if (!container) return;

    const data = await fetchMomentum();
    if (!data) {
      container.innerHTML = '<div class="insights-empty">Momentum data unavailable</div>';
      return;
    }

    const progressPct = Math.min(data.overall_progress || 0, 100);

    container.innerHTML = `
      <div class="palantir-panel-body">
        <div class="momentum-stats">
          <div class="momentum-stat">
            <div class="momentum-stat-label">Ventures Launched</div>
            <div class="momentum-stat-value ${data.ventures_launched_week > 0 ? 'green' : 'default'}">
              ${data.ventures_launched_week ?? 0}
            </div>
          </div>
          <div class="momentum-stat">
            <div class="momentum-stat-label">Tasks Today</div>
            <div class="momentum-stat-value">${data.tasks_completed_day ?? 0}</div>
          </div>
          <div class="momentum-stat">
            <div class="momentum-stat-label">WS Closed</div>
            <div class="momentum-stat-value">${data.workstreams_closed ?? 0}</div>
          </div>
          <div class="momentum-stat">
            <div class="momentum-stat-label">Stages Advanced</div>
            <div class="momentum-stat-value ${data.ventures_advanced > 0 ? 'green' : 'default'}">
              ${data.ventures_advanced ?? 0}
            </div>
          </div>
        </div>

        <div class="momentum-progress-section">
          <div class="momentum-progress-label">
            <span>Progress This Week</span>
            <span style="color: #3b82f6; font-weight: 600;">${progressPct}%</span>
          </div>
          <div class="momentum-bar-track">
            <div class="momentum-bar-fill" style="width: ${progressPct}%"></div>
          </div>
          <div class="momentum-trend">
            Trend: ${data.trend_emoji || '📊'} <strong>${capitalize(data.trend || 'steady')}</strong>
          </div>
        </div>

        ${data.biggest_momentum || data.next_target ? `
        <div class="momentum-highlights">
          ${data.biggest_momentum ? `
            <div class="momentum-highlight-item">
              <span class="momentum-highlight-label">🏆 Best Momentum:</span>
              <span class="momentum-highlight-value">${data.biggest_momentum}</span>
            </div>` : ''}
          ${data.next_target ? `
            <div class="momentum-highlight-item">
              <span class="momentum-highlight-label">🎯 Next Target:</span>
              <span class="momentum-highlight-value">${data.next_target}</span>
            </div>` : ''}
        </div>` : ''}
      </div>
    `;
  }

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  function init() {
    console.log('[MOMENTUM] Initializing momentum tracker...');
    render();
    refreshId = setInterval(render, REFRESH_MS);
  }

  function destroy() {
    if (refreshId) clearInterval(refreshId);
  }

  window.MomentumTracker = { init, destroy, refresh: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
