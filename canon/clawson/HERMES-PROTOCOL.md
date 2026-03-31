# Hermes Review Protocol

_This file governs how Clawson agents interact with the Hermes supervisor before shipping work._

---

## Pre-Send Gate: Items that REQUIRE Hermes review

Do NOT send these without an ACK from Hermes:

| Item | Command flag |
|------|-------------|
| Draft emails (before sending via gmail/himalaya) | `--type email_draft` |
| Social posts (before posting to X, Instagram, LinkedIn) | `--type post` |
| Significant decisions that affect live systems | `--type decision` |

---

## Audit Queue: Items that SHOULD be queued post-action

Queue these after the fact for Hermes to audit asynchronously:

| Item | Command flag |
|------|-------------|
| PRs opened or merged | `--type pr` |
| Cron job changes | `--type cron_output` |
| Config changes | `--type decision` |

---

## How to queue an item

```bash
node /Users/openclaw/.openclaw/workspace/scripts/hermes-queue-writer.js \
  --type email_draft \
  --summary "Email to prospect John Smith re: ADU quote follow-up" \
  --artifact-path /Users/openclaw/.openclaw/workspace/data/drafts/email-draft-xxx.md \
  --urgency medium
```

### To block until a decision (pre-send gate):
```bash
node /Users/openclaw/.openclaw/workspace/scripts/hermes-queue-writer.js \
  --type email_draft \
  --summary "Cold outreach to John Smith re Alpine ADU" \
  --artifact-path /Users/openclaw/.openclaw/workspace/data/drafts/email-john-smith.md \
  --urgency high \
  --wait
```

Exit codes when using `--wait`:
- `0` = ACK — clear to ship
- `2` = Timeout — Hermes did not respond in 5 minutes; escalate manually
- `3` = ESCALATED — wait for Steve's decision before proceeding

---

## Decision meaning

| Status | Meaning | Action |
|--------|---------|--------|
| `ack` | Hermes approved | Ship it |
| `escalated` | Needs human judgment | Wait for Steve's Telegram reply |

---

## Intent Markers

See `data/hermes/PROTOCOL.md` for the full 4-marker protocol:
- `STATUS_REQUEST` — ask Hermes to run its check now
- `REVIEW_REQUEST` — submit artifact for pre-send review
- `ESCALATION_NOTICE` — Hermes → Steve (Telegram alert)
- `ACK` — loop closes, do not reply

---

## Queue file

`/Users/openclaw/.openclaw/workspace/data/hermes/review-queue.jsonl`

Hermes processes this queue every 30 minutes (same cadence as hermes-ingest.js).
For urgent items, trigger manually:
```bash
node /Users/openclaw/.openclaw/workspace/scripts/hermes-reviewer.js
```

---

_Last updated: 2026-03-31_
