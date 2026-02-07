# Heartbeat Protocol

## Overview

Agents wake every 15 minutes via cron jobs. This keeps costs low while ensuring work gets attention.

## Schedule (Staggered)

Agents wake 2 minutes apart to prevent collision:

| Minute | Agent | Session Key |
|--------|-------|-------------|
| :00 | sales_followup | agent:sales_followup:main |
| :02 | marketing_content | agent:marketing_content:main |
| :04 | finance_underwriting | agent:finance_underwriting:main |
| :06 | massdwell_factory_ops | agent:massdwell_factory_ops:main |
| :08 | laser_sales_engineer | agent:laser_sales_engineer:main |
| :10 | alpine_property_mgmt | agent:alpine_property_mgmt:main |
| :12 | alpine_permitting | agent:alpine_permitting:main |
| :13 | doc_proposal | agent:doc_proposal:main |
| :14 | admin_assistant | agent:admin_assistant:main |

**Clawson (Lead):** Always-on main session, no heartbeat needed.

## Heartbeat Checklist

When an agent wakes:

1. **Load Context**
   - Read `memory/WORKING.md` (current task state)
   - Read `memory/YYYY-MM-DD.md` (today's notes)
   - Check session memory if unclear

2. **Check Urgent Items**
   - Am I @mentioned in `data/global/mentions.json`?
   - Are there tasks assigned to me?

3. **Scan Activity**
   - Any discussions I should contribute to?
   - Any decisions that affect my work?

4. **Take Action or Stand Down**
   - If work exists → do it
   - If nothing → reply `HEARTBEAT_OK`

## Model Selection

| Task Type | Model | Why |
|-----------|-------|-----|
| Heartbeat check | claude-3-haiku | Cheap, fast routine check |
| Research/analysis | claude-sonnet-4 | Good balance |
| Creative/complex | claude-opus-4 | Best quality |
| Code generation | claude-sonnet-4 | Reliable |

**Rule:** Don't burn Opus tokens on "check for work" loops.

## Cost Control

- Heartbeats use isolated sessions (terminate after task)
- Staggered schedule prevents API rate limits
- HEARTBEAT_OK response = minimal tokens
- Only escalate to expensive models for real work

---

## Cron Job Template

```bash
openclaw cron add \
  --name "agent-heartbeat-{name}" \
  --schedule "0,15,30,45 * * * *" \
  --offset {minutes} \
  --session "isolated" \
  --model "anthropic/claude-3-haiku" \
  --message "You are {Agent Name}. Check WORKING.md and mentions. If no work, reply HEARTBEAT_OK."
```

---
*Protocol version: 1.0 — 2026-02-05*
