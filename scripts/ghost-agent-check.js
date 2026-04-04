#!/usr/bin/env node
/**
 * ghost-agent-check.js — Detect stale/ghost agent references in OpenClaw config
 *
 * Scans openclaw.json cron jobs, agentToAgent allow lists, and subagent configs
 * for references to agents that no longer exist in the agents.list registry.
 *
 * Usage:
 *   node ghost-agent-check.js           # print report
 *   node ghost-agent-check.js --silent  # exit 1 if issues found, no output
 */

const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(process.env.HOME, '.openclaw/openclaw.json')
const CRON_PATH = path.join(process.env.HOME, '.openclaw/cron/jobs.json')
const LAUNCH_AGENTS_PATH = path.join(process.env.HOME, 'Library/LaunchAgents')

const silent = process.argv.includes('--silent')
const log = (...args) => { if (!silent) console.log(...args) }

let issues = []

// Load configs
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
const cronData = JSON.parse(fs.readFileSync(CRON_PATH, 'utf8'))
const cronJobs = Array.isArray(cronData) ? cronData : (cronData.jobs || [])

// Get registered agent IDs
const registeredAgents = new Set(
  (config.agents?.list || []).map(a => a.id).filter(Boolean)
)
registeredAgents.add('main') // main is always valid
registeredAgents.add('isolated') // isolated is always valid
log('Registered agents:', [...registeredAgents])

// 1. Check cron jobs for session:AGENT targets
for (const job of cronJobs) {
  const target = job.sessionTarget || ''
  const match = target.match(/^session:(.+)$/)
  if (match) {
    const agentId = match[1]
    if (!registeredAgents.has(agentId)) {
      issues.push({
        type: 'GHOST_CRON_TARGET',
        severity: 'HIGH',
        detail: `Cron job "${job.name}" (${job.id}) targets session:${agentId} — agent not in registry`,
        fix: `Update sessionTarget to "isolated" or a valid agent`
      })
    }
  }
}

// 2. Check agentToAgent allow list
const a2aAllow = config.agentToAgent?.allow || []
for (const agentId of a2aAllow) {
  if (!registeredAgents.has(agentId)) {
    issues.push({
      type: 'GHOST_A2A_ALLOW',
      severity: 'MEDIUM',
      detail: `agentToAgent.allow references "${agentId}" — not in registry`,
      fix: `Remove "${agentId}" from agentToAgent.allow`
    })
  }
}

// 3. Check subagents allowAgents in plugins
function checkAllowAgents(obj, path) {
  if (!obj || typeof obj !== 'object') return
  if (Array.isArray(obj.allowAgents)) {
    for (const agentId of obj.allowAgents) {
      if (!registeredAgents.has(agentId)) {
        issues.push({
          type: 'GHOST_SUBAGENT_ALLOW',
          severity: 'MEDIUM',
          detail: `${path}.allowAgents references "${agentId}" — not in registry`,
          fix: `Remove "${agentId}" from ${path}.allowAgents`
        })
      }
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object' && !Array.isArray(v)) {
      checkAllowAgents(v, `${path}.${k}`)
    }
  }
}
checkAllowAgents(config.plugins || {}, 'plugins')
checkAllowAgents(config.agents?.defaults || {}, 'agents.defaults')

// 4. Check for LaunchAgents that reference unknown/removed agents
if (fs.existsSync(LAUNCH_AGENTS_PATH)) {
  const plists = fs.readdirSync(LAUNCH_AGENTS_PATH).filter(f => f.endsWith('.plist'))
  for (const plist of plists) {
    const content = fs.readFileSync(path.join(LAUNCH_AGENTS_PATH, plist), 'utf8')
    // Flag any enabled (non-.disabled) plist that mentions hermes or other removed agents
    const knownRemovedAgents = ['hermes', 'metaclaw', 'money_printer']
    for (const removed of knownRemovedAgents) {
      if (content.toLowerCase().includes(removed) && !plist.includes('.disabled')) {
        issues.push({
          type: 'GHOST_LAUNCH_AGENT',
          severity: 'CRITICAL',
          detail: `LaunchAgent ${plist} references removed agent "${removed}" and is NOT disabled`,
          fix: `launchctl unload ~/Library/LaunchAgents/${plist} && mv ... .disabled`
        })
      }
    }
  }
}

// Report
if (issues.length === 0) {
  log('✅ No ghost agent references found.')
  process.exit(0)
} else {
  log(`\n⚠️  Found ${issues.length} ghost agent issue(s):\n`)
  for (const issue of issues) {
    log(`[${issue.severity}] ${issue.type}`)
    log(`  ${issue.detail}`)
    log(`  Fix: ${issue.fix}\n`)
  }
  process.exit(1)
}