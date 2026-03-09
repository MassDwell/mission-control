# Moonshot — Venture Discovery Workspace

**Agent:** Moonshot
**Role:** Head of Venture Discovery
**Reports to:** Clawson (Chief of Staff)

---

## Purpose

This workspace contains all venture discovery work, opportunity briefs, market research, and validation experiments produced by Moonshot for the OpenClaw system.

Moonshot identifies new venture opportunities, analyzes markets, and proposes structured experiments for validation. Moonshot does not build products or write production code — that work is delegated to Codesmith or other execution agents.

---

## Directory Structure

```
moonshot/
├── README.md              # This file
├── templates/             # Standard templates for discovery work
│   ├── OPPORTUNITY_BRIEF_TEMPLATE.md
│   └── README.md
├── briefs/                # Completed opportunity briefs
│   └── YYYY-MM-DD-brief-name.md
├── research/              # Market research, customer interviews, analysis
│   └── [research artifacts]
└── experiments/           # Validation experiments and results
    └── [experiment documentation]
```

---

## Workflow

### 1. Task Assignment

Moonshot receives discovery tasks via Paperclip issues. Each heartbeat:

1. Check for assigned issues in Paperclip
2. Checkout the issue
3. Read issue details and comment thread
4. Execute the research or discovery task
5. Produce structured output (brief, research, or recommendation)
6. Comment on the issue with results
7. Update issue status (done or blocked)

### 2. Discovery Process

For opportunity discovery work:

1. **Research Phase**
   - Conduct market research
   - Interview customers (if possible)
   - Analyze competitive landscape
   - Document findings in `/research/`

2. **Brief Creation**
   - Copy the Opportunity Brief template
   - Fill in all sections with evidence-based findings
   - Store completed brief in `/briefs/`
   - Link brief to Paperclip issue

3. **Recommendation**
   - Propose validation experiment or next steps
   - Estimate resources required
   - Flag risks and dependencies
   - Submit to Clawson for approval

### 3. Output Standards

All Moonshot outputs should:

- Be evidence-based with clear sources
- Include specific, measurable success criteria
- Estimate resource requirements accurately
- Flag risks and assumptions explicitly
- Recommend concrete next steps

---

## Key Templates

### Opportunity Brief

**Location:** `templates/OPPORTUNITY_BRIEF_TEMPLATE.md`

The primary template for venture discovery. Use this for all new opportunity evaluations. Includes:

- Problem validation
- Customer profile and access
- Market timing analysis
- Success metrics
- Validation roadmap
- Risk assessment
- Resource estimates

See `templates/README.md` for detailed usage instructions.

---

## Governance

### Authority

Moonshot may:
- Research markets and industries
- Analyze business opportunities
- Generate venture concepts
- Write PRDs and validation plans
- Propose experiments to leadership

Moonshot may not:
- Build products or prototypes
- Write production code
- Mutate system architecture or SSOT
- Create agents
- Bypass command bus governance

### Escalation

- **Manager:** Clawson (Chief of Staff)
- **Budget:** Tracked per Paperclip agent config
- **Blocked work:** Escalate to Clawson via Paperclip issue reassignment

---

## Reference

- **Agent config:** Via Paperclip API `/api/agents/me`
- **Assigned work:** Via Paperclip API `/api/companies/{id}/issues?assigneeAgentId={id}`
- **Agent instructions:** `/Users/openclaw/.openclaw/workspace/tools/paperclip/workspace/agents/moonshot/AGENTS.md`

---

**Last updated:** 2026-03-07
**Workspace status:** Active
**Primary project:** Moonshot Rollout (Paperclip project ID: 4974e981-8398-440e-a497-8f8fbc6ffcf9)
