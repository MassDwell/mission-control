/**
 * CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS
 * Frontend Command Bus Client
 *
 * ALL UI-initiated operator actions go through this client.
 * NO direct state mutations. Clawson is sole executor.
 *
 * Flow:
 *   1. UI calls CommandBusClient.submit(action)
 *   2. Client shows confirmation modal (for high-impact actions)
 *   3. Client POSTs to /api/command-bus/submit
 *   4. Client shows "Queued → Executing → Executed" feedback
 *   5. Duplicate detection shows channel-aware message
 */

(function(window) {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────

  const HIGH_IMPACT_ACTIONS = [
    'kill_venture',
    'advance_stage',
    'clear_blocker',
    'spawn_workstream',
    'trigger_experiment',
  ];

  const ACTION_LABELS = {
    pause_venture:       'Pause Venture',
    resume_venture:      'Resume Venture',
    advance_stage:       'Advance Stage',
    kill_venture:        'Kill Venture',
    spawn_workstream:    'Spawn Workstream',
    assign_agent:        'Assign Agent',
    clear_blocker:       'Clear Blocker',
    complete_workstream: 'Complete Workstream',
    reopen_workstream:   'Reopen Workstream',
    trigger_experiment:  'Trigger Experiment',
    approve_decision:    'Approve Decision',
    reject_decision:     'Reject Decision',
  };

  const ACTION_CONSEQUENCES = {
    kill_venture:       'This venture will be permanently marked as killed. This is a significant decision.',
    advance_stage:      'The venture will advance to the next pipeline stage. Ensure gate requirements are met.',
    clear_blocker:      'This blocker will be cleared and removed from the active blockers list.',
    spawn_workstream:   'A new workstream will be created and assigned to the specified agent.',
    trigger_experiment: 'An experiment will be triggered for this venture. Agent resources will be allocated.',
    pause_venture:      'The venture will be paused. All active workstreams will be put on hold.',
    resume_venture:     'The venture will resume. Workstreams will become active again.',
    assign_agent:       'The selected agent will be assigned to this workstream.',
    complete_workstream:'This workstream will be marked as complete.',
    reopen_workstream:  'This workstream will be reopened and set to active status.',
    approve_decision:   'This decision gate will be approved, unblocking the next action.',
    reject_decision:    'This decision gate will be rejected.',
  };

  // ─── State ──────────────────────────────────────────────────────────────────

  let pendingSubmission = null;   // Action waiting for confirmation
  let statusPollerTimer = null;   // Timer for polling action status

  // ─── Modal Management ────────────────────────────────────────────────────────

  function ensureModalExists() {
    if (document.getElementById('cb-confirm-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'cb-confirm-modal';
    modal.className = 'cb-modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="cb-modal">
        <div class="cb-modal-header">
          <span class="cb-modal-icon" id="cb-modal-icon">⚡</span>
          <span class="cb-modal-title" id="cb-modal-title">Confirm Action</span>
        </div>
        <div class="cb-modal-body">
          <div class="cb-modal-target" id="cb-modal-target"></div>
          <div class="cb-modal-consequence" id="cb-modal-consequence"></div>
          <div class="cb-modal-extra" id="cb-modal-extra"></div>
        </div>
        <div class="cb-modal-footer">
          <button class="cb-btn-cancel" id="cb-btn-cancel">Cancel</button>
          <button class="cb-btn-confirm" id="cb-btn-confirm">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cb-btn-cancel').addEventListener('click', cancelAction);
    document.getElementById('cb-btn-confirm').addEventListener('click', confirmAction);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cancelAction();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') cancelAction();
    });
  }

  function ensureStatusBannerExists() {
    if (document.getElementById('cb-status-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cb-status-banner';
    banner.className = 'cb-status-banner';
    banner.style.display = 'none';
    banner.innerHTML = `
      <div class="cb-status-content">
        <span class="cb-status-icon" id="cb-status-icon">⏳</span>
        <span class="cb-status-text" id="cb-status-text">Queuing action...</span>
        <span class="cb-status-id" id="cb-status-id"></span>
        <button class="cb-status-close" id="cb-status-close" onclick="document.getElementById('cb-status-banner').style.display='none'">✕</button>
      </div>
    `;
    document.body.appendChild(banner);
  }

  function showConfirmModal(action) {
    ensureModalExists();

    const isHighImpact = HIGH_IMPACT_ACTIONS.includes(action.action_type);
    const label = ACTION_LABELS[action.action_type] || action.action_type;
    const consequence = ACTION_CONSEQUENCES[action.action_type] || '';

    const iconEl  = document.getElementById('cb-modal-icon');
    const titleEl = document.getElementById('cb-modal-title');
    const targetEl = document.getElementById('cb-modal-target');
    const consEl  = document.getElementById('cb-modal-consequence');
    const extraEl = document.getElementById('cb-modal-extra');
    const confirmBtn = document.getElementById('cb-btn-confirm');

    iconEl.textContent  = isHighImpact ? '⚠️' : '⚡';
    titleEl.textContent = label;
    targetEl.innerHTML  = `<strong>Target:</strong> ${escHtml(action.target_id)}`;
    consEl.textContent  = consequence;

    // Extra payload info
    let extraHtml = '';
    if (action.payload) {
      const pairs = Object.entries(action.payload)
        .filter(([k]) => !['actor'].includes(k))
        .map(([k, v]) => `<span><strong>${escHtml(k)}:</strong> ${escHtml(String(v))}</span>`);
      if (pairs.length) extraHtml = `<div class="cb-modal-payload">${pairs.join('')}</div>`;
    }
    extraEl.innerHTML = extraHtml;

    confirmBtn.className = isHighImpact ? 'cb-btn-confirm danger' : 'cb-btn-confirm';
    confirmBtn.textContent = isHighImpact ? `⚠️ ${label}` : `Confirm`;

    const modal = document.getElementById('cb-confirm-modal');
    modal.style.display = 'flex';
  }

  function hideConfirmModal() {
    const modal = document.getElementById('cb-confirm-modal');
    if (modal) modal.style.display = 'none';
  }

  function showStatusBanner(text, type = 'info', actionId = '') {
    ensureStatusBannerExists();

    const icons = { info: '⏳', success: '✅', error: '❌', warning: '⚠️', duplicate: '🔁' };
    const banner   = document.getElementById('cb-status-banner');
    const iconEl   = document.getElementById('cb-status-icon');
    const textEl   = document.getElementById('cb-status-text');
    const idEl     = document.getElementById('cb-status-id');

    iconEl.textContent  = icons[type] || '⚡';
    textEl.textContent  = text;
    idEl.textContent    = actionId ? `ID: ${actionId.slice(0, 8)}…` : '';
    banner.className    = `cb-status-banner cb-status-${type}`;
    banner.style.display = 'flex';

    if (type === 'success') {
      setTimeout(() => { if (banner) banner.style.display = 'none'; }, 5000);
    }
  }

  // ─── Action Submission ───────────────────────────────────────────────────────

  function cancelAction() {
    pendingSubmission = null;
    hideConfirmModal();
  }

  async function confirmAction() {
    if (!pendingSubmission) return;
    hideConfirmModal();
    await executeSubmit(pendingSubmission);
    pendingSubmission = null;
  }

  async function executeSubmit(action) {
    showStatusBanner('Queueing action…', 'info');

    try {
      const res = await fetch('/api/command-bus/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(action)
      });

      const data = await res.json();

      if (data.status === 'duplicate') {
        showStatusBanner(
          `Action already queued from ${data.duplicate_source || 'another channel'} — Status: ${data.existing?.status || 'queued'}`,
          'duplicate',
          data.duplicate_of
        );
        return { duplicate: true, data };
      }

      if (data.status === 'queued') {
        showStatusBanner(`Queued → waiting for Clawson…`, 'info', data.action_id);

        // Start polling for execution status
        startStatusPoll(data.action_id, (finalAction) => {
          if (finalAction.status === 'executed') {
            showStatusBanner(`✓ ${ACTION_LABELS[finalAction.action_type] || finalAction.action_type} executed`, 'success', finalAction.id);
            // Dispatch update event for panels
            document.dispatchEvent(new CustomEvent('mc:action-executed', { detail: finalAction }));
          } else if (finalAction.status === 'failed') {
            showStatusBanner(`Failed: ${finalAction.result}`, 'error', finalAction.id);
          } else if (finalAction.status === 'rejected') {
            showStatusBanner(`Rejected: ${finalAction.result}`, 'warning', finalAction.id);
          }
        });

        return { queued: true, data };
      }

      showStatusBanner(`Error: ${data.message || 'Unknown error'}`, 'error');
      return { error: true, data };

    } catch (err) {
      showStatusBanner(`Network error: ${err.message}`, 'error');
      return { error: true, err };
    }
  }

  function startStatusPoll(actionId, callback) {
    if (statusPollerTimer) clearInterval(statusPollerTimer);

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 × 2s = 2 minutes max

    statusPollerTimer = setInterval(async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(statusPollerTimer);
        showStatusBanner('Timeout waiting for execution — check queue', 'warning', actionId);
        return;
      }

      try {
        const res = await fetch(`/api/command-bus/action/${actionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const action = data.action;

        if (['executed', 'rejected', 'failed'].includes(action.status)) {
          clearInterval(statusPollerTimer);
          callback(action);
        }
      } catch (err) { /* ignore poll errors */ }
    }, 2000);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Submit an operator action through the unified command bus.
   *
   * @param {object} params
   *   action_type:  string
   *   target_type:  string
   *   target_id:    string
   *   payload:      object (optional)
   *   operator:     string (default: 'Steve')
   *   skipConfirm:  bool (skip confirmation modal, for pre-confirmed actions)
   */
  function submit(params) {
    const action = {
      action_type:  params.action_type,
      target_type:  params.target_type || 'venture',
      target_id:    params.target_id,
      operator:     params.operator || 'Steve',
      source:       'mission_control',
      payload:      params.payload || {},
    };

    if (!params.skipConfirm && HIGH_IMPACT_ACTIONS.includes(action.action_type)) {
      pendingSubmission = action;
      showConfirmModal(action);
      return Promise.resolve({ pending_confirmation: true });
    }

    return executeSubmit(action);
  }

  /**
   * Get current queue stats from the server.
   */
  async function getStats() {
    try {
      const res = await fetch('/api/command-bus/stats');
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }

  /**
   * Get recent actions from the queue.
   */
  async function getQueue(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.limit)  params.set('limit',  options.limit);
    try {
      const res = await fetch(`/api/command-bus/queue?${params}`);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }

  // ─── HTML helpers ────────────────────────────────────────────────────────────

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Register global ─────────────────────────────────────────────────────────

  window.CommandBusClient = {
    submit,
    getStats,
    getQueue,
    HIGH_IMPACT_ACTIONS,
    ACTION_LABELS,
  };

})(window);
