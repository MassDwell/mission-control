/**
 * CR-002: Mission Control UI V1
 * CR-005: Activity Stream
 * CR-008: Decision Panel & Modal (Two-Step Commit)
 * Frontend script - data binding, auto-refresh
 * Refreshes every 10 seconds
 */

const REFRESH_INTERVAL = 10000; // 10 seconds
const API_ENDPOINT = '/api/status';
const ACTIVITY_FEED_ENDPOINT = '/api/activity-feed';
const DECISIONS_ENDPOINT = '/api/decisions';
const DECISIONS_ACTION_ENDPOINT = '/api/decisions/action';
const VENTURE_SCOREBOARD_ENDPOINT = '/api/venture-scoreboard';
const MC_DECISION_TOKEN = 'local_dev_token_12345'; // Matches server default

// CR-MC-PALANTIR: SSOT endpoints
const AGENTS_ENDPOINT        = '/api/agents';
const INSIGHTS_ENDPOINT      = '/api/insights';
const MOMENTUM_ENDPOINT      = '/api/momentum';
const IMPACT_ENDPOINT        = '/api/impact';
const OPPORTUNITIES_ENDPOINT = '/api/opportunities';

/**
 * Phase 1: SSOT — fetch active agents from agents_runtime.json
 * Replaces hardcoded agent count with dynamic SSOT read.
 */
async function getActiveAgents() {
  try {
    const res = await fetch(AGENTS_ENDPOINT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[AGENTS-SSOT] Error:', err.message);
    return { count: 0, agents: [] };
  }
}

let refreshIntervalId = null;
let lastUpdateTime = null;
let decisionsRefreshIntervalId = null;

// CR-008: Decision modal state
let currentDecision = null;
let currentAction = null;

/**
 * Fetch dashboard data from API
 */
async function fetchDashboardData() {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (err) {
    console.error('[FETCH] Error:', err.message);
    addAlert(`Error fetching data: ${err.message}`, 'error');
    return null;
  }
}

/**
 * Update metric values from data
 */
function updateMetrics(data) {
  // System Health (placeholder: based on alert count)
  const systemHealthEl = document.getElementById('system-health');
  if (systemHealthEl) {
    const blockedCount = Object.keys(data.blockedWork || {}).length;
    const health = blockedCount === 0 ? '✓ OK' : `⚠ ${blockedCount} blocked`;
    systemHealthEl.textContent = health;
    systemHealthEl.style.color = blockedCount === 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  }

  // Opportunity Velocity (placeholder)
  const velocityEl = document.getElementById('opportunity-velocity');
  if (velocityEl) {
    const workstreams = data.workstreams || {};
    velocityEl.textContent = Object.keys(workstreams).length > 0 ? 'Active' : 'Idle';
  }

  // Active Agents — Phase 1 SSOT: read from agents_runtime.json via /api/agents
  // NOTE: updateMetrics no longer uses data.agentActivity for agent count.
  // The SSOT call is made separately in refreshDashboard() → updateActiveAgentsSSO()
  // This stub is kept for backward compatibility.
  void data;
}

/**
 * Update time display
 */
function updateTime() {
  const timeEl = document.getElementById('current-time');
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

/**
 * Fetch venture scoreboard data (CR-009: Venture Scoreboard)
 */
async function fetchVentureScoreboard() {
  try {
    const response = await fetch(VENTURE_SCOREBOARD_ENDPOINT);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('[VENTURE-SCOREBOARD] Error fetching:', err.message);
    return null;
  }
}

/**
 * Update venture scoreboard display
 */
function updateVentureScoreboard(scoreboard) {
  if (!scoreboard) {
    return;
  }

  document.getElementById('scoreboard-ideas').textContent = scoreboard.ideas_generated || 0;
  document.getElementById('scoreboard-mvps').textContent = scoreboard.mvps_built || 0;
  document.getElementById('scoreboard-running').textContent = scoreboard.experiments_running || 0;
  document.getElementById('scoreboard-live').textContent = scoreboard.ventures_live || 0;
  document.getElementById('scoreboard-killed').textContent = scoreboard.ventures_killed || 0;

  const successRate = (scoreboard.success_rate || 0) * 100;
  document.getElementById('scoreboard-success').textContent = successRate.toFixed(0) + '%';

  // Color code success rate
  const successEl = document.getElementById('scoreboard-success');
  if (successRate >= 50) {
    successEl.style.color = 'var(--accent-green)';
  } else if (successRate >= 25) {
    successEl.style.color = 'var(--accent-yellow)';
  } else {
    successEl.style.color = 'var(--accent-red)';
  }
}

/**
 * Fetch activity feed from API
 */
async function fetchActivityFeed() {
  try {
    const response = await fetch(ACTIVITY_FEED_ENDPOINT);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('[ACTIVITY-FEED] Error fetching:', err.message);
    return {
      feed: [],
      total_entries: 0,
      displayed: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get severity badge styling
 */
function getSeverityBadgeHTML(severity) {
  const severityMap = {
    'info': { emoji: 'ℹ️', className: 'severity-info' },
    'warning': { emoji: '⚠️', className: 'severity-warning' },
    'critical': { emoji: '✕', className: 'severity-critical' }
  };
  const config = severityMap[severity] || severityMap['info'];
  return `<span class="severity-badge ${config.className}">${config.emoji} ${severity}</span>`;
}

/**
 * Render Activity Feed panel (CR-005)
 */
async function renderActivityFeed() {
  const container = document.getElementById('agent-activity-content');
  if (!container) return;

  const feedData = await fetchActivityFeed();
  const feed = feedData.feed || [];

  if (feed.length === 0) {
    container.innerHTML = '<div class="loading">No activity recorded</div>';
    return;
  }

  let html = '<div class="activity-feed">';
  
  feed.forEach((entry) => {
    const agent = entry.agent || 'unknown';
    const action = entry.action || '';
    const relativeTime = entry.relative_time || 'unknown';
    const severity = entry.severity || 'info';
    const isoTimestamp = entry.timestamp || '';
    
    const severityBadge = getSeverityBadgeHTML(severity);
    
    html += `
      <div class="activity-item severity-${severity}">
        <div class="activity-header">
          <span class="activity-agent">${agent}</span>
          <span class="activity-dash">—</span>
          <span class="activity-action">${action}</span>
        </div>
        <div class="activity-footer">
          <span class="activity-time" title="${isoTimestamp}">${relativeTime}</span>
          <span class="activity-severity">${severityBadge}</span>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * Render Agent Activity panel (legacy, now using activity feed)
 */
function renderAgentActivity(data) {
  // Activity feed is now handled by renderActivityFeed()
  // This function kept for backward compatibility
  renderActivityFeed();
}

/**
 * Render Active Work panel
 */
function renderActiveWork(data) {
  const container = document.getElementById('active-work-content');
  if (!container) return;

  const workstreams = data.workstreams || {};
  const wsKeys = Object.keys(workstreams);

  if (wsKeys.length === 0) {
    container.innerHTML = '<div class="loading">No active work</div>';
    return;
  }

  let html = '';
  wsKeys.forEach((wsId) => {
    const ws = workstreams[wsId];
    html += `
      <div style="margin-bottom: 8px; padding: 8px; background-color: var(--bg-section); border-radius: 4px;">
        <div style="font-weight: 600; color: var(--accent-blue);">${ws.name || wsId}</div>
        <div style="font-size: 11px; color: var(--text-muted);">
          ${ws.status || 'in progress'}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Render Workstream Flow panel
 */
function renderWorkstreamFlow(data) {
  const container = document.getElementById('workstream-flow-content');
  if (!container) return;

  const workstreams = data.workstreams || {};
  const wsKeys = Object.keys(workstreams);

  if (wsKeys.length === 0) {
    container.innerHTML = '<div class="loading">No workstream data</div>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
  wsKeys.slice(0, 5).forEach((wsId) => {
    const ws = workstreams[wsId];
    const progress = (Math.random() * 100).toFixed(0);
    html += `
      <div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
          ${ws.name || wsId}
        </div>
        <div style="width: 100%; height: 6px; background-color: var(--bg-section); border-radius: 3px; overflow: hidden;">
          <div style="width: ${progress}%; height: 100%; background-color: var(--accent-green); transition: var(--transition);"></div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Render Blocked Work panel
 */
function renderBlockedWork(data) {
  const container = document.getElementById('blocked-work-content');
  if (!container) return;

  const blockedWork = data.blockedWork || {};
  const blockedKeys = Object.keys(blockedWork);

  if (blockedKeys.length === 0) {
    container.innerHTML = '<div style="color: var(--accent-green); padding: 12px; text-align: center;">✓ No blocked work</div>';
    return;
  }

  let html = '';
  blockedKeys.forEach((blockId) => {
    const block = blockedWork[blockId];
    html += `
      <div style="margin-bottom: 12px; padding: 8px; background-color: var(--bg-section); border-left: 3px solid var(--accent-red); border-radius: 2px;">
        <div style="font-weight: 600; color: var(--accent-red);">${block.name || blockId}</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
          Blocker: ${block.blocker || 'unknown'}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Render Venture Pipeline — CR-MC-UI-1.2 Phase 2
 * Uses /api/stages for live venture counts, tiles are clickable.
 */
async function renderVenturePipeline() {
  const container = document.getElementById('pipeline-content');
  if (!container) return;

  try {
    const resp = await fetch('/api/stages');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const stages = data.stages || [];

    let html = '';
    stages.forEach((stage) => {
      html += `
        <div class="pipeline-stage" data-stage="${stage.name}" title="Click to view ${stage.name} ventures (${stage.count})">
          <div class="stage-label">${stage.name}</div>
          <div class="stage-count">${stage.count}</div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Re-attach drilldown handlers after re-render
    if (window.MissionControlDrilldown) {
      window.MissionControlDrilldown.init();
    }
  } catch (err) {
    console.error('[PIPELINE] Error loading stages:', err.message);
    // Fallback to static stages
    const stages = [
      'Opportunity', 'Qualified', 'In Progress', 'Due Diligence',
      'Negotiation', 'Approval', 'Closing', 'Closed'
    ];
    let html = '';
    stages.forEach((stage) => {
      html += `
        <div class="pipeline-stage" data-stage="${stage}" title="Click to view ${stage} ventures">
          <div class="stage-label">${stage}</div>
          <div class="stage-count">—</div>
        </div>
      `;
    });
    container.innerHTML = html;

    if (window.MissionControlDrilldown) {
      window.MissionControlDrilldown.init();
    }
  }
}

/**
 * Update last-updated timestamp
 */
function updateTimestamp() {
  const el = document.getElementById('last-updated');
  if (el) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    el.textContent = `Last updated: ${timeStr}`;
  }
}

/**
 * Check data staleness and display warning/critical banners
 */
async function checkDataStaleness() {
  try {
    const response = await fetch('/api/debug/ssot');
    if (!response.ok) return;
    
    const data = await response.json();
    const now = new Date();
    const nowTime = now.getHours();
    const isBusinessHours = nowTime >= 7 && nowTime < 21; // 7 AM - 9 PM EST
    
    if (!isBusinessHours) {
      document.getElementById('staleness-banner').style.display = 'none';
      return;
    }
    
    let latestTimestamp = null;
    Object.values(data.files).forEach(file => {
      if (file.lastUpdated_in_json && (!latestTimestamp || new Date(file.lastUpdated_in_json) > new Date(latestTimestamp))) {
        latestTimestamp = file.lastUpdated_in_json;
      }
    });
    
    if (!latestTimestamp) return;
    
    const lastUpdated = new Date(latestTimestamp);
    const ageMs = now - lastUpdated;
    const ageMinutes = ageMs / (1000 * 60);
    const ageHours = ageMinutes / 60;
    
    const banner = document.getElementById('staleness-banner');
    const bannerText = document.getElementById('staleness-banner-text');
    const ageDisplay = document.getElementById('staleness-age');
    
    let ageStr = ageHours >= 1 ? `${ageHours.toFixed(1)}h stale` : `${ageMinutes.toFixed(0)}m stale`;
    ageDisplay.textContent = ageStr;
    
    if (ageMinutes > 30 && ageHours <= 3) {
      banner.classList.remove('critical');
      banner.classList.add('warning');
      bannerText.textContent = '⚠️  WARNING: Mission Control data is stale (>30min)';
      banner.style.display = 'flex';
    } else if (ageHours > 3) {
      banner.classList.remove('warning');
      banner.classList.add('critical');
      bannerText.textContent = '🚨 CRITICAL: Mission Control data severely stale (>3h)';
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  } catch (err) {
    console.warn('[Staleness Check] Error:', err.message);
  }
}

/**
 * Add alert message
 */
function addAlert(message, type = 'info') {
  const alertsList = document.querySelector('.alerts-list');
  if (!alertsList) return;

  const alertEl = document.createElement('div');
  alertEl.className = 'alert-item';
  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let style = '';
  if (type === 'error') {
    style = 'border-left-color: var(--accent-red);';
  } else if (type === 'success') {
    style = 'border-left-color: var(--accent-green);';
  }

  alertEl.innerHTML = `
    <span class="alert-time">${now}</span>
    <span class="alert-text">${message}</span>
  `;
  alertEl.style.cssText = style;

  // Prepend and limit to 10 items
  alertsList.insertBefore(alertEl, alertsList.firstChild);
  const items = alertsList.querySelectorAll('.alert-item');
  if (items.length > 10) {
    items[items.length - 1].remove();
  }
}

/**
 * Main refresh function
 * CR-MC-OPS-PANELS-UPGRADE: Agent Activity, Active Work, Workstream Flow,
 * Blocked Work, and System Status panels are now handled by their own modules
 * (agent-activity.js, active-work.js, blocked-work.js, workstream-flow.js,
 * system-status.js). Skip those here to avoid overwriting.
 */
async function refreshDashboard() {
  const data = await fetchDashboardData();
  if (!data) return;

  updateMetrics(data);

  // CR-MC-UI-1.2: Venture pipeline now fetches live stage counts
  await renderVenturePipeline();
  
  // CR-009: Fetch and update venture scoreboard
  const scoreboard = await fetchVentureScoreboard();
  updateVentureScoreboard(scoreboard);

  // Phase 1 SSOT: Update active agents from agents_runtime.json
  await updateActiveAgentsSSO();
  
  updateTimestamp();
}

// CR-MC-OPS-PANELS-UPGRADE: Override old stub renderers so they do nothing
// (the new modules handle these panels independently)
function renderActivityFeed() { /* handled by agent-activity.js */ }
function renderAgentActivity() { /* handled by agent-activity.js */ }
function renderActiveWork()    { /* handled by active-work.js    */ }
function renderWorkstreamFlow(){ /* handled by workstream-flow.js */ }
function renderBlockedWork()   { /* handled by blocked-work.js   */ }

/**
 * Phase 1 SSOT: Update active agents count from agents_runtime.json
 * Replaces any hardcoded or cache-derived count.
 */
async function updateActiveAgentsSSO() {
  const agentsData = await getActiveAgents();
  const agentsEl   = document.getElementById('active-agents');
  if (agentsEl) {
    agentsEl.textContent = agentsData.count ?? '0';
    agentsEl.title       = `Active agents: ${(agentsData.agents || []).map(a => a.name).join(', ')} (from agents_runtime.json)`;
  }
}

/**
 * Initialize dashboard
 */
async function initDashboard() {
  console.log('[INIT] Mission Control UI V1 starting...');

  // Initial update (await first paint so drilldown can init)
  await refreshDashboard();

  // Initialize drilldown after pipeline tiles are rendered
  if (window.MissionControlDrilldown) {
    window.MissionControlDrilldown.init();
  }

  // Update time every second
  setInterval(updateTime, 1000);
  updateTime();

  // Auto-refresh every 10 seconds
  refreshIntervalId = setInterval(refreshDashboard, REFRESH_INTERVAL);
  console.log(`[INIT] Auto-refresh set to ${REFRESH_INTERVAL / 1000}s`);
  
  // Check data staleness every 30 seconds
  setInterval(checkDataStaleness, 30000);
  checkDataStaleness(); // Initial check

  addAlert('Dashboard initialized', 'success');
}

/**
 * CR-008: Fetch decisions from API
 */
async function fetchDecisions() {
  try {
    const response = await fetch(DECISIONS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('[DECISIONS] Error fetching:', err.message);
    return { decisions: [], queue: [], log: [] };
  }
}

/**
 * CR-008: Render decisions panel
 */
async function renderDecisionsPanel() {
  const data = await fetchDecisions();
  const decisions = data.decisions || [];
  const container = document.getElementById('decisions-panel-content');
  if (!container) return;

  // Update badge count
  const badgeCount = document.getElementById('decisions-count');
  if (badgeCount) badgeCount.textContent = decisions.length;

  // Show/hide badge
  const badgeContainer = document.getElementById('decisions-badge-container');
  if (badgeContainer) {
    badgeContainer.style.display = decisions.length > 0 ? 'flex' : 'none';
  }

  if (decisions.length === 0) {
    container.innerHTML = '<div class="loading">No decisions pending</div>';
    return;
  }

  let html = '';
  decisions.forEach((decision) => {
    const urgencyClass = `urgency-${decision.urgency || 'low'}`;
    html += `
      <div class="decision-item ${urgencyClass}">
        <div class="decision-title">${decision.title || 'Unknown'}</div>
        <div class="decision-description">${decision.description || ''}</div>
        <div class="decision-impact">💡 ${decision.impact || ''}</div>
        <div class="decision-actions">
          <button class="decision-action-btn review-btn" onclick="openDecisionModal('${decision.decision_id}', 'review')">
            Review
          </button>
          <button class="decision-action-btn approve-btn" onclick="openDecisionModal('${decision.decision_id}', 'approve')">
            Approve
          </button>
          <button class="decision-action-btn reject-btn" onclick="openDecisionModal('${decision.decision_id}', 'reject')">
            Reject
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * CR-008: Open confirmation modal
 */
async function openDecisionModal(decisionId, action) {
  // Find decision
  const data = await fetchDecisions();
  const decision = (data.decisions || []).find(d => d.decision_id === decisionId);
  if (!decision) {
    addAlert('Decision not found', 'error');
    return;
  }

  // Store state
  currentDecision = decision;
  currentAction = action;

  // Populate modal
  document.getElementById('modal-decision-title').textContent = decision.title || '--';
  document.getElementById('modal-decision-desc').textContent = decision.description || '--';
  document.getElementById('modal-action').textContent = action.toUpperCase();
  document.getElementById('modal-impact').textContent = decision.impact || '--';

  // Show modal
  const modal = document.getElementById('confirmation-modal-overlay');
  if (modal) modal.style.display = 'flex';
}

/**
 * CR-008: Close decision modal
 */
function closeDecisionModal() {
  const modal = document.getElementById('confirmation-modal-overlay');
  if (modal) modal.style.display = 'none';
  currentDecision = null;
  currentAction = null;
}

/**
 * CR-008: Submit decision action to queue
 */
async function submitDecisionAction() {
  if (!currentDecision || !currentAction) {
    addAlert('Modal state error', 'error');
    return;
  }

  // Show toast
  const toast = document.getElementById('action-toast');
  if (toast) {
    document.getElementById('toast-icon').textContent = '⏳';
    document.getElementById('toast-message').textContent = 'Queuing action...';
    toast.style.display = 'flex';
  }

  try {
    const response = await fetch(DECISIONS_ACTION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MC-TOKEN': MC_DECISION_TOKEN
      },
      body: JSON.stringify({
        decision_id: currentDecision.decision_id,
        action: currentAction,
        requested_by: 'steve'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('[DECISIONS] Action queued:', result.action_id);
      
      // Update toast
      if (toast) {
        document.getElementById('toast-icon').textContent = '✓';
        document.getElementById('toast-message').textContent = `Queued: ${currentAction.toUpperCase()}`;
      }

      addAlert(`Decision queued: ${currentAction}`, 'success');
      closeDecisionModal();

      // Refresh decisions and log after 1 second
      setTimeout(() => {
        renderDecisionsPanel();
        renderDecisionLog();
      }, 1000);

      // Hide toast after 3 seconds
      setTimeout(() => {
        if (toast) toast.style.display = 'none';
      }, 3000);
    } else {
      throw new Error(result.message || 'Queue failed');
    }
  } catch (err) {
    console.error('[DECISIONS] Error submitting action:', err.message);
    
    // Update toast
    if (toast) {
      document.getElementById('toast-icon').textContent = '✕';
      document.getElementById('toast-message').textContent = `Error: ${err.message}`;
    }

    addAlert(`Error: ${err.message}`, 'error');
    closeDecisionModal();

    // Hide toast after 4 seconds
    setTimeout(() => {
      if (toast) toast.style.display = 'none';
    }, 4000);
  }
}

/**
 * CR-008: Render decision log in alerts panel
 */
async function renderDecisionLog() {
  const data = await fetchDecisions();
  const queue = data.queue || [];
  const log = data.log || [];

  // Show queued items first, then log
  const alertsList = document.querySelector('.alerts-list');
  if (!alertsList) return;

  // Keep existing alerts, but add decision status at top
  const existing = Array.from(alertsList.querySelectorAll('.alert-item'));
  
  // Add queued/completed statuses
  const statuses = [];
  
  // Add log entries
  log.slice().reverse().slice(0, 10).forEach((entry) => {
    const statusEmoji = entry.status === 'completed' ? '✓' : '✕';
    const color = entry.status === 'completed' ? 'var(--accent-green)' : 'var(--accent-red)';
    statuses.push({
      time: new Date(entry.completed_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      action: entry.action.toUpperCase(),
      status: entry.status,
      emoji: statusEmoji,
      color: color
    });
  });

  // Add queued items
  queue.filter(q => q.status === 'queued').slice(0, 5).forEach((item) => {
    statuses.push({
      time: '⏳',
      action: item.action.toUpperCase(),
      status: 'queued',
      emoji: '⏳',
      color: 'var(--accent-amber)'
    });
  });

  if (statuses.length > 0) {
    // Clear and repopulate with decisions at top
    alertsList.innerHTML = '';
    
    statuses.forEach((status) => {
      const alertEl = document.createElement('div');
      alertEl.className = 'alert-item';
      alertEl.innerHTML = `
        <span class="alert-time">${status.time}</span>
        <span class="alert-text"><strong>${status.emoji} ${status.action}</strong> — ${status.status}</span>
      `;
      alertEl.style.borderLeftColor = status.color;
      alertsList.appendChild(alertEl);
    });
  }
}

/**
 * CR-008: Initialize decision panel and modal
 */
function initDecisionPanel() {
  console.log('[CR-008] Initializing decision panel...');

  // Badge click handler
  const badge = document.getElementById('decisions-badge');
  if (badge) {
    badge.addEventListener('click', () => {
      const overlay = document.getElementById('decisions-overlay');
      if (overlay) overlay.style.display = 'flex';
    });
  }

  // Close button
  const closeBtn = document.getElementById('decisions-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const overlay = document.getElementById('decisions-overlay');
      if (overlay) overlay.style.display = 'none';
    });
  }

  // Overlay click to close
  const overlay = document.getElementById('decisions-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }

  // Modal cancel button
  const cancelBtn = document.getElementById('modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDecisionModal);
  }

  // Modal confirm button
  const confirmBtn = document.getElementById('modal-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', submitDecisionAction);
  }

  // Modal overlay click to close
  const modalOverlay = document.getElementById('confirmation-modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeDecisionModal();
      }
    });
  }

  // Initial render
  renderDecisionsPanel();
  renderDecisionLog();

  // Refresh decisions every 10 seconds
  decisionsRefreshIntervalId = setInterval(() => {
    renderDecisionsPanel();
    renderDecisionLog();
  }, REFRESH_INTERVAL);

  console.log('[CR-008] Decision panel initialized');
}

/**
 * CR-MC-UI-HARDENING: Panel Controls (collapse, fullwidth, resize persistence)
 */

function initPanelControls() {
  const PANEL_IDS = window.MCStorage ? window.MCStorage.PANEL_IDS : [];
  const grid = document.getElementById('mc-dashboard-grid');

  /**
   * Toggle collapse/expand on a panel.
   */
  function toggleCollapse(panelEl, btn) {
    const body = panelEl.querySelector('.mc-panel-body');
    const isCollapsed = panelEl.classList.contains('mc-collapsed');

    if (isCollapsed) {
      panelEl.classList.remove('mc-collapsed');
      if (body) body.style.display = '';
      btn.textContent = '−';
      btn.title = 'Collapse';
    } else {
      panelEl.classList.add('mc-collapsed');
      if (body) body.style.display = 'none';
      btn.textContent = '+';
      btn.title = 'Expand';
    }

    if (window.MCStorage) window.MCStorage.saveLayout();
  }

  /**
   * Toggle full-width mode on a panel.
   */
  function toggleFullwidth(panelEl, btn) {
    const isFullwidth = panelEl.classList.contains('mc-fullwidth');

    if (isFullwidth) {
      // Exit full-width: restore grid
      panelEl.classList.remove('mc-fullwidth');
      if (grid) grid.classList.remove('mc-single-panel-mode');
      // Show all siblings
      PANEL_IDS.forEach(function(sid) {
        const sibling = document.getElementById(sid);
        if (sibling) sibling.style.display = '';
      });
      // Also show panel-venture-pipeline
      const pipeline = document.getElementById('panel-venture-pipeline');
      if (pipeline) pipeline.style.display = '';
      btn.textContent = '⇔';
      btn.title = 'Full Width';
    } else {
      // Enter full-width: hide siblings
      panelEl.classList.add('mc-fullwidth');
      if (grid) grid.classList.add('mc-single-panel-mode');
      const panelId = panelEl.id;
      PANEL_IDS.forEach(function(sid) {
        if (sid !== panelId) {
          const sibling = document.getElementById(sid);
          if (sibling) sibling.style.display = 'none';
        }
      });
      // Also hide pipeline unless that's the active one
      if (panelId !== 'panel-venture-pipeline') {
        const pipeline = document.getElementById('panel-venture-pipeline');
        if (pipeline) pipeline.style.display = 'none';
      }
      btn.textContent = '↩';
      btn.title = 'Exit Full Width';
    }

    if (window.MCStorage) window.MCStorage.saveLayout();
  }

  // Attach click handlers to all panel control buttons
  document.querySelectorAll('.mc-ctrl-btn').forEach(function(btn) {
    const panelId = btn.getAttribute('data-panel');
    const action  = btn.getAttribute('data-action');
    if (!panelId || !action) return;
    const panelEl = document.getElementById(panelId);
    if (!panelEl) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (action === 'collapse') {
        toggleCollapse(panelEl, btn);
      } else if (action === 'fullwidth') {
        toggleFullwidth(panelEl, btn);
      }
    });
  });

  // Set up ResizeObserver on each panel to persist size changes
  if (window.ResizeObserver && window.MCStorage) {
    const ro = new ResizeObserver(function() {
      window.MCStorage.saveLayout();
    });
    PANEL_IDS.forEach(function(panelId) {
      const el = document.getElementById(panelId);
      if (el) ro.observe(el);
    });
    // Also observe venture pipeline
    const pipeline = document.getElementById('panel-venture-pipeline');
    if (pipeline) ro.observe(pipeline);
  }

  // Restore layout from localStorage
  if (window.MCStorage) {
    window.MCStorage.restoreLayout();
  }
}

/**
 * DOMContentLoaded
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDashboard().catch(err => console.error('[INIT] Dashboard init error:', err));
    initDecisionPanel();
    initPanelControls();
  });
} else {
  initDashboard().catch(err => console.error('[INIT] Dashboard init error:', err));
  initDecisionPanel();
  initPanelControls();
}

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }
  if (decisionsRefreshIntervalId) {
    clearInterval(decisionsRefreshIntervalId);
  }
});
