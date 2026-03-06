#!/usr/bin/env node

/**
 * Analyze when Closed Won leads were created
 * Identify which ones are from the bug period (last 24 hours)
 */

const fs = require('fs');
const https = require('https');

class AnalyzeClosedWon {
  constructor() {
    this.loadKommoToken();
    this.kommoHost = this.apiDomain || 'crm.kommo.com';
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
    console.log('\n📊 ANALYZING CLOSED WON LEADS BY CREATION TIME\n');

    try {
      const response = await this.makeKommoRequest(
        '/leads?filter[statuses][0][status_id]=142&limit=250'
      );

      if (!response._embedded || !response._embedded.leads) {
        console.log('No leads found');
        return;
      }

      const leads = response._embedded.leads;
      const now = new Date();

      // Group by creation time
      const byHours = {};
      const bugPeriod = []; // Last 24 hours = potential bug victims

      for (const lead of leads) {
        const createdAt = new Date(lead.created_at);
        const hoursSince = (now - createdAt) / (1000 * 60 * 60);

        const hourBucket = Math.floor(hoursSince);
        byHours[hourBucket] = (byHours[hourBucket] || 0) + 1;

        if (hoursSince <= 24) {
          bugPeriod.push({
            name: lead.name,
            createdAt: lead.created_at,
            hoursSince: Math.round(hoursSince * 10) / 10,
            id: lead.id
          });
        }
      }

      console.log('📈 Leads by age (hours since creation):');
      Object.keys(byHours).sort((a, b) => a - b).slice(0, 20).forEach(hours => {
        console.log(`   ${hours}h ago: ${byHours[hours]} leads`);
      });

      console.log(`\n⏰ Last 24 hours (potential bug victims): ${bugPeriod.length} leads`);
      
      if (bugPeriod.length > 0) {
        console.log('\n📋 Recently created Closed Won leads:');
        bugPeriod.sort((a, b) => b.hoursSince - a.hoursSince).forEach(lead => {
          console.log(`   ${lead.hoursSince}h ago: ${lead.name} (ID: ${lead.id})`);
        });
      }

    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

const analyzer = new AnalyzeClosedWon();
analyzer.run().catch(console.error);
