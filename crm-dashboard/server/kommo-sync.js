#!/usr/bin/env node
/**
 * Kommo CRM Sync Service
 * 
 * Pulls lead data from Kommo API (READ-ONLY) and stores locally.
 * This service NEVER modifies Kommo data.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration - loaded from environment or config file
const CONFIG_PATH = path.join(__dirname, '../config.json');
const DATA_DIR = path.join(__dirname, '../data');

let config = {
  kommo: {
    subdomain: null,      // e.g., 'massdwell'
    accessToken: null,    // Long-lived API token
    // OAuth alternative (if using OAuth flow)
    clientId: null,
    clientSecret: null,
    refreshToken: null
  }
};

// Load config if exists
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...config, ...saved };
      return true;
    }
  } catch (e) {
    console.error('[Sync] Failed to load config:', e.message);
  }
  return false;
}

// Save config
function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Make authenticated request to Kommo API
function kommoRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    if (!config.kommo.subdomain || !config.kommo.accessToken) {
      reject(new Error('Kommo not configured. Set subdomain and accessToken.'));
      return;
    }
    
    // Use subdomain for API calls
    const apiDomain = `${config.kommo.subdomain}.kommo.com`;
    
    const options = {
      hostname: apiDomain,
      path: `/api/v4/${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${config.kommo.accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data ? JSON.parse(data) : { ok: true });
          } else if (res.statusCode === 401) {
            reject(new Error('Unauthorized - check your access token'));
          } else {
            reject(new Error(`API error ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Log write operations to CRM action log
function logAction(action, details) {
  const logPath = path.join(DATA_DIR, '../../data/massdwell/sales/crm-action-log.json');
  let logs = [];
  try {
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
  } catch (e) {}
  
  logs.unshift({
    timestamp: new Date().toISOString(),
    action,
    ...details
  });
  
  logs = logs.slice(0, 500); // Keep last 500 actions
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

// ============ WRITE OPERATIONS (Two-Way Sync) ============

// Update a lead in Kommo
async function updateLead(leadId, updates) {
  console.log(`[Sync] Updating lead ${leadId} in Kommo...`);
  
  try {
    const result = await kommoRequest(`leads/${leadId}`, 'PATCH', updates);
    logAction('update_lead', { leadId, updates, status: 'success' });
    console.log(`[Sync] Lead ${leadId} updated successfully`);
    return result;
  } catch (e) {
    logAction('update_lead', { leadId, updates, status: 'error', error: e.message });
    console.error(`[Sync] Failed to update lead ${leadId}:`, e.message);
    throw e;
  }
}

// Move lead to different stage
async function moveLeadStage(leadId, statusId, pipelineId = null) {
  const updates = { status_id: statusId };
  if (pipelineId) updates.pipeline_id = pipelineId;
  return updateLead(leadId, updates);
}

// Add a note to a lead in Kommo
async function addNote(leadId, noteText) {
  console.log(`[Sync] Adding note to lead ${leadId} in Kommo...`);
  
  try {
    const result = await kommoRequest(`leads/${leadId}/notes`, 'POST', [{
      note_type: 'common',
      params: { text: noteText }
    }]);
    logAction('add_note', { leadId, noteText: noteText.substring(0, 100), status: 'success' });
    console.log(`[Sync] Note added to lead ${leadId}`);
    return result;
  } catch (e) {
    logAction('add_note', { leadId, status: 'error', error: e.message });
    console.error(`[Sync] Failed to add note to lead ${leadId}:`, e.message);
    throw e;
  }
}

// Create a task in Kommo
async function createTask(leadId, taskData) {
  console.log(`[Sync] Creating task for lead ${leadId} in Kommo...`);
  
  try {
    const task = {
      entity_id: leadId,
      entity_type: 'leads',
      text: taskData.text,
      complete_till: taskData.dueDate || Math.floor(Date.now() / 1000) + 86400, // Default: tomorrow
      task_type_id: taskData.taskTypeId || 1 // 1 = Follow-up
    };
    
    const result = await kommoRequest('tasks', 'POST', [task]);
    logAction('create_task', { leadId, text: taskData.text, status: 'success' });
    console.log(`[Sync] Task created for lead ${leadId}`);
    return result;
  } catch (e) {
    logAction('create_task', { leadId, status: 'error', error: e.message });
    console.error(`[Sync] Failed to create task for lead ${leadId}:`, e.message);
    throw e;
  }
}

// Export write functions for use by server
module.exports = {
  loadConfig,
  kommoRequest,
  updateLead,
  moveLeadStage,
  addNote,
  createTask,
  fullSync
};

// Fetch all leads from Kommo
async function fetchLeads() {
  console.log('[Sync] Fetching leads from Kommo...');
  
  const leads = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await kommoRequest(`leads?page=${page}&limit=250&with=contacts`);
      
      if (response._embedded && response._embedded.leads) {
        leads.push(...response._embedded.leads);
        console.log(`[Sync] Fetched page ${page}: ${response._embedded.leads.length} leads`);
        
        // Check if there are more pages
        if (response._embedded.leads.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error(`[Sync] Error fetching page ${page}:`, e.message);
      hasMore = false;
    }
  }
  
  return leads;
}

// Fetch pipeline stages from Kommo
async function fetchPipelines() {
  console.log('[Sync] Fetching pipelines from Kommo...');
  
  try {
    const response = await kommoRequest('leads/pipelines');
    return response._embedded?.pipelines || [];
  } catch (e) {
    console.error('[Sync] Error fetching pipelines:', e.message);
    return [];
  }
}

// Fetch contacts
async function fetchContacts() {
  console.log('[Sync] Fetching contacts from Kommo...');
  
  const contacts = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await kommoRequest(`contacts?page=${page}&limit=250`);
      
      if (response._embedded && response._embedded.contacts) {
        contacts.push(...response._embedded.contacts);
        console.log(`[Sync] Fetched page ${page}: ${response._embedded.contacts.length} contacts`);
        
        if (response._embedded.contacts.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error(`[Sync] Error fetching contacts page ${page}:`, e.message);
      hasMore = false;
    }
  }
  
  return contacts;
}

// Fetch notes for leads
async function fetchNotes() {
  console.log('[Sync] Fetching notes from Kommo...');
  
  const notes = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      // Fetch notes for leads entity
      const response = await kommoRequest(`leads/notes?page=${page}&limit=250`);
      
      if (response._embedded && response._embedded.notes) {
        notes.push(...response._embedded.notes);
        console.log(`[Sync] Fetched page ${page}: ${response._embedded.notes.length} notes`);
        
        if (response._embedded.notes.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error(`[Sync] Error fetching notes page ${page}:`, e.message);
      hasMore = false;
    }
  }
  
  return notes;
}

// Fetch events/activities
async function fetchEvents() {
  console.log('[Sync] Fetching events from Kommo...');
  
  const events = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await kommoRequest(`events?page=${page}&limit=250`);
      
      if (response._embedded && response._embedded.events) {
        events.push(...response._embedded.events);
        console.log(`[Sync] Fetched page ${page}: ${response._embedded.events.length} events`);
        
        if (response._embedded.events.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error(`[Sync] Error fetching events page ${page}:`, e.message);
      hasMore = false;
    }
  }
  
  return events;
}

// Full sync
async function fullSync() {
  console.log('[Sync] Starting full sync from Kommo...');
  const startTime = Date.now();
  
  try {
    // Fetch all data
    const [leads, pipelines, contacts, notes, events] = await Promise.all([
      fetchLeads(),
      fetchPipelines(),
      fetchContacts(),
      fetchNotes(),
      fetchEvents()
    ]);
    
    // Build contact map for quick lookup
    const contactMap = {};
    contacts.forEach(c => {
      contactMap[c.id] = {
        name: c.name,
        phone: c.custom_fields_values?.find(f => f.field_code === 'PHONE')?.values?.[0]?.value,
        email: c.custom_fields_values?.find(f => f.field_code === 'EMAIL')?.values?.[0]?.value
      };
    });
    
    // Group notes by lead ID
    const notesByLead = {};
    notes.forEach(n => {
      const leadId = n.entity_id;
      if (!notesByLead[leadId]) notesByLead[leadId] = [];
      notesByLead[leadId].push({
        id: n.id,
        text: n.params?.text || n.text || '',
        created_at: n.created_at,
        note_type: n.note_type
      });
    });
    
    // Enrich leads with contact info and notes
    const enrichedLeads = leads.map(lead => {
      // Get primary contact
      const contactIds = lead._embedded?.contacts?.map(c => c.id) || [];
      const primaryContact = contactIds.length > 0 ? contactMap[contactIds[0]] : null;
      
      return {
        ...lead,
        contact_name: primaryContact?.name || lead.name,
        contact_phone: primaryContact?.phone,
        contact_email: primaryContact?.email,
        kommo_notes: notesByLead[lead.id] || [],
        // Extract custom field values for easy access
        custom_fields: lead.custom_fields_values?.reduce((acc, f) => {
          acc[f.field_name] = f.values?.[0]?.value;
          return acc;
        }, {}) || {}
      };
    });
    
    // Save leads (enriched with contacts and notes)
    const leadsData = {
      syncedAt: new Date().toISOString(),
      source: 'kommo',
      subdomain: config.kommo.subdomain,
      totalLeads: enrichedLeads.length,
      leads: enrichedLeads
    };
    fs.writeFileSync(
      path.join(DATA_DIR, 'leads.json'),
      JSON.stringify(leadsData, null, 2)
    );
    
    // Save pipelines
    const pipelinesData = {
      syncedAt: new Date().toISOString(),
      pipelines: pipelines
    };
    fs.writeFileSync(
      path.join(DATA_DIR, 'kommo-pipelines.json'),
      JSON.stringify(pipelinesData, null, 2)
    );
    
    // Save contacts
    const contactsData = {
      syncedAt: new Date().toISOString(),
      totalContacts: contacts.length,
      contacts: contacts
    };
    fs.writeFileSync(
      path.join(DATA_DIR, 'contacts.json'),
      JSON.stringify(contactsData, null, 2)
    );
    
    // Save notes
    const notesData = {
      syncedAt: new Date().toISOString(),
      totalNotes: notes.length,
      notes: notes
    };
    fs.writeFileSync(
      path.join(DATA_DIR, 'kommo-notes.json'),
      JSON.stringify(notesData, null, 2)
    );
    
    // Save events
    const eventsData = {
      syncedAt: new Date().toISOString(),
      totalEvents: events.length,
      events: events
    };
    fs.writeFileSync(
      path.join(DATA_DIR, 'kommo-events.json'),
      JSON.stringify(eventsData, null, 2)
    );
    
    // Log sync
    const syncLog = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      leads: enrichedLeads.length,
      contacts: contacts.length,
      pipelines: pipelines.length,
      notes: notes.length,
      events: events.length,
      status: 'success'
    };
    
    // Append to sync log
    let logs = [];
    const logPath = path.join(DATA_DIR, 'sync-log.json');
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    logs.unshift(syncLog);
    logs = logs.slice(0, 100); // Keep last 100 syncs
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    
    console.log(`[Sync] Complete! ${enrichedLeads.length} leads, ${contacts.length} contacts, ${notes.length} notes, ${events.length} events in ${syncLog.duration}ms`);
    return syncLog;
    
  } catch (e) {
    console.error('[Sync] Failed:', e.message);
    return { status: 'error', error: e.message };
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'configure':
    loadConfig();
    config.kommo.subdomain = args[1] || config.kommo.subdomain;
    config.kommo.accessToken = args[2] || config.kommo.accessToken;
    saveConfig();
    console.log('[Sync] Configuration saved');
    console.log(`  Subdomain: ${config.kommo.subdomain || '(not set)'}`);
    console.log(`  Token: ${config.kommo.accessToken ? '****' + config.kommo.accessToken.slice(-4) : '(not set)'}`);
    break;
    
  case 'sync':
    loadConfig();
    fullSync().then(result => {
      process.exit(result.status === 'success' ? 0 : 1);
    });
    break;
    
  case 'test':
    loadConfig();
    console.log('[Sync] Testing Kommo connection...');
    kommoRequest('account').then(account => {
      console.log('[Sync] Connected successfully!');
      console.log(`  Account: ${account.name}`);
      console.log(`  ID: ${account.id}`);
    }).catch(e => {
      console.error('[Sync] Connection failed:', e.message);
      process.exit(1);
    });
    break;
    
  default:
    console.log('Kommo Sync Service');
    console.log('');
    console.log('Usage:');
    console.log('  node kommo-sync.js configure <subdomain> <access_token>');
    console.log('  node kommo-sync.js test');
    console.log('  node kommo-sync.js sync');
    console.log('');
    console.log('Example:');
    console.log('  node kommo-sync.js configure massdwell abc123xyz...');
}
