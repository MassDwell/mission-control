# Change Request: CR-VENTUREOS-V1-ENHANCED

**Title:** VentureOS v1 — Stage-Gated Venture Governance System  
**Date:** 2026-03-05 18:07 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P0 (Strategic Architecture)  
**Scope:** 8-stage pipeline, artifact enforcement, opportunity scoring, kill rules, portfolio tracking  
**Timeline:** 3 weeks  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

Build VentureOS v1 — a stage-gated governance system for running multiple startups simultaneously.

**Capabilities:**
- 8-stage venture pipeline (IDEA → SCALE)
- Artifact enforcement (blocks invalid progression)
- Opportunity scoring (Moonshot produces scores, <28 kills)
- Automated kill rules (MRR, activation, timeline triggers)
- Multi-venture portfolio support
- Full Mission Control integration
- Operator commands (create, advance, kill, list, status)

**Architecture:**
- `/ventures/{venture_slug}/` — venture home
- `venture.yaml` + `stage.json` + `metrics.json` per venture
- `/artifacts/` — required documents (idea.md, market_evidence.md, etc.)
- `/build/` — repo + deployment
- `/logs/venture_activity.json` — append-only activity log
- `venture_registry.json` — portfolio index (SSOT)

**Safety:** No changes to `/canon`, `/config`, `/agents`. Existing architecture preserved.

**Result:** Structured venture portfolio management with stage gates, artifact enforcement, and automated governance.

---

## DELIVERABLES

### 1. VENTURE DIRECTORY STRUCTURE

Create canonical structure for each venture:

```
/ventures/{venture_slug}/
├── venture.yaml (metadata)
├── stage.json (current stage + gate history)
├── metrics.json (MRR, users, build_progress, etc.)
├── /artifacts/
│   ├── idea.md
│   ├── market_evidence.md
│   ├── opportunity_score.md
│   ├── prd.md
│   ├── architecture.md
│   ├── pricing_model.md
│   ├── go_to_market.md
│   └── experiment_results.md
├── /build/
│   ├── repo_link.txt
│   └── deployment.md
└── /logs/
    └── venture_activity.json
```

**LeadScore.ai example:**
```
/ventures/leadscore-ai/
├── venture.yaml
├── stage.json (currently in BUILD)
├── metrics.json (build_progress: 0.32)
├── /artifacts/ (all 8 documents)
├── /build/ (repo_link.txt, deployment.md)
└── /logs/venture_activity.json
```

### 2. 8-STAGE PIPELINE

**Stages (cannot skip):**
1. **IDEA** — Problem + customer (Gate: Moonshot) → Requires: idea.md
2. **EVIDENCE** — Market validation (Gate: Moonshot) → Requires: market_evidence.md
3. **OPPORTUNITY_SCORE** — Venture scoring (Gate: Clawson) → Requires: opportunity_score.md, Score ≥28
4. **PRD** — Product definition (Gate: Codesmith) → Requires: prd.md
5. **BUILD** — MVP development (Gate: Codesmith) → Requires: architecture.md, repo_link.txt, deployment.md
6. **BETA** — User validation (Gate: Clawson) → Requires: experiment_results.md, Activation ≥50%
7. **REVENUE** — First $ (Gate: Clawson) → Requires: metrics.json, MRR ≥$1k after 90 days
8. **SCALE** — Growth phase (Gate: Clawson) → Requires: growth strategy, MRR ≥$5k

**Gate Logic:**
- Stage progression only if:
  - All required artifacts present
  - Gate keeper approves
  - Preconditions met (scores, metrics, etc.)
- Advancement blocked if artifacts missing → error message lists what's needed

### 3. ARTIFACT ENFORCEMENT

**System enforces:**
- Stage.json has required artifacts for current stage
- Missing artifacts block progression
- Artifact completion updated on file creation
- stage.json.artifacts_complete must be true before advancing

**Example Error:**
```
Cannot advance IDEA → EVIDENCE: Missing artifact market_evidence.md
```

### 4. OPPORTUNITY SCORING SYSTEM

**Moonshot produces scores (0-40 scale):**
- Market Demand (0-10)
- Automation Potential (0-10)
- MRR Potential (0-10)
- Founder Advantage (0-10)

**Rules:**
- Score < 28 → Venture rejected (automatic kill, stored in archive)
- Score 28-33 → Eligible (proceed to PRD)
- Score ≥ 34 → Priority (accelerated resources)

**Implementation:**
- Score stored in opportunity_score.md
- stage.json tracks score
- Advancement to PRD blocked if score < 28

### 5. VENTURE.YAML (Metadata)

Tracks venture info:
```yaml
venture: LeadScore.ai
description: "AI-powered lead qualification"
owner_agent: codesmith
owner_human: steve
created_at: 2026-03-05

timeline:
  target_launch: 2026-04-30
  estimated_weeks: 8

targets:
  mrr: 5000
  customers: 10

team:
  - codesmith

kill_override: false
```

### 6. STAGE.JSON (Stage Tracking)

Tracks progression + gate history:
```json
{
  "venture": "leadscore-ai",
  "stage": "BUILD",
  "stage_entered": "2026-03-05T18:30:00Z",
  "owner_agent": "codesmith",
  "artifacts_complete": true,
  "next_stage": "BETA",
  "gates_passed": ["IDEA", "EVIDENCE", "OPPORTUNITY_SCORE", "PRD"],
  "gates_pending": ["BETA", "REVENUE", "SCALE"]
}
```

### 7. METRICS.JSON (Venture Metrics)

Tracks progress toward targets:
```json
{
  "venture": "leadscore-ai",
  "timestamp": "2026-03-05T18:30:00Z",
  "metrics": {
    "mrr": 0,
    "users": 0,
    "activation_rate": 0,
    "build_progress": 0.32,
    "experiments_run": 0
  },
  "targets": {
    "mrr": 5000,
    "users": 10,
    "activation_rate": 0.5
  },
  "history": [...]
}
```

Updated regularly as venture progresses.

### 8. KILL RULES (Automated)

**Automatic kills trigger immediately:**

1. **Opportunity Stage:** Score < 28 → kill
2. **Beta Stage:** Activation < 10% for 2 weeks → kill
3. **Revenue Stage:** 
   - MRR < $1,000 after 90 days → kill
   - No users after 60 days → kill

**Kill Process:**
1. Update stage.json: `stage: KILLED`, `kill_date: ISO-8601`, `kill_reason: string`
2. Move to `/ventures/archive/{venture_slug}/`
3. Remove from venture_registry.json
4. Log to venture_activity.json: "KILLED: [reason]"
5. Notify Clawson + activity feed
6. Final + non-negotiable (no appeal)

### 9. VENTURE_REGISTRY.JSON (Portfolio Index)

Master list of active ventures:
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
      "mrr": 0,
      "score": 38
    }
  ],
  "counts": {
    "active": 1,
    "killed": 0
  },
  "portfolio_mrr": 0
}
```

**Mission Control reads this file.**

### 10. OPERATOR COMMANDS (API Endpoints)

**Implement 6 endpoints:**

```bash
# Create venture
POST /api/ventures
{
  "name": "New Venture",
  "owner": "codesmith",
  "description": "...",
  "idea_md": "..."
}

# Advance stage
POST /api/ventures/{slug}/advance
{
  "next_stage": "EVIDENCE",
  "validation": {...}
}

# Kill venture
POST /api/ventures/{slug}/kill
{
  "reason": "Low score",
  "decision_maker": "clawson"
}

# List ventures
GET /api/ventures
GET /api/ventures?stage=BUILD

# Get venture
GET /api/ventures/{slug}

# Update metrics
POST /api/ventures/{slug}/metrics
{
  "build_progress": 0.45
}
```

### 11. MISSION CONTROL INTEGRATION

**New dashboard sections:**

**A. Venture Portfolio Widget**
- Stages: IDEA | EVIDENCE | OPPORTUNITY_SCORE | PRD | BUILD | BETA | REVENUE | SCALE
- Venture count per stage
- Total active, killed, portfolio MRR
- Success rate (% reaching REVENUE)

**B. Venture Detail View**
- Current stage + days in stage
- Required artifacts (with checkmarks)
- Metrics vs targets
- Recent activity (from venture_activity.json)
- Next gate requirements
- Kill option (if applicable)

**C. Activity Logging**
- All venture actions logged + visible in activity feed
- "Created venture: ...", "Advanced: IDEA → EVIDENCE", "Killed: ..."

### 12. SAFETY CONSTRAINTS

**Preserve:**
- No changes to `/canon/*`
- No changes to `/config/*`
- No changes to `/agents/*`
- Existing agents continue to function
- No breaking changes to OpenClaw

**Only create:**
- `/ventures/*` (venture directories)
- `/data/ventures/*` (SSOT files)
- Mission Control UI read-only integration

---

## IMPLEMENTATION PHASES

### Phase 1 (Days 1-3): Directory Structure + SSOT
- [ ] Create venture directory structure
- [ ] Implement venture.yaml, stage.json, metrics.json
- [ ] Create venture_registry.json
- [ ] Pre-populate with LeadScore.ai
- [ ] Validate schemas

### Phase 2 (Days 3-7): Stage Pipeline + Gates
- [ ] Implement 8-stage pipeline logic
- [ ] Add artifact enforcement (blocks invalid progression)
- [ ] Implement gate validation per stage
- [ ] Add advancement logic
- [ ] Test all stage transitions

### Phase 3 (Days 7-11): Kill Rules + Automation
- [ ] Implement automatic kill detection
- [ ] Add kill process (archive, update registry, log)
- [ ] Implement opportunity scoring <28 kill
- [ ] Implement revenue/activation kill rules
- [ ] Test all kill conditions

### Phase 4 (Days 11-16): API Endpoints
- [ ] Implement 6 operator command endpoints
- [ ] Add venture creation logic
- [ ] Add stage advancement logic
- [ ] Add kill endpoint
- [ ] Test all endpoints with curl

### Phase 5 (Days 16-21): Mission Control Integration
- [ ] Add venture portfolio widget
- [ ] Add venture detail view
- [ ] Add activity logging
- [ ] Integrate venture_registry.json reading
- [ ] Test data flow SSOT → UI

---

## TESTING REQUIREMENTS

### Unit Tests (30+)
- Venture creation
- Stage advancement (each transition)
- Artifact enforcement (blocking + passing)
- Kill rules (each trigger condition)
- Opportunity scoring
- Metrics tracking

### Integration Tests (10+)
- Create venture → advance through 8 stages
- Kill at various stages
- Multiple concurrent ventures
- Mission Control integration
- Portfolio calculations (MRR, counts, rates)

### Manual E2E Test
1. Create venture via API
2. Advance through all 8 stages
3. Verify artifacts tracked
4. Update metrics throughout progression
5. Test kill rules (trigger each condition)
6. Verify Mission Control reflects portfolio
7. Test operator commands

---

## ACCEPTANCE CRITERIA

✅ 8-stage pipeline fully implemented  
✅ Artifact enforcement working (blocks invalid progression)  
✅ venture.yaml + stage.json + metrics.json created + tracked  
✅ Opportunity scoring <28 kills ventures  
✅ Kill rules operational (MRR, activation, timeline)  
✅ venture_registry.json manages portfolio  
✅ Multiple concurrent ventures supported  
✅ All 6 operator commands working  
✅ Mission Control displays venture portfolio  
✅ All data in SSOT (no fabrication)  
✅ 40+ tests passing  
✅ ESLint clean  
✅ No breaking changes  

---

**CR ID:** CR-VENTUREOS-V1-ENHANCED  
**Date:** 2026-03-05 18:07 EST  
**Timeline:** 3 weeks, 1 FTE  
**Risk:** Low (well-scoped, SSOT-first)  
**Acceptance:** VentureOS ready for stage-gated portfolio governance
