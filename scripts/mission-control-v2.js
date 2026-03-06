#!/usr/bin/env node

/**
 * Mission Control v2 Self-Healing Script
 * Runs diagnostics and recovery on stale/orphaned tasks
 *
 * Usage:
 *   node mission-control-v2.js heal    - Run self-healing check
 *   node mission-control-v2.js status  - Show current state
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const DATA_DIR = path.join(WORKSPACE, 'data', 'mission-control');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      tasks: [],
      lastUpdated: new Date().toISOString(),
      healLog: []
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function heal() {
  console.log('🔧 Mission Control Self-Healing Check');
  console.log('=' .repeat(50));

  const data = loadData();
  const healLog = [];
  const now = new Date();
  const STALE_TIMEOUT_MS = 3600000; // 1 hour

  // Check for stale processing states
  const staleTasks = [];
  data.tasks.forEach(task => {
    if (task.processingStartedAt && task.processingAgent) {
      const startTime = new Date(task.processingStartedAt);
      const elapsed = now - startTime;

      if (elapsed > STALE_TIMEOUT_MS) {
        console.log(`⚠️  STALE: "${task.title}" stuck with ${task.processingAgent} for ${Math.round(elapsed / 60000)}min`);
        healLog.push({
          type: 'stale_recovery',
          taskId: task.id,
          title: task.title,
          wasAgent: task.processingAgent,
          timestamp: now.toISOString()
        });

        // Reset processing state
        task.processingStartedAt = null;
        task.processingAgent = null;
        staleTasks.push(task.id);
        console.log(`  → Reset to IDLE`);
      }
    }
  });

  // Check for orphaned tasks (in_progress but no processing state)
  const orphanedTasks = [];
  data.tasks.forEach(task => {
    if (task.status === 'in_progress' && !task.processingStartedAt) {
      console.log(`📌 ORPHANED: "${task.title}" marked in_progress but not claimed`);
      healLog.push({
        type: 'orphaned_task',
        taskId: task.id,
        title: task.title,
        timestamp: now.toISOString()
      });
      orphanedTasks.push(task.id);
    }
  });

  // Summary
  const totalRecovered = staleTasks.length + orphanedTasks.length;

  if (totalRecovered > 0) {
    console.log('');
    console.log(`✅ HEALED ${totalRecovered} task(s)`);
    console.log(`  - Stale releases: ${staleTasks.length}`);
    console.log(`  - Orphaned flags: ${orphanedTasks.length}`);

    data.healLog = (data.healLog || []).concat(healLog);
    data.lastUpdated = now.toISOString();
    data.lastHealed = now.toISOString();

    saveData(data);

    return { success: true, recovered: totalRecovered, details: healLog };
  } else {
    console.log('✓ No stale or orphaned tasks detected');
    console.log(`  Last check: ${data.lastHealed || 'never'}`);

    data.lastHealed = now.toISOString();
    saveData(data);

    return { success: true, recovered: 0, message: 'System healthy' };
  }
}

function showStatus() {
  const data = loadData();
  console.log('📊 Mission Control Status');
  console.log('=' .repeat(50));

  if (data.tasks.length === 0) {
    console.log('No tasks yet.');
    return;
  }

  const byStatus = {};
  data.tasks.forEach(t => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });

  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  if (data.lastHealed) {
    const lastHeal = new Date(data.lastHealed);
    const ago = Math.round((new Date() - lastHeal) / 60000);
    console.log(`\nLast healed: ${ago}min ago`);
  }
}

const cmd = process.argv[2] || 'heal';

if (cmd === 'heal') {
  const result = heal();
  process.exit(result.success ? 0 : 1);
} else if (cmd === 'status') {
  showStatus();
  process.exit(0);
} else {
  console.log('Usage: node mission-control-v2.js [heal|status]');
  process.exit(1);
}
