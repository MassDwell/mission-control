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

## Alpine Property Group Pipeline (10 Stages)

### Stage Progression Flow

```
Incoming Leads (24h SLA)
    ↓
Contacted (72h SLA)
    ↓
Qualified / Fit (7d SLA)
    ↓
Underwriting (14d SLA)
    ↓
Offer / LOI (14d SLA)
    ↓
Negotiation (14d SLA)
    ↓
Under Agreement (30d SLA)
    ↓
[Closed (terminal) OR Pass (terminal)]
    ↓
Nurture (90d SLA) — if passed, for future re-engagement
```

### Detailed Stage Definitions

| Stage ID | Stage Name | SLA (hours) | SLA (days) | Entry Criteria | Exit Criteria | Owner |
|----------|-----------|-----------|-----------|----------------|----------------|-------|
| ap_incoming_leads | Incoming Leads | 24 | 1 | New deal received | Acknowledge + reach out | Sales Chief |
| ap_contacted | Contacted | 72 | 3 | Initial outreach made | First qualification call or 5 questions answered | Sales Chief |
| ap_qualified | Qualified / Fit | 168 | 7 | Lead answered 5 min questions, fits buy box | Request OM / underwriting begins | Sales Chief / Steve |
| ap_underwriting | Underwriting | 336 | 14 | Deal OM received, underwriting started | Underwriting complete, offer decision made | Steve / Finance |
| ap_offer_loi | Offer / LOI | 336 | 14 | Offer sent to seller OR LOI ready | LOI accepted / rejected | Steve |
| ap_negotiation | Negotiation | 336 | 14 | LOI negotiation in progress | Deal agreed upon or seller walks | Steve |
| ap_under_agreement | Under Agreement | 720 | 30 | Contract signed, earnest money paid | Close date (funding confirmed) | Steve |
| ap_closed | Closed | 0 | - | Deal closed, funds transferred | PROJECT COMPLETE | Steve |
| ap_pass | Pass | 0 | - | Deal rejected after review | PROJECT COMPLETE | Sales Chief / Steve |
| ap_nurture | Nurture | 2160 | 90 | Deal passed or lost opportunity | Monthly warm touches, await future deal flow | Sales Chief |

### Qualification Gate (Before Underwriting)

**Minimum Required Data:**
- ✅ Location & asset type (address, # units, residential/commercial)
- ✅ Units or program (multifamily, ground-up, adaptive reuse, etc.)
- ✅ Zoning or permitting status (zoned correctly? permits in place?)
- ✅ Seller motivation & timeline (urgent? testing market? firm price?)
- ✅ Price guidance & process owner (price expectation? broker/off-market?)

**Default CTAs (if qualified):**
- "Send me the OM (Offering Memorandum)"
- "Let's schedule a 30-minute intro call"
- "Send key docs: financials, site plan, permits"

### Deal Qualification Rules (Alpine Specifics)

**Buy Box Indicators:**
- Location: Greater Boston market (core focus)
- Asset: Multi-family (2-30+ units) or ground-up development
- Price: $500K - $10M+ range
- Seller: Motivated, open to negotiation
- Zoning: Clear path to use (or developer-friendly municipality)

**Red Flags (suggest Pass):**
- Zoning complications without variances
- Seller inflexible on price
- Market showing weakness in specific submarket
- Developer inexperienced
- Site conditions unknown/unclear

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

---

## Cadence Engine (Standard Follow-Up Sequence)

Applies across all three brands. Sales Chief uses this if lead doesn't reply.

### Default Sequence (If No Response)

| Step | Timing | Intent | Tone | Example |
|------|--------|--------|------|---------|
| 1 | T+2h | Short bump + one question | Friendly reminder | "Hey [name], just checking in — what's your timeline looking like?" |
| 2 | T+24h | Value add + choice close | Helpful, specific | "Found a case study of a [similar property] — thought you'd find it interesting. Which resonates more: [option A] or [option B]?" |
| 3 | T+72h | Choice close | Collaborative | "Two paths forward: we can [A] or [B]. Which works better for you?" |
| 4 | T+168h (7d) | Close-loop + recycle permission | Respectful exit | "No pressure if this isn't the right timing. Want to stay in touch for future opportunities?" |
| 5 | T+720h (30d+) | Recycle touch monthly | Warm, low-pressure | "[name], still thinking about deals in [market]? Would love to reconnect when timing is right." |

### Cadence Rules

✅ **Reset on inbound reply:** If lead replies at any point, reset the cadence and move to conversation mode  
✅ **Stop on opt-out:** If lead says STOP, unsubscribe, or opt out, respect immediately and never contact again  
✅ **Max 5 attempts without response:** After step 5 (30 days), move to monthly nurture cadence (no auto-escalation)

### Brand-Specific Tone Adjustments

**MassDwell:**
- Warm, consultative ("Let's explore your lot together")
- Focus on feasibility + confidence
- Example: "I'd love to walk your property + show you what's possible"

**Atlantic Laser:**
- Technical, ROI-focused ("Here's the throughput math")
- Emphasize efficiency gains
- Example: "I ran the numbers on your material thickness — here's where you'd see the biggest gains"

**Alpine Property:**
- Professional, deal-sharp ("This fits your buy box perfectly")
- Underwriting language OK
- Example: "Your NOI target is 6.5%? Here's how this deal breaks down"

---

**Last Updated:** 2026-03-04  
**Status:** ✅ MassDwell + Atlantic + Alpine COMPLETE | Cadence engine LIVE
