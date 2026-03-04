# Operations Director State Structure — Detailed Guide

**Version:** 1.0 (Granular Tracking)  
**Last Updated:** 2026-03-04

---

## 📊 State Overview

Your Operations Director manages a **granular, interconnected state structure** with:

```
operations/
  ├─ massdwell (projects, schedule, output, installations)
  ├─ atlantic_laser (orders, inventory, shipping, installations)
  └─ alpine (developments, construction, permits, inspections)
  
milestones/        (all upcoming targets across businesses)
blockers/          (all issues preventing progress)
task_assignments/  (who is doing what to resolve blockers)
approvals_queue/   (pending decisions and change requests)
summary/           (consolidated health metrics)
```

---

## 🏭 1. Operations: MassDwell

### **Projects**

Track each ADU order from creation to delivery.

```json
{
  "order_id": "MAS-001",
  "customer": "Bob Warren",
  "location": "Mattapoisett, MA",
  "unit_type": "Dwell Prime",
  "contract_value": 205000,
  "created_date": "2026-02-10",
  "expected_delivery": "2026-04-15",
  "current_stage": "design_approval_pending",
  "stage_start_date": "2026-02-10",
  "days_in_stage": 20,
  "on_track": true,
  "notes": "Waiting on customer design approval"
}
```

**Stages:** design → materials → manufacturing → QA → delivery → complete

**Update:** Daily (status changes), weekly (summary)

---

### **Production Schedule**

Track weekly production plan vs. projection.

```json
{
  "week": "2026-03-04",
  "planned_units": 2,
  "projected_units": 2,
  "status": "on_track"
}
```

**Why it matters:** See capacity constraints coming. If projection < planned, production is at risk.

**Update:** Weekly

---

### **Factory Output**

Consolidated metrics for MassDwell factory.

```json
{
  "capacity_units_per_month": 8,
  "current_backlog": 6,
  "months_of_backlog": 1,
  "utilization_pct": 87,
  "quality_defect_rate_pct": 2,
  "on_time_delivery_pct": 85,
  "average_days_to_completion": 50
}
```

**Key insight:** You have 1 month of backlog, factory is 87% utilized (near capacity), quality at 2% defect threshold.

**Update:** Weekly

---

### **Installation Pipeline**

Track post-delivery installation and handoff.

```json
{
  "order_id": "MAS-001",
  "stage": "pre_installation",
  "planned_install_date": "2026-04-20",
  "customer_confirmed": false,
  "notes": "Installation team assignment pending delivery"
}
```

**Why separate:** Delivery ≠ project complete. Installation is a phase that needs tracking too.

**Update:** Weekly

---

## 🔧 2. Operations: Atlantic Laser

### **Orders**

Track each machine order through fulfillment.

```json
{
  "order_id": "ALS-001",
  "customer": "Fabrication Shop, Boston",
  "machine_model": "MA1-45",
  "contract_value": 6000,
  "order_date": "2026-02-20",
  "expected_delivery": "2026-03-05",
  "current_status": "shipped",
  "shipping_carrier": "FedEx",
  "tracking_number": "12345",
  "on_track": true
}
```

**Statuses:** in_inventory → shipped → delivered

**Update:** Daily (tracking/delivery updates)

---

### **Inventory**

Track stock levels by machine model.

```json
{
  "machine_model": "MA1-35",
  "units_in_stock": 1,
  "units_reserved": 0,
  "units_available": 1,
  "reorder_threshold": 3,
  "status": "low_reorder_soon",
  "last_reorder_date": "2026-02-01",
  "lead_time_days": 21
}
```

**Key insight:** Reserve units against orders. Available = in_stock - reserved.

**Statuses:** optimal | low_reorder_soon | at_threshold

**Update:** Daily (real-time as orders ship)

---

### **Shipping Schedule**

Track when orders ship and expected delivery.

```json
{
  "order_id": "ALS-001",
  "ship_date": "2026-03-01",
  "expected_delivery": "2026-03-05",
  "carrier": "FedEx",
  "tracking": "12345",
  "status": "in_transit"
}
```

**Why separate:** Order status ≠ shipping status. Tracking separately gives clarity.

**Update:** Daily (delivery date updates)

---

### **Customer Installations**

Track post-delivery setup and training.

```json
{
  "order_id": "ALS-001",
  "customer": "Fabrication Shop, Boston",
  "installation_scheduled": false,
  "planned_date": null,
  "training_needed": true,
  "notes": "Installation and training TBD post-delivery"
}
```

**Update:** Weekly

---

## 🏢 3. Operations: Alpine

### **Developments**

Track all development projects from acquisition → stabilization.

```json
{
  "project_id": "ALP-001",
  "property": "11 Taft Hill Terrace",
  "project_type": "development",
  "stage": "development",
  "timeline_months": 18,
  "months_elapsed": 10,
  "months_remaining": 8,
  "budget": 750000,
  "spent": 425000,
  "spent_pct": 56.7,
  "on_track": true,
  "next_milestone": "Permitting approval (expected 3/20)"
}
```

**Stages:** design → acquisition → due_diligence → development → construction → leasing → stabilization

**Update:** Daily (status changes), weekly (summary)

---

### **Construction Timeline**

Track phases within development projects.

```json
{
  "project_id": "ALP-001",
  "phase": "framing_and_rough_in",
  "start_date": "2026-01-15",
  "end_date": "2026-04-30",
  "status": "in_progress",
  "percent_complete": 65
}
```

**Why separate:** One project has many phases. Track each phase progress.

**Update:** Weekly

---

### **Permits**

Track permitting status (zoning, building, etc.).

```json
{
  "project_id": "ALP-005",
  "permit_type": "zoning_variance",
  "permit_number": "ZV-2026-001",
  "status": "pending",
  "submitted_date": "2026-01-20",
  "decision_expected": "2026-03-15",
  "risk": "14 days delayed",
  "impact": "Construction start at risk"
}
```

**Statuses:** pending | active | expired | revoked

**Update:** Weekly (status updates), daily if critical

---

### **Inspections**

Track required inspections (structural, electrical, etc.).

```json
{
  "project_id": "ALP-001",
  "inspection_type": "structural_inspection",
  "scheduled_date": "2026-03-20",
  "status": "scheduled",
  "inspector": "Town of [X]",
  "previous_result": "passed"
}
```

**Statuses:** pending | scheduled | in_progress | passed | failed

**Update:** Weekly (schedule), daily (results)

---

## 📍 4. Milestones (Cross-Business)

Track all upcoming targets in one place.

```json
{
  "id": "milestone_001",
  "date": "2026-03-05",
  "business": "massdwell",
  "milestone": "MAS-001 design approval expected",
  "order_id": "MAS-001",
  "status": "pending",
  "criticality": "high"
}
```

**Why separate:** You need one calendar view of all milestones across all businesses.

**Status:** pending | complete | at_risk | missed

**Criticality:** critical | high | medium

**Update:** Real-time (add milestones, update status as they occur)

---

## 🚨 5. Blockers (Cross-Business)

Track all issues preventing progress with detailed mitigation.

```json
{
  "id": "blocker_001",
  "severity": "high",
  "business": "massdwell",
  "order_id": "MAS-002",
  "issue": "AAC blocks supplier delayed (4 days late)",
  "root_cause": "Supplier capacity constraint",
  "impact": "Materials delayed, MAS-002 delivery at risk 1 week",
  "affected_timeline": "Expected 2026-05-01 → Risk: 2026-05-08",
  "discovered_date": "2026-02-28",
  "mitigation_strategy": "Source alternate supplier for AAC blocks",
  "mitigation_status": "in_progress",
  "eta_resolution": "2026-03-08",
  "owner": "Supply Chain Manager",
  "escalation_level": "high"
}
```

**Key fields:**
- **severity:** How serious (critical = project at risk, high = significant impact, medium = manageable)
- **root_cause:** Why did this happen?
- **impact:** What's the damage if not fixed?
- **mitigation_strategy:** How are we fixing it?
- **mitigation_status:** pending | in_progress | resolved
- **eta_resolution:** When will it be fixed?
- **escalation_level:** Does Steve need to know?

**Update:** Real-time for critical, daily for high/medium

---

## ✅ 6. Task Assignments (Tied to Blockers)

Assign specific tasks to resolve blockers.

```json
{
  "id": "task_001",
  "blocker_id": "blocker_001",
  "task": "Contact alternate AAC suppliers for expedited quote",
  "assigned_to": "Supply Chain Manager",
  "due_date": "2026-03-05",
  "status": "in_progress",
  "priority": "critical"
}
```

**Why separate:** One blocker may require multiple tasks. Track them separately.

**Status:** pending | in_progress | complete

**Update:** Daily (progress), weekly (summary)

---

## ✋ 7. Approvals Queue (Pending Decisions)

Track requests needing Steve's approval.

### **Pending**

```json
{
  "id": "approval_001",
  "type": "scope_change",
  "business": "massdwell",
  "order_id": "MAS-003",
  "request": "Extend delivery date from 3/20 to 3/27 due to QA rework",
  "submitted_by": "ops_director",
  "submitted_date": "2026-03-02",
  "priority": "high",
  "approver": "steve",
  "notes": "Customer impact assessment needed"
}
```

**Types:** scope_change | supplier_change | inventory_reorder | timeline_adjustment | capacity_planning | other

**Approvers:** steve | finance_director | clawson

**Update:** Real-time (as requests arise)

---

### **History**

```json
{
  "id": "approval_approved_001",
  "type": "capacity_planning",
  "request": "Hire 2 additional manufacturing staff",
  "approved_by": "steve",
  "approved_date": "2026-02-15",
  "status": "approved",
  "implementation_status": "onboarding_in_progress"
}
```

**Why track:** Know what was approved, when, and implementation status.

**Status:** approved | rejected

**Implementation:** planned | in_progress | complete

---

## 📊 8. Summary

Consolidated health metrics.

```json
{
  "total_active_orders": 5,
  "orders_on_track": 4,
  "orders_at_risk": 1,
  "total_active_projects": 5,
  "projects_on_track": 4,
  "projects_delayed": 1,
  "total_blockers": 4,
  "critical_blockers": 3,
  "high_blockers": 3,
  "pending_approvals": 3,
  "operational_status": "⚠️ MONITOR - 3 critical blockers requiring attention"
}
```

**Why it matters:** Quick snapshot of operational health. One glance tells you everything.

**Update:** Daily

---

## 🔄 Interconnection Map

How the pieces connect:

```
OPERATIONS (projects, orders, schedule)
    ↓
MILESTONES (what needs to happen when)
    ↓
BLOCKERS (issues preventing milestones)
    ↓
TASK_ASSIGNMENTS (who fixes each blocker)
    ↓
APPROVALS_QUEUE (decisions needed to proceed)
    ↓
SUMMARY (overall health)
```

**Example flow:**
1. MassDwell order created (project)
2. Delivery date set (milestone)
3. Supplier delays materials (blocker)
4. Assign task to find alternate supplier (task)
5. Submit approval request to change delivery date (approval)
6. Steve approves or rejects (approval history)
7. Summary shows 1 blocker, 1 pending approval

---

## 🎯 Update Frequency (Quick Reference)

| Section | Frequency | What Changes |
|---------|-----------|--------------|
| Projects | Daily | Stage, days_in_stage, on_track status |
| Orders | Daily | Current status, shipping/delivery info |
| Inventory | Daily | units_in_stock (as orders ship) |
| Milestones | Real-time | Status as milestones hit |
| Blockers | Real-time (critical) | New blockers, mitigation_status, eta_resolution |
| Tasks | Daily | Task status, progress |
| Approvals | Real-time | New requests, approval decisions |
| Summary | Daily | Recalculate totals, health status |

---

## 🚨 Critical Patterns to Watch

### **Pattern 1: Project At-Risk**
→ Order on_track = false or days_in_stage > expected

**Action:** Check blockers. Is there a mitigation task assigned?

### **Pattern 2: Blocker Unresolved**
→ Blocker mitigation_status = "in_progress" AND eta_resolution < today

**Action:** Escalate. The blocker is overdue.

### **Pattern 3: Pending Approval Stale**
→ Approval submitted_date > 5 days ago AND status = "pending"

**Action:** Follow up with approver (Steve/Finance/Clawson).

### **Pattern 4: High Utilization**
→ massdwell.factory_output.utilization_pct > 90%

**Action:** Are you at risk of over-committing? Check backlog.

### **Pattern 5: Inventory Low**
→ atlantic_laser.inventory[model].status = "at_threshold"

**Action:** Reorder or risk stockout on next order.

---

## 💡 Using This Structure

### **For Daily Check (9 AM)**
1. Look at **summary** → operational_status
2. Look at **blockers** → any new critical ones?
3. Look at **task_assignments** → any overdue tasks?
4. Look at **approvals_queue.pending** → any decisions needed?

**Time:** 5 minutes

---

### **For Weekly Report (Friday 2 PM)**
1. Recalculate **summary** metrics
2. Review all **milestones** (which are complete? which at risk?)
3. Update **blocker** resolution progress
4. Summarize **task** completion rates
5. Report on **approvals** (what got approved? what's pending?)

**Time:** 30 minutes

---

### **For Monthly Snapshot (Month-end)**
1. Review all **projects** and **orders** (performance vs. plan)
2. Analyze **factory_output** and **inventory** metrics
3. Update **construction_timeline** and **permits** (Alpine)
4. Summarize **blockers** (what got resolved? what's new?)
5. Review **approvals_history** (decisions made, implementation)
6. Provide recommendations

**Time:** 60 minutes

---

## 📌 Template to Start

Use `OPS-STATE-TEMPLATE.json` to initialize a clean state. It has the correct structure with empty arrays/objects ready to populate.

---

_Last Updated: 2026-03-04_
