# LESSONS.md — Clawson Operational Lessons

Explicit write path for recurring failures, corrections, and learned patterns.
Updated after any debugging session where root cause is confirmed.

**Schema per entry:**
- **Date** — when the lesson was confirmed
- **What failed** — exact description
- **Why it failed** — confirmed root cause
- **Signal that predicted it** — what was observable before/during failure
- **Prevention** — what changed or should change

---

## 2026-03-29 — Gateway Watchdog False-Critical Loop

**What failed:** `gateway_health_loop.sh` logged `CRITICAL: Cron scheduler unresponsive` every 10 minutes for hours.

**Why it failed:** The script used `timeout 5 openclaw cron list`. macOS bash does not have `timeout` (it's a GNU coreutils command). Exit code 127 (command not found) was interpreted by the watchdog as cron failure.

**Signal that predicted it:** Every single check showed "critical" with no recovery. A real cron failure would be intermittent. 100% failure rate = systematic bug, not runtime failure.

**Prevention:** Replaced `timeout` with `curl` against the gateway HTTP endpoint. Removed `set -euo pipefail` from bash scripts that run in cron context (macOS bash compat issue). **Rule: never use GNU coreutils commands in bash scripts without testing in `/bin/bash` explicitly on macOS.**

---

## 2026-03-29 — Cron Watchdog Dead-File Checks

**What failed:** `cron_watchdog_loop.sh` reported ❌ NOT FOUND for 6 files every 15 minutes.

**Why it failed:** The files (`workstreams.json`, `venture_pipeline.json`, etc.) were part of the Mission Control architecture that was dismantled in early March. The watchdog was never updated.

**Signal that predicted it:** All files missing simultaneously, every run, since March 4 teardown.

**Prevention:** When decommissioning a system, immediately update or remove any watchdogs that reference its artifacts. **Rule: watchdog changes must accompany any system teardown.**

---

## 2026-03-29 — Paperclip Server SIGTERM Loop

**What failed:** Paperclip server logs showed `Exit status 143` (SIGTERM) repeatedly, appearing as crashes.

**Why it failed:** Not crashes — the keepalive script could spawn duplicate `dev-runner.mjs` processes under certain timing conditions. Second runner would attempt to bind port 3100, fail, and get killed. The keepalive lacked a lockfile.

**Signal that predicted it:** Two `dev-runner.mjs` PIDs visible simultaneously via `pgrep`. SIGTERM (143) not SIGSEGV — indicates external kill, not crash.

**Prevention:** Added lockfile to `paperclip-keepalive.sh`. Added pre-check before kill: only kill if API is down AND no runner is already starting. **Rule: any restart script that spawns background processes must use a lockfile or PID file.**

---

## 2026-03-29 — Telegram Adapter Log Spam

**What failed:** `telegram-adapter.log` filling with `EFATAL: AggregateError` and `EFATAL: Error: read ETIMEDOUT` on every network hiccup.

**Why it failed:** The `polling_error` handler had no backoff. Every transient network failure (Telegram servers, DNS, etc.) logged immediately and indefinitely.

**Signal that predicted it:** 370KB log from a single-purpose adapter process. Recurring identical error strings.

**Prevention:** Added exponential backoff suppression (2^n seconds, capped at 5 min) for transient error classes (ETIMEDOUT, AggregateError, ECONNRESET, ENOTFOUND). Non-transient errors still log immediately. **Rule: any process that polls an external API must have backoff on transient errors.**

---

## 2026-03-29 — Paperclip Backup Dir Causing tsx Module Resolution Failure

**What failed:** After gateway restart, keepalive restarted dev-runner which crashed with `ERR_MODULE_NOT_FOUND: Cannot find package 'get-tsconfig'` — traced to `paperclip-backup-20260324-184117/`.

**Why it failed:** The backup directory had stale/broken `node_modules`. When Node.js resolved the tsx package import path, it walked up to the backup dir's modules instead of the live installation's modules. The backup was sitting alongside the live `paperclip/` dir at the same level.

**Signal that predicted it:** Error path contained `paperclip-backup-20260324-184117` — clearly the wrong directory.

**Prevention:** Renamed backup to `.archived` suffix so it's excluded from Node module resolution traversal. **Rule: old backup directories must be renamed with `.archived` or moved outside the tools/ tree — never left as sibling directories to live installations.**

---

## 2026-03-04 — Security Incident: Malicious ClawHub Skill

**What failed:** Installed `openclaw-trading-assistant` from ClawHub at Steve's request. Skill contained crypto wallet transfer scripts, not stock trading tools.

**Why it failed:** Didn't vet the skill before installing. Trusted the ClawHub listing name.

**Signal that predicted it:** Unusual author (`molt-bot`), scripts referencing wallet/transfer operations not mentioned in the description.

**Prevention:** ClawHub downloads require vetting. Before installing any skill: check author reputation, review scripts for wallet/transfer/exfil code, confirm it matches the request. **Rule: never install a skill without inspecting its scripts directory first.**

---

---
**Date:** 2026-03-30
**What failed:** DrawStack dashboard crashed after PR #135 merge — Neon missing `lenderContactName` and `submittedToLenderAt` columns. Same pattern occurred earlier in the day after PR #126 (missing `paidAt`, `paidByUserId`, `DrawEvent` table).
**Why it failed:** GitHub squash merges collapse feature branch commits into a single commit. Prisma migration *folders* added in the feature branch are sometimes dropped during the squash diff. Prisma doesn't validate schema vs DB at startup — it only fails at query time, so the first user to load the page triggers the crash.
**Signal that predicted it:** Immediate "Failed to load project" error seconds after a production deploy. Prisma error in Vercel logs: "column X does not exist."
**Prevention:** Run `node /Users/openclaw/Projects/drawstack/scripts/audit-migrations.js` immediately after every DrawStack merge to main. Script compares schema.prisma scalars against live Neon columns. Exits 1 with missing column list. Also added to HEARTBEAT.md as a standing post-deploy check.
