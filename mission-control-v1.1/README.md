# Mission Control v1.1

Real-time agent operations dashboard for OpenClaw.

## Features

- **Live Agent Status**: Shows all registered agents with their current status (working/idle)
- **Task Pipeline**: Tracks tasks through stages (Incoming → Routing → In Progress → Review → Complete)
- **Activity Feed**: Real-time events for agent spawns, task completions, tool usage
- **Entity Filtering**: View agents by business entity (MassDwell, Atlantic Laser, Alpine Property)

## Quick Start

```bash
cd /Users/openclaw/.openclaw/workspace/mission-control-v1.1
./start.sh
```

Then open http://localhost:8088 in your browser.

## Data Sources

Mission Control reads directly from OpenClaw's data files:

- **Subagent runs**: `~/.openclaw/subagents/runs.json`
- **Agent sessions**: `~/.openclaw/agents/{agent}/sessions/sessions.json`
- **Agent roster**: `openclaw agents list --json`

## API Endpoints

- `GET /` - Dashboard UI
- `GET /health` - Health check (`{"ok": true, "clients": N}`)
- `GET /api/state` - Full state snapshot (agents, tasks, pipeline, stats)
- `GET /api/activity` - Activity feed history
- `POST /event` - Inject custom events

## WebSocket

Connect to `ws://localhost:8088` for real-time updates.

Message types:
- `init` - Initial state with all data
- `update` - State update with any new events
- `system` - System notifications
- `heartbeat` - Keep-alive (every 30s)

## Injecting Events

External tools can push events to the activity feed:

```bash
curl -X POST http://localhost:8088/event \
  -H "Content-Type: application/json" \
  -d '{"type":"tool","icon":"🔧","message":"Running backup script"}'
```

## Configuration

Environment variables:
- `MC_PORT` or `PORT` - Server port (default: 8088)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  OpenClaw CLI   │────▶│  runs.json       │────▶│   Mission   │
│  (subagents)    │     │  sessions/*.json │     │   Control   │
└─────────────────┘     └──────────────────┘     │   Server    │
                                                 │   (8088)    │
                                                 └──────┬──────┘
                                                        │
                                                  WebSocket
                                                        │
                                                 ┌──────▼──────┐
                                                 │  Dashboard  │
                                                 │  (Browser)  │
                                                 └─────────────┘
```

## Files

- `index.html` - Dashboard UI
- `js/app.js` - Alpine.js frontend logic
- `server/mission-control-server.js` - Node.js server
- `start.sh` - Startup script
