#!/usr/bin/env node
// DrawStack Daily KPI Report
// Runs M-F at 8 AM EDT via cron
// Sources: PostHog (live), GA4 (analytics.readonly), GSC (webmasters.readonly)

const fs = require('fs');
const path = require('path');
const os = require('os');

const WORKSPACE = path.join(os.homedir(), '.openclaw/workspace');
const GA4_PROPERTY_ID = '529414487';
const GSC_SITE_URL = 'https://drawstack.ai/';
const ANALYTICS_TOKEN_PATH = path.join(WORKSPACE, 'credentials/google/analytics-token.json');

async function refreshAnalyticsToken(tokens) {
  const creds = JSON.parse(
    fs.readFileSync(path.join(WORKSPACE, 'credentials/google/gmail-oauth-credentials.json'))
  );
  const { client_id, client_secret } = creds.installed;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id, client_secret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const refreshed = await res.json();
  if (!refreshed.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(refreshed));
  const updated = { ...tokens, ...refreshed, updated_at: new Date().toISOString() };
  fs.writeFileSync(ANALYTICS_TOKEN_PATH, JSON.stringify(updated, null, 2));
  return updated.access_token;
}

async function getAnalyticsAccessToken() {
  const tokens = JSON.parse(fs.readFileSync(ANALYTICS_TOKEN_PATH));
  // If expires within 5 min or no expiry info, refresh
  const expiresAt = tokens.updated_at
    ? new Date(tokens.updated_at).getTime() + (tokens.expires_in || 3600) * 1000
    : 0;
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    return await refreshAnalyticsToken(tokens);
  }
  return tokens.access_token;
}

async function getPostHogMetrics() {
  const creds = JSON.parse(
    fs.readFileSync(path.join(WORKSPACE, 'credentials/posthog/token.json'))
  );
  const { personal_api_key: KEY, project_id: PROJECT_ID } = creds;
  const BASE = `https://us.posthog.com/api/projects/${PROJECT_ID}`;
  const HEADERS = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  async function getEventCount(event, since) {
    const res = await fetch(
      `${BASE}/events/?event=${encodeURIComponent(event)}&after=${since}&limit=100`,
      { headers: HEADERS }
    );
    const data = await res.json();
    return (data.results || []).length;
  }

  const [pv24h, signups24h, projects24h, draws24h, pv7d, signups7d, projects7d] =
    await Promise.all([
      getEventCount('$pageview',         since24h),
      getEventCount('signup_completed',  since24h),
      getEventCount('project_created',   since24h),
      getEventCount('draw_submitted',    since24h),
      getEventCount('$pageview',         since7d),
      getEventCount('signup_completed',  since7d),
      getEventCount('project_created',   since7d),
    ]);

  return { pv24h, signups24h, projects24h, draws24h, pv7d, signups7d, projects7d, ok: true };
}

async function getGA4Metrics() {
  const token = await getAnalyticsAccessToken();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [
          { startDate: today, endDate: today, name: 'today' },
          { startDate: sevenDaysAgo, endDate: today, name: '7d' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(`GA4 API error: ${data.error.message}`);

  // Parse rows: dateRanges come back as separate row groups
  const rows = data.rows || [];
  const get = (dimensionValue, metricIndex) => {
    const row = rows.find(r => r.dimensionValues?.[0]?.value === dimensionValue);
    return row ? parseFloat(row.metricValues?.[metricIndex]?.value || '0') : 0;
  };

  return {
    ok: true,
    sessions1d: Math.round(get('today', 0)),
    users1d: Math.round(get('today', 1)),
    newUsers1d: Math.round(get('today', 2)),
    bounceRate1d: Math.round(get('today', 3) * 100),
    sessions7d: Math.round(get('7d', 0)),
    users7d: Math.round(get('7d', 1)),
    newUsers7d: Math.round(get('7d', 2)),
  };
}

async function getGSCMetrics() {
  const token = await getAnalyticsAccessToken();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: sevenDaysAgo,
        endDate: today,
        dimensions: [],
        rowLimit: 1,
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(`GSC API error: ${data.error.message}`);

  const row = (data.rows || [])[0] || {};
  return {
    ok: true,
    clicks: Math.round(row.clicks || 0),
    impressions: Math.round(row.impressions || 0),
    ctr: row.ctr ? (row.ctr * 100).toFixed(1) : '0.0',
    position: row.position ? row.position.toFixed(1) : 'n/a',
  };
}

async function main() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/New_York'
  });

  const [ph, ga4, gsc] = await Promise.allSettled([
    getPostHogMetrics(),
    getGA4Metrics(),
    getGSCMetrics(),
  ]);

  const phData  = ph.status  === 'fulfilled' ? ph.value  : { ok: false, reason: ph.reason?.message };
  const ga4Data = ga4.status === 'fulfilled' ? ga4.value : { ok: false, reason: ga4.reason?.message };
  const gscData = gsc.status === 'fulfilled' ? gsc.value : { ok: false, reason: gsc.reason?.message };

  let lines = [`📊 **DrawStack KPI — ${today}**`, ''];

  // ── PostHog (Product) ──────────────────────────────────
  if (phData.ok) {
    lines.push('**Product (PostHog)**');
    lines.push(`• Pageviews:  ${phData.pv24h} today  |  ${phData.pv7d} this week`);
    lines.push(`• Signups:    ${phData.signups24h} today  |  ${phData.signups7d} this week`);
    lines.push(`• Projects created (24h): ${phData.projects24h}`);
    lines.push(`• Draws submitted (24h):  ${phData.draws24h}`);

    // Activation rate: signups who created a project (7-day window)
    if (phData.signups7d > 0) {
      const rate = Math.round((phData.projects7d / phData.signups7d) * 100);
      lines.push(`• Activation rate (7d):   ${rate}% (${phData.projects7d}/${phData.signups7d} signups → project)`);
    }
  } else {
    lines.push(`**Product (PostHog):** ⚠️ ${phData.reason}`);
  }

  lines.push('');

  // ── GA4 (Traffic) ─────────────────────────────────────
  if (ga4Data.ok) {
    lines.push('**Traffic (GA4)**');
    lines.push(`• Sessions:   ${ga4Data.sessions1d} today  |  ${ga4Data.sessions7d} this week`);
    lines.push(`• Users:      ${ga4Data.users1d} today  |  ${ga4Data.users7d} this week`);
    lines.push(`• New users:  ${ga4Data.newUsers1d} today  |  ${ga4Data.newUsers7d} this week`);
    if (ga4Data.bounceRate1d > 0) {
      lines.push(`• Bounce rate (today): ${ga4Data.bounceRate1d}%`);
    }
  } else {
    lines.push(`**Traffic (GA4):** ⚠️ ${ga4Data.reason}`);
  }

  lines.push('');

  // ── GSC (Search) ──────────────────────────────────────
  if (gscData.ok) {
    lines.push('**Search (GSC — 7d)**');
    lines.push(`• Clicks:      ${gscData.clicks}`);
    lines.push(`• Impressions: ${gscData.impressions}`);
    lines.push(`• CTR:         ${gscData.ctr}%`);
    lines.push(`• Avg position: ${gscData.position}`);
  } else {
    lines.push(`**Search (GSC):** ⚠️ ${gscData.reason}`);
  }

  console.log(lines.join('\n'));
}

main().catch(e => {
  console.error('DrawStack KPI report failed:', e.message);
  process.exit(1);
});
