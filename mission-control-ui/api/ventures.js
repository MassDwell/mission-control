/**
 * CR-MC-UI-1.2 / CR-MC-VENTURE-DRILLDOWN-V2: Venture API Module
 * Query, filter, sort, and full-detail logic for venture pipeline endpoints.
 * Read-only — SSOT reads on every request (short-TTL cache only).
 *
 * V2 additions (DRILLDOWN-V2):
 *  - calculateHealth()          → healthy|warning|critical from blockers
 *  - calculateReadiness()       → phase-gate checklist + % complete
 *  - filterActivityByVenture()  → timeline entries for one venture
 *  - getVentures()              → list with badges, health, blocker counts, sources
 *  - getVentureDetail() V2      → full 7-section response for detail drawer
 *  - In-memory cache (5s TTL)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const DATA_ROOT = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');

// ---------------------------------------------------------------------------
// Cache (5-second TTL)
// ---------------------------------------------------------------------------

const _cache = new Map(); // key → { data, expires }

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { _cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data, ttlMs = 5000) {
  _cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Load a data file fresh from disk. Throws on error so callers can 500.
 * @param {string} filename
 * @returns {object}
 */
function readJSON(filename) {
  const filePath = path.join(DATA_ROOT, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    const enhanced = new Error(`SSOT file missing or unreadable: ${filePath} — ${err.message}`);
    enhanced.ssotPath = filePath;
    throw enhanced;
  }
}

/**
 * Get mtime of a file in DATA_ROOT (returns 0 on error).
 */
function fileMtime(filename) {
  try {
    return fs.statSync(path.join(DATA_ROOT, filename)).mtimeMs;
  } catch { return 0; }
}

/**
 * Load venture_scoreboard.json and return the data + metadata.
 */
function loadScoreboard() {
  const data = readJSON('venture_scoreboard.json');
  if (!data || !Array.isArray(data.ventures)) {
    const err = new Error('venture_scoreboard.json missing "ventures" array');
    err.ssotPath = path.join(DATA_ROOT, 'venture_scoreboard.json');
    throw err;
  }
  return data;
}

/**
 * Load ventures.json (supplementary fields). Returns empty ventures[] on error.
 */
function loadVenturesSupp() {
  try {
    const data = readJSON('ventures.json');
    return Array.isArray(data.ventures) ? data.ventures : [];
  } catch { return []; }
}

/**
 * Merge a scoreboard venture with supplementary ventures.json data.
 * Matches by name (case-insensitive) or slug overlap.
 */
function mergeVenture(sbVenture, suppArr) {
  const nameLower = (sbVenture.name || '').toLowerCase();
  const supp = suppArr.find(s => {
    if (!s) return false;
    if ((s.name || '').toLowerCase() === nameLower) return true;
    // Slug overlap: "leadscore" matches "leadscore-ai"
    const sbSlug = (sbVenture.venture_id || '').toLowerCase();
    const suppSlug = (s.venture_id || '').toLowerCase();
    return sbSlug.startsWith(suppSlug) || suppSlug.startsWith(sbSlug);
  });
  if (!supp) return { ...sbVenture };

  const merged = { ...sbVenture };
  // Prefer supp fields where scoreboard is empty
  if (supp.venture_id && supp.venture_id !== sbVenture.venture_id) {
    merged.venture_id_alt = supp.venture_id;
  }
  if (supp.artifact_paths && !merged.artifact_paths) merged.artifact_paths = supp.artifact_paths;
  if (supp.created_at  && !merged.created_at)   merged.created_at = supp.created_at;
  if (supp.notes       && !merged.notes)         merged.notes = supp.notes;
  if (supp.owner       && !merged.owner)         merged.owner = supp.owner;
  if (supp.tags        && !merged.tags)          merged.tags  = supp.tags;
  return merged;
}

/**
 * Load all blockers from blocked_work.json. Returns [] on error.
 */
function loadAllBlockers() {
  try {
    const data = readJSON('blocked_work.json');
    return Array.isArray(data.items) ? data.items : [];
  } catch { return []; }
}

/**
 * Fuzzy-ish text match — case-insensitive substring search.
 */
function matchesSearch(venture, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const fields = [
    venture.name,
    venture.description,
    venture.venture_id,
    ...(venture.tags || [])
  ].filter(Boolean).map(s => String(s).toLowerCase());
  return fields.some(f => f.includes(q));
}

/**
 * Sort ventures array by the sort param (in-place, returns array).
 */
function applySort(ventures, sort) {
  switch (sort) {
    case 'name_asc':
      ventures.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'mrr_desc':
      ventures.sort((a, b) => (b.mrr || 0) - (a.mrr || 0));
      break;
    case 'priority_high': {
      const rank = { high: 0, medium: 1, low: 2 };
      ventures.sort((a, b) => (rank[a.priority] ?? 99) - (rank[b.priority] ?? 99));
      break;
    }
    case 'last_event_desc':
    default:
      ventures.sort((a, b) => {
        const ta = a.last_event && a.last_event.timestamp
          ? new Date(a.last_event.timestamp).getTime() : 0;
        const tb = b.last_event && b.last_event.timestamp
          ? new Date(b.last_event.timestamp).getTime() : 0;
        return tb - ta;
      });
      break;
  }
  return ventures;
}

/**
 * Build a lean summary object for list views.
 */
function toSummary(v) {
  return {
    venture_id: v.venture_id,
    name: v.name,
    stage: v.stage,
    status: v.status,
    owner_agent: v.owner_agent,
    priority: v.priority,
    mrr: v.mrr ?? 0,
    mrr_target: v.mrr_target ?? 0,
    last_event: v.last_event || null
  };
}

// ---------------------------------------------------------------------------
// V2 helpers
// ---------------------------------------------------------------------------

/**
 * Get all blockers for a venture (by venture_id or alternate id or text match).
 */
function getVentureBlockers(ventureId, allBlockers) {
  const idLower = (ventureId || '').toLowerCase();
  return allBlockers.filter(b => {
    if (!b) return false;
    if (b.venture_id === ventureId) return true;
    if (b.venture_ids && Array.isArray(b.venture_ids) && b.venture_ids.includes(ventureId)) return true;
    // Loose text match
    const text = `${b.title || ''} ${b.description || ''}`.toLowerCase();
    return text.includes(idLower);
  });
}

/**
 * calculateHealth — returns { health, reason }
 * healthy  = no blockers
 * warning  = blockers present but not overdue/critical
 * critical = any critical or overdue blockers
 */
function calculateHealth(ventureId, allBlockers) {
  const blockers = getVentureBlockers(ventureId, allBlockers);
  if (blockers.length === 0) {
    return { health: 'healthy', reason: 'No blockers' };
  }
  const hasCritical = blockers.some(b =>
    b.severity === 'critical' || b.sla_overdue === true ||
    (b.sla_hours_remaining != null && b.sla_hours_remaining < 0)
  );
  if (hasCritical) {
    return { health: 'critical', reason: `${blockers.length} blocker(s) including critical/overdue` };
  }
  return { health: 'warning', reason: `${blockers.length} blocker(s) present` };
}

/**
 * filterActivityByVenture — filter activity entries that mention a venture.
 * @param {string} ventureId
 * @param {string} ventureName
 * @param {Array}  activityArr
 * @param {string} [timeFilter] — '24h' | '7d' | '30d' | 'all' (default: 'all')
 * @returns {Array}
 */
function filterActivityByVenture(ventureId, ventureName, activityArr, timeFilter = 'all') {
  const idLower   = (ventureId || '').toLowerCase();
  const nameLower = (ventureName || '').toLowerCase();

  // Slug variants: "leadscore", "leadscore-ai", "leadscore_ai"
  const slugs = [idLower, idLower.replace(/-/g, '_'), idLower.replace(/-ai$/, '')].filter(Boolean);

  // Time cutoff
  let cutoffMs = 0;
  if (timeFilter === '24h') cutoffMs = Date.now() - 24 * 3600 * 1000;
  else if (timeFilter === '7d') cutoffMs = Date.now() - 7 * 24 * 3600 * 1000;
  else if (timeFilter === '30d') cutoffMs = Date.now() - 30 * 24 * 3600 * 1000;

  return activityArr.filter(e => {
    if (!e) return false;
    // Time filter
    if (cutoffMs > 0 && e.timestamp) {
      if (new Date(e.timestamp).getTime() < cutoffMs) return false;
    }
    // Explicit match
    if (e.meta && e.meta.venture_id === ventureId) return true;
    // Text match
    const text = [e.action, e.description, JSON.stringify(e.meta || {})]
      .filter(Boolean).join(' ').toLowerCase();
    return slugs.some(s => text.includes(s)) || (nameLower && text.includes(nameLower));
  });
}

/**
 * calculateReadiness — build phase-gate checklist from venture + workstreams data.
 * Returns { current_phase, readiness_percent, items }
 */
function calculateReadiness(venture, workstreams) {
  const stage = (venture.stage || '').toLowerCase().replace(/\s+/g, '_');
  const links = venture.links || {};
  const artifacts = venture.artifact_paths || {};

  // Determine which phase gate to apply
  let phase;
  let items = [];

  if (stage === 'opportunity' || stage === 'qualified') {
    phase = 'opportunity';
    items = [
      { name: 'Concept documented',    checked: !!(venture.description || venture.notes) },
      { name: 'Problem validated',     checked: !!(venture.tags && venture.tags.length > 0) },
      { name: 'Market size estimated', checked: !!(venture.mrr_target || venture.mrr_target === 0) },
      { name: 'ICP defined',           checked: !!(venture.icps && venture.icps.length > 0) }
    ];
  } else if (stage === 'in_progress' || stage === 'in progress' || stage === 'due_diligence') {
    phase = 'in_progress';
    const hasPrd = !!(links.prd || artifacts.prd);
    const hasCr  = !!(links.cr  || artifacts.cr);
    const hasRepo = !!(links.repo_path || artifacts.repo);

    // Workstream completion %
    const wsAvg = workstreams.length > 0
      ? workstreams.reduce((sum, ws) => sum + (ws.percent_complete || ws.blocked_count === 0 ? 50 : 0), 0) / workstreams.length
      : null;

    items = [
      { name: 'Specification complete',      checked: !!(venture.description) },
      { name: 'PRD approved',                checked: hasPrd,  path: links.prd || artifacts.prd || null },
      { name: 'CR reviewed and approved',    checked: hasCr,   path: links.cr  || artifacts.cr  || null },
      { name: 'Repo / codebase created',     checked: hasRepo },
      { name: 'Backend scaffolding',         checked: wsAvg != null ? wsAvg / 100 : null },
      { name: 'Tests passing',               checked: null },
      { name: 'Deployed to staging',         checked: null },
      { name: 'QA complete',                 checked: null }
    ];
  } else if (stage === 'approval' || stage === 'negotiation' || stage === 'closing') {
    phase = 'approval';
    items = [
      { name: 'Proposal submitted',    checked: !!(venture.description) },
      { name: 'CEO sign-off obtained', checked: false },
      { name: 'Legal review complete', checked: false },
      { name: 'Contract executed',     checked: false }
    ];
  } else if (stage === 'closed' || stage === 'launched') {
    phase = 'closed';
    items = [
      { name: 'Production deployed',  checked: !!(venture.status === 'launched') },
      { name: 'KPIs measured',        checked: !!(venture.metrics) },
      { name: 'Post-mortem complete', checked: false }
    ];
  } else {
    phase = 'unknown';
    items = [
      { name: 'Status tracked', checked: !!(venture.stage) }
    ];
  }

  // Compute readiness %
  let score = 0;
  let total = 0;
  items.forEach(item => {
    total++;
    if (item.checked === true)    score += 1;
    else if (typeof item.checked === 'number') score += item.checked;
    // null = not tracked → 0
  });
  const readiness_percent = total > 0 ? Math.round((score / total) * 100) : 0;

  // Add dates (started_date as proxy for items that are checked)
  const now = new Date().toISOString();
  items = items.map(item => ({
    name: item.name,
    checked: item.checked,
    date: item.checked === true ? (venture.started_date || now) : null,
    ...(item.path ? { path: item.path } : {})
  }));

  return { current_phase: phase, readiness_percent, items };
}

/**
 * Get workstreams for a venture.
 */
function getRelatedWorkstreams(ventureId) {
  try {
    const data = readJSON('workstreams.json');
    const all = [];

    if (Array.isArray(data.active)) all.push(...data.active);
    if (Array.isArray(data.workstreams)) all.push(...data.workstreams);

    return all
      .filter(w => {
        if (!w) return false;
        if (w.venture_id === ventureId) return true;
        if (w.venture_ids && Array.isArray(w.venture_ids) && w.venture_ids.includes(ventureId)) return true;
        if (w.name && w.name.toLowerCase().includes(ventureId.toLowerCase())) return true;
        return false;
      })
      .map(w => ({
        workstream_id: w.workstream_id || w.id || null,
        name: w.name || null,
        status: w.status || null,
        phase: w.phase || null,
        percent_complete: w.percent_complete || null,
        assigned_to: w.assigned_to || w.assignee || null,
        eta: w.eta || w.due_date || null,
        last_event: w.last_event || null,
        blocked_count: w.blocked_count || 0
      }));
  } catch { return []; }
}

/**
 * Get enriched blockers for a venture.
 */
function getBlockers(ventureId) {
  try {
    const allBlockers = loadAllBlockers();
    const blockers = getVentureBlockers(ventureId, allBlockers);

    const now = Date.now();
    return blockers.map(b => {
      const createdAt = b.created_at ? new Date(b.created_at).getTime() : now;
      const slaHours  = b.sla_hours || 24;
      const elapsedH  = (now - createdAt) / 3600000;
      const slaHoursRemaining = +(slaHours - elapsedH).toFixed(1);
      const slaOverdue = slaHoursRemaining < 0;

      const result = {};
      if (b.blocker_id || b.id) result.id = b.blocker_id || b.id;
      if (b.type)        result.type        = b.type;
      if (b.title)       result.title       = b.title;
      if (b.owner)       result.owner       = b.owner;
      if (b.created_at)  result.created_at  = b.created_at;
      if (b.severity)    result.severity    = b.severity;
      result.sla_hours_remaining = slaHoursRemaining;
      result.sla_overdue         = slaOverdue;
      if (b.next_action) result.next_action = b.next_action;
      if (b.status)      result.status      = b.status;
      if (b.target_resolution || b.due_date)
        result.target_resolution = b.target_resolution || b.due_date;
      return result;
    });
  } catch { return []; }
}

/**
 * Get recent activity entries and load all from agent_activity.json.
 * Returns { entries, lastUpdated }
 */
function loadActivity() {
  try {
    const data = readJSON('agent_activity.json');
    const all  = [];
    if (Array.isArray(data.activities))     all.push(...data.activities);
    if (Array.isArray(data.activity_stream)) all.push(...data.activity_stream);
    return { entries: all, lastUpdated: data.lastUpdated || data.timestamp || null };
  } catch { return { entries: [], lastUpdated: null }; }
}

/**
 * Get the last N activity entries mentioning a venture.
 */
function getRecentActivity(ventureId, ventureName, limit = 10) {
  const { entries } = loadActivity();
  const filtered = filterActivityByVenture(ventureId, ventureName, entries, 'all');
  filtered.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
  return filtered.slice(0, limit).map(e => ({
    timestamp: e.timestamp || null,
    agent: e.agent || null,
    action: e.action || null,
    description: e.description || null,
    severity: e.severity || 'info'
  }));
}

// ---------------------------------------------------------------------------
// Stage display helpers
// ---------------------------------------------------------------------------

function stageDisplay(venture) {
  const stage = venture.stage || '—';
  if (!venture.timeline_weeks || !venture.started_date) return stage;
  const started = new Date(venture.started_date).getTime();
  const daysIn  = Math.max(0, Math.floor((Date.now() - started) / 86400000));
  const weekNum  = Math.max(1, Math.ceil((daysIn + 1) / 7));
  const weekCap  = Math.min(weekNum, venture.timeline_weeks);
  return `${stage} (Week ${weekCap} of ${venture.timeline_weeks})`;
}

function daysInStage(venture) {
  if (!venture.started_date) return null;
  const started = new Date(venture.started_date).getTime();
  return Math.max(0, Math.floor((Date.now() - started) / 86400000));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * GET /api/ventures  (existing, enhanced with health + sources)
 * Returns ventures filtered + sorted.
 */
function queryVentures(filters = {}) {
  const cacheKey = `list:${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const scoreboard  = loadScoreboard();
  const suppArr     = loadVenturesSupp();
  const allBlockers = loadAllBlockers();

  let ventures = scoreboard.ventures.map(v => mergeVenture(v, suppArr));

  const { stage, search, status, owner_agent, sort } = filters;

  if (stage)       ventures = ventures.filter(v => v.stage === stage);
  if (status)      ventures = ventures.filter(v => v.status === status);
  if (owner_agent) ventures = ventures.filter(v => v.owner_agent === owner_agent);
  if (search)      ventures = ventures.filter(v => matchesSearch(v, search));

  applySort(ventures, sort || 'last_event_desc');

  const sbMtime  = new Date(fileMtime('venture_scoreboard.json')).toISOString();
  const blkMtime = new Date(fileMtime('blocked_work.json')).toISOString();

  const result = {
    timestamp: new Date().toISOString(),
    ventures: ventures.map(v => {
      const ventureBlockers = getVentureBlockers(v.venture_id, allBlockers);
      const { health, reason } = calculateHealth(v.venture_id, allBlockers);
      return {
        ...toSummary(v),
        health,
        health_reason: reason,
        blocked: ventureBlockers.length > 0,
        blocker_count: ventureBlockers.length,
        sources: {
          data: 'venture_scoreboard.json',
          data_lastUpdated: scoreboard.lastUpdated || sbMtime,
          health: 'blocked_work.json',
          health_lastUpdated: blkMtime
        }
      };
    }),
    total: ventures.length,
    filters_applied: {
      stage: stage || null,
      search: search || null,
      status: status || null,
      owner_agent: owner_agent || null,
      sort: sort || 'last_event_desc'
    },
    sources: {
      ventures: 'venture_scoreboard.json',
      blockers: 'blocked_work.json',
      velocity: 'venture_velocity.json'
    }
  };

  setCache(cacheKey, result, 5000);
  return result;
}

/**
 * GET /api/ventures  V2 badge-focused list (spec format)
 * Derives ventures from scoreboard + enriches with health, sources.
 */
function getVentures() {
  const cacheKey = 'getVentures';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const scoreboard  = loadScoreboard();
  const suppArr     = loadVenturesSupp();
  const allBlockers = loadAllBlockers();
  const { entries: actEntries } = loadActivity();

  const sbMtime  = new Date(fileMtime('venture_scoreboard.json')).toISOString();
  const blkMtime = new Date(fileMtime('blocked_work.json')).toISOString();
  const velMtime = new Date(fileMtime('venture_velocity.json')).toISOString();

  const ventures = scoreboard.ventures.map(v => {
    const merged = mergeVenture(v, suppArr);
    const ventureBlockers = getVentureBlockers(merged.venture_id, allBlockers);
    const { health, reason } = calculateHealth(merged.venture_id, allBlockers);

    // Last event from activity or from venture itself
    const lastEventFromActivity = filterActivityByVenture(
      merged.venture_id, merged.name, actEntries, 'all'
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const lastEvent = merged.last_event
      ? { timestamp: merged.last_event.timestamp, summary: merged.last_event.summary }
      : lastEventFromActivity
        ? { timestamp: lastEventFromActivity.timestamp, summary: lastEventFromActivity.action }
        : null;

    const out = {
      venture_id: merged.venture_id,
      name: merged.name,
      stage: merged.stage,
      status: merged.status,
      owner: merged.owner || merged.owner_agent || null,
      priority: merged.priority || null,
      health,
      health_reason: reason,
      blocked: ventureBlockers.length > 0,
      blocker_count: ventureBlockers.length,
      sources: {
        data: 'venture_scoreboard.json',
        data_lastUpdated: scoreboard.lastUpdated || sbMtime,
        health: 'blocked_work.json',
        health_lastUpdated: blkMtime
      }
    };
    if (lastEvent) out.last_event = lastEvent;
    return out;
  });

  const result = {
    timestamp: new Date().toISOString(),
    ventures,
    total: ventures.length,
    sources: {
      ventures: `venture_scoreboard.json (lastUpdated: ${scoreboard.lastUpdated || sbMtime})`,
      blockers: `blocked_work.json (lastUpdated: ${blkMtime})`,
      velocity: `venture_velocity.json (lastUpdated: ${velMtime})`
    }
  };

  setCache(cacheKey, result, 5000);
  return result;
}

/**
 * GET /api/ventures/stage/:stage
 */
function getVenturesByStage(stage) {
  const scoreboard = loadScoreboard();
  const ventures = scoreboard.ventures
    .filter(v => v.stage === stage)
    .map(toSummary);

  applySort(ventures, 'last_event_desc');

  return {
    timestamp: new Date().toISOString(),
    stage,
    count: ventures.length,
    ventures
  };
}

/**
 * GET /api/ventures/:venture_id  (V2 full detail)
 * Returns the complete 7-section response for the detail drawer.
 * Returns null if venture not found.
 */
function getVentureDetail(ventureId) {
  const cacheKey = `detail:${ventureId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const scoreboard  = loadScoreboard();
  const suppArr     = loadVenturesSupp();
  const allBlockers = loadAllBlockers();

  // Find by exact ID, alternate ID, or slug normalization
  let sbVenture = scoreboard.ventures.find(v => v.venture_id === ventureId);
  if (!sbVenture) {
    // Try alt: match supp ID back to scoreboard
    const supp = suppArr.find(s => s.venture_id === ventureId);
    if (supp) {
      const nameLower = (supp.name || '').toLowerCase();
      sbVenture = scoreboard.ventures.find(v =>
        (v.name || '').toLowerCase() === nameLower
      );
    }
  }
  if (!sbVenture) {
    // Slug normalization fallback
    const normalId = ventureId.replace(/-ai$/, '').toLowerCase();
    sbVenture = scoreboard.ventures.find(v =>
      (v.venture_id || '').toLowerCase() === normalId
    );
  }
  if (!sbVenture) return null;

  const venture = mergeVenture(sbVenture, suppArr);

  // ── Workstreams ──
  const workstreams = getRelatedWorkstreams(venture.venture_id);

  // ── Blockers ──
  const blockers = getBlockers(venture.venture_id);

  // ── Activity ──
  const { entries: actEntries, lastUpdated: actLastUpdated } = loadActivity();
  const allVentureActivity = filterActivityByVenture(
    venture.venture_id, venture.name, actEntries, 'all'
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const recentActivity = allVentureActivity.slice(0, 20).map(e => ({
    timestamp: e.timestamp || null,
    agent: e.agent || null,
    action: e.action || null,
    description: e.description || null,
    severity: e.severity || 'info'
  }));

  // ── Health ──
  const { health, reason: healthReason } = calculateHealth(venture.venture_id, allBlockers);

  // ── Checklist ──
  const checklist = calculateReadiness(venture, workstreams);

  // ── Header ──
  const days = daysInStage(venture);
  const stageDisp = stageDisplay(venture);
  const sbMtime   = fileMtime('venture_scoreboard.json');
  const staleSinceHours = sbMtime > 0
    ? +((Date.now() - sbMtime) / 3600000).toFixed(2)
    : null;

  const header = {
    stage_display: stageDisp,
    days_in_stage: days,
    health,
    health_reason: healthReason,
    lastUpdated: scoreboard.lastUpdated || new Date(sbMtime).toISOString()
  };
  if (staleSinceHours != null) header.stale_since_hours = staleSinceHours;

  // ── Metrics ──
  const metrics = {};
  const targets = venture.metrics || {};
  if (Object.keys(targets).length > 0) {
    metrics.targets = {
      accuracy: targets.accuracy_target != null ? targets.accuracy_target : undefined,
      nps: targets.nps_target != null ? targets.nps_target : undefined,
      customers: targets.customers_target != null ? targets.customers_target : undefined,
      mrr: targets.mrr_target != null ? targets.mrr_target : (venture.mrr_target || undefined)
    };
    // Remove undefined keys
    Object.keys(metrics.targets).forEach(k => {
      if (metrics.targets[k] === undefined) delete metrics.targets[k];
    });
  }
  if (days != null) {
    metrics.execution = {
      time_to_mvp_weeks: venture.timeline_weeks || null,
      days_in_stage: days,
      deploy_count: 0,
      incident_count: 0
    };
  }

  // ── Artifacts ──
  const links = venture.links || {};
  const artifactPaths = venture.artifact_paths || {};
  const artifacts = {
    proposal: artifactPaths.proposal || null,
    prd:      links.prd || artifactPaths.prd || null,
    cr:       links.cr  || artifactPaths.cr  || null,
    repo:     links.repo_path || artifactPaths.repo || null,
    demo:     links.demo_url  || artifactPaths.demo || null
  };
  // Remove nulls
  Object.keys(artifacts).forEach(k => { if (!artifacts[k]) delete artifacts[k]; });

  // ── File mtimes for sources ──
  const blkMtime  = new Date(fileMtime('blocked_work.json')).toISOString();
  const actMtime  = new Date(fileMtime('agent_activity.json')).toISOString();
  const wsMtime   = new Date(fileMtime('workstreams.json')).toISOString();
  const velMtime  = new Date(fileMtime('venture_velocity.json')).toISOString();
  const sbMtimeIso = new Date(sbMtime).toISOString();

  // ── Build venture object ──
  const ventureOut = {
    venture_id: venture.venture_id
  };
  if (venture.venture_id_alt) ventureOut.venture_id_alt = venture.venture_id_alt;
  if (venture.name)         ventureOut.name         = venture.name;
  if (venture.description)  ventureOut.description  = venture.description;
  if (venture.stage)        ventureOut.stage        = venture.stage;
  if (venture.status)       ventureOut.status       = venture.status;
  if (venture.owner || venture.owner_agent)
    ventureOut.owner = venture.owner || venture.owner_agent;
  if (venture.priority)     ventureOut.priority     = venture.priority;
  ventureOut.health = health;
  if (venture.created_at)   ventureOut.created_at   = venture.created_at;
  if (venture.started_date) ventureOut.started_date = venture.started_date;
  if (venture.timeline_weeks) ventureOut.timeline_weeks = venture.timeline_weeks;
  if (Object.keys(artifacts).length > 0) ventureOut.artifacts = artifacts;
  if (Object.keys(targets).length > 0)   ventureOut.metrics   = targets;
  if (venture.tags && venture.tags.length > 0) ventureOut.tags = venture.tags;
  if (venture.notes) ventureOut.notes = venture.notes;

  const result = {
    timestamp: new Date().toISOString(),
    venture: ventureOut,
    header,
    timeline: {
      recent: recentActivity,
      total_entries: allVentureActivity.length,
      sources: `agent_activity.json (lastUpdated: ${actLastUpdated || actMtime})`
    },
    workstreams,
    blockers,
    checklist,
    metrics: Object.keys(metrics).length > 0 ? metrics : null,
    // Keep backwards-compat fields
    related_workstreams: workstreams,
    recent_activity: recentActivity,
    sources: {
      venture:     `venture_scoreboard.json (lastUpdated: ${scoreboard.lastUpdated || sbMtimeIso})`,
      workstreams: `venture_work_links.json + workstreams.json (lastUpdated: ${wsMtime})`,
      blockers:    `blocked_work.json (lastUpdated: ${blkMtime})`,
      activity:    `agent_activity.json (lastUpdated: ${actLastUpdated || actMtime})`,
      velocity:    `venture_velocity.json (lastUpdated: ${velMtime})`
    }
  };

  setCache(cacheKey, result, 5000);
  return result;
}

/**
 * GET /api/stages
 * Returns stage definitions with venture counts + venture summaries.
 */
function getStages() {
  const scoreboard = loadScoreboard();
  const stageOrder = scoreboard.stage_order || [
    'Opportunity', 'Qualified', 'In Progress', 'Due Diligence',
    'Negotiation', 'Approval', 'Closing', 'Closed'
  ];

  const stageMap = {};
  stageOrder.forEach(name => { stageMap[name] = []; });

  scoreboard.ventures.forEach(v => {
    if (!v.stage) return;
    if (!stageMap[v.stage]) stageMap[v.stage] = [];
    stageMap[v.stage].push({ venture_id: v.venture_id, name: v.name });
  });

  return {
    timestamp: new Date().toISOString(),
    stages: stageOrder.map((name, index) => ({
      name,
      order: index,
      count: (stageMap[name] || []).length,
      ventures: stageMap[name] || []
    }))
  };
}

module.exports = {
  queryVentures,
  getVentures,
  getVenturesByStage,
  getVentureDetail,
  getStages,
  // V2 exports for unit tests
  calculateHealth,
  calculateReadiness,
  filterActivityByVenture,
  // Helpers for unit tests
  _matchesSearch: matchesSearch,
  _applySort: applySort,
  _toSummary: toSummary,
  _getRelatedWorkstreams: getRelatedWorkstreams,
  _getBlockers: getBlockers,
  _getRecentActivity: getRecentActivity,
  _loadScoreboard: loadScoreboard,
  _DATA_ROOT: DATA_ROOT
};
