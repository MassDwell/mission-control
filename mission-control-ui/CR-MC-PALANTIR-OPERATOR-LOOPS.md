# MASTER CHANGE REQUEST: CR-MC-PALANTIR-OPERATOR-LOOPS

**Title:** Mission Control System Upgrade — Palantir Mode + Operator Loops  
**Date:** 2026-03-05 12:43 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith + Senior Engineer (2 FTE)  
**Priority:** P0 (Strategic Transformation)  
**Scope:** Complete architectural redesign of Mission Control  
**Timeline:** 4-6 weeks (5 phases)  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

Transform Mission Control from **passive dashboard** into **active operator command center** with:

- ✅ Fixed SSOT (single source of truth) — all metrics from local JSON only
- ✅ Relationship graph — visualize venture/agent/workstream/blocker/activity connections
- ✅ Command center — pause/kill/advance ventures, spawn workstreams, assign agents
- ✅ Intelligence layer — auto-detect stalled work, blockers, overload, opportunities
- ✅ Engagement loops — momentum, discovery feed, operator impact tracker
- ✅ Enhanced drilldown — graph view + full context + commands
- ✅ Behavioral loops — observe → act → see result → improve (addictive engagement)

**Result:** Operator becomes true command center orchestrator. System responds visibly to decisions. Constant discovery loop drives iteration.

---

## OBJECTIVE 1: FIX DATA DRIFT + ENFORCE SSOT

### Problem

Current Mission Control has:
- Cached agent counts (stale)
- Hardcoded values (brittle)
- Supabase references (external dep)
- Multiple data sources (drift risk)

### Solution: Single Source of Truth

**SSOT Directory:**
```
/workspace/data/mission-control/

Required files:
✓ agent_activity.json
✓ workstreams.json
✓ blocked_work.json
✓ venture_pipeline.json (if exists)
✓ venture_velocity.json
✓ venture_scoreboard.json
✓ agents_runtime.json (NEW)
```

### New File: agents_runtime.json

**Schema:**
```json
{
  "lastUpdated": "2026-03-05T12:43:00.000Z",
  "agents": [
    {
      "id": "clawson",
      "name": "Clawson",
      "status": "active",
      "role": "orchestrator",
      "last_heartbeat": "2026-03-05T12:43:00.000Z",
      "owned_workstreams": 0,
      "recent_errors": 0
    },
    {
      "id": "codesmith",
      "name": "Codesmith",
      "status": "active",
      "role": "engineering",
      "last_heartbeat": "2026-03-05T12:40:00.000Z",
      "owned_workstreams": 4,
      "recent_errors": 0
    },
    {
      "id": "moonshot",
      "name": "Moonshot",
      "status": "active",
      "role": "venture_discovery",
      "last_heartbeat": "2026-03-05T11:20:00.000Z",
      "owned_workstreams": 0,
      "recent_errors": 0
    },
    {
      "id": "personal-assistant",
      "name": "Personal Assistant",
      "status": "active",
      "role": "operations",
      "last_heartbeat": "2026-03-05T12:30:00.000Z",
      "owned_workstreams": 2,
      "recent_errors": 0
    }
  ]
}
```

### Implementation

**Changes Required:**
1. Create `agents_runtime.json` with canonical agent list
2. Remove all cached agent counts from UI
3. Remove all hardcoded "6 agents" references
4. Remove all Supabase API calls
5. Make "Active Agents" metric computed dynamically:
   ```javascript
   active_agents = agents_runtime.json.agents.filter(a => a.status == 'active').length
   ```
6. Update every cron job / export cycle to refresh `agents_runtime.json` from:
   - `canon/registry.json` (enabled agents)
   - `agent_activity.json` (last heartbeat)
   - `workstreams.json` (owned workstreams)

**Validation:**
- All Mission Control metrics must be traceable to a SSOT file
- No cached values > 10 seconds old
- No hardcoded strings in UI
- 100% SSOT authority

---

## OBJECTIVE 2: PALANTIR RELATIONSHIP GRAPH

### Problem

Current drilldowns show isolated views. Operator cannot see how ventures, agents, workstreams, and blockers relate.

### Solution: Relationship Graph Visualization

### New File: venture_relationships.json

**Schema:**
```json
{
  "lastUpdated": "2026-03-05T12:43:00.000Z",
  "ventures": [
    {
      "id": "leadscore-ai",
      "name": "LeadScore.ai",
      "stage": "in_progress",
      "owner_agent": "codesmith",
      "workstreams": [
        "backend-api-scaffolding",
        "worker-job-processor",
        "web-dashboard-alpha"
      ],
      "blockers": [],
      "related_ventures": [],
      "recent_activity_count": 20
    }
  ],
  "workstreams": [
    {
      "id": "backend-api-scaffolding",
      "name": "Backend API Scaffolding",
      "venture_id": "leadscore-ai",
      "owner_agent": "codesmith",
      "phase": "build",
      "progress": 90,
      "blockers": [],
      "dependencies": []
    }
  ],
  "agents": [
    {
      "id": "codesmith",
      "name": "Codesmith",
      "owned_ventures": ["leadscore-ai"],
      "owned_workstreams": ["backend-api-scaffolding", "worker-job-processor", "web-dashboard-alpha"],
      "error_count_24h": 0
    }
  ],
  "blockers": [
    {
      "id": "blocker-001",
      "venture_id": "leadscore-ai",
      "workstream_id": "backend-api-scaffolding",
      "owner": "steve",
      "severity": "critical"
    }
  ]
}
```

### Graph View (In Venture Drilldown)

**Display:**
```
LeadScore.ai [In Progress]
 ├── Backend API [Build, 90%] → Codesmith
 │   └── Blockers: None
 ├── Worker Job Processor [Investigation, 20%] → Codesmith
 │   └── Blockers: None
 ├── Web Dashboard [Design, 5%] → Codesmith
 │   └── Blockers: None
 └── Activity: 20 events (last 24h)
```

**Technology:**
- Use lightweight JS library (D3.js or vis.js)
- Interactive nodes (click to drill)
- Color-coded by type (venture=blue, workstream=green, agent=red, blocker=orange)
- Edge thickness = strength of relationship

**Purpose:**
- Operator understands venture structure at a glance
- See how agents connect to ventures
- Identify blocker dependencies
- Navigate relationships (click node → open drilldown)

---

## OBJECTIVE 3: COMMAND CENTER CAPABILITIES

### Problem

Mission Control is read-only. Operator cannot take action from dashboard.

### Solution: Operator Commands (In Venture Drilldown)

### Commands Added

#### Pause Venture
- Action: Pause venture (status: paused)
- Updates: venture_scoreboard.json
- Logs: agent_activity.json ("Paused venture: LeadScore.ai")
- Effect: Venture shows paused state, workstreams get pause flag

#### Kill Venture
- Action: Move venture to "Killed" stage
- Updates: venture_scoreboard.json (stage: killed, status: killed)
- Logs: agent_activity.json ("Killed venture: LeadScore.ai, reason: [user input]")
- Effect: Venture removed from active pipeline, shows in "Closed" stage

#### Advance Stage
- Action: Move venture to next stage (In Progress → Due Diligence)
- Updates: venture_pipeline.json + venture_scoreboard.json
- Logs: agent_activity.json ("Advanced LeadScore.ai from In Progress to Due Diligence")
- Validation: All blockers must be resolved before advance
- Effect: Venture moves in pipeline, timeline updates

#### Spawn Workstream
- Action: Create new workstream linked to venture
- Form: [Name] [Owner] [Phase] [ETA]
- Updates: workstreams.json + venture_work_links.json
- Logs: agent_activity.json ("Created workstream: [name]")
- Effect: New workstream appears in Active Work panel

#### Assign Agent
- Action: Reassign venture/workstream to different agent
- Form: [Workstream] [New Owner]
- Updates: workstreams.json
- Logs: agent_activity.json ("Reassigned [workstream] from [old] to [new]")
- Effect: Owner changes in Active Work table

### Implementation

**UI Pattern:**
```
┌─ VENTURE COMMANDS ──────────────────┐
│                                     │
│ [Pause Venture] [Kill] [Advance] │
│ [+ Spawn Workstream] [Assign]    │
│                                     │
│ (Disabled if: blockers exist,      │
│  or venture in Closed stage)       │
└─────────────────────────────────────┘
```

**All Commands:**
- Are reversible (log change, can be undone)
- Update SSOT files directly
- Log to agent_activity.json (action + actor + timestamp)
- Show confirmation dialog before executing
- Disable if preconditions unmet (e.g., can't advance if blockers)

---

## OBJECTIVE 4: INTELLIGENCE LAYER

### Problem

Operator must manually scan dashboard for problems. No auto-detection of issues.

### Solution: System Insights (Auto-Generated)

### New File: system_insights.json

**Schema:**
```json
{
  "lastUpdated": "2026-03-05T12:43:00.000Z",
  "insights": [
    {
      "id": "insight-001",
      "type": "stalled_workstream",
      "venture_id": "leadscore-ai",
      "workstream_id": "backend-api-scaffolding",
      "message": "Backend API stalled for 18 hours (last activity: 06:15 AM)",
      "severity": "warning",
      "timestamp": "2026-03-05T12:30:00.000Z",
      "action": "Ping Codesmith"
    },
    {
      "id": "insight-002",
      "type": "blocked_venture",
      "venture_id": "leadscore-ai",
      "message": "1 critical blocker: CEO sign-off required (overdue by 56h)",
      "severity": "critical",
      "timestamp": "2026-03-02T14:30:00.000Z",
      "action": "Resolve blocker"
    },
    {
      "id": "insight-003",
      "type": "agent_overload",
      "agent_id": "codesmith",
      "message": "Codesmith owns 4 workstreams, last activity 3m ago (appears active)",
      "severity": "info",
      "timestamp": "2026-03-05T12:40:00.000Z",
      "action": "Consider load balancing"
    },
    {
      "id": "insight-004",
      "type": "fast_progress",
      "venture_id": "leadscore-ai",
      "message": "LeadScore.ai backend 90% complete (was 0% 6h ago)",
      "severity": "positive",
      "timestamp": "2026-03-05T12:00:00.000Z",
      "action": "Celebrate momentum"
    }
  ]
}
```

### Insight Detection Rules

**Stalled Workstream:**
- If last_event timestamp > 12 hours old
- Severity: warning
- Message: "[Workstream] stalled for [duration]"

**Blocked Venture:**
- If venture has 1+ critical blockers
- Severity: critical (if overdue), warning (if approaching SLA)
- Message: "[Count] critical blocker(s): [details]"

**Agent Overload:**
- If agent owns 5+ workstreams
- Severity: warning
- Message: "[Agent] owns [count] workstreams (monitor capacity)"

**Fast Growing Venture:**
- If venture progress increased >50% in 6h
- Severity: positive
- Message: "[Venture] accelerating: [progress change]%"

**Unusual Activity Spike:**
- If activity events for venture >2x average over last 24h
- Severity: info
- Message: "Unusual activity spike on [venture]"

### Insights Panel (Dashboard)

**Display:**
```
┌─ SYSTEM INSIGHTS (3 New) ──────────────┐
│                                        │
│ 🔴 CRITICAL: 1 critical blocker        │
│    LeadScore.ai CEO sign-off required  │
│    Overdue by 56 hours                 │
│    [Resolve] [Dismiss]                 │
│                                        │
│ ⚠️ WARNING: Backend stalled 18h        │
│    backend-api-scaffolding             │
│    Last activity: 06:15 AM             │
│    [Ping Agent] [Dismiss]              │
│                                        │
│ 💚 POSITIVE: LeadScore.ai accelerating │
│    Backend 90% complete (was 0% 6h ago)│
│    [View] [Dismiss]                    │
│                                        │
└────────────────────────────────────────┘
```

**Actions:**
- Dismiss (removes from view, kept in history)
- View (opens relevant drilldown)
- Ping Agent (sends reminder via cron)
- Resolve (marks as resolved in insights.json)

**Refresh:**
- Insights computed every cron cycle (10s or 1m)
- Written to system_insights.json
- Dashboard polls for updates

---

## OBJECTIVE 5: OPERATOR ENGAGEMENT LOOPS

### Problem

Dashboard is passive. Operator checks it, then leaves. No incentive to constantly iterate.

### Solution: Three Engagement Loops

#### LOOP 1: PROGRESS MOMENTUM

**Panel Name:** Momentum Tracker

**Display:**
```
┌─ MOMENTUM (This Week) ──────────────────┐
│                                         │
│ Ventures Launched: 1                    │
│ Tasks Completed: 12                     │
│ Workstreams Closed: 0                   │
│ Ventures Advanced: 1 (In Prog)          │
│                                         │
│ Progress This Week ═══════════════ 42%  │
│ Trend: 📈 Accelerating                  │
│                                         │
│ Biggest Momentum: Backend API (90%)     │
│ Next Target: Worker Job Processor (20%) │
│                                         │
│ [View Details]                          │
└─────────────────────────────────────────┘
```

**Metrics Tracked:**
- ventures_launched_week (count from venture_scoreboard.json stage changes)
- tasks_completed_day (count from agent_activity.json "completed" actions)
- workstreams_closed_week (count from workstreams.json closed phases)
- ventures_advanced_week (count from stage transitions)
- overall_progress_week (%)
- trend (accelerating / steady / decelerating)

**Visual Indicators:**
- Progress bar (0-100%)
- Trend arrow (📈📊📉)
- Momentum score (0-10)
- Color code: Green (good), Yellow (steady), Red (declining)

**Purpose:**
Operator sees forward progress constantly. Creates positive feedback loop: see progress → stay engaged → iterate more.

#### LOOP 2: DISCOVERY FEED

**Panel Name:** Opportunity Discovery

**Display:**
```
┌─ OPPORTUNITY DISCOVERY ─────────────────┐
│                                         │
│ NEW VENTURE IDEAS (from Moonshot)       │
│ • AI-powered analytics for VC firms     │
│   Market: $2B TAM, 12 competitors       │
│   Fit: Our expertise in deal flow       │
│   [Create Venture] [Learn More]         │
│                                         │
│ • Automated permit filing (REDEV focus) │
│   Market: $500M TAM, 2 competitors      │
│   Fit: Our real estate domain           │
│   [Create Venture] [Learn More]         │
│                                         │
│ AUTOMATION OPPORTUNITIES (Detected)     │
│ • 5 manual approval steps in LeadScore  │
│   Can save 2h/week with Zapier/n8n     │
│   [Create Task] [Dismiss]               │
│                                         │
│ MARKET INTELLIGENCE                     │
│ • TechCrunch: "AI Qualification..."     │
│   Related to LeadScore.ai market        │
│   [Read] [Save]                         │
│                                         │
└─────────────────────────────────────────┘
```

**Data Sources:**
- New venture ideas: Parsed from Moonshot weekly briefing (agent_activity.json)
- Automation opportunities: Detected from workstream activity patterns
  - If agent_activity shows repetitive actions → flag for automation
- Market intelligence: External sources (news API, RSS, etc.)

**Actions:**
- [Create Venture] → Creates venture_scoreboard.json entry, opens drilldown
- [Learn More] → Expands idea card with research
- [Create Task] → Spawns workstream for automation
- [Dismiss] → Hides from view

**Refresh:**
- Weekly (Moonshot briefing arrives Monday 9 AM)
- Daily (automation detection)
- Every 6h (market intelligence)

**Purpose:**
Constant discovery keeps operator exploring. New opportunities surface without effort. Creates "one more thing" loop: see idea → act → see result → discover next idea.

#### LOOP 3: OPERATOR IMPACT TRACKER

**Panel Name:** Your Impact

**Display:**
```
┌─ YOUR IMPACT (Today) ────────────────────┐
│                                          │
│ ACTIONS TAKEN:                           │
│ ✓ +1 venture created (LeadScore Q3)      │
│ ✓ +2 workstreams spawned                 │
│ ✓ +1 critical blocker resolved           │
│ ✓ +3 agents reassigned to optimize load  │
│                                          │
│ SYSTEM RESPONSE:                         │
│ • 2 ventures advanced stages             │
│ • 5 new workstreams created              │
│ • 18 activity events logged              │
│ • System health: 92% (was 85%)            │
│                                          │
│ YOUR INFLUENCE MULTIPLIER: 3.2x          │
│ (Each action triggered 3.2 downstream)   │
│                                          │
│ WEEK STATS:                              │
│ Ventures Launched: 1                     │
│ Blockers Resolved: 3                     │
│ Automations Created: 2                   │
│ Agents Optimized: 8                      │
│                                          │
│ [View Detailed Impact] [Share Stats]     │
└──────────────────────────────────────────┘
```

**Metrics Tracked:**
- Actions by operator (pause, kill, advance, spawn, assign — from audit log)
- Downstream effects (ventures moved, workstreams created, blockers resolved)
- Influence multiplier (downstream effects / operator actions)
- System improvements (health score, automation count, capacity used)

**Time Horizons:**
- Today (last 24h)
- This Week (7 days)
- This Month (30 days)
- All Time (cumulative)

**Data Source:**
- Operator actions: agent_activity.json with `actor: Steve Vettori`
- Downstream: subsequent venture_scoreboard.json + workstreams.json changes
- Health: computed from blockers, stale work, agent load

**Purpose:**
**Creates addictive loop:** Operator takes action → system visibly responds → operator sees impact → motivation to take more actions → continuous improvement.

"Each action you take creates 3x downstream changes in the system."

---

## OBJECTIVE 6: IMPROVED VENTURE DRILLDOWN

### Enhanced Venture Detail View

**Sections (in order):**

1. **Venture Overview** (Header)
   - Name + slug
   - Stage + progress
   - Owner + priority
   - MRR + target
   - Status (active/paused/killed/launched)

2. **Workstreams** (Linked Work)
   - Table: name, phase, progress%, owner, eta, health
   - Click row → Workstream Detail
   - Health calculated from blockers + recency

3. **Blockers** (Decision Blockers)
   - Severity-coded list (critical/warning/info)
   - Owner + SLA timer
   - Click → Blocker Detail

4. **Relationship Graph** (NEW)
   - Interactive visualization
   - Nodes: venture, workstreams, agents, blockers
   - Edges: relationships
   - Click node → drill into that context

5. **Activity Timeline**
   - Recent events for this venture
   - Filter by type (stage change, blocker, workstream, etc.)
   - Show agent + timestamp

6. **Venture Commands** (NEW)
   - [Pause] [Kill] [Advance Stage]
   - [Spawn Workstream] [Assign Agent]
   - Disabled if preconditions unmet

7. **Metrics** (if available)
   - Time to MVP target
   - Current pace
   - Success criteria (accuracy, NPS, customers, MRR)

---

## OBJECTIVE 7: DASHBOARD UI IMPROVEMENTS

### Top Bar (Persistent)

**Left Side:**
```
┌─ SYSTEM HEALTH ────────────────────────┐
│ Active Agents: 4                       │
│ • Clawson (Online)                     │
│ • Codesmith (Active, 4 WS)            │
│ • Moonshot (Idle, 1h ago)             │
│ • Personal Assistant (Idle, 45m ago)  │
└────────────────────────────────────────┘

┌─ OPPORTUNITY VELOCITY ──────────────────┐
│ Ideas/Week: 2.3                        │
│ Validated/Week: 0.5                    │
│ Success Rate: 40%                      │
└────────────────────────────────────────┘

┌─ VENTURE SCOREBOARD ────────────────────┐
│ Ideas: 1 | MVPs: 0 | Running: 1        │
│ Live: 0 | Killed: 0 | Success: 0%     │
└────────────────────────────────────────┘
```

**Center:**
- Current time (large, updating)
- Session duration
- Last activity timestamp

**Right Side:**
- User name (Steve)
- System status (✅ Healthy / ⚠️ Issues)
- [Settings] [Help] [Logout]

### Main Dashboard Panels (3-Column)

**Left Column:**
- System Insights
- Momentum Tracker

**Center Column:**
- Active Work (Workstreams Table)
- Blocked Work (Blocker Console)

**Right Column:**
- Agent Activity (Timeline)
- Opportunity Discovery

### Bottom Bar

- Data freshness (last update timestamp)
- Auto-refresh countdown (10s)
- [Export] [Settings] [About]

---

## OBJECTIVE 8: DATA PIPELINE VALIDATION

### Export Cycle Validation

Every 10 seconds (or cron cycle), validate:

1. **SSOT Files Exist**
   - Check for required .json files
   - If missing: raise CRITICAL insight

2. **JSON Schema Valid**
   - Parse each file, validate against schema
   - If invalid JSON: raise CRITICAL insight, log to activity

3. **Timestamps Current**
   - Check lastUpdated in each file
   - If >10 min old: raise WARNING insight
   - If >1h old: raise CRITICAL insight

4. **Agent Count Matches**
   - Count agents in agents_runtime.json (status=active)
   - Compare to agents in workstreams + activity
   - If mismatch: log WARNING to activity

5. **Venture Data Consistency**
   - Check venture_scoreboard.json vs venture_pipeline.json
   - Ensure stage field matches between files
   - If drift: log warning + auto-correct to venture_scoreboard.json (authoritative)

### Alert Behavior

**If Validation Fails:**
- Write alert to agent_activity.json
  ```json
  {
    "timestamp": "ISO-8601",
    "agent": "System",
    "action": "Data validation failed",
    "description": "venture_pipeline.json missing — using venture_scoreboard.json as source",
    "severity": "warning"
  }
  ```
- Raise Insights panel entry
- Continue operations (graceful degradation)
- Never crash dashboard

---

## IMPLEMENTATION PHASES

### Phase 1 (Week 1): SSOT Foundation
- [ ] Create agents_runtime.json schema + export logic
- [ ] Remove all cached agent counts
- [ ] Remove all hardcoded values
- [ ] Remove all Supabase references
- [ ] Verify 100% SSOT authority

### Phase 2 (Week 1-2): Relationship Graph + Commands
- [ ] Create venture_relationships.json
- [ ] Build graph visualization component
- [ ] Implement Pause/Kill/Advance commands
- [ ] Implement Spawn Workstream command
- [ ] Implement Assign Agent command
- [ ] Add command confirmation dialogs + validation

### Phase 3 (Week 2): Intelligence Layer
- [ ] Create system_insights.json
- [ ] Implement insight detection rules
- [ ] Add insights panel to dashboard
- [ ] Implement insight actions (ping, resolve, dismiss)

### Phase 4 (Week 3): Engagement Loops
- [ ] Build Momentum Tracker panel
- [ ] Build Opportunity Discovery panel
- [ ] Build Operator Impact Tracker panel
- [ ] Connect to data sources

### Phase 5 (Week 3-4): UI Polish + Validation
- [ ] Update dashboard layout (3-column + panels)
- [ ] Implement data validation pipeline
- [ ] Add dashboard top bar + stats
- [ ] Performance optimization
- [ ] All tests passing
- [ ] ESLint clean
- [ ] Drift audit clean

---

## TESTING CHECKLIST

**Functional:**
- [ ] Agent count always reflects agents_runtime.json
- [ ] All metrics traceable to SSOT files
- [ ] Graph renders without errors
- [ ] All commands (pause/kill/advance/spawn/assign) work
- [ ] Commands log to agent_activity.json
- [ ] Insights auto-detect correctly
- [ ] Momentum calculates correctly
- [ ] Opportunity feed surfaces ideas
- [ ] Impact tracker shows correct numbers

**Data Integrity:**
- [ ] No cached values > 10s old
- [ ] No hardcoded strings in UI
- [ ] No Supabase calls
- [ ] Validation catches missing files
- [ ] Drift detected and logged

**Performance:**
- [ ] Dashboard loads < 2s
- [ ] Graph renders < 500ms
- [ ] Panels auto-refresh smoothly
- [ ] No UI lag on data updates

**Backward Compatibility:**
- [ ] All existing agents function
- [ ] All cron jobs work
- [ ] OpenClaw architecture unchanged
- [ ] Existing workflows unaffected

---

## ACCEPTANCE CRITERIA

✅ Agent count reflects agents_runtime.json (dynamic)  
✅ All metrics traceable to SSOT files (no cache drift)  
✅ Relationship graph works + interactive  
✅ All operator commands function (pause/kill/advance/spawn/assign)  
✅ Insights panel active + auto-detecting issues  
✅ Opportunity feed surfacing discoveries  
✅ Momentum tracker showing progress  
✅ Operator impact metrics visible + updating  
✅ Data validation pipeline running + catching drift  
✅ Dashboard UI updated (top bar + 3-column layout)  
✅ All tests passing (100+ test cases)  
✅ ESLint clean  
✅ Drift audit clean  
✅ Backward compatible (no breaking changes)  

---

## ROLLBACK PLAN

If major issues discovered:

```bash
# Revert to pre-Palantir version
git revert <commit-range>

# Removes:
# - agents_runtime.json
# - venture_relationships.json
# - system_insights.json
# - Graph visualization
# - Operator commands
# - Engagement loops

# Keeps:
# - All SSOT files (intact)
# - Existing dashboards
# - All data preserved
# - OpenClaw architecture (unchanged)

cd mission-control-ui && npm start
```

**Impact:** Dashboard reverts to pre-upgrade state. No data loss. All systems continue working.

---

**CR ID:** CR-MC-PALANTIR-OPERATOR-LOOPS  
**Date:** 2026-03-05 12:43 EST  
**Scope:** ~4-6 weeks, 2 FTE  
**Risk:** Medium (large refactor, but well-scoped with rollback)  
**Acceptance:** Full operator command center with engagement loops, 100% SSOT authority, backward compatible
