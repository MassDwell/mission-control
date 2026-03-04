#!/usr/bin/env node
/**
 * Revert Closed Won Mistakes Script
 * 
 * Purpose: Revert 69 leads incorrectly moved to Closed Won (142) back to Incoming Leads (88661695)
 * Bug: email-to-kommo-integration.js moved prospects to wrong status
 * 
 * Criteria for reversion:
 * - Created in last 2 days (bug period)
 * - Deal value < $200k OR no custom field value
 * - Email source (not legitimate close)
 * - No contract documentation
 * 
 * CRITICAL: Conservative approach - only revert if 95%+ confident it's a mistake
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuration
const CLOSED_WON_STATUS = 142;
const INCOMING_LEADS_STATUS = 88661695;
const MIN_DEAL_VALUE_FOR_REAL_WIN = 200000; // $200k
const BUG_PERIOD_DAYS = 2;
const CREDENTIALS_PATH = path.join(__dirname, '../credentials/kommo/api-token.json');
const AUDIT_LOG_PATH = path.join(__dirname, '../data/massdwell/sales/revert-audit.json');

class KommoAPI {
  constructor(config) {
    this.domain = config.domain;
    this.accessToken = config.access_token;
  }

  async makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(`https://${this.domain}/api/v4${endpoint}`);
      
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve(body);
            }
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async getLeads(statusId, limit = 250) {
    const leads = [];
    let page = 1;
    
    while (true) {
      const response = await this.makeRequest('GET', `/leads?filter[statuses][0][pipeline_id]=1&filter[statuses][0][status_id]=${statusId}&limit=${limit}&page=${page}`);
      
      if (!response._embedded || !response._embedded.leads || response._embedded.leads.length === 0) {
        break;
      }
      
      leads.push(...response._embedded.leads);
      page++;
      
      // Safety limit
      if (page > 10 || leads.length > 1000) {
        console.log('⚠️  Hit safety limit, stopping pagination');
        break;
      }
    }
    
    return leads;
  }

  async updateLeadStatus(leadId, newStatusId) {
    const data = {
      status_id: newStatusId
    };
    
    return await this.makeRequest('PATCH', `/leads/${leadId}`, data);
  }
}

class LeadAnalyzer {
  constructor() {
    this.bugPeriodStart = Date.now() - (BUG_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  }

  analyze(lead) {
    const reasons = [];
    let confidence = 0;
    
    // Check 1: Created in bug period (last 2 days)
    const createdAt = lead.created_at * 1000; // Convert to milliseconds
    const isRecent = createdAt > this.bugPeriodStart;
    
    if (isRecent) {
      reasons.push('Created in last 2 days (bug period)');
      confidence += 40;
    } else {
      reasons.push('❌ Created before bug period');
      return { shouldRevert: false, confidence: 0, reasons };
    }
    
    // Check 2: Deal value
    const dealValue = this.extractDealValue(lead);
    if (dealValue === null || dealValue < MIN_DEAL_VALUE_FOR_REAL_WIN) {
      reasons.push(`Deal value: ${dealValue ? '$' + dealValue.toLocaleString() : 'Not set'} (< $200k threshold)`);
      confidence += 30;
    } else {
      reasons.push(`⚠️  High deal value: $${dealValue.toLocaleString()} (potential real win)`);
      confidence -= 20;
    }
    
    // Check 3: Source is email (not manual entry or contract)
    const source = this.extractSource(lead);
    if (source && source.toLowerCase().includes('email')) {
      reasons.push('Source: Email (likely auto-classified)');
      confidence += 15;
    }
    
    // Check 4: No contract/close documentation in custom fields
    const hasContractDocs = this.hasContractDocumentation(lead);
    if (!hasContractDocs) {
      reasons.push('No contract documentation found');
      confidence += 15;
    } else {
      reasons.push('⚠️  Contract documentation present');
      confidence -= 30;
    }
    
    // Decision: 95% confidence threshold
    const shouldRevert = confidence >= 95;
    
    return {
      shouldRevert,
      confidence,
      reasons,
      dealValue,
      source,
      createdAt: new Date(createdAt).toISOString()
    };
  }

  extractDealValue(lead) {
    // Check price field
    if (lead.price && lead.price > 0) {
      return lead.price;
    }
    
    // Check custom fields for contract value
    if (lead.custom_fields_values) {
      for (const field of lead.custom_fields_values) {
        if (field.field_name && field.field_name.toLowerCase().includes('contract')) {
          if (field.values && field.values[0] && field.values[0].value) {
            const value = parseFloat(field.values[0].value);
            if (!isNaN(value)) return value;
          }
        }
      }
    }
    
    return null;
  }

  extractSource(lead) {
    // Check _embedded.tags
    if (lead._embedded && lead._embedded.tags) {
      for (const tag of lead._embedded.tags) {
        if (tag.name && tag.name.toLowerCase().includes('email')) {
          return 'Email';
        }
      }
    }
    
    // Check custom fields
    if (lead.custom_fields_values) {
      for (const field of lead.custom_fields_values) {
        if (field.field_name && field.field_name.toLowerCase().includes('source')) {
          if (field.values && field.values[0] && field.values[0].value) {
            return field.values[0].value;
          }
        }
      }
    }
    
    return 'Unknown';
  }

  hasContractDocumentation(lead) {
    if (!lead.custom_fields_values) return false;
    
    const contractKeywords = ['contract', 'signed', 'agreement', 'close', 'won'];
    
    for (const field of lead.custom_fields_values) {
      const fieldName = (field.field_name || '').toLowerCase();
      
      for (const keyword of contractKeywords) {
        if (fieldName.includes(keyword)) {
          if (field.values && field.values.length > 0 && field.values[0].value) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
}

async function main() {
  console.log('🔄 Starting Closed Won Lead Reversion Process\n');
  console.log('=' .repeat(60));
  
  // Load credentials
  console.log('📋 Loading Kommo API credentials...');
  let credentials;
  try {
    const credData = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    credentials = JSON.parse(credData);
    
    if (credentials.access_token === 'YOUR_ACCESS_TOKEN_HERE') {
      console.error('❌ ERROR: Kommo API credentials not configured!');
      console.error('   Please edit:', CREDENTIALS_PATH);
      process.exit(1);
    }
    
    console.log(`✅ Connected to: ${credentials.domain}\n`);
  } catch (error) {
    console.error('❌ Failed to load credentials:', error.message);
    process.exit(1);
  }
  
  const api = new KommoAPI(credentials);
  const analyzer = new LeadAnalyzer();
  
  // Fetch all Closed Won leads
  console.log(`🔍 Fetching all leads in Closed Won status (${CLOSED_WON_STATUS})...`);
  let closedWonLeads;
  try {
    closedWonLeads = await api.getLeads(CLOSED_WON_STATUS);
    console.log(`✅ Found ${closedWonLeads.length} leads in Closed Won\n`);
  } catch (error) {
    console.error('❌ Failed to fetch leads:', error.message);
    process.exit(1);
  }
  
  if (closedWonLeads.length === 0) {
    console.log('✨ No leads found in Closed Won status. Nothing to do!');
    process.exit(0);
  }
  
  // Analyze each lead
  console.log('🔬 Analyzing leads...\n');
  const auditLog = {
    timestamp: new Date().toISOString(),
    totalLeadsInClosedWon: closedWonLeads.length,
    analyzed: [],
    reverted: [],
    keptAsClosedWon: [],
    errors: []
  };
  
  for (const lead of closedWonLeads) {
    const analysis = analyzer.analyze(lead);
    
    const record = {
      id: lead.id,
      name: lead.name || 'Unnamed Lead',
      createdAt: analysis.createdAt,
      dealValue: analysis.dealValue,
      source: analysis.source,
      confidence: analysis.confidence,
      reasons: analysis.reasons,
      shouldRevert: analysis.shouldRevert
    };
    
    auditLog.analyzed.push(record);
    
    console.log(`\n📊 Lead #${lead.id}: ${lead.name || 'Unnamed'}`);
    console.log(`   Created: ${analysis.createdAt}`);
    console.log(`   Value: ${analysis.dealValue ? '$' + analysis.dealValue.toLocaleString() : 'Not set'}`);
    console.log(`   Source: ${analysis.source}`);
    console.log(`   Confidence: ${analysis.confidence}%`);
    console.log(`   Decision: ${analysis.shouldRevert ? '✅ REVERT' : '❌ KEEP AS CLOSED WON'}`);
    console.log(`   Reasons:`);
    analysis.reasons.forEach(r => console.log(`     - ${r}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 Summary of Analysis:');
  console.log(`   Total leads analyzed: ${auditLog.analyzed.length}`);
  console.log(`   To revert: ${auditLog.analyzed.filter(a => a.shouldRevert).length}`);
  console.log(`   To keep as Closed Won: ${auditLog.analyzed.filter(a => !a.shouldRevert).length}\n`);
  
  // Ask for confirmation (in production, you might want to make this automatic)
  console.log('⚠️  CONFIRMATION REQUIRED ⚠️');
  console.log('This will modify leads in Kommo CRM.');
  console.log('Set CONFIRM=yes environment variable to proceed.\n');
  
  if (process.env.CONFIRM !== 'yes') {
    console.log('ℹ️  Dry run mode - no changes made.');
    console.log('   Review analysis above, then run with: CONFIRM=yes node scripts/revert-closed-won-mistakes.js\n');
    
    // Save audit log anyway
    await fs.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
    await fs.writeFile(AUDIT_LOG_PATH, JSON.stringify(auditLog, null, 2));
    console.log(`📝 Audit log saved to: ${AUDIT_LOG_PATH}`);
    process.exit(0);
  }
  
  // Execute reversions
  console.log('🚀 Starting reversion process...\n');
  
  for (const record of auditLog.analyzed) {
    if (!record.shouldRevert) {
      auditLog.keptAsClosedWon.push(record);
      continue;
    }
    
    try {
      console.log(`🔄 Reverting lead #${record.id}: ${record.name}...`);
      await api.updateLeadStatus(record.id, INCOMING_LEADS_STATUS);
      
      record.reverted = true;
      record.revertedAt = new Date().toISOString();
      auditLog.reverted.push(record);
      
      console.log(`   ✅ Successfully reverted to Incoming Leads (${INCOMING_LEADS_STATUS})`);
      
      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`   ❌ Failed to revert: ${error.message}`);
      
      record.reverted = false;
      record.error = error.message;
      auditLog.errors.push(record);
    }
  }
  
  // Save audit log
  await fs.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
  await fs.writeFile(AUDIT_LOG_PATH, JSON.stringify(auditLog, null, 2));
  
  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ REVERSION COMPLETE\n');
  console.log(`📊 Final Results:`);
  console.log(`   ✅ Successfully reverted: ${auditLog.reverted.length}`);
  console.log(`   ⚠️  Kept as Closed Won: ${auditLog.keptAsClosedWon.length}`);
  console.log(`   ❌ Errors: ${auditLog.errors.length}`);
  console.log(`\n📝 Full audit log: ${AUDIT_LOG_PATH}\n`);
  
  if (auditLog.keptAsClosedWon.length > 0) {
    console.log('📋 Leads kept as Closed Won (high-value or documented):');
    auditLog.keptAsClosedWon.forEach(lead => {
      console.log(`   - Lead #${lead.id}: ${lead.name} ($${(lead.dealValue || 0).toLocaleString()})`);
    });
    console.log();
  }
  
  if (auditLog.errors.length > 0) {
    console.log('⚠️  Errors encountered:');
    auditLog.errors.forEach(lead => {
      console.log(`   - Lead #${lead.id}: ${lead.error}`);
    });
    console.log();
  }
  
  console.log('✨ Process complete. Review audit log for full details.\n');
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
