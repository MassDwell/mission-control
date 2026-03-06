/**
 * CR-MC-PALANTIR: Operator Command Center
 * Phase 2: Venture commands (pause/kill/advance/spawn/assign)
 * CR-MC-OPERATOR-VISUAL-UNIFIED-COMMAND-BUS: All commands now route through
 * the unified command bus queue. NO direct state mutations.
 *
 * Commands:
 *  - Pause/Resume venture → queue
 *  - Kill venture (with reason) → queue (confirmation modal)
 *  - Advance stage → queue (confirmation modal)
 *  - Spawn workstream (modal form) → queue (confirmation modal)
 *  - Assign agent (modal form) → queue
 *  - Clear Blocker → queue
 *  - Mark Workstream Complete → queue
 *  - Reopen Workstream → queue
 *  - Trigger Experiment → queue
 *  - Approve/Reject Decision Gate → queue
 */

(function() {
  'use strict';

  let activeVentureId = null;
  let activeVenture   = null;
  let agents          = [];

  // ─── Helpers ──────────────────────────────────────────────────────────────

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      agents = data.agents || [];
      return agents;
    } catch { return []; }
  }

  async function fetchWorkstreams() {
    try {
      const res = await fetch('/api/workstreams');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.workstreams || [];
    } catch { return []; }
  }

  function setStatus(msg, type = '') {
    const el = document.getElementById('command-status');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'command-status' + (type ? ` ${type}-msg` : '');
    if (type) setTimeout(() => { el.textContent = ''; el.className = 'command-status'; }, 4000);
  }

  function showModal(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'flex'; el.classList.add('open'); }
  }

  function hideModal(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.classList.remove('open'); }
  }

  /**
   * Queue an action via the unified command bus.
   * Returns the queue result.
   * NO direct mutations — Clawson is sole executor.
   */
  async function queueAction(action_type, payload = {}, target_type = 'venture') {
    if (!activeVentureId && target_type === 'venture') {
      setStatus('No active venture', 'error');
      return null;
    }

    const target_id = payload._target_id || activeVentureId;
    delete payload._target_id;

    setStatus(`Queuing: ${action_type.replace(/_/g, ' ')}…`);

    try {
      const res = await fetch('/api/command-bus/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type,
          target_type,
          target_id,
          operator: 'Steve',
          source: 'mission_control',
          payload,
        })
      });
      const data = await res.json();

      if (data.status === 'duplicate') {
        setStatus(
          `Already queued from ${data.existing?.source || 'another channel'} — ID: ${(data.duplicate_of || '').slice(0,8)}…`,
          'error'
        );
        return data;
      }

      if (data.status === 'queued') {
        setStatus(`Queued → Clawson executing… (ID: ${data.action_id?.slice(0,8)})`, 'success');
        document.dispatchEvent(new CustomEvent('mc:action-queued', {
          detail: { action: data.action, action_id: data.action_id }
        }));
        return data;
      }

      setStatus(data.message || 'Unknown error', 'error');
      return data;

    } catch (err) {
      setStatus(err.message, 'error');
      return null;
    }
  }

  // ─── Commands → Queue (NO direct mutations) ───────────────────────────────

  async function cmdPause() {
    if (!activeVentureId) return;
    await queueAction('pause_venture');
  }

  async function cmdResume() {
    if (!activeVentureId) return;
    await queueAction('resume_venture');
  }

  async function cmdAdvance() {
    if (!activeVentureId) return;
    // High-impact: route through CommandBusClient confirmation modal if available
    if (window.CommandBusClient) {
      await CommandBusClient.submit({
        action_type: 'advance_stage',
        target_type: 'venture',
        target_id:   activeVentureId,
        payload: { current_stage: activeVenture?.stage || '' },
      });
    } else {
      await queueAction('advance_stage', { current_stage: activeVenture?.stage || '' });
    }
  }

  async function cmdKillConfirm() {
    const reason = document.getElementById('kill-reason-input')?.value?.trim();
    if (!reason) {
      setStatus('Reason is required', 'error');
      return;
    }
    hideModal('kill-modal');
    await queueAction('kill_venture', { reason });
  }

  async function cmdSpawnConfirm() {
    const name  = document.getElementById('spawn-name-input')?.value?.trim();
    const owner = document.getElementById('spawn-owner-select')?.value;
    const phase = document.getElementById('spawn-phase-select')?.value;
    const eta   = document.getElementById('spawn-eta-input')?.value;

    if (!name || !owner) {
      setStatus('Name and Owner are required', 'error');
      return;
    }
    hideModal('spawn-modal');
    await queueAction('spawn_workstream', { name, owner, phase, eta, venture_id: activeVentureId });
  }

  async function cmdAssignConfirm() {
    const workstreamId = document.getElementById('assign-ws-select')?.value;
    const newOwner     = document.getElementById('assign-owner-select')?.value;

    if (!workstreamId || !newOwner) {
      setStatus('Workstream and Owner are required', 'error');
      return;
    }
    hideModal('assign-modal');
    await queueAction('assign_agent', {
      _target_id: workstreamId,
      owner: newOwner,
      venture_id: activeVentureId
    }, 'workstream');
  }

  async function cmdTriggerExperiment() {
    if (!activeVentureId) return;
    if (window.CommandBusClient) {
      await CommandBusClient.submit({
        action_type: 'trigger_experiment',
        target_type: 'venture',
        target_id:   activeVentureId,
        payload:     {},
      });
    } else {
      await queueAction('trigger_experiment');
    }
  }

  // ─── Button state refresh ─────────────────────────────────────────────────

  async function refreshCommandButtons() {
    if (!activeVentureId) return;

    try {
      const res = await fetch(`/api/ventures/${activeVentureId}`);
      if (!res.ok) return;
      activeVenture = await res.json();
    } catch { return; }

    const isPaused  = activeVenture?.status === 'paused';
    const isKilled  = activeVenture?.status === 'killed';
    const hasBlocks = (activeVenture?.critical_blocker_count || 0) > 0;

    const pauseBtn   = document.getElementById('cmd-pause-btn');
    const resumeBtn  = document.getElementById('cmd-resume-btn');
    const advanceBtn = document.getElementById('cmd-advance-btn');

    if (pauseBtn)  { pauseBtn.style.display  = isPaused || isKilled ? 'none' : ''; }
    if (resumeBtn) { resumeBtn.style.display = isPaused             ? ''     : 'none'; }
    if (advanceBtn) {
      advanceBtn.disabled = hasBlocks || isKilled;
      advanceBtn.title    = hasBlocks ? `Advance disabled: ${activeVenture?.critical_blocker_count} critical blocker(s)` : '';
    }

    // Update status hint
    if (hasBlocks) setStatus(`Advance disabled: ${activeVenture?.critical_blocker_count} critical blocker(s)`);
  }

  // ─── Render command center into a container ────────────────────────────────

  async function renderInto(containerId, ventureId) {
    activeVentureId = ventureId;

    const container = document.getElementById(containerId);
    if (!container) return;

    await fetchAgents();
    const workstreams = ventureId ? await fetchWorkstreams() : [];
    const ventureWs   = workstreams.filter(ws => !ventureId || ws.venture_id === ventureId || true);

    const agentOptions = agents.map(a =>
      `<option value="${a.id}">${a.name}</option>`
    ).join('');

    const wsOptions = ventureWs.map(ws =>
      `<option value="${ws.id}">${ws.name}</option>`
    ).join('');

    container.innerHTML = `
      <div class="command-center">
        <div class="command-center-header">
          <span>⚡ Commands</span>
          ${ventureId ? `<span style="font-size:9px;opacity:.6;">${ventureId}</span>` : ''}
          <span style="font-size:9px;color:#22c55e55;margin-left:auto;">→ queue</span>
        </div>
        <div class="command-center-body">
          <div class="command-btn-row">
            <button class="cmd-btn" id="cmd-pause-btn" title="Pause venture → command bus">
              <span class="cmd-btn-icon">⏸</span> Pause
            </button>
            <button class="cmd-btn" id="cmd-resume-btn" style="display:none" title="Resume venture → command bus">
              <span class="cmd-btn-icon">▶</span> Resume
            </button>
            <button class="cmd-btn danger" id="cmd-kill-btn" title="Kill venture → command bus (confirmation required)">
              <span class="cmd-btn-icon">✕</span> Kill
            </button>
            <button class="cmd-btn success" id="cmd-advance-btn" title="Advance to next stage → command bus (confirmation required)">
              <span class="cmd-btn-icon">→</span> Advance Stage
            </button>
          </div>
          <div class="command-btn-row">
            <button class="cmd-btn" id="cmd-spawn-btn" title="Create new workstream → command bus">
              <span class="cmd-btn-icon">+</span> Spawn Workstream
            </button>
            <button class="cmd-btn" id="cmd-assign-btn" title="Assign agent to workstream → command bus">
              <span class="cmd-btn-icon">👤</span> Assign Agent
            </button>
            <button class="cmd-btn" id="cmd-experiment-btn" title="Trigger experiment → command bus">
              <span class="cmd-btn-icon">🧪</span> Experiment
            </button>
          </div>
          <div class="command-status" id="command-status"></div>
          <div style="font-size:9px;color:#3a4557;padding:4px 8px;border-top:1px solid #1e2535;margin-top:4px;">
            All actions queued via unified command bus. Clawson executes.
          </div>
        </div>
      </div>

      <!-- Kill Modal -->
      <div class="palantir-modal-overlay" id="kill-modal" style="display:none">
        <div class="palantir-modal">
          <div class="palantir-modal-title">☠️ Kill Venture</div>
          <div style="font-size:12px;color:#8892a4;margin-bottom:12px;">
            This will mark the venture as killed. You can restore it later.
          </div>
          <div class="palantir-form-group">
            <label class="palantir-form-label">Why are you killing this venture?</label>
            <input class="palantir-form-input" id="kill-reason-input" type="text" placeholder="e.g. Market too competitive, pivot required..." />
          </div>
          <div class="palantir-modal-actions">
            <button class="palantir-modal-cancel" id="kill-cancel-btn">Cancel</button>
            <button class="palantir-modal-confirm danger" id="kill-confirm-btn">Kill Venture</button>
          </div>
        </div>
      </div>

      <!-- Spawn Workstream Modal -->
      <div class="palantir-modal-overlay" id="spawn-modal" style="display:none">
        <div class="palantir-modal">
          <div class="palantir-modal-title">+ Spawn Workstream</div>
          <div class="palantir-form-group">
            <label class="palantir-form-label">Name *</label>
            <input class="palantir-form-input" id="spawn-name-input" type="text" placeholder="e.g. API Integration Layer" />
          </div>
          <div class="palantir-form-group">
            <label class="palantir-form-label">Owner Agent *</label>
            <select class="palantir-form-select" id="spawn-owner-select">
              <option value="">Select agent…</option>
              ${agentOptions}
            </select>
          </div>
          <div class="palantir-form-group">
            <label class="palantir-form-label">Phase</label>
            <select class="palantir-form-select" id="spawn-phase-select">
              <option value="backlog">Backlog</option>
              <option value="design">Design</option>
              <option value="build" selected>Build</option>
              <option value="review">Review</option>
              <option value="deploy">Deploy</option>
            </select>
          </div>
          <div class="palantir-form-group">
            <label class="palantir-form-label">ETA</label>
            <input class="palantir-form-input" id="spawn-eta-input" type="date" />
          </div>
          <div class="palantir-modal-actions">
            <button class="palantir-modal-cancel" id="spawn-cancel-btn">Cancel</button>
            <button class="palantir-modal-confirm" id="spawn-confirm-btn">Create Workstream</button>
          </div>
        </div>
      </div>

      <!-- Assign Agent Modal -->
      <div class="palantir-modal-overlay" id="assign-modal" style="display:none">
        <div class="palantir-modal">
          <div class="palantir-modal-title">👤 Assign Agent</div>
          <div class="palantir-form-group">
            <label class="palantir-form-label">Workstream *</label>
            <select class="palantir-form-select" id="assign-ws-select">
              <option value="">Select workstream…</option>
              ${wsOptions || '<option disabled>No workstreams available</option>'}
            </select>
          </div>
          <div class="palantir-form-group">
            <label class="palantir-form-label">New Owner *</label>
            <select class="palantir-form-select" id="assign-owner-select">
              <option value="">Select agent…</option>
              ${agentOptions}
            </select>
          </div>
          <div class="palantir-modal-actions">
            <button class="palantir-modal-cancel" id="assign-cancel-btn">Cancel</button>
            <button class="palantir-modal-confirm" id="assign-confirm-btn">Assign Agent</button>
          </div>
        </div>
      </div>
    `;

    // Wire up buttons — ALL route through command bus queue
    document.getElementById('cmd-pause-btn')?.addEventListener('click',      cmdPause);
    document.getElementById('cmd-resume-btn')?.addEventListener('click',     cmdResume);
    document.getElementById('cmd-advance-btn')?.addEventListener('click',    cmdAdvance);
    document.getElementById('cmd-kill-btn')?.addEventListener('click',       () => showModal('kill-modal'));
    document.getElementById('cmd-spawn-btn')?.addEventListener('click',      () => showModal('spawn-modal'));
    document.getElementById('cmd-assign-btn')?.addEventListener('click',     () => showModal('assign-modal'));
    document.getElementById('cmd-experiment-btn')?.addEventListener('click', cmdTriggerExperiment);

    // Kill modal
    document.getElementById('kill-cancel-btn')?.addEventListener('click',   () => hideModal('kill-modal'));
    document.getElementById('kill-confirm-btn')?.addEventListener('click',  cmdKillConfirm);

    // Spawn modal
    document.getElementById('spawn-cancel-btn')?.addEventListener('click',  () => hideModal('spawn-modal'));
    document.getElementById('spawn-confirm-btn')?.addEventListener('click', cmdSpawnConfirm);

    // Assign modal
    document.getElementById('assign-cancel-btn')?.addEventListener('click',  () => hideModal('assign-modal'));
    document.getElementById('assign-confirm-btn')?.addEventListener('click', cmdAssignConfirm);

    // Close modals on overlay click
    ['kill-modal', 'spawn-modal', 'assign-modal'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideModal(id);
      });
    });

    // Set initial button state
    await refreshCommandButtons();
  }

  // Public API
  window.CommandCenter = {
    renderInto,
    setVenture: (id) => { activeVentureId = id; refreshCommandButtons(); },
    refresh:    refreshCommandButtons
  };

  // Listen for spawn-workstream events from other panels
  document.addEventListener('mc:spawn-workstream', (e) => {
    if (!activeVentureId) return;
    showModal('spawn-modal');
    const nameInput = document.getElementById('spawn-name-input');
    if (nameInput && e.detail?.title) nameInput.value = e.detail.title;
  });

})();
