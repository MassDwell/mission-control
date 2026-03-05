/**
 * CR-MC-PALANTIR: Operator Command Center
 * Phase 2: Venture commands (pause/kill/advance/spawn/assign)
 * Rendered in venture detail drilldown + standalone command panel
 *
 * Commands:
 *  - Pause/Resume venture
 *  - Kill venture (with reason)
 *  - Advance stage (blocked by critical blockers)
 *  - Spawn workstream (modal form)
 *  - Assign agent (modal form)
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

  // ─── Commands ─────────────────────────────────────────────────────────────

  async function cmdPause() {
    if (!activeVentureId) return;
    setStatus('Pausing venture…');
    try {
      const res = await fetch(`/api/commands/pause/${activeVentureId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Steve Vettori' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'success');
        refreshCommandButtons();
        document.dispatchEvent(new CustomEvent('mc:venture-updated', { detail: { venture_id: activeVentureId } }));
      } else {
        setStatus(data.error || 'Pause failed', 'error');
      }
    } catch (err) { setStatus(err.message, 'error'); }
  }

  async function cmdResume() {
    if (!activeVentureId) return;
    setStatus('Resuming venture…');
    try {
      const res = await fetch(`/api/commands/resume/${activeVentureId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Steve Vettori' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'success');
        refreshCommandButtons();
        document.dispatchEvent(new CustomEvent('mc:venture-updated', { detail: { venture_id: activeVentureId } }));
      } else {
        setStatus(data.error || 'Resume failed', 'error');
      }
    } catch (err) { setStatus(err.message, 'error'); }
  }

  async function cmdAdvance() {
    if (!activeVentureId) return;
    setStatus('Advancing stage…');
    try {
      const res = await fetch(`/api/commands/advance/${activeVentureId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Steve Vettori' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`Advanced: ${data.fromStage} → ${data.toStage}`, 'success');
        refreshCommandButtons();
        document.dispatchEvent(new CustomEvent('mc:venture-updated', { detail: { venture_id: activeVentureId } }));
      } else {
        setStatus(data.error || 'Advance failed', 'error');
      }
    } catch (err) { setStatus(err.message, 'error'); }
  }

  async function cmdKillConfirm() {
    const reason = document.getElementById('kill-reason-input')?.value?.trim();
    hideModal('kill-modal');
    setStatus('Killing venture…');
    try {
      const res = await fetch(`/api/commands/kill/${activeVentureId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, actor: 'Steve Vettori' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'success');
        document.dispatchEvent(new CustomEvent('mc:venture-updated', { detail: { venture_id: activeVentureId } }));
        // Close detail drawer after kill
        setTimeout(() => {
          const closeBtn = document.getElementById('detail-close-btn');
          if (closeBtn) closeBtn.click();
        }, 1500);
      } else {
        setStatus(data.error || 'Kill failed', 'error');
      }
    } catch (err) { setStatus(err.message, 'error'); }
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
    setStatus('Creating workstream…');

    try {
      const res = await fetch('/api/commands/spawn-workstream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venture_id: activeVentureId,
          name, owner, phase, eta,
          actor: 'Steve Vettori'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'success');
        document.dispatchEvent(new CustomEvent('mc:workstream-created', { detail: data.workstream }));
      } else {
        setStatus(data.error || 'Spawn failed', 'error');
      }
    } catch (err) { setStatus(err.message, 'error'); }
  }

  async function cmdAssignConfirm() {
    const workstreamId = document.getElementById('assign-ws-select')?.value;
    const newOwner     = document.getElementById('assign-owner-select')?.value;

    if (!workstreamId || !newOwner) {
      setStatus('Workstream and Owner are required', 'error');
      return;
    }
    hideModal('assign-modal');
    setStatus('Assigning agent…');

    try {
      const res = await fetch('/api/commands/assign-agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workstream_id: workstreamId, owner: newOwner, actor: 'Steve Vettori' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'success');
        document.dispatchEvent(new CustomEvent('mc:agent-assigned', { detail: data }));
      } else {
        setStatus(data.message || data.error || 'Assign failed', 'error');
      }
    } catch (err) { setStatus(err.message, 'error'); }
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
        </div>
        <div class="command-center-body">
          <div class="command-btn-row">
            <button class="cmd-btn" id="cmd-pause-btn" title="Pause venture">
              <span class="cmd-btn-icon">⏸</span> Pause
            </button>
            <button class="cmd-btn" id="cmd-resume-btn" style="display:none" title="Resume venture">
              <span class="cmd-btn-icon">▶</span> Resume
            </button>
            <button class="cmd-btn danger" id="cmd-kill-btn" title="Kill venture">
              <span class="cmd-btn-icon">✕</span> Kill
            </button>
            <button class="cmd-btn success" id="cmd-advance-btn" title="Advance to next stage">
              <span class="cmd-btn-icon">→</span> Advance Stage
            </button>
          </div>
          <div class="command-btn-row">
            <button class="cmd-btn" id="cmd-spawn-btn" title="Create new workstream">
              <span class="cmd-btn-icon">+</span> Spawn Workstream
            </button>
            <button class="cmd-btn" id="cmd-assign-btn" title="Assign agent to workstream">
              <span class="cmd-btn-icon">👤</span> Assign Agent
            </button>
          </div>
          <div class="command-status" id="command-status"></div>
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

    // Wire up buttons
    document.getElementById('cmd-pause-btn')?.addEventListener('click',   cmdPause);
    document.getElementById('cmd-resume-btn')?.addEventListener('click',  cmdResume);
    document.getElementById('cmd-advance-btn')?.addEventListener('click', cmdAdvance);
    document.getElementById('cmd-kill-btn')?.addEventListener('click',    () => showModal('kill-modal'));
    document.getElementById('cmd-spawn-btn')?.addEventListener('click',   () => showModal('spawn-modal'));
    document.getElementById('cmd-assign-btn')?.addEventListener('click',  () => showModal('assign-modal'));

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
