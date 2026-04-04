#!/bin/zsh
# Weekly system cache purge
LOG="$HOME/.openclaw/workspace/data/logs/cleanup.log"
echo "$(date): === Weekly system cache cleanup ===" >> "$LOG"

# pnpm cache
rm -rf ~/Library/Caches/pnpm && echo "$(date): pnpm cache cleared" >> "$LOG"

# pip cache
rm -rf ~/Library/Caches/pip && echo "$(date): pip cache cleared" >> "$LOG"

# ms-playwright (reinstalls on demand)
rm -rf ~/Library/Caches/ms-playwright && echo "$(date): ms-playwright cache cleared" >> "$LOG"

# node-gyp cache
rm -rf ~/Library/Caches/node-gyp && echo "$(date): node-gyp cache cleared" >> "$LOG"

# Go build cache (keeps module downloads, clears build artifacts)
go clean -cache 2>/dev/null && echo "$(date): go build cache cleared" >> "$LOG"

# .next build caches on active projects (rebuilds on deploy)
find ~/Projects -name ".next" -maxdepth 3 -type d 2>/dev/null | while read d; do
  rm -rf "$d" && echo "$(date): cleared $d" >> "$LOG"
done

# Homebrew old versions
brew cleanup --prune=7 2>/dev/null && echo "$(date): Homebrew pruned" >> "$LOG"

echo "$(date): === Done ===" >> "$LOG"
