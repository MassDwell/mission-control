# Cron Job Manifest
_Last updated: 2026-03-29_

## Infrastructure / Watchdogs

| ID | Name | Schedule | Target | Notes |
|----|------|----------|--------|-------|
| d439f2ac | Gateway Auto-Recovery Loop | Every 10 min (stagger 30s) | main | gateway_health_loop.sh |
| f3730e0e | Cron Watchdog Loop | Every 15 min (stagger 60s) | main | cron_watchdog_loop.sh |

## Paperclip Stack (Auto-start / Keepalive)

| ID | Name | Schedule | Target | Notes |
|----|------|----------|--------|-------|
| 7ee45eab | Auto-start PaperclipAI | Every 30 min | main | dev-runner.mjs keepalive |
| 24589521 | Auto-start Telegram Adapter | Every 30 min | main | telegram-paperclip-adapter.js keepalive |
| ed579efc | Auto-start Paperclip Notifier | Every 30 min | main | paperclip-notifier.js keepalive |
| 28a31b0d | Auto-start Chrome (debug port 9222) | Every 30 min | main | Remote debug port for scraping |
| d41e1b15 | Auto-start MetaClaw | Every 30 min | main | metaclaw skills_only mode |
| d027e7b6 | Paperclip Stale Run Recovery | Every 30 min (stagger 90s) | main | stale-run-recovery.mjs |

## DrawStack Monitoring

| ID | Name | Schedule | Target | Notes |
|----|------|----------|--------|-------|
| 1a36fe7e | DrawStack Sentry Monitor | Every 30 min | isolated | sentry-monitor.js; silent if clean |
| e0e40050 | DrawStack Post-Deploy Smoke Test | Every 30 min | isolated | smoke-test.js vs drawstack.ai; haiku model |
| 0577fdec | DrawStack PostHog Monitor | Every 60 min | isolated | posthog-monitor.js; silent if no events |
| 62a4cc85 | DrawStack Daily KPI Report | M-F 8 AM EST | main | drawstack-daily-kpi.js → Telegram |
| fc3edfc0 | DrawStack Google Ads Check | 2026-03-30 9 AM EST | main | ONE-SHOT; deleteAfterRun=true |

## Gmail Cleanup

| ID | Name | Schedule | Target | Notes |
|----|------|----------|--------|-------|
| 974f5f35 | Personal Gmail Cleanup — Morning | 7 AM daily | main | gmail-cleanup-personal.sh |
| 96ad4227 | Personal Gmail Cleanup — Midday | 1 PM daily | main | gmail-cleanup-personal.sh |
| bd1c4149 | Personal Gmail Cleanup — Evening | 6 PM daily | main | gmail-cleanup-personal.sh |

## Memory & Maintenance

| ID | Name | Schedule | Target | Notes |
|----|------|----------|--------|-------|
| eac05891 | Weekly Skill Health Review | Sun 9 AM EST | main | skill-logger.js review |
| d4402ea5 | Weekly Memory Maintenance | Sun 8 PM EST | main | memory-maintenance.sh + manual review |
| 0d8672c3 | Bi-Weekly Memory Audit | 1st & 15th 10 AM EST | main | WORKING.md + MEMORY.md health check |
| b2b8939f | Drift Audit (Core Architecture) | Daily 1 AM EST | main | drift-audit.sh; no delivery |

## System Cleanup

| ID | Name | Schedule | Target | Notes |
|----|------|----------|--------|-------|
| e8229111 | Daily log rotation | Daily 2 AM EST | main | cleanup-logs.sh |
| 799de846 | Daily browser screenshot purge | Daily 2:15 AM EST | main | cleanup-media.sh |
| 8ffbfd81 | Weekly dead project node_modules cleanup | Sun 3 AM EST | main | cleanup-node-modules.sh |
| eb97c9c5 | Weekly system cache purge | Sun 3:30 AM EST | main | cleanup-system-caches.sh |

---

## Deduplication Log

| Date | Action | Job Removed | Kept |
|------|--------|-------------|------|
| 2026-03-29 | Removed duplicate | `1a6b661a` — DrawStack Daily KPI Report (simpler payload) | `62a4cc85` — same job with description + cleaner payload |

---

---

## Hermes Monitoring

| ID | Name | Schedule | Target | Notes |
|----|------|----------|--------|-------|
| 84f8585e | Hermes Monitor — Active Polling | Every 30m (cron */30, stagger 15s) | main | hermes-monitor.js — polls GitHub CI, Vercel, Sentry, PostHog signups. Created 2026-04-01. |

---

**Total active jobs: 27**
