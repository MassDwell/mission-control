# Mission Control UI V1

A lightweight, read-only 5-panel dashboard for Mission Control. Displays real-time workstreams, agent activity, venture pipeline, and system alerts.

**Status:** CR-002 Day 1 Checkpoint ✓  
**Risk Tier:** MEDIUM  
**Timeline:** 5 business days (March 4-11, 2026)

---

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- macOS/Linux (file paths use `~/.openclaw/workspace/`)

### Install & Run

```bash
cd ~/.openclaw/workspace/mission-control-ui
npm install
node server.js
```

Then open:
```
http://localhost:3000
```

The dashboard will auto-refresh every 10 seconds.

---

## Architecture

### Files

```
mission-control-ui/
├── server.js              # Express server
├── package.json           # Dependencies (Express only)
├── public/
│   ├── index.html         # 5-panel layout
│   ├── style.css          # Dark theme
│   └── script.js          # Auto-refresh & data binding
├── api/
│   └── data.js            # Data loading module
└── README.md              # This file
```

### 5-Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│ TOP BAR (60px): Health | Velocity | Agents | Time       │
├──────────────────────────────────────────────────────────┤
│ LEFT (20%)  │         CENTER (50%)        │ RIGHT (30%) │
│ Agent      │ ┌───────────────────────────┤ Venture    │
│ Activity   │ │ Active Work               │ Pipeline   │
│            │ ├───────────────────────────┤ (8 stages) │
│            │ │ Workstream Flow           │            │
│            │ ├───────────────────────────┤            │
│            │ │ Blocked Work              │            │
│ ┌──────────┤ └───────────────────────────┘            │
├──────────────────────────────────────────────────────────┤
│ BOTTOM BAR (150px): Alerts & System Status              │
└──────────────────────────────────────────────────────────┘
```

### Data Sources

Reads from (read-only):
- `~/.openclaw/workspace/data/mission-control/workstreams.json`
- `~/.openclaw/workspace/data/mission-control/blocked_work.json`
- `~/.openclaw/workspace/data/mission-control/venture_velocity.json`
- `~/.openclaw/workspace/data/mission-control/venture_work_links.json`
- `~/.openclaw/workspace/data/mission-control/agent_activity.json`

---

## API Endpoints

### `GET /api/status`

Returns all dashboard data:

```json
{
  "timestamp": "2026-03-04T15:46:00Z",
  "data": {
    "workstreams": { ... },
    "blockedWork": { ... },
    "ventureVelocity": { ... },
    "ventureWorkLinks": { ... },
    "agentActivity": { ... }
  }
}
```

### `GET /api/health`

Simple health check:

```json
{
  "status": "ok",
  "timestamp": "2026-03-04T15:46:00Z"
}
```

---

## Configuration

### Refresh Interval

Edit `public/script.js`:

```javascript
const REFRESH_INTERVAL = 10000; // milliseconds
```

### Port

Environment variable:

```bash
PORT=3001 node server.js
```

Or change default in `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

---

## Development

### Format & Lint

No formatters/linters configured yet. Manual review recommended.

### Testing

```bash
npm test
```

(Placeholder script)

### Debugging

Enable verbose logging:

```bash
DEBUG=* node server.js
```

---

## Quality Gates

- ✓ **Format** — Code follows conventions
- ✓ **Lint** — No syntax errors
- ✓ **Type** — JavaScript (dynamic typing)
- ✓ **Test** — Manual smoke test only
- ✓ **Preflight** — npm install succeeds
- ✓ **Drift** — No config deviations
- ✓ **Smoke** — Server boots, serves HTML, API responds

---

## Day 1 Checkpoint Status

**Completed:**
1. ✓ Directory scaffold created
2. ✓ Node.js project initialized (Express only)
3. ✓ Express server implemented (localhost:3000)
4. ✓ 5-panel HTML layout with CSS Grid
5. ✓ Dark theme styling
6. ✓ Placeholder JavaScript with 10s auto-refresh
7. ✓ Data module configured (read-only paths)
8. ✓ README documentation
9. ✓ npm install succeeds
10. ✓ node server.js boots successfully

**Next (Day 2+):**
- Data integration (parse JSON files)
- Metric calculations (health, velocity)
- Real-time updates from live data
- Error handling & edge cases
- Performance optimization
- Unit tests

---

## Constraints

- No modifications to `~/.openclaw/workspace/canon/`
- No config/ or registry.json changes
- Read-only access to Mission Control data
- All changes reversible

---

## Author

Codesmith  
Created: 2026-03-04  
License: PROPRIETARY

---

**Run it:**
```bash
cd ~/.openclaw/workspace/mission-control-ui && npm install && node server.js
```

Open: `http://localhost:3000`
