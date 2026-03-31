#!/usr/bin/env node
/**
 * hermes-reviewer.js — Process pending Hermes review queue items
 *
 * Runs on cron cadence (same as hermes-ingest.js, every 30 min).
 * Also called at the end of hermes-ingest.js via processReviewQueue().
 *
 * Usage:
 *   node hermes-reviewer.js           — process all pending items
 *   node hermes-reviewer.js --list    — show queue status
 *   node hermes-reviewer.js --pending — show only pending items
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const REVIEW_QUEUE  = '/Users/openclaw/.openclaw/workspace/data/hermes/review-queue.jsonl';
const EVENT_BUS     = '/Users/openclaw/.openclaw/workspace/data/hermes/event-bus.jsonl';
const MAX_ARTIFACT_BYTES = 50_000; // 50KB cap for artifact reading

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emitEvent(type, status, detail, data = {}) {
  const event = { ts: new Date().toISOString(), source: 'hermes-reviewer', type, status, detail, data };
  try { fs.appendFileSync(EVENT_BUS, JSON.stringify(event) + '\n', 'utf8'); } catch {}
}

function loadQueue() {
  if (!fs.existsSync(REVIEW_QUEUE)) return [];
  return fs.readFileSync(REVIEW_QUEUE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

function saveQueue(items) {
  fs.mkdirSync(path.dirname(REVIEW_QUEUE), { recursive: true });
  fs.writeFileSync(REVIEW_QUEUE, items.map(i => JSON.stringify(i)).join('\n') + '\n', 'utf8');
}

function readArtifact(artifactPath) {
  if (!artifactPath || !fs.existsSync(artifactPath)) return null;
  try {
    const stat = fs.statSync(artifactPath);
    if (stat.size > MAX_ARTIFACT_BYTES) {
      return fs.readFileSync(artifactPath, 'utf8').slice(0, MAX_ARTIFACT_BYTES) + '\n...[truncated]';
    }
    return fs.readFileSync(artifactPath, 'utf8');
  } catch {
    return null;
  }
}

function fireEscalation(item, reason) {
  const text = `🚨 Hermes Review: ${item.type} needs your attention.\n\nItem: ${item.summary}\nReason: ${reason}\nArtifact: ${item.artifact_path}\n\nReply approve/reject.`;
  try {
    execSync(`openclaw system event --text ${JSON.stringify(text)} --mode now`, { stdio: 'pipe' });
    console.log(`  [escalation] Telegram alert sent for ${item.id}`);
  } catch (err) {
    console.warn(`  [escalation] Telegram alert failed: ${err.message}`);
    emitEvent('escalation_alert_failed', 'warn', `Failed to send Telegram alert for ${item.id}`, { review_id: item.id, error: err.message });
  }
}

// ─── Type-specific reviewers ──────────────────────────────────────────────────

/**
 * Returns { decision: 'ack'|'escalated', reason: string }
 */
function reviewItem(item, content) {
  switch (item.type) {
    case 'email_draft':   return reviewEmailDraft(item, content);
    case 'pr':            return reviewPR(item, content);
    case 'post':          return reviewPost(item, content);
    case 'decision':      return reviewDecision(item, content);
    case 'cron_output':   return reviewCronOutput(item, content);
    default:              return { decision: 'escalated', reason: `Unknown type: ${item.type}` };
  }
}

function reviewEmailDraft(item, content) {
  if (!content) return { decision: 'escalated', reason: 'Artifact file missing or unreadable' };

  const issues = [];

  // Check for unverified dollar figures (patterns like $XX,XXX or $XXX,XXX)
  const dollarFigures = content.match(/\$[\d,]+/g) || [];
  if (dollarFigures.length > 0) {
    // Flag if figures look hallucinated (very round or very specific with no context)
    const suspicious = dollarFigures.filter(f => {
      const num = parseInt(f.replace(/[$,]/g, ''));
      return num > 100_000 && num % 10_000 === 0; // suspiciously round large figures
    });
    if (suspicious.length > 0) {
      issues.push(`Contains large round dollar figures that may need verification: ${suspicious.join(', ')}`);
    }
  }

  // Check for DNC-like patterns (generic/placeholder recipients)
  const toMatch = content.match(/\*\*To:\*\*\s*(.+)/i) || content.match(/^To:\s*(.+)/im);
  if (toMatch) {
    const recipient = toMatch[1].trim();
    if (/example\.(com|org|net)|test@|noreply@|placeholder/i.test(recipient)) {
      issues.push(`Recipient looks like a placeholder/test address: ${recipient}`);
    }
  }

  // Check for missing recipient entirely
  if (!/\*\*To:\*\*|^To:/im.test(content)) {
    issues.push('No recipient found in draft');
  }

  // Check for tone indicators (all caps yelling, excessive exclamation)
  const caps = (content.match(/\b[A-Z]{4,}\b/g) || []).filter(w => !['ADU', 'URL', 'HTTP', 'HTTPS', 'SQL'].includes(w));
  if (caps.length > 3) {
    issues.push(`Possible tone issue: excessive capitalization (${caps.slice(0, 3).join(', ')}...)`);
  }

  if (issues.length === 0) {
    return { decision: 'ack', reason: 'Email draft passes all checks: recipient present, figures look reasonable, tone acceptable' };
  } else if (issues.length === 1 && !issues[0].includes('placeholder') && !issues[0].includes('DNC')) {
    // Single minor issue — still ack but note it
    return { decision: 'ack', reason: `Minor flag noted (auto-approved): ${issues[0]}` };
  } else {
    return { decision: 'escalated', reason: issues.join('; ') };
  }
}

function reviewPR(item, content) {
  if (!content) return { decision: 'escalated', reason: 'Artifact file missing or unreadable' };

  const issues = [];

  // Check for Prisma/migration changes
  if (/\.prisma|migration|schema\.prisma/i.test(content)) {
    issues.push('Contains Prisma/migration changes — migration audit required before merge');
  }

  // Check for breaking patterns
  if (/drop table|drop column|delete from|truncate/i.test(content)) {
    issues.push('Contains destructive database operations — requires explicit confirmation');
  }

  // Check for hardcoded secrets patterns
  if (/password\s*=\s*['"][^'"]{8,}|api_key\s*=\s*['"][^'"]{8,}|secret\s*=\s*['"][^'"]{8,}/i.test(content)) {
    issues.push('Possible hardcoded secret detected in PR content');
  }

  if (issues.length === 0) {
    return { decision: 'ack', reason: 'PR passes automated checks: no migrations, no destructive ops, no hardcoded secrets' };
  } else {
    return { decision: 'escalated', reason: issues.join('; ') };
  }
}

function reviewPost(item, content) {
  if (!content) return { decision: 'escalated', reason: 'Artifact file missing or unreadable' };

  const issues = [];

  // Check factual anchoring (should reference something concrete)
  if (content.length < 50) {
    issues.push('Post content too short to be substantive');
  }

  // Check for unverified statistics
  const statsPattern = /\d+%|\d+x|increased by \d+|decreased by \d+|grew \d+/gi;
  const stats = content.match(statsPattern) || [];
  if (stats.length > 2) {
    issues.push(`Multiple unverified statistics detected (${stats.length}): verify before posting`);
  }

  // Check for brand-inappropriate language
  const inappropriateTerms = /guaranteed|100% sure|never fails|always works|get rich|make money fast/i;
  if (inappropriateTerms.test(content)) {
    issues.push('Contains brand-inappropriate language (overpromising/guarantee language)');
  }

  if (issues.length === 0) {
    return { decision: 'ack', reason: 'Post passes review: substantive, no excessive unverified stats, tone acceptable' };
  } else if (issues.length === 1 && !issues[0].includes('inappropriate')) {
    return { decision: 'ack', reason: `Minor flag (auto-approved): ${issues[0]}` };
  } else {
    return { decision: 'escalated', reason: issues.join('; ') };
  }
}

function reviewDecision(item, content) {
  if (!content) return { decision: 'escalated', reason: 'Artifact file missing or unreadable' };

  const issues = [];

  // Check for evidence anchoring
  if (!/evidence|because|reason|data|metrics|results|shows|indicates|confirms/i.test(content)) {
    issues.push('Decision lacks evidence anchoring — no rationale/data keywords found');
  }

  // Check for acknowledged risks
  if (content.length < 100) {
    issues.push('Decision document too brief to be well-considered');
  }

  if (issues.length === 0) {
    return { decision: 'ack', reason: 'Decision appears evidence-anchored and substantive' };
  } else {
    return { decision: 'escalated', reason: issues.join('; ') };
  }
}

function reviewCronOutput(item, content) {
  if (!content) return { decision: 'escalated', reason: 'Artifact file missing or unreadable' };

  const issues = [];

  // Check for error signatures
  const errorPatterns = /error:|exception:|traceback|fatal:|failed:|exit code [^0]/i;
  if (errorPatterns.test(content)) {
    issues.push('Cron output contains error signatures');
  }

  // Check for empty/stale output
  if (content.trim().length < 10) {
    issues.push('Cron output appears empty or minimal');
  }

  // Check for timestamp freshness if present
  const tsMatch = content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  if (tsMatch) {
    const outputTs = new Date(tsMatch[0]).getTime();
    const ageHours = (Date.now() - outputTs) / 3_600_000;
    if (ageHours > 25) {
      issues.push(`Output timestamp appears stale: ${tsMatch[0]} (${Math.round(ageHours)}h ago)`);
    }
  }

  if (issues.length === 0) {
    return { decision: 'ack', reason: 'Cron output looks clean: no error signatures, content present, timestamp fresh' };
  } else {
    return { decision: 'escalated', reason: issues.join('; ') };
  }
}

// ─── CLI modes ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--list')) {
  const items = loadQueue();
  if (items.length === 0) {
    console.log('[hermes-reviewer] Review queue is empty.');
    process.exit(0);
  }
  console.log(`[hermes-reviewer] Queue (${items.length} items):`);
  items.forEach(item => {
    console.log(`  ${item.id} [${item.status}] ${item.type} | ${item.urgency} | ${item.summary}`);
    if (item.decision_reason) console.log(`    → ${item.decision_reason}`);
  });
  process.exit(0);
}

if (args.includes('--pending')) {
  const items = loadQueue().filter(i => i.status === 'pending');
  if (items.length === 0) {
    console.log('[hermes-reviewer] No pending items.');
    process.exit(0);
  }
  console.log(`[hermes-reviewer] Pending items (${items.length}):`);
  items.forEach(item => {
    console.log(`  ${item.id} [${item.urgency}] ${item.type}: ${item.summary}`);
  });
  process.exit(0);
}

// ─── Main: processReviewQueue ─────────────────────────────────────────────────

export async function processReviewQueue() {
  const items = loadQueue();
  const pending = items.filter(i => i.status === 'pending');

  if (pending.length === 0) {
    console.log('[hermes-reviewer] No pending review items.');
    return { processed: 0, acked: 0, escalated: 0 };
  }

  console.log(`[hermes-reviewer] Processing ${pending.length} pending item(s)...`);

  let acked = 0;
  let escalated = 0;

  for (const item of pending) {
    console.log(`  → [${item.id}] ${item.type} [${item.urgency}]: ${item.summary}`);

    const content = readArtifact(item.artifact_path);
    const { decision, reason } = reviewItem(item, content);

    item.status        = decision;
    item.decision      = decision;
    item.decision_reason = reason;
    item.decision_ts   = new Date().toISOString();

    if (decision === 'ack') {
      acked++;
      console.log(`     ACK: ${reason}`);
      emitEvent('ACK', 'ack',
        `Hermes ACK: ${item.type} "${item.summary}"`,
        { review_id: item.id, reason, artifact_path: item.artifact_path }
      );
    } else {
      escalated++;
      console.log(`     ESCALATED: ${reason}`);
      emitEvent('ESCALATION_NOTICE', 'escalated',
        `Hermes escalated: ${item.type} "${item.summary}" — ${reason}`,
        { review_id: item.id, reason, artifact_path: item.artifact_path }
      );
      fireEscalation(item, reason);
    }
  }

  saveQueue(items);

  console.log(`[hermes-reviewer] Done: ${acked} acked, ${escalated} escalated.`);
  return { processed: pending.length, acked, escalated };
}

// ─── Run directly (not when imported as module) ───────────────────────────────

import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await processReviewQueue();
  process.exit(result.escalated > 0 ? 2 : 0);
}
