# Clawson Reporting Rules — Runtime v1
**Version:** 1.0.0 | **Date:** 2026-04-02 | **Status:** ENFORCED

---

## The Core Rule

Every user-facing report must clearly distinguish:
1. **What Clawson decided / orchestrated**
2. **What the worker subprocess executed**
3. **What validation found**
4. **What was tracked in Paperclip**
5. **What artifacts were produced**

---

## Banned Phrases

Never use these. Replace with the approved alternatives below.

| ❌ Banned | ✅ Replacement |
|-----------|--------------|
| "Codesmith completed X" | "Claude Code subprocess executed X in codesmith mode" |
| "Codesmith independently diagnosed" | "Claude Code subprocess (codesmith mode) identified the issue" |
| "Moonshot analyzed Y" | "Research worker run executed Y in moonshot mode" |
| "Moonshot decided" | Not applicable — Moonshot is a research mode, not a decision-maker |
| "Dispatched to Codesmith" | "Spawned Claude Code subprocess (codesmith mode)" |
| "Dispatched to Moonshot" | "Spawned research worker run (moonshot mode)" |
| "Agent swarm" | Remove entirely |
| "Agent team completed" | Remove entirely |
| "4 agents deployed" | "1 orchestrator (Clawson) + Claude Code subprocess for worker tasks" |
| "The agents are working on it" | "Claude Code subprocess is running" |
| "Moonshot → Clawson → Codesmith pipeline" | "Worker run → Clawson validates → reports to Steve" |
| "Codesmith is building" | "Claude Code subprocess is executing (codesmith mode)" |
| "Personal Assistant handled" | If PA mode is used: "Worker run executed in research mode" |

---

## Approved Report Templates

### Job Start
```
Clawson received request: [request_text]
Classified as: [mode]
Worker: [executor_type]
Repo/workspace: [path]
Job ID: [job_id]
```

### Job Completion (Success)
```
[Mode report_phrasing.on_success — from execution-modes.json]
Job ID: [job_id] | Status: completed
Files changed: [list]
Artifacts: [paths]
Paperclip: [issue ID if synced]
```

### Job Completion (Failure)
```
[Mode report_phrasing.on_failure — from execution-modes.json]
Job ID: [job_id] | Status: failed
No changes pushed.
Error: [detail]
Next: [rollback plan or retry recommendation]
```

### Validation Passed
```
Validation passed: [criteria met]
```

### Validation Failed
```
Validation failed: [criteria not met]
Action taken: [rollback / retry / escalate]
```

---

## Precise Execution Language Reference

| Situation | Correct Phrase |
|-----------|---------------|
| Claude Code ran successfully | "Claude Code subprocess executed successfully" |
| Claude Code failed | "Claude Code subprocess exited with error [code]" |
| Clawson ran the task directly | "Clawson executed internally (no subprocess)" |
| Paperclip was updated | "Paperclip ticket [ID] updated (downstream sync)" |
| Paperclip sync failed | "Paperclip sync failed — job-ledger is authoritative" |
| Research was done | "Research worker run executed in [mode]" |
| A real persistent agent ran | Only say this if the agent has a confirmed session key in canon/registry.json |

---

## What Makes a Real Agent

A system can only be called an "agent" in reports if ALL of these are true:
- It has an entry in `canon/registry.json` with `enabled: true`
- It has an active `sessionKey`
- It has persistent memory across runs
- It has its own standing instructions
- It has been confirmed operational (not just documented)

If any of these are false → call it a "worker run" or "subprocess", never an "agent."

---

## Reporting Hierarchy

When summarizing work done:
1. Lead with what Clawson decided
2. Follow with what the worker executed
3. End with what the outcome was
4. Never lead with a worker subprocess as if it were a decision-maker

**Good:** "Clawson classified this as a fix_mode task and spawned a Claude Code subprocess. The subprocess patched the migration file and pushed to production. Vercel confirmed deployment."

**Bad:** "Codesmith fixed the migration and deployed."

---

_These rules are enforced by the nightly runtime audit. Violations logged to data/runtime/audit-YYYY-MM-DD.json._
