# WORKING.md - Active Context (Updated 2026-03-22 8:00 PM)

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

## DrawStack — SHIP-READY (2026-03-20)

**Live at:** drawstack.ai  
**Stack:** Next.js 16 · TypeScript · Clerk · Neon · Prisma · Vercel · AWS S3  
**Repo:** github.com/MassDwell/drawstack  
**Local:** ~/Projects/drawstack  

### Status: ✅ SHIP-READY (2026-03-22 — all 4 blitz gaps resolved, safety infra, SEO complete)

All QA bugs fixed + SEO/AI search stack deployed (2026-03-20 sprint).
World-class features added (2026-03-21 early AM sprint).

**Key working flows:**
- Onboarding (3-step GC setup) ✅
- Project creation + SOV ✅
- Draw wizard → PDF export ✅
- Stripe checkout LIVE (cs_live_) ✅
- Lender portal + invite flow ✅
- Mobile responsive ✅
- Per-line retainage ledger (held/released breakdown) ✅
- Change orders ✅
- SOV over-budget warnings ✅
- Invoice sub mapping ✅

**Pending Steve actions:**
- Submit sitemap.xml to Google Search Console
- Verify domain in GSC via GoDaddy DNS TXT record

**Last major deploy:** 2026-03-22 ~12:10 AM — CLA-236/237/238: Sub portal payment history, email notifications, mobile-first polish
**Previous deploy:** 2026-03-22 ~12:04 AM — Sub portal per-project dashboard (work items, invoice history, payment summary, submit invoice CTA)
**Previous deploy:** 2026-03-22 ~12:01 AM — Landing page updated (fake dashboard mockup, features trimmed, how-it-works flow)
**Previous deploy:** 2026-03-21 ~11:54 PM — Sub portal smart redirect, invoice badge, empty state improvements
**Previous deploy:** 2026-03-21 ~11:14 PM — Portfolio dashboard, white-label, and pricing page update
**Previous deploy:** 2026-03-21 ~9:18 PM — Admin portal upgrade (user emails, delete user, plan override, org detail, activity feed, draw pipeline view)

---

## Paperclip Orchestration
**Status:** OPERATIONAL
- Paperclip frontend: ports 3100/3101
- Auto-start crons running (PaperclipAI, Telegram Adapter, Paperclip Notifier)
