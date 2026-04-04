#!/usr/bin/env node
/**
 * stall-detector.js — Hermes stall detection for coding tasks
 *
 * Scans all coding checkpoint state files for tasks that have exceeded
 * the 10-minute no-progress threshold. Emits warn events to event bus.
 *
 * Run by Hermes cron (every 5 minutes is fine).
 * Also checks for Paperclip issues stuck in_progress too long.
 */

import fs from 'fs';
import path from 'path';

const STATE_DIR = '/Users/openclaw/.openclaw/workspace/data/coding-checkpoints';
const EVENT_BUS = '/Users/openclaw/.openclaw/workspace/data/task-records/event-bus.jsonl';
const STALL_THRESHOLD_MS = 10 * 60 * 1000;      // 10 min
const CRITICAL_THRESHOLD_MS = 60 * 60 * 1000;    // 60 min = critical

const PAPERCLIP_API = 'http://127.0.0.1:3100/api';
const COMPANY_ID = '6e53f2a5-1a3f-4557-99d6-790eeb70ce67';
const PAPERCLIP_STALL_MS = 30 * 60 * 1000; // 30 min for Paperclip in_progress

fs.mkdirSync(STATE_DIR, { recursive: true });
fs.mkdirSync('/Users/openclaw/.openclaw/workspace/data/task-records', { recursive: true });

function emitEvent(type, status, detail, data = {}) {
  const event = { ts: new Date().toISOString(), source: 'stall-detector', type, status, detail, data };
  try {
    fs.appendFileSync(EVENT_BUS, JSON.stringify(event) + '\n', 'utf8');
  } catch {}
}

function formatAge(ms) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

let stalled = 0;
let clean = 0;
const alerts = [];

// ── 1. Coding checkpoint stalls ──────────────────────────────────────────────
if (fs.existsSync(STATE_DIR)) {
  const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json'));

  for (const f of files) {
    try {
      const state = JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), 'utf8'));
      if (state.terminal_state) continue; // already closed

      const age = Date.now() - new Date(state.last_heartbeat).getTime();
      if (age > STALL_THRESHOLD_MS) {
        const severity = age > CRITICAL_THRESHOLD_MS ? 'critical' : 'warn';
        const detail = `Coding task stalled ${formatAge(age)} at stage "${state.current_stage}": ${state.objective}`;
        emitEvent('coding_task_stalled', severity, detail, {
          task_id: state.task_id,
          stage: state.current_stage,
          objective: state.objective,
          stale_ms: age,
          last_heartbeat: state.last_heartbeat,
        });
        alerts.push(`⚠ [${severity.toUpperCase()}] ${state.task_id}: stalled ${formatAge(age)} at ${state.current_stage}`);
        stalled++;
      } else {
        clean++;
      }
    } catch {}
  }
}

// ── 2. Paperclip in_progress stalls ─────────────────────────────────────────
try {
  const res = await fetch(`${PAPERCLIP_API}/companies/${COMPANY_ID}/issues?status=in_progress&limit=50`);
  if (res.ok) {
    const data = await res.json();
    const issues = Array.isArray(data) ? data : (data.issues || data.data || []);
    for (const issue of issues) {
      const updatedAt = issue.updatedAt || issue.updated_at;
      if (!updatedAt) continue;
      const age = Date.now() - new Date(updatedAt).getTime();
      if (age > PAPERCLIP_STALL_MS) {
        const detail = `Paperclip issue stalled ${formatAge(age)}: ${issue.title || issue.id}`;
        emitEvent('paperclip_issue_stalled', 'warn', detail, {
          issue_id: issue.id,
          title: issue.title,
          stale_ms: age,
          updated_at: updatedAt,
        });
        alerts.push(`⚠ Paperclip ${issue.id}: stalled ${formatAge(age)}`);
        stalled++;
      }
    }
  }
} catch {
  // Paperclip may not be running — not a fatal error
}

// ── 3. Summary ───────────────────────────────────────────────────────────────
if (alerts.length > 0) {
  console.log(`Stall detector: ${stalled} stalled, ${clean} clean`);
  alerts.forEach(a => console.log(a));
  process.exit(1); // signal to caller that alerts were raised
} else {
  const msg = `Stall detector: all ${clean} task(s) healthy`;
  emitEvent('stall_check', 'ok', msg, { checked: clean });
  console.log(msg);
  process.exit(0);
}
