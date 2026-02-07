#!/usr/bin/env node
/**
 * Email-to-CRM Sync
 * 
 * Scans sent emails from sales@massdwell.com and steve.vettori@massdwell.com
 * Matches recipients against Kommo CRM contacts
 * Adds notes to matched leads
 * 
 * Usage: node scripts/email-to-crm-sync.js [--hours=6] [--dry-run]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Config
const ACCOUNTS = [
  'sales@massdwell.com',
  'steve.vettori@massdwell.com'
];
const HOURS_BACK = parseInt(process.argv.find(a => a.startsWith('--hours='))?.split('=')[1] || '6');
const DRY_RUN = process.argv.includes('--dry-run');
const LOG_FILE = path.join(__dirname, '../data/massdwell/sales/email-crm-sync-log.json');

// Kommo config
const KOMMO_SUBDOMAIN = 'massdwellcrm';
const KOMMO_TOKEN = process.env.KOMMO_TOKEN || require('../crm-dashboard/config.json')?.kommo?.accessToken;

async function main() {
  console.log(`📧 Email-to-CRM Sync`);
  console.log(`   Accounts: ${ACCOUNTS.join(', ')}`);
  console.log(`   Looking back: ${HOURS_BACK} hours`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log('');

  const allEmails = [];
  const since = new Date(Date.now() - HOURS_BACK * 60 * 60 * 1000);
  const sinceStr = since.toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Fetch sent emails from each account
  for (const account of ACCOUNTS) {
    console.log(`📤 Scanning sent mail: ${account}`);
    try {
      // Get MESSAGE list (not threads) - messages search returns message IDs that work with get
      const query = `in:sent after:${sinceStr}`;
      const searchResult = execSync(
        `gog gmail messages search "${query}" --account "${account}" --json --limit 50`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      const searchData = JSON.parse(searchResult || '{}');
      const messages = searchData.messages || [];
      console.log(`   Found ${messages.length} sent messages`);
      
      // Get full details for each message
      for (const msg of messages) {
        try {
          const msgResult = execSync(
            `gog gmail get "${msg.id}" --account "${account}" --json`,
            { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
          );
          
          const msgData = JSON.parse(msgResult || '{}');
          const headers = msgData.headers || {};
          const toHeader = headers.to || '';
          
          // Parse date and filter by actual time
          const msgDate = new Date(headers.date || msgData.message?.internalDate);
          if (msgDate < since) continue;
          
          // Extract recipient emails (exclude internal)
          const recipients = extractEmails(toHeader);
          
          if (recipients.length > 0) {
            allEmails.push({
              account,
              messageId: msg.id,
              date: headers.date || msg.date,
              subject: headers.subject || msg.subject || '(no subject)',
              recipients,
              snippet: (msgData.message?.snippet || '').substring(0, 200),
              from: headers.from || account
            });
          }
        } catch (msgErr) {
          // Skip individual message errors
        }
      }
      console.log(`   Processed ${allEmails.filter(e => e.account === account).length} emails with external recipients`);
    } catch (err) {
      console.log(`   ⚠️ Error scanning ${account}: ${err.message}`);
    }
  }

  console.log(`\n📊 Total emails to process: ${allEmails.length}`);
  
  if (allEmails.length === 0) {
    console.log('No new sent emails to external recipients found. Done.');
    return { processed: 0, matched: 0, notes_added: 0 };
  }

  // 2. Load CRM contacts for matching
  console.log('\n🔍 Loading CRM contacts...');
  const contacts = await loadKommoContacts();
  console.log(`   Loaded ${contacts.length} contacts`);
  
  // Build email -> contact map
  const emailToContact = {};
  for (const contact of contacts) {
    const emails = extractContactEmails(contact);
    for (const email of emails) {
      emailToContact[email.toLowerCase()] = contact;
    }
  }
  console.log(`   Indexed ${Object.keys(emailToContact).length} unique email addresses`);

  // 3. Match emails to contacts and add notes
  const results = {
    processed: allEmails.length,
    matched: 0,
    notes_added: 0,
    details: []
  };

  for (const email of allEmails) {
    for (const recipient of email.recipients) {
      const contact = emailToContact[recipient.toLowerCase()];
      if (contact) {
        results.matched++;
        console.log(`\n✅ Match: ${recipient}`);
        console.log(`   Contact: ${contact.name} (ID: ${contact.id})`);
        console.log(`   Subject: ${email.subject}`);
        
        // Find linked lead
        const leadId = contact._embedded?.leads?.[0]?.id;
        
        if (leadId && !DRY_RUN) {
          const sender = email.from.includes('steve') ? 'Steve' : 'Sales Team';
          const noteText = `📧 Email sent by ${sender}:\n` +
            `To: ${recipient}\n` +
            `Subject: ${email.subject}\n` +
            `Date: ${email.date}\n` +
            `---\n${email.snippet}...`;
          
          const success = await addKommoNote(leadId, noteText);
          if (success) {
            results.notes_added++;
            console.log(`   📝 Note added to lead ${leadId}`);
          }
        } else if (leadId && DRY_RUN) {
          console.log(`   [DRY RUN] Would add note to lead ${leadId}`);
          results.notes_added++; // Count for dry run
        } else {
          console.log(`   ⚠️ No linked lead found for contact`);
        }
        
        results.details.push({
          email: recipient,
          contact: contact.name,
          contactId: contact.id,
          leadId,
          subject: email.subject,
          date: email.date,
          account: email.account
        });
      }
    }
  }

  // 4. Log results
  console.log(`\n📊 Summary:`);
  console.log(`   Emails processed: ${results.processed}`);
  console.log(`   Contacts matched: ${results.matched}`);
  console.log(`   Notes added: ${results.notes_added}`);
  
  // Append to log file
  const logEntry = {
    timestamp: new Date().toISOString(),
    hoursBack: HOURS_BACK,
    dryRun: DRY_RUN,
    ...results
  };
  
  let log = [];
  try {
    log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (e) {}
  log.push(logEntry);
  
  // Keep last 100 entries
  if (log.length > 100) log = log.slice(-100);
  
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
  
  return results;
}

function extractEmails(str) {
  if (!str) return [];
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  return (str.match(emailRegex) || []).filter(e => {
    const lower = e.toLowerCase();
    return !lower.includes('massdwell.com') && 
           !lower.includes('gmail.com') &&
           !lower.includes('google.com') &&
           !lower.includes('googlemail.com');
  });
}

function extractContactEmails(contact) {
  const emails = [];
  if (contact.custom_fields_values) {
    for (const field of contact.custom_fields_values) {
      if (field.field_code === 'EMAIL' || field.field_name?.toLowerCase().includes('email')) {
        for (const val of field.values || []) {
          if (val.value) emails.push(val.value);
        }
      }
    }
  }
  return emails;
}

async function loadKommoContacts() {
  const allContacts = [];
  let page = 1;
  
  try {
    while (page <= 10) { // Max 10 pages (2500 contacts)
      const response = await fetch(
        `https://${KOMMO_SUBDOMAIN}.kommo.com/api/v4/contacts?with=leads&limit=250&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${KOMMO_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 204) break; // No more data
        throw new Error(`Kommo API error: ${response.status}`);
      }
      
      const data = await response.json();
      const contacts = data._embedded?.contacts || [];
      if (contacts.length === 0) break;
      
      allContacts.push(...contacts);
      page++;
      
      if (contacts.length < 250) break; // Last page
    }
  } catch (err) {
    console.error('Error loading contacts:', err.message);
  }
  
  return allContacts;
}

async function addKommoNote(leadId, text) {
  try {
    const response = await fetch(
      `https://${KOMMO_SUBDOMAIN}.kommo.com/api/v4/leads/${leadId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KOMMO_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          note_type: 'common',
          params: { text }
        }])
      }
    );
    
    if (!response.ok) {
      const err = await response.text();
      console.error(`   ⚠️ Kommo note error: ${response.status} - ${err}`);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error adding note:', err.message);
    return false;
  }
}

// Run
main()
  .then(results => {
    if (results.matched > 0) {
      console.log('\n✅ Sync complete!');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
