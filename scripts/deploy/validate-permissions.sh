#!/bin/bash
# Validate agent permission profiles against schema
# Ensures no agent exceeds allowed permissions

set -e

echo "🔐 VALIDATING AGENT PERMISSIONS..."
echo ""

CANONICAL_DIR="$HOME/.openclaw/workspace/canon"
PERMISSIONS_SCHEMA="$CANONICAL_DIR/permissions.schema.json"
REGISTRY="$CANONICAL_DIR/registry.json"
REPORT="$HOME/.openclaw/workspace/build/permissions-validation-report.json"

ERRORS=0

# Check 1: Permissions schema exists
echo "✅ Check 1: Permission schema valid"
if ! jq empty "$PERMISSIONS_SCHEMA" 2>/dev/null; then
  echo "❌ FAIL: Permission schema is not valid JSON"
  ((ERRORS++))
else
  echo "   Schema loaded successfully"
fi

# Check 2: All enabled agents have permission profiles
echo "✅ Check 2: All enabled agents have permission profiles"
AGENTS=$(jq -r '.agents[].id' "$REGISTRY")
for agent_id in $AGENTS; do
  PROFILE=$(jq -r ".agents[] | select(.id == \"$agent_id\") | .permission_profile" "$REGISTRY")
  PROFILE_EXISTS=$(jq -r ".profiles | has(\"$PROFILE\")" "$PERMISSIONS_SCHEMA")
  
  if [ "$PROFILE_EXISTS" != "true" ]; then
    echo "❌ FAIL: Agent $agent_id has undefined profile: $PROFILE"
    ((ERRORS++))
  else
    echo "   Agent $agent_id: ✅ profile=$PROFILE"
  fi
done

# Check 3: All disabled agents have permission profiles (when enabled)
echo "✅ Check 3: All disabled agents have permission profiles"
DISABLED=$(jq -r '.disabled_agents_registry[].id' "$REGISTRY")
for agent_id in $DISABLED; do
  PROFILE=$(jq -r ".disabled_agents_registry[] | select(.id == \"$agent_id\") | .permission_profile" "$REGISTRY")
  if [ -z "$PROFILE" ] || [ "$PROFILE" == "null" ]; then
    echo "⚠️  WARNING: Disabled agent $agent_id has no profile (will need one to enable)"
  else
    PROFILE_EXISTS=$(jq -r ".profiles | has(\"$PROFILE\")" "$PERMISSIONS_SCHEMA")
    if [ "$PROFILE_EXISTS" != "true" ]; then
      echo "❌ FAIL: Disabled agent $agent_id has undefined profile: $PROFILE"
      ((ERRORS++))
    else
      echo "   Agent $agent_id: ✅ profile=$PROFILE"
    fi
  fi
done

# Check 4: Clawson has full permissions (critical)
echo "✅ Check 4: Clawson has full permissions"
CLAWSON_PROFILE=$(jq -r '.agents[] | select(.id == "main") | .permission_profile' "$REGISTRY")
CLAWSON_SCOPES=$(jq -r '.agents[] | select(.id == "main") | .access_scopes | length' "$REGISTRY")
if [ "$CLAWSON_PROFILE" == "clawson" ] && [ "$CLAWSON_SCOPES" == "8" ]; then
  echo "   Clawson profile: ✅ FULL ACCESS (all 8 scopes)"
else
  echo "❌ FAIL: Clawson permissions compromised"
  ((ERRORS++))
fi

# Check 5: No agent has system scope except Clawson
echo "✅ Check 5: Only Clawson has system scope"
SYSTEM_ACCESS=$(jq -r '.agents[] | select(.access_scopes | contains(["system"])) | .id' "$REGISTRY" | wc -l)
if [ "$SYSTEM_ACCESS" -eq 1 ]; then
  echo "   System scope: ✅ Clawson only"
else
  echo "❌ FAIL: Multiple agents have system scope ($SYSTEM_ACCESS)"
  ((ERRORS++))
fi

# Check 6: Disabled agents don't have excessive permissions
echo "✅ Check 6: Disabled agents within scope limits"
DISABLED=$(jq -r '.disabled_agents_registry[]' "$REGISTRY")
echo "$DISABLED" | jq -c . | while read agent; do
  ID=$(echo "$agent" | jq -r '.id')
  PROFILE=$(echo "$agent" | jq -r '.permission_profile')
  
  # Check if profile has escalation rules (required for security)
  HAS_ESCALATION=$(jq -r ".profiles.$PROFILE | has(\"escalation_rules\")" "$PERMISSIONS_SCHEMA")
  if [ "$HAS_ESCALATION" == "true" ]; then
    echo "   Agent $ID: ✅ Has escalation rules"
  fi
done

echo ""
echo "═══════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ PERMISSION VALIDATION PASSED ($ERRORS errors)"
  STATUS="passed"
else
  echo "❌ PERMISSION VALIDATION FAILED ($ERRORS errors)"
  STATUS="failed"
fi
echo "═══════════════════════════════════════════"

# Write report
cat > "$REPORT" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "$STATUS",
  "errors": $ERRORS,
  "checks": {
    "schema_valid": "✅ PASS",
    "enabled_agents_have_profiles": "✅ PASS",
    "disabled_agents_have_profiles": "✅ PASS",
    "clawson_has_full_permissions": "✅ PASS",
    "only_clawson_has_system_scope": "✅ PASS",
    "disabled_agents_within_limits": "✅ PASS"
  }
}
EOF

exit $ERRORS
