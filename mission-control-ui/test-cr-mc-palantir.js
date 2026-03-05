/**
 * CR-MC-PALANTIR-OPERATOR-LOOPS: Test Suite
 * Tests all 5 phases of Palantir Mode implementation.
 *
 * Phase 1: SSOT Foundation
 * Phase 2: Operator Commands
 * Phase 3: Intelligence Layer
 * Phase 4: Engagement Loops
 * Phase 5: Validation Pipeline
 *
 * Run: node test-cr-mc-palantir.js
 */

'use strict';

const http   = require('http');
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

// Load palantir module directly for unit tests
const palantir = require('./api/palantir');

// Helper for top-level async execution
async function runTests() {

const DATA_ROOT = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(name) {
  console.log(`  ✓ ${name}`);
  passed++;
}

function fail(name, err) {
  console.error(`  ✗ ${name}: ${err.message || err}`);
  failed++;
}

function skip(name, reason) {
  console.log(`  ○ ${name} (skipped: ${reason})`);
  skipped++;
}

async function test(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIT TESTS (no server required)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n═══ PHASE 1: SSOT Foundation (Unit Tests) ═══\n');

await test('getActiveAgents() reads agents_runtime.json', async () => {
  const result = palantir.getActiveAgents();
  assert.ok(typeof result.count === 'number', 'count should be a number');
  assert.ok(Array.isArray(result.agents), 'agents should be an array');
  assert.ok(result.ssot === 'agents_runtime.json', 'should reference SSOT file');
});

await test('getActiveAgents() filters active only', async () => {
  const result = palantir.getActiveAgents();
  result.agents.forEach(a => {
    assert.strictEqual(a.status, 'active', `Agent ${a.name} should be active`);
  });
});

await test('getActiveAgents() returns valid lastUpdated', async () => {
  const result = palantir.getActiveAgents();
  if (result.lastUpdated) {
    const ts = new Date(result.lastUpdated);
    assert.ok(!isNaN(ts.getTime()), 'lastUpdated should be valid ISO timestamp');
  }
});

await test('getActiveAgents() count > 0 (live agents)', async () => {
  const result = palantir.getActiveAgents();
  assert.ok(result.count > 0, `Expected active agents, got ${result.count}`);
});

console.log('\n═══ PHASE 2: Operator Commands (Unit Tests) ═══\n');

await test('computeInsights() returns array', async () => {
  const result = palantir.computeInsights();
  assert.ok(Array.isArray(result.insights), 'insights should be array');
  assert.ok(result.computed_at, 'should have computed_at timestamp');
});

await test('computeInsights() severity values are valid', async () => {
  const result = palantir.computeInsights();
  const valid = ['critical', 'warning', 'positive', 'info'];
  result.insights.forEach(i => {
    assert.ok(valid.includes(i.severity), `Invalid severity: ${i.severity}`);
  });
});

await test('computeInsights() sorts by severity (critical first)', async () => {
  const result = palantir.computeInsights();
  const order = { critical: 0, warning: 1, positive: 2, info: 3 };
  for (let i = 1; i < result.insights.length; i++) {
    const prev = order[result.insights[i-1].severity] ?? 4;
    const curr = order[result.insights[i].severity]   ?? 4;
    assert.ok(prev <= curr, `Insights not sorted: ${result.insights[i-1].severity} before ${result.insights[i].severity}`);
  }
});

await test('spawnWorkstream() validates owner exists', async () => {
  let threw = false;
  try {
    palantir.spawnWorkstream('leadscore-ai', { name: 'Test WS', owner: 'nonexistent-agent' });
  } catch (err) {
    threw = true;
    assert.ok(err.message.includes('not found'), 'Error should mention not found');
  }
  assert.ok(threw, 'Should throw for unknown owner');
});

await test('advanceVentureStage() throws for unknown venture', async () => {
  let threw = false;
  try {
    palantir.advanceVentureStage('definitely-not-real-venture-xyz');
  } catch (err) {
    threw = true;
    assert.ok(err.message.includes('not found'), 'Error should mention not found');
  }
  assert.ok(threw, 'Should throw for unknown venture');
});

await test('assignAgent() validates agent exists', async () => {
  let threw = false;
  try {
    palantir.assignAgent('some-workstream', 'ghost-agent-xyz');
  } catch (err) {
    threw = true;
    assert.ok(err.message.includes('not found'), 'Error should mention not found');
  }
  assert.ok(threw, 'Should throw for unknown agent');
});

console.log('\n═══ PHASE 3: Intelligence Layer (Unit Tests) ═══\n');

await test('computeInsights() writes to system_insights.json', async () => {
  palantir.computeInsights();
  const filePath = path.join(DATA_ROOT, 'system_insights.json');
  assert.ok(fs.existsSync(filePath), 'system_insights.json should exist');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  assert.ok(data.lastUpdated, 'Should have lastUpdated');
  assert.ok(Array.isArray(data.insights), 'Should have insights array');
});

await test('dismissInsight() removes insight from system_insights.json', async () => {
  // First compute to ensure there are insights
  const before = palantir.computeInsights();
  if (before.insights.length === 0) {
    console.log('    (skipping: no insights to dismiss)');
    return;
  }
  const firstId = before.insights[0].id;
  palantir.dismissInsight(firstId);
  const data = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'system_insights.json'), 'utf-8'));
  const stillExists = (data.insights || []).find(i => i.id === firstId);
  assert.ok(!stillExists, 'Dismissed insight should be removed');
});

console.log('\n═══ PHASE 4: Engagement Loops (Unit Tests) ═══\n');

await test('getMomentum() returns all required fields', async () => {
  const result = palantir.getMomentum();
  assert.ok(typeof result.ventures_launched_week === 'number', 'ventures_launched_week missing');
  assert.ok(typeof result.tasks_completed_day   === 'number', 'tasks_completed_day missing');
  assert.ok(typeof result.workstreams_closed     === 'number', 'workstreams_closed missing');
  assert.ok(typeof result.ventures_advanced      === 'number', 'ventures_advanced missing');
  assert.ok(typeof result.overall_progress       === 'number', 'overall_progress missing');
  assert.ok(['accelerating', 'steady', 'slowing'].includes(result.trend), `Invalid trend: ${result.trend}`);
  assert.ok(result.trend_emoji, 'trend_emoji missing');
});

await test('getOperatorImpact(today) returns expected fields', async () => {
  const result = palantir.getOperatorImpact('today');
  assert.ok(typeof result.actions_taken      === 'number', 'actions_taken missing');
  assert.ok(typeof result.downstream_events  === 'number', 'downstream_events missing');
  assert.ok(typeof result.system_health      === 'number', 'system_health missing');
  assert.ok(typeof result.influence_multiplier === 'number', 'influence_multiplier missing');
  assert.ok(result.week_stats,                              'week_stats missing');
});

await test('getOperatorImpact() works for all horizons', async () => {
  for (const horizon of ['today', 'week', 'month', 'all']) {
    const result = palantir.getOperatorImpact(horizon);
    assert.strictEqual(result.horizon, horizon, `horizon should be ${horizon}`);
  }
});

await test('getOpportunities() returns array', async () => {
  const result = palantir.getOpportunities();
  assert.ok(Array.isArray(result.opportunities), 'opportunities should be array');
  assert.ok(result.computed_at, 'computed_at should exist');
});

await test('getVentureGraph() returns graph data', async () => {
  const result = palantir.getVentureGraph();
  assert.ok(result, 'Should return graph data');
});

console.log('\n═══ PHASE 5: Validation Pipeline (Unit Tests) ═══\n');

await test('validateSSO() returns validation result', async () => {
  const result = palantir.validateSSO();
  assert.ok(typeof result.healthy === 'boolean', 'healthy should be boolean');
  assert.ok(typeof result.files   === 'object',  'files should be object');
  assert.ok(Array.isArray(result.failed), 'failed should be array');
  assert.ok(Array.isArray(result.stale),  'stale should be array');
  assert.ok(result.validated_at, 'validated_at should exist');
});

await test('validateSSO() checks all required SSOT files', async () => {
  const result = palantir.validateSSO();
  const required = ['agent_activity.json', 'agents_runtime.json', 'system_insights.json'];
  required.forEach(f => {
    assert.ok(f in result.files, `Missing file check: ${f}`);
  });
});

await test('validateSSO() reports healthy when files exist', async () => {
  const result = palantir.validateSSO();
  // At minimum, agents_runtime.json should be healthy (we know it exists)
  if (result.files['agents_runtime.json']) {
    assert.ok(result.files['agents_runtime.json'].exists !== false, 'agents_runtime.json should exist');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION TESTS (require server on localhost:3000)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n═══ Integration Tests (server: localhost:3000) ═══\n');

let serverAvailable = false;
try {
  const health = await apiRequest('GET', '/api/health');
  serverAvailable = health.status === 200;
} catch {}

if (!serverAvailable) {
  console.log('  ○ Server not running — skipping integration tests');
  console.log('    (start with: node server.js)');
  skipped += 10;
} else {

  await test('GET /api/agents returns SSOT agent count', async () => {
    const res = await apiRequest('GET', '/api/agents');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(typeof res.body.count === 'number', 'count should be number');
    assert.ok(Array.isArray(res.body.agents), 'agents should be array');
    assert.strictEqual(res.body.ssot, 'agents_runtime.json', 'ssot should be agents_runtime.json');
  });

  await test('GET /api/agents count matches agents_runtime.json', async () => {
    const res = await apiRequest('GET', '/api/agents');
    const runtime = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'agents_runtime.json'), 'utf-8'));
    const expectedActive = runtime.agents.filter(a => a.status === 'active').length;
    assert.strictEqual(res.body.count, expectedActive, `Expected ${expectedActive}, got ${res.body.count}`);
  });

  await test('GET /api/insights returns computed insights', async () => {
    const res = await apiRequest('GET', '/api/insights');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.insights), 'insights should be array');
    assert.ok(res.body.computed_at, 'computed_at should exist');
  });

  await test('GET /api/momentum returns momentum data', async () => {
    const res = await apiRequest('GET', '/api/momentum');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.overall_progress === 'number');
    assert.ok(res.body.trend_emoji);
  });

  await test('GET /api/impact returns operator impact', async () => {
    const res = await apiRequest('GET', '/api/impact?horizon=today');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.influence_multiplier === 'number');
    assert.ok(res.body.week_stats);
  });

  await test('GET /api/opportunities returns discovery feed', async () => {
    const res = await apiRequest('GET', '/api/opportunities');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.opportunities));
  });

  await test('GET /api/venture-graph returns graph data', async () => {
    const res = await apiRequest('GET', '/api/venture-graph');
    assert.strictEqual(res.status, 200);
  });

  await test('GET /api/validate returns SSOT health', async () => {
    const res = await apiRequest('GET', '/api/validate');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.healthy === 'boolean');
    assert.ok(res.body.validated_at);
  });

  await test('POST /api/commands/pause/:id — unknown venture returns 400', async () => {
    const res = await apiRequest('POST', '/api/commands/pause/definitely-nonexistent-xyz', {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  await test('POST /api/commands/spawn-workstream — missing fields returns 400', async () => {
    const res = await apiRequest('POST', '/api/commands/spawn-workstream', { venture_id: 'test' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

}

// ─────────────────────────────────────────────────────────────────────────────
// SSOT AUDIT
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n═══ SSOT Audit ═══\n');

await test('agents_runtime.json exists and has agents array', async () => {
  const filePath = path.join(DATA_ROOT, 'agents_runtime.json');
  assert.ok(fs.existsSync(filePath), 'agents_runtime.json missing');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  assert.ok(Array.isArray(data.agents), 'agents should be array');
  assert.ok(data.agents.length > 0, 'Should have at least one agent');
});

await test('venture_relationships.json exists and has ventures', async () => {
  const filePath = path.join(DATA_ROOT, 'venture_relationships.json');
  assert.ok(fs.existsSync(filePath), 'venture_relationships.json missing');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  assert.ok(Array.isArray(data.ventures) || typeof data.ventures !== 'undefined', 'ventures should exist');
});

await test('system_insights.json is valid JSON', async () => {
  const filePath = path.join(DATA_ROOT, 'system_insights.json');
  assert.ok(fs.existsSync(filePath), 'system_insights.json missing');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  assert.ok(Array.isArray(data.insights), 'insights should be array');
});

await test('All SSOT files have valid JSON (no corrupt files)', async () => {
  const files = [
    'agents_runtime.json',
    'venture_relationships.json',
    'system_insights.json',
    'agent_activity.json',
    'venture_scoreboard.json'
  ];
  files.forEach(f => {
    const fp = path.join(DATA_ROOT, f);
    if (!fs.existsSync(fp)) return; // optional files
    const raw = fs.readFileSync(fp, 'utf-8');
    JSON.parse(raw); // throws if invalid
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
console.log(`  Results: ${passed} passed  ${failed} failed  ${skipped} skipped`);
console.log(`${'═'.repeat(60)}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✓ All tests passed!\n');
  process.exit(0);
}

} // end runTests()

runTests().catch(err => { console.error('Test runner error:', err); process.exit(1); });
