/**
 * CR-MC-OPS-PANELS-UPGRADE: Workstream Flow Panel
 * Stage distribution visualization with hover tooltips
 */

'use strict';

(function WorkstreamFlowPanel() {
  let _stages       = [];
  let _total        = 0;
  const REFRESH_MS  = 10000;

  const $ = id => document.getElementById(id);

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    const container = $('workstream-flow-content');
    if (!container) return;

    container.innerHTML = `
      <div class="wf-panel" id="wf-panel">
        <div id="wf-stages-wrap">
          <div style="padding:10px;color:var(--text-muted);font-size:11px;">Loading flow data…</div>
        </div>
        <div class="wf-source" id="wf-source"></div>
      </div>
    `;

    fetchData();
    setInterval(fetchData, REFRESH_MS);
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      const res = await fetch('/api/workstream-flow');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      _stages = data.stages || [];
      _total  = data.total  || 0;
      renderFlow(data);
    } catch (err) {
      const wrap = $('wf-stages-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div class="wf-error">
            ⚠ Failed to load flow data: ${escHtml(err.message)}
            <button style="background:none;border:1px solid currentColor;border-radius:3px;color:inherit;cursor:pointer;font-size:10px;padding:2px 6px;margin-left:8px;"
                    onclick="window.WorkstreamFlow?.refresh()">Retry</button>
          </div>`;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderFlow(data) {
    const wrap = $('wf-stages-wrap');
    if (!wrap) return;

    if (_stages.length === 0) {
      wrap.innerHTML = `<div class="wf-empty">No workstream data available<br><span style="font-size:10px;color:var(--text-muted)">Checked: workstreams.json</span></div>`;
      return;
    }

    // Total row
    let html = `<div class="wf-total">${_total} total workstream${_total === 1 ? '' : 's'}</div>`;

    // Stage grid
    html += `<div class="wf-stages" id="wf-stages">`;

    _stages.forEach((stage, idx) => {
      const hasWork = stage.count > 0;
      const dots = hasWork
        ? Array.from({ length: Math.min(stage.count, 6) }, () =>
            `<div class="wf-dot"></div>`).join('')
        : '';

      html += `
        <div class="wf-stage" data-stage-idx="${idx}"
             role="button" tabindex="0"
             aria-label="${escHtml(stage.name)}: ${stage.count} workstreams"
             aria-expanded="false">
          <div class="wf-stage-name">${escHtml(stage.name)}</div>
          <div class="wf-stage-count ${hasWork ? 'has-work' : ''}">${stage.count}</div>
          <div class="wf-stage-label">WS</div>
          <div class="wf-stage-dots">${dots}</div>
          <!-- Tooltip injected on hover -->
        </div>
      `;

      // Add connector (not after last)
      if (idx < _stages.length - 1) {
        html += `<div class="wf-connector">→</div>`;
      }
    });

    html += `</div>`;

    wrap.innerHTML = html;

    // Bind hover/click on stages
    const stagesEl = $('wf-stages');
    if (stagesEl) {
      stagesEl.addEventListener('mouseover', onStageHover);
      stagesEl.addEventListener('mouseout',  onStageOut);
      stagesEl.addEventListener('click',     onStageClick);
      stagesEl.addEventListener('keydown',   onStageKeydown);
    }

    // Source
    const sourceEl = $('wf-source');
    if (sourceEl && data.sources) {
      const mainTs = data.sources.workstreams?.lastUpdated;
      const tsStr = mainTs
        ? new Date(mainTs).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        : 'unknown';
      sourceEl.textContent = `workstreams.json · last updated ${tsStr}`;
    }
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────
  // Track hovered stage for tooltip management
  // Tooltip stage tracking

  function onStageHover(e) {
    const stageEl = e.target.closest('.wf-stage');
    if (!stageEl) return;

    // Remove existing tooltip
    stageEl.querySelector('.wf-tooltip')?.remove();

    const idx = parseInt(stageEl.dataset.stageIdx, 10);
    const stage = _stages[idx];
    if (!stage) return;



    const tooltip = document.createElement('div');
    tooltip.className = 'wf-tooltip';
    tooltip.setAttribute('role', 'tooltip');

    let ttHtml = `<div class="wf-tooltip-title">${escHtml(stage.name)}</div>`;

    if (stage.count === 0) {
      ttHtml += `<div class="wf-tooltip-empty">No workstreams in this stage</div>`;
    } else {
      if (stage.ventures.length > 0) {
        ttHtml += stage.ventures.map(v =>
          `<div class="wf-tooltip-item venture">🏢 ${escHtml(v)}</div>`
        ).join('');
      }
      if (stage.workstreams.length > 0) {
        ttHtml += stage.workstreams.map(ws =>
          `<div class="wf-tooltip-item">· ${escHtml(ws)}</div>`
        ).join('');
      }
    }

    tooltip.innerHTML = ttHtml;
    stageEl.appendChild(tooltip);
    stageEl.classList.add('hovered');
    stageEl.setAttribute('aria-expanded', 'true');
  }

  function onStageOut(e) {
    const stageEl = e.target.closest('.wf-stage');
    if (!stageEl) return;

    // Small delay to avoid flicker
    setTimeout(() => {
      if (!stageEl.matches(':hover')) {
        stageEl.querySelector('.wf-tooltip')?.remove();
        stageEl.classList.remove('hovered');
        stageEl.setAttribute('aria-expanded', 'false');

      }
    }, 100);
  }

  function onStageClick(e) {
    const stageEl = e.target.closest('.wf-stage');
    if (!stageEl) return;

    const idx = parseInt(stageEl.dataset.stageIdx, 10);
    const stage = _stages[idx];
    if (!stage || stage.count === 0) return;

    // Open Active Work panel filtered to this stage (if available)
    if (window.ActiveWork?.filterByStage) {
      window.ActiveWork.filterByStage(stage.name);
    }
    // Otherwise, emit custom event
    document.dispatchEvent(new CustomEvent('wf-stage-click', { detail: { stage } }));
  }

  function onStageKeydown(e) {
    const stageEl = e.target.closest('.wf-stage');
    if (!stageEl) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStageClick(e);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
  window.WorkstreamFlow = { refresh, init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
