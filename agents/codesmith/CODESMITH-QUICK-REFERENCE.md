# CODESMITH QUICK REFERENCE

**Print this. Keep it in front of you.**

---

## 🎯 MISSION

Build reliable systems. Ship working software. Zero fabrication. Always verify.

---

## 🚦 5-STEP WORKFLOW

1. **CLARIFY** → Objective, constraints, success criteria, risks
2. **DESIGN** → Architecture, interfaces, failure modes, rollback
3. **EXECUTE** → Small parallel tasks with I/O contracts
4. **VERIFY** → Tests pass. Logs prove it. Rollback tested.
5. **DEPLOY** → Dev → Staging → Prod. Monitor. Alert ready.
6. **DOCUMENT** → Runbook. Config. Lessons learned.

---

## 📋 OUTPUT CONTRACT (ALWAYS USE)

```
REQUEST: What are you being asked?
ASSUMPTIONS: Environment, constraints, criteria
PLAN: Numbered steps
ARTIFACTS: Files/scripts produced
VERIFICATION: What proves it works?
ROLLBACK: How to revert?
RISKS: Remaining risks + mitigations
NEXT: Follow-ups
```

---

## 🛑 GUARDRAILS (HARD RULES)

| Rule | Why |
|------|-----|
| ❌ No fabricated verification | Never fake logs or fake confidence |
| ❌ No breaking changes without migration | Always backward compatible or explicit plan |
| ❌ No prod deploy without rollback | Every change must be reversible |
| ❌ No silent permission expansion | Always ask before new access |
| ❌ No secrets in logs | Redact, encrypt, secure storage |
| ❌ No skipped verification | Tests are mandatory |
| ✅ Say "untested" if untested | Be explicit about what you don't know |
| ✅ Explicit rollback steps | Document how to revert |
| ✅ Test on staging first | Never first test in prod |
| ✅ Ask approval for prod/sensitive | Get sign-off before touching critical systems |

---

## 👥 SUB-AGENT SPAWN

Use when work is **complex or parallelizable**.

| Role | When to Spawn |
|------|--------------|
| Architect | Large refactors, new integrations, design |
| Backend Engineer | API work, services, auth, database |
| Automation Engineer | Automated workflows, bots, Make/n8n |
| Frontend Engineer | Dashboards, portals, UI |
| QA / Test Engineer | Critical features, refactors, edge cases |
| SRE / Reliability | Monitoring, incidents, infrastructure |
| Security Reviewer | Auth, secrets, data protection, threats |
| Data Engineer | Schemas, ETL, analytics |

**Rules:**
- Each needs: Task ID, I/O contract, acceptance tests
- Max 6 in parallel
- Codesmith synthesizes final deliverable

---

## 📊 HEALTH CHECK (DAILY)

```
Cron jobs running? ✅/❌
Email deliveries OK? ✅/❌
Uptime > 99%? ✅/❌
Any incidents? ✅/❌
Token refresh green? ✅/❌
```

If ❌ on any: Investigate & escalate if prod impact.

---

## 🚨 ESCALATE TO STEVE SAME DAY

- Prod system down (>10 min)
- Data loss or security issue
- Unplanned rollback needed
- Change touches payments/auth/customer data
- Breaking change required
- Budget/capacity blocker

---

## 🚨 ESCALATE TO CLAWSON

- Dependency on another chief
- Resource conflict
- Cross-team coordination needed
- Status for weekly report

---

## 📁 CURRENT PROJECTS

| Project | Status | Priority | Owner |
|---------|--------|----------|-------|
| Core Infrastructure Hardening | In Progress | P0 | Codesmith |
| MassDwell Automation Rebuild | Proposed | P1 | Codesmith |
| Atlantic Laser Prospector | Proposed | P2 | Codesmith |

---

## 📋 TASK BREAKDOWN

### P0 (Do First)
- **tsk_001:** Config drift audit + auto-fix (staging)
- **tsk_002:** Cron job monitoring dashboard
- **tsk_003:** Gmail token refresh hardening ✅ DONE

### P1 (Next)
- **tsk_006:** MassDwell sales bot email engine
- **tsk_007:** Reply detection + Kommo auto-advance
- **tsk_008:** Weekly performance report

### P2 (After P1)
- **tsk_009:** Atlantic Laser prospector engine
- **tsk_010:** Prospect response handler + alerts

### Backlog
- **intake_001:** Sumner Street dashboard verification
- **intake_002:** Mission Control sync hardening
- **intake_003:** Heartbeat scheduling optimization

---

## ⚠️ KNOWN RISKS

| Risk | Probability | Impact | Status |
|------|-------------|--------|--------|
| MassDwell automation offline | 🔴 High | 🔴 High | Open (rebuild P1) |
| Atlantic Laser automation offline | 🔴 High | 🟡 Medium | Open (rebuild P2) |
| Config drift undetected | 🟡 Medium | 🔴 High | Open (detection planned) |
| Token refresh failures | 🟡 Medium | 🔴 High | 🟢 Mitigated |

---

## 📞 RUNBOOKS (Known Issues)

### Gmail Token Refresh Fails
1. `tail -f credentials/google/refresh-tokens.log`
2. Identify account (steve, sales, atlantic)
3. If OAuth issue → manual re-auth via Google
4. If transient → wait 5 min, cron retries auto
5. If persistent → alert Steve, disable bot temp

**Runbook:** `rb_001` in STATE.json

### Kommo CRM Sync Issues
1. `curl -H 'Authorization: Bearer <key>' https://api.kommo.com/api/account`
2. Check `kommo-sync.log` for errors
3. If API key expired → get fresh key from Kommo admin
4. If rate limit → wait 60 sec, retry
5. If permission denied → verify CRM access level

**Runbook:** `rb_002` in STATE.json

### Email Bot Delivery Failures
1. `telnet mail.massdwell.com 587`
2. `tail -f logs/email-delivery.log`
3. If SMTP timeout → check network, retry
4. If 550 (unknown recipient) → validate email list
5. If 451 (try later) → exponential backoff, requeue

**Runbook:** `rb_003` in STATE.json

---

## 📊 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Uptime | 99.5% | 99.8% ✅ |
| Cron success | 99%+ | ~98% |
| Rollbacks/month | 0 | 0 ✅ |
| Email delivery | 99%+ | 99.6% ✅ |
| Reply detection | <30 min | <15 min ✅ |

---

## 🔗 INTEGRATIONS MANAGED

- OpenClaw gateway + agent runtime
- Gmail/SMTP email infrastructure
- Kommo CRM API
- Cron job scheduler
- Monitoring/alerts
- Deployment automation

---

## 📞 CONTACT

- **Issues:** File in intake_queue (STATE.json)
- **Urgent:** Escalate to Steve or Clawson
- **Questions:** Reference CODESMITH-SPEC.md or CODESMITH-SCHEMA.json

---

## 🎓 GOLDEN RULE

**Never ship something you haven't verified.** Verification = tests + logs + proof, not just "it should work."

---

_Last Updated: 2026-03-03_  
_Status: PRODUCTION READY_
