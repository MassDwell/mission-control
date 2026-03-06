# MOONSHOT PERFORMANCE METRICS

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Purpose:** Track Moonshot agent effectiveness and innovation pipeline health

---

## PRIMARY METRIC: EXPERIMENT SUCCESS RATE

### Definition

```
Experiment Success Rate = (Validated Experiments / Total Experiments) × 100%

Where:
  • Validated Experiments = Ideas that achieved GO status
  • Total Experiments = All ideas that completed Stage 7 (experiment)
```

### Interpretation

**Target:** ≥40% success rate (4 out of 10 ideas become products)

- **>50%:** Excellent innovation filtering (high-quality ideas)
- **40-50%:** Strong pipeline (good validation rigor)
- **30-40%:** Healthy iteration (learning from pivots)
- **<30%:** Refine discovery process (may be too experimental)

### Calculation

**Weekly:**
```
Count experiments completed in past week:
  • GO (idea advances to production) = 1 success
  • ITERATE (back to Stage 2 for refinement) = 0 success (still in pipeline)
  • PIVOT (different direction, respec) = 0 success (still in pipeline)
  • NO-GO (archived) = 0 success

Example:
  Week of 2026-03-04:
  • Experiments completed: 3
  • GO results: 1
  • Success rate: 1/3 = 33%
```

**Cumulative:**
```
All-time (since activation):
  Total experiments completed: X
  Total GO results: Y
  Success rate: Y/X × 100%

Example (after first month):
  Total completed: 8 experiments
  Total GO: 3 ideas
  Cumulative success rate: 3/8 = 37.5%
```

---

## SECONDARY METRICS

### Ideas Generated per Month

**Definition:** New ideas entering Stage 1 (Idea Generation)

**Target:** 8-12 ideas per month

**Interpretation:**
- >12: High innovation velocity (may sacrifice quality)
- 8-12: Healthy pipeline
- <8: Slow discovery (increase research effort)

---

### Proposal Approval Rate

**Definition:** (Approved proposals / Total proposals) × 100%

**Target:** 30-50%

**Interpretation:**
- >50%: Clawson approves most ideas (low bar for approval)
- 30-50%: Selective approval (good quality gating)
- <30%: Strict approval (may be too selective)

---

### Time to MVP

**Definition:** Days from Stage 4 (Approval) to Stage 6 (MVP Ready)

**Target:** <20 days

**Interpretation:**
- <20 days: Fast execution
- 20-30 days: Normal pace
- >30 days: Blocked or complex

---

### Time to Validated Learning

**Definition:** Days from Stage 4 (Approval) to Stage 7 (Results)

**Target:** <45 days

**Interpretation:**
- <45 days: Rapid validation cycles
- 45-60 days: Normal experimentation
- >60 days: Slow learning (may need faster MVP)

---

## TRACKING METHOD

### Data Source

**Mission Control Task Statuses:**
```
Each Moonshot idea has a task card:
  📝 Spec (Stages 1-2)
  🔍 Review (Stage 3)
  ✅ Approved (Stage 4-5)
  🔨 Building (Stage 6)
  ⚗️ Experiment (Stage 7)
  ✅ Results (Stage 7 complete)

Task metadata includes:
  • Created date (idea generated)
  • Approved date (Clawson decision)
  • MVP date (Codesmith delivery)
  • Results date (experiment complete)
  • Status: GO | ITERATE | PIVOT | NO-GO
```

### Calculation Script

**File:** `scripts/analytics/moonshot-metrics.js`

```javascript
// Pseudo-code for metric calculation

function calculateExperimentSuccessRate() {
  // Get all Moonshot tasks from Mission Control
  const tasks = getMissionControlTasks({ label: 'moonshot' });
  
  // Filter completed experiments (in Results column)
  const completedExperiments = tasks.filter(t => 
    t.status === 'Results' && 
    t.experimentResult !== null
  );
  
  // Count GO results
  const successCount = completedExperiments.filter(t =>
    t.experimentResult === 'GO'
  ).length;
  
  const totalCount = completedExperiments.length;
  const successRate = (successCount / totalCount) * 100;
  
  return {
    successRate: successRate.toFixed(1) + '%',
    successCount,
    totalCount,
    period: 'all-time'
  };
}

// Weekly report
function getWeeklyMetrics() {
  const weekStart = getMonday(new Date());
  const tasks = getMissionControlTasks({ 
    label: 'moonshot',
    completedBetween: [weekStart, new Date()]
  });
  
  return {
    completedThisWeek: tasks.length,
    successRate: calculateSuccessRate(tasks),
    avgTimeToMVP: calculateAvgTimeToMVP(tasks),
    avgTimeToValidation: calculateAvgTimeToValidation(tasks)
  };
}
```

---

## QUALITY CONTROL: METRIC-DRIVEN TIGHTENING

### Standing Rule

**If Experiment Success Rate drops below target, Moonshot automatically tightens idea quality.**

```
Success Rate    Action
─────────────   ─────────────────────────────────────────────
>40%            Continue normal discovery (3-5 ideas/week)
35-40%          Tighten validation (require 10+ customer interviews)
30-35%          Significantly increase rigor (pre-validation phase)
<30%            Pause new ideas, audit discovery process
```

### Tightening Mechanisms (When Needed)

**Level 1 Tightening (35-40%):**
- Increase customer interviews from 5 to 10+
- Add competitive analysis requirement
- Require founder/industry expert validation
- Higher bar for "Why Now" credibility

**Level 2 Tightening (30-35%):**
- Pre-validation with actual target users (not just interviews)
- Build clickable prototype before memo
- Require founder commitment if pursuing
- Require market size validation from multiple sources

**Level 3 Tightening (<30%):**
- Pause all proposals to Clawson
- Conduct process audit:
  - Are we picking wrong user segments?
  - Are assumptions not validating?
  - Are experiments poorly designed?
- Redesign discovery cycle
- Resume only after audit complete

### Escalation to Clawson

If success rate hits <30%, automatically alert Clawson:
```
⚠️ MOONSHOT QUALITY ALERT

Experiment Success Rate: [X%] (below critical threshold)

Action taken: New proposals paused
Next step: Discovery process audit required

This is automatic tightening. Process audit needed to resume.
```

---

## DASHBOARD VIEW

### Mission Control - Moonshot Dashboard

**Title:** MOONSHOT INNOVATION METRICS

```
┌─────────────────────────────────────────┐
│   EXPERIMENT SUCCESS RATE               │
│                                         │
│   [Progress bar] 37.5%                  │
│   3 successes / 8 total experiments     │
│                                         │
│   Target: ≥40% ✓ (on track)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   IDEAS GENERATED (This Month)          │
│                                         │
│   9 ideas in pipeline                   │
│   Target: 8-12 ✓ (healthy)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   APPROVAL RATE                         │
│                                         │
│   5 approved / 12 proposed = 42%        │
│   Target: 30-50% ✓ (selective)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   AVG TIME TO MVP                       │
│                                         │
│   18 days (approved → MVP ready)        │
│   Target: <20 days ✓ (fast)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   AVG TIME TO VALIDATED LEARNING        │
│                                         │
│   42 days (approved → results)          │
│   Target: <45 days ✓ (rapid)           │
└─────────────────────────────────────────┘
```

---

## REPORTING CYCLE

### Weekly (Every Monday with Moonshot Briefing)

```
📊 MOONSHOT WEEKLY BRIEFING — [Date]

[Existing briefing content]

═══════════════════════════════════════════
📈 METRICS SUMMARY
═══════════════════════════════════════════

Experiment Success Rate: [X%] (Y successes / Z total)
Ideas Generated (Month): [X]
Approval Rate (Month): [Y%]
Avg Time to MVP: [X days]

Status: [On track / Needs attention]
```

### Monthly (1st of month)

```
📊 MOONSHOT MONTHLY PERFORMANCE REPORT

Success Rate: [X%] (cumulative)
Ideas in Pipeline: [X]
Ideas Approved: [X]
Ideas Building: [X]
Ideas Validating: [X]
Ideas Completed: [X]

Trends: [Improving / Stable / Declining]
Recommendations: [If any]
```

---

## SUCCESS CRITERIA BY STAGE

### Stage 1-2 (Idea Generation & Specification)

- Quality of research
- Validation rigor
- Customer interviews conducted

### Stage 3-4 (Proposal & Decision)

- Proposal clarity
- Clawson approval rate
- Revision feedback incorporation

### Stage 5-6 (CR & Implementation)

- Codesmith quality gates passed
- Time to MVP
- Zero defects in MVP

### Stage 7 (Experiment)

- **Primary metric: Experiment Success Rate**
- Metric collection completeness
- Results reporting accuracy

---

## LONG-TERM TARGETS (Year 1)

```
Experiment Success Rate:    ≥40%
Ideas Generated:            80-120 ideas
Approval Rate:              35-45%
Time to MVP:                <20 days
Time to Validation:         <45 days
Ideas Shipped:              10-15 products
Live Product Success Rate:  ≥60% achieve >$100K ARR
```

---

## NOTES

- **Success Rate is lagging indicator:** Don't optimize for high approval rate at expense of quality
- **Pivot counts as learning:** Not a failure — Pivots are validated learnings that lead to different products
- **NO-GO is efficiency:** Archiving bad ideas quickly = efficient capital allocation
- **Iterate keeps ideas in pipeline:** Don't count toward success until final GO decision

---

_Track Experiment Success Rate as primary measure of Moonshot's innovation effectiveness._
_Weekly briefing updates this metric._
_Monthly trends reported to Clawson._
