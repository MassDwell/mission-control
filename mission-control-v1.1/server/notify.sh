#!/bin/bash
# Quick helper to notify Mission Control of events
# Usage: ./notify.sh "type" "icon" "message" "detail"

TYPE="${1:-tool}"
ICON="${2:-🔧}"
MESSAGE="${3:-Event}"
DETAIL="${4:-}"

curl -s -X POST http://localhost:8084/event \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"$TYPE\",\"icon\":\"$ICON\",\"message\":\"$MESSAGE\",\"detail\":\"$DETAIL\"}" > /dev/null
