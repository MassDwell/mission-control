#!/usr/bin/env node

/**
 * Follow-Up Cadence System (FIXED WITH REAL KOMMO STAGE IDS)
 * Sends automated follow-ups on day 3, 10, and 30 of no response
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class FollowUpCadenceSystem {
  constructor(daysToFollowUp) {
    this.daysToFollowUp = daysToFollowUp; // 3, 10, or 30
    this.logPath = 'data/massdwell/sales/followup-log.json';
    this.loadLog();
    this.kommoToken = this.loadKommoToken();
    this.loadDNCList();
    
    // Real Kommo stage IDs
    this.stageMap = {
      3: 86738631,   // Follow-up 1 (Day 3)
      10: 86738627,  // recycle follow-up (Day 10)
      30: 93011343   // FUTURE CONTACT (Day 30)
    };
  }

  loadDNCList() {
    try {
      const dnc = JSON.parse(fs.readFileSync('data/massdwell/sales/do-not-contact-list.json'));
      this.dncList = dnc.contacts.map(c => c.email.toLowerCase());
    } catch {
      this.dncList = [];
    }
  }

  loadKommoToken() {
    try {
      const creds = JSON.parse(fs.readFileSync('credentials/kommo/api-token.json'));
      this.apiDomain = creds.api_domain;
      return creds.token;
    } catch {
      return null;
    }
  }

  loadLog() {
    try {
      this.log = JSON.parse(fs.readFileSync(this.logPath));
    } catch {
      this.log = { followups: [] };
    }
  }

  saveLog() {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.logPath, JSON.stringify(this.log, null, 2));
  }

  async makeKommoRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.apiDomain || 'crm.kommo.com',
        path: `/api/v4${path}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.kommoToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async getDealsNeedingFollowUp() {
    /**
     * Get deals in "Incoming Leads" stage (waiting for response)
     * Pipeline ID: 11301551
     * Status IDs: 86738623 or 88661695 (Incoming leads)
     */
    try {
      const leads = await this.makeKommoRequest(
        `/leads?filter[statuses][0][pipeline_id]=11301551&filter[statuses][0][status_id]=86738623&filter[statuses][1][pipeline_id]=11301551&filter[statuses][1][status_id]=88661695`
      );

      return leads._embedded?.leads || [];
    } catch (e) {
      console.error('Error getting deals:', e.message);
      return [];
    }
  }

  getDaysOld(dealCreatedDate) {
    const created = new Date(dealCreatedDate);
    const now = new Date();
    const ms = now - created;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return days;
  }

  async getContactEmail(dealId) {
    try {
      const deal = await this.makeKommoRequest(`/leads/${dealId}`);
      if (!deal._embedded?.contacts?.length) return null;
      
      const contact = deal._embedded.contacts[0];
      return contact.custom_fields_values?.find(f => f.field_id === 1)?.values?.[0]?.value;
    } catch {
      return null;
    }
  }

  async moveDealToNextStage(dealId, newStageId) {
    try {
      await this.makeKommoRequest(`/leads/${dealId}`, 'PATCH', {
        status_id: newStageId
      });
      return true;
    } catch (e) {
      console.error(`Error moving deal ${dealId}:`, e.message);
      return false;
    }
  }

  async processDeal(deal) {
    const daysOld = this.getDaysOld(deal.created_at);
    const dealId = deal.id;
    const dealName = deal.name;

    // Check if already processed for this followup
    const alreadyProcessed = this.log.followups.some(f =>
      f.deal_id === dealId && 
      f.days === this.daysToFollowUp &&
      f.status === 'sent'
    );

    if (alreadyProcessed) {
      return null;
    }

    // Check if deal is old enough for this followup (within 2-day window)
    if (daysOld < this.daysToFollowUp - 1 || daysOld > this.daysToFollowUp + 2) {
      return null;
    }

    // Get contact email
    const email = await this.getContactEmail(dealId);
    if (!email) {
      console.log(`   ❌ No email for deal #${dealId}`);
      return null;
    }

    // CHECK DO-NOT-CONTACT LIST
    if (this.dncList.includes(email.toLowerCase())) {
      console.log(`   ⏭️ SKIPPING #${dealId}: ${dealName} (${email}) - on do-not-contact list`);
      return null;
    }

    // Move deal to next stage
    const nextStageId = this.stageMap[this.daysToFollowUp];
    const stageName = {
      3: 'Follow-up 1',
      10: 'Recycle Follow-up',
      30: 'Future Contact'
    }[this.daysToFollowUp];

    const moved = await this.moveDealToNextStage(dealId, nextStageId);
    
    if (moved) {
      console.log(`   ✅ Deal #${dealId}: ${dealName} → ${stageName}`);
      
      // Log success
      this.log.followups.push({
        deal_id: dealId,
        deal_name: dealName,
        email: email,
        days: this.daysToFollowUp,
        status: 'moved',
        moved_to_stage: stageName,
        timestamp: new Date().toISOString()
      });

      this.saveLog();
      return { status: 'moved', dealId, stageName };
    }

    return null;
  }

  async run() {
    console.log(`\n📬 FOLLOW-UP CADENCE - Day ${this.daysToFollowUp}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('');

    try {
      const deals = await this.getDealsNeedingFollowUp();
      console.log(`   Found ${deals.length} deals in Incoming Leads`);
      console.log('');

      let moved = 0;
      for (const deal of deals) {
        const result = await this.processDeal(deal);
        if (result && result.status === 'moved') {
          moved++;
        }
      }

      console.log(`\n✅ Moved ${moved} deal(s) to next stage`);
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

if (require.main === module) {
  const days = parseInt(process.argv[2]) || 3;
  const cadence = new FollowUpCadenceSystem(days);
  cadence.run().catch(console.error);
}

module.exports = { FollowUpCadenceSystem };
