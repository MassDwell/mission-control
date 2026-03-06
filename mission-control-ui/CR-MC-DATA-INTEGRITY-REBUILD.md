# Change Request: CR-MC-DATA-INTEGRITY-REBUILD

**Title:** Mission Control — Data Integrity Rebuild + Structural Hardening  
**Date:** 2026-03-05 20:22 EST  
**Requested By:** Steve Vettori  
**Assigned To:** Codesmith  
**Priority:** P0 (CRITICAL DATA LAYER)  
**Scope:** Data layer only (no UI changes)  
**Timeline:** 1 day (urgent)  
**Status:** APPROVED FOR IMMEDIATE EXECUTION  

---

## EXECUTIVE SUMMARY

Mission Control UI panels rendering empty/incomplete due to data drift between UI layer and data pipeline.

**Root Cause:** Multiple data sources, missing schema validation, no watchdog, panels can fabricate data.

**Solution:** Rebuild data layer with:
1. Single Source of Truth (SSOT) enforcement
2. Data contract registry (schema validation)
3. No-fabrication rule (panels show "Awaiting data" if missing)
4. Data watchdog (runs every 10 min, detects drift)
5. Real data repopulation (seed with actual system context)

**Result:** Guaranteed data integrity. Empty panels impossible. All metrics real.

---

## PART 1: DEFINE SINGLE SOURCE OF TRUTH

### SSOT Directory
```
/workspace/data/mission-control/
```

### Approved SSOT Files (ONLY)
```
agent_activity.json
workstreams.json
blocked_work.json
venture_velocity.json
venture_work_links.json
venture_scoreboard.json
agents_runtime.json
system_insights.json
venture_relationships.json
ventures.json
```

### Remove/Disable References To
- `/skills/mission-control/assets/data/`
- Supabase feeds
- Legacy export directories
- Temporary JSON paths
- Stale staging files

### Enforcement Rule
**UI must NEVER reference alternate data locations.**
- Audit all API endpoints
- Grep codebase for hardcoded paths
- Replace with SSOT_PATH constant

---

## PART 2: ENFORCE UI DATA RULE

### No Fabrication Policy

**Every panel must render values derived from SSOT files only.**

If SSOT data unavailable:
```
Panel displays: "Awaiting data from Mission Control pipeline"
Instead of: placeholder values
```

### Remove All Placeholder Values
- ❌ `timestamp: "placeholder"`
- ❌ `total: 0` (unmapped)
- ❌ `active: 0` (unmapped)
- ❌ `items: []` (empty arrays with no source)

### Replacement Rule
```javascript
// BEFORE (bad)
{ timestamp: "placeholder", total: 0, active: 0 }

// AFTER (good)
if (!data || data.length === 0) {
  return { message: "Awaiting data from Mission Control pipeline" };
}
return { timestamp: data.lastUpdated, total: data.items.length };
```

---

## PART 3: CREATE DATA CONTRACT LAYER

### Schema Registry File
**Location:** `/workspace/mission-control/schema_registry.json`

**Contents:**
```json
{
  "agent_activity.json": {
    "required_keys": ["lastUpdated", "activities"],
    "min_entries": 1,
    "description": "Real-time agent actions and system events"
  },
  "workstreams.json": {
    "required_keys": ["lastUpdated", "workstreams"],
    "min_entries": 0,
    "description": "Active work items with progress and ownership"
  },
  "blocked_work.json": {
    "required_keys": ["lastUpdated", "blocked"],
    "min_entries": 0,
    "description": "Blocker items preventing progress"
  },
  "venture_velocity.json": {
    "required_keys": ["lastUpdated", "ventures"],
    "min_entries": 0,
    "description": "Venture stage distribution and metrics"
  },
  "venture_work_links.json": {
    "required_keys": ["lastUpdated", "pipeline"],
    "min_entries": 0,
    "description": "Mapping of ventures to workstreams"
  },
  "venture_scoreboard.json": {
    "required_keys": ["ideas", "mvp", "running", "killed", "success_rate"],
    "min_entries": 0,
    "description": "Portfolio stage counts and metrics"
  },
  "agents_runtime.json": {
    "required_keys": ["agents", "lastUpdated"],
    "min_entries": 4,
    "description": "Active agent list with status"
  }
}
```

### Validation Function
```javascript
function validateSSO(filename, data) {
  const schema = schemaRegistry[filename];
  if (!schema) {
    throw new Error(`No schema for ${filename}`);
  }
  
  // Check required keys
  for (const key of schema.required_keys) {
    if (!(key in data)) {
      throw new Error(`Missing key: ${key} in ${filename}`);
    }
  }
  
  // Check min entries
  const items = data[Object.keys(data).find(k => 
    Array.isArray(data[k])
  )] || [];
  
  if (items.length < schema.min_entries) {
    throw new Error(`${filename} has ${items.length} entries, need at least ${schema.min_entries}`);
  }
  
  return true;
}
```

---

## PART 4: VALIDATE DATA SCHEMA

### Required Structures

**agent_activity.json**
```json
{
  "lastUpdated": "ISO-8601 timestamp",
  "activities": [
    {
      "timestamp": "ISO-8601",
      "agent": "string",
      "action": "string",
      "description": "string",
      "severity": "info|warning|critical"
    }
  ]
}
```

**workstreams.json**
```json
{
  "lastUpdated": "ISO-8601 timestamp",
  "workstreams": [
    {
      "id": "string",
      "name": "string",
      "venture_id": "string",
      "owner": "string",
      "phase": "string",
      "progress": 0-100,
      "eta": "ISO-8601",
      "last_event": "ISO-8601"
    }
  ]
}
```

**blocked_work.json**
```json
{
  "lastUpdated": "ISO-8601 timestamp",
  "blocked": [
    {
      "id": "string",
      "venture_id": "string",
      "workstream_id": "string",
      "owner": "string",
      "severity": "critical|warning|info",
      "created_at": "ISO-8601",
      "sla_hours": number
    }
  ]
}
```

**venture_velocity.json**
```json
{
  "lastUpdated": "ISO-8601 timestamp",
  "ventures": [
    {
      "id": "string",
      "name": "string",
      "stage": "string",
      "progress": 0-100,
      "velocity_score": number,
      "momentum_signal": "↑|→|↓"
    }
  ]
}
```

**venture_work_links.json**
```json
{
  "lastUpdated": "ISO-8601 timestamp",
  "pipeline": [
    {
      "venture_id": "string",
      "workstream_ids": ["string"]
    }
  ]
}
```

**venture_scoreboard.json**
```json
{
  "lastUpdated": "ISO-8601 timestamp",
  "ideas": 0,
  "mvp": 0,
  "running": 0,
  "launched": 0,
  "killed": 0,
  "success_rate": 0.0
}
```

### Validation Task
**For each file:**
- [ ] Load from disk
- [ ] Parse JSON
- [ ] Validate against schema_registry.json
- [ ] If invalid, log incident + regenerate with defaults
- [ ] Update lastUpdated timestamp

---

## PART 5: REPOPULATE DATA

### agent_activity.json
Seed with recent system activity:
```json
{
  "lastUpdated": "ISO-8601",
  "activities": [
    {
      "timestamp": "ISO-8601",
      "agent": "System",
      "action": "Mission Control server started",
      "description": "Data integrity rebuild + watchdog installed",
      "severity": "info"
    },
    {
      "timestamp": "ISO-8601",
      "agent": "Codesmith",
      "action": "LeadScore.ai backend scaffolding",
      "description": "API endpoints 90% complete",
      "severity": "info"
    },
    ... (10+ entries minimum)
  ]
}
```

### workstreams.json
Current workstreams:
- Mission Control UI hardening (in progress)
- LeadScore backend build (in progress)
- Email automation deployment (in progress)

### blocked_work.json
```json
{
  "lastUpdated": "ISO-8601",
  "blocked": []
}
```
(Empty if no blockers)

### venture_velocity.json
```json
{
  "lastUpdated": "ISO-8601",
  "ventures": [
    {
      "id": "leadscore-ai",
      "name": "LeadScore.ai",
      "stage": "Implementation",
      "progress": 32,
      "velocity_score": 8.5,
      "momentum_signal": "↑"
    }
  ]
}
```

### venture_work_links.json
```json
{
  "lastUpdated": "ISO-8601",
  "pipeline": [
    {
      "venture_id": "leadscore-ai",
      "workstream_ids": ["backend-api", "worker-processor", "web-dashboard"]
    }
  ]
}
```

### venture_scoreboard.json
```json
{
  "lastUpdated": "ISO-8601",
  "ideas": 1,
  "mvp": 0,
  "running": 1,
  "launched": 0,
  "killed": 0,
  "success_rate": 0.0
}
```

---

## PART 6: PANEL DATA VALIDATION

### Panel → SSOT Mapping

| Panel | Source File | Key Field |
|-------|------------|-----------|
| Agent Activity | agent_activity.json | .activities |
| Active Work | workstreams.json | .workstreams |
| Blocked Work | blocked_work.json | .blocked |
| Workstream Flow | venture_work_links.json | .pipeline |
| Momentum | venture_velocity.json | .ventures |
| Venture Scoreboard | venture_scoreboard.json | top-level |
| System Health | agents_runtime.json | .agents |

### Validation Checklist
- [ ] Agent Activity panel shows real activities (not "Awaiting data")
- [ ] Active Work shows real workstreams (not empty)
- [ ] Blocked Work shows empty state (no blockers) or real blockers
- [ ] Workstream Flow shows venture-workstream links
- [ ] Momentum shows venture velocity metrics
- [ ] Venture Scoreboard shows correct counts
- [ ] System Health shows 4 agents

---

## PART 7: INSTALL DATA WATCHDOG

### Watchdog Script
**Location:** `/workspace/scripts/mission-control-watchdog.js`

**Runs:** Every 10 minutes (cron scheduled)

**Checks:**
1. Each SSOT file exists
2. JSON parses correctly
3. Schema is valid (via schema_registry.json)
4. lastUpdated < 2 hours ago

**If drift detected:**
```javascript
// Append event to agent_activity.json
{
  "timestamp": "ISO-8601",
  "agent": "System",
  "action": "Mission Control Data Drift Detected",
  "description": "File X missing/stale/invalid. Auto-regenerating...",
  "severity": "warning"
}

// Auto-regenerate missing file with defaults
```

**If dataset missing:**
- Regenerate using schema_registry.json defaults
- Log incident to agent_activity.json
- Alert Clawson (if critical)

### Cron Job
```bash
0 */10 * * * /workspace/scripts/mission-control-watchdog.js
```

---

## PART 8: VERIFY UI STREAMING

### Verification Checklist
- [ ] UI reads only from `/workspace/data/mission-control/` (no alternate paths)
- [ ] API `/api/*` endpoints return populated data (not empty)
- [ ] Dashboard panels display live metrics (no "Awaiting data" unless genuinely missing)
- [ ] Auto-refresh continues (10 second cycle)
- [ ] No panels render empty
- [ ] All data has lastUpdated timestamps
- [ ] Schema validation passing

### Test Endpoints
```bash
curl http://localhost:3000/api/agents          # Should return 4 agents
curl http://localhost:3000/api/workstreams      # Should return 3+ workstreams
curl http://localhost:3000/api/blockers         # Should return 0 or real blockers
curl http://localhost:3000/api/venture-pipeline # Should return LeadScore.ai
```

---

## PART 9: VERIFICATION REPORT

### Deliverables

**1. SSOT Directory Listing**
```bash
ls -lh /workspace/data/mission-control/
```

**2. Sample Data (Each File)**
- agent_activity.json (first 5 activities)
- workstreams.json (sample structure)
- blocked_work.json (state)
- venture_velocity.json (sample venture)
- venture_scoreboard.json (current counts)

**3. Dashboard Screenshot**
- All panels populated (no "Awaiting data" messages)
- Live metrics visible
- Timestamps current

**4. Confirmation**
- [ ] Schema registry installed and active
- [ ] Watchdog cron job scheduled
- [ ] All SSOT files validated
- [ ] No fabrication in any panel
- [ ] API endpoints returning real data

---

## ACCEPTANCE CRITERIA

✅ Single Source of Truth enforced (/workspace/data/mission-control/)  
✅ All alternate data paths removed or disabled  
✅ Data contract registry created (schema_registry.json)  
✅ All SSOT files valid JSON + correct schema  
✅ No panel fabricates data  
✅ Empty panels show "Awaiting data from Mission Control pipeline"  
✅ All datasets populated with real system context  
✅ Agent Activity has 10+ entries  
✅ Workstreams populated (3+ items)  
✅ Venture Scoreboard reflects actual state  
✅ Data watchdog installed (10-min checks)  
✅ Watchdog detects and auto-fixes drift  
✅ UI streaming verified (all endpoints returning data)  
✅ Dashboard screenshot shows populated panels  
✅ Zero empty panels on live dashboard  

---

**CR ID:** CR-MC-DATA-INTEGRITY-REBUILD  
**Date:** 2026-03-05 20:22 EST  
**Timeline:** 1 day (urgent)  
**Risk:** Low (data-only changes, no UI impact)  
**Acceptance:** Mission Control data layer bulletproof. No empty panels possible.
