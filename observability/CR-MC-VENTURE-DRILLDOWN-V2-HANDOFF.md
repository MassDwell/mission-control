# CR-MC-VENTURE-DRILLDOWN-V2 Handoff Brief

**Status:** PROPOSED (awaiting approval)  
**Date:** 2026-03-05 11:49 EST  
**Owner:** Codesmith  
**Timeline:** 2-3 weeks  

---

## What This Is

A comprehensive upgrade to Mission Control's venture detail view, transforming it from minimal (name/status) to **decision-grade visibility** with full context:

**Before:** Click venture → see name, status, last event  
**After:** Click venture → see everything: timeline, artifacts, workstreams, blockers, checklist, metrics

---

## The Vision

When an operator clicks a venture, they see:

1. **Header** — Name, stage, owner, health status, timeline
2. **Timeline** — Activity history filtered to this venture (24h/7d/30d)
3. **Artifacts** — Links to PRD, CR, repo, demo (copy-paste ready)
4. **Workstreams** — All work items driving this venture + detail view
5. **Blockers** — What's blocking (with SLA timers)
6. **Checklist** — Phase gate readiness (spec → deploy)
7. **Metrics** — Success targets and execution KPIs

**Result:** Full venture context in one drawer. No file hunting.

---

## Key Constraints (Operator Lock)

✅ **SSOT-Only:** All data from JSON files, never invented  
✅ **Read-Only:** Inspection only, no mutations to system  
✅ **No External Deps:** No Supabase, all local data  
✅ **Fail-Loud:** Missing data → explicit "No data available", not fake  
✅ **Data Citations:** Every section shows source file + timestamp  

---

## Sections to Build

| Section | Purpose | Data Source |
|---------|---------|-------------|
| **Header** | Name, stage, owner, health, timeline | venture_scoreboard.json |
| **Timeline** | Venture-specific activity history | agent_activity.json (filtered) |
| **Artifacts** | Links to PRD, CR, repo, demo | venture_scoreboard.json.links |
| **Workstreams** | Linked work items + detail subview | venture_work_links.json + workstreams.json |
| **Blockers** | What's blocking with SLA timers | blocked_work.json |
| **Checklist** | Phase gate readiness (spec → deploy) | venture_scoreboard.json + workstreams.json |
| **Metrics** | Success targets and KPIs | venture_scoreboard.json.metrics |

---

## Data Available (Verified)

✅ **venture_scoreboard.json** — Has: name, stage, status, owner, priority, links, last_event, metrics, timeline_weeks, started_date  
✅ **agent_activity.json** — Has: 40 entries, all timestamped with venture context  
✅ **venture_work_links.json** — Maps ventures to workstreams  
✅ **workstreams.json** — Work items with phases, assignments, progress  
✅ **blocked_work.json** — Blockers with type, owner, SLA  
✅ **venture_velocity.json** — Metrics and stage counts  

**Optional:** ventures.json (proposed for detailed checklists + timelines, not blocking MVP)

---

## Implementation Roadmap

**Phase 1 (Week 1):** API endpoints  
- Extend `/api/ventures/:venture_id` 
- Add health calculation
- Add activity filtering by venture
- Add workstream linking

**Phase 2 (Week 2):** UI components  
- Detail drawer layout
- Header, timeline, artifacts sections
- Workstreams + detail subview
- Blockers section

**Phase 3 (Week 2-3):** Polish  
- Checklist section (phase gates)
- Metrics section (KPIs)
- Data source citations (every section)
- Error handling (missing data)

**Phase 4 (Week 3):** Testing  
- Functional tests (all sections work)
- Data integrity (SSOT-only)
- Operator Lock (constraints enforced)
- Performance (<500ms load)
- Quality gates (ESLint, tests, drift)

---

## Success Criteria

✅ Full venture context visible in one drawer  
✅ All data from SSOT files only  
✅ Missing data shown as "No data available" (not schema keys)  
✅ Data sources cited (file + timestamp per section)  
✅ No mutations to system files  
✅ No external dependencies  
✅ Read-only UI  
✅ Fail-loud on errors  
✅ All tests passing  
✅ Performance <500ms  

---

## Files Created

- `/mission-control-ui/CR-MC-VENTURE-DRILLDOWN-V2.md` — Full specification (21KB, comprehensive)
- `/observability/CR-MC-VENTURE-DRILLDOWN-V2-HANDOFF.md` — This brief

---

## What Steve Needs To Do

**Review the CR:** `/mission-control-ui/CR-MC-VENTURE-DRILLDOWN-V2.md`

**Approve to proceed:** Reply with `✅ APPROVED` (or request changes)

---

## Next Step

Once approved, Codesmith will:
1. Extend API endpoints (Phase 1)
2. Build detail drawer (Phase 2)
3. Test & verify Operator Lock constraints (Phase 3-4)
4. Deliver fully verified venture drilldown

---

**CR Status:** Ready for Review & Approval  
**Full Spec:** `/mission-control-ui/CR-MC-VENTURE-DRILLDOWN-V2.md`
