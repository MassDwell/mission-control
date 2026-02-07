const https = require('https');
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, '../../credentials/google/gmail-token.json');

function getToken() {
  return JSON.parse(fs.readFileSync(tokenPath, 'utf8')).access_token;
}

function apiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'https://gmail.googleapis.com');
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(data));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getMessageDetails(messageId) {
  const msg = await apiRequest(`/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
  const headers = msg.payload?.headers || [];
  
  const from = headers.find(h => h.name === 'From')?.value || '';
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  // Extract email from "Name <email>" format
  const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s]+@[^\s]+)/);
  const email = emailMatch ? emailMatch[1].toLowerCase() : from.toLowerCase();
  
  // Extract name
  const nameMatch = from.match(/^([^<]+)</);
  const name = nameMatch ? nameMatch[1].trim().replace(/"/g, '') : '';
  
  return {
    id: messageId,
    from,
    email,
    name,
    subject,
    date,
    snippet: msg.snippet,
    labelIds: msg.labelIds || []
  };
}

async function scanInbox(maxMessages = 500) {
  console.log(`Scanning up to ${maxMessages} messages...`);
  
  const allMessages = [];
  let pageToken = null;
  let fetched = 0;
  
  while (fetched < maxMessages) {
    const batchSize = Math.min(100, maxMessages - fetched);
    let url = `/gmail/v1/users/me/messages?maxResults=${batchSize}&q=in:inbox OR in:sent`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    
    const response = await apiRequest(url);
    if (!response.messages) break;
    
    allMessages.push(...response.messages);
    fetched += response.messages.length;
    pageToken = response.nextPageToken;
    
    console.log(`  Fetched ${fetched} message IDs...`);
    if (!pageToken) break;
  }
  
  console.log(`\nFetching details for ${allMessages.length} messages...`);
  
  const details = [];
  const uniqueEmails = new Map();
  
  // Process in batches of 10 to avoid rate limits
  for (let i = 0; i < allMessages.length; i += 10) {
    const batch = allMessages.slice(i, i + 10);
    const batchDetails = await Promise.all(batch.map(m => getMessageDetails(m.id).catch(e => null)));
    
    for (const msg of batchDetails) {
      if (!msg) continue;
      details.push(msg);
      
      // Track unique senders
      if (msg.email && !msg.email.includes('massdwell.com') && !msg.email.includes('noreply') && !msg.email.includes('mailer-daemon')) {
        if (!uniqueEmails.has(msg.email)) {
          uniqueEmails.set(msg.email, {
            email: msg.email,
            name: msg.name,
            firstSeen: msg.date,
            lastSeen: msg.date,
            messageCount: 1,
            subjects: [msg.subject]
          });
        } else {
          const existing = uniqueEmails.get(msg.email);
          existing.messageCount++;
          existing.lastSeen = msg.date;
          if (existing.subjects.length < 5) existing.subjects.push(msg.subject);
        }
      }
    }
    
    if ((i + 10) % 50 === 0) {
      console.log(`  Processed ${Math.min(i + 10, allMessages.length)}/${allMessages.length} messages...`);
    }
  }
  
  return {
    totalMessages: details.length,
    uniqueContacts: Array.from(uniqueEmails.values()).sort((a, b) => b.messageCount - a.messageCount),
    recentMessages: details.slice(0, 100)
  };
}

// Load Kommo leads and contacts for comparison
function loadKommoEmails() {
  const emails = new Set();
  
  // Load leads
  try {
    const leadsPath = path.join(__dirname, '../../crm-dashboard/data/leads.json');
    const data = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    const leads = data.leads || data;
    
    for (const lead of leads) {
      if (lead.email) emails.add(lead.email.toLowerCase());
      if (lead.contact_email) emails.add(lead.contact_email.toLowerCase());
      // Also check custom fields for emails
      if (lead.custom_fields_values) {
        for (const field of lead.custom_fields_values) {
          if (field.values) {
            for (const v of field.values) {
              if (v.value && typeof v.value === 'string' && v.value.includes('@')) {
                emails.add(v.value.toLowerCase());
              }
            }
          }
        }
      }
    }
    console.log(`  Loaded ${leads.length} leads`);
  } catch (e) {
    console.error('Could not load Kommo leads:', e.message);
  }
  
  // Load contacts
  try {
    const contactsPath = path.join(__dirname, '../../crm-dashboard/data/contacts.json');
    const data = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
    const contacts = data.contacts || data;
    
    for (const contact of contacts) {
      if (contact.custom_fields_values) {
        for (const field of contact.custom_fields_values) {
          if (field.field_code === 'EMAIL' && field.values) {
            for (const v of field.values) {
              if (v.value && typeof v.value === 'string' && v.value.includes('@')) {
                emails.add(v.value.toLowerCase());
              }
            }
          }
        }
      }
    }
    console.log(`  Loaded ${contacts.length} contacts`);
  } catch (e) {
    console.error('Could not load Kommo contacts:', e.message);
  }
  
  return emails;
}

async function main() {
  console.log('=== Gmail Inbox Scanner ===\n');
  
  const results = await scanInbox(500);
  console.log('\nLoading Kommo CRM data...');
  const kommoEmails = loadKommoEmails();
  
  console.log(`\n=== Results ===`);
  console.log(`Total messages scanned: ${results.totalMessages}`);
  console.log(`Unique external contacts: ${results.uniqueContacts.length}`);
  console.log(`Kommo leads loaded: ${kommoEmails.size}`);
  
  // Find contacts NOT in Kommo
  const notInKommo = results.uniqueContacts.filter(c => !kommoEmails.has(c.email));
  
  console.log(`\n=== Contacts NOT in Kommo CRM (${notInKommo.length}) ===\n`);
  
  // Filter to likely leads (not services, newsletters, etc)
  const likelyLeads = notInKommo.filter(c => {
    const email = c.email.toLowerCase();
    // Skip obvious non-leads
    if (email.includes('noreply') || email.includes('no-reply')) return false;
    if (email.includes('support@') || email.includes('info@')) return false;
    if (email.includes('notification') || email.includes('alert')) return false;
    if (email.includes('news') || email.includes('marketing')) return false;
    if (email.includes('google.com') || email.includes('microsoft.com')) return false;
    if (email.includes('squarespace') || email.includes('hubspot')) return false;
    if (email.includes('slack') || email.includes('zoom')) return false;
    if (email.includes('calendly') || email.includes('stripe')) return false;
    if (email.includes('docusign') || email.includes('intuit')) return false;
    return true;
  });
  
  console.log(`Filtered to ${likelyLeads.length} potential leads:\n`);
  
  for (const contact of likelyLeads.slice(0, 50)) {
    console.log(`📧 ${contact.name || '(no name)'} <${contact.email}>`);
    console.log(`   Messages: ${contact.messageCount} | Last: ${contact.lastSeen}`);
    console.log(`   Subject: ${contact.subjects[0] || '(none)'}`);
    console.log('');
  }
  
  // Save results
  const outputPath = path.join(__dirname, '../../data/massdwell/sales/gmail-scan-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    scanDate: new Date().toISOString(),
    totalMessages: results.totalMessages,
    uniqueContacts: results.uniqueContacts.length,
    notInKommo: notInKommo.length,
    likelyLeads: likelyLeads,
    recentMessages: results.recentMessages.slice(0, 50)
  }, null, 2));
  
  console.log(`\nResults saved to ${outputPath}`);
}

main().catch(e => console.error('Error:', e));
