/**
 * Mission Control Data Module
 * Loads JSON from Mission Control data sources
 * Read-only access
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Data root
const DATA_ROOT = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');

/**
 * Safely load JSON file
 * @param {string} filename - Name of JSON file in data root
 * @returns {object} Parsed JSON or empty object if missing
 */
function loadJSON(filename) {
  const filePath = path.join(DATA_ROOT, filename);
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[DATA] Missing: ${filePath}`);
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[DATA] Error loading ${filename}:`, err.message);
    return {};
  }
}

/**
 * Calculate relative time from ISO timestamp
 * @param {string} isoTimestamp - ISO-8601 timestamp string
 * @returns {string} Relative time string (e.g., "2 minutes ago")
 */
function getRelativeTime(isoTimestamp) {
  try {
    const ts = new Date(isoTimestamp);
    const now = new Date();
    const diffMs = now - ts;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Fallback to date string
    return ts.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_err) {
    return 'unknown';
  }
}

/**
 * Load and process activity feed from agent_activity.json
 * @returns {object} Validated and sorted activity feed with metadata
 */
function loadActivityFeed() {
  const data = loadJSON('agent_activity.json');
  
  if (!data.activities || !Array.isArray(data.activities)) {
    console.warn('[ACTIVITY-FEED] No activities array found in agent_activity.json');
    return {
      feed: [],
      total_entries: 0,
      displayed: 0,
      timestamp: new Date().toISOString()
    };
  }

  let validEntries = [];

  // Validate and transform entries
  data.activities.forEach((entry, index) => {
    // Skip invalid entries
    if (!entry.agent || !entry.action || !entry.timestamp) {
      console.warn(`[ACTIVITY-FEED] Skipping invalid entry at index ${index}:`, entry);
      return;
    }

    try {
      // Validate timestamp is valid ISO-8601
      const ts = new Date(entry.timestamp);
      if (isNaN(ts.getTime())) {
        console.warn(`[ACTIVITY-FEED] Skipping entry with invalid timestamp: ${entry.timestamp}`);
        return;
      }

      // Create validated entry with defaults
      const validated = {
        agent: String(entry.agent).trim(),
        action: String(entry.action).trim(),
        timestamp: entry.timestamp,
        // Map 'level' field to 'severity', default to 'info'
        severity: (entry.severity || entry.level || 'info').toLowerCase(),
        // Add source field, default to 'agent'
        source: (entry.source || 'agent').toLowerCase()
      };

      // Validate severity is one of the allowed values
      if (!['info', 'warning', 'critical'].includes(validated.severity)) {
        validated.severity = 'info';
      }

      // Validate source is one of the allowed values
      if (!['agent', 'system'].includes(validated.source)) {
        validated.source = 'agent';
      }

      // Calculate relative time
      validated.relative_time = getRelativeTime(entry.timestamp);

      validEntries.push(validated);
    } catch (err) {
      console.error(`[ACTIVITY-FEED] Error processing entry at index ${index}:`, err.message);
    }
  });

  // Sort by timestamp descending (newest first)
  validEntries.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  // Limit to last 50 entries for display
  const displayLimit = 50;
  const feed = validEntries.slice(0, displayLimit);

  const result = {
    timestamp: new Date().toISOString(),
    feed: feed,
    total_entries: validEntries.length,
    displayed: feed.length,
    since: feed.length > 0 ? feed[feed.length - 1].timestamp : null
  };

  console.log(`[ACTIVITY-FEED] Loaded ${result.displayed} of ${result.total_entries} activities`);
  return result;
}

/**
 * Load workstreams.json
 */
function loadWorkstreams() {
  return loadJSON('workstreams.json');
}

/**
 * Load blocked_work.json
 */
function loadBlockedWork() {
  return loadJSON('blocked_work.json');
}

/**
 * Load venture_velocity.json
 */
function loadVentureVelocity() {
  return loadJSON('venture_velocity.json');
}

/**
 * Load venture_work_links.json
 */
function loadVentureWorkLinks() {
  return loadJSON('venture_work_links.json');
}

/**
 * Load agent_activity.json
 */
function loadAgentActivity() {
  return loadJSON('agent_activity.json');
}

/**
 * Load decisions_required.json (CR-008)
 */
function loadDecisionsRequired() {
  return loadJSON('decisions_required.json');
}

/**
 * Load decision_actions_queue.json (CR-008)
 */
function loadDecisionActionsQueue() {
  return loadJSON('decision_actions_queue.json');
}

/**
 * Load decision_actions_log.json (CR-008)
 */
function loadDecisionActionsLog() {
  return loadJSON('decision_actions_log.json');
}

/**
 * Append to decision_actions_queue.json safely
 * CRITICAL: Append-only, never delete
 */
function appendToDecisionQueue(action) {
  try {
    const queuePath = path.join(DATA_ROOT, 'decision_actions_queue.json');
    
    // Read current queue
    let queue = loadJSON('decision_actions_queue.json');
    if (!queue.items) queue.items = [];
    
    // Append new action
    queue.items.push({
      action_id: action.action_id,
      decision_id: action.decision_id,
      action: action.action,
      requested_by: action.requested_by || 'unknown',
      requested_at: new Date().toISOString(),
      source: 'mission_control_ui',
      note: action.note || null,
      status: 'queued',
      result: null,
      completed_at: null,
      error: null
    });
    
    // Write back
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf-8');
    console.log(`[DECISION-QUEUE] Appended action ${action.action_id}`);
    return { success: true, action_id: action.action_id };
  } catch (err) {
    console.error('[DECISION-QUEUE] Error appending:', err.message);
    throw err;
  }
}

/**
 * Load venture scoreboard data
 * Tracks: ideas generated, MVPs built, experiments running, live ventures, killed ventures, success rate
 * @returns {object} Venture scoreboard data
 */
function loadVentureScoreboard() {
  const scoreboard = loadJSON('venture_scoreboard.json');
  
  // Ensure required fields exist
  return {
    schema_version: scoreboard.schema_version || '1.0.0',
    timestamp: scoreboard.timestamp || new Date().toISOString(),
    last_updated: scoreboard.last_updated || new Date().toISOString(),
    ideas_generated: scoreboard.ideas_generated || 0,
    mvps_built: scoreboard.mvps_built || 0,
    experiments_running: scoreboard.experiments_running || 0,
    ventures_live: scoreboard.ventures_live || 0,
    ventures_killed: scoreboard.ventures_killed || 0,
    success_rate: scoreboard.success_rate || 0.0,
    description: scoreboard.description || 'Venture lifecycle performance scoreboard'
  };
}

module.exports = {
  loadWorkstreams,
  loadBlockedWork,
  loadVentureVelocity,
  loadVentureWorkLinks,
  loadAgentActivity,
  loadActivityFeed,
  loadDecisionsRequired,
  loadDecisionActionsQueue,
  loadDecisionActionsLog,
  appendToDecisionQueue,
  loadVentureScoreboard,
  loadJSON
};
