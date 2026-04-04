# DrawStack Implementation Brief
**Generated:** 2026-03-29  
**Scope:** P0 Blitz (Phase 1) + Wow Factor Features (Phase 2)  
**Branch strategy:** All work on feature branches → staging → Steve reviews → main  
**Repo:** github.com/MassDwell/drawstack  

---

## PHASE 1 — P0 Blitz (14 fixes, 3 PRs)

### PR A — Typed Event Bus + Transactional Email Layer
**This is the architectural spine. Build it first — everything else depends on it.**

Build a single typed internal event bus (`lib/events/draw-events.ts`) that:
- Defines typed payloads for every draw state transition
- Dispatches Resend email templates per event type
- Is the single pathway for all future notifications (webhooks, push, Slack)

**6 required email events to wire up:**
1. Draw submitted (→ lender)
2. Draw status changed: UNDER_REVIEW, INSPECTION_ASSIGNED, APPROVED, FUNDED (→ GC)
3. Sub invoice submitted (→ GC)
4. Sub invoice approved/rejected (→ sub, with rejection reason)
5. Lender invited to project (→ lender, redesigned with project context)
6. Sub invited to project (→ sub, redesigned with dual CTA: account + token)

**Email template requirements:**
- Lender invite: GC name, project name, project address, "Set up your lender account →"
- Sub invite: GC name, project name, project address, dual CTA — "Create Account" AND "Submit Without an Account →"
- All emails: DrawStack branding, unsubscribe, support link

---

### PR B — All 14 P0 Fixes

**GC Portal:**
1. **Progress bar bug** — Fix calculation on project cards. Bar = `totalDrawnAmount / loanAmount`. 0% funded = empty bar.
2. **SOV template download** — Add "Download Template CSV" button on SOV upload screen. Columns: Line #, Description, Category, Amount.
3. **SOV manual entry fallback** — Add "Enter SOV manually" link routing to inline line-item editor.
4. **AI confidence gate** — Flag any SOV mapping below 80% confidence in red. Require explicit manual confirmation before proceeding. Show: "AI is uncertain — please review before submitting."
5. **Retainage disclosure in onboarding** — Surface `retainagePct` in Step 1 with default (10%) and tooltip explaining it.

**Sub Portal:**
6. **Sub email mismatch** — If authenticated sub's email doesn't match any ProjectSubcontractor record: show clear error "We couldn't find your account in this project. Contact your GC to verify the email address they used." + "Wrong account? Sign out."
7. **Retainage disclosure on invoice form** — Show before submit: "Invoice total: $X. Retainage withheld (10%): $Y. Expected payment: $Z."
8. **Invoice rejection feedback loop** — On rejection: (1) email sub with GC rejection reason, (2) show reason prominently on invoice detail, (3) display "Resubmit" button pre-filled with prior data.
9. **"Funded ≠ Paid to Sub"** — Decouple statuses. Add GC action: "Mark sub as paid" with payment date + method. Sub portal shows "Paid" ONLY after GC marks it. Before that: "Lender has funded this draw — awaiting payment from your GC."

**Lender Portal:**
10. **Lender project info panel** — Add collapsible panel with: GC Company, Loan Amount, LTV, Project Type, Loan Origination Date, Maturity Date, Max Draws.
11. **Draw package completeness checklist** — Per-draw checklist of required doc types. Show checkmark when each type is present. Block approval until required docs uploaded.
12. **G703-format SOV columns** — Add to on-screen SOV table in lender draw detail: Contract Amount | Prior Draws (cumulative) | This Draw | Cumulative to Date | % Complete | Balance to Complete.

**Cross-portal:**
13. **Draw revision/resubmission flow** — Add `REVISION_REQUESTED` state. GC can update docs, adjust SOV amounts, add comments, resubmit. Lender sees what changed between versions.
14. **Partial draw approval at line-item level** — Lender can approve, reduce, or reject individual SOV line items. Final approval button shows net approved vs. requested. Drives funding amount and sub payment splits.

---

### PR C — Immutable Audit Log
- Append-only `DrawEvent` records in Postgres: actor, action, entity, timestamp, delta snapshot, reason code
- Surface as "Activity" tab on draw detail (every status change, upload, approval, comment)
- Every event bus emission in PR A also writes to audit log
- Never mutate — insert only

---

## PHASE 2 — Wow Factor Features (3 PRs, built in order)

### PR D — Photo-to-SOV AI Inspector Flow
**The moat feature. Ties photos to draw invoices — nobody does this.**

**Inspector mobile flow:**
- Mobile-first upload UI (works on iPhone Safari)
- Geo-tagged, timestamped site photos uploaded per project
- Gemini Vision maps each photo to a SOV line item
- Assigns percent-complete confidence score per line
- Flags discrepancies: "Framing billed at 80% complete — photos suggest ~55%"
- Photo evidence stored in S3 with tamper-evident metadata (geo + timestamp)

**Lender view:**
- Per line item in draw detail: photo evidence count + confidence score
- Click to expand: see the photos + AI assessment
- "Photo-verified" badge on line items with matching evidence

**GC flow:**
- Can upload photos pre-submission or during draw wizard
- AI pre-fills percent-complete suggestions based on photos
- Override available with reason required

---

### PR E — Draw Intelligence Engine
**Turns DrawStack into an underwriting co-pilot.**

**Per-draw health score (0–100):**
- Composite of: invoice confidence scores, retainage exposure %, budget burn rate vs. schedule, lender response latency, doc completeness
- Visible to all parties with breakdown of contributing factors
- Color-coded: green (80+), yellow (50-79), red (<50)

**Anomaly detection:**
- Line items trending over budget → alert GC + lender
- Subs with statistically unusual invoice patterns → flag for review
- Projected final cost per SOV line (gets smarter with each draw cycle)

**Lender benchmark panel:**
- Anonymized aggregate benchmarks from all DrawStack projects
- Average approval time by project type
- Typical retainage rates
- Common rejection reasons
- "Median for multifamily in your region is 12 days" — surfaced in-context

**Proactive funding gap detector:**
- Forward-looking cash flow model per project
- Alerts when projected draw requests will outpace approved budget pockets
- 30–60 day early warning before gap materializes
- Alert goes to GC + lender simultaneously

---

### PR F — Cross-Project Trust Network
**The network effect flywheel. Data moat that compounds with every project.**

**Sub Scorecard (per sub, portable across projects):**
- On-time invoice submission rate
- Invoice accuracy rate (AI confidence scores over time)
- Retainage dispute history
- Draw cycle contribution latency
- Visible to any GC who invites them to a project

**GC Performance Rating:**
- Draw accuracy (claimed vs. approved amounts)
- Document completeness rate
- Inspection pass rate
- Timeline adherence (draw-to-funding velocity)
- Visible to lenders in project detail

**Trust badge system:**
- "Verified Contractor" — 10+ draws, >85% accuracy, zero disputes
- "Fast Payer" — GC marks subs paid within 5 days of funding consistently
- Badges visible in invite emails and portal headers

**Privacy rules:**
- Raw scores visible only to invited parties
- Aggregated anonymized benchmarks visible to all (feeds Intelligence Engine)
- Opt-out not permitted — participation required for platform access (part of TOS)

---

## Technical Constraints (must follow)
- Neon (Postgres): No nested Prisma includes beyond 1 level — use sequential flat queries and merge in JS
- All file storage: `lib/s3.ts → uploadBuffer()` only — never `@vercel/blob`
- Prisma relation names: check schema, always PascalCase
- Branch strategy: feature branch → staging → Steve reviews → main (NEVER merge features direct to main)
- After every push: verify `git log origin/main..HEAD` = 0 commits ahead before reporting done
- Vercel deploy = push confirmed + `vercel ls` shows Ready status
- Node 22 + Stripe: use raw `fetch()` for Stripe calls, not SDK

## Sequencing note
PR D (Photo AI) → PR E (Intelligence Engine uses photo confidence data) → PR F (Trust Network uses Intelligence scores) — these three compound. Build in order.

