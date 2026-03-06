# WORLD-CLASS MINIMAL CORE — ARCHITECTURE SPECIFICATION

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Status:** ✅ IMPLEMENTED & ACTIVE

---

# PART 1: DIRECTORY LAYOUT & ASSET STRUCTURE

## Directory Tree (Complete)

```
~/.openclaw/workspace/
│
├── canon/                          [CANONICAL SOURCE OF TRUTH]
│   ├── CLAWSON_CANONICAL.md       (manifest)
│   ├── SOUL.md.canon              (persona & principles)
│   ├── IDENTITY.md.canon          (identity framework)
│   ├── HEARTBEAT.md.canon         (protocol definitions)
│   ├── MEMORY.md.canon            (knowledge base template)
│   ├── USER.md.canon              (Steve context)
│   ├── TOOLS.md.canon             (tool reference)
│   ├── cron.manifest.canon        (cron job definitions)
│   └── VERSION.canon              (canonical version: 1.0.0)
│
├── config/                         [GENERATED CONFIGS (from canon)]
│   ├── cron-compiled.json         (generated from canon + validation)
│   ├── routes.json                (agent routes, generated)
│   ├── integrations.json          (active integrations, generated)
│   └── VERSION.compiled           (build timestamp)
│
├── runtime/                        [LIVE STATE (runtime-only)]
│   ├── WORKING.md                 (current operational state, MUTABLE)
│   ├── cron-active.json           (current cron job state)
│   ├── session-state.json         (active sessions)
│   └── metrics.json               (real-time metrics)
│
├── observability/                 [LOGS, HEALTH, MONITORING]
│   ├── drift-audit/
│   │   ├── audit-result-20260304.json
│   │   ├── auto-fixes-applied.log
│   │   └── manual-flags.log
│   ├── health/
│   │   ├── health-report-latest.json
│   │   └── health-history/
│   ├── deployment/
│   │   ├── deploy-log-20260304.json
│   │   └── rollback-log.json
│   └── version-history.json
│
├── archive/                        [OLD VERSIONS, ROLLBACKS]
│   ├── config_disabled_20260304/
│   ├── antfarm_disabled_20260304/
│   ├── deprecated-20260304/
│   └── rollbacks/
│       └── openclaw_reset_20260304_133520.tar.gz
│
├── build/                          [BUILD ARTIFACTS]
│   ├── build-log-latest.txt
│   ├── validation-report.json
│   └── compiled-manifests/
│       └── cron-compiled-20260304.json
│
└── memory/                         [OPERATIONAL LOGS (mutable)]
    ├── WORKING.md                 (daily ops state)
    ├── 2026-03-04.md              (daily log)
    ├── archive/
    │   └── (old daily logs)
    └── metadata.json              (memory system state)
```

---

# PART 2: CANONICAL FILE LIST & PURPOSE

## Canonical Files (IMMUTABLE — Read-Only After Validation)

| File | Purpose | Category | Owner | Editability |
|------|---------|----------|-------|------------|
| `canon/SOUL.md.canon` | Clawson persona, principles, operating style | Identity | Clawson | ❌ Steve only |
| `canon/IDENTITY.md.canon` | Identity framework, creature/vibe | Identity | Clawson | ❌ Steve only |
| `canon/HEARTBEAT.md.canon` | Heartbeat protocol, cron schedule | Protocol | Operations | ❌ Validation required |
| `canon/MEMORY.md.canon` | Memory system structure & template | Knowledge | Clawson | ❌ Template only |
| `canon/USER.md.canon` | Steve Vettori profile, context | Reference | Steve | ❌ Steve only |
| `canon/TOOLS.md.canon` | Tool reference, SSH hosts, voice prefs | Reference | Admin | ❌ Validation required |
| `canon/cron.manifest.canon` | Cron job definitions (source) | Operations | Operations | ✅ Editable (with validation) |
| `canon/VERSION.canon` | Canonical version string | Metadata | Build System | ❌ Auto-managed |
| `canon/CLAWSON_CANONICAL.md` | Configuration manifest & reference | Reference | Clawson | ❌ Read-only |

## Generated Configs (AUTO-COMPILED)

| File | Source | Purpose | Mutable? |
|------|--------|---------|----------|
| `config/cron-compiled.json` | canon/cron.manifest.canon | Validated cron jobs ready for deployment | ❌ Generated |
| `config/routes.json` | canon + system state | Agent routes (Clawson only) | ❌ Generated |
| `config/integrations.json` | canon + credentials/ | Active integrations manifest | ❌ Generated |
| `config/VERSION.compiled` | Build system | Build timestamp & validation | ❌ Generated |

## Runtime State (MUTABLE)

| File | Purpose | Mutability | Owner |
|------|---------|-----------|-------|
| `runtime/WORKING.md` | Current operational state, tasks, focus | ✅ Highly mutable | Clawson |
| `runtime/cron-active.json` | Active cron job state (from API) | ✅ Auto-synced | Gateway |
| `runtime/session-state.json` | Active sessions, connections | ✅ Auto-synced | Gateway |
| `runtime/metrics.json` | Real-time metrics (CPU, tokens, cost) | ✅ Auto-synced | Observability |

## Observability & Logs (AUDIT TRAIL)

| Directory | Purpose | Retention | Rotation |
|-----------|---------|-----------|----------|
| `observability/drift-audit/` | Drift detection results, auto-fixes | 90 days | Daily |
| `observability/health/` | Health reports, uptime, errors | 30 days | Daily |
| `observability/deployment/` | Deployment logs, rollback history | 90 days | Per-deploy |
| `observability/version-history.json` | Complete version changelog | ∞ | Per-release |

---

# PART 3: GOVERNANCE RULES

## File Editability Matrix

```
                     | Editable | Validated | Compile | Restart |
---------------------|----------|-----------|---------|---------|
canon/SOUL.md        |   ❌     |    ✅     |   ⚠️    |   ⚠️    |
canon/HEARTBEAT.md   |   ✅     |    ✅     |   ✅    |   ✅    |
canon/cron.manifest  |   ✅     |    ✅     |   ✅    |   ✅    |
runtime/WORKING.md   |   ✅     |    ❌     |   ❌    |   ❌    |
config/*.json        |   ❌     |    ✅     |   ✅    |   ✅    |
memory/*.md          |   ✅     |    ❌     |   ❌    |   ❌    |
```

### EDITING RULES

**Tier 1: Free to Edit (No Approval Needed)**
- `runtime/WORKING.md` — Operational state, can change freely
- `memory/YYYY-MM-DD.md` — Daily logs, auto-managed
- `observability/*.log` — Audit trail, auto-managed

**Tier 2: Edit with Validation (Compile & Test)**
- `canon/cron.manifest.canon` — Cron jobs
  - Must pass: JSON schema validation
  - Must pass: Cron expression syntax check
  - Must pass: No duplicate job names
  - Effect: Auto-compile to `config/cron-compiled.json`
  - Requires: Deploy validation before restart

- `canon/HEARTBEAT.md.canon` — Protocol definitions
  - Must pass: Markdown syntax
  - Must pass: No breaking changes to Clawson references
  - Effect: Regenerate health checks
  - Requires: Manual review if major change

- `canon/TOOLS.md.canon` — Tool reference
  - Must pass: Markdown syntax
  - Must pass: Tool references still exist
  - Effect: None (reference only)
  - Requires: Manual approval

**Tier 3: Steve-Only (Identity & Context)**
- `canon/SOUL.md.canon` — Persona & principles
  - Changes: Steve approval only
  - Effect: Affects all Clawson outputs
  - Requires: Full rebuild & validation

- `canon/IDENTITY.md.canon` — Identity framework
  - Changes: Steve approval only
  - Effect: Identity/creature/vibe definitions
  - Requires: Full rebuild & validation

- `canon/USER.md.canon` — Steve context
  - Changes: Steve approval only
  - Effect: Business context for Clawson
  - Requires: None (reference only)

**Tier 4: Auto-Managed (No Manual Edits)**
- `config/*.json` — Generated, regenerated on each deploy
- `VERSION.canon` — Managed by build system
- `observability/*.json` — Auto-generated, read-only

---

# PART 4: DRIFT AUDIT & AUTO-FIX STRATEGY

## Drift Audit Job

**Schedule:** Daily at 1:00 AM America/New_York  
**Run Duration:** ~2 minutes  
**Type:** systemEvent (runs in main session)  
**Output:** `observability/drift-audit/audit-result-YYYYMMDD.json`

### What Gets Audited

1. **Canonical Integrity**
   - ✅ All canon/*.canon files exist
   - ✅ VERSION.canon format correct
   - ✅ JSON schemas valid (where applicable)

2. **Generated Configs Match Canonical**
   - ✅ config/cron-compiled.json matches canon/cron.manifest.canon
   - ✅ config/routes.json matches system state
   - ✅ config/integrations.json is current

3. **No Forbidden Changes**
   - ✅ No edits to config/*.json (should be generated only)
   - ✅ No new agents outside of agents/ directory
   - ✅ No unauthorized credentials in root
   - ✅ No Kommo references in active code

4. **Directory Structure**
   - ✅ All required directories exist
   - ✅ No unexpected files in canon/
   - ✅ archive/ is properly segregated

5. **Cron Job State**
   - ✅ All cron jobs in canon/cron.manifest.canon are active
   - ✅ No extra cron jobs exist (besides canonical)
   - ✅ All jobs target agentId: "main"

### Allowed Auto-Fixes (Safe, Automatic)

These are **LOW-RISK** fixes auto-applied without review:

1. **Formatting Normalization**
   - Auto-fix: Regenerate `config/cron-compiled.json` if schema changed
   - Trigger: During compile step
   - Risk: ❌ NONE (deterministic, reversible)

2. **Missing Generated Files**
   - Auto-fix: Recreate `config/*.json` from canon/
   - Trigger: If missing during audit
   - Risk: ❌ NONE (regenerated from source)

3. **Directory Structure Repair**
   - Auto-fix: Create missing directories (canon/, config/, runtime/, etc.)
   - Trigger: If directory missing
   - Risk: ❌ NONE (cosmetic)

4. **Version Bump (Patch Only)**
   - Auto-fix: Increment patch version (1.0.0 → 1.0.1) on safe changes
   - Trigger: After successful compile + validation
   - Risk: ❌ NONE (metadata only)

### Manual Flags (Requires Review)

These are **HIGH-RISK** changes that MUST be flagged for Steve:

1. **Canon File Content Changes**
   - Flag: Any edit to `canon/SOUL.md`, `canon/IDENTITY.md`, `canon/USER.md`
   - Action: Log to `observability/drift-audit/manual-flags.log`
   - Escalation: Alert Steve via Telegram

2. **Breaking Changes in Cron Manifest**
   - Flag: Removal of cron jobs, major schedule changes
   - Action: Log change
   - Escalation: Alert Steve, require approval before deploy

3. **Credential Additions**
   - Flag: New credential files in credentials/
   - Action: Log location & type
   - Escalation: Alert Steve, quarantine until approved

4. **Active Code Modifications**
   - Flag: Changes to scripts/ that affect cron jobs
   - Action: Log file & diff
   - Escalation: Alert Steve, require review

### Drift Audit Output Format

```json
{
  "timestamp": "2026-03-04T01:00:00Z",
  "version": "1.0.0",
  "status": "healthy",
  "checks": {
    "canonical_integrity": "✅ PASS",
    "generated_configs": "✅ PASS",
    "forbidden_changes": "✅ PASS",
    "directory_structure": "✅ PASS",
    "cron_job_state": "✅ PASS"
  },
  "auto_fixes_applied": [],
  "manual_flags": [],
  "next_audit": "2026-03-05T01:00:00Z"
}
```

---

# PART 5: DEPLOYMENT FLOW

## Step 1: EDIT (Canonical Files)

```
Edit canon/*.canon files → Save → Local validation
```

**What you can edit:**
- `canon/cron.manifest.canon` (cron jobs)
- `canon/HEARTBEAT.md.canon` (protocol)
- `canon/TOOLS.md.canon` (reference)

**What requires approval:**
- `canon/SOUL.md.canon`
- `canon/IDENTITY.md.canon`
- `canon/USER.md.canon`

## Step 2: VALIDATE (Schema & Syntax Check)

```
Validation Script: scripts/validate-canonical.sh
Checks:
  ✅ JSON schema compliance
  ✅ Cron expression syntax
  ✅ No duplicate names
  ✅ References still exist
  ✅ No breaking changes
Output: build/validation-report.json
```

**If validation fails:**
- Errors logged to `build/validation-report.json`
- Changes rejected, not compiled
- Must fix and re-validate

## Step 3: COMPILE (Generate Derived Configs)

```
Compile Script: scripts/compile-configs.sh
Inputs: canon/*.canon files
Outputs:
  ✅ config/cron-compiled.json
  ✅ config/routes.json
  ✅ config/integrations.json
  ✅ config/VERSION.compiled
Result: build/compiled-manifests/cron-compiled-TIMESTAMP.json
```

## Step 4: TEST (Pre-Deploy Validation)

```
Test Script: scripts/test-deploy.sh
Checks:
  ✅ Cron jobs parse correctly
  ✅ No syntax errors
  ✅ Routes resolve properly
  ✅ Integrations accessible
Result: build/test-report.json
```

**If tests fail:**
- Rollback to previous `config/` version
- Log failure to `observability/deployment/`
- Must fix canonical files and retry from EDIT

## Step 5: DEPLOY (Apply & Restart)

```
Deploy Script: scripts/deploy.sh
Actions:
  ✅ Backup current config/ → archive/rollbacks/
  ✅ Copy config/cron-compiled.json → gateway
  ✅ Restart gateway (reload configs)
  ✅ Log deployment to observability/deployment/
Result: deploy-log-TIMESTAMP.json
```

## Step 6: VERIFY (Post-Deploy Health Check)

```
Verify Script: scripts/verify-deploy.sh
Checks:
  ✅ Gateway is running
  ✅ Cron jobs are active & matching canonical
  ✅ Routes resolve to "main" (Clawson only)
  ✅ No errors in logs
  ✅ Drift audit passes
Result: observability/health/health-report-TIMESTAMP.json
```

**If verification fails:**
- Automatic rollback to previous config/
- Alert Steve to manual-flags.log
- Require manual investigation

---

# PART 6: OBSERVABILITY ENDPOINTS & HEALTH

## One-Command Status Report

**Command:** `scripts/status-report.sh`

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║                   CLAWSON SYSTEM STATUS                    ║
╚════════════════════════════════════════════════════════════╝

VERSION
├─ Canonical: 1.0.0
├─ Compiled: 1.0.0-20260304-150000
└─ Build Date: 2026-03-04 15:00 EST

AGENT STATUS
├─ Active Agent: main (Clawson/Chief of Staff)
├─ Sessions: 1 active (agent:main:telegram:direct:7002178651)
└─ Status: ✅ OPERATIONAL

CRON JOBS (4 Total)
├─ Gmail Token Auto-Refresh    | Every 30 min  | ✅ ACTIVE
├─ Mission Control Export      | Every 2 hours | ✅ ACTIVE
├─ Weekly Memory Maintenance   | Sundays 8 PM  | ✅ SCHEDULED
└─ Drift Audit                 | Daily 1 AM    | ✅ SCHEDULED

LAST HEALTH CHECK
├─ Status: ✅ HEALTHY
├─ Timestamp: 2026-03-04 13:55 EST
├─ Errors: 0
└─ Warnings: 0

LAST DRIFT AUDIT
├─ Result: ✅ NO DRIFT DETECTED
├─ Timestamp: 2026-03-04 01:00 EST
├─ Auto-Fixes: 0 applied
└─ Manual Flags: 0

INTEGRATIONS
├─ Google Workspace: ✅ Active (3 Gmail accounts)
├─ Mission Control: ✅ Active
├─ Credentials: 36 files (Kommo deleted)
└─ Business Data: Alpine, MassDwell, Atlantic Laser

MEMORY SYSTEM
├─ MEMORY.md: 13 KB
├─ WORKING.md: Current
├─ Daily Logs: 28 total
└─ Archive: 28+ days

BACKUP STATUS
├─ Latest: openclaw_reset_20260304_133520.tar.gz (170 MB)
├─ Location: ~/.openclaw/backups/
└─ Verified: ✅ YES

═══════════════════════════════════════════════════════════════
Last Updated: 2026-03-04 13:55 EST | Next Drift Audit: 2026-03-05 01:00 EST
```

## Log Locations

| Log Type | Location | Retention | Format |
|----------|----------|-----------|--------|
| **Drift Audit** | `observability/drift-audit/` | 90 days | JSON + log |
| **Health Check** | `observability/health/` | 30 days | JSON |
| **Deployment** | `observability/deployment/` | 90 days | JSON |
| **Build** | `build/build-log-latest.txt` | 7 days | Text |
| **Version History** | `observability/version-history.json` | ∞ | JSON |

---

# PART 7: VERSIONING STRATEGY

## Semantic Versioning + Build Metadata

**Format:** `MAJOR.MINOR.PATCH-BUILD-TIMESTAMP`

Example: `1.0.0-20260304-150000`

| Component | Rule | Example |
|-----------|------|---------|
| **MAJOR** | Breaks compatibility (rare) | `1.0.0` → `2.0.0` |
| **MINOR** | New features, new agents | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes, auto-fixes | `1.0.0` → `1.0.1` |
| **BUILD** | Build date YYYYMMDD | `20260304` |
| **TIMESTAMP** | Build time HHMMSS | `150000` |

### Version Bump Rules

| Change Type | Bump | Automatic? | Example |
|-------------|------|-----------|---------|
| Cron job added | MINOR | ❌ Manual | `1.0.0` → `1.1.0` |
| Cron job edited | PATCH | ✅ Auto | `1.0.0` → `1.0.1` |
| SOUL.md edited | MINOR | ❌ Manual | `1.0.0` → `1.1.0` |
| Safe auto-fix | PATCH | ✅ Auto | `1.0.0` → `1.0.1` |
| Agent added | MINOR | ❌ Manual | `1.0.0` → `1.1.0` |

### Version File Locations

- **Canonical:** `canon/VERSION.canon` (source of truth, IMMUTABLE)
- **Compiled:** `config/VERSION.compiled` (generated, timestamp)
- **History:** `observability/version-history.json` (complete changelog)
- **Runtime:** `runtime/WORKING.md` (reference only)

---

# PART 8: DEPLOYMENT SCRIPTS

All scripts live in `scripts/deploy/` and are executable:

```
scripts/deploy/
├── validate-canonical.sh       (schema validation)
├── compile-configs.sh          (generate config/)
├── test-deploy.sh              (pre-deploy tests)
├── deploy.sh                   (apply changes + restart)
├── verify-deploy.sh            (post-deploy health)
├── rollback.sh                 (revert to previous)
├── status-report.sh            (one-command status)
└── drift-audit.sh              (daily 1 AM cron)
```

---

# PART 9: RUNBOOK — HOW TO ADD A NEW AGENT

## Safe Agent Deployment (Without Reintroducing Drift)

### Step 1: Define Agent Specification

Create a new file: `agents/my_agent/AGENT_SPEC.md`

```markdown
# My Agent Specification

## Identity
- Name: Example Agent
- Role: [role]
- Scope: [what it can access]
- Authority Level: [read/write/approve]

## Triggers
- Cron: [schedule]
- Manual: [on-demand/default]
- Event: [webhooks, if any]

## Guardrails
- Cannot: [list constraints]
- Can: [list permissions]
- Escalates: [decisions that need approval]

## Integration Points
- Connects to: [Kommo/Gmail/etc — if any]
- Reads from: [data sources]
- Writes to: [outputs]
```

### Step 2: Add to Canonical Manifest

Edit `canon/cron.manifest.canon` and add job definition:

```json
{
  "name": "my-agent-job",
  "schedule": "0 9 * * 1-5",
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "[prompt]"
  },
  "delivery": {
    "mode": "announce",
    "to": "7002178651"
  }
}
```

### Step 3: Validate & Compile

```bash
scripts/deploy/validate-canonical.sh
# If no errors:
scripts/deploy/compile-configs.sh
```

### Step 4: Test Deploy

```bash
scripts/deploy/test-deploy.sh
```

### Step 5: Deploy

```bash
scripts/deploy/deploy.sh
```

### Step 6: Verify

```bash
scripts/deploy/verify-deploy.sh
scripts/deploy/status-report.sh
```

### Step 7: Documentation

Update:
- `canon/CLAWSON_CANONICAL.md` (add agent to manifest)
- `CORE_ARCHITECTURE_SPEC.md` (if new integration type)
- Commit to git

---

# PART 10: FALLBACK & ROLLBACK

## Quick Rollback Procedure

**If something breaks:**

```bash
# Immediate: Revert to last good config
scripts/deploy/rollback.sh

# Check status
scripts/deploy/status-report.sh

# If drift audit fails:
scripts/deploy/drift-audit.sh

# Review what happened
cat observability/deployment/deploy-log-latest.json
cat observability/drift-audit/manual-flags.log
```

## Full Recovery from Backup

**If system is completely broken:**

```bash
# Restore from backup
cd ~/.openclaw/workspace
tar -xzf ~/.openclaw/backups/openclaw_reset_20260304_133520.tar.gz --exclude=archive

# Recompile and deploy
scripts/deploy/compile-configs.sh
scripts/deploy/deploy.sh
scripts/deploy/verify-deploy.sh
```

---

# ARCHITECTURE SUMMARY

| Pillar | Implementation | Purpose |
|--------|---|---------|
| **Canonical Source** | `/canon/` (immutable after validation) | Single source of truth |
| **Generated Configs** | `/config/` (auto-compiled from canon) | Derived configurations |
| **Runtime State** | `/runtime/` (mutable, auto-synced) | Live operational state |
| **Observability** | `/observability/` (audit trail, health logs) | Full visibility |
| **Governance** | 4-tier editability matrix + drift audit | Safe, reversible changes |
| **Deployment** | 6-step flow (edit → validate → compile → test → deploy → verify) | Deterministic rollouts |
| **Drift Prevention** | Daily 1 AM audit with allowed auto-fixes & manual flags | Maintain canonical state |
| **Versioning** | Semantic + build metadata (`MAJOR.MINOR.PATCH-BUILD-TIMESTAMP`) | Track all changes |
| **Rollback** | Archive previous configs, full backup available | Always recoverable |

---

**Status:** ✅ **CORE ARCHITECTURE READY FOR DEPLOYMENT**

_Specification Version: 1.0.0  
Deployed: 2026-03-04  
Next Review: 2026-06-04_
