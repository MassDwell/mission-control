# LeadScore.ai — Venture Memo

**Date:** March 5, 2026  
**Stage:** Specification → Implementation  
**Owner:** Codesmith  
**Target MRR:** $15K–$30K (Year 1)  

---

## Executive Summary

**LeadScore.ai** is an AI-powered lead qualification system that automatically analyzes inbound leads (web forms, emails, CRM records) and produces a qualification score, executive summary, and recommended next action for sales teams.

**Problem:** Sales teams waste 40–60% of time reviewing low-quality leads. Lead qualification is manual, slow, and inconsistent—costing companies thousands in wasted sales cycles.

**Solution:** LeadScore ingests raw lead data, runs it through a trained AI classifier, and returns structured qualification output (score 0–100, summary, recommended routing) in <5 seconds.

**Market Opportunity:** Mid-market and enterprise SaaS companies (1,000–10,000 employees) spend $100K–$500K annually on unproductive sales work. Saving 20% of sales time = $20K–$100K per company per year. Addressable market: ~50,000 companies in North America alone.

**Competitive Advantage:**
- **Speed:** Real-time scoring vs. manual review (minutes vs. seconds)
- **Accuracy:** AI trained on domain-specific data (vs. generic scoring rules)
- **Integration:** Works with existing CRM/form tools (Salesforce, HubSpot, Typeform, custom webhooks)
- **Transparency:** Explainable scoring (shows reasoning, not black box)

**MVP Go-to-Market:** Position as SaaS product with usage-based pricing ($0.01–$0.05 per lead analyzed). Launch with Salesforce + HubSpot integrations. Target 5–10 beta customers in Q2 2026.

**Success Metrics:**
- 100+ leads analyzed in first month (beta)
- 85%+ user satisfaction (lead score accuracy)
- 3–5 paying customers by Month 3
- $5K+ MRR by end of Year 1

---

## Problem Statement

### Current State

Sales teams manually review inbound leads using a combination of:
- Email screening (read subject, preview body)
- Form field review (company, title, budget)
- CRM notes (past interactions)
- Sales judgment (inconsistent)

**Pain points:**
1. **Time waste:** 30–45 minutes per 100 leads (manual review)
2. **Inconsistent scoring:** Different reps use different criteria
3. **Missed opportunities:** Low-priority leads sometimes have hidden budget
4. **Bottleneck:** Lead routing delayed while waiting for manual qualification
5. **No data:** Marketing doesn't know which lead sources are high-quality

### Why This Matters

A 500-person SaaS company with 100 sales reps and 2,000 inbound leads per month:
- Current state: 1–2 people spend 15–20 hours/month qualifying (cost: $600–$1,000)
- Unqualified leads routed to sales: Wasted sales time (50+ hours/month = $5,000–$10,000)
- **Total cost of poor qualification:** $5,600–$11,000/month per company

**LeadScore ROI:** $50–150 per month subscription + $50–150 per month in recovered sales productivity = **15–20x payback within first month**.

---

## Ideal Customer Profile (ICP)

### Primary Target

**Company Profile:**
- Industry: B2B SaaS (any vertical, but starting with sales software)
- Employees: 100–10,000
- ARR: $5M–$500M
- Annual inbound leads: 1,000+

**Economic Buyer:** VP Sales, Director of Sales Operations
**Technical Buyer:** CRM Admin, Marketing Operations Manager
**User:** Sales Development Reps, Account Executives

### Secondary Targets
- Professional Services (consulting, agencies)
- Real Estate Tech (high volume of inbound)
- MarTech/SaaS platforms

### Not a fit
- Enterprise (>10K employees) — custom procurement, long sales cycle
- SMB (<100 employees) — low volume, limited budget
- Transactional businesses (retail, QSR) — different lead quality problem

---

## Competitive Landscape

### Direct Competitors

**1. HubSpot Lead Scoring (Built-in)**
- Pros: Already in platform, no extra cost
- Cons: Rules-based only, requires manual setup, no AI/ML
- Threat Level: LOW (inferior to AI scoring)

**2. Clearbit (Lead Enrichment)**
- Pros: Company data enrichment, integration-friendly
- Cons: Only enriches data, doesn't score. Expensive ($500+/month for API)
- Threat Level: LOW (complementary, not competitive)

**3. Rasa.io / Humanly (AI Lead Scoring)**
- Pros: AI-powered, Salesforce-native
- Cons: Expensive ($10K+/year), slow implementation (90+ days), enterprise only
- Threat Level: MEDIUM (direct competitor, but market is growing)

### Indirect Competitors
- Custom Salesforce solutions (Apex code + Flow)
- In-house data science teams (enterprise only)
- Manual processes (status quo)

### Competitive Moat

LeadScore wins on:
1. **Speed to value:** 1-week setup vs. 90 days (Humanly)
2. **Pricing:** $50–300/month (usage-based) vs. $10K+/year (Humanly)
3. **Ease of integration:** No Salesforce admin skills required
4. **Transparency:** Scores are explainable (why is this lead a 75?)
5. **Multi-platform:** Works with HubSpot, Salesforce, Pipedrive, custom APIs

---

## MVP Feature Scope

### Core Features (v1.0)

**1. Lead Ingestion**
- Webhook receiver for form submissions (Typeform, Zapier, custom)
- CSV bulk upload (100–1,000 leads at a time)
- API endpoint for programmatic submission
- Salesforce Lead → Analysis flow

**2. Scoring Engine**
- AI classifier (fine-tuned transformer model)
- Outputs: Score (0–100), Confidence (%), Reasoning (3–5 bullet points)
- Input fields: Company, Title, Email, Company Size, Industry, Budget Indicator
- Scoring model weights: Size (20%), Title (25%), Intent signals (30%), Company fit (25%)

**3. Output & Routing**
- JSON API response (score, summary, recommended action)
- Slack/Email webhook for alerts (high-quality leads)
- CSV export of scored leads
- Salesforce task/record creation (for high-score leads)

**4. Dashboard** (minimal v1)
- Activity feed (leads analyzed, top sources)
- Accuracy metrics (user feedback on scores)
- Usage statistics (leads/month, API calls)

### Out of Scope (v1)

- **Advanced ML:** No active learning or model retraining (planned v2)
- **CRM write-back:** No direct Salesforce update (v2)
- **Advanced enrichment:** No company data lookup (partner with Clearbit later)
- **Custom models:** No per-customer fine-tuning (v2)
- **Mobile app:** Web dashboard only

---

## Revenue Model

### Pricing (Usage-Based SaaS)

**Pricing Tiers:**

| Plan | Price | Leads/month | Setup | Support |
|------|-------|-------------|-------|---------|
| Starter | $99/mo | 500 | Email | Community |
| Growth | $299/mo | 2,000 | Zapier + API | Priority email |
| Enterprise | $1,000+/mo | Unlimited | Custom integration | Phone + Slack |

**Per-overage:** $0.05 per lead (beyond tier limit)

### Unit Economics

**Assumptions (Year 1):**
- 10 paying customers average
- Mix: 3× Starter, 4× Growth, 3× Enterprise
- ARR: $100 (Starter) + $1,200 (Growth) + $3,000 (Enterprise) = $4,300/month
- Hosting/inference cost: ~$0.008 per lead analyzed
- Customer acquisition cost: $5,000 (sales/marketing)
- Payback period: 2 months

**Path to $30K MRR:**
- Year 1: $5K MRR (10 customers)
- Year 2: $15K MRR (40 customers, improved retention)
- Year 3: $30K MRR (100 customers, enterprise focus)

---

## Timeline to MVP

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Specification** | Week 1 (Done) | PRD, architecture, experiment plan |
| **Build v1** | Weeks 2–4 | Scoring engine, API, basic dashboard |
| **Integration testing** | Weeks 5–6 | Salesforce + HubSpot integration |
| **Beta launch** | Week 7 | 5 beta customers, real-world testing |
| **v1.0 release** | Week 8 | Public launch, pricing page, support |

---

## Success Criteria

**MVP is successful if:**
- ✅ 5+ beta customers sign up and actively use the product
- ✅ Scoring accuracy >= 85% (user feedback, validation against manual scoring)
- ✅ Lead analysis time < 5 seconds (API latency)
- ✅ $5K+ MRR by end of Month 3 (subscription revenue)
- ✅ NPS >= 50 (user satisfaction)
- ✅ Churn < 10% per month (retention)

---

## Next Steps

1. **Clawson** → Generate Change Request (CR-LEADSCORE-001)
2. **Codesmith** → Architecture review, project setup, Claude Code build
3. **Claude Code** → MVP implementation (API, scoring, integrations)
4. **Experiment** → Launch with 5 beta customers, collect feedback
5. **Scale** → Based on validation, expand to broader market

---

**Memo Owner:** Clawson  
**Created:** 2026-03-05 04:55 EST  
**Status:** Ready for CR generation  
