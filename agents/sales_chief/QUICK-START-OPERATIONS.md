# QUICK-START-OPERATIONS.md — Sales Chief Live Operations

**This is where you start using Sales Chief.** All systems are live and ready for inbound leads.

---

## 🚀 System Status

✅ **All three brands configured**  
✅ **31 pipeline stages deployed**  
✅ **9 pre-approved templates ready**  
✅ **5-step cadence engine live**  
✅ **Daily heartbeat at 9 AM EST**  

---

## 📥 What Happens When a Lead Arrives

### Example: Jane Doe from Newton, MA (Website Form)

**Lead arrives at 7:55 PM EST:**
```json
{
  "id": "lead_001",
  "brand_mode": "massdwell",
  "source": "website_form",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "created_at": "2026-03-03T19:55:00-05:00",
  "status": "new",
  "notes": "Wants ADU estimate.",
  "consent": {
    "email_ok": true,
    "opted_out": false
  }
}
```

---

### What Sales Chief Does (Automatic)

**Step 1: Route to brand (T+0, 7:55 PM)**

Sales Chief detects: "ADU" = massdwell ✓

Creates LEAD object (lead_001) + creates DEAL object:
```json
{
  "id": "deal_001",
  "brand_mode": "massdwell",
  "lead_ref": "lead_001",
  "title": "ADU - Newton",
  "value_amount": 150000,
  "pipeline_stage_id": "md_incoming_leads",
  "stage_entered_at": "2026-03-03T19:56:00-05:00",
  "owner": "agent",
  "status": "open"
}
```

**Step 2: Send inbound response (T+0, 7:56 PM)**

**Template (pre-approved, auto-send):**
```
Got it — happy to help. Two quick questions so I can point you the right way: 
(1) what town is the property in? 
(2) are you aiming for rental income or family use?
```

**Activity logged:**
```json
{
  "type": "outbound_message",
  "timestamp": "2026-03-03T19:56:30-05:00",
  "summary": "Inbound response sent to Jane Doe",
  "meta": { "template": "massdwell_inbound_first_response" }
}
```

**Step 3: Create follow-up task (T+0, 7:56 PM)**

```json
{
  "id": "action_001",
  "deal_ref": "deal_001",
  "title": "Follow-up bump if no reply (T+2h)",
  "owner": "agent",
  "due_at": "2026-03-03T21:56:00-05:00",
  "status": "waiting"
}
```

---

### What Happens If No Reply (T+2h)

**9:56 PM: Automatic reminder due**

Sales Chief sends bump template (pre-approved):
```
Quick bump — what town is the property in? Once I have that, I can tell you the best next step.
```

Updates next action: `due_at: 2026-03-04T19:55:00` (T+24h)

---

### What Happens If Jane Replies (Example: T+3h)

**Jane replies:** "We're in Newton and want rental income"

**Cadence resets immediately.**

Sales Chief:
1. Logs inbound activity
2. Updates deal.qualification.massdwell:
   ```json
   {
     "town_or_address": "Newton, MA",
     "goal_use_case": "rental_income"
   }
   ```
3. Drafts next message (custom, needs approval):
   ```
   Great! Three quick questions:
   (1) When are you looking to build (this quarter, 6-12 months, researching)?
   (2) What's the lot situation (single family, corner, slope, access)?
   (3) Budget comfort range ($150-200K, $200-250K, $250K+)?
   ```
4. Creates approval item (Level 1: custom outbound)
5. Notifies Steve: "Reply from Jane Doe re: Newton ADU — draft response ready for approval"

---

### What Happens Once Jane is Qualified (Example: T+24h)

**Jane answers all questions.** Qualification complete.

Sales Chief:
1. Updates deal.qualification with all 5 fields ✓
2. Moves deal to `md_conversation_started` stage
3. Updates deal.value_amount to $200K (from her budget answer)
4. Drafts next message (Level 1):
   ```
   Perfect! You're exactly our sweet spot. Let's walk your property and show you what's possible. 
   When works best for a 30-45 minute site visit? 
   Options: This Saturday morning, next Tuesday afternoon, next Thursday evening
   ```
5. Awaits Steve approval to send

---

### What Happens When Jane Books Visit (Example: T+25h)

**Jane replies:** "Saturday morning works!"

Sales Chief:
1. Logs inbound activity
2. Moves deal to `md_site_feasibility_booked` stage
3. Creates next action:
   ```json
   {
     "title": "Site visit with Jane Doe - Saturday 10 AM, Newton",
     "owner": "steve",
     "due_at": "2026-03-08T10:00:00-05:00",
     "status": "waiting"
   }
   ```
4. Logs activity: "Site visit booked for Saturday 10 AM"

---

### What Happens After Site Visit (Example: T+3d)

**Steve completes site visit, generates numbers.**

Steve updates deal:
```json
{
  "deal_example": {
    "id": "deal_001",
    "pipeline_stage_id": "md_site_feasibility_completed",
    "value_amount": 185000,
    "notes": "Site visit completed. Flat lot, good access. No major constraints. Estimated price: $185K, 12 weeks post-approval."
  }
}
```

Sales Chief:
1. Logs stage change activity
2. Drafts offer message (Level 1):
   ```
   Based on Saturday's walk-through, here's what we can build on your Newton property:
   - 500 sqft, 1 bed/1 bath
   - $185,000
   - 12 weeks post-approval
   - Next step: we'll handle permitting
   
   Sound good?
   ```
3. Awaits Steve approval

---

## 📊 Weekly Report (Steve Asks: "Sales report")

Sales Chief pulls from state and provides:

```
WEEK OF MARCH 10, 2026

MASSDWELL PIPELINE:
  Incoming Leads: 8 leads
  Welcome Email Sent: 5 leads
  Conversation Started: 12 leads ($2.1M pipeline)
  Site Feasibility Booked: 3 visits
  Negotiation: 1 deal (Jane Doe, Newton, $185K)

ATLANTIC LASER PIPELINE:
  Incoming: 3 leads
  Qualified: 2 leads
  Demo Scheduled: 1 (this week)
  Quote Sent: 1 lead ($42K)

ALPINE PROPERTY PIPELINE:
  Incoming: 1 deal ($2.5M opportunity)
  Underwriting: 1 deal ($8.5M)

METRICS:
  Speed-to-lead: 4.2 minutes average
  Meetings booked: 6 this week
  Total pipeline: $10.8M
  Stuck deals (SLA exceeded): 2
    → Recommend: Follow-up call to verify interest

STUCK DEALS:
  1. John Smith (MassDwell, Needham) - 9 days in Conversation Started
     → Recommendation: Call + propose site visit
  2. Michael Chen (Atlantic Laser, Boston) - 8 days in Qualified
     → Recommendation: Send demo date options + pick one

NEXT WEEK FORECAST:
  Expected meetings: 4-5
  Expected pipeline progression: 2 deals (site visits → completed)
  Expected closes: 0-1
```

---

## 💬 How to Interact with Sales Chief

### When a lead/deal needs action:

**You say:** "New inbound: Jane Doe (jane@example.com) wants ADU in Newton"  
**Sales Chief:** Auto-detects brand, sends T+0 template, creates deal, sets follow-up

**You say:** "Sales report"  
**Sales Chief:** Pulls all pipeline data, stuck deals, metrics, recommendations

**You say:** "What's the status of Jane Doe's deal?"  
**Sales Chief:** Returns: stage, age in stage, last activity, next action, deal value, qualification status

**You say:** "Approve sending offer to Jane Doe"  
**Sales Chief:** Sends pre-drafted offer message, logs activity, updates deal stage

**You say:** "Jane opted out"  
**Sales Chief:** Sets opted_out=true, stops all outbound, logs activity forever

---

## 🎯 Key User Actions (What You Do)

### Approval Workflows

**Level 1 approvals** (custom messages, bookings, quotes):
```
Sales Chief: "Draft ready for approval: [message preview]"
You: "Approve" or "Edit: [change] then send"
Sales Chief: Sends message, logs activity, updates deal
```

**Level 2 approvals** (discounts, binding terms, claims):
```
Sales Chief: "Decision needed: Jane requesting 10% discount. Options: (A) offer 5%, (B) offer financing, (C) decline."
You: "Option B - offer financing"
Sales Chief: Sends counteroffer, logs decision, creates next action
```

### Weekly Reviews

```
Every Monday morning:
You: "Sales report"
Sales Chief: [Full report with stuck deals + recommendations]
You: [Review, pick actions on stuck deals]
Sales Chief: [Execute recommendations]
```

### Ongoing Updates

```
Throughout the day:
Leads/deals arrive → Sales Chief auto-handles T+0 + T+2h (pre-approved)
Replies come in → Sales Chief drafts next message (awaits your approval)
Stage changes → Sales Chief logs + creates next action
You approve/deny → Sales Chief executes
```

---

## 📋 Daily Checklist

**9 AM:** Heartbeat check
```
Sales Chief: "Pipeline health check. Stuck deals: [X]. New leads: [X]. Next approvals due: [X]"
```

**Morning (when available):**
- Approve pending Level 1 message drafts (custom messages to qualified leads)
- Decide on Level 2 actions (discounts, commitments)
- Review stuck deals + recommend next steps

**Evening:**
- Weekly report (if it's Monday)
- Final scan for any new approvals needed

---

## 🚨 Edge Cases & How Sales Chief Handles Them

### Lead says "No thanks"
Sales Chief: Logs "closed_lost" in deal, moves to recycle stage, creates monthly warm-touch task

### Lead says "STOP"
Sales Chief: Sets opted_out=true, stops ALL outbound immediately, logs forever

### Interested but slow (>7 days no reply)
Sales Chief: Moves to recycle stage after T+7d close loop, creates monthly touch task

### Multiple leads from same company
Sales Chief: Creates separate deals per contact, links via account_ref, prevents duplicate contact

### Deal needs discount
Sales Chief: Drafts counteroffer (Level 2), awaits your explicit approval before sending

### Site visit cancelled
You: "Jane cancelled site visit"  
Sales Chief: Logs activity, moves deal back to md_conversation_started, creates follow-up task

---

## 🔄 Full Lifecycle (MassDwell Example)

```
Day 1, 7:55 PM
  Jane submits form: "ADU in Newton, rental income"
  → Sales Chief creates lead + deal, sends T+0 template

Day 1, 9:56 PM  
  No reply yet
  → Sales Chief sends T+2h bump (template)

Day 2, 10:00 AM
  Jane replies: Confirmed Newton, rental income goal
  → Sales Chief drafts qual questions, awaits approval

Steve approves message.

Day 2, 10:30 AM
  Message sent to Jane
  → Next action: await Jane's answer (T+24h reminder)

Day 2, 4:00 PM
  Jane replies with all qual info
  → Qualification complete, move to md_conversation_started
  → Sales Chief drafts site visit booking message, awaits approval

Steve approves.

Day 2, 4:30 PM
  Message sent to Jane
  → Next action: await site visit booking confirmation (T+24h reminder)

Day 3, 9:00 AM
  Jane replies: "Saturday morning works"
  → Stage: md_site_feasibility_booked
  → Next action: "Site visit Saturday 10 AM" (owner: steve, due: Saturday 10 AM)

Day 3, Saturday, 10:00 AM
  Steve does site visit, generates numbers
  → Update deal with numbers: $185K, 12 weeks post-approval
  → Stage: md_site_feasibility_completed
  → Sales Chief drafts offer message, awaits approval

Steve approves.

Day 4, 9:00 AM
  Offer sent to Jane
  → Stage: md_negotiation_decision
  → Next action: "Follow up in 7 days" (Due: Day 11)

Day 11, 10:00 AM
  Jane replies: "Let's do it!"
  → Deal status: WON
  → Stage: md_contract_signed_deposit
  → Next action: "Handoff to operations" (owner: steve)
  → Activity log: Deal won, value $185K
  → Weekly report will show as closed won next Monday
```

---

## 📞 Real Commands You Use

```
"New lead: [name], [email], [company], about [topic]"
→ Sales Chief creates lead + deal, auto-responds

"Sales report"
→ Full pipeline report, stuck deals, metrics

"Approve Jane Doe's offer message"
→ Message sent, deal moves to negotiation stage

"Jane wants 10% discount. Options?"
→ Sales Chief provides recommendations, awaits your pick

"Jane opted out"
→ Immediately sets opted_out=true, stops all outbound

"Status: Jane Doe deal"
→ Current stage, age, last activity, next action, deal value

"Stuck deals"
→ Leads exceeding SLA, recommendations

"What happened with Michael Chen?"
→ Full activity log from lead creation to current state
```

---

## ✅ You're Ready

Sales Chief is live and waiting for your first inbound lead.

**Next step:** Send a lead and watch the system work.

---

**Last Updated:** 2026-03-04  
**Status:** PRODUCTION READY — All systems live
