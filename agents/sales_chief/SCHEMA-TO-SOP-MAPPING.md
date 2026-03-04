# Schema-to-SOP Mapping — Sales Chief

This document maps the `SALES-CHIEF-SCHEMA.json` to the `SALES-CHIEF-SOP.md` operational framework.

---

## Authorization Levels → Operating Rules

### Level 0 (Automatic — No Approval)

**Schema:** `operating_rules.authorization_levels.level_0_allowed`

**SOP Section:** 0) Master Guardrails → Authorization Levels → Level 0

**Actions:**
- Draft replies, sequences, follow-ups
- Update CRM stages, tasks, reminders (if integrated)
- Create internal summaries, call prep notes, handoff notes
- Recommend next steps, propose meeting times as drafts
- Pipeline hygiene + reporting

### Level 1 (Requires Steve Approval)

**Schema:** `operating_rules.authorization_levels.level_1_requires_approval`

**SOP Section:** 0) Master Guardrails → Authorization Levels → Level 1

**Actions:**
- Send any outbound message (email/SMS/DM)
- Book meetings with external parties
- Share proposals/quotes/pricing (unless approved range exists)

**Workflow:**
1. Sales Chief drafts message
2. Creates approval_item (type: "outbound_message", risk_level: "level_1")
3. Waits for Steve approval
4. Upon approval: sends + marks status: "approved"

### Level 2 (Explicit Approval Every Time)

**Schema:** `operating_rules.authorization_levels.level_2_explicit_each_time`

**SOP Section:** 0) Master Guardrails → Authorization Levels → Level 2

**Actions:**
- Discounts, special terms, contract language
- Binding delivery/install timelines
- Claims about permitting/zoning/engineering outcomes
- Any legal/financial commitments

**Workflow:**
1. Sales Chief detects Level 2 action needed
2. Creates approval_item (risk_level: "level_2", expires_at: <24h default>)
3. Escalates to Steve with context + recommendation
4. Requires explicit approval (not just "looks good")

---

## Brand Separation → Routing

### Strict Mode (No Cross-Contamination)

**Schema:** `operating_rules.brand_separation.strict_mode: true`

**SOP Section:** 1) Structure → Hard Rule

**Rule:** Every lead belongs to exactly one brand_mode.

**If ambiguous:**
```
Sales Chief asks: "Quick one — is this about an ADU (MassDwell), 
laser equipment (Atlantic), or a real estate deal (Alpine)?"
```

### Routing Keywords

**Schema:** `routing.routing_rules.keywords`

**Usage:** Auto-detect brand_mode based on lead message keywords

**Examples:**
- **MassDwell:** "adu", "backyard", "feasibility", "modular", "site visit"
- **Atlantic:** "laser", "welding", "handheld", "thickness", "demo", "quote"
- **Alpine:** "deal", "multifamily", "underwrite", "LOI", "broker"

---

## Output Contract → Response Format

### Required Fields (Every Response)

**Schema:** `operating_rules.output_contract.must_include_fields`

**SOP Section:** 3) Output Contract

**Required in every Sales Chief response:**

1. **brand_mode** — massdwell | atlantic_laser | alpine
2. **lead_ref** — lead ID or name
3. **current_stage** — Current pipeline stage
4. **recommended_next_stage** — Where lead should go next
5. **summary** — 3 bullets max
6. **decision_needed** — yes/no + exact decision
7. **next_actions** — Numbered list with owner + due date
8. **draft_message_if_relevant** — Message text (if sending)
9. **risks_notes** — Compliance or uncertainty flags

**Example:**
```
brand_mode: massdwell
lead_ref: acme-construction-03-04
current_stage: incoming
recommended_next_stage: qualified
summary:
  - Property: 123 Main St, Needham
  - Goal: Backyard ADU for rental income
  - Timeline: 6-12 months

decision_needed: no
next_actions:
  1. Send welcome email + site feasibility info (Owner: Sales Chief, Due: 2026-03-04 18:00)
  2. Follow up with video call offer (Owner: Sales Chief, Due: 2026-03-05 15:00)

draft_message:
"Thanks for reaching out! Quick question — are you in Needham? If so, I can 
schedule a free site feasibility assessment. Most clients spend 30-45 min with 
our team getting baseline numbers. Sound good?"

risks_notes: None
```

---

## Compliance Rules → Anti-Spam + Verification

### No Hallucinated Facts

**Schema:** `operating_rules.compliance.no_hallucinated_facts: true`

**SOP Section:** 0) Master Guardrails → Compliance Rules

**Rule:** Never invent specs, pricing, availability, timelines, or legal claims.

**If uncertain:** Ask or route to specialist.

**Examples of violations:**
- ❌ "Our ADUs are $150K" (if not confirmed)
- ❌ "You'll save 80% on welding time" (if not documented)
- ❌ "Permits take 30 days in this town" (if jurisdiction-specific)
- ❌ "Financing available at 6% APR" (if not approved by lender)

### Opt-Out Respected Immediately

**Schema:** `operating_rules.compliance.opt_out_respected_immediately: true`

**SOP Section:** 0) Master Guardrails → Compliance Rules

**Rule:** If lead says "stop", "unsubscribe", "remove", or "opt out":
1. Stop all outbound communication immediately
2. Mark lead as opted_out
3. Never contact again unless lead re-initiates
4. Log in compliance audit

### Anti-Spam Limits

**Schema:** `operating_rules.compliance.anti_spam`

```json
{
  "max_outbound_attempts_without_response": 5,
  "min_hours_between_attempts_default": 24
}
```

**Rule:** 
- Max 5 outbound attempts to a lead without response
- Minimum 24 hours between attempts (default)
- After 5 attempts: escalate to Steve or mark as "recycle" (stay warm, touch monthly)

**Mapping to SOP Cadence:**
- Day 0: Response (attempt 1)
- Day 1: Value add (attempt 2)
- Day 3: Bump (attempt 3)
- Day 7: Close-loop (attempt 4)
- Day 30+: Recycle touch (attempt 5 — reset if response)

---

## Pipeline State → Stage Progression

### MassDwell Pipeline

**Schema:** `state.pipeline.massdwell`

**SOP Section:** 4.1 Qualification Playbooks → MassDwell

**Stages:**
1. incoming → 24h max
2. qualified → 3d max
3. site_feasibility_booked → 7d max
4. site_feasibility_completed → 7d max
5. offer_sent → 14d max
6. contract_signed → close pending
7. closed_won ✅

### Atlantic Laser Pipeline

**Schema:** `state.pipeline.atlantic_laser`

**SOP Section:** 4.2 Qualification Playbooks → Atlantic Laser

**Stages:**
1. incoming → 24h max
2. qualified → 3d max
3. demo_scheduled → 7d max
4. quote_sent → 14d max
5. negotiation → 30d max
6. closed_won ✅

### Alpine Pipeline

**Schema:** `state.pipeline.alpine`

**SOP Section:** 4.3 Qualification Playbooks → Alpine

**Stages:**
1. incoming → 24h max
2. qualified → 3d max
3. underwriting → 30d max
4. loi_sent → 30d max
5. due_diligence → 60d max
6. closed_won ✅

---

## Data Types → Object Structures

### Lead Object

**Schema:** `types.lead`

**Fields:**
- id, brand_mode, name, company, email, phone
- stage, stage_entered_at
- next_action, next_action_due_at
- follow_up_cadence, cadence_attempts_count, last_attempt_at
- created_at, updated_at
- contact_history, qualification_data, deal_value_usd
- notes, tags

### Next Action Object

**Schema:** `types.next_action`

**Fields:**
- id, title, owner, due_at, status
- dependencies, notes, lead_ref

**Status values:** todo | in_progress | waiting | done | cancelled

### Message Draft Object

**Schema:** `types.message_draft`

**Fields:**
- id, lead_ref, channel, to, subject, body
- created_at, status, approval_notes

**Channel values:** email | sms | dm | call_script  
**Status values:** draft | queued_for_approval | sent | rejected

### Approval Item Object

**Schema:** `types.approval_item`

**Fields:**
- id, type, risk_level, lead_ref, summary, payload
- created_at, expires_at, status
- resolved_at, resolved_by, resolution_notes

**Type values:** outbound_message | booking | quote_share | discount | timeline_commitment | legal_claim  
**Risk level:** level_1 | level_2  
**Status:** pending | approved | rejected | expired

---

## Sales KPIs → Weekly Reporting

**Schema:** `state.sales_kpis`

**SOP Section:** 2) Core Responsibilities → F) Reporting

**KPIs tracked per brand:**
- new_leads_this_month
- qualified_this_month
- stage-specific metrics (site_visits_booked, demos_scheduled, underwriting_count)
- pipeline_usd (revenue forecast)
- avg_speed_to_lead_minutes

**Weekly Report uses these metrics to show:**
- New inbound by source
- Conversion rate by stage
- Speed-to-lead
- Meetings booked
- Pipeline $ forecast
- Stuck deals + recommendations

---

## Summary

| Aspect | Schema Location | SOP Section | Purpose |
|--------|-----------------|-------------|---------|
| Authorization | operating_rules.authorization_levels | 0) Master Guardrails | Gating what Sales Chief can do |
| Brand Separation | operating_rules.brand_separation | 1) Structure | Preventing cross-contamination |
| Compliance | operating_rules.compliance | 0) Master Guardrails | Anti-spam, fact verification, opt-outs |
| Output Format | operating_rules.output_contract | 3) Output Contract | Standardized response structure |
| Routing | routing.routing_rules | 1) Structure → Hard Rule | Auto-detecting brand from keywords |
| Pipeline | state.pipeline | 4) Qualification Playbooks | Stage progression by brand |
| Data Types | types | 5-8) SOP sections | Object structure definitions |
| KPIs | state.sales_kpis | 2) Core Responsibilities → F) | Weekly reporting metrics |

---

**Last Updated:** 2026-03-04  
**Schema Version:** 1.0.0
