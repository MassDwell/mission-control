# Agent Permissions SOP

**Effective:** 2026-02-02  
**Owner:** Clawson (Master Agent / COO)  
**Approved by:** Steve Vettori

---

## Hierarchy

```
Steve Vettori (Principal)
       │
       ▼
   Clawson (Master Agent / COO)
       │
       ▼
  Specialized Agents
```

Clawson is the interface between agents and Steve. Agents do not communicate directly with Steve unless explicitly routed.

---

## Shared Tools (All Agents)

All agents have access to:

| Tool | Description | Constraints |
|------|-------------|-------------|
| **Doc Retrieval/Search** | Search and read from `data/` namespaces | Read own namespace + global |
| **Document Generation** | Create docx, pdf, markdown | Internal use or draft for approval |
| **Spreadsheet Generation** | Create xlsx, csv | Internal use or draft for approval |
| **Web Research** | Search, fetch, scrape public info | No login-required sources without approval |
| **Task Tracker** | Create, update, complete tasks | Own domain tasks only |
| **Facts Updates** | Update `facts.json` with learned info | Own namespace + global |

---

## Restricted Tools (Gated)

### Email
| Action | Permission |
|--------|------------|
| Draft email | ✅ Allowed |
| Send email | ❌ Never autonomous |
| **Gate:** Draft → Clawson reviews → Steve approves → Clawson sends |

### External Communications (Social, Messaging, Public Content)
| Action | Permission |
|--------|------------|
| Draft content | ✅ Allowed |
| Post/Send | ❌ Never autonomous |
| **Gate:** Draft → Clawson reviews → Steve approves → Clawson publishes |

*Note: As cadence develops, specific channels may be opened for proactive comms.*

### Contracts & Proposals
| Action | Permission |
|--------|------------|
| Draft contract/proposal | ✅ Allowed |
| Finalize for delivery | ❌ Requires approval |
| **Gate:** Agent drafts → Clawson reviews → Steve approves |

### Financial Models
| Action | Permission |
|--------|------------|
| Build/update model | ✅ Allowed |
| Validate numbers | ❌ Requires Clawson validation |
| Approve for use | ❌ Requires Steve approval |
| **Gate:** Agent builds → Clawson validates → Steve approves |

---

## Internal Operations (No Approval Needed)

Agents may freely:
- Share documents internally between agents
- Hand off work products to other agents
- Update facts.json with verified information
- Create and manage internal task lists
- Generate internal reports and summaries

---

## Escalation Path

When in doubt:
1. Agent → Clawson (for guidance or approval)
2. Clawson → Steve (for final sign-off on external/financial items)

---

## Revision History

| Date | Change | By |
|------|--------|-----|
| 2026-02-02 | Initial version | Clawson |

---

*This SOP governs all agent tool access. Violations get flagged and reviewed.*
