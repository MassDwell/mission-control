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

  function openOpportunityDrilldown(opp) {
    // Remove existing drilldown
    const existing = document.querySelector('.opp-drilldown-drawer');
    if (existing) existing.remove();

    // Create drilldown drawer
    const drawer = document.createElement('div');
    drawer.className = 'opp-drilldown-drawer';
    
    const drawerHTML = `
      <div class="opp-drilldown-content">
        <div class="opp-drilldown-header">
          <h3 style="margin: 0; font-size: 16px; font-weight: 700;">${escapeHTML(opp.title || opp.message || '')}</h3>
          <button class="opp-drilldown-close" style="background:none;border:none;color:#7a8494;cursor:pointer;font-size:20px;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">×</button>
        </div>
        
        <div class="opp-drilldown-body">
          <div class="opp-drilldown-section">
            <label class="opp-drilldown-label">Opportunity Type</label>
            <div class="opp-drilldown-value">${escapeHTML(OPP_TYPE_LABELS[opp.type] || opp.type || 'Unknown')}</div>
          </div>

          <div class="opp-drilldown-section">
            <label class="opp-drilldown-label">Problem Summary</label>
            <div class="opp-drilldown-value">${escapeHTML(opp.problem || opp.description || 'No problem summary provided')}</div>
          </div>

          <div class="opp-drilldown-section">
            <label class="opp-drilldown-label">Market Evidence / Impact</label>
            <div class="opp-drilldown-value">${escapeHTML(opp.market_evidence || opp.impact || 'No market evidence available')}</div>
          </div>

          <div class="opp-drilldown-section">
            <label class="opp-drilldown-label">Opportunity Score</label>
            <div class="opp-drilldown-value" style="font-size:18px;font-weight:700;color:var(--accent-green,#10b981);">
              ${(opp.score || opp.confidence || 'N/A')}
            </div>
          </div>

          <div class="opp-drilldown-section">
            <label class="opp-drilldown-label">Discovery Notes</label>
            <div class="opp-drilldown-value">${escapeHTML(opp.notes || opp.details || 'No additional notes')}</div>
          </div>

          <div class="opp-drilldown-section">
            <label class="opp-drilldown-label">Next Action</label>
            <div class="opp-drilldown-value">${escapeHTML(opp.next_action || opp.recommendation || 'No next action recommended')}</div>
          </div>

          <div class="opp-drilldown-section" style="margin-top: 12px;">
            <label class="opp-drilldown-label">Source</label>
            <div class="opp-drilldown-value" style="font-size:12px;color:var(--text-muted,#7a8494);">
              ${escapeHTML(opp.source || 'system')} · ${opp.timestamp ? getRelTime(opp.timestamp) : 'recently'}
            </div>
          </div>
        </div>

        <div class="opp-drilldown-actions">
          <button class="opp-drilldown-action-btn opp-action-create-venture" data-opp="${opp.id}">+ Create Venture</button>
          <button class="opp-drilldown-action-btn opp-action-create-task" data-opp="${opp.id}">+ Create Task</button>
          <button class="opp-drilldown-action-btn opp-action-dismiss" data-opp="${opp.id}">Dismiss</button>
        </div>
      </div>
    `;

    drawer.innerHTML = drawerHTML;
    document.body.appendChild(drawer);

    // Add CSS if not already added
    if (!document.getElementById('opp-drilldown-styles')) {
      const style = document.createElement('style');
      style.id = 'opp-drilldown-styles';
      style.textContent = `
        .opp-drilldown-drawer {
          position: fixed;
          right: 0;
          top: 0;
          width: 400px;
          height: 100vh;
          background: var(--bg-panel, #1a1f2e);
          border-left: 1px solid var(--border-color, #3a4557);
          box-shadow: -2px 0 12px rgba(0,0,0,0.3);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease;
          overflow: hidden;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .opp-drilldown-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .opp-drilldown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-color, #3a4557);
          background: var(--bg-section, #252d3d);
          flex-shrink: 0;
        }

        .opp-drilldown-close:hover {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }

        .opp-drilldown-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .opp-drilldown-section {
          margin-bottom: 16px;
        }

        .opp-drilldown-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted, #7a8494);
          margin-bottom: 6px;
        }

        .opp-drilldown-value {
          font-size: 13px;
          color: var(--text-secondary, #b0b8c8);
          line-height: 1.5;
          word-break: break-word;
        }

        .opp-drilldown-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid var(--border-color, #3a4557);
          background: var(--bg-section, #252d3d);
          flex-shrink: 0;
        }

        .opp-drilldown-action-btn {
          padding: 10px 14px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid var(--accent-blue, #3b82f6);
          border-radius: 4px;
          color: var(--accent-blue, #3b82f6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .opp-drilldown-action-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: var(--accent-blue, #3b82f6);
        }

        .opp-drilldown-action-btn.opp-action-dismiss {
          background: rgba(122, 132, 148, 0.1);
          border-color: var(--border-color, #3a4557);
          color: var(--text-muted, #7a8494);
        }

        .opp-drilldown-action-btn.opp-action-dismiss:hover {
          background: rgba(122, 132, 148, 0.2);
        }

        @media (max-width: 768px) {
          .opp-drilldown-drawer {
            width: 100%;
            right: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Attach handlers
    const closeBtn = drawer.querySelector('.opp-drilldown-close');
    closeBtn.addEventListener('click', function() {
      drawer.remove();
    });

    // Close on backdrop click (outside drawer)
    drawer.addEventListener('click', function(e) {
      if (e.target === drawer) {
        drawer.remove();
      }
    });

    // Action buttons
    drawer.querySelectorAll('.opp-drilldown-action-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const oppId = this.getAttribute('data-opp');
        const opp = opps.find(o => o.id === oppId);
        if (!opp) return;

        if (this.classList.contains('opp-action-create-venture')) {
          handleAction(opp, 'create_venture');
        } else if (this.classList.contains('opp-action-create-task')) {
          handleAction(opp, 'create_task');
        } else if (this.classList.contains('opp-action-dismiss')) {
          handleAction(opp, 'dismiss');
        }
        drawer.remove();
      });
    });

    // Close on ESC key
    const closeOnEsc = (e) => {
      if (e.key === 'Escape') {
        drawer.remove();
        document.removeEventListener('keydown', closeOnEsc);
      }
    };
    document.addEventListener('keydown', closeOnEsc);
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
      <div class="opp-item ${typeCSS}" data-opp-id="${opp.id}" style="cursor: pointer; transition: all 0.2s ease;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#5a6478;margin-bottom:4px;">
          ${typeLabel}
        </div>
        <div class="opp-item-title" style="font-weight: 600; margin-bottom: 4px;">${escapeHTML(opp.title || opp.message || '')}</div>
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
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent tile click from firing
        const oppId  = btn.getAttribute('data-opp');
        const action = btn.getAttribute('data-action');
        const opp    = opps.find(o => o.id === oppId);
        if (opp) handleAction(opp, action);
      });
    });

    // Attach tile click handlers for drilldown
    container.querySelectorAll('.opp-item').forEach(tile => {
      tile.addEventListener('click', function(e) {
        const oppId = this.getAttribute('data-opp-id');
        const opp   = opps.find(o => o.id === oppId);
        if (opp) openOpportunityDrilldown(opp);
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
