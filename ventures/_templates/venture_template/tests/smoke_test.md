# Smoke Test Checklist

**Venture:** [Venture Name]  
**Executed:** [YYYY-MM-DD]  
**Executor:** [Codesmith]  

---

## Pre-Deployment Smoke Test

Run this checklist before deploying to production.

### Environment Setup
- [ ] Node.js version: 20 LTS or higher
- [ ] npm/yarn installed
- [ ] .env file exists with required variables
- [ ] All dependencies installed: `npm install`

### Server Startup
- [ ] Server starts without errors: `npm start`
- [ ] No critical logs on startup
- [ ] Listens on correct port (default 3000)
- [ ] Ready message appears in logs

### Health Checks
- [ ] Health endpoint responds: `GET /health`
- [ ] Response code: 200
- [ ] Response body: `{ "status": "ok" }`
- [ ] Response time: < 100ms

### Basic Endpoints
- [ ] All required endpoints exist
- [ ] GET endpoints return correct status codes (200/404)
- [ ] POST endpoints accept valid payloads
- [ ] Invalid payloads return 400/422
- [ ] Missing auth returns 401

### Database / Integrations
- [ ] Database connection successful (if applicable)
- [ ] Third-party API connections work (if applicable)
- [ ] Environment variables correctly loaded
- [ ] No "undefined" values in critical paths

### Error Handling
- [ ] Server handles unexpected errors gracefully
- [ ] No unhandled promise rejections
- [ ] Error responses have correct status codes
- [ ] Logs contain no FATAL/CRITICAL errors

### Tests
- [ ] All unit tests pass: `npm test`
- [ ] Test output: [X]/[Y] pass
- [ ] No skipped tests (unless documented)
- [ ] Coverage: [X]% (minimum acceptable)

### Code Quality
- [ ] Linter passes: `npm run lint` (0 errors)
- [ ] Type check passes: `npm run typecheck` (0 errors)
- [ ] No console.log() in production code
- [ ] No hardcoded secrets / API keys

### Secrets Compliance
- [ ] No secrets in repository
- [ ] All secrets use environment variables
- [ ] .env.example has only placeholders
- [ ] Secrets scan passes (0 secrets detected)

### Performance
- [ ] Server memory usage: < [X]MB
- [ ] CPU usage: < [X]%
- [ ] Response times: < [X]ms (average)
- [ ] Can handle 100 concurrent requests

### Final Checks
- [ ] All checkboxes above are checked ✅
- [ ] No blocking issues or warnings
- [ ] Deployment readiness: **GO** / **NO-GO**

---

## Issues Found

| Issue | Severity | Status | Resolution |
|-------|----------|--------|-----------|
| -- | -- | -- | -- |

---

## Sign-Off

**Tested by:** [Codesmith]  
**Date:** [YYYY-MM-DD]  
**Time:** [HH:MM EST]  
**Result:** ✅ **PASS** / ❌ **FAIL**  

**Notes:**
[Optional notes about test run]

---

_Smoke Test Template v1.0_  
_Run before every production deployment._
