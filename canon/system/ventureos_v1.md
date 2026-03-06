# VentureOS v1 — Venture Governance System

**System:** VentureOS  
**Version:** 1.0 (stage-gated governance)  
**Status:** SPECIFICATION  
**Date:** 2026-03-05  
**Approved By:** Steve Vettori  

---

## EXECUTIVE SUMMARY

VentureOS is the operational system for running multiple startups simultaneously under stage-gated governance.

**Transforms:** Project execution → Venture operating system  
**Preserves:** Existing OpenClaw architecture (no breaking changes)  
**Foundation:** Mission Control (operational dashboard)  
**Adds:** Stage gates, artifact enforcement, venture scoring, portfolio tracking, kill rules  

---

## VENTURE DIRECTORY STRUCTURE

All ventures live under: `/ventures/{venture_slug}/`

```
/ventures/leadscore-ai/
├── venture.yaml (metadata: name, owner, timeline, targets)
├── stage.json (current stage, entry date, artifacts complete)
├── metrics.json (MRR, users, activation_rate, build_progress, experiments_run)
├── /artifacts/
│   ├── idea.md (problem, customer persona)
│   ├── market_evidence.md (competitor scan, demand, pricing)
│   ├── opportunity_score.md (MRR potential, automation score, distribution)
│   ├── prd.md (product scope, user flows, data model, success metrics)
│   ├── architecture.md (technical design)
│   ├── pricing_model.md (pricing strategy)
│   ├── go_to_market.md (GTM strategy)
│   └── experiment_results.md (validation data, feedback)
├── /build/
│   ├── repo_link.txt (GitHub URL)
│   └── deployment.md (deployment instructions)
└── /logs/
    └── venture_activity.json (append-only activity log)
```

---

## 8-STAGE VENTURE PIPELINE

**Progression:** Cannot skip stages. Artifacts must be complete to advance.

```
IDEA → EVIDENCE → OPPORTUNITY_SCORE → PRD → BUILD → BETA → REVENUE → SCALE
```

### Stage 1: IDEA
**Goal:** Define problem + customer  
**Duration:** 1-2 weeks  
**Gate Keeper:** Moonshot  
**Required Artifacts:**
- `idea.md` (problem statement, customer persona)

**Exit Criteria:**
- Problem clearly stated
- Customer identified
- Moonshot approves opportunity

### Stage 2: EVIDENCE
**Goal:** Validate market demand  
**Duration:** 1-3 weeks  
**Gate Keeper:** Moonshot  
**Required Artifacts:**
- `market_evidence.md` (competitor scan, search demand, pricing benchmarks)

**Exit Criteria:**
- Competitor analysis (3+ competitors identified)
- Market demand signals (search volume, willingness to pay)
- Pricing benchmarks established

### Stage 3: OPPORTUNITY_SCORE
**Goal:** Score venture viability  
**Duration:** 1 week  
**Gate Keeper:** Moonshot + Clawson  
**Required Artifacts:**
- `opportunity_score.md` (MRR potential, automation score, distribution)

**Exit Criteria:**
- Opportunity score ≥ 28 (eligible) or ≥ 34 (priority)
- MRR potential estimated
- Distribution strategy identified

**Kill Condition:**
- Score < 28 → venture rejected (automatic kill)

### Stage 4: PRD
**Goal:** Define product  
**Duration:** 1-3 weeks  
**Gate Keeper:** Clawson + Codesmith  
**Required Artifacts:**
- `prd.md` (product scope, user flows, data model, success metrics)

**Exit Criteria:**
- Product scope defined
- User flows documented
- Data model designed
- Success metrics defined
- Team committed

### Stage 5: BUILD
**Goal:** Develop MVP  
**Duration:** 4-12 weeks (target: 8 weeks)  
**Gate Keeper:** Codesmith  
**Required Artifacts:**
- `architecture.md` (technical design)
- `repo_link.txt` (GitHub URL)
- `deployment.md` (deployment instructions)

**Exit Criteria:**
- MVP code complete
- Tests passing
- Deployment ready
- Beta plan ready

### Stage 6: BETA
**Goal:** Validate with real users  
**Duration:** 2-4 weeks  
**Gate Keeper:** Codesmith + Clawson  
**Required Artifacts:**
- `experiment_results.md` (activation metrics, feedback logs)

**Exit Criteria:**
- 5-10 beta customers
- Activation rate ≥ 50%
- NPS ≥ 7.0
- Feedback incorporated
- Ready for revenue

**Kill Condition:**
- Activation rate < 10% → automatic kill

### Stage 7: REVENUE
**Goal:** Generate first $**  
**Duration:** Ongoing  
**Gate Keeper:** Clawson  
**Required Artifacts:**
- `metrics.json` (MRR, customers, CAC, LTV)

**Exit Criteria:**
- $1,000+ MRR
- 5+ paying customers
- Unit economics positive

**Kill Condition:**
- MRR < $1,000 after 90 days → automatic kill
- No users after 60 days → automatic kill

### Stage 8: SCALE
**Goal:** Growth & optimization  
**Duration:** Ongoing  
**Gate Keeper:** Clawson  
**Required Artifacts:**
- Growth strategy documented
- Automation systems in place
- Distribution channels active

**Exit Criteria:**
- $5,000+ MRR
- Predictable growth trajectory
- Team scaled appropriately

---

## VENTURE.YAML (Metadata File)

```yaml
venture: LeadScore.ai
description: "AI-powered lead qualification for sales teams"
owner_agent: codesmith
owner_human: steve
created_at: 2026-03-05

timeline:
  target_launch: 2026-04-30
  estimated_weeks: 8

targets:
  mrr: 5000
  customers: 10
  accuracy: 0.95
  nps: 8.0

team:
  - codesmith

kill_override: false # Set to true to preserve killed venture in active portfolio
```

---

## STAGE.JSON (Stage Tracking File)

```json
{
  "venture": "leadscore-ai",
  "stage": "BUILD",
  "stage_entered": "2026-03-05T18:30:00Z",
  "owner_agent": "codesmith",
  "artifacts_complete": true,
  "next_stage": "BETA",
  "gates_passed": [
    "IDEA (2026-03-05)",
    "EVIDENCE (2026-03-05)",
    "OPPORTUNITY_SCORE (2026-03-05)",
    "PRD (2026-03-05)"
  ],
  "gates_pending": ["BETA", "REVENUE", "SCALE"],
  "last_updated": "2026-03-05T18:30:00Z"
}
```

---

## METRICS.JSON (Venture Metrics)

```json
{
  "venture": "leadscore-ai",
  "timestamp": "2026-03-05T18:30:00Z",
  "metrics": {
    "mrr": 0,
    "users": 0,
    "activation_rate": 0,
    "nps": null,
    "build_progress": 0.32,
    "experiments_run": 0
  },
  "targets": {
    "mrr": 5000,
    "users": 10,
    "activation_rate": 0.5,
    "nps": 8.0
  },
  "history": [
    {
      "timestamp": "2026-03-05T18:30:00Z",
      "metrics": { "build_progress": 0.32 }
    }
  ]
}
```

---

## OPPORTUNITY SCORING SYSTEM

**Moonshot produces scores before PRD stage.**

### Score Components (0-10 each)

1. **Market Demand** (0-10)
   - Search volume
   - TAM size
   - Customer willingness to pay

2. **Automation Potential** (0-10)
   - Repeatability
   - Time savings
   - Cost reduction

3. **MRR Potential** (0-10)
   - Price point
   - Market size
   - Revenue potential

4. **Founder Advantage** (0-10)
   - Team domain expertise
   - Network in space
   - Unfair advantage

### Total Score: 0-40

**Rules:**
- Score < 28 → **REJECTED** (automatic kill, cannot proceed to PRD)
- Score 28-33 → **ELIGIBLE** (proceed to PRD)
- Score ≥ 34 → **PRIORITY** (accelerated path, extra resources)

---

## KILL RULES (Automatic Termination)

### Trigger Conditions

**Opportunity Stage:**
- Score < 28 → Kill immediately
- Reason: "Low opportunity score"

**Beta Stage:**
- Activation rate < 10% for 2 weeks → Kill
- Reason: "Failed beta validation"

**Revenue Stage (90-Day Window):**
- MRR < $1,000 after 90 days → Kill
- Reason: "Failed revenue target"
- No users after 60 days → Kill
- Reason: "No user traction"

### Kill Process

1. Update `stage.json`: `stage: KILLED`, `kill_reason: string`, `kill_date: ISO-8601`
2. Archive to `/ventures/archive/{venture_slug}/` (preserve for history)
3. Remove from `venture_registry.json`
4. Log to `venture_activity.json`: "KILLED: [reason]"
5. Notify Clawson + Activity Feed
6. Team resources freed

### No Appeal
- Once killed, venture cannot be resurrected
- Archived ventures kept for historical reference + learning
- Kill decision is final

---

## VENTURE_REGISTRY.JSON (Portfolio Index)

Location: `/ventures/venture_registry.json`

```json
{
  "lastUpdated": "2026-03-05T18:30:00Z",
  "ventures": [
    {
      "slug": "leadscore-ai",
      "name": "LeadScore.ai",
      "stage": "BUILD",
      "status": "active",
      "owner": "codesmith",
      "created_at": "2026-03-05",
      "mrr": 0,
      "score": 38
    }
  ],
  "counts": {
    "active": 1,
    "killed": 0,
    "total": 1
  },
  "portfolio_mrr": 0
}
```

**Mission Control reads this file to display venture portfolio.**

---

## MISSION CONTROL INTEGRATION

### Venture Portfolio Dashboard

**Display:**
- Ventures by stage (grid: IDEA | EVIDENCE | OPPORTUNITY_SCORE | PRD | BUILD | BETA | REVENUE | SCALE)
- Venture count per stage
- Total active ventures
- Total MRR
- Kill rate (% of ventures killed)
- Success rate (% reaching REVENUE stage)

### Venture Detail View

**Click venture → Show:**
- Current stage
- Days in current stage
- Required artifacts (with checkmarks if complete)
- Metrics (MRR, users, activation_rate, build_progress)
- Recent activity (from venture_activity.json)
- Next gate requirements
- Kill option (if applicable)
- Build status (if in BUILD stage)

### Activity Logging

All venture actions logged to `venture_activity.json`:
```
"Created venture: LeadScore.ai"
"Advanced: IDEA → EVIDENCE"
"Advanced: EVIDENCE → OPPORTUNITY_SCORE (Score: 38/40)"
"Advanced: OPPORTUNITY_SCORE → PRD"
"Advanced: PRD → BUILD"
"Updated metrics: build_progress 0% → 32%"
"Killed: LeadScore.ai (Reason: Low opportunity score)"
```

---

## MULTI-VENTURE SUPPORT

**System supports unlimited concurrent ventures.**

**venture_registry.json** is the single source of truth for active ventures.

**Each venture is independent:**
- Own directory
- Own stage progression
- Own metrics
- Own team
- Own timeline

**Example Portfolio:**
```
/ventures/leadscore-ai/ (BUILD stage)
/ventures/agentinstallkit/ (IDEA stage)
/ventures/workflowcopilot/ (REVENUE stage)
/ventures/archive/deadstartup/ (KILLED)
```

---

## AGENT ROLES

**Moonshot:**
- Generates venture candidates
- Conducts market evidence research
- Produces opportunity scores
- Validates IDEA + EVIDENCE + OPPORTUNITY_SCORE stages

**Clawson (COO):**
- Approves venture progression (enforces stage gates)
- Orchestrates venture lifecycle
- Makes kill decisions
- Oversees portfolio health
- Allocates resources

**Codesmith:**
- Builds venture products
- Manages BUILD stage
- Deploys MVPs
- Handles BETA validation
- Maintains metrics.json (build_progress)

**Steve:**
- Strategic venture decisions
- Final approval on SCALE decisions
- Kill override authority (rare)

---

## OPERATOR COMMANDS

### Via CLI / API

```bash
# Create venture
POST /api/ventures
{
  "name": "New Venture",
  "owner": "codesmith",
  "description": "...",
  "idea_md": "..."
}

# Advance venture
POST /api/ventures/leadscore-ai/advance
{
  "next_stage": "EVIDENCE",
  "artifacts": ["market_evidence.md"]
}

# Kill venture
POST /api/ventures/leadscore-ai/kill
{
  "reason": "Low opportunity score",
  "decision_maker": "clawson"
}

# List ventures
GET /api/ventures
GET /api/ventures?stage=BUILD
GET /api/ventures?status=active

# Venture status
GET /api/ventures/leadscore-ai

# Update metrics
POST /api/ventures/leadscore-ai/metrics
{
  "build_progress": 0.45,
  "mrr": 2500
}
```

---

## GOVERNANCE RULES

### Stage Progression

**Rule 1:** No skipping stages  
**Rule 2:** All required artifacts must be complete before advancing  
**Rule 3:** Gate keeper must approve advancement  
**Rule 4:** Advancement logged to activity + registry updated  

### Artifact Enforcement

**Rule 5:** Missing artifacts block stage advancement  
**Rule 6:** Artifacts are SSOT (authoritative source of truth)  
**Rule 7:** Artifact changes logged to venture_activity.json  

### Kill Rules

**Rule 8:** Automatic kill triggers applied immediately  
**Rule 9:** Manual kill requires Clawson or Steve approval  
**Rule 10:** Killed ventures cannot be resurrected  
**Rule 11:** Kill decision final and non-negotiable  

---

## SAFETY REQUIREMENTS

**Do NOT modify:**
- `/canon/*` (canonical configurations)
- `/config/*` (system configurations)
- `/agents/*` (agent definitions)

**Only create/modify:**
- `/ventures/*` (venture directories + artifacts)
- `/data/ventures/*` (SSOT files)
- Mission Control UI (read-only access to venture data)

**No breaking changes:**
- Existing agents continue to function
- Existing workflows unaffected
- OpenClaw architecture unchanged
- Mission Control remains operational dashboard

---

## ACCEPTANCE CRITERIA

VentureOS v1 complete when:

✅ 8-stage pipeline implemented + working  
✅ Artifact enforcement operational (blocks invalid progression)  
✅ venture.yaml + stage.json + metrics.json files created + tracked  
✅ Opportunity scoring system live (Moonshot scores, <28 kills)  
✅ Kill rules automated (MRR, activation, timeline triggers)  
✅ venture_registry.json manages portfolio  
✅ Multiple concurrent ventures supported  
✅ Mission Control displays venture portfolio  
✅ Operator commands working (create, advance, kill, list, status)  
✅ All data in SSOT (no fabrication)  
✅ No breaking changes to existing architecture  

---

**Version:** 1.0  
**Date:** 2026-03-05  
**Approved By:** Steve Vettori  
**Status:** Ready for Implementation
