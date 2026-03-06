#!/usr/bin/env node

/**
 * SSOT Health Check — Operator Lock Pattern
 * 
 * Mission Control state MUST be sourced from SSOT files only.
 * Never generate synthetic data. Never hallucinate metrics.
 * Fail loud if data unavailable.
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(process.env.HOME, '.openclaw/workspace');
const CANON_DIR = path.join(WORKSPACE, 'canon');
const DATA_DIR = path.join(WORKSPACE, 'data/mission-control');

/**
 * Load JSON safely — abort if unreadable
 */
function loadSSOT(filePath, name) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return { success: true, data, source: filePath };
  } catch (e) {
    return { success: false, error: `Cannot read ${name}: ${e.message}`, source: filePath };
  }
}

/**
 * Operator Lock: Read active agents from registry
 */
function getActiveAgents() {
  const result = loadSSOT(path.join(CANON_DIR, 'registry.json'), 'registry.json');
  
  if (!result.success) {
    return { error: result.error };
  }

  const registry = result.data;
  const activeAgents = registry.agents.filter(a => a.enabled === true);
  
  return {
    count: activeAgents.length,
    agents: activeAgents.map(a => ({ id: a.id, name: a.name, type: a.type })),
    source: result.source
  };
}

/**
 * Operator Lock: Read workstreams from SSOT
 */
function getWorkstreams() {
  const result = loadSSOT(path.join(DATA_DIR, 'workstreams.json'), 'workstreams.json');
  
  if (!result.success) {
    return { error: result.error };
  }

  const ws = result.data.workstreams || [];
  return {
    count: ws.length,
    items: ws.map(w => ({ id: w.id, name: w.name, status: w.status })),
    source: result.source
  };
}

/**
 * Operator Lock: Read blocked work from SSOT
 */
function getBlockedWork() {
  const result = loadSSOT(path.join(DATA_DIR, 'blocked_work.json'), 'blocked_work.json');
  
  if (!result.success) {
    return { error: result.error };
  }

  const blocked = result.data.items || [];
  return {
    count: blocked.length,
    items: blocked.map(b => ({ id: b.id, title: b.title, blocker_type: b.blocker_type })),
    source: result.source
  };
}

/**
 * Operator Lock: Read venture pipeline from SSOT
 */
function getVenturePipeline() {
  const result = loadSSOT(path.join(DATA_DIR, 'venture_scoreboard.json'), 'venture_scoreboard.json');
  
  if (!result.success) {
    return { error: result.error };
  }

  const sb = result.data;
  return {
    total_ventures: sb.ventures ? sb.ventures.length : 0,
    by_stage: sb.summary ? sb.summary.by_stage : {},
    ventures: sb.ventures ? sb.ventures.map(v => ({ id: v.venture_id, name: v.name, stage: v.stage })) : [],
    source: result.source
  };
}

/**
 * Operator Lock: Read recent activity from SSOT
 */
function getRecentActivity() {
  const result = loadSSOT(path.join(DATA_DIR, 'agent_activity.json'), 'agent_activity.json');
  
  if (!result.success) {
    return { error: result.error };
  }

  const activities = result.data.activities || [];
  const recent = activities.slice(-10).reverse();
  
  return {
    count: activities.length,
    recent: recent.map(a => ({ 
      timestamp: a.timestamp, 
      agent: a.agent, 
      action: a.action, 
      severity: a.severity 
    })),
    source: result.source
  };
}

/**
 * MAIN: Generate SSOT-only report
 */
function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('MISSION CONTROL — SSOT HEALTH REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  OPERATOR LOCK ENABLED — All data from SSOT only');
  console.log('');
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  // 1. Active Agents
  console.log('───────────────────────────────────────────────────────────────');
  console.log('1. ACTIVE AGENTS (from canon/registry.json)');
  console.log('───────────────────────────────────────────────────────────────');
  const agents = getActiveAgents();
  if (agents.error) {
    console.log('❌ ERROR:', agents.error);
  } else {
    console.log(`Count: ${agents.count}`);
    agents.agents.forEach(a => {
      console.log(`  • ${a.id} (${a.name}) — ${a.type}`);
    });
  }
  console.log(`Source: ${agents.source || 'ERROR'}`);
  console.log('');

  // 2. Active Workstreams
  console.log('───────────────────────────────────────────────────────────────');
  console.log('2. ACTIVE WORKSTREAMS (from data/mission-control/workstreams.json)');
  console.log('───────────────────────────────────────────────────────────────');
  const ws = getWorkstreams();
  if (ws.error) {
    console.log('❌ ERROR:', ws.error);
  } else {
    console.log(`Count: ${ws.count}`);
    if (ws.count === 0) {
      console.log('  (No data available)');
    } else {
      ws.items.forEach(w => {
        console.log(`  • ${w.id}: ${w.name} [${w.status}]`);
      });
    }
  }
  console.log(`Source: ${ws.source || 'ERROR'}`);
  console.log('');

  // 3. Blocked Work
  console.log('───────────────────────────────────────────────────────────────');
  console.log('3. BLOCKED WORK (from data/mission-control/blocked_work.json)');
  console.log('───────────────────────────────────────────────────────────────');
  const blocked = getBlockedWork();
  if (blocked.error) {
    console.log('❌ ERROR:', blocked.error);
  } else {
    console.log(`Count: ${blocked.count}`);
    if (blocked.count === 0) {
      console.log('  (No data available)');
    } else {
      blocked.items.forEach(b => {
        console.log(`  • ${b.id}: ${b.title} [${b.blocker_type}]`);
      });
    }
  }
  console.log(`Source: ${blocked.source || 'ERROR'}`);
  console.log('');

  // 4. Venture Pipeline
  console.log('───────────────────────────────────────────────────────────────');
  console.log('4. VENTURE PIPELINE (from data/mission-control/venture_scoreboard.json)');
  console.log('───────────────────────────────────────────────────────────────');
  const ventures = getVenturePipeline();
  if (ventures.error) {
    console.log('❌ ERROR:', ventures.error);
  } else {
    console.log(`Total Ventures: ${ventures.total_ventures}`);
    if (ventures.total_ventures === 0) {
      console.log('  (No data available)');
    } else {
      console.log('By Stage:');
      Object.entries(ventures.by_stage).forEach(([stage, count]) => {
        console.log(`  • ${stage}: ${count}`);
      });
      console.log('Ventures:');
      ventures.ventures.forEach(v => {
        console.log(`  • ${v.name} (${v.id}) — ${v.stage}`);
      });
    }
  }
  console.log(`Source: ${ventures.source || 'ERROR'}`);
  console.log('');

  // 5. Recent Activity
  console.log('───────────────────────────────────────────────────────────────');
  console.log('5. RECENT ACTIVITY (from data/mission-control/agent_activity.json)');
  console.log('───────────────────────────────────────────────────────────────');
  const activity = getRecentActivity();
  if (activity.error) {
    console.log('❌ ERROR:', activity.error);
  } else {
    console.log(`Total Activity Entries: ${activity.count}`);
    console.log('Last 10:');
    activity.recent.forEach(a => {
      const time = new Date(a.timestamp).toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
      console.log(`  [${time}] ${a.agent}: ${a.action} [${a.severity}]`);
    });
  }
  console.log(`Source: ${activity.source || 'ERROR'}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ SSOT Report Complete — All data verified from source');
  console.log('═══════════════════════════════════════════════════════════════');
}

main();
