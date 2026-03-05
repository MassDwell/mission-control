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
  console.log(`[CR-002/CR-005/CR-008/CR-MC-UI-1.2] Mission Control UI running on http://localhost:${PORT}`);
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
  console.log('[CR-008] Decision token:', MC_DECISION_TOKEN ? '✓ Set (from MC_DECISION_TOKEN env)' : '✗ Using default dev token');
});

process.on('SIGINT', () => {
  console.log('\n[CR-002] Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
