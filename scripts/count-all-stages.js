#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const creds = JSON.parse(fs.readFileSync('credentials/kommo/api-token.json', 'utf-8'));
const token = creds.token;
const host = creds.api_domain || 'crm.kommo.com';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path: `/api/v4${path}`,
      method: 'GET',
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
    req.end();
  });
}

async function countAll() {
  const stages = {
    88661695: 'Incoming Leads',
    142: 'Closed Won'
  };

  console.log('\n📊 LEAD COUNTS BY STAGE\n');

  for (const [stageId, stageName] of Object.entries(stages)) {
    // Count total leads in this stage
    let total = 0;
    let offset = 0;
    
    while (true) {
      const response = await makeRequest(`/leads?filter[statuses][0][status_id]=${stageId}&limit=250&offset=${offset}`);
      const count = response._embedded?.leads?.length || 0;
      if (count === 0) break;
      total += count;
      offset += count;
    }
    
    console.log(`${stageName}: ${total} total leads`);
  }
}

countAll().catch(console.error);
