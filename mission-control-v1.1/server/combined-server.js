const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 8082;
const STATIC_DIR = path.join(__dirname, '..');

// MIME types
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// HTTP server for static files
const server = http.createServer((req, res) => {
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ok: true, clients: wss.clients.size}));
    return;
  }
  
  // Event injection endpoint
  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        broadcast(event);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ok: true}));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  // Static file serving
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type': MIME[ext] || 'text/plain'});
    res.end(data);
  });
});

// WebSocket server on same port
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[Combined] Client connected');
  ws.send(JSON.stringify({type: 'system', message: '🟢 Connected to Mission Control', timestamp: new Date().toISOString()}));
});

function broadcast(event) {
  const msg = JSON.stringify(event);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
  console.log('[Combined] Broadcast:', event.message || event.type);
}

server.listen(PORT, () => {
  console.log(`[Combined] Server running on http://localhost:${PORT}`);
  console.log(`[Combined] WebSocket on ws://localhost:${PORT}`);
});
