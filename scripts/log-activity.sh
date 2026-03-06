#!/bin/bash
# Log activity to Mission Control activity feed
# Usage: log-activity.sh <event_type> <source> <title> [description] [severity]

EVENT_TYPE="${1:-agent_action}"
SOURCE="${2:-system}"
TITLE="${3:-Activity logged}"
DESCRIPTION="${4:-}"
SEVERITY="${5:-info}"

SUPABASE_URL="https://cwnvvdxwwvrfxoudcaag.supabase.co"
SUPABASE_KEY="SUPABASE_SECRET_REDACTED"

curl -s -X POST "${SUPABASE_URL}/rest/v1/activity_feed" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"$EVENT_TYPE\",\"source\":\"$SOURCE\",\"title\":\"$TITLE\",\"description\":\"$DESCRIPTION\",\"severity\":\"$SEVERITY\"}" > /dev/null

echo "✓ Activity logged: $TITLE"
