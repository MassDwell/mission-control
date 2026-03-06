/**
 * VentureOS Panel — CR-VENTUREOS-V1
 * Renders the VentureOS pipeline widget + at-risk alerts in Mission Control.
 *
 * Endpoints consumed:
 *   GET /api/venture-pipeline      — stage distribution
 *   GET /api/venture-at-risk       — at-risk ventures
 *   GET /api/ventureos/ventures    — venture list
 */

(function (global) {
  'use strict';

  const STAGE_LABELS = {
    opportunity:    'Opportunity',
    investigation:  'Investigation',
    approval:       'Approval',
    implementation: 'Implementation',
    launch:         'Launch',
    killed:         'Killed'
  };

  const STAGE_COLORS = {
    opportunity:    '#6366f1',
    investigation:  '#8b5cf6',
    approval:       '#f59e0b',
    implementation: '#3b82f6',
    launch:         '#10b981',
    killed:         '#ef4444'
  };

  // ── Utilities ──────────────────────────────────────────────────────────

  function el(tag, cls, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function fmt(n) { return n == null ? '—' : Number(n).toLocaleString(); }
  function fmtPct(n) { return n == null ? '—' : `${(n * 100).toFixed(0)}%`; }

  // ── Pipeline Widget ────────────────────────────────────────────────────

  async function renderPipelineWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="vos-loading">Loading VentureOS pipeline…</div>';

    try {
      const [pipeRes, atRiskRes] = await Promise.all([
        fetch('/api/venture-pipeline'),
        fetch('/api/venture-at-risk')
      ]);

      const pipeline = pipeRes.ok ? await pipeRes.json() : null;
      const riskData = atRiskRes.ok ? await atRiskRes.json() : { at_risk: [], total: 0 };

      if (!pipeline) {
        container.innerHTML = '<div class="vos-error">⚠ VentureOS pipeline unavailable</div>';
        return;
      }

      const stages  = pipeline.stages || {};
      const metrics = pipeline.metrics || {};
      const atRisk  = riskData.at_risk || [];

      let html = `
        <div class="vos-pipeline">
          <div class="vos-header">
            <span class="vos-title">🚀 VentureOS Pipeline</span>
            <span class="vos-meta">
              Total: <strong>${fmt(pipeline.total)}</strong> &nbsp;|&nbsp;
              Active: <strong>${fmt(pipeline.active)}</strong> &nbsp;|&nbsp;
              Success Rate: <strong>${fmtPct(pipeline.success_rate)}</strong>
            </span>
          </div>
          <div class="vos-stages">
      `;

      const stageOrder = ['opportunity', 'investigation', 'approval', 'implementation', 'launch', 'killed'];
      stageOrder.forEach(key => {
        const count = stages[key] || 0;
        const color = STAGE_COLORS[key];
        const label = STAGE_LABELS[key];
        html += `
          <div class="vos-stage" style="border-top: 3px solid ${color}" data-stage="${key}">
            <div class="vos-stage-label">${label}</div>
            <div class="vos-stage-count" style="color:${color}">${count}</div>
          </div>
        `;
      });

      html += `</div>`;

      // Portfolio metrics row
      html += `
        <div class="vos-metrics">
          <div class="vos-metric"><span class="vos-metric-label">Portfolio MRR</span><span class="vos-metric-val">$${fmt(metrics.portfolio_mrr)}</span></div>
          <div class="vos-metric"><span class="vos-metric-label">MRR Target</span><span class="vos-metric-val">$${fmt(metrics.portfolio_mrr_target)}</span></div>
          <div class="vos-metric"><span class="vos-metric-label">Kill Rate</span><span class="vos-metric-val">${fmtPct(metrics.kill_rate)}</span></div>
        </div>
      `;

      // At-risk alerts
      if (atRisk.length > 0) {
        html += `<div class="vos-atrisk-header">⚠ At-Risk Ventures (${atRisk.length})</div><div class="vos-atrisk-list">`;
        atRisk.forEach(v => {
          const badge = v.highest_severity === 'critical'
            ? '<span class="vos-badge vos-critical">CRITICAL</span>'
            : '<span class="vos-badge vos-warning">WARNING</span>';
          html += `
            <div class="vos-atrisk-item">
              ${badge} <strong>${v.name}</strong> (${v.stage})
              <ul class="vos-risk-reasons">
                ${v.risks.map(r => `<li>${r.description}</li>`).join('')}
              </ul>
            </div>
          `;
        });
        html += `</div>`;
      }

      html += `</div>`; // close vos-pipeline

      container.innerHTML = html;

      // Click stage → filter ventures (wires into existing drilldown if available)
      container.querySelectorAll('.vos-stage[data-stage]').forEach(stageEl => {
        stageEl.style.cursor = 'pointer';
        stageEl.addEventListener('click', () => {
          const stage = stageEl.dataset.stage;
          if (window.VentureOS && window.VentureOS.onStageClick) {
            window.VentureOS.onStageClick(stage);
          }
        });
      });

    } catch (err) {
      console.error('[VentureOS] Pipeline widget error:', err);
      container.innerHTML = `<div class="vos-error">⚠ Error loading VentureOS: ${err.message}</div>`;
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('ventureos-styles')) return;
    const style = document.createElement('style');
    style.id = 'ventureos-styles';
    style.textContent = `
      .vos-loading, .vos-error { padding: 12px; color: #94a3b8; font-size: 13px; }
      .vos-error { color: #ef4444; }
      .vos-pipeline { padding: 12px; }
      .vos-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px; }
      .vos-title { font-weight: 700; font-size: 14px; color: #e2e8f0; }
      .vos-meta { font-size: 12px; color: #94a3b8; }
      .vos-stages { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
      .vos-stage { flex: 1; min-width: 80px; background: rgba(255,255,255,0.04); border-radius: 6px; padding: 10px 8px; text-align: center; transition: background 0.15s; }
      .vos-stage:hover { background: rgba(255,255,255,0.08); }
      .vos-stage-label { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
      .vos-stage-count { font-size: 22px; font-weight: 700; }
      .vos-metrics { display: flex; gap: 12px; background: rgba(255,255,255,0.03); border-radius: 6px; padding: 10px 12px; margin-bottom: 10px; flex-wrap: wrap; }
      .vos-metric { display: flex; flex-direction: column; gap: 2px; }
      .vos-metric-label { font-size: 11px; color: #64748b; }
      .vos-metric-val { font-size: 14px; font-weight: 600; color: #e2e8f0; }
      .vos-atrisk-header { font-size: 12px; font-weight: 700; color: #f59e0b; margin: 8px 0 6px; }
      .vos-atrisk-list { display: flex; flex-direction: column; gap: 8px; }
      .vos-atrisk-item { background: rgba(239,68,68,0.08); border-left: 3px solid #ef4444; padding: 8px 10px; border-radius: 0 6px 6px 0; font-size: 12px; }
      .vos-atrisk-item strong { color: #e2e8f0; }
      .vos-risk-reasons { margin: 4px 0 0 16px; padding: 0; color: #94a3b8; }
      .vos-risk-reasons li { margin-bottom: 2px; }
      .vos-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; margin-right: 4px; }
      .vos-critical { background: #7f1d1d; color: #fca5a5; }
      .vos-warning  { background: #78350f; color: #fcd34d; }
    `;
    document.head.appendChild(style);
  }

  // ── Public API ─────────────────────────────────────────────────────────

  global.VentureOS = {
    init: function (containerId) {
      injectStyles();
      renderPipelineWidget(containerId || 'ventureos-pipeline-widget');
    },
    refresh: function (containerId) {
      renderPipelineWidget(containerId || 'ventureos-pipeline-widget');
    },
    onStageClick: null   // Can be overridden by host page
  };

})(window);
