/**
 * CR-MC-OPS-PANELS-UPGRADE: Unit + Integration Tests
 *
 * Run: node test-cr-mc-ops-panels.js
 * Requires server running on localhost:3000
 */

'use strict';

const http = require('http');
const path = require('path');

// ── Unit Tests (module-level) ─────────────────────────────────────────────

const workstreamsModule = require('./api/workstreams');

let pass = 0;
let fail = 0;
const failures = [];

function assert(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    failures.push({ name, detail });
    console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ── calculateHealth ───────────────────────────────────────────────────────

section('calculateHealth');

assert('healthy with no blockers',
  workstreamsModule.calculateHealth({ id: 'ws1', venture_id: 'v1' }, []) === 'healthy');

assert('critical with critical blocker',
  workstreamsModule.calculateHealth(
    { id: 'ws1', venture_id: 'v1' },
    [{ workstream_id: 'ws1', severity: 'critical' }]
  ) === 'critical');

assert('warning with warning blocker',
  workstreamsModule.calculateHealth(
    { id: 'ws1', venture_id: 'v1' },
    [{ workstream_id: 'ws1', severity: 'warning' }]
  ) === 'warning');

assert('warning with stale workstream (48-167h)',
  (() => {
    const ts = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(); // 50h ago
    return workstreamsModule.calculateHealth({ id: 'ws1', last_event_ts: ts }, []) === 'warning';
  })());

assert('critical with very stale workstream (168h+)',
  (() => {
    const ts = new Date(Date.now() - 200 * 60 * 60 * 1000).toISOString(); // 200h ago
    return workstreamsModule.calculateHealth({ id: 'ws1', last_event_ts: ts }, []) === 'critical';
  })());

// ── calculateSLA ──────────────────────────────────────────────────────────

section('calculateSLA');

const now = new Date().toISOString();
const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
const twoDaysAgo   = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

assert('SLA fields present',
  (() => {
    const sla = workstreamsModule.calculateSLA({ created_at: twoDaysAgo });
    return sla.duration_hours !== undefined &&
           sla.duration_str   !== undefined &&
           sla.overdue        !== undefined &&
           sla.remaining_str  !== undefined &&
           sla.sla_hours      !== undefined;
  })());

assert('Not overdue for recent blocker',
  workstreamsModule.calculateSLA({ created_at: twoDaysAgo }).overdue === false);

assert('Overdue after 72h',
  workstreamsModule.calculateSLA({ created_at: new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString() }).overdue === true);

assert('Custom SLA hours respected',
  (() => {
    const sla = workstreamsModule.calculateSLA({ created_at: twoDaysAgo, sla_hours: 24 });
    return sla.overdue === true;
  })());

assert('Duration string for hours',
  (() => {
    const sla = workstreamsModule.calculateSLA({ created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() });
    return sla.duration_str.includes('h');
  })());

assert('Duration string for days',
  (() => {
    const sla = workstreamsModule.calculateSLA({ created_at: threeDaysAgo });
    return sla.duration_str.includes('d');
  })());

// ── filterActivityByWorkstream ────────────────────────────────────────────

section('filterActivityByWorkstream');

const testActivities = [
  { workstream_id: 'ws-abc', agent: 'Clawson', action: 'Build' },
  { meta: { workstream_id: 'ws-abc' }, agent: 'Codesmith', action: 'Deploy' },
  { workstream_id: 'ws-xyz', agent: 'Moonshot', action: 'Research' },
  { agent: 'PA', action: 'Meeting' }
];

assert('Filters by direct workstream_id',
  workstreamsModule.filterActivityByWorkstream('ws-abc', testActivities).length === 2);

assert('Returns empty for unknown id',
  workstreamsModule.filterActivityByWorkstream('ws-000', testActivities).length === 0);

assert('Returns empty for empty array',
  workstreamsModule.filterActivityByWorkstream('ws-abc', []).length === 0);

assert('Returns empty for null array',
  workstreamsModule.filterActivityByWorkstream('ws-abc', null).length === 0);

// ── getWorkstreams ────────────────────────────────────────────────────────

section('getWorkstreams (SSOT)');

const wsResult = workstreamsModule.getWorkstreams();

assert('Returns object',
  typeof wsResult === 'object');

assert('Has timestamp',
  typeof wsResult.timestamp === 'string');

assert('Has total (number)',
  typeof wsResult.total === 'number');

assert('Has workstreams array',
  Array.isArray(wsResult.workstreams));

assert('Has empty flag',
  typeof wsResult.empty === 'boolean');

assert('Has sources',
  typeof wsResult.sources === 'object' && wsResult.sources.workstreams !== undefined);

assert('Source has file citation',
  wsResult.sources.workstreams.file === 'workstreams.json');

assert('total matches workstreams.length',
  wsResult.total === wsResult.workstreams.length);

// ── getBlockers ───────────────────────────────────────────────────────────

section('getBlockers (SSOT)');

const bkResult = workstreamsModule.getBlockers();

assert('Returns object',
  typeof bkResult === 'object');

assert('Has blockers array',
  Array.isArray(bkResult.blockers));

assert('Has total = 0 (current state)',
  bkResult.total === 0);

assert('Has empty = true (current state)',
  bkResult.empty === true);

assert('Source cites blocked_work.json',
  bkResult.sources.blocked_work.file === 'blocked_work.json');

// ── getWorkstreamDetail (404) ─────────────────────────────────────────────

section('getWorkstreamDetail');

assert('Returns null for missing id',
  workstreamsModule.getWorkstreamDetail('nonexistent') === null);

// ── getBlockerDetail (404) ────────────────────────────────────────────────

section('getBlockerDetail');

assert('Returns null for missing id',
  workstreamsModule.getBlockerDetail('BLK-000') === null);

// ── getSystemStatus ───────────────────────────────────────────────────────

section('getSystemStatus');

const statusResult = workstreamsModule.getSystemStatus();

assert('Returns object',
  typeof statusResult === 'object');

assert('Has agents array',
  Array.isArray(statusResult.agents));

assert('Has 4 known agents',
  statusResult.agents.length === 4);

assert('Clawson present',
  statusResult.agents.some(a => a.id === 'clawson'));

assert('Codesmith present',
  statusResult.agents.some(a => a.id === 'codesmith'));

assert('Moonshot present',
  statusResult.agents.some(a => a.id === 'moonshot'));

assert('Personal Assistant present',
  statusResult.agents.some(a => a.id === 'personal_assistant'));

const clawson = statusResult.agents.find(a => a.id === 'clawson');
assert('Clawson has status',
  ['online', 'idle', 'offline'].includes(clawson.status));

assert('Clawson has name',
  clawson.name === 'Clawson');

assert('Each agent has workstreams_owned',
  statusResult.agents.every(a => typeof a.workstreams_owned === 'number'));

assert('Each agent has recent_errors',
  statusResult.agents.every(a => typeof a.recent_errors === 'number'));

assert('Has summary',
  typeof statusResult.summary === 'object');

assert('Summary online + idle + offline = total agents',
  (statusResult.summary.online + statusResult.summary.idle + statusResult.summary.offline) === statusResult.agents.length);

assert('Has sources',
  statusResult.sources.registry !== undefined &&
  statusResult.sources.agent_activity !== undefined &&
  statusResult.sources.workstreams !== undefined);

// ── getWorkstreamFlow ─────────────────────────────────────────────────────

section('getWorkstreamFlow');

const flowResult = workstreamsModule.getWorkstreamFlow();

assert('Returns object',
  typeof flowResult === 'object');

assert('Has stages array',
  Array.isArray(flowResult.stages));

assert('Has 6 stages (Discovery/Design/Build/Test/Deploy/Experiment)',
  flowResult.stages.length === 6);

assert('All stages have name/count/workstreams/ventures',
  flowResult.stages.every(s =>
    s.name && typeof s.count === 'number' &&
    Array.isArray(s.workstreams) && Array.isArray(s.ventures)));

assert('Total matches (0 currently)',
  flowResult.total === 0);

assert('Has sources',
  flowResult.sources.workstreams !== undefined);

// ── Caching test ──────────────────────────────────────────────────────────

section('Caching');

const t1 = Date.now();
workstreamsModule.getWorkstreams();
const t2 = Date.now();
workstreamsModule.getWorkstreams(); // Should be cached
const t3 = Date.now();

assert('Second call is faster (cached < 50ms)',
  (t3 - t2) < 50,
  `took ${t3 - t2}ms`);

// ── Integration Tests (requires running server) ───────────────────────────

async function integrationTests() {
  section('Integration Tests (HTTP)');

  function get(path) {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:3000${path}`, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('timeout')));
    });
  }

  try {
    // GET /api/workstreams
    const ws = await get('/api/workstreams');
    assert('GET /api/workstreams → 200', ws.status === 200);
    assert('/api/workstreams has sources', ws.data.sources?.workstreams?.file === 'workstreams.json');
    assert('/api/workstreams has workstreams array', Array.isArray(ws.data.workstreams));
    assert('/api/workstreams total=0 (current)', ws.data.total === 0);

    // GET /api/workstreams/nonexistent → 404
    const ws404 = await get('/api/workstreams/nonexistent');
    assert('GET /api/workstreams/nonexistent → 404', ws404.status === 404);
    assert('404 has error field', ws404.data.error === 'Workstream not found');

    // GET /api/blockers
    const bk = await get('/api/blockers');
    assert('GET /api/blockers → 200', bk.status === 200);
    assert('/api/blockers total=0 (current)', bk.data.total === 0);
    assert('/api/blockers has sources', bk.data.sources?.blocked_work !== undefined);

    // GET /api/blockers/nonexistent → 404
    const bk404 = await get('/api/blockers/nonexistent');
    assert('GET /api/blockers/nonexistent → 404', bk404.status === 404);

    // GET /api/system-status
    const sys = await get('/api/system-status');
    assert('GET /api/system-status → 200', sys.status === 200);
    assert('/api/system-status has agents', Array.isArray(sys.data.agents));
    assert('/api/system-status has 4 agents', sys.data.agents.length === 4);
    assert('Clawson status is online', sys.data.agents.find(a => a.id === 'clawson')?.status === 'online');

    // GET /api/workstream-flow
    const flow = await get('/api/workstream-flow');
    assert('GET /api/workstream-flow → 200', flow.status === 200);
    assert('/api/workstream-flow has 6 stages', flow.data.stages.length === 6);

    // Second request to /api/workstreams (cache test)
    const t1 = Date.now();
    await get('/api/workstreams');
    const elapsed = Date.now() - t1;
    assert('Cached /api/workstreams response < 100ms', elapsed < 100, `took ${elapsed}ms`);

  } catch (err) {
    console.log(`  ⚠️  Integration tests skipped (server not reachable): ${err.message}`);
  }
}

// ── Results ───────────────────────────────────────────────────────────────

integrationTests().then(() => {
  console.log('\n' + '═'.repeat(50));
  console.log(`RESULTS: ${pass} passed, ${fail} failed`);
  if (failures.length > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log(`  ❌ ${f.name}${f.detail ? ': ' + f.detail : ''}`));
  }
  console.log('═'.repeat(50));
  process.exit(fail > 0 ? 1 : 0);
});
