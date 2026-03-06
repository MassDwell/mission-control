# CHANGE REQUEST TEMPLATE

**For use by:** Codesmith (internal engineering agent)  
**Required for:** All code changes, deploy changes, config changes (MED/HIGH risk)

---

## CHANGE REQUEST: [Title]

### 1. INTENT

[What are we trying to accomplish? 1-2 sentences]

**Example:** "Add Codesmith agent to OpenClaw system with world-class engineering governance"

---

### 2. SCOPE

[What files/systems are affected? List explicitly]

**Example:**
- canon/agents/codesmith/identity.md (new)
- canon/agents/codesmith/sop.md (new)
- canon/agents/codesmith/permissions.json (new)
- canon/registry.json (modified)
- config/agents-compiled.json (regenerated)

---

### 3. ACCEPTANCE CRITERIA

[How will we know this is done? Measurable checkpoints]

**Example:**
- [ ] Codesmith agent created and registered in canon/
- [ ] Permission profile enforced in permissions schema
- [ ] Registry entry added (disabled initially)
- [ ] Compilation successful with no errors
- [ ] Preflight checks pass
- [ ] Drift audit clean
- [ ] All quality gates pass
- [ ] Codesmith can be enabled without breaking other agents

---

### 4. RISK LEVEL

Select one:

- [ ] **LOW** — Formatting, docs, logging, non-prod scripts
  - Gate requirements: Format + preflight
  - Approval: Implicit
  - Rollback: Simple git revert

- [ ] **MEDIUM** — Cron changes, permissions, integrations, non-schema config
  - Gate requirements: All gates + preflight + drift audit
  - Approval: Explicit Clawson CR approval required
  - Rollback: Documented plan

- [ ] **HIGH** — Registry schema, deploy pipeline, security, architecture
  - Gate requirements: All gates + preflight + drift audit + health verification
  - Approval: Explicit Clawson CR approval REQUIRED
  - Rollback: Rehearsed steps, isolated testing
  - Staging: Test in dev first

---

### 5. VERIFICATION PLAN

[How will we verify this works?]

**Example:**
```bash
# Compile and validate
bash scripts/deploy/validate-permissions.sh
bash scripts/deploy/compile-configs.sh
bash scripts/preflight-check.sh
bash scripts/deploy/drift-audit.sh

# Check outputs
jq '.[] | select(.id=="codesmith")' canon/registry.json
jq '.profiles.codesmith' canon/permissions.schema.json

# Verify no breaking changes
jq '.agents[] | select(.enabled==true)' canon/registry.json
jq '.[].routing' config/routes.json
```

---

### 6. ROLLBACK PLAN

[If something breaks, how do we undo?]

**Example:**
```bash
# 1. Identify issue
# 2. Revert commits
git log --oneline | head -5
git revert [commit-hash]

# 3. Restore from backup
tar -xzf backups/pre-codesmith-deployment.tar.gz -C /

# 4. Recompile
bash scripts/deploy/compile-configs.sh

# 5. Verify
bash scripts/preflight-check.sh
bash scripts/smoke-test.sh

# 6. Report incident
# [INCIDENT] Codesmith deployment rolled back — [reason]
```

---

### 7. CLAWSON APPROVAL

**Clawson must respond with:**

```
Approved: [agent] — [CR description]
Risk: [LOW/MED/HIGH]
Rollback plan: [brief confirmation]
```

**Example:**
```
Approved: codesmith — Add world-class engineering agent
Risk: MEDIUM
Rollback plan: Git revert + backup restore as documented
```

---

## NOTES

- **No CR = No action.** Codesmith ONLY acts on approved Change Requests.
- **Evidence-based completion:** Every task includes file changes, diffs, commands run, outputs, model used.
- **Fail closed:** Quality gates must PASS. Any failure triggers rollback.
- **Always reversible:** Rollback plan is mandatory for MED/HIGH risk.

---

_Template Version: 1.0.0_  
_Last Updated: 2026-03-04_
