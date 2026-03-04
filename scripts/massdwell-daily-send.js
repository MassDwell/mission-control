#!/usr/bin/env node

/**
 * MassDwell Daily Email Send
 * Runs at 9 AM EST every weekday
 * 
 * Logic:
 * 1. Load prospects cache (from Kommo query)
 * 2. Load tracking (already contacted)
 * 3. Find next unsent prospect (highest priority + value)
 * 4. Check address is complete
 * 5. Send initial contact email
 * 6. Update tracking
 * 7. Log results
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROSPECTS_CACHE = '/Users/openclaw/.openclaw/workspace/data/massdwell/sales/kommo-prospects-cache.json';
const TRACKING_FILE = '/Users/openclaw/.openclaw/workspace/data/massdwell/sales/email-prospecting-tracking.json';
const TEMPLATES_DIR = '/Users/openclaw/.openclaw/workspace/data/massdwell/sales/email-templates';
const GMAIL_CREDS = '/Users/openclaw/.openclaw/workspace/credentials/google/gmail-token-sales-fixed.json';
const DNC_LIST = '/Users/openclaw/.openclaw/workspace/data/massdwell/sales/do-not-contact-list.json';

const CONFIG = {
  email: 'sales@massdwell.com',
  sender_name: 'Nick Ferreira',
  phone: '617-555-0101',
  website: 'massdwell.com'
};

// Load JSON files
function loadJSON(path) {
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

// Save JSON files
function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Get today's date (YYYY-MM-DD)
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Load template
function loadTemplate(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, 'utf8');
}

// Interpolate template variables
function interpolateTemplate(template, variables) {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });
  return result;
}

// Send email via Gmail
async function sendEmail(to, subject, body) {
  try {
    if (!fs.existsSync(GMAIL_CREDS)) {
      throw new Error(`Gmail credentials not found: ${GMAIL_CREDS}`);
    }

    const token = JSON.parse(fs.readFileSync(GMAIL_CREDS, 'utf8'));
    const gmail = google.gmail({ version: 'v1', auth: new google.auth.OAuth2() });

    gmail.auth.setCredentials(token);

    const message = `From: ${CONFIG.email}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/plain; charset="UTF-8"\n\n${body}`;
    const encodedMessage = Buffer.from(message).toString('base64');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error(`Email send error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Load DNC list
function loadDNCList() {
  try {
    if (!fs.existsSync(DNC_LIST)) return [];
    const data = loadJSON(DNC_LIST);
    return data.contacts.map(c => c.email.toLowerCase()) || [];
  } catch (e) {
    console.warn('⚠️  Could not load DNC list');
    return [];
  }
}

// Check if prospect is on DNC list
function isOnDNC(email, dncList) {
  return dncList.includes(email.toLowerCase());
}

// Get next prospect to email
function getNextProspect(prospects, tracking) {
  const contacted = new Set(tracking.massdwell.conversations.map(c => c.prospect_id));
  const dncList = loadDNCList();
  
  const available = prospects.filter(p => {
    if (contacted.has(p.prospect_id)) return false;
    if (isOnDNC(p.email, dncList)) {
      console.log(`⏭️  SKIPPING ${p.email} - on do-not-contact list`);
      return false;
    }
    return true;
  });

  if (available.length === 0) {
    return null;
  }

  // Sort by stage priority (lower = higher), then by value (higher = higher)
  available.sort((a, b) => {
    if (a.stage_priority !== b.stage_priority) {
      return a.stage_priority - b.stage_priority;
    }
    return b.value - a.value;
  });

  return available[0];
}

// Validate MassDwell address
function validateAddress(prospect) {
  if (!prospect.address) return false;
  return !!(prospect.address.street && prospect.address.city && prospect.address.state && prospect.address.zip);
}

// Main send function
async function dailySend() {
  console.log('🚀 MassDwell Daily Email Send');
  console.log(`📅 Date: ${getTodayDate()}`);
  console.log('='.repeat(60));

  try {
    // Load prospects cache
    const cache = loadJSON(PROSPECTS_CACHE);
    if (!cache || cache.leads.length === 0) {
      console.log('⚠️  No prospects cache found. Run massdwell-kommo-prospector.js first.');
      return { success: false, error: 'No prospects cache' };
    }

    console.log(`📊 Loaded ${cache.leads.length} prospects from cache`);

    // Load tracking
    const tracking = loadJSON(TRACKING_FILE) || { massdwell: { conversations: [], last_send: null }, atlantic_laser: { conversations: [], last_send: null } };

    // Check if already sent today
    if (tracking.massdwell.last_send === getTodayDate()) {
      console.log('✅ Already sent new prospect email today. Checking for replies instead.');
      return { success: true, message: 'Already sent today', sent: false };
    }

    // Get next prospect
    const prospect = getNextProspect(cache.leads, tracking);
    if (!prospect) {
      console.log('⚠️  No available prospects to email.');
      return { success: false, error: 'No available prospects' };
    }

    console.log(`\n🎯 Next prospect: ${prospect.name} (${prospect.email})`);
    console.log(`   Stage: ${prospect.stage_name}`);
    console.log(`   Value: $${prospect.value.toLocaleString()}`);
    console.log(`   Address: ${prospect.address.full}`);

    // Validate address
    if (!validateAddress(prospect)) {
      console.log('❌ Address validation failed. Skipping.');
      return { success: false, error: 'Invalid address' };
    }

    // Load and interpolate template
    const template = loadTemplate('01-initial-contact-consultative.txt');
    const variables = {
      first_name: prospect.first_name || 'there',
      property_address: prospect.address.full,
      city: prospect.address.city,
      sender_name: CONFIG.sender_name,
      phone: CONFIG.phone,
      website: CONFIG.website
    };

    const body = interpolateTemplate(template, variables);
    const subject = body.split('\n')[0].replace('Subject: ', '');
    const emailBody = body.split('\n\n').slice(1).join('\n\n');

    console.log(`\n📧 Sending email to ${prospect.email}...`);

    // Send email
    const sendResult = await sendEmail(prospect.email, subject, emailBody);
    if (!sendResult.success) {
      console.log(`❌ Email send failed: ${sendResult.error}`);
      return { success: false, error: sendResult.error };
    }

    console.log(`✅ Email sent successfully`);
    console.log(`   Message ID: ${sendResult.messageId}`);

    // Update tracking
    const conversation = {
      prospect_id: prospect.prospect_id,
      kommo_id: prospect.kommo_id,
      stage_name: prospect.stage_name,
      email: prospect.email,
      name: prospect.name,
      first_name: prospect.first_name,
      address: prospect.address,
      first_contact_sent: getTodayDate(),
      last_email_sent: getTodayDate(),
      emails_in_thread: 1,
      has_replied: false,
      reply_received: null,
      bant: {
        budget: null,
        authority: null,
        need: null,
        timeline: null,
        score: '0/4'
      },
      conversation_status: 'awaiting_reply',
      notes: 'Initial contact sent',
      message_id: sendResult.messageId
    };

    tracking.massdwell.conversations.push(conversation);
    tracking.massdwell.last_send = getTodayDate();
    saveJSON(TRACKING_FILE, tracking);

    console.log('\n✅ SEND COMPLETE');
    console.log(`   Prospects contacted: ${tracking.massdwell.conversations.length}`);
    console.log(`   Prospects remaining: ${cache.leads.length - tracking.massdwell.conversations.length}`);

    return { success: true, sent: true, prospect: prospect.name };
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run if executed directly
if (require.main === module) {
  dailySend()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  dailySend,
  getNextProspect,
  validateAddress
};
