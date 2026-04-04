# CHANGE REQUEST: Remove Legacy Gmail Refresh Job

**CR ID:** CR-006  
**Date Created:** 2026-03-04 19:27 EST  
**Status:** APPROVED (by Steve Vettori)  
**Risk Tier:** MINIMAL  
**Assigned to:** Clawson  
**Est. Effort:** 30 seconds  

---

## OBJECTIVE

Remove the legacy "Run Gmail token refresh for all accounts" cron job from `canon/cron.manifest.canon` to clean up the scheduler.

**Reason:** Replaced by CR-003 (Gmail OAuth Token Auto-Refresh). Legacy job fails every 30 min, harmless but unnecessary noise.

---

## CHANGE

**File:** `canon/cron.manifest.canon`

**Action:** Delete the entry:
```json
{
  "name": "Gmail Token Auto-Refresh - All Accounts",
  "schedule": { "kind": "every", "everyMs": 1800000 },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": {
    "kind": "systemEvent",
    "text": "Run Gmail token refresh for all accounts: cd ~/.openclaw/workspace/credentials/google && node refresh-all-tokens.js > /dev/null 2>&1 || echo 'Token refresh failed but will retry in 30 min'"
  },
  "enabled": true,
  "description": "Critical: Maintains OAuth tokens for Google Workspace (Gmail x3, Drive, Calendar)"
}
```

**Replacement:** None. CR-003 (Gmail OAuth Token Auto-Refresh) now handles this.

---

## VALIDATION

- ✅ No other jobs depend on this
- ✅ CR-003 provides full replacement functionality
- ✅ No loss of capability
- ✅ Drift-safe (removing from manifest only)

---

## APPROVAL

**Approved by:** Steve Vettori  
**Date:** 2026-03-04 19:27 EST

---

**Status:** READY TO EXECUTE
