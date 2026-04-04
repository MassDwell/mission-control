#!/usr/bin/env node
// DrawStack PostHog monitor — tracks signups, activation, funnel health

const { personal_api_key: KEY, project_id: PROJECT_ID } = require(require('os').homedir() + '/.openclaw/workspace/credentials/posthog/token.json');
const STATE_FILE = require('os').homedir() + '/.openclaw/workspace/data/posthog-state.json';
const fs = require('fs');

const BASE = `https://us.posthog.com/api/projects/${PROJECT_ID}`;
const HEADERS = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function query(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS });
  return res.json();
}

async function getEventCount(event, since) {
  const data = await query(`/events/?event=${encodeURIComponent(event)}&after=${since}&limit=100`);
  return (data.results || []).length;
}

async function main() {
  const now = new Date();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since1h = new Date(now - 60 * 60 * 1000).toISOString();

  // Load state
  let state = { lastSignupCount: 0, lastCheck: null };
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}

  // Pull key funnel metrics (last 24h)
  const [pageviews, signups, projectsCreated, drawsSubmitted] = await Promise.all([
    getEventCount('$pageview', since24h),
    getEventCount('signup_completed', since24h),
    getEventCount('project_created', since24h),
    getEventCount('draw_submitted', since24h),
  ]);

  // Total unique users ever
  const recentEvents = await query(`/events/?limit=1&after=${since1h}`);
  const hasRecentActivity = (recentEvents.results || []).length > 0;

  const newSignups = signups - (state.lastSignupCount24h || 0);

  // Save state
  const newState = {
    lastCheck: now.toISOString(),
    lastSignupCount24h: signups,
    metrics: { pageviews, signups, projectsCreated, drawsSubmitted }
  };
  fs.mkdirSync(require('path').dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

  // Report
  if (pageviews === 0 && signups === 0) {
    console.log('📊 DrawStack PostHog: No events yet in last 24h — tracking active, waiting for first visitors');
  } else {
    console.log(`📊 DrawStack (last 24h):`);
    console.log(`  👁  Pageviews: ${pageviews}`);
    console.log(`  ✍️  Signups: ${signups}`);
    console.log(`  📁  Projects created: ${projectsCreated}`);
    console.log(`  📋  Draws submitted: ${drawsSubmitted}`);
    if (signups > 0 && projectsCreated > 0) {
      console.log(`  🎯  Activation rate: ${Math.round(projectsCreated/signups*100)}%`);
    }
    if (newSignups > 0) {
      console.log(`  🆕  New signups since last check: ${newSignups}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
