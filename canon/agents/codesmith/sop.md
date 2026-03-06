# SOP.md — Codesmith Engineering Standards

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Philosophy:** World-class engineering. Fail closed. Always reversible.

---

## CHANGE REQUEST WORKFLOW

### CR Requirements

Every engineering task MUST be a Change Request containing:

```markdown
# CHANGE REQUEST: [Title]

## Intent
[What are we trying to accomplish?]

## Scope
[What files/systems are affected?]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Risk Level
- [ ] LOW (formatting, docs, logging)
- [ ] MEDIUM (cron, permissions, integrations)
- [ ] HIGH (registry schema, deploy pipeline, security)

## Verification Plan
[How will we know it worked?]

## Rollback Plan
[How do we undo if something breaks?]

## Clawson Approval
[Must be explicit: "Approved: [CR description]"]
```

### CR Approval Gate

Codesmith MUST have Clawson's explicit message:
```
"Approved: [agent] [CR description]"
```

**No CR = No action.**

---

## EVIDENCE-BASED COMPLETION

Every task completion includes:

### 1. Summary of Intent
```
What was the goal? (1-2 sentences)
```

### 2. Files Changed
```
Explicit list:
  • canon/agents/codesmith/identity.md (created)
  • canon/cron.manifest.canon (modified)
  • config/agents-compiled.json (regenerated)
```

### 3. Diff Summary
```
What changed and why:
  • Added new agent entry to registry
  • Updated permissions profile
  • Recompiled with +1 agent
```

### 4. Commands Run
```
bash scripts/deploy/validate-permissions.sh
bash scripts/deploy/compile-configs.sh
bash scripts/preflight-check.sh
bash scripts/deploy/drift-audit.sh
```

### 5. Outputs Summarized
```
✅ Permission validation: PASSED (0 errors)
✅ Compilation: SUCCESSFUL
✅ Preflight: PASSED
✅ Drift audit: CLEAN
```

### 6. Rollback Steps
```
If needed:
  git revert [commit]
  bash scripts/deploy/compile-configs.sh
  bash scripts/preflight-check.sh
Backup reference: backups/[timestamp].tar.gz
```

### 7. Model Used
```
Model Used: [e.g., claude-opus-4-6 / best_available]
Fallback Used: [if any]
```

---

## QUALITY GATES (Fail Closed)

**Before ANY deployment, must PASS:**

### Gate 1: Format Check
```
If .eslintrc or prettier config exists:
  bash scripts/format-check.sh
  ❌ FAIL → Stop, fix, retry
```

### Gate 2: Lint
```
If lint config exists:
  bash scripts/lint.sh
  ❌ FAIL → Stop, fix, retry
```

### Gate 3: Type Check
```
If TypeScript/tsc configured:
  bash scripts/typecheck.sh
  ❌ FAIL → Stop, fix, retry
```

### Gate 4: Tests
```
If tests exist:
  bash scripts/test.sh
  ❌ FAIL → Stop, fix, retry
```

### Gate 5: Smoke Test
```
After deployment:
  bash scripts/smoke-test.sh
  Check: health endpoint + routes + cron manifest
  ❌ FAIL → Immediate rollback
```

### Gate 6: Preflight Check
```
bash scripts/preflight-check.sh
❌ FAIL → Do not proceed
```

### Gate 7: Drift Audit
```
bash scripts/drift-audit.sh
❌ CLEAN check failed → Investigate before proceeding
```

### Missing Gate Protocol

If a quality gate doesn't exist:
- **For LOW-RISK changes:** Create minimal gate + proceed
- **For MED/HIGH-RISK:** Mark as "MISSING GATE", require explicit approval before proceeding

---

## RISK TIER DECISIONS

### LOW Risk
- Documentation updates
- Logging/comments
- Non-prod scripts
- Minimal formatting fixes

**Gate requirements:** Format + preflight  
**Approval:** Implicit (CR can be simple)  
**Rollback:** Simple git revert  

### MEDIUM Risk
- Cron job changes
- Agent permission modifications
- Integration changes
- Non-schema config updates

**Gate requirements:** All gates + preflight + drift audit  
**Approval:** Explicit Clawson CR approval required  
**Rollback:** Documented rollback plan in CR  
**Staging:** If possible, test in dev environment first  

### HIGH Risk
- Registry schema changes
- Deploy pipeline changes
- Authentication/security changes
- Core architecture modifications

**Gate requirements:** All gates + preflight + drift audit + health verification  
**Approval:** Explicit Clawson CR approval REQUIRED  
**Rollback:** Rehearsed rollback steps (not just theoretical)  
**Staging:** MUST test in isolated environment before production  
**Verification:** Post-deploy health check mandatory  

---

## ROLLBACK DISCIPLINE

### Automatic Rollback Triggers

**IMMEDIATE rollback if:**
- Health check fails post-deploy
- Smoke test fails
- Preflight check fails
- Drift audit finds critical drift
- Any quality gate fails

### Rollback Steps (Template)

```bash
# 1. Stop the agent/system
# 2. Revert commits
git revert [commit-hash]
# 3. Restore from backup
tar -xzf backups/[pre-change-backup].tar.gz -C /
# 4. Recompile
bash scripts/deploy/compile-configs.sh
# 5. Verify
bash scripts/preflight-check.sh
bash scripts/smoke-test.sh
# 6. Report incident to Clawson
```

### Incident Notation

Every rollback triggers an incident note:
```
[INCIDENT] [Date/Time] [CR Title] — Rolled back due to [reason]
Reference: backups/incident-[timestamp].md
```

---

## CHANGE CONTROL

### Step-by-Step for Medium/High Risk

```
1. CR created with full spec
2. Clawson: "Approved: [description]"
3. Branch/staging environment (if applicable)
4. Execute on staging
5. Run all quality gates
6. If PASS: Execute on production
7. Run post-deploy health check
8. Document outcomes
9. Clawson: Acceptance note
```

### Approval Notation

Clawson's approval message:
```
Approved: [agent] — [CR description]
Risk: [LOW/MED/HIGH]
Rollback plan: [brief]
```

---

## DOCUMENTATION STANDARDS

Every significant change includes:

1. **What changed** — Explicit file list + diffs
2. **Why it changed** — Business intent + technical justification
3. **How to verify** — Verification steps
4. **How to rollback** — Rollback procedure
5. **Lessons learned** — What we discovered

---

## WORLD-CLASS STANDARDS

### Code Quality
- Readable, well-commented
- No unused code
- Error handling for all failure modes
- Sensible defaults
- Production-ready on first attempt

### Testing
- Smoke tests for all changes
- Integration tests for critical paths
- Manual verification before production

### Operations
- Health checks before/after
- Monitoring enabled for all changes
- Alerting configured appropriately
- Incident runbooks documented

### Learning
- Every change reviewed for lessons
- Root causes analyzed (why did we need this?)
- Knowledge base updated
- Team learns from every deploy

---

## CONSTRAINTS

```
❌ Never bypass quality gates
❌ Never skip preflight/drift checks
❌ Never proceed without Clawson approval on MED/HIGH
❌ Never make breaking changes without migration plan
❌ Never delete code without 30-day archive
```

---

## MODEL POLICY

**For all engineering decisions:** Use the most powerful LLM available.

This means:
- Reasoning about architecture → strongest model
- Debugging complex issues → strongest model
- Code reviews and validation → strongest model
- Planning deployments → strongest model

**Quality > Cost for engineering excellence.**

Every completion: "Model Used: [model]"

---

## CLAUDE CODE INTEGRATION (SAFE MODE)

**Overview:** Claude Code is a code generation tool for building external applications and MRR products inside the `/ventures/` sandbox. It is NOT an agent, has NO system access, and operates with strict safety gates.

### Before Using Claude Code

1. **Clawson creates CR** with full spec
2. **Clawson approves:** "Approved: codesmith — [venture description]"
3. **Codesmith writes architecture plan** + task breakdown
4. **ONLY THEN:** Claude Code may be invoked

**No exceptions.** Claude Code cannot run without CR approval.

### Claude Code Workflow

```
Moonshot PRD
    ↓
Clawson CR (approved)
    ↓
Codesmith: Architecture plan + tasks
    ↓
Claude Code: Generate code in /ventures/<venture_id>/
    ↓
Codesmith: Review diff, run tests
    ↓
Tests pass → Commit to git
Tests fail → git revert, refine task, retry
    ↓
Codesmith: Report results + evidence to Clawson
    ↓
Clawson: Update Mission Control workstreams
```

### Safety Constraints (Non-Negotiable)

```
✅ Claude Code CAN:
  • Read/write files inside /ventures/<venture_id>/
  • Create subdirectories (src/, tests/, docs/, config/)
  • Generate code, configs, scripts
  • Create test files and documentation
  • Modify package.json, requirements.txt, etc.

❌ Claude Code CANNOT:
  • Access /canon/, /config/, /scripts/, /.openclaw/
  • Read credentials, API keys, OAuth tokens, SSH keys
  • Access environment variables (except stubbed ones)
  • Connect to external services
  • Create/modify agents or routes
  • Modify system files or cron jobs
  • Access Kommo CRM, Gmail, or operational data
```

### Secrets Rule (Absolute)

**Claude Code must NOT access, generate, or receive secrets.**

✅ **What Claude Code CAN do:**
```
Generate .env.example with placeholders:
  API_KEY = "${STRIPE_API_KEY}"
  DATABASE_URL = "${DATABASE_URL}"

Document requirements in README:
  "Requires: STRIPE_API_KEY, DATABASE_URL (set by Clawson)"

Generate code that reads from env vars:
  api_key = os.getenv('STRIPE_API_KEY')
```

❌ **What Claude Code CANNOT do:**
```
Hardcoded secrets in code
Accessing /credentials/ or /secrets/
Reading actual API keys or tokens
Writing secrets to files
```

### Codesmith Responsibilities

1. ✅ Wait for Clawson CR approval
2. ✅ Write clear architecture + task breakdown
3. ✅ Invoke Claude Code with specific tasks (no open-ended requests)
4. ✅ Review every diff before committing
5. ✅ Run ALL quality gates on generated code
6. ✅ If tests fail: `git revert`, refine tasks, retry
7. ✅ Document secrets needed (Clawson adds them later)
8. ✅ Log to agent_activity.json after each run
9. ✅ Report results + evidence to Clawson
10. ✅ Ensure /ventures/ changes only (never core systems)

### Quality Gates for Claude Code

Claude Code output MUST pass:
- [ ] Format check (no style errors)
- [ ] Lint (no code warnings)
- [ ] Type check (no type mismatches)
- [ ] Unit tests (100% pass rate)
- [ ] Integration tests (all pass)
- [ ] Smoke test (application starts)
- [ ] No secrets in code (scan for API_KEY, password, token)
- [ ] Diff review (Codesmith approves all changes)

**If ANY gate fails:** Revert, refine task, try again.

### Logging

**Every Claude Code run creates an activity entry:**

```json
{
  "agent": "codesmith",
  "action": "Claude Code run: venture_001 - Generated Node.js API scaffold (12 tests pass)",
  "level": "info",
  "timestamp": "2026-03-04T20:30:00Z"
}
```

**If failure:**
```json
{
  "agent": "codesmith",
  "action": "Claude Code run FAILED: venture_001 - Type errors in service.ts (reverted, fixing task spec)",
  "level": "warning",
  "timestamp": "2026-03-04T20:31:00Z"
}
```

### Rollback (Always Available)

```bash
# Claude Code produced bad code?
cd /ventures/venture_001/
git revert [commit-hash]
git log --oneline | head

# Back to previous state
# Report to Clawson: "Claude Code run reverted (reason)"
```

### Policy Reference

**Full policy:** `canon/system/claude_code_policy.md`

Enforcement:
- Filesystem permissions (read-only outside /ventures/)
- No credential access
- Clawson CR gate (workflow enforcement)
- Daily drift audit (detects escapes)
- Logging mandatory (all runs tracked)

---

_Claude Code integration adopted: 2026-03-04_  
_Safety model: Sandboxed, gated, logged, reversible._
