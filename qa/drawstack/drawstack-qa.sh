#!/usr/bin/env bash
# DrawStack Post-Deploy QA — Peekaboo visual regression
# Usage:
#   ./drawstack-qa.sh baseline     — capture new baselines (intentional UI change)
#   ./drawstack-qa.sh run          — post-deploy comparison against baselines
#   ./drawstack-qa.sh run --open   — run + open diff report in browser when done
#
# Requirements: peekaboo, magick (ImageMagick), Chrome with --remote-debugging-port=9222
# Output: qa/drawstack/reports/YYYY-MM-DDTHH-MM-SS/report.md

set -euo pipefail

QA_DIR="$(cd "$(dirname "$0")" && pwd)"
BASELINES="$QA_DIR/baselines"
CAPTURES="$QA_DIR/captures"
DIFFS="$QA_DIR/diffs"
REPORTS="$QA_DIR/reports"
PAGES_JSON="$QA_DIR/pages.json"

WINDOW_W=1440
WINDOW_H=900

# Diff threshold: % of pixels that must differ to call it a regression
# 0.5% = minor rendering artifacts acceptable; >0.5% = flag for review
DIFF_THRESHOLD=1.0

MODE="${1:-}"
OPEN_REPORT=false
if [[ "${2:-}" == "--open" ]]; then OPEN_REPORT=true; fi

if [[ -z "$MODE" ]]; then
  echo "Usage: $0 baseline | run [--open]"
  exit 1
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

log() { echo "[$(date '+%H:%M:%S')] $*"; }
err() { echo "[ERROR] $*" >&2; }

check_deps() {
  command -v peekaboo >/dev/null 2>&1 || { err "peekaboo not found"; exit 1; }
  command -v magick >/dev/null 2>&1 || { err "ImageMagick (magick) not found"; exit 1; }
  command -v python3 >/dev/null 2>&1 || { err "python3 not found"; exit 1; }
}

get_pages() {
  python3 -c "
import json, sys
pages = json.load(open('$PAGES_JSON'))['pages']
for p in pages:
    print(p['id'], p['url'], p['label'].replace(' ', '_'))
"
}

ensure_chrome() {
  # Check if Chrome is already running with remote debugging
  if ! curl -s http://localhost:9222/json/version >/dev/null 2>&1; then
    log "Starting Chrome with remote debugging..."
    open -a "Google Chrome" --args \
      --remote-debugging-port=9222 \
      --user-data-dir="$HOME/.openclaw/browser/steve-chrome" \
      --window-size="$WINDOW_W,$WINDOW_H" \
      --no-first-run \
      --no-default-browser-check \
      --disable-extensions \
      >/dev/null 2>&1 &
    sleep 3
    curl -s http://localhost:9222/json/version >/dev/null 2>&1 || { err "Chrome remote debug not responding"; exit 1; }
    log "Chrome ready"
  else
    log "Chrome already running"
  fi
}

capture_page() {
  local page_id="$1"
  local url="$2"
  local out_path="$3"

  log "Capturing: $page_id → $url"

  # Navigate existing Chrome window to URL
  peekaboo open "$url" --app "Google Chrome" >/dev/null 2>&1 || true
  sleep 4  # allow page to fully render (fonts, images, JS)

  # Get the first (main) Chrome window ID dynamically
  local win_id
  win_id=$(peekaboo list windows --app "Google Chrome" 2>/dev/null \
    | grep -E "^[0-9]+\." | grep -v "Untitled" | head -1 \
    | grep -oE "ID: [0-9]+" | grep -oE "[0-9]+$" || true)

  if [[ -z "$win_id" ]]; then
    # Fallback: grab the first window ID regardless of title
    win_id=$(peekaboo list windows --app "Google Chrome" 2>/dev/null \
      | grep -E "ID: [0-9]+" | head -1 | grep -oE "[0-9]+$" || echo "")
  fi

  if [[ -n "$win_id" ]]; then
    peekaboo image --window-id "$win_id" --path "$out_path" --format png 2>/dev/null
  else
    # Last resort: frontmost window
    peekaboo image --mode frontmost --path "$out_path" --format png 2>/dev/null
  fi

  # Validate: file must exist and be > 10KB (not blank/placeholder)
  if [[ ! -f "$out_path" || $(stat -f%z "$out_path" 2>/dev/null || stat -c%s "$out_path" 2>/dev/null || echo 0) -lt 10000 ]]; then
    err "Capture failed or too small for $page_id"
    return 1
  fi

  log "  → saved: $out_path ($(du -h "$out_path" | cut -f1))"
}

diff_images() {
  local baseline="$1"
  local capture="$2"
  local diff_out="$3"

  # Generate a highlighted diff image (red = changed pixels)
  magick composite -compose difference "$baseline" "$capture" - 2>/dev/null | \
    magick - \( +clone -threshold 5% -fill red -colorize 100 \) \
      -compose over -composite "$diff_out" 2>/dev/null || true

  # Calculate % of pixels that differ (composite difference approach — reliable across colorspaces)
  local pct
  pct=$(magick composite -compose difference "$baseline" "$capture" - 2>/dev/null | \
    magick - -colorspace Gray -threshold 5% -format "%[fx:mean*100]\n" info: 2>/dev/null || echo "0")

  echo "${pct:-0}"
}

# ── BASELINE MODE ─────────────────────────────────────────────────────────────

run_baseline() {
  log "=== DrawStack QA — BASELINE CAPTURE ==="
  log "This will overwrite existing baselines."
  echo ""

  ensure_chrome
  mkdir -p "$BASELINES"

  local ts
  ts=$(date '+%Y-%m-%dT%H:%M:%S')
  local failed=0

  while IFS=' ' read -r page_id url label; do
    local out="$BASELINES/${page_id}.png"
    if ! capture_page "$page_id" "$url" "$out"; then
      failed=$((failed + 1))
    fi
  done < <(get_pages)

  echo ""
  if [[ $failed -eq 0 ]]; then
    echo "$ts" > "$BASELINES/.captured_at"
    log "✅ All baselines captured. Timestamp: $ts"
    log "   Location: $BASELINES/"
  else
    log "⚠️  $failed page(s) failed to capture. Check errors above."
    exit 1
  fi
}

# ── RUN MODE ─────────────────────────────────────────────────────────────────

run_qa() {
  log "=== DrawStack QA — POST-DEPLOY RUN ==="

  if [[ ! -f "$BASELINES/.captured_at" ]]; then
    err "No baselines found. Run: ./drawstack-qa.sh baseline"
    exit 1
  fi
  local baseline_ts
  baseline_ts=$(cat "$BASELINES/.captured_at")
  log "Baselines from: $baseline_ts"
  echo ""

  ensure_chrome

  local ts
  ts=$(date '+%Y-%m-%dT%H-%M-%S')
  local run_dir="$REPORTS/$ts"
  mkdir -p "$run_dir"
  local capture_dir="$CAPTURES/$ts"
  mkdir -p "$capture_dir"
  local diff_dir="$DIFFS/$ts"
  mkdir -p "$diff_dir"

  local pass=0 fail=0 error=0
  local results_file
  results_file=$(mktemp /tmp/drawstack-qa-results.XXXXXX)
  trap "rm -f '$results_file'" RETURN

  set_result() { echo "${1}=${2}" >> "$results_file"; }
  get_result() { grep "^${1}=" "$results_file" 2>/dev/null | tail -1 | cut -d= -f2- || echo ""; }

  # Capture all pages
  while IFS=' ' read -r page_id url label; do
    local out="$capture_dir/${page_id}.png"
    if ! capture_page "$page_id" "$url" "$out"; then
      set_result "$page_id" "ERROR"
      error=$((error + 1))
    fi
  done < <(get_pages)

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

    # Resize capture to match baseline dimensions (handles minor browser chrome diffs)
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
    echo "# DrawStack QA Report"
    echo ""
    echo "**Run:** $ts"
    echo "**Baselines from:** $baseline_ts"
    echo "**Threshold:** ${DIFF_THRESHOLD}% pixel difference"
    echo ""
    echo "## Summary"
    echo ""
    echo "| Status | Count |"
    echo "|--------|-------|"
    echo "| ✅ Pass | $pass |"
    echo "| ❌ Fail | $fail |"
    echo "| ⚠️  Error | $error |"
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
        diff_link="[diff](../../diffs/$ts/${page_id}-diff.png)"
      fi
      local icon="✅"
      [[ "$status" == "FAIL" ]] && icon="❌"
      [[ "$status" == "ERROR" ]] && icon="💥"
      echo "| ${label//_/ } | $icon $status | $pct | $diff_link |"
    done < <(get_pages)

    echo ""
    echo "## Pages Tested"
    echo ""
    python3 -c "
import json
pages = json.load(open('$PAGES_JSON'))['pages']
for p in pages:
    print(f\"### {p['label']}\")
    print(f\"- **URL:** {p['url']}\")
    print(f\"- **Check:** {p['check']}\")
    print()
"
    echo ""
    echo "## File Locations"
    echo ""
    echo "- Baselines: \`qa/drawstack/baselines/\`"
    echo "- Captures:  \`qa/drawstack/captures/$ts/\`"
    echo "- Diffs:     \`qa/drawstack/diffs/$ts/\`"
    echo "- This report: \`qa/drawstack/reports/$ts/report.md\`"
    echo ""
    echo "## Reviewing Failures"
    echo ""
    echo "1. Open the diff image (red = changed pixels)"
    echo "2. Compare baseline vs capture side by side"
    echo "3. If change is intentional: run \`./drawstack-qa.sh baseline\` to update"
    echo "4. If change is a regression: fix and re-deploy, then re-run QA"

  } > "$report"

  echo ""
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if [[ $fail -eq 0 && $error -eq 0 ]]; then
    log "✅ ALL PASS ($pass/$((pass + fail + error)) pages)"
  else
    log "❌ FAILURES DETECTED: $fail fail, $error error, $pass pass"
  fi
  log "Report: $report"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if $OPEN_REPORT; then
    open "$report"
  fi

  [[ $fail -eq 0 && $error -eq 0 ]] && exit 0 || exit 2
}

# ── MAIN ─────────────────────────────────────────────────────────────────────

check_deps

case "$MODE" in
  baseline) run_baseline ;;
  run)      run_qa ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 baseline | run [--open]"
    exit 1
    ;;
esac
