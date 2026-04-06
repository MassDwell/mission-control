# MEMORY.md - Clawson's Long-Term Memory

_Curated knowledge and lessons learned. Daily logs are in memory/YYYY-MM-DD.md_

---

## Who I Am

**Name:** Clawson  
**Role:** Master Agent / COO  
**Entity:** 🦅  
**Style:** Executive, direct, organized. Workstreams and deliverables.

---

## Who I Work For

**Steve Vettori** — Principal of three businesses, all based in **Needham, MA**:

1. **MassDwell Solutions** (Primary) — Modular ADU manufacturer
   - Website: massdwell.com
   - HQ: 109 Highland Ave, Suite 203, Needham, MA 02494
   - Tagline: "Stress Less. Dwell More." / "Where Life Fits"
   - Founded: 2025 | Employees: 9
   - CRM: GoHighLevel (switched Apr 2026)
   - Email: sales@massdwell.com
   - Factory: Woonsocket, RI — 870 Park East Drive (substantially complete June 2026)
   - Entity structure: MassDwell Solutions + AAC Steel (factory assets) + Atomic Ant Construction (financed equipment ~$400K payoff) — AAC Steel merging into MassDwell pre-investment
   - Founder investment to date: ~$1.1M (not being reimbursed)

2. **Atlantic Laser Solutions** (Secondary) — Laser welding equipment
   - Website: atlanticlasersolutions.com
   - Product: Theo MA1 Series

3. **Alpine Property Group** (Foundation) — Real estate investment
   - Website: alpinepropertygroupllc.com
   - Focus: Greater Boston multi-family

---

## Key People

| Name | Role | Contact |
|------|------|---------|
| Steve Vettori | Principal/CEO | steve.vettori@massdwell.com, Telegram: 7002178651, Cell: +17816035561 |
| Carlos Ferreira | CTO, MassDwell | PE #15727, carlos.ferreira@aacsteel.com (Newton, MA) |
| Nick Ferreira | Sales, MassDwell | nick.ferreira@massdwell.com, Telegram: 8499995581 |
| Jon Proctor | Employee, MassDwell | jon.proctor@massdwell.com |
| Thayana Fernandes | AAC Steel | thayana.fernandes@aacsteel.com |
| Patricia Ferreira | Founding Partner (woman-owned minority lead) | patricia.luna@aacsteel.com |
| Chris Bradley | MassDwell | chris.bradley@massdwell.com |

---

## Retired Systems (Tombstones)

- **VAPI / Sarah** — ❌ Decommissioned 2026-03-28
- **Kommo CRM** — ❌ Replaced by GoHighLevel 2026-04-03
- **MeritLayer** — ❌ Cancelled 2026-03-13 (domain meritlayer.ai kept by Steve)
- **Money Printer / Trading** — ❌ Deactivated 2026-03-04. No active trading strategy.
- **Hermes agent** — ❌ Fully removed 2026-04-04 (LaunchAgent killed, registry cleaned)
- **MetaClaw** — ❌ Removed 2026-04-02

---

## Active Integrations

### CRM — GoHighLevel
- **URL:** https://app.gohighlevel.com
- **Status:** Active

### Google Workspace (sales@massdwell.com)
- **Gmail:** Connected. ⚠️ OAuth tokens need reauth (401 errors as of 2026-04-05)
- **Tokens:** credentials/google/gmail-token.json (expired)
- **Steve action needed:** `gog auth add vettoristeve@gmail.com --services gmail`

### Instagram Graph API (@massdwell)
- **App ID:** 1924020471822536 | **Instagram ID:** 17841473454409261
- **Status:** READ only (posting requires App Review)
- **Credentials:** credentials/meta/instagram-api.json

---

## MassDwell — Current State (April 2026)

### Raise
- **Instrument:** Post-Money SAFE (YC Standard)
- **Raising:** $1M–$5M | **Valuation Cap:** $20M post-money | **No discount**
- **Min investment:** $100K
- Ownership at cap: $100K→0.5%, $250K→1.25%, $500K→2.5%, $1M→5%
- **$600K committed — closing week of 2026-04-06** ✅
- Strategy: close $1M minimum first, keep round open via SAFE for more
- Several large investors near finish line

### Traction (Q1 2026)
- **Q1 Revenue:** $979K (4 closed deals)
- **Pipeline:** 739 active opportunities, $25.3M total value
- **Hot prospects:** Mattapoisett $205K (waiting on lawyer), Andover $307K (verbal), Brookline $340K (verbal), Lexington $200K (closed), Westwood $150K (3-6 mo), Town of Sudbury $4M RFP
- **Marketing efficiency:** $14.26 CPL on Meta, $20.04 CPA, 4.41% CTR, $561 total ad spend in March
- 70%+ web traffic from Massachusetts

### Product Line (InHabit System)
- **1,296+ configurations** across 12 base floor plans
- Shapes: Box, L, Square | Floors: Basement, Garage, 2-Floor | Styles: Modern, New England, Cottage
- 4 base models: Essential (471sf 1/1 $141K), Classic (575sf 2/1 $172K), Deluxe (600sf 2/1 $186K), Prime (900sf 2/2 $270K)
- All at ~$300/sqft, all-in turnkey (design, permit, factory, install)
- **The Vault:** Stores structural drawings from every build → design cost near zero on repeats
- Customer ROI: $2,500–3,500/mo rental income, 12–15% cash-on-cash, $100K+ property value increase

### Technology Stack
- **InHabit:** AI configurator — natural language input → floor plan → BOM → factory production order
- **Zoning intelligence layer:** municipal permitting navigator (live at massdwellhub.com/permits)
- **CFS framing:** CNC roll-formed cold-formed steel studs, ±0.5mm tolerance
- **Vitrus robotics:** VLM-controlled robotic wall assembly (see Smart Factory section)

### Factory Phases
| Phase | Status | GM | Notes |
|-------|--------|----|-------|
| 1A Panelized | ✅ Current | 33% | Panels ship flat, MEP/finish on-site |
| 1B Full Volumetric | 🎯 Target Jul-Aug 2026 | 50% | BBRS certification required |
| 2 Vitrus Robotics | 🎯 2028 | 60% | 300–400+ units/yr capacity |

**BBRS Certification** (780 CMR 110.R3) is the gating item for Phase 1A→1B transition. QA Manual QAM-2026-001 filed.

### Financial Projections
| Year | Units | Revenue | Gross Margin | EBITDA |
|------|-------|---------|--------------|--------|
| 2026 | 28 | $5M | 33% | ~Breakeven |
| 2027 | 40 | $8M | 50% | $1.5M |
| 2028 | 100 | $20M | 60% | $6M |
| 2029 | 200 | $50M | 60% | $18M |
| 2029 upside | 400+ | $78M | 60% | — |

### Team (9 people)
- Steve Vettori — Co-Founder & CEO (10+ yrs RE dev, Alpine Property Group)
- Carlos Ferreira — Co-Founder & CTO (PE #15727, 30+ yrs structural/construction)
- Patricia Ferreira — Founding Partner (woman-owned minority lead)
- 3 Production, 2 Sales, 2 Operations

### Use of Funds ($5M SAFE)
- 50% — Factory & Vitrus Robotics
- 25% (13-15%) — InHabit AI platform
- 25% (15-20%) — Team & Ops + working capital

### Competitive Moats
1. **Geographic** — National players (Boxabl, Villa, Abodu) are 3,000+ miles away; shipping economics make them uncompetitive in MA
2. **Technology** — First Northeast manufacturer with robotic assembly
3. **Regulatory** — Permitting intelligence layer as municipal knowledge moat
4. **Vertical integration** — Design + permit + factory + install under one roof

### Market Context
- MA Affordable Homes Act (2024): ADUs by-right in 177 MBTA communities
- 1,224 ADUs approved in first year across 217 communities
- State projects 8,000–10,000 new ADUs over 5 years
- $30M+ in state programs: MassHousing $20M ADU loan (Spring 2026), MHP $10M incentive
- Global ADU market: $18B (2024) → $43.35B (2034) at 9.19% CAGR

## Sales Pipeline

**Status:** GoHighLevel CRM (switched Apr 3, 2026)

See hot prospects in "MassDwell — Current State" section above

---

## Key Documents (Updated April 2026)

| Document | Version | Location |
|----------|---------|----------|
| Investor Deck | v5 | Telegram inbound PDF |
| Investment Thesis | v2 | Telegram inbound PDF |
| Due Diligence Packet | v2 | Telegram inbound PDF |
| SAFE Explainer | Mar 2026 | Telegram inbound PDF |
| Investor Reference / Talk Track | Mar 2026 | Telegram inbound PDF |
| Smart Factory / Vitrus Deck | Mar 2026 | Telegram inbound PDF |
| Factory Master Plan | v2 Apr 2026 | Telegram inbound PDF |
| Factory Operations Training | v1.1 Apr 2026 | Telegram inbound PDF |
| QA Manual (BBRS) | QAM-2026-001 | Telegram inbound PDF |
| CFS Assembly Best Practices Guide | Apr 2026 | Telegram inbound DOCX |
| InHabit Slide Deck | Apr 2026 | Telegram inbound PDF |
| Lookbook | 2026 | Google Drive |
| Contract Template | Jan 2026 | Google Drive |

---

## Core Directive

**#1 Goal: Make Steve's businesses thrive.**

**Primary focus:**
- MassDwell (modular ADU manufacturing)
- Atlantic Laser Solutions (laser welding equipment distribution)
- Alpine Property Group (real estate investment & development)

**Secondary focus (New - 2026-03-04, updated 2026-04-02):**
- **Moonshot research** — Global AI SaaS opportunity scanning executed as `moonshot_mode` research worker runs

Secondary focus:
- Optimize operations
- Support strategic decision-making
- Coordinate complex projects

---

## Standing Instructions

1. **External comms require approval** — Draft only for emails, posts, client outreach
2. **Don't change active browser window** — Open new windows instead
4. **Finance/deal models:** Agent builds → Clawson validates → Steve approves
5. **Include X in business research** — For company news, market intel, and competitive analysis
6. **Read WORKING.md first** — On every session start
7. **Check @mentions** — Scan data/global/mentions.json
8. **COST DISCIPLINE:**
   - **Opus:** Complex analysis, strategic decisions, creative work ONLY
   - **Sonnet:** General operations, writing, coordination
   - **Haiku:** Routine checks, simple tasks
   - Default to cheapest model that handles the task
9. **MODEL ROUTING:** Use the intelligent router before spawning subagents — `node ~/.openclaw/workspace/tools/model-router/spawn.mjs "task" --model-only`

---

## Runtime Architecture (Updated 2026-04-02 — Runtime v1)

**Status:** Single Orchestrator + Structured Worker Runs

**What is real and running:**
- **Clawson** — sole orchestrator, main session, Telegram-facing
- **Claude Code subprocess** — worker tool for heavy coding/implementation tasks
- **Execution modes** — task profiles that configure how a worker run is scoped

**Execution modes:**
- `codesmith_mode` — software implementation, debugging, deployment
- `moonshot_mode` — venture research, opportunity analysis, ideation
- `research_mode` — web research, market intel, summarization

**Job ledger (SSOT):** `data/runtime/job-ledger.jsonl`

---

## Model Stack (Updated 2026-04-05)

**OpenRouter key wired. Venice key active (Dolphin free tier).**

| Role | Model | Cost |
|---|---|---|
| Default agent | Claude Sonnet 4.6 | $3/M |
| Fallback | Gemini 2.5 Flash | $0.30/M |
| Coding (routed) | DeepSeek V3 | $0.20/M |
| Reasoning | DeepSeek R1 | $0.45/M |
| Long docs/multimodal | Gemini 2.5 Pro | $1.25/M |
| Sales/copy (uncensored) | Dolphin (Venice) | Free |
| Legal/blunt analysis | Hermes 3 70B | $0.40/M |
| Research/summarization | Llama 3.3 70B | $0.12/M |
| Highest stakes | Claude Opus | $15/M |

Router: `tools/model-router/spawn.mjs` — auto-classifies tasks, picks optimal model.

---

## Cron Jobs Active (2026-03-04)

| Schedule | Job | Status |
|----------|-----|--------|
| Every 30 min | Gmail Token Auto-Refresh | ✅ ACTIVE |
| Every 2 hours | Mission Control Cron Export | ✅ ACTIVE |
| Sundays 8 PM | Weekly Memory Maintenance | ✅ SCHEDULED |
| 1st/15th 10 AM | Bi-Weekly Memory Audit | ✅ SCHEDULED |

---

## DrawStack Analytics & Search

**Google Search Console:** ✅ Live — vettoristeve@gmail.com, drawstack.ai property
**Google Analytics GA4:** ✅ Live — drawstack.ai (already integrated)
**X (Twitter):** @TheDrawStack — app registered as "drawstack" via xurl (2026-03-27)

---

## MassDwell Hub — Allowlist Contacts (2026-04-03)

| Name | Email |
|------|-------|
| Steve Vettori | steve.vettori@massdwell.com |
| Nick Ferreira | nick.ferreira@massdwell.com |
| Jon Proctor | jon.proctor@massdwell.com |
| Chris Bradley | chris.bradley@massdwell.com |
| Carlos Ferreira | carlos.ferreira@aacsteel.com |
| Thayana Fernandes | thayana.fernandes@aacsteel.com |
| Patricia Luna | patricia.luna@aacsteel.com |

---

## MassDwell Smart Factory — Vitrus Robotics (2026-04)

**Deck:** "Smart Factory: AI-Powered Robotic Manufacturing" — Investor Deep Dive, March 2026

### The Strategy
Factory manufacturing with AI-controlled robotics = structural competitive moat. Every unit produced makes the next cheaper and faster. Goal: 80-100 units/year capacity, ±0.5mm precision, 1-month production vs. 6-7 months for competitors.

### Vitrus (Robotic Partner)
- **Founder:** Lucas Cassiano — ex-Google, ex-Vicarious AI, South Park Commons Founder Fellow (SF)
- **Product:** Custom VLM-controlled robotic arms trained on human movements. Closed-loop: hardware + software + AI + maintenance.
- **Why Vitrus:** Purpose-built for HIGH-MIX / LOW-VOLUME — perfect for MassDwell's 4 ADU models.
- **Hardware built in California** — no overseas dependencies
- **Current platform:** R-04 (20 motors, 8 lb payload, in use at Vitrus labs)
- **Next platform:** RT-4 (26 motors, 12+ lb payload, 100+ lb total) — deploying to MassDwell Woonsocket

### Factory Location
**Woonsocket, RI** — Phase 1 factory. Manual assembly from day one; Vitrus automation is an upgrade layer.

### Deployment Roadmap
| Phase | Timeline | Cost |
|-------|----------|------|
| Initial Consultancy (industrial design + conceptual) | Feb-Mar 2026 | $35K |
| Proof of Concept (factory POC at Woonsocket) | June 2026 | $300K |
| Evaluation (onsite eval + training) | Nov 2026 | $150K |
| **Phase 1 Total** | | **$1.05M** |
| Phase 2: Storage Automation (AMRs) | Est. 2027 | $250-300K + AMRs <$50K each |

### Humanoid Robot Outreach (2026-04-05)
Steve emailed **Agility Robotics**, **Figure**, and **Apptronik** to explore purchasing or piloting humanoid robots for the MassDwell factory floor. Awaiting BD responses. Strategy: use as non-assembly-line support (material staging, kitting, cleanup, QC assist). Target: 2027 pilot as co-development partner.

---

## Paperclip (Updated 2026-04-02 — Runtime v1)

**Status:** ✅ OPERATIONAL — Demoted to presentation layer (downstream view only)

**Architecture:**
- Paperclip frontend: ports 3100/3101
- Keepalive cron: healthy (every 30 min)

**State authority:** `data/runtime/job-ledger.jsonl` — canonical job state. Paperclip is downstream view.

---

## Security Incident — 2026-02-06

**What happened:** Installed `openclaw-trading-assistant` from ClawHub — contained crypto wallet transfer scripts. Caught before activation.

**Rule:** ClawHub downloads require vetting. Before installing any skill: check author reputation, review scripts for wallet/transfer/exfil code, confirm it matches the request.

---

## Lessons Learned (Week of 2026-03-23 to 2026-03-29)

- **Squash merges silently drop Prisma migration folders** — Always audit with `node /path/to/audit-migrations.js` after every squash merge to DrawStack main. This hit 4x in one day.
- **Neon DB needs explicit migrations applied after schema changes** — `prisma migrate deploy` must run after every merge, even if build succeeds.
- **GoDaddy API restricts automated DNS to accounts with 10+ domains** — Cannot programmatically update DNS on accounts with fewer than 10 domains. Manual DNS update required.

## Lessons Learned (Week of 2026-03-30+)

- **Squash merges silently drop Prisma migration folders** — see above
- **DrawStack raw detail page crashed** — `workCompletedFromPrevious` (Column D) must be computed from prior approved/funded draws before passing to DrawDetail component
- **Both user accounts had `role=LENDER` in DB** — fixed to `role=GC` (8 PM)
- **S3 presigned URL 403** — Content-Type must match exactly between sign and upload

## Lessons Learned (Week of 2026-03-30 to 2026-04-05)

- **MassDwell Hub CRM switch: Kommo → GoHighLevel (2026-04-03)** — Any CRM integrations should target GHL API.
- **Clerk v7 auth.protect() in allowlistOnly mode returns 404** — Must set `NEXT_PUBLIC_CLERK_SIGN_IN_URL` env var or unauthenticated users hit 404 instead of redirect.
- **Supabase API routes must use service role key** — Anon key blocked by RLS. Always use `SUPABASE_SERVICE_ROLE_KEY` in `/api/` routes.
- **GCP OAuth client type matters** — Desktop app clients don't support web redirect URIs. Always create "Web application" type for Clerk.
- **GoDaddy API restricts automated DNS** — <10 domains on account = manual only.
- **Self-improving agent capture layer installed** — `.learnings/` is first-write destination for errors/corrections. `memory/LESSONS.md` is promotion-only tier.

---

## MassDwell Hub

**Domain:** massdwellhub.com  
**Status:** ✅ LIVE — https://massdwellhub.com  
**Stack:** Next.js 14, Tailwind + shadcn/ui, Supabase (service role for API routes), Clerk (restricted/allowlist), Vercel  
**Auth:** Clerk restricted mode — allowlist only (see Allowlist Contacts section)  
**CRM:** GoHighLevel — app.gohighlevel.com  

**Live modules:**
- Dashboard / Sales Cheat Sheet
- Build Cost Tracker (COGS)
- ADU Permit Navigator (Massachusetts towns)
- Contracts
- Trade Partner Program

**Key fixes applied (2026-04-03/04):**
- GCP OAuth: Web app client (not Desktop) required for Clerk redirect URIs
- Clerk 404 fix: NEXT_PUBLIC_CLERK_SIGN_IN_URL env var required for redirect
- COGS save: float margin rounded before writing to integer DB column
- All API routes use Supabase service role key (not anon key — blocked by RLS)

---

## MassDwell Trade Partner Program (2026-04-05)

**Program name:** MassDwell Pro  
**Status:** Strategy defined, website addition in progress (marketing team has the brief)  
**Doc:** data/massdwell/trade-partner-program-doc.md + MassDwell-Pro-Trade-Partner-Program.docx

**Key facts:**
- MassDwell builds ANY modular structure — ADUs, single-family, multi-family, mixed-use (not just ADUs)
- **Tier 1 Referred:** $5,000 flat referral fee per unit at close, no commitment
- **Tier 2 Preferred:** 2+ referrals/year, co-branded materials, priority scheduling
- **Tier 3 Certified:** 5+ units/year, listed on massdwell.com, white-label, preferred pricing
- Website page: `/trade` — "Build With MassDwell"
- Target: GCs, builders, residential/commercial developers

---

## Global Sourcing Guide (2026-04-05)

**Doc:** data/massdwell/GLOBAL-SOURCING-GUIDE.md  
**Estimated savings:** ~$11,800/unit at container volume → ~$472K annual at 40 units

| Category | Source | Primary Supplier |
|---|---|---|
| Mini-split HVAC | 🇨🇳 China | Midea Group |
| Kitchen cabinets | 🇻🇳 Vietnam | An Cuong Wood Working |
| LVP flooring | 🇻🇳 Vietnam | Wellmade |
| Plumbing (standard) | 🇲🇽 Mexico | Helvex |
| Plumbing (premium) | 🇮🇳 India | Jaquar Group |
| Lighting | 🇲🇽 Mexico | Leviton Mexico |

Implementation: Start supplier conversations Q2 2026, first container Q1 2027.
