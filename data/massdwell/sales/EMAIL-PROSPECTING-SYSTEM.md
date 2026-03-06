# Email Prospecting System

**Status:** 🚀 READY FOR DEPLOYMENT  
**Date:** March 3, 2026  
**Businesses:** MassDwell + Atlantic Laser

---

## Overview

Automated, consultative email prospecting engine for both businesses:

| Aspect | MassDwell | Atlantic Laser |
|--------|-----------|----------------|
| **Email Account** | sales@massdwell.com | team@atlanticlasersolutions.com |
| **Prospects** | Kommo CRM leads (588 callable) | Pipedrive contacts (3,000+) |
| **Sender** | Nick Ferreira | Steve Vettori |
| **Daily Limit** | 1 new prospect | 1 new prospect |
| **Auto-Continue** | If prospect replies → continue dialogue | If prospect replies → continue dialogue |
| **Goal** | Qualify BANT + schedule site visit | Qualify BANT + schedule demo |

---

## System Rules

### Daily Send Rules
1. **New Prospect:** Send 1 email per day per business (new prospect = first contact)
2. **Active Dialogue:** If prospect replies → send follow-up same day (no daily limit)
3. **No Replies:** After 7 days with no reply, archive to "nurture" sequence (email every 14 days)

### BANT Qualification
Track four elements:
- **Budget:** Can they afford it? ($150K+ for ADU, $35K+ for laser welder)
- **Authority:** Are they the decision maker?
- **Need:** Do they have the pain point we solve?
- **Timeline:** When do they need to act?

**Escalation:** When all 4 BANT elements are discovered → flag for human follow-up (Steve)

### Tone & Approach
- **Consultative:** Ask discovery questions before pitching
- **Value-first:** Lead with how we solve their problem
- **Education:** Share relevant case studies + ROI
- **No pressure:** Clear "if there's a fit" messaging

---

## Templates

### MassDwell
- **01-initial-contact-consultative.txt**  
  Opening email with 3 ADU use cases (rental income, family, property value)  
  Goal: Identify which category they fit
  
- **02-follow-up-bant-discovery.txt**  
  Follow-up with BANT discovery questions  
  Goal: Extract Budget, Authority, Need, Timeline

### Atlantic Laser
- **01-initial-contact-consultative.txt**  
  Opening email with 3 pain points (speed, quality, labor costs)  
  Goal: Identify which applies to them

- **02-follow-up-bant-discovery.txt**  
  Follow-up with BANT discovery questions (welding method, timeline, budget, decision maker)  
  Goal: Extract Budget, Authority, Need, Timeline

---

## Tracking System

**Location:** `/Users/openclaw/.openclaw/workspace/data/massdwell/sales/email-prospecting-tracking.json`

**Per Prospect:**
```json
{
  "prospect_id": "kommo_12345",
  "email": "john.smith@email.com",
  "name": "John Smith",
  "first_contact_sent": "2026-03-03",
  "last_email_sent": "2026-03-03",
  "emails_in_thread": 1,
  "has_replied": false,
  "bant": {
    "budget": "detected",      // or null
    "authority": "detected",   // or null
    "need": "detected",        // or null
    "timeline": "detected",    // or null
    "score": "2/4"             // How many BANT elements we know
  },
  "conversation_status": "awaiting_reply",
  "notes": "Asked about timeline, waiting for response"
}
```

**BANT Score:**
- 0/4 = New prospect, initial outreach only
- 1-2/4 = Active conversation, discovery phase
- 3/4 = Nearly qualified, need one more element
- 4/4 = **FULLY QUALIFIED** → Escalate to human

---

## Workflow

### Day 1: Initial Outreach
```
1. System selects next prospect (round-robin from database)
2. Sends 01-initial-contact-consultative.txt
3. Marks "first_contact_sent" + "last_email_sent" today
4. Sets status: "awaiting_reply"
5. Logs to tracking file
```

### Day 2-3: Monitor for Replies
```
1. Check Gmail for new messages from prospect
2. If reply received:
   a. Extract BANT signals from reply (NLP)
   b. Update BANT tracking (budget, authority, need, timeline)
   c. Send follow-up with BANT discovery questions
   d. Set status: "active_dialogue"
3. If no reply:
   a. Keep waiting (up to 7 days)
```

### Day 3+: Follow-up Discovery
```
1. If prospect replies to BANT discovery:
   a. Extract full BANT data
   b. Calculate BANT score (0-4)
   c. If score = 4/4: Flag for human → Slack alert to Steve
   d. If score < 4/4: Send targeted follow-up addressing missing element
2. Continue dialogue until:
   - BANT complete → escalate
   - 7 days no reply → archive to nurture
   - Prospect says "no" → archive
```

### Daily Send Limit Check
```
1. Query: "Did we send NEW prospect email today?"
2. If NO: Send one new prospect email
3. If YES: Skip new prospect, focus on monitoring replies
4. Exception: If active dialogue exists, send unlimited follow-ups
```

---

## Implementation Checklist

- [x] Email templates created (4 total)
- [x] Tracking system designed
- [x] BANT extraction logic ready
- [ ] **Next:** Wire up Kommo CRM integration (fetch prospects)
- [ ] **Next:** Wire up Pipedrive integration (fetch prospects)
- [ ] **Next:** Build reply detection + BANT extraction NLP
- [ ] **Next:** Deploy cron job (9 AM daily)
- [ ] **Next:** Slack notifications for qualified leads

---

## Configuration

### Email Templates
**Location:** 
- MassDwell: `/Users/openclaw/.openclaw/workspace/data/massdwell/sales/email-templates/`
- Atlantic Laser: `/Users/openclaw/.openclaw/workspace/data/atlantic-laser/email-templates/`

**Variables:**
- `{{first_name}}` - Prospect first name
- `{{company_name}}` - Company (Atlantic Laser only)
- `{{property_address}}` - Property address (MassDwell only)
- `{{city}}` - City (MassDwell only)
- `{{region}}` - Region (Atlantic Laser only)
- `{{sender_name}}` - Person sending email
- `{{phone}}` - Sender phone
- `{{website}}` - Company website

### Daily Schedule
**Time:** 9:00 AM EST (before business hours)
**Frequency:** Every weekday (Mon-Fri)
**Triggered by:** Cron job
**Script:** `/Users/openclaw/.openclaw/workspace/scripts/email-prospecting-engine.js`

---

## Escalation Workflow

**When BANT = 4/4:**
1. Send Slack notification to Steve: "Qualified Lead: {{name}} from {{company}}"
2. Include BANT summary + emails in thread + recommended next step
3. Move to "qualified" status in tracking
4. Wait for Steve to close or schedule meeting

**When Prospect Says No:**
1. Move to "closed_lost" status
2. Add reason to notes
3. Archive from active prospecting

---

## Metrics to Track

- Daily new outreach (target: 2/day total = 1 MD + 1 AL)
- Reply rate (% of emails that get responses)
- BANT qualification rate (% that reach 4/4)
- Time to qualification (avg days from first email to BANT complete)
- Qualified leads per month
- Close rate (qualified → meeting scheduled)

---

## Next Steps (Priority Order)

1. **Fetch prospect data from CRM/Pipedrive** — Wire up database queries
2. **Deploy reply detection** — Monitor Gmail for inbound replies
3. **Activate BANT extraction** — Parse replies for BANT signals
4. **Test full workflow** — Send 1-2 test emails and verify tracking
5. **Deploy cron job** — 9 AM daily send
6. **Slack integration** — Notify Steve of qualified leads
7. **Weekly review** — Analyze metrics and refine templates

---

**System Status: READY FOR DEPLOYMENT**

Awaiting final approval + CRM/Pipedrive integration to go live.
