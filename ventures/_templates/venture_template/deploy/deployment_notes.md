# Deployment Notes

**Venture:** [Venture Name]  
**Deployment Date:** [YYYY-MM-DD]  
**Deployed By:** [Clawson]  

---

## Pre-Deployment Checklist

- [ ] Smoke tests PASS
- [ ] All code reviewed and merged
- [ ] No console.log() in production
- [ ] No hardcoded secrets
- [ ] Database migrations applied (if any)
- [ ] Environment variables confirmed
- [ ] Backup taken (if applicable)
- [ ] Rollback plan documented

---

## Deployment Steps

### 1. Environment Setup

```bash
# SSH into deployment environment
ssh [deployment-server]

# Navigate to venture directory
cd /ventures/venture_XXX

# Verify environment variables
cat .env
# Should have all required vars set
```

### 2. Dependencies

```bash
# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Build (if applicable)

```bash
# Build from source
npm run build
# or
npm run typecheck
```

### 4. Database Setup (if applicable)

```bash
# Run migrations
npm run migrate

# Verify database connection
npm run test:db
```

### 5. Start Server

```bash
# Start in production
NODE_ENV=production npm start

# Verify server is running
curl http://localhost:3000/health
# Expected: { "status": "ok" }
```

### 6. Smoke Test

```bash
# Run smoke test checklist
# See: tests/smoke_test.md

# Test critical endpoints
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/users -d '{"name":"Test"}'
# [Add more endpoint tests as needed]
```

### 7. Verify Metrics Baseline

```bash
# Update venture_config.json with current metrics
# See: venture_config.json (metrics section)

git add venture_config.json
git commit -m "Deploy: Update baseline metrics"
```

### 8. Monitor

```bash
# Watch logs for errors
tail -f logs/app.log

# Set up monitoring (if applicable)
# [Provider-specific monitoring setup]
```

---

## Rollback Procedure

If deployment fails or issues arise:

### Quick Rollback

```bash
# Stop current process
kill [PID]

# Revert to previous version
git revert HEAD

# Reinstall dependencies
npm install

# Restart
npm start

# Verify
curl http://localhost:3000/health
```

### Full Rollback

```bash
# If data corruption suspected:
# 1. Stop server
# 2. Restore database backup
# 3. Revert code to previous commit
# 4. Restart

# Contact Clawson if unable to recover
```

---

## Environment Variables

Required variables (must be set before deployment):

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| NODE_ENV | production | Yes | Set to "production" |
| PORT | 3000 | Yes | Server port |
| DATABASE_URL | postgres://... | Depends | If using database |
| API_KEY | sk_live_xxx | Depends | Third-party API key |
| [Custom var] | [Example] | Depends | [Description] |

Set in `.env` file (not committed to git):
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://user:pass@host/db
API_KEY=sk_live_xxx
```

---

## Monitoring & Logs

### Log Locations
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

### Log Monitoring
```bash
# Watch real-time logs
tail -f logs/app.log

# Search logs for errors
grep ERROR logs/app.log | head -20

# Count log entries by level
grep -c INFO logs/app.log
```

### Alerting
[Configure alerting for production issues]

---

## Health Checks

### Critical Endpoints
- `GET /health` → Should return 200 with `{ "status": "ok" }`
- [Add other critical endpoints]

### Health Check Frequency
```bash
# Monitor every minute
* * * * * curl http://localhost:3000/health || alert
```

---

## Post-Deployment

- [ ] Verify all endpoints respond correctly
- [ ] Check metrics baseline in venture_config.json
- [ ] Monitor logs for errors (first 30 minutes)
- [ ] Confirm users can access the product
- [ ] Update deployment log below

---

## Deployment History

### [YYYY-MM-DD HH:MM] — Deployment v0.1.0

**Deployed By:** [Clawson]  
**Commit:** [abc1234]  
**Version:** 0.1.0  
**Status:** ✅ **SUCCESS**  

**What Changed:**
- [Feature 1]
- [Feature 2]
- [Feature 3]

**Issues Encountered:**
- [Issue 1 + resolution]

**Metrics Baseline:**
- Users: 0
- Signups: 0
- MRR: $0

---

### [YYYY-MM-DD HH:MM] — Deployment v0.1.1

**Deployed By:** [Clawson]  
**Commit:** [def5678]  
**Version:** 0.1.1  
**Status:** ✅ **SUCCESS** / ❌ **ROLLED BACK**  

**What Changed:**
- [Change 1]
- [Change 2]

**Issues Encountered:**
- [Issue + resolution]

---

## Support & Troubleshooting

### Common Issues

**Server won't start**
```bash
# Check for port conflicts
lsof -i :3000

# Check environment variables
echo $NODE_ENV

# Check logs
tail -50 logs/app.log
```

**Database connection failing**
```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Health check failing**
```bash
# Check server process
ps aux | grep node

# Test directly
curl -v http://localhost:3000/health

# Check logs
grep ERROR logs/app.log
```

### Escalation

If unable to resolve:
1. Capture logs and error messages
2. Revert to previous version
3. Contact Clawson for assistance

---

_Deployment Template v1.0_  
_Clawson uses this for production deployments._
