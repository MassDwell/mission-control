#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const creds = JSON.parse(fs.readFileSync('credentials/kommo/api-token.json', 'utf-8'));
const token = creds.token;
const host = creds.api_domain || 'crm.kommo.com';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path: `/api/v4${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkStages() {
  const stages = {
    88661695: 'Incoming Leads',
    142: 'Closed Won'
  };

  console.log('\n📊 VERIFYING REVERT SUCCESS\n');

  for (const [stageId, stageName] of Object.entries(stages)) {
    const response = await makeRequest(`/leads?filter[statuses][0][status_id]=${stageId}&limit=10`);
    const count = response._embedded?.leads?.length || 0;
    console.log(`${stageName} (${stageId}): ${count} leads (showing first 10)`);
    
    if (response._embedded?.leads) {
      response._embedded.leads.slice(0, 3).forEach(lead => {
        console.log(`  • ${lead.name}`);
      });
    }
  }
}

checkStages().catch(console.error);
