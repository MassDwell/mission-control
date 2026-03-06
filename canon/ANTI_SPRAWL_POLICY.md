# ANTI-SPRAWL POLICY — How We Prevent Drift

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Enforcement:** MANDATORY — Fail closed on all violations

---

## THE PROBLEM WE SOLVE

Configuration sprawl happens when:
- Agents created outside the registry
- SOUL.md files scattered across directories
- Duplicate config files in multiple locations
- Breaking schema changes not caught
- Unclear ownership of system state

**Result:** Drift, confusion, security gaps, untrackable changes.

---

## THE SOLUTION: ANTI-SPRAWL RULES

### Rule 1: Agent Creation Requires Explicit Approval

**GATE:** Only Clawson (Steve) can approve new agents

```
Steve: "Create Sales Processor agent"
Clawson: "Approval requested for agent: sales_processor"
Approval required before:
  - Creating canon/agents/{id}/
  - Adding to canon/registry.json
  - Compiling to config/
  - Deploying
```

**Enforcement:**
- Preflight checklist verifies: Any agent in registry not in prior runs = unapproved?
- If unapproved found: BLOCK START, alert Steve for approval
- Approval mechanism: Clawson logs approval in git commit message + memo

**Implementation:**
- Drift audit Check #8: Unapproved agents detected
- Violation action: QUARANTINE + ALERT (not deployed)

---

### Rule 2: All Canon Files Live in /canon/ Only

**REQUIREMENT:** SOUL.md, HEARTBEAT.md, IDENTITY.md, MEMORY.md templates ONLY in `/canon/`

**What this means:**
- ✅ `canon/SOUL.md.canon` (canonical)
- ✅ `canon/agents/sales_processor/SOUL.md` (agent-specific, in agent folder)
- ❌ `SOUL.md` in root
- ❌ `SOUL.md` in `/data/`
- ❌ Multiple SOUL.md files anywhere

**Enforcement:**
- Preflight checks for orphaned files
- Any found = QUARANTINE + REPORT
- Startup blocked if critical canon files missing

**Implementation:**
- Preflight Check #3: Scan for unauthorized canon files
- Violation action: Auto-quarantine to `/archive/quarantine/<timestamp>/`

---

### Rule 3: Single Registry Source of Truth

**REQUIREMENT:** Only `/canon/registry.json` declares agents

**What this means:**
- All agents declared in ONE file
- Enabled/disabled status centralized
- Permission profiles assigned there
- No scattered agent configs

**Enforcement:**
- Compile reads ONLY `canon/registry.json`
- Any agent directory not in registry = unauthorized
- Preflight verifies registry is parseable JSON

**Implementation:**
- Preflight Check #4: Registry schema valid
- Preflight Check #5: All agent directories match registry
- Violation action: Block compile if mismatch

---

### Rule 4: Duplicate Canon Files Auto-Quarantine

**REQUIREMENT:** Exactly ONE instance of each canonical file

**What this means:**
- One `SOUL.md.canon` (not two)
- One `VERSION.canon`
- One `permissions.schema.json`
- One `registry.json`

**Enforcement:**
- Preflight scans `/canon/` for duplicates
- If found: Quarantine older version, keep newer
- Report to Steve with details

**Implementation:**
- Preflight Check #6: No duplicate canon files
- Violation action: Auto-quarantine + ALERT
- Log location: `observability/quarantine/duplicates-found.json`

---

### Rule 5: Naming + Schema Enforcement (Fail Closed)

**REQUIREMENT:** All configs must pass schema validation

**Schema rules:**
- Agent IDs: lowercase-hyphen (no spaces, underscores, caps)
- File names: UPPERCASE.md (identity files) or lowercase.json (data)
- JSON files: Must validate against schema
- Required fields: Never allow missing
- Cron expressions: Must be valid
- Permission profiles: Must exist in schema

**Enforcement:**
- Validate on READ (not on save)
- If invalid: DO NOT LOAD, alert, block deployment
- Fail closed (safer to block than run broken config)

**Implementation:**
- Preflight Check #7: All configs pass schema
- Compile validation: JSON schema check
- Violation action: Block with error message

---

## PREFLIGHT CHECKLIST (Runs on Every Startup)

The checklist verifies the system is in a known good state BEFORE anything runs.

### 8-Point Preflight

1. **Canon Directory Exists**
   - Check: `/canon/` directory present
   - Action: Create if missing (initialize)

2. **Registry Valid JSON**
   - Check: `canon/registry.json` parses
   - Action: Block startup if not

3. **No Orphaned Canon Files**
   - Check: Only authorized files in `/canon/`
   - Action: Quarantine unauthorized, continue

4. **Agent Directories Match Registry**
   - Check: Every `canon/agents/{id}/` has registry entry
   - Check: Every registry entry has directory (if enabled)
   - Action: Block startup if mismatch

5. **No Duplicate Canon Files**
   - Check: Each canon file exists exactly once
   - Action: Quarantine duplicates, alert

6. **All Configs Pass Schema**
   - Check: JSON files valid
   - Check: Cron expressions valid
   - Check: Agent IDs follow naming rules
   - Action: Block startup if invalid

7. **Permission Profiles Valid**
   - Check: All agent profiles exist in schema
   - Check: Clawson has full access
   - Action: Block startup if broken

8. **No Unapproved Agents**
   - Check: New agents in registry have approval memo
   - Action: Alert Steve, block deployment (not startup)

---

## HOW IT WORKS IN PRACTICE

### Scenario 1: Steve Creates a New Agent

```
Steve: "Create a new reporting agent"

Clawson: "Creating reporting agent. Awaiting explicit approval."

Clawson logs in MEMORY.md:
  "APPROVAL REQUESTED: reporting_agent
   Date: 2026-03-04
   Status: PENDING
   Action: Wait for Steve confirmation"

[Steve confirms in chat]

Clawson: "Approval recorded. Proceeding."

Steps:
  1. Create canon/agents/reporting_agent/
  2. Create AGENT_SPEC.md
  3. Add to canon/registry.json (enabled=false initially)
  4. Run: bash scripts/deploy/validate-canonical.sh
  5. Run: bash scripts/deploy/validate-permissions.sh
  6. Run: bash scripts/deploy/compile-configs.sh
  7. Run: bash scripts/deploy/drift-audit.sh
  8. Run: preflight checklist
  9. If all pass: Deploy
```

If any step fails (schema, permissions, naming), **block and report**.

### Scenario 2: Someone Accidentally Creates canon/IDENTITY.md (Duplicate)

```
Preflight detects:
  - canon/IDENTITY.md.canon (canonical)
  - canon/IDENTITY.md (duplicate)

Action:
  1. Quarantine canon/IDENTITY.md → archive/quarantine/20260304_140523/
  2. Log: observability/quarantine/duplicates-found.json
  3. Alert Steve: "Duplicate canon file found and quarantined"
  4. Continue startup
```

### Scenario 3: Broken JSON in registry.json

```
Compile step:
  1. Try to parse canon/registry.json
  2. JSON invalid
  3. Error: "registry.json failed schema validation"
  4. Block: Do not continue to compile
  5. Alert: "Fix JSON syntax before proceeding"
```

Fail closed. Safe default.

---

## APPROVAL MECHANISM

### How Approval Works

1. **Request:** Agent creation requires Steve's explicit message: "Create agent X"
2. **Log:** Clawson creates approval memo in git commit message
3. **Memo Format:**
   ```
   AGENT APPROVAL: {agent_id}
   Approved by: Steve Vettori
   Date: 2026-03-04
   Reason: {summary}
   Timestamp: 2026-03-04T14:10:00Z
   ```
4. **Tracking:** All approvals in git history (immutable)

---

## ANTI-SPRAWL CHECKLIST (Quick Reference)

```
Pre-deployment checklist:
  □ All new agents approved by Steve (chat record)
  □ All canon files in /canon/ only
  □ canon/registry.json is source of truth
  □ No duplicate canon files (preflight removes them)
  □ All configs pass schema validation
  □ All agent IDs follow naming rules (lowercase-hyphen)
  □ Permission profiles assigned to all agents
  □ Preflight checklist passes (8 checks)
  □ No unapproved agents in registry
```

---

## VIOLATIONS & ACTIONS

| Violation | Detection | Action | Alert |
|-----------|-----------|--------|-------|
| Unapproved agent | Preflight #8 | Block deploy | Steve |
| Orphaned canon file | Preflight #3 | Quarantine | Steve |
| Duplicate canon file | Preflight #6 | Quarantine | Steve |
| Invalid JSON | Preflight #4 | Block startup | Steve |
| Schema mismatch | Preflight #7 | Block startup | Steve |
| Agent/registry mismatch | Preflight #5 | Block startup | Steve |
| Bad agent ID naming | Compile | Reject | User |
| Missing canon file | Startup | Block startup | Steve |
| Broken permission profile | Startup | Block startup | Steve |

---

## SAFETY GUARANTEES

✅ **No agents without approval** — Steve must explicitly approve in chat  
✅ **Single canon source** — Only `/canon/registry.json` declares agents  
✅ **Automatic cleanup** — Duplicates quarantined, no manual cleanup needed  
✅ **Schema enforced** — Broken configs never loaded  
✅ **Fail closed** — When in doubt, block (don't guess)  
✅ **Audit trail** — All approvals in git, all quarantines logged  
✅ **Immutable record** — Git history is source of truth  

---

## GOVERNANCE SUMMARY

**Clawson enforces these rules automatically:**

1. ✅ New agents require explicit Steve approval (chat)
2. ✅ All canon files centralized in `/canon/`
3. ✅ Single registry as source of truth
4. ✅ Duplicates auto-quarantined
5. ✅ Schema validated on every compile & startup
6. ✅ Preflight checklist runs before anything loads
7. ✅ Violations block startup (fail closed)
8. ✅ All decisions logged & auditable

**Result:** No drift, clear ownership, safe deployments.

---

**Status:** ✅ **ANTI-SPRAWL RULES IN EFFECT**

_No exceptions. No manual overrides. Fail closed always._
