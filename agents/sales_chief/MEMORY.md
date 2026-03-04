# MEMORY.md — Sales Chief

**System of Record for Sales Pipeline**

---

## Open Loops (Leads Awaiting Action)

| Lead | Brand | Stage | Due | Owner | Notes |
|------|-------|-------|-----|-------|-------|
| | | | | | |

---

## Pipeline by Stage (Reference PIPELINE-STAGE-REFERENCE.md for full details)

### MassDwell Stages
- **Incoming Leads** (md_incoming_leads, 24h SLA)
- **Welcome Email Sent** (md_welcome_email_sent, 48h SLA)
- **Follow-up 1** (md_followup_1, 72h SLA)
- **Recycle Follow-up** (md_recycle_followup, 168h SLA)
- **Conversation Started** (md_conversation_started, 168h SLA)
- **Site Feasibility Booked** (md_site_feasibility_booked, 168h SLA)
- **Site Feasibility Completed** (md_site_feasibility_completed, 336h SLA)
- **Negotiation/Decision** (md_negotiation_decision, 336h SLA)
- **Contract Signed/Deposit** (md_contract_signed_deposit, 720h SLA)
- **FUTURE CONTACT** (md_future_contact, 2160h SLA)
- **Recap Emails** (md_recap_emails, 336h SLA)

### Atlantic Laser Stages
- **Incoming Leads** (al_incoming_leads, 24h SLA)
- **Contacted / Welcome Sent** (al_contacted, 48h SLA)
- **Qualified** (al_qualified, 168h SLA)
- **Demo / Consult Scheduled** (al_demo_scheduled, 168h SLA)
- **Quote Requested** (al_quote_requested, 168h SLA)
- **Quote Sent** (al_quote_sent, 336h SLA)
- **Negotiation** (al_negotiation, 336h SLA)
- **Closed Won** (al_closed_won, terminal)
- **Closed Lost** (al_closed_lost, terminal)
- **Recycle / Nurture** (al_recycle, 2160h SLA)

### Alpine Property Group Stages (TBD - awaiting definitions)
- **Incoming Leads** (ap_incoming_leads, 24h SLA)
- **Qualified** (ap_qualified, 168h SLA)
- **Underwriting** (ap_underwriting, 720h SLA)
- **LOI Sent** (ap_loi_sent, 720h SLA)
- **Due Diligence** (ap_due_diligence, 1440h SLA)
- **Closed Won** (ap_closed_won, terminal)
- **Closed Lost** (ap_closed_lost, terminal)

---

## Waiting On (External Dependencies)

| Lead | Waiting For | Expected By | Owner |
|------|-------------|-------------|-------|
| | | | |

---

## Stuck Deals (Age > Threshold)

| Lead | Brand | Days Stuck | Last Activity | Recommended Action |
|------|-------|-----------|---|----------|
| | | | | |

---

## Sales Cadences (Active)

### Daily (9 AM EST)
- [ ] Check inbound (last 24h)
- [ ] Scan stuck deals
- [ ] Verify follow-ups due today
- [ ] Confirm meetings

### Weekly (Monday AM)
- [ ] Pipeline report by stage
- [ ] Stuck deals review + recommendations
- [ ] Forecast by brand

### Monthly
- [ ] Win/loss analysis
- [ ] Source effectiveness review
- [ ] Brand-specific adjustments

---

## Sales KPIs (Track These)

### MassDwell
- New inbound leads: ___
- Qualified this week: ___
- Site feasibility booked: ___
- Revenue pipeline: $___

### Atlantic Laser
- New inbound leads: ___
- Qualified this week: ___
- Demos scheduled: ___
- Revenue pipeline: $___

### Alpine Property Group
- New inbound deals: ___
- Qualified this week: ___
- LOI / underwriting: ___
- Revenue pipeline: $___

### Aggregate Metrics
- Avg speed-to-lead: ___ min
- Conversion rate (Incoming → Qualified): ___%
- Meetings booked this week: ___
- Stuck deals count: ___

---

## Brand Context (Updated as we learn)

### MassDwell
- Primary qualification: town, goal, timeline, lot, budget
- Default CTA: site feasibility visit
- Typical timeline: 6-12 months to close
- Common objections: ___

### Atlantic Laser
- Primary qualification: use case, duty cycle, budget, constraints
- Default CTA: demo + quote
- Typical timeline: 2-3 months to close
- Common objections: ___

### Alpine Property Group
- Primary qualification: location, asset type, price, motivation
- Default CTA: underwriting review
- Typical timeline: 3-6 months to close
- Common objections: ___

---

## Approved Templates (Level 1 Bypass)

If Steve explicitly approves these, Sales Chief can send without per-message approval:

- Welcome message (new inbound acknowledgement)
- Day 1 value add (e.g., FAQ or case study)
- Day 3 bump (short re-engagement)
- Day 7 close-the-loop

---

## Schema Reference

**Operational Schema:** `SALES-CHIEF-SCHEMA.json`

This defines:
- Authorization levels (0, 1, 2)
- Brand separation + routing
- Compliance rules (no hallucinations, opt-out respect, anti-spam limits)
- Output contract (required fields for every response)
- Pipeline structure by brand
- Lead + action + draft + approval data types

---

**Status:** Live and tracking  
**Last Updated:** 2026-03-04
