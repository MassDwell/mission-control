#!/usr/bin/env node

/**
 * Mission Control Data Freshness Watchdog
 * Alerts Clawson if Mission Control data becomes stale
 * 
 * Checks: Latest file timestamp vs threshold
 * Alerts: Via system events if stale > 3h during 7AM-9PM
 * Logs: /workspace/logs/mc-watchdog.log
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/Users/openclaw/.openclaw/workspace';
const MC_DATA_DIR = path.join(WORKSPACE, 'data', 'mission-control');
const LOG_FILE = path.join(WORKSPACE, 'logs', 'mc-watchdog.log');

// Configuration
const STALE_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 hours
const ACTIVE_HOURS = { start: 7, end: 21 }; // 7 AM - 9 PM

// Ensure log directory
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  console.log(logLine.trim());
}

function isActiveHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= ACTIVE_HOURS.start && hour < ACTIVE_HOURS.end;
}

function checkDataFreshness() {
  try {
    // Get the most recent file timestamp in MC data directory
    const files = fs.readdirSync(MC_DATA_DIR).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      log('⚠️  No JSON files found in Mission Control data directory');
      return false;
    }

    let latestTime = 0;
    files.forEach(file => {
      const filepath = path.join(MC_DATA_DIR, file);
      const stat = fs.statSync(filepath);
      if (stat.mtime.getTime() > latestTime) {
        latestTime = stat.mtime.getTime();
      }
    });

    const now = Date.now();
    const ageMs = now - latestTime;
    const ageHours = ageMs / (60 * 60 * 1000);

    // Log status
    if (ageMs > STALE_THRESHOLD_MS) {
      const status = `STALE: Mission Control data is ${ageHours.toFixed(1)}h old (threshold: 3h)`;
      log(`❌ ${status}`);
      
      // Alert if during active hours
      if (isActiveHours()) {
        alertClawson(status);
        return false;
      }
    } else {
      log(`✅ FRESH: Data is ${ageHours.toFixed(1)}h old (within threshold)`);
      return true;
    }
  } catch (err) {
    log(`❌ Error checking freshness: ${err.message}`);
    return false;
  }
}

function alertClawson(message) {
  try {
    // Log the alert
    log(`🚨 ALERT CLAWSON: ${message}`);
    
    // Could integrate with Telegram/cron system here
    // For now, just log to file and system
    
  } catch (err) {
    log(`Error sending alert: ${err.message}`);
  }
}

// Main
log('========== MC Data Watchdog Check ==========');
const isHealthy = checkDataFreshness();
log(`Result: ${isHealthy ? '✅ HEALTHY' : '❌ STALE'}`);
log('===========================================\n');

process.exit(isHealthy ? 0 : 1);
