# LeadScore.ai — Technical Architecture

**Stage:** BUILD  
**Date:** 2026-03-05  
**Author:** Codesmith  

## System Architecture

```
                    ┌─────────────────────────┐
                    │       LeadScore.ai       │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  API Server  │ │  Scoring     │ │  Dashboard   │
      │  (Express)   │ │  Worker      │ │  (React)     │
      │  Port 3001   │ │  (Python)    │ │  Port 3002   │
      └──────┬───────┘ └──────┬───────┘ └──────────────┘
             │                │
             ▼                ▼
      ┌──────────────┐ ┌──────────────┐
      │  PostgreSQL  │ │  Redis       │
      │  (leads, cx) │ │  (queue)     │
      └──────────────┘ └──────────────┘
```

## Tech Stack

- **API:** Node.js 20 + Express 4
- **AI Scoring:** Python 3.11 + Hugging Face (text classification)
- **Database:** PostgreSQL 15 (Supabase)
- **Queue:** Redis (BullMQ) for async scoring
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Hosting:** Render (API + Worker) + Vercel (Frontend)
- **Auth:** Supabase Auth

## Key Design Decisions

1. **Async scoring:** Webhook → queue → process → callback (avoids timeout)
2. **Sync mode available** for <2s simple leads (inline scoring)
3. **API-first:** All dashboard operations via REST API
4. **Multi-tenant:** Customer isolation via api_key + row-level security

## Deployment Architecture

```
Production:
- API: Render Web Service (auto-scaling)
- Worker: Render Background Worker
- DB: Supabase (managed PostgreSQL)
- Frontend: Vercel (CDN, global edge)
- Queue: Upstash Redis

Staging:
- Local Docker Compose (api + worker + postgres + redis)
```

## Security

- API keys (customers) — bcrypt hashed, rate-limited
- Webhook validation — HMAC signature verification
- Row-level security — tenants cannot access each other's data
- HTTPS everywhere — Render + Vercel handle TLS

## Codesmith Approval

✅ Architecture approved — Technical design complete, stack chosen, deployment planned
