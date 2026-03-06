#!/bin/bash
# OpenClaw Full Backup Script
# Creates timestamped backup of critical OpenClaw data

BACKUP_DIR="$HOME/openclaw-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="openclaw-backup-$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "🔄 Starting OpenClaw Backup..."
echo "📁 Backup location: $BACKUP_PATH"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Backup critical directories
echo "📦 Backing up workspace..."
cp -R ~/.openclaw/workspace "$BACKUP_PATH/"

echo "🔐 Backing up credentials..."
cp -R ~/.openclaw/credentials "$BACKUP_PATH/"

echo "📝 Backing up memory..."
cp -R ~/.openclaw/memory "$BACKUP_PATH/"

echo "⚙️ Backing up config..."
cp ~/.openclaw/openclaw.json "$BACKUP_PATH/"

echo "📊 Backing up cron jobs..."
cp -R ~/.openclaw/cron "$BACKUP_PATH/"

echo "🤖 Backing up agent workspaces..."
for workspace in ~/.openclaw/workspace-*; do
    if [ -d "$workspace" ]; then
        cp -R "$workspace" "$BACKUP_PATH/"
    fi
done

echo "📋 Backing up logs (last 7 days)..."
mkdir -p "$BACKUP_PATH/logs"
find ~/.openclaw/logs -type f -mtime -7 -exec cp {} "$BACKUP_PATH/logs/" \;

# Create backup manifest
echo "📄 Creating manifest..."
cat > "$BACKUP_PATH/BACKUP_MANIFEST.txt" << MANIFEST
OpenClaw Backup
Created: $(date)
Version: $(openclaw --version 2>/dev/null || echo "unknown")
Hostname: $(hostname)

Contents:
- workspace/ (all project files)
- credentials/ (OAuth tokens, API keys)
- memory/ (conversation memory)
- openclaw.json (configuration)
- cron/ (scheduled jobs)
- workspace-*/ (agent workspaces)
- logs/ (last 7 days)

Restore Instructions:
1. Stop OpenClaw: openclaw gateway stop
2. Copy files back to ~/.openclaw/
3. Start OpenClaw: openclaw gateway start
MANIFEST

# Compress backup
echo "🗜️ Compressing..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo "✅ Backup complete!"
echo "📦 File: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "💾 Size: $BACKUP_SIZE"
echo ""
echo "To restore: tar -xzf ${BACKUP_NAME}.tar.gz"
echo ""

# Cleanup old backups (keep last 7)
echo "🧹 Cleaning up old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t openclaw-backup-*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Done!"
