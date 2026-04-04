#!/bin/zsh
# Log rotation — truncate any log over 50MB to last 10K lines
LOG_DIR="$HOME/.openclaw/workspace/data/logs"
find "$LOG_DIR" -name "*.log" -size +50M | while read f; do
  tail -n 10000 "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  echo "$(date): Truncated $f" >> "$LOG_DIR/cleanup.log"
done
# Also keep cleanup.log itself small
tail -n 1000 "$LOG_DIR/cleanup.log" > "$LOG_DIR/cleanup.log.tmp" 2>/dev/null && mv "$LOG_DIR/cleanup.log.tmp" "$LOG_DIR/cleanup.log" 2>/dev/null || true
