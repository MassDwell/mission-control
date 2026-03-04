#!/usr/bin/env node

/**
 * FIX: Move all leads ONLY to Incoming Leads (88661695)
 * Remove them from Closed Won (142)
 */

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

async function fixDoubleStage() {
  console.log('\n🔄 FIXING: Moving leads to Incoming Leads ONLY\n');

  // Get all leads currently in Closed Won
  const response = await makeRequest('/leads?filter[statuses][0][status_id]=142&limit=500');
  const closedWonLeads = response._embedded?.leads || [];
  
  console.log(`Found ${closedWonLeads.length} leads in Closed Won\n`);
  
  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < closedWonLeads.length; i++) {
    const lead = closedWonLeads[i];
    try {
      // Move to Incoming Leads
      await makeRequest(
        `/leads/${lead.id}`,
        'PATCH',
        { status_id: 88661695 }
      );
      
      fixed++;
      console.log(`✅ [${i + 1}/${closedWonLeads.length}] ${lead.name}`);
      
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      failed++;
      console.log(`❌ [${i + 1}/${closedWonLeads.length}] ${lead.name} - ERROR`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ FIXED: ${fixed} leads moved to Incoming Leads`);
  if (failed > 0) console.log(`❌ FAILED: ${failed}`);
  console.log('='.repeat(60));
}

fixDoubleStage().catch(console.error);
