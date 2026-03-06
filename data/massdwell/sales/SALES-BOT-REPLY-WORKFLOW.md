# Sales Bot Reply Workflow
**Implemented:** March 2, 2026  
**Version:** 1.0

---

## Overview

When a lead replies to automated outreach, the sales bot automatically manages pipeline progression based on reply content.

---

## Workflow Decision Tree

```
Lead replies to sales email
         │
         ├─► Contains "researching" signals?
         │   └─► YES → Move to "Future Contact" (66451842)
         │             Stop all emails
         │             Re-engage in 3-6 months
         │
         └─► NO → Normal reply
                  │
                  ├─► In cold stage?
                  │   (Incoming, Welcome, Follow-ups, Recap)
                  │   └─► YES → Move to "Conversation Started" (86738635)
                  │             Stop automated emails
                  │             Alert Nick/Steve for manual follow-up
                  │
                  └─► Already advanced stage?
                      (Site Feasibility, Negotiation, Contract)
                      └─► Just log response, don't move
```

---

## Stage IDs Reference

### Cold Stages (Bot Auto-Emails)
| Stage | ID | Bot Sends? |
|-------|-----|-----------|
| Incoming Leads | 88661695 | ✅ Yes |
| Welcome email sent | 94100935 | ✅ Yes |
| Follow-up 1 | 86738631 | ✅ Yes |
| Recycle follow-up | 86738627 | ✅ Yes |
| Recap emails | 97920535 | ✅ Yes |
| Future Contact | 93011343 | ❌ No (paused) |

### Active Stages (Manual Follow-up)
| Stage | ID | Bot Sends? |
|-------|-----|-----------|
| Conversation Started | 86738635 | ❌ No (human takes over) |
| Site Feasibility Booked | 89929427 | ❌ No |
| Negotiation/Decision | 88076707 | ❌ No |
| Contract Signed | 89929311 | ❌ No |

### Closed Stages
| Stage | ID | Bot Sends? |
|-------|-----|-----------|
| Closed - Won | 142 | ❌ No |
| Closed - Lost | 143 | ❌ No |

---

## "Researching" Signals Detection

Bot detects these phrases and moves to Future Contact:
- "just researching"
- "just looking"
- "not ready"
- "not doing anything"
- "maybe in the future"
- "just browsing"
- "exploring options"
- "not right now"
- "down the road"
- "sometime next year"
- "not in a position"
- "just gathering information"
- "preliminary research"

---

## Example Scenarios

### Scenario 1: Positive Reply
**Lead status:** Welcome email sent (94100935)  
**Reply:** "Yes, very interested! Can we schedule a call?"

**Bot actions:**
1. ✅ Move to "Conversation Started" (86738635)
2. ✅ Log response as note in Kommo
3. ✅ Flag as "positive" sentiment
4. ✅ Alert Nick/Steve (hot lead)
5. ✅ Stop automated emails

**Next:** Nick/Steve manually follow up to schedule qualification call

---

### Scenario 2: "Just Researching" Reply
**Lead status:** Follow-up 1 (86738631)  
**Reply:** "Thanks, just researching right now. Not ready to move forward."

**Bot actions:**
1. ✅ Move to "Future Contact" (66451842)
2. ✅ Log response as note in Kommo
3. ✅ Stop all automated emails
4. ❌ No alert (not hot)

**Next:** Manual re-engagement in 3-6 months

---

### Scenario 3: Reply from Advanced Stage
**Lead status:** Site Feasibility Booked (89929427)  
**Reply:** "Quick question about permitting..."

**Bot actions:**
1. ❌ Do NOT move stage (already advanced)
2. ✅ Log response as note
3. ✅ Alert Nick/Steve (active deal question)

**Next:** Nick/Steve respond to question

---

## Monitoring

**Reply monitor runs:** Every 15 minutes  
**Script:** `scripts/sales_bot_reply_monitor.py`  
**Logs:** `scripts/sales_bot_reply_monitor.log`

**Checks:**
- Last 48 hours of unread emails to sales@massdwell.com
- Excludes bounces, automated messages
- Matches sender to Kommo CRM
- Classifies sentiment (positive/neutral/negative/researching)
- Auto-advances pipeline
- Alerts on hot leads

---

## Benefits

1. **Faster response time** - Leads get immediate pipeline advancement
2. **Clean handoff** - Bot stops, human takes over at right moment
3. **No spam** - "Researching" leads aren't annoyed
4. **Better tracking** - Pipeline reflects actual engagement
5. **Alert prioritization** - Nick/Steve see hot leads immediately

---

## Maintenance

**If adding new cold stages:**
1. Add stage ID to `cold_stages` list in reply monitor
2. Add to `active_stages` list in auto_engage bot
3. Test with sample reply
4. Update this documentation

**If changing "researching" signals:**
1. Update `researching_signals` list in reply monitor
2. Test with sample phrases
3. Update documentation

---

*Maintained by Clawson | Approved by Steve Vettori*
