# Claude Code Integration — Dry Run Example

**Date:** 2026-03-04  
**Purpose:** Demonstrate safe Claude Code workflow with no real execution  
**Scenario:** Building MassDwell Lead Qualification Bot  

---

## Phase 1: Moonshot Creates PRD

### PRD Summary
```
Product: MassDwell Lead Qualification Bot
Description: Automated system to qualify incoming leads by collecting
             basic info and scoring fit

Success Metric: Reduce manual qualification time by 70%

Experiment Plan:
  Week 1: Build prototype API (3 endpoints)
  Week 2: Integrate with Slack (notifications)
  Week 3: Test with real leads (10 qualification rounds)
```

---

## Phase 2: Clawson Creates Change Request

### CR-201: MassDwell Lead Qualification Bot

```markdown
# CHANGE REQUEST: MassDwell Lead Qualification Bot

## Intent
Build an API-based lead qualification system to automatically screen
MassDwell ADU sales leads and categorize by fit/timeline/budget.

## Scope
New venture: ventures/massdwell_lead_bot/
Technology: Node.js + Express + TypeScript
Database: PostgreSQL (env var, no actual DB)
Timeline: 2 weeks
Success: All tests pass, API serves 3 endpoints

## Risk Level
LOW

## Acceptance Criteria
- [ ] API with 3 endpoints (POST /leads, GET /qualify, GET /results)
- [ ] Input validation
- [ ] Error handling
- [ ] 15+ unit tests
- [ ] All quality gates pass
- [ ] README with setup instructions
- [ ] .env.example with required vars

## Rollback Plan
git revert <commit-hash>
Back to previous state.

## Clawson Approval
Approved: codesmith — MassDwell Lead Qualification Bot
Risk: LOW
Build time: 2 weeks max
```

---

## Phase 3: Codesmith Writes Architecture Plan

### Architecture Document

```markdown
# Architecture Plan — MassDwell Lead Qualification Bot

## Tech Stack
- Runtime: Node.js 20 LTS
- Framework: Express
- Language: TypeScript
- Testing: Jest
- Database: PostgreSQL (stubbed, DATABASE_URL in .env)

## Directory Structure
ventures/massdwell_lead_bot/
├── src/
│   ├── server.ts (Express entry point)
│   ├── routes/
│   │   └── leads.ts (3 endpoints)
│   ├── handlers/
│   │   ├── postLead.ts
│   │   ├── getQualify.ts
│   │   └── getResults.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── types/
│   │   └── lead.ts
│   └── utils/
│       └── scoring.ts
├── tests/
│   ├── api.test.ts (15 tests)
│   ├── handlers.test.ts
│   └── scoring.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md

## Task Breakdown for Claude Code

### Task 1: Project Setup + API Scaffold
Objective: Generate Express server with basic structure

Claude Code Prompt:
  "Generate Express TypeScript server for venture massdwell_lead_bot:
  
  Requirements:
  - Create src/server.ts with Express app (port 3000)
  - Add tsconfig.json with strict mode
  - Create src/types/lead.ts with Lead interface:
    {
      id: string
      name: string
      email: string
      company: string
      budget: number
      timeline: 'immediate' | '1-3mo' | '3-6mo' | '6mo+'
      fit_score: number (0-100)
      created_at: Date
    }
  - Add src/middleware/errorHandler.ts for error handling
  - Generate package.json with all dependencies
  - Add .env.example:
    DATABASE_URL=postgres://...
    API_KEY=your_key_here
    NODE_ENV=development
  
  Tests:
  - Create tests/api.test.ts with 5 tests:
    1. Server starts on port 3000
    2. POST /health returns 200
    3. GET /health returns { status: 'ok' }
    4. Invalid API_KEY returns 401
    5. Missing headers returns 400
  
  Quality Gates:
  - No hardcoded secrets
  - All 5 tests must pass
  - TypeScript: 0 errors
  - ESLint: 0 errors"

Expected Outcome:
  ✅ src/server.ts (50 lines)
  ✅ src/types/lead.ts (10 lines)
  ✅ src/middleware/errorHandler.ts (30 lines)
  ✅ package.json (with all deps)
  ✅ .env.example (with stubs)
  ✅ tests/api.test.ts (80 lines, 5 tests)
  ✅ tsconfig.json
  ✅ All tests pass

### Task 2: Lead Qualification Endpoints
Objective: Implement 3 main endpoints

Claude Code Prompt:
  "Implement 3 endpoints in src/routes/leads.ts:
  
  1. POST /leads
     Input: { name, email, company, budget, timeline }
     Output: { id, created_at }
     Validation: All fields required, budget > 0
     Tests: 4 tests (valid, missing field, bad budget, etc)
  
  2. POST /qualify
     Input: { lead_id, answers: {} }
     Logic: Calculate fit_score based on answers
     Output: { lead_id, fit_score, recommendation }
     Tests: 4 tests
  
  3. GET /results/:lead_id
     Output: Full lead object with fit_score
     Tests: 3 tests (found, not found, invalid id)
  
  Database: Use environment variable DATABASE_URL
           (No actual connection, just read from env)
  
  Error Handling: Use errorHandler middleware
  
  Total tests: 11 new tests (API now has 16 total)"

Expected Outcome:
  ✅ src/routes/leads.ts (150 lines)
  ✅ src/handlers/postLead.ts
  ✅ src/handlers/getQualify.ts
  ✅ src/handlers/getResults.ts
  ✅ tests/api.test.ts updated (16 tests total)
  ✅ All 16 tests pass

### Task 3: Input Validation + Error Handling
Objective: Add validation middleware + comprehensive error handling

Claude Code Prompt:
  "Implement validation and error handling:
  
  1. Create src/middleware/validation.ts
     - Validate lead data (name, email, budget)
     - Check email format
     - Check budget > 0
     - Return 400 with error details if invalid
  
  2. Enhance src/middleware/errorHandler.ts
     - Catch all errors globally
     - Return 500 with { error: message }
     - Log errors (console.error)
     - Never leak secrets in error messages
  
  3. Add tests in tests/handlers.test.ts
     - 5 new validation tests
     - 3 new error handling tests
  
  Total: 8 new tests (API now has 24 total)"

Expected Outcome:
  ✅ src/middleware/validation.ts (60 lines)
  ✅ src/middleware/errorHandler.ts (enhanced, 50 lines)
  ✅ tests/handlers.test.ts (120 lines, 8 tests)
  ✅ All 24 tests pass
  ✅ No secrets in error messages

## Development Workflow (Codesmith)

Task 1 Execution:
  cd ventures/massdwell_lead_bot/
  npm install
  npm run typecheck     # 0 errors
  npm run lint          # 0 errors
  npm test              # 5/5 pass
  git add -A
  git commit -m "Claude Code: Task 1 API scaffold (5 tests pass)"

Task 2 Execution:
  npm test              # 16/16 pass
  npm run typecheck     # 0 errors
  npm run lint          # 0 errors
  Diff review ✓
  git commit -m "Claude Code: Task 2 lead endpoints (11 new tests pass, 16 total)"

Task 3 Execution:
  npm test              # 24/24 pass
  npm run typecheck     # 0 errors
  npm run lint          # 0 errors
  Diff review ✓
  git commit -m "Claude Code: Task 3 validation + error handling (8 new tests pass, 24 total)"

## Required Secrets (Added by Clawson Later)

After code review:
  .env (added by Clawson):
    DATABASE_URL=postgres://user:pass@host/db
    API_KEY=sk_live_abcdef123456
    NODE_ENV=production

These are NOT generated by Claude Code.
Codesmith documents them; Clawson provides them.

## Quality Gates Summary

After all 3 tasks complete:

✅ Format check: 0 errors (prettier)
✅ Lint: 0 errors (eslint)
✅ Type check: 0 errors (tsc)
✅ Unit tests: 24/24 pass (jest)
✅ Secrets scan: 0 secrets found (grep)
✅ Diff review: Approved by Codesmith
✅ Code review: No core system changes

All gates: PASS

## Outcome

Fully functional API with:
  • 3 REST endpoints
  • Input validation
  • Error handling
  • 24 passing tests
  • No hardcoded secrets
  • Ready for deployment

Time to develop: ~2 days (3 Claude Code runs)
Reversibility: `git revert` if needed
```

---

## Phase 4: Execution (Codesmith + Claude Code)

### Task 1 Output Summary

```
COMMAND: npm test
OUTPUT:
  PASS tests/api.test.ts (5 tests)
  ✓ Server starts on port 3000 (10ms)
  ✓ POST /health returns 200 (5ms)
  ✓ GET /health returns { status: 'ok' } (3ms)
  ✓ Invalid API_KEY returns 401 (8ms)
  ✓ Missing headers returns 400 (6ms)
  
  Test Suites: 1 passed, 1 total
  Tests: 5 passed, 5 total
  Snapshots: 0 total
  Time: 1.234s

COMMAND: npm run typecheck
OUTPUT:
  Successfully compiled 3 files with TypeScript.
  0 errors

COMMAND: npm run lint
OUTPUT:
  0 problems (0 errors, 0 warnings, 0 notices)
```

Codesmith actions:
```bash
cd ventures/massdwell_lead_bot/
git add -A
git commit -m "Claude Code: Task 1 API scaffold (5 tests pass)"
git log --oneline
  abc1234 Claude Code: Task 1 API scaffold (5 tests pass)
```

Activity logged:
```json
{
  "agent": "codesmith",
  "action": "Claude Code run: massdwell_lead_bot - Task 1 API scaffold (5 tests pass)",
  "level": "info",
  "timestamp": "2026-03-05T09:00:00Z"
}
```

### Task 2 Output Summary

```
COMMAND: npm test
OUTPUT:
  PASS tests/api.test.ts (16 tests total, 11 new)
  
  Test Suites: 1 passed, 1 total
  Tests: 16 passed, 16 total
  Time: 2.456s
```

Activity logged:
```json
{
  "agent": "codesmith",
  "action": "Claude Code run: massdwell_lead_bot - Task 2 endpoints (11 new tests, 16 total pass)",
  "level": "info",
  "timestamp": "2026-03-05T14:00:00Z"
}
```

### Task 3 Output Summary

```
COMMAND: npm test
OUTPUT:
  PASS tests/api.test.ts (24 tests total, 8 new)
  
  Test Suites: 2 passed, 2 total
  Tests: 24 passed, 24 total
  Time: 3.891s
```

Activity logged:
```json
{
  "agent": "codesmith",
  "action": "Claude Code run: massdwell_lead_bot - Task 3 validation (8 new tests, 24 total pass, ready for secrets)",
  "level": "info",
  "timestamp": "2026-03-05T16:00:00Z"
}
```

---

## Phase 5: Codesmith Reports to Clawson

### Completion Report

```
✅ COMPLETE: MassDwell Lead Qualification Bot (CR-201)

GENERATED:
  • src/server.ts (Express entry point)
  • src/routes/leads.ts (3 endpoints: POST /leads, POST /qualify, GET /results)
  • src/middleware/errorHandler.ts (error handling)
  • src/middleware/validation.ts (input validation)
  • tests/ (24 tests, all passing)

QUALITY GATES: ALL PASS
  ✅ Lint: 0 errors
  ✅ Type check: 0 errors
  ✅ Tests: 24/24 pass
  ✅ Secrets scan: 0 secrets found
  ✅ Diff review: Approved

COMMANDS EXECUTED:
  npm install
  npm run typecheck    # 0 errors
  npm run lint         # 0 errors
  npm test             # 24/24 pass

REQUIRED SECRETS (Add after Clawson review):
  DATABASE_URL → Will read from env, currently stubbed
  API_KEY → Will read from env, currently stubbed
  NODE_ENV → Set to 'development'

GIT COMMITS:
  abc1234 Claude Code: Task 1 API scaffold (5 tests pass)
  def5678 Claude Code: Task 2 endpoints (11 new tests, 16 total)
  ghi9012 Claude Code: Task 3 validation (8 new tests, 24 total)

EVIDENCE:
  [Full test output]
  [Lint output]
  [Type check output]
  [Git log]

STATUS: Ready for Clawson review + secret injection
TIME: 2 days (3 Claude Code runs)
REVERSIBILITY: Fully reversible (git revert)
```

---

## Phase 6: Clawson Updates Mission Control

### Workstream Update

```json
{
  "workstream_id": "ws_lead_bot",
  "title": "MassDwell Lead Qualification Bot",
  "current_stage": "experiment",
  "progress_percent": 100,
  "status": "completed",
  "current_task": "✅ API built with 24 tests passing. Awaiting secret injection for production deployment.",
  "notes": "Claude Code generated all endpoints. Codesmith QA: PASSED. Ready for Clawson to add credentials."
}
```

---

## Safety Verification

### ✅ All Safety Constraints Met

```
✅ No access to /canon/**
   → /ventures only, no system files touched

✅ No access to /config/**
   → Compiled configs unchanged

✅ No secrets in code
   → API_KEY and DATABASE_URL read from env
   → .env.example has placeholders only

✅ No Telegram routes
   → Claude Code has no route access

✅ No registry modifications
   → canon/registry.json unchanged

✅ All changes reversible
   → git revert available for all commits

✅ All changes logged
   → agent_activity.json entries for each run

✅ Drift audit clean
   → Daily drift audit passes (no escape detected)
```

### ✅ Rollback Verification

```bash
cd ventures/massdwell_lead_bot/

# If any task failed:
git revert abc1234  # Back to before Task 1
# OR
git revert def5678  # Back to before Task 2
# OR
git revert ghi9012  # Back to before Task 3

git status          # Clean
git log --oneline   # Shows revert commits
```

---

## Lessons Learned (For Next Venture)

1. Clear task breakdown → Claude Code generates better code
2. All quality gates must pass before committing
3. Secrets as env vars (not hardcoded) = safe + portable
4. Activity logging helps track all Claude Code runs
5. Reversibility via git = confidence to experiment

---

_Dry run complete. Safety verified. Ready for real ventures._
