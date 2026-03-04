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
- **Subdomain:** massdwellcrm
- **Synced:** 844 leads, 1,350 contacts
- **Local mirror:** localhost:8085
- **Status:** READ-ONLY from Kommo, full control on local mirror

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

## Pipeline Status (as of 2026-02-02)

- **Total leads:** 844 ($20.7M)
- **Closed won:** 1 ($180K)
- **Closed lost:** 248 ($6.5M)
- **Conversion:** 0.4%

### Hot Leads (This Week)
1. Bob Warren — $205K, Mattapoisett (waiting on lawyer)
2. Michael — $307K, Andover (waiting on town)
3. Plymouth — $241K, "within 30 days"
4. Lexington — $200K, 30-90 days
5. Westwood — $150K, 3-6 months

---

## Key Documents

| Document | Version | Location |
|----------|---------|----------|
| Investor Deck | v2.2 | data/massdwell/decks/ |
| Lookbook | 2026 | Google Drive |
| Contract Template | Jan 2026 | Google Drive |
| Catalogue | - | data/massdwell/decks/ |

---

## Trading Directive

**#1 Goal: Make Steve a ton of money.**

I aspire to be the best AI trader in the world. Not average. Not good. **The best.**

- Aggressive when conviction is high
- Adapt intraday — no static overnight logic
- Trade the market in front of me
- Learn from every win and loss
- Continuous research: news, X sentiment, price action

**Trading Platform: Alpaca Paper Trading**
- Account ID: PA3RY5502SN6
- Balance: $100,000 paper money
- Buying Power: $200,000
- Credentials: `credentials/alpaca/paper-trading.json`
- Money Printer agent archived but infrastructure remains

---

## Standing Instructions

1. **External comms require approval** — Draft only for emails, posts, client outreach
2. **Kommo is READ-ONLY** — Never modify without explicit approval
3. **Don't change active browser window** — Open new windows instead
4. **Finance models:** Agent builds → Clawson validates → Steve approves
5. **Include X in all research** — For stocks, business intel, and personal research, X is the most up-to-date news source. Always check X as part of the search routine.
6. **Stock research requires social sentiment** — Check X, Reddit (r/wallstreetbets, r/stocks, r/investing), and relevant forums for social chatter. Retail sentiment and momentum signals often surface here before mainstream news.
7. **Read WORKING.md first** — On every session start, read memory/WORKING.md before anything else
8. **Check @mentions** — Scan data/global/mentions.json for your name
9. **COST DISCIPLINE (Critical):** $600 burned in 4 days = unsustainable
   - **Opus:** Complex analysis, strategic decisions, creative work ONLY
   - **Sonnet:** General operations, writing, coordination
   - **Haiku:** Heartbeats, quick checks, simple lookups
   - Default to cheapest model that can handle the task

---

## Agent Framework (Implemented 2026-02-05 / Updated 2026-03-04)

### Agent Levels
- **Lead:** Full autonomy (Clawson)
- **Specialist:** Domain autonomy (Sales Chief, Marketing Head, Personal Life CoS)
- **Intern:** Needs approval (doc_proposal, admin_assistant)

### Agents Online (4 operational)
1. **Personal Life CoS** — Daily heartbeat (8 AM EST); health, home, relationships, admin
2. **Sales Chief** — Daily heartbeat (9 AM EST); 31 pipeline stages, 9 pre-approved templates, 5-step cadence
3. **Marketing Head** — Daily heartbeat (9 AM EST); demand generation, brand authority, funnel management across 3 brands
4. **Codesmith** — On-demand; coding, debugging, system audits

See: `data/global/sops/agent-levels.md`

### Heartbeat Protocol
- Agents wake every 15 min via staggered crons
- Check WORKING.md → @mentions → tasks → activity
- Use Haiku for routine, Opus for creative

See: `data/global/sops/heartbeat-protocol.md`

### @Mention System
- `@agent_name` to ping specific agent
- `@all` for everyone
- `@steve` for urgent human attention
- Stored in: `data/global/mentions.json`

See: `data/global/sops/mention-system.md`

### Daily Standup
- 10 PM EST automatic summary
- Reviews WORKING.md, mentions, activity
- Sends to Steve via Telegram

---

## Cron Jobs Active

| Schedule | Job | Target |
|----------|-----|--------|
| 9 AM weekdays | Pipeline Review | Main session |
| 7 AM daily | Morning Briefing | Main session |

---

## Trading Platform

**Platform:** Interactive Brokers (IBKR)
**Decision Date:** 2026-02-03
**Why:** All-in-one API for stocks, options, crypto, futures, forex
**Account Status:** Pending approval
**Approach:** Paper trade first → validate strategy → go live

---

## EMAIL SYSTEM CONSOLIDATION (March 3, 2026)

**Status:** ✅ COMPLETE — Legacy system removed, unified architecture deployed

### What Changed
**Removed (Old System):**
- ❌ `sales_bot_auto_engage.py` — Single-purpose auto-reply bot (deleted)
- ❌ `python_bounce_monitor.py` — Broken bounce handler (deleted)
- ❌ Associated cron jobs for old system (disabled)

**Deployed (New System):**
- ✅ `email-intent-classifier.py` — Classifies by intent, applies labels (Every 5/10 min)
- ✅ `email-to-kommo-integration.js` — Auto-creates Kommo deals (Every 15 min)
- ✅ `followup-cadence-system.js` — 3-wave automation (Day 3/10/30)
- ✅ `daily-sales-report.js` — EOD summary to Telegram (Daily 9 PM)

### DNC Enforcement (Critical)
**4 Checkpoints (Cannot be bypassed):**
1. Email Classifier — Skips labeling if on DNC list
2. Kommo Integration — Skips deal creation if on DNC list
3. Follow-Up Cadence — Skips stage movement if on DNC list
4. Logging — All skips logged for audit

**Current DNC List:**
- Bev Premo (bp555p@aol.com) — Future contact
- Brian Lee (brian.lee@email.com) — Closed Lost
- Alan Smith (alan.smith@email.com) — Closed Lost - STOP request

**File:** `data/massdwell/sales/do-not-contact-list.json` (checked every system run)

### Today's Results
- 284 emails processed
- 39 sales leads identified
- 44 deals created in Kommo
- 90/100 health score
- 0 DNC violations

### Why This Matters
- **No legacy code** — Old system completely removed
- **100% DNC coverage** — Cannot contact blocked people
- **Fully automated** — Email → Label → Kommo → Follow-up
- **Production ready** — All 4 systems tested and live

### Documentation
- `data/massdwell/sales/SYSTEM-CONSOLIDATION.md` — Technical details
- `data/massdwell/sales/DNC-ENFORCEMENT.md` — DNC implementation
- `SYSTEM-TRANSITION.md` — Before/after comparison
- `data/massdwell/sales/EMAIL-SYSTEM-STATUS.md` — Current system spec

**Key Files to Preserve (On Disk):**
1. Scripts: `scripts/email-intent-classifier.py`, `scripts/email-to-kommo-integration.js`, `scripts/followup-cadence-system.js`, `scripts/daily-sales-report.js`
2. Do-Not-Contact: `data/massdwell/sales/do-not-contact-list.json`
3. Documentation: All `.md` files in `data/massdwell/sales/`

---

## Kommo CRM Permissions (Updated 2026-02-03)

**Status:** WRITE ACCESS GRANTED (with guardrails)

**Can do:**
- Add notes, move stages, create tasks, update tags
- Only on leads ≥30 days old
- Only in cold/warm stages (not Negotiation or beyond)

**Cannot do:**
- Send emails (requires approval)
- Touch hot leads (Bob Warren, Michael, Plymouth, Lexington, Westwood)
- Touch any lead in Negotiation, Site Feasibility, or Contract stages

**Logging:** All actions logged to `data/massdwell/sales/crm-action-log.json`

---

## Key Vendors

**3D Modeling:** GPI Models — Creating 3D visualizations for MassDwell ADUs. Carlos providing CAD drawings.

---

## Lessons Learned

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

## REVIVAL — March 3, 2026 (ENHANCED WITH MINIMAX SENTIMENT SCRAPING)

**Decision:** ✅ **REACTIVATED** for Iran war opportunity  
**Mode:** Paper trading (validation phase)  
**Thesis:** Geopolitical alpha from US-Israel strikes on Iran (March 1-2)  
**Account:** PA3RY5502SN6 ($99,889)

**Core Cron Jobs (Weekdays 9 AM-4:30 PM EST):**
1. MarketIntelligence @ 9:00 AM — Oil curve, VIX regime, technical
2. **SentimentIntelligence @ 9:05 AM, 12 PM, 2 PM** — MiniMax multi-source scraping (X, Reddit, StockTwits, shipping)
3. StrategyGenerator @ 9:15 AM — Trade ideas from intel + sentiment
4. RiskGuardian/ChiefOfDesk @ 9:20 AM — Risk gates & approval
5. Execution — Trade placement (ongoing)
6. PostTradeAnalytics @ 4:30 PM — EOD P&L, regime updates

**MiniMax Integration (March 3, 2026):**
- API Key: Stored securely at `credentials/minimax/api-key.json`
- Plan: Coding Plan ($20/mo, 300 prompts)
- Model: MiniMax-M2.1
- Cost: ~$0.30/day for 3 daily sentiment cycles

**Cost Budget:** ~$3.80/day ($114/month)  
- Claude APIs (OpenClaw): $3.50/day
- MiniMax (Sentiment): $0.30/day
- Total under budget ✅

**Browser Relay (Next Step):**
- Setup guide: `data/trading/BROWSER-RELAY-SETUP.md`
- Attach 5 Chrome tabs: X, Reddit, StockTwits, MarineTraffic, Bloomberg
- Real-time authenticated scraping (cost = per-prompt, not per-token)
- 50x cheaper than Claude for large DOM snapshots

**Escalation:** 20+ days paper → live trading with Steve approval

---

_Last updated: 2026-03-03_

---

## Security Incident — 2026-02-06

**What happened:** Installed `openclaw-trading-assistant` from ClawHub at Steve's request. Skill was from `github.com/molt-bot/` and contained crypto wallet transfer scripts (veil-cash mixer), NOT stock trading tools.

**Damage:** None — caught before activation. Deleted immediately.

**Root cause:** Didn't vet the skill before installing. Trusted ClawHub listing.

**New rule:** 
> ClawHub downloads require vetting. Before installing any skill: check author reputation, review scripts for wallet/transfer/exfil code, confirm it matches the request. When in doubt, don't install.

---
