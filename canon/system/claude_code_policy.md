# Claude Code Integration Policy — Runtime v1

**Version:** 2.0  
**Date:** 2026-04-02  
**Status:** Active  

---

## SUMMARY

Claude Code is a subprocess executor used by Clawson for coding, debugging, deployment, and implementation tasks. It is **not an agent**. It has no persistent session, no memory, no autonomous decision-making outside its job spec. It is selected by Clawson, configured by an execution mode, and disposed after the job completes.

---

## EXECUTION MODES

Claude Code subprocesses operate in one of these modes (defined in `canon/system/runtime-v1/execution-modes.json`):

| Mode | Use Case |
|------|---------|
| `codesmith_mode` | Software implementation, debugging, deployment |
| `fix_mode` | Targeted hotfix, minimal blast radius |
| `audit_mode` | Code review, QA passes, schema drift checks |

Research modes (`moonshot_mode`, `research_mode`) use Clawson internal execution, not Claude Code subprocess.

---

## ALLOWED WORKING DIRECTORIES

Claude Code subprocesses are permitted to work in:

```
/Users/openclaw/Projects/drawstack/         ← Primary (DrawStack app)
/Users/openclaw/Projects/massdwell-hub/     ← MassDwell Hub app
/Users/openclaw/Projects/                   ← Any project directory
~/.openclaw/workspace/scripts/              ← Workspace scripts (with care)
~/.openclaw/workspace/data/                 ← Workspace data
```

---

## FORBIDDEN PATHS (NON-NEGOTIABLE)

```
❌ ~/.openclaw/workspace/canon/             ← System governance
❌ ~/.openclaw/workspace/credentials/       ← Secrets
❌ ~/.openclaw/workspace/memory/            ← Session memory
❌ ~/.openclaw/workspace/archive/           ← Archived files
❌ System environment variables (printing)
```

---

## REQUIRED WRAPPER

Every Claude Code invocation for a significant task MUST use:

```bash
~/.openclaw/workspace/scripts/claude-code-run.sh \
  "<job_id>" "<workflow_type>" "<objective>" \
  --permission-mode bypassPermissions --print '<prompt>'
```

This auto-emits to:
- `data/hermes/event-bus.jsonl` (Hermes task record)
- `data/hermes/task-log.jsonl` (simplified Hermes v2 log)

---

## JOB LEDGER

All significant Claude Code jobs must have a corresponding entry in `data/runtime/job-ledger.jsonl` conforming to `canon/system/runtime-v1/job-spec.schema.json`.

---

## REPORTING

After any Claude Code run, reports must follow `canon/clawson/reporting-rules.md`:

✅ "Claude Code subprocess executed in codesmith mode. [summary]."  
❌ "Codesmith completed X."  
❌ "Codesmith independently diagnosed."

---

_Policy owner: Clawson (Runtime v1)_
