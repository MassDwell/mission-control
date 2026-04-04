# DrawStack Authenticated QA

Visual regression coverage for **logged-in DrawStack pages**, using Peekaboo + ImageMagick.

---

## Quick Reference

```bash
cd ~/.openclaw/workspace/qa/drawstack

# Step 1: Verify/setup auth (do this first, and after any session expiry)
./drawstack-auth-qa.sh check-auth

# Step 2: Capture baselines (first time, or after intentional UI change)
./drawstack-auth-qa.sh baseline

# Step 3: After every deploy
./drawstack-auth-qa.sh run
```

---

## Pages Covered

| Page | URL | Why |
|------|-----|-----|
| Projects List | /dashboard/projects | Primary GC landing page — every user sees this |
| Draws List | /dashboard/draws | Core billing flow — status badges, amounts, actions |
| Invoices | /dashboard/invoices | Sub payment tracking — upload UI + invoice table |
| Settings | /dashboard/settings | Config forms — breaks from Clerk/Stripe component updates |
| Portfolio | /dashboard/portfolio | Lender-style view — different data layout, high regression risk |

All pages use **GC role** (steve@alpinepropertygroupllc.com).

---

## Auth Strategy

**Method: Persistent Chrome Profile Session**

We use a dedicated Chrome profile stored at `~/.openclaw/browser/steve-chrome/`.
This profile holds Steve's Clerk session cookies for drawstack.ai.
The QA script launches Chrome with this profile on a dedicated debug port (9224),
navigates each page, and captures screenshots via Peekaboo.

**Why this approach:**
- No test users to manage or clean up
- No hardcoded credentials anywhere in the QA system
- Clerk session tokens (via `__session` + `__refresh`) persist for ~1 year
- One-time manual login; then automated for months
- Clean, secure, pragmatic

**What is NOT stored:**
- No passwords anywhere in this QA system
- No tokens in reports, logs, or diff images
- Screenshots capture UI layout only, not API responses or credentials

---

## First-Time Setup / Session Refresh

When `check-auth` reports expired:

1. **Run check-auth** — this starts the QA Chrome window:
   ```bash
   ./drawstack-auth-qa.sh check-auth
   ```

2. **Log in manually** in the QA Chrome window that opens:
   - Go to: `https://drawstack.ai/sign-in`
   - Log in as: `steve@alpinepropertygroupllc.com`
   - Complete Clerk auth

3. **Verify** the session is active:
   ```bash
   ./drawstack-auth-qa.sh check-auth
   # Should print: ✅ SESSION ACTIVE
   ```

4. **Capture baselines** (first time) or **run comparison**:
   ```bash
   ./drawstack-auth-qa.sh baseline
   # or
   ./drawstack-auth-qa.sh run
   ```

Once logged in, the session lasts ~1 year (Clerk `__refresh` token).
You should not need to re-login often.

---

## Operator Flow

### Routine Post-Deploy Check

```bash
cd ~/.openclaw/workspace/qa/drawstack

# Quick auth check first (30 seconds)
./drawstack-auth-qa.sh check-auth

# If ✅: run QA
./drawstack-auth-qa.sh run

# Exit codes:
#   0 = all pass
#   2 = visual regression(s) detected — review report
#   3 = auth failure — re-login and retry
```

### Reviewing a Visual Failure

1. Open `auth-reports/TIMESTAMP/report.md`
2. For each ❌ page: open `auth-diffs/TIMESTAMP/PAGE_ID-diff.png`
   - Red pixels = what changed between baseline and current deploy
3. Compare side-by-side:
   - `auth-baselines/PAGE_ID.png` — what it should look like
   - `auth-captures/TIMESTAMP/PAGE_ID.png` — what it looks like now
4. Decide: regression or intentional change?

### Updating Baselines (Intentional UI Change)

```bash
# ONLY run this when a UI change has been approved and you want to set a new golden
./drawstack-auth-qa.sh baseline
# This OVERWRITES existing baselines — irreversible (but gitignore + git track auth-baselines/)
```

### Check When Baselines Were Last Set

```bash
cat auth-baselines/.captured_at
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All pages pass — no regressions |
| 1 | Script error (missing deps, config issue) |
| 2 | Visual regression(s) detected — check report |
| 3 | **Auth failure** — session expired, re-login needed |

Exit code 3 is **distinct from visual failures** so automated pipelines can handle them differently.

---

## File Structure

```
qa/drawstack/
├── drawstack-auth-qa.sh     # Authenticated QA script
├── auth-pages.json          # Auth page surface definition
├── README-auth.md           # This file
├── auth-baselines/          # Golden screenshots (track in git — no secrets)
│   ├── projects-list.png
│   ├── dashboard-draws.png
│   ├── dashboard-invoices.png
│   ├── dashboard-settings.png
│   ├── lender-portfolio.png
│   └── .captured_at
├── auth-captures/           # Per-run captures (gitignored)
│   └── TIMESTAMP/
├── auth-diffs/              # Per-run diff images (gitignored)
│   └── TIMESTAMP/
└── auth-reports/            # Per-run Markdown reports (gitignored)
    └── TIMESTAMP/
        └── report.md
```

---

## Security Notes

- **No credentials stored** in QA files, reports, or diff images
- Screenshots only capture visual layout — no token/API data visible in UI
- Chrome profile stores Clerk session cookies (encrypted by macOS Keychain)
- The `auth-baselines/` folder contains PNG screenshots only — safe to commit to git
- `auth-captures/`, `auth-diffs/`, `auth-reports/` are gitignored

---

## Threshold

Auth pages use a slightly looser diff threshold (`1.0%` vs `0.5%` for public pages).
Reason: authenticated pages contain live data (project names, amounts, dates) that will
differ slightly between captures even with no code changes. The 1.0% threshold absorbs
this noise while still catching actual layout regressions.

Adjust `DIFF_THRESHOLD` in `drawstack-auth-qa.sh` if needed.

---

## Limitations

- **Single role only:** GC role covered (steve@alpinepropertygroupllc.com). Lender/inspector
  views are not separately covered — add a second profile when needed.
- **No dynamic content masking:** Timestamps, project names, amounts in the screenshots
  will vary. The 1.0% threshold should absorb this; if specific pages have too much noise,
  increase their threshold or add masking.
- **No mobile/responsive:** All captures at 1440×900 desktop. 
- **Manual re-login required** when session expires (~yearly) or is invalidated.
- **Single-user QA:** No coverage of multi-user flows (lender reviews a GC's draw, etc.)
