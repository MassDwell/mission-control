#!/usr/bin/env node
/**
 * model-health-check.js — Validate all configured AI providers are reachable
 *
 * Checks: Google Gemini, Gemma, metaclaw proxy
 * Run: node scripts/model-health-check.js
 * Exit 0: all critical providers healthy
 * Exit 1: one or more critical providers down
 *
 * Used by: HEARTBEAT.md, startup validation
 */

import fs from 'fs';
import path from 'path';

const WORKSPACE = '/Users/openclaw/.openclaw/workspace';
const LOG = path.join(WORKSPACE, 'data/logs/model-health-check.log');

function log(msg) {
  const entry = { ts: new Date().toISOString(), msg };
  try { fs.appendFileSync(LOG, JSON.stringify(entry) + '\n'); } catch {}
}

const PROVIDERS = [
  {
    name: 'Google Gemini 2.5 Flash (primary AI)',
    critical: true,
    check: async () => {
      const key = process.env.GEMINI_API_KEY || (() => { try { const cfg = JSON.parse(require('fs').readFileSync(process.env.HOME + '/.openclaw/openclaw.json', 'utf8')); return cfg.env?.GEMINI_API_KEY || ''; } catch { return ''; } })();
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 5 } }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const d = await res.json();
      if (!d.candidates) throw new Error(d.error?.message || `HTTP ${res.status}`);
      return 'ok';
    },
  },
  {
    name: 'Google Gemma 3 27B (utility/extraction)',
    critical: false, // non-critical: only used in batch scripts
    check: async () => {
      const key = process.env.GEMINI_API_KEY || (() => { try { const cfg = JSON.parse(require('fs').readFileSync(process.env.HOME + '/.openclaw/openclaw.json', 'utf8')); return cfg.env?.GEMINI_API_KEY || ''; } catch { return ''; } })();
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Return only: {"ok":true}' }] }], generationConfig: { maxOutputTokens: 20, temperature: 0 } }),
          signal: AbortSignal.timeout(10000),
        }
      );
      const d = await res.json();
      if (!d.candidates) throw new Error(d.error?.message || `HTTP ${res.status}`);
      return 'ok';
    },
  },
  {
    name: 'Metaclaw proxy (background tasks)',
    critical: false, // non-critical: it was stopped 2026-03-21, not currently used
    check: async () => {
      const res = await fetch('http://127.0.0.1:30000/healthz', { signal: AbortSignal.timeout(2000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return 'ok';
    },
  },
  {
    name: 'Google Gemini API (key validity)',
    critical: true,
    check: async () => {
      const key = process.env.GEMINI_API_KEY || (() => { try { const cfg = JSON.parse(require('fs').readFileSync(process.env.HOME + '/.openclaw/openclaw.json', 'utf8')); return cfg.env?.GEMINI_API_KEY || ''; } catch { return ''; } })();
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { signal: AbortSignal.timeout(5000) });
      const d = await res.json();
      if (!d.models) throw new Error(d.error?.message || `HTTP ${res.status}`);
      return `${d.models.length} models listed`;
    },
  },
];

(async () => {
  const results = [];
  let anyFail = false;
  let criticalFail = false;

  for (const p of PROVIDERS) {
    const t0 = Date.now();
    try {
      const detail = await p.check();
      const latencyMs = Date.now() - t0;
      results.push({ name: p.name, status: 'ok', latencyMs, detail });
      console.log(`  ✅ ${p.name} (${latencyMs}ms)`);
    } catch (err) {
      const latencyMs = Date.now() - t0;
      results.push({ name: p.name, status: 'fail', latencyMs, error: err.message, critical: p.critical });
      console.log(`  ${p.critical ? '❌' : '⚠️ '} ${p.name}: ${err.message} (${latencyMs}ms)`);
      anyFail = true;
      if (p.critical) criticalFail = true;
    }
  }

  log({ results });

  if (criticalFail) {
    console.log('\n❌ CRITICAL PROVIDER DOWN — main agent may be degraded');
    process.exit(1);
  } else if (anyFail) {
    console.log('\n⚠️  Non-critical provider(s) down — main agent not affected');
    process.exit(0);
  } else {
    console.log('\n✅ All providers healthy');
    process.exit(0);
  }
})();
