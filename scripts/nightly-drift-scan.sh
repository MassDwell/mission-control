#!/bin/bash
# OpenClaw Nightly Drift Scanner
# Detects configuration drift, duplicates, and conflicts
# READ-ONLY - Reports issues, does not auto-fix

WORKSPACE="$HOME/.openclaw/workspace"
REPORT_FILE="$WORKSPACE/memory/drift-report-$(date +%Y-%m-%d).md"
TELEGRAM_ALERT=false
ISSUES_FOUND=0

echo "# OpenClaw Drift Scan Report" > "$REPORT_FILE"
echo "**Date:** $(date '+%Y-%m-%d %H:%M:%S %Z')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to log issue
log_issue() {
    local severity=$1
    local title=$2
    local details=$3
    
    echo "## [$severity] $title" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "$details" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    
    if [[ "$severity" == "CRITICAL" ]] || [[ "$severity" == "HIGH" ]]; then
        TELEGRAM_ALERT=true
    fi
}

echo "=== OpenClaw Drift Scan Starting ===" | tee -a "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# ============================================================================
# 1. DUPLICATE SOUL.md FILES
# ============================================================================
echo "Checking for duplicate SOUL.md files..." | tee -a "$REPORT_FILE"

SOUL_FILES=$(find "$WORKSPACE/agents" "$WORKSPACE/data" -name "SOUL.md" -type f 2>/dev/null)
SOUL_AGENTS=$(echo "$SOUL_FILES" | sed 's|.*/agents/\([^/]*\)/.*|\1|' | sort)
SOUL_DATA=$(echo "$SOUL_FILES" | grep "/data/" | sed 's|.*/data/agents/\([^/]*\)/.*|\1|' | sort)

# Find duplicates
DUPLICATES=$(comm -12 <(echo "$SOUL_AGENTS" | sort) <(echo "$SOUL_DATA" | sort))

if [[ -n "$DUPLICATES" ]]; then
    DETAILS="**Duplicate SOUL.md files found for:**\n"
    while IFS= read -r agent; do
        DETAILS="${DETAILS}\n- \`$agent\` exists in both \`agents/\` and \`data/agents/\`"
    done <<< "$DUPLICATES"
    DETAILS="${DETAILS}\n\n**Action:** Delete duplicates from \`data/agents/\` folder"
    log_issue "CRITICAL" "Duplicate SOUL.md Files" "$DETAILS"
else
    echo "✅ No duplicate SOUL.md files found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# 2. ORPHANED SOUL.md FILES (no matching agent in cron or active use)
# ============================================================================
echo "Checking for orphaned SOUL.md files..." | tee -a "$REPORT_FILE"

ACTIVE_AGENTS=$(openclaw cron list 2>/dev/null | jq -r '.jobs[].agentId' 2>/dev/null | sort -u)
ALL_SOUL_AGENTS=$(find "$WORKSPACE/agents" -name "SOUL.md" -type f | sed 's|.*/agents/\([^/]*\)/.*|\1|' | sort -u)

ORPHANED=$(comm -13 <(echo "$ACTIVE_AGENTS") <(echo "$ALL_SOUL_AGENTS"))

if [[ -n "$ORPHANED" ]]; then
    DETAILS="**Agents with SOUL.md but no active cron jobs:**\n"
    while IFS= read -r agent; do
        DETAILS="${DETAILS}\n- \`agents/$agent/SOUL.md\`"
    done <<< "$ORPHANED"
    DETAILS="${DETAILS}\n\n**Action:** Archive or activate these agents"
    log_issue "MEDIUM" "Orphaned Agent Configurations" "$DETAILS"
else
    echo "✅ No orphaned SOUL.md files found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# 3. DUPLICATE CRON JOBS (same agent, similar schedule)
# ============================================================================
echo "Checking for duplicate cron jobs..." | tee -a "$REPORT_FILE"

CRON_DUPLICATES=$(openclaw cron list 2>/dev/null | jq -r '.jobs[] | select(.enabled==true) | "\(.agentId)|\(.schedule.expr // .schedule.everyMs)|\(.name)"' 2>/dev/null | sort | uniq -d)

if [[ -n "$CRON_DUPLICATES" ]]; then
    DETAILS="**Duplicate or overlapping cron jobs found:**\n"
    while IFS= read -r dup; do
        AGENT=$(echo "$dup" | cut -d'|' -f1)
        SCHEDULE=$(echo "$dup" | cut -d'|' -f2)
        NAME=$(echo "$dup" | cut -d'|' -f3)
        DETAILS="${DETAILS}\n- Agent: \`$AGENT\` | Schedule: \`$SCHEDULE\` | Name: \`$NAME\`"
    done <<< "$CRON_DUPLICATES"
    DETAILS="${DETAILS}\n\n**Action:** Disable redundant cron jobs"
    log_issue "HIGH" "Duplicate Cron Jobs" "$DETAILS"
else
    echo "✅ No duplicate cron jobs found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# 4. CONFLICTING EMAIL SIGNATURES
# ============================================================================
echo "Checking for conflicting email signatures..." | tee -a "$REPORT_FILE"

SIGNATURE_FILES=$(find "$WORKSPACE" -type f \( -name "*signature*.md" -o -name "SOUL.md" -o -name "*EMAIL*.md" \) 2>/dev/null)
SIGNATURE_HASHES=$(echo "$SIGNATURE_FILES" | xargs grep -l "Best regards" 2>/dev/null | xargs md5 2>/dev/null | awk '{print $4}' | sort | uniq -c | sort -rn)

UNIQUE_SIGS=$(echo "$SIGNATURE_HASHES" | wc -l | tr -d ' ')

if [[ "$UNIQUE_SIGS" -gt 2 ]]; then
    DETAILS="**Multiple different email signatures detected:**\n"
    DETAILS="${DETAILS}\n- Found $UNIQUE_SIGS unique signature variations"
    DETAILS="${DETAILS}\n\n**Expected:** 1 MassDwell signature, 1 Atlantic Laser signature"
    DETAILS="${DETAILS}\n\n**Action:** Standardize to official signature files"
    log_issue "MEDIUM" "Signature Inconsistencies" "$DETAILS"
else
    echo "✅ Email signatures appear consistent" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# 5. MISSING OWNERSHIP TAGS
# ============================================================================
echo "Checking for missing ownership tags..." | tee -a "$REPORT_FILE"

MISSING_TAGS=0
for soul_file in $(find "$WORKSPACE/agents" -name "SOUL.md" -type f 2>/dev/null); do
    if ! grep -q "<!-- OWNER:" "$soul_file" 2>/dev/null; then
        MISSING_TAGS=$((MISSING_TAGS + 1))
    fi
done

if [[ "$MISSING_TAGS" -gt 0 ]]; then
    DETAILS="**SOUL.md files missing ownership tags:** $MISSING_TAGS\n"
    DETAILS="${DETAILS}\n**Action:** Add ownership tags to track file versions"
    log_issue "LOW" "Missing Ownership Tags" "$DETAILS"
else
    echo "✅ All SOUL.md files have ownership tags" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# 6. CRON JOB REGISTRY VALIDATION
# ============================================================================
echo "Checking cron job registry..." | tee -a "$REPORT_FILE"

REGISTRY_FILE="$WORKSPACE/data/cron-job-registry.json"
if [[ -f "$REGISTRY_FILE" ]]; then
    # Check for deprecated jobs still running
    DEPRECATED=$(jq -r '.deprecated[]?' "$REGISTRY_FILE" 2>/dev/null)
    if [[ -n "$DEPRECATED" ]]; then
        STILL_RUNNING=""
        while IFS= read -r dep_name; do
            if openclaw cron list 2>/dev/null | jq -e ".jobs[] | select(.enabled==true and .name==\"$dep_name\")" >/dev/null 2>&1; then
                STILL_RUNNING="${STILL_RUNNING}\n- $dep_name"
            fi
        done <<< "$DEPRECATED"
        
        if [[ -n "$STILL_RUNNING" ]]; then
            DETAILS="**Deprecated cron jobs still running:**$STILL_RUNNING"
            DETAILS="${DETAILS}\n\n**Action:** Disable these jobs"
            log_issue "MEDIUM" "Deprecated Cron Jobs Active" "$DETAILS"
        fi
    fi
else
    echo "⚠️  No cron job registry found (expected at data/cron-job-registry.json)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Total Issues Found:** $ISSUES_FOUND" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [[ "$ISSUES_FOUND" -eq 0 ]]; then
    echo "✅ **No drift detected - system is clean**" >> "$REPORT_FILE"
else
    echo "⚠️  **Drift detected - review issues above**" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "**Report saved to:** \`memory/drift-report-$(date +%Y-%m-%d).md\`" >> "$REPORT_FILE"

# ============================================================================
# TELEGRAM NOTIFICATION (if critical/high severity issues)
# ============================================================================
if [[ "$TELEGRAM_ALERT" == true ]]; then
    echo "🚨 Sending Telegram alert (critical/high severity issues found)" | tee -a "$REPORT_FILE"
    # You can add Telegram notification here using message tool
    # For now, just log it
fi

echo "" | tee -a "$REPORT_FILE"
echo "=== Drift Scan Complete ===" | tee -a "$REPORT_FILE"
echo "Report: $REPORT_FILE"
echo "Issues found: $ISSUES_FOUND"

exit 0
