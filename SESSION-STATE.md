# SESSION-STATE.md — Hot Working Memory

_Write this BEFORE responding to any task that changes state. Never after._
_Last updated: 2026-04-04 07:22 EDT_

---

## 🔴 Active Task
None — clean session start.

## 📋 Open Loops
- massdwellhub.com — deployed and redirecting to /sign-in ✅ (fixed 2026-04-03)
- Supabase cogs_projects save fix — deployed (margin rounding + service role key) ✅
- MassDwell Hub team invites sent (6 people) ✅
- Hermes removed from system ✅
- SOUL.md rewritten ✅

## 🚧 Blockers / Pending
- WORKING.md is stale (last updated 2026-04-01) — needs refresh
- SESSION-STATE.md just initialized (this is it)

## 🧠 Active Decisions (in force)
- No Hermes. No event-bus emit. Removed 2026-04-04.
- SESSION-STATE write-ahead protocol now active.
- All Supabase API routes use supabaseAdmin (service role key).
- massdwellhub.com middleware: explicit redirect to /sign-in for unauthenticated users.
- CRM: GoHighLevel (replaced Kommo 2026-04-03).

## 📅 Last Significant Events
- 2026-04-04: Hermes fully removed; SOUL.md rewritten; SESSION-STATE.md initialized
- 2026-04-03: massdwellhub.com launched, team invited, Google OAuth fixed, CRM switched to GHL
- 2026-04-02: MassDwell Hub built, Clerk auth configured, Runtime v1 established

---
_This file is hot RAM. Keep it current. Archive to daily log when session ends._
