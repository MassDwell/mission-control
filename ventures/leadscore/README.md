# LeadScore.ai — AI-Powered Lead Qualification

**Status:** 🚀 **IMPLEMENTATION STARTING** (Week 1 of 8)  
**Owner:** Codesmith  
**Change Request:** CR-LEADSCORE-001  
**Timeline:** 8 weeks to MVP launch  

---

## What is LeadScore.ai?

An AI system that automatically analyzes inbound leads and produces a qualification score (0–100), executive summary, and recommended next action for sales teams.

**Use case:** Sales team receives 100 inbound leads/month. Instead of spending 30–45 minutes manually qualifying them, LeadScore analyzes all 100 leads in minutes and prioritizes the best fits.

**Value prop:** Save 2–5 hours/week per sales rep in lead review time. Save companies $10K–$50K annually in wasted sales cycles.

---

## Quick Links

- 📋 **[Venture Memo](docs/venture_memo.md)** — Business case, market opportunity, competitive advantages
- 📖 **[Product Requirements (PRD)](docs/prd.md)** — Complete feature spec, API docs, data model
- 🧪 **[Experiment Plan](docs/experiment_plan.md)** — Validation approach, beta plan, metrics
- 📝 **[Change Request (CR-LEADSCORE-001)](CR-LEADSCORE-001.md)** — Architecture, timeline, approval

---

## Architecture Overview

```
Webhooks/Forms → API Server → Scoring Worker (ML) → Database
                    ↓
              Dashboard (React)
              Salesforce Integration
              Slack Notifications
```

**Tech Stack:**
- **API:** Node.js + Express
- **ML:** Python + Hugging Face (T5/DistilBERT)
- **Database:** PostgreSQL + Redis
- **Frontend:** React + Vite
- **Hosting:** AWS or Render

---

## Project Structure

```
/ventures/leadscore/
├── docs/                    # Specification documents
│   ├── venture_memo.md
│   ├── prd.md
│   └── experiment_plan.md
├── api/                     # Express API server
│   ├── server.js
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth, rate limiting
│   └── integrations/        # Salesforce, Slack, Zapier
├── worker/                  # Python scoring engine
│   ├── worker.js
│   └── model.py
├── web/                     # React dashboard
│   ├── src/
│   └── package.json
├── tests/                   # Test suite
├── CR-LEADSCORE-001.md      # Change request
└── README.md                # This file
```

---

## Timeline

| Week | Phase | Owner | Deliverables |
|------|-------|-------|--------------|
| 1–2 | Backend Build | Codesmith | API scaffolding, scoring engine, database schema |
| 3–4 | Integration | Codesmith + Claude Code | Salesforce, Slack, Zapier connectors |
| 5 | Frontend | Codesmith / Claude Code | React dashboard, auth, lead history UI |
| 6 | Testing & QA | Codesmith | Unit tests, integration tests, performance tuning |
| 7 | Closed Beta | Clawson | 5 beta customers, feedback collection |
| 8 | Public Launch | Clawson | Landing page, pricing, signup flow |

---

## Getting Started (Local Dev)

**Prerequisites:**
```bash
Node.js 18+
Python 3.9+
PostgreSQL 14+
Redis 6+
```

**Setup:**
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL, Redis, etc.

# Run database migrations
npm run migrate

# Start API server
npm run dev

# In another terminal, start scoring worker
python worker/worker.py

# In another terminal, start React dashboard
cd web && npm run dev
```

**Test:**
```bash
npm test
```

---

## API Endpoints (MVP)

### POST /api/v1/analyze
Submit a single lead for scoring
```bash
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "sk_...",
    "lead": {
      "company": "Acme Corp",
      "email": "alex@acme.com",
      "title": "Director of Sales",
      "company_size": "200-1000"
    }
  }'
```

Response:
```json
{
  "analysis_id": "uuid",
  "score": 87,
  "confidence": 94,
  "recommendation": "Call today",
  "reasoning": [
    "Title matches ICP (+10pts)",
    "Company size in range (+8pts)",
    "Budget signal detected (+12pts)"
  ]
}
```

### POST /api/v1/bulk
Submit multiple leads (CSV/JSON)
```bash
curl -X POST http://localhost:3000/api/v1/bulk \
  -H "Authorization: Bearer sk_..." \
  -F "file=@leads.csv"
```

Response:
```json
{
  "job_id": "uuid",
  "status": "queued",
  "estimated_completion": "2026-03-05T05:15:00Z"
}
```

### GET /api/v1/result/{analysis_id}
Check status of lead analysis
```bash
curl http://localhost:3000/api/v1/result/uuid?api_key=sk_...
```

---

## MVP Success Criteria

**By Week 4 (End of Build Phase):**
- ✅ API fully functional
- ✅ Scoring accuracy >= 85%
- ✅ 100+ leads analyzed by beta users
- ✅ Dashboard showing lead history

**By Week 6 (Integrations Complete):**
- ✅ Salesforce integration working
- ✅ Slack notifications live
- ✅ 2+ customers committed to paid plan

**By Week 8 (Public Launch):**
- ✅ 10+ paid customers
- ✅ MRR >= $1,000
- ✅ Churn = 0%
- ✅ Public launch

---

## Resources

- **Docs:** See `/docs` directory
- **API Spec:** Full spec in [prd.md](docs/prd.md)
- **Database Schema:** In [CR-LEADSCORE-001.md](CR-LEADSCORE-001.md)
- **Experiment Plan:** [experiment_plan.md](docs/experiment_plan.md)

---

## Contact & Support

**Assigned Owner:** Codesmith  
**Change Request:** CR-LEADSCORE-001  
**Status:** 🚀 Ready for implementation  

---

**Last Updated:** 2026-03-05 04:55 EST  
**Project Start Date:** 2026-03-05  
**MVP Target Date:** 2026-04-30  
