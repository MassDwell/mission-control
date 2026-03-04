#!/usr/bin/env node

/**
 * BULK REVERT: Move ALL leads in Closed Won back to Incoming Leads
 * No analysis. No questions. Just do it.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class BulkRevert {
  constructor() {
    const creds = JSON.parse(fs.readFileSync('credentials/kommo/api-token.json', 'utf-8'));
    this.accessToken = creds.token;
    this.kommoHost = creds.api_domain || 'crm.kommo.com';
    this.reverted = [];
    this.failed = [];
  }

  makeKommoRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.kommoHost,
        path: `/api/v4${path}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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

  async run() {
    console.log('\n🔄 REVERTING ALL CLOSED WON LEADS TO INCOMING LEADS\n');

    try {
      // Get all leads in Closed Won (142)
      console.log('📥 Fetching all Closed Won leads...');
      const response = await this.makeKommoRequest('/leads?filter[statuses][0][status_id]=142&limit=500');
      
      if (!response._embedded || !response._embedded.leads) {
        console.log('No leads found.');
        return;
      }

      const leads = response._embedded.leads;
      console.log(`Found ${leads.length} leads in Closed Won.\n`);

      // Revert each one
      console.log('🔄 Reverting to Incoming Leads (88661695)...\n');
      
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        try {
          await this.makeKommoRequest(
            `/leads/${lead.id}`,
            'PATCH',
            { status_id: 88661695 }
          );
          
          this.reverted.push({
            id: lead.id,
            name: lead.name
          });
          
          console.log(`✅ [${i + 1}/${leads.length}] ${lead.name}`);
          
          // Rate limit
          await new Promise(r => setTimeout(r, 50));
        } catch (e) {
          this.failed.push({
            id: lead.id,
            name: lead.name,
            error: e.message
          });
          console.log(`❌ [${i + 1}/${leads.length}] ${lead.name} - ERROR: ${e.message}`);
        }
      }

      // Report
      console.log('\n' + '='.repeat(60));
      console.log(`✅ COMPLETED: ${this.reverted.length} leads reverted`);
      if (this.failed.length > 0) {
        console.log(`❌ FAILED: ${this.failed.length} leads`);
      }
      console.log('='.repeat(60));

    } catch (e) {
      console.error('\n❌ CRITICAL ERROR:', e.message);
      process.exit(1);
    }
  }
}

new BulkRevert().run().catch(console.error);
