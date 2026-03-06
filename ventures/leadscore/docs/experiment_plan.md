# LeadScore.ai — Experiment Plan

**Version:** 1.0  
**Date:** March 5, 2026  
**Owner:** Codesmith  
**Timeline:** 8–12 weeks  
**Goal:** Validate product-market fit and launch to early-paying customers  

---

## Hypothesis

> **Hypothesis:** Sales teams at B2B SaaS companies (100–10K employees) will pay $100–1,000/month for an AI system that automatically qualifies leads and saves them 20–30% of lead review time.

### Sub-hypotheses
1. **Product-market fit:** Customers will keep using LeadScore after 30 days (retention > 90%)
2. **Accuracy:** AI-generated scores will match expert manual scores >= 85% of the time
3. **Value:** Users will report that scores save them 2–5 hours per week (ROI > 10x cost)
4. **Growth:** We can acquire customers at <$5K CAC from initial cohort
5. **Viability:** 5+ customers will commit to subscription within 8 weeks (MVP success threshold)

---

## Experiment Design

### Phase 1: Closed Beta (Weeks 1–4)

**Goal:** Build MVP, test core hypothesis, gather qualitative feedback

**Participants:** 5 beta customers (hand-picked, sympathetic to lead scoring problem)

**Selection Criteria:**
- Currently have manual lead qualification process
- >100 inbound leads/month
- Willing to use new tool for 30 days
- Can provide honest feedback (NPS survey, 1:1 calls)

**Beta Offer:**
- Free (no charge for MVP phase)
- In exchange: Weekly feedback calls, completion of feedback surveys, permission to interview reps

**Success Criteria (Phase 1):**
- ✅ 5 beta customers signed up
- ✅ 100+ leads analyzed in first week
- ✅ NPS >= 30 (acceptable for MVP)
- ✅ 0 critical bugs in production
- ✅ API latency < 5 seconds (p95)
- ✅ Scoring accuracy >= 85% (measured via feedback)

---

### Phase 2: Pricing Validation (Weeks 5–6)

**Goal:** Test willingness to pay, confirm pricing model

**Approach:**
- Offer paid tier to beta customers: "Growth plan at $299/month"
- Show pricing to 10 additional prospects (sales conversation)
- Track: Conversion rate, objections, acceptable price range

**Success Criteria (Phase 2):**
- ✅ 2+ beta customers commit to paid plan (Year 1, prepay or CC on file)
- ✅ Pricing conversation objection rate < 20% ("too expensive")
- ✅ Market feedback: Acceptable price range $100–500/month

---

### Phase 3: Expansion & Learning (Weeks 7–8)

**Goal:** Expand from 5 to 10+ paid customers, prepare for public launch

**Approach:**
- Public landing page + pricing + signup
- Email outreach to 50 warm prospects (from networks)
- 1:1 sales calls with interested companies
- Collect feedback on product, pricing, integrations

**Success Criteria (Phase 3):**
- ✅ 10+ paid customers (mix of Starter + Growth plans)
- ✅ MRR >= $1,000 (20–30 active users across 10 accounts)
- ✅ Weekly engagement >= 50% (customers return to dashboard)
- ✅ Churn rate = 0% (no cancellations)

---

## Validation Metrics

### Primary Metrics (Must-Have)

**1. Lead Analysis Volume**
- Target: 100+ leads analyzed in first month
- Measurement: API logs, dashboard tracking
- Success threshold: >= 100 leads/month

**2. Scoring Accuracy**
- Definition: % of AI scores that match expert manual score (within 1 tier)
- Target: >= 85%
- Measurement: User feedback survey + expert panel review
- Method: "Does this score match your manual assessment?"
- Success threshold: >= 85% match

**3. User Satisfaction (NPS)**
- Definition: "How likely are you to recommend LeadScore to a colleague?"
- Target: >= 30 (acceptable for MVP), >= 50 (good)
- Measurement: In-app survey after 14 days
- Success threshold: >= 30 (MVP acceptable)

**4. Feature Adoption**
- Definition: % of users who use scoring >= 1 lead in first 7 days
- Target: >= 80%
- Measurement: Dashboard analytics
- Success threshold: >= 75%

**5. Retention**
- Definition: % of customers active after 30 days
- Target: >= 90%
- Measurement: API activity log, last_login field
- Success threshold: >= 85%

---

### Secondary Metrics (Nice-to-Have)

**Time Savings**
- Definition: Avg hours/week saved per user
- Target: 2–5 hours/week
- Measurement: User survey ("How much time do you save per week?")
- Success threshold: >= 2 hours/week

**Conversion Impact**
- Definition: Change in deal win rate after using LeadScore
- Target: +10–20%
- Measurement: CRM data export (before/after comparison)
- Limitations: Small sample size, hard to attribute
- Success threshold: >= 5% improvement (anecdotal)

**Integration Usage**
- Definition: % of customers using Salesforce/Slack integration
- Target: >= 50%
- Measurement: API integration logs
- Success threshold: >= 30%

**CAC & LTV**
- CAC: Customer acquisition cost
- Target: < $5,000 (for paid customers)
- LTV: Lifetime value
- Target: > $50,000 (assuming 3-year customer lifetime)
- Measurement: Revenue - acquisition spend / # customers

---

## User Research Plan

### Qualitative Research

**1. Weekly Beta Calls (Weeks 1–4)**
- Participants: All 5 beta customers
- Duration: 30 min per call
- Topics: Feature feedback, usability issues, value delivered
- Output: Transcripts, key themes

**2. In-Depth Interviews (Weeks 4–5)**
- Participants: 5 paid customers + 5 prospects
- Duration: 45 min per call
- Topics: Problem severity, willingness to pay, alternatives considered
- Output: Customer stories, pricing insights

**3. Expert Validation (Week 6)**
- Participants: 3 independent sales leaders (advisor network)
- Task: Review 50 AI-generated scores vs. their manual scoring
- Output: Accuracy benchmark, feedback on scoring logic

---

### Quantitative Research

**In-App Surveys**
```
1. "How would you rate the accuracy of LeadScore?" (1–5 scale)
2. "How much time do you save per week?" (hours)
3. "How likely are you to recommend?" (0–10 NPS)
4. "What feature would you add next?" (open-ended)
```

**Dashboard Metrics**
- Leads analyzed per user per day
- Time between signup and first analysis
- Dashboard visits per week
- Feature usage (Slack, Salesforce, CSV export, etc.)

**Sales Data**
- Signups per week
- Conversion rate (prospect → paid)
- Average plan (Starter vs. Growth)
- MRR growth trajectory

---

## Experiment Instrumentation

### Tracking & Logging

**API Logging:**
```json
{
  "timestamp": "...",
  "account_id": "...",
  "lead_count": 5,
  "total_leads": 1250,
  "processing_time_ms": 2341,
  "success": true,
  "score_avg": 67.3
}
```

**User Feedback Survey:**
```json
{
  "account_id": "...",
  "question": "accuracy",
  "response": 4,
  "timestamp": "..."
}
```

**Dashboard Analytics:**
- Page views, time on page, button clicks
- User session tracking (Google Analytics)
- Feature usage (which buttons clicked, which integrations used)

**Retention Tracking:**
```json
{
  "account_id": "...",
  "status": "active",
  "last_api_call": "2026-03-05T04:55:00Z",
  "days_since_signup": 7,
  "leads_analyzed": 125,
  "churn_date": null
}
```

---

## Success Thresholds & Decision Gates

### Phase 1 Success Gates (Weeks 1–4)
**All must be true:**
- ✅ 5 beta customers active
- ✅ 100+ leads analyzed
- ✅ Scoring accuracy >= 85%
- ✅ NPS >= 30
- ✅ 0 critical bugs

**If Phase 1 fails:**
→ Cancel experiment, document learnings, pivot to alternative approach

---

### Phase 2 Success Gates (Weeks 5–6)
**All must be true:**
- ✅ 2+ customers pay for Growth plan ($299/month)
- ✅ Pricing feedback: acceptable range confirmed
- ✅ NPS >= 30 (maintained from Phase 1)

**If Phase 2 fails:**
→ Lower pricing to Starter plan only ($99/month), continue to Phase 3

---

### Phase 3 Success Gates (Weeks 7–8)
**All must be true:**
- ✅ 10+ paid customers
- ✅ MRR >= $1,000
- ✅ Churn = 0% (no cancellations)
- ✅ Retention >= 85%

**If Phase 3 fails:**
→ Scale back to SMB/vertical-specific GTM, revisit pricing

---

## Failure Modes & Recovery Plans

### Scenario 1: Low Accuracy (< 85%)
**Problem:** AI scores don't match manual scoring  
**Root causes:** Poor training data, oversimplified model, ICP too broad  
**Recovery:** 
- Option A: Retrain model with domain-specific data
- Option B: Narrow ICP to SaaS only (vs. all industries)
- Option C: Add human-in-the-loop review for low-confidence scores

---

### Scenario 2: Low Adoption (< 50% in week 1)
**Problem:** Users don't know how to use product, unclear value  
**Root causes:** Onboarding weak, feature unclear, integration friction  
**Recovery:** 
- Option A: Add 1:1 onboarding calls (vs. self-serve)
- Option B: Simplify dashboard, highlight key metric
- Option C: Pre-integrate with Zapier (remove config step)

---

### Scenario 3: Pricing Too High
**Problem:** Prospects balk at $100+/month, prefer manual  
**Root causes:** Value not clear, ROI not quantified, budget constraints  
**Recovery:**
- Option A: Lower pricing to $49–99/month
- Option B: Offer free tier (up to 50 leads/month)
- Option C: Switch to usage-based pricing ($0.01–0.05 per lead)

---

### Scenario 4: Poor Retention (< 75% after 30 days)
**Problem:** Customers don't stay engaged  
**Root causes:** One-time use, not integrated into workflow, unclear ROI  
**Recovery:**
- Option A: Add email nurture sequence, weekly digest
- Option B: Deeper CRM integration (auto-update records)
- Option C: Add gamification (show time saved, leads qualified)

---

## Timeline & Milestones

| Week | Phase | Milestone | Owner | Success Criteria |
|------|-------|-----------|-------|------------------|
| 1–2 | MVP Build | Core API + scoring engine | Codesmith | API live, 100 leads analyzed |
| 3–4 | Closed Beta | 5 beta customers, Salesforce integration | Clawson | NPS >= 30, accuracy >= 85% |
| 5–6 | Pricing Test | 2+ paid customers at $299/month | Clawson | Pricing feedback confirmed |
| 7–8 | Expansion | 10+ paid customers, $1K+ MRR | Clawson + Codesmith | MRR >= $1K, churn = 0% |

---

## Reporting & Learning

**Reporting Schedule:**
- Weekly: API usage, lead volume, NPS pulse
- Bi-weekly: Customer interviews, feature feedback
- Monthly: Summary report, go/no-go decision

**Decision Gates:**
- End of Phase 1 (Week 4): Go/pivot/kill decision
- End of Phase 2 (Week 6): Pricing confirmation or adjustment
- End of Phase 3 (Week 8): Launch decision, plan for scaling

**Output:**
- Customer stories (for marketing/sales)
- Product feedback log (for roadmap)
- Pricing strategy finalized
- Go-to-market playbook (what works, what doesn't)

---

**Experiment Plan Owner:** Clawson  
**Status:** Ready for execution  
**Next:** Phase 1 begins with MVP build (Week 1)  
