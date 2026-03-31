#!/usr/bin/env node
/**
 * hermes-ingest.js — Post-run task record ingestion and pattern learning (v2)
 *
 * Hardened promotion logic, bucket-aware thresholds, quality scoring,
 * contradiction detection, stale decay, and full lesson traceability.
 *
 * Usage:
 *   node hermes-ingest.js              — process all pending records
 *   node hermes-ingest.js --status     — show learning store summary
 *   node hermes-ingest.js --playbook   — print current promoted playbook
 *   node hermes-ingest.js --audit      — show suppressed/low-quality candidates
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TASK_RECORDS_DIR = '/Users/openclaw/.openclaw/workspace/data/task-records';
const LEARNING_STORE   = '/Users/openclaw/.openclaw/workspace/data/hermes/learning-store.json';
const PLAYBOOK_FILE    = '/Users/openclaw/.openclaw/workspace/data/hermes/playbook.md';
const EVENT_BUS        = '/Users/openclaw/.openclaw/workspace/data/hermes/event-bus.jsonl';
const PROCESSED_LOG    = '/Users/openclaw/.openclaw/workspace/data/hermes/processed-records.json';
const METRICS_HISTORY  = '/Users/openclaw/.openclaw/workspace/data/hermes/metrics-history.json';

const STORE_VERSION = 2;

// ─── Bucket-aware promotion thresholds ───────────────────────────────────────
//
// min_occurrences:       minimum observations before any promotion
// allow_single_verified: 1x completed_verified unlocks promotion at min_occurrences=1
// requires_agent_lesson: lesson must come from agent's lesson_candidate field (not auto-generated)
// min_confidence:        quality score floor [0-1]; below this → suppressed, never promotes
// stale_days:            days since last_seen before marking stale
//
const BUCKET_CONFIG = {
  verification_rules: {
    // Auto-generated from evidence fields — factual but noisy. Needs repetition.
    min_occurrences:       2,
    allow_single_verified: false,
    requires_agent_lesson: false,
    min_confidence:        0.25,
    stale_days:            90,
  },
  config_drift_signals: {
    // One confirmed config failure is operationally valuable if evidenced.
    min_occurrences:       1,
    allow_single_verified: true,
    requires_agent_lesson: false,
    min_confidence:        0.35,
    stale_days:            60,
  },
  failure_patterns: {
    // Failures aren't "verified" — needs repetition + agent must have written a lesson.
    min_occurrences:       2,
    allow_single_verified: false,
    requires_agent_lesson: true,
    min_confidence:        0.40,
    stale_days:            90,
  },
  recovery_patterns: {
    // Needs proven pattern across multiple attempts.
    min_occurrences:       3,
    allow_single_verified: false,
    requires_agent_lesson: true,
    min_confidence:        0.45,
    stale_days:            120,
  },
  workflow_optimizations: {
    // Requires repeated verified success — single-run lessons are anecdotal.
    // Most valuable bucket but must earn its place.
    min_occurrences:       2,
    allow_single_verified: false,
    requires_agent_lesson: true,
    min_confidence:        0.50,
    stale_days:            180,
  },
  coding_collapse_signals: {
    // Collapse patterns need repetition. Single collapse could be one-off.
    min_occurrences:       2,
    allow_single_verified: false,
    requires_agent_lesson: false,
    min_confidence:        0.35,
    stale_days:            90,
  },
};

const BUCKETS = Object.keys(BUCKET_CONFIG);

// Minimum lesson text length to avoid trivial 3-word lessons
const MIN_LESSON_LENGTH = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDirs() {
  [TASK_RECORDS_DIR, path.dirname(LEARNING_STORE)].forEach(d =>
    fs.mkdirSync(d, { recursive: true })
  );
}

function loadJson(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return fallback;
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function emitEvent(type, status, detail, data = {}) {
  const event = { ts: new Date().toISOString(), source: 'hermes-ingest', type, status, detail, data };
  try { fs.appendFileSync(EVENT_BUS, JSON.stringify(event) + '\n', 'utf8'); } catch {}
}

/** Stable lesson_id: deterministic SHA-based short hash of canonical key */
function lessonId(key) {
  return 'L' + crypto.createHash('sha256').update(key).digest('hex').slice(0, 8);
}

/** Normalize lesson text for deduplication */
function canonicalizeLesson(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

/** Quality score [0.0 - 1.0] for a lesson/record pair */
function scoreLesson(lesson, record, isAgentLesson) {
  let score = 0;

  // Agent explicitly wrote a lesson (vs auto-generated)
  if (isAgentLesson) {
    score += 0.40;
    if (lesson.length > 40) score += 0.10;  // specific enough to be useful
    // Contains technical content: package names, error codes, API names
    if (/[A-Z][a-zA-Z]{2,}|[a-z]+\.[a-z]+|ERR_|Error:|`[^`]+`/.test(lesson)) score += 0.10;
  } else {
    score += 0.10; // auto-generated gets low base score
  }

  // Terminal state quality
  if (record.terminal_state === 'completed_verified')   score += 0.20;
  else if (record.terminal_state === 'completed_unverified') score += 0.05;
  // failed/blocked/timed_out: the state itself is the signal, not quality

  // Has root cause analysis
  if (record.root_cause_guess && record.root_cause_guess.length > 10) score += 0.10;

  // Has specific named failures
  if ((record.failures_encountered || []).some(f => f.length > 15)) score += 0.05;

  // Task was well-defined (acceptance criteria present)
  if ((record.acceptance_criteria || []).length > 0) score += 0.05;

  return Math.min(1.0, Math.round(score * 100) / 100);
}

/** Detect polarity contradiction against existing promoted lessons in same bucket */
function detectContradiction(newLesson, existingPromoted) {
  const AFFIRM = /\b(use|always|require|must|prefer|enable|add|include|keep)\b/i;
  const NEGATE = /\b(avoid|never|don't|do not|disable|remove|skip|exclude|drop)\b/i;

  const newAffirms = AFFIRM.test(newLesson);
  const newNegates = NEGATE.test(newLesson);
  if (!newAffirms && !newNegates) return null;

  const STOP = new Set([
    'use','always','never','avoid','require','must','prefer','the','a','an','in','on',
    'for','with','to','is','are','was','be','been','when','if','that','this','it',
    'not','don','do','add','enable','disable','remove','skip','check','run','keep',
    'include','exclude','drop','before','after','during','within','without',
  ]);
  const newWords = new Set(
    newLesson.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOP.has(w))
  );

  for (const existing of existingPromoted) {
    if (existing.status !== 'promoted') continue;
    const existAffirms = AFFIRM.test(existing.lesson);
    const existNegates = NEGATE.test(existing.lesson);
    if ((newAffirms && existNegates) || (newNegates && existAffirms)) {
      const existWords = existing.lesson.toLowerCase().split(/\W+/)
        .filter(w => w.length > 3 && !STOP.has(w));
      const overlap = existWords.filter(w => newWords.has(w));
      if (overlap.length >= 2) {
        return `Possible contradiction with ${existing.lesson_id}: "${existing.lesson.slice(0, 80)}"`;
      }
    }
  }
  return null;
}

// ─── Bucket classifier ────────────────────────────────────────────────────────

function classifyRecord(record) {
  const entries = [];

  const state     = record.terminal_state || '';
  const failures  = record.failures_encountered || [];
  const retries   = record.retries || 0;
  const humanHelp = record.human_intervention_required || false;
  const agentLesson = (record.lesson_candidate || '').trim();
  const rootCause   = (record.root_cause_guess || '').trim();

  function push(bucket, lesson, isAgentLesson) {
    if (!lesson || lesson.length < MIN_LESSON_LENGTH) return; // suppress trivial lessons
    const score = scoreLesson(lesson, record, isAgentLesson);
    entries.push({ bucket, lesson, isAgentLesson, score, record });
  }

  // ── Failure patterns ──
  if (['failed', 'timed_out', 'blocked'].includes(state) && agentLesson) {
    push('failure_patterns', agentLesson, true);
  }
  failures.forEach(f => {
    const autoLesson = `Failure in ${record.workflow_type || 'task'}: ${f}`;
    push('failure_patterns', autoLesson, false);
  });

  // ── Recovery patterns ──
  if (retries > 0 && ['completed_verified', 'completed_unverified', 'partial'].includes(state)) {
    push('recovery_patterns', agentLesson || `Recovered after ${retries} retries in ${record.workflow_type || 'task'}: ${rootCause || 'unknown'}`, !!agentLesson);
  }
  if (humanHelp && state.startsWith('completed') && agentLesson) {
    push('recovery_patterns', `Human intervention required before completion in ${record.workflow_type || 'task'}: ${agentLesson}`, true);
  }

  // ── Verification rules ──
  // Auto-generated from evidence keys, but only when evidence is substantive
  if (state === 'completed_verified' && record.evidence) {
    const evKeys = Object.keys(record.evidence).filter(k => record.evidence[k] === true || (typeof record.evidence[k] === 'string' && record.evidence[k].length > 0));
    if (evKeys.length >= 2) { // at least 2 meaningful fields — 1 field is too generic
      const autoLesson = `Verified completion for ${record.workflow_type} requires: ${evKeys.join(', ')}`;
      push('verification_rules', autoLesson, false);
    }
  }
  // Agent-provided verification lesson takes precedence
  if (state === 'completed_verified' && agentLesson) {
    push('verification_rules', agentLesson, true);
  }

  // ── Workflow optimizations ──
  if (state === 'completed_verified' && !humanHelp && retries === 0 && agentLesson) {
    push('workflow_optimizations', agentLesson, true);
  }

  // ── Config drift signals ──
  if (rootCause && /config|env|token|key|credential|drift|secret|permission/i.test(rootCause)) {
    const driftLesson = agentLesson || `Config/credential issue: ${rootCause}`;
    push('config_drift_signals', driftLesson, !!agentLesson);
  }
  if (/config|env|token|key|credential|drift|secret|permission/i.test(agentLesson)) {
    push('config_drift_signals', agentLesson, true);
  }

  // ── Coding collapse signals ──
  if (record.workflow_type && /cod|build|deploy|fix/i.test(record.workflow_type)) {
    const isCollapse = humanHelp || retries >= 3 || ['timed_out', 'blocked'].includes(state);
    if (isCollapse) {
      const collapseLesson = agentLesson || (rootCause
        ? `Collapse in ${record.workflow_type}: ${rootCause}`
        : `Collapse in ${record.workflow_type}: retries=${retries}, state=${state}`);
      push('coding_collapse_signals', collapseLesson, !!agentLesson);
    }
  }

  // Deduplicate within this record's entries (same lesson → same bucket, keep higher score)
  const seen = new Map();
  for (const e of entries) {
    const key = `${e.bucket}::${canonicalizeLesson(e.lesson)}`;
    if (!seen.has(key) || seen.get(key).score < e.score) seen.set(key, e);
  }
  return [...seen.values()];
}

// ─── Store operations ─────────────────────────────────────────────────────────

function initStore() {
  const base = {
    version: STORE_VERSION,
    updated: null,
    candidates: {},
    promoted: {},
    metrics: {
      total_records_processed: 0,
      total_candidates: 0,
      total_promoted: 0,
      total_suppressed: 0,
      total_contradictions_detected: 0,
      weekly_snapshots: [],
    },
  };
  BUCKETS.forEach(b => { base.candidates[b] = []; base.promoted[b] = []; });
  return base;
}

function upsertCandidate(store, bucket, lesson, isAgentLesson, score, record) {
  const key = canonicalizeLesson(lesson);
  const id  = lessonId(key);
  const list = store.candidates[bucket] || [];

  const existing = list.find(c => c.lesson_id === id);
  if (existing) {
    existing.occurrences += 1;
    existing.last_seen = new Date().toISOString();
    existing.terminal_states.push(record.terminal_state);
    existing.source_task_ids.push(record.task_id);
    existing.confidence_score = Math.max(existing.confidence_score, score); // take best score seen
    const verifiedCount = existing.terminal_states.filter(s => s === 'completed_verified').length;
    existing.has_verified_occurrence = verifiedCount > 0;
  } else {
    list.push({
      lesson_id: id,
      lesson,
      bucket,
      is_agent_lesson: isAgentLesson,
      occurrences: 1,
      confidence_score: score,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      terminal_states: [record.terminal_state],
      source_task_ids: [record.task_id],
      workflow_types: [record.workflow_type],
      has_verified_occurrence: record.terminal_state === 'completed_verified',
      status: 'candidate',
      suppressed: false,
      suppression_reason: null,
      contradiction_warning: null,
    });
  }
  store.candidates[bucket] = list;
  return id;
}

function runHygiene(store) {
  const now = Date.now();
  let suppressed = 0;
  let contradictions = 0;

  BUCKETS.forEach(bucket => {
    const config = BUCKET_CONFIG[bucket];

    // Mark stale promoted lessons
    (store.promoted[bucket] || []).forEach(p => {
      if (p.status !== 'promoted') return;
      const daysSinceLastSeen = (now - new Date(p.last_seen).getTime()) / 86_400_000;
      if (daysSinceLastSeen > config.stale_days) {
        p.status = 'stale';
        p.stale_marked_at = new Date().toISOString();
      }
    });

    // Check candidates for suppression
    (store.candidates[bucket] || []).forEach(c => {
      if (c.status !== 'candidate') return;

      // Quality gate
      if (c.confidence_score < config.min_confidence) {
        c.suppressed = true;
        c.suppression_reason = `confidence_score ${c.confidence_score} < threshold ${config.min_confidence}`;
        suppressed++;
        return;
      }

      // Requires agent lesson gate
      if (config.requires_agent_lesson && !c.is_agent_lesson) {
        c.suppressed = true;
        c.suppression_reason = `bucket requires agent-written lesson (is_agent_lesson=false)`;
        suppressed++;
        return;
      }

      // Length gate
      if (c.lesson.length < MIN_LESSON_LENGTH) {
        c.suppressed = true;
        c.suppression_reason = `lesson too short (${c.lesson.length} < ${MIN_LESSON_LENGTH} chars)`;
        suppressed++;
        return;
      }

      // Contradiction check against currently promoted lessons
      const promoted = store.promoted[bucket] || [];
      const contradiction = detectContradiction(c.lesson, promoted);
      if (contradiction) {
        c.contradiction_warning = contradiction;
        contradictions++;
        // Don't suppress — flag it, let human review. But don't auto-promote.
      }
    });
  });

  return { suppressed, contradictions };
}

function checkPromotions(store) {
  const newly_promoted = [];

  BUCKETS.forEach(bucket => {
    const config = BUCKET_CONFIG[bucket];
    const promotedList = store.promoted[bucket] || [];

    (store.candidates[bucket] || []).forEach(candidate => {
      if (candidate.status !== 'candidate') return;
      if (candidate.suppressed) return;
      if (candidate.contradiction_warning) return; // hold for review

      // Already promoted? Sync last_seen
      const existingPromoted = promotedList.find(p => p.lesson_id === candidate.lesson_id);
      if (existingPromoted) {
        existingPromoted.occurrences = candidate.occurrences;
        existingPromoted.last_seen = candidate.last_seen;
        existingPromoted.confidence_score = candidate.confidence_score;
        existingPromoted.source_task_ids = candidate.source_task_ids;
        candidate.status = 'promoted';
        return;
      }

      // Check threshold
      const meetsMinOccurrences = candidate.occurrences >= config.min_occurrences;
      const meetsSingleVerified = config.allow_single_verified && candidate.has_verified_occurrence;

      if (meetsMinOccurrences || meetsSingleVerified) {
        const promotionReason = meetsSingleVerified && !meetsMinOccurrences
          ? `Single completed_verified occurrence (bucket allows early promotion)`
          : `${candidate.occurrences}x occurrences ≥ threshold ${config.min_occurrences}`;

        const entry = {
          lesson_id: candidate.lesson_id,
          lesson: candidate.lesson,
          bucket,
          is_agent_lesson: candidate.is_agent_lesson,
          confidence_score: candidate.confidence_score,
          occurrences: candidate.occurrences,
          promotion_reason: promotionReason,
          first_seen: candidate.first_seen,
          last_seen: candidate.last_seen,
          promoted_at: new Date().toISOString(),
          source_task_ids: candidate.source_task_ids,
          workflow_types: [...new Set(candidate.workflow_types || [])],
          status: 'promoted',
        };

        promotedList.push(entry);
        store.promoted[bucket] = promotedList;
        candidate.status = 'promoted';

        newly_promoted.push({ bucket, lesson_id: candidate.lesson_id, lesson: candidate.lesson });
      }
    });
  });

  return newly_promoted;
}

// ─── Playbook renderer ────────────────────────────────────────────────────────

function renderPlaybook(store) {
  const lines = [
    '# Hermes Playbook',
    `_Auto-generated from verified task patterns. Last updated: ${new Date().toISOString()}_`,
    `_Store version: ${STORE_VERSION}_`,
    '',
    '> Lessons are promoted only after meeting bucket-specific thresholds.',
    '> Each lesson is traceable to source task records via lesson_id.',
    '> Run `hermes-trace.js <lesson_id>` to inspect source records.',
    '',
  ];

  const bucketLabels = {
    failure_patterns:       '## ⚠ Failure Patterns',
    recovery_patterns:      '## 🔄 Recovery Patterns',
    verification_rules:     '## ✅ Verification Rules',
    workflow_optimizations: '## 🚀 Workflow Optimizations',
    config_drift_signals:   '## 🔧 Config Drift Signals',
    coding_collapse_signals:'## 💥 Coding Collapse Signals',
  };

  let hasAny = false;

  BUCKETS.forEach(bucket => {
    const entries = (store.promoted[bucket] || []).filter(e => e.status === 'promoted');
    const stale   = (store.promoted[bucket] || []).filter(e => e.status === 'stale');

    if (entries.length === 0 && stale.length === 0) return;
    hasAny = true;

    lines.push(bucketLabels[bucket] || `## ${bucket}`);
    lines.push('');

    entries.forEach(e => {
      const conf = `confidence=${e.confidence_score.toFixed(2)}, ${e.occurrences}× observed`;
      const src  = e.source_task_ids.slice(-3).join(', ');
      lines.push(`- **[${e.lesson_id}]** ${e.lesson}`);
      lines.push(`  _${conf} | ${e.is_agent_lesson ? 'agent-written' : 'auto-generated'} | reason: ${e.promotion_reason}_`);
      lines.push(`  _Source tasks: ${src} | workflows: ${e.workflow_types.join(', ')}_`);
      lines.push('');
    });

    if (stale.length > 0) {
      lines.push(`_Stale (${stale.length}): ${stale.map(s => s.lesson_id).join(', ')}_`);
      lines.push('');
    }
  });

  if (!hasAny) {
    lines.push('_No promoted lessons yet. Patterns accumulate as task records are ingested._');
    lines.push('');
    lines.push('**Bucket thresholds (v2 hardened):**');
    BUCKETS.forEach(b => {
      const c = BUCKET_CONFIG[b];
      lines.push(`- \`${b}\`: min_occurrences=${c.min_occurrences}, allow_single_verified=${c.allow_single_verified}, requires_agent_lesson=${c.requires_agent_lesson}, min_confidence=${c.min_confidence}`);
    });
  }

  // Contradiction warnings section
  const warnings = [];
  BUCKETS.forEach(bucket => {
    (store.candidates[bucket] || []).forEach(c => {
      if (c.contradiction_warning) {
        warnings.push(`- **[${c.lesson_id}]** in \`${bucket}\`: ${c.contradiction_warning}`);
      }
    });
  });
  if (warnings.length > 0) {
    lines.push('## ⚡ Contradiction Warnings (requires human review)');
    lines.push('');
    warnings.forEach(w => lines.push(w));
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
ensureDirs();

if (args.includes('--status')) {
  const store = loadJson(LEARNING_STORE, initStore());
  const processed = loadJson(PROCESSED_LOG, []);
  console.log('=== Hermes Learning Store Status (v2) ===');
  console.log(`Processed records:   ${processed.length}`);
  console.log(`Total candidates:    ${store.metrics?.total_candidates ?? 'n/a'}`);
  console.log(`Total promoted:      ${store.metrics?.total_promoted ?? 'n/a'}`);
  console.log(`Total suppressed:    ${store.metrics?.total_suppressed ?? 'n/a'}`);
  console.log(`Contradictions seen: ${store.metrics?.total_contradictions_detected ?? 'n/a'}`);
  console.log('');
  BUCKETS.forEach(b => {
    const cands     = (store.candidates[b] || []);
    const active    = cands.filter(c => !c.suppressed && c.status === 'candidate').length;
    const suppressed= cands.filter(c => c.suppressed).length;
    const promoted  = (store.promoted[b] || []).filter(p => p.status === 'promoted').length;
    const stale     = (store.promoted[b] || []).filter(p => p.status === 'stale').length;
    console.log(`  ${b}:`);
    console.log(`    candidates=${active} suppressed=${suppressed} promoted=${promoted} stale=${stale}`);
  });
  process.exit(0);
}

if (args.includes('--playbook')) {
  const store = loadJson(LEARNING_STORE, initStore());
  console.log(renderPlaybook(store));
  process.exit(0);
}

if (args.includes('--audit')) {
  const store = loadJson(LEARNING_STORE, initStore());
  console.log('=== Suppressed / Low-Quality Candidates ===');
  let found = false;
  BUCKETS.forEach(b => {
    const suppressed = (store.candidates[b] || []).filter(c => c.suppressed);
    const contradicted = (store.candidates[b] || []).filter(c => c.contradiction_warning && !c.suppressed);
    if (suppressed.length > 0) {
      found = true;
      console.log(`\n[${b}] — ${suppressed.length} suppressed:`);
      suppressed.forEach(c => {
        console.log(`  ${c.lesson_id}: "${c.lesson.slice(0, 80)}"`);
        console.log(`    reason: ${c.suppression_reason}`);
        console.log(`    score: ${c.confidence_score}, occurrences: ${c.occurrences}`);
      });
    }
    if (contradicted.length > 0) {
      found = true;
      console.log(`\n[${b}] — ${contradicted.length} flagged contradiction(s):`);
      contradicted.forEach(c => {
        console.log(`  ${c.lesson_id}: "${c.lesson.slice(0, 80)}"`);
        console.log(`    warning: ${c.contradiction_warning}`);
      });
    }
  });
  if (!found) console.log('No suppressed or contradicted candidates.');
  process.exit(0);
}

// ── Process pending records ───────────────────────────────────────────────────

const processed = loadJson(PROCESSED_LOG, []);
const processedSet = new Set(processed);

const recordFiles = fs.existsSync(TASK_RECORDS_DIR)
  ? fs.readdirSync(TASK_RECORDS_DIR).filter(f => f.endsWith('.json'))
  : [];

const pending = recordFiles.filter(f => !processedSet.has(f.replace('.json', '')));

if (pending.length === 0) {
  // Still run hygiene so stale marking happens even without new records
  const store = loadJson(LEARNING_STORE, null);
  if (store) {
    runHygiene(store);
    store.updated = new Date().toISOString();
    saveJson(LEARNING_STORE, store);
    fs.writeFileSync(PLAYBOOK_FILE, renderPlaybook(store), 'utf8');
  }
  console.log('[hermes-ingest] No pending task records.');
  // Still process review queue on every cron tick
  const { processReviewQueue } = await import('./hermes-reviewer.js');
  await processReviewQueue();
  process.exit(0);
}

console.log(`[hermes-ingest] Processing ${pending.length} pending record(s)...`);

const store = loadJson(LEARNING_STORE, initStore());
// Migrate from v1 if needed
if (!store.version || store.version < STORE_VERSION) {
  store.version = STORE_VERSION;
  if (!store.metrics) store.metrics = { total_records_processed: 0, total_candidates: 0, total_promoted: 0, total_suppressed: 0, total_contradictions_detected: 0, weekly_snapshots: [] };
  BUCKETS.forEach(b => {
    // Backfill lesson_id on existing candidates/promoted
    (store.candidates[b] || []).forEach(c => {
      if (!c.lesson_id) c.lesson_id = lessonId(canonicalizeLesson(c.lesson || ''));
      if (!c.source_task_ids) c.source_task_ids = c.task_ids || [];
      if (!c.confidence_score) c.confidence_score = 0.30;
      if (!c.is_agent_lesson) c.is_agent_lesson = false;
      if (!c.status) c.status = c.promoted ? 'promoted' : 'candidate';
    });
    (store.promoted[b] || []).forEach(p => {
      if (!p.lesson_id) p.lesson_id = lessonId(canonicalizeLesson(p.lesson || ''));
      if (!p.source_task_ids) p.source_task_ids = p.task_ids || [];
      if (!p.confidence_score) p.confidence_score = 0.30;
      if (!p.status) p.status = 'promoted';
    });
  });
}

let newCandidates = 0;
let recordsProcessed = 0;

for (const file of pending) {
  const recordPath = path.join(TASK_RECORDS_DIR, file);
  let record;
  try {
    record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  } catch {
    console.warn(`[hermes-ingest] Skipping ${file}: parse error`);
    continue;
  }

  if (!record.terminal_state || !record.task_id) {
    console.warn(`[hermes-ingest] Skipping ${file}: missing terminal_state or task_id`);
    continue;
  }

  const entries = classifyRecord(record);
  entries.forEach(({ bucket, lesson, isAgentLesson, score }) => {
    upsertCandidate(store, bucket, lesson, isAgentLesson, score, record);
    newCandidates++;
  });

  processedSet.add(file.replace('.json', ''));
  recordsProcessed++;
  console.log(`  ✓ ${record.task_id} [${record.terminal_state}] → ${entries.length} candidate(s)`);
}

// Run hygiene (suppression, stale marking, contradiction detection)
const { suppressed, contradictions } = runHygiene(store);

// Check promotions (only non-suppressed, non-contradicted candidates)
const newly_promoted = checkPromotions(store);

// Update metrics
store.metrics.total_records_processed += recordsProcessed;
store.metrics.total_candidates += newCandidates;
store.metrics.total_promoted += newly_promoted.length;
store.metrics.total_suppressed += suppressed;
store.metrics.total_contradictions_detected += contradictions;

// Weekly snapshot (append if new week)
const weekKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const snaps = store.metrics.weekly_snapshots || [];
const lastSnap = snaps[snaps.length - 1];
if (!lastSnap || lastSnap.date !== weekKey) {
  snaps.push({
    date: weekKey,
    records_processed: recordsProcessed,
    new_candidates: newCandidates,
    newly_promoted: newly_promoted.length,
    suppressed,
    contradictions,
    total_promoted: store.metrics.total_promoted,
    total_suppressed: store.metrics.total_suppressed,
  });
  if (snaps.length > 52) snaps.splice(0, snaps.length - 52); // keep 1 year
  store.metrics.weekly_snapshots = snaps;
}

store.updated = new Date().toISOString();
saveJson(LEARNING_STORE, store);
saveJson(PROCESSED_LOG, [...processedSet]);
fs.writeFileSync(PLAYBOOK_FILE, renderPlaybook(store), 'utf8');

emitEvent('ingest_complete', newly_promoted.length > 0 ? 'ok' : 'ok',
  `Hermes ingested ${recordsProcessed} record(s): ${newCandidates} candidates, ${newly_promoted.length} promoted, ${suppressed} suppressed`,
  { records_processed: recordsProcessed, new_candidates: newCandidates, newly_promoted: newly_promoted.length, suppressed, contradictions }
);

console.log(`\n[hermes-ingest] Done.`);
console.log(`  Records processed: ${recordsProcessed}`);
console.log(`  New candidates:    ${newCandidates}`);
console.log(`  Newly promoted:    ${newly_promoted.length}`);
console.log(`  Suppressed:        ${suppressed}`);
console.log(`  Contradictions:    ${contradictions}`);
if (newly_promoted.length > 0) {
  newly_promoted.forEach(p => console.log(`  → [${p.lesson_id}] [${p.bucket}] ${p.lesson.slice(0, 80)}`));
}

// ── Process review queue (same cadence as ingest) ─────────────────────────────
console.log('');
const { processReviewQueue } = await import('./hermes-reviewer.js');
await processReviewQueue();
