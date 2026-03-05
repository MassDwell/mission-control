/**
 * CR-MC-OPS-PANELS-UPGRADE: Agent Activity Panel
 * Live timeline with filters, search, drilldown drawer
 *
 * Keyboard: / → search, Enter → open, Esc → close, ↑↓ → navigate
 */

'use strict';

(function AgentActivityPanel() {
  // ── State ────────────────────────────────────────────────────────────────
  let _allItems   = [];
  let _filtered   = [];
  let _focusedIdx = -1;
  let _filters    = { agent: null, severity: null, venture: null };
  let _searchQ    = '';
  let _drawerOpen = false;
  let _drawerItem = null;
  const REFRESH_MS = 10000;

  // ── DOM Refs (lazy) ───────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  function getContainer() { return $('agent-activity-content'); }

  // ── Render toolbar (once) ────────────────────────────────────────────────
  function injectToolbar() {
    const container = getContainer();
    if (!container) return;

    // Wrap existing content
    const wrapper = document.createElement('div');
    wrapper.id = 'aa-wrapper';
    wrapper.style.cssText = 'display:flex;flex-direction:column;height:100%;min-height:0;';

    // Toolbar
    wrapper.innerHTML = `
      <div class="aa-toolbar" id="aa-toolbar">
        <div class="aa-search-wrap">
          <span class="aa-search-icon">🔍</span>
          <input class="aa-search-input" id="aa-search"
                 placeholder="Search actions… (press / to focus)"
                 autocomplete="off" spellcheck="false" />
        </div>
        <div class="aa-filters" id="aa-filters">
          <div class="aa-filter-group">
            <span class="aa-filter-label">Agent</span>
            <button class="aa-filter-btn" data-filter="agent" data-value="Clawson">Clawson</button>
            <button class="aa-filter-btn" data-filter="agent" data-value="Codesmith">Codesmith</button>
            <button class="aa-filter-btn" data-filter="agent" data-value="Moonshot">Moonshot</button>
          </div>
          <div class="aa-filter-group">
            <span class="aa-filter-label">Sev</span>
            <button class="aa-filter-btn" data-filter="severity" data-value="critical">🔴</button>
            <button class="aa-filter-btn" data-filter="severity" data-value="warning">⚠️</button>
            <button class="aa-filter-btn" data-filter="severity" data-value="info">ℹ️</button>
          </div>
        </div>
      </div>
      <div class="aa-feed" id="aa-feed" role="list" tabindex="0" aria-label="Activity feed"></div>
      <div class="aa-source" id="aa-source"></div>
      <div class="aa-keyboard-hints">
        <span class="aa-kbd">/</span><span style="font-size:9px;color:var(--text-muted)">search</span>
        <span class="aa-kbd">↑↓</span><span style="font-size:9px;color:var(--text-muted)">nav</span>
        <span class="aa-kbd">Enter</span><span style="font-size:9px;color:var(--text-muted)">open</span>
        <span class="aa-kbd">Esc</span><span style="font-size:9px;color:var(--text-muted)">close</span>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(wrapper);

    bindToolbarEvents();
  }

  function bindToolbarEvents() {
    // Search
    const searchInput = $('aa-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        _searchQ = e.target.value.trim();
        applyFilters();
      });
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          searchInput.value = '';
          _searchQ = '';
          applyFilters();
          $('aa-feed')?.focus();
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          $('aa-feed')?.focus();
          moveFocus(1);
        }
      });
    }

    // Filter buttons
    const filtersEl = $('aa-filters');
    if (filtersEl) {
      filtersEl.addEventListener('click', e => {
        const btn = e.target.closest('.aa-filter-btn');
        if (!btn) return;
        const filterType  = btn.dataset.filter;
        const filterValue = btn.dataset.value;
        const isActive = btn.classList.contains('active');

        // Toggle
        _filters[filterType] = isActive ? null : filterValue;

        // Update active state (only one active per group)
        filtersEl.querySelectorAll(`.aa-filter-btn[data-filter="${filterType}"]`).forEach(b => {
          b.classList.toggle('active', b.dataset.value === _filters[filterType]);
        });

        applyFilters();
      });
    }

    // Keyboard nav on feed
    const feed = $('aa-feed');
    if (feed) {
      feed.addEventListener('keydown', onFeedKeydown);
    }
  }

  // ── Keyboard navigation ──────────────────────────────────────────────────
  function onFeedKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(-1);
    } else if (e.key === 'Enter' && _focusedIdx >= 0) {
      e.preventDefault();
      openDrawer(_filtered[_focusedIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDrawer();
    }
  }

  function moveFocus(delta) {
    const count = _filtered.length;
    if (count === 0) return;
    _focusedIdx = (_focusedIdx + delta + count) % count;
    renderFeed();
    scrollFocused();
  }

  function scrollFocused() {
    const feed = $('aa-feed');
    if (!feed) return;
    const item = feed.querySelector('.aa-item.focused');
    if (item) item.scrollIntoView({ block: 'nearest' });
  }

  // ── Filtering ────────────────────────────────────────────────────────────
  function applyFilters() {
    _filtered = _allItems.filter(item => {
      // Agent filter
      if (_filters.agent) {
        if ((item.agent || '').toLowerCase() !== _filters.agent.toLowerCase()) return false;
      }
      // Severity filter
      if (_filters.severity) {
        const sev = (item.severity || item.level || 'info').toLowerCase();
        if (sev !== _filters.severity) return false;
      }
      // Venture filter
      if (_filters.venture) {
        const ventureId = item.venture_id || item.meta?.venture_id || '';
        if (!ventureId.toLowerCase().includes(_filters.venture.toLowerCase())) return false;
      }
      // Text search
      if (_searchQ) {
        const q = _searchQ.toLowerCase();
        const action = (item.action || '').toLowerCase();
        const desc   = (item.description || '').toLowerCase();
        const agent  = (item.agent || '').toLowerCase();
        if (!action.includes(q) && !desc.includes(q) && !agent.includes(q)) return false;
      }
      return true;
    });

    _focusedIdx = -1;
    renderFeed();
  }

  // ── Rendering ────────────────────────────────────────────────────────────
  function renderFeed() {
    const feed = $('aa-feed');
    if (!feed) return;

    if (_filtered.length === 0) {
      const msg = _allItems.length === 0
        ? `<div class="aa-empty">No activity recorded<span class="aa-empty-file">Checked: agent_activity.json</span></div>`
        : `<div class="aa-empty">No results for current filters</div>`;
      feed.innerHTML = msg;
      return;
    }

    const rows = _filtered.map((item, idx) => {
      const sev = normalizeSeverity(item.severity || item.level);
      const time = formatTime(item.timestamp);
      const agent = escHtml(item.agent || '?');
      const action = escHtml(item.action || '');
      const desc = item.description ? escHtml(item.description) : '';
      const focused = idx === _focusedIdx ? ' focused' : '';
      const selected = _drawerItem === item ? ' selected' : '';

      return `
        <div class="aa-item sev-${sev}${focused}${selected}"
             role="listitem"
             data-idx="${idx}"
             tabindex="-1"
             aria-label="${agent}: ${action}">
          <div class="aa-item-header">
            <span class="aa-time" title="${item.timestamp || ''}">${time}</span>
            <span class="aa-severity-badge sev-${sev}">${sev}</span>
            <span class="aa-agent">${agent}</span>
            <span class="aa-dash">—</span>
            <span class="aa-action">${action}</span>
          </div>
          ${desc ? `<div class="aa-item-desc">${desc}</div>` : ''}
        </div>
      `;
    }).join('');

    feed.innerHTML = rows;

    // Click to open drawer
    feed.querySelectorAll('.aa-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        _focusedIdx = idx;
        renderFeed();
        openDrawer(_filtered[idx]);
      });
    });
  }

  // ── Data fetch ───────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      const res = await fetch('/api/activity-feed');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      _allItems = (data.feed || []).map(item => ({
        ...item,
        severity: normalizeSeverity(item.severity || item.level)
      }));

      applyFilters();

      // Update source citation
      const sourceEl = $('aa-source');
      if (sourceEl && data.timestamp) {
        const ts = new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        sourceEl.textContent = `agent_activity.json · ${_allItems.length} events · refreshed ${ts}`;
      }
    } catch (err) {
      const feed = $('aa-feed');
      if (feed) {
        feed.innerHTML = `
          <div class="aa-error">
            ⚠ Failed to load activity feed: ${escHtml(err.message)}
            <button class="aa-retry-btn" onclick="window.AgentActivity?.refresh()">Retry</button>
          </div>`;
      }
    }
  }

  // ── Drawer ───────────────────────────────────────────────────────────────
  function ensureDrawer() {
    if ($('aa-drawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'aa-drawer-overlay';
    overlay.className = 'aa-drawer-overlay';
    overlay.addEventListener('click', closeDrawer);

    const drawer = document.createElement('div');
    drawer.id = 'aa-drawer';
    drawer.className = 'aa-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Activity detail');

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  function openDrawer(item) {
    ensureDrawer();
    _drawerItem = item;
    _drawerOpen = true;

    const sev = normalizeSeverity(item.severity);
    const ts = item.timestamp
      ? new Date(item.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })
      : 'Unknown';

    const drawer = $('aa-drawer');
    drawer.innerHTML = `
      <div class="aa-drawer-header">
        <div style="flex:1">
          <div class="aa-drawer-title">${escHtml(item.action || 'Activity Event')}</div>
        </div>
        <span class="aa-drawer-badge sev-${sev}">${sev.toUpperCase()}</span>
        <button class="aa-drawer-close" id="aa-drawer-close" aria-label="Close drawer">×</button>
      </div>
      <div class="aa-drawer-body">
        <div class="aa-drawer-section">
          <div class="aa-drawer-section-label">Agent</div>
          <div class="aa-drawer-section-value">${escHtml(item.agent || '—')}</div>
        </div>
        <div class="aa-drawer-section">
          <div class="aa-drawer-section-label">Timestamp</div>
          <div class="aa-drawer-section-value">${escHtml(ts)}</div>
        </div>
        ${item.description ? `
        <div class="aa-drawer-section">
          <div class="aa-drawer-section-label">Description</div>
          <div class="aa-drawer-section-value">${escHtml(item.description)}</div>
        </div>` : ''}
        <hr class="aa-drawer-divider" />
        ${(item.venture_id || item.meta?.venture_id) ? `
        <div class="aa-drawer-section">
          <div class="aa-drawer-section-label">Related Venture</div>
          <div class="aa-drawer-section-value">${escHtml(item.venture_id || item.meta?.venture_id)}</div>
        </div>` : ''}
        ${(item.workstream_id || item.meta?.workstream_id) ? `
        <div class="aa-drawer-section">
          <div class="aa-drawer-section-label">Related Workstream</div>
          <div class="aa-drawer-section-value">${escHtml(item.workstream_id || item.meta?.workstream_id)}</div>
        </div>` : ''}
        ${(item.meta?.cr) ? `
        <div class="aa-drawer-section">
          <div class="aa-drawer-section-label">Related CR</div>
          <div class="aa-drawer-section-value">${escHtml(item.meta.cr)}</div>
        </div>` : ''}
        ${item.source ? `
        <div class="aa-drawer-section">
          <div class="aa-drawer-section-label">Source</div>
          <div class="aa-drawer-section-value">${escHtml(item.source)}</div>
        </div>` : ''}
      </div>
      <div class="aa-drawer-footer">
        Source: agent_activity.json
      </div>
    `;

    $('aa-drawer-overlay').classList.add('open');
    drawer.classList.add('open');

    drawer.querySelector('#aa-drawer-close')?.addEventListener('click', closeDrawer);
    renderFeed(); // Re-render to show selected state
  }

  function closeDrawer() {
    _drawerOpen = false;
    _drawerItem = null;
    const overlay = $('aa-drawer-overlay');
    const drawer  = $('aa-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer)  drawer.classList.remove('open');
    renderFeed();
  }

  // ── Keyboard shortcuts (global) ──────────────────────────────────────────
  document.addEventListener('keydown', e => {
    // / → focus search (only when not in other inputs)
    if (e.key === '/' && !isInputFocused() && !_drawerOpen) {
      e.preventDefault();
      $('aa-search')?.focus();
    }
    // Esc → close drawer
    if (e.key === 'Escape' && _drawerOpen) {
      e.preventDefault();
      closeDrawer();
    }
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function normalizeSeverity(s) {
    const v = (s || 'info').toLowerCase();
    if (v === 'critical' || v === 'high') return 'critical';
    if (v === 'warning')  return 'warning';
    return 'info';
  }

  function formatTime(isoTs) {
    if (!isoTs) return '--';
    try {
      return new Date(isoTs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return '--'; }
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

  function isInputFocused() {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  // ── Init + refresh cycle ─────────────────────────────────────────────────
  function refresh() {
    fetchData();
  }

  function init() {
    injectToolbar();
    fetchData();
    setInterval(refresh, REFRESH_MS);
  }

  // Expose for retry button + external access
  window.AgentActivity = { refresh, init };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
