/**
 * CR-OPERATOR-COMMAND-UPGRADE: Operator Guidance + Founder Decisions panels
 *
 * Fetches from /api/operator-guidance and /api/founder-decisions.
 * Renders live panels with priority badges, tooltips, and refresh cadence.
 * Secondary panels (Opportunity Discovery, Momentum, Operator Impact,
 * Agent Activity, Workstream Flow) are collapsed by default.
 */

(function(window) {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────

  const GUIDANCE_ENDPOINT   = '/api/operator-guidance';
  const DECISIONS_ENDPOINT  = '/api/founder-decisions';
  const REFRESH_MS          = 10000; // 10 seconds

  // Secondary panels collapsed by default
  const SECONDARY_PANEL_IDS = [
    'panel-insights',
    'panel-opportunity-discovery',
    'panel-momentum',
    'panel-operator-impact',
    'panel-agent-activity',
    'panel-workstream-flow',
    'panel-venture-pipeline'
  ];

  // Priority → color class
  const PRIORITY_CLASS = {
    HIGH:   'guidance-priority-high',
    MEDIUM: 'guidance-priority-medium',
    LOW:    'guidance-priority-low'
  };

  // ─── Simple 5s response cache ────────────────────────────────────────────────

  const _cache = new Map();
  const CACHE_TTL = 5000;

  async function cachedFetch(url) {
    const now = Date.now();
    const cached = _cache.get(url);
    if (cached && now - cached.time < CACHE_TTL) return cached.data;
    const data = await fetch(url).then(r => r.json());
    _cache.set(url, { data, time: now });
    return data;
  }

  // ─── Render helpers ──────────────────────────────────────────────────────────

  function priorityBadge(p) {
    const cls = PRIORITY_CLASS[p] || 'guidance-priority-low';
    return `<span class="guidance-priority-badge ${cls}">${p}</span>`;
  }

  function renderGuidance(container, data) {
    const items = data.guidance || [];
    const countEl = document.getElementById('guidance-header-count');
    if (countEl) countEl.textContent = items.length ? `(${items.length})` : '';

    if (items.length === 0) {
      container.innerHTML = `
        <div class="guidance-empty">
          <span style="font-size:22px;">✅</span>
          <p>No actions needed right now. System operating normally.</p>
          <p style="font-size:10px;color:var(--text-muted);">Next check in ${REFRESH_MS / 1000}s · Source: SSOT</p>
        </div>`;
      return;
    }

    let html = '<div class="guidance-list">';
    items.forEach(item => {
      html += `
        <div class="guidance-item">
          <div class="guidance-item-header">
            <span class="guidance-icon">${item.icon || '•'}</span>
            ${priorityBadge(item.priority)}
            <span class="guidance-action">${escapeHtml(item.action)}</span>
          </div>
          <div class="guidance-item-status">${escapeHtml(item.status)}</div>
          ${item.detail_url ? `<a class="guidance-detail-link" href="${item.detail_url}" target="_blank">Detail →</a>` : ''}
        </div>`;
    });
    html += `</div>
      <div class="guidance-footer">
        <span>Rules engine · SSOT</span>
        <span style="margin-left:auto;">${new Date(data.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>`;
    container.innerHTML = html;
  }

  function renderDecisions(container, data) {
    const decisions = data.decisions || {};
    const keys = Object.keys(decisions);
    const countEl = document.getElementById('decisions-header-count');
    if (countEl) countEl.textContent = keys.length ? `(${keys.length})` : '';

    if (keys.length === 0) {
      container.innerHTML = `
        <div class="guidance-empty">
          <span style="font-size:22px;">🧭</span>
          <p>No strategic decisions pending.</p>
          <p style="font-size:10px;color:var(--text-muted);">Computed from venture + agent SSOT</p>
        </div>`;
      return;
    }

    let html = '<div class="guidance-list">';
    keys.forEach(key => {
      const d = decisions[key];
      const confidencePct = d.confidence_pct || (d.confidence ? `${Math.round(d.confidence * 100)}%` : 'N/A');
      html += `
        <div class="guidance-item founder-decision-item">
          <div class="guidance-item-header">
            <span class="guidance-icon">${d.icon || '🧭'}</span>
            <span class="founder-confidence-badge">${confidencePct} confidence</span>
            <span class="guidance-action">${escapeHtml(d.recommendation)}</span>
          </div>
          ${d.reasoning && d.reasoning.length ? `
            <ul class="founder-reasoning">
              ${d.reasoning.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
            </ul>` : ''}
          ${d.action_url ? `<a class="guidance-detail-link" href="${d.action_url}" target="_blank">Take action →</a>` : ''}
        </div>`;
    });
    html += `</div>
      <div class="guidance-footer">
        <span>Strategic engine · SSOT</span>
        <span style="margin-left:auto;">${new Date(data.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>`;
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Fetch + render ───────────────────────────────────────────────────────────

  async function refreshGuidance() {
    const container = document.getElementById('operator-guidance-content');
    if (!container) return;
    try {
      const data = await cachedFetch(GUIDANCE_ENDPOINT);
      renderGuidance(container, data);
    } catch (e) {
      container.innerHTML = `<div class="guidance-error">⚠ Could not load guidance: ${escapeHtml(e.message)}</div>`;
    }
  }

  async function refreshDecisions() {
    const container = document.getElementById('founder-decisions-content');
    if (!container) return;
    try {
      const data = await cachedFetch(DECISIONS_ENDPOINT);
      renderDecisions(container, data);
    } catch (e) {
      container.innerHTML = `<div class="guidance-error">⚠ Could not load decisions: ${escapeHtml(e.message)}</div>`;
    }
  }

  // ─── Tooltip system ──────────────────────────────────────────────────────────

  function initTooltips() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.tooltip-btn');
      if (btn) {
        e.stopPropagation();
        const panelId = btn.dataset.panel;
        const tooltip = document.getElementById(`tooltip-${panelId}`);
        if (!tooltip) return;
        const isVisible = tooltip.style.display !== 'none';
        // Close all tooltips first
        document.querySelectorAll('.tooltip-popup').forEach(t => { t.style.display = 'none'; });
        if (!isVisible) {
          tooltip.style.display = 'block';
        }
        return;
      }
      // Click outside — close all
      document.querySelectorAll('.tooltip-popup').forEach(t => { t.style.display = 'none'; });
    });
  }

  // ─── Secondary panel default-collapse ────────────────────────────────────────

  function collapseSecondaryPanels() {
    const STORAGE_KEY = 'mission_control_layout';
    let savedState = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedState = JSON.parse(raw).panels || {};
    } catch (_) {}

    SECONDARY_PANEL_IDS.forEach(panelId => {
      const el = document.getElementById(panelId);
      if (!el) return;

      // If we have a saved state for this panel, honour it
      if (savedState[panelId] !== undefined) return;

      // Default: collapse secondary panels
      const body = el.querySelector('.mc-panel-body');
      if (body) body.style.display = 'none';
      el.classList.add('mc-collapsed');
    });
  }

  // ─── Agent count console log ─────────────────────────────────────────────────

  async function logAgentCount() {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) return;
      const data = await res.json();
      const count = data.count ?? (data.agents ? data.agents.length : '?');
      console.log(`✓ Active agents: ${count}`);
    } catch (_) {}
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    // Collapse secondary panels (respects saved state)
    collapseSecondaryPanels();

    // Init tooltips
    initTooltips();

    // Log agent count
    logAgentCount();

    // Initial load
    refreshGuidance();
    refreshDecisions();

    // Auto-refresh every 10s
    setInterval(refreshGuidance,  REFRESH_MS);
    setInterval(refreshDecisions, REFRESH_MS);

    // Re-log agent count on each refresh (lightweight)
    setInterval(logAgentCount, REFRESH_MS);

    console.log('[OPERATOR-COMMAND] Guidance + Decisions panels initialised');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual refresh
  window.OperatorGuidance = { refresh: refreshGuidance };
  window.FounderDecisions = { refresh: refreshDecisions };

})(window);
