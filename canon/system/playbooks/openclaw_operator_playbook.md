# OpenClaw v2 – Institutional Operator Playbook

## Purpose
Reference guide for operating the OpenClaw system safely and effectively.
This document is **reference only** and does not automatically change system behavior.

---

# Core Architecture Philosophy

canon = rules 
data = state 
agents = workers 
chat = temporary

Chat history should never be relied upon as long-term system memory.

---

# Canon Structure

canon/
 agents/
 system/
 policies/
 pipelines/
 mission_control/
 playbooks/

All system architecture and rules must live inside canon.

---

# Operational Rules

1. Agents must remain stateless workers.
2. System state must live in structured files (JSON).
3. Architecture changes require an approved Change Request.
4. Canon files should never be modified without explicit approval.

---

# Change Request Workflow

Moonshot → Proposal 
Clawson → Approval 
Codesmith → Implementation 
Claude Code → Build sandbox 
Mission Control → Experiment tracking

---

# Drift Protection

Daily drift audits should verify:

• registry alignment 
• duplicate canon files 
• orphan files 
• schema validation 

---

# Recovery Procedure

If system state becomes inconsistent:

1. Load registry.json
2. Load canon system files
3. Rebuild agent state
4. Reload mission control data
5. Verify cron jobs

---

# Cold Restart Test

Run weekly to ensure system resilience.

Simulate complete chat memory loss and rebuild state from disk.

Expected output:

• active agents
• mission control status
• venture pipeline
• system health

---

# Mission Control Command Questions

The dashboard should answer:

• What are the agents doing?
• What work is currently in progress?
• What ventures are being built?
• What work is blocked?
• Is the system healthy?

---

# Engineering Safety Rules

Codesmith must never directly modify:

/config 
/generated 

All configuration changes must flow through compile scripts.

---

# Claude Code Safety

Claude Code may only operate inside:

/ventures

It must never receive direct access to:

/canon 
/config 
/scripts 

---

# Venture Pipeline

Moonshot → Idea discovery 
Clawson → Approval 
Codesmith → MVP build 
Claude Code → Code generation 
Experiment → Validation 
Mission Control → Results 

---

# System Health Metrics

Mission Control should monitor:

• agent uptime
• cron job success rate
• error rate
• deployment history
