#!/usr/bin/env node
/**
 * Google Ads — Add negative keywords to all active campaigns
 * Keywords: free, factoring, civil, electrical, joist, let's build
 */

const fs = require('fs');
const path = require('path');

const CREDS = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw/workspace/credentials/google/ads/ads-credentials.json')));
const TOKEN = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw/workspace/credentials/google/ads/ads-token.json')));

const NEGATIVE_KEYWORDS = ['free', 'factoring', 'civil', 'electrical', 'joist', "let's build"];

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
  try { return JSON.parse(text); } catch { throw new Error('Non-JSON response: ' + text.substring(0, 500)); }
}

async function mutateCampaignNegatives(accessToken, customerId, campaignId, keywords) {
  const url = `https://googleads.googleapis.com/v18/customers/${customerId}/campaignCriteria:mutate`;
  const operations = keywords.map(kw => ({
    create: {
      campaign: `customers/${customerId}/campaigns/${campaignId}`,
      negative: true,
      keyword: {
        text: kw,
        match_type: 'BROAD',
      },
    },
  }));

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': CREDS.developer_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operations }),
  });
  const text = await resp.text();
  try { return JSON.parse(text); } catch { throw new Error('Non-JSON: ' + text.substring(0, 500)); }
}

async function main() {
  console.log('Refreshing access token...');
  const accessToken = await refreshAccessToken();

  // List accessible customers
  const customersResp = await fetch('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': CREDS.developer_token,
    },
  });
  const customersData = await customersResp.json();
  if (!customersData.resourceNames) throw new Error('No customers: ' + JSON.stringify(customersData));

  for (const customerResource of customersData.resourceNames) {
    const customerId = customerResource.replace('customers/', '');
    console.log(`\n--- Customer ${customerId} ---`);

    // Get active campaigns
    const campaignQuery = `
      SELECT campaign.id, campaign.name, campaign.status
      FROM campaign
      WHERE campaign.status = 'ENABLED'
    `;
    const campaignResult = await googleAdsQuery(accessToken, customerId, campaignQuery);
    const campaigns = [];
    for (const batch of (Array.isArray(campaignResult) ? campaignResult : [campaignResult])) {
      if (batch.results) campaigns.push(...batch.results);
    }

    if (campaigns.length === 0) {
      console.log('  No active campaigns found.');
      continue;
    }

    for (const row of campaigns) {
      const cid = row.campaign.id;
      const cname = row.campaign.name;
      console.log(`  Campaign: ${cname} (${cid})`);
      console.log(`  Adding negatives: ${NEGATIVE_KEYWORDS.join(', ')}`);

      const result = await mutateCampaignNegatives(accessToken, customerId, cid, NEGATIVE_KEYWORDS);
      if (result.results) {
        console.log(`  ✅ Added ${result.results.length} negative keywords`);
        result.results.forEach(r => console.log(`     - ${r.resourceName}`));
      } else if (result.error || result.partialFailureError) {
        console.log(`  ❌ Error:`, JSON.stringify(result.error || result.partialFailureError, null, 2));
      } else {
        console.log('  Response:', JSON.stringify(result, null, 2));
      }
    }
  }

  console.log('\nDone.');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
