# CLAWSON CANONICAL CONFIGURATION — Runtime v1

**Last Updated:** 2026-04-02  
**Status:** Single Orchestrator + Structured Worker Runs (Runtime v1)

---

## AGENT IDENTITY

**Name:** Clawson  
**Role:** Chief of Staff / Master Agent / COO  
**Creature:** 🦅  
**Session:** agent:main:telegram:direct:7002178651  
**Status:** ✅ ACTIVE — ONLY REAL AGENT

---

## RUNTIME ARCHITECTURE

### What Is Real

| Component | Type | Status |
|-----------|------|--------|
| Clawson | Orchestrator (persistent session) | ✅ Active |
| Claude Code subprocess | Worker executor | ✅ Used per-job |
| Paperclip | UI/tracking layer (downstream only) | ✅ Running (ports 3100/3101) |
| Job Ledger | SSOT for all job state | ✅ `data/runtime/job-ledger.jsonl` |

### What Is NOT Real (Execution Modes, Not Agents)

Codesmith, Moonshot, and Personal Assistant are **execution modes** — task profiles that configure how a Claude Code subprocess is scoped. They are NOT persistent agents with their own sessions, memory, or autonomous execution.

**Mode definitions:** `canon/system/runtime-v1/execution-modes.json`  
**Archived agent configs:** `canon/agents/_archive/`

---

## CANONICAL FILES

| File | Purpose |
|------|---------|
| `SOUL.md` | Persona & operating principles |
| `USER.md` | Steve Vettori context |
| `MEMORY.md` | Long-term curated memory |
| `HEARTBEAT.md` | Heartbeat protocol |
| `canon/registry.json` | Agent registry (Clawson only) |
| `canon/system/runtime-v1/execution-modes.json` | Execution mode definitions |
| `canon/system/runtime-v1/job-spec.schema.json` | Job spec schema |
| `canon/system/runtime-v1/GOVERNANCE.md` | Governance reference |
| `canon/clawson/reporting-rules.md` | Reporting language rules |
| `data/runtime/job-ledger.jsonl` | SSOT job ledger (append-only) |

---

## ACTIVE CRON JOBS

| Name | Schedule | Purpose |
|------|----------|---------|
| Cron Watchdog Loop | Every 15 min | Reliability: cron health |
| Gateway Auto-Recovery | Every 10 min | Reliability: gateway health |
| Paperclip Stack Keepalive | Every 30 min | Paperclip API + adapter + notifier |
| Auto-start Chrome | Every 30 min | Debug port 9222 |
| Paperclip Stale Run Recovery | Every 30 min | Reset orphaned in_progress issues |
| DrawStack PostHog Monitor | Every 1 hour | New signups/metrics |
| DrawStack Sentry Monitor | Every 30 min | New errors |
| Drift Audit (Core Architecture) | Daily 1 AM | Architecture drift check |
| Runtime v1 Nightly Audit | Daily 2:30 AM | Fake agent refs, ledger integrity |
| Daily log rotation | Daily 2 AM | Log cleanup |
| Daily browser screenshot purge | Daily 2:15 AM | Media cleanup |
| Personal Gmail Cleanup | Daily 7 AM | Inbox maintenance |
| DrawStack Daily KPI Report | M-F 8 AM | KPI snapshot to Steve |
| DrawStack Signup Watcher | Daily 9 AM | New trial signups |
| Weekly node_modules cleanup | Sundays 3 AM | Disk space |
| Weekly system cache purge | Sundays 3:30 AM | Disk space |
| Weekly Skill Health Review | Sundays 9 AM | Skill fail rate audit |
| Weekly Memory Maintenance | Sundays 8 PM | Memory compaction |
| Bi-Weekly Memory Audit | 1st/15th 10 AM | Memory health check |

---

## ACTIVE INTEGRATIONS

| Integration | Status | Credentials |
|-------------|--------|-------------|
| Gmail (sales@massdwell.com) | ✅ Active | `credentials/google/` |
| Gmail (vettoristeve@gmail.com) | ✅ Active | `credentials/google/` |
| Gmail (team@atlanticlasersolutions.com) | ✅ Active | `credentials/google/` |
| Google Analytics / GSC | ✅ Active | `credentials/google/` |
| Instagram Graph API (@massdwell) | ✅ Read access | `credentials/meta/` |
| X / Twitter (@veto6040, @TheDrawStack) | ✅ Active | `credentials/x/` |
| Alpaca API | ✅ Preserved (not trading) | `credentials/alpaca/` |
| Kommo CRM | ❌ NO ACCESS | Deleted 2026-03-04 |

---

## GOVERNANCE

**Single source of truth for job state:** `data/runtime/job-ledger.jsonl`  
**Single source of truth for Clawson config:** This file  
**Reporting rules:** `canon/clawson/reporting-rules.md`  
**Architecture governance:** `canon/system/runtime-v1/GOVERNANCE.md`  

**The Single Agent Rule:** Clawson is the only real agent. Claude Code subprocesses are worker runs selected by execution mode. This is the architecture — not a temporary state.

---

_Configuration validated: 2026-04-02_  
_Runtime: v1 (Single Orchestrator + Structured Worker Runs)_
