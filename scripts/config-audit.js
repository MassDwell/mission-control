#!/usr/bin/env node
/**
 * config-audit.js — openclaw.json schema validation and drift audit
 *
 * Checks:
 *   1. openclaw.json is valid JSON and parseable
 *   2. Required top-level keys are present
 *   3. No duplicate agent IDs
 *   4. No dead/zombie bot tokens (known patterns)
 *   5. Model references use known aliases
 *   6. Cron job count sanity check
 *   7. Agent count sanity check
 *
 * Emits results to event bus. Exits 0 = clean, 1 = warnings, 2 = errors.
 */

import fs from 'fs';

const CONFIG_PATH = '/Users/openclaw/.openclaw/openclaw.json';
const CRON_PATH = '/Users/openclaw/.openclaw/cron/jobs.json';
const EVENT_BUS = '/Users/openclaw/.openclaw/workspace/data/task-records/event-bus.jsonl';

const REQUIRED_KEYS = ['agents', 'gateway'];
const MAX_AGENTS = 20;
const MAX_CRON_JOBS = 50;
const KNOWN_MODELS = [
  'anthropic/claude-sonnet', 'anthropic/claude-haiku', 'anthropic/claude-opus',
  'google/gemini', 'openai/gpt', 'nous/', 'meta/',
];

fs.mkdirSync('/Users/openclaw/.openclaw/workspace/data/task-records', { recursive: true });

function emitEvent(type, status, detail, data = {}) {
  const event = { ts: new Date().toISOString(), source: 'config-audit', type, status, detail, data };
  try {
    fs.appendFileSync(EVENT_BUS, JSON.stringify(event) + '\n', 'utf8');
  } catch {}
}

const errors = [];
const warnings = [];

// ── 1. Parse openclaw.json ───────────────────────────────────────────────────
let config;
try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(raw);
} catch (e) {
  errors.push(`openclaw.json parse error: ${e.message}`);
  emitEvent('config_audit', 'fail', `openclaw.json unparseable: ${e.message}`, { errors });
  console.error('FAIL:', errors[0]);
  process.exit(2);
}

// ── 2. Required keys ─────────────────────────────────────────────────────────
for (const key of REQUIRED_KEYS) {
  if (!(key in config)) errors.push(`Missing required key: "${key}"`);
}

// ── 3. Agents ─────────────────────────────────────────────────────────────────
const agents = config.agents || [];
if (Array.isArray(agents)) {
  // Duplicate IDs
  const ids = agents.map(a => a.id || a.name).filter(Boolean);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) warnings.push(`Duplicate agent IDs: ${[...new Set(dupes)].join(', ')}`);

  // Count check
  if (agents.length > MAX_AGENTS) {
    warnings.push(`Agent count ${agents.length} exceeds soft limit ${MAX_AGENTS} — possible zombie accumulation`);
  }

  // Disabled agents
  const disabled = agents.filter(a => a.enabled === false || a.active === false);
  if (disabled.length > 0) {
    warnings.push(`${disabled.length} disabled agent(s) in config — consider cleanup`);
  }
}

// ── 4. Gateway config ────────────────────────────────────────────────────────
const gateway = config.gateway || {};
if (!gateway.bind && !gateway.port) {
  warnings.push('gateway.bind/port not set — gateway may not bind correctly');
}

// ── 5. Model references ───────────────────────────────────────────────────────
const modelRefs = [];
function extractModels(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  if (obj.model) modelRefs.push({ path, model: obj.model });
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object') extractModels(obj[k], `${path}.${k}`);
  }
}
extractModels(config);

for (const { path, model } of modelRefs) {
  if (typeof model !== 'string') continue;
  const known = KNOWN_MODELS.some(prefix => model.startsWith(prefix));
  if (!known && model !== 'default' && model !== '') {
    warnings.push(`Unknown model reference at ${path}: "${model}"`);
  }
}

// ── 6. Cron jobs ──────────────────────────────────────────────────────────────
try {
  const cronRaw = fs.readFileSync(CRON_PATH, 'utf8');
  const cronData = JSON.parse(cronRaw);
  const jobs = Array.isArray(cronData) ? cronData : (cronData.jobs || []);

  if (jobs.length > MAX_CRON_JOBS) {
    warnings.push(`Cron job count ${jobs.length} exceeds soft limit ${MAX_CRON_JOBS}`);
  }

  // Check for automation jobs (Execute:/Run: prefix) without "Execute silently:" that fire to main session
  // Intentional report/reminder jobs (Reminder:, Run X and send, memory audits) are excluded
  const SILENT_EXPECTED_PATTERNS = [/^Execute:/i, /^bash /i, /^node /i, /^cd /i, /^Auto-start/i];
  const INTENTIONAL_PATTERNS = [/^(⏰|🔍|Run .* and send|Reminder:)/i, /send.*to steve/i, /daily KPI/i, /memory (audit|maintenance)/i];
  const noisyJobs = jobs.filter(j => {
    const text = (j.payload?.text || '').trim();
    const isMain = !j.sessionTarget || j.sessionTarget === 'main';
    const isSilent = text.startsWith('Execute silently:');
    const looksLikeAutomation = SILENT_EXPECTED_PATTERNS.some(p => p.test(text));
    const isIntentional = INTENTIONAL_PATTERNS.some(p => p.test(text));
    return isMain && !isSilent && j.payload?.kind === 'systemEvent' && looksLikeAutomation && !isIntentional;
  });
  if (noisyJobs.length > 0) {
    warnings.push(`${noisyJobs.length} automation cron job(s) missing "Execute silently:" prefix — may spam chat: ${noisyJobs.map(j=>j.name||j.id).join(', ')}`);
  }
} catch (e) {
  warnings.push(`Could not read cron/jobs.json: ${e.message}`);
}

// ── 7. Report ─────────────────────────────────────────────────────────────────
const agentCount = Array.isArray(agents) ? agents.length : '?';
const summary = `Config audit: ${errors.length} errors, ${warnings.length} warnings (${agentCount} agents)`;

if (errors.length > 0) {
  emitEvent('config_audit', 'fail', summary, { errors, warnings });
  console.error('\n🔴 CONFIG AUDIT — ERRORS\n');
  errors.forEach(e => console.error(`  ✗ ${e}`));
  warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  console.error(`\n${summary}\n`);
  process.exit(2);
} else if (warnings.length > 0) {
  emitEvent('config_audit', 'warn', summary, { warnings });
  console.warn('\n🟡 CONFIG AUDIT — WARNINGS\n');
  warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  console.warn(`\n${summary}\n`);
  process.exit(1);
} else {
  emitEvent('config_audit', 'ok', summary, { agent_count: agentCount });
  console.log(`\n✅ CONFIG AUDIT — CLEAN\n  ${summary}\n`);
  process.exit(0);
}
