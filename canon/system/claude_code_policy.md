# Claude Code Integration Policy (Safe Mode)

**Version:** 1.0  
**Date:** 2026-03-04  
**Status:** Active (Codesmith only)  
**Risk Level:** LOW (fully sandboxed)  

---

## EXECUTIVE SUMMARY

Claude Code is a code generation tool integrated with Codesmith for building external applications and MRR products. It operates in a **completely sandboxed environment** with strict access controls and zero risk to OpenClaw core systems.

**Critical:** Claude Code is NOT an agent, has NO routes, and has NO access to core OpenClaw systems.

---

## ALLOWED SCOPE

### ✅ Claude Code CAN Access

```
/ventures/**
├── venture_001/
│   ├── src/
│   ├── tests/
│   ├── docs/
│   ├── .env.example (no secrets)
│   └── README.md
├── venture_002/
└── _templates/
    └── [starter templates]
```

**Allowed operations inside /ventures:**
- Read/write all files in venture folder
- Create subdirectories (src, tests, docs, config)
- Generate code, configs, scripts
- Create test files and documentation
- Modify package.json, requirements.txt, etc.

### ❌ Claude Code CANNOT Access

```
FORBIDDEN (non-negotiable):
  ❌ /canon/**              (system governance)
  ❌ /config/**             (compiled configs)
  ❌ /scripts/**            (system scripts)
  ❌ /.openclaw/**          (core directory)
  ❌ /credentials/**        (secrets)
  ❌ /data/mission-control/ (operational data)
  ❌ /memory/**             (session memory)
  ❌ /archive/**            (archived files)
  ❌ /backups/**            (backup data)
  ❌ System environment variables
  ❌ Process management
  ❌ File system outside /ventures/
```

---

## SECRETS RULE (ABSOLUTE)

**Claude Code must NOT access, receive, or generate secrets.**

### What Claude Code Can Do
```
✅ Generate .env.example files with placeholder values
✅ Document "Required Secrets:" in README
✅ Create shell scripts that expect env vars
✅ List what secrets are needed (with clear labels)
```

### What Claude Code Cannot Do
```
❌ Access any credential files
❌ Read OAuth tokens, API keys, SSH keys
❌ Write hardcoded secrets into code
❌ Access environment variables (except those explicitly stubbed)
❌ Connect to external services for credential lookup
```

### Secret Injection Workflow
```
1. Claude Code generates code stub:
   API_KEY = os.getenv('STRIPE_API_KEY')  # Set in .env

2. Code documents requirement:
   "README.md: Requires STRIPE_API_KEY from Steve's credentials/"

3. Codesmith reports to Clawson:
   "This venture needs: STRIPE_API_KEY (from credentials/stripe/)"

4. Clawson adds secrets MANUALLY after review:
   cp credentials/stripe/api-key .env
```

---

## LOGGING REQUIREMENTS

### Agent Activity Log (Mandatory)

Every Claude Code run must create an entry in `data/mission-control/agent_activity.json`:

```json
{
  "agent": "codesmith",
  "action": "Claude Code run: venture_001 - Generated REST API scaffold with 5 endpoints",
  "level": "info",
  "timestamp": "2026-03-04T20:30:00Z"
}
```

**If issues occur:**
```json
{
  "agent": "codesmith",
  "action": "Claude Code run FAILED: venture_001 - Type validation errors in generated service.ts (2 errors, Codesmith fixing)",
  "level": "warning",
  "timestamp": "2026-03-04T20:31:00Z"
}
```

### Claude Code Runs Log (Optional but Recommended)

Optional detailed log in `data/mission-control/claude_code_runs.json`:

```json
{
  "venture_id": "venture_001",
  "run_id": "ccr_abc123",
  "timestamp": "2026-03-04T20:30:00Z",
  "task": "Generate REST API scaffold with 5 endpoints",
  "files_created": [
    "src/server.ts",
    "src/routes/users.ts",
    "src/routes/products.ts",
    "tests/api.test.ts"
  ],
  "files_modified": [
    "package.json"
  ],
  "summary": "✅ 4 files generated, 1 modified, all tests passing",
  "tests_run": 12,
  "tests_passed": 12,
  "result": "success"
}
```

---

## GOVERNANCE & APPROVAL

### Before Claude Code Can Run

```
1. Moonshot produces PRD + experiment plan
   ↓
2. Clawson approves and creates Change Request (CR)
   ↓
3. Codesmith writes architecture plan + task breakdown
   ↓
4. [ONLY NOW] Claude Code is invoked
```

**No exceptions.** Claude Code cannot run without CR approval.

---

## ROLLBACK EXPECTATIONS

### Every Claude Code Output is Reversible

```
If Claude Code generates code in /ventures/venture_001/:
  1. Git tracks all changes
  2. Codesmith reviews diff
  3. If bad: git checkout / git revert
  4. If good: commit with message "Claude Code: venture_001 REST API scaffold"
```

**Rollback time:** < 1 minute (git revert)

### What Happens on Failure

```
Claude Code produces bad code
  ↓ (Codesmith catches in tests)
  ↓ git revert (removes changes)
  ↓ Activity log: "Claude Code run REVERTED: venture_001 (test failures)"
  ↓ Clawson notified
  ↓ Codesmith refines task, tries again
```

---

## ARCHITECTURE GUARANTEES

### System Integrity (Unchanged)

```
✅ /canon/registry.json — NOT modified by Claude Code
✅ /config/** — NOT modified by Claude Code
✅ /scripts/** — NOT modified by Claude Code
✅ Cron jobs — NOT modified by Claude Code
✅ Agent routes — NOT modified by Claude Code
✅ No drift — OpenClaw drift audit passes (daily 1 AM)
```

### Data Integrity (Safe)

```
✅ /ventures/** — Completely isolated
✅ Git tracks all changes (no surprise mutations)
✅ Tests validate before commit
✅ Rollback available at all times
```

---

## CODESMITH RESPONSIBILITY

Codesmith is 100% responsible for:

```
1. ✅ Creating CR before invoking Claude Code
2. ✅ Defining clear architecture + task breakdown
3. ✅ Running tests on Claude Code output
4. ✅ Reviewing diffs (no secrets, no core system changes)
5. ✅ Committing with clear messages
6. ✅ Logging to agent_activity.json
7. ✅ Reporting results to Clawson
8. ✅ Reverting bad code (if needed)
```

**Claude Code is a tool. Codesmith is the engineer.**

---

## EXAMPLES OF SAFE USAGE

### ✅ Allowed

```
CR-100: Build MassDwell Lead Qualification Bot
  Task: Generate Node.js Express API with 3 endpoints
  Scope: /ventures/lead_qual_bot/
  Claude Code output:
    - src/server.ts
    - src/handlers/qualify.ts
    - tests/api.test.ts
    - package.json
  Result: 12 tests pass, no secrets used
  Status: DEPLOYED to ventures/
```

```
CR-101: Build Alpine Property Data Pipeline
  Task: Generate Python ETL for property data
  Scope: /ventures/alpine_etl/
  Claude Code output:
    - pipeline.py
    - requirements.txt
    - .env.example (placeholder API_KEY)
    - tests/test_pipeline.py
  Documentation:
    "Requires: ZILLOW_API_KEY (must be added by Clawson)"
  Status: READY (secrets stubbed)
```

### ❌ Not Allowed

```
❌ "Generate code that reads from /credentials/"
❌ "Modify canon/cron.manifest.canon"
❌ "Add new agent to registry.json"
❌ "Create a cron job"
❌ "Access Kommo CRM credentials"
❌ "Modify /config/agents-compiled.json"
❌ "Deploy outside /ventures/"
```

---

## DRIFT AUDIT IMPLICATIONS

**Daily drift audit (1 AM EST)** will verify:

```
✅ No unauthorized files in /canon/, /config/, /scripts/
✅ No modifications to critical system files
✅ Registry unchanged
✅ Cron manifest unchanged
✅ All changes confined to /ventures/
```

**Result:** If Claude Code ever escapes sandbox, drift audit catches it and alerts Clawson.

---

## SECURITY MATRIX

| Aspect | Constraint | Enforcement |
|--------|-----------|------------|
| **Scope** | Only /ventures/** | Filesystem permissions (read-only outside) |
| **Secrets** | No access | No credential paths available |
| **System Files** | Cannot modify | /canon, /config, /scripts read-only |
| **Routes** | Not registered | No Telegram/message access |
| **Approval** | Clawson CR required | Workflow gate |
| **Logging** | All runs logged | agent_activity.json mandatory |
| **Rollback** | Always available | Git history + 1-min revert |
| **Drift** | Daily audit | Automatic detection |

---

## ACTIVATION CHECKLIST

**Before Claude Code can be used:**

- [ ] /ventures/ workspace created with _templates/
- [ ] canon/system/claude_code_policy.md written
- [ ] canon/agents/codesmith/sop.md amended with Claude Code section
- [ ] /ventures/README.md explains scope + workflow
- [ ] data/mission-control/claude_code_runs.json schema ready (optional)
- [ ] Codesmith tested with first CR (dry run)
- [ ] Activity logging confirmed
- [ ] Drift audit passes
- [ ] Clawson confirmed safety gates

---

**Status: Ready for activation after Steve approval.**
