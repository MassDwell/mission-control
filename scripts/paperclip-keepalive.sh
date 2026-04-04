#!/usr/bin/env zsh
# Paperclip stack keepalive — checks API health before restarting anything
# PATCHED 2026-03-29: Added lockfile to prevent duplicate dev-runner spawning

API_URL="http://127.0.0.1:3100"
LOG_DIR="$HOME/.openclaw/workspace/data/logs"
PAPERCLIP_DIR="$HOME/.openclaw/workspace/tools/paperclip"
LOCKFILE="/tmp/paperclip-keepalive.lock"

# Prevent concurrent keepalive runs
if [ -f "$LOCKFILE" ]; then
  LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null)
  if kill -0 "$LOCK_PID" 2>/dev/null; then
    echo "[keepalive] Already running (PID $LOCK_PID), skipping"
    exit 0
  fi
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

# 1) Check if API is up; if not, restart dev-runner
if ! curl -sf --max-time 5 "$API_URL/api/health" > /dev/null 2>&1; then
  # Only restart if no dev-runner already starting
  if ! pgrep -f 'dev-runner.mjs' > /dev/null; then
    echo "[keepalive] API down and no runner found — starting dev-runner"
    nohup node "$PAPERCLIP_DIR/scripts/dev-runner.mjs" dev >> "$LOG_DIR/paperclip.log" 2>&1 &
    sleep 8
  else
    echo "[keepalive] API down but runner exists — waiting for startup"
    sleep 5
  fi
else
  echo "[keepalive] API healthy"
fi

# 2) Adapter — check if process is running
if ! pgrep -f 'telegram-paperclip-adapter' > /dev/null; then
  echo "[keepalive] Adapter down — restarting"
  TELEGRAM_BOT_TOKEN=8401174291:AAGSZzpjiNgm8N_CuuI5MZpok2Y-6DMJwMQ \
  TELEGRAM_ALLOWED_USER_ID=7002178651 \
  PAPERCLIP_API_URL="$API_URL" \
  PAPERCLIP_COMPANY_ID=6e53f2a5-1a3f-4557-99d6-790eeb70ce67 \
  PAPERCLIP_AGENT_ID=b81862ce-f532-489d-8613-a08ceacc6906 \
  PAPERCLIP_COMPANY_PREFIX=CLA \
  MISSION_CONTROL_BASE_URL=http://localhost:3101 \
  nohup node "$PAPERCLIP_DIR/adapter/telegram-paperclip-adapter.js" >> "$LOG_DIR/telegram-adapter.log" 2>&1 &
fi

# 3) Notifier — check if process is running
if ! pgrep -f 'paperclip-notifier' > /dev/null; then
  echo "[keepalive] Notifier down — restarting"
  TELEGRAM_BOT_TOKEN=8401174291:AAGSZzpjiNgm8N_CuuI5MZpok2Y-6DMJwMQ \
  TELEGRAM_ALLOWED_USER_ID=7002178651 \
  PAPERCLIP_API_URL="$API_URL" \
  PAPERCLIP_COMPANY_ID=6e53f2a5-1a3f-4557-99d6-790eeb70ce67 \
  nohup node "$PAPERCLIP_DIR/adapter/paperclip-notifier.js" >> "$LOG_DIR/paperclip-notifier.log" 2>&1 &
fi

echo "[keepalive] Done"
