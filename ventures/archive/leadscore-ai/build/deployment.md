# LeadScore.ai — Deployment Instructions

**Date:** 2026-03-05  
**Author:** Codesmith  

## Environments

### Development (Local)
```bash
# Clone repo
git clone https://github.com/openclaw-ventures/leadscore-ai
cd leadscore-ai

# Start full stack
docker-compose up -d

# API available at http://localhost:3001
# Dashboard at http://localhost:3002
```

### Staging
```bash
# Deploy to Render staging environment
render deploy --service leadscore-api-staging
render deploy --service leadscore-worker-staging

# Dashboard deploys automatically via Vercel on push to `staging` branch
```

### Production
```bash
# Deploy API + Worker to Render
render deploy --service leadscore-api-prod
render deploy --service leadscore-worker-prod

# Dashboard deploys via Vercel on push to `main` branch
# Supabase migrations run automatically via CI/CD
```

## Environment Variables

```bash
# Required for all environments
DATABASE_URL=postgres://...
REDIS_URL=redis://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...    # For AI scoring (fallback)
HF_API_KEY=...        # For Hugging Face models

# Production only
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SLACK_WEBHOOK_URL=...  # Notifications
```

## Health Checks

- API: `GET /health` → 200 OK
- Worker: Process queue depth < 100 items
- DB: Connection pool healthy
- Redis: PING → PONG

## Rollback

```bash
# Render rollback to previous deploy
render rollback --service leadscore-api-prod

# Vercel rollback
vercel rollback
```
