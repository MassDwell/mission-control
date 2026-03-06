#!/usr/bin/env node
/**
 * CR-002: Mission Control UI V1 - Express Server
 * Lightweight dashboard backend
 * Serves static 5-panel layout and reads Mission Control data files
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Data endpoints
const dataModule = require('./api/data');

// CR-MC-UI-1.2: Venture pipeline endpoints
const venturesModule = require('./api/ventures');

// CR-VENTUREOS-V1: VentureOS governance engine (stage gates, kill rules, metrics)
const ventureOS = require('./api/ventureos'); // CR-VENTUREOS-V1-ENHANCED (8-stage pipeline)

// CR-008: Decision token for action validation
const MC_DECISION_TOKEN = process.env.MC_DECISION_TOKEN || 'local_dev_token_12345';

/**
 * GET /api/status
 * Returns system status + all dashboard data
 */
app.get('/api/status', (req, res) => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      data: {
        workstreams: dataModule.loadWorkstreams(),
        blockedWork: dataModule.loadBlockedWork(),
        ventureVelocity: dataModule.loadVentureVelocity(),
        ventureWorkLinks: dataModule.loadVentureWorkLinks(),
        agentActivity: dataModule.loadAgentActivity()
      }
    };
    res.json(data);
  } catch (err) {
    console.error('Error loading data:', err.message);
    res.status(500).json({
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/activity-feed
 * Returns real-time activity feed (CR-005)
 * Fresh from disk every request, no caching
 */
app.get('/api/activity-feed', (req, res) => {
  try {
    const feed = dataModule.loadActivityFeed();
    res.json(feed);
  } catch (err) {
    console.error('[ACTIVITY-FEED] Error loading activity feed:', err.message);
    res.status(500).json({
      error: err.message,
      feed: [],
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/decisions
 * Returns decisions_required.json + queue + log (CR-008)
 */
app.get('/api/decisions', (req, res) => {
  try {
    const decisions = dataModule.loadDecisionsRequired();
    const queue = dataModule.loadDecisionActionsQueue();
    const log = dataModule.loadDecisionActionsLog();
    
    res.json({
      timestamp: new Date().toISOString(),
      decisions: decisions.decisions || [],
      queue: queue.items || [],
      log: log.entries || []
    });
  } catch (err) {
    console.error('[DECISIONS] Error loading decisions:', err.message);
    res.status(500).json({
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/venture-scoreboard
 * Returns venture scoreboard data (CR-009)
 * Tracks: ideas, MVPs, experiments, live, killed, success rate
 */
app.get('/api/venture-scoreboard', (req, res) => {
  try {
    const scoreboard = dataModule.loadVentureScoreboard();
    res.json(scoreboard);
  } catch (err) {
    console.error('[VENTURE-SCOREBOARD] Error loading scoreboard:', err.message);
    // Return default empty scoreboard on error
    res.json({
      schema_version: '1.0.0',
      timestamp: new Date().toISOString(),
      ideas_generated: 0,
      mvps_built: 0,
      experiments_running: 0,
      ventures_live: 0,
      ventures_killed: 0,
      success_rate: 0
    });
  }
});

/**
 * POST /api/decisions/action (CR-008)
 * Queue a decision action (two-step commit)
 * Requires X-MC-TOKEN header
 * 
 * Request:
 *   decision_id: string (uuid)
 *   action: "review" | "approve" | "reject"
 *   note: optional string
 *   requested_by: optional string (defaults to "steve")
 */
app.post('/api/decisions/action', (req, res) => {
  // Token validation
  const token = req.headers['x-mc-token'];
  if (!token || token !== MC_DECISION_TOKEN) {
    console.warn('[DECISIONS] Invalid or missing token:', token ? 'mismatched' : 'missing');
    return res.status(401).json({
      status: 'error',
      error: 'invalid_token',
      message: 'Missing or invalid X-MC-TOKEN header'
    });
  }

  const { decision_id, action, note, requested_by } = req.body;

  // Validate required fields
  if (!decision_id || !action) {
    return res.status(400).json({
      status: 'error',
      error: 'missing_fields',
      message: 'Required: decision_id, action'
    });
  }

  // Validate action type
  if (!['review', 'approve', 'reject'].includes(action)) {
    return res.status(400).json({
      status: 'error',
      error: 'invalid_action',
      message: 'Action must be: review, approve, or reject'
    });
  }

  // Validate decision exists
  try {
    const decisions = dataModule.loadDecisionsRequired();
    const decision = (decisions.decisions || []).find(d => d.decision_id === decision_id);
    if (!decision) {
      return res.status(404).json({
        status: 'error',
        error: 'decision_not_found',
        message: `Decision ${decision_id} not found in decisions_required.json`
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: 'validation_failed',
      message: `Could not validate decision: ${err.message}`
    });
  }

  // Generate action_id
  const action_id = randomUUID();

  // Append to queue
  try {
    dataModule.appendToDecisionQueue({
      action_id,
      decision_id,
      action,
      requested_by: requested_by || 'steve',
      note
    });

    console.log(`[DECISIONS] Action queued: ${action_id} for decision ${decision_id}`);

    return res.status(202).json({
      status: 'queued',
      action_id,
      decision_id,
      queued_at: new Date().toISOString(),
      message: 'Decision action queued for processing by Clawson'
    });
  } catch (err) {
    console.error('[DECISIONS] Error queuing action:', err.message);
    return res.status(500).json({
      status: 'error',
      error: 'queue_failed',
      message: `Failed to queue action: ${err.message}`
    });
  }
});

// ===========================================================================
// CR-MC-OPS-PANELS-UPGRADE: Workstreams, Blockers, System Status API
// ===========================================================================

const workstreamsModule = require('./api/workstreams');

/**
 * GET /api/workstreams
 * Returns all active workstreams with health + blocked flags.
 */
app.get('/api/workstreams', (req, res) => {
  try {
    const result = workstreamsModule.getWorkstreams();
    res.json(result);
  } catch (err) {
    console.error('[WORKSTREAMS] Error loading workstreams:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/workstreams/:id
 * Returns full workstream detail.
 */
app.get('/api/workstreams/:id', (req, res) => {
  try {
    const result = workstreamsModule.getWorkstreamDetail(req.params.id);
    if (!result) {
      return res.status(404).json({
        error: 'Workstream not found',
        id: req.params.id,
        timestamp: new Date().toISOString()
      });
    }
    res.json(result);
  } catch (err) {
    console.error('[WORKSTREAMS] Error loading workstream detail:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/blockers
 * Returns all blockers with SLA calculations.
 */
app.get('/api/blockers', (req, res) => {
  try {
    const result = workstreamsModule.getBlockers();
    res.json(result);
  } catch (err) {
    console.error('[BLOCKERS] Error loading blockers:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/blockers/:id
 * Returns full blocker detail.
 */
app.get('/api/blockers/:id', (req, res) => {
  try {
    const result = workstreamsModule.getBlockerDetail(req.params.id);
    if (!result) {
      return res.status(404).json({
        error: 'Blocker not found',
        id: req.params.id,
        timestamp: new Date().toISOString()
      });
    }
    res.json(result);
  } catch (err) {
    console.error('[BLOCKERS] Error loading blocker detail:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/system-status
 * Returns agent health monitor data.
 */
app.get('/api/system-status', (req, res) => {
  try {
    const result = workstreamsModule.getSystemStatus();
    res.json(result);
  } catch (err) {
    console.error('[SYSTEM-STATUS] Error loading system status:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/workstream-flow
 * Returns stage distribution for Workstream Flow panel.
 */
app.get('/api/workstream-flow', (req, res) => {
  try {
    const result = workstreamsModule.getWorkstreamFlow();
    res.json(result);
  } catch (err) {
    console.error('[WORKSTREAM-FLOW] Error loading flow data:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===========================================================================
// CR-MC-UI-1.2: Venture Pipeline API (read-only, SSOT-direct)
// ===========================================================================

/**
 * GET /api/ventures
 * Returns all ventures with optional filtering + sorting.
 * V2: Also includes health, blocker counts, and sources per venture.
 *
 * Query params:
 *   stage       — filter by stage name (e.g. "In Progress")
 *   search      — fuzzy text match on name/description/tags
 *   status      — filter by status (active|paused|killed|launched)
 *   owner_agent — filter by agent (codesmith|moonshot|clawson)
 *   sort        — last_event_desc (default)|name_asc|mrr_desc|priority_high
 *   v           — "2" to use getVentures() V2 badge format
 */
app.get('/api/ventures', (req, res) => {
  try {
    const { stage, search, status, owner_agent, sort, v } = req.query;
    let result;
    if (v === '2' || (!stage && !search && !status && !owner_agent)) {
      // V2 badge-focused list when no filters applied
      result = venturesModule.getVentures();
      // If filters were requested, fall back to queryVentures
      if (stage || search || status || owner_agent) {
        result = venturesModule.queryVentures({ stage, search, status, owner_agent, sort });
      }
    } else {
      result = venturesModule.queryVentures({ stage, search, status, owner_agent, sort });
    }
    res.json(result);
  } catch (err) {
    console.error('[VENTURES] Error querying ventures:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ventures/stage/:stage
 * Returns all ventures in a specific pipeline stage.
 * :stage is URL-decoded automatically by Express.
 */
app.get('/api/ventures/stage/:stage', (req, res) => {
  try {
    const stage = req.params.stage;
    const result = venturesModule.getVenturesByStage(stage);
    res.json(result);
  } catch (err) {
    console.error('[VENTURES] Error loading stage:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      timestamp: new Date().toISOString()
    });
  }
});

// CR-VENTUREOS-V1-ENHANCED: Static VentureOS GET routes — MUST be before /:venture_id
// ==================================================================================

/**
 * GET /api/ventures/portfolio
 * List all active ventures (VentureOS portfolio index).
 */
app.get('/api/ventures/portfolio', (req, res) => {
  try {
    const filters = {};
    if (req.query.stage) filters.stage = req.query.stage;
    if (req.query.status) filters.status = req.query.status;
    res.json(ventureOS.listVentures(filters));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ventures/stages
 * All 8 stage definitions with requirements.
 */
app.get('/api/ventures/stages', (req, res) => {
  try {
    res.json({ stages: ventureOS.getAllStageRequirements(), pipeline: ventureOS.STAGES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================================================================================

/**
 * GET /api/ventures/:venture_id
 * Returns full venture detail + related_workstreams + blockers + recent_activity.
 * NOTE: This route must come AFTER /api/ventures/stage/:stage to avoid shadowing.
 */
app.get('/api/ventures/:venture_id', (req, res) => {
  try {
    const { venture_id } = req.params;
    const result = venturesModule.getVentureDetail(venture_id);
    if (!result) {
      return res.status(404).json({
        error: 'Venture not found',
        venture_id,
        timestamp: new Date().toISOString()
      });
    }
    res.json(result);
  } catch (err) {
    console.error('[VENTURES] Error loading venture detail:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/stages
 * Returns stage definitions in pipeline order with venture counts.
 */
app.get('/api/stages', (req, res) => {
  try {
    const result = venturesModule.getStages();
    res.json(result);
  } catch (err) {
    console.error('[STAGES] Error loading stages:', err.message);
    res.status(500).json({
      error: 'SSOT file missing or unreadable',
      path: err.ssotPath || null,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/debug/ssot
 * Verify Single Source of Truth - file mtimes and lastUpdated fields
 */
app.get('/api/debug/ssot', (req, res) => {
  const DATA_ROOT = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');
  
  const files = [
    'workstreams.json',
    'blocked_work.json',
    'venture_velocity.json',
    'venture_work_links.json',
    'agent_activity.json'
  ];
  
  const fileStatus = {};
  files.forEach(filename => {
    const filePath = path.join(DATA_ROOT, filename);
    try {
      const stat = fs.statSync(filePath);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      fileStatus[filename] = {
        absolute_path: filePath,
        mtime: stat.mtime.toISOString(),
        size_bytes: stat.size,
        lastUpdated_in_json: content.lastUpdated || content.timestamp || 'NO FIELD'
      };
    } catch (err) {
      fileStatus[filename] = { error: err.message };
    }
  });
  
  res.json({
    ssot_root: DATA_ROOT,
    query_time: new Date().toISOString(),
    files: fileStatus
  });
});

/**
 * GET /api/health
 * Simple health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===========================================================================
// CR-VENTUREOS-V1: VentureOS Governance API
// 8 endpoints: list, detail, create, gate, kill, metrics, pipeline, at-risk
// ===========================================================================

/**
 * GET /api/ventureos/ventures
 * List all ventures with summary + portfolio counts.
 */
app.get('/api/ventureos/ventures', (req, res) => {
  try {
    const { stage, status } = req.query;
    const result = ventureOS.listVentures({ stage, status });
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] listVentures error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

/**
 * GET /api/ventureos/ventures/:venture_id
 * Full venture detail (scoreboard + ventures.json merged).
 */
app.get('/api/ventureos/ventures/:venture_id', (req, res) => {
  try {
    const { venture_id } = req.params;
    const venture = ventureOS.getVentureDetailFull(venture_id);
    if (!venture) return res.status(404).json({ error: `Venture not found: ${venture_id}` });
    res.json({ venture, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[VENTUREOS] getVentureDetail error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

/**
 * POST /api/ventureos/ventures
 * Create a new venture in OPPORTUNITY stage.
 * Body: { name, description, owner, market_opportunity?, memo_url?, timeline_weeks?, target_mrr?, financials? }
 */
app.post('/api/ventureos/ventures', (req, res) => {
  try {
    const result = ventureOS.createVenture(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('[VENTUREOS] createVenture error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

/**
 * POST /api/ventureos/ventures/:venture_id/gate
 * Advance venture to next stage (validates gate preconditions).
 * Body: { next_stage }
 */
app.post('/api/ventureos/ventures/:venture_id/gate', (req, res) => {
  try {
    const { venture_id } = req.params;
    const { next_stage } = req.body;
    if (!next_stage) return res.status(400).json({ error: 'next_stage is required' });
    const result = ventureOS.advanceStage(venture_id, next_stage);
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] advanceStage error:', err.message);
    const payload = { error: err.message, timestamp: new Date().toISOString() };
    if (err.missing) payload.missing_requirements = err.missing;
    if (err.gate)    payload.gate = err.gate;
    res.status(err.statusCode || 500).json(payload);
  }
});

/**
 * POST /api/ventureos/ventures/:venture_id/kill
 * Kill venture. No appeal.
 * Body: { reason, decision_maker, notes? }
 * decision_maker must be: clawson | steve
 */
app.post('/api/ventureos/ventures/:venture_id/kill', (req, res) => {
  try {
    const { venture_id }                  = req.params;
    const { reason, decision_maker, notes } = req.body;
    const result = ventureOS.killVenture(venture_id, reason, decision_maker, notes);
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] killVenture error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

/**
 * POST /api/ventureos/ventures/:venture_id/metrics
 * Update success metrics.
 * Body: { mrr_current?, customer_current?, accuracy_current?, nps_current? }
 */
app.post('/api/ventureos/ventures/:venture_id/metrics', (req, res) => {
  try {
    const { venture_id } = req.params;
    const result = ventureOS.updateMetrics(venture_id, req.body);
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] updateMetrics error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

/**
 * GET /api/venture-pipeline
 * Stage distribution for Mission Control widget.
 */
app.get('/api/venture-pipeline', (req, res) => {
  try {
    const result = ventureOS.getPipeline();
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] getPipeline error:', err.message);
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

/**
 * GET /api/venture-at-risk
 * List ventures at risk: overdue, stale blockers, metrics below target.
 */
app.get('/api/venture-at-risk', (req, res) => {
  try {
    const atRisk = ventureOS.getAtRisk();
    res.json({
      at_risk: atRisk,
      total:   atRisk.length,
      critical: atRisk.filter(v => v.highest_severity === 'critical').length,
      warning:  atRisk.filter(v => v.highest_severity === 'warning').length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[VENTUREOS] getAtRisk error:', err.message);
    res.status(500).json({ error: err.message, at_risk: [], timestamp: new Date().toISOString() });
  }
});

// ===========================================================================
// CR-MC-PALANTIR-OPERATOR-LOOPS: Palantir Mode API
// ===========================================================================

const palantir = require('./api/palantir');

// CR-OPERATOR-COMMAND-UPGRADE: Guidance engines
const operatorGuidance = require('./api/operator-guidance');
const founderDecisions = require('./api/founder-decisions');

/**
 * GET /api/agents
 * Phase 1: SSOT — returns agents_runtime.json (dynamic agent count)
 */
app.get('/api/agents', (req, res) => {
  try {
    const result = palantir.getActiveAgents();
    res.json(result);
  } catch (err) {
    console.error('[AGENTS] Error:', err.message);
    res.status(500).json({ error: err.message, ssotPath: err.ssotPath || null });
  }
});

/**
 * GET /api/venture-graph
 * Returns venture_relationships.json for graph visualization
 */
app.get('/api/venture-graph', (req, res) => {
  try {
    const result = palantir.getVentureGraph();
    res.json(result);
  } catch (err) {
    console.error('[VENTURE-GRAPH] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/commands/pause/:venture_id
 * Phase 2: Pause a venture
 */
app.post('/api/commands/pause/:venture_id', (req, res) => {
  try {
    const result = palantir.pauseVenture(req.params.venture_id, req.body.actor || 'Steve Vettori');
    res.json(result);
  } catch (err) {
    console.error('[CMD-PAUSE] Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commands/resume/:venture_id
 * Phase 2: Resume a paused venture
 */
app.post('/api/commands/resume/:venture_id', (req, res) => {
  try {
    const result = palantir.resumeVenture(req.params.venture_id, req.body.actor || 'Steve Vettori');
    res.json(result);
  } catch (err) {
    console.error('[CMD-RESUME] Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commands/kill/:venture_id
 * Phase 2: Kill a venture (requires reason)
 */
app.post('/api/commands/kill/:venture_id', (req, res) => {
  try {
    const { reason, actor } = req.body;
    const result = palantir.killVenture(req.params.venture_id, reason, actor || 'Steve Vettori');
    res.json(result);
  } catch (err) {
    console.error('[CMD-KILL] Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commands/advance/:venture_id
 * Phase 2: Advance venture stage (blocked by critical blockers)
 */
app.post('/api/commands/advance/:venture_id', (req, res) => {
  try {
    const result = palantir.advanceVentureStage(req.params.venture_id, req.body.actor || 'Steve Vettori');
    res.json(result);
  } catch (err) {
    console.error('[CMD-ADVANCE] Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commands/spawn-workstream
 * Phase 2: Spawn a new workstream
 * Body: { venture_id, name, owner, phase, eta }
 */
app.post('/api/commands/spawn-workstream', (req, res) => {
  try {
    const { venture_id, name, owner, phase, eta, actor } = req.body;
    if (!venture_id || !name || !owner) {
      return res.status(400).json({ success: false, error: 'Required: venture_id, name, owner' });
    }
    const result = palantir.spawnWorkstream(venture_id, { name, owner, phase, eta }, actor || 'Steve Vettori');
    res.json(result);
  } catch (err) {
    console.error('[CMD-SPAWN] Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commands/assign-agent
 * Phase 2: Assign agent to workstream
 * Body: { workstream_id, owner }
 */
app.post('/api/commands/assign-agent', (req, res) => {
  try {
    const { workstream_id, owner, actor } = req.body;
    if (!workstream_id || !owner) {
      return res.status(400).json({ success: false, error: 'Required: workstream_id, owner' });
    }
    const result = palantir.assignAgent(workstream_id, owner, actor || 'Steve Vettori');
    res.json(result);
  } catch (err) {
    console.error('[CMD-ASSIGN] Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/insights
 * Phase 3: Compute + return live system insights
 */
app.get('/api/insights', (req, res) => {
  try {
    const result = palantir.computeInsights();
    res.json(result);
  } catch (err) {
    console.error('[INSIGHTS] Error:', err.message);
    res.status(500).json({ error: err.message, insights: [] });
  }
});

/**
 * DELETE /api/insights/:id
 * Phase 3: Dismiss an insight
 */
app.delete('/api/insights/:id', (req, res) => {
  try {
    const result = palantir.dismissInsight(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('[INSIGHTS-DISMISS] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/momentum
 * Phase 4: Momentum tracker metrics
 */
app.get('/api/momentum', (req, res) => {
  try {
    const result = palantir.getMomentum();
    res.json(result);
  } catch (err) {
    console.error('[MOMENTUM] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/impact
 * Phase 4: Operator impact tracker
 * Query: horizon=today|week|month|all
 */
app.get('/api/impact', (req, res) => {
  try {
    const result = palantir.getOperatorImpact(req.query.horizon || 'today');
    res.json(result);
  } catch (err) {
    console.error('[IMPACT] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/opportunities
 * Phase 4: Opportunity discovery feed
 */
app.get('/api/opportunities', (req, res) => {
  try {
    const result = palantir.getOpportunities();
    res.json(result);
  } catch (err) {
    console.error('[OPPORTUNITIES] Error:', err.message);
    res.status(500).json({ error: err.message, opportunities: [] });
  }
});

/**
 * GET /api/validate
 * Phase 5: SSOT validation pipeline
 */
app.get('/api/validate', (req, res) => {
  try {
    const result = palantir.validateSSO();
    res.json(result);
  } catch (err) {
    console.error('[VALIDATE] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===========================================================================
// CR-VENTUREOS-V1-ENHANCED: VentureOS Operator Commands (6 endpoints)
// ===========================================================================

/**
 * POST /api/ventures/create
 * Create a new venture at IDEA stage.
 * Body: { name, owner, description?, idea_md? }
 */
app.post('/api/ventures/create', (req, res) => {
  try {
    const { name, owner, description, idea_md } = req.body;
    if (!name || !owner) {
      return res.status(400).json({ error: 'Missing required fields: name, owner' });
    }
    const result = ventureOS.createVenture({ name, owner, description, idea_md });
    console.log(`[VENTUREOS] Created venture: ${result.slug}`);
    res.status(201).json(result);
  } catch (err) {
    console.error('[VENTUREOS] Create error:', err.message);
    const status = err.message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/ventures/:slug/advance
 * Advance venture to next stage (with gate validation).
 * Body: { next_stage }
 */
app.post('/api/ventures/:slug/advance', (req, res) => {
  try {
    const { slug } = req.params;
    const { next_stage, actor } = req.body;
    if (!next_stage) {
      return res.status(400).json({ error: 'Missing required field: next_stage' });
    }
    const result = ventureOS.advanceVenture(slug, next_stage.toUpperCase(), actor);
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Gate preconditions not met',
        missing: result.missing || [],
        errors: result.errors || []
      });
    }
    console.log(`[VENTUREOS] Advanced: ${slug} → ${next_stage}`);
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] Advance error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ventures/:slug/kill
 * Kill a venture (final, no appeal).
 * Body: { reason, decision_maker }
 */
app.post('/api/ventures/:slug/kill', (req, res) => {
  try {
    const { slug } = req.params;
    const { reason, decision_maker } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Missing required field: reason' });
    }
    // Validate authority
    const validAuthority = ['clawson', 'steve', 'system', 'system (auto-kill)'];
    const actor = (decision_maker || '').toLowerCase();
    if (decision_maker && !validAuthority.some(a => actor.includes(a))) {
      return res.status(403).json({
        error: `Unauthorized: Kill decisions require clawson or steve authority. Got: ${decision_maker}`
      });
    }
    const result = ventureOS.killVenture(slug, reason, decision_maker || 'clawson');
    console.log(`[VENTUREOS] Killed: ${slug} — ${reason}`);
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] Kill error:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/ventures/portfolio
 * List all active ventures from venture_registry.json.
 * Query: ?stage=BUILD&status=active
 *
 * Note: This route must come before GET /api/ventures/:slug to avoid
 * "portfolio" being treated as a slug.
 */
app.get('/api/ventures/portfolio', (req, res) => {
  try {
    const filters = {};
    if (req.query.stage) filters.stage = req.query.stage;
    if (req.query.status) filters.status = req.query.status;
    const result = ventureOS.listVentures(filters);
    res.json(result);
  } catch (err) {
    console.error('[VENTUREOS] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ventures/:slug/detail
 * Get full venture detail (stage + metrics + artifacts + activity).
 */
app.get('/api/ventures/:slug/detail', (req, res) => {
  try {
    const { slug } = req.params;
    const detail = ventureOS.getVentureDetail(slug);
    if (!detail) {
      return res.status(404).json({ error: `Venture not found: ${slug}` });
    }
    res.json(detail);
  } catch (err) {
    console.error('[VENTUREOS] Detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ventures/:slug/metrics
 * Update venture metrics (MRR, users, activation_rate, build_progress, etc.)
 * Automatically checks kill triggers.
 * Body: { mrr?, users?, activation_rate?, build_progress?, ... }
 */
app.post('/api/ventures/:slug/metrics', (req, res) => {
  try {
    const { slug } = req.params;
    const { actor, ...metrics } = req.body;
    if (Object.keys(metrics).length === 0) {
      return res.status(400).json({ error: 'No metrics provided to update' });
    }
    const result = ventureOS.updateMetrics(slug, metrics, actor);
    const statusCode = result.kill_triggered ? 200 : 200;
    console.log(`[VENTUREOS] Metrics updated: ${slug} — ${result.changes.join(', ')}`);
    res.status(statusCode).json(result);
  } catch (err) {
    console.error('[VENTUREOS] Metrics error:', err.message);
    const status = err.message.includes('Cannot read') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/ventures/stages
 * Get all 8 stage definitions with requirements.
 */
app.get('/api/ventures/stages', (req, res) => {
  try {
    const stages = ventureOS.getAllStageRequirements();
    res.json({ stages, pipeline: ventureOS.STAGES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ventures/:slug/check-kill
 * Manually trigger kill rule check for a venture.
 */
app.post('/api/ventures/:slug/check-kill', (req, res) => {
  try {
    const { slug } = req.params;
    const result = ventureOS.checkKillTriggers(slug);
    res.json({ slug, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// CR-OPERATOR-COMMAND-UPGRADE: Operator Guidance + Founder Decision endpoints
// ============================================================================

/**
 * GET /api/operator-guidance
 * Returns up to 4 prioritised operator recommendations (rules engine, SSOT).
 */
app.get('/api/operator-guidance', (req, res) => {
  try {
    const guidance = operatorGuidance.generateOperatorGuidance();
    res.json({
      guidance,
      count: guidance.length,
      timestamp: new Date().toISOString(),
      sources: {
        workstreams: 'workstreams.json',
        blocked_work: 'blocked_work.json',
        agents: 'agents_runtime.json',
        pipeline: 'venture_velocity.json',
        activity: 'agent_activity.json'
      }
    });
  } catch (err) {
    console.error('[OPERATOR-GUIDANCE] Error:', err.message);
    res.status(500).json({ error: err.message, guidance: [], count: 0 });
  }
});

/**
 * GET /api/founder-decisions
 * Returns strategic recommendations for venture advancement & resource decisions.
 */
app.get('/api/founder-decisions', (req, res) => {
  try {
    const decisions = founderDecisions.generateFounderDecisions();
    res.json({
      decisions,
      decision_count: Object.keys(decisions).length,
      timestamp: new Date().toISOString(),
      sources: {
        ventures: 'venture_scoreboard.json',
        agents: 'agents_runtime.json'
      }
    });
  } catch (err) {
    console.error('[FOUNDER-DECISIONS] Error:', err.message);
    res.status(500).json({ error: err.message, decisions: {} });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server (localhost only for security)
const server = app.listen(PORT, 'localhost', () => {
  console.log(`[CR-OPERATOR-COMMAND-UPGRADE] Operator Command running on http://localhost:${PORT}`);
  console.log('[MC-UI] Serving dashboard at /');
  console.log('[MC-UI] API endpoints:');
  console.log('  GET /api/status                    - Full dashboard data');
  console.log('  GET /api/activity-feed             - Real-time activity feed (CR-005)');
  console.log('  GET /api/decisions                 - Decisions + queue + log (CR-008)');
  console.log('  POST /api/decisions/action         - Queue decision action (CR-008)');
  console.log('  GET /api/ventures                  - Venture pipeline with filters (CR-MC-UI-1.2)');
  console.log('  GET /api/ventures/stage/:stage     - Ventures in a stage (CR-MC-UI-1.2)');
  console.log('  GET /api/ventures/:venture_id      - Venture detail + related data (CR-MC-UI-1.2)');
  console.log('  GET /api/stages                    - Stage definitions + counts (CR-MC-UI-1.2)');
  console.log('  GET /api/health                    - Health check');
  console.log('  GET /api/workstreams               - Active workstreams + health (CR-MC-OPS-PANELS)');
  console.log('  GET /api/workstreams/:id           - Workstream detail (CR-MC-OPS-PANELS)');
  console.log('  GET /api/blockers                  - All blockers + SLA (CR-MC-OPS-PANELS)');
  console.log('  GET /api/blockers/:id              - Blocker detail (CR-MC-OPS-PANELS)');
  console.log('  GET /api/system-status             - Agent health monitor (CR-MC-OPS-PANELS)');
  console.log('  GET /api/workstream-flow           - Stage distribution (CR-MC-OPS-PANELS)');
  console.log('[VENTUREOS-V1] VentureOS endpoints (CR-VENTUREOS-V1):');
  console.log('  GET  /api/ventureos/ventures           - List all ventures (VentureOS)');
  console.log('  GET  /api/ventureos/ventures/:id       - Full venture detail (VentureOS)');
  console.log('  POST /api/ventureos/ventures           - Create new venture (VentureOS)');
  console.log('  POST /api/ventureos/ventures/:id/gate  - Advance stage gate (VentureOS)');
  console.log('  POST /api/ventureos/ventures/:id/kill  - Kill venture (VentureOS)');
  console.log('  POST /api/ventureos/ventures/:id/metrics - Update metrics (VentureOS)');
  console.log('  GET  /api/venture-pipeline             - Pipeline distribution (VentureOS)');
  console.log('  GET  /api/venture-at-risk              - At-risk ventures (VentureOS)');
  console.log('[CR-008] Decision token:', MC_DECISION_TOKEN ? '✓ Set (from MC_DECISION_TOKEN env)' : '✗ Using default dev token');
  console.log('[VENTUREOS] VentureOS endpoints (CR-VENTUREOS-V1-ENHANCED):');
  console.log('  POST /api/ventures/create              - Create venture (IDEA stage)');
  console.log('  POST /api/ventures/:slug/advance       - Advance stage (with gate validation)');
  console.log('  POST /api/ventures/:slug/kill          - Kill venture (final)');
  console.log('  GET  /api/ventures/portfolio           - List portfolio (?stage=&status=)');
  console.log('  GET  /api/ventures/:slug/detail        - Full venture detail');
  console.log('  POST /api/ventures/:slug/metrics       - Update metrics (+ auto kill-check)');
  console.log('  GET  /api/ventures/stages              - Stage pipeline definitions');
  console.log('  POST /api/ventures/:slug/check-kill    - Manual kill trigger check');
  console.log('[PALANTIR] New endpoints (CR-MC-PALANTIR-OPERATOR-LOOPS):');
  console.log('  GET  /api/agents                   - Active agents (SSOT: agents_runtime.json)');
  console.log('  GET  /api/venture-graph            - Relationship graph data');
  console.log('  POST /api/commands/pause/:id       - Pause venture');
  console.log('  POST /api/commands/resume/:id      - Resume venture');
  console.log('  POST /api/commands/kill/:id        - Kill venture');
  console.log('  POST /api/commands/advance/:id     - Advance stage');
  console.log('  POST /api/commands/spawn-workstream- Spawn workstream');
  console.log('  POST /api/commands/assign-agent    - Assign agent');
  console.log('  GET  /api/insights                 - Live system insights');
  console.log('  DELETE /api/insights/:id           - Dismiss insight');
  console.log('  GET  /api/momentum                 - Momentum tracker');
  console.log('  GET  /api/impact                   - Operator impact');
  console.log('  GET  /api/opportunities            - Opportunity discovery');
  console.log('  GET  /api/validate                 - SSOT validation');
  console.log('[OPERATOR-COMMAND-UPGRADE] New guidance endpoints (CR-OPERATOR-COMMAND-UPGRADE):');
  console.log('  GET  /api/operator-guidance        - Operator action recommendations (rules engine)');
  console.log('  GET  /api/founder-decisions        - Strategic founder decision recommendations');
});

process.on('SIGINT', () => {
  console.log('\n[CR-002] Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
