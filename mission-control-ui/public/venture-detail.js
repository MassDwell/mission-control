/**
 * CR-MC-VENTURE-DRILLDOWN-V2: Venture Detail Drawer
 * 7-section detail view: header, timeline, artifacts, workstreams,
 * blockers, checklist, metrics — all SSOT-sourced, fail-loud.
 *
 * Public API:
 *   VentureDetailDrawer.open(ventureId)
 *   VentureDetailDrawer.close()
 *   VentureDetailDrawer.isOpen()
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const state = {
    open: false,
    ventureId: null,
    data: null,
    timeFilter: 'all',   // '24h' | '7d' | '30d' | 'all'
    showAllActivity: false
  };

  const ACTIVITY_LIMIT = 8; // entries shown before "show all"

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------

  function $(id) { return document.getElementById(id); }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function relTime(isoStr) {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    if (diff < 0) return 'just now';
    const mins  = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function fmtTime(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function staleness(isoStr) {
    if (!isoStr) return null;
    const hours = (Date.now() - new Date(isoStr).getTime()) / 3600000;
    if (hours < 0.1) return { label: 'just now', stale: false };
    if (hours < 1) return { label: `${Math.round(hours * 60)}m ago`, stale: false };
    const h = hours.toFixed(1);
    return { label: `${h}h ago`, stale: hours > 0.5 };
  }

  function freshnessHtml(sourceStr) {
    // Extract lastUpdated from source string like "file.json (lastUpdated: ISO)"
    const match = sourceStr && sourceStr.match(/lastUpdated: ([^)]+)/);
    const ts     = match ? match[1] : null;
    const file   = sourceStr ? sourceStr.split(' (')[0] : '';
    const info   = ts ? staleness(ts) : null;
    const staleIcon = info && info.stale ? '<span class="vd-stale-warn" title="Data may be stale">⚠️</span>' : '';
    const tsLabel = info ? `${staleIcon} ${escHtml(info.label)}` : '';
    return `<span class="vd-section-freshness" title="${escHtml(sourceStr || '')}">
      <span class="vd-source-file">${escHtml(file)}</span>
      ${tsLabel ? `<span>${tsLabel}</span>` : ''}
    </span>`;
  }

  function sourceRowHtml(sourceStr) {
    const match = sourceStr && sourceStr.match(/lastUpdated: ([^)]+)/);
    const ts    = match ? match[1] : null;
    const file  = sourceStr ? sourceStr.split(' (')[0] : sourceStr || '';
    const info  = ts ? staleness(ts) : null;
    const staleIcon = info && info.stale ? ' ⚠️' : '';
    return `<div class="vd-source-row">
      <span class="vd-source-icon">📄</span>
      <span class="vd-source-file">${escHtml(file)}</span>
      ${info ? `<span class="vd-source-ts${info.stale ? ' vd-stale-warn' : ''}">Updated ${escHtml(info.label)}${staleIcon}</span>` : ''}
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // Overlay / Drawer HTML (injected once into DOM)
  // ---------------------------------------------------------------------------

  function ensureDrawerExists() {
    if ($('venture-detail-overlay')) return;

    const el = document.createElement('div');
    el.innerHTML = `
<div id="venture-detail-overlay" class="vd-overlay">
  <div class="vd-drawer" role="dialog" aria-modal="true" aria-labelledby="vd-venture-name">
    <!-- Header -->
    <div class="vd-header" id="vd-header">
      <div class="vd-header-main">
        <div class="vd-venture-name" id="vd-venture-name">—</div>
        <div class="vd-venture-slug" id="vd-venture-slug"></div>
        <div class="vd-header-badges" id="vd-header-badges"></div>
        <div class="vd-header-meta" id="vd-header-meta"></div>
      </div>
      <button class="vd-close-btn" id="vd-close-btn" aria-label="Close detail drawer" title="Close (Esc)">×</button>
    </div>
    <!-- Body -->
    <div class="vd-body" id="vd-body">
      <div class="vd-loading" id="vd-loading">Loading venture details…</div>
    </div>
    <!-- Keyboard hints -->
    <div class="vd-kbd-hints">
      <span class="kbd-hint">Esc</span><span>close</span>
      <span class="kbd-hint">↑↓</span><span>navigate list</span>
      <span class="kbd-hint">←→</span><span>prev/next venture</span>
    </div>
  </div>
</div>`;
    document.body.appendChild(el.firstElementChild);

    // Wire close button
    $('vd-close-btn').addEventListener('click', close);

    // Click backdrop to close
    $('venture-detail-overlay').addEventListener('click', (e) => {
      if (e.target === $('venture-detail-overlay')) close();
    });
  }

  // ---------------------------------------------------------------------------
  // Open / Close
  // ---------------------------------------------------------------------------

  async function open(ventureId) {
    ensureDrawerExists();

    state.ventureId = ventureId;
    state.open = true;
    state.data = null;
    state.timeFilter = 'all';
    state.showAllActivity = false;

    // Reset header placeholders
    $('vd-venture-name').textContent = ventureId;
    $('vd-venture-slug').textContent = `#${ventureId}`;
    $('vd-header-badges').innerHTML = '';
    $('vd-header-meta').innerHTML   = '';
    $('vd-body').innerHTML = '<div class="vd-loading">Loading venture details…</div>';

    // Show overlay
    $('venture-detail-overlay').classList.add('open');

    // Fetch
    try {
      const resp = await fetch(`/api/ventures/${encodeURIComponent(ventureId)}`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const data = await resp.json();
      if (!data || (!data.venture && !data.venture_id)) {
        throw new Error('Empty or malformed response from API');
      }
      state.data = data;
      renderAll(data);
    } catch (err) {
      console.error('[VD] Fetch error:', err);
      renderError(err.message, ventureId);
    }
  }

  function close() {
    state.open   = false;
    state.data   = null;
    state.ventureId = null;

    const overlay = $('venture-detail-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function isOpen() { return state.open; }

  // ---------------------------------------------------------------------------
  // Error render
  // ---------------------------------------------------------------------------

  function renderError(message, ventureId) {
    $('vd-body').innerHTML = `
      <div class="vd-error-banner">
        <span>⚠️ Failed to load venture detail — ${escHtml(message)}</span>
        <button class="vd-retry-btn" onclick="VentureDetailDrawer.open('${escHtml(ventureId)}')">Retry</button>
      </div>
      <div class="vd-section">
        <div class="vd-no-data">Checked: <code>/api/ventures/${escHtml(ventureId)}</code></div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Full render
  // ---------------------------------------------------------------------------

  function renderAll(data) {
    renderHeader(data);
    const body = $('vd-body');
    if (!body) return;

    const sections = [
      renderOverviewSection(data),
      renderTimelineSection(data),
      renderArtifactsSection(data),
      renderWorkstreamsSection(data),
      renderBlockersSection(data),
      renderChecklistSection(data),
      renderMetricsSection(data)
    ].filter(Boolean);

    body.innerHTML = sections.join('');
    attachBodyHandlers(data);
  }

  // ---------------------------------------------------------------------------
  // Section 0: Header panel
  // ---------------------------------------------------------------------------

  function renderHeader(data) {
    const v  = data.venture  || {};
    const hd = data.header   || {};
    const name = v.name || v.venture_id || '—';

    $('vd-venture-name').textContent = name;
    $('vd-venture-slug').textContent = `#${v.venture_id || v.venture_id_alt || '—'}`;

    // Badges
    const stageBadge   = hd.stage_display
      ? `<span class="vd-stage-badge">${escHtml(hd.stage_display)}</span>` : '';
    const statusClass  = (v.status || 'active').toLowerCase();
    const statusBadge  = `<span class="vd-status-badge vd-status-${escHtml(statusClass)}">${escHtml(v.status || 'active')}</span>`;
    const healthClass  = (hd.health || v.health || 'healthy').toLowerCase();
    const healthLabel  = healthClass === 'critical' ? '⛔ critical'
                       : healthClass === 'warning'  ? '⚠️ warning'
                       : '✅ healthy';
    const healthBadge  = `<span class="vd-health-indicator vd-health-${escHtml(healthClass)}" title="${escHtml(hd.health_reason || '')}">${healthLabel}</span>`;
    $('vd-header-badges').innerHTML = stageBadge + statusBadge + healthBadge;

    // Meta row
    const owner    = v.owner || '—';
    const priority = v.priority || '—';
    const pClass   = `vd-priority-${(priority || 'low').toLowerCase()}`;
    const daysIn   = hd.days_in_stage != null ? hd.days_in_stage : '—';
    const luRel    = hd.lastUpdated ? relTime(hd.lastUpdated) : '';
    const luFmt    = hd.lastUpdated ? fmtTime(hd.lastUpdated) : '';
    const staleWarn = hd.stale_since_hours > 0.5 ? ' ⚠️' : '';

    $('vd-header-meta').innerHTML = `
      <span><strong>${escHtml(owner)}</strong> owner</span>
      <span class="${escHtml(pClass)}"><strong>${escHtml(priority)}</strong> priority</span>
      <span><strong>${daysIn}</strong> day${daysIn !== 1 ? 's' : ''} in stage</span>
      <span title="Last updated: ${escHtml(hd.lastUpdated || '')}">
        <strong>${escHtml(luFmt || luRel)}</strong> updated${staleWarn}
      </span>`;
  }

  // ---------------------------------------------------------------------------
  // Section 1: Overview (description + tags + notes)
  // ---------------------------------------------------------------------------

  function renderOverviewSection(data) {
    const v = data.venture || {};
    const desc = v.description;
    const tags = v.tags || [];
    const notes = v.notes;

    if (!desc && !tags.length && !notes) return null;

    const src = (data.sources && data.sources.venture) || 'venture_scoreboard.json';

    let html = `<div class="vd-section">
      <div class="vd-section-header">
        <span class="vd-section-title">Overview</span>
        ${freshnessHtml(src)}
      </div>`;

    if (desc) {
      html += `<div style="font-size:12px;color:var(--text-secondary,#8aa0b0);line-height:1.6;margin-bottom:10px;">${escHtml(desc)}</div>`;
    }
    if (tags.length > 0) {
      html += `<div class="vd-tags">${tags.map(t => `<span class="vd-tag">${escHtml(t)}</span>`).join('')}</div>`;
    }
    if (notes) {
      html += `<div style="margin-top:10px;">
        <div class="vd-section-title" style="margin-bottom:6px;">Notes</div>
        <div class="vd-notes-text">${escHtml(notes)}</div>
      </div>`;
    }

    html += `${sourceRowHtml(src)}</div>`;
    return html;
  }

  // ---------------------------------------------------------------------------
  // Section 2: Timeline (activity, with time filter)
  // ---------------------------------------------------------------------------

  function getFilteredActivity(data, timeFilter) {
    const recent = (data.timeline && data.timeline.recent) || data.recent_activity || [];
    if (!timeFilter || timeFilter === 'all') return recent;

    const cutoffMap = { '24h': 24 * 3600000, '7d': 7 * 24 * 3600000, '30d': 30 * 24 * 3600000 };
    const cutoff = Date.now() - (cutoffMap[timeFilter] || 0);
    return recent.filter(e => e.timestamp && new Date(e.timestamp).getTime() >= cutoff);
  }

  function renderTimelineSection(data) {
    const tlData = data.timeline || {};
    const srcStr = (data.sources && data.sources.activity) || tlData.sources || 'agent_activity.json';
    const allEntries = getFilteredActivity(data, state.timeFilter);
    const total = tlData.total_entries || 0;

    const filterBtns = ['24h', '7d', '30d', 'all'].map(f =>
      `<button class="vd-time-filter-btn${state.timeFilter === f ? ' active' : ''}"
               data-filter="${f}">${f}</button>`
    ).join('');

    let itemsHtml = '';
    if (allEntries.length === 0) {
      itemsHtml = `<div class="vd-section-empty vd-no-data">
        No activity in this time range — checked ${escHtml(srcStr.split(' (')[0])}
      </div>`;
    } else {
      const displayEntries = state.showAllActivity ? allEntries : allEntries.slice(0, ACTIVITY_LIMIT);
      itemsHtml = `<div class="vd-timeline-list" id="vd-timeline-list">
        ${displayEntries.map(e => renderTimelineItem(e)).join('')}
      </div>`;

      if (!state.showAllActivity && allEntries.length > ACTIVITY_LIMIT) {
        itemsHtml += `<span class="vd-show-all-link" id="vd-show-all-activity">
          Show all ${allEntries.length} entries
        </span>`;
      }
    }

    return `<div class="vd-section" id="vd-timeline-section">
      <div class="vd-section-header">
        <span class="vd-section-title">Timeline</span>
        <span class="vd-section-count">${total > 0 ? `${allEntries.length} of ${total}` : allEntries.length}</span>
        ${freshnessHtml(srcStr)}
      </div>
      <div class="vd-timeline-filters" id="vd-timeline-filters">${filterBtns}</div>
      ${itemsHtml}
      ${sourceRowHtml(srcStr)}
    </div>`;
  }

  function renderTimelineItem(e) {
    const sev = (e.severity || 'info').toLowerCase();
    const agentLine = e.agent ? `<div class="vd-timeline-agent">${escHtml(e.agent)}</div>` : '';
    const descLine = e.description
      ? `<div class="vd-timeline-desc">${escHtml(e.description)}</div>` : '';
    return `<div class="vd-timeline-item sev-${escHtml(sev)}">
      <span class="vd-sev-badge vd-sev-${escHtml(sev)}">${sev}</span>
      <div class="vd-timeline-body">
        ${agentLine}
        <div class="vd-timeline-action">${escHtml(e.action || '—')}</div>
        ${descLine}
      </div>
      <div class="vd-timeline-ts" title="${escHtml(e.timestamp || '')}">
        ${relTime(e.timestamp)}
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // Section 3: Artifacts & Links
  // ---------------------------------------------------------------------------

  function renderArtifactsSection(data) {
    const v    = data.venture || {};
    const arts = v.artifacts  || {};
    const srcStr = (data.sources && data.sources.venture) || 'venture_scoreboard.json';

    const defs = [
      { icon: '📝', label: 'PRD',      key: 'prd',      val: arts.prd  },
      { icon: '📋', label: 'CR',       key: 'cr',       val: arts.cr   },
      { icon: '📁', label: 'Repo',     key: 'repo',     val: arts.repo },
      { icon: '💡', label: 'Proposal', key: 'proposal', val: arts.proposal },
      { icon: '🌐', label: 'Demo',     key: 'demo',     val: arts.demo }
    ];

    const hasAny = defs.some(d => d.val);

    let html = `<div class="vd-section">
      <div class="vd-section-header">
        <span class="vd-section-title">Artifacts &amp; Links</span>
        ${freshnessHtml(srcStr)}
      </div>`;

    if (!hasAny) {
      html += `<div class="vd-section-empty vd-no-data">No artifacts linked yet — checked ${escHtml(srcStr.split(' (')[0])}</div>`;
    } else {
      html += `<div class="vd-artifacts-list">`;
      defs.forEach(def => {
        const hasVal = !!(def.val);
        html += `<div class="vd-artifact-row">
          <span class="vd-artifact-icon">${def.icon}</span>
          <span class="vd-artifact-label">${def.label}</span>
          <span class="vd-artifact-path${hasVal ? '' : ' not-set'}"
                title="${escHtml(def.val || 'Not set')}">${escHtml(def.val || 'Not available')}</span>
          ${hasVal ? `<button class="vd-copy-btn" data-copy="${escHtml(def.val)}" aria-label="Copy ${def.label} path">Copy</button>` : ''}
        </div>`;
      });
      html += `</div>`;
    }

    html += `${sourceRowHtml(srcStr)}</div>`;
    return html;
  }

  // ---------------------------------------------------------------------------
  // Section 4: Workstreams
  // ---------------------------------------------------------------------------

  function renderWorkstreamsSection(data) {
    const workstreams = data.workstreams || data.related_workstreams || [];
    const srcStr = (data.sources && data.sources.workstreams) || 'venture_work_links.json + workstreams.json';

    let html = `<div class="vd-section">
      <div class="vd-section-header">
        <span class="vd-section-title">Workstreams</span>
        <span class="vd-section-count">${workstreams.length}</span>
        ${freshnessHtml(srcStr)}
      </div>`;

    if (workstreams.length === 0) {
      html += `<div class="vd-section-empty vd-no-data">No workstreams linked — checked ${escHtml(srcStr.split(' +')[0])}</div>`;
    } else {
      html += `<div class="vd-workstream-list">`;
      workstreams.forEach(ws => {
        const pct   = ws.percent_complete != null ? ws.percent_complete : null;
        const pctLbl = pct != null ? `${Math.round(pct * (pct > 1 ? 1 : 100))}%` : '—';
        const pctNum = pct != null ? (pct > 1 ? pct : pct * 100) : 0;
        const etaLbl = ws.eta ? fmtDate(ws.eta) : '—';
        const assignee = ws.assigned_to || ws.assignee || '—';
        const phase = ws.phase || ws.status || '—';
        const lastEv = ws.last_event || null;
        const lastEvStr = typeof lastEv === 'string' ? lastEv
          : (lastEv && lastEv.action) ? `${lastEv.action} (${relTime(lastEv.timestamp)})` : null;

        html += `<div class="vd-workstream-item">
          <div class="vd-ws-header">
            <span class="vd-ws-name">${escHtml(ws.name || ws.workstream_id || '—')}</span>
            ${pct != null ? `<span class="vd-ws-pct">${escHtml(pctLbl)}</span>` : ''}
          </div>
          ${pct != null ? `<div class="vd-ws-progress"><div class="vd-ws-progress-fill" style="width:${Math.min(100, pctNum)}%"></div></div>` : ''}
          <div class="vd-ws-meta">
            <span>${escHtml(phase)}</span>
            <span>Owner: ${escHtml(assignee)}</span>
            <span>ETA: ${escHtml(etaLbl)}</span>
            ${lastEvStr ? `<span>${escHtml(lastEvStr)}</span>` : ''}
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `${sourceRowHtml(srcStr)}</div>`;
    return html;
  }

  // ---------------------------------------------------------------------------
  // Section 5: Blockers
  // ---------------------------------------------------------------------------

  function renderBlockersSection(data) {
    const blockers = data.blockers || [];
    const srcStr   = (data.sources && data.sources.blockers) || 'blocked_work.json';

    let html = `<div class="vd-section">
      <div class="vd-section-header">
        <span class="vd-section-title">Blockers</span>
        <span class="vd-section-count">${blockers.length}</span>
        ${freshnessHtml(srcStr)}
      </div>`;

    if (blockers.length === 0) {
      html += `<div class="vd-unblocked">✅ No blockers — this venture is unblocked</div>`;
    } else {
      html += `<div class="vd-blocker-list">`;
      blockers.forEach(b => {
        const sev = (b.severity || 'info').toLowerCase();
        const blocked_class = `vd-blocker-${sev === 'critical' ? 'critical' : sev === 'warning' ? 'warning' : 'info'}`;
        const slaLbl = b.sla_overdue
          ? `Overdue ${Math.abs(b.sla_hours_remaining).toFixed(1)}h`
          : `${(b.sla_hours_remaining || 0).toFixed(1)}h left`;
        const slaClass = b.sla_overdue ? 'vd-sla-overdue' : 'vd-sla-ok';
        const owner = b.owner || '—';
        const type  = b.type  || '—';
        const created = b.created_at ? relTime(b.created_at) : '—';

        html += `<div class="vd-blocker-item ${blocked_class}">
          <div class="vd-blocker-header">
            <span class="vd-sev-badge vd-sev-${escHtml(sev)}">${sev}</span>
            <span class="vd-blocker-title">${escHtml(b.title || b.id || '—')}</span>
            <span class="vd-blocker-sla ${slaClass}">${escHtml(slaLbl)}</span>
          </div>
          <div class="vd-blocker-meta">
            <span>Type: ${escHtml(type)}</span>
            <span>Owner: ${escHtml(owner)}</span>
            <span>Created: ${escHtml(created)}</span>
          </div>
          ${b.next_action ? `<div class="vd-blocker-next">→ ${escHtml(b.next_action)}</div>` : ''}
        </div>`;
      });
      html += `</div>`;
    }

    html += `${sourceRowHtml(srcStr)}</div>`;
    return html;
  }

  // ---------------------------------------------------------------------------
  // Section 6: Checklist
  // ---------------------------------------------------------------------------

  function renderChecklistSection(data) {
    const cl   = data.checklist;
    const srcStr = (data.sources && data.sources.venture) || 'venture_scoreboard.json';

    if (!cl) {
      return `<div class="vd-section">
        <div class="vd-section-header"><span class="vd-section-title">Checklist</span></div>
        <div class="vd-no-data">No checklist data — checked ${escHtml(srcStr.split(' (')[0])}</div>
        ${sourceRowHtml(srcStr)}
      </div>`;
    }

    const pct  = cl.readiness_percent || 0;
    const items = cl.items || [];
    const pctClass = pct >= 100 ? ' complete' : '';

    let html = `<div class="vd-section">
      <div class="vd-section-header">
        <span class="vd-section-title">Phase Gate Checklist</span>
        <span class="vd-section-count">${escHtml(cl.current_phase || '—')}</span>
        ${freshnessHtml(srcStr)}
      </div>
      <div class="vd-readiness-bar-row">
        <div class="vd-readiness-bar">
          <div class="vd-readiness-fill${escHtml(pctClass)}" style="width:${pct}%"></div>
        </div>
        <div class="vd-readiness-pct">${pct}%</div>
      </div>
      <div class="vd-checklist-items">`;

    items.forEach(item => {
      let icon, cls;
      if (item.checked === true) {
        icon = '✅'; cls = 'vd-check-done';
      } else if (item.checked === null || item.checked === undefined) {
        icon = '○'; cls = 'vd-check-pending';
      } else if (typeof item.checked === 'number') {
        const pctItem = Math.round(item.checked * 100);
        icon = pctItem > 0 ? `◔<small>${pctItem}%</small>` : '○';
        cls  = 'vd-check-partial';
      } else {
        icon = '○'; cls = 'vd-check-pending';
      }

      const dateLbl = item.date ? fmtDate(item.date) : '';
      const pathLbl = item.path
        ? `<span class="vd-check-path" title="${escHtml(item.path)}">${escHtml(item.path)}</span>` : '';

      html += `<div class="vd-checklist-item ${cls}">
        <span class="vd-check-icon">${icon}</span>
        <span class="vd-check-name">${escHtml(item.name || '—')}</span>
        ${pathLbl}
        ${dateLbl ? `<span class="vd-check-date">${escHtml(dateLbl)}</span>` : ''}
      </div>`;
    });

    html += `</div>${sourceRowHtml(srcStr)}</div>`;
    return html;
  }

  // ---------------------------------------------------------------------------
  // Section 7: Metrics
  // ---------------------------------------------------------------------------

  function renderMetricsSection(data) {
    const metrics = data.metrics;
    const srcStr = (data.sources && data.sources.velocity) || 'venture_scoreboard.json + venture_velocity.json';

    if (!metrics) {
      return `<div class="vd-section">
        <div class="vd-section-header"><span class="vd-section-title">Metrics</span></div>
        <div class="vd-no-data">No venture metrics yet — checked venture_scoreboard.json</div>
        ${sourceRowHtml(srcStr)}
      </div>`;
    }

    let html = `<div class="vd-section">
      <div class="vd-section-header">
        <span class="vd-section-title">Metrics &amp; KPIs</span>
        ${freshnessHtml(srcStr)}
      </div>`;

    // Success targets
    const targets = metrics.targets || {};
    const hasTargets = Object.keys(targets).length > 0;
    if (hasTargets) {
      html += `<div class="vd-metrics-subsection">
        <div class="vd-metrics-subtitle">Success Targets</div>
        <div class="vd-metrics-grid">`;

      if (targets.accuracy != null) {
        html += metricCard('Accuracy', `${(targets.accuracy * 100).toFixed(0)}%`);
      }
      if (targets.nps != null) {
        html += metricCard('NPS Target', targets.nps);
      }
      if (targets.customers != null) {
        html += metricCard('Customers', targets.customers);
      }
      if (targets.mrr != null) {
        html += metricCard('MRR Target', `$${Number(targets.mrr).toLocaleString()}`);
      }

      html += `</div></div>`;
    }

    // Execution metrics
    const exec = metrics.execution || {};
    const hasExec = Object.keys(exec).filter(k => exec[k] != null).length > 0;
    if (hasExec) {
      html += `<div class="vd-metrics-subsection">
        <div class="vd-metrics-subtitle">Execution</div>
        <div class="vd-metrics-grid">`;

      if (exec.time_to_mvp_weeks != null) {
        html += metricCard('MVP Timeline', `${exec.time_to_mvp_weeks}w`);
      }
      if (exec.days_in_stage != null) {
        html += metricCard('Days in Stage', exec.days_in_stage);
      }
      if (exec.deploy_count != null) {
        html += metricCard('Deploys', exec.deploy_count);
      }
      if (exec.incident_count != null) {
        html += metricCard('Incidents', exec.incident_count);
      }

      html += `</div></div>`;
    }

    if (!hasTargets && !hasExec) {
      html += `<div class="vd-no-data">No metrics data found in source files</div>`;
    }

    html += `${sourceRowHtml(srcStr)}</div>`;
    return html;
  }

  function metricCard(name, value) {
    return `<div class="vd-metric-card">
      <div class="vd-metric-name">${escHtml(name)}</div>
      <div class="vd-metric-value">${escHtml(String(value))}</div>
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // Event handlers attached after render
  // ---------------------------------------------------------------------------

  function attachBodyHandlers(data) {
    // Time filter buttons
    const filterBtns = document.querySelectorAll('.vd-time-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.timeFilter = btn.dataset.filter || 'all';
        state.showAllActivity = false;
        // Re-render only the timeline section
        const section = document.getElementById('vd-timeline-section');
        if (section) {
          const newHtml = renderTimelineSection(data);
          const tmpDiv = document.createElement('div');
          tmpDiv.innerHTML = newHtml;
          section.replaceWith(tmpDiv.firstElementChild);
          // Re-attach filter handlers
          attachBodyHandlers(data);
        }
      });
    });

    // Show all activity
    const showAll = document.getElementById('vd-show-all-activity');
    if (showAll) {
      showAll.addEventListener('click', () => {
        state.showAllActivity = true;
        const section = document.getElementById('vd-timeline-section');
        if (section) {
          const newHtml = renderTimelineSection(data);
          const tmpDiv = document.createElement('div');
          tmpDiv.innerHTML = newHtml;
          section.replaceWith(tmpDiv.firstElementChild);
          attachBodyHandlers(data);
        }
      });
    }

    // Copy buttons (artifacts)
    document.querySelectorAll('.vd-copy-btn[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1500);
        }).catch(err => console.error('[VD] Copy failed:', err));
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Keyboard Navigation
  // ---------------------------------------------------------------------------

  function handleKeyDown(e) {
    if (!state.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.VentureDetailDrawer = {
    open,
    close,
    isOpen,
    // Exposed for testing
    _state: state,
    _renderHeader: renderHeader,
    _renderTimelineSection: renderTimelineSection,
    _filterActivityByVenture: getFilteredActivity
  };

  console.log('[VentureDetailDrawer] Initialized');

})();
