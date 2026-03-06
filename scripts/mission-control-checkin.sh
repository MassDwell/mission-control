#!/bin/bash

# Mission Control Data Pipeline Checkin
# Runs every 15 minutes via launchd (com.openclaw.mc-checkin)
# Refreshes Mission Control JSON data files
# Fail-loud: exit non-zero on any error

set -e  # Exit on first error

WORKSPACE="/Users/openclaw/.openclaw/workspace"
MC_DATA_DIR="$WORKSPACE/data/mission-control"
LOG_DIR="$WORKSPACE/logs"
LOG="$LOG_DIR/mc-checkin.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure directories exist
mkdir -p "$MC_DATA_DIR" "$LOG_DIR" || {
  echo "[ERROR] Cannot create required directories" >&2
  exit 1
}

# Log start
{
  echo "[$TIMESTAMP] =========================================="
  echo "[$TIMESTAMP] Mission Control Checkin Starting"
  echo "[$TIMESTAMP] Data directory: $MC_DATA_DIR"
} >> "$LOG"

# Step 1: Validate directory structure
if [ ! -d "$MC_DATA_DIR" ]; then
  echo "[ERROR] Mission Control data directory not found: $MC_DATA_DIR" >&2
  echo "[$TIMESTAMP] FAILED: data directory missing" >> "$LOG"
  exit 1
fi

# Step 2: Run data export via mission-control-export.js
if [ -f "$WORKSPACE/scripts/mission-control-export.js" ]; then
  echo "[$TIMESTAMP] Running mission-control-export.js..." >> "$LOG"
  cd "$WORKSPACE" || exit 1
  
  # Run the export and capture exit code
  if node scripts/mission-control-export.js >> "$LOG" 2>&1; then
    echo "[$TIMESTAMP] mission-control-export.js completed successfully" >> "$LOG"
  else
    EXITCODE=$?
    echo "[ERROR] mission-control-export.js failed with exit code $EXITCODE" >&2
    echo "[$TIMESTAMP] FAILED: mission-control-export.js (exit $EXITCODE)" >> "$LOG"
    exit $EXITCODE
  fi
else
  echo "[ERROR] mission-control-export.js not found" >&2
  echo "[$TIMESTAMP] FAILED: export script missing" >> "$LOG"
  exit 1
fi

# Step 3: Verify data files exist and were updated
{
  echo "[$TIMESTAMP] Verifying data files..."
  echo "[$TIMESTAMP] Data file status:"
  ls -lh "$MC_DATA_DIR"/*.json 2>/dev/null | while read line; do
    echo "[$TIMESTAMP]   $line"
  done
} >> "$LOG"

# Step 4: Ensure at least one file was updated in the last hour (freshness check)
RECENT_FILE=$(find "$MC_DATA_DIR" -name "*.json" -type f -mmin -60 2>/dev/null | head -1)
if [ -z "$RECENT_FILE" ]; then
  {
    echo "[$TIMESTAMP] WARNING: No JSON files updated in last 60 minutes"
    echo "[$TIMESTAMP] Data may be stale. Check mission-control-v2.js."
  } >> "$LOG"
  # Don't fail for this (could be intentional no-op)
fi

# Step 5: Log completion
{
  echo "[$TIMESTAMP] Mission Control Checkin Completed Successfully"
  echo "[$TIMESTAMP] =========================================="
  echo ""
} >> "$LOG"

exit 0
