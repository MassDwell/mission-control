/**
 * CR-MC-PALANTIR-OPERATOR-LOOPS: Palantir Mode API Module
 * Phase 1: SSOT Foundation (agents_runtime.json)
 * Phase 2: Operator Commands (pause/kill/advance/spawn/assign)
 * Phase 3: Intelligence Layer (system_insights.json)
 * Phase 4: Engagement Loops (momentum, impact, discovery)
 * Phase 5: Validation Pipeline
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { randomUUID } = require('crypto');

const DATA_ROOT  = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');

// ---------------------------------------------------------------------------
// SSOT file helpers
// ---------------------------------------------------------------------------

function dataPath(filename) {
  return path.join(DATA_ROOT, filename);
}

/**
 * Read JSON from SSOT file. Throws on missing/corrupt.
 */
function readJSON(filename) {
  const filePath = dataPath(filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    const e = new Error(`SSOT file missing or unreadable: ${filePath} — ${err.message}`);
    e.ssotPath = filePath;
    throw e;
  }
}

/**
 * Read JSON from SSOT file — returns defaultValue on error (graceful).
 */
function readJSONSafe(filename, defaultValue = {}) {
  try { return readJSON(filename); } catch { return defaultValue; }
}

/**
 * Atomic write: write to temp file then rename.
 */
function writeJSONAtomic(filename, data) {
  const filePath = dataPath(filename);
  const tmpPath  = filePath + '.tmp.' + Date.now();
  const payload  = JSON.stringify(data, null, 2);
  fs.writeFileSync(tmpPath, payload, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

/**
 * Append an activity event to agent_activity.json
 */
function logActivity(entry) {
  try {
    const data = readJSONSafe('agent_activity.json', { activities: [] });
    if (!Array.isArray(data.activities)) data.activities = [];
    data.activities.unshift({
      id:        randomUUID(),
      timestamp: new Date().toISOString(),
      agent:     entry.agent     || 'Steve Vettori',
      action:    entry.action    || '',
      severity:  entry.severity  || 'info',
      source:    entry.source    || 'operator',
      ...entry
    });
    // Keep last 500 activities
    data.activities = data.activities.slice(0, 500);
    data.lastUpdated = new Date().toISOString();
    writeJSONAtomic('agent_activity.json', data);
  } catch (err) {
    console.error('[PALANTIR] logActivity failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// PHASE 1: SSOT Foundation — getActiveAgents
// ---------------------------------------------------------------------------

/**
 * Get active agents from agents_runtime.json (SSOT).
 * Returns: { count, agents[], lastUpdated }
 */
function getActiveAgents() {
  const data = readJSON('agents_runtime.json');
  const agents = Array.isArray(data.agents) ? data.agents : [];
  const active = agents.filter(a => a.status === 'active');
  return {
    count:       active.length,
    total:       agents.length,
    agents:      active,
    lastUpdated: data.lastUpdated || null,
    ssot:        'agents_runtime.json'
  };
}

// ---------------------------------------------------------------------------
// PHASE 2: Operator Commands
// ---------------------------------------------------------------------------

/**
 * Get the next stage in the pipeline for a venture.
 */
const STAGE_ORDER = [
  'Opportunity', 'Qualified', 'In Progress', 'Due Diligence',
  'Negotiation', 'Approval', 'Closing', 'Closed'
];

function nextStage(currentStage) {
  const idx = STAGE_ORDER.findIndex(s => s.toLowerCase() === (currentStage || '').toLowerCase());
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

/**
 * Find a venture in venture_scoreboard.json by id or name.
 */
function findVenture(ventureId) {
  const scoreboard = readJSON('venture_scoreboard.json');
  const ventures   = Array.isArray(scoreboard.ventures) ? scoreboard.ventures : [];
  return ventures.find(v =>
    v.venture_id === ventureId ||
    v.name?.toLowerCase().replace(/\s+/g, '-') === ventureId.toLowerCase()
  );
}

/**
 * Update venture in venture_scoreboard.json
 */
function updateVenture(ventureId, updates) {
  const scoreboard = readJSON('venture_scoreboard.json');
  const ventures   = Array.isArray(scoreboard.ventures) ? scoreboard.ventures : [];
  const idx = ventures.findIndex(v =>
    v.venture_id === ventureId ||
    v.name?.toLowerCase().replace(/\s+/g, '-') === ventureId.toLowerCase()
  );
  if (idx === -1) throw new Error(`Venture not found: ${ventureId}`);
  ventures[idx] = { ...ventures[idx], ...updates, updatedAt: new Date().toISOString() };
  scoreboard.ventures   = ventures;
  scoreboard.lastUpdated = new Date().toISOString();
  writeJSONAtomic('venture_scoreboard.json', scoreboard);
  return ventures[idx];
}

/**
 * COMMAND: Pause venture
 * Updates venture_scoreboard.json status → paused
 * Logs to agent_activity.json
 */
function pauseVenture(ventureId, actor = 'Steve Vettori') {
  const venture = findVenture(ventureId);
  if (!venture) throw new Error(`Venture not found: ${ventureId}`);
  if (venture.status === 'paused') throw new Error(`Venture already paused: ${venture.name}`);

  const updated = updateVenture(ventureId, { status: 'paused', previousStatus: venture.status });

  logActivity({
    agent:     actor,
    action:    `Paused venture: ${venture.name}`,
    severity:  'warning',
    source:    'operator',
    venture_id: ventureId,
    command:   'pause_venture'
  });

  return { success: true, venture: updated, message: `Paused: ${venture.name}` };
}

/**
 * COMMAND: Resume venture (reverse of pause)
 */
function resumeVenture(ventureId, actor = 'Steve Vettori') {
  const venture = findVenture(ventureId);
  if (!venture) throw new Error(`Venture not found: ${ventureId}`);
  if (venture.status !== 'paused') throw new Error(`Venture is not paused: ${venture.name}`);

  const restored = venture.previousStatus || 'active';
  const updated = updateVenture(ventureId, { status: restored, previousStatus: null });

  logActivity({
    agent:     actor,
    action:    `Resumed venture: ${venture.name}`,
    severity:  'info',
    source:    'operator',
    venture_id: ventureId,
    command:   'resume_venture'
  });

  return { success: true, venture: updated, message: `Resumed: ${venture.name}` };
}

/**
 * COMMAND: Kill venture
 */
function killVenture(ventureId, reason, actor = 'Steve Vettori') {
  const venture = findVenture(ventureId);
  if (!venture) throw new Error(`Venture not found: ${ventureId}`);

  const updated = updateVenture(ventureId, {
    status:      'killed',
    stage:       'killed',
    killedAt:    new Date().toISOString(),
    killReason:  reason || 'No reason provided',
    previousStage: venture.stage
  });

  logActivity({
    agent:     actor,
    action:    `Killed venture: ${venture.name}${reason ? `, reason: ${reason}` : ''}`,
    severity:  'critical',
    source:    'operator',
    venture_id: ventureId,
    command:   'kill_venture',
    reason
  });

  return { success: true, venture: updated, message: `Killed: ${venture.name}` };
}

/**
 * COMMAND: Advance venture stage
 * Blocked if critical blockers exist.
 */
function advanceVentureStage(ventureId, actor = 'Steve Vettori') {
  const venture = findVenture(ventureId);
  if (!venture) throw new Error(`Venture not found: ${ventureId}`);

  // Check for critical blockers
  const blocked = readJSONSafe('blocked_work.json', {});
  const blockers = Object.values(blocked).filter(b =>
    b.venture_id === ventureId && b.severity === 'critical'
  );
  if (blockers.length > 0) {
    throw new Error(`Cannot advance: ${blockers.length} critical blocker(s) on ${venture.name}`);
  }

  const next = nextStage(venture.stage);
  if (!next) throw new Error(`Already at final stage: ${venture.stage}`);

  const fromStage = venture.stage;
  const updated   = updateVenture(ventureId, {
    stage:    next,
    previousStage: fromStage,
    advancedAt: new Date().toISOString(),
    // Available for undo 30 min
    undoAvailableUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  });

  logActivity({
    agent:      actor,
    action:     `Advanced ${venture.name} from ${fromStage} to ${next}`,
    severity:   'info',
    source:     'operator',
    venture_id: ventureId,
    command:    'advance_stage',
    from_stage: fromStage,
    to_stage:   next
  });

  return { success: true, venture: updated, message: `Advanced to: ${next}`, fromStage, toStage: next };
}

/**
 * COMMAND: Spawn workstream
 * Creates new workstream in workstreams.json + updates venture_work_links.json
 */
function spawnWorkstream(ventureId, { name, owner, phase, eta }, actor = 'Steve Vettori') {
  // Validate owner exists in agents_runtime.json
  const agentsData = readJSON('agents_runtime.json');
  const agents     = Array.isArray(agentsData.agents) ? agentsData.agents : [];
  const ownerAgent = agents.find(a => a.id === owner || a.name?.toLowerCase() === owner?.toLowerCase());
  if (!ownerAgent) throw new Error(`Owner agent not found: ${owner}`);

  const workstreamId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  // Read/update workstreams.json
  const wsData = readJSONSafe('workstreams.json', { active: [], total: 0, timestamp: now });
  const newWs = {
    id:          workstreamId,
    name:        name,
    venture_id:  ventureId,
    owner:       ownerAgent.id,
    owner_name:  ownerAgent.name,
    phase:       phase || 'backlog',
    eta:         eta || null,
    progress:    0,
    status:      'active',
    created_at:  now,
    last_event:  now
  };

  if (!Array.isArray(wsData.active)) wsData.active = [];
  wsData.active.push(newWs);
  wsData.total = wsData.active.length;
  wsData.timestamp = now;
  writeJSONAtomic('workstreams.json', wsData);

  // Update venture_work_links.json
  const links = readJSONSafe('venture_work_links.json', { timestamp: now });
  if (!links[ventureId]) links[ventureId] = { venture_id: ventureId, workstreams: [] };
  if (!Array.isArray(links[ventureId].workstreams)) links[ventureId].workstreams = [];
  links[ventureId].workstreams.push(workstreamId);
  links.timestamp = now;
  writeJSONAtomic('venture_work_links.json', links);

  logActivity({
    agent:        actor,
    action:       `Created workstream: ${name} (${phase || 'backlog'}) for ${ventureId}`,
    severity:     'info',
    source:       'operator',
    venture_id:   ventureId,
    workstream_id: workstreamId,
    command:      'spawn_workstream'
  });

  return { success: true, workstream: newWs, message: `Created workstream: ${name}` };
}

/**
 * COMMAND: Assign agent to workstream
 */
function assignAgent(workstreamId, newOwner, actor = 'Steve Vettori') {
  // Validate new owner
  const agentsData = readJSON('agents_runtime.json');
  const agents     = Array.isArray(agentsData.agents) ? agentsData.agents : [];
  const ownerAgent = agents.find(a => a.id === newOwner || a.name?.toLowerCase() === newOwner?.toLowerCase());
  if (!ownerAgent) throw new Error(`Agent not found: ${newOwner}`);

  const wsData = readJSONSafe('workstreams.json', { active: [] });
  if (!Array.isArray(wsData.active)) wsData.active = [];
  const wsIdx = wsData.active.findIndex(w => w.id === workstreamId || w.name === workstreamId);
  if (wsIdx === -1) throw new Error(`Workstream not found: ${workstreamId}`);

  const ws = wsData.active[wsIdx];
  if (ws.owner === ownerAgent.id) {
    return { success: false, message: `${ownerAgent.name} is already assigned to this workstream` };
  }

  const prevOwner = ws.owner;
  wsData.active[wsIdx] = { ...ws, owner: ownerAgent.id, owner_name: ownerAgent.name, updatedAt: new Date().toISOString() };
  wsData.timestamp = new Date().toISOString();
  writeJSONAtomic('workstreams.json', wsData);

  logActivity({
    agent:         actor,
    action:        `Reassigned ${ws.name} from ${prevOwner} to ${ownerAgent.name}`,
    severity:      'info',
    source:        'operator',
    workstream_id: workstreamId,
    command:       'assign_agent',
    from_owner:    prevOwner,
    to_owner:      ownerAgent.id
  });

  return { success: true, workstream: wsData.active[wsIdx], message: `Assigned ${ownerAgent.name} to ${ws.name}` };
}

// ---------------------------------------------------------------------------
// PHASE 3: Intelligence Layer
// ---------------------------------------------------------------------------

/**
 * Compute live system insights by analyzing SSOT files.
 * Rules: stalled workstreams, critical blockers, agent overload, fast progress, unusual activity
 */
function computeInsights() {
  const now = Date.now();
  const insights = [];

  // Load sources
  const wsData       = readJSONSafe('workstreams.json', {});
  const activityData = readJSONSafe('agent_activity.json', { activities: [] });
  const blockedData  = readJSONSafe('blocked_work.json', {});
  const agentsData   = readJSONSafe('agents_runtime.json', { agents: [] });
  const relData      = readJSONSafe('venture_relationships.json', { workstreams: [], ventures: [] });
  const activities   = Array.isArray(activityData.activities) ? activityData.activities : [];

  // --- Rule 1: Stalled workstreams (last event > 12h ago) ---
  const workstreams = Array.isArray(wsData.active)
    ? wsData.active
    : Array.isArray(relData.workstreams)
      ? relData.workstreams
      : [];

  workstreams.forEach(ws => {
    const lastEvent = ws.last_event || ws.updatedAt || ws.created_at;
    if (!lastEvent) return;
    const ageMs = now - new Date(lastEvent).getTime();
    const ageH  = ageMs / (1000 * 60 * 60);
    if (ageH > 12) {
      insights.push({
        id:           `insight-stalled-${ws.id || ws.name}`,
        type:         'stalled_workstream',
        severity:     'warning',
        workstream_id: ws.id,
        message:      `${ws.name} stalled for ${Math.floor(ageH)}h (last activity: ${new Date(lastEvent).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`,
        action:       'ping_agent',
        timestamp:    new Date().toISOString()
      });
    }
  });

  // --- Rule 2: Critical blockers ---
  const blockerList = Array.isArray(blockedData.blockers)
    ? blockedData.blockers
    : Object.values(blockedData).filter(b => b && typeof b === 'object' && b.severity);

  blockerList.forEach(b => {
    if (b.severity !== 'critical') return;
    const overdueMs  = b.sla_deadline ? now - new Date(b.sla_deadline).getTime() : 0;
    const overdueStr = overdueMs > 0
      ? `Overdue by ${Math.round(overdueMs / (1000 * 60 * 60))} hours`
      : 'Approaching SLA';
    insights.push({
      id:         `insight-blocker-${b.id || b.blocker_id}`,
      type:       'blocked_venture',
      severity:   overdueMs > 0 ? 'critical' : 'warning',
      venture_id: b.venture_id,
      message:    `1 critical blocker on ${b.venture_name || b.venture_id}: ${b.description || b.blocker || 'needs attention'}. ${overdueStr}`,
      action:     'resolve_blocker',
      blocker_id: b.id || b.blocker_id,
      timestamp:  new Date().toISOString()
    });
  });

  // --- Rule 3: Agent overload (5+ workstreams) ---
  const agents = Array.isArray(agentsData.agents) ? agentsData.agents : [];
  agents.forEach(agent => {
    const count = typeof agent.owned_workstreams === 'number'
      ? agent.owned_workstreams
      : workstreams.filter(w => w.owner === agent.id).length;
    if (count >= 5) {
      insights.push({
        id:       `insight-overload-${agent.id}`,
        type:     'agent_overload',
        severity: 'warning',
        agent_id: agent.id,
        message:  `${agent.name} owns ${count} workstreams (monitor capacity)`,
        action:   'view_workstreams',
        timestamp: new Date().toISOString()
      });
    }
  });

  // --- Rule 4: Fast progress (workstream progress > 50% recent) ---
  const relWorkstreams = Array.isArray(relData.workstreams) ? relData.workstreams : [];
  relWorkstreams.forEach(ws => {
    if ((ws.progress || 0) >= 80) {
      insights.push({
        id:            `insight-progress-${ws.id}`,
        type:          'fast_progress',
        severity:      'positive',
        workstream_id: ws.id,
        venture_id:    ws.venture_id,
        message:       `${ws.name} is ${ws.progress}% complete (high momentum)`,
        action:        'celebrate',
        timestamp:     new Date().toISOString()
      });
    }
  });

  // --- Rule 5: Unusual activity (>2x average) ---
  const ventureActivity = {};
  activities.slice(0, 100).forEach(a => {
    if (!a.venture_id) return;
    ventureActivity[a.venture_id] = (ventureActivity[a.venture_id] || 0) + 1;
  });
  const avgActivity = Object.values(ventureActivity).reduce((s, v) => s + v, 0) / Math.max(Object.keys(ventureActivity).length, 1);
  Object.entries(ventureActivity).forEach(([vId, count]) => {
    if (count > avgActivity * 2 && avgActivity > 0) {
      insights.push({
        id:         `insight-activity-${vId}`,
        type:       'unusual_activity',
        severity:   'info',
        venture_id: vId,
        message:    `Unusual activity spike on ${vId} (${count} events vs avg ${Math.round(avgActivity)})`,
        action:     'view_activity',
        timestamp:  new Date().toISOString()
      });
    }
  });

  // Merge with static insights from system_insights.json
  const staticInsights = readJSONSafe('system_insights.json', { insights: [] });
  const staticList = Array.isArray(staticInsights.insights) ? staticInsights.insights : [];

  // De-dup by id prefix
  const computedIds = new Set(insights.map(i => i.id));
  staticList.forEach(s => {
    if (!computedIds.has(s.id)) insights.push(s);
  });

  // Sort: critical > warning > positive > info
  const severityOrder = { critical: 0, warning: 1, positive: 2, info: 3 };
  insights.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

  // Write back computed insights to system_insights.json for polling
  writeJSONAtomic('system_insights.json', {
    lastUpdated: new Date().toISOString(),
    insights:    insights.slice(0, 20)
  });

  return { insights: insights.slice(0, 20), computed_at: new Date().toISOString() };
}

/**
 * Dismiss an insight (removes from system_insights.json)
 */
function dismissInsight(insightId) {
  const data = readJSONSafe('system_insights.json', { insights: [] });
  const before = Array.isArray(data.insights) ? data.insights : [];
  const after  = before.filter(i => i.id !== insightId);
  data.insights = after;
  data.lastUpdated = new Date().toISOString();
  writeJSONAtomic('system_insights.json', data);
  return { success: true, dismissed: insightId };
}

// ---------------------------------------------------------------------------
// PHASE 4: Engagement Loops
// ---------------------------------------------------------------------------

/**
 * Compute momentum metrics from SSOT files.
 */
function getMomentum() {
  const activities   = readJSONSafe('agent_activity.json', { activities: [] });
  const scoreboard   = readJSONSafe('venture_scoreboard.json', { ventures: [] });
  const wsData       = readJSONSafe('workstreams.json', { active: [] });
  const relData      = readJSONSafe('venture_relationships.json', { workstreams: [] });

  const actList      = Array.isArray(activities.activities) ? activities.activities : [];
  const ventures     = Array.isArray(scoreboard.ventures) ? scoreboard.ventures : [];
  const activeWs     = Array.isArray(wsData.active) ? wsData.active : [];
  const relWs        = Array.isArray(relData.workstreams) ? relData.workstreams : [];
  const allWs        = [...activeWs, ...relWs];

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Ventures launched this week
  const venturesLaunchedWeek = ventures.filter(v =>
    v.created_at >= weekAgo || v.stage === 'Closed' || v.stage === 'closed'
  ).length;

  // Tasks completed (activity entries in last 24h)
  const tasksCompletedDay = actList.filter(a =>
    a.timestamp >= dayAgo && a.severity !== 'critical'
  ).length;

  // Workstreams closed this week
  const wsClosedWeek = actList.filter(a =>
    a.timestamp >= weekAgo &&
    (a.action?.toLowerCase().includes('completed') || a.action?.toLowerCase().includes('closed'))
  ).length;

  // Ventures advanced this week
  const venturesAdvancedWeek = actList.filter(a =>
    a.timestamp >= weekAgo && a.command === 'advance_stage'
  ).length;

  // Overall progress: average of all workstream progress
  const allProgress = allWs.map(w => w.progress || 0).filter(p => p > 0);
  const overallProgress = allProgress.length > 0
    ? Math.round(allProgress.reduce((s, p) => s + p, 0) / allProgress.length)
    : 0;

  // Trend: compare to last 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const recentActivity = actList.filter(a => a.timestamp >= threeDaysAgo).length;
  const olderActivity  = actList.filter(a => a.timestamp < threeDaysAgo && a.timestamp >= weekAgo).length;
  const trend = recentActivity > olderActivity ? 'accelerating' :
                recentActivity < olderActivity ? 'slowing'      : 'steady';
  const trendEmoji = trend === 'accelerating' ? '📈' : trend === 'slowing' ? '📉' : '📊';

  // Top momentum workstream
  const sortedWs = [...allWs].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const biggestMomentum = sortedWs[0] ? `${sortedWs[0].name} (${sortedWs[0].progress || 0}%)` : null;
  const nextTarget      = sortedWs.find(w => (w.progress || 0) < 50)
    ? `${sortedWs.find(w => (w.progress || 0) < 50).name} (${sortedWs.find(w => (w.progress || 0) < 50).progress || 0}%)`
    : null;

  return {
    period:                 'This Week',
    ventures_launched_week: venturesLaunchedWeek,
    tasks_completed_day:    tasksCompletedDay,
    workstreams_closed:     wsClosedWeek,
    ventures_advanced:      venturesAdvancedWeek,
    overall_progress:       overallProgress,
    trend,
    trend_emoji:            trendEmoji,
    biggest_momentum:       biggestMomentum,
    next_target:            nextTarget,
    computed_at:            new Date().toISOString()
  };
}

/**
 * Compute operator impact from activity log.
 */
function getOperatorImpact(horizon = 'today') {
  const activities = readJSONSafe('agent_activity.json', { activities: [] });
  const actList    = Array.isArray(activities.activities) ? activities.activities : [];

  let since;
  if (horizon === 'today') {
    since = new Date();
    since.setHours(0, 0, 0, 0);
    since = since.toISOString();
  } else if (horizon === 'week') {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (horizon === 'month') {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    since = '1970-01-01T00:00:00.000Z';
  }

  const operatorActions = actList.filter(a => a.timestamp >= since && a.source === 'operator');
  const allActions      = actList.filter(a => a.timestamp >= since);

  // Categorize operator actions
  const actionsByType = {};
  operatorActions.forEach(a => {
    const cmd = a.command || (a.action?.toLowerCase().includes('ventured') ? 'create_venture'
                             : a.action?.toLowerCase().includes('workstream') ? 'spawn_workstream'
                             : 'other');
    if (!actionsByType[cmd]) actionsByType[cmd] = [];
    actionsByType[cmd].push(a);
  });

  // Build human-readable action list
  const actionList = operatorActions.slice(0, 10).map(a => ({
    action: a.action,
    timestamp: a.timestamp,
    command: a.command
  }));

  // Influence multiplier: all events / operator events
  const multiplier = operatorActions.length > 0
    ? (allActions.length / operatorActions.length).toFixed(1)
    : '0';

  // System health (% of workstreams without critical blockers)
  const wsData    = readJSONSafe('workstreams.json', { active: [] });
  const allWs     = Array.isArray(wsData.active) ? wsData.active : [];
  const healthPct = allWs.length > 0
    ? Math.round(allWs.filter(w => !w.blocked).length / allWs.length * 100)
    : 85;

  // Week stats
  const weekSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekOps   = actList.filter(a => a.timestamp >= weekSince && a.source === 'operator');

  return {
    horizon,
    actions_taken:         operatorActions.length,
    actions_list:          actionList,
    actions_by_type:       actionsByType,
    downstream_events:     allActions.length,
    influence_multiplier:  parseFloat(multiplier),
    system_health:         healthPct,
    week_stats: {
      ventures_launched:   weekOps.filter(a => a.command === 'create_venture').length,
      blockers_resolved:   weekOps.filter(a => a.command === 'resolve_blocker').length,
      automations_created: weekOps.filter(a => a.command === 'spawn_workstream').length,
      stages_advanced:     weekOps.filter(a => a.command === 'advance_stage').length
    },
    computed_at: new Date().toISOString()
  };
}

/**
 * Get opportunity discovery feed.
 * Parses agent_activity.json for opportunity/discovery events + moonshot briefings.
 */
function getOpportunities() {
  const activities  = readJSONSafe('agent_activity.json', { activities: [] });
  const actList     = Array.isArray(activities.activities) ? activities.activities : [];
  const weekAgo     = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const opportunities = [];

  // Parse moonshot/discovery entries from activity log
  actList.filter(a => a.timestamp >= weekAgo).forEach(a => {
    const isDiscovery = a.agent === 'moonshot' || a.agent === 'Moonshot' ||
                        a.action?.toLowerCase().includes('opportunit') ||
                        a.action?.toLowerCase().includes('discover') ||
                        a.action?.toLowerCase().includes('idea');
    if (isDiscovery) {
      opportunities.push({
        id:     `opp-${a.id || Math.random().toString(36).slice(2)}`,
        type:   'venture_idea',
        title:  a.action,
        source: a.agent,
        timestamp: a.timestamp,
        actions: ['create_venture', 'learn_more']
      });
    }

    // Automation opportunities
    const isAutomation = a.action?.toLowerCase().includes('automat') ||
                         a.action?.toLowerCase().includes('manual step');
    if (isAutomation) {
      opportunities.push({
        id:     `auto-${a.id || Math.random().toString(36).slice(2)}`,
        type:   'automation_opportunity',
        title:  a.action,
        source: a.agent,
        timestamp: a.timestamp,
        actions: ['create_task', 'dismiss']
      });
    }
  });

  // Include static opportunities from system_insights.json
  const insights = readJSONSafe('system_insights.json', { insights: [] });
  const insightList = Array.isArray(insights.insights) ? insights.insights : [];
  insightList
    .filter(i => i.type === 'automation_opportunity' || i.type === 'venture_idea')
    .forEach(i => {
      opportunities.push({
        id:      i.id,
        type:    i.type,
        title:   i.message,
        source:  'system_insights',
        timestamp: i.timestamp,
        actions: i.type === 'automation_opportunity' ? ['create_task', 'dismiss'] : ['create_venture', 'learn_more']
      });
    });

  return { opportunities: opportunities.slice(0, 10), computed_at: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// PHASE 5: Validation Pipeline
// ---------------------------------------------------------------------------

/**
 * Validate all SSOT files — run every cron cycle.
 */
function validateSSO() {
  const files = [
    'agent_activity.json',
    'workstreams.json',
    'agents_runtime.json',
    'system_insights.json',
    'venture_relationships.json',
    'venture_scoreboard.json',
    'blocked_work.json'
  ];

  const results = {};
  const now = Date.now();
  const MAX_STALE_MS = 10 * 60 * 1000; // 10 minutes

  files.forEach(filename => {
    try {
      const filePath = dataPath(filename);
      const stat = fs.statSync(filePath);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const mtime = stat.mtimeMs;
      const lastUpdated = data.lastUpdated || data.timestamp;
      const ageMs = lastUpdated ? now - new Date(lastUpdated).getTime() : now - mtime;

      results[filename] = {
        exists:      true,
        valid_json:  true,
        mtime:       new Date(mtime).toISOString(),
        lastUpdated: lastUpdated || 'missing',
        stale:       ageMs > MAX_STALE_MS,
        age_minutes: Math.round(ageMs / (1000 * 60)),
        size_bytes:  stat.size
      };
    } catch (err) {
      results[filename] = {
        exists:      false,
        valid_json:  false,
        error:       err.message
      };
    }
  });

  const failed    = Object.entries(results).filter(([, v]) => !v.exists || !v.valid_json);
  const stale     = Object.entries(results).filter(([, v]) => v.stale);
  const healthy   = failed.length === 0 && stale.length === 0;

  if (!healthy) {
    // Write validation alert to agent_activity.json (graceful degradation)
    logActivity({
      agent:    'system',
      action:   `Data validation ${healthy ? 'OK' : 'FAILED'}: ${failed.length} missing, ${stale.length} stale`,
      severity: failed.length > 0 ? 'critical' : 'warning',
      source:   'system',
      command:  'validation'
    });
  }

  return {
    healthy,
    files:       results,
    failed:      failed.map(([k]) => k),
    stale:       stale.map(([k]) => k),
    validated_at: new Date().toISOString()
  };
}

/**
 * Get venture graph data from venture_relationships.json
 */
function getVentureGraph() {
  return readJSON('venture_relationships.json');
}

module.exports = {
  // Phase 1: SSOT
  getActiveAgents,
  // Phase 2: Commands
  pauseVenture,
  resumeVenture,
  killVenture,
  advanceVentureStage,
  spawnWorkstream,
  assignAgent,
  // Phase 3: Intelligence
  computeInsights,
  dismissInsight,
  // Phase 4: Engagement
  getMomentum,
  getOperatorImpact,
  getOpportunities,
  // Phase 5: Validation
  validateSSO,
  // Graph
  getVentureGraph,
  // Helpers
  logActivity,
  readJSONSafe,
  writeJSONAtomic
};
