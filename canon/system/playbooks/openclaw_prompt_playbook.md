# OpenClaw Prompt Playbook

## Purpose
A library of operational prompts used to manage OpenClaw agents.

---

# System Status Prompt

Clawson,

Provide a full system status report including:

• active agents
• mission control status
• venture pipeline
• cron job status
• system health

---

# Context Rebuild Prompt

Clawson,

Perform system context rebuild.

Steps:

1. Load canonical architecture from /canon
2. Load registry.json
3. Load mission_control architecture
4. Load venture pipeline configuration
5. Confirm Claude Code sandbox rules
6. Return a full system state summary

---

# Venture Discovery Prompt

Moonshot,

Run a discovery cycle and generate three new venture proposals.

Each proposal must include:

• problem description
• target customer
• market evidence
• MVP scope
• pricing model
• MRR potential

---

# Venture Kill Filter Prompt

Evaluate the venture proposal using the kill filter.

Reject the idea if:

• there is no clear paying customer
• the problem occurs rarely
• the market is extremely small
• the solution requires heavy human labor

---

# Change Request Prompt

Clawson,

Create a change request for Codesmith.

Include:

• objective
• user stories
• technical specification
• acceptance criteria
• risk tier

---

# Engineering Execution Prompt

Codesmith,

Execute the approved change request.

Requirements:

• follow all engineering quality gates
• produce code diffs
• provide verification steps
• confirm rollback capability

---

# Claude Code Build Prompt

Codesmith,

Generate the MVP using Claude Code inside /ventures.

Requirements:

• no secrets in code
• environment variables only
• commit changes to git
• provide test results

---

# Experiment Evaluation Prompt

Moonshot,

Evaluate experiment results and recommend:

• GO
• ITERATE
• PIVOT
• NO-GO

Include reasoning and next steps.

---

# Cold Restart Simulation Prompt

Clawson,

Perform cold restart simulation.

Rebuild system state assuming no chat history.

Return:

• agents
• venture pipeline
• system health
