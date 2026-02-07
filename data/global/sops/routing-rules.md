# Agent Routing Rules

**Effective:** 2026-02-02  
**Owner:** Clawson (Master Agent / COO)

---

## Default Routing

| Condition | Route To |
|-----------|----------|
| Vague or unclear request | `chief_of_staff` |
| Multi-domain task | `chief_of_staff` |
| No keyword match | `chief_of_staff` |

---

## Keyword-Based Routing

| Keywords / Triggers | Agent |
|--------------------|-------|
| "write post", "brochure", "caption", "social", "marketing", "content" | `marketing_content` |
| "follow up", "lead", "proposal for customer", "CRM", "nurture" | `sales_followup` |
| "model", "underwriting", "valuation", "margins", "proforma", "ROI" | `finance_underwriting` |
| "contract", "proposal doc", "deck", "one-pager", "scope" | `doc_proposal` |
| "zoning", "permitting", "town", "hearing", "variance", "planning board" | `alpine_permitting` |
| "tenant", "maintenance", "HOA", "welcome packet", "property management" | `alpine_property_mgmt` |
| "SOP", "assembly", "QA", "materials list", "BOM", "factory", "manufacturing" | `massdwell_factory_ops` |
| "laser comparison", "quote", "spec sheet", "MA1", "Theo", "welding" | `laser_sales_engineer` |
| "inbox", "meeting", "reminder", "task list", "calendar", "schedule" | `admin_assistant` |

---

## Manager Loop (Default)

All specialist output flows through `chief_of_staff` before reaching Steve:

```
Request
   │
   ▼
Clawson (routes to specialist)
   │
   ▼
Specialist Agent (executes)
   │
   ▼
chief_of_staff (consolidates, enforces consistency)
   │
   ▼
Clawson (reviews)
   │
   ▼
Steve (receives decision-ready output)
```

---

## Override Mode

Steve can request direct specialist output:
- "Give me the raw output from finance"
- "Skip the consolidation"
- "Direct from [agent_name]"

In override mode, Clawson still reviews but does not consolidate.

---

## Multi-Agent Workflows

When a task requires multiple specialists:

1. `chief_of_staff` breaks into subtasks
2. Each specialist executes their portion
3. `chief_of_staff` consolidates into unified output
4. Clawson reviews for conflicts/gaps
5. Steve receives single coherent deliverable

**Conflict Resolution:**
- If assumptions conflict between agents → surface explicitly
- If numbers don't match → flag and request reconciliation
- If scope overlaps → chief_of_staff arbitrates

---

## Routing Decision Log

For complex requests, Clawson logs:
- Request summary
- Routing decision
- Agents involved
- Consolidation notes

Logged in: `memory/YYYY-MM-DD.md`

---

*Last updated: 2026-02-02*
