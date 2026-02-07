# HEARTBEAT.md

## 🚀 SESSION STARTUP (Do this FIRST on every new session!)
1. **READ `memory/WORKING.md`** — Active context, trade positions, current state
2. **READ `memory/YYYY-MM-DD.md`** (today's date) — What happened today
3. **Check `data/global/mentions.json`** — Am I @mentioned?
4. Only THEN respond to user

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
