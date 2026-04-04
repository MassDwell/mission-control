#!/bin/zsh
# Weekly node_modules cleanup — archived/dead projects only
DEAD_DIRS=(
  "$HOME/.openclaw/workspace/ventures/permitiq"
  "$HOME/.openclaw/workspace/ventures/mirofish"
  "$HOME/.openclaw/workspace/massdwell-cogs-cloud"
  "$HOME/.openclaw/workspace/archive"
)
for dir in "${DEAD_DIRS[@]}"; do
  if [ -d "$dir/node_modules" ]; then
    rm -rf "$dir/node_modules"
    echo "$(date): Cleaned $dir/node_modules" >> "$HOME/.openclaw/workspace/data/logs/cleanup.log"
  fi
done
# Also clean any node_modules inside archive subdirs
find "$HOME/.openclaw/workspace/archive" -name "node_modules" -type d -maxdepth 4 2>/dev/null | while read d; do
  rm -rf "$d"
  echo "$(date): Cleaned $d" >> "$HOME/.openclaw/workspace/data/logs/cleanup.log"
done
