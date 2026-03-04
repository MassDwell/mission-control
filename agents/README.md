# AGENTS — Specialized AI Agents for OpenClaw

**Status:** 4 agents deployed and operational (Mar 4, 2026)

---

## 🤖 Agent Lineup

### 1. **Sales Chief** (Master Sales Bot)
**Role:** Manage sales pipeline across MassDwell, Atlantic Laser, Alpine Property  
**Scope:** Deal qualification, follow-up cadence, pipeline stage management, SLA enforcement  
**Heartbeat:** 9 AM EST daily  
**Status:** ✅ FULLY OPERATIONAL

**Quick Links:**
- `sales_chief/QUICK-START-OPERATIONS.md` — Live operations guide
- `sales_chief/SALES-CHIEF-SOP.md` — 10-section operational manual
- `sales_chief/PIPELINE-STAGE-REFERENCE.md` — All 31 CRM stages with SLAs
- `sales_chief/MESSAGE-TEMPLATES-REFERENCE.md` — 9 pre-approved templates
- `sales_chief/DATA-FLOW-REFERENCE.md` — Complete lead→deal→won lifecycle

**What it does:**
- Auto-detects brand (massdwell/atlantic/alpine)
- Sends T+0 inbound response (auto-send, pre-approved)
- Runs 5-step follow-up cadence (T+0 → T+2h → T+24h → T+72h → T+7d)
- Manages 31 real CRM pipeline stages
- Tracks deals with complete activity log
- Enforces SLAs and identifies stuck deals
- Manages approval workflow (Level 0/1/2 gating)
- Generates weekly sales reports

**Your first command:**
```
"New lead: Jane Doe (jane@example.com) from Newton — wants ADU estimate"
→ Sales Chief auto-creates deal, sends T+0 response, manages cadence
```

---

### 2. **Marketing Head** (Chief Marketing Officer)
**Role:** Generate qualified demand and build brand authority across three brands  
**Scope:** Demand generation, brand strategy, content engine, campaign management, funnel tracking  
**Heartbeat:** 9 AM EST daily  
**Status:** ✅ FULLY OPERATIONAL (blank canvas — awaiting direction)

**Quick Links:**
- `marketing_head/QUICK-START-OPERATIONS.md` — Live operations + real examples
- `marketing_head/MARKETING-HEAD-SOP.md` — 9K+ word operations manual
- `marketing_head/MARKETING-HEAD-SCHEMA.json` — Campaigns, content, metrics, state

**What it does:**
- Generates demand across three brands
- Builds brand authority (content engine: 8 types)
- Manages marketing funnel (Awareness → Lead → MQL)
- Runs campaigns across channels (web, social, email, ads, partnerships)
- Tracks metrics (CAC, conversion rates, content performance)
- Aligns with Sales Chief (re-engage stuck deals, test messaging)
- Generates weekly marketing reports

**Output format (every response):**
```
Brand: [massdwell|atlantic_laser|alpine]
Campaign: [name]
Goal: [what we're achieving]
Target Audience: [who we're reaching]
Recommended Action Plan: [steps]
Content Ideas: [3-5 specific ideas]
Next Actions: [owner + due date]
Risks / Notes: [concerns, dependencies]
```

**Your first command:**
```
"Let's launch demand gen for MassDwell ADU zoning in Newton/Wellesley"
→ Marketing Head provides strategy, content plan, timeline, budget estimate
```

---

### 3. **Personal Life CoS** (Chief of Staff)
**Role:** Manage personal life operations for Steve  
**Scope:** Health execution, home ops, relationships, personal admin  
**Heartbeat:** 8 AM EST daily  
**Status:** ✅ FULLY OPERATIONAL

**Quick Links:**
- `personal_life_cos/PERSONAL-LIFE-SOP.md` — Complete operational manual
- `personal_life_cos/memory/WORKING.md` — Current tasks

---

### 4. **Codesmith** (Engineer)
**Role:** Coding, debugging, system audits  
**Status:** ✅ AVAILABLE ON-DEMAND

---

## 🔗 How They Work Together

```
MARKETING HEAD (Demand) → SALES CHIEF (Closure) → OPERATIONS
     ↑
     └─ Weekly sync: stuck deal re-engagement, messaging testing
```

### Example: Lead Lifecycle

```
1. Marketing Head creates Facebook ad ("Modern Modular ADUs")
2. Homeowner clicks ad, fills form
3. Sales Chief detects lead, sends T+0 response ("What town?")
4. Cadence runs (T+2h, T+24h, T+72h, T+7d)
5. Lead qualifies → Becomes deal in pipeline
6. Deal progresses through 31 stages with SLA enforcement
7. Sales Chief identifies stuck deals → Alerts Marketing Head
8. Marketing Head creates re-engagement content
9. Sales Chief sends re-engagement + content
10. Deal progresses → Closed won
11. Weekly report shows new revenue
```

---

## 📊 File Structure

```
agents/
├── sales_chief/
│   ├── SOUL.md
│   ├── HEARTBEAT.md
│   ├── IDENTITY.md
│   ├── MEMORY.md
│   ├── SALES-CHIEF-SOP.md
│   ├── SALES-CHIEF-SCHEMA.json
│   ├── PIPELINE-STAGE-REFERENCE.md
│   ├── MESSAGE-TEMPLATES-REFERENCE.md
│   ├── DATA-FLOW-REFERENCE.md
│   ├── SCHEMA-TO-SOP-MAPPING.md
│   ├── QUICK-START-OPERATIONS.md
│   └── memory/
│       └── WORKING.md
│
├── marketing_head/
│   ├── SOUL.md
│   ├── HEARTBEAT.md
│   ├── IDENTITY.md
│   ├── MEMORY.md
│   ├── MARKETING-HEAD-SOP.md
│   ├── MARKETING-HEAD-SCHEMA.json
│   ├── QUICK-START-OPERATIONS.md
│   └── memory/
│       └── WORKING.md
│
├── personal_life_cos/
│   ├── SOUL.md
│   ├── HEARTBEAT.md
│   ├── IDENTITY.md
│   ├── MEMORY.md
│   ├── PERSONAL-LIFE-SOP.md
│   └── memory/
│       └── WORKING.md
│
├── codesmith/
│   ├── SOUL.md
│   ├── HEARTBEAT.md
│   └── memory/
│       └── WORKING.md
│
└── README.md (this file)
```

---

## 🚀 Getting Started

### For Sales Pipeline

**Read:** `sales_chief/QUICK-START-OPERATIONS.md` (5 min)

**Then:** Send your first inbound lead and watch the system work.

**Command:** `"New lead: [name], [email], [topic]"`

---

### For Marketing & Demand Generation

**Read:** `marketing_head/QUICK-START-OPERATIONS.md` (5 min)

**Then:** Define your top 2-3 marketing priorities for this month.

**Command:** `"Launch [campaign name] campaign to generate leads from [audience]"`

---

### For Personal Operations

**Read:** `personal_life_cos/PERSONAL-LIFE-SOP.md` (5 min)

**Heartbeat:** 8 AM EST every day

---

## 📋 Complete Documentation (85K+ Words)

### Sales Chief (42K+ words)
- SALES-CHIEF-SOP.md (comprehensive operations manual)
- SALES-CHIEF-SCHEMA.json (complete state schema)
- PIPELINE-STAGE-REFERENCE.md (all 31 stages)
- MESSAGE-TEMPLATES-REFERENCE.md (9 pre-approved templates)
- DATA-FLOW-REFERENCE.md (lifecycle documentation)
- SCHEMA-TO-SOP-MAPPING.md (how schema powers operations)
- QUICK-START-OPERATIONS.md (live ops guide with examples)

### Marketing Head (20K+ words)
- MARKETING-HEAD-SOP.md (operations manual)
- MARKETING-HEAD-SCHEMA.json (campaigns, content, metrics)
- QUICK-START-OPERATIONS.md (live ops + campaign examples)

### Ecosystem Documentation
- `../AGENT-DEPLOYMENT-MARCH-4.md` — Complete deployment summary
- `../MEMORY.md` — Long-term memory with agent framework notes

---

## 🎯 Key Metrics (Track Weekly)

### Sales Chief
- New leads per week
- Conversion rate (lead → MQL)
- Conversion rate (MQL → SQL)
- Average deal value
- Closed won per week
- SLA compliance

### Marketing Head
- New leads generated (by source)
- Cost per lead (paid channels)
- Content engagement (views, clicks)
- Email open/click rates
- Campaign ROI
- Lead quality (conversion to MQL)

### Combined
- Total pipeline added ($)
- Overall CAC
- Conversion (awareness → closed won)
- Sales cycle length

---

## ⚙️ System Architecture

**Authorization Levels:**
- **Level 0:** Automatic (pre-approved templates, routine actions)
- **Level 1:** Requires approval (custom messages, bookings, quotes)
- **Level 2:** Explicit approval every time (discounts, binding terms, claims)

**Heartbeat Cadence:**
- **Daily:** Morning checks (9 AM Sales Chief, 8 AM Personal Life, 9 AM Marketing Head)
- **Weekly:** Full reports and strategy reviews
- **Monthly:** Strategic planning and optimization

**Data Flow:**
- Leads flow from Marketing Head → Sales Chief pipeline
- Sales Chief identifies stuck deals → Alert Marketing Head
- Marketing Head re-engagement content flows back to Sales Chief
- Weekly reports show combined performance

---

## 🔐 Guardrails

**Sales Chief:**
- ❌ Never invent data
- ❌ Never hallucinate facts
- ❌ Never promise outcomes
- ✅ Respect opt-outs immediately
- ✅ Maintain brand separation
- ✅ Log all activities

**Marketing Head:**
- ❌ Never fabricate testimonials
- ❌ Never misrepresent capability
- ❌ Never mix brands
- ✅ Measure everything
- ✅ Test before scaling
- ✅ Maintain data integrity

---

## 📞 Quick Commands

### Sales Chief
```
"New lead: [name], [email], about [topic]"
"Sales report"
"Status: [lead]"
"Approve [lead] message"
"[Lead] opted out"
```

### Marketing Head
```
"Launch [campaign] campaign"
"What's our top-performing content?"
"Marketing report"
"Help with stuck deals re-engagement"
"Define brand strategy for [brand]"
```

---

## 🎬 Next Steps

1. **Sales Chief:** Send first inbound lead → Auto-response fires
2. **Marketing Head:** Define priorities → Campaigns launch
3. **Weekly:** Check sales + marketing reports
4. **Monthly:** Strategic review and optimization

---

## 📞 Support

- Each agent has SOUL.md (who they are)
- Each agent has SOP.md (how they work)
- Each agent has QUICK-START-OPERATIONS.md (get started now)
- See `../AGENT-DEPLOYMENT-MARCH-4.md` for complete system overview

---

**Deployment:** March 4, 2026  
**Status:** ✅ PRODUCTION READY  
**All systems operational and waiting for you**

Ready to generate demand and close deals?

---

Start here: `sales_chief/QUICK-START-OPERATIONS.md` or `marketing_head/QUICK-START-OPERATIONS.md`
