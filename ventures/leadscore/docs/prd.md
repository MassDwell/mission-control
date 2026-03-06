# LeadScore.ai — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** March 5, 2026  
**Owner:** Codesmith  
**Status:** Specification (Ready for Build)  

---

## Product Overview

**LeadScore.ai** is a SaaS platform that automatically qualifies inbound sales leads using AI. It accepts lead data from any source (web forms, CRM, email, API) and returns a qualification score (0–100), executive summary, and recommended routing in real-time.

**Core Value Proposition:**
> "Know which leads to call first. Automatically."

**Target User:** Sales Development Reps, VP Sales, Sales Ops teams at B2B SaaS companies (100–10K employees).

**Success Metric:** Reduce time spent on lead review by 50%; improve conversion rate by 15–20%.

---

## Problem Statement

### The Problem
Sales teams spend 40–60% of their time reviewing low-quality inbound leads. Lead qualification is:
- **Manual:** Each rep applies their own judgment → inconsistent scoring
- **Slow:** Takes 5–15 minutes per lead to qualify 100 leads/month
- **Unmeasurable:** No data on which lead sources are high-quality
- **Costly:** $10K–$50K per company per year in wasted sales cycles

### Root Cause
Current solutions are either:
1. **Rules-based (HubSpot, Salesforce)** → Manual setup, static rules, no learning
2. **Manual (spreadsheets, email)** → Inconsistent, slow, unscalable
3. **Enterprise AI (Humanly, etc.)** → Expensive, slow to implement, overkill for mid-market

### Why Now?
- LLMs/transformers now enable cheap, fast AI scoring
- Mid-market SaaS is exploding (50K+ addressable companies)
- Integration APIs (Zapier, Salesforce, HubSpot) are mature
- Customers are now willing to adopt AI tools for sales

---

## Ideal Customer Profile

### Primary Segment
**Company:** B2B SaaS, 100–10K employees, $5M–$500M ARR  
**Needs:** >1,000 inbound leads/month, sales-driven growth, manual scoring pain  
**Budget:** $100–1,000/month for lead ops tools  
**Decision maker:** VP Sales, Sales Ops Manager  
**Use case:** Real-time qualification of web form submissions, sales development support

### Secondary Segments
- **Professional Services** (consulting, agencies) — high volume, variable quality
- **Real Estate Tech** — inbound lead qualification at scale
- **Martech/SaaS platforms** — need to qualify their own leads

### Not a Fit
- **Enterprise (>10K employees):** Long sales cycles, custom procurement, prefer in-house solutions
- **SMB (<100 employees):** Too small to justify SaaS spend, low lead volume
- **Transactional (retail, QSR):** Different problem (conversion, not qualification)

---

## Success Criteria

### User Satisfaction
- **Net Promoter Score (NPS):** >= 50 (favorable)
- **Feature adoption:** >= 80% of users try scoring within first week
- **Retention:** < 10% monthly churn

### Business Metrics
- **Users qualified:** >= 100 leads analyzed in first month
- **Scoring accuracy:** >= 85% (measured via user feedback on score quality)
- **API performance:** < 5 seconds response time (p95)
- **Uptime:** >= 99.5% availability
- **MRR:** $5K+ by end of Month 3

### Product Quality
- **Bugs:** < 1 critical bug per sprint
- **Latency:** Average 2–3 seconds (p50), < 10 seconds (p99)
- **Accuracy:** >= 85% (compared to manual expert scoring)

---

## MVP Feature Scope

### Feature Set (v1.0)

#### 1. Lead Ingestion & Data Collection

**Webhook Receiver**
- Accept POST requests from Zapier, Typeform, custom forms
- Validate incoming data (required fields: company, email, title)
- Queue for processing
- Return confirmation (200 OK with analysis ID)

**CSV Bulk Upload**
- File uploader on dashboard
- Support 100–10,000 leads per file
- Async processing (queue + email notification on completion)
- Export results as CSV

**API Endpoint** (for developers)
- `POST /api/v1/analyze` — Submit single lead
- `POST /api/v1/bulk` — Submit batch (CSV or JSON)
- `GET /api/v1/result/{analysis_id}` — Check status
- Authentication via API key

**Supported Input Fields:**
```json
{
  "company": "string (required)",
  "email": "string (required)",
  "full_name": "string (required)",
  "title": "string (recommended)",
  "company_size": "enum: 1-10, 11-50, 51-200, 201-1000, 1000+",
  "industry": "string (optional)",
  "budget_signal": "string (optional, e.g. 'high', 'medium', 'low')",
  "source": "string (optional, e.g. 'typeform', 'web-form', 'api')",
  "additional_context": "string (optional)"
}
```

---

#### 2. AI Scoring Engine

**Scoring Model**
- Input: Lead data (company, title, email, size, industry, budget)
- Processing: Fine-tuned transformer model (T5 or DistilBERT)
- Output: `{ score: 0–100, confidence: 0–100, reasoning: ["...", "..."] }`

**Scoring Logic**
```
score = (title_weight * title_score) +
        (company_fit_weight * company_score) +
        (intent_weight * intent_score) +
        (size_weight * size_score)

Weights: title=25%, company=25%, intent=30%, size=20%
```

**Scoring Thresholds:**
- **Tier 1 (75–100):** "Call today" — ready for AE
- **Tier 2 (50–74):** "Call this week" — ready for SDR
- **Tier 3 (25–49):** "Follow up later" — nurture sequence
- **Tier 4 (0–24):** "Not a fit" — do not contact

**Transparency:**
- Each score includes 3–5 bullet points explaining reasoning
- Example: "Title matches ICP (founder, VP Sales) +10pts"
- Example: "Company size out of range (<100 employees) -5pts"

---

#### 3. Output & Routing

**JSON API Response**
```json
{
  "analysis_id": "uuid",
  "score": 87,
  "confidence": 94,
  "tier": 1,
  "recommendation": "Call today",
  "summary": "Strong fit — Title matches ICP, company size in range, intent signals present",
  "reasoning": [
    "Title 'Director of Sales' matches ICP (+10pts)",
    "Company size 200–1000 employees in target range (+8pts)",
    "Budget signal 'high' detected in form submission (+12pts)"
  ],
  "lead": {
    "company": "Acme Corp",
    "email": "alex@acme.com",
    "title": "Director of Sales",
    "company_size": "200-1000"
  },
  "processed_at": "2026-03-05T04:55:00Z",
  "processing_time_ms": 1847
}
```

**Slack Notification** (for high-quality leads)
- Trigger: Automatically post to Slack when score >= 75
- Format: Brief summary + link to full lead details
- Customizable threshold per customer

**Email Alert** (daily digest)
- Daily email: Top 5 leads from previous 24 hours
- Option to opt-in/out per account

**Salesforce Integration** (v1.0)
- When score >= 75: Create Salesforce Lead with fields
- Auto-populate standard fields (name, email, company, score)
- Add score as custom field (LeadScore_AI_Score__c)
- Trigger: Lead owner gets notification via Salesforce

**CSV Export**
- Dashboard button: Export all analyzed leads (last 30 days)
- Format: Lead data + score + confidence + recommendation
- File format: .csv, Excel-compatible

---

#### 4. Dashboard (Basic v1)

**Layout:**
- **Header:** Account name, API key, billing info
- **Metrics:** Leads analyzed (lifetime + month), accuracy score, avg response time
- **Recent activity:** Last 20 analyzed leads (table)
- **Integrations:** Status of Salesforce, Slack, Webhook connections

**Lead Table Columns:**
- Company
- Email
- Title
- Score (color-coded: green 75+, yellow 50–74, red <50)
- Confidence
- Status (processed, queued, failed)
- Action buttons (view details, resend, delete)

**Filters:**
- Score range
- Date range (last 7/30/90 days)
- Source (webhook, API, bulk upload)

**No advanced features in v1:**
- No reporting/analytics
- No dashboards (reserved for v2)
- No custom fields (reserved for v2)

---

### Features Explicitly Out of Scope (v1)

❌ **Custom scoring models** — No per-customer fine-tuning (v2.0)  
❌ **Active learning** — No automated model retraining (v2.0)  
❌ **Advanced enrichment** — No company data lookup, web scraping (partner with Clearbit v2)  
❌ **CRM native plugins** — No Salesforce UI plugin, HubSpot sidebar (v1.5)  
❌ **Mobile app** — Web dashboard only (v2.0)  
❌ **Real-time webhooks to CRM** — Batch or manual routing only (v1.0)  
❌ **Account-based marketing (ABM)** — Too complex for v1 (v2.0)  
❌ **Custom training data** — Use generic SaaS training data (v2.0)  

---

## Technical Architecture Overview

### Components

1. **API Server**
   - Express.js (Node.js)
   - Endpoints: /analyze, /bulk, /status
   - Rate limiting, auth, error handling

2. **Scoring Worker**
   - Python (transformers library)
   - Loads fine-tuned model
   - Processes lead data in queue
   - Returns score + reasoning

3. **Dashboard**
   - React frontend
   - Authentication (API key)
   - Lead management UI

4. **Integrations**
   - Slack bot
   - Salesforce API client
   - Zapier Zap template
   - Email service (SendGrid)

5. **Data**
   - PostgreSQL (leads, accounts, API usage)
   - Redis (job queue, rate limiting)
   - S3 (bulk uploads, exports)

---

## Data Model

### Core Tables

**accounts**
- id (PK)
- name
- api_key
- plan (starter, growth, enterprise)
- status (active, paused, canceled)
- created_at

**leads**
- id (PK)
- account_id (FK)
- company
- email
- title
- full_name
- company_size
- industry
- source
- created_at

**analyses**
- id (PK)
- lead_id (FK)
- score (0–100)
- confidence (0–100)
- tier (1–4)
- reasoning (JSON)
- processed_at
- processing_time_ms

**api_usage**
- id (PK)
- account_id (FK)
- leads_analyzed
- date
- billable_leads

---

## API Specification

### POST /api/v1/analyze
**Description:** Submit and analyze a single lead

**Request:**
```json
{
  "api_key": "sk_...",
  "lead": {
    "company": "Acme Corp",
    "email": "alex@acme.com",
    "title": "Director of Sales",
    "company_size": "200-1000"
  }
}
```

**Response (200):**
```json
{
  "analysis_id": "...",
  "score": 87,
  "confidence": 94,
  ...
}
```

**Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 3600
}
```

### POST /api/v1/bulk
**Description:** Submit multiple leads (CSV/JSON)

**Request:**
```json
{
  "api_key": "sk_...",
  "file": "<base64 CSV>"
}
```

**Response (202):**
```json
{
  "job_id": "...",
  "status": "queued",
  "estimated_completion": "2026-03-05T05:15:00Z"
}
```

### GET /api/v1/result/{analysis_id}
**Description:** Check status of submitted lead

**Response:**
```json
{
  "status": "completed",
  "analysis": { ... }
}
```

---

## Deployment & Infrastructure

**Hosting:** AWS or Render (serverless-friendly)  
**Database:** PostgreSQL (managed service)  
**ML Inference:** CPU-based (no GPU needed for v1)  
**Scaling:** Auto-scale API servers, worker queue with horizontal scaling  
**Monitoring:** CloudWatch, Sentry, New Relic  

---

## Success Metrics & Instrumentation

### Key Metrics
- Leads analyzed (cumulative, per month)
- Scoring accuracy (user feedback: "was this score accurate?")
- API latency (p50, p95, p99)
- Uptime (% successful requests)
- User satisfaction (NPS)
- Churn rate (accounts canceled per month)
- MRR (monthly recurring revenue)

### Instrumentation
- API request logging (timestamp, lead count, response time)
- Error tracking (Sentry)
- User feedback surveys (in-app, after 30 days)
- Accuracy tracking (manual review against AI score)

---

## Success Criteria Summary

✅ **MVP is ready to ship when:**
- API endpoints fully functional (single + batch submission)
- Scoring engine achieves >= 85% accuracy
- Dashboard shows lead history + metrics
- Salesforce integration tested with 2+ beta customers
- Latency < 5 seconds for 95% of requests
- Pricing page + signup flow live
- 5 beta customers active + generating feedback

---

## Timeline

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| 1 | Specification | PRD, architecture (DONE) |
| 2–3 | Backend build | API, scoring engine, database |
| 4 | Integration | Salesforce + Slack connectors |
| 5–6 | Frontend | Dashboard, auth, lead mgmt |
| 7 | Testing | QA, performance tuning, security |
| 8 | Beta launch | 5 customers, real-world validation |

---

**PRD Owner:** Codesmith  
**Status:** Ready for architecture + build phase  
**Next:** CR-LEADSCORE-001 change request  
