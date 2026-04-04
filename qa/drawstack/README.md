# DrawStack Post-Deploy QA

Visual regression checks for the 5 highest-value DrawStack pages, using Peekaboo + ImageMagick.

---

## Quick Reference

```bash
# First time / after intentional UI change:
cd ~/.openclaw/workspace/qa/drawstack
./drawstack-qa.sh baseline

# After every deploy:
./drawstack-qa.sh run

# After deploy — run and open report automatically:
./drawstack-qa.sh run --open
```

---

## Pages Tested

| Page | URL | Why |
|------|-----|-----|
| Marketing Home | drawstack.ai/ | First impression, SEO anchor |
| Pricing | drawstack.ai/pricing | Conversion-critical layout |
| vs Rabbet | drawstack.ai/vs-rabbet | High-intent SEO comparison table |
| Sign In | drawstack.ai/sign-in | Auth gate — if broken, everyone is locked out |
| Blog Index | drawstack.ai/blog | SEO traffic entry point |

To add/change pages: edit `pages.json`.

---

## How It Works

### Baseline Capture
- Opens each URL in Chrome (with the existing Steve-profile browser instance)
- Takes a full window screenshot via Peekaboo
- Saves to `baselines/PAGE_ID.png`
- Records timestamp in `baselines/.captured_at`

### Post-Deploy Run
- Opens each URL in Chrome
- Takes fresh screenshots
- Pixel-diffs each against the baseline using ImageMagick `compare`
- Any page with **>0.5% pixels changed** = FAIL
- Writes a Markdown report to `reports/TIMESTAMP/report.md`
- Diff images (red = changed) saved to `diffs/TIMESTAMP/PAGE_ID-diff.png`

### Pass/Fail Logic
```
diff_pct = changed_pixels / total_pixels × 100
PASS if diff_pct ≤ 0.5%
FAIL if diff_pct > 0.5%
```

Threshold is set at 0.5% — this allows minor rendering noise (anti-aliasing, subpixel) 
while catching actual layout regressions. Adjust `DIFF_THRESHOLD` in `drawstack-qa.sh` if needed.

---

## Operator Flow

### First-Time Setup
```bash
cd ~/.openclaw/workspace/qa/drawstack
./drawstack-qa.sh baseline
# → baselines/*.png written
# → baselines/.captured_at written
```

### Routine Post-Deploy Check
```bash
cd ~/.openclaw/workspace/qa/drawstack
./drawstack-qa.sh run
# → Exit 0 = all pass
# → Exit 2 = failures detected (check report)
```

### Reviewing a Failure
1. Open `reports/TIMESTAMP/report.md`
2. For each ❌ page: open `diffs/TIMESTAMP/PAGE_ID-diff.png`
   - Red pixels = what changed
3. Side-by-side: `baselines/PAGE_ID.png` vs `captures/TIMESTAMP/PAGE_ID.png`
4. Decide: regression or intentional?

### Updating Baselines (Intentional UI Change)
```bash
./drawstack-qa.sh baseline
# This OVERWRITES existing baselines — only run when the UI change is approved
```

### Checking What Baseline You're On
```bash
cat baselines/.captured_at
```

---

## File Structure

```
qa/drawstack/
├── drawstack-qa.sh          # Main QA script
├── pages.json               # Page surface definition
├── README.md                # This file
├── baselines/               # Golden screenshots (committed to git)
│   ├── home.png
│   ├── pricing.png
│   ├── vs-rabbet.png
│   ├── sign-in.png
│   ├── blog-index.png
│   └── .captured_at
├── captures/                # Per-run screenshots (gitignored)
│   └── TIMESTAMP/
├── diffs/                   # Per-run diff images (gitignored)
│   └── TIMESTAMP/
└── reports/                 # Per-run Markdown reports (gitignored)
    └── TIMESTAMP/
        └── report.md
```

---

## Requirements

- `peekaboo` — `/opt/homebrew/bin/peekaboo`
- `magick` — ImageMagick 7 (`/opt/homebrew/bin/magick`)
- Chrome running with `--remote-debugging-port=9222` (auto-started by script if needed)
- `python3` — for percentage math

---

## Threshold Tuning

In `drawstack-qa.sh`, line:
```bash
DIFF_THRESHOLD=0.5
```

- `0.5` = 0.5% of pixels can change (good default)
- Lower = more sensitive (more false positives from rendering noise)
- Higher = less sensitive (may miss subtle regressions)

---

## Authenticated Pages

Authenticated page coverage is implemented separately. See **README-auth.md**.

```bash
# Auth workflow:
./drawstack-auth-qa.sh check-auth   # verify session
./drawstack-auth-qa.sh baseline     # capture auth baselines
./drawstack-auth-qa.sh run          # post-deploy auth comparison
```

Covers: Projects list, Draws list, Invoices, Settings, Portfolio (GC role).

---

## Limitations
- Mobile/responsive views not covered — all captures are at 1440×900 desktop.
- Dynamic content (live data, timestamps) will always show small diffs — the 0.5%
  threshold handles most of this gracefully.
- No network-level smoke checks (HTTP 200, API health) — this is visual-only.
- Script exits 2 on failures — wire to CI/CD `|| notify` pattern if needed later.
