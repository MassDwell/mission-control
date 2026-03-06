#!/usr/bin/env node
/**
 * CR-MC-UI-1.2 Phase 1 Tests
 * Unit + integration tests for the venture pipeline API
 *
 * Run: node test-cr-mc-ui-1.2.js
 *
 * Covers:
 *  Unit:
 *    - Data parsing (load venture_scoreboard.json + validate schema)
 *    - Search filter ("leadscore" matches ventures)
 *    - Status filter (active/paused/killed/launched)
 *    - Blockers lookup
 *    - Activity lookup (last 10)
 *  Integration (requires server running on localhost:3000):
 *    - GET /api/ventures        — shape + filters
 *    - GET /api/ventures/stage/:stage
 *    - GET /api/ventures/:venture_id
 *    - GET /api/stages
 *    - Error cases (404, etc.)
 */

'use strict';

const assert = require('assert');
const http = require('http');
const path = require('path');

// Load the module under test directly
const ventures = require('./api/ventures');

// ---------------------------------------------------------------------------
// Minimal test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failures.push({ name, error: err.message });
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failures.push({ name, error: err.message });
    failed++;
  }
}

// ---------------------------------------------------------------------------
// HTTP helper for integration tests
// ---------------------------------------------------------------------------

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}\nBody: ${body}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`HTTP request failed: ${err.message}`));
    });
  });
}

// ---------------------------------------------------------------------------
// UNIT TESTS
// ---------------------------------------------------------------------------

console.log('\n=== UNIT TESTS ===\n');

// --- Data parsing ---
console.log('--- Data Parsing ---');

test('loadScoreboard: returns object with ventures array', () => {
  const scoreboard = ventures._loadScoreboard();
  assert.ok(scoreboard, 'scoreboard is truthy');
  assert.ok(Array.isArray(scoreboard.ventures), 'ventures is array');
  assert.ok(Array.isArray(scoreboard.stage_order), 'stage_order is array');
});

test('loadScoreboard: at least one venture exists', () => {
  const scoreboard = ventures._loadScoreboard();
  assert.ok(scoreboard.ventures.length >= 1, `Expected >= 1 venture, got ${scoreboard.ventures.length}`);
});

test('loadScoreboard: ventures have required fields', () => {
  const scoreboard = ventures._loadScoreboard();
  const required = ['venture_id', 'name', 'stage', 'status'];
  for (const v of scoreboard.ventures) {
    for (const field of required) {
      assert.ok(v[field] !== undefined, `Venture missing field: ${field} (venture: ${v.venture_id || '?'})`);
    }
  }
});

test('loadScoreboard: leadscore venture has links', () => {
  const scoreboard = ventures._loadScoreboard();
  const ls = scoreboard.ventures.find(v => v.venture_id === 'leadscore');
  assert.ok(ls, 'leadscore venture not found');
  assert.ok(ls.links, 'leadscore missing links');
  assert.ok(ls.links.prd, 'leadscore missing prd link');
  assert.ok(ls.links.repo_path, 'leadscore missing repo_path');
});

// --- Search filter ---
console.log('\n--- Search Filter ---');

test('matchesSearch: "leadscore" matches LeadScore.ai by venture_id', () => {
  const scoreboard = ventures._loadScoreboard();
  const ls = scoreboard.ventures.find(v => v.venture_id === 'leadscore');
  assert.ok(ls, 'leadscore not in scoreboard');
  assert.ok(ventures._matchesSearch(ls, 'leadscore'), 'should match on venture_id');
});

test('matchesSearch: "LeadScore" matches case-insensitively on name', () => {
  const v = { venture_id: 'ls', name: 'LeadScore.ai', description: 'test', tags: [] };
  assert.ok(ventures._matchesSearch(v, 'leadscore'), 'case-insensitive name match');
  assert.ok(ventures._matchesSearch(v, 'LEADSCORE'), 'uppercase also matches');
});

test('matchesSearch: "SaaS" matches via tags', () => {
  const v = { venture_id: 'ls', name: 'Test', description: '', tags: ['AI', 'SaaS'] };
  assert.ok(ventures._matchesSearch(v, 'saas'), 'should match in tags');
});

test('matchesSearch: empty query matches everything', () => {
  const v = { venture_id: 'x', name: 'Y', description: 'z', tags: [] };
  assert.ok(ventures._matchesSearch(v, ''), 'empty query always matches');
  assert.ok(ventures._matchesSearch(v, null), 'null query always matches');
  assert.ok(ventures._matchesSearch(v, undefined), 'undefined query always matches');
});

test('matchesSearch: non-matching query returns false', () => {
  const v = { venture_id: 'ls', name: 'LeadScore.ai', description: 'AI lead qual', tags: ['AI'] };
  assert.ok(!ventures._matchesSearch(v, 'zxqplmno'), 'random string should not match');
});

test('queryVentures: search="leadscore" returns at least 1 result', () => {
  const result = ventures.queryVentures({ search: 'leadscore' });
  assert.ok(result.total >= 1, `Expected >= 1, got ${result.total}`);
  assert.ok(result.ventures.some(v => v.venture_id === 'leadscore'), 'leadscore not in results');
});

// --- Status filter ---
console.log('\n--- Status Filter ---');

test('queryVentures: status=active returns only active ventures', () => {
  const result = ventures.queryVentures({ status: 'active' });
  for (const v of result.ventures) {
    assert.strictEqual(v.status, 'active', `Non-active venture in results: ${v.venture_id}`);
  }
});

test('queryVentures: status=paused returns only paused ventures', () => {
  const result = ventures.queryVentures({ status: 'paused' });
  for (const v of result.ventures) {
    assert.strictEqual(v.status, 'paused', `Non-paused venture: ${v.venture_id}`);
  }
});

test('queryVentures: status=killed returns only killed ventures', () => {
  const result = ventures.queryVentures({ status: 'killed' });
  for (const v of result.ventures) {
    assert.strictEqual(v.status, 'killed', `Non-killed venture: ${v.venture_id}`);
  }
});

test('queryVentures: status=launched returns only launched ventures', () => {
  const result = ventures.queryVentures({ status: 'launched' });
  for (const v of result.ventures) {
    assert.strictEqual(v.status, 'launched', `Non-launched venture: ${v.venture_id}`);
  }
});

test('queryVentures: no filters returns all ventures', () => {
  const scoreboard = ventures._loadScoreboard();
  const result = ventures.queryVentures({});
  assert.strictEqual(result.total, scoreboard.ventures.length, 'Unfiltered should return all');
});

// --- Sort ---
console.log('\n--- Sort ---');

test('applySort: name_asc sorts alphabetically', () => {
  const arr = [{ name: 'Zebra' }, { name: 'Apple' }, { name: 'Mango' }];
  ventures._applySort(arr, 'name_asc');
  assert.strictEqual(arr[0].name, 'Apple');
  assert.strictEqual(arr[2].name, 'Zebra');
});

test('applySort: mrr_desc sorts by mrr descending', () => {
  const arr = [{ mrr: 100 }, { mrr: 5000 }, { mrr: 0 }];
  ventures._applySort(arr, 'mrr_desc');
  assert.strictEqual(arr[0].mrr, 5000);
  assert.strictEqual(arr[2].mrr, 0);
});

test('applySort: priority_high puts high before medium before low', () => {
  const arr = [
    { priority: 'low', name: 'C' },
    { priority: 'high', name: 'A' },
    { priority: 'medium', name: 'B' }
  ];
  ventures._applySort(arr, 'priority_high');
  assert.strictEqual(arr[0].priority, 'high');
  assert.strictEqual(arr[1].priority, 'medium');
  assert.strictEqual(arr[2].priority, 'low');
});

// --- Blockers lookup ---
console.log('\n--- Blockers Lookup ---');

test('getBlockers: returns array (even if empty)', () => {
  const blockers = ventures._getBlockers('leadscore');
  assert.ok(Array.isArray(blockers), 'blockers should be array');
});

test('getBlockers: each blocker has expected shape', () => {
  const blockers = ventures._getBlockers('leadscore');
  for (const b of blockers) {
    assert.ok('blocker_id' in b, 'missing blocker_id');
    assert.ok('title' in b, 'missing title');
    assert.ok('status' in b, 'missing status');
    assert.ok('target_resolution' in b, 'missing target_resolution');
  }
});

// --- Activity lookup ---
console.log('\n--- Activity Lookup ---');

test('getRecentActivity: returns array', () => {
  const activity = ventures._getRecentActivity('leadscore', 'LeadScore.ai');
  assert.ok(Array.isArray(activity), 'activity should be array');
});

test('getRecentActivity: returns at most 10 items', () => {
  const activity = ventures._getRecentActivity('leadscore', 'LeadScore.ai');
  assert.ok(activity.length <= 10, `Expected <= 10 items, got ${activity.length}`);
});

test('getRecentActivity: items have expected fields', () => {
  const activity = ventures._getRecentActivity('leadscore', 'LeadScore.ai');
  for (const a of activity) {
    assert.ok('timestamp' in a, 'missing timestamp');
    assert.ok('agent' in a, 'missing agent');
    assert.ok('action' in a, 'missing action');
    assert.ok('severity' in a, 'missing severity');
  }
});

// --- Related workstreams ---
console.log('\n--- Related Workstreams ---');

test('getRelatedWorkstreams: returns array', () => {
  const ws = ventures._getRelatedWorkstreams('leadscore');
  assert.ok(Array.isArray(ws), 'workstreams should be array');
});

// --- Summary shape ---
console.log('\n--- Response Shape ---');

test('queryVentures: response has timestamp, ventures, total, filters_applied', () => {
  const result = ventures.queryVentures({});
  assert.ok(result.timestamp, 'missing timestamp');
  assert.ok(Array.isArray(result.ventures), 'missing ventures array');
  assert.ok(typeof result.total === 'number', 'total should be number');
  assert.ok(result.filters_applied, 'missing filters_applied');
});

test('getVenturesByStage: response has stage, count, ventures', () => {
  const result = ventures.getVenturesByStage('In Progress');
  assert.ok(result.stage === 'In Progress', 'stage field wrong');
  assert.ok(typeof result.count === 'number', 'count should be number');
  assert.ok(Array.isArray(result.ventures), 'ventures should be array');
  assert.strictEqual(result.count, result.ventures.length, 'count should match ventures.length');
});

test('getVentureDetail: leadscore returns full object', () => {
  const result = ventures.getVentureDetail('leadscore');
  assert.ok(result, 'result should not be null');
  assert.ok(result.venture, 'missing venture');
  assert.ok(Array.isArray(result.related_workstreams), 'missing related_workstreams');
  assert.ok(Array.isArray(result.blockers), 'missing blockers');
  assert.ok(Array.isArray(result.recent_activity), 'missing recent_activity');
  assert.ok(result.timestamp, 'missing timestamp');
});

test('getVentureDetail: returns null for nonexistent venture', () => {
  const result = ventures.getVentureDetail('__nonexistent_venture_xyz__');
  assert.strictEqual(result, null, 'should return null for missing venture');
});

test('getStages: response has stages array', () => {
  const result = ventures.getStages();
  assert.ok(Array.isArray(result.stages), 'stages should be array');
  assert.ok(result.stages.length >= 1, 'should have at least 1 stage');
});

test('getStages: each stage has name, order, count, ventures', () => {
  const result = ventures.getStages();
  for (const s of result.stages) {
    assert.ok(typeof s.name === 'string', 'stage missing name');
    assert.ok(typeof s.order === 'number', 'stage missing order');
    assert.ok(typeof s.count === 'number', 'stage missing count');
    assert.ok(Array.isArray(s.ventures), 'stage missing ventures array');
  }
});

test('getStages: In Progress has leadscore', () => {
  const result = ventures.getStages();
  const inProgress = result.stages.find(s => s.name === 'In Progress');
  assert.ok(inProgress, '"In Progress" stage not found');
  assert.ok(inProgress.count >= 1, '"In Progress" should have >= 1 venture');
  assert.ok(inProgress.ventures.some(v => v.venture_id === 'leadscore'), 'leadscore not in In Progress');
});

// ---------------------------------------------------------------------------
// INTEGRATION TESTS (require server on localhost:3000)
// ---------------------------------------------------------------------------

async function runIntegrationTests() {
  console.log('\n=== INTEGRATION TESTS (server must be on localhost:3000) ===\n');

  // Check if server is up
  try {
    await httpGet('http://localhost:3000/api/health');
  } catch (err) {
    console.log('  ⚠️  Server not running on localhost:3000 — skipping integration tests');
    console.log('     Start server with: cd mission-control-ui && node server.js');
    return;
  }

  console.log('--- GET /api/ventures ---');

  await testAsync('/api/ventures returns 200 with expected keys', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures');
    assert.strictEqual(status, 200, `Expected 200, got ${status}`);
    assert.ok(body.timestamp, 'missing timestamp');
    assert.ok(Array.isArray(body.ventures), 'missing ventures array');
    assert.ok(typeof body.total === 'number', 'missing total');
    assert.ok(body.filters_applied, 'missing filters_applied');
  });

  await testAsync('/api/ventures includes leadscore', async () => {
    const { body } = await httpGet('http://localhost:3000/api/ventures');
    assert.ok(body.ventures.some(v => v.venture_id === 'leadscore'), 'leadscore not in response');
  });

  await testAsync('/api/ventures?search=leadscore filters correctly', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures?search=leadscore');
    assert.strictEqual(status, 200);
    assert.ok(body.total >= 1, 'Expected >= 1 result');
    assert.ok(body.ventures.every(v =>
      v.name.toLowerCase().includes('lead') ||
      v.venture_id.toLowerCase().includes('lead')
    ), 'Filtered results should relate to leadscore');
    assert.strictEqual(body.filters_applied.search, 'leadscore');
  });

  await testAsync('/api/ventures?status=active returns only active', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures?status=active');
    assert.strictEqual(status, 200);
    body.ventures.forEach(v => {
      assert.strictEqual(v.status, 'active', `Non-active venture: ${v.venture_id}`);
    });
    assert.strictEqual(body.filters_applied.status, 'active');
  });

  await testAsync('/api/ventures?sort=name_asc returns sorted by name', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures?sort=name_asc');
    assert.strictEqual(status, 200);
    const names = body.ventures.map(v => v.name.toLowerCase());
    for (let i = 1; i < names.length; i++) {
      assert.ok(names[i] >= names[i - 1], `Sort order broken at index ${i}`);
    }
  });

  console.log('\n--- GET /api/ventures/stage/:stage ---');

  await testAsync('/api/ventures/stage/In%20Progress returns 200 + ventures', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures/stage/In%20Progress');
    assert.strictEqual(status, 200, `Expected 200, got ${status}`);
    assert.strictEqual(body.stage, 'In Progress');
    assert.ok(typeof body.count === 'number');
    assert.ok(Array.isArray(body.ventures));
    assert.strictEqual(body.count, body.ventures.length);
  });

  await testAsync('/api/ventures/stage/In%20Progress contains leadscore', async () => {
    const { body } = await httpGet('http://localhost:3000/api/ventures/stage/In%20Progress');
    assert.ok(body.ventures.some(v => v.venture_id === 'leadscore'));
  });

  await testAsync('/api/ventures/stage/Opportunity returns empty array (no ventures)', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures/stage/Opportunity');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.count, 0);
    assert.deepStrictEqual(body.ventures, []);
  });

  console.log('\n--- GET /api/ventures/:venture_id ---');

  await testAsync('/api/ventures/leadscore returns 200 with full detail', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures/leadscore');
    assert.strictEqual(status, 200, `Expected 200, got ${status}`);
    assert.ok(body.venture, 'missing venture object');
    assert.strictEqual(body.venture.venture_id, 'leadscore');
    assert.ok(Array.isArray(body.related_workstreams), 'missing related_workstreams');
    assert.ok(Array.isArray(body.blockers), 'missing blockers');
    assert.ok(Array.isArray(body.recent_activity), 'missing recent_activity');
    assert.ok(body.timestamp, 'missing timestamp');
  });

  await testAsync('/api/ventures/leadscore has links', async () => {
    const { body } = await httpGet('http://localhost:3000/api/ventures/leadscore');
    assert.ok(body.venture.links, 'missing links');
    assert.ok(body.venture.links.prd, 'missing prd link');
  });

  await testAsync('/api/ventures/__nonexistent returns 404', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/ventures/__nonexistent_xyz__');
    assert.strictEqual(status, 404, `Expected 404, got ${status}`);
    assert.ok(body.error, 'missing error field');
    assert.ok(body.timestamp, 'missing timestamp');
  });

  console.log('\n--- GET /api/stages ---');

  await testAsync('/api/stages returns 200 with stages array', async () => {
    const { status, body } = await httpGet('http://localhost:3000/api/stages');
    assert.strictEqual(status, 200, `Expected 200, got ${status}`);
    assert.ok(body.timestamp, 'missing timestamp');
    assert.ok(Array.isArray(body.stages), 'missing stages array');
    assert.ok(body.stages.length >= 1);
  });

  await testAsync('/api/stages: In Progress has count >= 1', async () => {
    const { body } = await httpGet('http://localhost:3000/api/stages');
    const inProgress = body.stages.find(s => s.name === 'In Progress');
    assert.ok(inProgress, '"In Progress" not found in stages');
    assert.ok(inProgress.count >= 1, 'In Progress should have >= 1 venture');
  });

  await testAsync('/api/stages: all stages have required fields', async () => {
    const { body } = await httpGet('http://localhost:3000/api/stages');
    for (const s of body.stages) {
      assert.ok(typeof s.name === 'string', 'stage missing name');
      assert.ok(typeof s.order === 'number', 'stage missing order');
      assert.ok(typeof s.count === 'number', 'stage missing count');
      assert.ok(Array.isArray(s.ventures), 'stage missing ventures array');
    }
  });

  await testAsync('/api/stages: stages are in correct order', async () => {
    const { body } = await httpGet('http://localhost:3000/api/stages');
    const orders = body.stages.map(s => s.order);
    for (let i = 1; i < orders.length; i++) {
      assert.ok(orders[i] > orders[i - 1], `Stage order not ascending at index ${i}`);
    }
  });

  await testAsync('/api/stages: combined count matches /api/ventures total', async () => {
    const [stagesRes, venturesRes] = await Promise.all([
      httpGet('http://localhost:3000/api/stages'),
      httpGet('http://localhost:3000/api/ventures')
    ]);
    const stagesTotal = stagesRes.body.stages.reduce((sum, s) => sum + s.count, 0);
    const venturesTotal = venturesRes.body.total;
    assert.strictEqual(stagesTotal, venturesTotal, `Stage counts (${stagesTotal}) != ventures total (${venturesTotal})`);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('CR-MC-UI-1.2 Phase 1 Test Suite');
  console.log('================================');

  await runIntegrationTests();

  console.log('\n================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(`  ✗ ${f.name}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
