/**
 * CR-MC-OPS-PANELS-UPGRADE: System Status Panel
 * Agent health monitor — Clawson, Codesmith, Moonshot, Personal Assistant
 *
 * Replaces the generic "Alerts & System Status" bottom bar.
 * Shows per-agent status cards in the right panel bottom area.
 */

'use strict';

(function SystemStatusPanel() {
  let _agents       = [];
  let _summary      = {};
  const REFRESH_MS  = 10000;

  const $ = id => document.getElementById(id);

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // System status goes into the alerts section at the bottom
    const container = $('alerts-content');
    if (!container) return;

    // Inject wrapper
    const parent = container.parentElement;
    if (parent) {
      // Rename the section header
      const header = parent.querySelector('.section-header');
      if (header) header.textContent = 'System Status — Agent Health';
    }

    container.innerHTML = `
      <div class="ss-panel" id="ss-panel">
        <div id="ss-agents-wrap">
          <div style="padding:8px;color:var(--text-muted);font-size:10px;">Loading agent status…</div>
        </div>
        <div class="ss-source" id="ss-source"></div>
      </div>
    `;

    fetchData();
    setInterval(fetchData, REFRESH_MS);
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      const res = await fetch('/api/system-status');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      _agents  = data.agents  || [];
      _summary = data.summary || {};
      renderStatus(data);
    } catch (err) {
      const wrap = $('ss-agents-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div class="ss-error">
            ⚠ Failed to load system status: ${escHtml(err.message)}
            <button class="ss-retry-btn" onclick="window.SystemStatus?.refresh()">Retry</button>
          </div>`;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderStatus(data) {
    const wrap = $('ss-agents-wrap');
    if (!wrap) return;

    if (_agents.length === 0) {
      wrap.innerHTML = `<div style="padding:8px;color:var(--text-muted);font-size:10px;">No agent data — checked: canon/registry.json</div>`;
      return;
    }

    // Summary bar
    let html = `
      <div class="ss-summary">
        <div class="ss-summary-item online">
          <span class="ss-status-dot online"></span>
          <span class="count">${_summary.online || 0}</span>
          <span>online</span>
        </div>
        <div class="ss-summary-item idle">
          <span class="ss-status-dot idle"></span>
          <span class="count">${_summary.idle || 0}</span>
          <span>idle</span>
        </div>
        <div class="ss-summary-item offline">
          <span class="ss-status-dot offline"></span>
          <span class="count">${_summary.offline || 0}</span>
          <span>offline</span>
        </div>
      </div>
    `;

    // Agent cards
    html += `<div class="ss-agents">`;

    _agents.forEach(agent => {
      const status = agent.status || 'offline';
      const statusEmoji = { online: '✅', idle: '⏳', offline: '🔴' }[status] || '❓';

      const heartbeatTxt = agent.last_heartbeat
        ? escHtml(agent.last_heartbeat_relative || fmtDate(agent.last_heartbeat))
        : escHtml(agent.heartbeat_note || 'Heartbeat not tracked');

      const taskTxt = agent.current_task
        ? escHtml(agent.current_task)
        : `<span style="color:var(--text-muted)">No active task</span>`;

      html += `
        <div class="ss-agent-card" data-agent="${escHtml(agent.id)}"
             role="row" tabindex="0"
             aria-label="${escHtml(agent.name)}: ${status}">
          <div class="ss-status-dot ${status}" title="${status}"></div>
          <div class="ss-agent-info">
            <div class="ss-agent-name">
              ${escHtml(agent.name)}
              <span class="ss-status-badge ${status}">${statusEmoji} ${status}</span>
            </div>
            ${agent.current_task
              ? `<div class="ss-agent-task" title="${escHtml(agent.current_task)}">${taskTxt}</div>`
              : ''}
            <div class="ss-agent-heartbeat">Last: ${heartbeatTxt}</div>
          </div>
          <div class="ss-agent-stats">
            <div class="ss-stat">
              <span>Workstreams:</span>
              <span class="val">${agent.workstreams_owned || 0}</span>
            </div>
            ${agent.recent_errors > 0 ? `
            <div class="ss-stat">
              <span>Errors (24h):</span>
              <span class="val error">${agent.recent_errors}</span>
            </div>` : ''}
          </div>
        </div>
      `;
    });

    html += `</div>`;

    wrap.innerHTML = html;

    // Source
    const sourceEl = $('ss-source');
    if (sourceEl && data.sources) {
      const ts = data.timestamp
        ? new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'unknown';
      sourceEl.textContent = `registry.json + agent_activity.json + workstreams.json · ${ts}`;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function fmtDate(isoTs) {
    if (!isoTs) return '—';
    try {
      return new Date(isoTs).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return isoTs; }
  }

  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function refresh() { fetchData(); }
  window.SystemStatus = { refresh, init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
