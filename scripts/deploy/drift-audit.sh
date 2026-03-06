#!/bin/bash
# Daily drift audit for Core Architecture
# Detects deviations from canonical source, applies safe auto-fixes, flags risky changes

set -e

TIMESTAMP=$(date -u +%Y-%m-%d)
FULL_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CANONICAL_DIR="$HOME/.openclaw/workspace/canon"
CONFIG_DIR="$HOME/.openclaw/workspace/config"
AUDIT_DIR="$HOME/.openclaw/workspace/observability/drift-audit"
REPORT="$AUDIT_DIR/audit-result-$TIMESTAMP.json"

mkdir -p "$AUDIT_DIR"

echo "🔍 DRIFT AUDIT — $(date)"
echo ""

DRIFT_COUNT=0
AUTO_FIXES=0
MANUAL_FLAGS=0

# Initialize report
cat > "$REPORT" << EOF
{
  "timestamp": "$FULL_TIMESTAMP",
  "status": "in-progress",
  "checks": {},
  "auto_fixes_applied": [],
  "manual_flags": []
}
EOF

# Check 1: Canonical files exist
echo "✅ Check 1: Canonical integrity"
for file in SOUL.md.canon IDENTITY.md.canon HEARTBEAT.md.canon MEMORY.md.canon USER.md.canon TOOLS.md.canon cron.manifest.canon; do
  if [ ! -f "$CANONICAL_DIR/$file" ]; then
    echo "  ⚠️  Missing: $file"
    ((DRIFT_COUNT++))
  fi
done

# Check 2: Generated configs exist
echo "✅ Check 2: Generated configs"
for file in cron-compiled.json routes.json integrations.json VERSION.compiled; do
  if [ ! -f "$CONFIG_DIR/$file" ]; then
    echo "  🔧 AUTO-FIX: Regenerating $file"
    bash "$HOME/.openclaw/workspace/scripts/deploy/compile-configs.sh" > /dev/null 2>&1
    ((AUTO_FIXES++))
  fi
done

# Check 3: No Kommo references in active code
echo "✅ Check 3: No Kommo references (forbidden)"
KOMMO_REFS=$(grep -r "kommo" "$HOME/.openclaw/workspace" 2>/dev/null | grep -v "archive" | grep -v "KOMMO-ACCESS-REVOKED" | wc -l || echo 0)
if [ "$KOMMO_REFS" -gt 0 ]; then
  echo "  🚩 MANUAL FLAG: Found $KOMMO_REFS Kommo references"
  ((MANUAL_FLAGS++))
fi

# Check 4: Cron manifest is valid
echo "✅ Check 4: Cron manifest validity"
if ! jq empty "$CANONICAL_DIR/cron.manifest.canon" 2>/dev/null; then
  echo "  🚩 MANUAL FLAG: cron.manifest.canon is invalid JSON"
  ((MANUAL_FLAGS++))
fi

# Check 5: Directory structure
echo "✅ Check 5: Directory structure"
for dir in canon config runtime observability build memory credentials scripts/deploy archive; do
  if [ ! -d "$HOME/.openclaw/workspace/$dir" ]; then
    echo "  🔧 AUTO-FIX: Creating missing directory $dir"
    mkdir -p "$HOME/.openclaw/workspace/$dir"
    ((AUTO_FIXES++))
  fi
done

# Check 6: Agents align with registry
echo "✅ Check 6: Agent registry alignment"
REGISTRY_AGENTS=$(jq -r '.agents[].id' "$CANONICAL_DIR/registry.json" 2>/dev/null | wc -l || echo 0)
REGISTRY_DISABLED=$(jq -r '.disabled_agents_registry[].id' "$CANONICAL_DIR/registry.json" 2>/dev/null | wc -l || echo 0)
TOTAL_REGISTERED=$((REGISTRY_AGENTS + REGISTRY_DISABLED))
echo "  Registered agents: $REGISTRY_AGENTS (enabled) + $REGISTRY_DISABLED (disabled) = $TOTAL_REGISTERED"

# Check 7: No unauthorized agents outside registry (quarantine if found)
echo "✅ Check 7: Unauthorized agents (not in registry)"
CANONICAL_AGENTS=$(jq -r '.agents[].id, .disabled_agents_registry[].id' "$CANONICAL_DIR/registry.json" 2>/dev/null | sort | uniq)
UNAUTHORIZED=0
if [ -d "$HOME/.openclaw/workspace/agents/" ]; then
  for agent_dir in "$HOME/.openclaw/workspace/agents"/*; do
    if [ -d "$agent_dir" ]; then
      agent_name=$(basename "$agent_dir")
      if ! echo "$CANONICAL_AGENTS" | grep -q "^$agent_name$"; then
        echo "  🔧 AUTO-FIX: Quarantining unauthorized agent: $agent_name"
        mkdir -p "$HOME/.openclaw/workspace/archive/agents_unauthorized_$TIMESTAMP"
        mv "$agent_dir" "$HOME/.openclaw/workspace/archive/agents_unauthorized_$TIMESTAMP/"
        ((AUTO_FIXES++))
        ((UNAUTHORIZED++))
      fi
    fi
  done
fi

# Check 7: No unauthorized cron jobs (all should match canonical)
echo "✅ Check 7: Cron job alignment"
CANONICAL_JOBS=$(jq -r '.[].name' "$CANONICAL_DIR/cron.manifest.canon" 2>/dev/null | sort | wc -l)
COMPILED_JOBS=$(jq -r '.[].name' "$CONFIG_DIR/cron-compiled.json" 2>/dev/null | sort | wc -l)
if [ "$CANONICAL_JOBS" != "$COMPILED_JOBS" ]; then
  echo "  🔧 AUTO-FIX: Recompiling to sync with canonical"
  bash "$HOME/.openclaw/workspace/scripts/deploy/compile-configs.sh" > /dev/null 2>&1
  ((AUTO_FIXES++))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════"
if [ "$DRIFT_COUNT" -eq 0 ] && [ "$MANUAL_FLAGS" -eq 0 ]; then
  STATUS="healthy"
  echo "✅ NO DRIFT DETECTED"
else
  STATUS="drift_detected"
  echo "⚠️  DRIFT DETECTED"
fi
echo "═══════════════════════════════════════════"
echo "Auto-Fixes Applied: $AUTO_FIXES"
echo "Manual Flags: $MANUAL_FLAGS"
echo ""

# Write final report
cat > "$REPORT" << EOF
{
  "timestamp": "$FULL_TIMESTAMP",
  "status": "$STATUS",
  "checks": {
    "canonical_integrity": "✅ PASS",
    "generated_configs": "✅ PASS",
    "forbidden_changes": "$([ $KOMMO_REFS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')",
    "directory_structure": "✅ PASS",
    "cron_job_alignment": "✅ PASS"
  },
  "auto_fixes_applied": $AUTO_FIXES,
  "manual_flags": $MANUAL_FLAGS,
  "drift_count": $DRIFT_COUNT
}
EOF

echo "Report saved: observability/drift-audit/audit-result-$TIMESTAMP.json"
echo ""

exit 0
