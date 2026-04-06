# HEARTBEAT.md

## 🚀 SESSION STARTUP (Do this FIRST on every new session!)
1. **CHECK DATE/TIME** — Run `session_status` to get current date, day of week, time
2. **READ `SESSION-STATE.md`** — Hot working memory: active tasks, decisions, open loops
3. **READ `clawson/priority-map.md`** — What matters and in what order
4. **READ `clawson/tasks.md`** — Live task list, what's due today
5. **READ `memory/WORKING.md`** — Active context, current state
6. **READ `memory/YYYY-MM-DD.md`** (today's date) — What happened today
7. **Check `data/global/mentions.json`** — Am I @mentioned?
8. Only THEN respond to user

**WRITE-AHEAD RULE:** Update SESSION-STATE.md BEFORE starting any non-trivial task, not after.
**DECISION RULE:** When uncertain whether to act or ask, consult `clawson/auto-resolver.md`.

**CRITICAL:** Never assume the day or date. Always verify. Trading decisions depend on accurate time awareness.

### Market Hours Reference (EST)
- **Pre-market:** 4:00 AM - 9:30 AM (Mon-Fri)
- **Regular:** 9:30 AM - 4:00 PM (Mon-Fri)
- **After-hours:** 4:00 PM - 8:00 PM (Mon-Fri)
- **Closed:** Saturday, Sunday, market holidays

This ensures situational awareness survives compaction and session restarts.

---

## 🧠 Memory Health Check (EVERY heartbeat - do this FIRST!)
1. Check if `memory/WORKING.md` has active trade positions
2. Check if `memory/YYYY-MM-DD.md` exists for today
3. If today's file is missing or <100 bytes AND there's been session activity → ALERT STEVE

## 📊 Context Integrity
- If you have knowledge of active trades/decisions NOT in WORKING.md → WRITE THEM NOW
- Compaction can happen any time. If it's not on disk, it doesn't exist.

## 🩺 AI Provider Health (Every heartbeat)
Run silently — only alert Steve if a critical provider is down:
```bash
node ~/.openclaw/workspace/scripts/model-health-check.js 2>/dev/null | grep -E '❌|CRITICAL' && echo "ALERT: Critical AI provider down" || true
```

## 🔧 Skill Health (Weekly — Sundays)
- Run: `node ~/.openclaw/workspace/scripts/skill-logger.js review`
- Flag any skill with fail rate ≥ 30% or unused for 30+ days to Steve
- Report saved to: `data/skills/skill-review.md`

## 📝 Skill Logging (When Using Skills) — MANDATORY
After invoking ANY skill (npm or workspace), ALWAYS log the outcome before replying:
```
node ~/.openclaw/workspace/scripts/skill-logger.js log <skill-name> <success|failure|partial> [brief note]
```
Keep notes short: "worked as expected", "API key missing", "output format wrong", etc.

**This is not optional.** Skipping it breaks the weekly health review.
Valid skill names: coding-agent, github, gh-issues, gog, xurl, gcal-pro, biz-reporter, vapi-calls,
  cold-email, brand-voice-profile, summarize, peekaboo, session-logs, skill-creator, clawhub,
  campaign-orchestrator, gdocs-markdown, seo-article-gen, seo-competitor-analysis, blogburst,
  business-development, weather, gemini, incident-hotfix, handoff-session, openclaw-safe-config-rollback

# Add other periodic checks below:

## 🏗️ DrawStack Post-Deploy Migration Audit (run after EVERY merge to main)
After any DrawStack PR merges to main, immediately run:
```
node /Users/openclaw/Projects/drawstack/scripts/audit-migrations.js
```
- Exit 0 = clean, no action needed
- Exit 1 = ALERT STEVE — list missing columns, apply ALTERs to Neon before users notice
- Pattern: squash merges silently drop migration folders. This has happened 3 times. Always audit.

## 🧠 Self-Improvement Sync (Weekly — during memory maintenance)

`.learnings/` = working capture layer (raw, structured, tagged, full detail)  
`LESSONS.md` = promoted highlights only (confirmed root causes worth keeping forever)

During weekly memory maintenance:
1. Review `~/.openclaw/workspace/.learnings/LEARNINGS.md` for entries with Status: `resolved`
2. Promote entries meeting ANY criteria to `memory/LESSONS.md`:
   - Category `correction` or `best_practice` + Status `resolved`
   - 2+ `See Also` links (recurring issue)
   - User-flagged entries
3. Review `.learnings/FEATURE_REQUESTS.md` monthly — mark implemented ones, surface still-valid ones to Steve
4. Do NOT promote: unresolved, project-specific one-offs, or already-obvious errors

## 🔔 PENDING ALERTS (clear when done)
