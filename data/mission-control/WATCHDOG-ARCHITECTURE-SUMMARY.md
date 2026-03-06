# MISSION CONTROL RELIABILITY LAYER - Architecture Summary

**Installation Date:** 2026-03-06 09:24 EST  
**Status:** ✅ COMPLETE AND OPERATIONAL  
**Severity:** CRITICAL (Production Hardening)

---

## Executive Summary

Installed two complementary watchdog systems that provide autonomous monitoring and safe auto-recovery for OpenClaw infrastructure without modifying venture state or agent registry.

**System Design:**
- **Cron Watchdog Loop** (every 15 min) → 8-point health verification + data freshness checks
- **Gateway Auto-Recovery Loop** (every 10 min) → 5-point gateway + scheduler health with safe restart capability

**Key Achievement:** Production hardening against silent failures over weeks/months of continuous operation.

---

## System Architecture

### Layer 1: Cron Watchdog Loop (15-minute cycle)

**Purpose:** Monitor scheduling system integrity and SSOT data freshness

**Eight Health Checks:**

1. **Cron Execution Health**
   - Verifies each job is running at expected interval
   - Flag: `CRON_STALLED` if job age > 2× expected interval
   - Action: Log to agent_activity.json

2. **Delivery Failure Protection**
   - Ensures all jobs have `bestEffort=true` flag
   - Flag: `DELIVERY_NOT_SAFE` if missing
   - Action: Auto-alert for operator review

3. **SSOT Data Freshness** (Single Source of Truth)
   - Monitors 6 critical files:
     - workstreams.json
     - venture_pipeline.json
     - agent_activity.json
     - blocked_work.json
     - venture_velocity.json
     - venture_work_links.json
   - Business hours (6am-10pm): Alert if > 3 hours old
   - Off-hours (10pm-6am): Alert if > 12 hours old
   - Action: Trigger mission_control_export cron if stale during business hours

4. **Agent Activity Health**
   - Reviews last 100 entries in agent_activity.json
   - Flag: `AGENT_IDLE_WARNING` if > 2 hours since last activity
   - Action: Log for operator awareness

5. **Command Bus Health**
   - Monitors operator_actions.json queue
   - Counts: total, pending, executed, stuck (>10 min old)
   - Flag: `QUEUE_STALLED` if stuck_actions > 0
   - Action: Critical alert + manual review marker

6. **High Frequency Job Detection**
   - Identifies jobs running < 5-minute intervals
   - Flag: `HIGH_FREQUENCY_ADVISORY` (informational)
   - Action: Log warning for optimization review

7. **Timezone Consistency**
   - Verifies all jobs have timezone specified
   - Flag: `MISSING_TIMEZONE`
   - Action: Log warning

8. **Stagger Management**
   - Identifies top-of-hour (0 * * * *) jobs without stagger
   - Flag: `STAGGER_ADVISORY`
   - Action: Log recommendation for load distribution

**Output:** All events logged to `agent_activity.json` with severity levels

---

### Layer 2: Gateway Auto-Recovery Loop (10-minute cycle)

**Purpose:** Monitor gateway & scheduler responsiveness with automated recovery

**Five Health Checks:**

A. **Gateway Process Health**
   - Command: `pgrep -f openclaw`
   - Flag: `GATEWAY_DEAD` if not found
   - Status: CRITICAL
   - Action: Attempt safe restart

B. **Cron Scheduler Responsiveness**
   - Test: `openclaw cron list` with 5-sec timeout
   - Flag: `SCHEDULER_UNRESPONSIVE` if timeout
   - Status: CRITICAL
   - Action: Attempt scheduler restart

C. **Memory Usage Monitoring**
   - Threshold 1: > 85% → `HIGH_MEMORY` (WARNING)
   - Threshold 2: > 95% → `MEMORY_CRITICAL` (CRITICAL)
   - Action: Monitor closely, restart if critical

D. **Command Bus Queue Depth**
   - Monitor: Queue size, pending count, age of oldest
   - Alert if: Queue > 50 items AND oldest > 30 min
   - Flag: `QUEUE_BACKED_UP` (WARNING)
   - Critical Flag: Queue processing rate = 0 for > 15 min

E. **Agent Activity Verification**
   - Check: Any entry in last 4 hours
   - Flag: `NO_AGENT_ACTIVITY` if empty
   - Status: WARNING

**Cumulative Health Score:**
- 0 = Healthy ✅
- 1 = Degraded ⚠️ (Monitoring)
- 2+ = Critical 🔴 (Recovery triggered)

---

## Safe Recovery Policy

**Before Restart:**
1. ✅ Log CRITICAL event to agent_activity.json
2. ✅ Record system state, reason, timestamp
3. ✅ Wait 30 seconds for graceful shutdown

**Restart Sequence:**
```bash
openclaw gateway restart --reason "auto-recovery: [detected-issue]"
```

**After Restart:**
1. Wait 10 seconds for startup
2. Verify: `ps aux` shows openclaw running
3. Verify: `openclaw cron list` responsive (5-sec timeout)
4. Verify: Mission Control API returns 200
5. Log recovery success
6. Notify operator via Telegram

**Rollback Behavior:**
- If restart fails → Log failure + CRITICAL alert
- Do NOT attempt second restart
- Require manual intervention

---

## SSOT Compliance

✅ **All data from `/data/mission-control/` only**  
✅ **No modifications to `/canon`, `/config`, `/scripts/core`**  
✅ **All corrective actions through safe restart policy**  
✅ **All events logged to agent_activity.json**  
✅ **All alerts surface in Mission Control + Telegram**  
✅ **ZERO modifications to venture state or agent registry**

---

## Integration with Mission Control

### System Health Panel Metrics

**Cron Health Section:**
- Last cron execution: [timestamp]
- Jobs on schedule: X/Y
- Jobs stalled: X (RED if > 0)
- Delivery safe: X/Y jobs

**SSOT Freshness Section:**
- workstreams.json: [age] ✅ Fresh / ⚠️ Aging / 🔴 Stale
- venture_pipeline.json: [age]
- agent_activity.json: [age]
- Status indicator: Overall freshness

**Gateway Stability Section:**
- Process uptime: [duration]
- Memory usage: X%
- Scheduler responsive: Yes/No
- Last health check: [timestamp]

**Command Bus Section:**
- Queue depth: X
- Pending actions: X
- Stuck actions: X (RED if > 0)
- Status: ✅ Healthy / ⚠️ Backing up / 🔴 Stalled

**Agent Activity Section:**
- Last activity: X minutes ago
- Active agents: X
- Idle agents: X (2h+ threshold)

---

## Monitoring Philosophy

**Three-Tier Escalation:**

1. **Info Level** (routine operations)
   - Normal cron execution
   - Data freshness checks passing
   - Agent activity present

2. **Warning Level** (degraded state)
   - Single health check failing
   - Data aging but not yet stale
   - Queue backing up but processing

3. **Critical Level** (failure detected)
   - Gateway process dead
   - Scheduler unresponsive
   - Memory critical (>95%)
   - Queue stalled (0 processing for 15+ min)
   - Multiple health checks failing

---

## Logging Format

All events append to `agent_activity.json`:

```json
{
  "timestamp": "2026-03-06T09:23:00.000Z",
  "agent": "system",
  "action": "cron_watchdog_check",
  "description": "Cron health verification: 8/8 jobs on schedule",
  "severity": "info",
  "source": "cron_watchdog_loop"
}
```

**Severity Levels:**
- `info` - Routine checks, normal operation
- `warning` - Degraded state, monitor closely
- `critical` - Failure detected, recovery initiated

---

## Success Metrics

Installation is COMPLETE when:

✅ cron_watchdog_loop running every 15 minutes  
✅ gateway_health_loop running every 10 minutes  
✅ All 8 cron checks executing correctly  
✅ All 5 gateway checks executing correctly  
✅ Sample CRITICAL alert triggered and logged  
✅ Mission Control System Health panel updated  
✅ Telegram alerts working  
✅ Safe restart policy verified  
✅ No modifications to venture/agent systems  
✅ Full deliverables provided  

**Status:** ✅ ALL CRITERIA MET

---

## Next Steps

1. **Monitoring Dashboard:** Review System Health panel updates every 15 min
2. **Alert Response:** When CRITICAL alerts appear, review root cause in agent_activity.json
3. **Optimization:** After 30 days of operation, analyze patterns in watchdog logs
4. **Escalation:** For repeated failures, trigger manual infrastructure review

---

**Reliability Layer Status:** 🟢 OPERATIONAL  
**Last Update:** 2026-03-06 14:26:30 EST  
**Designed By:** Codesmith (Infrastructure Lead)
