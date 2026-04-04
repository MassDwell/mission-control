#!/usr/bin/env node
/**
 * DrawStack Signup Watcher
 * Checks for new Organization (trial) signups since last run.
 * Alerts Steve via OpenClaw if any new ones found.
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, '../data/drawstack/signup-watcher-state.json');
const ENV_FILE = path.join(__dirname, '../../../Projects/drawstack/.env.prod.local');

// Load env
const envContent = fs.readFileSync(ENV_FILE, 'utf8');
const dbUrl = envContent.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^"|"$/g, '');
if (!dbUrl) { console.error('No DATABASE_URL found'); process.exit(1); }

const sql = neon(dbUrl);

async function main() {
  // Load state
  let state = { lastCheckedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() };
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }

  const since = state.lastCheckedAt;
  const now = new Date().toISOString();

  // Check for new orgs since last run
  const newOrgs = await sql`
    SELECT id, "clerkOrgId", name, type, "planTier", "trialEndsAt", "createdAt"
    FROM "Organization"
    WHERE "createdAt" > ${since}
    ORDER BY "createdAt" ASC
  `;

  // Save state
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastCheckedAt: now }, null, 2));

  if (newOrgs.length === 0) {
    console.log(`[signup-watcher] No new signups since ${since}`);
    return;
  }

  // Build alert message
  const lines = newOrgs.map(org => {
    const trialEnd = org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
    return `• ${org.name} (${org.type}) — ${org.planTier} — trial ends ${trialEnd}`;
  }).join('\n');

  const msg = `🆕 DrawStack new signup${newOrgs.length > 1 ? 's' : ''} (${newOrgs.length}):\n${lines}`;
  console.log(`[signup-watcher] Alerting: ${msg}`);

  // Send alert via openclaw
  execSync(`openclaw system event --text ${JSON.stringify(msg)} --mode now`, { stdio: 'inherit' });
}

main().catch(err => {
  console.error('[signup-watcher] Error:', err.message);
  process.exit(1);
});
