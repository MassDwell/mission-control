# MassDwell Hub — Full Build Prompt for Google Stitch
*Compiled April 2026 | Internal tool for MassDwell sales & operations team*

---

## OVERVIEW

Build a unified, invite-only internal web application called **"MassDwell Hub"** (`hub.massdwell.com`) for MassDwell's sales and operations team. All internal tools live at one URL. Team members log in with their own account and access everything from a persistent sidebar.

**Brand:** MassDwell — modern, professional, clean. Use the official MassDwell color palette exactly.
- **Deep Navy** `#011832` — Primary background, logo, text on light backgrounds
- **Admiral Blue** `#132c49` — Secondary elements, accents, graphical shapes
- **Soft Denim** `#445970` — Highlights, text details, subtle backgrounds
- **Pure White** `#ffffff` — Balance, clarity, minimalism
- Font: Inter (Google Fonts)
- MassDwell logo top-left on all authenticated pages
- Mobile responsive — reps use phones in the field

**Auth:** Clerk — per-user accounts, email/password + Google SSO, invite-only (no public sign-up). Admin invites team members via Clerk dashboard.

---

## NAVIGATION STRUCTURE

Left sidebar, collapsible to hamburger on mobile. Dark navy sidebar, white main content area. Active item highlighted in green.

**5 modules:**
1. 📊 Dashboard
2. 💰 COGS Calculator
3. 🏗️ ADU Permit Navigator
4. 📋 ADU Tools (Lead Pipeline)
5. 🔁 Re-Listing Optimizer

Default landing: Dashboard.

---

## MODULE 1 — DASHBOARD

The home page. Gives the team a quick pulse on the business.

### Sections:

**A. Sales Cheat Sheet (pinned, always visible)**

A full interactive sales reference that the team can use during calls and follow-ups. This is the core of the Dashboard — not just a landing page.

Structured as a tabbed reference card with these tabs:

**Tab 1: The Pitch**
- 30-second pitch (formatted as a speech card, easy to read aloud):
  > "MassDwell builds factory-made accessory dwelling units right here in Massachusetts. We handle design, permitting, and construction — start to finish. Our units go from permit approval to move-in in 8 to 12 weeks, which is about 50% faster than a traditional build. Prices start at $141,000 and everything's included — no hidden costs, no contractor surprises."
- Top 6 value props (numbered, bold):
  1. Speed — 8–12 weeks post-approval vs. 12–18 months traditional
  2. Turnkey — Design, permitting, construction, delivery, installation
  3. Transparent pricing — No hidden costs, no contractor surprises
  4. Local — Massachusetts-based, we know the towns and permits
  5. ROI — ADUs add 15–25% to property value + $2,000–$3,500/month rental income potential in Greater Boston
  6. Legal — Since Feb 2025, ADUs under 900 sqft are by-right statewide in MA (no zoning board for most homeowners)

**Tab 2: Product Line**
Display as cards (not just a table) — one card per model with: model name, sqft, bed/bath, starting price, and a short positioning blurb.

| Model | Size | Bed/Bath | Starting Price | Best For |
|-------|------|----------|----------------|----------|
| Dwell Essential | 471 sqft | 1 bd / 1 ba | $141,000 | Single occupant, caregiver, home office |
| Dwell Classic | 574 sqft | 2 bd / 1 ba | $172,000 | Couple, young adult, rental income |
| Dwell Deluxe | 600 sqft | 2 bd / 1 ba | $186,000 | Same as Classic, wider floorplan |
| Dwell Prime | 900 sqft | 2 bd / 2 ba | $270,000 | Family, premium rental, multigenerational |

Pricing baseline: ~$300/sqft turnkey (includes delivery, installation, permitting)
All models fully customizable. In-house design team and production facility.

**Tab 3: Qualifying Questions**
Ordered checklist — checkboxes that reset per session:
1. ☐ Are they in Massachusetts?
2. ☐ What's their timeline?
3. ☐ What's the use case? (Rental / Family / Office)
4. ☐ Budget range ($141K–$270K+)?
5. ☐ Do they know their lot size / zoning?

**Tab 4: Objection Handling**
Accordion-style. Each objection expands to reveal the script.

- **"That's too expensive"**
  > "I get it — this is a real investment. A few things: our base prices include delivery and installation, which contractors don't. You're also getting 8–12 weeks, not 12–18 months of carrying costs. In Greater Boston you're looking at $2,000–$3,500/month in rent — that's a payback in under 5 years on most models. We also have financing options. What's your target number? Let's see if we can engineer something that works."

- **"I want something more design-forward / different aesthetic"**
  > "Our website shows a few basic examples — it's not the limit. We have our own production facility and in-house design team. We can match your home's style, go modern, go traditional — whatever you want. We're offering a free design consultation right now. Want to see some custom examples we've done?"
  *(Never accept this objection. Always make one more offer.)*

- **"How long does permitting take?"**
  > "We handle 100% of permitting — that's one of the biggest reasons people use us. Since the February 2025 state law change, most MA homeowners can get a building permit without a zoning board hearing. We're seeing 4–12 weeks depending on the municipality. We know the local building departments and manage the whole process."

- **"I'm not ready yet / maybe next year"**
  > "Perfect timing to start planning. Most projects take 8–12 weeks from permit approval. If we start design now, you'll be ready to break ground when you are. Can we do a quick free site assessment? It costs nothing and tells you exactly what's possible."

- **"I didn't know I could build an ADU here"**
  > "Great news — since February 2025, ADUs under 900 sqft are allowed by-right in single-family zoning districts statewide in MA. No zoning board hearing, no neighbor notification — just a building permit. What town are you in? We probably know your municipality's specifics."

- **"Do you do custom designs?"**
  > "Absolutely. The website is a starting point. We have our own factory and design team — we build to your specs. Some of our best projects started with 'I want something different.'"

- **"What about utilities?"**
  > "All included. We connect to your existing water, sewer, and electric. We coordinate with utility companies as part of our turnkey service."

- **"I already talked to a contractor"**
  > "Great — do your research. One thing worth asking: does their price include permitting? Site prep? Utility connections? Ours does. We're also 8–12 weeks vs. 12–18 months for a custom build. Happy to do a side-by-side if useful."

**The Golden Rule (styled as a callout box in red/orange):**
> ⚠️ Always make ONE MORE OFFER before accepting no.
> Acceptable to let go: Out of MA / Already under contract / Project cancelled.
> Everything else = another solution exists.

**Tab 5: ROI Calculator**
Interactive calculator. Inputs:
- Model (dropdown: Essential / Classic / Deluxe / Prime — pre-fills price)
- Custom price override (optional)
- Expected monthly rent ($2,000–$3,500 range with Greater Boston presets)
- Financing type (Cash / HELOC / Construction loan)
- If financed: down payment %, interest rate, loan term

Outputs (auto-calculated):
- Monthly cash flow (rent minus any loan payment)
- Annual gross income
- Payback period (years to break even)
- 10-year total income
- Property value lift estimate (15–25% of home value — let user enter home value)

Display as a simple results card. No need for complex charts — just the numbers.

**Preset scenarios (quick-select buttons):**
- "Rental income — Dwell Classic — $2,800/mo rent — Cash purchase" → instant calculate
- "Multigenerational — Dwell Prime — family, no rent" → shows property value lift only
- "Investor — Dwell Essential — $2,100/mo — HELOC at 7.5%" → shows cash flow

**Tab 6: Financing Reference**
Static reference card (not a calculator — just information reps can use on calls):

**Common financing paths:**
| Option | What it is | Typical terms | Best for |
|--------|-----------|---------------|----------|
| HELOC | Home equity line of credit | Variable, ~7–8% currently | Homeowners with equity, phased spend |
| Cash-out refinance | Replace mortgage, pull equity as cash | Fixed, current market rates | Rate-sensitive, prefers fixed payment |
| Construction loan | Short-term loan, converts to mortgage | Higher rate, complex | Buyers without existing equity |
| MassHousing ADU Loan | State-sponsored ADU financing | Competitive fixed rates | MA homeowners, income-qualified |
| Personal savings / cash | No financing needed | N/A | ~20–30% of MassDwell buyers |

**MassHousing ADU Loan Program:**
- Massachusetts state-sponsored financing specifically for ADU construction
- Available through MassHousing-approved lenders
- Competitive fixed rates
- Income eligibility requirements apply
- Website: masshousing.com — search "ADU loan"
- Best for: buyers who can't tap home equity

**What to say on the call:**
> "We work with buyers who finance a few different ways — HELOCs are the most common since most Greater Boston homeowners have significant equity right now. There's also a MassHousing ADU-specific loan program with competitive rates. I can connect you with a lender who specializes in ADU financing if that's helpful. What's your situation?"

**Tab 7: The 5-Step Process**
Visual timeline — horizontal steps (vertical on mobile):

**Step 1 — Discovery Call (Week 0)**
- 20–30 min call with our team
- We learn your goals, property, timeline, budget
- You learn what's possible
- No commitment required

**Step 2 — Site Assessment (Week 1)**
- Free on-site visit
- We assess: lot dimensions, setbacks, utilities, access
- We tell you exactly what we can build on your property
- Usually same week as Discovery Call

**Step 3 — Design & Permitting (Weeks 2–10)**
- You choose your model and finishes
- Our team handles all permit drawings and submissions
- We manage the full permitting process with your local building department
- Timeline: 4–12 weeks depending on municipality (we handle all of it)

**Step 4 — Factory Build (Concurrent with Permitting)**
- Your unit is built in our factory while permits process
- Factory-controlled environment = consistent quality, no weather delays
- Precision manufacturing to exact spec

**Step 5 — Delivery & Installation (Weeks 10–12 post-approval)**
- Unit is delivered and set on your prepared foundation
- Utility connections made by our crew
- Final inspections completed
- Move-in ready

**Callout:** *"The entire process — from first call to move-in — typically runs 4–6 months. Post-permit, it's 8–12 weeks. We track every step and keep you updated throughout."*

**Tab 8: Competitive Intelligence**
Read-only reference. Tabs or accordion per competitor:

**Reframe Systems (Andover, MA) — Biggest Credibility Threat**
- Net-zero energy ADUs, robotics, venture-backed
- Boston Globe coverage, Ivory Prize 2025 winner
- No public pricing, developer-heavy, not homeowner-friendly
- **Counter:** "Reframe is great if you're a developer or want to be a beta tester. We're local, transparent on pricing, and ready to build now."
- Head-to-head:

| | MassDwell | Reframe |
|--|-----------|---------|
| Focus | Homeowners, rental investors | Developers, municipalities |
| Pricing | $141K–$270K published | Not public |
| Timeline | 8–12 weeks | Claims 2x faster |
| Availability | Now | Scaling |

**BuildX (South Shore, MA) — Most Aggressive**
- Traditional custom builder publishing "hidden costs of modular ADU" content
- Actively trying to undermine prefab/modular credibility
- Traditional build = 12–18 months, higher cost uncertainty
- **Counter:** "BuildX is a contractor. They're right that some modular companies hide costs — we don't. Our price is all-in. Want to do a line-by-line comparison?"

**McElhinney / D&G Exteriors / Local Contractors**
- Traditional builders ranking on ADU content
- **Counter:** "Custom construction is great if you have 18 months and price flexibility. We offer a defined price, defined timeline, and we handle every step."

**Zook Cabins / Online Aggregators**
- Pennsylvania company, not local, no permitting support, lower quality
- **Counter:** "Zook ships a kit — no MA expertise, no permitting, not built to MA code. We're local and we own the process."

**Tab 9: Market Facts**
Quick-reference stats for conversations:
- MA ADU law changed **February 2025** — by-right statewide in single-family zones under 900 sqft
- State projects **8,000–10,000 new ADUs** over the next decade
- Greater Boston ADU rents: **$2,000–$3,500/month**
- ADUs add **15–25% to property value** in MA
- Average all-in ADU cost (traditional construction): **$150,000–$450,000**
- MassDwell is the **only MA-based purpose-built ADU manufacturer** in Greater Boston

**Customer Profiles (quick reference):**
| Who | Motivation | Lead With |
|-----|-----------|-----------|
| Rental income seeker (45–65) | Passive income, retirement | Monthly rent + payback period |
| Multigenerational family (40–60) | Aging parent / adult child | Design quality, privacy, aesthetics |
| Real estate investor | Value-add, yield | Speed, fixed pricing, scalability |
| Empty nester (55+) | Simplicity, caregiver housing | Turnkey, "we handle everything" |

**B. Model Pricing Cards (below the cheat sheet)**
4 visual cards — Essential, Classic, Deluxe, Prime. Quick glance.

**C. Quick Links**
Buttons linking to each module.

**D. Company Info Footer**
massdwell.com | sales@massdwell.com | (781) 531-8593 | Needham, MA

---

## MODULE 2 — COGS CALCULATOR

Project-level cost tracking and margin analysis. Backed by Supabase.

### What it does:
- Create a project by selecting a model (Essential, Classic, Deluxe, Prime)
- Track cost line items across 10 categories with Estimated and Actual costs
- Auto-calculates: Total COGS, Gross Margin %, Variance (actual vs. estimated)
- Color-coded alerts: Green >20% margin, Yellow 10–20%, Red <10%
- Project statuses: Estimated → In Progress → Completed → Closed
- Toggle to include/exclude optional deck
- Analytics overview: margin trends across all projects

### Cost categories and line items:

| Category | Line Items |
|----------|-----------|
| 🏗️ Structure (Steel) | Steel Material, Steel Labor |
| ⚡ Electrical | Electrical Package |
| ❄️ HVAC | Mini Split System |
| 🏠 Roofing | Shingles (GAF), Roofing Labor |
| 🍳 Kitchen | Cabinets, Countertops |
| 🚿 Bathroom | Vanity, Toilet |
| 🚜 Site Prep & Foundation | Site Preparation, Foundation, Permits & Fees, Grading & Excavation |
| 🔌 Utilities | Water & Sewer, Electric Service, Gas Service |
| 📋 Overhead | Project Management, Insurance & Bonding, General Conditions |
| 🛡️ Contingency | Contingency Reserve |

Default cost estimates auto-populate by model/sqft when project is created. User can override any line.

### Supabase schema:
```sql
create table cogs_projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  model text not null,
  costs jsonb default '{}',
  list_price numeric,
  include_deck boolean default true,
  total_cogs numeric,
  margin numeric,
  status text default 'estimated',
  created_at timestamptz default now()
);
```

---

## MODULE 3 — ADU PERMIT NAVIGATOR

Helps the sales team walk prospects through Massachusetts ADU permitting by town. Doubles as a lead lookup tool via Kommo CRM.

### What it does:
- Enter a Massachusetts address or select a municipality
- Displays town-specific permit data: timeline estimate, complexity badge, required docs checklist, setback rules, notes
- "Has MassDwell worked here?" indicator (pull from Kommo or static list)
- Lead lookup: enter address, surface any matching Kommo CRM contact

### Pre-loaded town reference data (static, can be extended):

Build this as a static JSON dataset — `permits/towns.json`. Render from it.

```json
[
  {
    "town": "Needham",
    "county": "Norfolk",
    "complexity": "Easy",
    "timeline_weeks": "3–5",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "10ft", "side": "7ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": true,
    "notes": "Streamlined process, responsive building dept. Favorable setbacks. MassDwell has completed projects here.",
    "massdwell_experience": true,
    "permit_fee_estimate": "$1,500–$2,500",
    "required_docs": ["Site plan", "Architectural drawings", "Septic system letter (if applicable)", "Utility diagram"]
  },
  {
    "town": "Newton",
    "county": "Middlesex",
    "complexity": "Moderate",
    "timeline_weeks": "6–10",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "15ft", "side": "10ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": false,
    "notes": "Strict design standards — must match primary structure aesthetics. Historic district considerations in some villages. Slower building dept.",
    "massdwell_experience": true,
    "permit_fee_estimate": "$2,000–$4,000",
    "required_docs": ["Site plan", "Architectural drawings", "Design standards compliance letter", "Utility diagram"]
  },
  {
    "town": "Wellesley",
    "county": "Norfolk",
    "complexity": "Moderate",
    "timeline_weeks": "6–10",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "15ft", "side": "10ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": false,
    "notes": "High-value suburb, strong design standards. Expect careful review. Historic overlays in parts of town.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$2,500–$4,500",
    "required_docs": ["Site plan", "Architectural drawings", "Historic review (some areas)", "Utility diagram"]
  },
  {
    "town": "Brookline",
    "county": "Norfolk",
    "complexity": "Complex",
    "timeline_weeks": "8–14",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "20ft", "side": "10ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": false,
    "notes": "Significant historic district coverage. Design review required in many areas. Longer timelines. Recommend flag to Steve before quoting.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$3,000–$6,000",
    "required_docs": ["Site plan", "Architectural drawings", "Landmark Commission review (if historic)", "Utility diagram", "Traffic study (some cases)"]
  },
  {
    "town": "Arlington",
    "county": "Middlesex",
    "complexity": "Easy",
    "timeline_weeks": "3–6",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "10ft", "side": "5ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": true,
    "notes": "ADU-progressive town. Pre-existing liberal zoning. Streamlined permit review. Strong candidate for MassDwell projects.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$1,200–$2,000",
    "required_docs": ["Site plan", "Architectural drawings", "Utility diagram"]
  },
  {
    "town": "Lexington",
    "county": "Middlesex",
    "complexity": "Easy",
    "timeline_weeks": "4–7",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "10ft", "side": "7ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": true,
    "notes": "Generally ADU-friendly. High-income suburb, buyers tend to want premium finishes. Historic areas near town center warrant check.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$1,500–$3,000",
    "required_docs": ["Site plan", "Architectural drawings", "Utility diagram"]
  },
  {
    "town": "Natick",
    "county": "Middlesex",
    "complexity": "Easy",
    "timeline_weeks": "3–5",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "10ft", "side": "5ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": true,
    "notes": "Cooperative building dept. Standard requirements. Good candidate market.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$1,200–$2,200",
    "required_docs": ["Site plan", "Architectural drawings", "Utility diagram"]
  },
  {
    "town": "Framingham",
    "county": "Middlesex",
    "complexity": "Moderate",
    "timeline_weeks": "5–9",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "15ft", "side": "7ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": false,
    "notes": "Larger city, permit office can be slow. Zoning varies significantly by district — verify district before quoting.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$1,500–$3,000",
    "required_docs": ["Site plan", "Architectural drawings", "Zoning district confirmation", "Utility diagram"]
  },
  {
    "town": "Waltham",
    "county": "Middlesex",
    "complexity": "Moderate",
    "timeline_weeks": "4–8",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "10ft", "side": "7ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": false,
    "notes": "Mixed residential/industrial city. Zoning varies — verify. Generally cooperative building dept.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$1,500–$2,500",
    "required_docs": ["Site plan", "Architectural drawings", "Utility diagram"]
  },
  {
    "town": "Cambridge",
    "county": "Middlesex",
    "complexity": "Complex",
    "timeline_weeks": "10–16",
    "by_right": true,
    "max_adu_sqft": 900,
    "setbacks": { "rear": "20ft", "side": "10ft" },
    "owner_occupancy_required": false,
    "short_term_rental_allowed": false,
    "notes": "Dense urban environment. Very limited detached ADU feasibility (lot sizes). Strong design review. Escalate to Steve before quoting.",
    "massdwell_experience": false,
    "permit_fee_estimate": "$4,000–$8,000",
    "required_docs": ["Site plan", "Architectural drawings", "Urban design review", "Shadow study (some cases)", "Utility diagram"]
  }
]
```

Complexity badge colors: Easy = green, Moderate = yellow, Complex = red.

### MA ADU Law Reference (display as a collapsible banner):
> **Massachusetts ADU Law — February 2025 Update**
> ADUs under 900 sqft are now allowed by-right statewide in single-family zoning districts (Affordable Homes Act, Chapter 150, Acts of 2024). No zoning board hearing required. No neighbor notification required. Building permit only. Municipalities may still regulate: setbacks, height, design standards, parking (1 space max). Short-term rentals (Airbnb) may still be restricted by municipality.

### Kommo CRM integration:
- `KOMMO_API_TOKEN` env var
- Base URL: `https://massdwellcrm.kommo.com/api/v4`
- On address lookup, search `/contacts` and `/leads` for matching address or name
- Display matching lead info if found: name, stage, last activity, assigned rep

---

## MODULE 4 — ADU TOOLS (LEAD PIPELINE)

Lightweight CRM-connected sales pipeline tool. Backed by Kommo CRM API.

### What it does:
- Pull and display open leads from Kommo CRM
- Lead cards: name, contact info, model interest, pipeline stage, last activity, lead score
- Quick actions: log a note, mark as contacted, move to next stage
- Filter: by stage, model, lead score
- DNC check before any outreach action
- Email template launcher: pre-fill templates for common scenarios
- Follow-up cadence tracker: shows where each lead is in the 12-day sequence

### Lead Scoring Display:
Compute and display lead score on each card:

| Factor | Points |
|--------|--------|
| Created <7 days | 3 |
| Created 7–30 days | 2 |
| Created 30–90 days | 1 |
| Created >90 days | 0 |
| In Negotiation/Feasibility stage | 3 |
| In Conversation | 2 |
| In Follow-up/Welcome | 1 |
| In Recap/Future | 0 |
| Urgency <30 days | 3 |
| Urgency 30–90 days | 2 |
| Urgency 3–6 months | 1 |
| No urgency stated | 0 |
| Budget >$200K stated | 3 |
| Budget $150–200K | 2 |
| Budget <$150K | 1 |
| Budget unknown | 0 |

Score badge: 🔥 12–15, 🟡 8–11, ❄️ 4–7

### Follow-Up Cadence Tracker:
Each lead card shows current cadence day (Day 0 through Day 12) and what action is due. Color-coded: overdue = red, due today = yellow, upcoming = gray.

### Email Templates (pre-built, launch from lead card):

**Template 1 — Initial Response**
```
Subject: Your MassDwell ADU Inquiry — Next Steps

Hi [First Name],

Thanks for reaching out about an ADU at [address if known]. 

Most homeowners we talk to are thinking about ADUs for one of three reasons:
1. Rental income (Great Boston rents are $2,000–$3,500/month for a well-built ADU)
2. Family/caregiver housing (aging parents, adult kids)
3. Property value increase (ADUs add 15–25% to value in MA)

Which one resonates most, or is it something else?

We've built ADUs across Massachusetts — typically 8–12 weeks from permit approval. Most people are surprised how turnkey it is. We handle design, permitting, and construction.

Would you be open to a quick 20-minute call this week? I'd love to show you what's possible on your property.

Best,
MassDwell Team
(781) 531-8593 | massdwell.com
```

**Template 2 — Value Drop (Re-engagement, Day 1)**
```
Subject: Quick update on ADUs in [Town] — thought of you

Hi [First Name],

Hope you're doing well! I was thinking about our earlier conversation and wanted to share a quick update.

We just wrapped a project nearby — a 2-bed unit that's now renting for $2,800/month. Permit to move-in in under 12 weeks.

Not sure if the timing is any better now, but happy to share:
• What we know about [their town]'s permitting process
• Updated pricing for the model you were looking at
• Photos from recent builds

No pressure — just wanted to stay in touch.

Best,
MassDwell Team
```

**Template 3 — Urgency Play (Day 5)**
```
Subject: Spring build slots opening up

Hi [First Name],

Quick note — our spring construction schedule is filling up and I wanted to reach out before it's locked.

For context: units take 8–12 weeks post-approval. If you're thinking about having something ready for summer rentals or family visits, now's the window.

We've also streamlined the process:
• Site assessment: Same-day scheduling
• Permitting: We handle 100% of it  
• Financing: HELOC and MassHousing loan options available

Worth a quick call this week? Even if you're not ready to commit, I can hold a soft slot while you decide.

MassDwell Team
```

**Template 4 — Final Attempt (Day 12 — Honest Reset)**
```
Subject: Closing the loop on your ADU project

Hi [First Name],

I've reached out a few times and haven't heard back — totally understand if timing isn't right.

Should I keep you on our update list, or would you prefer I hold off?

Either way, no pressure. If something changes, you know where to find us.

MassDwell Team
```

**Template 5 — Post-Call Follow-Up**
```
Subject: Great talking with you — next steps

Hi [First Name],

Really enjoyed our conversation today. Here's a quick recap of what we discussed:

• Model: [model discussed]
• Estimated price: [price range]
• Timeline: [timeline]
• Next step: [agreed next step]

I'll send over [requested materials] by [date].

Let me know if you have any questions in the meantime.

Best,
MassDwell Team
(781) 531-8593
```

### DNC Check:
Before any outreach action (email template launch, log call), check lead email/phone against `dnc_list` Supabase table. If match found → show red "⛔ DNC — Do Not Contact" badge and disable outreach actions.

### Kommo CRM integration:
- Pull leads: `GET /leads?limit=50&with=contacts,pipeline`
- Log note: `POST /leads/{id}/notes`
- Move stage: `PATCH /leads/{id}`
- Auth: `Authorization: Bearer {KOMMO_API_TOKEN}`
- Base: `https://massdwellcrm.kommo.com/api/v4`

---

## MODULE 5 — RE-LISTING OPTIMIZER

AI tool for Alpine Property Group — generates optimized MLS listing descriptions.

### What it does:
- Input form: address, beds/baths, sqft, key features, neighborhood notes, list price, property type
- Submits to `/api/generate-description` → AI-generated MLS description
- User can regenerate or edit inline
- "Enhance" mode: paste existing description → AI rewrites it
- Save to Supabase history
- Usage tracking

### AI Prompt (system prompt for description generation):
```
You are an expert real estate copywriter specializing in the Greater Boston and Massachusetts market. Write compelling MLS listing descriptions that appeal to both owner-occupants and investors.

Guidelines:
- Lead with the most compelling feature
- Mention Boston-area location advantages (commute, schools, neighborhood)
- Note ADU potential where lot size / zoning permits it (a growing priority for MA buyers)
- Investor-relevant: mention rental income potential where appropriate
- Keep to 150–250 words (MLS limit)
- Professional tone, no ALL CAPS, no exclamation overuse
- End with a call to action

Property details will be provided. Generate a polished, ready-to-use MLS description.
```

### Supabase schema:
```sql
create table listings (
  id uuid default gen_random_uuid() primary key,
  address text,
  inputs jsonb default '{}',
  generated_description text,
  enhanced_description text,
  created_at timestamptz default now()
);
```

---

## TECH STACK

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Clerk (per-user, invite-only, email/password + Google SSO)
- **External APIs:** Kommo CRM, OpenAI (GPT-4)
- **Deployment:** Vercel (team: `steve-vettoris-projects`)

---

## ENVIRONMENT VARIABLES

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Clerk publishable key
CLERK_SECRET_KEY=                    # Clerk secret key
NEXT_PUBLIC_SUPABASE_URL=            # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Supabase anon key
KOMMO_API_TOKEN=                     # Kommo CRM bearer token
OPENAI_API_KEY=                      # OpenAI GPT-4
```

---

## ROUTES

```
/                      → redirect to /dashboard (authed) or /sign-in
/sign-in               → Clerk sign-in page
/sign-up               → disabled (invite-only via Clerk dashboard)
/dashboard             → Module 1 — Dashboard + full Sales Cheat Sheet
/cogs                  → Module 2 — COGS Calculator (project list)
/cogs/[id]             → Individual project detail
/permits               → Module 3 — ADU Permit Navigator
/leads                 → Module 4 — ADU Tools / Lead Pipeline
/re-listing            → Module 5 — Re-Listing Optimizer
/re-listing/[id]       → Saved listing detail
```

---

## FULL SUPABASE SCHEMA

```sql
-- COGS Calculator
create table cogs_projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  model text not null,
  costs jsonb default '{}',
  list_price numeric,
  include_deck boolean default true,
  total_cogs numeric,
  margin numeric,
  status text default 'estimated',
  created_at timestamptz default now()
);

-- Re-Listing Optimizer
create table listings (
  id uuid default gen_random_uuid() primary key,
  address text,
  inputs jsonb default '{}',
  generated_description text,
  enhanced_description text,
  created_at timestamptz default now()
);

-- DNC List
create table dnc_list (
  id uuid default gen_random_uuid() primary key,
  email text unique,
  phone text,
  reason text,
  added_at timestamptz default now()
);
```

---

## DESIGN REQUIREMENTS

- **Mobile responsive** — sidebar collapses to hamburger
- **Sidebar background:** Deep Navy `#011832`
- **Sidebar secondary / hover states:** Admiral Blue `#132c49`
- **Sidebar subtle text / dividers:** Soft Denim `#445970`
- **Main content area:** Pure White `#ffffff`
- **MassDwell logo** top-left in sidebar (use placeholder if needed)
- **Active nav item:** Admiral Blue `#132c49` background with white text
- **Loading states** on all data fetches (skeleton loaders preferred)
- **Error handling** — if Kommo API is down, show cached/empty state with "Unable to load leads" message
- **Toast notifications** for success/error actions (save, note logged, etc.)
- **Invite-only** — no public sign-up; admin invites team members via Clerk dashboard

---

## DELIVERABLE

A single, production-quality Next.js app with all 5 modules deployed to Vercel. Per-user Clerk auth, Supabase backend, Kommo CRM integration, OpenAI for Re-Listing Optimizer. Built for a small internal team of 5–10 people. Clean, fast, mobile-friendly.
