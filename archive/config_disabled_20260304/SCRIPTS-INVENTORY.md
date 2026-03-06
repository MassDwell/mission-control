# SCRIPTS INVENTORY — 2026-03-04

## ACTIVE SCRIPTS (In Use)

### Email & Sales
- `email-intent-classifier.py` — Classifies email intent (DISABLED - no CRM)
- `followup-cadence-system.js` — 3-wave follow-up automation (DISABLED - no CRM)
- `daily-sales-report.js` — EOD sales summary (DISABLED - no CRM)

### Alpine Property Group
- `alpine-import-sumner.js` — Import Sumner Street data (Active)
- `alpine-scale-beacon-to-sumner.js` — Scale Beacon→Sumner (Active)

### Google Workspace
- `google/refresh-all-tokens.js` — Refresh Gmail tokens (Critical, every 30 min)

### Monitoring/Admin
- `check-all-stages.js` — Check pipeline stages (Active)
- `count-all-stages.js` — Count deals by stage (Active)
- `daily-intel-monitor.js` — Daily market intelligence (Active)

### Mission Control
- `mission-control-v2.js` — Task dashboard (Active)

### Other
- `browser-helper.sh` — Browser automation (Active)
- `memory-maintenance.sh` — Memory upkeep (Active, weekly)

## DEPRECATED SCRIPTS (Orphaned - Delete)

### Old Sales Bot (Superseded by email consolidation)
- `sales_bot_auto_engage.py` — ❌ DELETE
- `python_bounce_monitor.py` — ❌ DELETE
- `python_gmail_cleanup.py` — ❌ DELETE

### Atlantic Laser Prospectors (Agent deleted)
- `atlantic_laser_gmail_handler.py` — ❌ DELETE
- `atlantic_laser_pipedrive.py` — ❌ DELETE
- `atlantic_laser_pipedrive_prospector.py` — ❌ DELETE
- `atlantic_laser_prospector.py` — ❌ DELETE
- `atlantic_laser_response_handler.py` — ❌ DELETE
- `atlantic_laser_sync.py` (multiple versions) — ❌ DELETE

### Kommo/Pipedrive Legacy
- `kommo-sync.js` (old) — ❌ DELETE
- `pipedrive-*.js` (various) — ❌ DELETE

### MassDwell Legacy
- `massdwell-lead-classifier.js` — ❌ DELETE
- `massdwell-bulk-*.js` (various) — ❌ DELETE

### Sentiment/Trading (Broken - uses agents)
- `sentiment-scraper.js` — ⚠️ NEEDS REWRITE (currently targets deleted agents)

### Alpaca Trading (Possibly legacy)
- `autonomous-trader.js` — CHECK IF ACTIVE
- `btc-scalper.js` — CHECK IF ACTIVE

### Misc Legacy
- `bulk-revert-closed-won.js` — ❌ DELETE (CRM maintenance)
- `analyze-closed-won.js` — ❌ DELETE

## STALE CONFIG/LOG FILES (Delete)
- `atlantic_laser_store_blast.log` — ❌ DELETE
- `atlantic_laser_sync.log` (multiple versions) — ❌ DELETE
- Old README-*.md files — ❌ DELETE

## ACTION PLAN
Phase 1: Archive 40+ deprecated scripts to `archive/scripts-deprecated-2026-03-04/`
Phase 2: Rewrite `sentiment-scraper.js` to work without agent spawning
Phase 3: Verify remaining scripts have clear ownership + active cron jobs

**Status:** 15 active scripts (core operations) | 40+ deprecated (delete)

