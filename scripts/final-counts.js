#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const creds = JSON.parse(fs.readFileSync('credentials/kommo/api-token.json', 'utf-8'));

function req(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: creds.api_domain || 'crm.kommo.com',
      path: `/api/v4${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${creds.token}`,
        'Content-Type': 'application/json'
      }
    };

    const r = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    r.on('error', reject);
    r.end();
  });
}

(async () => {
  const stages = { 142: 'Closed Won', 143: 'Closed Lost', 88661695: 'Incoming Leads' };
  
  console.log('\n🎯 FINAL STAGE COUNTS\n');
  
  for (const [stageId, name] of Object.entries(stages)) {
    let total = 0;
    let offset = 0;
    while (true) {
      const r = await req(`/leads?filter[statuses][0][status_id]=${stageId}&limit=250&offset=${offset}`);
      const count = r._embedded?.leads?.length || 0;
      if (count === 0) break;
      total += count;
      offset += count;
    }
    console.log(`${name} (${stageId}): ${total}`);
  }
})();
