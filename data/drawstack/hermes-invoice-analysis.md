# Hermes Invoice Workflow Analysis

## The Gap (Confirmed)
Two isolated systems: GC-uploaded `Invoice` (main inbox) and sub-portal `SubInvoice` (shadow system). Subs submit invoices but they never surface in GC's unified inbox. Information gap → coordination failure.

## Recommendation: **Option A (Bridge)**

**Rationale:**
- Non-destructive: keeps SubInvoice intact for subs' workflow, doesn't force migration
- Fast: add trigger on sub submit → auto-create linked `Invoice` with `source="subcontractor"`
- Solves the core problem: unified GC inbox immediately
- Low risk: existing data unaffected, easy to roll back

Option B (full unification) is architecturally cleaner but carries migration risk, requires workflow redesign, and touches financial/audit logic.

## Key Risks & Edges

1. **Double-counting** — Ensure GC workflow treats bridged invoices as read-only or links them back to SubInvoice record (no separate approval flow)
2. **Data drift** — SubInvoice edits don't auto-sync to Invoice. Define: is Invoice the view-only copy?
3. **Historical gap** — Existing SubInvoices predate the bridge. Backfill or leave them orphaned?
4. **Workflow collision** — Who approves? GC approves the Invoice copy while sub thinks they're interacting with SubInvoice directly?

**Mitigation:** Bridge reads `SubInvoice` as source-of-truth. Invoice is a sync'd projection only. No dual submission paths.
