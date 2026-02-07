#!/usr/bin/env node
/**
 * Mission Control Event Bridge
 * 
 * Connects to OpenClaw's log stream and broadcasts events to Mission Control
 * via WebSocket for real-time dashboard updates.
 * 
 * Also provides HTTP API for direct event injection.
 */

const http = require('http');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');
const readline = require('readline');

const WS_PORT = 8083;
const HTTP_PORT = 8084;
const clients = new Set();

// HTTP Server for direct event injection
const httpServer = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        event.timestamp = event.timestamp || new Date().toISOString();
        broadcast(event);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        console.log('[Bridge] Event injected:', event.type, event.message?.substring(0, 50));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: clients.size }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`[Bridge] HTTP API listening on http://localhost:${HTTP_PORT}`);
  console.log(`[Bridge] POST /event to inject events`);
});

// Start WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('[Bridge] Client connected');
  clients.add(ws);
  
  // Send connection confirmation
  ws.send(JSON.stringify({ 
    type: 'connected', 
    timestamp: new Date().toISOString(),
    message: 'Mission Control Bridge connected'
  }));

  ws.on('close', () => {
    console.log('[Bridge] Client disconnected');
    clients.delete(ws);
  });
});

console.log(`[Bridge] WebSocket server listening on ws://localhost:${WS_PORT}`);

// Broadcast to all connected clients
function broadcast(event) {
  const message = JSON.stringify(event);
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Parse log line into structured event
function parseLogLine(line) {
  // Try to parse as structured log (ISO timestamp + level + message)
  const match = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(\w+)\s+(.*)$/);
  if (match) {
    const [, timestamp, level, rest] = match;
    
    // Detect event types from log content
    let eventType = 'log';
    let details = { raw: rest };
    
    // Tool execution
    if (rest.includes('tool:') || rest.includes('exec')) {
      eventType = 'tool';
      const toolMatch = rest.match(/tool[:\s]+(\w+)/i);
      if (toolMatch) details.tool = toolMatch[1];
    }
    
    // Agent activity
    if (rest.includes('agent') || rest.includes('session')) {
      eventType = 'agent';
    }
    
    // Message events
    if (rest.includes('message') || rest.includes('telegram') || rest.includes('whatsapp')) {
      eventType = 'message';
    }
    
    // Command events
    if (rest.includes('command') || rest.match(/\/(new|reset|stop|status)/)) {
      eventType = 'command';
    }
    
    return {
      type: eventType,
      level,
      timestamp,
      details,
      raw: line
    };
  }
  
  // Fallback for unparseable lines
  return {
    type: 'log',
    level: 'info',
    timestamp: new Date().toISOString(),
    details: { raw: line },
    raw: line
  };
}

// Start tailing OpenClaw logs
function startLogTail() {
  console.log('[Bridge] Starting log tail...');
  
  const logProcess = spawn('openclaw', ['logs', '--follow', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const rl = readline.createInterface({
    input: logProcess.stdout,
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    if (!line.trim()) return;
    
    try {
      // Try to parse as JSON first (--json flag)
      const jsonEvent = JSON.parse(line);
      broadcast({
        type: 'log',
        level: jsonEvent.level || 'info',
        timestamp: jsonEvent.timestamp || new Date().toISOString(),
        details: jsonEvent,
        raw: line
      });
    } catch {
      // Parse as plain text log
      const event = parseLogLine(line);
      if (event.level !== 'debug') { // Filter out debug noise
        broadcast(event);
      }
    }
  });

  logProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes('Log file:')) {
      console.log('[Bridge] stderr:', msg);
    }
  });

  logProcess.on('close', (code) => {
    console.log(`[Bridge] Log process exited with code ${code}`);
    // Restart after delay
    setTimeout(startLogTail, 5000);
  });

  logProcess.on('error', (err) => {
    console.error('[Bridge] Log process error:', err.message);
    setTimeout(startLogTail, 5000);
  });
}

// Also monitor exec tool calls more directly
function startExecMonitor() {
  // Watch for tool invocations by monitoring the session
  // This is a placeholder for deeper integration
  console.log('[Bridge] Exec monitor ready');
}

// Heartbeat to keep connections alive and show activity
setInterval(() => {
  broadcast({
    type: 'heartbeat',
    timestamp: new Date().toISOString(),
    clients: clients.size
  });
}, 30000);

// Start everything
startLogTail();
startExecMonitor();

console.log('[Bridge] Mission Control Event Bridge running');
console.log(`[Bridge] Connect Mission Control to ws://localhost:${WS_PORT}`);
