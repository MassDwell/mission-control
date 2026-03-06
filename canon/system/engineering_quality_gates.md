# ENGINEERING QUALITY GATES

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Enforced by:** Codesmith (automated + manual)  
**Philosophy:** Fail closed. Never skip gates.

---

## GATE SEQUENCE (MANDATORY)

All deployments must PASS these gates in order:

```
1. Format Check (if configured)
2. Lint (if configured)
3. Type Check (if configured)
4. Tests (if present)
5. Preflight Check (mandatory)
6. Drift Audit (mandatory)
7. Smoke Test (post-deploy)
```

---

## GATE 1: FORMAT CHECK

**Purpose:** Code consistency, readability

**When to run:**
- Any Python/JavaScript/TypeScript changes
- Configuration file changes

**Command:**
```bash
bash scripts/format-check.sh
# or if not present:
npx prettier --check "**/*.{js,ts,json,md}"
```

**Failure action:**
- ❌ FAIL → Stop. Fix formatting. Retry.
- Auto-fix available: `prettier --write`

**Risk tier:** LOW

---

## GATE 2: LINT

**Purpose:** Code quality, best practices

**When to run:**
- All code changes

**Command:**
```bash
bash scripts/lint.sh
# or:
npx eslint .
```

**Failure action:**
- ❌ FAIL → Stop. Fix violations. Retry.

**Risk tier:** LOW

---

## GATE 3: TYPE CHECK

**Purpose:** Type safety (if TypeScript)

**When to run:**
- TypeScript/Node projects

**Command:**
```bash
bash scripts/typecheck.sh
# or:
tsc --noEmit
```

**Failure action:**
- ❌ FAIL → Stop. Fix types. Retry.

**Risk tier:** LOW

---

## GATE 4: TESTS

**Purpose:** Behavioral correctness

**When to run:**
- If test suite exists

**Command:**
```bash
bash scripts/test.sh
# or:
npm test
```

**Failure action:**
- ❌ FAIL → Stop. Fix tests/code. Retry.

**Risk tier:** MEDIUM

---

## GATE 5: PREFLIGHT CHECK (MANDATORY)

**Purpose:** System configuration integrity

**When to run:**
- ALWAYS, before every change

**Command:**
```bash
bash scripts/preflight-check.sh
```

**What it checks:**
- Canon directory integrity
- Registry JSON validity
- No orphaned files
- Agent directories match registry
- No duplicates
- Config schema validation
- Permission profiles valid
- All agents approved

**Failure action:**
- ❌ FAIL → DO NOT PROCEED. Investigate. Fix. Retry.

**Risk tier:** CRITICAL

---

## GATE 6: DRIFT AUDIT (MANDATORY)

**Purpose:** Detect unauthorized changes, configuration drift

**When to run:**
- ALWAYS, before every deployment

**Command:**
```bash
bash scripts/drift-audit.sh
```

**What it checks:**
- Canon integrity
- Generated configs match canonical source
- No forbidden changes
- Directory structure correct
- All cron jobs valid
- No unauthorized agents
- Permission profiles aligned

**Failure action:**
- ❌ FAIL → DO NOT DEPLOY. Review drift. Remediate. Retry.

**Risk tier:** CRITICAL

---

## GATE 7: SMOKE TEST (POST-DEPLOY)

**Purpose:** Verify system health after deployment

**When to run:**
- Immediately after deployment
- Before declaring success

**Command:**
```bash
bash scripts/smoke-test.sh
```

**What it checks:**
- Health endpoint responds
- Routes configured correctly
- Cron manifest loads
- Agents can start
- No critical errors in logs
- Basic functionality works

**Failure action:**
- ❌ FAIL → IMMEDIATE ROLLBACK. Investigate. Fix. Retry deploy.

**Risk tier:** CRITICAL

---

## MISSING GATE PROTOCOL

### If a gate doesn't exist in the repo:

**For LOW-RISK changes:**
1. Create a minimal version of the gate
2. Document it in this file
3. Proceed

**For MED/HIGH-RISK changes:**
1. Note: "MISSING GATE: [gate name]"
2. Require explicit Clawson approval: "Proceed without [gate]"
3. Increase rollback caution level

**Example:**
```
MISSING GATE: Integration tests
CR APPROVAL REQUIRED: Proceed without integration tests (must use manual verification)
```

---

## GATE MATRIX (By Risk Tier)

| Tier | Format | Lint | Type | Tests | Preflight | Drift | Smoke | Approval |
|------|--------|------|------|-------|-----------|-------|-------|----------|
| LOW | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | Implicit |
| MED | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Explicit |
| HIGH | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Explicit |

*Preflight and Drift are mandatory for all tiers*

---

## QUALITY GATE DISCIPLINE

### Never Skip a Gate

```
❌ "Let's skip format check, we're in a hurry"
❌ "Drift audit takes too long, let's skip it"
❌ "Just deploy without smoke tests"
```

### Why Fail Closed?

Failing a gate is GOOD—it caught a problem before production.

- **Skip a gate = admit we don't care about quality**
- **Fail closed = catch problems early**
- **Roll back = fast recovery**

---

## AUTOMATED vs MANUAL

### Automated Gates (Codesmith runs)
- Format, lint, typecheck, tests
- Preflight check
- Drift audit
- Smoke test

### Manual Gates (Clawson approves)
- Code review
- Architecture review
- Security review
- Breaking change assessment

---

## EXAMPLE: MEDIUM-RISK DEPLOYMENT

```
Change: Add new agent codesmith
Risk: MEDIUM

1. Format check
   bash scripts/format-check.sh
   ✅ PASS

2. Lint
   bash scripts/lint.sh
   ✅ PASS

3. Type check
   bash scripts/typecheck.sh
   ✅ PASS (N/A for this change)

4. Tests
   bash scripts/test.sh
   ✅ PASS (no tests, N/A)

5. Preflight check
   bash scripts/preflight-check.sh
   ✅ PASS

6. Drift audit
   bash scripts/drift-audit.sh
   ✅ PASS (no drift detected)

7. Clawson approval
   "Approved: codesmith — Add engineering agent"
   ✅ APPROVED

8. Deploy
   bash scripts/deploy.sh

9. Smoke test
   bash scripts/smoke-test.sh
   ✅ PASS

Result: ✅ DEPLOYMENT SUCCESSFUL
```

---

## INCIDENT RESPONSE

### If a gate FAILS:

```
1. Stop. Do not proceed.
2. Investigate the failure.
3. Fix the underlying issue (not the test).
4. Re-run the failed gate.
5. If still failing: Rollback immediately.
6. Document incident: [INCIDENT] [date] [description]
```

---

## CONTINUOUS IMPROVEMENT

Every gate failure teaches us something:

- **Format fails** → Need better editor config
- **Lint fails** → Need clearer style guide
- **Tests fail** → Need better test coverage
- **Preflight fails** → Config has issues
- **Drift fails** → Unauthorized changes detected
- **Smoke fails** → Deployment incomplete or broken

Document the lesson. Update the SOP. Improve the gates.

---

_Version: 1.0.0_  
_Philosophy: Fail closed. Never skip. Always learn._
