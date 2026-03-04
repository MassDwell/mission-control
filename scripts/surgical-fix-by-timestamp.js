#!/usr/bin/env node

/**
 * SURGICAL FIX: Move leads back to correct stages based on creation timestamp
 * 
 * Logic:
 * - Leads created BEFORE 4:45 PM (16:45 EST, 2026-03-03) = Closed Lost (143)
 * - Leads created AT/AFTER 4:45 PM = Bug victims, stay in Incoming (88661695)
 */

const fs = require('fs');
const https = require('https');

const creds = JSON.parse(fs.readFileSync('credentials/kommo/api-token.json', 'utf-8'));
const token = creds.token;
const host = creds.api_domain || 'crm.kommo.com';

// 4:45 PM EST on 2026-03-03 = 21:45 UTC
const BUG_START_TIME = new Date('2026-03-03T16:45:00-05:00').getTime();

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

async function run() {
  console.log('\n🔧 SURGICAL FIX: Restoring leads to correct stages by creation time\n');
  console.log(`Bug start time: ${new Date(BUG_START_TIME).toISOString()}\n`);

  // Get all leads currently in Incoming (88661695)
  console.log('📥 Fetching all leads in Incoming Leads stage...');
  const response = await makeRequest('/leads?filter[statuses][0][status_id]=88661695&limit=500');
  const allLeads = response._embedded?.leads || [];
  
  console.log(`Found ${allLeads.length} total leads\n`);

  let movedToClosedLost = 0;
  let stayInIncoming = 0;
  let failed = 0;

  for (let i = 0; i < allLeads.length; i++) {
    const lead = allLeads[i];
    const createdAt = new Date(lead.created_at).getTime();
    const isBeforeBug = createdAt < BUG_START_TIME;

    try {
      if (isBeforeBug) {
        // Move to Closed Lost (143)
        await makeRequest(
          `/leads/${lead.id}`,
          'PATCH',
          { status_id: 143 }
        );
        movedToClosedLost++;
        console.log(`↩️  [${i + 1}/${allLeads.length}] ${lead.name} → Closed Lost (created ${new Date(createdAt).toISOString()})`);
      } else {
        stayInIncoming++;
        console.log(`✅ [${i + 1}/${allLeads.length}] ${lead.name} → Keep in Incoming (bug victim, created ${new Date(createdAt).toISOString()})`);
      }
      
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      failed++;
      console.log(`❌ [${i + 1}/${allLeads.length}] ${lead.name} - ERROR: ${e.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ SURGICAL FIX COMPLETE');
  console.log('='.repeat(60));
  console.log(`↩️  Moved to Closed Lost: ${movedToClosedLost}`);
  console.log(`✅ Staying in Incoming: ${stayInIncoming}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
}

run().catch(console.error);
