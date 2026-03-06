# OpenClaw Canonical Playbook Index

**Version:** 1.0  
**Date Created:** 2026-03-04 21:33 EST  
**Status:** ✅ REGISTERED  

---

## Purpose

Centralized registry of all canonical operational playbooks.

These are **reference-only guides** that provide operational wisdom, debugging procedures, and prompt templates.

**Important:** Playbooks do NOT automatically execute system behavior. They exist as guidance for Steve and Clawson.

---

## Registered Playbooks

### 1. OpenClaw Operator Playbook
**File:** `canon/system/playbooks/openclaw_operator_playbook.md`  
**Size:** 2.4 KB  
**Purpose:** Core operational reference for system administration, architecture philosophy, drift protection, recovery procedures, and system health monitoring.

**Key Sections:**
- Core Architecture Philosophy
- Canon Structure
- Operational Rules
- Change Request Workflow
- Drift Protection
- Recovery Procedure
- Cold Restart Test
- Mission Control Command Questions
- Engineering Safety Rules
- Claude Code Safety
- Venture Pipeline
- System Health Metrics

**When to Reference:**
- Debugging system inconsistencies
- Understanding architecture decisions
- Planning recovery procedures
- Verifying safety compliance
- Designing system changes

---

### 2. OpenClaw Prompt Playbook
**File:** `canon/system/playbooks/openclaw_prompt_playbook.md`  
**Size:** 2.0 KB  
**Purpose:** Library of operational prompts used to manage OpenClaw agents and execute system procedures.

**Key Prompts:**
- System Status Prompt
- Context Rebuild Prompt
- Venture Discovery Prompt
- Venture Kill Filter Prompt
- Change Request Prompt
- Engineering Execution Prompt
- Claude Code Build Prompt
- Experiment Evaluation Prompt
- Cold Restart Simulation Prompt

**When to Reference:**
- Initiating a specific system procedure
- Structuring agent instructions
- Scaling operational workflows
- Creating consistent prompt patterns across agents

---

## Access Policy

**Clawson may reference these playbooks when:**
- Debugging system issues
- Creating change requests
- Advising on agent architecture
- Recommending prompt structures
- Planning recovery procedures
- Evaluating system health
- Designing new operational workflows

**System behavior rules:**
- ❌ Playbooks do NOT auto-execute anything
- ❌ Playbooks do NOT override canon/registry.json
- ❌ Playbooks do NOT modify system configuration automatically
- ✅ Playbooks exist only as operator guidance

---

## Integration with Canon

**Location:** `canon/system/playbooks/`  
**Registry Status:** ✅ Indexed in playbook_index.md  
**Canonical Authority:** ✅ Yes (reference documents in canon/)  
**System Impact:** ❌ None (reference only, no auto-execution)  

---

## Usage Pattern

When Clawson or Steve needs operational guidance:

1. **Reference the relevant playbook** (e.g., "see OpenClaw Operator Playbook § Recovery Procedure")
2. **Extract the applicable section**
3. **Execute manually** with human judgment
4. **No automatic behavior changes**

---

## Future Expansions

Additional playbooks can be registered here as they are created:

- Security Playbook (access control, credential rotation, audit)
- Incident Response Playbook (failure detection, escalation, recovery)
- Deployment Playbook (safe deployment procedures, rollback)
- Agent Development Playbook (building new agents, testing, rollout)
- Venture Launch Playbook (MVP to production, metrics, scaling)

---

**Status: ✅ REGISTERED & INDEXED**

_These playbooks are operational reference materials maintained in canon. No system behavior is automatically derived from their contents._
