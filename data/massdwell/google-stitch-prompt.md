# MassDwell — Internal Sales & Ops Hub
## Google Stitch Build Prompt

---

## OVERVIEW

Build a unified, password-protected internal web application called **"MassDwell Hub"** for MassDwell's sales and operations team. This is a single URL (`hub.massdwell.com`) that houses all internal tools in one clean dashboard. Sales reps and ops staff log in once and access everything from a sidebar.

**Brand:** MassDwell — modern, professional, clean. Primary color: deep navy (#1B2A47). Accent: bright green (#4CAF50). Font: Inter. Logo top-left on all pages.

**Auth:** Per-user accounts via Clerk. Each team member has their own login (email/password or Google SSO). Admin users can invite new members. No public sign-up — invite-only.

---

## NAVIGATION STRUCTURE

Left sidebar with these 5 modules. Default landing page: **Dashboard**.

1. 📊 Dashboard (home overview)
2. 💰 COGS Calculator
3. 🏗️ ADU Permit Navigator
4. 📋 ADU Tools (Lead/Pipeline)
5. 🔁 Re-Listing Optimizer

---

## MODULE 1 — DASHBOARD (Home)

A landing page that gives the team a quick pulse on the business.

**Sections:**
- **Model Pricing Cards** — 4 cards, one per ADU model. Each shows: model name, sqft, beds/baths, starting price. Data:
  - Dwell Essential: 470 sqft | 1bd/1ba | $141,000
  - Dwell Classic: 565 sqft | 2bd/1ba | $172,000
  - Dwell Deluxe: 594 sqft | 2bd/1ba | $186,000
  - Dwell Prime: 892 sqft | 2bd/2ba | $270,000
- **Quick Links** — buttons linking to each module
- **Company Info** — massdwell.com | sales@massdwell.com | Needham, MA

---

## MODULE 2 — COGS CALCULATOR

A project-level cost tracking and margin analysis tool. Backed by Supabase.

**What it does:**
- Create a new project by selecting an ADU model (Essential, Classic, Deluxe, Prime)
- Each project tracks cost line items across 10 categories:
  - 🏗️ Structure (Steel) → Steel Material, Steel Labor
  - ⚡ Electrical → Electrical Package
  - ❄️ HVAC → Mini Split System
  - 🏠 Roofing → Shingles (GAF), Roofing Labor
  - 🍳 Kitchen → Cabinets, Countertops
  - 🚿 Bathroom → Vanity, Toilet
  - 🚜 Site Prep & Foundation → Site Preparation, Foundation, Permits & Fees, Grading & Excavation
  - 🔌 Utilities → Water & Sewer, Electric Service, Gas Service
  - 📋 Overhead → Project Management, Insurance & Bonding, General Conditions
  - 🛡️ Contingency → Contingency Reserve
- Each line item has: **Estimated** and **Actual** cost fields
- Auto-calculates: Total COGS, Gross Margin %, Variance (actual vs estimated)
- Color-coded alerts: green if margin > 20%, yellow if 10–20%, red if < 10%
- Project statuses: Estimated → In Progress → Completed → Closed
- Optional: toggle to include/exclude deck in the project
- Analytics dashboard showing margin trends across all projects

**Data model (Supabase table: `cogs_projects`):**
```
id, name, model, costs (jsonb), list_price, include_deck, total_cogs, margin, status, created_at
```

**Default cost estimates auto-populate** when a model is selected (based on sqft). User can override any line item.

---


## MODULE 3 — ADU PERMIT NAVIGATOR

A tool to help the sales team walk through Massachusetts ADU permitting requirements by town.

**What it does:**
- Sales rep enters a property address or selects a Massachusetts municipality
- Tool displays: typical permit timeline, required documents checklist, zoning notes, known complexity level (Easy / Moderate / Complex)
- Tracks which towns MassDwell has previously permitted in (via Kommo CRM API or static data)
- Lead lookup: enter an address and see if there's a matching Kommo CRM contact

**Data:** Pull from Kommo CRM API using token `KOMMO_API_TOKEN` (env var). Fallback to static Massachusetts ADU zoning data if API unavailable.

**Key Massachusetts ADU rules to encode (as static reference):**
- ADUs are allowed by-right statewide under MA 2024 ADU law
- Still requires building permit in every town
- Common additional requirements: septic capacity letter, HOA approval, historic district review
- Typical timeline: 4–12 weeks depending on town

**UI:**
- Search bar at top
- Town card with: timeline estimate, complexity badge, checklist of required docs, notes field
- "Has MassDwell worked here?" indicator

---

## MODULE 4 — ADU TOOLS (Lead & Pipeline)

A lightweight sales pipeline tool connected to Kommo CRM.

**What it does:**
- Pull and display open leads from Kommo CRM (using `KOMMO_API_TOKEN`)
- Show lead cards: name, contact info, ADU model interest, pipeline stage, last activity
- Quick actions: log a note, mark as contacted, move to next stage
- Filter by pipeline stage, model interest, assigned rep
- Lead scoring: tag leads as Hot / Warm / Cold based on recency of contact

**Kommo CRM integration:**
- Base URL: `https://massdwellcrm.kommo.com/api/v4`
- Auth: Bearer token from `KOMMO_API_TOKEN` env var
- Endpoints used: `/leads`, `/contacts`, `/leads/{id}/notes`

**Also includes:**
- Email template launcher: pre-fill follow-up email templates for common scenarios (initial inquiry, quote sent, follow-up #2, etc.)
- DNC list check: before any outreach, check against DNC list (static JSON or Supabase table)

**Email templates (pre-built):**
1. Initial inquiry response
2. Quote delivery
3. 3-day follow-up
4. 2-week re-engagement
5. Permit timeline update

---

## MODULE 5 — RE-LISTING OPTIMIZER

An AI tool for Alpine Property Group — generates optimized MLS listing descriptions.

**What it does:**
- Input form: property address, beds/baths, sqft, key features, neighborhood notes, price
- Submits to `/api/generate-description` → returns AI-written MLS description
- User can regenerate or edit inline
- Save listing history to Supabase (`listings` table)
- "Enhance" mode: paste an existing description → AI rewrites it
- Usage tracking per session

**Data model (Supabase):**
- `listings`: id, address, inputs (jsonb), generated_description, created_at
- Usage metering via `/api/usage` endpoint

**AI:** Use OpenAI GPT-4 (or env var `OPENAI_API_KEY`). Prompt should emphasize: Boston/Greater Boston market context, investor appeal, ADU potential where applicable.

---

## TECH STACK

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Supabase (PostgreSQL)
- **Auth:** Clerk (per-user accounts, invite-only, email/password + Google SSO)
- **Deployment:** Vercel (team: `steve-vettoris-projects`)
- **External APIs:** Kommo CRM, OpenAI

---

## ENVIRONMENT VARIABLES NEEDED

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk publishable key
CLERK_SECRET_KEY=                   # Clerk secret key
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon key
KOMMO_API_TOKEN=                    # Kommo CRM bearer token
OPENAI_API_KEY=                     # OpenAI for re-listing optimizer
```

---

## DESIGN REQUIREMENTS

- **Mobile responsive** — reps use phones in the field
- **Sidebar collapses** to hamburger on mobile
- **Dark header/sidebar** (navy #1B2A47), white main content area
- **MassDwell logo** top-left in sidebar
- **Active nav item** highlighted with green accent (#4CAF50)
- **Loading states** on all data fetches
- **Error handling** — if Kommo API is down, show cached data or graceful fallback
- **Invite-only** — no public sign-up; admin invites team members via Clerk dashboard

---

## PAGES / ROUTES

```
/                    → redirect to /dashboard (if authed) or /sign-in
/sign-in             → Clerk sign-in page
/sign-up             → disabled (invite-only via Clerk dashboard)
/dashboard           → Module 1 (home)
/cogs                → Module 2
/cogs/[id]           → individual project detail
/permits             → Module 3
/leads               → Module 4
/re-listing          → Module 5
/re-listing/[id]     → saved listing detail
```

---

## SUPABASE SCHEMA (run in SQL editor)

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

## DELIVERABLE

A single deployable Next.js app with all 5 modules, a unified sidebar layout, Supabase integration, and Vercel-ready configuration. Should be production-quality but built for a small internal team (5–10 users). Per-user Clerk accounts, invite-only.
