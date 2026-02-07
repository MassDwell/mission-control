# Kommo CRM Automation Rules
**Effective:** February 3, 2026  
**Approved by:** Steve Vettori

---

## Permission Level

**WRITE ACCESS GRANTED** with guardrails.

---

## Allowed Actions

| Action | Allowed | Notes |
|--------|---------|-------|
| Add notes to leads | ✅ Yes | Log all interactions |
| Move leads between stages | ✅ Yes | Within allowed stages only |
| Create follow-up tasks | ✅ Yes | Assign to Nick or Jon |
| Update lead data/tags | ✅ Yes | For segmentation |
| Send emails | ✅ Yes | For cold leads (≥30 days, cold stages) only |
| Delete leads | ❌ No | Never |
| Modify hot leads | ❌ No | See protected list |

---

## Lead Filters

### Age Requirement
- **Minimum age:** 30 days
- Leads < 30 days old are untouched

### Allowed Stages (CAN touch)
| Stage | ID |
|-------|-----|
| Incoming Leads | 88661695 |
| Welcome e-mail sent | 94100935 |
| Follow-up 1 | 86738631 |
| Recycle follow-up | 86738627 |
| Conversation started | 86738635 |
| FUTURE CONTACT | 93011343 |
| Recap email's | 97920535 |

### Protected Stages (CANNOT touch)
| Stage | ID |
|-------|-----|
| Site Feasibility Booked | 89929427 |
| Site Feasibility Completed | 86738823 |
| Negotiation/Decision Making | 88076707 |
| Contract Signed/Deposit Paid | 89929311 |
| Closed - Won | 142 |
| Closed - Lost | 143 |

---

## Protected Leads (By Name)

These specific leads are OFF LIMITS regardless of stage:

1. Bob Warren — $205K — Mattapoisett
2. Michael — $307K — Andover
3. Plymouth Lead (1354480129722549) — $241K
4. Lexington Lead (1314036127078560) — $200K
5. Westwood Lead (880060024520350) — $150K

---

## Logging Requirements

Every CRM action must be logged to:
`data/massdwell/sales/crm-action-log.json`

Log format:
```json
{
  "timestamp": "ISO-8601",
  "action": "note_added|stage_changed|task_created|tag_added",
  "lead_id": 12345,
  "lead_name": "Name",
  "details": "Description of action",
  "previous_value": "if applicable",
  "new_value": "if applicable"
}
```

---

## Daily Summary

At end of each day, summarize all actions and send to:
- Steve (Telegram)
- Nick (Telegram)

---

## Kill Switch

If Steve says "stop CRM" or "halt Kommo" — immediately cease all CRM operations until further notice.

---

*Rules created by Clawson | Approved by Steve Vettori*
