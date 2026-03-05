/**
 * CR-MC-UI-1.2 Phase 2: Drilldown & Detail Drawer Component
 * Keyboard navigation, search/filter/sort, deep linking, activity logging
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    stages: [],                  // Stage objects from /api/stages
    selectedStageIndex: -1,      // Currently focused stage tile (-1 = none)
    drilldownOpen: false,        // Drilldown drawer visible
    drilldownStage: null,        // Stage name currently open in drilldown
    drilldownVentures: [],       // All ventures in drilldown stage (unfiltered)
    filteredVentures: [],        // Filtered+sorted ventures in drilldown
    selectedVentureIndex: -1,    // Highlighted row in drilldown list
    detailOpen: false,           // Detail drawer visible
    detailVentureId: null,       // Currently shown venture id
    // Filters
    searchQuery: '',
    statusFilters: new Set(),
    ownerFilter: '',
    priorityFilters: new Set(),
    sortOrder: 'last_event_desc',
    // Throttle for activity logging
    lastDrilldownLog: 0
  };

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  function relativeTime(isoStr) {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    if (diff < 0) return 'just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fuzzyMatch(text, query) {
    if (!query) return true;
    return String(text || '').toLowerCase().includes(query.toLowerCase());
  }

  // ---------------------------------------------------------------------------
  // HTML Templates
  // ---------------------------------------------------------------------------

  function statusBadge(status) {
    const s = (status || 'active').toLowerCase();
    return `<span class="status-badge status-${s}">${escapeHtml(s)}</span>`;
  }

  function severityBadgeClass(sev) {
    const s = (sev || 'info').toLowerCase();
    return `sev-badge-${s}`;
  }

  // ---------------------------------------------------------------------------
  // Filter + Sort Logic
  // ---------------------------------------------------------------------------

  function applyFilters() {
    let v = state.drilldownVentures.slice();

    // Text search
    if (state.searchQuery) {
      v = v.filter(venture => {
        return (
          fuzzyMatch(venture.name, state.searchQuery) ||
          fuzzyMatch(venture.venture_id, state.searchQuery) ||
          fuzzyMatch(venture.owner_agent, state.searchQuery)
        );
      });
    }

    // Status filter
    if (state.statusFilters.size > 0) {
      v = v.filter(venture => state.statusFilters.has(venture.status));
    }

    // Owner filter
    if (state.ownerFilter) {
      v = v.filter(venture => venture.owner_agent === state.ownerFilter);
    }

    // Priority filter
    if (state.priorityFilters.size > 0) {
      v = v.filter(venture => state.priorityFilters.has(venture.priority));
    }

    // Sort
    switch (state.sortOrder) {
      case 'name_asc':
        v.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'mrr_desc':
        v.sort((a, b) => (b.mrr || 0) - (a.mrr || 0));
        break;
      case 'last_event_desc':
      default: {
        v.sort((a, b) => {
          const ta = a.last_event && a.last_event.timestamp
            ? new Date(a.last_event.timestamp).getTime() : 0;
          const tb = b.last_event && b.last_event.timestamp
            ? new Date(b.last_event.timestamp).getTime() : 0;
          return tb - ta;
        });
        break;
      }
    }

    state.filteredVentures = v;
    // Clamp selected index
    if (state.selectedVentureIndex >= v.length) {
      state.selectedVentureIndex = v.length > 0 ? 0 : -1;
    }
  }

  // ---------------------------------------------------------------------------
  // Render: Venture List
  // ---------------------------------------------------------------------------

  function renderVentureList() {
    const list = document.getElementById('dd-venture-list');
    if (!list) return;

    const result = document.getElementById('dd-result-count');
    if (result) {
      result.textContent = `${state.filteredVentures.length} venture${state.filteredVentures.length !== 1 ? 's' : ''}`;
    }

    if (state.filteredVentures.length === 0) {
      list.innerHTML = '<div class="venture-list-empty">No ventures match the current filters</div>';
      return;
    }

    list.innerHTML = state.filteredVentures.map((v, i) => {
      const isSelected = i === state.selectedVentureIndex;
      const lastSummary = v.last_event ? escapeHtml(v.last_event.summary) : '—';
      const lastTime = v.last_event ? relativeTime(v.last_event.timestamp) : '';

      return `
        <div class="venture-row${isSelected ? ' selected' : ''}"
             data-index="${i}"
             data-venture-id="${escapeHtml(v.venture_id)}"
             tabindex="-1">
          <div class="venture-row-header">
            <span class="venture-name">${escapeHtml(v.name)}</span>
            ${statusBadge(v.status)}
          </div>
          <div class="venture-row-meta">
            <span class="venture-owner">${escapeHtml(v.owner_agent || '—')}</span>
            <span>·</span>
            <span class="venture-last-event">${lastSummary}</span>
            <span class="venture-time">${lastTime}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    list.querySelectorAll('.venture-row').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.index, 10);
        const vid = row.dataset.ventureId;
        state.selectedVentureIndex = idx;
        renderVentureList();
        openDetail(vid);
      });
    });

    // Scroll selected into view
    if (state.selectedVentureIndex >= 0) {
      const sel = list.querySelector('.venture-row.selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }
  }

  // ---------------------------------------------------------------------------
  // Render: Drilldown Drawer
  // ---------------------------------------------------------------------------

  function updateFilterUI() {
    // Status buttons
    document.querySelectorAll('#dd-status-filters .filter-btn').forEach(btn => {
      const val = btn.dataset.value;
      btn.classList.toggle('active', state.statusFilters.has(val));
    });

    // Owner buttons
    document.querySelectorAll('#dd-owner-filters .filter-btn').forEach(btn => {
      const val = btn.dataset.value;
      btn.classList.toggle('active', state.ownerFilter === val);
    });

    // Priority buttons
    document.querySelectorAll('#dd-priority-filters .filter-btn').forEach(btn => {
      const val = btn.dataset.value;
      btn.classList.toggle('active', state.priorityFilters.has(val));
    });

    // Sort
    const sortSel = document.getElementById('dd-sort-select');
    if (sortSel) sortSel.value = state.sortOrder;
  }

  async function openDrilldown(stageName) {
    state.drilldownStage = stageName;
    state.drilldownOpen = true;
    // Reset filters
    state.searchQuery = '';
    state.statusFilters = new Set();
    state.ownerFilter = '';
    state.priorityFilters = new Set();
    state.sortOrder = 'last_event_desc';
    state.selectedVentureIndex = -1;

    // Update title
    const title = document.getElementById('dd-stage-title');
    if (title) title.textContent = stageName;

    const countEl = document.getElementById('dd-stage-count');
    if (countEl) countEl.textContent = '...';

    // Show drawer
    const drawer = document.getElementById('drilldown-drawer');
    const overlay = document.getElementById('drilldown-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');

    // Reset search UI
    const searchEl = document.getElementById('dd-search');
    if (searchEl) searchEl.value = '';

    updateFilterUI();

    // Fetch ventures
    const list = document.getElementById('dd-venture-list');
    if (list) list.innerHTML = '<div class="drawer-loading">Loading ventures...</div>';

    try {
      const resp = await fetch(`/api/ventures?stage=${encodeURIComponent(stageName)}`);
      const data = await resp.json();
      state.drilldownVentures = data.ventures || [];
    } catch (err) {
      console.error('[DRILLDOWN] Fetch error:', err);
      state.drilldownVentures = [];
    }

    if (countEl) countEl.textContent = state.drilldownVentures.length;

    applyFilters();
    renderVentureList();

    // Update URL hash
    updateHash({ stage: stageName });

    // Activity log (throttled, max 1/min)
    throttledLogDrilldownOpen(stageName);
  }

  function closeDrilldown() {
    state.drilldownOpen = false;
    state.drilldownStage = null;
    state.selectedVentureIndex = -1;

    const drawer = document.getElementById('drilldown-drawer');
    const overlay = document.getElementById('drilldown-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');

    // Clear stage hash
    updateHash({});

    // Deselect stage tile
    document.querySelectorAll('.pipeline-stage.selected').forEach(el => {
      el.classList.remove('selected');
    });
  }

  // ---------------------------------------------------------------------------
  // Detail Drawer
  // ---------------------------------------------------------------------------

  async function openDetail(ventureId) {
    state.detailOpen = true;
    state.detailVentureId = ventureId;

    // Update hash
    const hashParams = { venture: ventureId };
    if (state.drilldownStage) hashParams.stage = state.drilldownStage;
    updateHash(hashParams);

    // CR-MC-VENTURE-DRILLDOWN-V2: Delegate to VentureDetailDrawer if available
    if (window.VentureDetailDrawer) {
      await window.VentureDetailDrawer.open(ventureId);
      updateDetailNavButtons();
      return;
    }

    // Fallback: legacy detail drawer
    const drawer = document.getElementById('detail-drawer');
    const overlay = document.getElementById('detail-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');

    // Show loading
    const content = document.getElementById('detail-content');
    if (content) content.innerHTML = '<div class="drawer-loading">Loading venture details...</div>';

    // Nav buttons
    updateDetailNavButtons();

    try {
      const resp = await fetch(`/api/ventures/${encodeURIComponent(ventureId)}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      renderDetailContent(data);
    } catch (err) {
      console.error('[DETAIL] Fetch error:', err);
      if (content) {
        content.innerHTML = `<div class="drawer-loading" style="color:var(--accent-red)">Error loading venture: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function closeDetail() {
    state.detailOpen = false;
    state.detailVentureId = null;

    // CR-MC-VENTURE-DRILLDOWN-V2: Close new drawer if open
    if (window.VentureDetailDrawer && window.VentureDetailDrawer.isOpen()) {
      window.VentureDetailDrawer.close();
    }

    // Also close legacy drawer (if visible)
    const drawer = document.getElementById('detail-drawer');
    const overlay = document.getElementById('detail-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');

    // Restore hash to just stage (if drilldown is open)
    if (state.drilldownOpen && state.drilldownStage) {
      updateHash({ stage: state.drilldownStage });
    } else {
      updateHash({});
    }
  }

  function updateDetailNavButtons() {
    const prevBtn = document.getElementById('detail-nav-prev');
    const nextBtn = document.getElementById('detail-nav-next');
    if (!prevBtn || !nextBtn) return;

    const idx = state.filteredVentures.findIndex(v => v.venture_id === state.detailVentureId);
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx < 0 || idx >= state.filteredVentures.length - 1;
  }

  function renderDetailContent(data) {
    const content = document.getElementById('detail-content');
    if (!content) return;

    const v = data.venture || {};
    const workstreams = data.related_workstreams || [];
    const blockers = data.blockers || [];
    const activity = data.recent_activity || [];
    const metrics = v.metrics || {};
    const links = v.links || {};

    // Header
    const nameEl = document.getElementById('detail-venture-name');
    if (nameEl) nameEl.textContent = v.name || v.venture_id || '—';

    const subEl = document.getElementById('detail-venture-sub');
    if (subEl) {
      subEl.textContent = `${v.stage || '—'}  ·  ${v.status || '—'}  ·  ${v.owner_agent || '—'}`;
    }

    updateDetailNavButtons();

    let html = '';

    // ── Section: Overview ──
    html += `<div class="detail-section">
      <div class="detail-section-title">Overview</div>
      <div class="detail-description">${escapeHtml(v.description || 'No description')}</div>
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-label">Stage</span>
          <span class="detail-meta-value">${escapeHtml(v.stage || '—')}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-label">Status</span>
          <span class="detail-meta-value">${statusBadge(v.status)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-label">Owner</span>
          <span class="detail-meta-value">${escapeHtml(v.owner_agent || '—')}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-label">Priority</span>
          <span class="detail-meta-value priority-${escapeHtml(v.priority || 'low')}">${escapeHtml(v.priority || '—')}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-label">Started</span>
          <span class="detail-meta-value">${escapeHtml(v.started_date || '—')}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-label">Timeline</span>
          <span class="detail-meta-value">${v.timeline_weeks ? `${v.timeline_weeks}w` : '—'}</span>
        </div>
      </div>`;

    if (v.tags && v.tags.length > 0) {
      html += `<div class="detail-tags">
        ${v.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}
      </div>`;
    }

    html += `</div>`;

    // ── Section: MRR ──
    html += `<div class="detail-section">
      <div class="detail-section-title">Revenue</div>
      <div class="detail-mrr-row">
        <div class="detail-mrr-item">
          <span class="detail-mrr-label">Current MRR</span>
          <span class="detail-mrr-value">$${(v.mrr || 0).toLocaleString()}</span>
        </div>
        <div class="detail-mrr-item">
          <span class="detail-mrr-label">MRR Target</span>
          <span class="detail-mrr-target">$${(v.mrr_target || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>`;

    // ── Section: Links ──
    html += `<div class="detail-section">
      <div class="detail-section-title">Links & Resources</div>
      <div class="detail-links">`;

    const linkDefs = [
      { icon: '📄', label: 'PRD', key: 'prd', value: links.prd },
      { icon: '📋', label: 'CR', key: 'cr', value: links.cr },
      { icon: '📁', label: 'Repo', key: 'repo_path', value: links.repo_path, copyable: true },
      { icon: '🌐', label: 'Demo', key: 'demo_url', value: links.demo_url }
    ];

    linkDefs.forEach(def => {
      const hasLink = def.value && def.value !== 'null';
      const displayValue = hasLink ? escapeHtml(def.value) : 'N/A';
      html += `
        <div class="detail-link-row">
          <span class="detail-link-icon">${def.icon}</span>
          <span class="detail-link-label">${def.label}</span>
          <span class="detail-link-value${hasLink ? '' : ' no-link'}"
                ${hasLink ? `data-link="${escapeHtml(def.value)}"` : ''}
                onclick="${hasLink ? `MissionControlDrilldown.handleLinkClick('${escapeHtml(def.value)}')` : ''}">
            ${displayValue}
          </span>
          ${def.copyable && hasLink ? `<button class="copy-btn" onclick="MissionControlDrilldown.copyToClipboard('${escapeHtml(def.value)}', this)">Copy</button>` : ''}
        </div>
      `;
    });

    html += `</div></div>`;

    // ── Section: Workstreams ──
    html += `<div class="detail-section">
      <div class="detail-section-title">Related Workstreams (${workstreams.length})</div>`;

    if (workstreams.length === 0) {
      html += `<div class="detail-empty">No related workstreams</div>`;
    } else {
      html += `<table class="detail-table">
        <thead><tr>
          <th>Name</th><th>Status</th><th>Assigned To</th><th>Blocked</th>
        </tr></thead>
        <tbody>`;
      workstreams.forEach(ws => {
        const statusClass = `ws-status-${(ws.status || 'active').toLowerCase()}`;
        html += `<tr>
          <td>${escapeHtml(ws.name || ws.workstream_id || '—')}</td>
          <td><span class="ws-status ${statusClass}">${escapeHtml(ws.status || '—')}</span></td>
          <td>${escapeHtml(ws.assigned_to || '—')}</td>
          <td>${ws.blocked_count || 0}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    }

    html += `</div>`;

    // ── Section: Blockers ──
    html += `<div class="detail-section">
      <div class="detail-section-title">Blockers (${blockers.length})</div>`;

    if (blockers.length === 0) {
      html += `<div class="detail-empty" style="color:var(--accent-green)">✓ No blockers</div>`;
    } else {
      html += `<table class="detail-table">
        <thead><tr>
          <th>Title</th><th>Status</th><th>Target Resolution</th>
        </tr></thead>
        <tbody>`;
      blockers.forEach(b => {
        html += `<tr>
          <td>${escapeHtml(b.title || b.blocker_id || '—')}</td>
          <td>${escapeHtml(b.status || '—')}</td>
          <td>${escapeHtml(b.target_resolution || '—')}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    }

    html += `</div>`;

    // ── Section: Recent Activity ──
    html += `<div class="detail-section">
      <div class="detail-section-title">Recent Activity (${activity.length})</div>`;

    if (activity.length === 0) {
      html += `<div class="detail-empty">No recent activity found</div>`;
    } else {
      html += `<div class="detail-activity-list">`;
      activity.forEach(entry => {
        const sev = (entry.severity || 'info').toLowerCase();
        html += `
          <div class="detail-activity-item sev-${sev}">
            <span class="activity-sev-badge ${severityBadgeClass(sev)}">${sev}</span>
            <div class="activity-body">
              <div class="activity-agent-action">
                <strong>${escapeHtml(entry.agent || '—')}</strong>
                — ${escapeHtml(entry.action || '—')}
              </div>
              ${entry.description ? `<div class="activity-desc">${escapeHtml(entry.description)}</div>` : ''}
            </div>
            <div class="activity-ts">${relativeTime(entry.timestamp)}</div>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;

    // ── Section: Metrics ──
    if (Object.keys(metrics).length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Success Targets</div>
        <div class="detail-metrics-grid">`;

      if (metrics.accuracy_target != null) {
        html += `<div class="detail-metric-card">
          <div class="detail-metric-name">Accuracy Target</div>
          <div class="detail-metric-value">${(metrics.accuracy_target * 100).toFixed(0)}%</div>
        </div>`;
      }
      if (metrics.nps_target != null) {
        html += `<div class="detail-metric-card">
          <div class="detail-metric-name">NPS Target</div>
          <div class="detail-metric-value">${metrics.nps_target}</div>
        </div>`;
      }
      if (metrics.customers_target != null) {
        html += `<div class="detail-metric-card">
          <div class="detail-metric-name">Customer Target</div>
          <div class="detail-metric-value">${metrics.customers_target}</div>
        </div>`;
      }
      if (metrics.mrr_target != null) {
        html += `<div class="detail-metric-card">
          <div class="detail-metric-name">MRR Target</div>
          <div class="detail-metric-value">$${(metrics.mrr_target || 0).toLocaleString()}</div>
        </div>`;
      }

      html += `</div>`;

      // Timeline
      html += `<div class="detail-timeline">
        <div class="detail-timeline-item">
          <span class="detail-timeline-label">Started</span>
          <span class="detail-timeline-value">${escapeHtml(v.started_date || '—')}</span>
        </div>
        <div class="detail-timeline-item">
          <span class="detail-timeline-label">Timeline</span>
          <span class="detail-timeline-value">${v.timeline_weeks ? `${v.timeline_weeks} weeks` : '—'}</span>
        </div>
      </div>`;

      html += `</div>`;
    }

    content.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // URL Hash Routing
  // ---------------------------------------------------------------------------

  function updateHash(params) {
    const parts = [];
    if (params.stage) parts.push(`stage=${encodeURIComponent(params.stage)}`);
    if (params.venture) parts.push(`venture=${encodeURIComponent(params.venture)}`);
    const newHash = parts.length > 0 ? `#${parts.join('&')}` : '';
    // Use replaceState-style to avoid polluting history
    const url = window.location.pathname + window.location.search + newHash;
    history.replaceState(null, '', url);
  }

  function parseHash() {
    const hash = window.location.hash.slice(1); // remove #
    const params = {};
    hash.split('&').forEach(part => {
      const [key, val] = part.split('=');
      if (key && val) params[decodeURIComponent(key)] = decodeURIComponent(val);
    });
    return params;
  }

  async function handleDeepLink() {
    const params = parseHash();
    if (!params.stage && !params.venture) return;

    if (params.venture) {
      // Find which stage this venture belongs to
      try {
        const resp = await fetch(`/api/ventures/${encodeURIComponent(params.venture)}`);
        if (resp.ok) {
          const data = await resp.json();
          const ventureStage = data.venture && data.venture.stage;
          const targetStage = params.stage || ventureStage;

          if (targetStage) {
            selectStageTile(targetStage);
            await openDrilldown(targetStage);
          }

          await openDetail(params.venture);
        }
      } catch (err) {
        console.error('[DEEP-LINK] Error:', err);
      }
    } else if (params.stage) {
      selectStageTile(params.stage);
      await openDrilldown(params.stage);
    }
  }

  // ---------------------------------------------------------------------------
  // Stage Tile Management
  // ---------------------------------------------------------------------------

  function selectStageTile(stageName) {
    const tiles = document.querySelectorAll('.pipeline-stage');
    tiles.forEach((tile, i) => {
      const label = tile.querySelector('.stage-label');
      if (label && label.textContent.trim() === stageName) {
        tile.classList.add('selected');
        state.selectedStageIndex = i;
      } else {
        tile.classList.remove('selected');
      }
    });
  }

  function selectStageByIndex(index) {
    const tiles = document.querySelectorAll('.pipeline-stage');
    if (index < 0 || index >= tiles.length) return;

    tiles.forEach((tile, i) => {
      tile.classList.toggle('selected', i === index);
    });

    state.selectedStageIndex = index;
    const label = tiles[index].querySelector('.stage-label');
    if (label) {
      tiles[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // ---------------------------------------------------------------------------
  // Activity Logging (throttled)
  // ---------------------------------------------------------------------------

  function throttledLogDrilldownOpen(stageName) {
    const now = Date.now();
    if (now - state.lastDrilldownLog < 60000) return; // max 1/min
    state.lastDrilldownLog = now;

    const count = state.drilldownVentures.length;
    const description = `{stage: '${stageName}', ventures_shown: ${count}}`;

    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'System',
        action: 'Mission Control UI drilldown opened',
        description,
        severity: 'info'
      })
    }).catch(() => { /* non-critical — ignore errors */ });
  }

  // ---------------------------------------------------------------------------
  // Keyboard Navigation
  // ---------------------------------------------------------------------------

  let navDebounceTimer = null;

  function debounce(fn, delay) {
    return function (...args) {
      clearTimeout(navDebounceTimer);
      navDebounceTimer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const debouncedSelectStageIndex = debounce((index) => {
    selectStageByIndex(index);
  }, 50);

  function isTypingInInput() {
    const target = document.activeElement;
    if (!target) return false;
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  }

  function handleKeyDown(e) {
    // Never intercept if typing in an input (except '/' for search focus)
    const typing = isTypingInInput();

    const key = e.key;

    // '/' focuses search — always handle unless already in search
    if (key === '/' && !typing && state.drilldownOpen && !state.detailOpen) {
      e.preventDefault();
      const searchEl = document.getElementById('dd-search');
      if (searchEl) searchEl.focus();
      return;
    }

    // Escape chain
    if (key === 'Escape') {
      // If VentureDetailDrawer is handling this, let it (has capture listener)
      if (state.detailOpen && !(window.VentureDetailDrawer && window.VentureDetailDrawer.isOpen())) {
        e.preventDefault();
        closeDetail();
        return;
      }
      if (state.detailOpen && window.VentureDetailDrawer && window.VentureDetailDrawer.isOpen()) {
        // VentureDetailDrawer handled the close via capture listener; sync state
        state.detailOpen = false;
        state.detailVentureId = null;
        if (state.drilldownOpen && state.drilldownStage) updateHash({ stage: state.drilldownStage });
        else updateHash({});
        return;
      }
      if (state.drilldownOpen) {
        e.preventDefault();
        closeDrilldown();
        return;
      }
    }

    if (typing) return; // All other keys: don't fire while typing

    // Detail drawer navigation
    if (state.detailOpen) {
      if (key === 'ArrowLeft') {
        e.preventDefault();
        navigateDetail(-1);
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        navigateDetail(1);
        return;
      }
    }

    // Drilldown list navigation
    if (state.drilldownOpen && !state.detailOpen) {
      if (key === 'ArrowUp') {
        e.preventDefault();
        if (state.selectedVentureIndex > 0) {
          state.selectedVentureIndex--;
          renderVentureList();
        }
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault();
        if (state.selectedVentureIndex < state.filteredVentures.length - 1) {
          state.selectedVentureIndex++;
          renderVentureList();
        } else if (state.selectedVentureIndex === -1 && state.filteredVentures.length > 0) {
          state.selectedVentureIndex = 0;
          renderVentureList();
        }
        return;
      }
      if (key === 'Enter') {
        e.preventDefault();
        if (state.selectedVentureIndex >= 0 && state.filteredVentures[state.selectedVentureIndex]) {
          openDetail(state.filteredVentures[state.selectedVentureIndex].venture_id);
        }
        return;
      }
      // Stage navigation blocked while drilldown is open (←/→ would conflict with list nav)
      return;
    }

    // Global stage navigation (←/→) — only when drilldown is closed
    if (!state.drilldownOpen) {
      const tiles = document.querySelectorAll('.pipeline-stage');
      const total = tiles.length;
      if (total === 0) return;

      if (key === 'ArrowLeft') {
        e.preventDefault();
        const next = state.selectedStageIndex <= 0 ? 0 : state.selectedStageIndex - 1;
        debouncedSelectStageIndex(next);
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        const next = state.selectedStageIndex < total - 1 ? state.selectedStageIndex + 1 : total - 1;
        debouncedSelectStageIndex(next);
        return;
      }
      if (key === 'Enter' && state.selectedStageIndex >= 0) {
        e.preventDefault();
        const tile = tiles[state.selectedStageIndex];
        if (tile) {
          const label = tile.querySelector('.stage-label');
          if (label) openDrilldown(label.textContent.trim());
        }
        return;
      }
    }
  }

  function navigateDetail(direction) {
    const idx = state.filteredVentures.findIndex(v => v.venture_id === state.detailVentureId);
    const next = idx + direction;
    if (next >= 0 && next < state.filteredVentures.length) {
      state.selectedVentureIndex = next;
      openDetail(state.filteredVentures[next].venture_id);
    }
  }

  // ---------------------------------------------------------------------------
  // Filter event handlers
  // ---------------------------------------------------------------------------

  function setupFilterHandlers() {
    // Search input
    const search = document.getElementById('dd-search');
    if (search) {
      search.addEventListener('input', () => {
        state.searchQuery = search.value;
        state.selectedVentureIndex = -1;
        applyFilters();
        renderVentureList();
      });
    }

    // Status filter buttons
    document.querySelectorAll('#dd-status-filters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        if (state.statusFilters.has(val)) {
          state.statusFilters.delete(val);
        } else {
          state.statusFilters.add(val);
        }
        btn.classList.toggle('active', state.statusFilters.has(val));
        state.selectedVentureIndex = -1;
        applyFilters();
        renderVentureList();
      });
    });

    // Owner filter buttons
    document.querySelectorAll('#dd-owner-filters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        state.ownerFilter = state.ownerFilter === val ? '' : val;
        document.querySelectorAll('#dd-owner-filters .filter-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.value === state.ownerFilter);
        });
        state.selectedVentureIndex = -1;
        applyFilters();
        renderVentureList();
      });
    });

    // Priority filter buttons
    document.querySelectorAll('#dd-priority-filters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        if (state.priorityFilters.has(val)) {
          state.priorityFilters.delete(val);
        } else {
          state.priorityFilters.add(val);
        }
        btn.classList.toggle('active', state.priorityFilters.has(val));
        state.selectedVentureIndex = -1;
        applyFilters();
        renderVentureList();
      });
    });

    // Sort select
    const sortSel = document.getElementById('dd-sort-select');
    if (sortSel) {
      sortSel.addEventListener('change', () => {
        state.sortOrder = sortSel.value;
        state.selectedVentureIndex = -1;
        applyFilters();
        renderVentureList();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Stage Tiles: attach click + keyboard focus
  // ---------------------------------------------------------------------------

  function attachStageTileHandlers() {
    document.querySelectorAll('.pipeline-stage').forEach((tile, i) => {
      tile.setAttribute('tabindex', '0');
      tile.addEventListener('click', () => {
        const label = tile.querySelector('.stage-label');
        if (!label) return;
        const stageName = label.textContent.trim();
        state.selectedStageIndex = i;
        selectStageTile(stageName);
        openDrilldown(stageName);
      });
      tile.addEventListener('focus', () => {
        state.selectedStageIndex = i;
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Overlay click-to-close
  // ---------------------------------------------------------------------------

  function setupOverlayHandlers() {
    const ddOverlay = document.getElementById('drilldown-overlay');
    if (ddOverlay) {
      ddOverlay.addEventListener('click', (e) => {
        if (e.target === ddOverlay) {
          if (state.detailOpen) closeDetail();
          else closeDrilldown();
        }
      });
    }

    const detOverlay = document.getElementById('detail-overlay');
    if (detOverlay) {
      detOverlay.addEventListener('click', (e) => {
        if (e.target === detOverlay) closeDetail();
      });
    }

    const ddClose = document.getElementById('dd-close-btn');
    if (ddClose) ddClose.addEventListener('click', closeDrilldown);

    const detClose = document.getElementById('detail-close-btn');
    if (detClose) detClose.addEventListener('click', closeDetail);

    const prevBtn = document.getElementById('detail-nav-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateDetail(-1));

    const nextBtn = document.getElementById('detail-nav-next');
    if (nextBtn) nextBtn.addEventListener('click', () => navigateDetail(1));
  }

  // ---------------------------------------------------------------------------
  // Public API (exposed as MissionControlDrilldown)
  // ---------------------------------------------------------------------------

  window.MissionControlDrilldown = {
    openDrilldown,
    closeDrilldown,
    openDetail,
    closeDetail,

    copyToClipboard(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        if (btn) {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1500);
        }
      }).catch(err => {
        console.error('[COPY] Failed:', err);
      });
    },

    handleLinkClick(path) {
      if (!path || path === 'null') return;
      // Show path in an alert for now (no file viewer yet)
      // In future: open in-app viewer
      console.log('[LINK]', path);
      // Just copy to clipboard as UX fallback
      navigator.clipboard.writeText(path).catch(() => {});
      const toast = document.getElementById('action-toast');
      const icon = document.getElementById('toast-icon');
      const msg = document.getElementById('toast-message');
      if (toast && icon && msg) {
        icon.textContent = '📋';
        msg.textContent = `Copied path: ${path}`;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 2000);
      }
    },

    init() {
      attachStageTileHandlers();
      setupFilterHandlers();
      setupOverlayHandlers();
      document.addEventListener('keydown', handleKeyDown);

      // Handle deep links on load
      if (window.location.hash) {
        handleDeepLink();
      }

      // Handle hash changes (browser back/forward)
      window.addEventListener('hashchange', handleDeepLink);

      console.log('[DRILLDOWN] Initialized');
    }
  };

})();
