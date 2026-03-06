#!/usr/bin/env node

/**
 * Email Prospecting Engine
 * Manages consultative email outreach for MassDwell and Atlantic Laser
 * 
 * Rules:
 * - 1 email per day per business (new prospect)
 * - If prospect replies, continue dialogue (no daily limit)
 * - Track BANT qualification (Budget, Authority, Need, Timeline)
 * - Auto-escalate when BANT complete
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const { canEmail } = require('./dnc-utils.js');
const TRACKING_FILE = '/Users/openclaw/.openclaw/workspace/data/massdwell/sales/email-prospecting-tracking.json';
const TEMPLATES_DIR = {
  massdwell: '/Users/openclaw/.openclaw/workspace/data/massdwell/sales/email-templates',
  atlantic: '/Users/openclaw/.openclaw/workspace/data/atlantic-laser/email-templates'
};

const CREDENTIALS = {
  massdwell: '/Users/openclaw/.openclaw/workspace/credentials/google/gmail-token-sales-fixed.json',
  atlantic: '/Users/openclaw/.openclaw/workspace/credentials/google/gmail-token-atlantic-laser.json'
};

const CONFIG = {
  massdwell: {
    email: 'sales@massdwell.com',
    sender_name: 'Nick Ferreira',
    phone: '617-555-0101',
    website: 'massdwell.com',
    daily_limit: 1
  },
  atlantic: {
    email: 'team@atlanticlasersolutions.com',
    sender_name: 'Steve Vettori',
    phone: '617-555-0102',
    website: 'atlanticlasersolutions.com',
    daily_limit: 1
  }
};

// Load tracking data
function loadTracking() {
  if (!fs.existsSync(TRACKING_FILE)) {
    return { massdwell: { conversations: [], last_send: null }, atlantic: { conversations: [], last_send: null } };
  }
  return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
}

// Save tracking data
function saveTracking(data) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
}

// Get today's date (YYYY-MM-DD)
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Check if we've already sent a new prospect email today
function canSendNewProspect(business) {
  const tracking = loadTracking();
  const data = tracking[business];
  return !data.last_send || data.last_send !== getTodayDate();
}

// Extract BANT from email response
function extractBantFromReply(emailBody) {
  const bant = {
    budget: null,
    authority: null,
    need: null,
    timeline: null
  };

  // Budget detection
  if (/(\$[\d,]+|\d{3,6}k)/i.test(emailBody)) {
    bant.budget = 'detected';
  }

  // Authority detection (decision maker indicators)
  if (/i\s(can|will|have)\s(make|approve|decide)/i.test(emailBody) || /owner|ceo|director|manager/i.test(emailBody)) {
    bant.authority = 'detected';
  }

  // Need detection (pain points, requirements)
  if (/need|problem|challenge|issue|improve|reduce|increase/i.test(emailBody)) {
    bant.need = 'detected';
  }

  // Timeline detection
  if (/next\s(week|month|quarter)|asap|urgent|immediately|before|after/i.test(emailBody)) {
    bant.timeline = 'detected';
  }

  return bant;
}

// Calculate BANT score
function calculateBantScore(bant) {
  const score = [bant.budget, bant.authority, bant.need, bant.timeline].filter(x => x).length;
  return `${score}/4`;
}

// Load email template
function loadTemplate(business, templateName) {
  const templatePath = path.join(TEMPLATES_DIR[business], templateName);
  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found: ${templatePath}`);
    return null;
  }
  return fs.readFileSync(templatePath, 'utf8');
}

// Replace template variables
function interpolateTemplate(template, variables) {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });
  return result;
}

// Send email via Gmail API
async function sendEmail(business, to, subject, body) {
  try {
    const credPath = CREDENTIALS[business];
    if (!fs.existsSync(credPath)) {
      console.error(`Credentials not found: ${credPath}`);
      return { success: false, error: 'Credentials missing' };
    }

    const token = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const gmail = google.gmail({ version: 'v1', auth: new google.auth.OAuth2() });
    
    // Set token
    gmail.auth.setCredentials(token);

    // Create message
    const message = `From: ${CONFIG[business].email}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/plain; charset="UTF-8"\n\n${body}`;
    const encodedMessage = Buffer.from(message).toString('base64');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`✅ Email sent to ${to} | Message ID: ${response.data.id}`);
    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Validate MassDwell address (required: street, city, state, zip)
function validateMasdwellAddress(prospect) {
  if (!prospect.address) {
    return { valid: false, error: 'Address object missing' };
  }
  
  const required = ['street', 'city', 'state', 'zip'];
  const missing = required.filter(field => !prospect.address[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing address fields: ${missing.join(', ')}` };
  }
  
  return { valid: true };
}

// Send initial contact email
async function sendInitialContact(business, prospect) {
  // DNC check — block before anything else
  if (!canEmail(prospect.email, prospect.name)) {
    return { success: false, error: 'On do-not-contact list' };
  }

  // For MassDwell, validate full address
  if (business === 'massdwell') {
    const addressCheck = validateMasdwellAddress(prospect);
    if (!addressCheck.valid) {
      console.error(`⚠️ Skipping prospect: ${addressCheck.error}`);
      return { success: false, error: addressCheck.error };
    }
  }

  const template = loadTemplate(business, '01-initial-contact-consultative.txt');
  if (!template) return { success: false };

  const variables = {
    first_name: prospect.name ? prospect.name.split(' ')[0] : 'there',
    property_address: prospect.address?.full || prospect.property_address || prospect.company || '',
    city: prospect.address?.city || prospect.city || prospect.region || '',
    company_name: prospect.company || '',
    region: prospect.region || '',
    sender_name: CONFIG[business].sender_name,
    phone: CONFIG[business].phone,
    website: CONFIG[business].website
  };

  const body = interpolateTemplate(template, variables);
  const subject = body.split('\n')[0].replace('Subject: ', '');

  const result = await sendEmail(business, prospect.email, subject, body.split('\n\n').slice(1).join('\n\n'));
  
  if (result.success) {
    // Update tracking
    const tracking = loadTracking();
    prospect.first_contact_sent = getTodayDate();
    prospect.last_email_sent = getTodayDate();
    prospect.emails_in_thread = 1;
    prospect.conversation_status = 'awaiting_reply';
    prospect.notes = 'Initial contact sent';
    
    tracking[business].conversations.push(prospect);
    tracking[business].last_send = getTodayDate();
    saveTracking(tracking);
  }

  return result;
}

// Check for replies and extract BANT
async function checkForReplies(business) {
  console.log(`\n📧 Checking for replies (${business})...`);
  // This would require Gmail API query for new messages
  // Implementation would monitor inbound emails for replies
  // For now, this is a placeholder
}

// Send follow-up with BANT discovery
async function sendFollowupDiscovery(business, prospect) {
  // DNC check
  if (!canEmail(prospect.email, prospect.name)) {
    return { success: false, error: 'On do-not-contact list' };
  }

  const template = loadTemplate(business, '02-follow-up-bant-discovery.txt');
  if (!template) return { success: false };

  const variables = {
    first_name: prospect.name ? prospect.name.split(' ')[0] : 'there',
    property_address: prospect.property_address || '',
    company_name: prospect.company || '',
    region: prospect.region || '',
    sender_name: CONFIG[business].sender_name
  };

  const body = interpolateTemplate(template, variables);
  const subject = body.split('\n')[0].replace('Subject: ', '');

  const result = await sendEmail(business, prospect.email, subject, body.split('\n\n').slice(1).join('\n\n'));

  if (result.success) {
    prospect.last_email_sent = getTodayDate();
    prospect.emails_in_thread += 1;
  }

  return result;
}

// Main function
async function main() {
  console.log('🚀 Email Prospecting Engine Started');
  console.log(`📅 Date: ${getTodayDate()}`);
  console.log('='.repeat(50));

  // Process each business
  for (const business of ['massdwell', 'atlantic']) {
    console.log(`\n🎯 Processing: ${business.toUpperCase()}`);
    console.log('-'.repeat(50));

    if (canSendNewProspect(business)) {
      console.log(`✅ Can send new prospect today`);
      // TODO: Fetch next prospect from database and send
      // TODO: For MassDwell: pull from Kommo CRM (stage 88661695)
      // TODO: For Atlantic Laser: pull from Pipedrive contacts
    } else {
      console.log(`⏭️ Already sent new prospect today. Check for replies instead.`);
    }

    // Check for replies
    await checkForReplies(business);
  }

  console.log('\n✅ Email Prospecting Engine Complete');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => console.error('Fatal error:', error));
}

module.exports = {
  sendEmail,
  sendInitialContact,
  sendFollowupDiscovery,
  loadTracking,
  saveTracking,
  canSendNewProspect,
  extractBantFromReply
};
