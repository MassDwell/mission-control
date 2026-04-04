#!/usr/bin/env node
/**
 * runtime-audit.js — Nightly Runtime v1 Integrity Check
 *
 * Checks:
 * 1. Banned phrase references in active workspace files
 * 2. Fake/archived agent names in active config
 * 3. Job ledger integrity (valid status, no orphaned running jobs)
 * 4. Execution mode definitions completeness
 * 5. Paperclip sync health (optional)
 *
 * Usage:
 *   node runtime-audit.js [--verbose] [--output path/to/report.json]
 *
 * Exit codes:
 *   0 = clean
 *   1 = warnings found (non-blocking)
 *   2 = critical issues found (requires attention)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = path.join(process.env.HOME, '.openclaw/workspace');
const LEDGER = path.join(WORKSPACE, 'data/runtime/job-ledger.jsonl');
const MODES_FILE = path.join(WORKSPACE, 'canon/system/runtime-v1/execution-modes.json');
const AUDIT_DIR = path.join(WORKSPACE, 'data/runtime');
const TODAY = new Date().toISOString().slice(0, 10);

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const outputIdx = args.indexOf('--output');
const OUTPUT = outputIdx >= 0 ? args[outputIdx + 1] : path.join(AUDIT_DIR, `audit-${TODAY}.json`);

// Fake agent names that should not appear in active files
const BANNED_AGENT_NAMES = ['Codesmith', 'codesmith', 'Moonshot', 'moonshot', 'Personal Assistant'];
const BANNED_PHRASES = [
  'Codesmith completed',
  'Codesmith independently',
  'Moonshot analyzed',
  'Moonshot decided',
  'Dispatched to Codesmith',
  'Dispatched to Moonshot',
  'Agent swarm',
  'Agent team completed',
  '4 agents deployed',
  'The agents are working',
  'Codesmith is building',
  'Personal Assistant handled',
];

// Active files to scan (not archives)
const ACTIVE_SCAN_DIRS = [
  path.join(WORKSPACE, 'MEMORY.md'),
  path.join(WORKSPACE, 'AGENTS.md'),
  path.join(WORKSPACE, 'HEARTBEAT.md'),
  path.join(WORKSPACE, 'SOUL.md'),
  path.join(WORKSPACE, 'canon/registry.json'),
  path.join(WORKSPACE, 'canon/clawson'),
  path.join(WORKSPACE, 'canon/system/runtime-v1'),
];

const VALID_STATUSES = new Set(['queued', 'claimed', 'running', 'validating', 'completed', 'failed', 'blocked', 'cancelled']);
const REQUIRED_MODE_FIELDS = ['mode_id', 'description', 'intended_use', 'executor_type', 'input_schema', 'output_schema', 'validation_rules', 'fail_conditions', 'report_phrasing', 'artifact_expectations'];

const report = {
  generated_at: new Date().toISOString(),
  overall_status: 'clean',
  critical: [],
  warnings: [],
  info: [],
  checks: {}
};

function flag(level, check, message) {
  report[level].push({ check, message });
  if (level === 'critical') report.overall_status = 'critical';
  else if (level === 'warnings' && report.overall_status === 'clean') report.overall_status = 'warnings';
  if (VERBOSE || level === 'critical') console.log(`[${level.toUpperCase()}] ${check}: ${message}`);
}

function info(check, message) {
  report.info.push({ check, message });
  if (VERBOSE) console.log(`[INFO] ${check}: ${message}`);
}

// ── Check 1: Banned phrases in active files ──────────────────────────────────
function checkBannedPhrases() {
  let hits = 0;
  for (const scanPath of ACTIVE_SCAN_DIRS) {
    if (!fs.existsSync(scanPath)) continue;
    const stat = fs.statSync(scanPath);
    const files = stat.isDirectory()
      ? fs.readdirSync(scanPath).filter(f => !f.startsWith('_')).map(f => path.join(scanPath, f))
      : [scanPath];

    for (const file of files) {
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
      // Skip the reporting-rules file itself — it intentionally lists banned phrases in a table
      if (file.includes('reporting-rules.md')) continue;
      const content = fs.readFileSync(file, 'utf8');
      for (const phrase of BANNED_PHRASES) {
        if (content.includes(phrase)) {
          flag('warnings', 'banned_phrases', `Found "${phrase}" in ${path.relative(WORKSPACE, file)}`);
          hits++;
        }
      }
    }
  }
  report.checks.banned_phrases = { hits };
  info('banned_phrases', `Scanned ${ACTIVE_SCAN_DIRS.length} paths, found ${hits} banned phrases`);
}

// ── Check 2: Fake agent references in active config ──────────────────────────
function checkFakeAgentRefs() {
  const registryPath = path.join(WORKSPACE, 'canon/registry.json');
  if (!fs.existsSync(registryPath)) {
    flag('critical', 'registry', 'canon/registry.json missing');
    return;
  }
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const activeAgents = registry.agents || [];
  const fakeActive = activeAgents.filter(a => BANNED_AGENT_NAMES.some(n => a.name?.includes(n) || a.id?.includes(n.toLowerCase())));
  if (fakeActive.length > 0) {
    flag('critical', 'registry_fake_agents', `Found fake agents in active registry.agents[]: ${fakeActive.map(a => a.name).join(', ')}`);
  } else {
    info('registry_fake_agents', `Active agents: ${activeAgents.map(a => a.name).join(', ')} — no fake agents`);
  }
  report.checks.fake_agent_refs = { active_agents: activeAgents.map(a => a.name), fake_found: fakeActive.length };
}

// ── Check 3: Job ledger integrity ────────────────────────────────────────────
function checkJobLedger() {
  if (!fs.existsSync(LEDGER)) {
    info('job_ledger', 'Job ledger does not exist yet (no jobs run)');
    report.checks.job_ledger = { total: 0, invalid_status: 0, orphaned: 0 };
    return;
  }
  const lines = fs.readFileSync(LEDGER, 'utf8').trim().split('\n').filter(Boolean);
  let invalidStatus = 0;
  let orphaned = 0;
  const now = Date.now();
  const ORPHAN_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

  lines.forEach((line, i) => {
    try {
      const job = JSON.parse(line);
      if (!VALID_STATUSES.has(job.status)) {
        flag('warnings', 'job_ledger', `Line ${i+1}: invalid status "${job.status}" for job ${job.job_id}`);
        invalidStatus++;
      }
      if (job.status === 'running' && job.started_at) {
        const age = now - new Date(job.started_at).getTime();
        if (age > ORPHAN_THRESHOLD_MS) {
          flag('warnings', 'job_ledger', `Orphaned job: ${job.job_id} has been "running" for >24h since ${job.started_at}`);
          orphaned++;
        }
      }
    } catch {
      flag('warnings', 'job_ledger', `Line ${i+1}: malformed JSON in job ledger`);
    }
  });

  report.checks.job_ledger = { total: lines.length, invalid_status: invalidStatus, orphaned };
  info('job_ledger', `${lines.length} jobs in ledger. Invalid status: ${invalidStatus}. Orphaned: ${orphaned}.`);
}

// ── Check 4: Execution mode definitions ──────────────────────────────────────
function checkExecutionModes() {
  if (!fs.existsSync(MODES_FILE)) {
    flag('critical', 'execution_modes', 'execution-modes.json missing from canon/system/runtime-v1/');
    return;
  }
  const modes = JSON.parse(fs.readFileSync(MODES_FILE, 'utf8')).modes || {};
  let missingFields = 0;
  for (const [modeId, def] of Object.entries(modes)) {
    for (const field of REQUIRED_MODE_FIELDS) {
      if (!(field in def)) {
        flag('warnings', 'execution_modes', `Mode "${modeId}" missing required field: ${field}`);
        missingFields++;
      }
    }
  }
  report.checks.execution_modes = { mode_count: Object.keys(modes).length, missing_fields: missingFields };
  info('execution_modes', `${Object.keys(modes).length} modes defined. Missing fields: ${missingFields}.`);
}

// ── Check 5: Archive directories exist (fake agents quarantined) ─────────────
function checkArchiveIntegrity() {
  const agentsArchive = path.join(WORKSPACE, 'canon/agents/_archive');
  const systemArchive = path.join(WORKSPACE, 'canon/system/_archive');
  const archived = [];
  if (fs.existsSync(agentsArchive)) archived.push(...fs.readdirSync(agentsArchive));
  report.checks.archive = { agents_archived: archived };
  info('archive', `Archived agent dirs: ${archived.join(', ') || 'none'}`);
}

// ── Run all checks ────────────────────────────────────────────────────────────
console.log(`[runtime-audit] Running Runtime v1 integrity check — ${TODAY}`);
checkBannedPhrases();
checkFakeAgentRefs();
checkJobLedger();
checkExecutionModes();
checkArchiveIntegrity();

// ── Write report ──────────────────────────────────────────────────────────────
fs.mkdirSync(AUDIT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
console.log(`[runtime-audit] Status: ${report.overall_status.toUpperCase()}`);
console.log(`[runtime-audit] Critical: ${report.critical.length} | Warnings: ${report.warnings.length}`);
console.log(`[runtime-audit] Report: ${OUTPUT}`);

process.exit(report.critical.length > 0 ? 2 : report.warnings.length > 0 ? 1 : 0);
