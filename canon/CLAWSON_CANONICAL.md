# CLAWSON CANONICAL CONFIGURATION

**Date:** 2026-03-04 13:55 EST  
**Status:** Single-Agent Reset Complete

---

## AGENT IDENTITY

**Name:** Clawson  
**Role:** Chief of Staff / Master Agent / COO  
**Creature:** 🦅  
**Session:** agent:main:telegram:direct:7002178651  
**Status:** ✅ ACTIVE (ONLY ACTIVE AGENT)

---

## CANONICAL FILES

All Clawson identity/ops files are canonical versions in this directory:

| File | Purpose | Source |
|------|---------|--------|
| SOUL.md.canon | Persona & operating principles | Clawson identity |
| IDENTITY.md.canon | Identity framework | Clawson identity |
| HEARTBEAT.md.canon | Heartbeat protocol (Clawson-only) | Operations |
| MEMORY.md.canon | Long-term memory | Knowledge base |
| USER.md.canon | Steve Vettori context | Reference |

Root-level versions are mirrors of these canonical files.

---

## CRON JOBS (4 Total, All Clawson)

All cron jobs target `agentId: "main"` (Clawson only):

1. **Gmail Token Auto-Refresh** (Every 30 min)
   - Critical: Maintains OAuth tokens for Google Workspace
   - Scope: 3 Gmail accounts (sales, personal, Atlantic Laser)

2. **Mission Control Cron Export** (Every 2 hours)
   - Updates mission-control/data/crons.json
   - Syncs with Mission Control dashboard

3. **Weekly Memory Maintenance** (Sundays 8 PM)
   - Compacts memory files
   - Archives old daily logs
   - Generates review report

4. **Bi-Weekly Memory Audit** (1st/15th @ 10 AM)
   - Health check on WORKING.md and MEMORY.md
   - Pattern extraction and promotion
   - Compaction of oversized files

---

## DISABLED SYSTEMS

### Removed Agents
❌ All other agents (deleted or archived)  
❌ Antfarm multi-agent system (archived)  
❌ Subagent spawning infrastructure (preserved but not used)

### Removed Integrations
❌ Kommo CRM (credentials deleted, scripts removed)  
❌ Money Printer trading (9 cron jobs deleted)  
❌ Email-to-CRM automation (scripts deleted)  
❌ Old sales bot automation (scripts archived)

### Archived Configurations
❌ AGENT-REBUILD-BLUEPRINT.md  
❌ AGENTS.md (old agent framework)  
❌ WORKFLOW_AUTO.md (bot protocols)  
❌ All audit/status reference files

---

## ACTIVE INTEGRATIONS

### Gmail (via gog CLI)
- ✅ `credentials/google/` (3 tokens)
- ✅ `scripts/google/refresh-all-tokens.js`
- ✅ Read/send/modify access to sales@massdwell.com, vettoristeve@gmail.com, team@atlanticlasersolutions.com

### Credentials (36 files)
- ✅ Google (active)
- ✅ Alpaca (preserved, not actively traded)
- ✅ Instagram, X, Gemini (available)
- ❌ Kommo (deleted)

### Scripts (42 active)
- ✅ Core infrastructure
- ✅ Memory maintenance
- ✅ Mission Control sync
- ❌ Email/CRM automation (archived)
- ❌ Sales bot (archived)

---

## DATA STRUCTURE

### Preserved
- ✅ `memory/` — Daily logs + WORKING.md
- ✅ `data/massdwell/` — Sales collateral, DNC list
- ✅ `data/alpine/` — Real estate data
- ✅ `data/atlantic_laser/` — Atlantic Laser data

### Archived
- ❌ `archive/config_disabled_20260304/` — Non-canonical configs
- ❌ `archive/antfarm_disabled_20260304/` — Antfarm workflows
- ❌ `archive/orphaned-agents-2026-03-04/` — Old agent directories
- ❌ `archive/scripts-deprecated-2026-03-04/` — Dead scripts
- ❌ `archive/money-printer-2026-03-04/` — Trading data

---

## VERIFICATION CHECKLIST

✅ **Agent Routes:** Only "main" can be invoked  
✅ **Cron Jobs:** 4 total, all target main agent  
✅ **Identity Files:** SOUL.md, HEARTBEAT.md, IDENTITY.md, MEMORY.md canonical  
✅ **Credentials:** No Kommo access, 36 active files  
✅ **Scripts:** 42 active, bot automation archived  
✅ **Backup:** openclaw_reset_20260304_133520.tar.gz verified  
✅ **Antfarm:** Archived (no active workflows)  

---

## CANONICAL REFERENCE

**Single source of truth for Clawson configuration:**  
`~/.openclaw/workspace/canon/CLAWSON_CANONICAL.md`

**Daily operations state:**  
`~/.openclaw/workspace/memory/WORKING.md`

**Long-term memory:**  
`~/.openclaw/workspace/MEMORY.md`

---

## NEXT STEPS

Clawson is fully operational as solo agent. To rebuild agents:
1. Define agent specifications
2. Create agent directories under /agents/ (currently empty)
3. Create corresponding cron jobs with explicit approval gates
4. Document in new canonical files

---

**Status:** LOCKED & CANONICAL — Single Agent (Clawson) Only

_Configuration validated: 2026-03-04 13:55 EST_
