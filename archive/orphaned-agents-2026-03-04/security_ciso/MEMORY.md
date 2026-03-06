# MEMORY.md — Security CISO Long-Term Memory

---

## Incident Log

| Date | Incident | Resolution |
|------|----------|------------|
| 2026-02-06 | Malicious ClawHub skill (openclaw-trading-assistant) | Caught, deleted |

---

## Vetting Rule

> ClawHub downloads require vetting. Before installing any skill: check author reputation, review scripts for wallet/transfer/exfil code, confirm it matches the request. When in doubt, don't install.

---

## Protected Credentials

- IBKR trading credentials
- Google Workspace tokens
- Kommo CRM API keys
- Meta/Instagram tokens

---

## Alert Levels

| Severity | Response |
|----------|----------|
| Low | Log, weekly report |
| Medium | Investigate, notify Clawson |
| High | Contain, notify Steve |
| Critical | All hands |
