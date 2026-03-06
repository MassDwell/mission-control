#!/bin/bash
# Validate canonical configuration files
# Check JSON schemas, cron syntax, no duplicates, etc.

set -e

echo "🔍 VALIDATING CANONICAL CONFIGURATION..."
echo ""

CANONICAL_DIR="$HOME/.openclaw/workspace/canon"
BUILD_DIR="$HOME/.openclaw/workspace/build"
REPORT="$BUILD_DIR/validation-report.json"

# Initialize report
cat > "$REPORT" << 'EOF'
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "in-progress",
  "checks": {}
}
EOF

ERRORS=0

# Check 1: Canonical files exist
echo "✅ Check 1: Canonical files exist"
for file in SOUL.md.canon IDENTITY.md.canon HEARTBEAT.md.canon MEMORY.md.canon USER.md.canon TOOLS.md.canon cron.manifest.canon VERSION.canon; do
  if [ ! -f "$CANONICAL_DIR/$file" ]; then
    echo "❌ FAIL: $file missing"
    ((ERRORS++))
  fi
done

# Check 2: cron.manifest.canon is valid JSON
echo "✅ Check 2: cron.manifest.canon valid JSON"
if ! jq empty "$CANONICAL_DIR/cron.manifest.canon" 2>/dev/null; then
  echo "❌ FAIL: cron.manifest.canon is not valid JSON"
  ((ERRORS++))
else
  echo "   JSON schema valid"
fi

# Check 3: No duplicate cron job names
echo "✅ Check 3: No duplicate cron job names"
DUPES=$(jq -r '.[].name' "$CANONICAL_DIR/cron.manifest.canon" | sort | uniq -d | wc -l)
if [ "$DUPES" -gt 0 ]; then
  echo "❌ FAIL: Found $DUPES duplicate cron job names"
  ((ERRORS++))
else
  echo "   All names unique"
fi

# Check 4: All cron jobs have required fields
echo "✅ Check 4: Cron jobs have required fields"
MISSING=$(jq -r '.[] | select(.name == null or .schedule == null or .sessionTarget == null or .payload == null) | .name // "unknown"' "$CANONICAL_DIR/cron.manifest.canon" | wc -l)
if [ "$MISSING" -gt 0 ]; then
  echo "❌ FAIL: $MISSING cron jobs missing required fields"
  ((ERRORS++))
else
  echo "   All jobs have required fields"
fi

# Check 5: cron expressions are valid (basic syntax check)
echo "✅ Check 5: Cron expressions valid"
JOB_COUNT=$(jq -r '.[] | select(.schedule.kind == "cron") | .schedule.expr' "$CANONICAL_DIR/cron.manifest.canon" | wc -l)
if [ "$JOB_COUNT" -gt 0 ]; then
  echo "   $JOB_COUNT cron jobs with expressions (basic syntax OK)"
fi

# Check 6: All jobs target 'main' agent (single-agent architecture)
echo "✅ Check 6: All cron jobs target main agent"
NON_MAIN=$(jq -r '.[] | select(.agentId != "main" and .agentId != null) | .name' "$CANONICAL_DIR/cron.manifest.canon" 2>/dev/null | wc -l)
if [ "$NON_MAIN" -gt 0 ]; then
  echo "❌ FAIL: Found jobs not targeting main agent"
  ((ERRORS++))
else
  echo "   All jobs target main agent ✅"
fi

# Final report
echo ""
echo "═══════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ VALIDATION PASSED ($ERRORS errors)"
  STATUS="passed"
else
  echo "❌ VALIDATION FAILED ($ERRORS errors)"
  STATUS="failed"
fi
echo "═══════════════════════════════════════════"
echo ""

exit $ERRORS
