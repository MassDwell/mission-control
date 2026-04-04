#!/usr/bin/env node
/**
 * Google Ads Campaign Report for DrawStack
 * Pulls last 7 days of campaign performance
 */

const fs = require('fs');
const path = require('path');

const CREDS = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw/workspace/credentials/google/ads/ads-credentials.json')));
const TOKEN = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw/workspace/credentials/google/ads/ads-token.json')));

async function refreshAccessToken() {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CREDS.client_id,
      client_secret: CREDS.client_secret,
      refresh_token: TOKEN.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data));
  return data.access_token;
}

async function googleAdsQuery(accessToken, customerId, query) {
  const url = `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': CREDS.developer_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Ads API error ${resp.status}: ${text}`);
  // searchStream returns newline-delimited JSON objects
  return text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

async function listAccessibleCustomers(accessToken) {
  const resp = await fetch('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': CREDS.developer_token,
    },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error('List customers failed: ' + JSON.stringify(data));
  return data.resourceNames || [];
}

async function main() {
  const accessToken = await refreshAccessToken();

  // Discover customer IDs
  const customers = await listAccessibleCustomers(accessToken);
  console.log('Accessible customers:', customers);

  for (const customerResource of customers) {
    const customerId = customerResource.replace('customers/', '');
    console.log(`\n--- Customer ${customerId} ---`);

    try {
      // Campaign performance last 7 days
      const campaignQuery = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_micros,
          metrics.conversions,
          metrics.all_conversions
        FROM campaign
        WHERE segments.date DURING LAST_7_DAYS
        ORDER BY metrics.impressions DESC
        LIMIT 20
      `;

      const results = await googleAdsQuery(accessToken, customerId, campaignQuery);
      
      for (const batch of results) {
        if (batch.results) {
          for (const row of batch.results) {
            const c = row.campaign;
            const m = row.metrics;
            console.log(`Campaign: ${c.name} (${c.status})`);
            console.log(`  Impressions: ${m.impressions || 0}`);
            console.log(`  Clicks: ${m.clicks || 0}`);
            console.log(`  CTR: ${m.ctr ? (m.ctr * 100).toFixed(2) + '%' : '0%'}`);
            console.log(`  Avg CPC: $${m.averageCpc ? (m.averageCpc / 1e6).toFixed(2) : '0'}`);
            console.log(`  Cost: $${m.costMicros ? (m.costMicros / 1e6).toFixed(2) : '0'}`);
            console.log(`  Conversions: ${m.conversions || 0}`);
          }
        }
      }

      // Search terms report
      const searchTermQuery = `
        SELECT
          search_term_view.search_term,
          search_term_view.status,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          campaign.name
        FROM search_term_view
        WHERE segments.date DURING LAST_7_DAYS
          AND metrics.impressions > 0
        ORDER BY metrics.impressions DESC
        LIMIT 50
      `;

      const stResults = await googleAdsQuery(accessToken, customerId, searchTermQuery);
      
      console.log('\n  Top Search Terms:');
      for (const batch of stResults) {
        if (batch.results) {
          for (const row of batch.results) {
            const st = row.searchTermView;
            const m = row.metrics;
            const status = st.status === 'ADDED' ? '✅' : st.status === 'EXCLUDED' ? '❌' : '⚠️';
            console.log(`  ${status} "${st.searchTerm}" — ${m.impressions} impr, ${m.clicks} clicks, CTR ${m.ctr ? (m.ctr*100).toFixed(1)+'%' : '0%'}, $${m.costMicros ? (m.costMicros/1e6).toFixed(2) : '0'}`);
          }
        }
      }

    } catch (err) {
      console.log(`  Error querying customer ${customerId}: ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
