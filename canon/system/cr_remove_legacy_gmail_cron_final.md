# CHANGE REQUEST: Remove Legacy Gmail Cron Job (Final)

**CR ID:** CR-007  
**Date Created:** 2026-03-04 19:56 EST  
**Status:** APPROVED (by Steve Vettori)  
**Risk Tier:** MINIMAL  
**Assigned to:** Clawson  
**Est. Effort:** <2 minutes  

---

## OBJECTIVE

Remove the legacy "Run Gmail token refresh for all accounts" job from the system crontab permanently and verify removal with proof.

**Context:** Previous removal attempt (CR-006) was interrupted. This execution includes verification steps to confirm complete removal.

---

## EXECUTION PLAN

### Step 1: Remove from System Crontab
```bash
crontab -l | grep -v "refresh-all-tokens.js" | crontab -
```

### Step 2: Verification (Proof)
1. Check system crontab is empty
2. Verify no gmail-related entries remain
3. Log removal timestamp
4. Document in activity log

### Step 3: Quality Gates
- [ ] Removal succeeds (no errors)
- [ ] Crontab empty (0 entries)
- [ ] No gmail entries found (grep returns nothing)
- [ ] Activity logged
- [ ] No system impact

---

## ACCEPTANCE CRITERIA

- [ ] System crontab shows 0 entries (completely empty)
- [ ] No grep matches for "gmail", "refresh-all-tokens", or "Google Workspace"
- [ ] Multiple verification checks confirm removal
- [ ] Activity log updated with timestamp
- [ ] Report provided with exact command output

---

## APPROVAL

**Approved by:** Steve Vettori  
**Date:** 2026-03-04 19:56 EST  
**Request:** Remove legacy job + prove it's gone

---

**Status:** READY FOR EXECUTION & VERIFICATION
