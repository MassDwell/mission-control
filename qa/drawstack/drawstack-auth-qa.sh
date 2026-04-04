#!/usr/bin/env bash
# DrawStack Authenticated Post-Deploy QA — Peekaboo visual regression
#
# REQUIRES: Steve to be manually logged in to drawstack.ai in the QA Chrome profile.
# See: qa/drawstack/README-auth.md for setup instructions.
#
# Usage:
#   ./drawstack-auth-qa.sh check-auth           — verify session is active before proceeding
#   ./drawstack-auth-qa.sh baseline             — capture authenticated golden screenshots
#   ./drawstack-auth-qa.sh run                  — post-deploy comparison against baselines
#   ./drawstack-auth-qa.sh run --open           — run + open report in browser
#
# Outputs:
#   auth-baselines/   — golden screenshots (track in git; no secrets, just UI)
#   auth-captures/    — per-run captures (gitignored)
#   auth-diffs/       — per-run diff images (gitignored)
#   auth-reports/     — per-run Markdown reports (gitignored)

set -euo pipefail

QA_DIR="$(cd "$(dirname "$0")" && pwd)"
BASELINES="$QA_DIR/auth-baselines"
CAPTURES="$QA_DIR/auth-captures"
DIFFS="$QA_DIR/auth-diffs"
REPORTS="$QA_DIR/auth-reports"
PAGES_JSON="$QA_DIR/auth-pages.json"

WINDOW_W=1440
WINDOW_H=900
DIFF_THRESHOLD=1.0   # Slightly looser than public pages — auth pages have more dynamic content

QA_PROFILE_DIR="$HOME/.openclaw/browser/steve-chrome"
QA_DEBUG_PORT=9222   # Reuse the main Chrome instance (already running with steve-chrome profile)

MODE="${1:-}"
OPEN_REPORT=false
if [[ "${2:-}" == "--open" ]]; then OPEN_REPORT=true; fi

if [[ -z "$MODE" ]]; then
  echo "Usage: $0 check-auth | baseline | run [--open]"
  echo ""
  echo "  check-auth  — verify active DrawStack session before running QA"
  echo "  baseline    — capture authenticated golden screenshots"
  echo "  run         — compare current UI against baselines"
  exit 1
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
err()  { echo "[ERROR] $*" >&2; }
warn() { echo "[WARN]  $*"; }

check_deps() {
  command -v peekaboo >/dev/null 2>&1 || { err "peekaboo not found"; exit 1; }
  command -v magick   >/dev/null 2>&1 || { err "ImageMagick (magick) not found"; exit 1; }
  command -v python3  >/dev/null 2>&1 || { err "python3 not found"; exit 1; }
}

get_pages() {
  python3 -c "
import json, sys
data = json.load(open('$PAGES_JSON'))
for p in data['pages']:
    print(p['id'], p['url'], p['label'].replace(' ', '_'))
"
}

# ── Chrome / Session Management ───────────────────────────────────────────────

start_qa_chrome() {
  # Reuse the already-running Chrome on QA_DEBUG_PORT (main Chrome uses steve-chrome profile)
  if curl -s "http://localhost:${QA_DEBUG_PORT}/json/version" >/dev/null 2>&1; then
    log "Chrome ready (port $QA_DEBUG_PORT)"
    return 0
  fi

  # Fallback: start Chrome if not running
  log "Starting Chrome (profile: $QA_PROFILE_DIR)..."
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port="$QA_DEBUG_PORT" \
    --user-data-dir="$QA_PROFILE_DIR" \
    --window-size="${WINDOW_W},${WINDOW_H}" \
    --no-first-run \
    --no-default-browser-check \
    > /dev/null 2>&1 &

  local attempts=0
  while [[ $attempts -lt 10 ]]; do
    sleep 1
    if curl -s "http://localhost:${QA_DEBUG_PORT}/json/version" >/dev/null 2>&1; then
      log "Chrome ready"
      sleep 2
      return 0
    fi
    attempts=$((attempts + 1))
  done

  err "Chrome failed to start within 10 seconds"
  exit 1
}

get_qa_chrome_pid() {
  pgrep -f "remote-debugging-port=${QA_DEBUG_PORT}" 2>/dev/null | head -1 || echo "0"
}

get_qa_window_id() {
  # Return empty string — we'll use --mode frontmost in peekaboo calls
  # (Chrome is brought to front by navigate_qa_chrome via AppleScript activate)
  echo ""
}

navigate_qa_chrome() {
  local url="$1"

  osascript << APPLESCRIPT 2>/dev/null || true
tell application "Google Chrome"
    activate
    set URL of active tab of front window to "$url"
end tell
APPLESCRIPT

  sleep 5  # allow page load + Clerk auth check + JS hydration
}

check_auth_status() {
  # Returns 0 if authenticated, 1 if not
  navigate_qa_chrome "https://drawstack.ai/dashboard"
  sleep 2  # extra settle

  # Ask Peekaboo AI to assess the frontmost Chrome window
  local analysis
  analysis=$(peekaboo image \
    --mode frontmost \
    --analyze "Is this page a DrawStack dashboard with real content (projects, draws, nav sidebar) or a sign-in/login page? Answer ONLY 'AUTHENTICATED' or 'SIGN_IN'." \
    --path /tmp/drawstack-auth-check.png \
    --format png 2>/dev/null | grep -A5 "Analysis" | tail -3)

  echo "$analysis" | grep -qi "AUTHENTICATED" && return 0 || return 1
}

# ── Capture ───────────────────────────────────────────────────────────────────

capture_page() {
  local page_id="$1"
  local url="$2"
  local out_path="$3"

  log "Capturing: $page_id → $url"
  navigate_qa_chrome "$url"

  peekaboo image --mode frontmost --path "$out_path" --format png 2>/dev/null

  local size
  size=$(stat -f%z "$out_path" 2>/dev/null || stat -c%s "$out_path" 2>/dev/null || echo 0)

  if [[ ! -f "$out_path" || "$size" -lt 10000 ]]; then
    err "Capture failed or blank for $page_id (size: ${size}B)"
    return 1
  fi

  # Safety check: ensure we're not on a sign-in page
  local pg_analysis
  pg_analysis=$(peekaboo image \
    --mode frontmost \
    --analyze "Is this a DrawStack sign-in/login page? Answer ONLY 'YES' or 'NO'." \
    --path /tmp/auth-page-safety-check.png 2>/dev/null | grep -A3 "Analysis" | tail -2)

  if echo "$pg_analysis" | grep -qi "^YES"; then
    err "AUTH EXPIRED: $page_id redirected to sign-in. Aborting capture."
    rm -f "$out_path"
    return 2  # Special exit code: auth failure (not capture failure)
  fi

  log "  → saved: $out_path ($(du -h "$out_path" | cut -f1))"
  return 0
}

diff_images() {
  local baseline="$1"
  local capture="$2"
  local diff_out="$3"

  magick composite -compose difference "$baseline" "$capture" - 2>/dev/null | \
    magick - \( +clone -threshold 5% -fill red -colorize 100 \) \
      -compose over -composite "$diff_out" 2>/dev/null || true

  local pct
  pct=$(magick composite -compose difference "$baseline" "$capture" - 2>/dev/null | \
    magick - -colorspace Gray -threshold 5% -format "%[fx:mean*100]\n" info: 2>/dev/null || echo "0")

  echo "${pct:-0}"
}

# ── CHECK-AUTH ────────────────────────────────────────────────────────────────

run_check_auth() {
  log "=== DrawStack Auth QA — SESSION CHECK ==="

  start_qa_chrome

  log "Navigating to /dashboard to test session..."
  if check_auth_status; then
    log "✅ SESSION ACTIVE — authenticated QA is ready to run"
    log "   Run baseline:    ./drawstack-auth-qa.sh baseline"
    log "   Run comparison:  ./drawstack-auth-qa.sh run"
  else
    log ""
    log "❌ SESSION EXPIRED OR NOT LOGGED IN"
    log ""
    log "To fix:"
    log "  1. A Chrome window just opened with the QA profile"
    log "  2. Log in to drawstack.ai in that window"
    log "  3. Re-run: ./drawstack-auth-qa.sh check-auth"
    log ""
    log "See qa/drawstack/README-auth.md for full setup guide."
    exit 1
  fi
}

# ── BASELINE ──────────────────────────────────────────────────────────────────

run_baseline() {
  log "=== DrawStack Auth QA — BASELINE CAPTURE ==="

  start_qa_chrome

  log "Verifying session before capturing..."
  if ! check_auth_status; then
    err "Not authenticated. Run: ./drawstack-auth-qa.sh check-auth"
    exit 1
  fi
  log "Session verified ✅"
  echo ""

  mkdir -p "$BASELINES"

  local ts
  ts=$(date '+%Y-%m-%dT%H:%M:%S')
  local failed=0
  local auth_failed=0

  while IFS=' ' read -r page_id url label; do
    local out="$BASELINES/${page_id}.png"
    local exit_code=0
    capture_page "$page_id" "$url" "$out" || exit_code=$?

    if [[ $exit_code -eq 2 ]]; then
      auth_failed=$((auth_failed + 1))
      log "⚠️  Auth expired mid-run on $page_id. Stopping."
      break
    elif [[ $exit_code -ne 0 ]]; then
      failed=$((failed + 1))
    fi
  done < <(get_pages)

  echo ""
  if [[ $auth_failed -gt 0 ]]; then
    err "Auth expired during baseline capture. Re-login and retry."
    exit 1
  elif [[ $failed -eq 0 ]]; then
    echo "$ts" > "$BASELINES/.captured_at"
    log "✅ All authenticated baselines captured."
    log "   Timestamp: $ts"
    log "   Location: $BASELINES/"
    echo ""
    ls -lh "$BASELINES/"
  else
    err "$failed page(s) failed to capture. Check errors above."
    exit 1
  fi
}

# ── RUN ───────────────────────────────────────────────────────────────────────

run_qa() {
  log "=== DrawStack Auth QA — POST-DEPLOY RUN ==="

  if [[ ! -f "$BASELINES/.captured_at" ]]; then
    err "No auth baselines found. Run: ./drawstack-auth-qa.sh baseline"
    exit 1
  fi

  local baseline_ts
  baseline_ts=$(cat "$BASELINES/.captured_at")
  log "Baselines from: $baseline_ts"

  start_qa_chrome

  log "Verifying session..."
  if ! check_auth_status; then
    echo ""
    err "════════════════════════════════════════"
    err "AUTH FAILURE — not authenticated"
    err "Session may have expired."
    err ""
    err "To fix: ./drawstack-auth-qa.sh check-auth"
    err "Then re-run: ./drawstack-auth-qa.sh run"
    err "════════════════════════════════════════"
    exit 3  # Exit 3 = auth failure (distinct from exit 2 = visual failure)
  fi
  log "Session verified ✅"
  echo ""

  local ts
  ts=$(date '+%Y-%m-%dT%H-%M-%S')
  local run_dir="$REPORTS/$ts"
  local capture_dir="$CAPTURES/$ts"
  local diff_dir="$DIFFS/$ts"
  mkdir -p "$run_dir" "$capture_dir" "$diff_dir"

  local pass=0 fail=0 error=0 auth_fail=0
  local results_file
  results_file=$(mktemp /tmp/drawstack-auth-results.XXXXXX)
  trap "rm -f '$results_file'" RETURN

  set_result() { echo "${1}=${2}" >> "$results_file"; }
  get_result() { grep "^${1}=" "$results_file" 2>/dev/null | tail -1 | cut -d= -f2- || echo ""; }

  # Capture all pages
  while IFS=' ' read -r page_id url label; do
    local out="$capture_dir/${page_id}.png"
    local exit_code=0
    capture_page "$page_id" "$url" "$out" || exit_code=$?

    if [[ $exit_code -eq 2 ]]; then
      set_result "$page_id" "AUTH_EXPIRED"
      auth_fail=$((auth_fail + 1))
      log "⚠️  Auth expired on $page_id. Stopping run."
      break
    elif [[ $exit_code -ne 0 ]]; then
      set_result "$page_id" "ERROR"
      error=$((error + 1))
    fi
  done < <(get_pages)

  if [[ $auth_fail -gt 0 ]]; then
    err "Auth expired mid-run. Re-login and retry."
    exit 3
  fi

  # Diff against baselines
  log ""
  log "Comparing against baselines..."

  while IFS=' ' read -r page_id url label; do
    if [[ "$(get_result "$page_id")" == "ERROR" ]]; then
      continue
    fi

    local baseline="$BASELINES/${page_id}.png"
    local capture="$capture_dir/${page_id}.png"
    local diff_out="$diff_dir/${page_id}-diff.png"

    if [[ ! -f "$baseline" ]]; then
      log "  ⚠️  $page_id — no baseline, skipping"
      set_result "$page_id" "NO_BASELINE"
      continue
    fi

    if [[ ! -f "$capture" ]]; then
      log "  💥 $page_id — capture missing"
      set_result "$page_id" "ERROR"
      error=$((error + 1))
      continue
    fi

    # Normalize dimensions
    local baseline_dims
    baseline_dims=$(magick identify -format "%wx%h" "$baseline" 2>/dev/null || echo "")
    if [[ -n "$baseline_dims" ]]; then
      magick "$capture" -resize "${baseline_dims}!" "$capture" 2>/dev/null || true
    fi

    local pct
    pct=$(diff_images "$baseline" "$capture" "$diff_out")

    if python3 -c "import sys; sys.exit(0 if float('${pct:-0}') > $DIFF_THRESHOLD else 1)"; then
      set_result "$page_id" "FAIL:$pct%"
      fail=$((fail + 1))
      log "  ❌ $page_id — ${pct}% pixels differ (threshold: ${DIFF_THRESHOLD}%)"
    else
      set_result "$page_id" "PASS:$pct%"
      pass=$((pass + 1))
      log "  ✅ $page_id — ${pct}% pixels differ"
    fi
  done < <(get_pages)

  # Write report
  local report="$run_dir/report.md"
  {
    echo "# DrawStack Authenticated QA Report"
    echo ""
    echo "**Run:** $ts"
    echo "**Baselines from:** $baseline_ts"
    echo "**Threshold:** ${DIFF_THRESHOLD}% pixel difference"
    echo "**Auth role:** GC (General Contractor)"
    echo ""
    echo "## Summary"
    echo ""
    echo "| Status | Count |"
    echo "|--------|-------|"
    echo "| ✅ Pass | $pass |"
    echo "| ❌ Fail | $fail |"
    echo "| 💥 Error | $error |"
    echo ""
    echo "## Results"
    echo ""
    echo "| Page | Status | Diff % | Diff Image |"
    echo "|------|--------|--------|------------|"

    while IFS=' ' read -r page_id url label; do
      local status
      status=$(get_result "$page_id")
      [[ -z "$status" ]] && status="SKIPPED"
      local pct=""
      local diff_link=""
      if [[ "$status" =~ ^(PASS|FAIL):(.+)$ ]]; then
        pct="${BASH_REMATCH[2]}"
        status="${BASH_REMATCH[1]}"
        diff_link="[diff](../../auth-diffs/$ts/${page_id}-diff.png)"
      fi
      local icon="✅"
      [[ "$status" == "FAIL" ]] && icon="❌"
      [[ "$status" == "ERROR" ]] && icon="💥"
      [[ "$status" == "AUTH_EXPIRED" ]] && icon="🔐"
      echo "| ${label//_/ } | $icon $status | $pct | $diff_link |"
    done < <(get_pages)

    echo ""
    echo "## Auth Note"
    echo ""
    echo "These pages were captured while logged in as GC role (steve@alpinepropertygroupllc.com)."
    echo "No credentials are stored in this report. Screenshots show authenticated UI only."
    echo ""
    echo "## File Locations"
    echo ""
    echo "- Baselines: \`qa/drawstack/auth-baselines/\`"
    echo "- Captures:  \`qa/drawstack/auth-captures/$ts/\`"
    echo "- Diffs:     \`qa/drawstack/auth-diffs/$ts/\`"

  } > "$report"

  echo ""
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if [[ $fail -eq 0 && $error -eq 0 ]]; then
    log "✅ AUTH QA PASS ($pass/$((pass + fail + error)) pages)"
    log "Report: $report"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
  else
    log "❌ FAILURES: $fail fail, $error error, $pass pass"
    log "Report: $report"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 2
  fi
}

# ── MAIN ─────────────────────────────────────────────────────────────────────

check_deps

case "$MODE" in
  check-auth) run_check_auth ;;
  baseline)   run_baseline ;;
  run)        run_qa ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 check-auth | baseline | run [--open]"
    exit 1
    ;;
esac
