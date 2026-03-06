/**
 * CR-MC-OPS-PANELS-UPGRADE: Workstreams & Blockers API Module
 * Read-only — SSOT reads on every request (short-TTL cache only).
 *
 * Sources:
 *  - workstreams.json         → active workstreams
 *  - venture_work_links.json  → venture context per workstream
 *  - blocked_work.json        → blockers
 *  - agent_activity.json      → recent events + agent data
 *  - canon/registry.json      → agent registry (for system-status)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const DATA_ROOT   = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');
const CANON_ROOT  = path.join(os.homedir(), '.openclaw/workspace/canon');

// ---------------------------------------------------------------------------
// Cache (2-second TTL — short enough for 10s refresh cycle)
// ---------------------------------------------------------------------------

const _cache = new Map(); // key → { data, expires, mtimeHash }

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { _cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data, ttlMs = 2000) {
  _cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Load a data file fresh from disk. Throws on error so callers can 500.
 */
function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    const enhanced = new Error(`SSOT file missing or unreadable: ${filePath} — ${err.message}`);
    enhanced.ssotPath = filePath;
    throw enhanced;
  }
}

function dataPath(filename) {
  return path.join(DATA_ROOT, filename);
}

function canonPath(filename) {
  return path.join(CANON_ROOT, filename);
}

/**
 * Get file mtime in ms (returns 0 on error).
 */
function fileMtime(filePath) {
  try { return fs.statSync(filePath).mtimeMs; } catch { return 0; }
}

// fileMtime kept for future cache invalidation by mtime hash
void fileMtime;

/**
 * Calculate relative time from ISO timestamp.
 */
function relativeTime(isoTs) {
  if (!isoTs) return null;
  try {
    const diff = Date.now() - new Date(isoTs).getTime();
    if (diff < 0) return 'just now';
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch { return null; }
}

/**
 * Duration string from hours.
 */
function durationString(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

// ---------------------------------------------------------------------------
// Health + SLA calculations
// ---------------------------------------------------------------------------

/**
 * Calculate workstream health from blockers and recency.
 * @param {object} workstream
 * @param {Array} allBlockers - all blockers from blocked_work.json
 * @returns {'healthy'|'warning'|'critical'}
 */
function calculateHealth(workstream, allBlockers = []) {
  const wsId = workstream.id;

  // Check for active blockers
  const activeBlockers = allBlockers.filter(b =>
    b.workstream_id === wsId ||
    b.venture_id === workstream.venture_id
  );

  if (activeBlockers.length > 0) {
    const hasCritical = activeBlockers.some(b =>
      (b.severity || '').toLowerCase() === 'critical'
    );
    return hasCritical ? 'critical' : 'warning';
  }

  // Check for staleness — no activity in 48h = warning, 7d = critical
  const lastTs = workstream.last_event_ts || workstream.updated_at || workstream.created_at;
  if (lastTs) {
    const ageHours = (Date.now() - new Date(lastTs).getTime()) / (1000 * 60 * 60);
    if (ageHours > 168) return 'critical'; // 7 days
    if (ageHours > 48)  return 'warning';  // 2 days
  }

  return 'healthy';
}

/**
 * Calculate SLA info for a blocker.
 * @param {object} blocker
 * @returns {{ duration_hours, hours_remaining, overdue, duration_str, remaining_str }}
 */
function calculateSLA(blocker) {
  const now = Date.now();
  const createdAt = blocker.created_at ? new Date(blocker.created_at).getTime() : now;
  const durationMs = now - createdAt;
  const durationHours = durationMs / (1000 * 60 * 60);

  // SLA threshold: default 72h (3 days) unless specified
  const slaHours = typeof blocker.sla_hours === 'number' ? blocker.sla_hours : 72;
  const hoursRemaining = slaHours - durationHours;
  const overdue = hoursRemaining < 0;

  return {
    duration_hours: Math.round(durationHours * 10) / 10,
    duration_str:   durationString(durationHours),
    hours_remaining: Math.round(hoursRemaining * 10) / 10,
    remaining_str:  overdue
      ? `Overdue by ${durationString(Math.abs(hoursRemaining))}`
      : `${durationString(hoursRemaining)} remaining`,
    overdue,
    sla_hours: slaHours
  };
}

/**
 * Filter activity_stream/activities array by workstream_id.
 */
function filterActivityByWorkstream(workstream_id, activityArray) {
  if (!Array.isArray(activityArray)) return [];
  return activityArray.filter(a =>
    a.workstream_id === workstream_id ||
    a.meta?.workstream_id === workstream_id
  );
}

// ---------------------------------------------------------------------------
// Data loaders
// ---------------------------------------------------------------------------

function loadWorkstreamsFile() {
  return readJSON(dataPath('workstreams.json'));
}

function loadBlockedWorkFile() {
  return readJSON(dataPath('blocked_work.json'));
}

function loadVentureWorkLinksFile() {
  return readJSON(dataPath('venture_work_links.json'));
}

function loadAgentActivityFile() {
  return readJSON(dataPath('agent_activity.json'));
}

function loadRegistryFile() {
  return readJSON(canonPath('registry.json'));
}

/**
 * Get all blockers as flat array from blocked_work.json.
 */
function _getAllBlockers() {
  const data = loadBlockedWorkFile();
  return Array.isArray(data.items) ? data.items : [];
}
void _getAllBlockers;

/**
 * Get all activities from agent_activity.json (activities array + activity_stream).
 */
function getAllActivities() {
  const data = loadAgentActivityFile();
  const acts = Array.isArray(data.activities) ? data.activities : [];
  const stream = Array.isArray(data.activity_stream) ? data.activity_stream : [];
  // Merge, deduplicate by id
  const seen = new Set();
  const all = [];
  [...acts, ...stream].forEach(a => {
    const key = a.id || `${a.timestamp}:${a.agent}:${a.action}`;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(a);
    }
  });
  // Sort descending
  all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return all;
}

/**
 * Get venture context for a venture_id from venture_work_links.
 */
function getVentureContext(ventureId, ventureWorkLinks) {
  if (!ventureId || !ventureWorkLinks) return null;

  // New schema: pipeline array
  if (Array.isArray(ventureWorkLinks.pipeline)) {
    const entry = ventureWorkLinks.pipeline.find(v => v.venture_id === ventureId);
    if (!entry) return null;
    return {
      venture_id: entry.venture_id,
      name: entry.name,
      stage: entry.stage,
      status: entry.status,
      owner: entry.owner
    };
  }

  // Legacy schema: map keyed by venture_id
  const entry = ventureWorkLinks[ventureId];
  if (!entry || typeof entry !== 'object') return null;
  return {
    venture_id: entry.venture_id,
    name: entry.name,
    stage: entry.stage,
    status: entry.status,
    owner: entry.owner
  };
}

// ---------------------------------------------------------------------------
// Public API: getWorkstreams()
// ---------------------------------------------------------------------------

/**
 * Returns all active workstreams with health + blocked flags.
 * Source citations included.
 */
function getWorkstreams() {
  const cacheKey = 'workstreams:list';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Load SSOT files
  const wsData    = loadWorkstreamsFile();
  const bkData    = loadBlockedWorkFile();
  const vwlData   = loadVentureWorkLinksFile();
  const actData   = loadAgentActivityFile();

  // Support new schema (.blocked) and legacy (.items)
  const blockers   = Array.isArray(bkData.blocked)   ? bkData.blocked   :
                     Array.isArray(bkData.items)      ? bkData.items     : [];
  const activities = getAllActivities();
  const ventureLinks = vwlData;

  // Support new schema (.workstreams) and legacy (.active array)
  let workstreams = Array.isArray(wsData.workstreams) ? wsData.workstreams :
                    Array.isArray(wsData.active)       ? wsData.active      : [];

  // Normalize and enrich each workstream
  const result = workstreams.map(ws => {
    const venture = getVentureContext(ws.venture_id, ventureLinks);
    const wsActivities = filterActivityByWorkstream(ws.id, activities);
    const lastActivity = wsActivities[0] || null;

    const wsBlockers = blockers.filter(b =>
      b.workstream_id === ws.id || b.venture_id === ws.venture_id
    );

    const enriched = {
      id: ws.id,
    };

    if (ws.venture_id)  enriched.venture_id   = ws.venture_id;
    if (venture?.name)  enriched.venture_name  = venture.name;
    if (ws.phase || ws.stage) enriched.phase   = ws.phase || ws.stage;
    if (ws.owner)       enriched.owner         = ws.owner;
    if (ws.progress !== undefined) enriched.progress = ws.progress;
    if (ws.eta || ws.target_date) enriched.eta = ws.eta || ws.target_date;
    if (ws.created_at)  enriched.created_at    = ws.created_at;
    if (ws.updated_at)  enriched.updated_at    = ws.updated_at;

    if (lastActivity) {
      enriched.last_event = {
        action:       lastActivity.action,
        timestamp:    lastActivity.timestamp,
        relative_time: relativeTime(lastActivity.timestamp),
        agent:        lastActivity.agent
      };
      enriched.last_event_ts = lastActivity.timestamp;
    }

    enriched.blocked  = wsBlockers.length > 0;
    enriched.health   = calculateHealth({ ...ws, last_event_ts: lastActivity?.timestamp }, blockers);
    enriched.blocker_count = wsBlockers.length;

    return enriched;
  });

  const response = {
    timestamp: new Date().toISOString(),
    total: result.length,
    workstreams: result,
    empty: result.length === 0,
    sources: {
      workstreams: {
        file:        'workstreams.json',
        lastUpdated: wsData.timestamp || wsData.lastUpdated || null,
        path:        dataPath('workstreams.json')
      },
      venture_work_links: {
        file:        'venture_work_links.json',
        lastUpdated: vwlData.timestamp || vwlData.lastUpdated || null
      },
      blocked_work: {
        file:        'blocked_work.json',
        lastUpdated: bkData.timestamp || bkData.lastUpdated || null
      },
      agent_activity: {
        file:        'agent_activity.json',
        lastUpdated: actData.timestamp || actData.lastUpdated || null
      }
    }
  };

  setCache(cacheKey, response);
  return response;
}

// ---------------------------------------------------------------------------
// Public API: getWorkstreamDetail(id)
// ---------------------------------------------------------------------------

function getWorkstreamDetail(id) {
  const cacheKey = `workstreams:detail:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const wsData    = loadWorkstreamsFile();
  const bkData    = loadBlockedWorkFile();
  const vwlData   = loadVentureWorkLinksFile();

  const blockers   = Array.isArray(bkData.blocked)   ? bkData.blocked   :
                     Array.isArray(bkData.items)      ? bkData.items     : [];
  const activities = getAllActivities();

  const allWorkstreams = Array.isArray(wsData.workstreams) ? wsData.workstreams :
                         Array.isArray(wsData.active)       ? wsData.active      : [];
  const ws = allWorkstreams.find(w => w.id === id);

  if (!ws) return null; // Caller handles 404

  const venture = getVentureContext(ws.venture_id, vwlData);
  const wsActivities = filterActivityByWorkstream(id, activities);
  const wsBlockers = blockers.filter(b =>
    b.workstream_id === id || b.venture_id === ws.venture_id
  );

  const detail = {
    id: ws.id,
    timestamp: new Date().toISOString()
  };

  // Core fields
  if (ws.venture_id) detail.venture_id = ws.venture_id;
  if (venture)       detail.venture    = venture;
  if (ws.phase || ws.stage)  detail.phase   = ws.phase || ws.stage;
  if (ws.owner)      detail.owner      = ws.owner;
  if (ws.progress !== undefined) detail.progress = ws.progress;
  if (ws.eta || ws.target_date)  detail.eta     = ws.eta || ws.target_date;
  if (ws.description) detail.description = ws.description;
  if (ws.created_at)  detail.created_at  = ws.created_at;
  if (ws.updated_at)  detail.updated_at  = ws.updated_at;

  // Phases (progression)
  if (Array.isArray(ws.phases)) detail.phases = ws.phases;

  // Dependencies
  if (Array.isArray(ws.dependencies)) detail.dependencies = ws.dependencies;

  // Recent events
  detail.events = wsActivities.slice(0, 20).map(a => ({
    timestamp:     a.timestamp,
    relative_time: relativeTime(a.timestamp),
    agent:         a.agent,
    action:        a.action,
    severity:      a.severity || 'info',
    ...(a.description ? { description: a.description } : {})
  }));

  // Blockers with SLA
  detail.blockers = wsBlockers.map(b => ({
    ...b,
    sla: calculateSLA(b)
  }));

  // Health
  const lastEventTs = wsActivities[0]?.timestamp || null;
  detail.health = calculateHealth({ ...ws, last_event_ts: lastEventTs }, blockers);
  detail.blocked = wsBlockers.length > 0;

  detail.sources = {
    workstreams:        { file: 'workstreams.json',        lastUpdated: wsData.timestamp || null },
    venture_work_links: { file: 'venture_work_links.json', lastUpdated: vwlData.timestamp || null },
    blocked_work:       { file: 'blocked_work.json',       lastUpdated: bkData.timestamp || null },
    agent_activity:     { file: 'agent_activity.json',     lastUpdated: null }
  };

  setCache(cacheKey, detail);
  return detail;
}

// ---------------------------------------------------------------------------
// Public API: getBlockers()
// ---------------------------------------------------------------------------

function getBlockers() {
  const cacheKey = 'blockers:list';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const bkData  = loadBlockedWorkFile();
  const vwlData = loadVentureWorkLinksFile();

  const rawBlockers = Array.isArray(bkData.blocked) ? bkData.blocked :
                      Array.isArray(bkData.items)   ? bkData.items   : [];

  const blockers = rawBlockers.map(b => {
    const sla = calculateSLA(b);
    const venture = getVentureContext(b.venture_id, vwlData);

    const enriched = {
      id: b.blocker_id || b.id || `BLK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    if (b.venture_id)     enriched.venture_id      = b.venture_id;
    if (venture?.name)    enriched.venture_name     = venture.name;
    if (b.workstream_id)  enriched.workstream_id    = b.workstream_id;
    if (b.owner)          enriched.owner            = b.owner;
    if (b.created_at)     enriched.created_at       = b.created_at;
    if (b.blocker_type)   enriched.blocker_type     = b.blocker_type;
    if (b.next_action)    enriched.next_action      = b.next_action;
    if (b.description)    enriched.description      = b.description;

    enriched.severity       = (b.severity || 'warning').toLowerCase();
    enriched.duration_hours = sla.duration_hours;
    enriched.duration_str   = sla.duration_str;
    enriched.sla            = sla;

    return enriched;
  });

  const response = {
    timestamp: new Date().toISOString(),
    total: blockers.length,
    blockers,
    empty: blockers.length === 0,
    sources: {
      blocked_work: {
        file:        'blocked_work.json',
        lastUpdated: bkData.timestamp || bkData.lastUpdated || null,
        path:        dataPath('blocked_work.json')
      },
      venture_work_links: {
        file:        'venture_work_links.json',
        lastUpdated: vwlData.timestamp || vwlData.lastUpdated || null
      }
    }
  };

  setCache(cacheKey, response);
  return response;
}

// ---------------------------------------------------------------------------
// Public API: getBlockerDetail(id)
// ---------------------------------------------------------------------------

function getBlockerDetail(id) {
  const cacheKey = `blockers:detail:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const bkData   = loadBlockedWorkFile();
  const vwlData  = loadVentureWorkLinksFile();
  const actData  = loadAgentActivityFile();

  const rawBlockers = Array.isArray(bkData.blocked) ? bkData.blocked :
                      Array.isArray(bkData.items)   ? bkData.items   : [];
  const b = rawBlockers.find(x =>
    (x.blocker_id || x.id) === id
  );

  if (!b) return null;

  const venture    = getVentureContext(b.venture_id, vwlData);
  const activities = getAllActivities();
  const sla        = calculateSLA(b);

  // Find related activity (by venture or workstream)
  const relatedActivity = activities.filter(a =>
    a.venture_id === b.venture_id ||
    a.meta?.venture_id === b.venture_id ||
    a.workstream_id === b.workstream_id
  ).slice(0, 10);

  const detail = {
    id:           b.blocker_id || b.id,
    timestamp:    new Date().toISOString()
  };

  if (b.venture_id)    detail.venture_id    = b.venture_id;
  if (venture)         detail.venture       = venture;
  if (b.workstream_id) detail.workstream_id = b.workstream_id;
  if (b.owner)         detail.owner         = b.owner;
  if (b.created_at)    detail.created_at    = b.created_at;
  if (b.blocker_type)  detail.blocker_type  = b.blocker_type;
  if (b.next_action)   detail.next_action   = b.next_action;
  if (b.description)   detail.description   = b.description;
  if (b.resolution_target) detail.resolution_target = b.resolution_target;
  if (b.assignee)      detail.assignee      = b.assignee;

  detail.severity = (b.severity || 'warning').toLowerCase();
  detail.sla = sla;

  detail.related_activity = relatedActivity.map(a => ({
    timestamp:     a.timestamp,
    relative_time: relativeTime(a.timestamp),
    agent:         a.agent,
    action:        a.action,
    severity:      a.severity || 'info'
  }));

  detail.sources = {
    blocked_work:       { file: 'blocked_work.json',       lastUpdated: bkData.timestamp || null },
    venture_work_links: { file: 'venture_work_links.json', lastUpdated: vwlData.timestamp || null },
    agent_activity:     { file: 'agent_activity.json',     lastUpdated: actData.timestamp || null }
  };

  setCache(cacheKey, detail);
  return detail;
}

// ---------------------------------------------------------------------------
// Public API: getSystemStatus() — for System Status panel
// ---------------------------------------------------------------------------

function getSystemStatus() {
  const cacheKey = 'system:status';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let registry;
  try {
    registry = loadRegistryFile();
  } catch {
    registry = { agents: [], disabled_agents_registry: [] };
  }

  const actData = loadAgentActivityFile();
  const wsData  = loadWorkstreamsFile();
  const activities = getAllActivities();

  const allWorkstreams = Array.isArray(wsData.workstreams) ? wsData.workstreams :
                         Array.isArray(wsData.active)       ? wsData.active      : [];
  const agentStatusMap = actData.agents || {};

  // Registry agents available for future use (agent enumeration from canon)
  // const registryAgents = [...]  // kept for reference, using knownAgents list below

  // Build agent status for known agents (Clawson, Codesmith, Moonshot, Personal Assistant)
  const knownAgents = ['clawson', 'codesmith', 'moonshot', 'personal_assistant'];
  const agentNames = {
    clawson: 'Clawson',
    codesmith: 'Codesmith',
    moonshot: 'Moonshot',
    personal_assistant: 'Personal Assistant'
  };

  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const FOUR_HOURS = 4 * ONE_HOUR;

  const agents = knownAgents.map(agentKey => {
    const agentStatus = agentStatusMap[agentKey] || {};
    const name = agentNames[agentKey];

    // Find most recent activity for this agent
    const agentActivities = activities.filter(a => {
      const aName = (a.agent || '').toLowerCase();
      return aName === agentKey || aName === name.toLowerCase();
    });

    const lastActivity = agentActivities[0];
    const lastTs = agentStatus.last_activity || lastActivity?.timestamp || null;

    // Determine status
    let status;
    if (agentStatus.status) {
      status = agentStatus.status;
    } else if (!lastTs) {
      status = 'offline';
    } else {
      const age = now - new Date(lastTs).getTime();
      status = age < ONE_HOUR ? 'online' : age < FOUR_HOURS ? 'idle' : 'offline';
    }

    // Count workstreams owned
    const ownedWorkstreams = allWorkstreams.filter(ws =>
      (ws.owner || '').toLowerCase() === name.toLowerCase() ||
      (ws.owner || '').toLowerCase() === agentKey
    );

    // Count critical events in last 24h
    const yesterday = new Date(now - 24 * ONE_HOUR).toISOString();
    const recentErrors = agentActivities.filter(a =>
      a.timestamp >= yesterday &&
      (a.severity || '').toLowerCase() === 'critical'
    ).length;

    const agent = {
      id:   agentKey,
      name,
      status // online | idle | offline
    };

    if (lastTs) {
      agent.last_heartbeat = lastTs;
      agent.last_heartbeat_relative = relativeTime(lastTs);
    } else {
      agent.last_heartbeat = null;
      agent.heartbeat_note = 'Heartbeat not tracked';
    }

    agent.workstreams_owned = ownedWorkstreams.length;
    agent.recent_errors = recentErrors;

    if (agentStatus.current_task) {
      agent.current_task = agentStatus.current_task;
    }

    return agent;
  });

  const response = {
    timestamp: new Date().toISOString(),
    agents,
    summary: {
      online:  agents.filter(a => a.status === 'online').length,
      idle:    agents.filter(a => a.status === 'idle').length,
      offline: agents.filter(a => a.status === 'offline').length
    },
    sources: {
      registry:       { file: 'canon/registry.json',    lastUpdated: registry.timestamp || null },
      agent_activity: { file: 'agent_activity.json',    lastUpdated: actData.timestamp || null },
      workstreams:    { file: 'workstreams.json',        lastUpdated: wsData.timestamp || null }
    }
  };

  setCache(cacheKey, response);
  return response;
}

// ---------------------------------------------------------------------------
// Public API: getWorkstreamFlow() — for Workstream Flow panel
// ---------------------------------------------------------------------------

function getWorkstreamFlow() {
  const cacheKey = 'workstreams:flow';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const wsData  = loadWorkstreamsFile();
  const vwlData = loadVentureWorkLinksFile();

  const allWorkstreams = Array.isArray(wsData.workstreams) ? wsData.workstreams :
                         Array.isArray(wsData.active)       ? wsData.active      : [];

  // Known stages in order
  const STAGES = ['Discovery', 'Design', 'Build', 'Test', 'Deploy', 'Experiment'];

  // Count workstreams per stage
  const stageMap = {};
  STAGES.forEach(s => { stageMap[s] = { count: 0, workstreams: [], ventures: [] }; });

  allWorkstreams.forEach(ws => {
    const phase = ws.phase || ws.stage || 'Unknown';
    // Normalize to known stage names (case-insensitive prefix match)
    const match = STAGES.find(s =>
      s.toLowerCase() === phase.toLowerCase() ||
      phase.toLowerCase().startsWith(s.toLowerCase().slice(0, 4))
    ) || 'Unknown';

    if (!stageMap[match]) {
      stageMap[match] = { count: 0, workstreams: [], ventures: [] };
    }
    stageMap[match].count++;
    stageMap[match].workstreams.push(ws.id);
    if (ws.venture_id) {
      const vContext = getVentureContext(ws.venture_id, vwlData);
      if (vContext?.name && !stageMap[match].ventures.includes(vContext.name)) {
        stageMap[match].ventures.push(vContext.name);
      }
    }
  });

  const stages = STAGES.map(name => ({
    name,
    count: stageMap[name]?.count || 0,
    workstreams: stageMap[name]?.workstreams || [],
    ventures:   stageMap[name]?.ventures || []
  }));

  const response = {
    timestamp: new Date().toISOString(),
    total: allWorkstreams.length,
    stages,
    sources: {
      workstreams:        { file: 'workstreams.json',        lastUpdated: wsData.timestamp || null },
      venture_work_links: { file: 'venture_work_links.json', lastUpdated: vwlData.timestamp || null }
    }
  };

  setCache(cacheKey, response);
  return response;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  getWorkstreams,
  getWorkstreamDetail,
  getBlockers,
  getBlockerDetail,
  getSystemStatus,
  getWorkstreamFlow,
  calculateHealth,
  calculateSLA,
  filterActivityByWorkstream
};
