/**
 * VentureOS v1 — Venture Governance Engine
 * CR-VENTUREOS-V1-ENHANCED
 *
 * 8-Stage Pipeline: IDEA → EVIDENCE → OPPORTUNITY_SCORE → PRD → BUILD → BETA → REVENUE → SCALE
 * Per-venture directories: /ventures/{slug}/
 * Portfolio index: /ventures/venture_registry.json
 *
 * Author: Codesmith
 * Date: 2026-03-05
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const VENTURES_ROOT = process.env.VENTUREOS_ROOT ||
  path.join(os.homedir(), '.openclaw/workspace/ventures');
const REGISTRY_PATH = path.join(VENTURES_ROOT, 'venture_registry.json');
const ARCHIVE_ROOT  = path.join(VENTURES_ROOT, 'archive');

// ---------------------------------------------------------------------------
// 8-Stage Pipeline
// ---------------------------------------------------------------------------

const STAGES = ['IDEA', 'EVIDENCE', 'OPPORTUNITY_SCORE', 'PRD', 'BUILD', 'BETA', 'REVENUE', 'SCALE'];

const STAGE_INDEX = {};
STAGES.forEach((s, i) => { STAGE_INDEX[s] = i; });

/**
 * Per-stage ENTRY requirements: files/preconditions that must be met BEFORE entering this stage.
 * These represent artifacts produced in the previous stage that gate entry to this one.
 * Files are relative to the venture root directory.
 *
 * Gate logic: validateGate(slug, nextStage) checks nextStage's entry requirements.
 */
const STAGE_REQUIREMENTS = {
  // First stage — no entry requirements
  IDEA: { gate: 'moonshot', files: [], label: 'Define problem + customer' },

  // Entering EVIDENCE: must have produced idea.md in IDEA stage
  EVIDENCE: { gate: 'moonshot', files: ['artifacts/idea.md'], label: 'Validate market demand' },

  // Entering OPPORTUNITY_SCORE: must have produced market_evidence.md in EVIDENCE stage
  OPPORTUNITY_SCORE: { gate: 'clawson', files: ['artifacts/market_evidence.md'], label: 'Score venture viability' },

  // Entering PRD: must have opportunity_score.md with score ≥28 from OPPORTUNITY_SCORE stage
  PRD: { gate: 'codesmith', files: ['artifacts/opportunity_score.md'], label: 'Define product',
    preconditions: [{
      check: (slug) => { const s = _extractOpportunityScore(slug); return s !== null && s >= 28; },
      message: 'opportunity_score.md must contain score ≥28'
    }]
  },

  // Entering BUILD: must have prd.md + architecture docs (produced during PRD stage)
  BUILD: { gate: 'codesmith',
    files: ['artifacts/prd.md', 'artifacts/architecture.md', 'build/repo_link.txt', 'build/deployment.md'],
    label: 'Develop MVP' },

  // Entering BETA: must have experiment_results.md + activation rate ≥50% from BUILD
  BETA: { gate: 'clawson', files: ['artifacts/experiment_results.md'], label: 'Validate with real users',
    preconditions: [{
      check: (slug) => { const m = _readMetrics(slug); return m && (m.metrics.activation_rate || 0) >= 0.5; },
      message: 'activation_rate in metrics.json must be ≥0.5 (50%)'
    }]
  },

  // Entering REVENUE: MRR must be ≥$1,000 (validated in BETA)
  REVENUE: { gate: 'clawson', files: [], label: 'Generate first $',
    preconditions: [{
      check: (slug) => { const m = _readMetrics(slug); return m && (m.metrics.mrr || 0) >= 1000; },
      message: 'MRR in metrics.json must be ≥$1,000'
    }]
  },

  // Entering SCALE: go_to_market.md + MRR ≥$5,000
  SCALE: { gate: 'clawson', files: ['artifacts/go_to_market.md'], label: 'Growth & optimization',
    preconditions: [{
      check: (slug) => { const m = _readMetrics(slug); return m && (m.metrics.mrr || 0) >= 5000; },
      message: 'MRR in metrics.json must be ≥$5,000'
    }]
  }
};

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function _ventureDir(slug)  { return path.join(VENTURES_ROOT, slug); }
function _archiveDir(slug)  { return path.join(ARCHIVE_ROOT, slug); }

function _readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}
function _writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function _readStage(slug)   { return _readJSON(path.join(_ventureDir(slug), 'stage.json')); }
function _readMetrics(slug) { return _readJSON(path.join(_ventureDir(slug), 'metrics.json')); }
function _fileExists(slug, rel) { return fs.existsSync(path.join(_ventureDir(slug), rel)); }

function _readRegistry() {
  const data = _readJSON(REGISTRY_PATH);
  if (data) return data;
  return { schema_version: '1.0.0', lastUpdated: new Date().toISOString(),
    ventures: [], counts: { active: 0, killed: 0, total: 0, by_stage: _emptyStageCounts() },
    portfolio_mrr: 0, success_rate: 0, kill_rate: 0 };
}

function _emptyStageCounts() {
  const c = { KILLED: 0 };
  STAGES.forEach(s => { c[s] = 0; });
  return c;
}

function _writeRegistry(reg) {
  const active  = reg.ventures.filter(v => v.status === 'active');
  const killed  = reg.ventures.filter(v => v.status === 'killed');
  const by_stage = _emptyStageCounts();
  active.forEach(v => { if (by_stage[v.stage] !== undefined) by_stage[v.stage]++; });
  killed.forEach(() => by_stage.KILLED++);

  const reachedRev = reg.ventures.filter(v =>
    STAGE_INDEX[v.stage] !== undefined && STAGE_INDEX[v.stage] >= STAGE_INDEX['REVENUE']
  ).length;
  const total = reg.ventures.length;

  reg.counts = { active: active.length, killed: killed.length, total, by_stage };
  reg.portfolio_mrr = active.reduce((s, v) => s + (v.mrr || 0), 0);
  reg.success_rate  = total > 0 ? Math.round((reachedRev / total) * 100) : 0;
  reg.kill_rate     = total > 0 ? Math.round((killed.length / total) * 100) : 0;
  reg.lastUpdated   = new Date().toISOString();
  _writeJSON(REGISTRY_PATH, reg);
}

function _removeVentureFromRegistry(slug) {
  const reg = _readRegistry();
  reg.ventures = reg.ventures.filter(v => v.slug !== slug);
  _writeRegistry(reg);
}

function _updateVentureInRegistry(slug, updates) {
  const reg = _readRegistry();
  const idx = reg.ventures.findIndex(v => v.slug === slug);
  if (idx >= 0) reg.ventures[idx] = { ...reg.ventures[idx], ...updates };
  _writeRegistry(reg);
}

function _appendActivity(slug, action, message, actor, metadata) {
  // Activity log goes in the venture dir (or archive after kill)
  const baseDir = fs.existsSync(_ventureDir(slug)) ? _ventureDir(slug) : _archiveDir(slug);
  const logPath = path.join(baseDir, 'logs', 'venture_activity.json');
  let log = _readJSON(logPath) || { venture: slug, entries: [] };
  if (!Array.isArray(log.entries)) log.entries = [];
  const entry = { timestamp: new Date().toISOString(), action, message, actor: actor || 'system' };
  if (metadata && Object.keys(metadata).length > 0) entry.metadata = metadata;
  log.entries.push(entry);
  _writeJSON(logPath, log);
}

/**
 * Extract opportunity score from opportunity_score.md.
 * Matches "Total Score: N/40", "**N/40**", "Score: N/40", etc.
 */
function _extractOpportunityScore(slug) {
  const f = path.join(_ventureDir(slug), 'artifacts', 'opportunity_score.md');
  try {
    const content = fs.readFileSync(f, 'utf-8');
    for (const pattern of [
      /Total\s+Score[:\s*]+\*?\*?(\d+)/i,
      /\*\*(\d+)\/40\*\*/,
      /Score[:\s]+\*?\*?(\d+)\/40/i,
      /score.*?(\d+)\/40/i
    ]) {
      const m = content.match(pattern);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Stage Gate API
// ---------------------------------------------------------------------------

/**
 * Get requirements for a given stage.
 */
function getStageRequirements(stage) {
  const r = STAGE_REQUIREMENTS[stage];
  if (!r) throw new Error(`Unknown stage: ${stage}. Valid: ${STAGES.join(', ')}`);
  return { stage, gate: r.gate, files: r.files, label: r.label,
           preconditions: (r.preconditions || []).map(p => p.message) };
}

/**
 * Get all 8 stage definitions.
 */
function getAllStageRequirements() {
  return STAGES.map(getStageRequirements);
}

/**
 * Validate whether a venture can advance to next_stage.
 * @returns {{ passed: boolean, missing: string[], errors: string[] }}
 */
function validateGate(slug, nextStage) {
  if (!STAGES.includes(nextStage)) {
    return { passed: false, missing: [], errors: [`Unknown stage: ${nextStage}`] };
  }
  const stageData = _readStage(slug);
  if (!stageData) {
    return { passed: false, missing: [], errors: [`Cannot read stage.json for: ${slug}`] };
  }
  const cur = stageData.stage;
  if (cur === 'KILLED') {
    return { passed: false, missing: [], errors: [`Venture ${slug} is KILLED and cannot advance`] };
  }
  const curIdx  = STAGE_INDEX[cur];
  const nextIdx = STAGE_INDEX[nextStage];
  if (curIdx === undefined) return { passed: false, missing: [], errors: [`Unknown current stage: ${cur}`] };
  if (nextIdx !== curIdx + 1) {
    return { passed: false, missing: [], errors: [
      `Cannot skip stages. Current: ${cur} (${curIdx}), Requested: ${nextStage} (${nextIdx}). Must advance one stage at a time.`
    ]};
  }

  const req = STAGE_REQUIREMENTS[nextStage];
  const missing = [];
  if (req) {
    for (const file of (req.files || [])) {
      if (!_fileExists(slug, file)) missing.push(file);
    }
    for (const pc of (req.preconditions || [])) {
      try {
        if (!pc.check(slug)) missing.push(`[PRECONDITION] ${pc.message}`);
      } catch (e) {
        missing.push(`[PRECONDITION ERROR] ${pc.message}: ${e.message}`);
      }
    }
  }
  return { passed: missing.length === 0, missing, errors: [] };
}

/**
 * Advance a venture to the next stage.
 */
function advanceVenture(slug, nextStage, actor) {
  const gate = validateGate(slug, nextStage);
  if (!gate.passed) {
    return { success: false, error: gate.errors[0] || 'Gate preconditions not met',
             missing: gate.missing, errors: gate.errors };
  }
  const stageData = _readStage(slug);
  const prev = stageData.stage;
  const now  = new Date().toISOString();
  const gatesPassed = [...(stageData.gates_passed || []), `${nextStage} (${now.split('T')[0]})`];
  const gatesPending = (stageData.gates_pending || []).filter(g => g !== nextStage);
  const updated = { ...stageData, stage: nextStage, stage_entered: now, artifacts_complete: true,
    next_stage: STAGES[STAGE_INDEX[nextStage] + 1] || null,
    gates_passed: gatesPassed, gates_pending: gatesPending, last_updated: now };
  _writeJSON(path.join(_ventureDir(slug), 'stage.json'), updated);
  _updateVentureInRegistry(slug, { stage: nextStage, status: 'active' });
  const extra = nextStage === 'PRD' ? ` (Score: ${_extractOpportunityScore(slug) || 'N/A'}/40)` : '';
  _appendActivity(slug, 'ADVANCED', `Advanced: ${prev} → ${nextStage}${extra}`, actor || 'system',
    { from_stage: prev, to_stage: nextStage });
  return { success: true, slug, from_stage: prev, stage: nextStage };
}

// ---------------------------------------------------------------------------
// Kill Rules
// ---------------------------------------------------------------------------

/**
 * Check automatic kill triggers for a venture.
 */
function checkKillTriggers(slug) {
  const stageData = _readStage(slug);
  if (!stageData || stageData.stage === 'KILLED') return { shouldKill: false };
  const stage   = stageData.stage;
  const metrics = _readMetrics(slug);
  const now     = Date.now();

  if (stage === 'OPPORTUNITY_SCORE') {
    const score = _extractOpportunityScore(slug);
    if (score !== null && score < 28) {
      return { shouldKill: true, reason: `Low opportunity score: ${score}/40 (minimum: 28)`, trigger: 'low_opportunity_score' };
    }
  }
  if (stage === 'BETA' && metrics) {
    const rate = metrics.metrics.activation_rate || 0;
    const days = (now - new Date(stageData.stage_entered).getTime()) / 86400000;
    if (days >= 14 && rate < 0.1) {
      return { shouldKill: true, reason: `Activation ${(rate*100).toFixed(1)}% < 10% after ${Math.floor(days)} days in BETA`,
               trigger: 'low_activation_rate', daysInStage: Math.floor(days) };
    }
  }
  if (stage === 'REVENUE' && metrics) {
    const mrr  = metrics.metrics.mrr  || 0;
    const users = metrics.metrics.users || 0;
    const days  = (now - new Date(stageData.stage_entered).getTime()) / 86400000;
    if (days >= 90 && mrr < 1000) {
      return { shouldKill: true, reason: `MRR $${mrr} < $1,000 after ${Math.floor(days)} days in REVENUE`,
               trigger: 'low_mrr_90_days', daysInStage: Math.floor(days) };
    }
    if (days >= 60 && users === 0) {
      return { shouldKill: true, reason: `No users after ${Math.floor(days)} days in REVENUE`,
               trigger: 'no_users_60_days', daysInStage: Math.floor(days) };
    }
  }
  return { shouldKill: false };
}

/**
 * Kill a venture (final, no appeal).
 */
function killVenture(slug, reason, decision_maker) {
  const ventureDir = _ventureDir(slug);
  if (!fs.existsSync(ventureDir)) {
    throw new Error(`Venture directory not found: ${ventureDir}`);
  }
  const now = new Date().toISOString();
  // 1. Update stage.json
  const stageData = _readStage(slug) || {};
  _writeJSON(path.join(ventureDir, 'stage.json'), {
    ...stageData, stage: 'KILLED', kill_date: now, kill_reason: reason,
    killed_by: decision_maker || 'system', last_updated: now
  });
  // 2. Log before archiving
  _appendActivity(slug, 'KILLED', `KILLED: ${reason}`, decision_maker || 'system',
    { kill_reason: reason, decision_maker });
  // 3. Archive
  const archDir = _archiveDir(slug);
  fs.mkdirSync(ARCHIVE_ROOT, { recursive: true });
  if (fs.existsSync(archDir)) fs.rmSync(archDir, { recursive: true, force: true });
  fs.cpSync(ventureDir, archDir, { recursive: true });
  fs.rmSync(ventureDir, { recursive: true, force: true });
  // 4. Remove from registry
  _removeVentureFromRegistry(slug);
  return { status: 'killed', slug, killed_at: now, reason, decision_maker: decision_maker || 'system',
           archived_to: archDir };
}

// ---------------------------------------------------------------------------
// Venture CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new venture at IDEA stage.
 */
function createVenture({ name, owner, description, idea_md }) {
  if (!name || !owner) throw new Error('Missing required fields: name, owner');
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const ventureDir = _ventureDir(slug);
  if (fs.existsSync(ventureDir)) throw new Error(`Venture already exists: ${slug}`);
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  // Directories
  fs.mkdirSync(path.join(ventureDir, 'artifacts'), { recursive: true });
  fs.mkdirSync(path.join(ventureDir, 'build'),     { recursive: true });
  fs.mkdirSync(path.join(ventureDir, 'logs'),      { recursive: true });
  // venture.yaml
  fs.writeFileSync(path.join(ventureDir, 'venture.yaml'),
    `venture: ${name}\ndescription: "${description || ''}"\nowner_agent: ${owner}\nowner_human: steve\ncreated_at: "${today}"\ntimeline:\n  target_launch: null\n  estimated_weeks: null\ntargets:\n  mrr: 5000\n  customers: 10\nteam:\n  - ${owner}\nkill_override: false\n`, 'utf-8');
  // stage.json
  _writeJSON(path.join(ventureDir, 'stage.json'), {
    venture: slug, stage: 'IDEA', stage_entered: now, owner_agent: owner,
    artifacts_complete: false, next_stage: 'EVIDENCE', gates_passed: [],
    gates_pending: [...STAGES], last_updated: now
  });
  // metrics.json
  _writeJSON(path.join(ventureDir, 'metrics.json'), {
    venture: slug, timestamp: now,
    metrics: { mrr: 0, users: 0, activation_rate: 0, nps: null, build_progress: 0, experiments_run: 0, paying_customers: 0 },
    targets: { mrr: 5000, users: 10, activation_rate: 0.5, nps: 8.0 },
    history: []
  });
  // idea.md artifact if provided
  if (idea_md) fs.writeFileSync(path.join(ventureDir, 'artifacts', 'idea.md'), idea_md, 'utf-8');
  // activity log
  _writeJSON(path.join(ventureDir, 'logs', 'venture_activity.json'), { venture: slug, entries: [] });
  _appendActivity(slug, 'CREATED', `Created venture: ${name}`, owner);
  // Registry
  const reg = _readRegistry();
  reg.ventures.push({ slug, name, description: description || '', stage: 'IDEA', status: 'active',
    owner, owner_human: 'steve', created_at: today, stage_entered: now,
    mrr: 0, score: null, build_progress: 0, users: 0, activation_rate: 0 });
  _writeRegistry(reg);
  return { slug, stage: 'IDEA', message: `Venture created: ${name}` };
}

/**
 * Get full venture detail.
 */
function getVentureDetail(slug) {
  let baseDir = _ventureDir(slug);
  let isArchived = false;
  if (!fs.existsSync(baseDir)) {
    const archDir = _archiveDir(slug);
    if (fs.existsSync(archDir)) { baseDir = archDir; isArchived = true; }
    else return null;
  }
  const stageData = _readJSON(path.join(baseDir, 'stage.json'));
  const metrics   = _readJSON(path.join(baseDir, 'metrics.json'));
  const activity  = _readJSON(path.join(baseDir, 'logs', 'venture_activity.json'));
  const ALL_ARTIFACTS = [
    'artifacts/idea.md', 'artifacts/market_evidence.md', 'artifacts/opportunity_score.md',
    'artifacts/prd.md', 'artifacts/architecture.md', 'artifacts/pricing_model.md',
    'artifacts/go_to_market.md', 'artifacts/experiment_results.md',
    'build/repo_link.txt', 'build/deployment.md'
  ];
  const artifacts = {};
  ALL_ARTIFACTS.forEach(a => { artifacts[a] = fs.existsSync(path.join(baseDir, a)); });
  const cur = stageData ? stageData.stage : 'UNKNOWN';
  const nextStage = STAGES[STAGE_INDEX[cur] + 1];
  const nextGateReq = nextStage ? getStageRequirements(nextStage) : null;
  const daysInStage = stageData && stageData.stage_entered
    ? Math.floor((Date.now() - new Date(stageData.stage_entered).getTime()) / 86400000) : null;
  return { slug, is_archived: isArchived, stage: stageData, metrics,
    activity: activity ? activity.entries : [], artifacts, days_in_stage: daysInStage,
    next_gate_requirements: nextGateReq, opportunity_score: _extractOpportunityScore(slug) };
}

/**
 * List ventures from registry.
 */
function listVentures(filters) {
  const f = filters || {};
  const reg = _readRegistry();
  let ventures = reg.ventures;
  if (f.stage)  ventures = ventures.filter(v => v.stage  === f.stage.toUpperCase());
  if (f.status) ventures = ventures.filter(v => v.status === f.status.toLowerCase());
  return { ventures, counts: reg.counts, portfolio_mrr: reg.portfolio_mrr,
           success_rate: reg.success_rate, kill_rate: reg.kill_rate, last_updated: reg.lastUpdated };
}

/**
 * Update venture metrics + check kill triggers.
 */
function updateMetrics(slug, updates, actor) {
  const metricsPath = path.join(_ventureDir(slug), 'metrics.json');
  const existing = _readJSON(metricsPath);
  if (!existing) throw new Error(`Cannot read metrics.json for: ${slug}`);
  const now = new Date().toISOString();
  const changes = [];
  Object.entries(updates).forEach(([k, v]) => {
    if (existing.metrics[k] !== v) changes.push(`${k}: ${existing.metrics[k]} → ${v}`);
  });
  const updatedMetrics = { ...existing.metrics, ...updates };
  _writeJSON(metricsPath, { ...existing, timestamp: now, metrics: updatedMetrics,
    history: [...(existing.history || []), { timestamp: now, metrics: updates }] });
  // Registry update
  const regUpdates = {};
  if (updates.mrr !== undefined)             regUpdates.mrr             = updates.mrr;
  if (updates.build_progress !== undefined)  regUpdates.build_progress  = updates.build_progress;
  if (updates.users !== undefined)           regUpdates.users           = updates.users;
  if (updates.activation_rate !== undefined) regUpdates.activation_rate = updates.activation_rate;
  if (Object.keys(regUpdates).length) _updateVentureInRegistry(slug, regUpdates);
  if (changes.length) _appendActivity(slug, 'METRICS_UPDATED', `Updated metrics: ${changes.join(', ')}`,
    actor || 'system', updates);
  // Kill check
  const killCheck = checkKillTriggers(slug);
  let killResult = null;
  if (killCheck.shouldKill) killResult = killVenture(slug, killCheck.reason, 'system (auto-kill)');
  return { slug, metrics: updatedMetrics, status: killResult ? 'killed' : 'updated',
           kill_triggered: killCheck.shouldKill, kill_result: killResult, changes };
}

/**
 * Get ventures at risk: overdue, stale blockers, metrics below target.
 * Used by dashboard /api/venture-at-risk endpoint.
 * @returns {Array} List of at-risk ventures with highest_severity
 */
function getAtRisk() {
  try {
    const reg = _readRegistry();
    if (!reg || !reg.ventures) return [];
    
    const atRisk = [];
    reg.ventures.forEach(v => {
      if (v.status === 'killed' || v.status === 'archived') return;
      
      let severity = null;
      let reasons = [];
      
      // Check MRR targets based on stage
      const metrics = _readMetrics(v.slug);
      if (metrics && metrics.metrics) {
        const mrr = metrics.metrics.mrr || 0;
        
        // REVENUE stage should have MRR >= $1000
        if (v.stage === 'REVENUE' && mrr < 1000) {
          severity = 'critical';
          reasons.push(`MRR below target ($${mrr} < $1000)`);
        }
        // SCALE stage should have MRR >= $5000
        if (v.stage === 'SCALE' && mrr < 5000) {
          severity = severity === 'critical' ? 'critical' : 'warning';
          reasons.push(`MRR below scaling target ($${mrr} < $5000)`);
        }
        
        // Check activation rate for BETA stage
        const activation = metrics.metrics.activation_rate || 0;
        if (v.stage === 'BETA' && activation < 0.5) {
          severity = severity === 'critical' ? 'critical' : 'warning';
          reasons.push(`Activation below 50% (${(activation * 100).toFixed(1)}%)`);
        }
      }
      
      // Check stage tenure (more than 6 months should be reviewed)
      const stageData = _readStage(v.slug);
      if (stageData && stageData.stage_entered) {
        const daysSinceEnter = Math.floor((Date.now() - new Date(stageData.stage_entered).getTime()) / 86400000);
        if (daysSinceEnter > 180) {
          severity = severity === 'critical' ? 'critical' : 'warning';
          reasons.push(`Stage tenure ${daysSinceEnter} days (>180 days)`);
        }
      }
      
      if (severity) {
        atRisk.push({
          slug: v.slug,
          name: v.name,
          stage: v.stage,
          status: v.status,
          highest_severity: severity,
          reasons: reasons,
          last_updated: v.last_updated || new Date().toISOString()
        });
      }
    });
    
    return atRisk;
  } catch (err) {
    console.error('[VENTUREOS] getAtRisk error:', err.message);
    // Return safe empty response instead of throwing
    return [];
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  STAGES,
  STAGE_INDEX,
  STAGE_REQUIREMENTS,
  getStageRequirements,
  getAllStageRequirements,
  validateGate,
  advanceVenture,
  checkKillTriggers,
  killVenture,
  createVenture,
  getVentureDetail,
  listVentures,
  updateMetrics,
  getAtRisk,
  // Internal helpers (for tests)
  _ventureDir,
  _readStage,
  _readMetrics,
  _readRegistry,
  _writeRegistry,
  _appendActivity,
  _extractOpportunityScore,
  _removeVentureFromRegistry,
  _updateVentureInRegistry
};
