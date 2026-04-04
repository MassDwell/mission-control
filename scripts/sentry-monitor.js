#!/usr/bin/env node
// DrawStack Sentry monitor — polls for new/critical issues

const TOKEN = require(require('os').homedir() + '/.openclaw/workspace/credentials/sentry/token.json').token;
const ORG = "drawstack";
const STATE_FILE = require('os').homedir() + '/.openclaw/workspace/data/sentry-state.json';
const fs = require('fs');

async function getIssues() {
  const res = await fetch(
    `https://sentry.io/api/0/organizations/${ORG}/issues/?limit=25&query=is:unresolved&sort=date`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  return res.json();
}

async function main() {
  const issues = await getIssues();
  if (!Array.isArray(issues)) {
    console.error("Sentry API error:", JSON.stringify(issues));
    process.exit(1);
  }

  // Load last known state
  let state = { seenIds: [] };
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}

  const newIssues = issues.filter(i => !state.seenIds.includes(i.id));
  const errors = issues.filter(i => i.level === "error" || i.level === "fatal");
  const newErrors = newIssues.filter(i => i.level === "error" || i.level === "fatal");

  // Save updated state
  state.seenIds = issues.map(i => i.id);
  state.lastCheck = new Date().toISOString();
  state.totalIssues = issues.length;
  fs.mkdirSync(require('path').dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  if (newErrors.length > 0) {
    console.log(`🔴 DrawStack: ${newErrors.length} NEW error(s) in Sentry`);
    newErrors.forEach(i => {
      console.log(`  [${i.level.toUpperCase()}] ${i.title}`);
      console.log(`  Events: ${i.count} | First: ${i.firstSeen?.slice(0,10)} | Last: ${i.lastSeen?.slice(0,10)}`);
    });
  } else if (errors.length > 0) {
    console.log(`⚠️ DrawStack Sentry: ${errors.length} known unresolved error(s), no new ones`);
  } else {
    console.log(`✅ DrawStack Sentry: clean — no unresolved errors`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
