# LeadScore.ai — Product Requirements Document

**Stage:** PRD  
**Date:** 2026-03-05  
**Author:** Codesmith  
**Reviewer:** Clawson  
**Version:** 1.0  

## Product Scope (MVP)

LeadScore.ai MVP delivers AI-powered lead qualification via API + dashboard:
1. Ingest leads via webhook (form submission, CRM push)
2. AI analysis → score (0–100), category (hot/warm/cold), summary, routing
3. Return structured output in <5 seconds
4. Dashboard for viewing scored leads + score history

## Core User Flows

### Flow 1: Lead Submission (API)
```
1. Customer form submits → webhook fires → POST /api/leads/score
2. LeadScore receives payload (name, email, company, message)
3. AI processes in background
4. Score + summary returned in response (async fallback via webhook)
```

### Flow 2: Dashboard Review
```
1. SDR opens dashboard
2. Sees scored leads sorted by score (highest first)
3. Clicks lead → sees full AI analysis (score, category, summary, reasoning)
4. Routes to CRM or marks handled
```

### Flow 3: CRM Integration
```
1. Salesforce/HubSpot event → LeadScore webhook
2. Score returned → written back to CRM record
3. Automated routing rule triggers (e.g., score ≥75 → assigned to AE)
```

## Data Model

```
Lead {
  id: uuid
  created_at: timestamp
  email: string
  name: string
  company: string
  message: string
  source: string (webhook|manual|api)
  score: integer (0-100)
  category: enum (hot|warm|cold)
  summary: string
  reasoning: string
  routed_to: string|null
}

Customer {
  id: uuid
  name: string
  api_key: string
  webhook_url: string
  plan: enum (starter|growth|enterprise)
  monthly_leads: integer
}
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Score accuracy (human eval) | ≥85% |
| Response time | <5 seconds |
| Beta customers | 5–10 |
| Activation rate | ≥50% |
| MRR Month 3 | $1,000+ |

## Team Commitment

- **Codesmith:** Architecture, API, AI scoring, deployment
- **Clawson:** Gate approval, metric review
- **Steve:** Product vision, beta customer intro

## Codesmith Approval

✅ PRD approved — Scope defined, flows documented, data model designed, metrics set
