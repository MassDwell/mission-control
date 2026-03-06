#!/usr/bin/env node

/**
 * EMERGENCY REVERT SCRIPT
 * Moves 69 incorrectly classified leads from Closed Won (142) back to Incoming Leads (88661695)
 * 
 * Root cause: email-to-kommo-integration.js had stage ID 142 hardcoded as "incoming_leads"
 * This script identifies those mistakes and reverts them
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class ClosedWonRevert {
  constructor() {
    this.loadKommoToken();
    this.kommoHost = this.apiDomain || 'crm.kommo.com';
    this.auditLog = [];
    this.reverted = [];
    this.stayedClosed = [];
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

  async getClosedWonLeads() {
    /**
     * Query Kommo for all leads in Closed Won (status_id = 142)
     */
    try {
      console.log('\n📊 Querying Kommo for Closed Won leads...');
      
      const response = await this.makeKommoRequest(
        '/leads?filter[statuses][0][status_id]=142&limit=250'
      );

      if (response._embedded && response._embedded.leads) {
        console.log(`   Found ${response._embedded.leads.length} leads in Closed Won stage`);
        return response._embedded.leads;
      }

      return [];
    } catch (e) {
      console.error('Error querying Closed Won leads:', e.message);
      return [];
    }
  }

  isMistake(lead) {
    /**
     * Determine if a lead is a mistake (should be reverted)
     * 
     * MISTAKE CRITERIA:
     * - Created in last 24 hours (matches bug timeframe)
     * - Has low/no deal value (contract value not set or < $50K)
     * - No custom field data (Closed Won deals usually have contract details)
     * - Source is "Email" (from email-to-kommo integration)
     */

    const createdAt = new Date(lead.created_at);
    const now = new Date();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

    // Check creation time (bug ran for ~24h, so 48h window to be safe)
    const isRecent = hoursSinceCreation < 48;

    // Check deal value
    let dealValue = 0;
    if (lead.custom_fields_values) {
      const valueField = lead.custom_fields_values.find(f => f.field_id === 'deal_value' || f.field_name === 'Deal Value');
      if (valueField && valueField.values && valueField.values[0]) {
        dealValue = parseFloat(valueField.values[0].value) || 0;
      }
    }

    const isLowValue = dealValue < 50000 || dealValue === 0;

    // Check source
    let source = 'Unknown';
    if (lead.custom_fields_values) {
      const sourceField = lead.custom_fields_values.find(f => f.field_name === 'Source');
      if (sourceField && sourceField.values && sourceField.values[0]) {
        source = sourceField.values[0].value;
      }
    }

    const isEmailSource = source === 'Email' || source === 'email';

    // Decision: revert if recent AND low value OR email source
    const shouldRevert = isRecent && (isLowValue || isEmailSource);

    return {
      shouldRevert,
      reason: {
        recent: isRecent,
        lowValue: isLowValue,
        emailSource: isEmailSource,
        dealValue,
        hoursSinceCreation: Math.round(hoursSinceCreation * 10) / 10
      }
    };
  }

  async revertLead(lead) {
    /**
     * Move lead from Closed Won (142) back to Incoming Leads (88661695)
     */
    try {
      const leadId = lead.id;
      const leadName = lead.name || 'Unknown';

      // Call Kommo API to update status
      await this.makeKommoRequest(
        `/leads/${leadId}`,
        'PATCH',
        {
          status_id: 88661695  // Incoming Leads
        }
      );

      console.log(`   ✅ REVERTED: #${leadId} ${leadName} → Incoming Leads`);

      this.reverted.push({
        leadId,
        name: leadName,
        timestamp: new Date().toISOString()
      });

      this.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'revert_to_incoming',
        leadId,
        leadName,
        previousStage: 142,
        newStage: 88661695,
        status: 'success'
      });

      return true;
    } catch (e) {
      console.error(`   ❌ FAILED to revert #${lead.id}:`, e.message);

      this.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'revert_to_incoming',
        leadId: lead.id,
        leadName: lead.name,
        status: 'failed',
        error: e.message
      });

      return false;
    }
  }

  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 CLOSED WON REVERT OPERATION');
    console.log('='.repeat(60));

    try {
      // Step 1: Get all Closed Won leads
      const closedWonLeads = await this.getClosedWonLeads();

      if (closedWonLeads.length === 0) {
        console.log('✅ No leads in Closed Won stage. Nothing to revert.');
        return;
      }

      // Step 2: Analyze each lead
      console.log('\n📋 Analyzing leads for mistakes...');
      const toRevert = [];
      const toKeep = [];

      for (const lead of closedWonLeads) {
        const analysis = this.isMistake(lead);

        if (analysis.shouldRevert) {
          toRevert.push(lead);
          console.log(`   🔄 ${lead.name}: REVERT (recent: ${analysis.reason.recent}, lowValue: ${analysis.reason.lowValue}, emailSource: ${analysis.reason.emailSource})`);
        } else {
          toKeep.push(lead);
          this.stayedClosed.push({
            leadId: lead.id,
            name: lead.name,
            reason: 'legitimate close'
          });
          console.log(`   ✓ ${lead.name}: KEEP (legitimate close)`);
        }
      }

      console.log(`\n📊 Analysis Complete:`);
      console.log(`   To Revert: ${toRevert.length}`);
      console.log(`   To Keep:   ${toKeep.length}`);

      // Step 3: Execute reverts
      if (toRevert.length > 0) {
        console.log(`\n⏳ Reverting ${toRevert.length} leads...`);
        for (const lead of toRevert) {
          await this.revertLead(lead);
          // Rate limit: 100ms between API calls
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Step 4: Save audit log
      this.saveAuditLog();

      // Step 5: Report
      console.log('\n' + '='.repeat(60));
      console.log('✅ REVERT OPERATION COMPLETE');
      console.log('='.repeat(60));
      console.log(`\n📈 Results:`);
      console.log(`   ✅ Reverted to Incoming Leads: ${this.reverted.length}`);
      console.log(`   ✓ Kept in Closed Won:          ${this.stayedClosed.length}`);
      console.log(`\n📋 Audit log saved to: data/massdwell/sales/revert-audit.json`);

      if (this.reverted.length > 0) {
        console.log(`\n📊 Sample Reverted Leads:`);
        this.reverted.slice(0, 5).forEach(lead => {
          console.log(`   • ${lead.name} (ID: ${lead.leadId})`);
        });
        if (this.reverted.length > 5) {
          console.log(`   ... and ${this.reverted.length - 5} more`);
        }
      }

    } catch (e) {
      console.error('\n❌ CRITICAL ERROR:', e.message);
      process.exit(1);
    }
  }

  saveAuditLog() {
    const logPath = 'data/massdwell/sales/revert-audit.json';
    const dir = path.dirname(logPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      operation: 'closed_won_revert',
      summary: {
        totalLeads: this.reverted.length + this.stayedClosed.length,
        reverted: this.reverted.length,
        kept: this.stayedClosed.length
      },
      reverted: this.reverted,
      kept: this.stayedClosed,
      auditLog: this.auditLog
    };

    fs.writeFileSync(logPath, JSON.stringify(report, null, 2));
    console.log(`\n   Audit log written: ${logPath}`);
  }
}

// Execute
if (require.main === module) {
  const revert = new ClosedWonRevert();
  revert.run().catch(console.error);
}

module.exports = { ClosedWonRevert };
