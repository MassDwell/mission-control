# observability/permissions/

**Status: NOT YET IMPLEMENTED**  
**Created:** 2026-03-28  
**Purpose:** Runtime permission enforcement audit logs

---

## What This Directory Is For

CORE_ARCHITECTURE_SPEC.md and ANTI_SPRAWL_POLICY.md document a permission enforcement
system where agent access profiles are validated at runtime, with violations logged here.

This directory exists as the **designated output path** for that enforcement system
when it is built.

## Current State

Permission enforcement is **not yet implemented**. No runtime permission checks are
currently being run or logged. The governance rules in ANTI_SPRAWL_POLICY.md describe
the *intended design*, not an active system.

## Intended Artifacts (When Implemented)

| File | Purpose |
|------|---------|
| `permission-violations.json` | Log of agents that exceeded their declared access profile |
| `access-audit-YYYY-MM-DD.json` | Daily audit of agent permission usage vs. declared scope |
| `quarantine/` | Agents blocked for permission violations pending review |

## Next Steps

To implement permission enforcement, the following work is required:
1. Define per-agent permission profiles in `canon/registry.json`
2. Build a runtime interceptor that checks tool/action calls against profiles
3. Log violations here in the formats above
4. Integrate violation detection into the drift audit (Check #7 or new check)

Until implemented, treat all governance documentation describing "permission enforcement"
as *design intent*, not active behavior.
