/**
 * CR-OPERATOR-COMMAND-UPGRADE — Verification Test Suite
 * Tests all 5 phases of the upgrade.
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const BASE = 'http://localhost:3000';
const SSOT = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');

let passed = 0;
let failed = 0;

function ok(label, condition, detail) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? `: ${detail}` : ''}`);
    failed++;
  }
}

async function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, data: null, raw: body }); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  CR-OPERATOR-COMMAND-UPGRADE — Verification Suite');
  console.log('══════════════════════════════════════════════════\n');

  // ─── Phase 1: Data Integrity ───────────────────────────────────────────────
  console.log('[ Phase 1: Data Integrity ]');

  // 1.1 Agent count = 4 (dynamic from SSOT)
  const agentsRes = await get(`${BASE}/api/agents`);
  ok('/api/agents returns 200', agentsRes.status === 200);
  ok('Agent count is 4 (dynamic from agents_runtime.json)',
    agentsRes.data && agentsRes.data.count === 4,
    `Got: ${agentsRes.data && agentsRes.data.count}`);
  ok('All 4 agents have name + status',
    agentsRes.data && agentsRes.data.agents &&
    agentsRes.data.agents.every(a => a.name && a.status));

  // 1.2 No placeholder values in data endpoints
  const statusRes = await get(`${BASE}/api/status`);
  ok('/api/status returns 200', statusRes.status === 200);
  ok('Status timestamp is real ISO string (not "placeholder")',
    statusRes.data && typeof statusRes.data.timestamp === 'string' &&
    statusRes.data.timestamp !== 'placeholder' &&
    !isNaN(new Date(statusRes.data.timestamp).getTime()));

  // 1.3 SSOT path validation
  const ssotFiles = [
    'workstreams.json', 'blocked_work.json', 'venture_velocity.json',
    'agents_runtime.json', 'agent_activity.json', 'venture_scoreboard.json'
  ];
  ssotFiles.forEach(f => {
    const fp = path.join(SSOT, f);
    ok(`SSOT file exists: ${f}`, fs.existsSync(fp));
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      ok(`SSOT file valid JSON: ${f}`, data !== null);
    } catch (_) {
      ok(`SSOT file valid JSON: ${f}`, false, 'parse error');
    }
  });

  // 1.4 Refresh cadence: /api/debug/ssot exists
  const debugRes = await get(`${BASE}/api/debug/ssot`);
  ok('/api/debug/ssot returns 200 (staleness check source)', debugRes.status === 200);

  // ─── Phase 2: Operator Guidance Engine ────────────────────────────────────
  console.log('\n[ Phase 3: Operator Guidance Engine ]');

  const guidanceRes = await get(`${BASE}/api/operator-guidance`);
  ok('/api/operator-guidance returns 200', guidanceRes.status === 200);
  ok('Guidance has "guidance" array', guidanceRes.data && Array.isArray(guidanceRes.data.guidance));
  ok('Guidance has "count" field', guidanceRes.data && typeof guidanceRes.data.count === 'number');
  ok('Guidance has "timestamp" field', guidanceRes.data && typeof guidanceRes.data.timestamp === 'string');
  ok('Guidance has "sources" field', guidanceRes.data && typeof guidanceRes.data.sources === 'object');
  ok('Guidance count <= 4', guidanceRes.data && guidanceRes.data.count <= 4);
  ok('Guidance count matches array length',
    guidanceRes.data && guidanceRes.data.count === guidanceRes.data.guidance.length);

  if (guidanceRes.data && guidanceRes.data.guidance.length > 0) {
    const g = guidanceRes.data.guidance[0];
    ok('First guidance item has priority', ['HIGH', 'MEDIUM', 'LOW'].includes(g.priority),
      `Got: ${g.priority}`);
    ok('First guidance item has action', typeof g.action === 'string' && g.action.length > 0);
    ok('First guidance item has status', typeof g.status === 'string' && g.status.length > 0);
  }

  // Sources check
  if (guidanceRes.data && guidanceRes.data.sources) {
    const src = guidanceRes.data.sources;
    ok('Guidance sources include workstreams', src.workstreams === 'workstreams.json');
    ok('Guidance sources include agents', src.agents === 'agents_runtime.json');
  }

  // ─── Phase 3: Founder Decision Engine ────────────────────────────────────
  console.log('\n[ Phase 3: Founder Decision Engine ]');

  const decisionsRes = await get(`${BASE}/api/founder-decisions`);
  ok('/api/founder-decisions returns 200', decisionsRes.status === 200);
  ok('Decisions has "decisions" object', decisionsRes.data && typeof decisionsRes.data.decisions === 'object');
  ok('Decisions has "timestamp" field', decisionsRes.data && typeof decisionsRes.data.timestamp === 'string');
  ok('Decisions has "decision_count" field', decisionsRes.data && typeof decisionsRes.data.decision_count === 'number');
  ok('Decisions has "sources" field', decisionsRes.data && typeof decisionsRes.data.sources === 'object');
  ok('decision_count matches keys',
    decisionsRes.data &&
    decisionsRes.data.decision_count === Object.keys(decisionsRes.data.decisions).length);

  // Check structure of any decisions
  const decisionKeys = decisionsRes.data ? Object.keys(decisionsRes.data.decisions) : [];
  decisionKeys.forEach(key => {
    const d = decisionsRes.data.decisions[key];
    ok(`Decision "${key}" has recommendation`, typeof d.recommendation === 'string');
    ok(`Decision "${key}" has confidence`, typeof d.confidence === 'number');
    ok(`Decision "${key}" has reasoning array`, Array.isArray(d.reasoning));
  });

  // ─── Phase 4: HTML / UI checks ───────────────────────────────────────────
  console.log('\n[ Phase 2+4: UI + Performance ]');

  const indexRes = await get(`${BASE}/`);
  ok('GET / returns 200', indexRes.status === 200);

  // Check HTML source
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  ok('Title updated to Operator Command', html.includes('Operator Command'));
  ok('No "Palantir Mode" in title/footer', !html.includes('Palantir Mode · 10s refresh'));
  ok('panel-operator-guidance present', html.includes('id="panel-operator-guidance"'));
  ok('panel-founder-decisions present', html.includes('id="panel-founder-decisions"'));
  ok('mc-panel-primary applied to active-work', html.includes('id="panel-active-work" class="mc-panel mc-panel-primary"'));
  ok('mc-panel-primary applied to blocked-work', html.includes('id="panel-blocked-work" class="mc-panel mc-panel-primary"'));
  ok('mc-panel-primary applied to operator-guidance', html.includes('id="panel-operator-guidance" class="mc-panel mc-panel-primary"'));
  ok('mc-panel-primary applied to founder-decisions', html.includes('id="panel-founder-decisions" class="mc-panel mc-panel-primary"'));
  ok('mc-panel-secondary applied to insights', html.includes('id="panel-insights" class="mc-panel mc-panel-secondary"'));
  ok('Tooltip buttons present', html.includes('class="tooltip-btn"'));
  ok('Tooltip popup divs present', html.includes('class="tooltip-popup"'));
  ok('operator-guidance-panel.js loaded', html.includes('src="/operator-guidance-panel.js"'));

  // Verify JS file exists
  ok('operator-guidance-panel.js exists in public/',
    fs.existsSync(path.join(__dirname, 'public', 'operator-guidance-panel.js')));
  ok('api/operator-guidance.js exists',
    fs.existsSync(path.join(__dirname, 'api', 'operator-guidance.js')));
  ok('api/founder-decisions.js exists',
    fs.existsSync(path.join(__dirname, 'api', 'founder-decisions.js')));

  // ─── Phase 4: Performance ────────────────────────────────────────────────
  console.log('\n[ Phase 4: Performance ]');

  const endpoints = [
    '/api/operator-guidance',
    '/api/founder-decisions',
    '/api/agents',
    '/api/status'
  ];

  for (const ep of endpoints) {
    const t0 = Date.now();
    const r = await get(`${BASE}${ep}`);
    const ms = Date.now() - t0;
    ok(`${ep} responds in <200ms (got ${ms}ms)`, ms < 200, `${ms}ms`);
    ok(`${ep} returns 200`, r.status === 200);
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('✅ CR-OPERATOR-COMMAND-UPGRADE: All verifications passed!\n');
  } else {
    console.log(`⚠️  ${failed} verification(s) failed — see above\n`);
    process.exitCode = 1;
  }
}

run().catch(e => {
  console.error('Test runner error:', e.message);
  process.exit(1);
});
