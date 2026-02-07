#!/usr/bin/env node
/**
 * CRM Dashboard Server
 * 
 * Serves the CRM dashboard and provides APIs for data access.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import Kommo sync functions for two-way sync
let kommoSync = null;
try {
  kommoSync = require('./kommo-sync.js');
  kommoSync.loadConfig();
  console.log('[Server] Kommo two-way sync enabled');
} catch (e) {
  console.log('[Server] Kommo sync module not loaded:', e.message);
}

const PORT = 8085;
const PUBLIC_DIR = path.join(__dirname, '../public');
const DATA_DIR = path.join(__dirname, '../data');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

// Read JSON file safely
function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
  }
  return null;
}

// Write JSON file
function writeJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// API handlers
const api = {
  // GET /api/leads - Get all leads
  'GET /api/leads': () => {
    return readJSON('leads.json') || { syncedAt: null, leads: [] };
  },
  
  // GET /api/pipelines - Get pipeline stages
  'GET /api/pipelines': () => {
    return readJSON('kommo-pipelines.json') || { pipelines: [] };
  },
  
  // GET /api/contacts - Get all contacts
  'GET /api/contacts': () => {
    return readJSON('contacts.json') || { contacts: [] };
  },
  
  // GET /api/pipelines - Get Kommo pipelines
  'GET /api/pipelines': () => {
    return readJSON('kommo-pipelines.json') || { pipelines: [] };
  },
  
  // GET /api/contacts - Get contacts
  'GET /api/contacts': () => {
    return readJSON('contacts.json') || { contacts: [] };
  },
  
  // GET /api/notes - Get all notes
  'GET /api/notes': () => {
    return readJSON('notes.json') || { notes: {} };
  },
  
  // POST /api/notes - Save a note
  'POST /api/notes': async (req) => {
    const body = await parseBody(req);
    const notes = readJSON('notes.json') || { notes: {} };
    notes.notes[body.leadId] = body.note;
    writeJSON('notes.json', notes);
    return { ok: true };
  },
  
  // GET /api/pipeline - Get pipeline config
  'GET /api/pipeline': () => {
    return readJSON('pipeline.json') || { stages: [], assignments: {} };
  },
  
  // POST /api/pipeline - Update pipeline assignments
  'POST /api/pipeline': async (req) => {
    const body = await parseBody(req);
    // Update leads with new stage assignments
    const leads = readJSON('leads.json') || { leads: [] };
    if (body.leads) {
      leads.leads = body.leads;
      writeJSON('leads.json', leads);
    }
    return { ok: true };
  },
  
  // POST /api/sync - Trigger Kommo sync
  'POST /api/sync': () => {
    try {
      execSync('node kommo-sync.js sync', { 
        cwd: __dirname,
        timeout: 30000 
      });
      return { status: 'success' };
    } catch (e) {
      return { status: 'error', error: e.message };
    }
  },
  
  // GET /api/status - Check Kommo connection status
  'GET /api/status': () => {
    const config = readJSON('../config.json');
    return {
      configured: !!(config?.kommo?.subdomain && config?.kommo?.accessToken),
      subdomain: config?.kommo?.subdomain || null,
      twoWaySync: !!kommoSync
    };
  },
  
  // ============ TWO-WAY SYNC ENDPOINTS ============
  
  // PATCH /api/leads/:id - Update a lead (syncs to Kommo)
  'PATCH /api/leads': async (req, url) => {
    const leadId = url.searchParams.get('id');
    if (!leadId) throw new Error('Lead ID required');
    
    const body = await parseBody(req);
    
    // Update local first
    const leads = readJSON('leads.json') || { leads: [] };
    const leadIndex = leads.leads.findIndex(l => l.id == leadId);
    if (leadIndex >= 0) {
      leads.leads[leadIndex] = { ...leads.leads[leadIndex], ...body };
      writeJSON('leads.json', leads);
    }
    
    // Sync to Kommo if enabled
    if (kommoSync) {
      try {
        await kommoSync.updateLead(leadId, body);
        return { ok: true, synced: true };
      } catch (e) {
        return { ok: true, synced: false, error: e.message };
      }
    }
    
    return { ok: true, synced: false };
  },
  
  // POST /api/leads/:id/stage - Move lead to new stage (syncs to Kommo)
  'POST /api/leads/stage': async (req) => {
    const body = await parseBody(req);
    const { leadId, statusId, pipelineId } = body;
    
    if (!leadId || !statusId) throw new Error('leadId and statusId required');
    
    // Update local
    const leads = readJSON('leads.json') || { leads: [] };
    const leadIndex = leads.leads.findIndex(l => l.id == leadId);
    if (leadIndex >= 0) {
      leads.leads[leadIndex].status_id = statusId;
      if (pipelineId) leads.leads[leadIndex].pipeline_id = pipelineId;
      writeJSON('leads.json', leads);
    }
    
    // Sync to Kommo
    if (kommoSync) {
      try {
        await kommoSync.moveLeadStage(leadId, statusId, pipelineId);
        return { ok: true, synced: true };
      } catch (e) {
        return { ok: true, synced: false, error: e.message };
      }
    }
    
    return { ok: true, synced: false };
  },
  
  // POST /api/leads/:id/note - Add note to lead (syncs to Kommo)
  'POST /api/leads/note': async (req) => {
    const body = await parseBody(req);
    const { leadId, note } = body;
    
    if (!leadId || !note) throw new Error('leadId and note required');
    
    // Save locally
    const notes = readJSON('notes.json') || { notes: {} };
    if (!notes.notes[leadId]) notes.notes[leadId] = [];
    notes.notes[leadId].push({
      text: note,
      timestamp: new Date().toISOString(),
      source: 'dashboard'
    });
    writeJSON('notes.json', notes);
    
    // Sync to Kommo
    if (kommoSync) {
      try {
        await kommoSync.addNote(leadId, note);
        return { ok: true, synced: true };
      } catch (e) {
        return { ok: true, synced: false, error: e.message };
      }
    }
    
    return { ok: true, synced: false };
  },
  
  // POST /api/leads/:id/task - Create task for lead (syncs to Kommo)
  'POST /api/leads/task': async (req) => {
    const body = await parseBody(req);
    const { leadId, text, dueDate } = body;
    
    if (!leadId || !text) throw new Error('leadId and text required');
    
    // Sync to Kommo
    if (kommoSync) {
      try {
        await kommoSync.createTask(leadId, { text, dueDate });
        return { ok: true, synced: true };
      } catch (e) {
        return { ok: true, synced: false, error: e.message };
      }
    }
    
    return { ok: false, error: 'Kommo sync not configured' };
  }
};

// Create server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // API routes
  const apiKey = `${req.method} ${url.pathname}`;
  if (api[apiKey]) {
    try {
      const result = await api[apiKey](req, url);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  // Handle PATCH requests for leads
  if (req.method === 'PATCH' && url.pathname.startsWith('/api/leads')) {
    try {
      const result = await api['PATCH /api/leads'](req, url);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  // Static files
  let filepath = url.pathname === '/' ? '/index.html' : url.pathname;
  filepath = path.join(PUBLIC_DIR, filepath);
  
  const ext = path.extname(filepath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  try {
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (e) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`\n🏠 MassDwell CRM Dashboard`);
  console.log(`   Running at http://localhost:${PORT}`);
  console.log(`\n📂 Data directory: ${DATA_DIR}`);
  console.log(`\n🔗 To connect Kommo:`);
  console.log(`   node kommo-sync.js configure <subdomain> <access_token>`);
  console.log(`   node kommo-sync.js test`);
  console.log(`   node kommo-sync.js sync\n`);
});
