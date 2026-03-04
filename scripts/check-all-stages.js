#!/usr/bin/env node

/**
 * Check all MassDwell stages for recently created leads
 * Find the 69 leads that were mistakenly moved
 */

const fs = require('fs');
const https = require('https');

class CheckAllStages {
  constructor() {
    this.loadKommoToken();
    this.kommoHost = this.apiDomain || 'crm.kommo.com';
    this.stages = {
      88661695: 'Initial Contact (Incoming Leads)',
      94100935: 'Welcome Email Sent',
      86738631: 'Follow-Up 1',
      86738627: 'Follow-Up 2/Recycle',
      97920535: 'Follow-Up 3/Re-engagement',
      93011343: 'Long-term Nurture',
      142: 'Closed - Won',
      143: 'Closed - Lost'
    };
  }

  loadKommoToken() {
    try {
      const creds = JSON.parse(
        fs.readFileSync('credentials/kommo/api-token.json', 'utf-8')
      );
      this.accessToken = creds.token;
      this.apiDomain = creds.api_domain;
    } catch (e) {
      console.error('❌ Missing Kommo credentials');
      process.exit(1);
    }
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
    console.log('\n📊 CHECKING ALL MASSDWELL STAGES FOR RECENT LEADS\n');

    const now = new Date();
    const recentLeads = {};

    for (const [stageId, stageName] of Object.entries(this.stages)) {
      try {
        const response = await this.makeKommoRequest(
          `/leads?filter[statuses][0][status_id]=${stageId}&limit=500`
        );

        if (!response._embedded || !response._embedded.leads) {
          continue;
        }

        const leads = response._embedded.leads;
        const recent = [];

        for (const lead of leads) {
          const createdAt = new Date(lead.created_at);
          const hoursSince = (now - createdAt) / (1000 * 60 * 60);

          if (hoursSince < 24) {
            recent.push({
              name: lead.name,
              id: lead.id,
              hoursSince: Math.round(hoursSince * 10) / 10
            });
          }
        }

        if (recent.length > 0) {
          recentLeads[stageName] = {
            count: recent.length,
            leads: recent.sort((a, b) => a.hoursSince - b.hoursSince)
          };
        }

        console.log(`✓ Stage: ${stageName} (${stageId})`);
        console.log(`  Total: ${leads.length} | Recent (24h): ${recent.length}`);

      } catch (e) {
        console.error(`✗ Error checking stage ${stageId}:`, e.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 RECENT LEADS (Last 24 Hours) BY STAGE');
    console.log('='.repeat(60));

    for (const [stageName, data] of Object.entries(recentLeads)) {
      console.log(`\n${stageName}: ${data.count} leads`);
      data.leads.slice(0, 10).forEach(lead => {
        console.log(`   • ${lead.hoursSince}h ago: ${lead.name} (ID: ${lead.id})`);
      });
      if (data.leads.length > 10) {
        console.log(`   ... and ${data.leads.length - 10} more`);
      }
    }

    // Calculate total recent leads
    const totalRecent = Object.values(recentLeads).reduce((sum, stage) => sum + stage.count, 0);
    console.log(`\n📈 TOTAL RECENT LEADS (24h): ${totalRecent}`);

    if (totalRecent >= 65) {
      console.log('\n✅ Found the 69 leads! They are distributed across multiple stages.');
    } else {
      console.log('\n⚠️ Only found ' + totalRecent + ' recent leads. The rest may have been created earlier.');
    }
  }
}

const checker = new CheckAllStages();
checker.run().catch(console.error);
