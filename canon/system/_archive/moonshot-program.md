# Moonshot Discovery Program

**Version:** 3.0 (Self-Improving Edition)  
**Pattern:** Karpathy autoresearch — program.md as living instructions  
**Last Amended:** 2026-03-14  
**Status:** ✅ PRODUCTION  

---

## HOW THIS WORKS

This file is not static documentation. It is the **active program** that governs how Moonshot finds venture ideas. It improves over time based on what actually works.

**The loop:**
1. Moonshot runs a discovery cycle using the instructions below
2. Ideas are evaluated by Steve (approved / rejected / ignored)
3. That feedback is recorded in the **Signal Log** at the bottom
4. Signal Log is used to amend the instructions before the next cycle
5. Repeat — each cycle produces better ideas than the last

**Metric:** Steve says "build it" → strong signal. "Interesting but no" → weak signal. No response → noise.

**Amendment rule:** After 3+ cycles, review the Signal Log. Tighten domains that produce noise, expand domains that produce signal. Amend instructions. Increment version.

---

## DISCOVERY INSTRUCTIONS

### Step 1: Scan Market Evidence

Before proposing anything, scan these sources for genuine pain signals:

**Sources (required — at least 3 per cycle):**
- Reddit: r/SaaS, r/businessautomation, r/founders, r/nocode, r/entrepreneur, industry-specific subs
- Indie Hackers: discussions, launches, revenue reports, failure post-mortems
- X/Twitter: founder complaints, "I wish someone built...", tool comparisons
- Hacker News: "Ask HN: What problems do you have?", Show HN launches, comments on competitor posts
- G2 / Capterra: 1-3 star reviews of existing tools (what's broken)
- ProductHunt: recent launches, comments, upvote patterns

**Valid pain signals:**
- "This is still manual and I hate it"
- "I wish something automated this"
- "Current tools are broken/expensive/complicated"
- "We built a workaround because nothing exists"
- "I pay $X for Y but it barely works"

**Reject if:** No external evidence. Internal brainstorming alone = disqualified.

---

### Step 2: Score Each Opportunity

Score every candidate on 5 axes (1-5 each, max 25):

| Axis | Question |
|------|----------|
| Pain frequency | How often does this problem occur? (Daily=5, Weekly=4, Monthly=2, Rarely=1) |
| Willingness to pay | Do people already spend on this category? (Clear precedent=5, Unclear=2) |
| Build speed | How fast can MVP ship? (1-2 weeks=5, 3-4 weeks=3, 5-6 weeks=2) |
| Steve's advantage | Domain knowledge, network, or system edge? (Strong=5, None=1) |
| Market size | Addressable customers × LTV potential (Large=5, Niche=2) |

**Threshold:** Score ≥ 15 to pass to kill filter. Below 15 = auto-reject.

---

### Step 3: Kill Filter

Reject immediately if ANY are true:

```
❌ No identified paying customer
❌ Problem occurs < weekly
❌ < 1,000 addressable customers
❌ Requires manual human involvement per customer
❌ 5+ competitors with network effects dominating
❌ Revenue unlikely to exceed $10K MRR
❌ Regulatory/legal barriers to scaling
❌ Requires hardware
❌ Revenue model is ads, marketplace, or viral-dependent
```

---

### Step 4: Propose Top 3

Format each proposal:

**[Idea Name]**
- **Problem:** What pain, how often, who has it
- **Evidence:** 2-3 specific source quotes/links
- **Customer:** Exact buyer (title, company size, industry)
- **Kill Filter:** PASS ✅ or FAIL ❌ [reason]
- **Score:** X/25 — breakdown by axis
- **MVP:** 3-5 core features, tech stack, build time estimate
- **Revenue:** Pricing model, 3 MRR scenarios (100/500/1000 customers)
- **Steve's Edge:** Why us vs. anyone else

---

## ACTIVE DOMAINS

These are the current discovery areas, ranked by signal yield. **Higher rank = more time spent here.**

> 📊 Rankings updated based on Signal Log. See amendment history below.

### Rank 1: AI Automation for Specific Professions ⭐⭐⭐⭐⭐
Real estate, law, accounting, recruiting, property management, consultants.  
**Why ranked #1:** Steve has domain knowledge + network in real estate/construction. Direct unfair advantage.  
**Focus:** Workflows still done manually that professionals complain about daily.

### Rank 2: AI Business Operations Automation ⭐⭐⭐⭐⭐
Email triage, CRM automation, reporting, meeting summaries, data enrichment.  
**Why ranked #2:** Clear ROI, willing payers, fast builds. Proven pattern.  
**Focus:** "We still do this in spreadsheets" complaints.

### Rank 3: AI Tooling & Infrastructure ⭐⭐⭐⭐
Agent monitoring, prompt management, observability, workflow orchestration.  
**Why ranked #3:** Growing TAM as AI proliferates, but more technical buyers.  
**Focus:** What breaks when agents go to production.

### Rank 4: Founder & Builder Infrastructure ⭐⭐⭐
Venture studio tools, experiment tracking, deployment dashboards.  
**Why ranked #4:** Small TAM but high LTV. Steve has personal insight here.  
**Focus:** What founders wish existed after using current tools for 6+ months.

### Rank 5: AI Learning & Adoption ⭐⭐
Onboarding platforms, prompt libraries, workflow builders for non-technical users.  
**Why ranked #5:** Crowded fast. Hard to differentiate. Monitor but don't prioritize.  
**Focus:** Only pursue if there's a clear vertical niche nobody has claimed.

---

## VENTURE PIPELINE

```
Moonshot (Propose 3 ideas — score ≥ 15, pass kill filter)
    ↓
Clawson (Approve / Reject / Hold — with reason)
    ↓ (Approved)
Signal Log updated (outcome recorded, framework amended if needed)
    ↓
Codesmith (Architecture)
    ↓
Claude Code (Build MVP in /ventures)
    ↓
7-day validation
    ↓
Mission Control (Track → Go/Pivot/No-Go)
    ↓
Signal Log updated (MRR outcome recorded)
```

---

## SUCCESS METRICS

Framework version is succeeding when:
- ✅ ≥ 60% of proposals score ≥ 15/25
- ✅ ≥ 50% of proposals pass kill filter
- ✅ ≥ 1 "build it" approval per 2 cycles
- ✅ ≥ 50% of built MVPs reach $10K MRR within 6 months
- ✅ Domain rankings reflect actual signal yield (not assumptions)

---

---

# 📊 SIGNAL LOG

> This section is the memory of the framework. Every proposal outcome is recorded here. Used to amend instructions before each new cycle.

---

## Cycle History

| # | Date | Ideas Proposed | Approved | Rejected | Avg Score | Notes |
|---|------|---------------|----------|----------|-----------|-------|
| — | — | — | — | — | — | No cycles run yet |

---

## Idea Outcomes

| Idea | Date | Score | Decision | Reason | MRR (if built) |
|------|------|-------|----------|--------|----------------|
| — | — | — | — | — | — |

---

## Domain Signal Yield

> Updated after each cycle. Tracks which domains produce approved ideas vs. noise.

| Domain | Cycles Scanned | Ideas Generated | Approved | Signal Yield |
|--------|---------------|-----------------|----------|--------------|
| AI Professions | 0 | 0 | 0 | — |
| Business Ops | 0 | 0 | 0 | — |
| AI Tooling | 0 | 0 | 0 | — |
| Founder Infra | 0 | 0 | 0 | — |
| AI Learning | 0 | 0 | 0 | — |

---

## Amendment History

| Version | Date | What Changed | Why |
|---------|------|-------------|-----|
| v2.0 | 2026-03-04 | Initial framework — evidence-driven, 5 domains, kill filter | Replaced brainstorm-only approach |
| v3.0 | 2026-03-14 | Restructured as self-improving program (Karpathy pattern). Added scoring, Signal Log, domain rankings, amendment history. | Close the feedback loop — ideas improve based on what Steve actually approves |

---

## Pending Amendments

> Issues to address in next version, based on observed patterns.

_None yet — first cycle hasn't run._

---

**Rule:** After every 2 cycles, Moonshot must review this Signal Log and propose specific amendments to the instructions. Clawson approves amendments before they go live. Version increments on approval.

**This file is the program. The program improves. The ideas get better.**
