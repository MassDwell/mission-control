# Runtime v1 — Governance Reference
**Version:** 1.0.0 | **Date:** 2026-04-02 | **Status:** CANONICAL

---

## What Is Canonical

These files define the authoritative runtime. Do not edit them without understanding what compiles from them.

| File | Purpose | Edit Policy |
|------|---------|------------|
| `canon/system/runtime-v1/execution-modes.json` | Mode definitions — codesmith, moonshot, audit, research, fix | Edit to add/modify modes. Changes take effect immediately. |
| `canon/system/runtime-v1/job-spec.schema.json` | Job spec schema — all jobs must conform | Edit only to add fields. Never remove required fields. |
| `canon/system/runtime-v1/GOVERNANCE.md` | This file | Edit to reflect architecture changes. |
| `canon/clawson/reporting-rules.md` | Banned phrases + correct reporting templates | Edit to add rules. Never relax enforcement. |
| `canon/registry.json` | Agent registry — Clawson is the only real agent | Do not add agents without Steve approval + implementation evidence |
| `data/runtime/job-ledger.jsonl` | Canonical job state — SSOT | Append-only. Never edit existing lines. |

---

## What Is Compiled / Generated

These files are derived. If they conflict with canonical sources, the canonical source wins.

| File | Generated From | Regenerate By |
|------|---------------|--------------|
| `config/agents-compiled.json` | `canon/registry.json` | Run compile pipeline |
| `config/routes.json` | `canon/registry.json` | Run compile pipeline |
| Paperclip issue status | `data/runtime/job-ledger.jsonl` | `scripts/paperclip-sync.js` (best-effort) |

---

## What Is User-Facing Only

These are presentation/visibility layers. They do not hold authoritative state.

| System | Role | Trust Level |
|--------|------|------------|
| Paperclip UI | Issue tracking, agent display | Downstream view only. If it conflicts with job-ledger, job-ledger wins. |
| Telegram messages | User-facing reports | Generated from job ledger, not authoritative themselves |
| Mission Control | Dashboard | Informational |

---

## What Is Safe To Edit Manually

- `data/runtime/job-ledger.jsonl` — **APPEND only**. You can add a new line. Never edit an existing one.
- `canon/clawson/reporting-rules.md` — Add rules, tighten language
- `MEMORY.md`, `HEARTBEAT.md`, `SOUL.md`, `USER.md` — Freely editable operational memory
- Daily memory files `memory/YYYY-MM-DD.md` — Freely editable

---

## What Must Never Be Edited Directly

| File | Why |
|------|-----|
| `config/agents-compiled.json` | Overwritten by compile. Changes lost. |
| `config/routes.json` | Same. |
| `data/runtime/job-ledger.jsonl` existing lines | Append-only log. Editing breaks auditability. |
| Archived files in `_archive/` | Read-only record. Don't modify. |

---

## The Single Orchestrator Rule

**Clawson is the only real agent.** This is not a temporary state — it is the architecture.

Claude Code subprocesses are **worker runs**, not agents. They:
- Have no persistent session
- Have no memory across runs
- Have no autonomous decision-making outside their job spec
- Are selected by Clawson, not self-directed

If a future build adds a persistent agent (persistent session + memory + standing instructions + its own session lifecycle), it must be:
1. Implemented (not just documented)
2. Added to `canon/registry.json` with `enabled: true`
3. Approved by Steve
4. Given a real session key
5. Documented with evidence of its runtime, not just aspirational specs

Existence in `canon/agents/` does NOT make something a real agent.

---

## Paperclip Integration Rules

**Direction:** Job Ledger → Paperclip (one-way, best-effort)

**Priority:** If job-ledger and Paperclip disagree, job-ledger is correct.

**Sync:** After each job completes, `claude-code-run.sh` pushes status to Paperclip. If the push fails, nothing breaks. The job-ledger already has the truth.

**Do not:** Read Paperclip state to determine if a job succeeded. Read the job-ledger.

---

## Adding a New Execution Mode

1. Add entry to `canon/system/runtime-v1/execution-modes.json`
2. Include all required fields: mode_id, description, intended_use, executor_type, input_schema, output_schema, validation_rules, fail_conditions, report_phrasing, artifact_expectations
3. Update `canon/clawson/reporting-rules.md` with the new mode's phrasing rules
4. No compile step required — Clawson reads modes directly

---

## Drift Resistance

The nightly audit (`scripts/runtime-audit.js`) checks:
- References to archived/fake agent names in active files
- Jobs in job-ledger with invalid status values
- Orphaned jobs (running >24h with no completion)
- Mode definitions missing required fields
- Banned phrases in recent reports

Audit results write to `data/runtime/audit-YYYY-MM-DD.json`.

---

_This document is the ground truth for how Runtime v1 works. When in doubt, this file answers the question._
