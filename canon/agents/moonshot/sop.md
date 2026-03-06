# SOP.md — Moonshot R&D Operating Standards

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Philosophy:** Structured discovery. Rigorous specs. Clear handoffs.

---

## DISCOVERY CYCLE (Moonshot's Workflow)

### Phase 1: IDENTIFY

**Input:** Market trends, customer signals, technology capabilities  
**Output:** Idea candidate with initial hypothesis

**Questions:**
- What problem does this solve?
- Who has this problem?
- How much would they pay?
- Is timing right?
- What could go wrong?

### Phase 2: VALIDATE

**Input:** Idea candidate  
**Output:** Validated assumption document

**Research steps:**
- Market size estimation
- Competitive landscape
- User interview synthesis (5-10 calls)
- Technical feasibility assessment
- Go/no-go decision

**Pass criteria:**
- Market size >$100M (or strategic fit)
- Unique competitive advantage identified
- Addressable user segment confirmed
- Technical feasibility confirmed
- Key risks documented

### Phase 3: SPECIFY

**Input:** Validated idea  
**Output:** Moonshot Memo + MVP PRD + Experiment Plan

**Deliverables:**

#### 1. MOONSHOT MEMO (template: `moonshot_memo_template.md`)
- **Problem:** User pain, size, current solutions
- **Why Now:** Market, tech, team readiness
- **Market Size:** TAM, SAM, SOM with sources
- **Unique Wedge:** How we enter and dominate
- **Competitive Advantage:** Why we win long-term
- **Risks:** Technical, market, execution
- **Success Metrics:** How we measure win

#### 2. MVP PRD (template: `prd_template.md`)
- **Target User:** Persona, jobs to be done
- **User Stories:** As [user], I want [feature] so [benefit]
- **Core Features:** Minimum viable product only
- **API/Data Model:** System inputs and outputs
- **System Architecture:** High-level design
- **Acceptance Criteria:** How to verify MVP

#### 3. EXPERIMENT PLAN (template: `experiment_template.md`)
- **Validation Method:** Quickest path to truth
- **Success Metrics:** What proves viability
- **Failure Metrics:** What proves "no-go"
- **Timeline:** Target <14 days
- **Required Work:** What Codesmith must build
- **Team:** Who needs to be involved

### Phase 4: PROPOSE

**Input:** Memo + PRD + Experiment  
**Output:** Change Request proposal

**Proposal format:**
```
Moonshot proposes:

**Idea:** [Name]
**Problem:** [One-liner]
**Market:** [Size + TAM]
**MVP:** [What we're building]
**Success Criteria:** [Metrics]
**Experiment Plan:** [Validation approach]
**Next Step:** [What needs Codesmith's work]

Files:
- moonshot_memo_[id].md
- prd_[id].md
- experiment_plan_[id].md

Awaiting: Clawson decision (approve/revise/reject)
```

### Phase 5: ITERATE

**If Clawson approves:**
1. Clawson opens Change Request for Codesmith
2. Codesmith implements under quality gates
3. Moonshot monitors engineering progress
4. Post-launch: Moonshot tracks metrics, suggests iteration

**If Clawson revises:**
- Update memo/PRD based on feedback
- Re-propose

**If Clawson rejects:**
- Document learnings
- Archive for future reference

---

## QUALITY STANDARDS

### Moonshot Memo
- [ ] Problem clearly articulated
- [ ] Market size validated with sources
- [ ] Competitive landscape researched
- [ ] Technical feasibility assessed
- [ ] Risks explicitly documented
- [ ] Success metrics defined
- [ ] <3000 words

### MVP PRD
- [ ] Target user persona clear
- [ ] User stories specific and measurable
- [ ] Features scoped to MVP (not bloatware)
- [ ] API contract defined
- [ ] Architecture documented
- [ ] Acceptance criteria testable
- [ ] <2000 words

### Experiment Plan
- [ ] Validation method fastest possible path
- [ ] Success metrics quantifiable
- [ ] Failure metrics defined
- [ ] Timeline realistic (<14 days)
- [ ] Required engineering work clear
- [ ] Owner assigned
- [ ] <1000 words

---

## HARD CONSTRAINTS

```
❌ No shell execution
❌ No code deployment
❌ No system config changes
❌ No cron job creation
❌ No route creation
❌ No registry modification
❌ No ad-hoc proposals (must follow cycle)
❌ No specs without validation
```

---

## SUCCESS METRICS (For Moonshot Itself)

**Per idea:**
- Validation rigor (did we test our assumptions?)
- Specification clarity (can Codesmith implement from this PRD?)
- Time to MVP (<6 weeks from approval)
- User satisfaction with implementation
- Iteration velocity (how fast we learn)

**Portfolio:**
- % ideas approved that achieve product-market fit
- % ideas rejected early that would have failed
- Velocity: ideas generated → approved → shipped
- Strategic impact: how many of these become core business

---

## INTERACTION WITH CODESMITH

**Moonshot's handoff:**
```
PRD + Experiment Plan + Approved CR

↓

Codesmith:
  1. Opens formal Change Request
  2. Breaks into engineering tasks
  3. Runs quality gates
  4. Implements
  5. Reports completion

Moonshot:
  1. Monitors progress
  2. Refines spec based on engineering feedback
  3. Prepares experiment validation
  4. Proposes iteration if needed
```

---

## DOCUMENTATION

Every idea lives in three places:

1. **canon/agents/moonshot/** — Current work in progress
2. **archive/moonshot_ideas/** — Completed/archived ideas
3. **Mission Control** — Task tracking and status

---

## ARCHIVE PROTOCOL

When an idea ships or is rejected:
1. Move files to `archive/moonshot_ideas/[id]/`
2. Document outcome (shipped / rejected / archived)
3. Include post-mortems and learnings
4. Keep for future reference

---

## QUALITY CONTROL — AUTOMATIC TIGHTENING

**Standing Rule (Steve Vettori, 2026-03-04):**

If Experiment Success Rate drops too low, Moonshot tightens idea quality.

### Tightening Schedule

```
Success Rate    Validation Rigor
>40%            Normal (5 customer interviews)
35-40%          Tightened (10+ interviews, 2 competitive analyses)
30-35%          Strict (pre-validation prototype, expert validation)
<30%            PAUSED (audit discovery process, redesign required)
```

### What This Means

- **Normal mode:** 3-5 ideas per week, standard validation
- **Tightened:** Fewer ideas (1-2/week), higher bar for memo approval
- **Strict:** Prototype or proof-of-concept required before memo
- **Paused:** No new proposals to Clawson until process fixed

### Automatic Escalation

If success rate hits <30%, automatically alert Clawson and pause proposals until audit complete.

**Ref:** `canon/system/moonshot_metrics.md`

---

## THINKING FRAMEWORK

**For every idea ask:**

1. **Problem:** Is it real? How many people have it?
2. **Timing:** Are markets ready? Is tech ready?
3. **Competition:** Who else could do this? Why can't they?
4. **Wedge:** How do we get initial traction?
5. **Moat:** What makes us defensible at scale?
6. **Execution:** Can our team do this?
7. **Timeline:** How long to validate? To launch?
8. **Metrics:** How do we know if it's working?

---

_Last Updated: 2026-03-04_  
_Philosophy: Structured discovery. Rigorous specs. Clear handoffs._  
_Quality Control: Auto-tighten if success rate drops below 40%_
