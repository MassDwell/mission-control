# CR-008: Mission Control Phase 2 — API Specification

**Version:** 1.0  
**Status:** APPROVED & COMPLETE  
**Date:** 2026-03-04  
**Author:** Codesmith  

---

## Overview

CR-008 adds three new REST API endpoints to Mission Control UI to enable interactive decision-making while maintaining two-step commit architecture (UI queues → Clawson validates/executes).

**Binding:** Localhost only (security)  
**Port:** 3000 (default)  
**Protocol:** HTTP/JSON  
**Auth:** Token-based (X-MC-TOKEN header)

---

## Endpoint: GET /api/decisions

**Purpose:** Fetch all pending decisions, queue status, and log entries  
**Method:** GET  
**Auth:** None required (read-only)  
**Response Time:** <100ms  

### Request

```http
GET /api/decisions HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```

### Response (200 OK)

```json
{
  "timestamp": "2026-03-04T20:04:00Z",
  "decisions": [
    {
      "decision_id": "dec_ws_001_ph2",
      "type": "workstream_approval",
      "source_agent": "codesmith",
      "title": "Approve Mission Control Phase 2 Build",
      "description": "Codesmith has completed CR-008...",
      "impact": "Once approved, Phase 2 deployment will proceed...",
      "recommended_action": "approve",
      "created_at": "2026-03-04T20:04:00Z",
      "urgency": "high",
      "linked_item": {
        "type": "workstream",
        "id": "ws_005"
      }
    }
  ],
  "queue": [
    {
      "action_id": "uuid-1234",
      "decision_id": "dec_ws_001_ph2",
      "action": "approve",
      "requested_by": "steve",
      "requested_at": "2026-03-04T20:05:00Z",
      "source": "mission_control_ui",
      "note": null,
      "status": "queued",
      "result": null,
      "completed_at": null,
      "error": null
    }
  ],
  "log": [
    {
      "log_id": "uuid-5678",
      "action_id": "uuid-1234",
      "decision_id": "dec_ws_001_ph2",
      "action": "approve",
      "requested_by": "steve",
      "requested_at": "2026-03-04T20:05:00Z",
      "completed_at": "2026-03-04T20:06:00Z",
      "status": "completed",
      "result": "Decision approved: ws_005 moved to experiment stage",
      "error": null,
      "executed_by": "clawson_processor",
      "system_changes": [
        {
          "file": "workstreams.json",
          "operation": "move_workstream_stage",
          "before": { "stage": "implementation" },
          "after": { "stage": "experiment" }
        }
      ]
    }
  ]
}
```

### Error Response

```json
{
  "error": "Unable to load decisions",
  "timestamp": "2026-03-04T20:04:00Z"
}
```

---

## Endpoint: POST /api/decisions/action

**Purpose:** Queue a decision action (approve/reject/review) for processing by Clawson  
**Method:** POST  
**Auth:** Required (X-MC-TOKEN header)  
**Response Time:** <100ms (async processing)  
**Response Code:** 202 Accepted (not 200 OK, action is queued, not executed)  

### Request

```http
POST /api/decisions/action HTTP/1.1
Host: localhost:3000
Content-Type: application/json
X-MC-TOKEN: local_dev_token_12345

{
  "decision_id": "dec_ws_001_ph2",
  "action": "approve",
  "note": "optional explanation",
  "requested_by": "steve"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision_id` | string (UUID) | Yes | Must exist in decisions_required.json |
| `action` | enum | Yes | One of: `approve`, `reject`, `review` |
| `note` | string | No | Optional explanation for audit trail |
| `requested_by` | string | No | Defaults to "steve" |

### Response (202 Accepted)

**Status:** 202 Accepted  
**Meaning:** Action has been queued for processing. NOT executed yet.

```json
{
  "status": "queued",
  "action_id": "550e8400-e29b-41d4-a716-446655440000",
  "decision_id": "dec_ws_001_ph2",
  "queued_at": "2026-03-04T20:05:00Z",
  "message": "Decision action queued for processing by Clawson"
}
```

### Error Response (401 Unauthorized)

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "status": "error",
  "error": "invalid_token",
  "message": "Missing or invalid X-MC-TOKEN header"
}
```

### Error Response (400 Bad Request)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "status": "error",
  "error": "missing_fields",
  "message": "Required: decision_id, action"
}
```

or

```json
{
  "status": "error",
  "error": "invalid_action",
  "message": "Action must be: review, approve, or reject"
}
```

### Error Response (404 Not Found)

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "status": "error",
  "error": "decision_not_found",
  "message": "Decision dec_nonexistent not found in decisions_required.json"
}
```

### Error Response (500 Server Error)

```json
{
  "status": "error",
  "error": "queue_failed",
  "message": "Failed to queue action: permission denied"
}
```

---

## Data Files

### decisions_required.json

**Location:** `data/mission-control/decisions_required.json`  
**Schema:** Read by UI, populated by agents

```json
{
  "schema_version": "1.0",
  "timestamp": "2026-03-04T20:04:00Z",
  "decisions": [
    {
      "decision_id": "unique-uuid",
      "type": "workstream_approval | blocker_clearance | venture_approval",
      "source_agent": "codesmith | moonshot | personal-assistant",
      "title": "Human-readable title",
      "description": "Detailed description of the decision",
      "impact": "What changes if approved",
      "recommended_action": "review | approve | reject",
      "created_at": "ISO-8601",
      "urgency": "low | medium | high",
      "linked_item": {
        "type": "workstream | blocker | venture",
        "id": "item-id"
      }
    }
  ]
}
```

### decision_actions_queue.json

**Location:** `data/mission-control/decision_actions_queue.json`  
**Properties:** Append-only, never delete  
**Populated by:** POST /api/decisions/action  
**Consumed by:** Clawson processor

```json
{
  "schema_version": "1.0",
  "created_at": "2026-03-04T20:04:00Z",
  "items": [
    {
      "action_id": "unique-uuid",
      "decision_id": "unique-uuid",
      "action": "approve | reject | review",
      "requested_by": "steve",
      "requested_at": "ISO-8601",
      "source": "mission_control_ui",
      "note": "optional string or null",
      "status": "queued | processing | completed | failed",
      "result": "null or outcome string",
      "completed_at": "ISO-8601 or null",
      "error": "null or error message"
    }
  ]
}
```

**Status Transitions:**
- `queued` → `processing` → `completed` or `failed`
- Once status != "queued", item is immutable
- Max 1000 items (older archived)

### decision_actions_log.json

**Location:** `data/mission-control/decision_actions_log.json`  
**Properties:** Immutable, write-once  
**Populated by:** Clawson processor  
**Consumed by:** UI for feedback, compliance audit

```json
{
  "schema_version": "1.0",
  "created_at": "2026-03-04T20:04:00Z",
  "entries": [
    {
      "log_id": "unique-uuid",
      "action_id": "unique-uuid",
      "decision_id": "unique-uuid",
      "action": "approve | reject | review",
      "requested_by": "steve",
      "requested_at": "ISO-8601",
      "completed_at": "ISO-8601",
      "status": "completed | failed",
      "result": "string (what changed)",
      "error": "null or error message",
      "executed_by": "clawson_processor",
      "system_changes": [
        {
          "file": "path/to/file.json",
          "operation": "move_workstream_stage | clear_blocker | update_venture_stage",
          "before": { "...snapshot..." },
          "after": { "...snapshot..." }
        }
      ]
    }
  ]
}
```

**Immutability Rule:** Log entries are never deleted or modified. Only appended.

---

## Security

### Token Authentication

All write operations require `X-MC-TOKEN` header:

```javascript
const MC_DECISION_TOKEN = process.env.MC_DECISION_TOKEN || 'local_dev_token_12345';

// Server validates:
if (!req.headers['x-mc-token'] || req.headers['x-mc-token'] !== MC_DECISION_TOKEN) {
  return res.status(401).json({ error: 'invalid_token' });
}
```

**Token Storage:**
- Production: `MC_DECISION_TOKEN` environment variable
- Development: Default hardcoded for local testing
- NOT stored in canon/ or any tracked file

### Localhost-Only Binding

Server binds to localhost to prevent external access:

```javascript
const server = app.listen(PORT, 'localhost', () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
```

Only local clients can connect. External requests rejected at TCP level.

---

## Two-Step Commit Architecture

### Flow

```
1. UI → POST /api/decisions/action
   (Queue the action, don't execute)
   ↓
2. Response: 202 Accepted + action_id
   (Action queued, not executed yet)
   ↓
3. Clawson Processor polls queue every 60s
   (Validates, executes safely)
   ↓
4. Log entry written (immutable audit trail)
   (Full before/after snapshot)
   ↓
5. Queue item status updated (queued → completed/failed)
   (Immutable once updated)
   ↓
6. UI polls log + queue for status
   (Shows: ⏳ Queued → ✓ Completed or ✗ Failed)
```

### Why Two-Step?

1. **Safety:** UI doesn't have execute permissions
2. **Validation:** Clawson validates before executing
3. **Auditability:** Full trail in immutable log
4. **Reversibility:** Before/after snapshots enable rollback
5. **No Race Conditions:** Queue is append-only, processor is single-threaded

---

## Allowed Operations

Clawson processor can ONLY execute these operations:

### workstream_approval
- Move stage: `implementation` → `experiment`
- Move stage: `experiment` → `complete`
- Update status field

### blocker_clearance
- Remove from `blocked_work.json`
- Mark as resolved

### venture_approval
- Advance pipeline stage (Opportunity → Qualified → ... → Closed)
- Update venture_work_links

### Forbidden Operations
- ❌ Create new agents
- ❌ Modify cron jobs
- ❌ Change registry.json
- ❌ Delete any file
- ❌ Modify canon/ directory
- ❌ Change permissions

---

## Validation Rules

Before executing any action, processor validates:

1. ✅ Decision exists in decisions_required.json
2. ✅ Action is one of: approve, reject, review
3. ✅ Linked item exists and can be modified
4. ✅ Operation is in allowed list
5. ✅ No concurrent modifications
6. ✅ Change is reversible
7. ✅ No system governance violations

If ANY validation fails:
- Action marked as "failed"
- Error logged with full context
- Processor continues to next action (doesn't crash)
- Requires manual review/retry

---

## Usage Examples

### Example 1: Approve Workstream

```bash
curl -X POST http://localhost:3000/api/decisions/action \
  -H "X-MC-TOKEN: local_dev_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "decision_id": "dec_ws_001_ph2",
    "action": "approve",
    "requested_by": "steve"
  }'

# Response:
# {
#   "status": "queued",
#   "action_id": "550e8400-e29b-41d4-a716-446655440000",
#   "queued_at": "2026-03-04T20:05:00Z"
# }
```

### Example 2: Get Decision Status

```bash
curl http://localhost:3000/api/decisions | jq '.log[-1]'

# Shows:
# {
#   "log_id": "...",
#   "action_id": "550e8400-e29b-41d4-a716-446655440000",
#   "status": "completed",
#   "result": "Workstream ws_005 moved to experiment stage"
# }
```

### Example 3: Reject Decision

```bash
curl -X POST http://localhost:3000/api/decisions/action \
  -H "X-MC-TOKEN: local_dev_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "decision_id": "dec_blocker_001",
    "action": "reject",
    "note": "Not ready yet, needs more documentation"
  }'
```

---

## Rate Limiting

Currently: No rate limiting (localhost-only, trusted client)

Future: Could add:
- Max 100 requests/minute per token
- Max 1000 queued items
- Max 5000 log entries

---

## Monitoring & Alerts

Monitor these metrics:

```javascript
// Queue health
- queue.items.length > 100 → Alert: Queue backlog
- queue.items.filter(q => q.status === 'queued').length > 10 → Warn

// Processor health
- action processing time > 5s → Slow action
- failure rate > 10% → Processor errors

// System health
- log.entries.length > 5000 → Archive old entries
- queue.items.length > 1000 → Archive old items
```

---

## Testing

### Unit Tests

```bash
node test-cr008.js
# 7 tests covering: schema validation, data loading, queue append
```

### Integration Tests

```bash
node test-cr008-integration.js
# 10 tests covering: full flow from POST to queue to log
```

### Manual Testing

```bash
# 1. Start server
npm start

# 2. Query decisions
curl http://localhost:3000/api/decisions | jq

# 3. Queue an action
curl -X POST http://localhost:3000/api/decisions/action \
  -H "X-MC-TOKEN: local_dev_token_12345" \
  -H "Content-Type: application/json" \
  -d '{"decision_id": "dec_ws_001_ph2", "action": "approve"}'

# 4. Check queue
curl http://localhost:3000/api/decisions | jq '.queue'

# 5. Check log (after Clawson processor runs)
curl http://localhost:3000/api/decisions | jq '.log'
```

---

## Troubleshooting

### "invalid_token" Error

**Cause:** Wrong token or missing X-MC-TOKEN header  
**Fix:** Ensure header is set to `MC_DECISION_TOKEN` value

```bash
# Wrong:
curl http://localhost:3000/api/decisions/action

# Right:
curl -H "X-MC-TOKEN: local_dev_token_12345" \
  http://localhost:3000/api/decisions/action
```

### "decision_not_found" Error

**Cause:** decision_id doesn't exist in decisions_required.json  
**Fix:** Check decision_id is spelled correctly, file exists

```bash
# Check decisions
curl http://localhost:3000/api/decisions | jq '.decisions[].decision_id'
```

### Action Queued but Not Processed

**Cause:** Clawson processor hasn't run yet (runs every 60s)  
**Fix:** Wait 60+ seconds, then check log

```bash
# Check queue status
curl http://localhost:3000/api/decisions | jq '.queue[-1].status'

# Wait, then check log
sleep 65
curl http://localhost:3000/api/decisions | jq '.log[-1]'
```

### "queue_failed" Error

**Cause:** File system permission issue  
**Fix:** Check permissions on data/mission-control/ directory

```bash
ls -la data/mission-control/
chmod 755 data/mission-control/
```

---

## Backward Compatibility

- All existing endpoints preserved
- No breaking changes to /api/status, /api/activity-feed, /api/health
- New endpoints are additive only
- Safe to deploy alongside Phase 1

---

## Versioning

**API Version:** 1.0  
**Release Date:** 2026-03-04  
**Deprecation Policy:** None (v1 is stable)  

Future versions may add:
- Rate limiting
- Bulk decision actions
- Decision history/timeline
- Decision templates

---

**Document Status:** COMPLETE & APPROVED ✓
