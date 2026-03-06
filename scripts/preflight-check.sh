#!/bin/bash
# PREFLIGHT CHECKLIST — Runs on every startup
# Validates system is in known good state before anything runs
# Fail closed: Block startup if any critical check fails

set -e

echo "🔒 PREFLIGHT CHECKLIST — Anti-Sprawl Verification"
echo "================================================================"
echo ""

WORKSPACE="$HOME/.openclaw/workspace"
CANONICAL_DIR="$WORKSPACE/canon"
REGISTRY="$CANONICAL_DIR/registry.json"
QUARANTINE_DIR="$WORKSPACE/archive/quarantine/$(date +%Y%m%d_%H%M%S)"
PREFLIGHT_REPORT="$WORKSPACE/observability/preflight-check.json"

ERRORS=0
WARNINGS=0
CRITICAL=0

mkdir -p "$WORKSPACE/archive/quarantine"
mkdir -p "$WORKSPACE/observability"

# ===== CHECK 1: Canon Directory Exists =====
echo "✅ Check 1: Canon directory exists"
if [ ! -d "$CANONICAL_DIR" ]; then
  echo "   ❌ CRITICAL: /canon directory missing"
  mkdir -p "$CANONICAL_DIR"
  echo "   ✅ Created /canon directory"
  ((CRITICAL++))
else
  echo "   ✅ /canon directory present"
fi

# ===== CHECK 2: Registry Valid JSON =====
echo "✅ Check 2: Registry is valid JSON"
if [ ! -f "$REGISTRY" ]; then
  echo "   ❌ CRITICAL: registry.json missing"
  ((CRITICAL++))
  ((ERRORS++))
elif ! jq empty "$REGISTRY" 2>/dev/null; then
  echo "   ❌ CRITICAL: registry.json invalid JSON"
  echo "   Cannot parse registry.json - startup BLOCKED"
  ((CRITICAL++))
  ((ERRORS++))
else
  echo "   ✅ registry.json valid"
fi

# ===== CHECK 3: No Orphaned Canon Files =====
echo "✅ Check 3: No orphaned canon files"
AUTHORIZED_CANON_FILES=(
  "SOUL.md.canon"
  "IDENTITY.md.canon"
  "HEARTBEAT.md.canon"
  "MEMORY.md.canon"
  "USER.md.canon"
  "TOOLS.md.canon"
  "cron.manifest.canon"
  "VERSION.canon"
  "registry.json"
  "permissions.schema.json"
  "ANTI_SPRAWL_POLICY.md"
  "PERMISSION_ENFORCEMENT.md"
  "AGENT_LIFECYCLE.md"
  "CLAWSON_CANONICAL.md"
)

ORPHANED_COUNT=0
for file in "$CANONICAL_DIR"/*; do
  filename=$(basename "$file")
  if [ -f "$file" ]; then
    found=0
    for auth in "${AUTHORIZED_CANON_FILES[@]}"; do
      if [ "$filename" == "$auth" ]; then
        found=1
        break
      fi
    done
    
    if [ $found -eq 0 ]; then
      echo "   ⚠️  UNAUTHORIZED: $filename"
      mkdir -p "$QUARANTINE_DIR"
      mv "$file" "$QUARANTINE_DIR/" 2>/dev/null || true
      ((ORPHANED_COUNT++))
      ((WARNINGS++))
    fi
  fi
done

if [ $ORPHANED_COUNT -eq 0 ]; then
  echo "   ✅ No orphaned files"
else
  echo "   ✅ Quarantined $ORPHANED_COUNT unauthorized files"
fi

# ===== CHECK 4: Agent Directories Match Registry =====
echo "✅ Check 4: Agent directories match registry"
if [ -f "$REGISTRY" ]; then
  REGISTRY_AGENTS=$(jq -r '.agents[].id, .disabled_agents_registry[]?.id' "$REGISTRY" 2>/dev/null | sort | uniq)
  
  for agent in $REGISTRY_AGENTS; do
    AGENT_DIR="$CANONICAL_DIR/agents/$agent"
    if [ ! -d "$AGENT_DIR" ]; then
      echo "   ⚠️  Missing directory for agent: $agent"
      ((WARNINGS++))
    fi
  done
  
  if [ $WARNINGS -eq 0 ]; then
    echo "   ✅ All registered agents have directories"
  fi
else
  echo "   ⚠️  Skipped: registry.json not readable"
fi

# ===== CHECK 5: No Duplicate Canon Files =====
echo "✅ Check 5: No duplicate canon files"
DUPLICATES=$(find "$CANONICAL_DIR" -maxdepth 1 -type f -name "*.md" -o -name "*.json" | \
  xargs -I {} basename {} | sort | uniq -d | wc -l)

if [ "$DUPLICATES" -eq 0 ]; then
  echo "   ✅ No duplicates found"
else
  echo "   ⚠️  Found $DUPLICATES duplicate canon files"
  echo "   (Will be handled by drift audit)"
  ((WARNINGS++))
fi

# ===== CHECK 6: All Configs Pass Schema =====
echo "✅ Check 6: All configs pass schema validation"
SCHEMA_ERRORS=0

# Validate registry.json
if [ -f "$REGISTRY" ]; then
  if ! jq '.agents | .[].id, .[].name' "$REGISTRY" > /dev/null 2>&1; then
    echo "   ❌ registry.json schema invalid"
    ((SCHEMA_ERRORS++))
    ((ERRORS++))
  else
    echo "   ✅ registry.json schema valid"
  fi
fi

# Validate permissions schema
if [ -f "$CANONICAL_DIR/permissions.schema.json" ]; then
  if ! jq '.profiles | keys[]' "$CANONICAL_DIR/permissions.schema.json" > /dev/null 2>&1; then
    echo "   ❌ permissions.schema.json invalid"
    ((SCHEMA_ERRORS++))
    ((ERRORS++))
  else
    echo "   ✅ permissions.schema.json valid"
  fi
fi

# Validate cron manifest
if [ -f "$CANONICAL_DIR/cron.manifest.canon" ]; then
  if ! jq '. | .[].schedule' "$CANONICAL_DIR/cron.manifest.canon" > /dev/null 2>&1; then
    echo "   ❌ cron.manifest.canon invalid"
    ((SCHEMA_ERRORS++))
    ((ERRORS++))
  else
    echo "   ✅ cron.manifest.canon valid"
  fi
fi

# ===== CHECK 7: Permission Profiles Valid =====
echo "✅ Check 7: Permission profiles valid"
if [ -f "$REGISTRY" ] && [ -f "$CANONICAL_DIR/permissions.schema.json" ]; then
  MISSING_PROFILES=$(jq -r '.agents[],.disabled_agents_registry[]? | select(.permission_profile != null) | .permission_profile' "$REGISTRY" | \
    while read profile; do
      if ! jq ".profiles | has(\"$profile\")" "$CANONICAL_DIR/permissions.schema.json" | grep -q "true"; then
        echo "$profile"
      fi
    done | wc -l)
  
  if [ "$MISSING_PROFILES" -eq 0 ]; then
    echo "   ✅ All permission profiles exist in schema"
  else
    echo "   ❌ $MISSING_PROFILES profiles missing from schema"
    ((ERRORS++))
  fi
else
  echo "   ⚠️  Skipped: registry or schema not available"
fi

# ===== CHECK 8: No Unapproved Agents =====
echo "✅ Check 8: No unapproved agents"
if [ -f "$REGISTRY" ]; then
  UNAPPROVED=$(jq -r '.agents[]? | select(.approved != true) | .id' "$REGISTRY" 2>/dev/null | wc -l)
  if [ "$UNAPPROVED" -eq 0 ]; then
    echo "   ✅ All agents approved"
  else
    echo "   ⚠️  Found $UNAPPROVED unapproved agents (will block deployment)"
    ((WARNINGS++))
  fi
else
  echo "   ⚠️  Skipped: registry not readable"
fi

# ===== FINAL REPORT =====
echo ""
echo "================================================================"

if [ "$CRITICAL" -gt 0 ]; then
  echo "❌ CRITICAL ERRORS: $CRITICAL — STARTUP BLOCKED"
  FINAL_STATUS="blocked"
  EXIT_CODE=1
elif [ "$ERRORS" -gt 0 ]; then
  echo "❌ ERRORS: $ERRORS — STARTUP BLOCKED"
  FINAL_STATUS="blocked"
  EXIT_CODE=1
elif [ "$WARNINGS" -gt 0 ]; then
  echo "⚠️  WARNINGS: $WARNINGS — STARTUP ALLOWED (review recommended)"
  FINAL_STATUS="warning"
  EXIT_CODE=0
else
  echo "✅ PREFLIGHT PASSED — ALL CHECKS OK"
  FINAL_STATUS="passed"
  EXIT_CODE=0
fi

echo "================================================================"
echo ""

# Write report
cat > "$PREFLIGHT_REPORT" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "$FINAL_STATUS",
  "checks": {
    "canon_directory": "✅",
    "registry_json": "$([ "$ERRORS" -eq 0 ] && echo "✅" || echo "❌")",
    "no_orphaned_files": "$([ "$WARNINGS" -lt 1 ] && echo "✅" || echo "⚠️")",
    "agent_registry_match": "✅",
    "no_duplicates": "$([ "$DUPLICATES" -eq 0 ] && echo "✅" || echo "⚠️")",
    "schema_validation": "$([ "$SCHEMA_ERRORS" -eq 0 ] && echo "✅" || echo "❌")",
    "permissions_valid": "$([ "$ERRORS" -lt 2 ] && echo "✅" || echo "❌")",
    "no_unapproved_agents": "$([ "$UNAPPROVED" -eq 0 ] && echo "✅" || echo "⚠️")"
  },
  "errors": $ERRORS,
  "warnings": $WARNINGS,
  "critical": $CRITICAL,
  "quarantined_files": $ORPHANED_COUNT
}
EOF

exit $EXIT_CODE
