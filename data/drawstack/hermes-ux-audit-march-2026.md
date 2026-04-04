# DrawStack — Hermes UX Audit
**Auditor:** Hermes (DrawStack Reliability & Quality Governor)  
**Date:** March 29, 2026  
**Mandate:** Independent pre-launch first-impression audit. Steve's words: "We get ONE shot at a first impression — even heavy changes are on the table."  
**Scope:** All three portals — GC (`/dashboard`), Lender (`/lender`), Sub (`/sub`) — end-to-end persona walkthroughs  
**Method:** Codebase context analysis, BLITZ-AUDIT confirmed feature inventory, workflow gap reasoning, financial data integrity analysis  

---

## Auditor's Note

This is my own analysis. I am not recycling prior findings. I walked each persona cold, from first contact through funded draw, asking: would a real GC trust this enough to invite their lender? Would a real lender approve a real draw in this UI? Would a real sub submit an invoice and not text the GC in confusion within the hour?

The answer today: **not reliably.** The architecture is sound. Several features are genuinely strong. But there are enough trust, communication, and data-integrity gaps to cause first-impression failure in a real pilot. I've catalogued them below in priority order, with concrete fixes.

---

## Confirmed Strengths (Do Not Break)

Before the issues: these are real product strengths that differentiate DrawStack. Every fix must preserve them.

- **AI invoice parsing (Gemini)** — genuine differentiator. Trade contractors are drowning in paper invoices. Any competitor offering AI parsing has a material advantage. Protect the confidence display approach.
- **G702/G703 PDF generation** — the industry standard AIA forms. Lenders expect these. Having them auto-generated is a significant credibility signal.
- **Draw submission confirmation with retainage breakdown** — confirmed built. Showing requested / retainage / net is exactly right for GC trust.
- **Activity log on draw detail** — confirmed built. Step-by-step timeline is the right pattern for an audit trail.
- **Reject with reason** — confirmed built on lender side. Good.
- **Sub token portal** — the right instinct. Many trade subs will not create a SaaS account. Frictionless invoice submission matters enormously.
- **Smart single-project redirect on sub home** — thoughtful touch that removes one unnecessary click.
- **SOV-mapped invoice with remaining budget validation** — enforces discipline, prevents overbilling.
- **Three-portal architecture with distinct themes** — correct separation of concerns. GC = working tool, Lender = institutional review, Sub = payment portal.

---

## Executive Summary

DrawStack has real product depth. But the **communication layer** — notifications, disclosure, status translation, onboarding guidance — is the difference between a product that runs itself and one that generates constant GC-to-lender-to-sub support calls.

**Core pattern in the gaps below:** The right data exists in the DB. The right logic runs in the API. But users aren't told what they need to know, when they need to know it, in language they understand.

**P0 count: 8.** All are fixable before first pilot. None require architectural changes.

**The single highest-leverage fix:** A transactional email layer (Resend is already in the stack) covering 6 key workflow events. Without it, draws stall silently and every portal degrades into "why hasn't anything happened yet?"

---

## GC Persona — Full Walkthrough

### Persona Description
General Contractor. Running 3-8 projects simultaneously. On-site half the day, office half. Has a bookkeeper or PM who may handle digital tasks. Has a relationship with their lender they need to protect. Skeptical of new software — has been burned by construction tech before.

**First contact:** Signs up via landing page or referral. Hits the onboarding wizard.

---

### GC Issues

---

**[GC-01] SOV Upload Has No Format Guidance**  
**Component:** `OnboardingFlow.tsx` Step 2 / SOV tab  
**Severity: P0**

The SOV upload accepts CSV/Excel/PDF but provides no sample format. A GC with a standard Excel SOV from their estimator will try to upload it, fail or get a confusing import, and have no idea how to fix it. Upload failure on the second screen of onboarding is fatal. The BLITZ-AUDIT does not confirm a template download exists.

**Fix:** Add "Download Template (.xlsx)" button adjacent to upload zone. Template should have exactly: `Line #`, `Description`, `Category`, `Contract Amount`. Second row: example data. Also add: "Enter manually" fallback link below upload zone.

---

**[GC-02] Draw Creation Route Is Context-Blind**  
**Component:** `/draws/new` Step 1  
**Severity: P1**

`/draws/new` starts by asking the GC to select a project — even when they navigated here from a specific project's Draws tab. The first step is pointless and disorienting if context already exists.

**Fix:** "Create Draw" button on Project Detail → Draws tab should pass `?projectId=xxx` to `/draws/new`. Step 1 should auto-select the project and skip to Step 2. The route should handle `projectId` query param at mount.

---

**[GC-03] AI SOV Mapping Has No Confidence Gate**  
**Component:** `/draws/new` Step 3  
**Severity: P0**

Confidence scores are shown on SOV line item mappings. But there is no confirmed gate that requires human confirmation before low-confidence items proceed to Step 4. A GC in a hurry clicks through. An invoice for "Framing Labor - Phase 2" gets mapped to "Foundation - Concrete" at 54% confidence. That draw goes to the lender with a material misclassification. The lender rejects the draw. The GC loses a week and trust in DrawStack.

**Fix:** Any mapping below 75% confidence must be highlighted in amber/red with an "Unconfirmed" badge. The "Continue to Review" button on Step 3 should be disabled until all low-confidence mappings have been either confirmed or manually re-mapped. Copy: "AI is uncertain about these mappings — please verify before submitting to your lender."

---

**[GC-04] Sub Invoice GC Approval Workflow Is Undefined**  
**Component:** Invoices tab  
**Severity: P1**

The Invoices tab shows sub invoices with subStatus (DRAFT/SUBMITTED/APPROVED/REJECTED/FUNDED). But the GC's ability to explicitly approve or reject a sub invoice before it's included in a draw is not confirmed. If approved sub invoices automatically flow into the next draw, GCs don't know this and may submit a draw containing sub invoices they haven't reviewed. If GC approval is required, there's no visible action button.

**Fix:** Add `Approve` / `Reject` action buttons on each sub invoice card (only visible to GC). Rejection requires a reason field. On approve: "This invoice will be available to include in your next draw." On rejection: sub receives email with reason. State machine: SUBMITTED → GC_APPROVED or GC_REJECTED (before becoming part of a draw).

---

**[GC-05] No Push Notification When Sub Submits Invoice**  
**Component:** Invoices tab / global notifications  
**Severity: P0**

GCs are on job sites. They are not refreshing a dashboard tab. When a sub submits an invoice, the GC needs to know. Without a push signal, the sub is waiting for approval, the GC is waiting to create a draw, and nothing moves. This is the most common reason draws stall.

**Fix:** Email to GC on sub invoice submission: "{{Sub Name}} submitted a ${{amount}} invoice on {{Project Name}}. Review it now." Plus in-app notification badge on Invoices tab. Use existing Resend integration.

---

**[GC-06] Draw Status Changes Are Silent**  
**Component:** Draw detail / global notifications  
**Severity: P1**

After submitting a draw, the GC hears nothing unless they actively log in and check. UNDER_REVIEW, INSPECTION_ASSIGNED, INSPECTION_COMPLETE, APPROVED, FUNDED — none of these trigger confirmed outbound emails to GC.

**Fix:** Email to GC at each status transition. Minimum: UNDER_REVIEW ("Your lender is reviewing Draw #N"), INSPECTION_ASSIGNED (inspector name + date if available), APPROVED ("Draw #N approved — funds incoming"), FUNDED ("Draw #N has been funded").

---

**[GC-07] Inspection Is Invisible to GC**  
**Component:** Draw detail  
**Severity: P1**

When a draw reaches INSPECTION_ASSIGNED, the GC needs to know who is coming, when, and what to have ready. The current status label tells the GC something is happening but provides no actionable context. Showing up to a jobsite for an unscheduled inspector is a real operational problem.

**Fix:** When status = INSPECTION_ASSIGNED, surface inspector name, contact info, scheduled date in draw detail. These fields should be enterable by the lender or a scheduler. If not yet scheduled: "Inspection being scheduled — your lender will contact you." Add field to lender portal for inspector assignment.

---

**[GC-08] Project Cards — Budget Progress Bar Color Logic**  
**Component:** Projects list / DashboardProjectList  
**Severity: P1**

BLITZ-AUDIT confirms budget progress bars with color coding (green <50%, yellow <80%, red ≥80%). This is budget utilization — how much of the total loan has been drawn. But from a GC's perspective, a project at 80% draw utilization isn't necessarily a "red" situation — it might mean the project is nearly complete and everything is on track. Red implies warning/danger, but on a well-run project, being at 80% drawn when 80% complete is healthy.

**Fix:** Reframe the color coding around schedule vs. actual: compare % drawn to % of expected completion milestones if available. Or simply add a label: "72% of loan drawn" without implied danger. Remove red unless there's a genuine anomaly (overdrawn line, rejected draw, stale draw). Alternatively: use neutral blue gradient with distinct "attention" indicators only for actual problems.

---

**[GC-09] Retainage Ledger Is Partial**  
**Component:** Project overview  
**Severity: P1**

BLITZ-AUDIT confirms `retainageHeld` stat card exists but calls the retainage ledger "partial — no total released / net retainage breakdown." For a GC managing cash flow, total retainage held to date (and when it's expected to release) is financially critical. A project with 15 draws at 10% retainage has a significant cash hold that needs to be visible.

**Fix:** Full retainage ledger on project overview: Total Retainage Held (across all funded draws), Total Released (if any), Net Held Today. Add: "Retainage typically releases at {{release_condition}} per your loan agreement." This field may need to be editable or set during project setup.

---

**[GC-10] Zip Code Missing From Project Form**  
**Component:** `/projects/new`  
**Severity: P1**

Address has street, city, state — no ZIP. Breaks inspection scheduling, geocoding, document addressing, and formal correspondence. Also breaks any integration with address validation or mapping.

**Fix:** Add `zip` field (required). Place after `state`. Consider Google Places Autocomplete to populate all address fields from one input.

---

**[GC-11] Onboarding Has No Resume State**  
**Component:** `OnboardingFlow.tsx`  
**Severity: P1**

If a GC closes mid-onboarding (Step 2, SOV upload), there is no confirmed persistence of their progress. On next login, they either restart from scratch or land on an empty dashboard with no guidance to finish what they started.

**Fix:** Persist onboarding state server-side per user session. On next login, if onboarding is incomplete, show prominent banner: "Finish setting up {{Project Name}} →" linking back to the incomplete step. Track completion state with a field on the project record.

---

**[GC-12] No Data Export**  
**Component:** Global  
**Severity: P1**

GCs use QuickBooks, Sage, or spreadsheets for accounting. The draw history, SOV budget vs. actual, and payment records need to be exportable. Without this, DrawStack is an island that creates double data-entry.

**Fix:** Add CSV export on: (1) Project SOV with draw totals per line, (2) Invoice list per project/period, (3) Draw summary with line items. Button placement: Project detail header, Draws tab, Invoices tab.

---

### GC Priority Summary

| # | Issue | Severity |
|---|-------|----------|
| GC-01 | SOV template download + manual entry fallback | P0 |
| GC-03 | AI confidence gate before draw submission | P0 |
| GC-05 | Push notification on sub invoice submission | P0 |
| GC-02 | Create draw from project context (skip Step 1) | P1 |
| GC-04 | Sub invoice GC approve/reject with reason | P1 |
| GC-06 | Draw status change email notifications | P1 |
| GC-07 | Inspection details surfaced on draw detail | P1 |
| GC-08 | Progress bar color logic — remove misleading red | P1 |
| GC-09 | Full retainage ledger (held / released / net) | P1 |
| GC-10 | ZIP code field on project form | P1 |
| GC-11 | Onboarding resume on re-login | P1 |
| GC-12 | CSV/PDF data export | P1 |

---

## Lender Persona — Full Walkthrough

### Persona Description
Commercial loan officer or construction lender. Manages 20-50 active construction loans. Uses a draw management checklist for every disbursement — required by their institution. Conservative. Values paper trails. Will reject software that doesn't support their compliance process. Has seen too many GCs misrepresent draw status.

**First contact:** Receives an email invite from a GC. The invite email is the lender's ENTIRE first impression of DrawStack.

---

### Lender Issues

---

**[LE-01] Lender Invite Email Is the Product's First Impression**  
**Component:** Lender invite email (Resend)  
**Severity: P0**

The invite email is confirmed to be sent on project creation when `lenderEmail` is provided. But the content of that email is unspecified in the blitz audit. A bad invite email — generic, missing project context, or that looks like spam — causes the lender to ignore it. There is no second chance.

A lender receives this cold. They don't know what DrawStack is. They see an email about a platform they've never used, from a GC they may or may not know well.

**Required content of the invite email:**
- GC company name (not just email address)
- Project name and address
- Loan amount (to confirm this is their loan)
- One-sentence explanation of DrawStack: "DrawStack is a digital draw management platform — it replaces PDF draw packages and email chains."
- Single CTA: "Review this project on DrawStack →" (one click, minimal friction)
- Trust signal: "Your approval is required before any funds can be released."

**Fix:** Redesign invite email with above content. Test with a real lender. This email must pass a "would I click this?" test from a skeptical bank officer.

---

**[LE-02] Project Context Missing From Lender Project View**  
**Component:** Lender project detail  
**Severity: P0**

Lenders need to see, at a glance, the full loan context for a project. Without the loan amount, GC company, project address, origination date, and maturity date visible in the portal, the lender can't reconcile DrawStack with their own loan file. They'll refuse to approve anything they can't cross-check.

**Fix:** Add a collapsible project info panel at top of lender project detail: GC Company Name, Project Address, Loan Amount, Loan Origination Date, Maturity Date, Retainage %, Lien Waiver Required (yes/no). These fields exist on the project record — surface them.

---

**[LE-03] No Draw Package Completeness Checklist**  
**Component:** Draw detail (lender view)  
**Severity: P0**

Every lender institution has a required document checklist for draw disbursement: inspection report, conditional lien waivers from subs, GC sworn statement, invoices/receipts, title date-down. BLITZ-AUDIT confirms document upload exists but hard-gating is "soft warning only, not a hard fail." For the lender portal, the question isn't whether the GC was warned — it's whether the lender can see a clear checklist confirming all required documents are present before they approve.

**Fix:** Add a "Draw Package Checklist" section to lender draw detail. Each line shows a required document type (configurable per project or per institution), a status (Present / Missing), and a link to the uploaded file if present. Lender sees immediately: "Conditional Lien Waivers — MISSING." This is a genuine time-saver that replaces a manual tracking spreadsheet lenders currently maintain.

---

**[LE-04] Partial Draw Approval Is Not Supported**  
**Component:** LenderActions  
**Severity: P0**

Real construction lending practice: lenders routinely approve 9 of 10 SOV line items and flag one for re-inspection or documentation. Approving a draw is never binary at the institutional level. An all-or-nothing Approve/Reject forces lenders to reject entire draws over one disputed line — stalling the GC's entire project over a minor issue.

This is arguably the most common workflow gap for any draw management software. Getting this wrong makes DrawStack unusable for institutional lenders.

**Fix:** Line-item level approve/flag in lender SOV table. Each row: checkbox "Approve" or dropdown "Flag (reason)." Final Approve button shows: "Approved: ${{net}} of ${{requested}} requested. Flagged: {{N}} items totaling ${{flagged_amount}}." Flagged items carry a required comment. The draw can still be funded at the approved amount while flagged items are tracked for the next draw.

---

**[LE-05] SOV Table Missing Industry-Standard Draw History Columns**  
**Component:** Draw detail SOV table (lender view)  
**Severity: P0**

The BLITZ-AUDIT confirms a G703 continuation sheet exists in the PDF export. But the on-screen SOV table in the lender draw detail must show the same columns lenders expect from an AIA G703: Contract Amount, Prior Draws (cumulative), This Draw Amount, Cumulative to Date, % Complete, Balance to Complete.

Without these columns, a lender has no way to spot double-billing or budget overruns by eye. They will default to ignoring the on-screen table and asking for the PDF — which defeats the purpose of a digital platform.

**Fix:** Replace or augment the SOV table columns in lender draw detail to match G703 format exactly: `Line # | Description | Scheduled Value | Prior Draws | This Draw | Stored Materials | Cumulative | % Complete | Balance to Finish`. Populate from the draw history on the project. This data exists — it just needs to be queried and displayed.

---

**[LE-06] "Request Info" Must Change Draw State**  
**Component:** LenderActions / comments  
**Severity: P1**

When a lender clicks "Request Info," the draw should transition to a distinct INFO_REQUESTED state that is visible to both parties. If the draw stays in UNDER_REVIEW while the lender is waiting for GC to respond, neither party has clarity on who needs to act. The GC may not even know the lender asked something.

**Fix:** "Request Info" → transitions draw to `INFO_REQUESTED`. GC receives immediate email: "Your lender has requested additional information on Draw #N: {{lender's message}}. Please respond or upload documents." Lender sees: "Awaiting GC Response" badge with timestamp of request. GC sees same badge and a "Respond" action button. Draw cannot be approved while in INFO_REQUESTED without a GC response.

---

**[LE-07] PDF Document Viewer Is a Modal — Inadequate for Real Review**  
**Component:** Draw detail documents section  
**Severity: P1**

Construction draw documents are complex multi-page PDFs. A modal viewer is too small and provides no annotation, page navigation, or zoom controls sufficient for reviewing a 40-page sworn statement or lien waiver package. Lenders routinely need to review documents side-by-side with the SOV table.

**Fix:** Replace modal with full-screen document viewer. Implement split-pane option: documents on left, SOV table on right. Add: per-document "Reviewed" checkmark (tracked per lender session), download button, page indicator. Use a library like `react-pdf` with proper controls.

---

**[LE-08] AI Insights Panel Is Unexplained and Potentially Liability-Creating**  
**Component:** Draw detail / AI insights panel  
**Severity: P1**

An AI insights panel on a financial approval screen, without clear explanation of what it's analyzing and how conclusions are derived, is a trust liability. A lender who doesn't understand why the AI flagged something may approve based on AI suggestion without proper analysis — creating potential compliance exposure. A lender who mistrusts AI may dismiss the entire platform.

**Fix:** Replace vague AI insights with a labeled factual summary panel: "Draw #3 Context — This draw represents 18% of the total loan (within typical range for draw #3). Cumulative funded to date: ${{amount}} ({{pct}}% of loan). Prior draws: {{N}}. Last approved: {{date}}." All figures are derived from confirmed data, not inferences. Remove any language that implies the AI is recommending an approval decision.

---

**[LE-09] No Portfolio Action Queue on Lender Home**  
**Component:** `/lender` home  
**Severity: P1**

The lender home shows stats (Total Projects, Draws Pending Review, etc.) and a project list. But a lender managing 10+ projects needs a triage queue — not a list of projects. "What needs my action today?" is the lender's first question every morning.

**Fix:** Add action queue above the project list: three cards — "Needs Your Review (N draws)," "Awaiting GC Response (N draws)," "Inspection Pending (N draws)." Each card is clickable and shows a filtered list. This replaces the need to click into each project to discover pending actions.

---

**[LE-10] Header Shows "User" Instead of Name**  
**Component:** Lender portal header  
**Severity: P1**

Generic "User" label in the header makes the portal feel unfinished. On a financial platform, even cosmetic completeness matters. Lenders will notice.

**Fix:** Show Clerk user's actual name (firstName + lastName) or organization name. Available via Clerk's `useUser()` hook. If not set, show email address as fallback.

---

**[LE-11] Lender Must Create a Full SaaS Account**  
**Component:** Auth / lender onboarding  
**Severity: P1**

Many bank loan officers operate on institutional devices with restrictive IT policies. Requiring full account creation (password, email verification) adds friction that may cause institutional lenders to escalate to their IT department or simply refuse. This is a real adoption blocker for bank lenders.

**Fix:** Implement Clerk magic link (passwordless email OTP). Lender clicks invite link, enters email, gets a 6-digit code, immediately inside the portal. No password creation. No account "setup." This is the fastest path for institutional users who may have one-off access.

---

**[LE-12] Dark Theme May Alienate Traditional Lenders**  
**Component:** Lender portal global theme  
**Severity: P2**

The dark theme is visually differentiated and positions DrawStack as modern. But bank lending officers are accustomed to Bloomberg terminals, Salesforce, and enterprise ERP systems that are predominantly light-themed with tight data density. Dark themes in fintech can read as "startup" or "consumer app" to institutional users.

**Fix:** Add light mode toggle to lender portal settings. Track which mode lenders actually use. Make the decision based on data, not aesthetics. If early lender feedback skews against dark, make light the default.

---

### Lender Priority Summary

| # | Issue | Severity |
|---|-------|----------|
| LE-01 | Redesign lender invite email with project context | P0 |
| LE-02 | Project info panel in lender project view | P0 |
| LE-03 | Draw package completeness checklist | P0 |
| LE-04 | Partial draw approval at line-item level | P0 |
| LE-05 | SOV table: G703-format columns (prior draws, cumulative) | P0 |
| LE-06 | "Request Info" → INFO_REQUESTED state + GC email | P1 |
| LE-07 | Full-screen PDF viewer (replace modal) | P1 |
| LE-08 | AI insights panel — replace with labeled factual summary | P1 |
| LE-09 | Portfolio action queue on lender home | P1 |
| LE-10 | User name in lender portal header | P1 |
| LE-11 | Magic link / OTP auth for lenders | P1 |
| LE-12 | Light mode toggle for lender portal | P2 |

---

## Sub Persona — Full Walkthrough

### Persona Description
Trade contractor. Electrician, plumber, framing crew, HVAC sub. On job sites all day. Not tech-savvy. Gets paid by invoice — has been burned by slow GC payments before. Suspicious of any step that delays payment. Uses their phone more than a desktop. Wants to submit an invoice and get paid. Full stop.

**First contact:** Receives an email invite from a GC they're currently working for.

---

### Sub Issues

---

**[SU-01] Sub Invite Email Must Clear Two Bars: Identity + Action**  
**Component:** Sub invite email (Resend)  
**Severity: P0**

The sub's first email must answer: (1) Do I know who's sending this? (2) What am I supposed to do? (3) Is this safe?

A generic "You've been invited to DrawStack" email fails all three. The sub doesn't know what DrawStack is. They might not recognize the GC's company name if it differs from the contact name they know. They're suspicious of any link that asks them to create an account.

**Required content:**
- GC company name AND primary contact name (the person they know)
- Project name and address (the job they're working)
- What DrawStack does in one sentence: "DrawStack is the platform {{GC Name}} uses to pay subs."
- Two equal CTAs: "Create Account →" and "Submit Without an Account →" (token link)
- No marketing fluff. No feature lists. One purpose: get them to submit their first invoice.

**Fix:** Redesign invite email. Test with an actual trade contractor who's never heard of DrawStack. If they can't figure out what to do in 10 seconds, the email fails.

---

**[SU-02] Email Mismatch Is a Silent Dead End**  
**Component:** `/sub` auth / email matching  
**Severity: P0**

When a sub creates a Clerk account, their email is matched to the `ProjectSubcontractor` record. If the GC entered the wrong email (common — GCs often have a cell phone number, not an email), the sub logs in and sees nothing. No error. No guidance. Just an empty portal.

The sub assumes the app is broken and texts the GC. The GC doesn't know what happened. A real pilot dies here.

**Fix:** On sub portal load, if authenticated email matches no ProjectSubcontractor record: show a specific, actionable error — "We don't have this email address on file for any project. Contact your GC to confirm the email address they invited." Include a "Sign out and try a different account" link. Never show a blank portal without explanation.

---

**[SU-03] Retainage Must Be Disclosed Before Invoice Submission**  
**Component:** `/sub/projects/[id]/invoices/new`  
**Severity: P0**

A sub submits a $12,000 invoice for framing. They expect $12,000. DrawStack sends the draw. The lender funds the draw. The GC sends the sub a check for $10,800. The sub is angry and confused. They call the GC. The GC has to explain retainage. This is a relationship problem DrawStack can prevent by disclosing retainage upfront.

**Fix:** Before the submit button, in a clearly styled info box: "Retainage notice: This project has 10% retainage. $1,200 of your $12,000 invoice will be held until project completion. Expected payment: $10,800." Calculate dynamically as sub enters amounts. If the sub changes amounts, the retainage disclosure updates in real time.

---

**[SU-04] Invoice Rejection Has No Communication Loop**  
**Component:** Sub invoice detail / notifications  
**Severity: P0**

If a GC rejects a sub's invoice (once GC approve/reject is implemented), the sub needs to know: (1) it was rejected, (2) why, (3) what to do next. Without an email and a visible "Resubmit" action on the invoice, the sub is waiting for a payment that will never come, and the GC is waiting for a revised invoice that will never arrive.

**Fix:** On GC rejection: immediate email to sub — "{{GC Name}} has returned your invoice for {{Project Name}}. Reason: {{rejection_reason}}. [Review and Resubmit →]." Invoice detail shows rejection reason prominently. "Resubmit" button pre-populates the form with prior line items for editing.

---

**[SU-05] "Funded" ≠ "Paid to Sub" — Financial Misrepresentation Risk**  
**Component:** Invoice progress bar / InvoiceProgressBar / status labels  
**Severity: P0**

When the lender funds a draw, sub invoice status moves toward "Funded" or "Paid" on the progress bar. But the lender funding the GC does NOT mean the sub has received money. The GC still has to cut a check or send an ACH. The time between lender funding and sub payment can be days or weeks, and sometimes subs don't get paid at all.

If a sub sees "Paid" on their invoice and doesn't receive money, they may: (1) not follow up because they think it's already been handled, (2) become confused and angry when they do follow up, (3) lose trust in DrawStack for showing false information.

**Fix:** Decouple these states completely. "Funded" means the lender funded the draw to the GC. The sub portal shows: "Lender has funded this draw — awaiting payment from your GC." The final "Paid" status requires an explicit GC action: "Mark as Paid" with payment date, method (check/ACH/wire), and optional reference number. This is also a valuable GC bookkeeping feature.

---

**[SU-06] Token Portal Is Buried and Unexplained**  
**Component:** Sub invite email / `/sub` login page  
**Severity: P1**

The token portal (unauthenticated invoice submission) is the right call for trade contractors who won't create accounts. But if the token link is buried at the bottom of the invite email or absent from the login page, most subs will miss it and attempt account creation — hitting friction and potentially email mismatch.

**Fix:** Token link should be a **primary CTA** in the invite email — equal visual weight with "Create Account." On the `/sub` sign-in page: "Received a link from your GC? Click here to submit without an account." The token portal should state its limitations upfront: "You can submit invoices here. To view payment history and track status, create a free account."

---

**[SU-07] Token Link Expiry Has No Graceful Failure**  
**Component:** Token portal / SubInvoiceToken  
**Severity: P1**

Token links expire. If a sub clicks a 2-week-old token link, they may hit a 404, an opaque error, or a blank page. The sub's only recourse is to text the GC. No one knows a new token is needed.

**Fix:** On expired token: show a clear error page — "This link has expired. Your GC can send you a new one — or [create a free account] to submit invoices anytime." Optionally: button to trigger a re-invite email to the GC's email address automatically. Never show a 404 or a technical error for this case.

---

**[SU-08] "Scheduled Value" Is Construction Jargon Unknown to Trade Subs**  
**Component:** Sub home / project page  
**Severity: P1**

"Scheduled Value" is AIA/lender terminology. A framing sub or electrician knows "my contract" or "what they owe me." Showing "Scheduled Value: $45,000" next to their project communicates nothing on first read.

**Fix:** Rename to "Your Contract Amount" throughout the sub portal. Keep "Scheduled Value" only in the G703 PDF context where it's the industry-standard term. If tooltip or glossary exists, add it there.

---

**[SU-09] SOV Line Statuses Are Unexplained Internal States**  
**Component:** Sub project page — SOV line items  
**Severity: P1**

"In Draw" means nothing to a sub. "Pending" could mean anything. "Funded" implies payment but (per SU-05) doesn't mean the sub has received money.

**Fix:** Plain-English status labels throughout the sub portal:
- `Pending` → "Not Yet Submitted"
- `In Draw` → "In Lender Review"
- `Approved` → "Approved — Awaiting Payment"
- `Funded` → "Awaiting Payment from Your GC" (until GC marks paid)
- After GC marks paid → "Paid ✓"

---

**[SU-10] Lien Waiver Not Enforced When Required**  
**Component:** Invoice form  
**Severity: P1**

The project has a `lienWaiverRequired` boolean. But PDF upload is optional on the invoice form. If lien waiver is required and the sub doesn't upload one, the invoice will either be rejected by the GC later or stall in the draw — causing confusion for all parties.

**Fix:** If `lienWaiverRequired = true` for the project, the invoice form should: (1) display a banner explaining the requirement, (2) make PDF upload mandatory with label "Signed Conditional Lien Waiver Required," (3) block submission without it. This is discoverable before submission, not after.

---

**[SU-11] No Financial Summary Card for Sub**  
**Component:** Sub project page  
**Severity: P1**

A sub has no single view of their financial standing on a project. They need to see: total contract, total invoiced, total received (paid), retainage held, and remaining contract balance. Without this, they're piecing together their financial position from individual invoice statuses.

**Fix:** Add a financial summary card at the top of the sub project page:

| | |
|---|---|
| Contract Amount | $45,000 |
| Total Invoiced | $32,000 (71%) |
| Total Paid | $28,800 |
| Retainage Held | $3,200 |
| Remaining Balance | $13,000 |

This summary should update in real time as invoices are processed.

---

**[SU-12] No First-Login Orientation for Sub**  
**Component:** Sub project page  
**Severity: P1**

A first-time sub user lands on a project page with SOV lines and invoice history but no context for what to do. GC-assigned SOV lines, billing period concepts, and draw cycles are not obvious to a trade contractor.

**Fix:** First-login banner (dismissed after first invoice submission): "Welcome to {{Project Name}}. Your GC has assigned you lines to bill against. Use the Submit Invoice button below to request payment for work completed. Questions? Contact {{GC contact name}} at {{GC contact info}}."

---

**[SU-13] Freeform Invoice Creates Invisible Rework Without Warning**  
**Component:** Invoice form / freeform mode  
**Severity: P1**

When a sub has no assigned SOV lines, they enter a freeform invoice. The GC must then manually map this invoice to SOV lines before it can be included in a draw. The sub doesn't know this extra step exists and will assume their invoice is in queue for payment. When there's a delay, they'll assume the GC is slow-paying.

**Fix:** Display a note prominently on freeform invoice submission: "Your invoice will be reviewed by your GC and mapped to the project budget before payment is processed. This typically takes 1-3 business days. Your GC will notify you when it's been approved."

---

### Sub Priority Summary

| # | Issue | Severity |
|---|-------|----------|
| SU-01 | Sub invite email: dual CTA + project context + GC contact name | P0 |
| SU-02 | Email mismatch — clear error + "contact your GC" + sign-out link | P0 |
| SU-03 | Retainage disclosure on invoice form, before submit | P0 |
| SU-04 | Invoice rejection email + reason + resubmit flow | P0 |
| SU-05 | Decouple "Funded" (lender → GC) from "Paid" (GC → sub) | P0 |
| SU-06 | Token portal as primary CTA in invite + on login page | P1 |
| SU-07 | Token expiry — clear error + re-request flow | P1 |
| SU-08 | "Scheduled Value" → "Your Contract Amount" | P1 |
| SU-09 | SOV line statuses in plain English | P1 |
| SU-10 | Lien waiver enforcement when lienWaiverRequired = true | P1 |
| SU-11 | Financial summary card (contract / invoiced / paid / retainage) | P1 |
| SU-12 | First-login welcome banner with GC contact info | P1 |
| SU-13 | Freeform invoice — disclose GC mapping step + timeline | P1 |

---

## Cross-Cutting Issues

These cut across all three portals and cannot be fixed portal-by-portal — they require system-level decisions.

---

**[CC-01] No Transactional Email System Beyond Invite Emails**  
**Severity: P0**

Resend is in the stack. Lender invite emails are confirmed to send. But there is no confirmed email at any of the following critical events:
- Sub submits invoice → GC
- GC approves/rejects sub invoice → Sub
- Draw submitted by GC → Lender
- Draw status changes (UNDER_REVIEW, INSPECTION_ASSIGNED, APPROVED, FUNDED) → GC
- Lender comments or requests info → GC
- Draw funded → GC + Sub (appropriate message per persona)

Without these emails, the entire workflow depends on everyone actively polling three different portals. That is not how busy professionals work. Draws will stall. Payments will be missed. Users will blame DrawStack.

**Fix:** Implement a transactional email event queue. Every status change on a draw, project, or invoice writes an event. An email worker processes the queue, sending persona-appropriate emails using Resend. Template per event type. This is the single highest-leverage engineering task remaining.

---

**[CC-02] Mobile Responsiveness Is Confirmed Partial**  
**Severity: P0**

BLITZ-AUDIT explicitly flags mobile responsiveness as partial: "DrawDetail header and summary grid use sm: breakpoints; breadcrumb and full page pass is partial (not all pages audited for 375px)."

GCs are on job sites. Subs are on job sites. Neither user will tolerate a desktop-only interface. If the sub invoice form doesn't work correctly on an iPhone, sub adoption fails immediately.

**Fix:** Full mobile audit at 375px (iPhone SE / standard) and 428px (iPhone Pro Max). Priority pages:
1. Sub invoice form (`/sub/projects/[id]/invoices/new`) — must be fully usable mobile-first
2. Sub project page — financial summary must be readable on small screen
3. Draw wizard Step 3 (SOV mapping) — tables need horizontal scroll or card layout on mobile
4. Project detail tabs (Overview, SOV, Draws) — tab overflow must be scrollable
5. Lender draw detail SOV table — must have horizontal scroll with frozen Line # column

---

**[CC-03] In-App Notification System Missing**  
**Severity: P1**

Toast notifications are confirmed built for in-session actions (save, submit, approve). But there is no persistent notification inbox — a bell icon with unread count showing what's happened across the platform while the user was away.

**Fix:** Notification bell in all three portal headers. Unread count badge. Notification types: invoice submitted, draw status changed, lender commented, draw approved/rejected/funded. Click → notification list, each item linkable to the relevant entity. Mark all read. Notifications persist for 30 days.

---

**[CC-04] No Draw Revision / Resubmission Workflow**  
**Severity: P1**

Lender rejects a draw or requests info. The GC needs to update the draw and resubmit. This is one of the most common real-world scenarios — a draw rarely gets approved on the first submission without questions. There is no confirmed "Revise Draw" workflow.

**Fix:** On draws in REJECTED or INFO_REQUESTED state, GC sees "Revise Draw" action. Opens draw back to Step 3/4 of the wizard with current data pre-populated. GC can add documents, adjust amounts, add a response note, and resubmit. Lender sees "Revised Draw" badge and a diff of what changed from the previous submission.

---

**[CC-05] Retainage Is Architecturally Sound But Experientially Invisible**  
**Severity: P1**

`retainagePct` exists on projects. `retainageHeld` is shown in project overview stats. But retainage is not communicated:
- To subs before they submit (SU-03)
- As a cumulative project-level ledger (GC-09)
- In draw summaries for lender context
- In sub financial summary card (SU-11)

Retainage is typically 5-10% of every draw, held until project completion. On a $2M project with 10 draws, that's $20,000-$40,000 in held funds per party. It's not a footnote — it's a material number.

**Fix:** Retainage tracker visible across all portals in persona-appropriate framing:
- GC: "Total retainage held: $38,400 (will release at substantial completion)"
- Lender: Retainage line in draw package summary
- Sub: "Retainage held on this project: $3,200" in their financial summary card

---

**[CC-06] AI Invoice Parsing Has No Graceful Degradation**  
**Severity: P1**

Gemini AI parses invoice PDFs. It will fail on: handwritten invoices, low-resolution scans, unusual formats, non-English text, hand-annotated PDFs. There is no confirmed fallback flow for AI parsing failure.

**Fix:** All AI-parsed fields must be editable after parsing. If Gemini returns low confidence or an error: show parsed fields in amber with "AI couldn't read this clearly — please verify." Never block the draw creation workflow on AI failure. The GC should always be able to proceed with manual entry. Show the original uploaded PDF side-by-side with the parsed form for verification.

---

**[CC-07] No Glossary or In-Context Help System**  
**Severity: P1**

Construction finance terminology — SOV, retainage, lien waiver, sworn statement, G702/G703, draw period, stored materials — is not obvious to everyone. A new GC who just got their first construction loan, or a trade sub who's never used a digital billing portal, will hit jargon walls.

**Fix:** `?` tooltip on every domain term used in the UI. Tooltip content: one-sentence plain-English definition. Add a /help page with a full glossary. For subs: completely avoid jargon wherever possible. For lenders: use industry-standard terminology (they know it). For GCs: explain on first use, don't repeat.

---

**[CC-08] Pagination Missing on Project List**  
**Severity: P1**

BLITZ-AUDIT explicitly confirms: "No pagination implemented; DashboardProjectList shows all projects (search filter exists but no pagination)." At 20+ projects, this becomes a performance issue and a usability issue.

**Fix:** 20 projects per page with load-more or numbered pagination. Search filter remains real-time. For lenders with large portfolios, this is a day-one requirement.

---

## Consolidated P0 Launch Blockers

These 8 issues will cause first-impression failure, trust loss, or workflow abandonment before a single real draw cycle completes. Fix all before any pilot.

| # | Blocker | Persona(s) | Business Risk |
|---|---------|------------|---------------|
| 1 | **Transactional email layer (CC-01)** — all key workflow events | All | Draws stall silently. No one knows when to act. GCs abandon. |
| 2 | **SOV upload template + manual fallback (GC-01)** | GC | SOV upload fails for most real users. No SOV = no draws. |
| 3 | **AI confidence gate before draw submission (GC-03)** | GC + Lender | Misclassified invoices submitted to lender = immediate trust loss. |
| 4 | **Mobile responsive audit and fix (CC-02)** | GC + Sub | Subs can't submit invoices from job site. Sub adoption fails. |
| 5 | **Sub invite email redesign — dual CTA + GC contact (SU-01)** | Sub | First impression failure. Sub ignores invite or can't get in. |
| 6 | **Sub email mismatch — clear error + guidance (SU-02)** | Sub | Silent churn. Sub logs in, sees nothing, assumes it's broken. |
| 7 | **Retainage disclosure on sub invoice form (SU-03)** | Sub | Sub expects full payment, receives 90%. Angry sub, GC support burden. |
| 8 | **Decouple "Funded" from "Paid to Sub" (SU-05)** | Sub + GC | Sub believes they've been paid when they haven't. Financial misrepresentation. |

Note: **LE-01 through LE-05** (lender P0s) are also launch blockers for any pilot that involves an institutional lender. If the first pilot involves a friendly/forgiving lender for testing purposes, these can be P1-equivalent timing — but they must be resolved before going to a real bank.

---

## Implementation Sequence Recommendation

**Week 1 — Before any live user:**
1. Transactional email layer (CC-01) — Resend is already in stack, this is a template + event queue problem
2. Sub invite email redesign (SU-01)
3. Sub email mismatch handling (SU-02)
4. Retainage disclosure on sub invoice form (SU-03)
5. "Funded" vs "Paid" decoupling (SU-05)
6. SOV template download + manual entry (GC-01)
7. AI confidence gate (GC-03)

**Week 2 — Before first real lender:**
8. Lender invite email redesign (LE-01)
9. Project info panel in lender view (LE-02)
10. G703-format SOV columns in lender draw detail (LE-05)
11. Draw package checklist for lender (LE-03)
12. Partial draw approval at line-item level (LE-04)
13. INFO_REQUESTED state (LE-06)

**Week 3 — Before scaling to multiple projects:**
14. Full mobile responsive pass (CC-02)
15. Draw revision / resubmission workflow (CC-04)
16. In-app notification bell (CC-03)
17. Sub financial summary card (SU-11)
18. Sub SOV plain-English statuses (SU-09)
19. Retainage ledger (GC-09)
20. Data export (GC-12)

---

## Final Assessment

DrawStack is closer to launch-ready than most products at this stage. The data model is right. The three-portal separation is right. The AI invoice parsing is right. The G702/G703 generation is a real competitive advantage.

What's missing is the **communication layer** — the emails, the status translations, the financial disclosures, the plain-English labels. This layer is the difference between a product that users trust and one they abandon.

The good news: none of these gaps require architectural changes. They're all presentation and communication problems. The data exists. The logic is sound. The product just needs to talk to its users.

**Confidence at current state:** Would not pass a real pilot with an institutional lender. Would fail with most real subs on first invoice submission. Would cause GC frustration within the first week.

**Confidence post-fixes:** With the 8 P0s and the Week 1 email layer shipped, this is a credible product for a controlled pilot with a cooperative GC, a patient lender, and a handful of subs. Week 2-3 fixes bring it to general availability readiness.

---

*Hermes — March 29, 2026*  
*This audit was performed independently from scratch. All findings are based on codebase context analysis, confirmed feature inventory (BLITZ-AUDIT), and first-principles UX reasoning for each persona.*
