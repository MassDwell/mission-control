#!/usr/bin/env node
/**
 * skill-logger.js — Log skill invocations and outcomes
 * 
 * Usage:
 *   node skill-logger.js log <skill> <status> [notes]
 *   node skill-logger.js stats [skill]
 *   node skill-logger.js review
 * 
 * Status: success | failure | partial
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.env.HOME, '.openclaw/workspace/data/skills/skill-log.jsonl');
const REVIEW_FILE = path.join(process.env.HOME, '.openclaw/workspace/data/skills/skill-review.md');

function ensureDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return fs.readFileSync(LOG_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function log(skill, status, notes = '') {
  ensureDir();
  const entry = {
    ts: new Date().toISOString(),
    skill,
    status, // success | failure | partial
    notes
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  console.log(`✅ Logged: ${skill} → ${status}${notes ? ` (${notes})` : ''}`);
}

function stats(skillFilter) {
  const logs = loadLogs();
  if (!logs.length) { console.log('No logs yet.'); return; }

  // Group by skill
  const bySkill = {};
  for (const entry of logs) {
    if (skillFilter && entry.skill !== skillFilter) continue;
    if (!bySkill[entry.skill]) bySkill[entry.skill] = { success: 0, failure: 0, partial: 0, notes: [] };
    bySkill[entry.skill][entry.status] = (bySkill[entry.skill][entry.status] || 0) + 1;
    if (entry.notes) bySkill[entry.skill].notes.push(entry.notes);
  }

  for (const [skill, data] of Object.entries(bySkill)) {
    const total = data.success + data.failure + data.partial;
    const failRate = total > 0 ? Math.round((data.failure / total) * 100) : 0;
    const flag = failRate >= 30 ? '⚠️ ' : failRate >= 50 ? '🚨 ' : '✅ ';
    console.log(`\n${flag}${skill}`);
    console.log(`   Runs: ${total} | ✅ ${data.success} | ❌ ${data.failure} | ⚡ ${data.partial}`);
    console.log(`   Fail rate: ${failRate}%`);
    if (data.notes.length) {
      const recent = data.notes.slice(-3);
      console.log(`   Recent notes: ${recent.join(' | ')}`);
    }
  }
}

function review() {
  const logs = loadLogs();
  if (!logs.length) { console.log('No logs yet.'); return; }

  // Stats per skill
  const bySkill = {};
  for (const entry of logs) {
    if (!bySkill[entry.skill]) bySkill[entry.skill] = { runs: [], failures: [] };
    bySkill[entry.skill].runs.push(entry);
    if (entry.status === 'failure') bySkill[entry.skill].failures.push(entry);
  }

  const now = new Date().toISOString().split('T')[0];
  let report = `# Skill Health Review — ${now}\n\n`;
  report += `Total skills tracked: ${Object.keys(bySkill).length}\n`;
  report += `Total runs logged: ${logs.length}\n\n`;

  const alerts = [];
  const healthy = [];

  for (const [skill, data] of Object.entries(bySkill)) {
    const total = data.runs.length;
    const failures = data.failures.length;
    const failRate = Math.round((failures / total) * 100);
    const lastRun = data.runs[data.runs.length - 1];
    const daysSinceUse = Math.round((Date.now() - new Date(lastRun.ts)) / (1000 * 60 * 60 * 24));

    const entry = { skill, total, failures, failRate, daysSinceUse, lastRun };

    if (failRate >= 30 || daysSinceUse > 30) {
      alerts.push(entry);
    } else {
      healthy.push(entry);
    }
  }

  if (alerts.length) {
    report += `## ⚠️ Needs Attention (${alerts.length})\n\n`;
    for (const e of alerts) {
      report += `### ${e.skill}\n`;
      report += `- Runs: ${e.total} | Failures: ${e.failures} | Fail rate: ${e.failRate}%\n`;
      report += `- Last used: ${e.daysSinceUse} days ago\n`;
      if (e.lastRun.notes) report += `- Last note: ${e.lastRun.notes}\n`;
      report += `- **Action:** Review SKILL.md and update instructions\n\n`;
    }
  }

  if (healthy.length) {
    report += `## ✅ Healthy (${healthy.length})\n\n`;
    for (const e of healthy) {
      report += `- **${e.skill}** — ${e.total} runs, ${e.failRate}% fail rate, last used ${e.daysSinceUse}d ago\n`;
    }
  }

  // Untracked skills
  const skillsDir = path.join(process.env.HOME, '.openclaw/workspace/skills');
  if (fs.existsSync(skillsDir)) {
    const installed = fs.readdirSync(skillsDir).filter(f => 
      fs.statSync(path.join(skillsDir, f)).isDirectory()
    );
    const tracked = Object.keys(bySkill);
    const untracked = installed.filter(s => !tracked.includes(s));
    if (untracked.length) {
      report += `\n## 📦 Installed but Never Used (${untracked.length})\n\n`;
      for (const s of untracked) report += `- ${s}\n`;
    }
  }

  fs.writeFileSync(REVIEW_FILE, report);
  console.log(report);
  console.log(`\n📄 Report saved to: ${REVIEW_FILE}`);
}

// CLI
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'log':
    if (!args[0] || !args[1]) { console.error('Usage: skill-logger.js log <skill> <status> [notes]'); process.exit(1); }
    log(args[0], args[1], args.slice(2).join(' '));
    break;
  case 'stats':
    stats(args[0]);
    break;
  case 'review':
    review();
    break;
  default:
    console.log('Commands: log <skill> <status> [notes] | stats [skill] | review');
}
