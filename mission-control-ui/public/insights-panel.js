/**
 * CR-MC-PALANTIR: System Insights Panel
 * Phase 3: Intelligence Layer — auto-detecting issues, blockers, opportunities
 * Data source: /api/insights (computed from SSOT files)
 * Refreshes every 10s
 */

(function() {
  'use strict';

  const REFRESH_MS = 10000;
  let refreshId    = null;

  const ICON_MAP = {
    critical: '🔴',
    warning:  '⚠️',
    positive: '💚',
    info:     'ℹ️'
  };

  const LABEL_MAP = {
    critical: 'CRITICAL',
    warning:  'WARNING',
    positive: 'POSITIVE',
    info:     'INFO'
  };

  const ACTION_LABELS = {
    resolve_blocker:  'Resolve',
    ping_agent:       'Ping Agent',
    view_workstreams: 'View',
    celebrate:        '🎉 Celebrate',
    view_activity:    'View Activity',
    create_task:      'Create Task',
    view:             'View',
    dismiss:          'Dismiss'
  };

  async function fetchInsights() {
    try {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[INSIGHTS] Fetch error:', err.message);
      return { insights: [] };
    }
  }

  function handleAction(insight, action) {
    if (action === 'dismiss') {
      dismissInsight(insight.id);
      return;
    }
    if (action === 'celebrate') {
      fetch(`/api/commands/celebrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_id: insight.id })
      }).catch(() => {});
      const el = document.querySelector(`[data-insight-id="${insight.id}"]`);
      if (el) el.style.opacity = '0.5';
      return;
    }
    if (action === 'resolve_blocker' && insight.blocker_id) {
      // Open blocker detail in blocked-work panel
      const event = new CustomEvent('mc:open-blocker', { detail: { blocker_id: insight.blocker_id } });
      document.dispatchEvent(event);
      return;
    }
    if (action === 'view_activity' || action === 'view') {
      // Open venture drilldown if possible
      if (insight.venture_id && window.MissionControlDrilldown) {
        window.MissionControlDrilldown.openVenture && window.MissionControlDrilldown.openVenture(insight.venture_id);
      }
      return;
    }
    if (action === 'ping_agent' && insight.workstream_id) {
      const event = new CustomEvent('mc:ping-agent', { detail: { workstream_id: insight.workstream_id } });
      document.dispatchEvent(event);
      return;
    }
    if (action === 'create_task') {
      const event = new CustomEvent('mc:spawn-workstream', { detail: { from_insight: insight.id } });
      document.dispatchEvent(event);
      return;
    }
  }

  async function dismissInsight(insightId) {
    try {
      await fetch(`/api/insights/${encodeURIComponent(insightId)}`, { method: 'DELETE' });
      await render(); // Re-render after dismiss
    } catch (err) {
      console.error('[INSIGHTS] Dismiss error:', err.message);
    }
  }

  function buildActionButtons(insight) {
    const actions = insight.action ? [insight.action, 'dismiss'] : ['dismiss'];
    return actions.map(a => {
      const label = ACTION_LABELS[a] || a;
      return `<button class="insight-action-btn${a === 'dismiss' ? ' dismiss' : ''}" 
                data-action="${a}" 
                data-insight="${insight.id}">
                ${label}
              </button>`;
    }).join('');
  }

  function buildInsightHTML(insight) {
    const icon  = ICON_MAP[insight.severity]  || 'ℹ️';
    const label = LABEL_MAP[insight.severity] || insight.severity?.toUpperCase();
    return `
      <div class="insight-item severity-${insight.severity}" data-insight-id="${insight.id}">
        <div class="insight-icon-label">
          <span class="insight-icon">${icon}</span>
          <span class="insight-label">${label}</span>
        </div>
        <div class="insight-message">${insight.message}</div>
        <div class="insight-actions">${buildActionButtons(insight)}</div>
      </div>
    `;
  }

  async function render() {
    const container = document.getElementById('insights-list');
    if (!container) return;

    const data     = await fetchInsights();
    const insights = data.insights || [];

    // Update badge
    const badge = document.getElementById('insights-badge');
    const newCount = insights.filter(i => i.severity === 'critical' || i.severity === 'warning').length;
    if (badge) {
      badge.textContent = newCount;
      badge.classList.toggle('visible', newCount > 0);
    }

    // Update header count
    const headerCount = document.getElementById('insights-header-count');
    if (headerCount) {
      headerCount.textContent = insights.length > 0 ? `(${insights.length} New)` : '';
    }

    if (insights.length === 0) {
      container.innerHTML = '<div class="insights-empty">✓ No active insights</div>';
      return;
    }

    container.innerHTML = insights.map(buildInsightHTML).join('');

    // Attach action handlers
    container.querySelectorAll('.insight-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const insightId = btn.getAttribute('data-insight');
        const action    = btn.getAttribute('data-action');
        const insight   = insights.find(i => i.id === insightId);
        if (insight) handleAction(insight, action);
      });
    });

    // Footer timestamp
    const footer = document.getElementById('insights-footer-time');
    if (footer) {
      footer.textContent = `Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
  }

  function init() {
    console.log('[INSIGHTS] Initializing system insights panel...');
    render();
    refreshId = setInterval(render, REFRESH_MS);
  }

  function destroy() {
    if (refreshId) clearInterval(refreshId);
  }

  window.InsightsPanel = { init, destroy, refresh: render };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
