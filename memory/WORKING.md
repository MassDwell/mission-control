# WORKING.md - Active Context

_Last updated: 2026-02-06 ~7:30 PM EST_

---

## 🎯 TRADING DIRECTIVE

**#1 Goal: Make Steve a ton of money.**

---

## 🔴 ACTIVE TRADE POSITIONS

### SOFI (13 shares) — Long-term hold
- **Entry:** $21.26
- **Thesis:** Long-term hold

### Account Status
- **Net Liq:** ~$3,658
- **Platform:** Interactive Brokers (TWS)
- **Day's P/L:** -$805 (puts lost, call gained)

---

## 📋 ACTIVE WORKSTREAMS

### 1. MC-008: Portal Production Ready (Priority: HIGH)
- **Status:** In Progress, Phase 1 documented
- **Branding spec:** `data/massdwell/portal-branding-spec.md`
- **Phase 1:** Branding (logo, colors, background) - ready for tomorrow AM
- **Phase 2:** Image cropping (132 images) - tomorrow
- **Softr login:** sales@massdwell.com / MassDwell2026!
- **Portal URL:** https://portal.massdwell.com

### 2. Agent Loop - FIXED ✅
- Created SOP: `data/global/sops/task-execution-loop.md`
- Updated heartbeats for: marketing_content, sales_followup, chief_of_staff
- Agents now check Mission Control for tasks and EXECUTE work
- Models enabled: opus, sonnet, haiku (all allowed now)

### 3. Mission Control Updates ✅
- Added ACTIVE/IDLE status badges to dashboard
- Created `scripts/mc-update.sh` CLI for task tracking
- MC-002 (Finish Selections) → DONE
- MC-008 (Portal Production) → IN PROGRESS

---

## 🔑 API ACCESS STATUS

| Account | Gmail | Calendar | Drive | Sheets |
|---------|-------|----------|-------|--------|
| sales@massdwell.com | ✅ | ✅ | ✅ | ✅ |
| steve.vettori@massdwell.com | ✅ | ✅ | ✅ | ✅ |
| vettoristeve@gmail.com | ✅ | ✅ | ❌ | ? |

---

## 🔐 SECURITY

- Git credentials PURGED from repo history
- `.gitignore` added - credentials no longer tracked
- GitHub push protection disabled for MassDwell/mission-control repo

---

## 📝 KEY DECISIONS TODAY

1. **Single-agent + sub-agents** — Clawson orchestrates, spawns for heavy work
2. **Agent loop fixed** — Agents now actually execute Mission Control tasks
3. **Portal phased** — Branding tonight/tomorrow, images Phase 2
4. **Cost discipline** — Haiku for simple, Sonnet for general, Opus for complex

---

## ⏰ SCHEDULED ITEMS

- **Tomorrow 7:00 AM:** Morning briefing
- **Tomorrow 7:30 AM:** marketing_content wakes, should pick up MC-008
- **Tomorrow 9:00 AM:** AI Operations X thread auto-posts
