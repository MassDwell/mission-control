# CHANGE REQUEST #001: REPOSITORY HYGIENE

**Status:** TEMPLATE (awaiting Codesmith activation)  
**Risk Level:** LOW  
**Recommended:** First task after Codesmith activation  

---

## PURPOSE

Establish quality gate infrastructure and document exact commands for engineering workflow baseline.

This is a **known-good baseline** task that validates the Codesmith workflow end-to-end without touching production systems.

---

## CHANGE REQUEST

### Intent

Add/verify lint and format configurations, create minimal smoke test script, and document all quality gate commands for reproducible engineering workflow.

### Scope

- Add `.eslintrc.json` (if missing)
- Add `.prettierrc.json` (if missing)  
- Create `scripts/smoke-test.sh` (if missing)
- Create `scripts/quality-gates-commands.md` (document all gates)
- Update `scripts/format-check.sh` (verify exists/works)
- Update `scripts/lint.sh` (verify exists/works)

### Acceptance Criteria

- [ ] Lint config exists and is valid JSON
- [ ] Format config exists and is valid JSON
- [ ] Smoke test script exists and runs successfully
- [ ] All 7 quality gate commands documented with exact syntax
- [ ] Format check passes on all files
- [ ] Lint passes on all files
- [ ] Smoke test passes (health + routes + cron load)
- [ ] Preflight check passes
- [ ] Drift audit clean

### Risk Level

**✅ LOW**

- No production code changes
- Only configuration and documentation
- All changes are additive (no deletions)
- Fully reversible

### Verification Plan

```bash
# 1. Verify all config files exist
ls -la .eslintrc.json .prettierrc.json

# 2. Validate JSON syntax
jq empty .eslintrc.json
jq empty .prettierrc.json

# 3. Run all quality gates in sequence
bash scripts/format-check.sh
bash scripts/lint.sh
bash scripts/smoke-test.sh
bash scripts/preflight-check.sh
bash scripts/drift-audit.sh

# 4. Verify documentation created
cat scripts/quality-gates-commands.md

# 5. Confirm all gates PASS
# (see outputs below)
```

### Rollback Plan

If any issues occur:

```bash
# 1. Git revert
git revert [commit-hash]

# 2. Restore from backup
tar -xzf backups/pre-cr-001-*.tar.gz -C /

# 3. Recompile
bash scripts/deploy/compile-configs.sh

# 4. Verify clean state
bash scripts/preflight-check.sh

# 5. Report incident
# [INCIDENT] CR-001 rolled back — [reason]
```

---

## EXECUTION DETAILS

### Files to Create/Update

#### 1. `.eslintrc.json`

```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "no-unused-vars": ["warn"],
    "no-console": ["warn"]
  }
}
```

#### 2. `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

#### 3. `scripts/smoke-test.sh`

```bash
#!/bin/bash
set -e

echo "🧪 SMOKE TEST"
echo "════════════════════════════════════════════════════════════════"
echo ""

WORKSPACE="$HOME/.openclaw/workspace"
FAILED=0

# Test 1: Health check endpoint (mock)
echo "✅ Test 1: Health endpoint"
if [ -f "$WORKSPACE/config/VERSION.compiled" ]; then
  echo "   Version: $(cat $WORKSPACE/config/VERSION.compiled)"
  echo "   ✅ Version file present"
else
  echo "   ❌ Version file missing"
  ((FAILED++))
fi

# Test 2: Routes configured
echo "✅ Test 2: Routes configured"
if jq empty "$WORKSPACE/config/routes.json" 2>/dev/null; then
  ROUTES=$(jq '.[] | select(.channel=="telegram")' "$WORKSPACE/config/routes.json" | jq -s 'length')
  echo "   Telegram routes: $ROUTES"
  echo "   ✅ Routes valid"
else
  echo "   ❌ Routes invalid"
  ((FAILED++))
fi

# Test 3: Cron manifest loads
echo "✅ Test 3: Cron manifest"
if jq empty "$WORKSPACE/config/cron-compiled.json" 2>/dev/null; then
  JOBS=$(jq '.[] | select(.enabled!=false)' "$WORKSPACE/config/cron-compiled.json" | jq -s 'length')
  echo "   Active jobs: $JOBS"
  echo "   ✅ Cron manifest valid"
else
  echo "   ❌ Cron manifest invalid"
  ((FAILED++))
fi

# Test 4: No critical errors in recent logs
echo "✅ Test 4: System health"
if [ -d "$WORKSPACE/logs" ]; then
  ERRORS=$(find "$WORKSPACE/logs" -name "*.log" -mtime -1 -exec grep -l "CRITICAL\|FATAL" {} \; 2>/dev/null | wc -l)
  if [ "$ERRORS" -eq 0 ]; then
    echo "   No recent critical errors"
    echo "   ✅ System healthy"
  else
    echo "   ❌ $ERRORS critical errors found"
    ((FAILED++))
  fi
else
  echo "   (logs directory not found, skipping)"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "✅ SMOKE TEST PASSED"
  exit 0
else
  echo "❌ SMOKE TEST FAILED ($FAILED tests)"
  exit 1
fi
```

#### 4. `scripts/quality-gates-commands.md`

```markdown
# QUALITY GATES — EXACT COMMANDS

**Version:** 1.0.0  
**Established:** 2026-03-04 (CR-001)  

All commands assume working directory: `~/.openclaw/workspace`

## Gate 1: Format Check

**Command:**
\`\`\`bash
bash scripts/format-check.sh
\`\`\`

**What it checks:**
- Code formatting consistency
- Prettier compliance

**Pass criteria:** All files formatted correctly

**Fix command:**
\`\`\`bash
npx prettier --write "**/*.{js,ts,json,md}"
\`\`\`

---

## Gate 2: Lint

**Command:**
\`\`\`bash
bash scripts/lint.sh
\`\`\`

**What it checks:**
- Code quality
- Best practices
- No unused variables

**Pass criteria:** Zero lint errors

---

## Gate 3: Type Check

**Command:**
\`\`\`bash
bash scripts/typecheck.sh
\`\`\`

**What it checks:**
- TypeScript type safety (if applicable)

**Pass criteria:** No type errors

---

## Gate 4: Tests

**Command:**
\`\`\`bash
bash scripts/test.sh
\`\`\`

**What it checks:**
- Unit tests pass
- Integration tests pass

**Pass criteria:** All tests pass

---

## Gate 5: Preflight Check (MANDATORY)

**Command:**
\`\`\`bash
bash scripts/preflight-check.sh
\`\`\`

**What it checks:**
- Canon directory integrity
- Registry JSON valid
- No orphaned files
- Agent/registry alignment
- No duplicates
- Config schema validation
- Permission profiles valid
- All agents approved

**Pass criteria:** Zero errors

---

## Gate 6: Drift Audit (MANDATORY)

**Command:**
\`\`\`bash
bash scripts/drift-audit.sh
\`\`\`

**What it checks:**
- Canonical files unchanged
- Generated configs match source
- No unauthorized changes
- Directory structure correct
- All cron jobs valid

**Pass criteria:** CLEAN status

---

## Gate 7: Smoke Test

**Command:**
\`\`\`bash
bash scripts/smoke-test.sh
\`\`\`

**What it checks:**
- Version file present
- Routes valid JSON
- Cron manifest valid
- No critical errors in logs

**Pass criteria:** All 4 tests pass

---

## GATE EXECUTION SEQUENCE

Run in order. Stop on first failure.

\`\`\`bash
#!/bin/bash
set -e

bash scripts/format-check.sh  # Gate 1
bash scripts/lint.sh          # Gate 2
bash scripts/typecheck.sh     # Gate 3 (if applicable)
bash scripts/test.sh          # Gate 4 (if present)
bash scripts/preflight-check.sh  # Gate 5 (MANDATORY)
bash scripts/drift-audit.sh   # Gate 6 (MANDATORY)
bash scripts/smoke-test.sh    # Gate 7

echo "✅ ALL GATES PASSED"
\`\`\`

---

## TROUBLESHOOTING

### If format-check fails
\`\`\`bash
npx prettier --write "**/*.{js,ts,json,md}"
bash scripts/format-check.sh
\`\`\`

### If lint fails
Fix violations manually or update eslintrc rules

### If preflight fails
\`\`\`bash
bash scripts/preflight-check.sh  # Shows specific error
# Fix the issue identified
bash scripts/preflight-check.sh  # Retry
\`\`\`

### If drift audit fails
\`\`\`bash
bash scripts/drift-audit.sh  # Shows drift details
# Investigate unauthorized changes
# Remediate (revert or approve explicitly)
bash scripts/drift-audit.sh  # Retry
\`\`\`

### If smoke test fails
Check log files for critical errors:
\`\`\`bash
find logs/ -name "*.log" -mtime -1 -exec grep "CRITICAL\|FATAL" {} +
\`\`\`

---

_Baseline established: 2026-03-04_
```

#### 5. Update `scripts/format-check.sh`

```bash
#!/bin/bash
# Format check using prettier

echo "🔍 FORMAT CHECK"
echo "════════════════════════════════════════════════════════════════"

npx prettier --check "**/*.{js,ts,json,md}" || {
  echo ""
  echo "❌ Format check failed"
  echo "Fix with: npx prettier --write '**/*.{js,ts,json,md}'"
  exit 1
}

echo "✅ Format check passed"
exit 0
```

#### 6. Update `scripts/lint.sh`

```bash
#!/bin/bash
# Lint check using eslint

echo "🔍 LINT CHECK"
echo "════════════════════════════════════════════════════════════════"

npx eslint . || {
  echo ""
  echo "❌ Lint check failed"
  exit 1
}

echo "✅ Lint check passed"
exit 0
```

---

## EXPECTED OUTPUTS

### Format Check
```
✅ Format check passed
```

### Lint
```
✅ Lint check passed
```

### Smoke Test
```
🧪 SMOKE TEST
✅ Test 1: Health endpoint
✅ Test 2: Routes configured
✅ Test 3: Cron manifest
✅ Test 4: System health

✅ SMOKE TEST PASSED
```

### Preflight
```
✅ PREFLIGHT PASSED (0 errors)
```

### Drift Audit
```
✅ DRIFT AUDIT: CLEAN
```

---

## EVIDENCE-BASED COMPLETION (Template)

After execution, Codesmith reports:

### Summary of Intent
Add quality gate infrastructure and document commands for reproducible engineering workflow.

### Files Changed
- `.eslintrc.json` (created)
- `.prettierrc.json` (created)
- `scripts/smoke-test.sh` (created)
- `scripts/quality-gates-commands.md` (created)
- `scripts/format-check.sh` (verified/updated)
- `scripts/lint.sh` (verified/updated)

### Diff Summary
- Added 3 config files
- Added 2 script files
- Updated 2 existing scripts
- Total: ~250 lines added

### Commands Run
```
bash scripts/format-check.sh ✅ PASS
bash scripts/lint.sh ✅ PASS
bash scripts/smoke-test.sh ✅ PASS
bash scripts/preflight-check.sh ✅ PASS
bash scripts/drift-audit.sh ✅ CLEAN
```

### Outputs Summarized
```
✅ Format check: PASSED
✅ Lint: PASSED
✅ Smoke test: PASSED (health + routes + cron)
✅ Preflight: PASSED (0 errors)
✅ Drift audit: CLEAN
```

### Rollback Steps
```
git revert [commit-hash]
tar -xzf backups/pre-cr-001-*.tar.gz -C /
bash scripts/deploy/compile-configs.sh
bash scripts/preflight-check.sh
```

### Model Used
```
Model Used: [strongest available for planning/setup]
Fallback Used: None
```

---

## CLAWSON APPROVAL TEMPLATE

After Codesmith completes, Clawson approves:

```
Approved: codesmith — CR-001 Repository Hygiene complete
Risk: LOW
Results:
  ✅ Lint/format configs added
  ✅ Smoke test implemented
  ✅ All gates documented
  ✅ All quality gates passed
  ✅ Baseline established

Quality gate infrastructure is now in place.
```

---

## NEXT STEPS

After CR-001 completes:

1. Quality gate infrastructure is established
2. Commands are documented and proven
3. Smoke test baseline is set
4. Codesmith is ready for real engineering work
5. All future CRs follow this proven workflow

---

_Template Version: 1.0.0_  
_Status: Ready for deployment after Codesmith activation_  
_Risk: LOW (configuration + documentation only)_
