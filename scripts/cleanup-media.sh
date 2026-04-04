#!/bin/zsh
# Browser screenshot purge — keep newest 200, delete the rest
MEDIA_DIR="$HOME/.openclaw/media/browser"
ALL=$(find "$MEDIA_DIR" -name "*.jpg" -o -name "*.png" 2>/dev/null | xargs ls -t 2>/dev/null)
echo "$ALL" | tail -n +201 | xargs rm -f 2>/dev/null
COUNT=$(find "$MEDIA_DIR" -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
echo "$(date): Browser screenshots: $COUNT remaining" >> "$HOME/.openclaw/workspace/data/logs/cleanup.log"
