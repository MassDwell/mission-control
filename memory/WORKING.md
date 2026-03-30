# WORKING.md - Active Context (Updated 2026-03-28 08:25 AM EDT)

## Active Trades
**None.** Money Printer was deactivated 2026-03-04. No active trading strategy.

---

## MeritLayer — SHUT DOWN (2026-03-13)
Steve cancelled the project. All resources wiped.

**Still needs manual browser cleanup:**
- Neon DB → console.neon.tech (delete `ep-crimson-field` project)
- Resend domain → resend.com/domains (remove meritlayer.ai)
- Clerk app → dashboard.clerk.com (delete app entirely)
**Domain:** meritlayer.ai stays on GoDaddy (Steve wants to keep it)

---

## DrawStack — PRODUCTION (Live at drawstack.ai)

**Stack:** Next.js · TypeScript · Clerk · Neon · Prisma · Vercel · AWS S3  
**Repo:** github.com/MassDwell/drawstack  
**Local:** ~/Projects/drawstack  

### Status: ✅ LIVE — Post-launch polish ongoing

**Key working flows:**
- Onboarding (3-step GC setup) ✅
- Project creation + SOV ✅
- Draw wizard → PDF export ✅
- Stripe checkout LIVE (cs_live_) ✅
- Lender portal + invite flow ✅
- Mobile responsive ✅
- Per-line retainage ledger (held/released breakdown) ✅
- Analytics: Retainage Tracker + Cost-to-Complete Projection (CLA-262) ✅

**Landing page (merged 2026-03-26):**
- PR #37: Navy/cyan redesign, two-column hero ✅
- PR #38: Hotfix server component onMouseOver crash ✅
- PR #39: Hero copy (anti-enterprise, "Start free — no sales call") ✅
- PR #40: /vs-rabbet SEO comparison page ✅

**Active bugs (as of 2026-03-29):**
- Lender invite redeem `/invite/[token]/redeem` crashes when user already has OrgMember record
  - Root cause: existing GC org being used for LenderProjectAccess → constraint violation
  - Fix in progress: check org type, create new LENDER org if needed

**Major work completed 2026-03-29:**
- Subs tab 3-bug fix: nested Neon HTTP includes, GC auth mismatch, sub portal Access Denied (S3 presigned URLs) ✅
- SubInvoice → Invoice unification (Option B — unified model, SubInvoice model deprecated) — branch: feature/unified-invoice-model (Claude Code in progress)
- Project archive UI bug fixed (was hidden but not inaccessible) ✅
- Project cascade delete added (OWNER-only, confirmation modal) ✅
- UX audit (3 portals) completed — 9 P0 launch blockers documented ✅
  - Saved to: data/drawstack/drawstack-ux-audit-march-2026.md
- Hermes independent UX audit spawned (cross-reference pending) 🔄
- System stabilization: watchdog false positives fixed, Paperclip lockfile, zombie agents purged, Telegram adapter backoff ✅
- Hermes agent deployed — reliability governor + post-run learning layer ✅

**Logo work (2026-03-27):**
- Logo SVG redesigned: 3 horizontal pills (D-shape) in cyan-teal gradient on dark navy bg
- logo.svg, logo-dark.svg updated in /public
- Twitter/X profile photo generated: public/twitter-profile-photo.png (400x400, dark navy + D mark)
- X (Twitter) account: @TheDrawStack — OAuth 1.0 configured in xurl (app: drawstack)
- xurl credentials saved but tweet test returned empty {} error — needs debugging
- Steve wants to post to X; profile photo ready to upload manually

**Google Ads (launched 2026-03-27):**
- Campaign LIVE at $50/day budget
- Ad strength: 95.3% (Excellent)
- First impression received on launch day
- Conversion tracking flagged as having issues — needs investigation (GA4 event linkage or tag firing)
- Check-in reminder set for 2026-03-30 9 AM EDT

**Stable checkpoint:** `checkpoint-2026-03-22-stable` | SHA: `4e461d6`
Recovery: `git checkout checkpoint-2026-03-22-stable` + Neon PITR to 2026-03-22 17:38 EDT

**Pending Steve actions:**
- Upload twitter-profile-photo.png to @TheDrawStack X profile
- Fix xurl tweet posting (OAuth 1.0 configured, but {} error on post)
- Submit sitemap.xml to Google Search Console
- Verify domain in GSC via GoDaddy DNS TXT record
- Manual cleanup: Neon DB, Clerk app, Resend domain (MeritLayer remnants)

---

## Credentials Status
- **Gmail massdwell tokens:** ❌ EXPIRED — all 3 refresh tokens revoked (2026-03-26)
  - gog CLI (vettoristeve@gmail.com) still works fine
  - massdwell Gmail needs reauth when Steve is available
- **Google Workspace (sales@massdwell.com):** credentials/google/gmail-token.json — needs refresh

---

## Paperclip Orchestration
**Status:** OPERATIONAL
- Paperclip frontend: ports 3100/3101
- Auto-start crons running every 30 min, all healthy
- Services: PaperclipAI ✅ Telegram Adapter ✅ Paperclip Notifier ✅ Chrome ✅ Metaclaw ✅
