# Change Request: CR-LEADSCORE-001

**Title:** LeadScore.ai MVP Implementation  
**Date:** March 5, 2026, 04:55 EST  
**Requested By:** Clawson (Chief of Staff)  
**Assigned To:** Codesmith (Engineering Lead)  
**Priority:** P1 (High — Revenue-generating MVP)  
**Timeline:** 8 weeks (Weeks 1–8, Starting immediately)  
**Status:** APPROVED — Ready for Build  

---

## Executive Summary

This CR authorizes the design, development, and launch of **LeadScore.ai**, an AI-powered lead qualification SaaS product for B2B companies.

**Business Case:**
- TAM: 50,000+ mid-market SaaS companies, addressable market ~$100M–$300M annually
- MRR target: $5K+ by Month 3, $30K+ by Year 1
- Build investment: 8 weeks (1 full-time engineer equivalent)
- Expected ROI: 10x revenue within Year 2

**Deliverables:** MVP with API, dashboard, Salesforce integration, 5+ beta customers

---

## Problem & Opportunity

**Problem:** Sales teams waste 40–60% of their time reviewing low-quality leads, with manual qualification costing companies $10K–$50K annually per company.

**Opportunity:** Build an AI system that automatically qualifies leads in real-time, saving 2–5 hours per week per sales team member, at a price point of $100–1,000/month.

**Market Validation:** Preliminary research indicates 85%+ of surveyed mid-market SaaS companies have lead qualification pain and would consider purchasing ($100–500/month).

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  LeadScore.ai Architecture                │
└─────────────────────────────────────────────────────────┘

┌─────────────┐         ┌──────────────┐      ┌────────┐
│ Integrations├────────→│  API Server  ├─────→│ Worker │
└─────────────┘         └──────────────┘      │(Scoring)
      ↑                       ↓                └────────┘
 Webhook                   Auth                  ↓
 Zapier                  Rate limit          ┌────────┐
 Salesforce              Logging             │ ML Mdl │
 HubSpot                 Request routing     │(T5)    │
                                             └────────┘

┌──────────────────────────────┐
│       Data Persistence         │
├────────┬────────┬────────┬────┤
│PostgreSQL │Redis   │S3 (uploads) │Memory │
└──────────┴────────┴────────┴────┘

┌─────────────────────────────────┐
│      Web Dashboard (React)       │
│  • Lead history                 │
│  • API usage tracking           │
│  • Integration management       │
└─────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Language** | Node.js (API), Python (Worker) | Fast iteration, strong ML libraries |
| **Framework** | Express.js | Lightweight, reliable |
| **Database** | PostgreSQL | Reliable, proven for SaaS |
| **Cache/Queue** | Redis | Job queuing, rate limiting |
| **ML** | Hugging Face (T5/DistilBERT) | Open-source, lightweight |
| **Frontend** | React + Vite | Fast, modern, component-based |
| **Auth** | API Keys + JWT | Simple, secure for MVP |
| **Hosting** | AWS EC2 / Render | Scalable, cost-effective |
| **Monitoring** | CloudWatch + Sentry | Error tracking, performance |

---

## Detailed Feature Specification

### 1. API Endpoints

**POST /api/v1/analyze**
- Single lead submission + analysis
- Input: Lead data (company, email, title, company_size, industry, budget signal)
- Output: Score (0–100), confidence, reasoning, processing time
- Rate limit: 1,000 requests/month (Starter), 5,000 (Growth)
- Latency: < 5 seconds (p95)

**POST /api/v1/bulk**
- Batch submission (CSV, JSON)
- Input: File upload (100–10,000 leads)
- Output: Job ID, processing status
- Async processing (callback via webhook or email)

**GET /api/v1/result/{analysis_id}**
- Check status of submitted lead/batch
- Returns: Score, confidence, reasoning, processed timestamp

**GET /api/v1/status**
- System health endpoint
- Returns: API health, uptime, response time

### 2. Scoring Engine

**Model:** Fine-tuned transformer (T5 or DistilBERT)
- Trained on: SaaS lead data (intent signals, company attributes, deal closures)
- Input: Structured lead fields
- Output: Score (0–100) + confidence (0–100) + reasoning (3–5 bullets)
- Inference time: < 2 seconds (p95)
- Accuracy: >= 85% (measured vs. expert manual scoring)

**Scoring Logic:**
```
score = 0
score += title_fit(title) * 25    // Does title match ICP?
score += company_fit(company) * 25 // Company characteristics
score += intent_signals(data) * 30  // Budget, urgency, fit indicators
score += company_size(size) * 20    // Size in range?
return min(100, max(0, score))      // Clamp 0–100
```

**Reasoning:** For each component, generate human-readable explanation:
- "Title 'Director of Sales' matches ICP (+10pts)"
- "Company size 200–1000 matches target (+8pts)"
- "No budget signal detected (-5pts)"

### 3. Dashboard Features

**Page 1: Overview**
- Total leads analyzed (lifetime)
- Leads analyzed this month
- Average score
- API usage (requests this month)

**Page 2: Lead History**
- Table of recent leads (last 100)
- Columns: Company, Email, Title, Score, Confidence, Status, Date
- Filters: Score range, date range, source
- Actions: View details, export, resend

**Page 3: Integrations**
- Salesforce status (connected/not)
- Slack notification config (enabled/disabled)
- Webhook URL config (for custom integrations)
- API key management

**Page 4: Settings**
- Account name, email, plan
- Notification preferences (Slack alerts threshold)
- Billing (plan, usage, invoices)

### 4. Integrations (Phase 1)

**Salesforce Lead Integration**
- Trigger: Analyze lead via webhook / API
- Action: Create Lead record in Salesforce
- Fields mapped: Name, Email, Company, Score (custom field), Recommendation
- Auth: OAuth 2.0 (user connects their Salesforce org)

**Slack Notifications**
- Trigger: Score >= 75 (configurable)
- Message: Brief summary + link to full result
- Format: "🎯 Hot lead from Acme Corp — Director of Sales — Score: 87"

**Zapier Integration**
- Trigger: Form submission (Typeform, Wufoo, Gravity Forms, etc.)
- Action: Analyze lead via LeadScore API
- Output: Score, recommendation back to Zapier
- Supports: Any form tool + CRM combo

**Email Notifications**
- Daily digest: Top 5 leads from past 24 hours
- Threshold: Configurable (send if score >= 50, e.g.)
- Format: HTML email with lead summary + link

### 5. Database Schema

**accounts**
```
id (UUID, PK)
name (VARCHAR)
api_key (VARCHAR, unique)
plan_type (VARCHAR: 'starter', 'growth', 'enterprise')
status (VARCHAR: 'active', 'paused', 'canceled')
created_at (TIMESTAMP)
salesforce_connected (BOOLEAN)
slack_webhook_url (VARCHAR, nullable)
monthly_leads_limit (INT)
```

**leads**
```
id (UUID, PK)
account_id (UUID, FK → accounts)
company (VARCHAR)
email (VARCHAR)
title (VARCHAR)
full_name (VARCHAR)
company_size (VARCHAR)
industry (VARCHAR)
source (VARCHAR: 'webhook', 'api', 'bulk', 'salesforce')
metadata (JSONB: additional context)
created_at (TIMESTAMP)
```

**analyses**
```
id (UUID, PK)
lead_id (UUID, FK → leads)
score (INT: 0–100)
confidence (INT: 0–100)
tier (INT: 1–4)
reasoning (JSONB: list of explanation bullets)
processing_time_ms (INT)
processed_at (TIMESTAMP)
```

**api_usage**
```
id (UUID, PK)
account_id (UUID, FK → accounts)
leads_analyzed (INT)
api_calls (INT)
date (DATE)
billable (BOOLEAN)
```

---

## Project Structure

```
/ventures/leadscore/
├── README.md                  (overview, quick start)
├── CR-LEADSCORE-001.md        (this CR)
├── docs/
│   ├── venture_memo.md        (business case)
│   ├── prd.md                 (product requirements)
│   └── experiment_plan.md     (validation approach)
├── api/
│   ├── server.js              (Express app)
│   ├── routes/
│   │   ├── analyze.js         (POST /api/v1/analyze)
│   │   ├── bulk.js            (POST /api/v1/bulk)
│   │   └── result.js          (GET /api/v1/result)
│   ├── middleware/
│   │   ├── auth.js            (API key validation)
│   │   └── rateLimit.js       (rate limiting)
│   ├── models/
│   │   ├── Lead.js
│   │   ├── Analysis.js
│   │   └── Account.js
│   └── integrations/
│       ├── salesforce.js
│       ├── slack.js
│       └── zapier.js
├── worker/
│   ├── worker.js              (scoring worker)
│   ├── model.py               (ML inference)
│   └── queue.js               (job queue management)
├── web/
│   ├── index.html             (React entry point)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LeadHistory.jsx
│   │   │   └── Integrations.jsx
│   │   └── components/
│   │       ├── LeadTable.jsx
│   │       └── ScoreCard.jsx
│   └── package.json
├── tests/
│   ├── api.test.js            (API endpoint tests)
│   ├── scoring.test.js        (ML model tests)
│   └── integration.test.js    (end-to-end)
├── .env.example               (environment variables)
├── package.json               (Node dependencies)
└── docker-compose.yml         (local dev environment)
```

---

## Implementation Timeline

| Week | Phase | Owner | Deliverables |
|------|-------|-------|--------------|
| **1–2** | **Backend Build** | Codesmith | API scaffolding, scoring engine, PostgreSQL schema |
| **3–4** | **Integration** | Codesmith + Claude Code | Salesforce connector, Slack bot, Zapier template |
| **5** | **Frontend** | Codesmith / Claude Code | React dashboard, lead history, integrations page |
| **6** | **Testing & QA** | Codesmith | Unit tests, integration tests, performance tuning |
| **7** | **Closed Beta** | Clawson | 5 beta customers, feedback collection |
| **8** | **Public Launch** | Clawson | Landing page, pricing page, signup flow |

---

## Success Criteria

**Phase 1 (Week 4):**
- ✅ API fully functional (POST /analyze, POST /bulk, GET /result)
- ✅ Scoring accuracy >= 85%
- ✅ 100+ leads analyzed
- ✅ NPS >= 30 (beta feedback)

**Phase 2 (Week 6):**
- ✅ Salesforce integration working
- ✅ Slack notifications working
- ✅ Dashboard showing lead history
- ✅ 2+ customers committed to paid plan

**Phase 3 (Week 8):**
- ✅ Public landing page live
- ✅ 10+ paid customers signed up
- ✅ MRR >= $1,000
- ✅ Churn = 0% (no cancellations)

---

## Budget & Resource Allocation

| Resource | Allocation | Timeline |
|----------|-----------|----------|
| **Codesmith (Engineering)** | 1.0 FTE | Weeks 1–8 (full-time) |
| **Claude Code (MVP scaffolding)** | 0.5 FTE (part-time) | Weeks 2–5 (code generation) |
| **Clawson (Product + Ops)** | 0.3 FTE | Weeks 1–8 (oversight, beta management) |
| **Compute (AWS)** | ~$500–1,000 | Weeks 1–8 (dev + beta infra) |
| **Third-party APIs** | $0 | (Slack, Salesforce free tiers) |
| **Total investment** | ~$15K–20K | In-house time + infra |

---

## Dependencies & Constraints

### External Dependencies
- Salesforce API (for CRM integration)
- Slack API (for notifications)
- Hugging Face Model Hub (for pre-trained models)
- AWS / Render (hosting)

### Internal Dependencies
- Codesmith availability (full-time, Weeks 1–8)
- Claude Code access (for code generation)
- Beta customer availability (for feedback)

### Constraints
- ❌ No system architecture modifications (isolated to /ventures/leadscore)
- ❌ No changes to canon configurations
- ❌ No impact on core OpenClaw infrastructure
- ✅ Stay within /ventures/leadscore directory structure

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Scoring accuracy < 85%** | MVP may not deliver value | Retrain model, add human review layer |
| **Slow adoption (< 50% in week 1)** | Low usage, early signals of product-market fit issues | 1:1 onboarding calls, simplify UX |
| **Pricing too high** | Customers unwilling to pay | Lower to $49–99/month or usage-based |
| **Engineering delays** | Timeline extends past Week 8 | Pre-build components with Claude Code |

---

## Approval & Sign-Off

**Clawson (Chief of Staff):** ✅ APPROVED  
**Status:** Ready for Codesmith assignment  
**Next Action:** Codesmith begins architecture review and project setup  

---

## Document History

| Date | Version | Author | Status |
|------|---------|--------|--------|
| 2026-03-05 | 1.0 | Clawson | APPROVED |

---

**Change Request ID:** CR-LEADSCORE-001  
**Status:** APPROVED — READY FOR EXECUTION  
**Assigned To:** Codesmith  
**Due Date:** Week 8 (2026-04-30)  
