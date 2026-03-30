# DrawStack — Project Plan
**Construction Draw Management & Budget Tracking SaaS**  
*Prepared: March 2026 | Status: Pre-Build Planning*

**Domains:** drawstack.ai (primary) · drawstack.io (redirect) · drawstack.com (not owned — revisit at $10K MRR)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Market Opportunity (TAM/SAM/SOM)](#3-market-opportunity-tamsamsom)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Product Specification](#5-product-specification)
6. [Technical Architecture](#6-technical-architecture)
7. [Pricing Strategy](#7-pricing-strategy)
8. [Go-to-Market Plan](#8-go-to-market-plan)
9. [Build Timeline](#9-build-timeline)
10. [Success Metrics](#10-success-metrics)
11. [Open Questions / Risks](#11-open-questions--risks)

---

## 1. Executive Summary

**DrawStack** is a purpose-built SaaS for small-to-mid-size real estate developers and owner-builders that transforms the construction draw process from a manual, error-prone nightmare into a structured, automated workflow.

The core insight: every small developer is running their $2M–$20M construction project on a combination of Excel spreadsheets and manually-filled AIA G702/G703 forms. The enterprise tools (Procore, Sage 300) cost $15K–$60K/year and are wildly overkill. The mid-market tools (Buildertrend, CoConstruct) are built for homebuilders/GCs managing field operations — not for developers submitting draw packages to construction lenders.

**Rabbet** is the closest analog — and they've validated the market by charging $375–$840/project/month with a $15,000 annual minimum. That minimum instantly prices out the segment we're targeting: developers with 1–3 active projects who can't justify $15K/year.

DrawStack enters below Rabbet with project-based pricing ($149–$349/project/month), no annual minimum, and two AI-native features Rabbet lacks: **AI invoice parsing** (auto-categorize invoices to budget line items) and **AI cost predictor** for new deal underwriting.

**MVP scope**: Budget setup (CSI-based hierarchy), invoice upload + AI categorization, draw request builder with AIA G702/G703 generation, variance dashboard, multi-user access.

**Target path to revenue**: 50 paying projects at $199/mo = ~$10K MRR at 90 days.

---

## 2. Problem Statement

### The Developer's Reality

Small real estate developers (1–20 units, $1M–$20M project cost) who take construction loans face three compounding problems:

**Problem 1: Budget Blowouts**
Budgets are set up in Excel at deal close. The structure is too coarse — "Framing: $80,000" instead of "Framing → Lumber: $52K / Labor: $28K." When lumber prices spike 15%, they have no granular baseline to compare against. They can't tell if they're over on materials or labor. By the time they notice, they're 30% over budget.

**Problem 2: Draw Friction**
Every 30–45 days, the developer must submit a draw package to their construction lender. This requires:
- AIA G702 (summary application for payment) — filled manually in Word/Excel
- AIA G703 (continuation sheet — line-by-line schedule of values) — filled manually
- Bank draw sheet (each lender has their own format) — also manual
- Supporting invoices, lien waivers, inspection certificates
- Budget-to-actual comparison

This takes 4–8 hours per draw across a typical 12-month project. For 8 draws, that's 32–64 hours of pure administrative work per project — at developer rates of $150–$300/hr.

**Problem 3: No Institutional Memory**
When a developer finishes a project, the cost data lives in disconnected spreadsheets. The next time they underwrite a deal, they're estimating costs from memory or calling a GC for a ballpark. There's no database of "what did framing actually cost on our last 4 projects?" The result: systematically optimistic underwriting, leading to more budget blowouts.

### Who Feels This Pain Most
- Solo developers with 1–4 active projects who are their own project manager
- Owner-builders (people acting as their own GC)
- Small development shops (2–5 person teams, 5–20 projects/year)
- Real estate investors doing ground-up or heavy rehab who take construction loans

They are NOT well-served by:
- Procore (enterprise pricing, built for GCs, overkill features)
- Buildertrend/CoConstruct (built for homebuilders, field-operations focused)
- Rabbet (developer-focused but $15K minimum — too expensive for small operators)
- Excel (flexible but zero automation, no collaboration, error-prone)

---

## 3. Market Opportunity (TAM/SAM/SOM)

### Market Context (Data Points)

- **1.01 million single-family housing starts** in 2024 (NAHB, Eye on Housing, Jan 2025)
- **$484.2 billion** in total AD&C (acquisition, development & construction) loans outstanding from FDIC-insured institutions as of Q4 2024 (Eye on Housing, March 2025)
- **$89.5 billion** in 1-4 family residential construction loans outstanding at end of 2024
- **919,000+ construction establishments** in the US (AGC, Q1 2023)
- **56.9%** of 1-4 family residential construction loans held by banks with under $10B in assets — confirming the small/community bank lender relationship with small developers
- Global construction management software market: **$6.3B in 2023**, growing at 9.1% CAGR (GMI)
- US construction management software market: **$1.25B in 2024**, projected $2.07B by 2032 (Data Bridge)

### TAM — Total Addressable Market

**Definition**: All US developers and owner-builders who take construction loans and manage draw processes.

Rough estimate:
- ~500,000 residential construction loans originated per year (inferred from $89.5B outstanding, average loan ~$500K–800K, typical 12-18 month duration)
- Approximately 100,000–200,000 unique borrowers/developers active at any time
- At $199/project/month × 12 months = ~$2,400/project/year
- **TAM ≈ $240M–$480M/year** (residential construction draw management software)

Expand to include commercial/mixed-use small developers:
- **TAM ≈ $500M–$1B/year** across all small developer segments

### SAM — Serviceable Addressable Market

Developers who are:
1. Tech-savvy enough to use cloud software
2. Running 1–20 unit projects (not mega-developers)
3. GC'ing themselves OR closely managing a GC
4. Have internet access and a construction lender

Estimate: 20–30% of the market (~40,000–60,000 active users)

At $199–$299/project/month, 2 active projects average = $400–$600/month/customer

**SAM ≈ $192M–$432M/year**

### SOM — Serviceable Obtainable Market (3-Year Horizon)

Realistic capture in 3 years with focused GTM:
- Year 1: 200 paying customers × $350 ARPU/mo = $840K ARR
- Year 2: 800 customers × $375 ARPU/mo = $3.6M ARR
- Year 3: 2,000 customers × $400 ARPU/mo = $9.6M ARR

**SOM Year 3 ≈ $10M ARR** (less than 0.5% of SAM — very achievable with right execution)

---

## 4. Competitive Landscape

### Comparison Table

| Tool | Target User | Pricing | Draw Mgmt | AI Features | Weakness for Our Target |
|------|-------------|---------|-----------|-------------|------------------------|
| **Procore** | Enterprise GC/Owner | $10K–$60K+/yr (ACV-based) | Yes (module) | Limited | Way overkill; pricing kills small operators |
| **Buildertrend** | Residential builder/GC | $299–$1,099/mo (custom quote) | Basic (invoicing) | None | Built for field ops, not financial draw packages; no AIA generation |
| **CoConstruct** | Custom home builder | $99–$699/mo | Basic | None | Merged into Buildertrend (2022); residential GC focus, not developer draw |
| **Sage 300 CRE** | Mid/large contractor | $6,600+/yr (perpetual license) | Yes (accounting) | None | Legacy on-prem, complex, 90s UX; overkill; median 3yr TCO $23K |
| **Acumatica Construction** | Mid-market GC | $30K–$50K+/yr | Yes (ERP) | None | Full ERP, requires implementation; not for small developers |
| **Knowify** | Trade contractor | $99–$299/mo | AIA billing | None | Trade contractor focus (HVAC, plumbing, etc.), not developer draw to lender |
| **Jonas Construction** | Mid/large GC | Custom, $10K+/yr | Yes | None | Legacy, complex, GC-focused |
| **Rabbet** | Developer/Lender | $375–$840/project/mo ($15K min/yr) | **Yes — core product** | AI Doc Router | **$15K annual minimum kills small operators** |
| **Built Technologies** | Lender-side | Enterprise/custom | Yes (lender focus) | AI draw agent | Lender tool, not developer tool |
| **Adaptive.build** | Construction accounting | Custom (contact sales) | No | AI bookkeeping | Accounting automation, not draw management; targets accounting firms |
| **DrawStack** | Small developer/owner-builder | $149–$349/project/mo, no min | **Yes — core product** | AI invoice parsing + cost predictor | *This is us* |

### Narrative Analysis

**Procore**: The 800-lb gorilla. $10K minimum for small operators, up to $60K+/year for companies with meaningful ACV. Quoted as "pretty much the only competent option but unrealistic for smaller-mid sized GCs." Field-operations focused. Draw management is a module, not the core. They won't come down-market — it destroys their average contract value.

**Buildertrend**: Moved to custom quoting (opaque pricing). Previously $299–$1,099/mo. Built for residential homebuilders managing subs, schedules, and client portals. Not designed for developers submitting draw packages to construction lenders. AIA form generation is absent. Their "financial management" is invoice/billing for the GC, not draw-to-lender workflows.

**CoConstruct**: Acquired by Buildertrend in 2022. Legacy platform in maintenance mode. Same fundamental weakness: custom homebuilder tool, not a developer draw tool.

**Sage 300 CRE**: The legacy enterprise choice. Job costing and accounting are strong, but it's a perpetual-license on-prem system. Median 3-year TCO of $23K, complex implementation, outdated UX. Zero appeal to a small developer who wants to get going in a day.

**Rabbet**: **This is the clearest market signal.** Rabbet is purpose-built for real estate developers managing draws. Their pricing: $375/mo (Lite), $595/mo (Standard), $840/mo (Premium) — all per active project, all requiring a $15,000 annual minimum contract. That minimum is the door we walk through. A developer with 1–2 active projects can't justify $15K/year. They get a demo, love the product, and then balk at the contract size. We capture that customer at $199–$349/month with no annual minimum.

Rabbet's strengths: capital stack intelligence, lender-side integrations (Yardi, AvidXchange), draw packaging. Their gap: no AI invoice parsing (they have an "AI Document Router" but it's routing, not categorization), and no cost prediction/underwriting tools.

**Built Technologies**: Lender-facing platform. Developers interact with it *because their lender uses it*, not because they chose it. Different buying motion. They just launched an AI "Draw Agent" for CRE lenders (CNBC, Nov 2025) — validation that AI in draw management is real.

**AI-Native Entrants**: The space is getting funded. SubBase (AI for sub/invoice management), Adaptive.build (AI construction bookkeeping). None are focused on the developer-side draw-to-lender workflow with AIA generation specifically.

**White Space Summary**: No product combines (a) developer-side draw-to-lender workflow, (b) AI invoice parsing and auto-categorization, (c) AIA G702/G703 generation, (d) accessible pricing for 1–5 project operators. That's DrawStack.

---

## 5. Product Specification

### MVP — Minimum Viable Product (4-Week Build)

#### Feature Set

**1. Project & Budget Setup**
- Create project with basic metadata (address, lender, loan amount, loan close date, expected completion)
- Budget setup using CSI division hierarchy:
  - Division (e.g., "03 — Concrete")
  - Category (e.g., "Flatwork")
  - Sub-item (e.g., "Garage slab pour")
- Pre-loaded CSI Division templates (user can customize)
- Budget amounts at sub-item level
- Budget import from CSV/Excel/PDF (critical for adoption — developers already have budgets)
- **AI Budget Import & Analyzer** — see dedicated feature spec below
- "Budget locked" state after project start (changes require formal change orders)

**1b. AI Budget Import & Analyzer** *(Core MVP Feature)*

This is the primary onboarding hook — nobody wants to manually re-enter a budget they already built in Excel.

**Upload Flow:**
- Accept Excel (.xlsx), CSV, or PDF (contractor bid sheets, architect cost estimates, lender budget schedules)
- AI parses the file regardless of column naming or format — no standardized template required
- AI maps each line item to the correct CSI division/category structure automatically
- Presents a preview screen: "Here's what we found — confirm, remap, or add line items before importing"
- One-click confirm imports the full budget hierarchy

**AI Analysis Layer (runs immediately after import):**

*Missing Line Item Detection* — AI compares the imported budget against a baseline CSI template for the detected project type (new construction, gut rehab, addition, ADU, etc.) and flags gaps:
> "⚠️ No line item found for Permits & Fees — typical range for a project this size in Massachusetts: $8,000–$18,000"
> "⚠️ No contingency line item detected. Recommended minimum: 10% of hard costs ($X)"
> "⚠️ No Soft Costs budget (Architecture/Engineering, Survey, Legal) — typical: 8–15% of hard costs"

*Outlier Detection (High/Low)* — AI flags line items that are statistically high or low vs. historical benchmarks for the project type and geography:
> "🔴 Framing budgeted at $12/sqft — typical range for wood frame construction in the Northeast: $22–$35/sqft. This may be significantly underbudgeted."
> "🟡 Electrical rough-in at $48,000 for a 470 sqft ADU seems high — typical range: $15,000–$22,000. Verify scope."
> "✅ Concrete & Foundations: within normal range for this project type"

*Contingency Check* — Flags if contingency is under 10% of hard costs or missing entirely

*Analysis Summary Card* — After import, user sees a scorecard:
- X items imported successfully
- X potential gaps flagged
- X items flagged as high outliers
- X items flagged as low outliers
- Overall budget confidence: High / Medium / Low (based on flag count)

**Why this is the hook:**
Every developer starts a project with an Excel budget — it's the first thing they do. By making import frictionless AND immediately surfacing gaps and outliers, DrawStack delivers value within the first 5 minutes of signup. This is the "aha moment" that converts trial to paid.

For experienced developers like Steve: the AI is a second opinion that catches what they already know intuitively. For first-time developers: it's a safety net that prevents the most common budget blowout causes before construction even starts.

**Benchmark data source for MVP:** Seed with RSMeans cost data (licensed) or curated public datasets by CSI division, project type, and US Census region. As projects complete on DrawStack, replace with platform's own historical data.

---

**2. Invoice Upload & AI Categorization**
- Upload invoice PDF or image (drag-and-drop)
- AI extracts: vendor name, invoice date, invoice number, line items, amounts, totals
- AI suggests budget line item mapping for each invoice line
- User confirms or adjusts suggestions
- Approved invoices post to budget actuals
- Invoice status: Uploaded → Reviewed → Approved → Paid
- Retainage tracking per invoice

**3. Draw Request Builder**
- Select invoices to include in draw
- System calculates draw amounts by line item automatically
- Generate AIA G702 (Application for Payment summary) — PDF
- Generate AIA G703 (Continuation Sheet / Schedule of Values) — PDF
- Generate bank draw sheet (customizable template per lender)
- Draw package export (zip file with all PDFs + supporting invoices)
- Draw history / audit trail

**4. Budget vs. Actual Dashboard**
- Live view: Budget | Committed | Invoiced | Paid | Remaining | % Complete
- Color-coded variance (green = under, yellow = within 10%, red = over)
- Burn rate chart
- Projected final cost (current pace)
- Filter by division / category

**5. Multi-User Access**
- Roles: Owner/Developer, GC, Subcontractor (invoice submission only), Investor/Partner (read-only), PM
- Invite by email
- Sub can log in and upload their own invoices
- Investor sees dashboard + draw history (no financials detail)
- All actions logged with user + timestamp

**6. Authentication & Billing**
- Supabase Auth (email/password + Google OAuth)
- Stripe billing (per-project subscriptions)
- Free trial: 1 project, 30 days
- Self-serve onboarding

#### MVP Non-Goals (Explicitly Out of Scope)
- Mobile app (responsive web only)
- Lender portal / lender-side login
- Lien waiver management
- Payroll integration
- Full accounting (not trying to replace QuickBooks)
- Gantt / scheduling
- Field management (photos, punch lists, daily logs)
- Change order approval workflow (basic tracking only)

---

### Phase 2 Roadmap (Months 3–9)

**1. Historical Project Database + AI Cost Predictor**
- After projects close, data feeds into anonymized cost database
- On new project budget setup: "Similar projects in your market cost $X per sqft for framing" 
- AI-assisted budget template generation from project type + location + sqft
- This is the institutional memory feature — makes DrawStack a long-term data asset

**2. Lender Integration Templates**
- Pre-built draw sheet templates for common lenders (community banks, regional banks)
- User can upload their lender's blank template; system auto-fills it
- Lender-specific fields (loan number, inspection date fields, etc.)

**3. Lien Waiver Management**
- Conditional + unconditional lien waiver generation per invoice
- Track lien waiver status per vendor per draw
- Include in draw package automatically

**4. Change Order Workflow**
- Formal change order creation with approval
- Budget line item reallocation
- GC and owner e-signature on change orders

**5. QuickBooks / Xero Integration**
- Sync approved invoices to QBO
- Two-way sync on payment status

**6. Draw Submission Portal**
- Email draw package to lender directly from app
- Track submission + approval dates
- Communication thread per draw

**7. Portfolio View**
- Multi-project dashboard
- Aggregate burn, variance, and draw metrics
- Property-level performance comparison

---

## 6. Technical Architecture

### Recommended Stack

**Frontend**
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** components
- **Recharts** or **Tremor** for dashboard charts
- Responsive web (no native app in MVP)

**Backend**
- Next.js API routes (serverless) for lightweight endpoints
- **Node.js** background workers for AI invoice processing (queue-based)

**Database**
- **Supabase** (PostgreSQL) — auth, database, storage, realtime
- Rationale: handles auth, file storage (invoices), and relational data in one managed service; great for solo dev speed
- Key tables: projects, budget_items, invoices, invoice_line_items, draws, draw_items, users, project_members

**File Storage**
- Supabase Storage (S3-compatible) for invoice PDFs, images
- Organized by: `/{project_id}/invoices/{invoice_id}/`

**AI Invoice Parsing**
- **Primary**: GPT-4o vision API — send invoice as image, prompt for structured extraction
  - Cost: ~$0.01–0.05 per invoice (negligible)
  - Field accuracy: ~90.5% on standard fields (BusinessWareTech benchmark)
  - Weakness: line-item tables (may need structured follow-up prompt)
- **Alternative for table-heavy invoices**: AWS Textract Analyze Expense API (~$0.01/page)
- **Recommended approach**: GPT-4o as primary, fallback to Textract for complex multi-page invoices
- Post-extraction: embedding-based matching to suggest budget line items (using pgvector or simple cosine similarity on budget item descriptions)

**PDF Generation (AIA G702/G703)**
- **Option A**: `pdf-lib` (Node.js) — programmatically fill a licensed AIA template
  - Note: AIA forms are copyrighted. Options:
    1. Purchase AIA digital forms license (~$80/form template) and auto-fill via PDF field injection
    2. Build "AIA-style" forms with equivalent layout/content but no AIA branding (many competitors do this)
    3. Use `puppeteer` to render an HTML template to PDF — most flexible
- **Recommendation**: Build AIA-style HTML → PDF via Puppeteer (or `@react-pdf/renderer`). Functionally identical to G702/G703, avoids licensing complexity, infinitely customizable.
- Bank draw sheets: same approach — HTML template → PDF, user customizes fields

**Authentication**
- Supabase Auth
- Email/password + Google OAuth (both needed for target user)
- Row-level security (RLS) policies for project access control

**Payments**
- **Stripe** — subscriptions per active project
- Metered billing consideration for Phase 2 (pay-per-draw or per-project)

**Hosting**
- **Vercel** (frontend + API routes) — zero devops, free tier works for MVP
- Supabase handles database hosting
- Total infra cost at early stage: ~$50–100/month

**Email**
- **Resend** or **Postmark** for transactional email (draw notifications, invites)

**Background Jobs**
- For AI processing (async invoice parsing): Supabase Edge Functions with queue, or simple polling from the Next.js backend
- At scale: migrate to **BullMQ** + Redis

### Data Model (Core Tables)

```sql
projects
  id, name, address, owner_id, loan_amount, lender_name, 
  start_date, expected_end_date, status, created_at

budget_items
  id, project_id, division_code, division_name, 
  category_name, item_name, budgeted_amount, 
  sort_order, created_at

invoices
  id, project_id, vendor_name, invoice_number, 
  invoice_date, total_amount, status, 
  pdf_url, uploaded_by, created_at

invoice_line_items
  id, invoice_id, description, amount, 
  budget_item_id (FK, nullable until approved), 
  ai_suggested_budget_item_id, ai_confidence

draws
  id, project_id, draw_number, period_start, period_end,
  status, submitted_at, approved_at, created_at

draw_items
  id, draw_id, budget_item_id, 
  work_completed_to_date, work_this_period,
  stored_materials, retainage_percent

project_members
  id, project_id, user_id, role (owner/gc/sub/investor/pm)
```

### Security Considerations
- All project data scoped by project_id with RLS
- Investor/partner role = read-only at database level
- Signed URLs for invoice file access (no public S3 links)
- Audit log table for all financial state changes

---

## 7. Pricing Strategy

### Competitive Context
| Competitor | Price | Min Contract |
|-----------|-------|--------------|
| Procore | $10K–$60K+/yr | ~$10K |
| Buildertrend | $299–$1,099/mo (custom) | Monthly |
| Rabbet Lite | $375/mo/project | $15K/yr |
| Rabbet Standard | $595/mo/project | $15K/yr |
| Rabbet Premium | $840/mo/project | $15K/yr |
| Knowify | $99–$299/mo (trade contractor) | Monthly |

### DrawStack Pricing Model

**Model: Per-Project Subscription (Monthly)**

No annual minimum. Cancel anytime. This is the primary wedge against Rabbet.

| Tier | Price | Projects | Best For |
|------|-------|----------|----------|
| **Solo** | $149/mo/project | 1 project | First-time developer, owner-builder |
| **Builder** | $249/mo/project | 1–5 projects | Active developer, 2–3 simultaneous projects |
| **Portfolio** | $349/mo/project | Unlimited | 5+ projects, team, wants portfolio view |

**Volume discount**: 3+ active projects on Builder/Portfolio = 15% off

**Add-ons (Phase 2)**:
- AI Cost Predictor (underwriting tool): +$99/mo flat (not per project)
- Priority support: +$49/mo

**Free Trial**: Full-feature, 1 project, 30 days. No credit card required.

**Annual billing**: 2 months free (16.7% discount) if paid annually

### Unit Economics Assumptions
- COGS per customer/month: ~$15–25 (Supabase, Vercel, AI API calls, Stripe fees)
- Gross margin target: 85–90%
- Average customer: 2 active projects at Builder tier = ~$498/mo = ~$5,976/yr
- CAC target: <$500 (content/community driven, low-touch sales)
- LTV target: 24+ months × $498 = $11,952
- LTV:CAC > 20:1 at these numbers

### Why Per-Project vs. Flat Monthly
- Aligns value with usage (more projects = more value)
- Natural expansion revenue as customers grow their business
- Creates clear upgrade path
- Psychologically, developers think in projects, not months
- Rabbet validated this model at higher price points

---

## 8. Go-to-Market Plan

### Target Customer Profile

**Primary**: Solo developer or small team (2–3 people), actively managing 1–4 construction projects per year, taking construction loans from community banks or regional banks. Probably owns an LLC or two. Has been burned by budget blowouts. Currently using Excel.

**Secondary**: Owner-builders (acting as their own GC on a custom home or ADU build) who have a construction loan.

**Tertiary**: Small GCs who have their developers asking them to use software — they become the advocate into their developer clients.

### Channel Strategy

#### 1. Content / SEO (Months 1–3, Long-Term Engine)
High-value search terms with low competition:
- "AIA G702 G703 template free"
- "construction draw management spreadsheet"
- "construction budget tracking software small developer"
- "how to fill out AIA G702 G703"
- "construction loan draw process"

Create: Free AIA G702/G703 Excel template (email capture), construction draw checklist, "How to submit a construction draw" guides. These capture people at the moment of peak pain.

**Free tool strategy**: Offer a free AIA G702/G703 generator (web-based, no login required). This is the lead magnet. User generates forms → sees value → upsells to full DrawStack account.

#### 2. Reddit & Community
Active communities:
- **r/RealEstateDevelopment** (~50K members)
- **r/realestateinvesting** (>1.7M members — many doing ground-up)
- **r/HousingDevelopment**
- **r/Entrepreneur** (for GTM learnings)
- **BiggerPockets Forums** (especially "Real Estate Development" subforum — very active)

Approach: Genuinely helpful answers to draw/budget questions. No spam. Build credibility over 30–60 days. Post build-in-public updates.

**BiggerPockets** specifically: Very active community of exactly our target users. They have a podcast, blog, and forums. Potential podcast guest appearance, sponsored content, or forum contribution. BP audience is more sophisticated (not HGTV watchers) and pays for tools.

#### 3. Facebook Groups
- "Real Estate Developer Network" (~50K+ members)
- State-specific developer/investor groups
- "Owner Builder Community" groups
- NAHB chapter Facebook groups

#### 4. Associations & Events
- **NAHB International Builders' Show (IBS)** — January annually, 60K+ attendees, largest residential construction trade show. Year 2 target.
- **Urban Land Institute (ULI)** — Young Leaders Group, product demos
- **NAIOP** (Commercial Real Estate Development Association)
- **MBA (Mortgage Bankers Association)** — Builder Finance Committee
- State HBA (Home Builders Association) chapters — local chapter demos

#### 5. Lender Partnerships (Strategic, Month 3+)
Construction lenders are a force multiplier:
- Community banks with construction lending departments recommend DrawStack to borrowers
- Lender gets a cleaner draw package (less back-and-forth)
- Developer gets a tool
- DrawStack gets referred leads with high intent

Approach: Identify 10–15 community banks in target markets (MA, northeast). Schedule a 30-min call with construction lending officers. Show them a sample clean DrawStack draw package vs. a typical Excel mess.

Potential deal structure: Lender-referred customers get 30-day extended trial; lender gets a referral fee or white-label option (Phase 3).

#### 6. Accounting / Bookkeeping Firms
Construction-focused bookkeepers are often their client's first call when draw time comes. If DrawStack can make the bookkeeper's job easier (clean invoice records, exportable data), they become advocates.

#### 7. Integration Partners (Phase 2)
- **QuickBooks Online** — sync invoices/payments
- **Yardi Breeze** (property management) — shared project data
- **DocuSign** — e-signature for draw packages
- **Procore** — sync budget data (many small devs use Procore for field + want draw tools)

### Launch Sequence
| Week | Action |
|------|--------|
| 1–4 | Build MVP |
| 5 | Soft launch — post on Reddit, BiggerPockets, LinkedIn |
| 5–6 | DM 30 potential beta users from forums (people complaining about AIA forms) |
| 6–8 | Onboard 10 beta users (free), collect feedback |
| 8 | Public launch — Product Hunt, IndieHackers |
| 8–12 | Content SEO (5–10 targeted blog posts) |
| 12 | Begin lender outreach |

### Steve's Unfair Advantage
Steve Vettori is a real estate developer in Boston who GCs his own projects and submits draws to lenders. **He is the product's target user.** He can:
1. Use the product on Alpine Property Group projects (immediate dogfooding)
2. Share authentically with his network in his exact ICP (invaluable for early adoption)
3. Speak credibly in developer communities without pitching
4. Reference real project data in demos

This founder-as-user positioning is extremely valuable and should be front and center in all marketing.

---

## 9. Build Timeline

**Assumption**: Solo AI coding agent (Claude Code / Codex) working full-time. 4-week target for functional MVP.

### Week 1: Foundation + Data Model
**Days 1–2**: Project setup
- Next.js 14 app with TypeScript
- Supabase setup (auth, database, storage)
- Tailwind + shadcn/ui component library
- Stripe integration (subscriptions)
- Basic auth flows (signup, login, reset password)
- Deployment to Vercel

**Days 3–5**: Core data model + project management
- Projects CRUD
- Budget setup UI — Division → Category → Sub-item hierarchy
- CSI division pre-load
- Budget import from CSV
- Basic navigation / layout

### Week 2: Invoices + AI
**Days 6–8**: Invoice upload + storage
- Invoice upload (PDF/image), stored in Supabase Storage
- Invoice list/detail view
- Invoice metadata entry (vendor, date, amount, invoice #)

**Days 9–10**: AI invoice parsing
- GPT-4o Vision API integration
- Extract fields from uploaded invoice
- Structured output → invoice_line_items table
- Budget line item suggestion UI (user confirms/edits)
- Post to actuals on approval

### Week 3: Draw Request Builder + PDF Generation
**Days 11–13**: Draw builder logic
- Select invoices for draw
- Auto-calculate draw amounts per budget line
- Draw summary view (schedule of values)

**Days 14–15**: PDF generation
- AIA G702-style PDF (Puppeteer/react-pdf)
- AIA G703 continuation sheet PDF
- Bank draw sheet (customizable template)
- Draw package zip download
- Draw history

### Week 4: Dashboard + Multi-User + Polish
**Days 16–17**: Budget vs. actual dashboard
- Variance table (Budget / Invoiced / Paid / Remaining)
- Color-coded variance
- Burn rate chart
- Projected final cost

**Days 18–19**: Multi-user access
- Project invites by email
- Roles: Owner, GC, Sub, Investor, PM
- Role-based view restrictions
- Sub invoice upload flow

**Day 20**: Polish + launch prep
- Onboarding flow
- Free trial logic
- Email notifications (invite, draw submitted)
- Basic error handling, edge cases
- Load test with sample data

### Post-MVP Weeks 5–6: Beta Validation
- Onboard 10 real users with live projects
- Fix critical bugs
- Collect feedback on AI accuracy, PDF output quality
- Iterate on UX blockers

---

## 10. Success Metrics

### 30 Days Post-Launch
| Metric | Target |
|--------|--------|
| Beta users onboarded | 10–15 |
| Projects created | 15–25 |
| Invoices processed | 50+ |
| Draws generated | 5–10 |
| AI categorization accuracy | >80% accepted without edit |
| NPS (informal) | Positive ("I'd recommend this") |
| Paying customers | 3–5 (converting from free trial) |
| MRR | $500–$1,000 |

### 60 Days Post-Launch
| Metric | Target |
|--------|--------|
| Paying projects | 20–30 |
| MRR | $3,000–$5,000 |
| CAC | <$200 (mostly organic/community) |
| Churn | <10% monthly |
| Reddit/BiggerPockets signups | 2–3/week organic |
| At least 1 lender referral partnership in discussion | ✓ |

### 90 Days Post-Launch
| Metric | Target |
|--------|--------|
| Paying projects | 50+ |
| MRR | $8,000–$12,000 |
| Customer testimonials (shareable) | 3+ |
| Draw packages generated | 100+ |
| AI accuracy | >90% accepted without edit |
| Lender partnership active (1) | ✓ |
| Phase 2 feature roadmap validated by users | ✓ |

### What "Traction" Looks Like

**Signal 1 — Retention**: Customers who use the product for one draw are very likely to continue (monthly invoicing + draw cycles are habitual). Churn above 15%/month means onboarding or product-market fit problem.

**Signal 2 — Expansion**: Customers adding second/third projects. This validates the pricing model.

**Signal 3 — Referrals**: "My developer friend just signed up" — construction is a small world. Word-of-mouth is the best signal.

**Signal 4 — AI feature usage**: If users are uploading invoices and accepting AI suggestions (>80%), the core differentiator is working. If everyone is ignoring AI and entering manually, it's broken.

**Signal 5 — Draw completion**: If users start a draw and don't finish/download it, there's a UX or workflow problem. Target: >80% of started draws completed.

---

## 11. Open Questions / Risks

### High Priority Questions (Decide Before Build)

**Q1: AIA Form Licensing**
AIA G702/G703 are copyrighted forms. Three options:
1. Build "AIA-style" forms (functionally identical, no AIA branding) — most practical, widely accepted in the industry
2. License from AIA — possible but adds complexity/cost
3. Integrate with AIA Contract Documents online service — overkill for MVP

**Recommendation**: Build AIA-style forms for MVP. If a major client requires exact AIA branding, address then.

**Q2: AI Accuracy Threshold**
What's the acceptable accuracy rate for invoice categorization before users trust the AI? If early users find themselves correcting 40% of suggestions, they'll lose trust and do it manually anyway. Need to:
- Test with real construction invoices before launch
- Build "low confidence" flagging so AI doesn't confidently suggest wrong items
- Collect training data from user corrections to improve over time

**Q3: Bank Draw Sheet Variability**
Every lender has a different draw sheet format. Some are simple Excel templates. Some are proprietary PDFs. How do we handle variability?
- MVP: offer 3–4 common formats + let users upload their lender's template for auto-fill
- Phase 2: build a template library contributed by users
- This is potentially a major onboarding friction point — needs to be solved early

**Q4: Legal/Retainage Complexity**
Construction finance involves retainage (typically 5–10% held back per draw until final completion), lien waivers, and state-specific requirements. MVP should handle retainage calculations correctly from day one — this is table stakes for any draw that goes to a real lender.

### Risks

**Risk 1: AI OCR Accuracy on Messy Invoices** (HIGH)
Small GCs and subs produce terrible invoices. Handwritten, blurry photos, non-standard formats. GPT-4o handles this better than traditional OCR but still fails on truly bad inputs. Mitigation: always allow manual override; never auto-post without user confirmation. Make manual entry fast.

**Risk 2: Rabbet Goes Down-Market** (MEDIUM)
Rabbet could remove their $15K annual minimum or launch a "starter" plan. They've been VC-backed (raised $35M+) and are optimizing for enterprise ACV, not SMB volume. Enterprise motion is very hard to reverse. Low probability near-term, but monitor.

**Risk 3: Distribution is Hard** (HIGH)
Small developers are not on Product Hunt. They're in Facebook groups, local real estate meetups, and communities like BiggerPockets. Organic SEO will take 6–12 months to kick in. The first 50 customers will require direct outreach and personal selling. Steve's network and founder credibility are critical here.

**Risk 4: Construction Seasonality** (LOW-MEDIUM)
Construction activity is seasonal (less in winter, peak spring/summer). This affects demo interest and draw volumes. Plan marketing push for March–April pre-season.

**Risk 5: Lender Adoption Required** (MEDIUM)
The app generates draw packages, but developers still need to email/upload them to lenders. If lenders require specific formats that DrawStack doesn't support, developers will revert to their manual process. Mitigation: Talk to 5+ lenders before launch to understand their minimum requirements.

**Risk 6: Tax/Accounting Confusion** (LOW)
Users may expect DrawStack to be their QuickBooks replacement. Clear positioning: DrawStack is for draw management, not accounting. The invoice approval workflow feeds into accounting but doesn't replace it.

**Risk 7: Competition from Incumbents Adding AI** (MEDIUM)
Buildertrend, Procore, etc. will add AI features over 12–24 months. But enterprise software is slow to move, their AI will be bolted-on, and their pricing won't come down. 2-year window to establish brand and lock in customers with switching cost (historical project data).

---

## Appendix: Key Data Sources

- AD&C Loan Volume: NAHB Eye on Housing, Q4 2024 report (March 2025)
- Housing Starts: NAHB Press Release, January 2025 (2024 full year data)
- Construction Establishment Count: AGC Construction Data, Q1 2023
- Construction Mgmt Software Market: GMI Insights, 2023; Data Bridge Market Research, 2024
- Rabbet Pricing: rabbet.com/developers/pricing (verified March 2026)
- Procore Pricing: Various sources; $10K–$60K+/yr estimate widely reported
- Buildertrend Pricing: Knowify competitive analysis; $299–$1,099/mo range
- CoConstruct: itqlick.com, financesonline.com — $99–$699/mo (legacy pricing)
- Sage 300 CRE: selecthub.com ($6,600+/yr); softwareconnect.com (median $23K TCO 3yr)
- Knowify: knowify.com — $99/mo starting
- AI Invoice OCR comparison: businesswaretech.com benchmark (GPT-4o: 90.5% field accuracy)
- Built Technologies AI Draw Agent: CNBC, November 6, 2025
- BiggerPockets, r/RealEstateDevelopment, r/realestateinvesting: community size estimates from platform data

---

*Document version 1.0 | Created March 14, 2026*  
*Next review: After 5 customer interviews pre-build*
