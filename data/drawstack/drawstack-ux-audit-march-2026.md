# DrawStack UX Audit — March 2026

> **Mandate:** Pre-launch first-impression audit. Heavy changes are on the table.  
> **Sources:** Code review (3 portals), live screenshots of all key views, Hermes code-path analysis  
> **Date:** March 29, 2026

---

## Executive Summary

DrawStack has the right architecture — three distinct portals (GC / Lender / Sub) with a real workflow model. The AI invoice parsing is a genuine differentiator. But the product has **systemic trust and communication gaps** that would cause real users to bounce before completing a single draw cycle.

**The core problem:** The construction finance workflow is modeled correctly in the DB and code, but it isn't communicated to users. GCs are confused about sequencing. Lenders don't have enough context to release funds with confidence. Subs don't understand what's happening to their money.

**Critical systemic gaps:**
- No notification system — no one knows when to act, draws stall
- Retainage is a financial reality that's nearly invisible in the UI
- Sub invoice rejection has no feedback loop
- Lender can't do partial approvals (this is how real lending works)
- AI SOV mapping has no confidence guard before submission
- SOV setup has no template download — upload failure rate will be high
- "Funded" to lender ≠ "Paid" to sub — this is a serious financial ambiguity

**P0 count: 9.** All must be fixed before a real GC, lender, or sub completes a live draw cycle.

---

## GC Persona

### Workflow

The GC is the hub of everything. They set up the project, onboard lenders and subs, create draws, and manage everything through approval. Their experience must inspire confidence — they're trusting DrawStack with real money and real construction timelines.

**Ideal flow:** Sign up → Onboarding → Project setup (SOV + fields) → Invite lender → Invite subs + assign lines → Create draw → Manage sub invoices → Track draw → Get funded.

**Observed issues:** Sequencing problems, hidden critical financial fields, a draw wizard with backwards navigation context, and no notifications anywhere in the chain.

### Issues

| Issue | Page/Component | Severity | Fix |
|---|---|---|---|
| **LenderName required in onboarding Step 1 — premature friction.** GCs often explore before committing to live project data. Hard-requiring lender name at sign-up causes drop-off. | `OnboardingFlow.tsx` Step 1 | P1 | Make `lenderName` optional in Step 1. Add "Set up your lender later" escape hatch. Collect it when they actually invite the lender. |
| **Retainage % hidden from onboarding.** Defaults to 10% silently. Many projects use 5%, 15%, or phased retainage. GCs who miss this will submit draws with wrong math. | `OnboardingFlow.tsx` / `/projects/new` | P0 | Surface `retainagePct` in onboarding Step 1 with tooltip: "Retainage is withheld from each draw per your loan agreement. Default is 10%." |
| **No SOV template download.** GCs need to know the expected CSV format before uploading. Without a sample, upload failure rate will be very high. | `OnboardingFlow.tsx` Step 2 / SOV tab | P0 | Add "Download Template CSV" button on SOV upload screen. Columns: Line #, Description, Category, Amount. |
| **No manual SOV entry fallback.** If GC doesn't have a CSV, or upload fails, they're stuck. No "enter manually" path described. | `OnboardingFlow.tsx` Step 2 | P0 | Add "Enter SOV manually" link. Route to inline line-item editor table. |
| **Draw creation at `/draws/new` — wrong context.** Navigating to a global route to select a project is backwards when you're already inside a project. | `/draws/new` Step 1 | P1 | Add "Create Draw" button to Project Detail → Draws tab. Pass `projectId` query param to skip Step 1. |
| **AI SOV mapping has no confidence gate.** Low-confidence suggestions can be submitted to the lender unchecked. One wrong mapping on a $500K draw destroys trust immediately. | `/draws/new` Step 3 | P0 | Flag any mapping below 80% confidence in red. Require manual confirmation before Step 4. Show: "AI is uncertain — please review before submitting." |
| **No draw numbering.** Lenders track draws by number; loan agreements reference them. Ambiguity between GC and lender on "which draw" is not acceptable. | Draw creation / detail | P1 | Auto-assign draw sequence number per project (Draw #1, #2…). Display prominently in draw detail, emails, and lender portal. |
| **Retainage math not shown in draw review.** Step 4 should clearly show: requested amount, retainage withheld, net to GC. | `/draws/new` Step 4 | P1 | Add draw summary table: Line Item \| Requested \| Retainage (%) \| Net Payment. Show totals row. |
| **Sub invoice GC approval workflow is undefined.** GC sees sub invoices in the tab but there's no explicit Approve/Reject action documented. Does approval auto-include the invoice in the next draw? | Invoices tab | P1 | Add GC Approve / Reject (with required reason text) on sub invoices. Label: "Approved sub invoices will be available to include in your next draw." |
| **No notification when sub submits an invoice.** GC has no push signal. They're on job sites — they won't check the dashboard daily. | Invoices tab / global | P0 | Email to GC on sub invoice submission: "{{Sub name}} submitted a ${{amount}} invoice on {{project}} — review it now." Plus in-app badge on Invoices tab. |
| **No notification when draw status changes.** GC submits a draw and then hears nothing unless they log in and check. | Draw detail / global | P1 | Email + in-app notifications at each status transition: UNDER_REVIEW, INSPECTION_ASSIGNED, INSPECTION_COMPLETE, APPROVED, FUNDED. |
| **Progress bars on project cards are visually broken.** Live screenshot shows 0%-funded projects with fully filled green bars. Critical trust issue — data and visualization contradict each other. | Projects list cards | P0 | Fix progress bar calculation. Bar should reflect `totalDrawnAmount / loanAmount`. Empty bar for 0%. |
| **`loanRef` label is unclear.** "Loan Ref" means different things to different lenders. GCs will skip or enter garbage. | `/projects/new` | P2 | Rename to "Loan Reference / Deal ID" with placeholder "e.g. LN-2024-00123" and tooltip: "The loan number from your lender's commitment letter (optional)." |
| **Zip code field missing.** Address has Street + City + State but no ZIP. Breaks geocoding, inspection scheduling, and data integrity. | `/projects/new` | P1 | Add `zip` field. Consider address autocomplete via Google Places. |
| **State field is free text — invite data inconsistency.** "TX" / "Texas" / "tx" all possible. | `/projects/new` | P1 | Convert to dropdown with 50-state list. |
| **Loan Amount field has no formatting.** User types "1500000" — hard to read and error-prone. | `/projects/new` | P1 | Add currency input masking. Show "$1,500,000" on entry. |
| **Project list has no sort/filter.** Card grid becomes unmanageable as projects grow. | Projects list | P2 | Add sort (newest, most active, amount). Add status filter (Active, Pending Draw, Funded). Add list/table view toggle. |
| **No archived project view.** Archived projects are hidden now (bug fix) but inaccessible. GCs may need to reference completed projects. | Projects list | P2 | Add "Archived" toggle or tab to show archived projects separately. |
| **Onboarding has no recovery.** If GC closes mid-onboarding, progress may be lost. | `OnboardingFlow.tsx` | P1 | Persist onboarding state. On next login, show banner: "Finish setting up your project →" with resume link. |
| **Draw wizard Step 1 "Continue" button is enabled with no project selected.** User clicks, hits error, feels friction. | `/draws/new` Step 1 | P1 | Disable Continue button until project is selected. |
| **Default draw dates show "03/01/2026 – 03/31/2026" regardless of context.** Smart default should be based on last draw period or current month. | `/draws/new` Step 1 | P1 | Default period start = day after previous draw end, or first of current month if no prior draw. |
| **Inspection is invisible to GC.** INSPECTION_ASSIGNED status appears but GC doesn't know who the inspector is, when they're coming, or how to prepare. | Draw detail | P1 | When inspection assigned, show inspector name, contact, scheduled date. Pass from lender through to GC. |
| **No multi-user / team support.** A GC company has PMs, accounting, principals. One owner per project is a growth ceiling. | Global | P2 | Team member invites per company. Roles: Owner, Project Manager, Viewer. |

### Priority Changes (GC)

**P0 — launch blockers:**
1. Fix progress bar bug on project cards
2. SOV template download + manual entry fallback
3. AI mapping confidence gate — require confirmation on uncertain items
4. GC email notification on sub invoice submission
5. Surface `retainagePct` in onboarding with tooltip

**P1 — serious friction, fix before first real customer:**
6. "Create Draw" from project context
7. Retainage math in draw review (Step 4)
8. Draw numbering (#1, #2…)
9. Sub invoice GC approve/reject with reason
10. Draw status change notifications
11. Zip code + state dropdown + loan amount formatting
12. Draw wizard Continue button disabled until project selected
13. Smart default draw period dates
14. Inspection context surfaced to GC
15. Onboarding resume on re-login

---

## Lender Persona

### Workflow

Lenders are institutional, compliance-driven, and skeptical of new software. Their first impression must communicate: "This is serious software for serious money." They review draws, request information, and ultimately approve or reject disbursements. **A lender who doesn't trust the data won't approve. An approval they can't audit isn't compliant.**

**Observed state:** The lender portal shows an empty state for the test account. The invite email is the lender's first touchpoint — it needs to be airtight.

### Issues

| Issue | Page/Component | Severity | Fix |
|---|---|---|---|
| **Invite email must establish full context.** If the email doesn't clearly explain: who's asking, what project, what DrawStack is, and what the lender needs to do — they'll delete it. | Lender invite email | P0 | Redesign: "{{GC Name}} has invited you to review draws for {{Project Name}} at {{Address}} on DrawStack. [Set up your lender account →]." Include 1-line pitch. |
| **Empty state uses green checkmark — wrong signal.** Green checkmark implies success/completion. Nothing has happened yet. Undermines trust on first login. | `/lender` empty state | P1 | Replace with neutral icon (inbox, building). Messaging: "You're connected. Projects will appear here once a GC shares a draw with you." |
| **"User" shown instead of actual name.** Lender portal shows generic "User" in header. Feels like a beta product. | Lender portal header | P1 | Show actual user name or org name. Already available via Clerk. |
| **Project detail lacks lender-critical context.** Lender needs: GC company name, loan amount, LTV, property type, loan origination date, maturity date, max draw count. None confirmed present. | Lender project detail | P0 | Add collapsible project info panel: GC Company, Loan Amount, LTV, Project Type, Loan Origination, Maturity Date, Max Draws. |
| **No draw package completeness checklist.** Lenders need to verify: inspection report, lien waivers, contractor certification, sworn statement. Without a checklist, they can't confirm completeness before approving. | Draw detail | P0 | Add "Draw Package Checklist" per draw. List required doc types based on project settings. Show checkmark when each type is present. Consider blocking approval until required docs uploaded. |
| **No partial draw approval.** Lenders routinely fund 90% of a draw while flagging one line item for re-inspection. All-or-nothing approve/reject is not how real construction lending works. | LenderActions | P0 | Add line-item level approve/flag on SOV table. Final approval button shows net approved vs. requested. This is a fundamental workflow requirement. |
| **SOV table missing prior draw history columns.** When reviewing Draw #4, lender needs to see what was approved in Draws #1-3 per line to spot double-billing or budget overruns. | Draw detail / SOV table | P0 | Add columns: Contract Amount \| Prior Draws \| This Draw \| Cumulative % \| Remaining. This is standard construction draw worksheet format (AIA G703). |
| **No audit log / approval chain.** Who approved this draw? When? Under what conditions? Without a timestamped audit trail, DrawStack is not defensible in a legal or regulatory context. | Draw detail / global | P0 | Activity log per draw: actor, action, timestamp, note. Surface as "Activity" section on draw detail. Every status change, upload, approval, comment → writes to log. |
| **Rejection requires no documented reason.** Rejecting a draw without a required reason field creates compliance and legal exposure. | LenderActions | P1 | Make rejection reason a required text field with common reasons dropdown + free-text. Options: "Missing inspection report," "Lien waiver required," "Amount exceeds approved line," "Documentation incomplete." |
| **"Request Info" doesn't clearly change draw state.** If lender requests info but draw stays UNDER_REVIEW, the GC doesn't know to act urgently. | Comments / LenderActions | P1 | "Request Info" must: (1) change status to INFO_REQUESTED visible to GC, (2) email GC immediately, (3) show "Awaiting GC Response" to lender with timer. |
| **PDF viewer is a modal — inadequate for document review.** Complex construction documents require annotation, download, and full-screen review. Modal is too small and constraining. | Draw detail / PDF modal | P1 | Replace modal with full-page document viewer. Enable download. Add "reviewed" checkmark per document. |
| **AI insights panel is unexplained and potentially dangerous.** Unexplained AI on a financial approval screen could push biased decisions or create legal liability. | Draw detail / AI insights | P1 | Label clearly what each insight is derived from: "Based on SOV totals, this draw is 23% of contract value — within typical range for Draw #2." Or replace with factual summary stats. Never imply AI is influencing an approval decision. |
| **No portfolio action queue.** Lenders with multiple projects need a triage view — "3 draws waiting >5 days," "2 draws with outstanding info requests." | `/lender` home | P1 | Add action queue above project list: "Needs Your Review (N)," "Awaiting GC Response (N)," "Inspection Pending (N)." |
| **Stats are vanity metrics, not actionable.** "Total Draw Volume" and "Funded to Date" are numbers lenders already know — they originated the loans. | `/lender` home stats | P2 | Replace with: "Draws Awaiting Review," "Average Review Time (Days)," "Draws Approved This Month," "% of Loan Committed." |
| **Dark theme may alienate traditional lenders.** Bank-employed loan officers are accustomed to conservative enterprise software. Dark UI may trigger "is this legit?" reaction. | Lender portal global | P2 | Add light mode toggle. Test with actual lender users — don't assume the aesthetic lands. |
| **No draw revision / resubmission workflow.** Lender rejects or requests info. Then what? GC path to revise and resubmit is undescribed. | Draw detail / global | P1 | "Revise Draw" action on rejected/info-requested draws. Allow GC to update docs, adjust amounts, add comments, resubmit. Version-track so lender sees what changed. |
| **Lender must create a Clerk account.** Some institutional lenders (banks, CDFIs) can't or won't create personal SaaS accounts. | Auth | P1 | Add magic link / email OTP via Clerk — no password creation required. Prioritize for trial lenders. |

### Priority Changes (Lender)

**P0 — launch blockers:**
1. Redesign invite email — context, GC name, project, clear CTA
2. Project info panel in lender project view (loan amount, GC, dates)
3. Required documents checklist per draw
4. Partial draw approval (line-item level)
5. SOV table with Prior Draws / Cumulative / Remaining columns
6. Activity log / audit trail on every draw

**P1 — serious friction:**
7. Rejection requires documented reason (required field)
8. "Request Info" → INFO_REQUESTED status + GC email
9. Full-page PDF viewer (replace modal)
10. AI insights — label data source or replace with factual stats
11. Portfolio action queue (needs attention)
12. Draw revision / resubmit flow for GC
13. Magic link / OTP auth option
14. Empty state icon + copy fix
15. User name in header

---

## Sub Persona

### Workflow

Subs are the most skeptical users. They get an email from a GC, are asked to create an account on software they've never heard of, and are expected to submit invoices and wait to get paid. **If the first experience is confusing, they'll text the GC directly and bypass the whole system.** The entire draw workflow breaks down if subs don't engage.

The token portal (unauthenticated flow) is a smart call — it should be front and center, not buried.

### Issues

| Issue | Page/Component | Severity | Fix |
|---|---|---|---|
| **Sub invite email is the entire first impression.** If it doesn't explain who's asking, what project, what DrawStack is, and why they should bother — sub will ignore it. | Sub invite email | P0 | Redesign: "{{GC Name}} added you to {{Project Name}} at {{Address}}. To submit invoices and get paid, [Create Your Account] or [Submit Without an Account →]." Two equal CTAs. |
| **Email mismatch = silent failure.** GC enters wrong email; sub creates account, logs in, sees nothing. No error, no guidance. Sub assumes it's broken and gives up. | `/sub` auth / email match | P0 | If authenticated sub's email doesn't match any ProjectSubcontractor record: "We couldn't find your account in this project. Contact your GC to verify the email address they used." + "Wrong account? Sign out." |
| **Retainage invisible to subs.** Sub enters $10,000 invoice with no idea they'll receive $9,000. When payment arrives short, they're confused or angry — creating a GC support burden. | `/sub/projects/[id]/invoices/new` | P0 | Show retainage impact before submit: "Invoice total: $10,000. Retainage withheld (10%): $1,000. **Expected payment: $9,000.**" |
| **Invoice rejection has no feedback loop.** If sub invoice is REJECTED, does sub get an email? See the reason? Know they can resubmit? Without this, sub assumes payment is coming. | Sub invoice / notifications | P0 | On rejection: (1) email sub with GC's rejection reason, (2) show reason prominently on invoice detail, (3) display "Resubmit" button pre-filled with prior data. |
| **"Funded" ≠ "Paid to Sub."** When draw is funded by lender, sub invoice shows "Funded/Paid." But the GC hasn't necessarily paid the sub yet. This is a serious financial misrepresentation. | Invoice detail / progress bar | P0 | Decouple statuses. Add GC action: "Mark sub as paid" with payment date + method. Sub portal shows "Paid" ONLY after GC marks it. Before that: "Lender has funded this draw — awaiting payment from your GC." |
| **Empty state gives sub nothing to do.** "Ask your GC to send you an invite" is a dead end. Sub can't take any action. | `/sub` empty state | P1 | Reframe: "Once your GC adds you to a project, you'll see your contract amount, billing history, and payment status here." Add: "Notify me when I'm added" toggle. Add support link. |
| **"Scheduled Value" is construction jargon.** Subs know "my contract" or "my scope." Not "scheduled value." | `/sub` home / project page | P1 | Rename to "Your Contract Amount." Tooltip if keeping: "The total value of work assigned to you on this project." |
| **SOV line statuses are internal jargon.** "In Draw" means nothing to a sub. | Sub project page | P1 | Plain English: Pending → "Not Yet Submitted," In Draw → "In Lender Review," Approved → "Approved by Lender," Funded → "Awaiting Payment from GC." |
| **"Sub Portal" badge feels like dev label.** No value proposition communicated. | Sub portal header | P2 | Replace with "My Projects" or remove badge entirely. Or: "{{GC Company Name}} Pay Portal." |
| **No first-login guidance.** Sub logs in, sees numbers, no explanation of what to do. | Sub project page | P1 | First-time banner: "Welcome to {{Project Name}}. Submit an invoice below to request payment for completed work." Dismiss after first submission. |
| **No total payment summary.** Sub has no running view of: total invoiced, total received, retainage held, remaining contract balance. | Sub project page | P1 | Add financial summary card: Contract Amount \| Total Invoiced \| Total Received \| Retainage Held \| Remaining Balance. |
| **Token portal is buried.** If token is the recommended path for non-account subs, it must be a primary CTA in the invite email AND on the sign-in page. Currently undiscoverable. | Sub invite email / `/sub` login | P1 | Add "Submit without an account →" as a primary CTA in invite email. On sign-in page: "No account? Click here if you received a token link." |
| **Token expiry is undefined / silent.** If sub clicks a week-old token link and it's expired, they see... what? A 404? They'll text the GC. | Token portal / SubInvoiceToken | P1 | On expiry: "This link expired on [date]. Contact your GC to get a new link." Auto-trigger new token email to GC. |
| **Token portal capabilities aren't communicated.** Can subs track status via token? If token = submit-only, subs need to know to create an account for tracking. | Token portal | P1 | Show in token portal: "You can submit an invoice here. To track payment status and view history, create a free account." |
| **Freeform invoice creates invisible GC rework.** Sub submits freeform, GC has to manually map it to SOV lines. Sub doesn't know this delays payment. | Invoice form freeform mode | P1 | Add note: "Your invoice will be reviewed by your GC before it's included in a draw. This may take additional time." Consider requiring SOV line assignment before allowing sub submission. |
| **No billing period on invoice.** For progress billing, every invoice needs to specify what period it covers. Without this, lenders can't verify periods don't overlap. | Invoice form | P2 | Add billing period date range (start, end) to invoice form. |
| **PDF upload optional even when project requires lien waiver.** If lienWaiverRequired is enabled, the sub should be told and blocked. | Invoice form | P1 | If `lienWaiverRequired` is true for the project, make PDF upload mandatory with label: "Your GC requires a signed conditional lien waiver to process this invoice." |

### Priority Changes (Sub)

**P0 — launch blockers:**
1. Redesign invite email — dual CTA (account + token), full project context
2. Email mismatch — clear error + "contact your GC" messaging
3. Retainage disclosure on invoice form (before submit button)
4. Invoice rejection email + reason + resubmit flow
5. Decouple "Funded" (lender funded GC) from "Paid" (GC paid sub)

**P1 — serious friction:**
6. "Scheduled Value" → "Your Contract Amount"
7. SOV line statuses in plain English
8. First-login welcome banner
9. Total payment summary card
10. Token portal as primary CTA in invite email
11. Token expiry — clear error + re-request flow
12. Token portal — explain submit-only limitations
13. Freeform invoice — explain GC mapping step and payment timing
14. Lien waiver enforcement per project setting

---

## Cross-Cutting Issues

| Issue | Severity | Fix |
|---|---|---|
| **No notification system exists.** No one knows when to act. Draws stall. GCs abandon platform. This is the single highest-leverage fix. | P0 | Transactional email for every key event: draw submitted, draw status changed, sub invoice submitted, invoice approved/rejected, lender comment, draw funded. In-app: notification bell with unread count. Use Resend (already in stack). |
| **No global audit log / activity trail.** Every financial SaaS needs a tamper-evident log. Without this, DrawStack is not defensible in a dispute, and lenders won't trust it. | P0 | Audit log per project: actor, action, entity, timestamp. Surface as "Activity" tab on project detail. All status changes, uploads, approvals, comments → log. |
| **Mobile responsiveness unconfirmed.** GCs are on job sites. Subs are in the field. Lenders may review on tablets. | P0 | Audit all three portals at 375px and 414px (iOS Safari + Android Chrome). Fix layout breaks. Sub invoice form should be fully mobile-native. |
| **Retainage is architecturally present but experientially invisible.** retainagePct exists in DB but not surfaced to subs, not shown in draw summaries, not tracked cumulatively. | P0 | Retainage tracker: per project, show total retainage withheld across all draws. Show release conditions (typically at substantial completion). Surface contextually across all three portals. |
| **No draw revision / resubmission flow.** Lender rejects or requests info — then what? GC has no path to revise and resubmit. This is one of the most common real-world scenarios. | P1 | "Revise Draw" action on rejected/info-requested draws. Allow GC to update docs, adjust SOV amounts, add comments, resubmit. Version-track revisions so lender sees what changed. |
| **AI parsing failures have no graceful fallback.** Gemini invoice parsing will fail on unusual formats, handwritten docs, or poor-quality scans. No fallback path is described. | P1 | All AI-parsed fields must be editable. Show "AI suggestion" in amber with edit icon. If confidence is very low: "We couldn't read this document clearly — please enter the details manually." Never block the workflow on AI failure. |
| **No data export.** GCs need draw history for QuickBooks. Lenders need draw worksheets. Subs need payment records. | P1 | CSV/PDF export on: draw detail, invoice list per sub, project SOV with cumulative draws. |
| **No in-context help / tooltip system.** Construction finance has deep jargon (SOV, retainage, lien waiver, sworn statement). New users across all personas will hit terminology walls. | P1 | Lightweight `?` tooltip system for all domain terms. Create a glossary page. Add empty state guidance on every first-use tab. |
| **Design system inconsistency.** Dark lender portal + light everything else creates maintenance burden and fragmented product feel. | P2 | Shared design token layer (colors, spacing, typography) with portal-specific themes via CSS variables. Same components, different themes. |

---

## P0 Launch Blockers (Consolidated)

These 9 issues will cause trust failure, support escalation, or workflow abandonment before a real draw cycle completes.

| # | Blocker | Persona(s) | What Breaks |
|---|---|---|---|
| 1 | Email notification system — every key workflow event | All | No one knows when to act. Draws stall indefinitely. GCs abandon platform. |
| 2 | SOV template download + manual entry fallback | GC | SOV upload fails for most real users. No SOV = no draws possible. |
| 3 | AI SOV mapping confidence gate | GC + Lender | Incorrect mappings submitted to lender = immediate trust loss. |
| 4 | Retainage visible everywhere (sub form, draw review, sub project summary) | GC + Sub | Subs confused/angry about short payments. GC gets support burden. |
| 5 | Sub invite email redesign — dual CTA + full project context | Sub | First-impression failure. Sub ignores invite or can't get in. |
| 6 | Sub email mismatch — clear error + guidance | Sub | Sub logs in, sees nothing, assumes it's broken. Silent churn. |
| 7 | Invoice rejection email + reason + resubmit flow | Sub | Sub assumes payment is coming. GC waiting on revised invoice that never comes. |
| 8 | Decouple "Funded" from "Paid to sub" | Sub | Sub thinks they've been paid when they haven't. Financial misrepresentation. |
| 9 | Project card progress bar bug (0% funded showing full green bar) | GC | Data contradicts visualization. Immediate trust loss for any real user. |

---

## What's Working Well (Don't Break)

- Three-portal architecture — correct call, right separation of concerns
- AI invoice parsing with Gemini — genuinely differentiated
- Invoice progress bar on sub project page (Received → In Review → Approved → Paid) — right concept, needs copy fix
- SOV-mapped invoice submission with remaining budget validation — solid
- Draw status flow (7 steps) — correct domain modeling
- Token portal concept — right instinct for trade contractors
- Smart redirect on sub home (single project → straight to project) — nice touch
- LenderProjectList with search/filter — good foundation
- Dark theme for lender portal — right differentiation instinct, needs testing

---

*Audit compiled: March 29, 2026*  
*Sources: Code review (OnboardingFlow.tsx, /projects/new, /draws/new, /lender, /sub portals), live screenshots, Hermes analysis*
