# OpenClaw System Audit — 2026-03-28
**Auditor:** Clawson (Self-audit, Steve-requested)  
**Scope:** Full system — agents, crons, skills, config, canonical governance, services  
**Time:** 05:55 AM EDT  
**Status:** ✅ Complete

---

## EXECUTIVE SUMMARY

System is operationally stable. Core services running. Primary agent (Clawson) functional. However, **5 significant drift categories** detected, 2 of which are high-noise/low-value problems affecting Steve's day-to-day experience. 23 active cron jobs running cleanly. The rest is legacy debris from the March 4 clean-slate reset that was never fully purged.

**Overall Grade: B- (Operational but cluttered)**

---

## FINDINGS INVENTORY

### FINDING 1 — CRITICAL: Auto-Start Crons Generating User-Facing Noise
**Severity:** HIGH  
**Evidence:** Every 30 minutes, 4 crons (PaperclipAI, Telegram Adapter, Notifier, Stale Run Recovery) fire. The OpenClaw runtime wraps `systemEvent` payloads as "Please relay this reminder" if no `delivery.mode=none` is set. This produces visible Telegram messages from Clawson that Steve sees every 30 min during early AM hours, even when no action is needed (everything already running).

**Root cause:** 4 crons missing `delivery: { mode: "none" }`:
- Auto-start PaperclipAI
- Auto-start Telegram Adapter  
- Auto-start Paperclip Notifier
- Paperclip Stale Run Recovery (has it, but still fires visibly)

**Crons that execute silently (correctly configured):**
- Auto-start Chrome → `"Handle this reminder internally"` instruction works
- Auto-start MetaClaw → Same pattern works

**Remediation:** Add `delivery: { mode: "none" }` to the 3 auto-start crons missing it. The Chrome/MetaClaw pattern (payload text includes "Execute silently" or "Handle this reminder internally") is what suppresses relay — match that pattern.

---

### FINDING 2 — HIGH: 46 Orphaned Agent Directories
**Severity:** HIGH (governance violation per ANTI_SPRAWL_POLICY.md)  
**Evidence:** `~/.openclaw/agents/` contains 48 directories. Registry declares 4 agents (main, personal-assistant, codesmith, moonshot). The compiled `config/agents-compiled.json` contains ONLY `main`. The remaining 44 dirs are ghosts from the pre-March-4 architecture.

**Orphaned dirs (sample):** admin_assistant, alpine_permitting, alpine_property_mgmt, atlantic_laser, atlantic_laser_sales, automaton_growth, bug-fix-*, chief_of_staff, claude-code, claudecode, clawson, codesmith, doc_proposal, feature-dev-*, finance_underwriting, laser_sales_engineer, marketing_content, massdwell-lead-*, massdwell_factory_ops, money_printer, personal_assistant, personal_life_cos, sales_followup, security-audit-*, security_ciso

**Impact:** ANTI_SPRAWL_POLICY mandates quarantine of agent dirs not in registry. Preflight check #5 should be failing (it showed "✅" on 2026-03-04 but that was when registry was compiled differently). These are dead weight — no active sessions, no active routing — but add confusion and violate governance.

**Remediation:** Move to `archive/orphaned-agents-2026-03-28/`. Keep `main` dir (it's the system agent dir). Keep `personal_assistant`, `codesmith` (they're in registry as disabled).

---

### FINDING 3 — HIGH: Stale Reference Files (Cron Registry + Crons.json)
**Severity:** HIGH  
**Evidence:**
- `data/cron-job-registry.json` — last updated 2026-03-01, lists 40+ jobs for deleted agents (sales_bot, atlantic_laser_sales, marketing_content, admin_assistant, personal_life_cos, massdwell_factory_ops). These agents don't exist. This file claims to be the "source of truth" for cron drift scanning — it isn't anymore.
- `data/crons.json` — snapshot from 2026-03-01 (53 jobs, 51 enabled). Live system has 23 jobs. Massive staleness. The nightly drift scanner references this file.

**Impact:** The nightly drift scanner is comparing live state to a 3.5-week-old snapshot. Any "clean" result from the scanner is meaningless — it's comparing against a ghost state.

**Remediation:** Regenerate both files to match current live cron list. The 23 live crons are the actual state.

---

### FINDING 4 — MEDIUM: Gateway Watchdog Firing False "CRITICAL" Every 10 Minutes
**Severity:** MEDIUM  
**Evidence:** `~/.openclaw/logs/gateway-watchdog.log` shows `CRITICAL: Cron scheduler unresponsive` every single 10-minute cycle. This has been firing continuously since at least 2026-03-28 04:50 and likely much longer.

**Root cause:** The watchdog uses `openclaw cron list` in a shell context. This command fails in non-interactive shell (likely a path/env issue), making health check B always fail. MEMORY.md documents this exact issue: "Don't escalate 'scheduler unresponsive' unless jobs are actually not running." — but the watchdog script never got updated to reflect this.

**Impact:** The watchdog logs are full of false criticals, making them useless for real incident detection. The watchdog also writes `CRITICAL` events to `data/mission-control/agent_activity.json` every 10 min, polluting that file.

**Remediation:** Update `gateway_health_loop.sh` health check B to use a more reliable scheduler check (e.g., check if cron jobs file was recently modified, or query via API directly), or suppress the specific false positive.

---

### FINDING 5 — MEDIUM: IDENTITY.md Never Filled Out
**Severity:** MEDIUM  
**Evidence:** Workspace `IDENTITY.md` still contains the blank template text from initial setup. SOUL.md is fully defined, MEMORY.md is defined, but IDENTITY.md contradicts the actual known identity (Name: Clawson, Emoji: 🦅, etc.)

**Impact:** Minor — SOUL.md overrides this in practice. But it's a loose end and would confuse any agent reading the workspace cold.

**Remediation:** Fill in IDENTITY.md from known SOUL.md/MEMORY.md data.

---

### FINDING 6 — MEDIUM: SSOT Mission Control Files Missing
**Severity:** MEDIUM  
**Evidence:** Cron watchdog checks for these files in `data/mission-control/` — they don't exist:
- workstreams.json ❌
- venture_pipeline.json ❌
- blocked_work.json ❌
- venture_velocity.json ❌
- venture_work_links.json ❌

Only `agent_activity.json` (3 bytes — literally just `[]`) and `system_insights.json` exist.

**Impact:** The cron watchdog reports these as failing every 15 min (silently — these checks don't alert). The Mission Control "Cron Export" job (every 2 hours) appears to have been generating these but they were cleaned up or never seeded after the March reset. The Paperclip orchestration system is the active replacement — these files are legacy Mission Control v2 artifacts.

**Remediation:** Either seed stub files to silence watchdog, or update watchdog to not check for files that belong to a deprecated architecture.

---

### FINDING 7 — LOW: Duplicate/Superseded Skills
**Severity:** LOW  
**Evidence:**
- `skills/ad-ready` AND `skills/ad-ready-pro` — same name in SKILL.md frontmatter, different descriptions. Pro version is the active one (registered in system prompt). ad-ready (non-pro) is stale.
- `skills/cold-email` AND `skills/cold-outreach` — overlapping purpose. cold-outreach is a broader framework. cold-email is more specific. Registered skill description shows cold-email as current.
- `skills/seedance` — no SKILL.md, just `credentials/` dir. Orphaned.
- `skills/blogburst` — requires BLOGBURST_API_KEY not present in env. Likely unused.

**Remediation:** Archive `ad-ready` (keep `ad-ready-pro`), document `cold-outreach` vs `cold-email` distinction or merge, archive `seedance` stub.

---

### FINDING 8 — LOW: Stale Kommo References
**Severity:** LOW  
**Evidence:** Drift audit from 1 AM shows `forbidden_changes: FAIL` due to 26 Kommo references in codebase. Access revoked 2026-03-04. References scattered across non-archive files.

**Impact:** Low — no code can actually reach Kommo. But references create confusion about whether CRM integration is available.

**Remediation:** Grep and null-out or comment the refs in non-archive files.

---

### FINDING 9 — LOW: Stale Projects Lingering
**Severity:** LOW  
**Evidence:**
- `ventures/mirofish` — Full frontend+backend project present. No mention in MEMORY.md or WORKING.md. Unknown status.
- `ventures/permitiq` — MeritLayer shutdown happened (confirmed in MEMORY.md). Repo archived. But local `ventures/permitiq` dir still exists.
- `data/logs/mirofish-*.log` — Active-looking log files for dead project.
- `tools/paperclip-backup-20260324-184117` — Backup dir from March 24, still present. Likely safe to archive.
- `data/backups/cogs-tool-backup-20260311-070514` — Old backup from March 11.
- Multiple report/delivery PDFs in workspace root (ACE-2026-001.pdf, BD-2026-001.pdf, etc.) — unclear if still needed.

---

### FINDING 10 — INFO: Antfarm Active But Orphaned from Skill
**Severity:** INFO  
**Evidence:** `~/.openclaw/antfarm/` is live (has DB, events, workflow definitions for bug-fix, feature-dev, massdwell-lead, security-audit). The `antfarm-workflows` skill is installed at `~/.openclaw/skills/antfarm-workflows/` (not in workspace skills). Antfarm workflows are what generate the `bug-fix-*` and `feature-dev-*` and `security-audit-*` agent dirs. These are ephemeral ACP agent dirs, not persistent agents — the orphan detection shouldn't flag them.

**Remediation:** None needed for antfarm dirs — these are ACP session dirs, not persistent agents. Just document this.

---

### FINDING 11 — INFO: Metaclaw Stopped (Last Log March 21)
**Severity:** INFO  
**Evidence:** `data/logs/metaclaw.log` shows clean shutdown on 2026-03-21. Auto-start cron is running every 30 min but metaclaw isn't active. The cron silently does nothing (process already running check fails gracefully). This is fine if metaclaw is not needed.

**Impact:** None if metaclaw functionality is unused. Metaclaw is a local LLM fine-tuning/skills server — if not actively using it, having the auto-start cron is harmless but wasteful.

---

## REMEDIATION BACKLOG (Prioritized)

| # | Issue | Action | Risk | Effort |
|---|-------|---------|------|--------|
| 1 | Auto-start crons generating Telegram noise | Add `delivery.mode=none` to 3 crons | LOW | 10 min |
| 2 | 46 orphaned agent dirs | Archive to orphaned-agents-2026-03-28/ | LOW | 5 min |
| 3 | Stale cron registry + crons.json | Regenerate from live state | LOW | 15 min |
| 4 | Gateway watchdog false criticals | Fix health check B in script | LOW | 10 min |
| 5 | IDENTITY.md blank | Fill from known identity | NONE | 5 min |
| 6 | SSOT files missing | Seed stubs or update watchdog | LOW | 10 min |
| 7 | Duplicate skills | Archive stale ones | NONE | 5 min |
| 8 | Kommo stale refs | Comment/null in non-archive files | NONE | 10 min |
| 9 | Stale project dirs | Archive mirofish, permitiq local | LOW | 5 min |

**Total estimated remediation time: ~75 minutes**

---

## WHAT'S WORKING WELL

✅ Core Clawson agent operational, single-agent architecture clean  
✅ 23 active cron jobs running with 0 consecutive errors  
✅ Paperclip stack (3 services) running healthy every check  
✅ DrawStack production monitoring active (Sentry + PostHog + Smoke tests)  
✅ MEMORY.md and WORKING.md current and accurate  
✅ Daily log rotation, media cleanup, cache purge scheduled  
✅ Weekly memory maintenance, skill review, memory audit scheduled  
✅ Drift audit running nightly (correctly detecting Kommo ref issue)  
✅ Agent registry governance (canon/registry.json) clean — only 4 declared agents  
✅ Canonical config (agents-compiled.json, routes.json) correct for single-agent  
✅ Security posture: no active trading, no Kommo access, no sensitive agent sprawl  

---

_Generated by Clawson | 2026-03-28 05:55 AM EDT_
