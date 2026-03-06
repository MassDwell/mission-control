#!/usr/bin/env node
/**
 * Mission Control Data Watchdog
 * CR-MC-DATA-INTEGRITY-REBUILD — Part 7
 *
 * Runs every 10 minutes (via cron).
 * Checks SSOT files for existence, parsability, schema validity, and freshness.
 * Auto-regenerates missing/invalid files and logs incidents to agent_activity.json.
 *
 * Cron: 0,10,20,30,40,50 * * * * node /workspace/scripts/mission-control-watchdog.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SSOT_PATH     = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');
const SCHEMA_FILE   = path.join(os.homedir(), '.openclaw/workspace/mission-control/schema_registry.json');
const ACTIVITY_FILE = path.join(SSOT_PATH, 'agent_activity.json');
const MAX_STALE_MS  = 2 * 60 * 60 * 1000; // 2 hours

// ---------------------------------------------------------------------------
// Load schema registry
// ---------------------------------------------------------------------------

let schemaRegistry = {};
try {
  schemaRegistry = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
  // Remove _meta key
  delete schemaRegistry._meta;
} catch (err) {
  console.error(`[WATCHDOG] Cannot load schema registry: ${err.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Defaults for regeneration
// ---------------------------------------------------------------------------

const FILE_DEFAULTS = {
  'agent_activity.json': {
    lastUpdated: new Date().toISOString(),
    activities: [{
      timestamp: new Date().toISOString(),
      agent: 'System',
      action: 'Watchdog: file regenerated',
      description: 'agent_activity.json was missing or invalid. Regenerated with defaults.',
      severity: 'warning',
      source: 'system'
    }]
  },
  'workstreams.json': {
    lastUpdated: new Date().toISOString(),
    workstreams: []
  },
  'blocked_work.json': {
    lastUpdated: new Date().toISOString(),
    blocked: []
  },
  'venture_velocity.json': {
    lastUpdated: new Date().toISOString(),
    ventures: []
  },
  'venture_work_links.json': {
    lastUpdated: new Date().toISOString(),
    pipeline: []
  },
  'venture_scoreboard.json': {
    lastUpdated: new Date().toISOString(),
    ideas: 0,
    mvp: 0,
    running: 0,
    launched: 0,
    killed: 0,
    success_rate: 0.0,
    ventures: []
  },
  'agents_runtime.json': {
    lastUpdated: new Date().toISOString(),
    agents: [
      { id: 'clawson',            name: 'Clawson',            status: 'unknown', role: 'orchestrator',       last_heartbeat: new Date().toISOString(), owned_workstreams: 0, recent_errors: 0 },
      { id: 'codesmith',          name: 'Codesmith',          status: 'unknown', role: 'engineering',        last_heartbeat: new Date().toISOString(), owned_workstreams: 0, recent_errors: 0 },
      { id: 'moonshot',           name: 'Moonshot',           status: 'unknown', role: 'venture_discovery',  last_heartbeat: new Date().toISOString(), owned_workstreams: 0, recent_errors: 0 },
      { id: 'personal-assistant', name: 'Personal Assistant', status: 'unknown', role: 'operations',         last_heartbeat: new Date().toISOString(), owned_workstreams: 0, recent_errors: 0 }
    ]
  },
  'system_insights.json': {
    lastUpdated: new Date().toISOString(),
    insights: []
  },
  'venture_relationships.json': {
    lastUpdated: new Date().toISOString(),
    nodes: [],
    edges: []
  },
  'ventures.json': {
    lastUpdated: new Date().toISOString(),
    ventures: []
  }
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a data object against the schema registry entry.
 */
function validateSSO(filename, data) {
  const schema = schemaRegistry[filename];
  if (!schema) throw new Error(`No schema for ${filename}`);

  for (const key of (schema.required_keys || [])) {
    if (!(key in data)) {
      throw new Error(`Missing required key: "${key}" in ${filename}`);
    }
  }

  // Check min_entries if array_key is specified
  if (schema.array_key && schema.min_entries > 0) {
    const arr = data[schema.array_key];
    if (!Array.isArray(arr) || arr.length < schema.min_entries) {
      throw new Error(`${filename}.${schema.array_key} has ${Array.isArray(arr) ? arr.length : 0} entries, need at least ${schema.min_entries}`);
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function logWarning(message, description) {
  console.warn(`[WATCHDOG] WARNING: ${message}`);
  try {
    const activityData = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8'));
    if (!Array.isArray(activityData.activities)) activityData.activities = [];
    activityData.activities.unshift({
      timestamp: new Date().toISOString(),
      agent: 'System',
      action: `Watchdog: ${message}`,
      description: description || message,
      severity: 'warning',
      source: 'system'
    });
    activityData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(activityData, null, 2), 'utf8');
  } catch (e) {
    console.error(`[WATCHDOG] Could not append to agent_activity.json: ${e.message}`);
  }
}

function logInfo(message) {
  console.log(`[WATCHDOG] ${message}`);
}

// ---------------------------------------------------------------------------
// Regeneration
// ---------------------------------------------------------------------------

function regenerateFile(filename) {
  const defaults = FILE_DEFAULTS[filename];
  if (!defaults) {
    console.error(`[WATCHDOG] No defaults defined for ${filename}, skipping regeneration`);
    return;
  }
  const filepath = path.join(SSOT_PATH, filename);
  try {
    // Update timestamps
    defaults.lastUpdated = new Date().toISOString();
    fs.writeFileSync(filepath, JSON.stringify(defaults, null, 2), 'utf8');
    logInfo(`Regenerated: ${filename}`);
  } catch (err) {
    console.error(`[WATCHDOG] Failed to regenerate ${filename}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main watchdog
// ---------------------------------------------------------------------------

function watchdog() {
  logInfo(`Starting watchdog run at ${new Date().toISOString()}`);
  logInfo(`SSOT path: ${SSOT_PATH}`);

  const results = {
    checked: 0,
    missing: 0,
    invalid: 0,
    stale: 0,
    healthy: 0
  };

  for (const [filename, schema] of Object.entries(schemaRegistry)) {
    const filepath = path.join(SSOT_PATH, filename);
    results.checked++;

    // 1. Check existence
    if (!fs.existsSync(filepath)) {
      results.missing++;
      logWarning(`Missing: ${filename}`, `SSOT file not found at ${filepath}. Auto-regenerating with defaults.`);
      regenerateFile(filename);
      continue;
    }

    // 2. Check parsability + schema
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      validateSSO(filename, data);
    } catch (err) {
      results.invalid++;
      logWarning(`Invalid: ${filename}`, `Schema or parse error: ${err.message}. Auto-regenerating.`);
      regenerateFile(filename);
      continue;
    }

    // 3. Check freshness
    try {
      const mtime = fs.statSync(filepath).mtime;
      const ageMs = Date.now() - mtime.getTime();
      if (ageMs > MAX_STALE_MS) {
        results.stale++;
        const ageHours = Math.floor(ageMs / 3600000);
        logWarning(`Stale: ${filename}`, `File is ${ageHours}h old (limit: 2h). Data may be outdated.`);
      } else {
        results.healthy++;
      }
    } catch (_) {
      results.healthy++; // stat failed but file is fine
    }
  }

  logInfo(`Watchdog complete: ${results.checked} checked, ${results.healthy} healthy, ${results.stale} stale, ${results.missing} missing, ${results.invalid} invalid`);
  return results;
}

// Run
watchdog();
