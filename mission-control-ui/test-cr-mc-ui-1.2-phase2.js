#!/usr/bin/env node
/**
 * CR-MC-UI-1.2 Phase 2: Test Suite
 * Tests for drilldown UI, keyboard nav, deep linking, quality gates
 * These are integration + quality tests (not browser automation)
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${urlPath}`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body, json: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body, json: null });
        }
      });
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// FILE EXISTENCE CHECKS
// ---------------------------------------------------------------------------

console.log('\n--- Phase 2 File Existence ---');

const publicDir = path.join(__dirname, 'public');

function checkFile(filename) {
  const fp = path.join(publicDir, filename);
  const exists = fs.existsSync(fp);
  const size = exists ? fs.statSync(fp).size : 0;
  assert(exists && size > 0, `${filename} exists and is non-empty`, `size=${size}`);
  return exists ? fs.readFileSync(fp, 'utf-8') : '';
}

const drilldownCss = checkFile('drilldown.css');
const drilldownJs = checkFile('drilldown.js');
const indexHtml = checkFile('index.html');
const scriptJs = checkFile('script.js');
const styleCss = checkFile('style.css');

// ---------------------------------------------------------------------------
// CSS CONTENT CHECKS
// ---------------------------------------------------------------------------

console.log('\n--- drilldown.css Content ---');

assert(drilldownCss.includes('.drilldown-drawer'), 'drilldown.css: .drilldown-drawer defined');
assert(drilldownCss.includes('.detail-drawer'), 'drilldown.css: .detail-drawer defined');
assert(drilldownCss.includes('.venture-row'), 'drilldown.css: .venture-row defined');
assert(drilldownCss.includes('.pipeline-stage.selected'), 'drilldown.css: .pipeline-stage.selected defined');
assert(drilldownCss.includes('transition'), 'drilldown.css: animations/transitions present');
assert(drilldownCss.includes('.status-active'), 'drilldown.css: status-active badge defined');
assert(drilldownCss.includes('.status-paused'), 'drilldown.css: status-paused badge defined');
assert(drilldownCss.includes('.status-killed'), 'drilldown.css: status-killed badge defined');
assert(drilldownCss.includes('.status-launched'), 'drilldown.css: status-launched badge defined');
assert(drilldownCss.includes('400px'), 'drilldown.css: 400px drilldown drawer width');
assert(drilldownCss.includes('.filter-btn'), 'drilldown.css: .filter-btn defined');
assert(drilldownCss.includes('.filter-btn.active'), 'drilldown.css: .filter-btn.active defined');

// ---------------------------------------------------------------------------
// JS CONTENT CHECKS
// ---------------------------------------------------------------------------

console.log('\n--- drilldown.js Content ---');

assert(drilldownJs.includes('openDrilldown'), 'drilldown.js: openDrilldown function');
assert(drilldownJs.includes('closeDrilldown'), 'drilldown.js: closeDrilldown function');
assert(drilldownJs.includes('openDetail'), 'drilldown.js: openDetail function');
assert(drilldownJs.includes('closeDetail'), 'drilldown.js: closeDetail function');
assert(drilldownJs.includes('handleKeyDown'), 'drilldown.js: handleKeyDown function');
assert(drilldownJs.includes('ArrowLeft'), 'drilldown.js: ArrowLeft keyboard handler');
assert(drilldownJs.includes('ArrowRight'), 'drilldown.js: ArrowRight keyboard handler');
assert(drilldownJs.includes('ArrowUp'), 'drilldown.js: ArrowUp keyboard handler');
assert(drilldownJs.includes('ArrowDown'), 'drilldown.js: ArrowDown keyboard handler');
assert(drilldownJs.includes("key === 'Escape'"), 'drilldown.js: Escape keyboard handler');
assert(drilldownJs.includes("key === '/'"), 'drilldown.js: / key search focus handler');
assert(drilldownJs.includes('isTypingInInput'), 'drilldown.js: isTypingInInput guard');
assert(drilldownJs.includes('updateHash'), 'drilldown.js: URL hash routing');
assert(drilldownJs.includes('parseHash'), 'drilldown.js: URL hash parser');
assert(drilldownJs.includes('handleDeepLink'), 'drilldown.js: deep link handler');
assert(drilldownJs.includes('applyFilters'), 'drilldown.js: filter logic');
assert(drilldownJs.includes('statusFilters'), 'drilldown.js: status filter state');
assert(drilldownJs.includes('ownerFilter'), 'drilldown.js: owner filter state');
assert(drilldownJs.includes('priorityFilters'), 'drilldown.js: priority filter state');
assert(drilldownJs.includes('sortOrder'), 'drilldown.js: sort order state');
assert(drilldownJs.includes('last_event_desc'), 'drilldown.js: sort by last event');
assert(drilldownJs.includes('name_asc'), 'drilldown.js: sort by name asc');
assert(drilldownJs.includes('mrr_desc'), 'drilldown.js: sort by MRR desc');
assert(drilldownJs.includes('throttledLogDrilldownOpen'), 'drilldown.js: throttled activity logging');
assert(drilldownJs.includes('lastDrilldownLog'), 'drilldown.js: log throttle state');
assert(drilldownJs.includes('fuzzyMatch'), 'drilldown.js: fuzzy text search');
assert(drilldownJs.includes('navigateDetail'), 'drilldown.js: prev/next venture navigation');
assert(drilldownJs.includes('MissionControlDrilldown'), 'drilldown.js: exports MissionControlDrilldown');
assert(drilldownJs.includes('copyToClipboard'), 'drilldown.js: copy to clipboard');
assert(drilldownJs.includes('debounce'), 'drilldown.js: debounce for nav');
assert(!drilldownJs.includes('supabase'), 'drilldown.js: no Supabase dependency');

// ---------------------------------------------------------------------------
// HTML CONTENT CHECKS
// ---------------------------------------------------------------------------

console.log('\n--- index.html Content ---');

assert(indexHtml.includes('drilldown-overlay'), 'index.html: drilldown-overlay div');
assert(indexHtml.includes('drilldown-drawer'), 'index.html: drilldown-drawer div');
assert(indexHtml.includes('detail-overlay'), 'index.html: detail-overlay div');
assert(indexHtml.includes('detail-drawer'), 'index.html: detail-drawer div');
assert(indexHtml.includes('dd-stage-title'), 'index.html: drilldown stage title element');
assert(indexHtml.includes('dd-venture-list'), 'index.html: venture list element');
assert(indexHtml.includes('dd-search'), 'index.html: search input');
assert(indexHtml.includes('dd-status-filters'), 'index.html: status filter buttons');
assert(indexHtml.includes('dd-owner-filters'), 'index.html: owner filter buttons');
assert(indexHtml.includes('dd-priority-filters'), 'index.html: priority filter buttons');
assert(indexHtml.includes('dd-sort-select'), 'index.html: sort dropdown');
assert(indexHtml.includes('detail-content'), 'index.html: detail content area');
assert(indexHtml.includes('detail-nav-prev'), 'index.html: prev nav button');
assert(indexHtml.includes('detail-nav-next'), 'index.html: next nav button');
assert(indexHtml.includes('drilldown.css'), 'index.html: links drilldown.css');
assert(indexHtml.includes('drilldown.js'), 'index.html: loads drilldown.js');

// ---------------------------------------------------------------------------
// SCRIPT.JS INTEGRATION CHECKS
// ---------------------------------------------------------------------------

console.log('\n--- script.js Integration ---');

assert(scriptJs.includes('renderVenturePipeline'), 'script.js: renderVenturePipeline function');
assert(scriptJs.includes('/api/stages'), 'script.js: fetches /api/stages');
assert(scriptJs.includes('MissionControlDrilldown'), 'script.js: references MissionControlDrilldown');
assert(scriptJs.includes('MissionControlDrilldown.init'), 'script.js: calls drilldown init');
assert(scriptJs.includes("await renderVenturePipeline"), 'script.js: awaits pipeline render');

// ---------------------------------------------------------------------------
// QUALITY GATES
// ---------------------------------------------------------------------------

console.log('\n--- Quality Gates ---');

assert(!drilldownJs.includes('supabase'), 'No Supabase in drilldown.js');
assert(!scriptJs.includes('supabase'), 'No Supabase in script.js');
assert(!drilldownCss.includes('!important'), 'No !important overrides in drilldown.css');

// Check SSOT files are unchanged
const ssotDir = path.join(process.env.HOME, '.openclaw/workspace/data/mission-control');
const scoreboardPath = path.join(ssotDir, 'venture_scoreboard.json');
if (fs.existsSync(scoreboardPath)) {
  const scoreboard = JSON.parse(fs.readFileSync(scoreboardPath, 'utf-8'));
  assert(Array.isArray(scoreboard.ventures), 'venture_scoreboard.json: still has ventures array');
  assert(scoreboard.ventures.length >= 1, 'venture_scoreboard.json: still has >= 1 venture');
  assert(scoreboard.ventures[0].venture_id === 'leadscore', 'venture_scoreboard.json: leadscore venture intact');
}

// ---------------------------------------------------------------------------
// API INTEGRATION TESTS (live server)
// ---------------------------------------------------------------------------

console.log('\n--- API Integration ---');

async function runApiTests() {
  // 1. /api/stages returns correct structure
  const stages = await httpGet('/api/stages');
  assert(stages.status === 200, '/api/stages: returns 200');
  assert(Array.isArray(stages.json.stages), '/api/stages: has stages array');
  assert(stages.json.stages.length === 8, '/api/stages: 8 stages total');

  const inProgress = stages.json.stages.find(s => s.name === 'In Progress');
  assert(inProgress && inProgress.count >= 1, '/api/stages: In Progress has >= 1 venture');

  // 2. /api/ventures with stage filter
  const venturesByStage = await httpGet('/api/ventures?stage=In%20Progress');
  assert(venturesByStage.status === 200, '/api/ventures?stage=In%20Progress: returns 200');
  assert(venturesByStage.json.ventures.length >= 1, '/api/ventures?stage: returns ventures');

  // 3. /api/ventures with search filter
  const ventureSearch = await httpGet('/api/ventures?search=leadscore');
  assert(ventureSearch.status === 200, '/api/ventures?search=leadscore: returns 200');
  assert(ventureSearch.json.ventures.some(v => v.venture_id === 'leadscore'),
    '/api/ventures?search=leadscore: finds LeadScore.ai');

  // 4. /api/ventures?search=score fuzzy match
  const ventureSearchFuzzy = await httpGet('/api/ventures?search=score');
  assert(ventureSearchFuzzy.json.ventures.some(v => v.venture_id === 'leadscore'),
    '/api/ventures?search=score: fuzzy match finds leadscore');

  // 5. /api/ventures with status filter
  const ventureActive = await httpGet('/api/ventures?status=active');
  assert(ventureActive.status === 200, '/api/ventures?status=active: returns 200');
  assert(ventureActive.json.ventures.every(v => v.status === 'active'),
    '/api/ventures?status=active: all returned are active');

  // 6. /api/ventures sort by name_asc
  const ventureSorted = await httpGet('/api/ventures?sort=name_asc');
  assert(ventureSorted.status === 200, '/api/ventures?sort=name_asc: returns 200');

  // 7. /api/ventures sort by mrr_desc
  const ventureMrr = await httpGet('/api/ventures?sort=mrr_desc');
  assert(ventureMrr.status === 200, '/api/ventures?sort=mrr_desc: returns 200');

  // 8. Detail endpoint
  const detail = await httpGet('/api/ventures/leadscore');
  assert(detail.status === 200, '/api/ventures/leadscore: returns 200');
  assert(detail.json.venture.venture_id === 'leadscore', 'detail: venture_id matches');
  assert(detail.json.venture.name === 'LeadScore.ai', 'detail: name correct');
  assert(detail.json.venture.links, 'detail: has links');
  assert(detail.json.venture.links.prd, 'detail: has PRD link');
  assert(detail.json.venture.links.cr, 'detail: has CR link');
  assert(detail.json.venture.links.repo_path, 'detail: has repo_path');
  assert(detail.json.venture.metrics, 'detail: has metrics');
  assert(detail.json.venture.metrics.accuracy_target, 'detail: has accuracy_target metric');
  assert(Array.isArray(detail.json.related_workstreams), 'detail: related_workstreams is array');
  assert(Array.isArray(detail.json.blockers), 'detail: blockers is array');
  assert(Array.isArray(detail.json.recent_activity), 'detail: recent_activity is array');

  // 9. Detail 404 for nonexistent
  const notFound = await httpGet('/api/ventures/__nonexistent_phase2_test');
  assert(notFound.status === 404, 'detail: 404 for nonexistent venture');

  // 10. Static files served
  const css = await httpGet('/drilldown.css');
  assert(css.status === 200, '/drilldown.css: served by static middleware');

  const js = await httpGet('/drilldown.js');
  assert(js.status === 200, '/drilldown.js: served by static middleware');

  // 11. Deep link URL hash format (verify API supports the data needed)
  // /api/ventures/:id should return stage so deep link #venture=X can find stage
  const deepLinkCheck = await httpGet('/api/ventures/leadscore');
  assert(deepLinkCheck.json.venture.stage, 'deep link: venture has stage for hash routing');

  // Performance check: measure API response time
  const start = Date.now();
  await httpGet('/api/ventures');
  const elapsed = Date.now() - start;
  assert(elapsed < 500, `Performance: /api/ventures responds in <500ms (${elapsed}ms)`);

  const start2 = Date.now();
  await httpGet('/api/ventures?search=score');
  const elapsed2 = Date.now() - start2;
  assert(elapsed2 < 100, `Performance: search responds in <100ms (${elapsed2}ms)`);
}

runApiTests()
  .then(() => {
    console.log('\n================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failed === 0) {
      console.log('\n🎉 All Phase 2 tests passed!');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed`);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\n[TEST RUNNER ERROR]', err.message);
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(1);
  });
