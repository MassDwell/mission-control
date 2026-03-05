/**
 * CR-MC-PALANTIR: Opportunity Discovery Feed
 * Phase 4: Engagement Loop 2 — surfaces new venture ideas, automations, market intel
 * Data source: /api/opportunities
 * Refreshes every 30s (less frequent — opportunity data changes slowly)
 */

(function() {
  'use strict';

  const REFRESH_MS = 30000;
  let refreshId = null;

  const OPP_TYPE_LABELS = {
    venture_idea:            'NEW VENTURE IDEA',
    automation_opportunity:  'AUTOMATION OPPORTUNITY',
    market_intel:            'MARKET INTELLIGENCE'
  };

  const OPP_TYPE_CSS = {
    venture_idea:           '',
    automation_opportunity: 'automation',
    market_intel:           'market'
  };

  async function fetchOpportunities() {
    try {
      const res = await fetch('/api/opportunities');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[OPPORTUNITIES] Fetch error:', err.message);
      return { opportunities: [] };
    }
  }

  function handleAction(opp, action) {
    if (action === 'dismiss') {
      const el = document.querySelector(`[data-opp-id="${opp.id}"]`);
      if (el) el.remove();
      return;
    }
    if (action === 'create_venture') {
      const event = new CustomEvent('mc:create-venture', { detail: { from_opp: opp.id } });
      document.dispatchEvent(event);
      return;
    }
    if (action === 'create_task') {
      const event = new CustomEvent('mc:spawn-workstream', { detail: { from_opp: opp.id, title: opp.title } });
      document.dispatchEvent(event);
      return;
    }
    if (action === 'learn_more') {
      const el = document.querySelector(`[data-opp-id="${opp.id}"] .opp-details`);
      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
      return;
    }
    if (action === 'read' || action === 'save') {
      const event = new CustomEvent('mc:market-intel', { detail: { opp } });
      document.dispatchEvent(event);
    }
  }

  function buildOppActionBtns(opp) {
    const actions = opp.actions || ['dismiss'];
    return actions.map(a => {
      const labels = {
        create_venture: '+ Create Venture',
        learn_more:     'Learn More',
        create_task:    '+ Create Task',
        dismiss:        'Dismiss',
        read:           'Read',
        save:           'Save'
      };
      return `<button class="opp-action-btn" data-action="${a}" data-opp="${opp.id}">${labels[a] || a}</button>`;
    }).join('');
  }

  function buildOppItem(opp) {
    const typeLabel = OPP_TYPE_LABELS[opp.type] || opp.type?.toUpperCase();
    const typeCSS   = OPP_TYPE_CSS[opp.type]   || '';
    const relTime   = opp.timestamp ? getRelTime(opp.timestamp) : '';

    return `
      <div class="opp-item ${typeCSS}" data-opp-id="${opp.id}">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#5a6478;margin-bottom:4px;">
          ${typeLabel}
        </div>
        <div class="opp-item-title">${escapeHTML(opp.title || opp.message || '')}</div>
        ${relTime ? `<div class="opp-item-source">Source: ${escapeHTML(opp.source || 'system')} · ${relTime}</div>` : ''}
        <div class="opp-item-actions">${buildOppActionBtns(opp)}</div>
      </div>
    `;
  }

  function getRelTime(ts) {
    try {
      const ms = Date.now() - new Date(ts).getTime();
      const m  = Math.floor(ms / 60000);
      const h  = Math.floor(m / 60);
      const d  = Math.floor(h / 24);
      if (d > 0) return `${d}d ago`;
      if (h > 0) return `${h}h ago`;
      if (m > 0) return `${m}m ago`;
      return 'just now';
    } catch { return ''; }
  }

  function escapeHTML(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function render() {
    const container = document.getElementById('opportunities-content');
    if (!container) return;

    const data = await fetchOpportunities();
    const opps = data.opportunities || [];

    if (opps.length === 0) {
      container.innerHTML = `
        <div class="palantir-panel-body">
          <div class="opp-empty">No opportunities detected yet</div>
        </div>
      `;
      return;
    }

    // Group by type
    const groups = {};
    opps.forEach(o => {
      if (!groups[o.type]) groups[o.type] = [];
      groups[o.type].push(o);
    });

    let html = '<div class="palantir-panel-body">';
    Object.entries(groups).forEach(([type, items]) => {
      const label = OPP_TYPE_LABELS[type] || type.toUpperCase();
      html += `<div class="opp-section-title">${label} (${items.length})</div>`;
      html += items.slice(0, 3).map(buildOppItem).join('');
    });
    html += '</div>';
    container.innerHTML = html;

    // Attach action handlers
    container.querySelectorAll('.opp-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const oppId  = btn.getAttribute('data-opp');
        const action = btn.getAttribute('data-action');
        const opp    = opps.find(o => o.id === oppId);
        if (opp) handleAction(opp, action);
      });
    });
  }

  function init() {
    console.log('[OPPORTUNITIES] Initializing opportunity discovery feed...');
    render();
    refreshId = setInterval(render, REFRESH_MS);
  }

  function destroy() {
    if (refreshId) clearInterval(refreshId);
  }

  window.OpportunityDiscovery = { init, destroy, refresh: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
