# CR-MC-UI-1.2 Handoff — Interactive Mission Control

**Status:** ✅ **CREATED & APPROVED**  
**Date:** 2026-03-05 06:20 EST  
**Owner:** Codesmith  
**Timeline:** 2-3 weeks  
**Scope:** World-class operator console for venture pipeline  

---

## What This Is

A comprehensive change request to transform Mission Control UI from a static dashboard into an **interactive operator console**.

**Today:** You see static tiles showing "In Progress: 1"  
**After CR-MC-UI-1.2:** You click the tile → see LeadScore.ai with full details → search/filter across all ventures → navigate with keyboard

---

## High-Level Features

### 1. Clickable Venture Pipeline
- Click any stage tile → opens drilldown drawer
- Selected tile highlights (border + glow)
- Shows all ventures in that stage

### 2. Drilldown Drawer (Right Panel)
- List all ventures in selected stage
- **Search:** Fuzzy text search (name, tags, description)
- **Filters:** Status, Owner, Priority
- **Sort:** Last Event (default), Name, MRR
- Each row clickable → opens detail view

### 3. Detail Drawer (Expanded View)
- Full venture metadata (name, description, stage, status, owner)
- Key metrics (MRR target, timeline, success thresholds)
- **Links section:**
  - PRD (clickable to /ventures/leadscore/docs/prd.md)
  - CR (clickable to /ventures/leadscore/CR-LEADSCORE-001.md)
  - Repo path (clickable to /ventures/leadscore)
  - Demo URL (if set)
- Recent activity (last 5 events)
- Blockers / Timeline

### 4. Keyboard Navigation
```
← / →         Change selected stage (tiles)
/             Focus search input
↑ / ↓         Navigate ventures list
Enter         Open detail drawer
Esc           Close drawer (nested Esc closes all)
→ / ←         Navigate adjacent ventures in detail view
```

### 5. Data Source: Local JSON Only
- **SSOT:** `/data/mission-control/venture_scoreboard.json`
- **No Supabase, no external DB**
- **Read-only UI** (no mutations to SSOT)
- **Fail loud:** If data stale or API fetch fails, show visible banner

---

## What You're Building

### API Layer (3 new endpoints)
```
GET /api/ventures?stage=In Progress&search=leadscore&status=active&sort=last_event_desc
GET /api/ventures/leadscore  (full detail + activity + blockers)
GET /api/stages  (stage definitions + counts)
```

### UI Layer (5 new components)
1. **Clickable Stage Tiles** — CSS enhancements + click handlers
2. **Drilldown Drawer** — Right-side panel (400px wide, scrollable list)
3. **Search + Filters** — Fuzzy search + filter dropdowns
4. **Detail Drawer** — Full venture view (links, metrics, activity)
5. **Keyboard Navigation** — Global key handlers for ←/→/↑/↓/Enter/Esc

### Data Layer (1 new file + 1 update)
1. **venture_scoreboard.json** — Already created with LeadScore.ai
2. **mission-control-export.js** — Already populates it every 2h

---

## Specification & Constraints

**Full CR:** `/mission-control-ui/CR-MC-UI-1.2.md` (11KB, comprehensive)

**Key Constraints:**
- ✅ NO Supabase — local JSON only
- ✅ NO mutations to /canon or /config
- ✅ API reads SSOT on every request (no stale caching)
- ✅ Fail loud: show visible warnings if data stale
- ✅ Keyboard nav must feel responsive & intuitive
- ✅ Read-only UI (no changes to core system)

**Tech Stack:**
- Same as Mission Control V1 (vanilla JS, CSS Grid, no framework)
- Dark theme (existing CSS vars)
- Accessible (ARIA labels where needed)

---

## Data Contract

### venture_scoreboard.json Schema

```json
{
  "ventures": [
    {
      "venture_id": "leadscore",
      "name": "LeadScore.ai",
      "stage": "In Progress",  // Must match stage_order
      "status": "active|paused|killed|launched",
      "owner_agent": "codesmith|moonshot|clawson",
      "priority": "low|medium|high",
      "mrr": 0,
      "mrr_target": 5000,
      "links": {
        "prd": "/ventures/leadscore/docs/prd.md",
        "cr": "/ventures/leadscore/CR-LEADSCORE-001.md",
        "repo_path": "/ventures/leadscore",
        "demo_url": null
      },
      "last_event": {
        "timestamp": "ISO-8601",
        "summary": "Week 1 backend build started",
        "severity": "info"
      },
      "metrics": {
        "accuracy_target": 0.85,
        "nps_target": 30,
        "customers_target": 5,
        "mrr_target": 1000
      }
    }
  ]
}
```

---

## Roadmap (2-3 weeks)

### Week 1: API Endpoints
- [ ] `GET /api/ventures` with search/filter/sort
- [ ] `GET /api/ventures/:venture_id` with activity + blockers
- [ ] `GET /api/stages`
- [ ] Test endpoints with curl

### Week 2: UI Components
- [ ] Clickable stage tiles (CSS + click handler)
- [ ] Drilldown drawer (HTML/CSS/JS)
- [ ] Venture list with search/filter
- [ ] Detail drawer with links
- [ ] Keyboard navigation layer
- [ ] Integrate into dashboard

### Week 3: Polish & Testing
- [ ] Keyboard nav edge cases
- [ ] Responsive design (mobile)
- [ ] Animation transitions
- [ ] Error handling (missing files, stale data)
- [ ] User acceptance testing

---

## Success Criteria (Acceptance)

✅ User can navigate entire venture pipeline with keyboard  
✅ User can click stage → see ventures in that stage  
✅ User can search "leadscore" → shows LeadScore.ai  
✅ User can filter by status/owner/priority  
✅ User can click venture → see full detail with links  
✅ Links (PRD/CR/Repo) are clickable/copyable  
✅ Keyboard nav feels responsive  
✅ All data from local SSOT (venture_scoreboard.json)  
✅ No mutations to /canon or /config  
✅ Stale data warnings visible if export cycle fails  

---

## Files Reference

### To Create
- `mission-control-ui/public/drilldown.css` — Drawer + detail styles
- `mission-control-ui/public/drilldown.js` — Drilldown logic + keyboard nav
- `mission-control-ui/api/ventures.js` — Query + filter logic

### To Modify
- `mission-control-ui/server.js` — Add `/api/ventures*` routes
- `mission-control-ui/public/script.js` — Integrate drilldown + keyboard nav
- `mission-control-ui/public/style.css` — Add tile click styles

### Data (Already Done)
- ✅ `data/mission-control/venture_scoreboard.json` — Created
- ✅ `scripts/mission-control-export.js` — Already populates it

---

## Next Step

**Codesmith:** Begin Phase 1 (API endpoints)

1. Read full CR: `/mission-control-ui/CR-MC-UI-1.2.md`
2. Set up 3 new API endpoints
3. Test with curl + sample queries
4. Report back when endpoints ready for UI integration

**Timeline:** Phase 1 should take ~3-4 days

---

## Questions/Clarifications

**Q: Should the detail drawer show live venture_work_links data?**  
A: Yes, but read-only. If a link in venture_scoreboard.json is missing or broken, show a "Not Available" label.

**Q: What if user presses ← on "Opportunity" stage?**  
A: Wrap to "Closed" (last stage). Same for → on "Closed" → wraps to "Opportunity".

**Q: How to handle ventures with no last_event?**  
A: Show "No activity recorded" in the list row.

**Q: Should search work across all stages or only selected stage?**  
A: Only selected stage (to keep focus). If user wants global search, they can re-filter by clearing stage selection.

---

**Status:** 🟢 **READY FOR CODESMITH**

Full specification: `/mission-control-ui/CR-MC-UI-1.2.md`  
Data schema: `/data/mission-control/venture_scoreboard.json`  
Activity logged: ✅ (visible in Mission Control Activity Feed)
