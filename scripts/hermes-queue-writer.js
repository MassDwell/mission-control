#!/usr/bin/env node
/**
 * hermes-queue-writer.js — Submit an artifact to the Hermes review queue
 *
 * Usage:
 *   node hermes-queue-writer.js \
 *     --type email_draft|pr|post|decision|cron_output \
 *     --summary "one line description" \
 *     --artifact-path "path/to/content/file" \
 *     --urgency low|medium|high \
 *     [--wait]   # blocks until ACK or ESCALATE decision written (polls every 5s, 5min timeout)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const REVIEW_QUEUE = '/Users/openclaw/.openclaw/workspace/data/hermes/review-queue.jsonl';
const VALID_TYPES    = ['email_draft', 'pr', 'post', 'decision', 'cron_output'];
const VALID_URGENCY  = ['low', 'medium', 'high'];
const POLL_INTERVAL_MS = 5_000;
const WAIT_TIMEOUT_MS  = 300_000; // 5 minutes

// ─── Arg parsing ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

const type         = getArg('--type');
const summary      = getArg('--summary');
const artifactPath = getArg('--artifact-path');
const urgency      = getArg('--urgency') || 'medium';
const wait         = args.includes('--wait');

if (!type || !summary || !artifactPath) {
  console.error('Usage: hermes-queue-writer.js --type <type> --summary <summary> --artifact-path <path> [--urgency low|medium|high] [--wait]');
  console.error(`  Types:   ${VALID_TYPES.join(', ')}`);
  console.error(`  Urgency: ${VALID_URGENCY.join(', ')}`);
  process.exit(1);
}

if (!VALID_TYPES.includes(type)) {
  console.error(`Invalid type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`);
  process.exit(1);
}

if (!VALID_URGENCY.includes(urgency)) {
  console.error(`Invalid urgency "${urgency}". Must be one of: ${VALID_URGENCY.join(', ')}`);
  process.exit(1);
}

// Resolve to absolute path
const resolvedArtifactPath = path.resolve(artifactPath);

if (!fs.existsSync(resolvedArtifactPath)) {
  console.error(`Artifact not found: ${resolvedArtifactPath}`);
  process.exit(1);
}

// ─── Build item ──────────────────────────────────────────────────────────────

const ts     = new Date().toISOString();
const random = crypto.randomBytes(2).toString('hex');
const id     = `rev_${Date.now()}_${random}`;

const item = {
  id,
  ts,
  type,
  summary,
  artifact_path: resolvedArtifactPath,
  urgency,
  status: 'pending',
  decision: null,
  decision_reason: null,
  decision_ts: null,
};

fs.mkdirSync(path.dirname(REVIEW_QUEUE), { recursive: true });
fs.appendFileSync(REVIEW_QUEUE, JSON.stringify(item) + '\n', 'utf8');

console.log(`[hermes-queue-writer] Queued review item: ${id}`);
console.log(`  type:     ${type}`);
console.log(`  urgency:  ${urgency}`);
console.log(`  summary:  ${summary}`);
console.log(`  artifact: ${resolvedArtifactPath}`);

if (!wait) {
  process.exit(0);
}

// ─── Wait mode: poll for decision ────────────────────────────────────────────

console.log(`[hermes-queue-writer] Waiting for Hermes decision (timeout: ${WAIT_TIMEOUT_MS / 1000}s)...`);

const deadline = Date.now() + WAIT_TIMEOUT_MS;

function readQueueItem(targetId) {
  if (!fs.existsSync(REVIEW_QUEUE)) return null;
  const lines = fs.readFileSync(REVIEW_QUEUE, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.id === targetId) return parsed;
    } catch {}
  }
  return null;
}

function poll() {
  if (Date.now() > deadline) {
    console.error('[hermes-queue-writer] Timeout waiting for decision. Item remains pending.');
    process.exit(2);
  }

  const latest = readQueueItem(id);
  if (!latest) {
    setTimeout(poll, POLL_INTERVAL_MS);
    return;
  }

  if (latest.status === 'ack') {
    console.log(`[hermes-queue-writer] ACK received — ${latest.decision_reason || 'approved'}`);
    process.exit(0);
  } else if (latest.status === 'escalated') {
    console.log(`[hermes-queue-writer] ESCALATED — ${latest.decision_reason || 'needs human review'}`);
    process.exit(3);
  } else {
    setTimeout(poll, POLL_INTERVAL_MS);
  }
}

setTimeout(poll, POLL_INTERVAL_MS);
