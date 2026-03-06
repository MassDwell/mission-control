# Change Request: CR-VENTUREOS-V1

**Title:** VentureOS v1 — Venture Governance System  
**Date:** 2026-03-05 18:07 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P0 (Strategic)  
**Scope:** Venture creation, artifact tracking, stage gates, multi-venture support, kill rules  
**Timeline:** 2 weeks  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

Build VentureOS — the operational system for venture portfolio governance.

**Capabilities:**
- Create ventures with structured governance
- Track artifacts (memo, PRD, CR, code)
- Stage gates (opportunity → investigation → approval → implementation → launch)
- Multi-venture support (LeadScore.ai first, more to follow)
- Kill rules (data-driven termination)
- Mission Control integration (portfolio visibility)

**Architecture:**
- `/ventures/{venture_id}/` — venture home directory
- `/data/ventures/` — SSOT (4 JSON files: scoreboard, pipeline, work_links, full detail)
- 8 API endpoints (list, detail, create, gate, kill, etc.)
- Clawson enforces gates
- Moonshot generates candidates

**Result:** Structured venture pipeline with stage gates, artifact tracking, and portfolio visibility.

---

## DELIVERABLES

### 1. SSOT Files (4 Total)

Location: `/data/ventures/`

**A. venture_scoreboard.json** (master list)
- All ventures (active + killed)
- Fields: id, name, stage, status, owner, timeline, budget, target_mrr, metrics
- Schema validates stage values

**B. venture_pipeline.json** (stage distribution)
- Counts per stage (opportunity, investigation, approval, implementation, launch, killed)
- Total count, success rate
- Updated on every stage change

**C. venture_work_links.json** (venture → workstream mapping)
- Links ventures to workstreams
- Enables filtering work by venture
- Updated when workstreams created/linked

**D. ventures.json** (full detail)
- Complete venture context (market, team, timeline, financials, metrics, artifacts)
- Master record (authoritative source)
- Used by drilldowns + dashboards

### 2. API Endpoints (8 Total)

**GET /api/ventures**
- List all ventures with summary
- Fields: id, name, stage, status, owner, timeline, target_mrr
- Response includes total, active count, killed count

**GET /api/ventures/:venture_id**
- Full venture detail from ventures.json
- Include: market opportunity, team, timeline, financials, metrics, artifacts, workstreams

**POST /api/ventures**
- Create new venture in OPPORTUNITY stage
- Input: name, description, owner, market_opportunity, memo_url
- Output: venture_id, stage, message
- Creates directory `/ventures/{venture_id}/`

**POST /api/ventures/:venture_id/gate**
- Advance venture to next stage (with validation)
- Input: next_stage, validation_data
- Output: current_stage, gateway_requirements, message
- Validates stage preconditions before advancing

**POST /api/ventures/:venture_id/kill**
- Kill venture (no appeal)
- Input: reason, decision_maker, notes
- Output: status, killed_at, message
- Archives venture, updates scoreboard, logs to activity

**POST /api/ventures/:venture_id/metrics**
- Update success metrics (for tracking progress)
- Input: metric_name, value, timestamp
- Output: status, metrics_snapshot
- Used for launch monitoring

**GET /api/venture-pipeline**
- Stage distribution (for Mission Control widget)
- Fields: stages (with counts per stage), total, success_rate

**GET /api/venture-at-risk**
- List ventures at risk (overdue for gate, blocked >30d, etc.)
- Fields: venture_id, risk_reason, days_overdue
- Alerts Clawson to issues

### 3. Directory Structure

```
/ventures/
├── leadscore-ai/
│   ├── docs/
│   │   ├── venture_memo.md (1-pager)
│   │   ├── prd.md (product requirements)
│   │   ├── experiment_plan.md (validation)
│   │   └── cr-leadscore-001.md (change request)
│   ├── api/ (backend code)
│   ├── worker/ (job processing)
│   ├── web/ (frontend)
│   ├── tests/ (test suite)
│   └── .metadata/
│       └── (internal venture tracking)
└── [future ventures...]
```

### 4. Stage Gate Enforcement

**Opportunity → Investigation**
- Gate Keeper: Moonshot
- Requirement: Memo written, vision clear
- Duration: 1-2 weeks

**Investigation → Approval**
- Gate Keeper: Clawson
- Requirement: Market fit proven, team ready
- Duration: 2-4 weeks
- Validation:
  - TAM > $10M
  - Competitors analyzed (3+)
  - Team committed (>50%)
  - Budget estimated
  - CR submitted

**Approval → Implementation**
- Gate Keeper: Steve
- Requirement: Funding approved
- Duration: 1-2 weeks

**Implementation → Launch**
- Gate Keeper: Codesmith (build owner)
- Requirement: MVP complete
- Duration: 4-16 weeks
- Validation:
  - Workstreams closed
  - Tests passing
  - Success criteria ≥80% met

**Launch → Success**
- Gate Keeper: Clawson (portfolio)
- Requirement: Live + metrics tracked
- Duration: ongoing

### 5. Kill Rules

**Automatic (System):**
- No market fit (TAM <$10M)
- No team available
- 18+ months overdue
- Metrics <50% of targets after launch

**Manual (Human):**
- Strategic pivot
- Team departure
- Blocker staled >30d
- Market shift

**Kill Process:**
1. Update venture_scoreboard.json (status: killed, reason: string)
2. Log to agent_activity.json
3. Archive `/ventures/{venture_id}/.archive/`
4. Remove from venture_work_links.json
5. Update venture_pipeline.json
6. Notify Clawson

### 6. Mission Control Integration

**Venture Pipeline Widget**
- Display stage counts (opportunity, investigation, etc.)
- Show total ventures, success rate
- Link to venture detail

**Venture Drilldown Enhancement**
- Add section: "Stage Timeline" (when entered each stage)
- Add section: "Success Metrics" (target vs current)
- Add button: "Kill Venture" (if blocked >30d)

**Activity Logging**
- Log all venture stage changes
- Log kill decisions
- Log metric updates

### 7. Testing & Validation

**Unit Tests (20+):**
- Venture creation
- Stage gate validation (each transition)
- Kill rules enforcement
- Metrics tracking
- SSOT persistence

**Integration Tests:**
- Create venture → advance through stages → launch
- Kill at various stages
- Multiple ventures in parallel
- Mission Control integration (data flows)

**Manual Verification:**
- Create new venture via API
- Advance through all 5 stages
- Verify artifacts tracked
- Verify metrics update
- Verify Mission Control reflects portfolio
- Test kill rules (each condition)

---

## IMPLEMENTATION PHASES

### Phase 1 (Days 1-2): SSOT + Schema
- [ ] Create 4 SSOT files in `/data/ventures/`
- [ ] Define JSON schemas
- [ ] Validate LeadScore.ai data in each file
- [ ] Test file format + parsing

### Phase 2 (Days 2-4): API Endpoints
- [ ] Implement 8 endpoints in Mission Control server
- [ ] Add route handlers to `server.js`
- [ ] Implement stage gate validation logic
- [ ] Implement kill rules logic
- [ ] Test all endpoints with curl

### Phase 3 (Days 4-5): Stage Gate Enforcement
- [ ] Validate preconditions for each stage transition
- [ ] Return error if preconditions unmet
- [ ] Log stage changes to agent_activity.json
- [ ] Update venture_scoreboard.json + venture_pipeline.json on transition

### Phase 4 (Days 5-7): Mission Control Integration
- [ ] Add venture-pipeline widget to dashboard
- [ ] Add venture-at-risk alerts panel
- [ ] Link venture detail to existing drilldown
- [ ] Update activity feed with venture events
- [ ] Test data flow from SSOT → UI

### Phase 5 (Days 7-8): Testing + Hardening
- [ ] Write 20+ unit tests
- [ ] Write 5+ integration tests
- [ ] Manual E2E test (create venture, advance stages, kill)
- [ ] Verify all data flows SSOT → Mission Control
- [ ] ESLint clean

---

## ACCEPTANCE CRITERIA

✅ New venture can be created via POST /api/ventures  
✅ Venture artifacts tracked in `/ventures/{venture_id}/docs/`  
✅ Stage gates enforced (validation blocks invalid transitions)  
✅ Multiple ventures supported in schema  
✅ Kill rules operational (auto + manual)  
✅ Mission Control shows venture portfolio  
✅ All data in SSOT files  
✅ All 8 endpoints live + tested  
✅ 25+ tests passing (unit + integration)  
✅ ESLint clean  
✅ No hardcoded venture IDs  

---

**CR ID:** CR-VENTUREOS-V1  
**Date:** 2026-03-05 18:07 EST  
**Timeline:** 2 weeks, 1 FTE  
**Risk:** Low (well-scoped, SSOT-based)  
**Acceptance:** VentureOS ready for portfolio governance + multi-venture support
