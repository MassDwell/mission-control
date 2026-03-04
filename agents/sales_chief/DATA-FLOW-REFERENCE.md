# DATA-FLOW-REFERENCE.md — Sales Chief Object Lifecycle

This document explains how leads, deals, next actions, approvals, messages, and activities flow through Sales Chief's system.

---

## Core Objects (Summary)

| Object | Purpose | Lifecycle | Key Field |
|--------|---------|-----------|-----------|
| **Lead** | Inbound person/company | new → active → nurture/opted_out/closed | brand_mode |
| **Deal** | Qualified opportunity in pipeline | open → won/lost/nurture | pipeline_stage_id |
| **Next Action** | Task to move deal forward | todo → doing → waiting → done/canceled | due_at |
| **Approval Item** | Request awaiting Steve decision | pending → approved/rejected/expired | risk_level |
| **Message Draft** | Proposed outbound message | draft → queued_for_approval → sent/canceled | approval_id |
| **Activity Event** | Logged interaction/change | Created for every action | type |

---

## Object Relationships

```
LEAD (entry point)
  ↓
  └─→ DEAL (qualified opportunity)
       ├─→ NEXT_ACTION (what to do next)
       ├─→ APPROVAL_ITEM (if Level 1/2 decision needed)
       │    └─→ MESSAGE_DRAFT (message to send)
       └─→ ACTIVITY_EVENT (log of what happened)
```

---

## Complete Data Flow (Example: MassDwell Lead → Site Feasibility Visit)

### Step 1: Inbound Lead Arrives

**Input:** Email/SMS from prospect

**What happens:**
```json
{
  "type": "lead",
  "id": "lead_001",
  "brand_mode": "massdwell",
  "source": "inbound_form",
  "created_at": "2026-03-04T14:32:00Z",
  "status": "new",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+16175551234",
  "consent": {
    "sms_ok": true,
    "email_ok": true,
    "opted_out": false
  }
}
```

**Sales Chief action:** Move to md_incoming_leads stage (24h SLA)

---

### Step 2: Sales Chief Sends Inbound Response (T+0)

**Template used:** MassDwell Inbound First Response (pre-approved Level 0)

**What happens:**
```json
{
  "type": "message_draft",
  "id": "draft_001",
  "brand_mode": "massdwell",
  "status": "sent",
  "channel": "email",
  "to": {
    "name": "John Smith",
    "address": "john@example.com"
  },
  "body": "Got it — happy to help. Two quick questions: (1) what town is the property in? (2) are you aiming for rental income or family use?",
  "created_at": "2026-03-04T14:32:05Z",
  "related": {
    "lead_ref": "lead_001"
  }
}
```

**Activity logged:**
```json
{
  "type": "activity_event",
  "id": "event_001",
  "deal_ref": null,
  "timestamp": "2026-03-04T14:32:05Z",
  "type": "outbound_message",
  "summary": "Initial qualification message sent to John Smith",
  "meta": {
    "template": "massdwell_inbound_first_response",
    "channel": "email"
  }
}
```

**Next action created:**
```json
{
  "type": "next_action",
  "id": "action_001",
  "deal_ref": null,
  "title": "Follow-up bump if no reply to John Smith",
  "owner": "agent",
  "due_at": "2026-03-04T16:32:00Z",
  "status": "waiting"
}
```

---

### Step 3: Lead Replies (T+3h)

**Input:** Reply from John: "We're in Needham and want rental income"

**What happens:**
1. Inbound message detected
2. Lead status → active (reset cadence)
3. Activity logged
4. Next action: Sales Chief asks remaining 3 qual questions

**Activity logged:**
```json
{
  "type": "activity_event",
  "id": "event_002",
  "timestamp": "2026-03-04T17:42:00Z",
  "type": "inbound_message",
  "summary": "John Smith replied: confirmed Needham, rental income goal",
  "meta": {
    "from": "john@example.com",
    "channel": "email"
  }
}
```

**Next action updated:**
```json
{
  "type": "next_action",
  "id": "action_002",
  "title": "Ask remaining qual questions: timeline, lot context, budget",
  "owner": "agent",
  "due_at": "2026-03-04T18:00:00Z",
  "status": "todo"
}
```

---

### Step 4: Sales Chief Asks More Questions (T+4h)

**Custom message (not template):**

**Sales Chief creates draft:**
```json
{
  "type": "message_draft",
  "id": "draft_002",
  "brand_mode": "massdwell",
  "status": "draft",
  "channel": "email",
  "to": {
    "name": "John Smith",
    "address": "john@example.com"
  },
  "body": "Great! Needham is one of our hot markets for rentals. Three more quick questions: (1) When are you looking to build (this quarter, 6-12 months, or researching)? (2) What's the lot situation (single family, corner, slope, good access)? (3) Budget comfort range ($150-200K, $200-250K, $250K+)?",
  "created_at": "2026-03-04T18:15:00Z",
  "status": "queued_for_approval"
}
```

**Approval item created (Level 1: custom outbound):**
```json
{
  "type": "approval_item",
  "id": "approval_001",
  "type": "send_message",
  "risk_level": "level_1",
  "brand_mode": "massdwell",
  "summary": "Send custom qualification questions to John Smith (Needham rental)",
  "status": "pending",
  "created_at": "2026-03-04T18:15:00Z",
  "expires_at": "2026-03-05T18:15:00Z"
}
```

**Steve approves.** Message sent automatically.

---

### Step 5: Lead Becomes Qualified (T+24h)

**Lead replies with all answers:**
- Timeline: "6-12 months"
- Lot: "Single family, flat, good access"
- Budget: "$200-250K"

**Qualification complete. Create DEAL:**

```json
{
  "type": "deal",
  "id": "deal_001",
  "brand_mode": "massdwell",
  "lead_ref": "lead_001",
  "title": "John Smith - Needham ADU (Rental, $200-250K)",
  "value_amount": 225000,
  "currency": "USD",
  "pipeline_stage_id": "md_conversation_started",
  "stage_entered_at": "2026-03-05T10:00:00Z",
  "next_action_due_at": "2026-03-05T14:00:00Z",
  "owner": "steve",
  "status": "open",
  "qualification": {
    "massdwell": {
      "town_or_address": "Needham, MA",
      "goal_use_case": "Rental income",
      "timeline": "6-12 months",
      "lot_context": "Single family, flat, good access",
      "budget_range_comfort": "$200-250K"
    }
  }
}
```

**Activity logged:**
```json
{
  "type": "activity_event",
  "id": "event_003",
  "deal_ref": "deal_001",
  "timestamp": "2026-03-05T10:00:00Z",
  "type": "stage_change",
  "summary": "Lead qualified and moved to Conversation Started stage",
  "meta": {
    "from_stage": "md_welcome_email_sent",
    "to_stage": "md_conversation_started"
  }
}
```

---

### Step 6: Sales Chief Proposes Next Step (T+25h)

**Recommendation:** Book site feasibility visit

**Message draft created:**
```json
{
  "type": "message_draft",
  "id": "draft_003",
  "brand_mode": "massdwell",
  "status": "draft",
  "channel": "email",
  "to": {
    "name": "John Smith",
    "address": "john@example.com"
  },
  "body": "Perfect! You're in our sweet spot. Let's walk your property and show you what's possible. When works best for a 30-45 minute site visit? (Options: This Saturday morning, next Tuesday afternoon, next Thursday evening)",
  "created_at": "2026-03-05T11:00:00Z",
  "status": "queued_for_approval"
}
```

**Approval item (Level 1: booking):**
```json
{
  "type": "approval_item",
  "id": "approval_002",
  "type": "book_meeting",
  "risk_level": "level_1",
  "summary": "Propose site feasibility visit dates to John Smith",
  "status": "pending",
  "expires_at": "2026-03-06T11:00:00Z"
}
```

**Steve approves.** Message sent.

---

### Step 7: Lead Books Visit (T+26h)

**Lead replies:** "Saturday morning works!"

**Next action created:**
```json
{
  "type": "next_action",
  "id": "action_003",
  "deal_ref": "deal_001",
  "title": "Site feasibility visit with John Smith - Saturday 10 AM",
  "owner": "steve",
  "due_at": "2026-03-08T10:00:00Z",
  "status": "waiting"
}
```

**Deal stage updated:**
```json
{
  "pipeline_stage_id": "md_site_feasibility_booked",
  "stage_entered_at": "2026-03-05T12:15:00Z",
  "next_action_due_at": "2026-03-08T10:00:00Z"
}
```

**Activity logged:**
```json
{
  "type": "activity_event",
  "id": "event_004",
  "deal_ref": "deal_001",
  "timestamp": "2026-03-05T12:15:00Z",
  "type": "stage_change",
  "summary": "Site visit booked for Saturday 3/8 @ 10 AM",
  "meta": {
    "to_stage": "md_site_feasibility_booked"
  }
}
```

---

### Step 8: Site Visit Completed (T+3d)

**Event:** Steve completes site visit, generates numbers

**Next action completed:**
```json
{
  "id": "action_003",
  "status": "done"
}
```

**New next action created:**
```json
{
  "id": "action_004",
  "title": "Send offer to John Smith (Needham, $225K, 12 weeks post-approval)",
  "owner": "steve",
  "due_at": "2026-03-09T14:00:00Z",
  "status": "todo"
}
```

**Deal stage updated:**
```json
{
  "pipeline_stage_id": "md_site_feasibility_completed",
  "stage_entered_at": "2026-03-08T11:30:00Z"
}
```

**Activity logged:**
```json
{
  "type": "activity_event",
  "id": "event_005",
  "deal_ref": "deal_001",
  "timestamp": "2026-03-08T11:30:00Z",
  "type": "meeting",
  "summary": "Site feasibility visit completed. Numbers: $225K, 12 weeks post-approval",
  "meta": {
    "location": "Needham property",
    "notes": "Excellent lot, no major constraints identified"
  }
}
```

---

### Step 9: Offer Sent (T+4d)

**Steve sends offer:**

```json
{
  "type": "message_draft",
  "id": "draft_004",
  "status": "sent",
  "channel": "email",
  "body": "Based on Saturday's walk-through, here's what we can build on your lot: [pricing/timeline/specs]. Next step: we'll submit permitting...",
  "created_at": "2026-03-09T14:00:00Z"
}
```

**Deal stage updated:**
```json
{
  "pipeline_stage_id": "md_negotiation_decision",
  "stage_entered_at": "2026-03-09T14:05:00Z",
  "next_action_due_at": "2026-03-16T10:00:00Z"
}
```

**Activity logged:**
```json
{
  "type": "activity_event",
  "id": "event_006",
  "deal_ref": "deal_001",
  "timestamp": "2026-03-09T14:05:00Z",
  "type": "outbound_message",
  "summary": "Offer sent to John Smith: $225K, 12 weeks post-approval",
  "meta": {
    "value": 225000
  }
}
```

**Next action (await decision):**
```json
{
  "id": "action_005",
  "title": "Follow-up: Has John decided? Any questions on offer?",
  "owner": "steve",
  "due_at": "2026-03-16T10:00:00Z",
  "status": "waiting"
}
```

---

### Step 10: Deal Won (T+7d)

**John replies:** "Looks great! Let's move forward."

**Deal status → won:**
```json
{
  "type": "deal",
  "id": "deal_001",
  "status": "won",
  "pipeline_stage_id": "md_contract_signed_deposit",
  "stage_entered_at": "2026-03-16T09:30:00Z"
}
```

**Activity logged:**
```json
{
  "type": "activity_event",
  "id": "event_007",
  "deal_ref": "deal_001",
  "timestamp": "2026-03-16T09:30:00Z",
  "type": "stage_change",
  "summary": "DEAL WON: John Smith - Needham ADU $225K",
  "meta": {
    "value": 225000,
    "to_stage": "md_contract_signed_deposit"
  }
}
```

**Next action (handoff to ops):**
```json
{
  "id": "action_006",
  "title": "Handoff to operations: John Smith, 225K, 12 weeks post-approval",
  "owner": "other",
  "due_at": "2026-03-17T09:00:00Z",
  "status": "todo"
}
```

---

## State Tracking Summary

**What Sales Chief maintains in real-time:**

```json
{
  "state": {
    "leads": [... all leads ...],
    "deals": [... all open/won/lost deals ...],
    "next_actions": {
      "todo": [... 47 items ...],
      "doing": [... 8 items ...],
      "waiting": [... 23 items ...],
      "done": [... 156 items (archived) ...],
      "canceled": [... 12 items ...] 
    },
    "approvals_queue": {
      "pending": [... 3 awaiting Steve ...],
      "history": [... 89 resolved ...] 
    },
    "message_outbox": {
      "drafts": [... 5 pending review ...],
      "send_history": [... 267 sent ...] 
    },
    "activity_log": [... 2,341 events ...] 
  }
}
```

---

## Reporting from Objects

### Weekly Sales Report (pulls from state)

```
DEALS BY STAGE:
  md_incoming_leads: 8 deals
  md_conversation_started: 12 deals ($2.1M pipeline)
  md_site_feasibility_booked: 3 visits scheduled
  md_negotiation_decision: 1 deal ($225K)
  md_contract_signed_deposit: 0
  md_closed_won: 1 deal ($225K) ← from deal.status = won

NEXT_ACTIONS DUE THIS WEEK:
  todo: 12
  doing: 3
  waiting: 5

APPROVALS PENDING:
  Level 1: 2 (expires in <24h)
  Level 2: 0

ACTIVITY SUMMARY:
  Inbound messages: 23
  Outbound messages: 18
  Meetings: 3
  Stage changes: 4
```

---

## Key Principles

**1. Single Source of Truth**
- Deal is the central object
- Everything else references deal_ref
- Activity log is immutable audit trail

**2. Atomic Actions**
- Every action creates an activity event
- Every event is logged with timestamp
- Decisions are frozen in approval_items

**3. Async Workflow**
- Draft → Approval → Send (3 separate states)
- No approval item = it's not sent
- Expired approvals are historical only

**4. Traceability**
- Every deal has complete activity_log
- Can replay entire deal lifecycle
- No hidden decisions or actions

---

**Last Updated:** 2026-03-04  
**Status:** Complete data flow reference for Sales Chief operations
