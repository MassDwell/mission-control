const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.SALES_DASHBOARD_PORT || 8086;
const PASSWORD = process.env.SALES_DASHBOARD_PASSWORD || 'massdwell2026';
const CRM_DATA = path.join(__dirname, '..', 'crm-dashboard', 'data', 'leads.json');
const CONTACTS_DATA = path.join(__dirname, '..', 'crm-dashboard', 'data', 'contacts.json');

// User IDs for Nick Ferreira and Jon Proctor (and unassigned = 0 or null)
const TEAM_USER_IDS = [10326083, 13311811, 0, null];

// Pipeline status mapping
const STATUS_MAP = {
  86738623: { name: 'Incoming Leads', order: 1, group: 'incoming' },
  88661695: { name: 'Incoming Leads', order: 1, group: 'incoming' },
  94100935: { name: 'Welcome Email Sent', order: 2, group: 'outreach' },
  86738631: { name: 'Follow-up 1', order: 3, group: 'outreach' },
  86738627: { name: 'Recycle Follow-up', order: 4, group: 'outreach' },
  86738635: { name: 'Conversation Started', order: 5, group: 'engaged' },
  89929427: { name: 'Site Feasibility Booked', order: 6, group: 'qualified' },
  86738823: { name: 'Site Feasibility Completed', order: 7, group: 'qualified' },
  88076707: { name: 'Negotiation', order: 8, group: 'negotiation' },
  89929311: { name: 'Contract Signed', order: 9, group: 'won' },
  93011343: { name: 'Future Contact', order: 10, group: 'nurture' },
  97920535: { name: 'Recap Emails', order: 11, group: 'nurture' },
  142: { name: 'Closed Won', order: 100, group: 'won' },
  143: { name: 'Closed Lost', order: 101, group: 'lost' }
};

// Load contacts for phone/email lookup
let contactsMap = {};
function loadContacts() {
  try {
    const data = JSON.parse(fs.readFileSync(CONTACTS_DATA, 'utf8'));
    data.contacts.forEach(c => {
      const email = c.custom_fields_values?.find(f => f.field_code === 'EMAIL')?.values?.[0]?.value || '';
      const phone = c.custom_fields_values?.find(f => f.field_code === 'PHONE')?.values?.[0]?.value || '';
      contactsMap[c.id] = { email, phone, name: c.name };
    });
  } catch (e) {
    console.error('Could not load contacts:', e.message);
  }
}
loadContacts();

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Auth check
  if (req.url === '/api/auth') {
    const body = await parseBody(req);
    if (body.password === PASSWORD) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    }
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'Invalid password' }));
  }

  // API: Get leads
  if (req.url.startsWith('/api/leads')) {
    try {
      const data = JSON.parse(fs.readFileSync(CRM_DATA, 'utf8'));
      
      const leads = data.leads
        .filter(l => !l.is_deleted)
        .filter(l => TEAM_USER_IDS.includes(l.responsible_user_id) || l.responsible_user_id === undefined)
        .map(l => {
          const statusInfo = STATUS_MAP[l.status_id] || { name: 'Unknown', order: 0, group: 'unknown' };
          const createdDate = new Date(l.created_at * 1000);
          const updatedDate = new Date(l.updated_at * 1000);
          const now = new Date();
          const daysInStage = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
          
          // Get location from custom fields
          const location = l.fields?.Location || l.custom_fields?.Location || '';
          
          // Get latest note
          const latestNote = l.notes?.length ? l.notes.sort((a, b) => b.created_at - a.created_at)[0] : null;
          const lastActivity = latestNote?.text || (l.updated_at ? `Updated ${daysInStage} days ago` : 'No activity');
          
          // Determine temperature based on stage and recency
          let temperature = 'cold';
          if (['negotiation', 'qualified', 'won'].includes(statusInfo.group)) {
            temperature = 'hot';
          } else if (['engaged', 'outreach'].includes(statusInfo.group) && daysInStage < 7) {
            temperature = 'warm';
          } else if (statusInfo.group === 'incoming' && daysInStage < 3) {
            temperature = 'warm';
          }
          
          // Get owner name
          const ownerName = l.responsible_user_id === 10326083 ? 'Nick Ferreira' : 
                           l.responsible_user_id === 13311811 ? 'Jon Proctor' : 'Unassigned';

          return {
            id: l.id,
            name: l.name || l.contact_name || 'Unknown',
            email: l.fields?.Email || '',
            phone: l.fields?.Phone || '',
            location: location,
            value: l.price || 0,
            stage: statusInfo.name,
            stageGroup: statusInfo.group,
            stageOrder: statusInfo.order,
            stageColor: STATUS_MAP[l.status_id]?.color || '#999',
            temperature,
            daysInStage,
            lastActivity: lastActivity?.substring(0, 100) || '',
            createdAt: createdDate.toISOString(),
            updatedAt: updatedDate.toISOString(),
            owner: ownerName,
            ownerId: l.responsible_user_id,
            tags: l._embedded?.tags?.map(t => t.name) || [],
            typeScope: l.fields?.['Type and Scope'] || '',
            notes: l.notes?.slice(0, 5).map(n => ({
              text: n.text,
              date: new Date(n.created_at * 1000).toISOString()
            })) || []
          };
        })
        .filter(l => l.stageGroup !== 'lost'); // Hide closed lost by default

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(leads));
    } catch (err) {
      console.error('Error reading leads:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to load leads' }));
    }
  }

  // API: Get pipeline stats
  if (req.url === '/api/stats') {
    try {
      const data = JSON.parse(fs.readFileSync(CRM_DATA, 'utf8'));
      const now = new Date();
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      
      let stats = {
        total: 0,
        hot: 0,
        warm: 0,
        followUpsThisWeek: 0,
        pipelineValue: 0,
        closedWon: 0,
        byStage: {}
      };
      
      data.leads.forEach(l => {
        if (l.is_deleted) return;
        if (!TEAM_USER_IDS.includes(l.responsible_user_id) && l.responsible_user_id !== undefined) return;
        
        const statusInfo = STATUS_MAP[l.status_id] || { group: 'unknown' };
        if (statusInfo.group === 'lost') return;
        
        stats.total++;
        const updatedDate = new Date(l.updated_at * 1000);
        const daysInStage = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
        
        // Count hot/warm
        if (['negotiation', 'qualified', 'won'].includes(statusInfo.group)) {
          stats.hot++;
        } else if (daysInStage < 7 && ['engaged', 'outreach', 'incoming'].includes(statusInfo.group)) {
          stats.warm++;
        }
        
        // Follow-ups needed this week
        if (['outreach', 'engaged'].includes(statusInfo.group) && daysInStage >= 3) {
          stats.followUpsThisWeek++;
        }
        
        // Pipeline value (exclude closed)
        if (statusInfo.group !== 'won' && statusInfo.group !== 'lost') {
          stats.pipelineValue += l.price || 0;
        }
        
        // Closed won
        if (l.status_id === 142) {
          stats.closedWon++;
        }
        
        // By stage
        const stageName = statusInfo.name;
        stats.byStage[stageName] = (stats.byStage[stageName] || 0) + 1;
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(stats));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to load stats' }));
    }
  }

  // Static files
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  filePath = path.join(__dirname, filePath);

  const extname = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(500);
      return res.end('Server error');
    }
    res.writeHead(200, { 'Content-Type': contentTypes[extname] || 'text/plain' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 MassDwell Team Sales Dashboard`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n   Password: ${PASSWORD}`);
  console.log(`   For: Nick Ferreira & Jon Proctor`);
});
