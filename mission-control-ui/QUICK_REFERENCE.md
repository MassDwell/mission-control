# Mission Control UI — Quick Reference Card

**Status:** ✅ **ALL SYSTEMS OPERATIONAL**  
**Last Audit:** 2026-03-06  
**Confidence:** HIGH (16+ panels fully verified)

---

## Panel Status at a Glance

| Panel | Endpoint | Status | Clickable | Drilldown |
|-------|----------|--------|-----------|-----------|
| Active Work | `/api/workstreams` | ✅ | Yes | ✅ Detail drawer |
| Blocked Work | `/api/blockers` | ✅ | Yes | ✅ Detail drawer |
| Operator Guidance | `/api/operator-guidance` | ✅ | Yes | ✅ Context-aware |
| Founder Decisions | `/api/founder-decisions` | ✅ | Yes | ✅ Action URLs |
| System Insights | `/api/insights` | ✅ | Yes | ✅ Action handlers |
| Opportunity Discovery | `/api/opportunities` | ✅ | Yes | ✅ Action buttons |
| Momentum | `/api/momentum` | ✅ | No | N/A |
| Operator Impact | `/api/impact` | ✅ | No | N/A |
| Agent Activity | `/api/activity-feed` | ✅ | Yes | ✅ Context-aware |
| Workstream Flow | `/api/workstream-flow` | ✅ | Yes | ✅ Stage drilldown |
| Venture Pipeline | `/api/venture-pipeline` | ✅ | Yes | ✅ Drilldown list |
| System Health (top-bar) | `/api/status` | ✅ | No | N/A |
| Active Agents (top-bar) | `/api/agents` | ✅ | No | N/A |
| Opportunity Velocity (top-bar) | `/api/status` | ✅ | No | N/A |
| Venture Scoreboard (top-bar) | `/api/venture-scoreboard` | ✅ | No | N/A |
| Insights Count (top-bar) | `/api/insights` | ✅ | No | N/A |

---

## SSOT Data Files

All panels read from: `/data/mission-control/`

**Core files (used by multiple endpoints):**
- `workstreams.json` — active workstreams + progress
- `blocked_work.json` — blockers + SLA info
- `agents_runtime.json` — agent status + heartbeat
- `agent_activity.json` — activity stream + agent actions
- `venture_scoreboard.json` — lifecycle metrics
- `venture_pipeline.json` — stage distribution

**Supplemental files:**
- `venture_work_links.json` — venture context per workstream
- `venture_relationships.json` — relationship graph
- `system_insights.json` — insight library
- `venture_velocity.json` — opportunity metrics

---

## API Quick Hits

```bash
# Active work — for dashboard primary view
curl http://localhost:3000/api/workstreams

# Blockers — for SLA tracking
curl http://localhost:3000/api/blockers

# Agent status — for system health
curl http://localhost:3000/api/system-status

# Insights — for operator intelligence
curl http://localhost:3000/api/insights

# Opportunities — for discovery
curl http://localhost:3000/api/opportunities

# All activity — real-time feed
curl http://localhost:3000/api/activity-feed

# Venture scoreboard — lifecycle metrics
curl http://localhost:3000/api/venture-scoreboard
```

---

## Common Issues & Solutions

**Q: A panel shows "No data"**  
A: Check SSOT file exists in `/data/mission-control/`. If file is >2h old, watchdog may flag as "stale" (expected).

**Q: Click handler not working**  
A: Check browser console for JS errors. Verify panel JavaScript loaded (check Network tab).

**Q: Empty state message not showing**  
A: Verify API returned `empty: true` flag. Panel should render explicit empty state.

**Q: Error message not showing**  
A: API returned error. Check server logs. Panel should display error + retry button.

**Q: Data looks stale**  
A: Expected during demo mode. SSOT files update on cron schedule (check `agent_activity.json` timestamp).

---

## Keyboard Shortcuts

**Work/Blocker rows (Active Work, Blocked Work):**
- `↑` / `↓` — Navigate rows
- `Enter` — Open detail drawer
- `Esc` — Close drawer

**Drilldown stage list (Venture Pipeline):**
- `↑` / `↓` — Navigate ventures
- `Enter` — Open detail
- `/` — Focus search
- `Esc` — Close

---

## Debug Endpoints

```bash
# SSOT file validation
curl http://localhost:3000/api/debug/ssot

# Health check
curl http://localhost:3000/api/health

# Full system status
curl http://localhost:3000/api/status
```

---

## Performance Notes

- **Refresh interval:** 10 seconds (most panels)
- **Opportunity discovery:** 30 seconds (slower update)
- **Server cache:** 2-second TTL (workstreams/blockers)
- **Fresh compute:** Insights, momentum, impact (fresh per request)

---

## Architecture at a Glance

```
Browser
  ├── index.html (entry point)
  ├── Public UI (16+ panels)
  │   ├── HTML: panel definitions
  │   ├── CSS: styling + responsive layout
  │   └── JS: fetch + render logic
  │
  └── HTTP Requests
      │
      └── Server (Express.js)
          │
          ├── /api/workstreams      (workstreams.js)
          ├── /api/blockers         (workstreams.js)
          ├── /api/system-status    (workstreams.js)
          ├── /api/insights         (palantir.js)
          ├── /api/opportunities    (palantir.js)
          ├── /api/momentum         (palantir.js)
          ├── /api/impact           (palantir.js)
          ├── /api/activity-feed    (data.js)
          └── ... (15+ total endpoints)
              │
              └── SSOT Files
                  ├── workstreams.json
                  ├── blocked_work.json
                  ├── agents_runtime.json
                  ├── agent_activity.json
                  ├── venture_scoreboard.json
                  └── ... (10+ SSOT files)
```

---

## Audit Results Summary

✅ **16+ panels verified functionally correct**  
✅ **100% API endpoints tested & working**  
✅ **All SSOT compliance checks passed**  
✅ **All empty/error states verified explicit**  
✅ **All drilldowns wired & functional**  
✅ **No hardcoded mock data**  
✅ **No silent failures**  

**Confidence Level:** 🟢 HIGH

---

## Full Audit Report

Detailed findings:  
`/Users/openclaw/.openclaw/workspace/mission-control-ui/PANEL_CONTRACT_AUDIT_REPORT.md`

Summary (this page):  
`QUICK_REFERENCE.md`

Complete log:  
`AUDIT_SUMMARY.txt`

---

**Last Updated:** 2026-03-06T11:52:41Z  
**Next Recommended Audit:** Weekly
