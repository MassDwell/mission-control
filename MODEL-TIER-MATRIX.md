# Model Tier Matrix — Active Core Agents

**Effective:** 2026-03-08 (Sunday, 8:53 AM EST)  
**Policy:** TIER 1 (Core / High-Judgment / Operator-Facing)  
**Status:** ✅ Applied & Active

---

## Core Tier 1 Agents

### 1. **Clawson** (Main / COO)
- **Default Model:** `anthropic/claude-sonnet-4-6`
- **Escalation Model:** `anthropic/claude-opus-4-6`
- **Rationale:** Executive orchestrator managing three businesses, coordinating complex workstreams, and making strategic decisions. Sonnet 4.6 provides the balance of speed and judgment needed for operational coordination. Opus escalation for major restructuring, sensitive decisions, or complex multi-step orchestration.

### 2. **Codesmith**
- **Default Model:** `anthropic/claude-sonnet-4-6`
- **Escalation Model:** `anthropic/claude-opus-4-6`
- **Rationale:** Full-stack development agent handling architecture, refactoring, and production code. Sonnet 4.6 is strong enough for most coding work. Opus escalation only for large refactors, hard debugging, architecture decisions, or risky production deployments.

### 3. **Moonshot** (Venture Engine)
- **Default Model:** `anthropic/claude-sonnet-4-6`
- **Escalation Model:** `anthropic/claude-opus-4-6`
- **Rationale:** Identifies high-upside AI/SaaS opportunities with strategic reasoning. Sonnet 4.6 handles discovery, competitive analysis, and opportunity briefs well. Opus escalation for major opportunity PRDs, deep strategic synthesis, or breakthrough opportunity analysis.

### 4. **Personal Life**
- **Default Model:** `anthropic/claude-sonnet-4-6`
- **Escalation Model:** `anthropic/claude-opus-4-6`
- **Rationale:** Manages personal workflow, scheduling, and planning. Sonnet 4.6 sufficient for most personal operations. Opus escalation only for unusually complex planning scenarios, sensitive personal decision-making, or broad workflow design changes.

---

## Escalation Usage Guidelines

**When to use Opus 4.6:**
- Major orchestration/restructuring at system level
- Large code refactors or architecture decisions
- Hard debugging with production impact
- Strategic briefs and PRDs (competitive analysis, market positioning)
- Sensitive personal or business decisions requiring deep reasoning
- Breakthrough opportunity synthesis

**When to stay on Sonnet 4.6:**
- Routine operations and coordination
- Standard coding tasks and reviews
- Typical opportunity scanning
- Daily planning and scheduling
- Ongoing project management

---

## Model Changes Summary

| Agent | Before | After | Status |
|-------|--------|-------|--------|
| **Clawson** (main) | Haiku 4.5 | Sonnet 4.6 | ✅ UPGRADED |
| **Codesmith** | [None] | Sonnet 4.6 | ✅ EXPLICIT |
| **Moonshot** (venture_engine) | Sonnet 4.5 | Sonnet 4.6 | ✅ UPDATED |
| **Personal Life** | [None] | Sonnet 4.6 | ✅ EXPLICIT |

---

## Cost & Capability Balance

**Tier 1 Default (Sonnet 4.6):**
- Balanced cost/performance for operator-facing work
- Strong reasoning, coding, and strategic thinking
- Fast turnaround for real-time coordination
- Reliable for tool use and multi-step workflows

**Tier 1 Escalation (Opus 4.6):**
- Maximum reasoning power when needed
- Used sparingly (by design) for complex/sensitive work
- Higher cost-per-token, but justified for high-stakes decisions
- Not default to control spend while maintaining capability

---

## Policy Rules (Locked In)

1. ✅ **NO Haiku** — Removed from all Tier 1 agents
2. ✅ **Sonnet 4.6 as standard** — Consistent default across all four
3. ✅ **Opus 4.6 as escalation only** — Never default, only when explicitly needed
4. ✅ **Simple & consistent** — Reduces cognitive load, enables rapid escalation decision-making

---

## Implementation Status

- ✅ Configuration applied
- ✅ System restarted
- ✅ All agents online
- ✅ Ready for operations

---

**Last updated:** 2026-03-08 08:53 EST  
**Applied by:** Clawson (system config)
