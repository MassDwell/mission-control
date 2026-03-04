# MESSAGE-TEMPLATES-REFERENCE.md — Sales Chief Message Library

**Purpose:** Pre-approved message templates that Sales Chief can send without per-message approval (Level 0 automation).

All templates follow the brand voice and are designed for quick response + high engagement.

---

## MassDwell Templates

### Inbound First Response (T+0, within 5 minutes)

**Channel:** Email or SMS  
**Intent:** Acknowledge receipt + ask 2 minimum questions  
**Tone:** Warm, consultative, helpful

**Message:**
> "Got it — happy to help. Two quick questions so I can point you the right way: (1) what town is the property in? (2) are you aiming for rental income or family use?"

**When to use:**
- New inbound lead (md_incoming_leads stage)
- Always respond within 5 minutes during business hours
- Use SMS for phone numbers, email for email addresses

---

### Follow-up Bump (T+2h, if no reply to initial)

**Channel:** Email or SMS  
**Intent:** Gentle reminder + one key question  
**Tone:** Friendly, brief, non-pushy

**Message:**
> "Quick bump — what town is the property in? Once I have that, I can tell you the best next step."

**When to use:**
- 2 hours after first response if no reply
- Part of cadence engine (step 1)
- Keep it short (one question max)

---

### Close Loop (T+7d, if no reply to follow-ups)

**Channel:** Email or SMS  
**Intent:** Respectful exit + offer to keep in touch  
**Tone:** Honest, helpful, no pressure

**Message:**
> "Want me to keep this on my radar, or should I close the loop for now? If you tell me your timeline (this quarter vs 6–12 months), I'll route you correctly."

**When to use:**
- After 3 failed attempts (T+2h, T+24h, T+72h)
- Part of cadence engine (step 4)
- Gives lead choice: stay in touch or close
- If lead replies: reset cadence, move to active conversation

---

## Atlantic Laser Templates

### Inbound First Response (T+0, within 5 minutes)

**Channel:** Email or SMS  
**Intent:** Acknowledge + qualify on material + use case  
**Tone:** Technical, concise, confident

**Message:**
> "Thanks — I can recommend the right setup quickly. What material + thickness are you working with, and is this production or occasional use?"

**When to use:**
- New inbound lead (al_incoming_leads stage)
- Always respond within 5 minutes during business hours
- Lead with speed + technical credibility

---

### Follow-up Bump (T+2h, if no reply to initial)

**Channel:** Email or SMS  
**Intent:** Gentle reminder + focus on key qualifier  
**Tone:** Brief, technical, outcome-focused

**Message:**
> "Quick follow-up — what material/thickness are you welding? That determines the right system and ballpark."

**When to use:**
- 2 hours after first response if no reply
- Part of cadence engine (step 1)
- Show expertise (material = system = price)

---

### Close Loop (T+7d, if no reply to follow-ups)

**Channel:** Email or SMS  
**Intent:** Respectful exit + lower barrier to re-engagement  
**Tone:** Professional, no pressure, future-focused

**Message:**
> "Should I keep this open, or circle back later? If you share your timeline and whether financing matters, I'll line up the right next step."

**When to use:**
- After 3 failed attempts (T+2h, T+24h, T+72h)
- Part of cadence engine (step 4)
- Offer future re-engagement (not dead forever)
- If lead replies: reset cadence, move to active conversation

---

## Alpine Property Group Templates

### Inbound First Response (T+0, within 5 minutes)

**Channel:** Email or SMS  
**Intent:** Acknowledge + request key underwriting data  
**Tone:** Professional, deal-sharp, efficient

**Message:**
> "Thanks — send the location + asset type and any notes you have (units/zoning status). I'll revert with underwriting questions and next steps."

**When to use:**
- New inbound lead (ap_incoming_leads stage)
- Always respond within 5 minutes during business hours
- Move fast: ask for OM or basic data upfront

---

### Follow-up Bump (T+2h, if no reply to initial)

**Channel:** Email or SMS  
**Intent:** Gentle reminder + lower barrier (ask for essentials)  
**Tone:** Efficient, no-fluff, action-oriented

**Message:**
> "Quick bump — can you share location + asset type + price guidance? That's enough for us to triage fit fast."

**When to use:**
- 2 hours after first response if no reply
- Part of cadence engine (step 1)
- Reduce friction: only 3 pieces of info needed

---

### Close Loop (T+7d, if no reply to follow-ups)

**Channel:** Email or SMS  
**Intent:** Respectful exit + offer to keep reviewing  
**Tone:** Professional, open-ended, no pressure

**Message:**
> "Want us to keep reviewing this, or close the loop for now? If you share seller timeline + who controls the process, we can move quickly if it fits."

**When to use:**
- After 3 failed attempts (T+2h, T+24h, T+72h)
- Part of cadence engine (step 4)
- Show deal expertise (seller timeline + decision maker matter)
- If lead replies: reset cadence, move to active conversation

---

## How Sales Chief Uses These Templates

### Authorization Level

These templates are **Level 0 (automatic)** — Sales Chief can send without per-message approval.

**Requirement:** Steve explicitly approves each template once. After that, Sales Chief sends freely within the cadence.

### Cadence Mapping

| Cadence Step | MassDwell | Atlantic | Alpine |
|--------------|-----------|----------|--------|
| **T+0** | Inbound First Response | Inbound First Response | Inbound First Response |
| **T+2h** (Bump) | Follow-up Bump | Follow-up Bump | Follow-up Bump |
| **T+24h** (Value Add) | [Custom per lead] | [Custom per lead] | [Custom per lead] |
| **T+72h** (Choice Close) | [Custom per lead] | [Custom per lead] | [Custom per lead] |
| **T+168h** (Close Loop) | Close Loop | Close Loop | Close Loop |
| **T+720h+** (Recycle) | [Monthly warm touch] | [Monthly warm touch] | [Monthly warm touch] |

---

## Custom Message Drafting

For **T+24h, T+72h, and monthly recycle** steps, Sales Chief drafts custom messages (not using templates) based on:
- Conversation history
- Lead's specific questions/objections
- Brand voice guidelines
- Cadence intent (value add, choice close, recycle touch)

**Draft for approval process:**
1. Sales Chief creates custom draft message
2. Shows context (what prompted it, lead history, next step)
3. Steve reviews + approves or edits
4. Message sent with Steve's approval

---

## Template Customization Rules

**DO:**
- ✅ Use templates for T+0 and T+2h (no approval needed)
- ✅ Keep brand tone consistent
- ✅ Ask one question at a time (T+2h bump)
- ✅ Offer choice at close loop (not ultimatum)

**DON'T:**
- ❌ Change template wording without Steve approval
- ❌ Add urgency or pressure ("act now")
- ❌ Make claims about pricing/specs/timelines
- ❌ Use the same message twice in a row

---

## Consent + Opt-Out Rules

**Before sending ANY message:**
1. Check lead.consent.opted_out = false
2. Check appropriate channel (sms_ok, email_ok)
3. If opted_out = true: NEVER contact, log as "opted_out", move to opted_out status

**If lead says STOP / UNSUBSCRIBE / OPT OUT:**
1. Immediately set opted_out = true + opted_out_at = now
2. Stop all outbound communication
3. Log in audit trail
4. Move lead to opted_out status (terminal)

---

## Weekly Reporting Template

### Weekly Snapshot Structure

**Week of:** [ISO date]

**New Leads by Brand:**
- MassDwell: N leads
- Atlantic Laser: N leads
- Alpine: N leads

**Speed to Lead (avg):**
- ___ minutes

**Meetings Booked (this week):**
- MassDwell: N
- Atlantic Laser: N
- Alpine: N

**Pipeline Value by Brand:**
- MassDwell: $___ 
- Atlantic Laser: $___
- Alpine: $___

**Stuck Deals Count (exceeds SLA):**
- MassDwell: N
- Atlantic Laser: N
- Alpine: N

**Stuck Deals List:**
[List each with: lead name, stage, days over SLA, recommendation]

**Recommendations:**
[Sales Chief suggests: follow up, move to recycle, close lost, or escalate to Steve]

---

## Template Approval Workflow

**Step 1:** Sales Chief proposes new/modified template  
**Step 2:** Steve reviews + approves or edits  
**Step 3:** Template added to schema  
**Step 4:** Sales Chief uses in cadence (no per-message approval)  
**Step 5:** Monthly review (adjust based on reply rates, feedback)

---

## Message Metrics (Track Per Template)

For each template, track:
- **Send count:** How many times sent (per brand, per week)
- **Reply rate:** Replies / sends (%)
- **Reply time:** Avg hours to reply
- **Conversion:** Replies that move to next stage (%)
- **Opt-out rate:** Unsubscribes (per 1000 sends)

**Use metrics to:**
- Refine language (high opt-out = too pushy)
- Test A/B variations (subject lines, tone)
- Build best-practices library over time

---

**Last Updated:** 2026-03-04  
**Status:** All 3 brands approved + deployed
