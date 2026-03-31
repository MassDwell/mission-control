# Hermes Intent Marker Protocol

_4-marker coordination system between Clawson agents and Hermes supervisor._

---

## Markers

### STATUS_REQUEST
**Direction:** Clawson → Hermes
**Meaning:** "Please run your check now."
**Use when:** Agent wants an immediate ingest/hygiene cycle rather than waiting for the next cron tick.
**Format in event-bus:**
```json
{ "source": "clawson", "type": "STATUS_REQUEST", "status": "request", "detail": "run hermes check now" }
```

---

### REVIEW_REQUEST
**Direction:** Clawson → Hermes
**Meaning:** "Please review this artifact before it ships."
**Use when:** An agent has prepared output (email draft, post, decision, PR) and needs sign-off before sending.
**Mechanism:** Write item to `data/hermes/review-queue.jsonl` via `hermes-queue-writer.js`.
**Format in event-bus:**
```json
{ "source": "clawson", "type": "REVIEW_REQUEST", "status": "pending", "detail": "email draft for John Smith re ADU quote", "data": { "review_id": "rev_..." } }
```

---

### ESCALATION_NOTICE
**Direction:** Hermes → Steve (operator)
**Meaning:** "Human judgment needed — I cannot auto-approve this."
**Use when:** Reviewer detects a problem that exceeds its confidence, or the item is flagged as high-risk.
**Mechanism:** `openclaw system event` Telegram alert + queue item status set to `escalated`.
**Format in event-bus:**
```json
{ "source": "hermes-reviewer", "type": "ESCALATION_NOTICE", "status": "escalated", "detail": "email draft contains unverified figure $42k — needs human review", "data": { "review_id": "rev_...", "artifact_path": "..." } }
```

---

### ACK
**Direction:** Either party → the other
**Meaning:** "Acknowledged. Loop closes. Do not reply."
**Use when:** Hermes approves an item (ACK to Clawson), or Steve responds approve/reject to an escalation (ACK to Hermes).
**Mechanism:** Queue item status set to `ack`. No further action on this item.
**Format in event-bus:**
```json
{ "source": "hermes-reviewer", "type": "ACK", "status": "ack", "detail": "email draft approved — tone and facts verified", "data": { "review_id": "rev_..." } }
```

---

## Review Queue States

```
pending → ack        (Hermes auto-approved)
pending → escalated  (Hermes escalated to Steve)
```

Once an item is `ack` or `escalated`, it is closed. The originating agent reads the decision and either ships (ack) or waits (escalated).

---

## Queue File

`data/hermes/review-queue.jsonl` — append-only JSONL, one item per line.
Hermes updates items in-place (rewrites the file with updated status fields).

---

## Review Types

| type | Pre-send gate? | What Hermes checks |
|------|---------------|-------------------|
| `email_draft` | YES — block until ACK | Recipient valid, no hallucinated figures, appropriate tone, not on DNC list |
| `post` | YES — block until ACK | Factually grounded, not repetitive vs last 5 posts, brand voice |
| `decision` | YES — block until ACK | Evidence supports decision, no obvious gaps |
| `pr` | Recommended | Prisma/migration changes present? Breaking change risk? |
| `cron_output` | No (post-run audit) | Expected output present, no error signatures, data looks fresh |

---

_Last updated: 2026-03-31_
