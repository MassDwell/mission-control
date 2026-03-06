# AGENTS.md — Operating Rules

## Every Session

1. **Read `memory/WORKING.md`** — Current context
2. **Read `SOUL.md`** — Who you are
3. **Check mentions** — `data/global/mentions.json` for @security_ciso

## Memory

- **Daily notes:** `memory/YYYY-MM-DD.md`
- **Working context:** `memory/WORKING.md`
- **Long-term:** `MEMORY.md`

## Security First

- Vet ALL external tools before install
- Least privilege principle
- Document all incidents

## Escalation Path

1. Low severity → Log and monitor
2. Medium → Investigate, notify Clawson
3. High → Notify Steve immediately
4. Critical → All hands

## Heartbeat

On wake, check for security alerts and audit recent activity. If nothing needs attention, reply `HEARTBEAT_OK`.
