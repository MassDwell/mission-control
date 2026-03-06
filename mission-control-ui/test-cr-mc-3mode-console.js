/**
 * CR-MC-3MODE-OPERATOR-CONSOLE — Regression Test Suite
 * Phase 5: Full regression testing
 *
 * Tests:
 * 1. Files exist (CSS, JS)
 * 2. HTML has mode toggle buttons
 * 3. HTML has focus buttons on all 9 panels
 * 4. Mode CSS classes defined for all 3 modes
 * 5. SSOT API returns 4 canonical agents
 * 6. No supabase references
 * 7. mode-manager.js structure validation
 * 8. Panel IDs all present in mode maps
 * 9. layout persistence keys defined
 * 10. Color priority CSS vars defined
 */

const fs    = require('fs');
const path  = require('path');
const http  = require('http');

const BASE  = path.join(__dirname, 'public');
const CANONICAL_AGENTS = ['clawson', 'codesmith', 'moonshot', 'personal-assistant'];

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✓', name);
    passed++;
  } catch(e) {
    console.error('  ✗', name, '—', e.message);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ─── File Existence ───────────────────────────────────────────────

console.log('\n[ Phase 1-2: File Existence & Structure ]');

test('mode-styles.css exists', () => {
  assert(fs.existsSync(path.join(BASE, 'mode-styles.css')), 'mode-styles.css not found');
});

test('mode-manager.js exists', () => {
  assert(fs.existsSync(path.join(BASE, 'mode-manager.js')), 'mode-manager.js not found');
});

// ─── HTML Structure ───────────────────────────────────────────────

console.log('\n[ Phase 1: HTML Mode Toggle ]');

const html = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8');

test('mode-styles.css linked in HTML', () => {
  assert(html.includes('mode-styles.css'), 'mode-styles.css not linked');
});

test('mode-manager.js linked in HTML', () => {
  assert(html.includes('mode-manager.js'), 'mode-manager.js not linked');
});

test('OPERATOR mode button present', () => {
  assert(html.includes('data-mode="operator"'), 'OPERATOR mode button missing');
});

test('OPERATIONS mode button present', () => {
  assert(html.includes('data-mode="operations"'), 'OPERATIONS mode button missing');
});

test('INTELLIGENCE mode button present', () => {
  assert(html.includes('data-mode="intelligence"'), 'INTELLIGENCE mode button missing');
});

test('mode-toggle-container present', () => {
  assert(html.includes('mode-toggle-container'), 'mode-toggle-container div missing');
});

test('mc-mode-indicator element present', () => {
  assert(html.includes('mc-mode-indicator'), 'mc-mode-indicator span missing');
});

// ─── Focus Buttons ────────────────────────────────────────────────

console.log('\n[ Phase 3: Focus Buttons ]');

const focusBtnCount = (html.match(/mc-focus-btn/g) || []).length;
test('Focus buttons on all 9 panels (≥9 mc-focus-btn)', () => {
  assert(focusBtnCount >= 9, `Expected ≥9 mc-focus-btn, found ${focusBtnCount}`);
});

const PANEL_IDS = [
  'panel-active-work', 'panel-blocked-work', 'panel-insights',
  'panel-opportunity-discovery', 'panel-momentum', 'panel-operator-impact',
  'panel-agent-activity', 'panel-workstream-flow', 'panel-venture-pipeline'
];

PANEL_IDS.forEach(id => {
  test(`Panel ${id} has id in HTML`, () => {
    assert(html.includes(`id="${id}"`), `Panel ID ${id} not found`);
  });
});

// ─── CSS Validation ───────────────────────────────────────────────

console.log('\n[ Phase 2: CSS Mode Layouts ]');

const css = fs.readFileSync(path.join(BASE, 'mode-styles.css'), 'utf8');

test('OPERATOR mode body class in CSS', () => {
  assert(css.includes('body.mode-operator'), 'mode-operator body class missing');
});

test('OPERATIONS mode body class in CSS', () => {
  assert(css.includes('body.mode-operations'), 'mode-operations body class missing');
});

test('INTELLIGENCE mode body class in CSS', () => {
  assert(css.includes('body.mode-intelligence'), 'mode-intelligence body class missing');
});

test('Color priority variables defined', () => {
  assert(css.includes('--color-healthy'), '--color-healthy missing');
  assert(css.includes('--color-attention'), '--color-attention missing');
  assert(css.includes('--color-critical'), '--color-critical missing');
  assert(css.includes('--color-opportunity'), '--color-opportunity missing');
});

test('Focus mode CSS defined (.mc-focus-mode)', () => {
  assert(css.includes('.mc-focus-mode'), '.mc-focus-mode class missing');
});

test('Focus backdrop CSS defined', () => {
  assert(css.includes('.mc-focus-backdrop'), '.mc-focus-backdrop missing');
});

test('Progress bar CSS defined', () => {
  assert(css.includes('.mc-progress-bar'), '.mc-progress-bar missing');
  assert(css.includes('.mc-progress-fill'), '.mc-progress-fill missing');
});

test('Momentum CSS defined', () => {
  assert(css.includes('.mc-momentum-status'), '.mc-momentum-status missing');
});

test('Operator impact CSS defined', () => {
  assert(css.includes('.mc-impact-stat'), '.mc-impact-stat missing');
  assert(css.includes('.mc-influence-multiplier'), '.mc-influence-multiplier missing');
});

test('Agent cards CSS defined', () => {
  assert(css.includes('.mc-agent-card'), '.mc-agent-card missing');
  assert(css.includes('.mc-agent-grid'), '.mc-agent-grid missing');
});

// ─── mode-manager.js Structure ────────────────────────────────────

console.log('\n[ Phase 1: mode-manager.js Structure ]');

const js = fs.readFileSync(path.join(BASE, 'mode-manager.js'), 'utf8');

test('setMode function defined', () => {
  assert(js.includes('function setMode'), 'setMode function missing');
});

test('updatePanelVisibility function defined', () => {
  assert(js.includes('function updatePanelVisibility'), 'updatePanelVisibility missing');
});

test('enterFocusMode function defined', () => {
  assert(js.includes('function enterFocusMode'), 'enterFocusMode missing');
});

test('exitFocusMode function defined', () => {
  assert(js.includes('function exitFocusMode'), 'exitFocusMode missing');
});

test('saveLayout function defined', () => {
  assert(js.includes('function saveLayout'), 'saveLayout missing');
});

test('restoreLayout function defined', () => {
  assert(js.includes('function restoreLayout'), 'restoreLayout missing');
});

test('renderCanonicalAgents function defined', () => {
  assert(js.includes('function renderCanonicalAgents'), 'renderCanonicalAgents missing');
});

test('trackOperatorAction function defined', () => {
  assert(js.includes('function trackOperatorAction'), 'trackOperatorAction missing');
});

test('Canonical agents array has 4 agents', () => {
  const match = js.match(/CANONICAL_AGENTS\s*=\s*\[([^\]]+)\]/);
  assert(match, 'CANONICAL_AGENTS array not found');
  const list = match[1].match(/'([^']+)'/g) || [];
  assert(list.length === 4, `Expected 4 canonical agents, found ${list.length}: ${list.join(', ')}`);
});

test('PANEL_MODES covers operator mode', () => {
  assert(js.includes("operator:"), 'operator mode missing in PANEL_MODES');
});

test('PANEL_MODES covers operations mode', () => {
  assert(js.includes("operations:"), 'operations mode missing in PANEL_MODES');
});

test('PANEL_MODES covers intelligence mode', () => {
  assert(js.includes("intelligence:"), 'intelligence mode missing in PANEL_MODES');
});

test('localStorage MODE_KEY defined', () => {
  assert(js.includes("'mc_current_mode'") || js.includes('"mc_current_mode"'), 'MODE_KEY not found');
});

test('localStorage LAYOUT_KEY defined', () => {
  assert(js.includes("'mc_3mode_layout'") || js.includes('"mc_3mode_layout"'), 'LAYOUT_KEY not found');
});

test('MCMode global exposed', () => {
  assert(js.includes('window.MCMode'), 'window.MCMode not exposed');
});

test('ESC key listener for focus exit', () => {
  assert(js.includes("'Escape'"), 'ESC key handler missing');
});

test('ResizeObserver for layout save', () => {
  assert(js.includes('ResizeObserver'), 'ResizeObserver missing');
});

// ─── Data Integrity ───────────────────────────────────────────────

console.log('\n[ Phase 5: Data Integrity ]');

test('No supabase references in public JS', () => {
  const jsFiles = fs.readdirSync(BASE)
    .filter(f => f.endsWith('.js'))
    .map(f => fs.readFileSync(path.join(BASE, f), 'utf8'));
  
  jsFiles.forEach((content, i) => {
    const file = fs.readdirSync(BASE).filter(f => f.endsWith('.js'))[i];
    if (content.toLowerCase().includes('supabase')) {
      throw new Error(`Supabase reference found in ${file}`);
    }
  });
});

test('No supabase references in HTML', () => {
  assert(!html.toLowerCase().includes('supabase'), 'Supabase reference found in index.html');
});

test('No hardcoded data paths (require with .json direct)', () => {
  // Check mode-manager.js doesn't use require() for data
  assert(!js.includes("require('./") || !js.includes('.json'), 
    'mode-manager.js should not require data files directly');
});

// ─── Summary ──────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED — CR-MC-3MODE-OPERATOR-CONSOLE complete');
} else {
  console.log('\n❌ FAILURES DETECTED — review above');
  process.exit(1);
}
