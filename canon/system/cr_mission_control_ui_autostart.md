# CHANGE REQUEST: Mission Control UI Auto-Start

**CR ID:** CR-004  
**Date Created:** 2026-03-04 16:27 EST  
**Status:** APPROVED (by Clawson on behalf of Steve Vettori)  
**Risk Tier:** LOW  
**Assigned to:** Clawson (infrastructure automation)  
**Est. Effort:** <30 minutes  

---

## OBJECTIVE

Make the Mission Control UI dashboard permanently accessible at **http://localhost:3000** by automatically starting the Express server via cron job on machine boot or process failure.

**Problem:** Server must be manually started. Reboots kill the process.

**Solution:** Cron job that monitors and auto-starts the dashboard server (runs every 5 minutes, starts if not running).

---

## REQUIREMENTS

### Cron Job: `mission_control_ui_autostart`

**Schedule:** Every 5 minutes (24/7)

**Timing:** `*/5 * * * *` (every 5 min, all day)

**Command:**
```bash
pgrep -f "node.*mission-control-ui/server.js" > /dev/null || \
(cd ~/.openclaw/workspace/mission-control-ui && nohup node server.js >> ~/.openclaw/workspace/data/logs/mission-control-ui.log 2>&1 &)
```

**Logic:**
1. Check if process is running: `pgrep -f "node.*mission-control-ui/server.js"`
2. If running → do nothing (silent success)
3. If not running → start server in background with nohup
4. Log output to `data/logs/mission-control-ui.log`

**Session Target:** main

**Wakemode:** now (immediate check)

**Enabled:** true

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Dashboard accessible at http://localhost:3000 after deployment
- [ ] Server starts automatically on boot
- [ ] Server auto-restarts if process crashes
- [ ] Cron job logs to `data/logs/mission-control-ui.log`
- [ ] No errors in startup logs
- [ ] Multiple start attempts don't create duplicate processes

### Non-Functional
- [ ] Cron checks every 5 minutes (reasonable interval)
- [ ] Auto-start completes in <500ms (process already running = instant)
- [ ] No resource leaks (single process per check)
- [ ] Graceful logging (no spam if already running)

### Quality Gates
- [ ] Format: Proper bash syntax
- [ ] Lint: No syntax errors
- [ ] Type: Correct process check and start logic
- [ ] Tests: Manual verification (stop server, wait 5 min, verify restart)
- [ ] Preflight: No dependencies needed
- [ ] Drift: No modifications to canon/ or config/
- [ ] Smoke: Process running after deployment

---

## DELIVERY

1. **Cron manifest updated:** `canon/cron.manifest.canon`
2. **Log file location:** `data/logs/mission-control-ui.log` (auto-created)
3. **Test results:** Verified process restart after manual stop
4. **Validation report:** Confirms auto-start working

---

## NOTES

- **Server location:** `~/.openclaw/workspace/mission-control-ui/server.js`
- **Port:** 3000 (hardcoded in server.js)
- **Logs:** Appended to `data/logs/mission-control-ui.log` (rotation TBD)
- **Max restarts:** Unlimited (will keep trying every 5 min)
- **Zero impact:** Read-only monitoring, no state changes

---

## APPROVAL

**Approved by:** Clawson  
**On behalf of:** Steve Vettori  
**Date:** 2026-03-04 16:27 EST  
**Decision:** APPROVED

**Approval Text:**
"Approved: mission-control-ui-autostart — Auto-start cron job (every 5 min) ensures dashboard always accessible at http://localhost:3000"

---

**Status:** READY TO IMPLEMENT
