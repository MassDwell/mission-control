# WORKING.md — Security CISO Active Context

_Last updated: 2026-02-06_

---

## 🔴 ACTIVE THREATS

(None currently)

---

## 📋 RECENT INCIDENTS

| Date | Incident | Severity | Status |
|------|----------|----------|--------|
| 2026-02-06 | Malicious ClawHub skill | HIGH | ✅ Resolved |

### 2026-02-06 Incident Details
- **What:** `openclaw-trading-assistant` from ClawHub
- **Source:** github.com/molt-bot/
- **Payload:** Crypto wallet transfer scripts (veil-cash mixer)
- **Action:** Caught before activation, deleted immediately
- **Root cause:** Skill not vetted before install

---

## 🛡️ SECURITY POSTURE

- [ ] Implement pre-install vetting checklist
- [ ] Audit current integrations
- [ ] Review credential access logs

---

## 📝 VETTING CHECKLIST (New Tools)

- [ ] Verify author/source reputation
- [ ] Review code for wallet/transfer/exfil patterns
- [ ] Check permission requests
- [ ] Confirm matches stated purpose
- [ ] Sandbox test if possible
