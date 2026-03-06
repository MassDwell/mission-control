# RELEASE & ROLLBACK PROCEDURES

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Enforced by:** Codesmith + Clawson  
**Philosophy:** Always reversible. Never trapped. Rehearse before deploying.

---

## RELEASE PHASES

### Phase 1: Pre-Release (Codesmith)

```bash
# 1. Run all quality gates
bash scripts/format-check.sh
bash scripts/lint.sh
bash scripts/typecheck.sh
bash scripts/test.sh
bash scripts/preflight-check.sh
bash scripts/drift-audit.sh

# 2. Create release candidate
# Tag the commit
git tag -a release-[version] -m "Release [version]"

# 3. Create backup
tar -czf backups/pre-release-[version]-$(date +%Y%m%d_%H%M%S).tar.gz \
  canon/ config/ scripts/

# 4. Sign off
echo "[RELEASE CANDIDATE] [version] ready for approval"
```

### Phase 2: Approval (Clawson)

**Clawson must respond with:**

```
APPROVED FOR RELEASE: [version]
Rollback plan: [confirmed]
Smoke test plan: [confirmed]
```

### Phase 3: Deployment (Codesmith)

```bash
# 1. Announce deployment
echo "[DEPLOYMENT] Starting release [version]"

# 2. Run compile
bash scripts/deploy/compile-configs.sh

# 3. Verify compilation
jq . config/agents-compiled.json > /dev/null && echo "✅ Compiled"

# 4. Run preflight
bash scripts/preflight-check.sh

# 5. Deploy
bash scripts/deploy/deploy.sh

# 6. Smoke test
bash scripts/smoke-test.sh

# 7. Verify health
curl -s http://localhost:3000/health | jq .

# 8. Report
echo "[DEPLOYMENT COMPLETE] [version] deployed successfully"
```

### Phase 4: Verification (Clawson)

Clawson confirms:
- Smoke test passed
- Health checks green
- Agents responding
- Routes correct
- No error logs

---

## ROLLBACK PHASES

### Phase 1: Detection (Anyone)

**Rollback triggered if:**
- Health check fails
- Smoke test fails
- Preflight check fails
- Drift audit detects critical drift
- Error rate spikes
- Performance degrades
- Agent crashes

### Phase 2: Decision (Clawson)

**Clawson declares:**

```
ROLLBACK INITIATED: [version]
Reason: [failure description]
Target: [version to rollback to]
```

### Phase 3: Execution (Codesmith)

```bash
# 1. STOP the system
echo "[ROLLBACK] Stopping agents"
# Stop services gracefully

# 2. RESTORE from backup
echo "[ROLLBACK] Restoring backup"
tar -xzf backups/pre-release-[version]-*.tar.gz -C /

# 3. RECOMPILE
echo "[ROLLBACK] Recompiling"
bash scripts/deploy/compile-configs.sh

# 4. VERIFY
echo "[ROLLBACK] Verifying"
bash scripts/preflight-check.sh
bash scripts/smoke-test.sh

# 5. START the system
echo "[ROLLBACK] Starting services"

# 6. HEALTH CHECK
curl -s http://localhost:3000/health | jq .

# 7. REPORT
echo "[ROLLBACK COMPLETE] System restored to [version]"
```

### Phase 4: Investigation (Clawson + Codesmith)

```
[INCIDENT] [date/time] [version] rolled back
Reason: [failure]
Root cause: [investigation]
Remediation: [what we'll fix]
Backup: backups/incident-rollback-[timestamp].tar.gz
```

---

## ROLLBACK SCENARIOS

### Scenario 1: Agent Won't Start

```
Detection: Agent health check fails
Trigger: Immediate rollback
Recovery:
  1. Restore previous version
  2. Verify agent starts
  3. Run smoke test
  4. Investigate why new version failed
  5. Fix issue in development
  6. Re-release with fix
```

### Scenario 2: Breaking Config Change

```
Detection: Preflight check fails post-deploy
Trigger: Immediate rollback
Recovery:
  1. Restore config
  2. Recompile
  3. Verify preflight passes
  4. Investigate config syntax
  5. Fix in development
  6. Re-release
```

### Scenario 3: Permission Regression

```
Detection: Agent cannot access required resource
Trigger: Immediate rollback
Recovery:
  1. Restore permission schema
  2. Verify all agents can access required resources
  3. Investigate permission change
  4. Audit impact
  5. Fix in development
  6. Re-release with validation
```

### Scenario 4: Drift Detected

```
Detection: Drift audit finds unauthorized changes
Trigger: Immediate investigation, decide rollback
Recovery:
  1. Quarantine unauthorized changes
  2. Restore to clean state
  3. Investigate what changed
  4. Review git history
  5. Document findings
  6. Implement preventive measures
```

---

## ROLLBACK REHEARSAL

**Before deploying MED/HIGH-risk changes:**

### Rehearsal Steps

```bash
# 1. In a test environment (or branch):

# 2. Make the change
# [edit files as per CR]

# 3. Backup current state
cp -r canon/ canon.backup/
cp -r config/ config.backup/

# 4. Deploy change
bash scripts/deploy/compile-configs.sh

# 5. Verify deployment works
bash scripts/preflight-check.sh
bash scripts/smoke-test.sh

# 6. SIMULATE FAILURE
# Manually break something to test rollback

# 7. Execute rollback
cp -r canon.backup/ canon/
cp -r config.backup/ config/
bash scripts/deploy/compile-configs.sh

# 8. Verify rollback works
bash scripts/preflight-check.sh
bash scripts/smoke-test.sh

# 9. Document rollback time
echo "Rollback time: [X seconds]"

# 10. Confirm procedure works
echo "[ROLLBACK REHEARSAL PASSED] Ready to deploy
```

---

## ROLLBACK DOCUMENTATION

Every release includes:

### 1. Backup Reference
```
Backup location: backups/pre-release-[version]-[timestamp].tar.gz
Size: [X MB]
Contents: canon/, config/, scripts/
Created: [date/time]
```

### 2. Rollback Steps (Templated)
```bash
# [Copy exact commands from Phase 3: Execution above]
```

### 3. Estimated Rollback Time
```
Backup extraction: ~[X sec]
Recompilation: ~[X sec]
Verification: ~[X sec]
Total: ~[X sec]
```

### 4. Verification Plan
```
After rollback:
- [ ] Preflight check passes
- [ ] Smoke test passes
- [ ] Health endpoint responds
- [ ] Agents starting normally
- [ ] No errors in logs
```

---

## ANTI-PATTERNS (Never Do These)

```
❌ Deploy without backup
❌ Delete old code before rollback tested
❌ Change multiple systems in one release
❌ Rollback without verifying it works
❌ Skip smoke tests to save time
❌ Assume previous version works (rehearse first)
❌ Release on Friday afternoon
❌ Ignore warnings from quality gates
```

---

## POST-INCIDENT

After every rollback:

```
1. Create incident report
   [INCIDENT] [date] [version] rolled back — [reason]

2. Timeline
   - Detection time
   - Decision time
   - Rollback start
   - Rollback complete
   - Time to recovery

3. Root cause
   - What failed
   - Why it wasn't caught
   - What we should have tested

4. Prevention
   - What gate to add
   - What documentation to improve
   - What process to change

5. Lessons learned
   - What we discovered
   - How to improve
```

---

## RELEASE SUCCESS CRITERIA

Every release is successful only if:

```
✅ All quality gates passed
✅ Clawson approved
✅ Deployment completed without error
✅ Smoke test passed
✅ Health check green
✅ Agents responding
✅ No regressions detected
✅ Rollback plan documented
```

---

## DEPLOYMENT RUNBOOK (Quick Reference)

```
PRE-DEPLOY:
  bash scripts/format-check.sh
  bash scripts/lint.sh
  bash scripts/typecheck.sh
  bash scripts/test.sh
  bash scripts/preflight-check.sh
  bash scripts/drift-audit.sh

WAIT FOR APPROVAL:
  "Approved for release: [version]"

DEPLOY:
  bash scripts/deploy/compile-configs.sh
  bash scripts/deploy/deploy.sh

POST-DEPLOY:
  bash scripts/smoke-test.sh
  curl -s http://localhost:3000/health | jq .

IF FAILURE:
  tar -xzf backups/pre-release-*.tar.gz -C /
  bash scripts/deploy/compile-configs.sh
  bash scripts/smoke-test.sh
  REPORT INCIDENT
```

---

_Version: 1.0.0_  
_Philosophy: Always reversible. Never trapped. Rehearse first._
