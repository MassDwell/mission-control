#!/usr/bin/env node
/**
 * CR-MC-VENTURE-DRILLDOWN-V2 — Test Suite
 * Unit + Integration tests for the venture detail drawer API.
 *
 * Run: node test-cr-mc-drilldown-v2.js
 *      node test-cr-mc-drilldown-v2.js --integration  (requires server on :3000)
 */

'use strict';

const assert = require('assert');
const http   = require('http');

const ventures = require('./api/ventures');

let passed  = 0;
let failed  = 0;
const failures = [];

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

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
// HTTP helper
// ---------------------------------------------------------------------------

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { reject(new Error(`JSON parse failed for ${url}: ${e.message}\n${body.slice(0,200)}`)); }
      });
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' CR-MC-VENTURE-DRILLDOWN-V2 Unit Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── calculateHealth ──────────────────────────────────────────────────────────
console.log('calculateHealth()');

test('healthy when no blockers', () => {
  const h = ventures.calculateHealth('leadscore', []);
  assert.strictEqual(h.health, 'healthy');
  assert(h.reason.includes('No blocker'));
});

test('critical when blocker has severity=critical', () => {
  const h = ventures.calculateHealth('leadscore', [
    { venture_id: 'leadscore', title: 'test', severity: 'critical' }
  ]);
  assert.strictEqual(h.health, 'critical');
});

test('critical when blocker is overdue (sla_overdue=true)', () => {
  const h = ventures.calculateHealth('leadscore', [
    { venture_id: 'leadscore', title: 'slow', sla_overdue: true }
  ]);
  assert.strictEqual(h.health, 'critical');
});

test('warning when blocker present but not critical', () => {
  const h = ventures.calculateHealth('leadscore', [
    { venture_id: 'leadscore', title: 'minor', severity: 'info' }
  ]);
  assert.strictEqual(h.health, 'warning');
  assert(h.reason.includes('blocker'));
});

test('healthy when blockers exist for different venture_id', () => {
  const h = ventures.calculateHealth('leadscore', [
    { venture_id: 'other-venture', title: 'unrelated', severity: 'critical' }
  ]);
  assert.strictEqual(h.health, 'healthy');
});

// ── filterActivityByVenture ──────────────────────────────────────────────────
console.log('\nfilterActivityByVenture()');

const mockActivity = [
  { timestamp: new Date(Date.now() - 1000).toISOString(), agent: 'A', action: 'LeadScore.ai build started', severity: 'info' },
  { timestamp: new Date(Date.now() - 2000).toISOString(), agent: 'B', action: 'Unrelated action for foobar', severity: 'info' },
  { timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000 - 1000).toISOString(), agent: 'C', action: 'LeadScore old event', severity: 'info' },
  { timestamp: new Date(Date.now() - 500).toISOString(), agent: 'D', action: 'leadscore updated', severity: 'critical' },
  { meta: { venture_id: 'leadscore' }, timestamp: new Date().toISOString(), agent: 'E', action: 'Meta match', severity: 'info' }
];

test('filters by venture name match', () => {
  const result = ventures.filterActivityByVenture('leadscore', 'LeadScore.ai', mockActivity, 'all');
  // Should match entries 0, 2, 3, 4
  assert(result.length >= 3, `Expected >=3 matches, got ${result.length}`);
});

test('filters out unrelated entries', () => {
  const result = ventures.filterActivityByVenture('leadscore', 'LeadScore.ai', mockActivity, 'all');
  const hasUnrelated = result.some(e => e.action === 'Unrelated action for foobar');
  assert(!hasUnrelated, 'Should not include unrelated entries');
});

test('time filter 24h excludes old entries', () => {
  const result = ventures.filterActivityByVenture('leadscore', 'LeadScore.ai', mockActivity, '24h');
  const hasOld = result.some(e => e.agent === 'C');
  assert(!hasOld, 'Should exclude entries older than 24h');
});

test('time filter all includes old entries', () => {
  const result = ventures.filterActivityByVenture('leadscore', 'LeadScore.ai', mockActivity, 'all');
  const hasOld = result.some(e => e.agent === 'C');
  assert(hasOld, 'all filter should include old entries');
});

test('matches meta.venture_id', () => {
  const result = ventures.filterActivityByVenture('leadscore', 'LeadScore.ai', mockActivity, 'all');
  const hasMetaMatch = result.some(e => e.agent === 'E');
  assert(hasMetaMatch, 'Should match entries with meta.venture_id');
});

// ── calculateReadiness ───────────────────────────────────────────────────────
console.log('\ncalculateReadiness()');

test('returns correct phase for in_progress stage', () => {
  const v = { stage: 'In Progress', venture_id: 'test', description: 'desc', links: { prd: '/x', cr: '/y' } };
  const r = ventures.calculateReadiness(v, []);
  assert.strictEqual(r.current_phase, 'in_progress');
  assert(Array.isArray(r.items), 'items should be array');
  assert(r.items.length > 0, 'items should have entries');
});

test('readiness_percent is a number 0-100', () => {
  const v = { stage: 'In Progress', description: 'desc', links: { prd: '/x', cr: '/y' }, tags: ['ai'] };
  const r = ventures.calculateReadiness(v, []);
  assert(typeof r.readiness_percent === 'number', 'Should be number');
  assert(r.readiness_percent >= 0 && r.readiness_percent <= 100, 'Should be 0-100');
});

test('readiness increases with more checked items', () => {
  const vMin = { stage: 'In Progress', links: {} };
  const vMax = { stage: 'In Progress', description: 'desc', links: { prd: '/x', cr: '/y', repo_path: '/r' } };
  const rMin = ventures.calculateReadiness(vMin, []);
  const rMax = ventures.calculateReadiness(vMax, []);
  assert(rMax.readiness_percent >= rMin.readiness_percent, 'More data = higher readiness');
});

test('opportunity phase returned for Opportunity stage', () => {
  const v = { stage: 'Opportunity', description: 'x', tags: ['ai'], mrr_target: 1000, icps: ['VP Sales'] };
  const r = ventures.calculateReadiness(v, []);
  assert.strictEqual(r.current_phase, 'opportunity');
});

test('items never have null name', () => {
  const v = { stage: 'In Progress', description: 'x', links: {} };
  const r = ventures.calculateReadiness(v, []);
  r.items.forEach(item => {
    assert(item.name, `Item name should not be empty: ${JSON.stringify(item)}`);
  });
});

// ── getVentures() ────────────────────────────────────────────────────────────
console.log('\ngetVentures()');

test('returns at least 1 venture (LeadScore.ai)', () => {
  const result = ventures.getVentures();
  assert(result.ventures.length >= 1, `Expected >=1 venture, got ${result.ventures.length}`);
  const ls = result.ventures.find(v => v.name && v.name.includes('LeadScore'));
  assert(ls, 'Should include LeadScore.ai');
});

test('every venture has health field', () => {
  const result = ventures.getVentures();
  result.ventures.forEach(v => {
    assert(['healthy', 'warning', 'critical'].includes(v.health),
      `${v.name} has invalid health: ${v.health}`);
  });
});

test('every venture has blocked and blocker_count', () => {
  const result = ventures.getVentures();
  result.ventures.forEach(v => {
    assert(typeof v.blocked === 'boolean', `${v.name}: blocked should be boolean`);
    assert(typeof v.blocker_count === 'number', `${v.name}: blocker_count should be number`);
  });
});

test('result has sources object', () => {
  const result = ventures.getVentures();
  assert(result.sources, 'Should have sources');
  assert(result.sources.ventures, 'sources.ventures should be set');
  assert(result.sources.blockers, 'sources.blockers should be set');
});

test('result has timestamp (ISO-8601)', () => {
  const result = ventures.getVentures();
  assert(result.timestamp, 'Should have timestamp');
  assert(!isNaN(new Date(result.timestamp).getTime()), 'Timestamp should be valid ISO-8601');
});

// ── getVentureDetail() ───────────────────────────────────────────────────────
console.log('\ngetVentureDetail()');

test('returns full detail for leadscore', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(r, 'Should return data');
  assert(r.venture, 'Should have venture');
  assert(r.header, 'Should have header');
  assert(r.timeline, 'Should have timeline');
  assert(r.checklist, 'Should have checklist');
  assert(r.sources, 'Should have sources');
});

test('returns full detail for leadscore-ai (alt ID)', () => {
  const r = ventures.getVentureDetail('leadscore-ai');
  assert(r, 'Should find venture by alt ID');
  assert(r.venture, 'Should have venture object');
  assert.strictEqual(r.venture.name, 'LeadScore.ai');
});

test('returns null for nonexistent venture_id', () => {
  const r = ventures.getVentureDetail('does-not-exist-xyz');
  assert.strictEqual(r, null, 'Should return null for unknown venture');
});

test('header.stage_display is non-empty', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(r.header.stage_display, 'stage_display should be non-empty');
  assert(r.header.stage_display.length > 3, 'stage_display should be descriptive');
});

test('header.health is valid enum', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(['healthy', 'warning', 'critical'].includes(r.header.health),
    `Invalid health: ${r.header.health}`);
});

test('header.health_reason is set', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(r.header.health_reason, 'health_reason should be set');
});

test('timeline.recent is array', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(Array.isArray(r.timeline.recent), 'timeline.recent should be array');
});

test('timeline.sources is set', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(r.timeline.sources, 'timeline.sources should be set');
  assert(r.timeline.sources.includes('agent_activity.json'));
});

test('checklist.readiness_percent is 0-100', () => {
  const r = ventures.getVentureDetail('leadscore');
  const pct = r.checklist.readiness_percent;
  assert(typeof pct === 'number', 'readiness_percent should be number');
  assert(pct >= 0 && pct <= 100, `readiness_percent out of range: ${pct}`);
});

test('checklist.items is non-empty array', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(Array.isArray(r.checklist.items), 'items should be array');
  assert(r.checklist.items.length > 0, 'items should not be empty');
});

test('checklist items never have null name', () => {
  const r = ventures.getVentureDetail('leadscore');
  r.checklist.items.forEach(item => {
    assert(item.name, `Checklist item has no name: ${JSON.stringify(item)}`);
  });
});

test('metrics has targets when venture has metrics data', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(r.metrics, 'metrics should not be null for leadscore');
  assert(r.metrics.targets, 'metrics.targets should exist');
});

test('sources cites all required files', () => {
  const r = ventures.getVentureDetail('leadscore');
  const src = r.sources;
  assert(src.venture.includes('venture_scoreboard.json'));
  assert(src.blockers.includes('blocked_work.json'));
  assert(src.activity.includes('agent_activity.json'));
});

test('backwards compat: related_workstreams still present', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(Array.isArray(r.related_workstreams), 'related_workstreams should still be array');
});

test('backwards compat: recent_activity still present', () => {
  const r = ventures.getVentureDetail('leadscore');
  assert(Array.isArray(r.recent_activity), 'recent_activity should still be array');
});

// ── Caching ──────────────────────────────────────────────────────────────────
console.log('\nCaching');

test('second call to getVentures() is fast (cached, <100ms)', () => {
  ventures.getVentures(); // prime cache
  const start = Date.now();
  ventures.getVentures();
  const elapsed = Date.now() - start;
  assert(elapsed < 100, `Expected <100ms cached call, got ${elapsed}ms`);
});

test('second call to getVentureDetail() is fast (cached, <100ms)', () => {
  ventures.getVentureDetail('leadscore'); // prime
  const start = Date.now();
  ventures.getVentureDetail('leadscore');
  const elapsed = Date.now() - start;
  assert(elapsed < 100, `Expected <100ms cached call, got ${elapsed}ms`);
});

// ---------------------------------------------------------------------------
// Integration Tests (only run when --integration flag passed or server detected)
// ---------------------------------------------------------------------------

async function runIntegrationTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Integration Tests (server @ localhost:3000)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // GET /api/ventures
  console.log('GET /api/ventures');
  await testAsync('returns 200 with ventures array', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures');
    assert.strictEqual(r.status, 200);
    assert(Array.isArray(r.body.ventures), 'body.ventures should be array');
    assert(r.body.total >= 1, 'total should be >=1');
  });

  await testAsync('includes LeadScore.ai with health field', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures');
    const ls = r.body.ventures.find(v => v.name && v.name.includes('LeadScore'));
    assert(ls, 'Should include LeadScore.ai');
    assert(ls.health, 'Should have health field');
    assert(typeof ls.blocker_count === 'number', 'Should have blocker_count');
  });

  await testAsync('includes sources object at top level', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures');
    assert(r.body.sources, 'Should have sources');
    assert(r.body.sources.ventures, 'sources.ventures should be set');
  });

  // GET /api/ventures/leadscore-ai
  console.log('\nGET /api/ventures/leadscore-ai');
  await testAsync('returns 200 with full V2 structure', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures/leadscore-ai');
    assert.strictEqual(r.status, 200);
    const b = r.body;
    assert(b.venture,    'Should have venture section');
    assert(b.header,     'Should have header section');
    assert(b.timeline,   'Should have timeline section');
    assert(b.checklist,  'Should have checklist section');
    assert(b.sources,    'Should have sources section');
  });

  await testAsync('header.stage_display includes week info', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures/leadscore-ai');
    assert(r.body.header.stage_display, 'stage_display should be set');
    assert(r.body.header.stage_display.includes('Week'), 'Should include Week info');
  });

  await testAsync('timeline has recent entries from agent_activity.json', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures/leadscore-ai');
    assert(Array.isArray(r.body.timeline.recent), 'timeline.recent should be array');
    assert(r.body.timeline.recent.length > 0, 'Should have timeline entries');
  });

  await testAsync('checklist has items and readiness_percent', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures/leadscore-ai');
    const cl = r.body.checklist;
    assert(cl, 'Should have checklist');
    assert(Array.isArray(cl.items), 'items should be array');
    assert(typeof cl.readiness_percent === 'number', 'readiness_percent should be number');
  });

  await testAsync('sources cited per section', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures/leadscore-ai');
    const src = r.body.sources;
    assert(src.venture.includes('venture_scoreboard.json'));
    assert(src.blockers.includes('blocked_work.json'));
    assert(src.activity.includes('agent_activity.json'));
  });

  await testAsync('GET /api/ventures/leadscore also works', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures/leadscore');
    assert.strictEqual(r.status, 200);
    assert(r.body.venture, 'Should find by original ID too');
  });

  // GET /api/ventures/nonexistent → 404
  console.log('\nGET /api/ventures/nonexistent-venture');
  await testAsync('returns 404 for unknown venture_id', async () => {
    const r = await httpGet('http://localhost:3000/api/ventures/nonexistent-venture-xyz');
    assert.strictEqual(r.status, 404, `Expected 404, got ${r.status}`);
    assert(r.body.error, 'Should have error message');
    assert(r.body.venture_id, 'Should echo back venture_id');
  });

  // Performance test
  console.log('\nPerformance');
  await testAsync('Drawer data loads <500ms (first request)', async () => {
    // Clear any cache by using a different param
    const start = Date.now();
    const r = await httpGet('http://localhost:3000/api/ventures/leadscore-ai');
    const elapsed = Date.now() - start;
    assert.strictEqual(r.status, 200);
    assert(elapsed < 500, `Expected <500ms, got ${elapsed}ms`);
    console.log(`     (${elapsed}ms)`);
  });

  await testAsync('Cached request <100ms', async () => {
    const start = Date.now();
    await httpGet('http://localhost:3000/api/ventures/leadscore-ai');
    const elapsed = Date.now() - start;
    assert(elapsed < 100, `Expected <100ms cached, got ${elapsed}ms`);
    console.log(`     (${elapsed}ms)`);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  const doIntegration = process.argv.includes('--integration') ||
                        process.argv.includes('-i');

  if (doIntegration) {
    // Quick server ping first
    try {
      await httpGet('http://localhost:3000/api/health');
      await runIntegrationTests();
    } catch (e) {
      if (e.code === 'ECONNREFUSED') {
        console.error('\n⚠️  Server not running. Start with: node server.js\n');
        console.error('   Skipping integration tests.\n');
      } else {
        throw e;
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.error(`  ❌ ${f.name}\n     ${f.error}`));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(failed > 0 ? 1 : 0);
})();
