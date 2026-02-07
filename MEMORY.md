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

## Agent Framework (Implemented 2026-02-05)

### Agent Levels
- **Lead:** Full autonomy (Clawson)
- **Specialist:** Domain autonomy (sales_followup, marketing_content, etc.)
- **Intern:** Needs approval (doc_proposal, admin_assistant, personal_life_cos)

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

_Last updated: 2026-02-04_

---

## Security Incident — 2026-02-06

**What happened:** Installed `openclaw-trading-assistant` from ClawHub at Steve's request. Skill was from `github.com/molt-bot/` and contained crypto wallet transfer scripts (veil-cash mixer), NOT stock trading tools.

**Damage:** None — caught before activation. Deleted immediately.

**Root cause:** Didn't vet the skill before installing. Trusted ClawHub listing.

**New rule:** 
> ClawHub downloads require vetting. Before installing any skill: check author reputation, review scripts for wallet/transfer/exfil code, confirm it matches the request. When in doubt, don't install.

---
