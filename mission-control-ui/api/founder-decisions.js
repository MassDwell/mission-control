/**
 * CR-OPERATOR-COMMAND-UPGRADE: Founder Decision Engine
 * Phase 3 — Strategic recommendations for venture advancement
 *
 * Analyses SSOT data and surfaces high-confidence decisions
 * the founder should make to advance the portfolio.
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
    console.warn(`[FOUNDER-DECISIONS] Cannot read ${filename}: ${e.message}`);
    return null;
  }
}

// ─── Scorers ──────────────────────────────────────────────────────────────────

/**
 * Score a venture's readiness to advance to the next stage.
 * Returns 0–100.
 */
function scoreVentureReadiness(venture) {
  let score = 0;
  // Research / investigation complete
  if (venture.research_complete || venture.investigation_complete) score += 30;
  // Opportunity score
  const oppScore = venture.opportunity_score || venture.score || 0;
  if (oppScore >= 28) score += 25;
  else if (oppScore >= 20) score += 10;
  // Team assigned
  const team = venture.team || [];
  if (Array.isArray(team) && team.length > 0) score += 20;
  // No critical blockers
  const blockers = venture.blockers || [];
  const criticalBlockers = Array.isArray(blockers)
    ? blockers.filter(b => b.severity === 'critical' || b.is_critical)
    : [];
  if (criticalBlockers.length === 0) score += 15;
  // Has a memo / written up
  if (venture.artifacts && venture.artifacts.memo) score += 10;
  return Math.min(score, 100);
}

// ─── Core generator ──────────────────────────────────────────────────────────

function generateFounderDecisions() {
  const decisions = {};

  // ── Decision 1: Which venture to advance ─────────────────────────────────
  try {
    // Try venture_scoreboard first (VentureOS), fall back to ventures.json
    const sbData = readSSO('venture_scoreboard.json') || readSSO('ventures.json');
    const allVentures = sbData
      ? (sbData.ventures || [])
      : [];

    // Find ventures in investigation/validation/MVP/early implementation stages
    const investigationStages = new Set([
      'investigation', 'investigation_complete', 'validated',
      'opportunity', 'stage_1_discovery', 'stage_2_validation', 'stage_3_mvp',
      'In Progress', 'in_progress', 'building', 'mvp', 'experiment'
    ]);

    const candidates = allVentures.filter(v =>
      v.status !== 'killed' &&
      (investigationStages.has(v.stage) || investigationStages.has(v.current_stage))
    );

    let topVenture = null;
    let topScore = 0;

    candidates.forEach(v => {
      const s = scoreVentureReadiness(v);
      if (s > topScore) {
        topScore = s;
        topVenture = v;
      }
    });

    if (topVenture && topScore >= 10) {
      const confidence = Math.round(topScore);
      const reasoning = [];
      if (topVenture.research_complete || topVenture.investigation_complete) {
        reasoning.push('Investigation / research marked complete');
      }
      const oppScore = topVenture.opportunity_score || topVenture.score || 0;
      if (oppScore > 0) reasoning.push(`Opportunity score: ${oppScore}/40`);
      const team = topVenture.team || [];
      if (Array.isArray(team) && team.length > 0) {
        reasoning.push(`Team assigned: ${team.join(', ')}`);
      }
      const blockers = topVenture.blockers || [];
      const criticalBlockers = Array.isArray(blockers)
        ? blockers.filter(b => b.severity === 'critical' || b.is_critical)
        : [];
      if (criticalBlockers.length === 0) reasoning.push('No critical blockers');
      if (reasoning.length === 0) reasoning.push(`Readiness score: ${topScore}/100`);

      const vid = topVenture.id || topVenture.venture_id;
      decisions.next_venture_to_advance = {
        recommendation: `Advance "${topVenture.name}" to implementation phase`,
        confidence: confidence / 100,
        confidence_pct: `${confidence}%`,
        reasoning,
        venture_id: vid,
        current_stage: topVenture.stage || topVenture.current_stage,
        action_url: vid ? `/api/ventures/${vid}/advance` : '/api/ventureos/ventures',
        icon: '🚀'
      };
    } else if (candidates.length > 0 && !topVenture) {
      // Candidates exist but none scored — surface generic guidance
      decisions.next_venture_to_advance = {
        recommendation: `${candidates.length} venture(s) in investigation — run readiness review`,
        confidence: 0.5,
        confidence_pct: '50%',
        reasoning: ['Ventures present in investigation stage', 'Readiness data incomplete or not scored yet'],
        venture_id: null,
        action_url: '/api/ventureos/ventures',
        icon: '🔍'
      };
    }
  } catch (e) {
    console.warn('[FOUNDER-DECISIONS] Decision 1 error:', e.message);
  }

  // ── Decision 2: Resource rebalancing (overloaded vs idle agents) ─────────
  try {
    const agentsData = readSSO('agents_runtime.json');
    if (agentsData && Array.isArray(agentsData.agents)) {
      const active = agentsData.agents.filter(a => a.status === 'active');
      let overloaded = null;
      let underutilized = null;

      active.forEach(agent => {
        const owned = typeof agent.owned_workstreams === 'number'
          ? agent.owned_workstreams
          : 0;
        if (owned >= 5 && (!overloaded || owned > (overloaded.owned_workstreams || 0))) {
          overloaded = agent;
        }
        if (owned === 0 && !underutilized) {
          underutilized = agent;
        }
      });

      if (overloaded && underutilized) {
        decisions.resource_rebalancing = {
          recommendation: `Move 1 workstream from ${overloaded.name} to ${underutilized.name}`,
          confidence: 0.85,
          confidence_pct: '85%',
          reasoning: [
            `${overloaded.name} owns ${overloaded.owned_workstreams} workstreams (overloaded)`,
            `${underutilized.name} is idle (0 workstreams)`,
            'Rebalancing improves throughput and reduces single-agent risk'
          ],
          from_agent: overloaded.id,
          to_agent: underutilized.id,
          action_url: '/api/workstreams?action=reassign',
          icon: '⚖️'
        };
      }
    }
  } catch (e) {
    console.warn('[FOUNDER-DECISIONS] Decision 2 error:', e.message);
  }

  // ── Decision 3: Kill a stalled / at-risk venture ─────────────────────────
  try {
    const sbData = readSSO('venture_scoreboard.json') || readSSO('ventures.json');
    const allVentures = sbData ? (sbData.ventures || []) : [];

    // Look for ventures with kill flags
    const atRisk = allVentures.filter(v =>
      v.status === 'active' &&
      (v.kill_flag || v.at_risk || (v.kill_score && v.kill_score >= 70))
    );

    if (atRisk.length > 0) {
      const top = atRisk[0];
      const vid = top.id || top.venture_id;
      decisions.consider_kill = {
        recommendation: `Review "${top.name}" for kill decision`,
        confidence: 0.7,
        confidence_pct: '70%',
        reasoning: [
          top.kill_reason || 'Kill trigger threshold reached',
          `Kill score: ${top.kill_score || 'N/A'}`
        ],
        venture_id: vid,
        action_url: vid ? `/api/ventures/${vid}/check-kill` : '/api/ventureos/ventures',
        icon: '☠️'
      };
    }
  } catch (e) {
    console.warn('[FOUNDER-DECISIONS] Decision 3 error:', e.message);
  }

  return decisions;
}

// ─── Module export ────────────────────────────────────────────────────────────

module.exports = {
  generateFounderDecisions,
  SSOT_PATH
};
