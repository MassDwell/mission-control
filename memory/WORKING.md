# WORKING.md — Current State (2026-03-08 20:00 EST)

## Active Systems

### Mission Control Server
- **Status:** ✅ LIVE at http://localhost:3000
- **Data Source:** SSOT only (`/workspace/data/mission-control/`)
- **Export Cycle:** Every 2 hours (7 AM–9 PM EST)
- **Watchdog:** Running (10-minute drift detection)
- **GitHub Push:** ❌ BLOCKED (pre-existing secrets in repo — needs Steve action)

### Paperclip Orchestration
- **Status:** ✅ RUNNING — ports 3100/3101
- **Phase:** Phase 1 observation complete (>48h), Phase 2 approval pending
- **Agents:** 4 deployed (Clawson, Codesmith, Moonshot, Personal Assistant)
- **Polling:** 10s interval, whitelist enforced
- **Known Issue:** Issue status sometimes stays `in_progress` after agent run succeeds

### Gmail MCP (Paperclip)
- **Status:** ✅ FIXED (2026-03-08)
- **Package:** `@gongrzhe/server-gmail-autoauth-mcp` (replaced broken @shinzolabs)
- **Credentials:** `~/.gmail-mcp/credentials.json`
- **Tools:** 18 Gmail tools verified working

### Email Automation (OpenClaw)
- **Status:** ✅ Gmail OAuth healthy
- **Accounts:** vettoristeve@gmail.com, sales@massdwell.com, team@atlanticlasersolutions.com

---

## Active Trade Positions

**Status:** NONE (Money Printer deactivated 2026-03-04)

---

## Open Issues

1. **GitHub push blocked** — Pre-existing Supabase + OpenAI secrets in repo. Need Steve to rotate or clean history.
2. **CLA-68 (Gmail triage)** — 2 successful runs, status stuck `in_progress`. Agent completed work but didn't close the issue.
3. **Phase 2 approval** — Paperclip Phase 2 (advance_stage, pause_venture) ready for Steve's go/no-go.

---

## Key Contacts

- **Steve Vettori** — Telegram: 7002178651, Email: steve.vettori@massdwell.com
- **Carlos Ferreira** — CTO, MassDwell
- **Nick Ferreira** — Sales, MassDwell (nick.ferreira@massdwell.com)
