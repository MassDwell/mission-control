/**
 * CR-MC-OPS-PANELS-UPGRADE: Active Work Panel
 * Real workstreams table with health status + drawer
 *
 * Keyboard: ↑↓ → navigate rows, Enter → open drawer, Esc → close
 */

'use strict';

(function ActiveWorkPanel() {
  // ── State ────────────────────────────────────────────────────────────────
  let _workstreams  = [];
  let _focusedIdx   = -1;
  let _drawerOpen   = false;
  const REFRESH_MS  = 10000;

  const $ = id => document.getElementById(id);

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    const container = $('active-work-content');
    if (!container) return;

    container.innerHTML = `
      <div class="aw-panel" id="aw-panel">
        <div class="aw-table-wrap" id="aw-table-wrap">
          <div style="padding:12px;color:var(--text-muted);font-size:11px;">Loading workstreams…</div>
        </div>
        <div class="aw-source" id="aw-source"></div>
      </div>
    `;

    bindKeyboard();
    fetchData();
    setInterval(fetchData, REFRESH_MS);
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────
  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (_drawerOpen) {
        if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); }
        return;
      }
      // Only handle when table is focused
      const tableWrap = $('aw-table-wrap');
      if (!tableWrap?.contains(document.activeElement) &&
          document.activeElement?.closest('#aw-table-wrap') === null) {
        // Allow ↑↓ on focused rows
        const focused = tableWrap?.querySelector('tr.focused');
        if (!focused) return;
      }
    });
  }

  function onTableKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-1); }
    else if (e.key === 'Enter' && _focusedIdx >= 0) {
      e.preventDefault();
      openDrawer(_workstreams[_focusedIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDrawer();
    }
  }

  function moveFocus(delta) {
    if (_workstreams.length === 0) return;
    _focusedIdx = (_focusedIdx + delta + _workstreams.length) % _workstreams.length;
    updateFocusedRow();
  }

  function updateFocusedRow() {
    const tableWrap = $('aw-table-wrap');
    if (!tableWrap) return;
    tableWrap.querySelectorAll('tr[data-idx]').forEach(tr => {
      const idx = parseInt(tr.dataset.idx, 10);
      tr.classList.toggle('focused', idx === _focusedIdx);
    });
    const focused = tableWrap.querySelector('tr.focused');
    if (focused) focused.scrollIntoView({ block: 'nearest' });
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      const res = await fetch('/api/workstreams');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      _workstreams = data.workstreams || [];
      renderTable(data);
    } catch (err) {
      const wrap = $('aw-table-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div class="aw-error">
            ⚠ Failed to load workstreams: ${escHtml(err.message)}
            <button class="aw-retry-btn" onclick="window.ActiveWork?.refresh()">Retry</button>
          </div>`;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderTable(data) {
    const wrap = $('aw-table-wrap');
    if (!wrap) return;

    if (_workstreams.length === 0) {
      wrap.innerHTML = `
        <div class="aw-empty">
          No active workstreams
          <span class="aw-empty-file">Checked: workstreams.json</span>
        </div>`;

      const sourceEl = $('aw-source');
      if (sourceEl && data.sources?.workstreams) {
        const ts = data.sources.workstreams.lastUpdated
          ? new Date(data.sources.workstreams.lastUpdated).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          : 'unknown';
        sourceEl.textContent = `workstreams.json · last updated ${ts}`;
      }
      return;
    }

    const rows = _workstreams.map((ws, idx) => {
      const health      = ws.health || 'healthy';
      const progress    = typeof ws.progress === 'number' ? ws.progress : null;
      const lastEventTxt = ws.last_event
        ? `${escHtml(ws.last_event.action || '')} (${escHtml(ws.last_event.relative_time || '')})`
        : '<span style="color:var(--text-muted)">—</span>';

      const progressHtml = progress !== null ? `
        <div class="aw-progress-wrap">
          <div class="aw-progress-bar">
            <div class="aw-progress-fill ${health}" style="width:${Math.min(100, progress)}%"></div>
          </div>
          <span class="aw-progress-pct">${progress}%</span>
        </div>` : '<span style="color:var(--text-muted)">—</span>';

      const healthIcon = { healthy: '✅', warning: '⚠️', critical: '🚨' }[health] || '—';

      return `
        <tr data-idx="${idx}" data-id="${escHtml(ws.id)}" tabindex="0">
          <td class="aw-col-id" title="${escHtml(ws.id)}">${escHtml(ws.id)}</td>
          <td class="aw-col-venture">${escHtml(ws.venture_name || ws.venture_id || '—')}</td>
          <td class="aw-col-phase">${escHtml(ws.phase || '—')}</td>
          <td class="aw-col-owner">${escHtml(ws.owner || '—')}</td>
          <td class="aw-col-progress">${progressHtml}</td>
          <td class="aw-col-last-event" title="${ws.last_event?.action || ''}">${lastEventTxt}</td>
          <td class="aw-col-eta">${escHtml(ws.eta || '—')}</td>
          <td class="aw-col-health">
            <span class="aw-health-badge ${health}">${healthIcon} ${health}</span>
          </td>
        </tr>
      `;
    }).join('');

    wrap.innerHTML = `
      <table class="aw-table" id="aw-table" tabindex="0">
        <thead>
          <tr>
            <th>Workstream</th>
            <th>Venture</th>
            <th>Phase</th>
            <th>Owner</th>
            <th>Progress</th>
            <th>Last Event</th>
            <th>ETA</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody id="aw-tbody">${rows}</tbody>
      </table>
    `;

    // Bind events
    const table = $('aw-table');
    if (table) {
      table.addEventListener('keydown', onTableKeydown);

      table.querySelectorAll('tr[data-idx]').forEach(tr => {
        tr.addEventListener('click', () => {
          const idx = parseInt(tr.dataset.idx, 10);
          _focusedIdx = idx;
          updateFocusedRow();
          openDrawer(_workstreams[idx]);
        });
        tr.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            const idx = parseInt(tr.dataset.idx, 10);
            openDrawer(_workstreams[idx]);
          }
        });
        tr.addEventListener('focus', () => {
          _focusedIdx = parseInt(tr.dataset.idx, 10);
          updateFocusedRow();
        });
      });
    }

    // Source
    const sourceEl = $('aw-source');
    if (sourceEl && data.sources) {
      const mainTs = data.sources.workstreams?.lastUpdated;
      const tsStr = mainTs
        ? new Date(mainTs).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        : 'unknown';
      sourceEl.textContent = `workstreams.json + venture_work_links.json · last updated ${tsStr} · ${_workstreams.length} workstreams`;
    }
  }

  // ── Workstream Drawer ─────────────────────────────────────────────────────
  function ensureDrawer() {
    if ($('ws-drawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ws-drawer-overlay';
    overlay.className = 'ws-drawer-overlay';
    overlay.addEventListener('click', closeDrawer);

    const drawer = document.createElement('div');
    drawer.id = 'ws-drawer';
    drawer.className = 'ws-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Workstream detail');
    drawer.innerHTML = '<div class="ws-loading">Loading…</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  async function openDrawer(ws) {
    ensureDrawer();
    _drawerOpen = true;

    const overlay = $('ws-drawer-overlay');
    const drawer  = $('ws-drawer');
    overlay.classList.add('open');
    drawer.classList.add('open');

    drawer.innerHTML = renderDrawerHeader(ws) + '<div class="ws-loading">Loading detail…</div>';
    drawer.querySelector('.ws-drawer-close')?.addEventListener('click', closeDrawer);

    // Fetch full detail
    try {
      const res = await fetch(`/api/workstreams/${encodeURIComponent(ws.id)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const detail = await res.json();
      drawer.innerHTML = renderDrawerContent(detail);
      drawer.querySelector('.ws-drawer-close')?.addEventListener('click', closeDrawer);
    } catch (err) {
      // Fall back to basic info from list
      drawer.innerHTML = renderDrawerHeader(ws) + `
        <div class="ws-drawer-section">
          <div style="color:var(--accent-red);font-size:11px;">Failed to load detail: ${escHtml(err.message)}</div>
        </div>`;
      drawer.querySelector('.ws-drawer-close')?.addEventListener('click', closeDrawer);
    }
  }

  function renderDrawerHeader(ws) {
    const health = ws.health || 'healthy';
    const healthIcon = { healthy: '✅', warning: '⚠️', critical: '🚨' }[health] || '';
    return `
      <div class="ws-drawer-header">
        <div style="flex:1">
          <div class="ws-drawer-id">${escHtml(ws.id)}</div>
          <div class="ws-drawer-venture">${escHtml(ws.venture_name || ws.venture_id || '—')}</div>
        </div>
        <span class="aw-health-badge ${health}">${healthIcon} ${health}</span>
        <button class="ws-drawer-close" aria-label="Close drawer">×</button>
      </div>
    `;
  }

  function renderDrawerContent(detail) {
    const health = detail.health || 'healthy';
    const healthIcon = { healthy: '✅', warning: '⚠️', critical: '🚨' }[health] || '';

    let html = `
      <div class="ws-drawer-header">
        <div style="flex:1">
          <div class="ws-drawer-id">${escHtml(detail.id)}</div>
          <div class="ws-drawer-venture">${escHtml(detail.venture?.name || detail.venture_id || '—')}</div>
        </div>
        <span class="aw-health-badge ${health}">${healthIcon} ${health}</span>
        <button class="ws-drawer-close" aria-label="Close drawer">×</button>
      </div>
      <div class="ws-drawer-body">
    `;

    // Metadata
    html += `
      <div class="ws-drawer-section">
        <div class="ws-drawer-section-title">Metadata</div>
        <div class="ws-meta-grid">
          ${metaItem('Phase',   detail.phase)}
          ${metaItem('Owner',   detail.owner)}
          ${metaItem('Progress', detail.progress !== undefined ? `${detail.progress}%` : null)}
          ${metaItem('ETA',     detail.eta)}
          ${metaItem('Created', detail.created_at ? fmtDate(detail.created_at) : null)}
          ${metaItem('Updated', detail.updated_at ? fmtDate(detail.updated_at) : null)}
        </div>
      </div>
    `;

    // Phase progression
    if (Array.isArray(detail.phases) && detail.phases.length > 0) {
      html += `
        <div class="ws-drawer-section">
          <div class="ws-drawer-section-title">Phase Progression</div>
          ${detail.phases.map(p => `
            <div class="ws-event-row">
              <span class="ws-event-time">${escHtml(p.name || p)}</span>
              ${p.status ? `<span class="ws-event-agent">${escHtml(p.status)}</span>` : ''}
              ${p.completed_at ? `<span class="ws-event-action">${fmtDate(p.completed_at)}</span>` : ''}
            </div>`).join('')}
        </div>
      `;
    }

    // Events
    html += `
      <div class="ws-drawer-section">
        <div class="ws-drawer-section-title">Workstream Events</div>
    `;
    if (Array.isArray(detail.events) && detail.events.length > 0) {
      html += detail.events.map(e => `
        <div class="ws-event-row">
          <span class="ws-event-time">${escHtml(e.relative_time || fmtTime(e.timestamp))}</span>
          <span class="ws-event-agent">${escHtml(e.agent || '—')}</span>
          <span class="ws-event-action">${escHtml(e.action || '')}</span>
        </div>`).join('');
    } else {
      html += `<div class="ws-no-events">No events recorded for this workstream</div>`;
    }
    html += `</div>`;

    // Blockers
    if (Array.isArray(detail.blockers) && detail.blockers.length > 0) {
      html += `
        <div class="ws-drawer-section">
          <div class="ws-drawer-section-title">Blockers (${detail.blockers.length})</div>
          ${detail.blockers.map(b => `
            <div class="ws-blocker-row">
              <span class="bw-severity-badge sev-${escHtml(b.severity)}">${escHtml(b.severity)}</span>
              <span style="font-size:11px;color:var(--text-secondary)">${escHtml(b.blocker_type || b.id || '—')}</span>
              ${b.sla?.overdue ? `<span style="font-size:10px;color:var(--accent-red);margin-left:auto">Overdue ${escHtml(b.sla.remaining_str)}</span>` : ''}
            </div>`).join('')}
        </div>
      `;
    }

    // Dependencies
    if (Array.isArray(detail.dependencies) && detail.dependencies.length > 0) {
      html += `
        <div class="ws-drawer-section">
          <div class="ws-drawer-section-title">Dependencies</div>
          ${detail.dependencies.map(d => `<div style="font-size:11px;padding:3px 0;color:var(--text-secondary)">${escHtml(d)}</div>`).join('')}
        </div>
      `;
    }

    // Sources
    if (detail.sources) {
      const srcLines = Object.values(detail.sources)
        .filter(s => s?.file)
        .map(s => `${s.file}${s.lastUpdated ? ` (${fmtDate(s.lastUpdated)})` : ''}`)
        .join(' · ');
      html += `
        <div class="ws-drawer-section" style="border-bottom:none">
          <div class="ws-drawer-section-title">Sources</div>
          <div style="font-size:10px;color:var(--text-muted)">${escHtml(srcLines)}</div>
        </div>
      `;
    }

    html += `</div>`; // ws-drawer-body

    return html;
  }

  function closeDrawer() {
    _drawerOpen = false;
    const overlay = $('ws-drawer-overlay');
    const drawer  = $('ws-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer)  drawer.classList.remove('open');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function metaItem(label, value) {
    if (value == null || value === '') return '';
    return `
      <div class="ws-meta-item">
        <span class="ws-meta-label">${escHtml(label)}</span>
        <span class="ws-meta-value">${escHtml(String(value))}</span>
      </div>`;
  }

  function fmtDate(isoTs) {
    if (!isoTs) return '—';
    try {
      return new Date(isoTs).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return isoTs; }
  }

  function fmtTime(isoTs) {
    if (!isoTs) return '—';
    try {
      return new Date(isoTs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  window.ActiveWork = { refresh, init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
