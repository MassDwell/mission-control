/**
 * CR-OPERATOR-COMMAND-UPGRADE: Operator Guidance Engine
 * Phase 3 — AI-powered recommendations for daily operator actions
 *
 * Rules engine reads SSOT files and generates prioritized guidance.
 * Up to 4 recommendations sorted by priority (HIGH > MEDIUM > LOW).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SSOT_PATH = path.join(os.homedir(), '.openclaw/workspace/data/mission-control');

// ─── SSOT helpers ────────────────────────────────────────────────────────────

function readSSO(filename) {
  const fp = path.join(SSOT_PATH, filename);
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch (e) {
    console.warn(`[OPERATOR-GUIDANCE] Cannot read ${filename}: ${e.message}`);
    return null;
  }
}

// ─── Rule helpers ─────────────────────────────────────────────────────────────

function ageMs(isoTimestamp) {
  try {
    return Date.now() - new Date(isoTimestamp).getTime();
  } catch (_) {
    return 0;
  }
}

function hoursAgo(isoTimestamp) {
  return Math.floor(ageMs(isoTimestamp) / (1000 * 60 * 60));
}

// ─── Core generator ──────────────────────────────────────────────────────────

function generateOperatorGuidance() {
  const guidance = [];

  // ── Rule 1: Stalled workstreams (no update >8h) ──────────────────────────
  try {
    const wsData = readSSO('workstreams.json');
    if (wsData && Array.isArray(wsData.active)) {
      wsData.active.forEach(ws => {
        const ts = ws.last_event || ws.updated_at || ws.timestamp;
        if (!ts) return;
        const h = hoursAgo(ts);
        if (h >= 8) {
          guidance.push({
            priority: 'HIGH',
            action: `Unblock workstream: ${ws.name || ws.id}`,
            status: `Stalled for ${h}h — last update: ${new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            icon: '⚠️',
            detail_url: `/api/workstreams/${ws.id}`
          });
        }
      });
    }
  } catch (e) {
    console.warn('[OPERATOR-GUIDANCE] Rule 1 error:', e.message);
  }

  // ── Rule 2: Idle active agents (no heartbeat >4h) ────────────────────────
  try {
    const agentsData = readSSO('agents_runtime.json');
    if (agentsData && Array.isArray(agentsData.agents)) {
      agentsData.agents.forEach(agent => {
        if (agent.status !== 'active') return;
        const ts = agent.last_heartbeat;
        if (!ts) return;
        const h = hoursAgo(ts);
        if (h >= 4) {
          guidance.push({
            priority: 'MEDIUM',
            action: `Assign new task to ${agent.name}`,
            status: `Idle for ${h}h — last heartbeat at ${new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            icon: '🤖',
            detail_url: `/api/agents`
          });
        }
      });
    }
  } catch (e) {
    console.warn('[OPERATOR-GUIDANCE] Rule 2 error:', e.message);
  }

  // ── Rule 3: Blockers without owner ──────────────────────────────────────
  try {
    const blockedData = readSSO('blocked_work.json');
    const blockers = blockedData
      ? (blockedData.blockers || blockedData.items || blockedData.blocked || [])
      : [];
    const unowned = blockers.filter(b => !b.owner && !b.assigned_to);
    if (unowned.length > 0) {
      guidance.push({
        priority: 'HIGH',
        action: `Assign owners to ${unowned.length} unowned blocker${unowned.length > 1 ? 's' : ''}`,
        status: `Blockers without owners stall workstreams indefinitely`,
        icon: '🚧',
        detail_url: '/api/blockers'
      });
    }
  } catch (e) {
    console.warn('[OPERATOR-GUIDANCE] Rule 3 error:', e.message);
  }

  // ── Rule 4: Venture pipeline imbalance (many investigating, none building) ─
  try {
    const velocity = readSSO('venture_velocity.json');
    if (velocity && velocity.stages) {
      const s = velocity.stages;
      const investigating = (s.stage_2_validation || 0) + (s.stage_3_mvp || 0);
      const building = (s.stage_4_experiment || 0) + (s.stage_5_build || 0);
      if (investigating >= 2 && building === 0) {
        guidance.push({
          priority: 'MEDIUM',
          action: 'Advance a validated venture to the build phase',
          status: `${investigating} ventures in validation/MVP — none actively building`,
          icon: '🚀',
          detail_url: '/api/ventureos/ventures'
        });
      }
    }
  } catch (e) {
    console.warn('[OPERATOR-GUIDANCE] Rule 4 error:', e.message);
  }

  // ── Rule 5: High completion velocity (positive signal) ──────────────────
  try {
    const actData = readSSO('agent_activity.json');
    const activities = actData ? (actData.activities || []) : [];
    const since24h = Date.now() - 24 * 60 * 60 * 1000;
    const recentCompleted = activities.filter(a =>
      typeof a.action === 'string' &&
      a.action.toLowerCase().includes('complet') &&
      a.timestamp &&
      new Date(a.timestamp).getTime() > since24h
    ).length;

    if (recentCompleted >= 5) {
      guidance.push({
        priority: 'LOW',
        action: 'Review momentum — strong execution velocity',
        status: `${recentCompleted} completions in last 24h`,
        icon: '📈',
        detail_url: '/api/momentum'
      });
    }
  } catch (e) {
    console.warn('[OPERATOR-GUIDANCE] Rule 5 error:', e.message);
  }

  // ── Rule 6: No workstreams at all → system idle ────────────────────────
  try {
    const wsData = readSSO('workstreams.json');
    if (wsData) {
      const activeCount = Array.isArray(wsData.active) ? wsData.active.length : (wsData.active || 0);
      if (activeCount === 0) {
        guidance.push({
          priority: 'MEDIUM',
          action: 'Kick off new workstreams to maintain momentum',
          status: 'No active workstreams detected',
          icon: '🌊',
          detail_url: '/api/workstreams'
        });
      }
    }
  } catch (e) {
    console.warn('[OPERATOR-GUIDANCE] Rule 6 error:', e.message);
  }

  // Sort HIGH → MEDIUM → LOW, limit to 4
  const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  guidance.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));

  return guidance.slice(0, 4);
}

// ─── Module export ────────────────────────────────────────────────────────────

module.exports = {
  generateOperatorGuidance,
  SSOT_PATH
};
