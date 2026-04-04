#!/usr/bin/env bash
# DrawStack Post-Deploy Release QA
# Runs public + authenticated visual regression checks and produces a combined pass/fail summary.
#
# Usage:
#   ./release-qa.sh              — run full QA
#   ./release-qa.sh --open       — run + open diff reports in browser on failure
#
# Exit codes:
#   0  — all checks passed
#   1  — setup/dependency error
#   2  — visual regression detected
#   3  — auth failure (session expired)

set -euo pipefail

QA_DIR="$(cd "$(dirname "$0")" && pwd)"
OPEN_REPORT=false
[[ "${1:-}" == "--open" ]] && OPEN_REPORT=true

PUBLIC_SCRIPT="$QA_DIR/drawstack-qa.sh"
AUTH_SCRIPT="$QA_DIR/drawstack-auth-qa.sh"
OPEN_FLAG=$( $OPEN_REPORT && echo "--open" || echo "" )

# ── Helpers ───────────────────────────────────────────────────────────────────

log()     { echo "[$(date '+%H:%M:%S')] $*"; }
divider() { echo ""; echo "────────────────────────────────────────────"; echo ""; }

# ── Pre-flight ────────────────────────────────────────────────────────────────

if [[ ! -x "$PUBLIC_SCRIPT" ]]; then
  echo "[ERROR] Public QA script not found or not executable: $PUBLIC_SCRIPT"
  exit 1
fi
if [[ ! -x "$AUTH_SCRIPT" ]]; then
  echo "[ERROR] Auth QA script not found or not executable: $AUTH_SCRIPT"
  exit 1
fi
if [[ ! -f "$QA_DIR/baselines/.captured_at" ]]; then
  echo "[ERROR] No public baselines found."
  echo "        Run: ./drawstack-qa.sh baseline"
  exit 1
fi
if [[ ! -f "$QA_DIR/auth-baselines/.captured_at" ]]; then
  echo "[ERROR] No authenticated baselines found."
  echo "        Run: ./drawstack-auth-qa.sh baseline"
  exit 1
fi

# ── Run ───────────────────────────────────────────────────────────────────────

TS=$(date '+%Y-%m-%dT%H:%M:%S')
PUBLIC_EXIT=0
AUTH_EXIT=0

divider
echo "  DrawStack Release QA — $TS"
divider

# 1. Public pages
log "▶ Running public page QA (5 pages)..."
echo ""
set +e
$PUBLIC_SCRIPT run $OPEN_FLAG 2>&1
PUBLIC_EXIT=$?
set -e
echo ""

# 2. Authenticated pages
log "▶ Running authenticated page QA (5 pages)..."
echo ""
set +e
$AUTH_SCRIPT run $OPEN_FLAG 2>&1
AUTH_EXIT=$?
set -e
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────

divider
echo "  RELEASE QA SUMMARY — $TS"
divider

# Decode results
PUBLIC_STATUS="✅ PASS"
AUTH_STATUS="✅ PASS"
OVERALL_EXIT=0

if [[ $PUBLIC_EXIT -eq 2 ]]; then
  PUBLIC_STATUS="❌ VISUAL REGRESSION"
  OVERALL_EXIT=2
elif [[ $PUBLIC_EXIT -ne 0 ]]; then
  PUBLIC_STATUS="⚠️  ERROR (exit $PUBLIC_EXIT)"
  OVERALL_EXIT=1
fi

if [[ $AUTH_EXIT -eq 3 ]]; then
  AUTH_STATUS="🔒 AUTH FAILURE"
  [[ $OVERALL_EXIT -eq 0 ]] && OVERALL_EXIT=3
elif [[ $AUTH_EXIT -eq 2 ]]; then
  AUTH_STATUS="❌ VISUAL REGRESSION"
  [[ $OVERALL_EXIT -eq 0 ]] && OVERALL_EXIT=2
elif [[ $AUTH_EXIT -ne 0 ]]; then
  AUTH_STATUS="⚠️  ERROR (exit $AUTH_EXIT)"
  [[ $OVERALL_EXIT -eq 0 ]] && OVERALL_EXIT=1
fi

echo "  Public pages    : $PUBLIC_STATUS"
echo "  Auth pages      : $AUTH_STATUS"
echo ""

# ── Verdict + Next Action ─────────────────────────────────────────────────────

case $OVERALL_EXIT in
  0)
    echo "  ✅ ALL CHECKS PASSED — release is clear"
    echo ""
    echo "  ▸ No action required. Ship it."
    ;;
  2)
    echo "  ❌ VISUAL REGRESSION DETECTED — do not ship"
    echo ""
    echo "  ▸ Review diff reports:"
    # Show most recent report paths
    PUBLIC_REPORT=$(ls -t "$QA_DIR/reports"/*/report.md 2>/dev/null | head -1 || echo "")
    AUTH_REPORT=$(ls -t "$QA_DIR/auth-reports"/*/report.md 2>/dev/null | head -1 || echo "")
    [[ -n "$PUBLIC_REPORT" ]] && echo "      Public : $PUBLIC_REPORT"
    [[ -n "$AUTH_REPORT"  ]] && echo "      Auth   : $AUTH_REPORT"
    echo ""
    echo "  ▸ If the change is intentional, re-baseline:"
    echo "      Public : ./drawstack-qa.sh baseline"
    echo "      Auth   : ./drawstack-auth-qa.sh baseline"
    echo ""
    echo "  ▸ If it's a bug, roll back the deploy and investigate."
    ;;
  3)
    echo "  🔒 AUTH FAILURE — DrawStack session expired"
    echo ""
    echo "  ▸ Fix: Log in to drawstack.ai in Chrome on the Mac mini, then re-run:"
    echo "      ./release-qa.sh"
    echo ""
    echo "  ▸ Authenticated page QA was skipped. Public page result above still valid."
    ;;
  *)
    echo "  ⚠️  QA ERROR — one or both scripts encountered an unexpected failure"
    echo ""
    echo "  ▸ Re-run with verbose output:"
    echo "      ./drawstack-qa.sh run"
    echo "      ./drawstack-auth-qa.sh run"
    ;;
esac

divider

exit $OVERALL_EXIT
