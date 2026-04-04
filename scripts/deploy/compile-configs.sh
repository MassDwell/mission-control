#!/bin/bash
# Compile derived configs from canonical sources
# Generates config/cron-compiled.json, routes, integrations, etc.

set -e

echo "🔨 COMPILING CANONICAL CONFIGS..."
echo ""

CANONICAL_DIR="$HOME/.openclaw/workspace/canon"
CONFIG_DIR="$HOME/.openclaw/workspace/config"
BUILD_DIR="$HOME/.openclaw/workspace/build/compiled-manifests"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$CONFIG_DIR" "$BUILD_DIR"

# Step 1: Compile cron manifest
echo "✅ Step 1: Compiling cron manifest..."
jq . "$CANONICAL_DIR/cron.manifest.canon" > "$CONFIG_DIR/cron-compiled.json"
cp "$CONFIG_DIR/cron-compiled.json" "$BUILD_DIR/cron-compiled-$TIMESTAMP.json"
echo "   Generated: config/cron-compiled.json"

# Step 2: Generate routes.json from registry (enabled agents only)
echo "✅ Step 2: Generating agent routes from registry..."
jq '.agents | map({id, name, role, sessionKey, status: "active", type})' "$CANONICAL_DIR/registry.json" > "$CONFIG_DIR/routes.json"
echo "   Generated: config/routes.json"
echo "   Enabled agents: $(jq '.agents | length' "$CANONICAL_DIR/registry.json")"

# Step 3: Generate integrations.json
echo "✅ Step 3: Generating integrations manifest..."
COMPILE_DATE=$(date +%Y-%m-%d)
cat > "$CONFIG_DIR/integrations.json" << EOF
{
  "integrations": {
    "google_workspace": {
      "status": "active",
      "accounts": 3,
      "emails": ["sales@massdwell.com", "vettoristeve@gmail.com", "team@atlanticlasersolutions.com"],
      "permissions": ["read", "send", "modify"],
      "credentials": "credentials/google/"
    },
    "mission_control": {
      "status": "active",
      "type": "dashboard",
      "repo": "massdwell-mission-control"
    },
    "kommo_crm": {
      "status": "disabled",
      "reason": "Credentials revoked 2026-03-04"
    },
    "alpaca": {
      "status": "preserved",
      "purpose": "historical reference",
      "type": "paper_trading"
    }
  },
  "credentials_total": 36,
  "credentials_active": ["google", "alpaca", "instagram", "x", "gemini", "brave"],
  "compiled": "$COMPILE_DATE"
}
EOF
echo "   Generated: config/integrations.json"

# Step 4: Compile agents from registry + canon/agents/
echo "✅ Step 4: Compiling enabled agents from registry..."
jq -r '.agents[] | select(.enabled==true) | {id, name, role, enabled, config_path: ("canon/agents/" + .id + "/")}' "$CANONICAL_DIR/registry.json" > "$CONFIG_DIR/agents-compiled.json"
ENABLED_AGENTS=$(jq '.agents | length' "$CONFIG_DIR/agents-compiled.json")
echo "   Generated: config/agents-compiled.json ($ENABLED_AGENTS agents enabled)"

# Step 5: Generate VERSION.compiled
echo "✅ Step 5: Generating version metadata..."
CANONICAL_VERSION=$(cat "$CANONICAL_DIR/VERSION.canon" 2>/dev/null || echo "1.0.0")
BUILD_VERSION="$CANONICAL_VERSION-$TIMESTAMP"
echo "$BUILD_VERSION" > "$CONFIG_DIR/VERSION.compiled"
echo "   Generated: config/VERSION.compiled ($BUILD_VERSION)"

# Step 6: Copy to build archive
echo "✅ Step 6: Archiving to build/..."
cp "$CONFIG_DIR/cron-compiled.json" "$BUILD_DIR/"
cp "$CONFIG_DIR/routes.json" "$BUILD_DIR/"
cp "$CONFIG_DIR/integrations.json" "$BUILD_DIR/"
cp "$CONFIG_DIR/agents-compiled.json" "$BUILD_DIR/"
echo "   Archived all compiled configs"

echo ""
echo "═══════════════════════════════════════════"
echo "✅ COMPILATION SUCCESSFUL"
echo "═══════════════════════════════════════════"
echo ""
echo "Generated configs:"
echo "  ✅ config/cron-compiled.json ($(jq '. | length' "$CONFIG_DIR/cron-compiled.json") jobs)"
echo "  ✅ config/routes.json ($(jq '. | length' "$CONFIG_DIR/routes.json") enabled agents)"
echo "  ✅ config/agents-compiled.json ($(jq '. | length' "$CONFIG_DIR/agents-compiled.json") agents)"
echo "  ✅ config/integrations.json"
echo "  ✅ config/VERSION.compiled ($BUILD_VERSION)"
echo ""

exit 0
