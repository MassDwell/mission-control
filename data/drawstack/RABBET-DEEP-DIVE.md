# Rabbet Deep Dive Analysis
*Research completed: March 14, 2026*

---

## What Rabbet Is

Rabbet is a **construction finance platform** primarily serving two audiences:
1. **Real estate developers/owners** — budget tracking, draw packaging, document management
2. **Construction lenders** — portfolio oversight, covenant tracking, draw review

They claim $100B+ in real estate capital managed on their platform. They've clearly found product-market fit at the **mid-market and institutional developer** level.

Their tagline: *"Connect the pieces for flawless project execution."*

---

## Core Feature Set

### Budget Management
- Multi-level budget hierarchy: **division → line item → summary line item** (3 levels)
- Upload or email documents directly to populate budgets
- Budget adjustment tracking with audit log (who changed what, when, why)
- Actuals vs. anticipated costs in real time
- Move funds between line items with notes
- **Gap:** No AI-powered budget setup from scratch. No CSI template pre-population. Manual entry required at project creation.

### Draw Packaging
- **This is their flagship feature** — most polished part of the product
- Drag-and-drop draw package assembly
- Auto-split PDFs by document type
- Auto-populate financial data from budgets/commitments
- Pre-submission checklist (flags missing docs before you submit)
- Auto-generates draw summary + table of contents
- **Gap:** Focused on *packaging* documents you already have — does NOT generate AIA G702/G703 forms natively. They organize and assemble; they don't generate.

### Document Management
- Centralized file storage with version history
- Email-to-project document import
- Automated approval workflows with threaded comments
- Chain of custody tracking for compliance/audit
- **Gap:** No mobile app worth mentioning. Limited for field use.

### Invoice Management
- Intelligent invoice reading (OCR-based duplicate detection)
- Links invoices to budget line items
- **Gap:** NOT AI-powered categorization — it's basic OCR for duplicate detection, not smart auto-categorization to the right line item. This is a significant gap.

### Portfolio Dashboard
- Cross-project visibility: draw pacing, funding status, cash requirements
- Drill-down to line-item detail from portfolio view
- Export board-ready reports
- **Gap:** Built for teams managing 5+ projects. Overkill for a single-project developer. Cluttered for a solo operator.

### Integrations
- QuickBooks, Yardi, MRI, Bill.com, NexusPayables, AvidXChange
- Strong accounting sync
- **Gap:** No lender portal integration. No direct bank draw sheet generation — you package and email. No AI cost prediction. No lien waiver generation.

---

## What Rabbet Does NOT Do

These are the explicit gaps — confirmed from their own feature pages and competitor comparisons:

| Missing Feature | Impact |
|-----------------|--------|
| AIA G702/G703 generation | Must use external forms or manually fill |
| Bank draw sheet templates | No lender-format output customization |
| AI invoice categorization | OCR only — no smart line-item routing |
| Mobile-first invoice upload | Field subs can't easily submit from phone |
| Cost prediction / historical benchmarking | Every project starts from zero |
| Lien waiver generation/tracking | Manual process outside the platform |
| CSI budget templates | Build from scratch every time |
| Capital waterfall enforcement | Basic tagging only, no sequencing logic |
| Vendor bidding / comparison | Not in scope |
| Sub-contractor portal | Subs can't self-submit invoices directly |

---

## Pricing — The Critical Gap

**Pricing model:** Usage-based, per active project
- They advertise "prices published clearly on website" but... they're not publicly listed
- Market research indicates: **$375–$840/project/month** range
- **Minimum annual commitment: ~$15,000**
- This is a hard floor. A developer with 1-2 active projects at a time cannot justify $15K/year.

**The math on exclusion:**
- Developer with 2 projects/year at $500K construction cost each: Rabbet is $750+/month = $9K+/year minimum
- For Steve's 14-unit deal: one project at $375–$840/month, but still requiring the $15K annual commitment
- **Small developers are effectively locked out**

---

## Target Market (Who They Actually Serve)

- **Ideal Rabbet customer:** Development firm with 5+ active projects, a development associate managing draws, and a finance team doing accounting sync
- **Institutional/mid-market:** They list major real estate firms as customers
- **Lenders:** Banks and credit unions managing construction loan portfolios
- **NOT their customer:** Solo developer, owner-builder, small GC doing 1-3 projects/year

From a competitor analysis (Built Technologies' blog, Jan 2026):
> *"Rabbet is less suited for owner–developers managing high draw volumes across multiple projects, or those requiring capital stack enforcement, scalable pricing, or intuitive adoption by non-finance users."*

---

## UX / Usability Assessment

**Strengths:**
- Clean, modern interface — Rabbet invests in design
- Intuitive drag-and-drop draw packaging
- 7-minute average customer support response time (they claim)
- "Easy" learning curve (their own assessment vs. Northspyre)
- SOC-2 Type II certified

**Weaknesses:**
- Designed for a development associate at a firm — not a principal doing it themselves
- Feature set assumes you have a team (PM, finance, accounting)
- Portfolio-level dashboard is overkill for 1-2 projects
- Onboarding requires their team to set it up (not self-serve)
- No self-serve signup — "contact sales" to start. This alone kills SMB adoption.

---

## Northspyre vs. Rabbet (The Other Main Player)

Worth understanding both since they're the two dominant purpose-built draw tools:

| | Rabbet | Northspyre |
|--|--------|------------|
| Focus | Draw packaging + compliance | End-to-end development management |
| AI | Limited (OCR only) | Extensive |
| Vendor management | No | Yes |
| Predictive forecasting | No (reactive) | Yes (predictive) |
| Pricing transparency | Vague | Also vague |
| Target | Finance-focused draw admin | Full development lifecycle |
| Learning curve | Easier | Steeper |
| Mobile | Limited | Limited |

Northspyre is going after the "end-to-end platform" angle and positions Rabbet as a reactive draw tool. Both are enterprise-priced, contact-sales products.

---

## Strategic Takeaways for DrawStack

### 1. The Undeniable Gap: AIA Form Generation
Neither Rabbet nor Northspyre generate AIA G702/G703 forms. They package documents and organize draws, but the developer still has to fill out the AIA forms separately. **This is a genuine unmet need** — especially for an owner-developer GC'ing their own project for the first time (exactly Steve's situation).

### 2. The Pricing Chasm is Real
$15K/year minimum is not a rounding error. It's a deliberate enterprise positioning decision. No one in the Rabbet sales motion is calling on a solo developer with one active project. **That entire market segment is unserved by purpose-built software.** They're still on Excel.

### 3. AI Invoice Categorization is Greenfield
Rabbet does basic OCR for duplicate detection. No one in this space has built true AI-powered invoice → line item routing. This is a genuine technical differentiator that would directly solve the "subs submit invoices to wrong bucket" problem.

### 4. Self-Serve is the Distribution Moat
Rabbet is contact-sales only. No trial, no freemium, no self-signup. For a small developer who needs to try something before committing, this is a dealbreaker. **DrawStack being fully self-serve is itself a competitive advantage.**

### 5. Historical Cost Intelligence is the Long Game
Neither Rabbet nor Northspyre offer "based on your past 5 projects, rough framing typically runs X% over budget" type intelligence. This is the Phase 2 moat that makes the product stickier the longer you use it.

### 6. Sub-Contractor Upload Portal
Subs and GCs don't have access to submit invoices directly in Rabbet without going through the developer. A simple mobile-friendly sub portal where subs can snap a photo of an invoice and it routes to the right project and line item — **this doesn't exist anywhere in this market at an accessible price point.**

---

## Competitive Positioning Summary

| | DrawStack | Rabbet | Northspyre | Procore |
|--|-----------|--------|------------|---------|
| Price | $149-349/project/mo | $375-840/project/mo + $15K min | Contact sales | $699+/mo |
| Self-serve | ✅ | ❌ | ❌ | ❌ |
| AIA G702/G703 generation | ✅ | ❌ | ❌ | ❌ |
| AI invoice categorization | ✅ | ❌ (OCR only) | Limited | ❌ |
| Historical cost prediction | ✅ (Phase 2) | ❌ | Partial | ❌ |
| Sub invoice upload portal | ✅ | ❌ | ❌ | ❌ |
| Bank draw sheet templates | ✅ | ❌ | ❌ | ❌ |
| Target | Solo dev, small GC | Mid-market dev firms | Institutional dev | Large GCs |
| Trial/freemium | ✅ | ❌ | ❌ | ❌ |

---

## Bottom Line

Rabbet is the best purpose-built draw tool on the market — for developers who can afford it and have a team to use it. For everyone below that waterline, the choice today is Excel or nothing.

DrawStack's wedge is clean:
1. **Same core workflow as Rabbet** (budget → invoices → draws → AIA/bank output)
2. **Priced for 1-project developers** (no minimums, self-serve)
3. **AI features Rabbet doesn't have** (invoice categorization, eventual cost prediction)
4. **Outputs Rabbet doesn't generate** (AIA G702/G703, bank draw sheets)

The positioning practically writes itself: *"Rabbet for the rest of us."*

