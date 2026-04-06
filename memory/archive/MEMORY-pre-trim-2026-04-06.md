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
| Carlos Ferreira | CTO, MassDwell | (Newton, MA) |
| Nick Ferreira | Sales, MassDwell | nick.ferreira@massdwell.com, Telegram: 8499995581 |
| Jon Proctor | Employee, MassDwell | jon.proctor@massdwell.com |
| Thayana Fernandes | AAC Steel | thayana.fernandes@aacsteel.com |

---

## VAPI Voice AI — DECOMMISSIONED (2026-03-28)

**Status:** ❌ RETIRED — Sarah (MassDwell lead qualifier) decommissioned per Steve's decision.

All VAPI infrastructure removed:
- `skills/vapi-calls/` deleted
- `.env` VAPI keys removed (VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID, WEBHOOK_BASE_URL)
- `credentials/twilio/massdwell-sarah.json` deleted
- No active VAPI cron jobs (none existed in live scheduler)

---

## Active Integrations

### CRM — GoHighLevel (switched 2026-04-03)
- **Platform:** GoHighLevel
- **URL:** https://app.gohighlevel.com
- **Status:** Active — MassDwell migrated from Kommo to GHL

### Kommo CRM (RETIRED)
- **Status:** ❌ REPLACED by GoHighLevel (2026-04-03)

### Google Workspace (sales@massdwell.com)
- **Connected:** 2026-02-02
- **Gmail:** 2,327 messages, read/send/modify
- **Calendar:** Connected, low usage
- **Drive:** 100 files indexed, 8.4GB used
- **Tokens:** credentials/google/gmail-token.json

### Instagram Graph API (@massdwell)
- **Connected:** 2026-02-03
- **App ID:** 1924020471822536
- **Instagram ID:** 17841473454409261
- **Followers:** 217, Posts: 9
- **Permissions:** instagram_basic, public_profile
- **Status:** READ access verified, posting requires App Review
- **Credentials:** credentials/meta/instagram-api.json

---

## MassDwell — Current State (April 2026)

### Raise
- **Instrument:** Post-Money SAFE (YC Standard)
- **Raising:** $1M–$5M | **Valuation Cap:** $20M post-money | **No discount**
- **Min investment:** $100K
- Ownership at cap: $100K→0.5%, $250K→1.25%, $500K→2.5%, $1M→5%
- If Series A at $100M → 5x return for SAFE holders
- Founders invested ~$1.1M to date; not being reimbursed

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
  - 5 expansion domains (AI Learning, AI Tooling, Vertical AI, Business Operations, Founder Tools)
  - Evidence-driven discovery (Reddit, Indie Hackers, founder communities)
  - Target: $10K-$100K+ MRR AI SaaS products
  - Execution: Clawson dispatches research worker run in moonshot_mode → produces opportunity brief → Steve approves → Clawson dispatches build via codesmith_mode Claude Code subprocess
  - NOTE: Moonshot is an execution MODE, not a persistent agent. No autonomous session or memory.

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

---

## Runtime Architecture (Updated 2026-04-02 — Runtime v1)

**Status:** Single Orchestrator + Structured Worker Runs

**What is real and running:**
- **Clawson** — sole orchestrator, main session, Telegram-facing
- **Claude Code subprocess** — worker tool for heavy coding/implementation tasks
- **Execution modes** — task profiles that configure how a worker run is scoped (NOT agents)

**Execution modes (defined in canon/system/runtime-v1/execution-modes.json):**
- `codesmith_mode` — software implementation, debugging, deployment
- `moonshot_mode` — venture research, opportunity analysis, ideation
- `audit_mode` — code review, security audit, QA passes
- `research_mode` — web research, market intel, summarization
- `fix_mode` — targeted hotfix, minimal blast radius

**What is NOT real:**
- Codesmith, Moonshot, Personal Assistant are archived mode definitions, not persistent agents
- No multi-agent dispatch. No agent swarm. No autonomous subagents.

**Job ledger (SSOT):** `data/runtime/job-ledger.jsonl`
**Governance:** `canon/system/runtime-v1/GOVERNANCE.md`
**Reporting rules:** `canon/clawson/reporting-rules.md`

---

## Cron Jobs Active (2026-03-04)

| Schedule | Job | Status |
|----------|-----|--------|
| Every 30 min | Gmail Token Auto-Refresh | ✅ ACTIVE |
| Every 2 hours | Mission Control Cron Export | ✅ ACTIVE |
| Sundays 8 PM | Weekly Memory Maintenance | ✅ SCHEDULED |
| 1st/15th 10 AM | Bi-Weekly Memory Audit | ✅ SCHEDULED |

**Money Printer jobs:** DELETED (2026-03-04)

---

## Trading Platform

**Status:** NO ACTIVE TRADING STRATEGY

Money Printer (geopolitical trading on Iran escalation) was deactivated on 2026-03-04.

For future trading activity, platforms available:
- Alpaca API (paper trading credentials preserved)
- Interactive Brokers (IBKR) — Pending approval if needed

---

## EMAIL SYSTEM

**Status:** Email processing disabled (no CRM integration available)

Manual review of sales@massdwell.com inbox only.

**DNC List preserved:** `data/massdwell/sales/do-not-contact-list.json`

---

## Kommo CRM

**Status:** ❌ NO ACCESS — Credentials deleted 2026-03-04

All CRM integration suspended. Manual management only.

---

## Key Vendors

**3D Modeling:** GPI Models — Creating 3D visualizations for MassDwell ADUs. Carlos providing CAD drawings.

**Robotics / Automation:** Vitrus — AI-powered robotic arms for factory wall assembly. See full section below.

---

## MassDwell Smart Factory — Vitrus Robotics (2026-04)

**Deck:** "Smart Factory: AI-Powered Robotic Manufacturing" — Investor Deep Dive, March 2026

### The Strategy
Factory manufacturing with AI-controlled robotics = structural competitive moat. Every unit produced makes the next cheaper and faster. Goal: 80-100 units/year capacity, ±0.5mm precision, 1-month production vs. 6-7 months for competitors.

### Vitrus (Robotic Partner)
- **Founder:** Lucas Cassiano — ex-Google, ex-Vicarious AI, South Park Commons Founder Fellow (SF)
- **Product:** Custom VLM-controlled robotic arms trained on human movements. Closed-loop: hardware + software + AI + maintenance.
- **Why Vitrus:** Purpose-built for HIGH-MIX / LOW-VOLUME — perfect for MassDwell's 4 ADU models. Adapts to different wall configurations (unlike rigid industrial robots).
- **Hardware built in California** — no overseas dependencies
- **Current platform:** R-04 (20 motors, 8 lb payload, in use at Vitrus labs)
- **Next platform:** RT-4 (26 motors, 12+ lb payload, 100+ lb total) — deploying to MassDwell Woonsocket

### Factory Location
**Woonsocket, RI** — Phase 1 factory. Manual assembly from day one; Vitrus automation is an upgrade layer, not a prerequisite. Units ship regardless.

### Deployment Roadmap
| Phase | Timeline | Cost |
|-------|----------|------|
| Initial Consultancy (industrial design + conceptual) | Feb-Mar 2026 | $35K |
| Proof of Concept (factory POC at Woonsocket) | June 2026 | $300K |
| Evaluation (onsite eval + training) | Nov 2026 | $150K |
| **Phase 1 Total** | | **$350K** (parts/procurement) + **$100K** (install) + **$150K** (1yr service + cloud) = **$1.05M** |
| Phase 2: Storage Automation (AMRs) | Est. 2027 | $250-300K + AMRs <$50K each |

### Full-Stack Factory Intelligence
- CAD + BOM from InHabit → Vitrus cloud orchestration → robotic assembly
- Digital twins for planning/testing
- Real-time telemetry (position, torque, temperature)
- Condition-based predictive maintenance
- Computer vision QC
- AMR (Autonomous Mobile Robot) storage

### InHabit → Factory Loop
Customer configures ADU in InHabit → InHabit generates BOM + CFS cut lists → Vitrus receives CAD + BOM → cloud schedules production → studs cut (CNC) → walls assembled (Vitrus arms) → QC (computer vision) → AMR storage → shipped to site → crane installation.

### Margin Expansion Thesis
| Year | Units | Gross Margin |
|------|-------|--------------|
| 2026 | 15 | 25% |
| 2027 | 40 | 30% |
| 2028 | 100 | 35% |
| 2029 | 200 | 45% |
20-point margin improvement = ~$10M additional profit at $50M revenue (2029).

### Seed Capital Allocation
- **50%** — Factory & Vitrus Robotics ($500K-$2.5M depending on raise size)
- **25%** — InHabit AI platform (design AI, zoning engine, BOM generation)
- **25%** — Team & Ops

**Key Milestones:** Woonsocket operational | 15+ units delivered | $3M+ revenue | Path to Series A

### CFS Assembly Best Practices (Apr 2026)
- **Connection method:** Bolted inter-module connections via factory-prepared tie plates (NO field welding — protects thin-gauge members and galvanizing)
- **Vertical (stacking):** Aligned corner posts + base/end plates, high-strength bolts, 10-20mm construction gap for shimming
- **Horizontal (side-by-side):** Bolted tie plates/cleats, min 30 kN resistance against disproportionate collapse
- **Erection rate:** 8-12 modules/day with experienced crew + crane
- **Module weight:** 15,000-25,000 lbs typical, dedicated rated lifting points required
- **Joint performance:** Neoprene/acoustic gaskets + mineral wool (acoustics), intumescent firestopping (fire 60-90+ min), overlapping cladding/membranes (weatherproofing)
- **Code:** AISI S240 + 780 CMR Chapter 22; MA wind/snow/seismic loads required
- **DfMA principle:** Pre-punch all bolt holes + attach plates in factory; self-aligning features (pins/lugs) minimize field adjustments
- **Module types:** Four-sided cellular = most stable starting point for apartments

### Humanoid Robot Outreach (2026-04-05)
Steve emailed **Agility Robotics**, **Figure**, and **Apptronik** to explore purchasing or piloting humanoid robots for the MassDwell factory floor. Awaiting BD responses.

---

## Hermes — REMOVED (2026-04-04)

**Status:** ❌ FULLY DELETED — all scripts, data, cron jobs, and architecture removed.

---

## MetaClaw — REMOVED (2026-04-02)

**Status:** ❌ DELETED — tools/metaclaw/ removed (freed 690MB)

**Reason:** Been stopped since March 21 with no impact. OpenClaw's native skill system (ClawHub + workspace skills) does the same job better. The keepalive cron was firing every 30 min and silently failing.

**Cron removed:** "Auto-start MetaClaw" (d41e1b15)

---

---

## Standing Rules — Deployment

> ⛔ **NEVER merge feature upgrades directly to production (main) without staging first.**
> All feature work goes: `feature branch → staging → Steve reviews → main`
> Hotfixes (bugs, rollbacks) may go direct to main. Features never do.
> This rule exists because PR #9 merged unreleased AI features straight to production on 2026-03-23 — causing a scramble to remove them.

## Standing Rules — Coding Agent Verification

After any coding agent (Claude Code, Codex, etc.) completes a task:
1. **Always verify `git status` AND `git log origin/main..HEAD`** — confirm 0 commits ahead of remote
2. If commits are ahead: **push immediately before reporting done**
3. Never tell Steve something is "deployed" or "live" until the push is confirmed
4. Vercel deploy = push confirmed + check `vercel ls` for Ready status

---

## Lessons Learned (Week of 2026-03-30 to 2026-04-05)

- **MassDwell Hub CRM switch: Kommo → GoHighLevel (2026-04-03)** — Hub now references GHL at app.gohighlevel.com. Kommo is fully retired. Any CRM integrations should target GHL API.

- **Clerk v7 auth.protect() in allowlistOnly mode returns 404 (not redirect)** — Must explicitly set `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` env vars or unauthenticated users hit a 404 instead of being redirected to sign-in.

- **Supabase API routes must use service role key, not anon key** — Anon key is blocked by Row Level Security (RLS) on server-side routes. Always use `SUPABASE_SERVICE_ROLE_KEY` in `/api/` routes. Anon key is only for client-side unauthenticated access.

- **GCP OAuth client type matters for web apps** — Desktop app OAuth clients don't support web redirect URIs. For Clerk or any web auth integration, always create a "Web application" client type in GCP, not Desktop.

- **GoDaddy API restricts automated DNS to accounts with 10+ domains** — Cannot programmatically update GoDaddy DNS on accounts with fewer than 10 domains. Manual DNS update required. Use this as a standing constraint for all GoDaddy-hosted domains.

- **Self-improving agent capture layer installed (2026-04-05)** — `.learnings/` directory is the new first-write destination for errors, corrections, and feature requests. `memory/LESSONS.md` is promotion-only tier. See AGENTS.md for full two-tier memory flow.

- **Squash merges silently drop Prisma migration folders** — Hit 3 times in one day (PR #126 dropped DrawEvent table; PR #126 dropped paidAt/paidByUserId on Invoice; PR #135 dropped lenderContactName/submittedToLenderAt). Each time: dashboard crashes immediately post-deploy, Neon missing columns. **Prevention: run `node scripts/audit-migrations.js` from /Users/openclaw/Projects/drawstack immediately after every production merge. Script compares schema.prisma scalars against live Neon and exits 1 with a list of missing columns.**

## Lessons Learned (Week of 2026-03-23 to 2026-03-29)

- **Neon HTTP: no nested Prisma includes beyond 1 level** — 2-level deep nested includes crash the Neon HTTP adapter silently. Always use sequential flat queries + JS merge. Applies to all routes using Neon serverless.
- **Clerk `currentUser()` vs `auth()` in server components** — `currentUser()` returns the logged-in session user, not necessarily the userId in the request context. For GC approve/reject actions on behalf of a sub, use the `userId` passed in the request body, not `currentUser()`.
- **S3 private buckets require presigned URLs everywhere** — raw S3 URLs return 403 for private buckets. Create a dedicated API route to generate presigned URLs. Never store or serve raw S3 URLs for private content.
- **PR review discipline: staging before main** — PR #9 merged unreleased AI features straight to production (52 files, +4415 lines). Rule enforced: features go feature branch → staging → Steve review → main. Hotfixes only may go direct to main.
- **Backup dirs must be archived outside node tree** — Old backup dirs sitting alongside live installations cause Node module resolution to walk the wrong tree. Rename with `.archived` suffix or move outside `tools/`.
- **Clerk Org type matters for lender invite flow** — existing GC org record causes constraint violation when creating LenderProjectAccess. Must check org type and create a new LENDER org if the user already has a GC org.
- **Cron jobs intended to be silent MUST start with "Execute silently:"** — without this prefix, systemEvent/main jobs with wakeMode:now relay output to Steve's Telegram. Always prefix automation crons.
- **Watchdog "unresponsive" is a false positive** — scheduler health endpoint is unreliable; jobs execute fine regardless. Don't escalate unless jobs are actually not running.

## Lessons Learned (Week of 2026-03-16 to 2026-03-22)

- **S3 is the ONLY storage layer** — Never use `@vercel/blob`. All file storage goes through `lib/s3.ts → uploadBuffer()`. Claude Code agents will try to import `@vercel/blob`; always strip it.
- **Prisma relation names are PascalCase** — Generated code often uses lowercase (`project:`, `subContractor:`). Always check the schema, fix before pushing.
- **Vercel GitHub integration can silently disconnect** — If `git push` succeeds but Vercel doesn't deploy, check Settings → Git. The app may need to be reinstalled on the GitHub org.
- **Node 22 + Stripe SDK incompatibility** — Use raw `fetch()` for Stripe Checkout calls instead of the Stripe SDK. SDK breaks under Node 22 + Next.js 16.
- **Resend account fragmentation** — drawstack.ai domain is registered in a Resend account NOT under massdwell. Likely vettoristeve@gmail.com. Need Steve to confirm. Clerk email delivery is blocked until resolved.
- **macOS Storage "50GB Documents" miscategorization** — macOS sometimes miscounts; not a real disk problem. Verify with `df -h` before panicking.
- **Window.location.reload is an anti-pattern** — Use React state updates + callback props to refresh data. `window.location.reload()` causes full page reloads and kills form state.
- **Playwright test.use() placement** — `test.use({...deviceConfig})` must be at the top of the describe block, not inside. Misplacement silently blocks all specs in the block.
- **Vitest + Playwright setup conflict** — `tests/setup.ts` calling Playwright's `setup()` inside Vitest runner causes all unit tests to crash. Keep test runners strictly separated.



- OAuth flow works with manual code paste when running on remote machine
- Kommo catches virtually all leads from Facebook ads
- Gmail inbox is clean — no missed leads
- Google Drive has competitive intel worth reviewing
- Calendar is underutilized — opportunity for scheduling follow-ups

---

## DrawStack Analytics & Search

**Google Search Console:** ✅ Live — vettoristeve@gmail.com, drawstack.ai property
**Google Analytics GA4:** ✅ Live — drawstack.ai (already integrated)
**X (Twitter):** @TheDrawStack — app registered as "drawstack" via xurl (2026-03-27)
  - OAuth2 pending (Steve needs to run `xurl auth oauth2` in Terminal)

---

## MassDwell Marketing Dashboard

**URL:** https://lookerstudio.google.com/u/0/reporting/b1c14498-6e34-469d-96bf-a95abf14d008/page/p_ffqfubejnd
**Platform:** Looker Studio
**Data Sources:** Meta Ads, Google Ads, Google Analytics
**Monitoring:** Daily at 9 AM

---

## MassDwell Hub

**Domain:** massdwellhub.com (purchased April 1, 2026)
**Status:** ✅ LIVE — https://massdwellhub.com
**Purpose:** Internal sales & ops tool
**Stack:** Next.js 14, Tailwind + shadcn/ui, Supabase (service role for API routes), Clerk (restricted/allowlist), Vercel
**Auth:** Clerk restricted mode — allowlist only (see Allowlist Contacts section)
**CRM:** GoHighLevel (switched from Kommo 2026-04-03) — app.gohighlevel.com

**Live modules:**
- Dashboard / Sales Cheat Sheet
- Build Cost Tracker (COGS)
- ADU Permit Navigator (Massachusetts towns)
- Contracts
- Trade Partner Program (adding 2026-04-05)

**Key fixes applied (2026-04-03/04):**
- GCP OAuth: Web app client (not Desktop) required for Clerk redirect URIs
- Clerk 404 fix: NEXT_PUBLIC_CLERK_SIGN_IN_URL env var required for redirect
- COGS save: float margin rounded before writing to integer DB column
- All API routes use Supabase service role key (not anon key — blocked by RLS)

## Customer Design Portal

**URL:** https://portal.massdwell.com
**Platform:** Softr
**Status:** LIVE (Feb 4, 2026)
**Login:** sales@massdwell.com / MassDwell2026!

Purpose: Customer finish selection portal for ADU interior choices (flooring, cabinets, countertops, etc.)

---

## MARKETING HEAD DEPLOYMENT — March 4, 2026

**Status:** ✅ **DEPLOYED** as blank canvas agent  
**Role:** Chief Marketing Officer (CMO) for three brands  
**Scope:** MassDwell | Atlantic Laser Solutions | Alpine Property Group  
**Heartbeat:** Daily (9 AM EST, Job ID: [pending])  

**What it does:**
- Demand generation (leads by source tracking)
- Brand authority building (content engine)
- Funnel management (6 stages: Awareness → MQL)
- Campaign optimization (A/B testing, ROI tracking)
- Sales alignment (stuck deal re-engagement, messaging testing)
- Weekly reporting (metrics, performance, opportunities)

**Files:**
- SOUL.md, HEARTBEAT.md, IDENTITY.md, MEMORY.md
- MARKETING-HEAD-SOP.md (9K+ word operations manual)
- MARKETING-HEAD-SCHEMA.json (campaigns, content, metrics)
- QUICK-START-OPERATIONS.md (live operations guide with examples)

**Status:** Ready for direction from Steve on priorities

---

## MONEY PRINTER — RETIRED (March 4, 2026)

**Decision:** ✅ **DEACTIVATED**  
**Date:** 2026-03-04 13:22 EST  
**Status:** All cron jobs deleted, data archived

**What was deleted:**
- 9 Money Printer cron jobs (market intel, sentiment, strategy, risk gate, EOD analytics)
- Data directory: `/data/trading/` → archived
- Scripts: `sentiment-scraper.js` (deleted)
- Alpaca paper trading account: `credentials/alpaca/paper-trading.json` (preserved for reference only)

**Impact:** Full trading infrastructure offline. System focus shifted to core business operations.

---

_Last updated: 2026-03-14_

---

## DrawStack (Active Venture — March 2026 → SHIP-READY)

**Status:** ✅ LIVE — drawstack.ai (DNS propagated)

**Product:** Construction draw management & budget tracking SaaS for small-to-mid real estate developers  
**Domains:** drawstack.ai (primary) · drawstack.io (redirect)  
**Tech stack:** Next.js 15 · TypeScript · Clerk · Neon (PostgreSQL) · Prisma · Vercel · AWS S3  
**Repo:** github.com/MassDwell/drawstack

**As of 2026-03-22 (ship-ready):**
- All 4 post-blitz gaps resolved: retainage ledger detail, doc hard-gating, pagination, mobile SOV
- Safety infrastructure: Sentry, feature flags, smoke tests, PR workflow, migration docs
- SEO stack: robots.txt, sitemap.xml, OG images, JSON-LD, page-level keywords (Rabbet alternative)
- GA4 key events, PostHog analytics, admin revenue/trials dashboard
- Landing page: fake dashboard mockup, how-it-works flow, features trimmed
- Per-line retainage ledger, change orders, SOV over-budget warnings, invoice sub mapping
- Sub portal: per-project dashboard, payment history, email notifications, mobile-first
- Admin portal: user emails, delete user, plan override, org detail, activity feed, draw pipeline

**As of 2026-03-15 (end of intensive build day):**
- 6-branch blitz merge complete — 28/32 planned features built, 3 partial, 1 missing
- AIA G702/G703-compatible PDF generation ✅
- AI invoice parsing (Gemini) ✅
- Lender invite + review flow ✅
- Lender portfolio dashboard ✅
- Stripe billing ✅
- CSV/Excel budget upload (seeds SOV on project create) ✅
- Burn rate chart ✅
- Lien waiver tracking ✅
- Settings edit ✅
- Unified draw status model (7-step banking flow) ✅
- Offline GC panels (advance without lender on platform) ✅
- Full app audit queued (in progress as of 8 PM)

**Draw status flow (7 steps, unified):**
DRAFT → SUBMITTED → UNDER_REVIEW → INSPECTION_ASSIGNED → INSPECTION_COMPLETE → APPROVED → FUNDED
- Display labels use real banking language
- GC can self-advance every step when no active lender
- Lender drives same steps from their dashboard when on platform

**✅ Known Good Checkpoint — 2026-03-22 17:38 EDT (STABLE BASELINE)**
- Git tag: `checkpoint-2026-03-22-stable` | SHA: `4e461d6`
- Steve verified everything working at this timestamp
- Neon DB snapshot near this time = safe restore point
- To recover: `git checkout checkpoint-2026-03-22-stable` + Neon PITR to 2026-03-22 17:38 EDT

**Known gaps (post-blitz audit):** ✅ ALL RESOLVED (2026-03-22)
1. ✅ Retainage ledger detail — fixed
2. ✅ Document hard-gating — now blocks submission
3. ✅ Pagination on projects list — added
4. ✅ Mobile responsive SOV tables — fixed at 375px

**Safety & Ops Infrastructure (2026-03-22):**
- Sentry error monitoring ✅
- Feature flags ✅
- Smoke tests ✅
- PR workflow ✅
- Migration docs ✅
- Staging environment (CLA-247) ✅
- Neon PITR + DB backup script (CLA-251) ✅

**Admin:**
- Allowlist: vettoristeve@gmail.com, sales@massdwell.com, steve.vettori@massdwell.com
- Revenue & Trials section in admin overview ✅
- GA4 key events integrated ✅

**🚀 Pre-launch status as of 2026-03-22:** ALL GAPS CLOSED — launch ready

**Key decisions locked:**
- AIA G702/G703: Recreate layout (don't license) — label "AIA G702-compatible"
- Budget model: 4-level hierarchy (Project → Division → Category → Line Item)
- AI stack: Gemini 2.5 Pro (primary) + Claude Opus (low-confidence validation)
- Invoice: Confidence-scored UX, user approval always required
- Neon HTTP: no `$transaction` or `createMany` — use sequential creates

**Key bugs fixed (2026-03-15):**
- Draw detail page crashed — `workCompletedFromPrevious` (Column D) must be computed from prior approved/funded draws before passing to DrawDetail component
- Both user accounts had `role=LENDER` in DB — fixed to `role=GC` (8 PM)
- S3 presigned URL 403 — Content-Type must match exactly between sign and upload
- Invoice upload S3 fix deployed, invoice list auto-refresh fixed

**Project docs:**
- `data/drawstack/PROJECT-PLAN.md`
- `data/drawstack/BLITZ-AUDIT.md`
- `data/drawstack/RABBET-DEEP-DIVE.md`
- `ventures/drawstack/UNIFIED-STATUS-SPEC.md`

---

## MeritLayer — SHUT DOWN (2026-03-13)

**Decision:** Steve cancelled the project. "I don't like the idea anymore."

**Teardown completed:**
- ✅ Vercel project deleted
- ✅ GitHub repo (MassDwell/permitiq) archived
- ✅ 29 CLA tickets cancelled in Paperclip
- ✅ 6 Stripe products archived
- ✅ Local repo archived to `archive/meritlayer_archived_20260313`

**Still needs manual action:**
- Neon DB — delete at console.neon.tech
- Clerk app — delete at dashboard.clerk.com
- Resend domain (meritlayer.ai) — remove at resend.com/domains (API key restricted)
- GoDaddy domain (meritlayer.ai) — Steve wants to KEEP this domain

---

## Paperclip (Updated 2026-04-02 — Runtime v1)

**Status:** ✅ OPERATIONAL — Demoted to presentation layer (downstream view only)

**Architecture:**
- Paperclip frontend: ports 3100/3101
- Keepalive cron: healthy (every 30 min)
- Agent records in Paperclip: Clawson (real), Codesmith/Moonshot/PA (labels only, no executors)

**State authority:**
- **SSOT:** `data/runtime/job-ledger.jsonl` — canonical job state
- **Paperclip:** downstream view, best-effort sync. If it conflicts with job-ledger, job-ledger wins.
- Stale-run-recovery patched: will not re-queue issues assigned to non-Clawson agent IDs

**Known limitation:** `in_progress` → `completed` status transition unreliable. This is why Paperclip is NOT the SSOT.

---

## Gmail MCP for Paperclip — Fix Applied 2026-03-08

**Problem:** `@shinzolabs/gmail-mcp` was an HTTP web UI, not a proper stdio MCP server — Claude Code couldn't communicate with it.

**Fix:** Replaced with `@gongrzhe/server-gmail-autoauth-mcp`
- Credentials: `~/.gmail-mcp/credentials.json` (vettoristeve@gmail.com refresh token)
- Config: `personal-assistant-mcp.json` updated
- 18 Gmail tools verified working

**Rule:** When MCP servers fail silently in Claude Code, check if the package is actually a stdio server vs. a web UI.

---

## GitHub Push Protection — RESOLVED (2026-03-08)

Pre-existing secrets (Supabase + OpenAI keys) were blocking all pushes to mission-control repo.
**Status:** ✅ Resolved by Steve on 2026-03-08.

---

## Cron Scheduler Pattern (2026-03-06+)

**Observed:** Cron scheduler shows "unresponsive" in health checks but all jobs execute normally.
**Root cause:** Health endpoint unreliable, not the scheduler itself.
**Rule:** Don't escalate "scheduler unresponsive" unless jobs are actually not running.

---

## Security Incident — 2026-02-06

**What happened:** Installed `openclaw-trading-assistant` from ClawHub at Steve's request. Skill was from `github.com/molt-bot/` and contained crypto wallet transfer scripts (veil-cash mixer), NOT stock trading tools.

**Damage:** None — caught before activation. Deleted immediately.

**Root cause:** Didn't vet the skill before installing. Trusted ClawHub listing.

**New rule:** 
> ClawHub downloads require vetting. Before installing any skill: check author reputation, review scripts for wallet/transfer/exfil code, confirm it matches the request. When in doubt, don't install.

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
