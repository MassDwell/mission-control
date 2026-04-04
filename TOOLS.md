# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

### Peekaboo (macOS UI Automation)
- **Binary:** `/opt/homebrew/bin/peekaboo` (v3.0.0-beta3)
- **No credentials required** — local macOS CLI only, no API keys
- **No config file needed** — works out of the box
- **Silent failure risk:** None. If peekaboo binary is missing, commands will simply fail with "command not found"
- **Use for:** Screenshot capture, UI element inspection, visual regression checks post-deploy

### Paperclip API (port 3100)
Base URL: http://127.0.0.1:3100/api
Company ID: 6e53f2a5-1a3f-4557-99d6-790eeb70ce67

**Correct endpoints:**
- GET    /api/companies/{companyId}/issues          — list issues
- POST   /api/companies/{companyId}/issues          — create issue
- GET    /api/issues/{id}                           — get single issue
- PATCH  /api/issues/{id}                           — update issue
- GET    /api/companies/{companyId}/agents          — list agents

**Agent IDs:**
- Clawson:            b81862ce-f532-489d-8613-a08ceacc6906
- Codesmith:          e46c7338-089e-4b9e-a419-41ff8a612ffc
- Moonshot:           e2a4b07c-a096-46f7-9cab-07b5c83b11e4
- Personal Assistant: 1b26ac48-4866-4db5-9a87-f0535f775d6f

**Field notes:**
- Create issue: use `assigneeAgentId` (not `assigneeId`) for agent assignment
- in_progress issues REQUIRE assigneeAgentId or assigneeUserId
- ❌ /api/issues — does NOT exist, returns 500
