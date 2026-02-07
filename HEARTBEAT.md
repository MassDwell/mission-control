# HEARTBEAT.md

## 🚀 SESSION STARTUP (Do this FIRST on every new session!)
1. **CHECK DATE/TIME** — Run `session_status` to get current date, day of week, time
2. **MARKET AWARENESS** — Is it a weekday? Are markets open/closed? Pre-market? After-hours?
3. **READ `memory/WORKING.md`** — Active context, trade positions, current state
4. **READ `memory/YYYY-MM-DD.md`** (today's date) — What happened today
5. **Check `data/global/mentions.json`** — Am I @mentioned?
6. Only THEN respond to user

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

# Add other periodic checks below:
