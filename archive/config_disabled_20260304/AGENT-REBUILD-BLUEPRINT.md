# AGENT REBUILD BLUEPRINT

**Date:** 2026-03-04 13:45 EST  
**Status:** READY FOR YOUR DIRECTION

---

## What We Know

✅ **Working:**
- Clawson (main session) — Your COO, fully operational
- Money Printer trading pipeline (9 AM-4 PM daily)
- Gmail token refresh (critical, every 30 min)
- Memory system (MEMORY.md, WORKING.md, daily logs)
- Mission Control task dashboard

❌ **Not Working:**
- MassDwell sales automation (Kommo broken, 93 leads stuck)
- All other agents (deleted as requested)
- Email-to-Kommo sync (needs Kommo credentials restored)

---

## Architecture Decision Point

**You need to choose:**

### Option A: Minimal Approach
**Only rebuild what's absolutely critical**
- Clawson handles everything directly (like now)
- Scripts execute via cron jobs (no agents)
- Decisions made in main session
- Advantage: Simple, lean, no agent overhead
- Disadvantage: All work flows through one session

### Option B: Specialist Agents
**Rebuild a few key agents with clear scope**

Example spec:
```
Agent: sales_lead_processor
Purpose: Intake sales emails → Kommo deals → follow-ups
Scope: Email classification + Kommo sync + cadence
Trigger: Every 15 minutes (cron)
Session: Isolated (spawned per run)
Authority: Add notes, move stages, only on >30 days old leads
```

### Option C: Full Agent Ecosystem
**Rebuild multiple agents, each with domain**

Example spec:
```
Agents:
- sales_lead_processor (MassDwell email→Kommo→follow-up)
- alpine_report_generator (Property reports, metrics)
- trading_sentiment_analyst (Market intel for Money Printer)
- personal_life_coordinator (Health, calendar, relationships)
```

---

## What You Need to Specify

For each agent you want:

1. **Name** — Clear identifier
2. **Purpose** — What does it do?
3. **Scope** — What systems can it touch? (Kommo? Gmail? Alpaca?)
4. **Authority Level** — Can it modify? (Read-only vs. Write)
5. **Trigger** — How often? (Cron schedule or on-demand?)
6. **Output** — Where does it report? (Telegram, email, silent?)
7. **Constraints** — Any guardrails? (Don't touch hot leads, don't spend money, etc.)

---

## Example: Fully-Specified Agent

```yaml
Agent: MassDwell Sales Lead Processor
Purpose: |
  Process incoming sales emails
  Create Kommo deals
  Execute 3-wave follow-up cadence
  Report daily summary

Scope:
  - Email: sales@massdwell.com (read)
  - Kommo CRM: Read/write (with guards)
  - Gmail: Send replies (approved templates only)
  - Slack: Post summaries (optional)

Authority:
  - Can create deals
  - Can move leads through cold/warm stages (not hot stages)
  - Can add notes/tasks
  - Cannot touch: Bob Warren, Michael, hot leads
  - Cannot send custom emails (template-only)

Trigger: Cron job every 15 minutes (weekdays 9 AM-6 PM)

Session Type: Isolated (spawned fresh each run)

Output: 
  - Silent unless issues found
  - Daily summary to Telegram (9 PM)
  - Alerts if stuck deals found

Guardrails:
  - DNC list enforced (cannot contact blocked people)
  - Hot lead protection (skip if in Negotiation or beyond)
  - Rate limiting (max 10 deals/hour)
  - Error logging (all actions logged)

Success Metric:
  - 100+ leads processed/month
  - <5 min avg execution time
  - Zero DNC violations
  - Zero hot lead touches
```

---

## Decision Framework

**Choose architecture based on:**

1. **Complexity of work** — Simple = script (cron). Complex = agent
2. **Frequency** — Constant = agent heartbeat. Occasional = on-demand spawning
3. **Authority needed** — Read-only = simple. Write/modify = agents (with guards)
4. **Risk tolerance** — High = lean (Clawson does everything). Low = agents (distribute risk)

---

## Timeline Estimate

Once you specify agents:
- **Implementation:** 2-4 hours per agent (spec → code → test)
- **Testing:** 2-3 runs to verify behavior
- **Deployment:** Gradual (start with one, verify, expand)
- **Monitoring:** Daily heartbeat check for first week

---

## My Recommendation

**Start with ONE well-specified agent:**

1. **MassDwell Sales Lead Processor** (highest ROI)
   - Unblocks 93 stuck leads
   - Fixes daily sales automation
   - Highest business impact
   
2. Test it rigorously (one week)

3. Based on learnings, add more (or go minimal)

---

## What I Need From You

1. **Pick an approach:** A (Minimal) / B (Specialists) / C (Full ecosystem)
2. **Specify agents:** Use the template above
3. **Confirm constraints:** Any guardrails? Risk limits? Approval gates?
4. **Go/no-go:** Once I build, do you want to test before deploying?

---

## Status: WAITING FOR YOUR DIRECTION

The infrastructure is ready. Clawson is intact. Systems are fixed.

**Next move:** Your call on agents.

---
