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

1. **MassDwell** (Primary) — Modular ADU manufacturer
   - Website: massdwell.com
   - CRM: Kommo (massdwellcrm)
   - Email: sales@massdwell.com

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

## VAPI Voice AI (Configured 2026-02-04)

**Assistant:** "Sarah" - MassDwell Lead Qualifier
**ID:** ebac8e3e-5285-4e6c-a185-6e2698a24ca5
**Phone:** VAPI number (ID: 5ea3a6d9-7333-4bdd-9fe6-73768bb53c4a)
**Voice:** ElevenLabs (Rachel - professional female)
**Status:** ✅ LIVE AND TESTED

Sarah can:
- Qualify cold leads (interest, location, timeline, budget)
- Handle objections naturally
- Book follow-ups with Nick
- Auto-end on "not interested"

**Steve's verdict:** "Pretty darn good! Baby boomers won't know it's AI."

---

## Active Integrations

### Kommo CRM
- **Status:** ❌ NO ACCESS (credentials deleted 2026-03-04)

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

## Sales Pipeline

**Status:** Manual tracking only (no CRM access)

See: MassDwell email inbox + manual tracking for lead status

---

## Key Documents

| Document | Version | Location |
|----------|---------|----------|
| Investor Deck | v2.2 | data/massdwell/decks/ |
| Lookbook | 2026 | Google Drive |
| Contract Template | Jan 2026 | Google Drive |
| Catalogue | - | data/massdwell/decks/ |

---

## Core Directive

**#1 Goal: Make Steve's businesses thrive.**

**Primary focus:**
- MassDwell (modular ADU manufacturing)
- Atlantic Laser Solutions (laser welding equipment distribution)
- Alpine Property Group (real estate investment & development)

**Secondary focus (New - 2026-03-04):**
- **Moonshot Venture Discovery v2.0** — Global AI SaaS opportunity scanning
  - 5 expansion domains (AI Learning, AI Tooling, Vertical AI, Business Operations, Founder Tools)
  - Evidence-driven discovery (Reddit, Indie Hackers, founder communities)
  - Target: $10K-$100K+ MRR AI SaaS products
  - Framework: canon/system/moonshot-program.md (v3.0 — self-improving, Karpathy pattern)
  - Pipeline: Moonshot (propose 3 ideas) → Clawson (approve) → Codesmith (build) → Mission Control (track)

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

## Agent Architecture (Updated 2026-03-04)

**Status:** CLEAN SLATE — All agents deleted as of March 4, 2026

**Previously deployed (ARCHIVED):**
- Personal Life CoS
- Sales Chief
- Marketing Head  
- Codesmith
- Admin Assistant
- Finance Director
- Ops Director
- Marketing Content
- Atlantic Laser Sales
- Alpine Permitting
- And others

**Current state:** 
- Only Clawson (main session) operational
- Ready for fresh architecture rebuild
- See: AGENT-REBUILD-BLUEPRINT.md for options

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

---

## Standing Rules — Coding Agent Verification

After any coding agent (Claude Code, Codex, etc.) completes a task:
1. **Always verify `git status` AND `git log origin/main..HEAD`** — confirm 0 commits ahead of remote
2. If commits are ahead: **push immediately before reporting done**
3. Never tell Steve something is "deployed" or "live" until the push is confirmed
4. Vercel deploy = push confirmed + check `vercel ls` for Ready status

---

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

## MassDwell Marketing Dashboard

**URL:** https://lookerstudio.google.com/u/0/reporting/b1c14498-6e34-469d-96bf-a95abf14d008/page/p_ffqfubejnd
**Platform:** Looker Studio
**Data Sources:** Meta Ads, Google Ads, Google Analytics
**Monitoring:** Daily at 9 AM

---

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

## Paperclip Orchestration (March 2026)

**Status:** ✅ OPERATIONAL — Phase 1 observation complete, Phase 2 pending approval

**Architecture:**
- Paperclip frontend: ports 3100/3101
- 4 agents deployed: Clawson, Codesmith, Moonshot, Personal Assistant
- Claude Code adapter: operational
- Phase 1 executor + polling loop: live (10s interval)
- Whitelist: spawn_workstream, assign_agent (sandbox: LeadScore.ai only)

**Files:**
- `canon/system/clawson-queue-executor.js` — executor with claim-lock, validation, SSOT mutation
- `canon/agents/clawson/clawson-integration.js` — polling loop
- `canon/system/PHASE1_COMPLETION_REPORT.md` — completion doc

**Known Issue:** Agent runs succeed (exit 0) but issue status sometimes stays `in_progress` — task completion state transition is inconsistent.

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
