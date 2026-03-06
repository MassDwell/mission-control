#!/bin/bash
#
# memory-maintenance.sh - Automated Memory System Maintenance
#
# Automates the scriptable parts of weekly memory maintenance:
# - File size checks and alerts
# - Archive old daily logs (>30 days)
# - Git commit memory changes
# - Generate review report
#
# Usage:
#   ./memory-maintenance.sh [--dry-run] [--archive-days N]
#
# Options:
#   --dry-run        Show what would be done without making changes
#   --archive-days N Archive logs older than N days (default: 30)
#   --help           Show this help message

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE="${HOME}/.openclaw/workspace"
MEMORY_DIR="${WORKSPACE}/memory"
ARCHIVE_DAYS=30
DRY_RUN=false

# File size thresholds (lines)
WORKING_TARGET=100
WORKING_ALERT=150
MEMORY_TARGET=1500
MEMORY_ALERT=2000
WORKFLOW_TARGET=300
WORKFLOW_ALERT=500

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --archive-days)
            ARCHIVE_DAYS="$2"
            shift 2
            ;;
        --help)
            head -n 15 "$0" | tail -n 12
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_file_size() {
    local file=$1
    local target=$2
    local alert=$3
    local name=$4
    
    if [[ ! -f "$file" ]]; then
        log_warning "$name not found: $file"
        return 1
    fi
    
    local lines=$(wc -l < "$file")
    
    if [[ $lines -gt $alert ]]; then
        log_error "$name: $lines lines (ALERT threshold: $alert)"
        return 2
    elif [[ $lines -gt $target ]]; then
        log_warning "$name: $lines lines (target: $target, alert: $alert)"
        return 1
    else
        log_success "$name: $lines lines (target: $target)"
        return 0
    fi
}

# Banner
echo "════════════════════════════════════════════════════════════"
echo "  Memory Maintenance - $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════"
if [[ "$DRY_RUN" = true ]]; then
    echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
    echo "════════════════════════════════════════════════════════════"
fi
echo ""

# Step 1: File Size Checks
log_info "Step 1: Checking file sizes..."
echo ""

EXIT_CODE=0

check_file_size "${MEMORY_DIR}/WORKING.md" $WORKING_TARGET $WORKING_ALERT "WORKING.md" || EXIT_CODE=$?
check_file_size "${WORKSPACE}/MEMORY.md" $MEMORY_TARGET $MEMORY_ALERT "MEMORY.md" || EXIT_CODE=$?
check_file_size "${WORKSPACE}/WORKFLOW_AUTO.md" $WORKFLOW_TARGET $WORKFLOW_ALERT "WORKFLOW_AUTO.md" || EXIT_CODE=$?

echo ""

# Step 2: Archive Old Daily Logs
log_info "Step 2: Archiving daily logs older than $ARCHIVE_DAYS days..."
echo ""

ARCHIVE_DIR="${MEMORY_DIR}/archive/$(date +%Y-%m)"
ARCHIVED_COUNT=0

# Find daily logs older than N days
while IFS= read -r -d '' log_file; do
    if [[ "$DRY_RUN" = true ]]; then
        log_info "Would archive: $(basename "$log_file")"
        ((ARCHIVED_COUNT++))
    else
        # Create archive directory if needed
        mkdir -p "$ARCHIVE_DIR"
        
        # Move the file
        mv "$log_file" "$ARCHIVE_DIR/"
        log_success "Archived: $(basename "$log_file")"
        ((ARCHIVED_COUNT++))
    fi
done < <(find "$MEMORY_DIR" -maxdepth 1 -name "20*.md" -type f -mtime +$ARCHIVE_DAYS -print0 2>/dev/null)

if [[ $ARCHIVED_COUNT -eq 0 ]]; then
    log_info "No logs older than $ARCHIVE_DAYS days found"
else
    log_success "Archived $ARCHIVED_COUNT log file(s) to $ARCHIVE_DIR"
fi

echo ""

# Step 3: Count Current Daily Logs
log_info "Step 3: Counting current daily logs..."
echo ""

CURRENT_LOGS=$(find "$MEMORY_DIR" -maxdepth 1 -name "20*.md" -type f 2>/dev/null | wc -l)

if [[ $CURRENT_LOGS -gt 35 ]]; then
    log_warning "Daily logs in memory/: $CURRENT_LOGS (recommended: <35)"
else
    log_success "Daily logs in memory/: $CURRENT_LOGS"
fi

echo ""

# Step 4: Check for Today's Daily Log
log_info "Step 4: Checking for today's daily log..."
echo ""

TODAY=$(date +%Y-%m-%d)
TODAY_LOG="${MEMORY_DIR}/${TODAY}.md"

if [[ -f "$TODAY_LOG" ]]; then
    log_success "Today's log exists: ${TODAY}.md"
else
    if [[ "$DRY_RUN" = true ]]; then
        log_info "Would create today's log: ${TODAY}.md"
    else
        cat > "$TODAY_LOG" << EOF
# ${TODAY} - Daily Log

_$(date +"%A, %B %d, %Y")_

---

EOF
        log_success "Created today's log: ${TODAY}.md"
    fi
fi

echo ""

# Step 5: Generate Review Report
log_info "Step 5: Generating review report..."
echo ""

REPORT="${WORKSPACE}/memory-maintenance-report.txt"

cat > "$REPORT" << EOF
Memory Maintenance Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')
════════════════════════════════════════════════════════════

FILE SIZE STATUS:
$(wc -l "${MEMORY_DIR}/WORKING.md" 2>/dev/null | awk '{printf "  WORKING.md:      %4d lines", $1}') (target: ${WORKING_TARGET}, alert: ${WORKING_ALERT})
$(wc -l "${WORKSPACE}/MEMORY.md" 2>/dev/null | awk '{printf "  MEMORY.md:       %4d lines", $1}') (target: ${MEMORY_TARGET}, alert: ${MEMORY_ALERT})
$(wc -l "${WORKSPACE}/WORKFLOW_AUTO.md" 2>/dev/null | awk '{printf "  WORKFLOW_AUTO.md:%4d lines", $1}') (target: ${WORKFLOW_TARGET}, alert: ${WORKFLOW_ALERT})

DAILY LOGS:
  Current count: ${CURRENT_LOGS} files
  Archived: ${ARCHIVED_COUNT} files (older than ${ARCHIVE_DAYS} days)
  Today's log: $([ -f "$TODAY_LOG" ] && echo "✓ exists" || echo "✗ missing")

MANUAL REVIEW NEEDED:
  [ ] Review last 7 daily logs for lessons learned
  [ ] Extract key insights → MEMORY.md
  [ ] Clean WORKING.md (remove completed/stale entries)
  [ ] Update MEMORY.md (people, integrations, standing instructions)
  [ ] Verify WORKFLOW_AUTO.md matches current automation

RECENT DAILY LOGS (last 7 days):
EOF

find "$MEMORY_DIR" -maxdepth 1 -name "20*.md" -type f -mtime -7 | sort -r | while read -r log; do
    echo "  - $(basename "$log")" >> "$REPORT"
done

cat >> "$REPORT" << EOF

FILES NEEDING ATTENTION:
EOF

# Check which files need attention
NEEDS_ATTENTION=false

if [[ $(wc -l < "${MEMORY_DIR}/WORKING.md" 2>/dev/null || echo 0) -gt $WORKING_ALERT ]]; then
    echo "  ⚠ WORKING.md exceeds alert threshold - cleanup required" >> "$REPORT"
    NEEDS_ATTENTION=true
fi

if [[ $(wc -l < "${WORKSPACE}/MEMORY.md" 2>/dev/null || echo 0) -gt $MEMORY_ALERT ]]; then
    echo "  ⚠ MEMORY.md exceeds alert threshold - review for redundancy" >> "$REPORT"
    NEEDS_ATTENTION=true
fi

if [[ $(wc -l < "${WORKSPACE}/WORKFLOW_AUTO.md" 2>/dev/null || echo 0) -gt $WORKFLOW_ALERT ]]; then
    echo "  ⚠ WORKFLOW_AUTO.md exceeds alert threshold - consolidate rules" >> "$REPORT"
    NEEDS_ATTENTION=true
fi

if [[ $CURRENT_LOGS -gt 35 ]]; then
    echo "  ⚠ Too many daily logs (${CURRENT_LOGS}) - consider archiving more aggressively" >> "$REPORT"
    NEEDS_ATTENTION=true
fi

if [[ "$NEEDS_ATTENTION" = false ]]; then
    echo "  ✓ All files within acceptable thresholds" >> "$REPORT"
fi

cat >> "$REPORT" << EOF

════════════════════════════════════════════════════════════
Next maintenance: $(date -v+7d '+%Y-%m-%d' 2>/dev/null || date -d '+7 days' '+%Y-%m-%d' 2>/dev/null || echo "Next Sunday")
SOP: data/global/sops/memory-maintenance.md
EOF

log_success "Report generated: memory-maintenance-report.txt"

echo ""
cat "$REPORT"
echo ""

# Step 6: Git Commit (if changes detected)
log_info "Step 6: Checking for git changes..."
echo ""

cd "$WORKSPACE"

if git diff --quiet HEAD -- MEMORY.md memory/WORKING.md WORKFLOW_AUTO.md 2>/dev/null; then
    log_info "No changes to commit"
else
    if [[ "$DRY_RUN" = true ]]; then
        log_info "Would commit changes to git"
        git diff --stat HEAD -- MEMORY.md memory/WORKING.md WORKFLOW_AUTO.md 2>/dev/null || true
    else
        git add MEMORY.md memory/WORKING.md WORKFLOW_AUTO.md memory-maintenance-report.txt 2>/dev/null || true
        git commit -m "Memory maintenance: weekly review $(date +%Y-%m-%d)" 2>/dev/null || log_warning "Git commit failed (may not be in a git repo)"
        log_success "Changes committed to git"
    fi
fi

echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "  Maintenance Complete"
echo "════════════════════════════════════════════════════════════"

if [[ "$DRY_RUN" = true ]]; then
    echo -e "${YELLOW}DRY RUN - Run without --dry-run to apply changes${NC}"
fi

echo ""
echo "Summary:"
echo "  - Archived: $ARCHIVED_COUNT log file(s)"
echo "  - Current logs: $CURRENT_LOGS"
echo "  - Files checked: 3"
echo "  - Report: memory-maintenance-report.txt"
echo ""

if [[ $EXIT_CODE -eq 2 ]]; then
    echo -e "${RED}⚠ ACTION REQUIRED: One or more files exceed alert thresholds${NC}"
    exit 2
elif [[ $EXIT_CODE -eq 1 ]]; then
    echo -e "${YELLOW}⚠ WARNING: Some files exceed target size (still within limits)${NC}"
    exit 0
else
    echo -e "${GREEN}✓ All systems nominal${NC}"
    exit 0
fi
