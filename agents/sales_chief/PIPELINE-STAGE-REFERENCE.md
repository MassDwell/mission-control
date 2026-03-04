# PIPELINE-STAGE-REFERENCE.md — Real CRM Stages

This document defines the actual stages in each brand's pipeline, with SLAs, progression rules, and qualification gates.

---

## MassDwell Pipeline (11 Stages)

### Stage Progression Flow

```
Incoming Leads (24h SLA)
    ↓
Welcome Email Sent (48h SLA)
    ↓
Follow-up 1 (72h SLA)
    ↓
[Recycle Follow-up (7d SLA) OR Conversation Started (7d SLA)]
    ↓
Site Feasibility Booked (7d SLA)
    ↓
Site Feasibility Completed (14d SLA)
    ↓
Negotiation/Decision Making (14d SLA)
    ↓
Contract Signed/Deposit Paid (30d SLA)
    ↓
FUTURE CONTACT (90d SLA) — for follow-up after close
    ↓
Recap Emails (14d SLA) — post-close follow-up
```

### Detailed Stage Definitions

| Stage ID | Stage Name | SLA (hours) | SLA (days) | Entry Criteria | Exit Criteria | Owner |
|----------|-----------|-----------|-----------|----------------|----------------|-------|
| md_incoming_leads | Incoming Leads | 24 | 1 | New lead received | Acknowledge + welcome email sent | Sales Chief |
| md_welcome_email_sent | Welcome Email Sent | 48 | 2 | Welcome email sent | First follow-up question asked OR recycle | Sales Chief |
| md_followup_1 | Follow-up 1 | 72 | 3 | First follow-up sent | Reply received OR mark for recycle | Sales Chief |
| md_recycle_followup | Recycle Follow-up | 168 | 7 | No reply to initial sequence | Monthly warm touch OR re-engagement reply | Sales Chief |
| md_conversation_started | Conversation Started | 168 | 7 | Lead responds to any message | Qualify for feasibility visit OR close loop | Sales Chief |
| md_site_feasibility_booked | Site Feasibility Booked | 168 | 7 | Lead agrees to site visit | Site visit completed | Sales Chief / Steve |
| md_site_feasibility_completed | Site Feasibility Completed | 336 | 14 | Site visit done, numbers available | Offer sent OR closed lost | Sales Chief / Steve |
| md_negotiation_decision | Negotiation/Decision Making | 336 | 14 | Offer sent, awaiting decision | Contract signed OR closed lost | Steve |
| md_contract_signed_deposit | Contract Signed/Deposit Paid | 720 | 30 | Contract executed, deposit received | Project begins (handoff to operations) | Steve |
| md_future_contact | FUTURE CONTACT | 2160 | 90 | After project close | Upsell / referral / follow-up | Sales Chief |
| md_recap_emails | Recap Emails | 336 | 14 | Post-project follow-ups | Relationship maintenance | Sales Chief |

### Qualification Gate (Before Site Feasibility Booking)

**Minimum Required Data:**
- ✅ Town or address (or neighborhood if not exact)
- ✅ Goal/use case (rental, family use, office, resale intent)
- ✅ Timeline (this quarter, 6-12 months, researching)
- ✅ Lot context (single family lot? corner? slope? access?)
- ✅ Budget comfort (range-based, not exact)

**Default CTAs (if qualified):**
- "Let's book a 15-minute call"
- "I can schedule a site feasibility visit"

---

## Atlantic Laser Solutions Pipeline (10 Stages)

### Stage Progression Flow

```
Incoming Leads (24h SLA)
    ↓
Contacted / Welcome Sent (48h SLA)
    ↓
Qualified (7d SLA)
    ↓
Demo / Consult Scheduled (7d SLA)
    ↓
Quote Requested (7d SLA)
    ↓
Quote Sent (14d SLA)
    ↓
Negotiation (14d SLA)
    ↓
[Closed Won OR Closed Lost]
    ↓
Recycle / Nurture (90d SLA) — if lost, for future re-engagement
```

### Detailed Stage Definitions

| Stage ID | Stage Name | SLA (hours) | SLA (days) | Entry Criteria | Exit Criteria | Owner |
|----------|-----------|-----------|-----------|----------------|----------------|-------|
| al_incoming_leads | Incoming Leads | 24 | 1 | New lead received | Acknowledge + welcome sent | Sales Chief |
| al_contacted | Contacted / Welcome Sent | 48 | 2 | Welcome message sent | First qualification question asked | Sales Chief |
| al_qualified | Qualified | 168 | 7 | Lead has answered 5 min questions | Demo/consult scheduled OR close loop | Sales Chief |
| al_demo_scheduled | Demo / Consult Scheduled | 168 | 7 | Demo/consult appointment confirmed | Demo completed + quote request made | Sales Chief / Steve |
| al_quote_requested | Quote Requested | 168 | 7 | Lead asked for formal quote | Quote sent to lead | Sales Chief / Steve |
| al_quote_sent | Quote Sent | 336 | 14 | Quote delivered to lead | Lead accepts / negotiates / declines | Steve |
| al_negotiation | Negotiation | 336 | 14 | Lead in active negotiation | Deal closed (won/lost) | Steve |
| al_closed_won | Closed Won | 0 | - | Deal signed + order placed | PROJECT COMPLETE | Steve |
| al_closed_lost | Closed Lost | 0 | - | Lead declined or went competitor | PROJECT COMPLETE | Sales Chief |
| al_recycle | Recycle / Nurture | 2160 | 90 | Lost deal or stalled opportunity | Monthly warm touches, await re-engagement | Sales Chief |

### Qualification Gate (Before Demo)

**Minimum Required Data:**
- ✅ Material & thickness (what are they cutting/welding?)
- ✅ Use case (fab shop, in-house, one-off jobs, production?)
- ✅ Duty cycle (hours per day, throughput/month)
- ✅ Budget range & financing need (ballpark budget? need financing?)
- ✅ Timeline & decision maker (when? who decides?)

**Default CTAs (if qualified):**
- "I can recommend the right system + ballpark range"
- "Let's schedule a short demo / consult"
- "I'll send you a formal quote"

---

## Alpine Property Group Pipeline (TBD)

*Data structure not yet provided. Awaiting stage definitions.*

**Expected stages (placeholder):**
- Incoming Leads (24h)
- Qualified (7d)
- Underwriting (30d)
- LOI Sent (30d)
- Due Diligence (60d)
- Closed Won (terminal)
- Closed Lost (terminal)

**Qualification minimum (likely):**
- Location + asset type
- Units / FAR / zoning status
- Seller motivation + timeline
- Price guidance + permits in place
- Broker / off-market indicator

---

## SLA Enforcement Rules

### How Sales Chief Uses SLAs

1. **Daily heartbeat check:** Any lead exceeding SLA for its current stage?
2. **Stuck deals report:** If stage age > SLA, flag as "stuck deal" with recommendation
3. **Auto-escalation:** If lead in "Incoming" > 24h, escalate to Steve with context

### Stage Age Thresholds

| Stage ID | Stage Name | SLA | Action if Exceeded |
|----------|-----------|-----|-------------------|
| md_incoming_leads | Incoming Leads (MassDwell) | 24h | Send welcome email immediately |
| md_welcome_email_sent | Welcome Email Sent | 48h | Send follow-up question |
| md_followup_1 | Follow-up 1 | 72h | Mark for recycle OR move to recycle stage |
| al_incoming_leads | Incoming Leads (Atlantic) | 24h | Send welcome message immediately |
| al_contacted | Contacted / Welcome Sent | 48h | Send qualification questions |
| al_qualified | Qualified | 168h | Schedule demo immediately |

### Recycle Strategy

**For leads stuck in follow-up without response:**
1. After 3 attempts (T+2h, Day 1, Day 3), mark as "recycle"
2. Move to recycle_followup (MassDwell) or recycle (Atlantic)
3. Send monthly warm touches (no hard sell)
4. If lead replies: reset cadence + move back to active stage
5. If lead opts out: respect immediately, mark as opted-out

---

## Progression Rules by Brand

### MassDwell: Conversation → Site Visit → Offer → Close

**Trigger site feasibility booking:**
- Lead has answered all 5 minimum qualification questions ✓
- Goal includes feasibility interest (not just browsing)
- Timeline is within 12 months
- Default: "Let's book a site visit. 30-45 min with our team."

**Trigger offer after site visit:**
- Feasibility completed, numbers generated
- Lead hasn't declined
- Default: "Based on your lot, here's what we can build + timeline + price range"

**Terminal states:**
- Contract Signed/Deposit Paid = lead moves to ops (handoff)
- FUTURE CONTACT = stay in touch for upsell/referral

### Atlantic Laser: Qualification → Demo → Quote → Close

**Trigger demo:**
- Lead answered 5 minimum qualification questions ✓
- Material + use case + duty cycle confirmed
- Timeline indicates active need (not "someday")
- Default: "Let's get you in front of a system. [date/time options]"

**Trigger quote:**
- Demo completed OR lead requests quote directly
- System specs confirmed
- Default: "Here's the exact spec + pricing for [model name]"

**Terminal states:**
- Closed Won = order placed, project handoff
- Closed Lost = moved to recycle for future engagement

---

## Sales Chief Action Mappings

### On Inbound Lead (brand: massdwell)

```
1. Lead arrives → md_incoming_leads (24h SLA)
2. Sales Chief: ask 5 minimum questions (town, goal, timeline, lot, budget)
3. If qualified:
   - Move to md_welcome_email_sent (48h SLA)
   - Draft welcome + site feasibility booking offer
4. If reply received:
   - Move to md_conversation_started (168h SLA)
   - Propose next step (call or site visit)
5. If no reply after attempts:
   - Move to md_recycle_followup (168h SLA)
   - Monthly warm touches indefinitely
```

### On Inbound Lead (brand: atlantic_laser)

```
1. Lead arrives → al_incoming_leads (24h SLA)
2. Sales Chief: ask 5 minimum questions (material, use case, duty, budget, timeline)
3. If qualified:
   - Move to al_qualified (168h SLA)
   - Recommend demo/consult
4. If demo scheduled:
   - Move to al_demo_scheduled (168h SLA)
   - Confirm date + logistics
5. If quote requested:
   - Move to al_quote_requested (168h SLA)
   - Generate quote + send
6. If no progression:
   - Move to al_recycle (2160h SLA)
   - Monthly touches
```

---

## Reporting from Pipeline Stages

**Weekly Sales Report template:**

```
MassDwell Pipeline:
  - Incoming Leads: N leads (oldest: X hours)
  - Welcome Email Sent: N leads (avg age: X hours)
  - Conversation Started: N leads (oldest: X days)
  - Site Feasibility Booked: N leads (oldest: X days)
  - Negotiation: N leads + $X pipeline
  - Stuck Deals (SLA exceeded): [list with days over]

Atlantic Laser Pipeline:
  - Incoming Leads: N leads (oldest: X hours)
  - Contacted: N leads (avg age: X hours)
  - Qualified: N leads (oldest: X days)
  - Demo Scheduled: N leads + dates
  - Quote Sent: N leads + $X pipeline
  - Stuck Deals (SLA exceeded): [list with days over]
```

---

## Updates Needed

**Alpine Property Group stages:** Waiting for stage definitions from Steve. Once provided:
1. Add 10-stage progression (Incoming → Qualified → Underwriting → LOI → DD → Close)
2. Define qualification gate (location, type, units, zoning, price, motivation)
3. Add SLAs per stage
4. Document default CTAs for Alpine

---

**Last Updated:** 2026-03-04  
**Status:** MassDwell + Atlantic complete; Alpine pending
