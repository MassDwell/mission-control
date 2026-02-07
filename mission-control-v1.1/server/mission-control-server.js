#!/usr/bin/env node
/**
 * Mission Control Server v1.1
 * 
 * Real-time dashboard server that connects to OpenClaw's data sources:
 * - Subagent runs: ~/.openclaw/subagents/runs.json
 * - Agent sessions: ~/.openclaw/agents/{agent}/sessions/sessions.json
 * - Agent roster: openclaw agents list --json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { execSync, spawn } = require('child_process');

const PORT = process.env.MC_PORT || process.env.PORT || 8088;
const STATIC_DIR = path.join(__dirname, '..');
const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');
const SUBAGENTS_FILE = path.join(OPENCLAW_DIR, 'subagents', 'runs.json');
const POLL_INTERVAL = 2000; // 2 seconds

// MIME types for static files
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// State tracking
let lastSubagentData = null;
let lastAgentSessions = {};
let activityLog = [];

// Get list of registered agents
function getAgents() {
  try {
    const output = execSync('openclaw agents list --json', { encoding: 'utf8', timeout: 5000 });
    return JSON.parse(output);
  } catch (e) {
    console.error('[MC] Failed to get agents:', e.message);
    return [];
  }
}

// Read subagent runs
function getSubagentRuns() {
  try {
    if (!fs.existsSync(SUBAGENTS_FILE)) return { runs: {} };
    const data = fs.readFileSync(SUBAGENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('[MC] Failed to read subagent runs:', e.message);
    return { runs: {} };
  }
}

// Read agent session data
function getAgentSessions(agentId) {
  const sessionsFile = path.join(OPENCLAW_DIR, 'agents', agentId, 'sessions', 'sessions.json');
  try {
    if (!fs.existsSync(sessionsFile)) return { sessions: [] };
    const data = fs.readFileSync(sessionsFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { sessions: [] };
  }
}

// Build full state snapshot
function buildStateSnapshot() {
  const agents = getAgents();
  const subagentData = getSubagentRuns();
  const runs = subagentData.runs || {};
  
  // Map runs by agent
  const runsByAgent = {};
  const activeRuns = [];
  
  Object.values(runs).forEach(run => {
    // Extract agent ID from childSessionKey: "agent:chief_of_staff:subagent:uuid"
    const match = run.childSessionKey?.match(/^agent:([^:]+):/);
    if (match) {
      const agentId = match[1];
      if (!runsByAgent[agentId]) runsByAgent[agentId] = [];
      runsByAgent[agentId].push(run);
      activeRuns.push({
        ...run,
        agentId,
        isActive: !run.completedAt,
        durationMs: run.completedAt ? (run.completedAt - run.startedAt) : (Date.now() - run.startedAt)
      });
    }
  });
  
  // Build agent status
  const agentStatus = agents.map(agent => {
    const agentRuns = runsByAgent[agent.id] || [];
    const sessions = getAgentSessions(agent.id);
    
    // Count tasks
    const activeTasks = agentRuns.filter(r => !r.completedAt).length;
    const completedTasks = agentRuns.filter(r => r.completedAt).length;
    
    // Get most recent session
    const recentSession = sessions.sessions?.[0];
    const lastActivity = recentSession?.updatedAt ? new Date(recentSession.updatedAt).toISOString() : null;
    
    // Build current task object for display
    let currentTask = null;
    if (activeTasks > 0) {
      const activeRun = agentRuns.find(r => !r.completedAt);
      if (activeRun) {
        currentTask = {
          title: activeRun.label || activeRun.task?.substring(0, 50) || 'Task in progress',
          entity: 'global',
          progress: Math.min(95, Math.floor((Date.now() - activeRun.startedAt) / 60000) * 10)
        };
      }
    }
    
    return {
      id: agent.id,
      name: agent.identityName || agent.name || agent.id,
      model: agent.model,
      workspace: agent.workspace,
      status: activeTasks > 0 ? 'working' : 'idle',
      currentTask,
      stats: {
        completed: completedTasks,
        inProgress: activeTasks,
        queued: 0 // Could track pending tasks if needed
      },
      lastActivity,
      totalTokens: recentSession?.totalTokens || 0
    };
  });
  
  // Pipeline counts
  const pipeline = {
    incoming: 0,
    routing: 0,
    in_progress: activeRuns.filter(r => !r.completedAt).length,
    review: 0,
    complete: activeRuns.filter(r => r.completedAt).length
  };
  
  // Global stats
  const stats = {
    agentsActive: agentStatus.filter(a => a.status === 'working').length,
    tasksInProgress: pipeline.in_progress,
    queueDepth: 0,
    completedToday: pipeline.complete
  };
  
  // Tasks for the table
  const tasks = activeRuns.map(run => ({
    id: run.runId,
    title: run.label || 'Subagent Task',
    description: run.task?.substring(0, 100) + '...',
    agentId: run.agentId,
    entity: 'global',
    status: run.completedAt ? 'complete' : 'in_progress',
    progress: run.completedAt ? 100 : Math.min(95, Math.floor((Date.now() - run.startedAt) / 60000) * 10),
    startedAt: new Date(run.startedAt).toLocaleTimeString()
  }));
  
  return {
    agents: agentStatus,
    tasks,
    pipeline,
    stats,
    runs: activeRuns
  };
}

// Detect changes and generate activity events
function detectChanges(newState) {
  const events = [];
  const now = new Date().toISOString();
  
  // Check for new/changed subagent runs
  const subagentData = getSubagentRuns();
  const runs = subagentData.runs || {};
  
  if (lastSubagentData) {
    const lastRuns = lastSubagentData.runs || {};
    
    // New runs
    Object.keys(runs).forEach(runId => {
      if (!lastRuns[runId]) {
        const run = runs[runId];
        const match = run.childSessionKey?.match(/^agent:([^:]+):/);
        const agentId = match ? match[1] : 'unknown';
        events.push({
          type: 'agent',
          icon: '🚀',
          message: `Subagent spawned: ${run.label || agentId}`,
          detail: run.task?.substring(0, 80),
          timestamp: now,
          agentId
        });
      }
    });
    
    // Completed runs
    Object.keys(runs).forEach(runId => {
      const run = runs[runId];
      const lastRun = lastRuns[runId];
      if (run.completedAt && lastRun && !lastRun.completedAt) {
        const match = run.childSessionKey?.match(/^agent:([^:]+):/);
        const agentId = match ? match[1] : 'unknown';
        events.push({
          type: 'complete',
          icon: '✅',
          message: `Task completed: ${run.label || agentId}`,
          detail: `Duration: ${Math.round((run.completedAt - run.startedAt) / 1000)}s`,
          timestamp: now,
          agentId
        });
      }
    });
  }
  
  // Check for agent session activity
  newState.agents.forEach(agent => {
    const sessions = getAgentSessions(agent.id);
    const lastSessions = lastAgentSessions[agent.id];
    
    if (lastSessions && sessions.sessions?.[0]) {
      const current = sessions.sessions[0];
      const last = lastSessions.sessions?.[0];
      
      if (last && current.updatedAt > last.updatedAt) {
        // Agent had activity
        events.push({
          type: 'tool',
          icon: '⚡',
          message: `${agent.name || agent.id} active`,
          detail: `Tokens: ${current.totalTokens?.toLocaleString() || 0}`,
          timestamp: now,
          agentId: agent.id
        });
      }
    }
    
    lastAgentSessions[agent.id] = sessions;
  });
  
  lastSubagentData = subagentData;
  
  return events;
}

// Store recent activity
function addActivity(event) {
  activityLog.unshift({
    ...event,
    id: Date.now() + Math.random()
  });
  if (activityLog.length > 100) {
    activityLog = activityLog.slice(0, 100);
  }
}

// HTTP server
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size }));
    return;
  }
  
  // API: Get current state
  if (req.url === '/api/state') {
    const state = buildStateSnapshot();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }
  
  // API: Get activity feed
  if (req.url === '/api/activity') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(activityLog));
    return;
  }
  
  // Event injection (for external tools to push events)
  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        event.timestamp = event.timestamp || new Date().toISOString();
        addActivity(event);
        broadcast({ type: 'activity', events: [event] });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
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
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[MC] Client connected');
  
  // Send initial state
  const state = buildStateSnapshot();
  ws.send(JSON.stringify({ 
    type: 'init',
    ...state,
    activity: activityLog.slice(0, 50)
  }));
  
  // Send connected event
  ws.send(JSON.stringify({
    type: 'system',
    icon: '🟢',
    message: 'Connected to Mission Control',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('close', () => {
    console.log('[MC] Client disconnected');
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

// Polling loop
let lastStateHash = '';

function poll() {
  try {
    const state = buildStateSnapshot();
    const stateHash = JSON.stringify(state.stats) + JSON.stringify(state.pipeline);
    
    // Detect changes
    const events = detectChanges(state);
    
    // Broadcast if state changed or there are events
    if (stateHash !== lastStateHash || events.length > 0) {
      lastStateHash = stateHash;
      
      // Add events to log
      events.forEach(e => addActivity(e));
      
      // Broadcast update
      broadcast({
        type: 'update',
        ...state,
        newEvents: events
      });
      
      if (events.length > 0) {
        console.log(`[MC] ${events.length} new events`);
      }
    }
  } catch (e) {
    console.error('[MC] Poll error:', e.message);
  }
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[MC] Mission Control Server running on http://0.0.0.0:${PORT}`);
  console.log(`[MC] WebSocket on ws://0.0.0.0:${PORT}`);
  console.log(`[MC] Polling OpenClaw data every ${POLL_INTERVAL}ms`);
  
  // Initial load
  addActivity({
    type: 'system',
    icon: '🚀',
    message: 'Mission Control Server started',
    timestamp: new Date().toISOString()
  });
  
  // Start polling
  setInterval(poll, POLL_INTERVAL);
  poll(); // Initial poll
});
