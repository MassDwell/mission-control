#!/usr/bin/env node

/**
 * Email to Kommo CRM Integration
 * Automatically creates/updates deals in Kommo when sales leads detected
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class EmailToKommoIntegration {
  constructor() {
    this.accessToken = this.loadKommoToken();
    this.kommoHost = this.apiDomain || 'crm.kommo.com';
    this.logPath = 'data/massdwell/sales/email-kommo-sync.json';
    this.loadSyncLog();
    this.loadDNCList();
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
      const creds = JSON.parse(
        fs.readFileSync('credentials/kommo/api-token.json', 'utf-8')
      );
      this.apiDomain = creds.api_domain;
      return creds.token;
    } catch (e) {
      console.error('❌ Missing Kommo credentials');
      return null;
    }
  }

  loadSyncLog() {
    try {
      this.syncLog = JSON.parse(fs.readFileSync(this.logPath, 'utf-8'));
    } catch {
      this.syncLog = { syncs: [] };
    }
  }

  saveSyncLog() {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.logPath, JSON.stringify(this.syncLog, null, 2));
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

  async findOrCreateContact(email, name, phone = null) {
    /**
     * Find existing contact or create new one
     */
    try {
      // Search for contact by email
      const contacts = await this.makeKommoRequest(`/contacts?filter[emails]=${email}`);

      if (contacts._embedded && contacts._embedded.contacts.length > 0) {
        return contacts._embedded.contacts[0];
      }

      // Create new contact
      const contactData = {
        name: name || 'Unknown',
        custom_fields_values: [
          {
            field_id: 1, // Email field
            values: [{ value: email }]
          }
        ]
      };

      if (phone) {
        contactData.custom_fields_values.push({
          field_id: 2, // Phone field
          values: [{ value: phone }]
        });
      }

      const created = await this.makeKommoRequest('/contacts', 'POST', contactData);

      if (created._embedded && created._embedded.contacts.length > 0) {
        console.log(`✅ Created new Kommo contact: ${name} (${email})`);
        return created._embedded.contacts[0];
      }

      return null;
    } catch (e) {
      console.error(`Error with contact ${email}:`, e.message);
      return null;
    }
  }

  async createOrUpdateDeal(contact, emailData, intent, business = 'MassDwell') {
    /**
     * Create or update deal in Kommo
     * ONLY sync to deals in "Incoming Leads" stage
     * Skip if contact has deals in Negotiation, Contract, or Closed stages
     */
    try {
      // Check if deal already exists for this contact
      const deals = await this.makeKommoRequest(`/leads?filter[contacts]=${contact.id}`);

      if (deals._embedded && deals._embedded.leads.length > 0) {
        // Check if ANY deal is in "Incoming Leads" stage
        const incomingDeal = deals._embedded.leads.find(d => 
          d.status_id === 86738623 || d.status_id === 88661695
        );
        
        if (incomingDeal) {
          // Update ONLY the Incoming Leads deal
          console.log(`📝 Found existing deal in Incoming Leads for ${contact.name}: #${incomingDeal.id}`);
          
          // Add note/activity
          await this.makeKommoRequest(
            `/leads/${incomingDeal.id}/notes`,
            'POST',
            {
              note_type: 'service',
              params: {
                text: `Email: ${emailData.subject}\n\n${emailData.body.substring(0, 200)}...`
              }
            }
          );

          return incomingDeal;
        } else {
          // Contact has deals but NOT in Incoming Leads stage
          // Skip this contact (they're in negotiation, contract, or closed)
          const otherDeal = deals._embedded.leads[0];
          console.log(`⏭️ SKIPPING ${contact.name} - Has deal #${otherDeal.id} in stage ${otherDeal.status_id} (not Incoming Leads)`);
          return null;
        }
      }

      // Create new deal
      const dealData = {
        name: emailData.subject || `${business} Inquiry`,
        contacts_id: [contact.id],
        custom_fields_values: [
          {
            field_id: 100, // Custom: Source
            values: [{ value: 'Email' }]
          },
          {
            field_id: 101, // Custom: Intent
            values: [{ value: intent }]
          }
        ]
      };

      const created = await this.makeKommoRequest('/leads', 'POST', dealData);

      if (created._embedded && created._embedded.leads.length > 0) {
        const newDeal = created._embedded.leads[0];
        console.log(`✅ Created new deal in Kommo: #${newDeal.id}`);
        return newDeal;
      }

      return null;
    } catch (e) {
      console.error(`Error creating deal:`, e.message);
      return null;
    }
  }

  async moveDealStage(dealId, newStage) {
    /**
     * Move deal to new pipeline stage
     * CRITICAL: Stage IDs must match Kommo CRM pipeline
     */
    try {
      const stageMap = {
        'incoming_leads': 88661695,      // Initial Contact
        'welcome_sent': 94100935,        // Welcome Email Sent
        'follow_up_1': 86738631,         // Follow-Up 1
        'follow_up_2': 86738627,         // Follow-Up 2
        'follow_up_3': 97920535,         // Follow-Up 3
        're_engagement': 86738627,       // Re-engagement
        'site_feasibility': 89929427,    // Site Feasibility Booked
        'negotiation': 88076707,         // Negotiation
        'contract_signed': 89929311,     // Contract Signed
        'closed_won': 142,               // Closed - Won (PROTECTED)
        'closed_lost': 143               // Closed - Lost (PROTECTED)
      };

      // Default to incoming_leads, NOT Closed Won!
      const stageId = stageMap[newStage] || 88661695;

      // ❌ SAFETY GATE: Never move to Closed Won/Lost automatically
      const PROTECTED_STAGES = [142, 143]; // Closed Won, Closed Lost
      if (PROTECTED_STAGES.includes(stageId)) {
        console.log(`⏭️ BLOCKED: Attempted to move deal to protected stage ${stageId}`);
        return;
      }

      await this.makeKommoRequest(
        `/leads/${dealId}`,
        'PATCH',
        {
          status_id: stageId
        }
      );

      console.log(`→ Moved deal to stage ${stageId} (${newStage}`);
    } catch (e) {
      console.error(`Error moving deal stage:`, e.message);
    }
  }

  async processSalesLead(emailData) {
    /**
     * Full pipeline: Email → Contact → Deal → Stage
     */
    const { sender, subject, body } = emailData;
    const email = sender.match(/([^\s<]+@[^\s>]+)/)?.[1];
    const name = sender.match(/([^<]+)</)?.[1]?.trim() || 'Unknown';
    
    // CHECK DO-NOT-CONTACT LIST
    if (email && this.dncList.includes(email.toLowerCase())) {
      console.log(`\n⏭️ SKIPPING ${name} (${email}) - on do-not-contact list`);
      return null;
    }
    
    const business = body.toLowerCase().includes('laser') ? 'Atlantic Laser' : 'MassDwell';

    console.log(`\n🔄 Processing sales lead: ${name} (${email})`);

    // Step 1: Find or create contact
    const contact = await this.findOrCreateContact(email, name);
    if (!contact) {
      console.log(`❌ Failed to create/find contact`);
      return null;
    }

    // Step 2: Create or update deal
    const deal = await this.createOrUpdateDeal(contact, emailData, 'SALES_INQUIRY', business);
    if (!deal) {
      console.log(`❌ Failed to create/update deal`);
      return null;
    }

    // Step 3: Move to initial stage
    await this.moveDealStage(deal.id, 'incoming_leads');

    // Log sync
    this.syncLog.syncs.push({
      timestamp: new Date().toISOString(),
      email: email,
      contact_id: contact.id,
      deal_id: deal.id,
      status: 'success',
      business: business
    });

    this.saveSyncLog();
    return deal;
  }

  async run() {
    console.log('\n📊 EMAIL TO KOMMO CRM INTEGRATION');
    console.log(`   Time: ${new Date().toISOString()}`);

    // Load email processing log
    try {
      const emailLog = JSON.parse(
        fs.readFileSync('data/massdwell/sales/email-processing-log.json', 'utf-8')
      );

      const newLeads = emailLog.emails.filter(e => 
        e.intent === 'SALES_LEAD' && 
        !this.syncLog.syncs.some(s => s.email === e.sender)
      );

      console.log(`   Found ${newLeads.length} new sales leads to sync`);
      console.log('');

      for (const lead of newLeads) {
        await this.processSalesLead({
          sender: lead.sender,
          subject: lead.subject,
          body: lead.body || ''
        });
      }

      console.log(`\n✅ Email to Kommo sync complete`);
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

if (require.main === module) {
  const sync = new EmailToKommoIntegration();
  sync.run().catch(console.error);
}

module.exports = { EmailToKommoIntegration };
