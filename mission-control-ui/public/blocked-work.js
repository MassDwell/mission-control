/**
 * CR-MC-OPS-PANELS-UPGRADE: Blocked Work Panel
 * Blocker console with SLA timers + severity colors + drawer
 *
 * Keyboard: ↑↓ → navigate, Enter → open drawer, Esc → close
 */

'use strict';

(function BlockedWorkPanel() {
  let _blockers     = [];
  let _focusedIdx   = -1;
  const REFRESH_MS  = 10000;

  const $ = id => document.getElementById(id);

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    const container = $('blocked-work-content');
    if (!container) return;

    container.innerHTML = `
      <div class="bw-panel" id="bw-panel">
        <div class="bw-table-wrap" id="bw-table-wrap">
          <div style="padding:10px;color:var(--text-muted);font-size:11px;">Loading blockers…</div>
        </div>
        <div class="bw-source" id="bw-source"></div>
      </div>
    `;

    fetchData();
    setInterval(fetchData, REFRESH_MS);
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      const res = await fetch('/api/blockers');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      _blockers = data.blockers || [];
      renderTable(data);
    } catch (err) {
      const wrap = $('bw-table-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div class="bw-error">
            ⚠ Failed to load blockers: ${escHtml(err.message)}
            <button class="bw-retry-btn" onclick="window.BlockedWork?.refresh()">Retry</button>
          </div>`;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderTable(data) {
    const wrap = $('bw-table-wrap');
    if (!wrap) return;

    if (_blockers.length === 0) {
      wrap.innerHTML = `
        <div class="bw-empty">
          ✅ No blockers — system flowing freely
          <span class="bw-empty-file">Checked: blocked_work.json</span>
        </div>`;

      const sourceEl = $('bw-source');
      if (sourceEl && data.sources?.blocked_work) {
        const ts = data.sources.blocked_work.lastUpdated
          ? new Date(data.sources.blocked_work.lastUpdated).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          : 'unknown';
        sourceEl.textContent = `blocked_work.json · last updated ${ts}`;
      }
      return;
    }

    const rows = _blockers.map((b, idx) => {
      const sev = (b.severity || 'warning').toLowerCase();
      const sevIcon = { critical: '🔴', warning: '🟡', info: '🔵' }[sev] || '⚪';
      const createdRel = b.created_at ? relTime(b.created_at) : '—';

      return `
        <tr class="sev-${sev}" data-idx="${idx}" data-id="${escHtml(b.id)}" tabindex="0">
          <td class="bw-col-id">${escHtml(b.id)}</td>
          <td class="bw-col-venture">${escHtml(b.venture_name || b.venture_id || '—')}</td>
          <td class="bw-col-workstream">${escHtml(b.workstream_id || '—')}</td>
          <td class="bw-col-owner">${escHtml(b.owner || '—')}</td>
          <td class="bw-col-created">${escHtml(createdRel)}</td>
          <td class="bw-col-duration">${escHtml(b.duration_str || '—')}</td>
          <td>
            <span class="bw-severity-badge sev-${sev}">${sevIcon} ${sev.toUpperCase()}</span>
          </td>
          <td class="bw-col-action">${escHtml(b.next_action || '—')}</td>
        </tr>
      `;
    }).join('');

    wrap.innerHTML = `
      <table class="bw-table" id="bw-table" tabindex="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Venture</th>
            <th>Workstream</th>
            <th>Owner</th>
            <th>Created</th>
            <th>Duration</th>
            <th>Severity</th>
            <th>Next Action</th>
          </tr>
        </thead>
        <tbody id="bw-tbody">${rows}</tbody>
      </table>
    `;

    // Bind events
    const table = $('bw-table');
    if (table) {
      table.addEventListener('keydown', onTableKeydown);
      table.querySelectorAll('tr[data-idx]').forEach(tr => {
        tr.addEventListener('click', () => {
          const idx = parseInt(tr.dataset.idx, 10);
          _focusedIdx = idx;
          updateFocused();
          openDrawer(_blockers[idx]);
        });
        tr.addEventListener('focus', () => {
          _focusedIdx = parseInt(tr.dataset.idx, 10);
          updateFocused();
        });
      });
    }

    // Source
    const sourceEl = $('bw-source');
    if (sourceEl && data.sources) {
      const mainTs = data.sources.blocked_work?.lastUpdated;
      const tsStr = mainTs
        ? new Date(mainTs).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        : 'unknown';
      sourceEl.textContent = `blocked_work.json · last updated ${tsStr} · ${_blockers.length} blocker${_blockers.length === 1 ? '' : 's'}`;
    }
  }

  function onTableKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-1); }
    else if (e.key === 'Enter' && _focusedIdx >= 0) {
      e.preventDefault();
      openDrawer(_blockers[_focusedIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDrawer();
    }
  }

  function moveFocus(delta) {
    if (_blockers.length === 0) return;
    _focusedIdx = (_focusedIdx + delta + _blockers.length) % _blockers.length;
    updateFocused();
  }

  function updateFocused() {
    document.querySelectorAll('#bw-tbody tr').forEach(tr => {
      tr.classList.toggle('focused', parseInt(tr.dataset.idx, 10) === _focusedIdx);
    });
    const focused = document.querySelector('#bw-tbody tr.focused');
    if (focused) focused.scrollIntoView({ block: 'nearest' });
  }

  // ── Blocker Drawer ────────────────────────────────────────────────────────
  function ensureDrawer() {
    if ($('blk-drawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'blk-drawer-overlay';
    overlay.className = 'blk-drawer-overlay';
    overlay.addEventListener('click', closeDrawer);

    const drawer = document.createElement('div');
    drawer.id = 'blk-drawer';
    drawer.className = 'blk-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Blocker detail');

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  async function openDrawer(blocker) {
    ensureDrawer();

    const overlay = $('blk-drawer-overlay');
    const drawer  = $('blk-drawer');
    overlay.classList.add('open');
    drawer.classList.add('open');

    // Show stub while loading
    drawer.innerHTML = renderDrawerHeader(blocker) + '<div style="padding:16px;color:var(--text-muted);font-size:11px;">Loading detail…</div>';
    drawer.querySelector('.blk-drawer-close')?.addEventListener('click', closeDrawer);

    try {
      const res = await fetch(`/api/blockers/${encodeURIComponent(blocker.id)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const detail = await res.json();
      drawer.innerHTML = renderDrawerContent(detail);
      drawer.querySelector('.blk-drawer-close')?.addEventListener('click', closeDrawer);
    } catch (err) {
      // Fall back to list data
      drawer.innerHTML = renderDrawerContent({
        ...blocker,
        error: err.message
      });
      drawer.querySelector('.blk-drawer-close')?.addEventListener('click', closeDrawer);
    }
  }

  function renderDrawerHeader(b) {
    const sev = (b.severity || 'warning').toLowerCase();
    const sevIcon = { critical: '🔴', warning: '🟡', info: '🔵' }[sev] || '⚪';
    return `
      <div class="blk-drawer-header">
        <div style="flex:1">
          <div class="blk-drawer-id">${escHtml(b.id)}</div>
          <div class="blk-drawer-severity">
            <span class="bw-severity-badge sev-${sev}">${sevIcon} ${sev.toUpperCase()}</span>
          </div>
        </div>
        <button class="blk-drawer-close" aria-label="Close drawer">×</button>
      </div>
    `;
  }

  function renderDrawerContent(detail) {
    const sla = detail.sla || {};

    let html = renderDrawerHeader(detail);
    html += `<div class="blk-drawer-body">`;

    // Error fallback
    if (detail.error) {
      html += `<div class="blk-drawer-section"><div style="color:var(--accent-red);font-size:11px;">Note: Using cached data — ${escHtml(detail.error)}</div></div>`;
    }

    // What's blocked
    html += `
      <div class="blk-drawer-section">
        <div class="blk-drawer-section-title">What's Blocked</div>
        <div class="blk-meta-grid">
          ${blkMetaItem('Venture',    detail.venture?.name || detail.venture_id)}
          ${blkMetaItem('Workstream', detail.workstream_id)}
          ${blkMetaItem('Type',       detail.blocker_type)}
          ${blkMetaItem('Status',     'Active')}
        </div>
      </div>
    `;

    // Who's responsible
    html += `
      <div class="blk-drawer-section">
        <div class="blk-drawer-section-title">Responsibility</div>
        <div class="blk-meta-grid">
          ${blkMetaItem('Owner',      detail.owner)}
          ${blkMetaItem('Assignee',   detail.assignee)}
          ${blkMetaItem('Resolution Target', detail.resolution_target)}
        </div>
      </div>
    `;

    // SLA Timeline
    html += `
      <div class="blk-drawer-section">
        <div class="blk-drawer-section-title">SLA Timeline</div>
        <div class="blk-sla-wrap">
          <div class="blk-sla-row">
            <span class="blk-sla-label">Created</span>
            <span class="blk-sla-value">${detail.created_at ? fmtDate(detail.created_at) : '—'}</span>
          </div>
          <div class="blk-sla-row">
            <span class="blk-sla-label">Duration</span>
            <span class="blk-sla-value">${escHtml(sla.duration_str || detail.duration_str || '—')}</span>
          </div>
          <div class="blk-sla-row">
            <span class="blk-sla-label">SLA Limit</span>
            <span class="blk-sla-value">${sla.sla_hours ? `${sla.sla_hours}h` : '72h (default)'}</span>
          </div>
          <div class="blk-sla-row">
            <span class="blk-sla-label">Status</span>
            <span class="blk-sla-value ${sla.overdue ? 'blk-sla-overdue' : 'blk-sla-ok'}">
              ${escHtml(sla.remaining_str || '—')}
            </span>
          </div>
        </div>
      </div>
    `;

    // Next action
    if (detail.next_action) {
      html += `
        <div class="blk-drawer-section">
          <div class="blk-drawer-section-title">Required Action</div>
          <div class="blk-next-action">${escHtml(detail.next_action)}</div>
        </div>
      `;
    }

    // Description
    if (detail.description) {
      html += `
        <div class="blk-drawer-section">
          <div class="blk-drawer-section-title">Description</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${escHtml(detail.description)}</div>
        </div>
      `;
    }

    // Related activity
    if (Array.isArray(detail.related_activity) && detail.related_activity.length > 0) {
      html += `
        <div class="blk-drawer-section">
          <div class="blk-drawer-section-title">Related Activity</div>
          ${detail.related_activity.map(a => `
            <div class="blk-activity-row">
              <span class="blk-activity-time">${escHtml(a.relative_time || fmtTime(a.timestamp))}</span>
              <span class="blk-activity-agent">${escHtml(a.agent || '—')}</span>
              <span class="blk-activity-action">${escHtml(a.action || '')}</span>
            </div>`).join('')}
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
        <div class="blk-drawer-section" style="border-bottom:none">
          <div class="blk-drawer-section-title">Sources</div>
          <div style="font-size:10px;color:var(--text-muted)">${escHtml(srcLines)}</div>
        </div>
      `;
    }

    html += `</div>`; // blk-drawer-body
    html += `<div class="blk-drawer-footer">Source: blocked_work.json</div>`;

    return html;
  }

  function closeDrawer() {
    const overlay = $('blk-drawer-overlay');
    const drawer  = $('blk-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer)  drawer.classList.remove('open');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function blkMetaItem(label, value) {
    if (value == null || value === '') return '';
    return `
      <div class="blk-meta-item">
        <span class="blk-meta-label">${escHtml(label)}</span>
        <span class="blk-meta-value">${escHtml(String(value))}</span>
      </div>`;
  }

  function relTime(isoTs) {
    if (!isoTs) return '—';
    try {
      const diff = Date.now() - new Date(isoTs).getTime();
      const s = Math.floor(diff / 1000);
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    } catch { return isoTs; }
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
  window.BlockedWork = { refresh, init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
