# WORKING.md - Active Context
_Updated: 2026-04-05 20:00 EDT_

## Active Trades
**None.** No active trading strategy.

---

## DrawStack — PRODUCTION (Live at drawstack.ai)

**Stack:** Next.js · TypeScript · Clerk · Neon · Prisma · Vercel · AWS S3  
**Repo:** github.com/MassDwell/drawstack  
**Local:** ~/Projects/drawstack  

### Status: ✅ LIVE

**Open PRs:**
- **PR #203** — `feature/cc-required-trial` — Credit card required trial + onboarding email sequence. Open against staging, awaiting Steve review/merge.

**Pending Steve actions:**
- Review + merge PR #203 (CC-required trial)
- Enable DATABASE_URL "Build" checkbox in Vercel env vars (auto-run migrations on deploy)
  URL: vercel.com/steve-vettoris-projects/drawstack/settings/environment-variables
- Upload twitter-profile-photo.png to @TheDrawStack X profile (public/twitter-profile-photo.png ready)
- Fix xurl tweet posting ({} error on OAuth 1.0 post)
- Submit sitemap.xml to Google Search Console
- Verify GSC domain via GoDaddy DNS TXT record
- Manual MeritLayer cleanup: Neon DB (ep-crimson-field), Clerk app, Resend domain (meritlayer.ai)

**Stable checkpoint:** `checkpoint-2026-03-22-stable` | SHA: `4e461d6`

---

## MassDwell Hub — PRODUCTION (Live at massdwellhub.com)

**Stack:** Next.js 14 · Tailwind + shadcn/ui · Supabase · Clerk (restricted/allowlist) · Vercel  
**Repo:** github.com/MassDwell/massdwell-hub  
**Local:** ~/Projects/massdwell-hub  

### Status: ✅ LIVE — Restricted access (allowlist only)

**Modules live:** Dashboard/Sales Cheat Sheet, Build Cost Tracker, ADU Permit Navigator, Contracts, Trade Partner Program (in progress)

**Allowlist (Clerk):** steve.vettori, nick.ferreira, jon.proctor, chris.bradley@massdwell.com; carlos.ferreira, thayana.fernandes, patricia.luna@aacsteel.com

**In progress:**
- Trade Partner Program page being built by Claude Code (session: salty-pine)

**Pending Steve actions:**
- Test login at massdwellhub.com (confirm it works)
- Invite team members once confirmed working

---

## Credentials Status
- **Gmail massdwell (sales@massdwell.com):** ❌ EXPIRED — tokens revoked. Needs Steve to re-run OAuth flow.
- **Gmail vettoristeve:** gog CLI works fine
- **Google OAuth (MassDwell Hub / Clerk):** ✅ Fixed — Web app client configured in GCP

---

## Open Steve Actions Summary
1. Gmail OAuth reauth (sales@massdwell.com)
2. DrawStack PR #203 review
3. DrawStack Vercel DATABASE_URL build checkbox
4. @TheDrawStack X profile photo upload
5. MeritLayer manual cleanup (Neon, Clerk, Resend)
6. massdwellhub.com login test

---

## Paperclip Orchestration
**Status:** OPERATIONAL — ports 3100/3101, keepalive + stale-run-recovery crons running every 30 min
