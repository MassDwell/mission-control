/**
 * VentureOS v1 — Comprehensive Test Suite (CR-VENTUREOS-V1-ENHANCED)
 * 40+ tests covering all phases.
 *
 * Uses an isolated temp directory (VENTUREOS_ROOT env) to avoid conflicts
 * with concurrent processes.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Isolated test environment
// ---------------------------------------------------------------------------

const TEST_ROOT = path.join(os.tmpdir(), `ventureos-test-${Date.now()}`);
const REAL_VENTURES_ROOT = path.join(os.homedir(), '.openclaw/workspace/ventures');

// Set before requiring the module so it picks up the env var
process.env.VENTUREOS_ROOT = TEST_ROOT;

// Clear require cache and load with test env
delete require.cache[require.resolve('../api/ventureos')];
const ventureos = require('../api/ventureos');

// ---------------------------------------------------------------------------
// Bootstrap: seed TEST_ROOT with leadscore-ai fixture
// ---------------------------------------------------------------------------

function seedLeadscoreAi() {
  const base = path.join(TEST_ROOT, 'leadscore-ai');
  fs.mkdirSync(path.join(base, 'artifacts'), { recursive: true });
  fs.mkdirSync(path.join(base, 'build'), { recursive: true });
  fs.mkdirSync(path.join(base, 'logs'), { recursive: true });
  fs.mkdirSync(path.join(TEST_ROOT, 'archive'), { recursive: true });

  fs.writeFileSync(path.join(base, 'venture.yaml'),
    'venture: LeadScore.ai\nowner_agent: codesmith\nkill_override: false\n');

  fs.writeFileSync(path.join(base, 'stage.json'), JSON.stringify({
    venture: 'leadscore-ai', stage: 'BUILD', stage_entered: '2026-03-05T18:30:00Z',
    owner_agent: 'codesmith', artifacts_complete: true, next_stage: 'BETA',
    gates_passed: ['IDEA (2026-03-05)', 'EVIDENCE (2026-03-05)', 'OPPORTUNITY_SCORE (2026-03-05)', 'PRD (2026-03-05)'],
    gates_pending: ['BETA', 'REVENUE', 'SCALE'], opportunity_score: 38,
    last_updated: '2026-03-05T18:30:00Z'
  }, null, 2));

  fs.writeFileSync(path.join(base, 'metrics.json'), JSON.stringify({
    venture: 'leadscore-ai', timestamp: '2026-03-05T18:30:00Z',
    metrics: { mrr: 0, users: 0, activation_rate: 0, nps: null, build_progress: 0.32,
               experiments_run: 0, paying_customers: 0 },
    targets: { mrr: 5000, users: 10, activation_rate: 0.5, nps: 8.0 },
    history: [{ timestamp: '2026-03-05T18:30:00Z', metrics: { build_progress: 0.32 } }]
  }, null, 2));

  // All 8 artifacts
  fs.writeFileSync(path.join(base, 'artifacts/idea.md'),
    '# LeadScore.ai Idea\n\n## Problem\nSales teams waste 40% on bad leads.\n\n## Moonshot Approval\n✅ Approved\n');
  fs.writeFileSync(path.join(base, 'artifacts/market_evidence.md'),
    '# Market Evidence\n\n## Competitors: 5 identified\n\n## Market Demand Signals\nHigh.\n');
  fs.writeFileSync(path.join(base, 'artifacts/opportunity_score.md'),
    '# Opportunity Score\n\n## Total Score: **38/40**\n\nScore 38. APPROVED.\n');
  fs.writeFileSync(path.join(base, 'artifacts/prd.md'), '# PRD\n\nProduct requirements.\n');
  fs.writeFileSync(path.join(base, 'artifacts/architecture.md'), '# Architecture\n\nTech stack.\n');
  fs.writeFileSync(path.join(base, 'artifacts/pricing_model.md'), '# Pricing\n\n$99/mo.\n');
  fs.writeFileSync(path.join(base, 'artifacts/go_to_market.md'), '# GTM\n\nGo-to-market strategy.\n');
  fs.writeFileSync(path.join(base, 'artifacts/experiment_results.md'), '# Results\n\nPending.\n');
  fs.writeFileSync(path.join(base, 'build/repo_link.txt'), 'https://github.com/openclaw-ventures/leadscore-ai\n');
  fs.writeFileSync(path.join(base, 'build/deployment.md'), '# Deployment\n\nDeploy to Render.\n');
  fs.writeFileSync(path.join(base, 'logs/venture_activity.json'), JSON.stringify({
    venture: 'leadscore-ai',
    entries: [
      { timestamp: '2026-03-05T18:00:00Z', action: 'CREATED', message: 'Created venture: LeadScore.ai', actor: 'codesmith' },
      { timestamp: '2026-03-05T18:05:00Z', action: 'ADVANCED', message: 'Advanced: IDEA → EVIDENCE', actor: 'moonshot', metadata: { from_stage: 'IDEA', to_stage: 'EVIDENCE' } }
    ]
  }, null, 2));

  // Registry
  fs.writeFileSync(path.join(TEST_ROOT, 'venture_registry.json'), JSON.stringify({
    schema_version: '1.0.0', lastUpdated: '2026-03-05T18:30:00Z',
    ventures: [{
      slug: 'leadscore-ai', name: 'LeadScore.ai',
      description: 'AI-powered lead qualification for sales teams',
      stage: 'BUILD', status: 'active', owner: 'codesmith', owner_human: 'steve',
      created_at: '2026-03-05', stage_entered: '2026-03-05T18:30:00Z',
      mrr: 0, score: 38, build_progress: 0.32, users: 0, activation_rate: 0
    }],
    counts: { active: 1, killed: 0, total: 1, by_stage: { KILLED: 0, IDEA: 0, EVIDENCE: 0, OPPORTUNITY_SCORE: 0, PRD: 0, BUILD: 1, BETA: 0, REVENUE: 0, SCALE: 0 } },
    portfolio_mrr: 0, success_rate: 0, kill_rate: 0
  }, null, 2));
}

beforeAll(() => {
  fs.mkdirSync(TEST_ROOT, { recursive: true });
  seedLeadscoreAi();
});

afterAll(() => {
  try { fs.rmSync(TEST_ROOT, { recursive: true, force: true }); } catch (_) {}
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestVentureFixture(slug, stage = 'IDEA', extraStageFields = {}, extraMetrics = {}) {
  const ventureDir = path.join(TEST_ROOT, slug);
  if (fs.existsSync(ventureDir)) fs.rmSync(ventureDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(ventureDir, 'artifacts'), { recursive: true });
  fs.mkdirSync(path.join(ventureDir, 'build'), { recursive: true });
  fs.mkdirSync(path.join(ventureDir, 'logs'), { recursive: true });
  const now = new Date().toISOString();
  const stages = ['IDEA', 'EVIDENCE', 'OPPORTUNITY_SCORE', 'PRD', 'BUILD', 'BETA', 'REVENUE', 'SCALE'];
  const idx = stages.indexOf(stage);
  const gatesPassed  = stages.slice(0, idx).map(s => `${s} (${now.split('T')[0]})`);
  const gatesPending = stages.slice(idx + 1);
  fs.writeFileSync(path.join(ventureDir, 'stage.json'), JSON.stringify({
    venture: slug, stage, stage_entered: now, owner_agent: 'codesmith', artifacts_complete: false,
    next_stage: stages[idx + 1] || null, gates_passed: gatesPassed, gates_pending: gatesPending,
    last_updated: now, ...extraStageFields
  }, null, 2));
  fs.writeFileSync(path.join(ventureDir, 'metrics.json'), JSON.stringify({
    venture: slug, timestamp: now,
    metrics: { mrr: 0, users: 0, activation_rate: 0, nps: null, build_progress: 0,
               experiments_run: 0, paying_customers: 0, ...extraMetrics },
    targets: { mrr: 5000, users: 10, activation_rate: 0.5, nps: 8.0 },
    history: []
  }, null, 2));
  fs.writeFileSync(path.join(ventureDir, 'venture.yaml'),
    `venture: ${slug}\nowner_agent: codesmith\nkill_override: false\n`);
  fs.writeFileSync(path.join(ventureDir, 'logs/venture_activity.json'),
    JSON.stringify({ venture: slug, entries: [] }, null, 2));
}

function createArtifact(slug, relativePath, content = '# Artifact\n') {
  const fullPath = path.join(TEST_ROOT, slug, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function cleanupTestVenture(slug) {
  const ventureDir = path.join(TEST_ROOT, slug);
  if (fs.existsSync(ventureDir)) fs.rmSync(ventureDir, { recursive: true, force: true });
  const archiveDir = path.join(TEST_ROOT, 'archive', slug);
  if (fs.existsSync(archiveDir)) fs.rmSync(archiveDir, { recursive: true, force: true });
  try { ventureos._removeVentureFromRegistry(slug); } catch (_) {}
}

// ===========================================================================
// PHASE 1: Directory Structure + SSOT Files
// ===========================================================================

describe('Phase 1: Venture Directory Structure', () => {

  test('leadscore-ai directory exists', () => {
    expect(fs.existsSync(path.join(TEST_ROOT, 'leadscore-ai'))).toBe(true);
  });

  test('leadscore-ai/venture.yaml exists and is valid YAML', () => {
    const filePath = path.join(TEST_ROOT, 'leadscore-ai', 'venture.yaml');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('venture: LeadScore.ai');
    expect(content).toContain('owner_agent: codesmith');
    expect(content).toContain('kill_override:');
  });

  test('leadscore-ai/stage.json exists and parses correctly', () => {
    const filePath = path.join(TEST_ROOT, 'leadscore-ai', 'stage.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(data.venture).toBe('leadscore-ai');
    expect(data.stage).toBe('BUILD');
    expect(data.artifacts_complete).toBe(true);
    expect(Array.isArray(data.gates_passed)).toBe(true);
    expect(Array.isArray(data.gates_pending)).toBe(true);
  });

  test('leadscore-ai/metrics.json exists and parses correctly', () => {
    const filePath = path.join(TEST_ROOT, 'leadscore-ai', 'metrics.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(data.venture).toBe('leadscore-ai');
    expect(data.metrics).toBeDefined();
    expect(data.metrics.mrr).toBe(0);
    expect(data.metrics.build_progress).toBe(0.32);
    expect(data.targets).toBeDefined();
    expect(data.targets.mrr).toBe(5000);
  });

  test('leadscore-ai has all 8 artifacts', () => {
    const artifacts = [
      'artifacts/idea.md', 'artifacts/market_evidence.md', 'artifacts/opportunity_score.md',
      'artifacts/prd.md', 'artifacts/architecture.md', 'artifacts/pricing_model.md',
      'artifacts/go_to_market.md', 'artifacts/experiment_results.md'
    ];
    const base = path.join(TEST_ROOT, 'leadscore-ai');
    artifacts.forEach(a => {
      expect(fs.existsSync(path.join(base, a))).toBe(true);
    });
  });

  test('leadscore-ai has build files', () => {
    const base = path.join(TEST_ROOT, 'leadscore-ai');
    expect(fs.existsSync(path.join(base, 'build/repo_link.txt'))).toBe(true);
    expect(fs.existsSync(path.join(base, 'build/deployment.md'))).toBe(true);
  });

  test('leadscore-ai has activity log with entries', () => {
    const logPath = path.join(TEST_ROOT, 'leadscore-ai', 'logs/venture_activity.json');
    expect(fs.existsSync(logPath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    expect(data.venture).toBe('leadscore-ai');
    expect(Array.isArray(data.entries)).toBe(true);
    expect(data.entries.length).toBeGreaterThan(0);
  });

  test('venture_registry.json exists at ventures root', () => {
    expect(fs.existsSync(path.join(TEST_ROOT, 'venture_registry.json'))).toBe(true);
  });

  test('venture_registry.json contains leadscore-ai', () => {
    const data = JSON.parse(fs.readFileSync(path.join(TEST_ROOT, 'venture_registry.json'), 'utf-8'));
    expect(Array.isArray(data.ventures)).toBe(true);
    const venture = data.ventures.find(v => v.slug === 'leadscore-ai');
    expect(venture).toBeDefined();
    expect(venture.stage).toBe('BUILD');
    expect(venture.status).toBe('active');
    expect(venture.score).toBe(38);
  });

  test('venture_registry.json has correct counts', () => {
    const data = JSON.parse(fs.readFileSync(path.join(TEST_ROOT, 'venture_registry.json'), 'utf-8'));
    expect(data.counts).toBeDefined();
    expect(data.counts.active).toBeGreaterThanOrEqual(1);
    expect(typeof data.portfolio_mrr).toBe('number');
  });

  test('archive directory exists', () => {
    expect(fs.existsSync(path.join(TEST_ROOT, 'archive'))).toBe(true);
  });
});

// ===========================================================================
// PHASE 2: Stage Pipeline + Gate Validation
// ===========================================================================

describe('Phase 2: Stage Pipeline + Gate Validation', () => {

  test('getStageRequirements returns valid data for all 8 stages', () => {
    ['IDEA', 'EVIDENCE', 'OPPORTUNITY_SCORE', 'PRD', 'BUILD', 'BETA', 'REVENUE', 'SCALE'].forEach(stage => {
      const req = ventureos.getStageRequirements(stage);
      expect(req.stage).toBe(stage);
      expect(req.gate).toBeDefined();
      expect(Array.isArray(req.files)).toBe(true);
      expect(req.label).toBeDefined();
    });
  });

  test('getStageRequirements throws for unknown stage', () => {
    expect(() => ventureos.getStageRequirements('INVALID')).toThrow('Unknown stage');
  });

  test('getAllStageRequirements returns all 8 stages', () => {
    const all = ventureos.getAllStageRequirements();
    expect(all).toHaveLength(8);
    expect(all[0].stage).toBe('IDEA');
    expect(all[7].stage).toBe('SCALE');
  });

  test('STAGES array has correct order', () => {
    expect(ventureos.STAGES).toEqual([
      'IDEA', 'EVIDENCE', 'OPPORTUNITY_SCORE', 'PRD', 'BUILD', 'BETA', 'REVENUE', 'SCALE'
    ]);
  });

  test('validateGate blocks skipping stages (IDEA → BUILD)', () => {
    const slug = 'test-skip-stage';
    createTestVentureFixture(slug, 'IDEA');
    try {
      const result = ventureos.validateGate(slug, 'BUILD');
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('skip'))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate blocks skipping stages (IDEA → SCALE)', () => {
    const slug = 'test-skip-scale';
    createTestVentureFixture(slug, 'IDEA');
    try {
      const result = ventureos.validateGate(slug, 'SCALE');
      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate returns error for unknown stage', () => {
    const slug = 'test-unknown-stage';
    createTestVentureFixture(slug, 'IDEA');
    try {
      const result = ventureos.validateGate(slug, 'UNKNOWN');
      expect(result.passed).toBe(false);
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate blocks IDEA → EVIDENCE when idea.md missing', () => {
    const slug = 'test-no-idea-md';
    createTestVentureFixture(slug, 'IDEA');
    try {
      const result = ventureos.validateGate(slug, 'EVIDENCE');
      expect(result.passed).toBe(false);
      expect(result.missing).toContain('artifacts/idea.md');
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate passes IDEA → EVIDENCE when idea.md present', () => {
    const slug = 'test-with-idea-md';
    createTestVentureFixture(slug, 'IDEA');
    createArtifact(slug, 'artifacts/idea.md', '# Idea\nProblem statement here.');
    try {
      const result = ventureos.validateGate(slug, 'EVIDENCE');
      expect(result.passed).toBe(true);
      expect(result.missing).toHaveLength(0);
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate blocks EVIDENCE → OPPORTUNITY_SCORE when market_evidence.md missing', () => {
    const slug = 'test-no-market-evidence';
    createTestVentureFixture(slug, 'EVIDENCE');
    try {
      const result = ventureos.validateGate(slug, 'OPPORTUNITY_SCORE');
      expect(result.passed).toBe(false);
      expect(result.missing).toContain('artifacts/market_evidence.md');
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate blocks PRD → BUILD when architecture.md missing', () => {
    const slug = 'test-no-arch';
    createTestVentureFixture(slug, 'PRD');
    createArtifact(slug, 'artifacts/prd.md');
    try {
      const result = ventureos.validateGate(slug, 'BUILD');
      expect(result.passed).toBe(false);
      expect(result.missing).toContain('artifacts/architecture.md');
      expect(result.missing).toContain('build/repo_link.txt');
      expect(result.missing).toContain('build/deployment.md');
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate blocks PRD → BUILD when only architecture.md present (partial)', () => {
    const slug = 'test-partial-build-artifacts';
    createTestVentureFixture(slug, 'PRD');
    createArtifact(slug, 'artifacts/architecture.md');
    try {
      const result = ventureos.validateGate(slug, 'BUILD');
      expect(result.passed).toBe(false);
      expect(result.missing).toContain('build/repo_link.txt');
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate blocks killed venture from advancing', () => {
    const slug = 'test-killed-venture';
    createTestVentureFixture(slug, 'IDEA', { stage: 'KILLED' });
    try {
      const result = ventureos.validateGate(slug, 'EVIDENCE');
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('killed') || e.includes('KILLED'))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('advanceVenture succeeds IDEA → EVIDENCE with required artifact', () => {
    const slug = 'test-advance-idea-to-evidence';
    createTestVentureFixture(slug, 'IDEA');
    createArtifact(slug, 'artifacts/idea.md', '# Idea\nProblem statement here.');
    try {
      const result = ventureos.advanceVenture(slug, 'EVIDENCE', 'moonshot');
      expect(result.success).toBe(true);
      expect(result.stage).toBe('EVIDENCE');
      expect(result.from_stage).toBe('IDEA');
      const stageData = ventureos._readStage(slug);
      expect(stageData.stage).toBe('EVIDENCE');
      expect(stageData.gates_passed.some(g => g.includes('EVIDENCE'))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('advanceVenture fails when artifacts missing', () => {
    const slug = 'test-advance-fail';
    createTestVentureFixture(slug, 'IDEA');
    try {
      const result = ventureos.advanceVenture(slug, 'EVIDENCE', 'moonshot');
      expect(result.success).toBe(false);
      expect(result.missing).toContain('artifacts/idea.md');
    } finally { cleanupTestVenture(slug); }
  });

  test('advanceVenture logs activity', () => {
    const slug = 'test-advance-activity-log';
    createTestVentureFixture(slug, 'IDEA');
    createArtifact(slug, 'artifacts/idea.md', '# Idea content');
    try {
      ventureos.advanceVenture(slug, 'EVIDENCE', 'moonshot');
      const logPath = path.join(TEST_ROOT, slug, 'logs/venture_activity.json');
      const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      const entry = log.entries.find(e => e.action === 'ADVANCED');
      expect(entry).toBeDefined();
      expect(entry.message).toContain('IDEA → EVIDENCE');
    } finally { cleanupTestVenture(slug); }
  });

  test('gates_passed accumulates correctly through multiple advances', () => {
    const slug = 'test-multi-advance';
    createTestVentureFixture(slug, 'IDEA');
    createArtifact(slug, 'artifacts/idea.md', '# Idea');
    createArtifact(slug, 'artifacts/market_evidence.md', '# Market Evidence');
    try {
      ventureos.advanceVenture(slug, 'EVIDENCE', 'moonshot');
      ventureos.advanceVenture(slug, 'OPPORTUNITY_SCORE', 'moonshot');
      const stageData = ventureos._readStage(slug);
      expect(stageData.stage).toBe('OPPORTUNITY_SCORE');
      expect(stageData.gates_passed.some(g => g.includes('EVIDENCE'))).toBe(true);
      expect(stageData.gates_passed.some(g => g.includes('OPPORTUNITY_SCORE'))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });
});

// ===========================================================================
// PHASE 3: Kill Rules + Automation
// ===========================================================================

describe('Phase 3: Kill Rules + Automation', () => {

  test('checkKillTriggers: opportunity score < 28 triggers kill', () => {
    const slug = 'test-low-score';
    createTestVentureFixture(slug, 'OPPORTUNITY_SCORE');
    createArtifact(slug, 'artifacts/opportunity_score.md', '# Opportunity Score\n\n## Total Score: **22/40**\n');
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(true);
      expect(result.trigger).toBe('low_opportunity_score');
      expect(result.reason).toContain('22');
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: opportunity score >= 28 does NOT trigger kill', () => {
    const slug = 'test-high-score';
    createTestVentureFixture(slug, 'OPPORTUNITY_SCORE');
    createArtifact(slug, 'artifacts/opportunity_score.md', '# Score\n\n## Total Score: **35/40**\n');
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(false);
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: beta activation < 10% after 14 days triggers kill', () => {
    const slug = 'test-low-activation';
    const entered = new Date(Date.now() - 15 * 86400000).toISOString();
    createTestVentureFixture(slug, 'BETA', { stage_entered: entered }, { activation_rate: 0.05 });
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(true);
      expect(result.trigger).toBe('low_activation_rate');
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: beta activation < 10% but only 7 days does NOT trigger kill', () => {
    const slug = 'test-low-activation-early';
    const entered = new Date(Date.now() - 7 * 86400000).toISOString();
    createTestVentureFixture(slug, 'BETA', { stage_entered: entered }, { activation_rate: 0.05 });
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(false);
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: beta activation >= 10% does NOT trigger kill (even after 14 days)', () => {
    const slug = 'test-good-activation';
    const entered = new Date(Date.now() - 15 * 86400000).toISOString();
    createTestVentureFixture(slug, 'BETA', { stage_entered: entered }, { activation_rate: 0.55 });
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(false);
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: revenue MRR < $1k after 90 days triggers kill', () => {
    const slug = 'test-low-mrr-90d';
    const entered = new Date(Date.now() - 91 * 86400000).toISOString();
    createTestVentureFixture(slug, 'REVENUE', { stage_entered: entered }, { mrr: 500, users: 3 });
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(true);
      expect(result.trigger).toBe('low_mrr_90_days');
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: revenue MRR < $1k but only 30 days does NOT trigger kill', () => {
    const slug = 'test-low-mrr-30d';
    const entered = new Date(Date.now() - 30 * 86400000).toISOString();
    createTestVentureFixture(slug, 'REVENUE', { stage_entered: entered }, { mrr: 500, users: 3 });
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(false);
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: no users after 60 days in REVENUE triggers kill', () => {
    const slug = 'test-no-users-60d';
    const entered = new Date(Date.now() - 61 * 86400000).toISOString();
    createTestVentureFixture(slug, 'REVENUE', { stage_entered: entered }, { mrr: 0, users: 0 });
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(true);
      expect(result.trigger).toBe('no_users_60_days');
    } finally { cleanupTestVenture(slug); }
  });

  test('checkKillTriggers: revenue MRR >= $1k does NOT trigger kill', () => {
    const slug = 'test-good-mrr';
    const entered = new Date(Date.now() - 95 * 86400000).toISOString();
    createTestVentureFixture(slug, 'REVENUE', { stage_entered: entered }, { mrr: 2500, users: 12 });
    try {
      const result = ventureos.checkKillTriggers(slug);
      expect(result.shouldKill).toBe(false);
    } finally { cleanupTestVenture(slug); }
  });

  test('killVenture archives venture directory', () => {
    const slug = 'test-kill-archive';
    createTestVentureFixture(slug, 'IDEA');
    try {
      ventureos.killVenture(slug, 'Test kill', 'clawson');
      expect(fs.existsSync(path.join(TEST_ROOT, slug))).toBe(false);
      expect(fs.existsSync(path.join(TEST_ROOT, 'archive', slug))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('killVenture updates stage.json to KILLED', () => {
    const slug = 'test-kill-stage';
    createTestVentureFixture(slug, 'BUILD');
    try {
      const result = ventureos.killVenture(slug, 'Test reason', 'steve');
      const archiveStage = JSON.parse(
        fs.readFileSync(path.join(TEST_ROOT, 'archive', slug, 'stage.json'), 'utf-8')
      );
      expect(archiveStage.stage).toBe('KILLED');
      expect(archiveStage.kill_reason).toBe('Test reason');
      expect(archiveStage.kill_date).toBeDefined();
      expect(result.status).toBe('killed');
    } finally { cleanupTestVenture(slug); }
  });

  test('killVenture logs activity to venture_activity.json', () => {
    const slug = 'test-kill-log';
    createTestVentureFixture(slug, 'PRD');
    try {
      ventureos.killVenture(slug, 'Low opportunity score', 'clawson');
      const log = JSON.parse(
        fs.readFileSync(path.join(TEST_ROOT, 'archive', slug, 'logs/venture_activity.json'), 'utf-8')
      );
      const killEntry = log.entries.find(e => e.action === 'KILLED');
      expect(killEntry).toBeDefined();
      expect(killEntry.message).toContain('Low opportunity score');
    } finally { cleanupTestVenture(slug); }
  });

  test('killVenture removes venture from registry', () => {
    const slug = 'test-kill-registry';
    createTestVentureFixture(slug, 'IDEA');
    const reg = ventureos._readRegistry();
    reg.ventures.push({ slug, name: slug, stage: 'IDEA', status: 'active', owner: 'codesmith', mrr: 0 });
    ventureos._writeRegistry(reg);
    try {
      ventureos.killVenture(slug, 'Test removal', 'clawson');
      const updated = ventureos._readRegistry();
      expect(updated.ventures.find(v => v.slug === slug)).toBeUndefined();
    } finally { cleanupTestVenture(slug); }
  });
});

// ===========================================================================
// PHASE 4: Venture CRUD + Metrics
// ===========================================================================

describe('Phase 4: Venture CRUD + Metrics', () => {

  test('createVenture creates directory structure', () => {
    const name = 'Test Venture Alpha';
    const slug = 'test-venture-alpha';
    try {
      const result = ventureos.createVenture({ name, owner: 'codesmith', description: 'A test venture' });
      expect(result.slug).toBe(slug);
      expect(result.stage).toBe('IDEA');
      const vDir = path.join(TEST_ROOT, slug);
      expect(fs.existsSync(vDir)).toBe(true);
      expect(fs.existsSync(path.join(vDir, 'stage.json'))).toBe(true);
      expect(fs.existsSync(path.join(vDir, 'metrics.json'))).toBe(true);
      expect(fs.existsSync(path.join(vDir, 'venture.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(vDir, 'logs/venture_activity.json'))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('createVenture sets stage to IDEA', () => {
    const name = 'Test Venture Beta';
    const slug = 'test-venture-beta';
    try {
      ventureos.createVenture({ name, owner: 'moonshot' });
      const stageData = ventureos._readStage(slug);
      expect(stageData.stage).toBe('IDEA');
      expect(stageData.next_stage).toBe('EVIDENCE');
    } finally { cleanupTestVenture(slug); }
  });

  test('createVenture adds to registry', () => {
    const name = 'Test Venture Gamma';
    const slug = 'test-venture-gamma';
    try {
      ventureos.createVenture({ name, owner: 'codesmith' });
      const reg = ventureos._readRegistry();
      const found = reg.ventures.find(v => v.slug === slug);
      expect(found).toBeDefined();
      expect(found.stage).toBe('IDEA');
      expect(found.status).toBe('active');
    } finally { cleanupTestVenture(slug); }
  });

  test('createVenture logs creation activity', () => {
    const name = 'Test Venture Delta';
    const slug = 'test-venture-delta';
    try {
      ventureos.createVenture({ name, owner: 'codesmith' });
      const log = JSON.parse(
        fs.readFileSync(path.join(TEST_ROOT, slug, 'logs/venture_activity.json'), 'utf-8')
      );
      const createEntry = log.entries.find(e => e.action === 'CREATED');
      expect(createEntry).toBeDefined();
      expect(createEntry.message).toContain(name);
    } finally { cleanupTestVenture(slug); }
  });

  test('createVenture throws if venture already exists', () => {
    const name = 'Test Venture Epsilon';
    const slug = 'test-venture-epsilon';
    try {
      ventureos.createVenture({ name, owner: 'codesmith' });
      expect(() => ventureos.createVenture({ name, owner: 'codesmith' })).toThrow('already exists');
    } finally { cleanupTestVenture(slug); }
  });

  test('createVenture throws when name missing', () => {
    expect(() => ventureos.createVenture({ owner: 'codesmith' })).toThrow('Missing required fields');
  });

  test('createVenture throws when owner missing', () => {
    expect(() => ventureos.createVenture({ name: 'Some Venture' })).toThrow('Missing required fields');
  });

  test('createVenture stores idea_md as artifact', () => {
    const name = 'Test Venture Zeta';
    const slug = 'test-venture-zeta';
    const idea_md = '# My Idea\nThis solves a real problem.';
    try {
      ventureos.createVenture({ name, owner: 'moonshot', idea_md });
      const ideaPath = path.join(TEST_ROOT, slug, 'artifacts/idea.md');
      expect(fs.existsSync(ideaPath)).toBe(true);
      expect(fs.readFileSync(ideaPath, 'utf-8')).toBe(idea_md);
    } finally { cleanupTestVenture(slug); }
  });

  test('getVentureDetail returns complete data', () => {
    const detail = ventureos.getVentureDetail('leadscore-ai');
    expect(detail).not.toBeNull();
    expect(detail.slug).toBe('leadscore-ai');
    expect(detail.stage).toBeDefined();
    expect(detail.stage.stage).toBe('BUILD');
    expect(detail.metrics).toBeDefined();
    expect(detail.artifacts).toBeDefined();
    expect(Array.isArray(detail.activity)).toBe(true);
    expect(detail.opportunity_score).toBe(38);
  });

  test('getVentureDetail returns null for nonexistent venture', () => {
    expect(ventureos.getVentureDetail('nonexistent-venture-xyz')).toBeNull();
  });

  test('listVentures returns active ventures', () => {
    const result = ventureos.listVentures();
    expect(result.ventures).toBeDefined();
    expect(Array.isArray(result.ventures)).toBe(true);
    expect(result.counts).toBeDefined();
    expect(typeof result.portfolio_mrr).toBe('number');
  });

  test('listVentures filters by stage', () => {
    const result = ventureos.listVentures({ stage: 'BUILD' });
    result.ventures.forEach(v => expect(v.stage).toBe('BUILD'));
  });

  test('updateMetrics updates metrics.json correctly', () => {
    const slug = 'test-metrics-update';
    createTestVentureFixture(slug, 'BUILD');
    try {
      const result = ventureos.updateMetrics(slug, { build_progress: 0.75, mrr: 0 }, 'codesmith');
      expect(result.metrics.build_progress).toBe(0.75);
      expect(result.status).toBe('updated');
      expect(result.kill_triggered).toBe(false);
      expect(ventureos._readMetrics(slug).metrics.build_progress).toBe(0.75);
    } finally { cleanupTestVenture(slug); }
  });

  test('updateMetrics appends to history', () => {
    const slug = 'test-metrics-history';
    createTestVentureFixture(slug, 'BUILD');
    try {
      ventureos.updateMetrics(slug, { build_progress: 0.5 }, 'codesmith');
      ventureos.updateMetrics(slug, { build_progress: 0.8 }, 'codesmith');
      expect(ventureos._readMetrics(slug).history.length).toBeGreaterThanOrEqual(2);
    } finally { cleanupTestVenture(slug); }
  });

  test('updateMetrics auto-kills when MRR trigger fires', () => {
    const slug = 'test-auto-kill-mrr';
    const entered = new Date(Date.now() - 95 * 86400000).toISOString();
    createTestVentureFixture(slug, 'REVENUE', { stage_entered: entered }, { mrr: 0, users: 5 });
    try {
      const result = ventureos.updateMetrics(slug, { mrr: 500 }, 'system');
      expect(result.kill_triggered).toBe(true);
      expect(result.status).toBe('killed');
      expect(fs.existsSync(path.join(TEST_ROOT, 'archive', slug))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });
});

// ===========================================================================
// INTEGRATION: Multi-venture + Full Pipeline
// ===========================================================================

describe('Integration: Multi-venture Portfolio', () => {

  test('multiple ventures can coexist in registry', () => {
    const slugs = ['test-mv-1', 'test-mv-2', 'test-mv-3'];
    try {
      slugs.forEach(slug => {
        createTestVentureFixture(slug, 'IDEA');
        const reg = ventureos._readRegistry();
        if (!reg.ventures.find(v => v.slug === slug)) {
          reg.ventures.push({ slug, name: slug, stage: 'IDEA', status: 'active', owner: 'codesmith', mrr: 0 });
          ventureos._writeRegistry(reg);
        }
      });
      const result = ventureos.listVentures();
      const testVentures = result.ventures.filter(v => v.slug.startsWith('test-mv-'));
      expect(testVentures.length).toBeGreaterThanOrEqual(3);
    } finally {
      slugs.forEach(s => cleanupTestVenture(s));
    }
  });

  test('portfolio_mrr sums correctly across ventures', () => {
    const slug1 = 'test-mrr-sum-1', slug2 = 'test-mrr-sum-2';
    try {
      createTestVentureFixture(slug1, 'REVENUE', {}, { mrr: 1000 });
      createTestVentureFixture(slug2, 'REVENUE', {}, { mrr: 2500 });
      const reg = ventureos._readRegistry();
      [{ slug: slug1, mrr: 1000 }, { slug: slug2, mrr: 2500 }].forEach(({ slug, mrr }) => {
        if (!reg.ventures.find(v => v.slug === slug)) {
          reg.ventures.push({ slug, name: slug, stage: 'REVENUE', status: 'active', owner: 'codesmith', mrr });
        }
      });
      ventureos._writeRegistry(reg);
      expect(ventureos._readRegistry().portfolio_mrr).toBeGreaterThanOrEqual(3500);
    } finally {
      cleanupTestVenture(slug1);
      cleanupTestVenture(slug2);
    }
  });

  test('full pipeline: create → advance IDEA → EVIDENCE → OPPORTUNITY_SCORE', () => {
    const name = 'Test Full Pipeline';
    const slug = 'test-full-pipeline';
    try {
      const created = ventureos.createVenture({ name, owner: 'moonshot' });
      expect(created.stage).toBe('IDEA');
      createArtifact(slug, 'artifacts/idea.md', '# Full Pipeline Idea\nSolves real problem.');
      const toEvidence = ventureos.advanceVenture(slug, 'EVIDENCE', 'moonshot');
      expect(toEvidence.success).toBe(true);
      expect(toEvidence.stage).toBe('EVIDENCE');
      createArtifact(slug, 'artifacts/market_evidence.md', '# Market Evidence\nValidated.');
      const toOpScore = ventureos.advanceVenture(slug, 'OPPORTUNITY_SCORE', 'moonshot');
      expect(toOpScore.success).toBe(true);
      expect(toOpScore.stage).toBe('OPPORTUNITY_SCORE');
      const stageData = ventureos._readStage(slug);
      expect(stageData.stage).toBe('OPPORTUNITY_SCORE');
      expect(stageData.gates_passed.length).toBeGreaterThanOrEqual(2);
      const log = JSON.parse(
        fs.readFileSync(path.join(TEST_ROOT, slug, 'logs/venture_activity.json'), 'utf-8')
      );
      expect(log.entries.find(e => e.action === 'CREATED')).toBeDefined();
      expect(log.entries.filter(e => e.action === 'ADVANCED').length).toBeGreaterThanOrEqual(2);
    } finally { cleanupTestVenture(slug); }
  });

  test('opportunity score extraction works correctly', () => {
    const slug = 'test-score-extraction';
    createTestVentureFixture(slug, 'OPPORTUNITY_SCORE');
    const scoreFormats = [
      ['Total Score: **38/40**', 38],
      ['## Total Score: 32/40', 32],
      ['**35/40**', 35],
      ['Score: 28/40', 28],
    ];
    scoreFormats.forEach(([content, expected]) => {
      createArtifact(slug, 'artifacts/opportunity_score.md', `# Score\n\n${content}\n`);
      expect(ventureos._extractOpportunityScore(slug)).toBe(expected);
    });
    cleanupTestVenture(slug);
  });

  test('leadscore-ai opportunity score is 38', () => {
    const score = ventureos._extractOpportunityScore('leadscore-ai');
    expect(score).toBe(38);
  });

  test('killed ventures are preserved in archive', () => {
    const slug = 'test-archive-preservation';
    createTestVentureFixture(slug, 'PRD');
    createArtifact(slug, 'artifacts/idea.md', 'Important idea content');
    try {
      ventureos.killVenture(slug, 'Test archive', 'steve');
      const archiveDir = path.join(TEST_ROOT, 'archive', slug);
      expect(fs.existsSync(archiveDir)).toBe(true);
      expect(fs.existsSync(path.join(archiveDir, 'artifacts/idea.md'))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('registry counts update correctly after kill', () => {
    const slug = 'test-registry-counts';
    createTestVentureFixture(slug, 'IDEA');
    const reg = ventureos._readRegistry();
    reg.ventures.push({ slug, name: slug, stage: 'IDEA', status: 'active', owner: 'codesmith', mrr: 0 });
    ventureos._writeRegistry(reg);
    const beforeCount = ventureos._readRegistry().counts.active;
    ventureos.killVenture(slug, 'Test counts', 'clawson');
    const afterCount = ventureos._readRegistry().counts.active;
    expect(afterCount).toBe(beforeCount - 1);
    cleanupTestVenture(slug);
  });

  test('validateGate OPPORTUNITY_SCORE precondition: score < 28 blocks advance to PRD', () => {
    const slug = 'test-opp-score-blocks';
    createTestVentureFixture(slug, 'OPPORTUNITY_SCORE');
    createArtifact(slug, 'artifacts/opportunity_score.md', '# Score\n\n## Total Score: **15/40**\n');
    try {
      const gate = ventureos.validateGate(slug, 'PRD');
      expect(gate.passed).toBe(false);
      expect(gate.missing.some(m => m.includes('28'))).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('validateGate OPPORTUNITY_SCORE precondition: score >= 28 allows advance to PRD', () => {
    const slug = 'test-opp-score-passes';
    createTestVentureFixture(slug, 'OPPORTUNITY_SCORE');
    createArtifact(slug, 'artifacts/opportunity_score.md', '# Score\n\n## Total Score: **30/40**\n');
    try {
      const gate = ventureos.validateGate(slug, 'PRD');
      expect(gate.passed).toBe(true);
    } finally { cleanupTestVenture(slug); }
  });

  test('registry success_rate and kill_rate calculate correctly', () => {
    const reg = ventureos._readRegistry();
    expect(typeof reg.success_rate).toBe('number');
    expect(typeof reg.kill_rate).toBe('number');
    expect(reg.success_rate).toBeGreaterThanOrEqual(0);
    expect(reg.kill_rate).toBeGreaterThanOrEqual(0);
  });

  test('getVentureDetail shows archived venture', () => {
    const slug = 'test-archived-detail';
    createTestVentureFixture(slug, 'IDEA');
    createArtifact(slug, 'artifacts/idea.md', '# Idea');
    ventureos.killVenture(slug, 'Test archive detail', 'clawson');
    try {
      const detail = ventureos.getVentureDetail(slug);
      expect(detail).not.toBeNull();
      expect(detail.is_archived).toBe(true);
      expect(detail.stage.stage).toBe('KILLED');
    } finally { cleanupTestVenture(slug); }
  });
});
