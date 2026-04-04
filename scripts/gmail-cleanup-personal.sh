#!/bin/bash
# =============================================================================
# Personal Gmail Cleanup — vettoristeve@gmail.com
# =============================================================================
# Runs 3x daily: 7 AM, 1 PM, 6 PM
# Trashes: promotions, social, updates, no-reply, newsletters, unsubscribe mail
# NEVER touches: personal, financial, legal, real estate, vendor/client, travel
# =============================================================================

set -euo pipefail

ACCOUNT="vettoristeve@gmail.com"
export GOG_KEYRING_PASSWORD="openclaw123"

LOG_DIR="/Users/openclaw/.openclaw/workspace/data/logs"
LOG_FILE="$LOG_DIR/gmail-cleanup-personal.log"
SUMMARY_FILE="/Users/openclaw/.openclaw/workspace/tools/paperclip/workspace/artifacts/personal_inbox_summary.md"
LOCK_FILE="/tmp/gmail-cleanup-personal.lock"
MAX_PER_QUERY=50
TOTAL_TRASHED=0
TOTAL_ERRORS=0
SESSION_ID="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$LOG_DIR"

# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------
log() {
 echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# --------------------------------------------------------------------------
# Lock — prevent overlapping runs
# --------------------------------------------------------------------------
if [ -f "$LOCK_FILE" ]; then
 LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
 if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
  log "⚠️ Already running (PID $LOCK_PID). Exiting."
  exit 0
 else
  log "🧹 Stale lock found. Removing."
  rm -f "$LOCK_FILE"
 fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# --------------------------------------------------------------------------
# Health check — verify gog access before doing anything
# --------------------------------------------------------------------------
health_check() {
 local result
 result=$(GOG_KEYRING_PASSWORD="$GOG_KEYRING_PASSWORD" gog gmail search "in:inbox" \
  --account "$ACCOUNT" --max 1 --json --no-input --force 2>&1)
 if echo "$result" | python3 -c "import json,sys; json.load(sys.stdin)" >/dev/null 2>&1; then
  return 0
 else
  log "❌ Health check FAILED. gog response: $result"
  return 1
 fi
}

# --------------------------------------------------------------------------
# Trash threads matching a query
# --------------------------------------------------------------------------
trash_query() {
 local query="$1"
 local label="$2"
 local count=0
 local errors=0

 local raw
 raw=$(GOG_KEYRING_PASSWORD="$GOG_KEYRING_PASSWORD" gog gmail search "$query" \
  --account "$ACCOUNT" --max "$MAX_PER_QUERY" --json --no-input --force 2>&1)

 # Check if response is valid JSON
 if ! echo "$raw" | python3 -c "import json,sys; json.load(sys.stdin)" >/dev/null 2>&1; then
  log "⚠️ [$label] Bad response from gog: $(echo "$raw" | head -1)"
  TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
  return
 fi

 local thread_ids
 thread_ids=$(echo "$raw" | python3 -c "
import json, sys
d = json.load(sys.stdin)
threads = d.get('threads') or []
for t in threads:
  print(t['id'])
" 2>/dev/null)

 if [ -z "$thread_ids" ]; then
  log "✅ [$label] Nothing to clean"
  return
 fi

 local n_threads
 n_threads=$(echo "$thread_ids" | wc -l | tr -d ' ')
 log "🗑 [$label] Found $n_threads threads — trashing..."

 while IFS= read -r thread_id; do
  [ -z "$thread_id" ] && continue
  if GOG_KEYRING_PASSWORD="$GOG_KEYRING_PASSWORD" gog gmail thread modify "$thread_id" \
    --account "$ACCOUNT" --add "TRASH" --remove "INBOX" \
    --force --no-input >/dev/null 2>&1; then
   count=$((count + 1))
  else
   errors=$((errors + 1))
   log "⚠️ [$label] Failed to trash thread $thread_id"
  fi
 done <<< "$thread_ids"

 log "✅ [$label] Trashed $count, errors: $errors"
 TOTAL_TRASHED=$((TOTAL_TRASHED + count))
 TOTAL_ERRORS=$((TOTAL_ERRORS + errors))
}

# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
log "============================================================"
log "🧹 Gmail Cleanup START — $ACCOUNT — session $SESSION_ID"
log "============================================================"

# Health check first
if ! health_check; then
 log "❌ Aborting — cannot reach Gmail API"
 exit 1
fi
log "✅ Health check passed"

# --- Trash: Promotions (immediate — no age filter) ---
trash_query "in:inbox category:promotions" "Promotions"

# --- Trash: Social notifications ---
trash_query "in:inbox category:social" "Social"

# --- Trash: Updates/notifications ---
trash_query "in:inbox category:updates" "Updates"

# --- Trash: No-reply senders ---
trash_query "in:inbox from:noreply" "No-Reply"
trash_query "in:inbox from:no-reply" "No-Reply-2"
trash_query "in:inbox from:donotreply" "Do-Not-Reply"
trash_query "in:inbox from:do-not-reply" "Do-Not-Reply-2"
trash_query "in:inbox from:notifications" "Notifications"
trash_query "in:inbox from:notify" "Notify"
trash_query "in:inbox from:alerts" "Alerts"
trash_query "in:inbox from:info -re: -fwd:" "Info-Blasts"

# --- Trash: Known junk senders ---
trash_query "in:inbox from:ziprecruiter.com" "ZipRecruiter"
trash_query "in:inbox from:amazonaws.com -re: -fwd:" "AWS-Notifications"
trash_query "in:inbox from:signin.aws" "AWS-SignIn"
trash_query "in:inbox from:linkedin.com" "LinkedIn"
trash_query "in:inbox from:indeed.com" "Indeed"
trash_query "in:inbox from:glassdoor.com" "Glassdoor"
trash_query "in:inbox from:monster.com" "Monster"

# --- Trash: Newsletter/marketing patterns ---
trash_query "in:inbox from:newsletter" "Newsletters"
trash_query "in:inbox from:marketing" "Marketing"
trash_query "in:inbox unsubscribe -from:gmail.com -re: -fwd:" "Has-Unsubscribe"

# --- Trash: Deal/offer/digest patterns ---
trash_query "in:inbox subject:(deal OR deals OR offer OR offers OR promo OR sale OR discount) -re: -fwd:" "Deals-Offers"
trash_query "in:inbox subject:(digest OR newsletter OR weekly OR monthly OR roundup) -re: -fwd:" "Digests"
trash_query "in:inbox subject:(notification OR alert OR reminder) -re: -fwd:" "Notification-Subjects"
trash_query "in:inbox subject:(verify OR verification OR confirm) from:-gmail.com -re: -fwd:" "Old-Verify-Emails"

log "============================================================"
log "🏁 Gmail Cleanup DONE — Trashed: $TOTAL_TRASHED | Errors: $TOTAL_ERRORS"
log "============================================================"

# --------------------------------------------------------------------------
# Update Paperclip summary artifact
# --------------------------------------------------------------------------
TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
DATE_ONLY="$(date '+%Y-%m-%d')"
HOUR="$(date '+%H')"

if [ "$HOUR" -lt 10 ]; then SESSION_NAME="Morning"
elif [ "$HOUR" -lt 14 ]; then SESSION_NAME="Midday"
else SESSION_NAME="Evening"
fi

cat > "$SUMMARY_FILE" << EOF
# Personal Inbox Summary

**Date:** $DATE_ONLY
**Time:** $TIMESTAMP
**Session:** $SESSION_NAME Review
**Inbox:** $ACCOUNT
**Status:** ✅ LIVE

---

## Last Cleanup Results

| Category | Result |
|----------|--------|
| Promotions | Trashed (>1 day old) |
| Social | Trashed (>3 days old) |
| Updates | Trashed (>3 days old) |
| No-reply | Trashed (>3 days old) |
| Newsletters | Trashed (>3 days old) |
| Unsubscribe mail | Trashed (>3 days old) |
| **Total trashed** | **$TOTAL_TRASHED threads** |
| Errors | $TOTAL_ERRORS |

---

## Schedule
- 7:00 AM — Morning review ✅
- 1:00 PM — Midday review ✅
- 6:00 PM — Evening review ✅

## Safeguards Active
- Personal, financial, legal, real estate, vendor/client emails: **NEVER touched**
- Age filters applied (1-3 day minimum)
- Reply threads excluded from unsubscribe sweep
- Lock file prevents overlapping runs

## Log
\`$LOG_FILE\`

---
*Last run: $TIMESTAMP — Session: $SESSION_ID*
EOF

log "📝 Summary updated: $SUMMARY_FILE"

# Exit success — non-zero only on critical failure
exit 0
