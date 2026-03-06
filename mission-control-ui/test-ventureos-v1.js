#!/usr/bin/env node
/**
 * VentureOS V1 Test Suite — CR-VENTUREOS-V1
 * 25+ unit + integration tests.
 *
 * Run: node test-ventureos-v1.js
 * Requires server on localhost:3000 for integration tests.
 * Set VENTUREOS_UNIT_ONLY=1 to skip integration tests.
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const os     = require('os');
const assert = require('assert');
const http   = require('http');

// ── Test framework ──────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function suite(name) {
  tests.push({ suite: name });
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function ok(val, msg) {
  if (!val) throw new Error(msg || `Expected truthy, got ${JSON.stringify(val)}`);
}

function deepEq(a, b, msg) {
  assert.deepStrictEqual(a, b, msg);
}

// ── Load module under test ──────────────────────────────────────────────────

const ventureOS = require('./api/ventureos_v1');
const DATA_ROOT  = path.join(os.homedir(), '.openclaw/workspace/data/ventures');

// ── SSOT snapshot/restore ───────────────────────────────────────────────────

let snapshots = {};

function snapshotSSO() {
  for (const f of ['venture_scoreboard.json', 'venture_pipeline.json', 'venture_work_links.json', 'ventures.json']) {
    snapshots[f] = fs.readFileSync(path.join(DATA_ROOT, f), 'utf-8');
  }
}

function restoreSSO() {
  for (const [f, content] of Object.entries(snapshots)) {
    fs.writeFileSync(path.join(DATA_ROOT, f), content, 'utf-8');
  }
}

// ── HTTP helper ─────────────────────────────────────────────────────────────

function httpRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (_e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Test definitions ────────────────────────────────────────────────────────

suite('Schema Validation — SSOT Files');

test('venture_scoreboard.json is valid JSON with ventures array', () => {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), 'utf-8'));
  ok(Array.isArray(data.ventures), 'ventures must be array');
  ok(data.ventures.length >= 1, 'must have at least 1 venture');
});

test('venture_pipeline.json has required stage keys', () => {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_pipeline.json'), 'utf-8'));
  const required = ['opportunity', 'investigation', 'approval', 'implementation', 'launch', 'killed'];
  required.forEach(s => ok(data.stages[s] !== undefined, `missing stage: ${s}`));
});

test('venture_work_links.json has links array', () => {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_work_links.json'), 'utf-8'));
  ok(Array.isArray(data.links), 'links must be array');
});

test('ventures.json has full detail ventures', () => {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'ventures.json'), 'utf-8'));
  ok(Array.isArray(data.ventures), 'ventures must be array');
  ok(data.ventures.length >= 1, 'must have at least 1 venture');
  const v = data.ventures[0];
  ok(v.id, 'venture must have id');
  ok(v.name, 'venture must have name');
  ok(v.stage, 'venture must have stage');
});

test('leadscore-ai consistent across SSOT files', () => {
  const sb   = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), 'utf-8'));
  const full = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'ventures.json'), 'utf-8'));
  const wl   = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_work_links.json'), 'utf-8'));
  const sbV   = sb.ventures.find(v => v.id === 'leadscore-ai');
  const fullV = full.ventures.find(v => v.id === 'leadscore-ai');
  const linkV = wl.links.find(l => l.venture_id === 'leadscore-ai');
  ok(sbV,   'leadscore-ai in scoreboard');
  ok(fullV, 'leadscore-ai in ventures.json');
  ok(linkV, 'leadscore-ai in work_links');
  eq(sbV.stage, fullV.stage, 'stage must match across files');
});

suite('getGatewayRequirements');

test('returns empty array for killed stage', () => {
  deepEq(ventureOS.getGatewayRequirements('killed'), []);
});

test('investigation gate: memo_written + vision_clear', () => {
  const reqs = ventureOS.getGatewayRequirements('investigation');
  ok(reqs.some(r => r.name === 'memo_written'));
  ok(reqs.some(r => r.name === 'vision_clear'));
});

test('approval gate: tam + competitors + team + budget', () => {
  const names = ventureOS.getGatewayRequirements('approval').map(r => r.name);
  ok(names.includes('tam_gt_10m'));
  ok(names.includes('competitors_3'));
  ok(names.includes('team_committed'));
  ok(names.includes('budget_estimated'));
});

test('implementation gate: cr + budget_approved + team', () => {
  const names = ventureOS.getGatewayRequirements('implementation').map(r => r.name);
  ok(names.includes('cr_submitted'));
  ok(names.includes('budget_approved'));
  ok(names.includes('team_assigned'));
});

test('launch gate: tests_exist + metrics_80pct', () => {
  const names = ventureOS.getGatewayRequirements('launch').map(r => r.name);
  ok(names.includes('tests_exist'));
  ok(names.includes('metrics_80pct'));
});

suite('validateGate');

test('killed always passes', () => {
  const r = ventureOS.validateGate({}, 'killed');
  ok(r.passed);
  deepEq(r.missing, []);
});

test('investigation: fails without memo', () => {
  const r = ventureOS.validateGate({ description: 'good enough description here', artifacts: {} }, 'investigation');
  ok(!r.passed);
  ok(r.missing.includes('memo_written'));
});

test('investigation: passes with memo + description', () => {
  const r = ventureOS.validateGate({
    description: 'Good description here for test purposes',
    artifacts: { memo: '/ventures/test/memo.md' }
  }, 'investigation');
  ok(r.passed, `missing: ${r.missing.join(', ')}`);
});

test('approval: fails with low TAM', () => {
  const r = ventureOS.validateGate({
    description: 'Test', artifacts: { memo: '/m' },
    market_opportunity: { tam: 5000000, competitors: ['A','B','C'] },
    team: ['a'], financials: { budget: 100 }
  }, 'approval');
  ok(!r.passed);
  ok(r.missing.includes('tam_gt_10m'));
});

test('approval: fails with <3 competitors', () => {
  const r = ventureOS.validateGate({
    description: 'Test', artifacts: { memo: '/m' },
    market_opportunity: { tam: 50000000, competitors: ['A','B'] },
    team: ['a'], financials: { budget: 100 }
  }, 'approval');
  ok(!r.passed);
  ok(r.missing.includes('competitors_3'));
});

test('approval: passes all conditions', () => {
  const r = ventureOS.validateGate({
    description: 'Good venture description',
    artifacts: { memo: '/path/memo.md' },
    market_opportunity: { tam: 50000000, competitors: ['Clearbit','MadKudu','6sense'] },
    team: ['alice'],
    financials: { budget: 10000 }
  }, 'approval');
  ok(r.passed, `should pass. missing: ${r.missing.join(', ')}`);
});

test('implementation: fails without CR artifact', () => {
  const r = ventureOS.validateGate({
    artifacts: { memo: '/path/memo.md' },
    financials: { budget: 10000, budget_approved: true },
    team: ['alice']
  }, 'implementation');
  ok(!r.passed);
  ok(r.missing.includes('cr_submitted'));
});

test('launch: fails without tests + low metrics', () => {
  const r = ventureOS.validateGate({
    artifacts: { cr: '/cr.md', memo: '/memo.md' },
    metrics: { mrr_target: 5000, mrr_current: 100 }
  }, 'launch');
  ok(!r.passed);
  ok(r.missing.includes('tests_exist'));
});

suite('listVentures + getPipeline + getAtRisk');

test('listVentures returns summary with metadata', () => {
  const r = ventureOS.listVentures();
  ok(Array.isArray(r.ventures));
  ok(r.ventures.length >= 1);
  ok(r.sources);
  ok(r.timestamp);
});

test('listVentures filters by stage', () => {
  const r = ventureOS.listVentures({ stage: 'implementation' });
  r.ventures.forEach(v => eq(v.stage, 'implementation'));
});

test('getPipeline returns all stages + metrics', () => {
  const p = ventureOS.getPipeline();
  ['opportunity','investigation','approval','implementation','launch','killed'].forEach(s => {
    ok(p.stages[s] !== undefined, `missing stage: ${s}`);
  });
  ok(p.metrics, 'has metrics');
});

test('recalcPipeline is consistent with scoreboard', () => {
  const p  = ventureOS.recalcPipeline();
  const sb = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), 'utf-8'));
  const sum = Object.values(p.stages).reduce((a, b) => a + b, 0);
  eq(sum, sb.ventures.length, 'stage counts must sum to total ventures');
});

test('getAtRisk returns array with risk metadata', () => {
  const r = ventureOS.getAtRisk();
  ok(Array.isArray(r));
  r.forEach(v => {
    ok(v.id);
    ok(v.name);
    ok(Array.isArray(v.risks));
    ok(v.highest_severity);
  });
});

suite('Integration — createVenture (write tests — SSOT restored after each)');

test('createVenture creates venture in OPPORTUNITY stage', () => {
  snapshotSSO();
  try {
    const r = ventureOS.createVenture({
      name: 'Test Venture Alpha',
      description: 'Test venture for automated testing',
      owner: 'codesmith',
      timeline_weeks: 6,
      target_mrr: 2000
    });
    eq(r.stage, 'opportunity');
    ok(r.venture_id.includes('test-venture'));

    // Verify in scoreboard
    const sb = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), 'utf-8'));
    const v  = sb.ventures.find(v => v.id === r.venture_id);
    ok(v, 'venture in scoreboard');
    eq(v.stage, 'opportunity');

    // Pipeline updated
    const p = ventureOS.getPipeline();
    ok(p.stages.opportunity >= 1);
  } finally {
    restoreSSO();
  }
});

test('createVenture rejects missing name/owner', () => {
  let threw = false;
  try { ventureOS.createVenture({ owner: 'codesmith' }); }
  catch (e) { threw = true; eq(e.statusCode, 400); }
  ok(threw);
});

test('createVenture rejects duplicate id', () => {
  snapshotSSO();
  try {
    ventureOS.createVenture({ name: 'Dup Test', description: 'First', owner: 'codesmith' });
    let threw = false;
    try { ventureOS.createVenture({ name: 'Dup Test', description: 'Second', owner: 'codesmith' }); }
    catch (e) { threw = true; eq(e.statusCode, 409); }
    ok(threw);
  } finally {
    restoreSSO();
  }
});

suite('Integration — advanceStage');

test('advanceStage rejects invalid transition (implementation → investigation)', () => {
  // leadscore-ai is in implementation; going backward to investigation is invalid
  let threw = false;
  try { ventureOS.advanceStage('leadscore-ai', 'investigation'); }
  catch (e) { threw = true; eq(e.statusCode, 400); ok(e.message.includes('Invalid transition')); }
  ok(threw);
});

test('advanceStage rejects gate failure (422)', () => {
  snapshotSSO();
  try {
    ventureOS.createVenture({ name: 'Gate Test Bare', description: 'Bare venture', owner: 'codesmith' });
    let threw = false;
    try { ventureOS.advanceStage('gate-test-bare', 'investigation'); }
    catch (e) { threw = true; eq(e.statusCode, 422); ok(Array.isArray(e.missing)); }
    ok(threw);
  } finally {
    restoreSSO();
  }
});

suite('Integration — killVenture');

test('killVenture rejects unauthorized decision_maker', () => {
  let threw = false;
  try { ventureOS.killVenture('leadscore-ai', 'test', 'random', null); }
  catch (e) { threw = true; eq(e.statusCode, 403); }
  ok(threw);
});

test('killVenture rejects missing reason', () => {
  let threw = false;
  try { ventureOS.killVenture('leadscore-ai', null, 'steve', null); }
  catch (e) { threw = true; eq(e.statusCode, 400); }
  ok(threw);
});

test('killVenture: full kill + verify SSOT', () => {
  snapshotSSO();
  try {
    ventureOS.createVenture({ name: 'Killable', description: 'Will be killed', owner: 'codesmith' });
    const r = ventureOS.killVenture('killable', 'No market fit', 'clawson', 'test kill');
    eq(r.status, 'killed');
    ok(r.killed_at);

    const sb = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), 'utf-8'));
    const v  = sb.ventures.find(v => v.id === 'killable');
    eq(v.status, 'killed');
    eq(v.stage, 'killed');
    ok(v.kill_date);
    ok(v.kill_reason);

    const wl = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_work_links.json'), 'utf-8'));
    ok(!wl.links.find(l => l.venture_id === 'killable'), 'removed from work_links');
  } finally {
    restoreSSO();
  }
});

suite('Integration — updateMetrics');

test('updateMetrics updates mrr_current + syncs SSOT', () => {
  snapshotSSO();
  try {
    const r = ventureOS.updateMetrics('leadscore-ai', { mrr_current: 1250 });
    eq(r.status, 'metrics_updated');
    eq(r.applied_updates.mrr_current, 1250);

    const sb = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), 'utf-8'));
    const v  = sb.ventures.find(v => v.id === 'leadscore-ai');
    eq(v.metrics.mrr_current, 1250);
  } finally {
    restoreSSO();
  }
});

test('updateMetrics rejects unknown venture', () => {
  let threw = false;
  try { ventureOS.updateMetrics('nope', { mrr_current: 100 }); }
  catch (e) { threw = true; eq(e.statusCode, 404); }
  ok(threw);
});

suite('Integration — Two ventures independence');

test('two ventures coexist without interference', () => {
  snapshotSSO();
  try {
    ventureOS.createVenture({ name: 'Venture One', description: 'First', owner: 'codesmith' });
    ventureOS.createVenture({ name: 'Venture Two', description: 'Second', owner: 'codesmith' });

    ventureOS.killVenture('venture-one', 'Test kill', 'steve', null);

    const list = ventureOS.listVentures();
    const v2   = list.ventures.find(v => v.id === 'venture-two');
    ok(v2, 'venture-two exists');
    eq(v2.status, 'active', 'venture-two still active');

    const p = ventureOS.getPipeline();
    ok(p.stages.killed >= 1, 'killed count incremented');
  } finally {
    restoreSSO();
  }
});

suite('Integration — Full lifecycle: opportunity → launch');

test('full lifecycle passes all 5 stage gates', () => {
  snapshotSSO();
  try {
    // Create
    ventureOS.createVenture({
      name: 'Lifecycle Venture',
      description: 'End-to-end lifecycle test venture for VentureOS',
      owner: 'codesmith',
      timeline_weeks: 4,
      target_mrr: 3000,
      financials: { budget: 5000, budget_approved: true },
      market_opportunity: {
        tam: 100000000,
        competitors: ['CompA', 'CompB', 'CompC'],
        description: 'Large market'
      }
    });

    // Patch artifacts for gate checks
    const patchSB = (patch) => {
      const sb = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), 'utf-8'));
      const idx = sb.ventures.findIndex(v => v.id === 'lifecycle-venture');
      Object.assign(sb.ventures[idx], patch);
      fs.writeFileSync(path.join(DATA_ROOT, 'venture_scoreboard.json'), JSON.stringify(sb, null, 2));
    };

    // → investigation
    patchSB({ artifacts: { memo: '/ventures/lifecycle-venture/docs/memo.md' } });
    const r1 = ventureOS.advanceStage('lifecycle-venture', 'investigation');
    eq(r1.current_stage, 'investigation');

    // → approval (TAM + competitors already set)
    const r2 = ventureOS.advanceStage('lifecycle-venture', 'approval');
    eq(r2.current_stage, 'approval');

    // → implementation (need CR)
    patchSB({ artifacts: { memo: '/m', cr: '/ventures/lifecycle-venture/CR-001.md' } });
    const r3 = ventureOS.advanceStage('lifecycle-venture', 'implementation');
    eq(r3.current_stage, 'implementation');

    // → launch (need tests + 80% metrics)
    patchSB({
      artifacts: { memo: '/m', cr: '/cr.md', tests: '/ventures/lifecycle-venture/tests/' },
      metrics: { mrr_target: 3000, mrr_current: 2700, customer_target: 5, customer_current: 4 }
    });
    const r4 = ventureOS.advanceStage('lifecycle-venture', 'launch');
    eq(r4.current_stage, 'launch');

    const p = ventureOS.getPipeline();
    ok(p.stages.launch >= 1, 'launch count should be >= 1');
  } finally {
    restoreSSO();
  }
});

// ── HTTP Integration (optional) ─────────────────────────────────────────────

const UNIT_ONLY = process.env.VENTUREOS_UNIT_ONLY === '1';

if (!UNIT_ONLY) {
  suite('HTTP — All 8 Endpoints');

  async function get(p) { return httpRequest('GET', p, null); }
  async function post(p, b) { return httpRequest('POST', p, b); }

  test('GET /api/ventureos/ventures → 200', async () => {
    const r = await get('/api/ventureos/ventures');
    eq(r.status, 200);
    ok(Array.isArray(r.body.ventures));
    ok(r.body.total >= 1);
  });

  test('GET /api/ventureos/ventures/leadscore-ai → 200', async () => {
    const r = await get('/api/ventureos/ventures/leadscore-ai');
    eq(r.status, 200);
    ok(r.body.venture);
    eq(r.body.venture.id, 'leadscore-ai');
  });

  test('GET /api/ventureos/ventures/does-not-exist → 404', async () => {
    const r = await get('/api/ventureos/ventures/does-not-exist');
    eq(r.status, 404);
  });

  test('GET /api/venture-pipeline → 200 with stages', async () => {
    const r = await get('/api/venture-pipeline');
    eq(r.status, 200);
    ok(r.body.stages);
    ok(r.body.total >= 1);
  });

  test('GET /api/venture-at-risk → 200', async () => {
    const r = await get('/api/venture-at-risk');
    eq(r.status, 200);
    ok(Array.isArray(r.body.at_risk));
    ok(r.body.total !== undefined);
  });

  test('POST /api/ventureos/ventures → 201 + SSOT restored', async () => {
    snapshotSSO();
    try {
      const r = await post('/api/ventureos/ventures', {
        name: 'HTTP Test Venture',
        description: 'Created via HTTP integration test',
        owner: 'codesmith',
        timeline_weeks: 4,
        target_mrr: 1000
      });
      eq(r.status, 201);
      eq(r.body.stage, 'opportunity');
      ok(r.body.venture_id);
    } finally {
      restoreSSO();
    }
  });

  test('POST /api/ventureos/ventures → 400 on missing fields', async () => {
    const r = await post('/api/ventureos/ventures', { description: 'no name' });
    eq(r.status, 400);
  });

  test('POST /api/ventureos/ventures/:id/kill → 403 unauthorized', async () => {
    const r = await post('/api/ventureos/ventures/leadscore-ai/kill', {
      reason: 'test', decision_maker: 'random'
    });
    eq(r.status, 403);
  });

  test('POST /api/ventureos/ventures/:id/metrics → 200', async () => {
    snapshotSSO();
    try {
      const r = await post('/api/ventureos/ventures/leadscore-ai/metrics', { mrr_current: 500 });
      eq(r.status, 200);
      eq(r.body.status, 'metrics_updated');
    } finally {
      restoreSSO();
    }
  });
}

// ── Run all tests ────────────────────────────────────────────────────────────

async function run() {
  for (const t of tests) {
    if (t.suite) {
      console.log(`\n📦 ${t.suite}`);
      continue;
    }
    try {
      await t.fn();
      console.log(`  ✅ ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${t.name}`);
      console.error(`     ${err.message}`);
      failed++;
      failures.push({ name: t.name, error: err.message });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.error}`));
  }

  console.log('═'.repeat(60));

  if (passed >= 25) {
    console.log(`\n✅ VentureOS V1: ${passed}+ tests passing. Ready for portfolio governance.`);
  } else {
    console.log(`\n⚠  Only ${passed} tests passing. Need 25+ for acceptance.`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
