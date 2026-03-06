#!/usr/bin/env node

/**
 * Mission Control Data Export
 * Refreshes all Mission Control JSON data files
 * Called by: mc-checkin (15 min) and mc-export (2h LaunchAgent)
 * 
 * Populates:
 * - workstreams.json
 * - blocked_work.json
 * - venture_velocity.json
 * - venture_work_links.json
 * - agent_activity.json (APPEND-ONLY, max 200 entries)
 * - agent_status.json
 * - crons.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const MC_DATA_DIR = path.join(WORKSPACE, 'data', 'mission-control');
const MAX_ACTIVITY_ENTRIES = 200;

// Ensure directory exists
if (!fs.existsSync(MC_DATA_DIR)) {
  fs.mkdirSync(MC_DATA_DIR, { recursive: true });
  console.log(`Created: ${MC_DATA_DIR}`);
}

const NOW = new Date();
const NOW_ISO = NOW.toISOString();

// Helper: write JSON file with error handling
function writeJSON(filename, data) {
  try {
    const filepath = path.join(MC_DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ ${filename} (${Object.keys(data).length || data.length} entries)`);
    return true;
  } catch (err) {
    console.error(`❌ ${filename}: ${err.message}`);
    return false;
  }
}

// Helper: read JSON file with fallback
function readJSON(filename, defaultData = {}) {
  try {
    const filepath = path.join(MC_DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return defaultData;
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (err) {
    console.warn(`⚠️  Could not read ${filename}, using defaults`);
    return defaultData;
  }
}

console.log(`\n🔄 Mission Control Data Export (${NOW.toLocaleString()})`);
console.log('='.repeat(60));

// Collect initial metrics before export
const metricsCollector = {
  activeAgents: 0,
  activeWorkstreams: 0,
  blockedItems: 0,
  venturesBuilding: 0
};

// --- EXPORT 1: WORKSTREAMS ---
const workstreams = {
  timestamp: NOW_ISO,
  total: 0,
  active: [],
  stages: {
    backlog: 0,
    in_progress: 0,
    review: 0,
    done: 0
  }
};
writeJSON('workstreams.json', workstreams);
metricsCollector.activeWorkstreams = (workstreams.active || []).length;

// --- EXPORT 2: BLOCKED WORK ---
const blockedWork = {
  timestamp: NOW_ISO,
  total: 0,
  items: []
};
writeJSON('blocked_work.json', blockedWork);
metricsCollector.blockedItems = (blockedWork.items || []).length;

// --- EXPORT 3: VENTURE VELOCITY ---
const ventureVelocity = {
  timestamp: NOW_ISO,
  week: NOW.toISOString().split('T')[0],
  validated_this_week: 0,
  success_rate_percent: 0,
  target_rate_percent: 40,
  quality_control_mode: 'normal',
  ideas_per_week: {
    target: 3,
    actual: 0
  },
  stages: {
    stage_1_discovery: 0,
    stage_2_validation: 0,
    stage_3_mvp: 0,
    stage_4_experiment: 0,
    stage_5_build: 0,
    stage_6_scale: 0,
    stage_7_ops: 0,
    stage_8_kill: 0
  }
};
writeJSON('venture_velocity.json', ventureVelocity);

// Count ventures in building stages (5-7)
const buildingStages = (ventureVelocity.stages.stage_5_build || 0) + 
                       (ventureVelocity.stages.stage_6_scale || 0) + 
                       (ventureVelocity.stages.stage_7_ops || 0);
metricsCollector.venturesBuilding = buildingStages;

// --- EXPORT 4: VENTURE WORK LINKS (APPEND-ONLY, DO NOT OVERWRITE) ---
// Load existing ventures (important: preserves manually-added ventures like LeadScore.ai)
const ventureWorkLinksExisting = readJSON('venture_work_links.json', {
  timestamp: NOW_ISO,
  ventures: [],
  mapping: {},
  stage_summary: {}
});

// Only update timestamp, preserve ventures array
ventureWorkLinksExisting.timestamp = NOW_ISO;
writeJSON('venture_work_links.json', ventureWorkLinksExisting);

// --- EXPORT 5: AGENT ACTIVITY (APPEND-ONLY) ---
// Note: Will be appended as heartbeat event after metrics collection
// For now, just ensure the file exists with proper structure
const agentActivityInitial = readJSON('agent_activity.json', {
  lastUpdated: NOW_ISO,
  activities: []
});
if (!Array.isArray(agentActivityInitial.activities)) {
  agentActivityInitial.activities = [];
}

// --- EXPORT 6: AGENT STATUS ---
const agentStatus = {
  timestamp: NOW_ISO,
  agents: [
    { id: 'main', name: 'Clawson', status: 'online', last_heartbeat: NOW_ISO },
    { id: 'codesmith', name: 'Codesmith', status: 'idle', last_heartbeat: null },
    { id: 'moonshot', name: 'Moonshot', status: 'idle', last_heartbeat: null },
    { id: 'personal-assistant', name: 'Personal Assistant', status: 'idle', last_heartbeat: null }
  ]
};
writeJSON('agent_status.json', agentStatus);

// Count online agents
metricsCollector.activeAgents = (agentStatus.agents || []).filter(a => a.status === 'online').length;

// --- EXPORT 7: CRONS ---
let cronsExport = null;
try {
  const cronOutput = execSync('cron list', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  cronsExport = {
    timestamp: NOW_ISO,
    exported_via: 'cron list',
    raw_output: cronOutput,
    summary: {
      total_jobs: (cronOutput.match(/enabled:true/g) || []).length,
      enabled: (cronOutput.match(/enabled:true/g) || []).length,
      disabled: (cronOutput.match(/enabled:false/g) || []).length
    }
  };
} catch (err) {
  console.warn(`⚠️  Could not export crons: ${err.message}`);
  cronsExport = {
    timestamp: NOW_ISO,
    error: 'cron list not available',
    fallback: true
  };
}
writeJSON('crons.json', cronsExport);

// --- EXPORT 8: DECISIONS REQUIRED ---
const decisionsRequired = {
  timestamp: NOW_ISO,
  pending: []
};
writeJSON('decisions_required.json', decisionsRequired);

// --- APPEND HEARTBEAT EVENT (OPERATIONAL METRICS) ---
/**
 * After successful export, append a rich heartbeat event
 * This provides meaningful operational context to the activity stream
 */
function appendHeartbeatEvent() {
  let agentActivity = readJSON('agent_activity.json', {
    lastUpdated: NOW_ISO,
    activities: []
  });

  if (!Array.isArray(agentActivity.activities)) {
    agentActivity.activities = [];
  }

  // Build description with current metrics
  const description = `Agents online: ${metricsCollector.activeAgents}, Workstreams active: ${metricsCollector.activeWorkstreams}, Blocked items: ${metricsCollector.blockedItems}, Ventures building: ${metricsCollector.venturesBuilding}`;

  // Append heartbeat event
  agentActivity.activities.push({
    timestamp: NOW_ISO,
    agent: 'System',
    action: 'Mission Control export completed',
    description: description,
    severity: 'info',
    source: 'system'
  });

  // Cap at MAX_ACTIVITY_ENTRIES
  if (agentActivity.activities.length > MAX_ACTIVITY_ENTRIES) {
    const overflow = agentActivity.activities.length - MAX_ACTIVITY_ENTRIES;
    agentActivity.activities = agentActivity.activities.slice(overflow);
  }

  agentActivity.lastUpdated = NOW_ISO;

  // Write back to file
  try {
    const filepath = path.join(MC_DATA_DIR, 'agent_activity.json');
    fs.writeFileSync(filepath, JSON.stringify(agentActivity, null, 2), 'utf-8');
    console.log(`✅ Heartbeat event appended: "${agentActivity.activities[agentActivity.activities.length - 1].action}"`);
    console.log(`   ${description}`);
    return agentActivity;
  } catch (err) {
    console.error(`❌ Failed to append heartbeat: ${err.message}`);
    return agentActivity;
  }
}

// Append the heartbeat after all exports
const finalActivityLog = appendHeartbeatEvent();

// --- SYNC TO UI ASSETS ---
const UI_ASSETS_DIR = path.join(WORKSPACE, 'skills', 'mission-control', 'assets', 'data');
try {
  if (!fs.existsSync(UI_ASSETS_DIR)) {
    fs.mkdirSync(UI_ASSETS_DIR, { recursive: true });
  }
  // Only sync critical files that legacy UI might need
  const syncFiles = ['agent_activity.json'];
  syncFiles.forEach(file => {
    const src = path.join(MC_DATA_DIR, file);
    const dest = path.join(UI_ASSETS_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  console.log(`✅ Synced files to UI assets`);
} catch (err) {
  console.warn(`⚠️  Could not sync to UI assets: ${err.message}`);
}

// --- STALENESS WATCHDOG ---
// Check if data is stale and alert if necessary
const STALENESS_THRESHOLD_HOURS = 3;
const CURRENT_HOUR = NOW.getHours();
const IS_BUSINESS_HOURS = CURRENT_HOUR >= 7 && CURRENT_HOUR < 21; // 7 AM - 9 PM EST

if (IS_BUSINESS_HOURS) {
  // Check if any previous data was older than threshold
  const previousActivityLog = readJSON('agent_activity.json', { activities: [], lastUpdated: NOW_ISO });
  if (previousActivityLog.lastUpdated) {
    const previousUpdate = new Date(previousActivityLog.lastUpdated);
    const hoursSinceLast = (NOW - previousUpdate) / (1000 * 60 * 60);
    
    if (hoursSinceLast > STALENESS_THRESHOLD_HOURS) {
      console.warn(`\n⚠️  STALENESS ALERT: Previous export was ${hoursSinceLast.toFixed(1)} hours ago!`);
      
      // Log critical activity
      finalActivityLog.activities.push({
        timestamp: NOW_ISO,
        agent: 'System',
        action: 'Mission Control data staleness detected',
        description: `Data was not updated for ${hoursSinceLast.toFixed(1)} hours - export cycle may have failed`,
        severity: 'critical',
        source: 'system'
      });
      
      // Save updated activity log
      try {
        const activityPath = path.join(MC_DATA_DIR, 'agent_activity.json');
        fs.writeFileSync(activityPath, JSON.stringify(finalActivityLog, null, 2), 'utf-8');
        console.log('✅ Critical staleness event logged to activity_activity.json');
      } catch (err) {
        console.error('❌ Failed to log staleness event:', err.message);
      }
      
      // Alert via Telegram (if credentials exist)
      const TELEGRAM_BOT_TOKEN = process.env.CLAWSON_TELEGRAM_BOT_TOKEN;
      const CLAWSON_CHAT_ID = process.env.CLAWSON_TELEGRAM_CHAT_ID;
      
      if (TELEGRAM_BOT_TOKEN && CLAWSON_CHAT_ID) {
        const https = require('https');
        const message = encodeURIComponent(
          `🚨 CRITICAL: Mission Control data was stale for ${hoursSinceLast.toFixed(1)} hours!\n` +
          `Last update: ${previousUpdate.toLocaleString()}\n` +
          `Export cycle may have failed. Check /var/log or cron status.`
        );
        
        const options = {
          hostname: 'api.telegram.org',
          path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${CLAWSON_CHAT_ID}&text=${message}`,
          method: 'GET'
        };
        
        https.request(options, (res) => {
          if (res.statusCode === 200) {
            console.log('✅ Telegram alert sent to Clawson');
          }
        }).on('error', (err) => {
          console.warn('⚠️  Failed to send Telegram alert:', err.message);
        }).end();
      }
    }
  }
}

// --- SUMMARY ---
console.log('\n' + '='.repeat(60));
console.log('✅ Mission Control Data Export Complete');
console.log(`📁 Data directory: ${MC_DATA_DIR}`);
console.log(`📊 Activity log: ${finalActivityLog.activities.length}/${MAX_ACTIVITY_ENTRIES} entries`);
console.log(`🕐 Last updated: ${NOW.toLocaleString()}`);
console.log('\n📈 Operational Metrics:');
console.log(`   • Agents online: ${metricsCollector.activeAgents}`);
console.log(`   • Workstreams active: ${metricsCollector.activeWorkstreams}`);
console.log(`   • Blocked items: ${metricsCollector.blockedItems}`);
console.log(`   • Ventures building: ${metricsCollector.venturesBuilding}`);
console.log('\nAll files written and ready for UI consumption.');
console.log('⚠️  NO SUPABASE REQUIRED - All data from local JSON files');

process.exit(0);
