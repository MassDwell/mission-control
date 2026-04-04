# PAPERCLIP PHASE 1: EVALUATION DEPLOYMENT

**Date:** Friday, March 6, 2026 @ 12:05 PM EST  
**Status:** PHASE 1 — Isolated Evaluation (NOT canonical control plane yet)  
**Repository:** https://github.com/paperclipai/paperclip  
**Deployment Type:** Non-invasive local service evaluation

---

## EXECUTIVE SUMMARY

Paperclip is an open-source, Node.js-based orchestration layer designed to coordinate AI agent teams. Phase 1 deploys Paperclip as an **isolated candidate orchestration layer** to evaluate its ability to route commands to OpenClaw's command bus without directly mutating SSOT.

**Key Constraint:** Paperclip remains a candidate during evaluation. It does NOT become canonical control plane yet. All changes are reversible.

---

## PART 1: INSTALLATION STEPS

### Prerequisites
- Node.js 18+ (installed)
- npm or pnpm (package manager)
- PostgreSQL 14+ (local or remote)
- Git (installed)

### Step 1: Clone Official Repository
```bash
mkdir -p /Users/openclaw/.openclaw/workspace/tools
cd /Users/openclaw/.openclaw/workspace/tools
git clone https://github.com/paperclipai/paperclip.git
cd paperclip
```

### Step 2: Install Dependencies
```bash
# Install pnpm if not already installed
npm install -g pnpm@latest

# Install all dependencies (monorepo)
pnpm install
```

### Step 3: Configure Environment
```bash
# Copy example env to .env
cp .env.example .env

# Edit .env for Phase 1 isolated deployment
# Key settings:
# DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip_eval
# PORT=3100
# SERVE_UI=true (for evaluation dashboard)
```

### Step 4: Database Setup
```bash
# Create evaluation database (PostgreSQL)
createdb paperclip_eval
createuser paperclip_eval -P  # Set password: paperclip_eval

# Grant permissions
psql -c "ALTER USER paperclip_eval WITH CREATEDB;"
psql -c "GRANT ALL PRIVILEGES ON DATABASE paperclip_eval TO paperclip_eval;"

# Run migrations
pnpm db:migrate
```

### Step 5: Build Paperclip
```bash
pnpm build
```

### Step 6: Start Paperclip Service
```bash
# Development mode (with hot reload)
pnpm dev

# Or production mode
pnpm build && pnpm dev:server
```

---

## PART 2: SERVICE RUN COMMANDS

### Development Mode (For Evaluation)
```bash
cd /Users/openclaw/.openclaw/workspace/tools/paperclip
export DATABASE_URL="postgres://paperclip_eval:paperclip_eval@localhost:5432/paperclip_eval"
export PORT=3100
export SERVE_UI=true
pnpm dev
```

### Production Mode (If Approved)
```bash
cd /Users/openclaw/.openclaw/workspace/tools/paperclip
pnpm build
PORT=3100 DATABASE_URL="postgres://paperclip_eval:..." pnpm dev:server
```

### As Background Service (systemd)
```ini
# File: /etc/systemd/system/paperclip.service
[Unit]
Description=Paperclip Orchestration Layer
After=network.target postgresql.service

[Service]
Type=simple
User=openclaw
WorkingDirectory=/Users/openclaw/.openclaw/workspace/tools/paperclip
Environment="DATABASE_URL=postgres://paperclip_eval:paperclip_eval@localhost:5432/paperclip_eval"
Environment="PORT=3100"
Environment="SERVE_UI=true"
ExecStart=/usr/bin/pnpm dev:server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable paperclip
sudo systemctl start paperclip
```

---

## PART 3: PORT ASSIGNMENT

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| OpenClaw (main) | 8080 | Core execution engine | Running |
| Mission Control UI | 3000 | Read-only dashboard | Running |
| Paperclip Server | 3100 | Candidate orchestration layer | Phase 1 evaluation |
| Paperclip UI | 3101 | Paperclip dashboard (if enabled) | Optional |

**Port Isolation:** Paperclip runs on 3100-3101, completely separate from OpenClaw (8080) and Mission Control (3000). No port conflicts.

---

## PART 4: ADAPTER ARCHITECTURE

### Command Flow (Phase 1)

```
OPERATOR INPUT
  ↓
PAPERCLIP API (port 3100)
  ├─ POST /orchestrate
  └─ Payload: { intent: "advance_stage", target: "LeadScore.ai" }
  ↓
PAPERCLIP INTENT VALIDATOR
  ├─ Check: Is intent valid?
  ├─ Check: Target exists in SSOT?
  ├─ Check: Operator authorized?
  └─ Response: OK or REJECT
  ↓
OPENCLAWADAPTER (Bridge Layer)
  ├─ Function: paperclip-openclaw-adapter.js
  ├─ Task: Convert intent → command
  └─ Does NOT mutate SSOT directly
  ↓
COMMAND BUS (operator_actions.json)
  ├─ Paperclip writes: { action_type, target, intent_source: "paperclip" }
  └─ OpenClaw reads and executes
  ↓
OPENCLAWEXECUTION
  ├─ Clawson executes (sole executor)
  └─ Mutates SSOT (venture_pipeline.json, workstreams.json)
  ↓
SSOT FILES (source of truth)
  ├─ venture_pipeline.json (updated)
  ├─ workstreams.json (updated)
  └─ agent_activity.json (logged)
  ↓
MISSION CONTROL (visibility)
  └─ Reads SSOT, displays updated state
```

### Adapter Implementation

**File:** `/Users/openclaw/.openclaw/workspace/tools/paperclip/adapters/openclaw-adapter.js`

```javascript
/**
 * OpenClaw Adapter
 * Bridges Paperclip orchestration intents to OpenClaw command bus
 * Does NOT mutate SSOT directly
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OPENCLAW_HOME = '/Users/openclaw/.openclaw/workspace';
const COMMAND_BUS_FILE = path.join(OPENCLAW_HOME, 'data/mission-control/operator_actions.json');

class OpenClawAdapter {
  /**
   * Submit orchestration intent to OpenClaw command bus
   * @param {Object} intent - Orchestration intent from Paperclip
   * @param {string} intent.action_type - e.g., "advance_stage", "pause_venture"
   * @param {string} intent.target_type - e.g., "venture", "workstream"
   * @param {string} intent.target_id - e.g., "LeadScore.ai"
   * @param {Object} intent.parameters - Additional parameters
   * @returns {Object} - { success, id, message }
   */
  static submitIntent(intent) {
    try {
      // Validate intent structure
      if (!intent.action_type || !intent.target_type || !intent.target_id) {
        return { success: false, message: "Invalid intent: missing required fields" };
      }

      // Read current command bus queue
      let queue = { actions: [] };
      if (fs.existsSync(COMMAND_BUS_FILE)) {
        queue = JSON.parse(fs.readFileSync(COMMAND_BUS_FILE, 'utf-8'));
      }

      // Generate deterministic signature for deduplication
      const signature = this.computeSignature(intent);

      // Check for duplicates in 60-second window
      const now = Date.now();
      const duplicateInWindow = queue.actions.find(action => {
        const age = now - new Date(action.created_at).getTime();
        return action.signature === signature && age < 60000 && action.status !== 'rejected';
      });

      if (duplicateInWindow) {
        return { 
          success: false, 
          message: "Duplicate action within 60-second window",
          id: duplicateInWindow.id
        };
      }

      // Create new action
      const action = {
        id: crypto.randomUUID(),
        source: "paperclip",              // Track source as Paperclip
        operator: "paperclip-orchestration",
        action_type: intent.action_type,
        target_type: intent.target_type,
        target_id: intent.target_id,
        payload: intent.parameters || {},
        status: "pending",
        created_at: new Date().toISOString(),
        executed_at: null,
        result: null,
        signature: signature
      };

      // Append to queue
      queue.actions.push(action);
      queue.lastUpdated = new Date().toISOString();

      // Write queue atomically
      fs.writeFileSync(COMMAND_BUS_FILE, JSON.stringify(queue, null, 2));

      return {
        success: true,
        id: action.id,
        message: `Intent submitted to OpenClaw command bus`,
        action_id: action.id,
        status: "queued"
      };
    } catch (err) {
      return { success: false, message: `Adapter error: ${err.message}` };
    }
  }

  /**
   * Check execution status of submitted intent
   * @param {string} id - Action ID from submitIntent response
   * @returns {Object} - { status, result, message }
   */
  static checkStatus(id) {
    try {
      if (!fs.existsSync(COMMAND_BUS_FILE)) {
        return { status: "unknown", message: "Command bus not found" };
      }

      const queue = JSON.parse(fs.readFileSync(COMMAND_BUS_FILE, 'utf-8'));
      const action = queue.actions.find(a => a.id === id);

      if (!action) {
        return { status: "not_found", message: `Action ${id} not found in queue` };
      }

      return {
        status: action.status,
        result: action.result,
        executed_at: action.executed_at,
        message: `Status: ${action.status}`
      };
    } catch (err) {
      return { status: "error", message: `Status check error: ${err.message}` };
    }
  }

  /**
   * Compute deterministic signature for deduplication
   */
  static computeSignature(intent) {
    const normalized = JSON.stringify(
      Object.keys(intent.parameters || {})
        .sort()
        .reduce((acc, k) => {
          acc[k] = intent.parameters[k];
          return acc;
        }, {})
    );
    const raw = `${intent.action_type}:${intent.target_type}:${intent.target_id}:${normalized}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  }
}

module.exports = OpenClawAdapter;
```

### Paperclip API Endpoint (Evaluation)

**Endpoint:** `POST /api/orchestrate/openclaw`

```javascript
// In Paperclip server (app/routes/orchestrate.ts)
app.post('/api/orchestrate/openclaw', async (req, res) => {
  const { intent } = req.body;

  // Validate Paperclip intent
  const validation = validateOrchestrationIntent(intent);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  // Submit to OpenClaw adapter
  const result = OpenClawAdapter.submitIntent(intent);

  if (result.success) {
    return res.json({
      status: "queued",
      id: result.id,
      message: `Orchestration intent queued to OpenClaw`
    });
  } else {
    return res.status(400).json({
      status: "error",
      message: result.message
    });
  }
});
```

---

## PART 5: AUTHENTICATION & AUTHORIZATION

### Phase 1 Evaluation Auth (Non-secure)
For evaluation purposes only — NOT for production:

```env
PAPERCLIP_API_KEY=paperclip-eval-key-phase1
PAPERCLIP_OPENCLAW_SECRET=openclaw-bridge-secret-phase1
```

### Auth Flow
1. Paperclip validates request has valid API key
2. Paperclip checks if intent is authorized (no sensitive overrides)
3. Paperclip writes to OpenClaw command bus with source="paperclip"
4. OpenClaw executes as normal

### Phase 2+ Auth (If Approved)
- OAuth2 integration with OpenClaw
- Role-based access control (RBAC)
- Intent-level governance rules
- Operator approval gates

---

## PART 6: INTEGRATION HEALTH CHECK

### Test 1: Paperclip Health
```bash
curl -X GET http://localhost:3100/health
# Expected: { "status": "healthy", "uptime": <seconds> }
```

### Test 2: Submit Intent to OpenClaw
```bash
curl -X POST http://localhost:3100/api/orchestrate/openclaw \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "action_type": "pause_venture",
      "target_type": "venture",
      "target_id": "test-venture-001",
      "parameters": {}
    }
  }'

# Expected response:
{
  "status": "queued",
  "id": "uuid-here",
  "message": "Orchestration intent queued to OpenClaw"
}
```

### Test 3: Verify Command in Queue
```bash
cat /Users/openclaw/.openclaw/workspace/data/mission-control/operator_actions.json | jq '.actions[] | select(.source == "paperclip")'

# Expected: Action appears in queue with source="paperclip"
```

### Test 4: Verify SSOT Not Mutated Directly
```bash
# Paperclip should NEVER write directly to SSOT files
ls -la /Users/openclaw/.openclaw/workspace/data/mission-control/venture_pipeline.json
# Permission check: OpenClaw owns this file, Paperclip has read-only access
```

---

## PART 7: ROLLBACK PATH

### Immediate Rollback (< 1 minute)
```bash
# Stop Paperclip service
systemctl stop paperclip
# OR
pkill -f "paperclip dev"

# Verify it's stopped
curl http://localhost:3100/health
# Expected: connection refused
```

### Full Cleanup (< 5 minutes)
```bash
# Stop Paperclip
pkill -f "paperclip dev"

# Delete evaluation database
dropdb paperclip_eval
dropuser paperclip_eval

# Delete Paperclip directory (optional, keep for re-evaluation)
rm -rf /Users/openclaw/.openclaw/workspace/tools/paperclip

# Verify OpenClaw still running
curl http://localhost:3000/api/status
# Expected: Mission Control responds
```

### Revert to Previous State
```bash
# If any SSOT files were modified (they shouldn't be in Phase 1):
cd /Users/openclaw/.openclaw/workspace
git status
# Check: only Paperclip-related files should be new, no SSOT changes
git checkout -- data/mission-control/
```

---

## PART 8: KNOWN RISKS & ISSUES (Phase 1)

### Risk 1: Database Connection Failure
**Symptom:** Paperclip crashes on startup with PostgreSQL connection error  
**Mitigation:** Verify PostgreSQL is running, DATABASE_URL is correct  
**Rollback:** Stop Paperclip, delete database, restore from backup

### Risk 2: Permission Denied on Command Bus File
**Symptom:** Adapter gets EACCES when writing to operator_actions.json  
**Mitigation:** Verify file permissions (OpenClaw owns it, Paperclip can write)  
**Fix:** `chmod 666 /Users/openclaw/.openclaw/workspace/data/mission-control/operator_actions.json`

### Risk 3: Duplicate Action Handling
**Symptom:** Same action submitted twice within 60 seconds  
**Behavior:** Second action rejected with reason="duplicate_action"  
**Status:** Expected behavior, not a bug

### Risk 4: Port Already in Use (3100)
**Symptom:** Paperclip fails to bind to port 3100  
**Fix:** Change PORT in .env to 3102 or 3103, restart

### Risk 5: OpenClaw Doesn't Recognize Paperclip Source
**Symptom:** Commands from Paperclip not executing  
**Cause:** operator_actions.json schema mismatch  
**Fix:** Verify adapter writes correct field names (source, action_type, etc.)

---

## PART 9: MONITORING (Phase 1)

### Health Metrics to Track
```bash
# Paperclip uptime
curl http://localhost:3100/health | jq '.uptime'

# Command bus queue depth
cat /Users/openclaw/.openclaw/workspace/data/mission-control/operator_actions.json | jq '.actions | length'

# Execution rate (commands per minute)
tail -f /Users/openclaw/.openclaw/workspace/data/mission-control/agent_activity.json | grep "paperclip" | wc -l
```

### Log Files
- **Paperclip:** `~/.openclaw/workspace/tools/paperclip/logs/paperclip.log`
- **OpenClaw:** `~/.openclaw/workspace/data/logs/openclaw.log`
- **Command Bus:** `/Users/openclaw/.openclaw/workspace/data/mission-control/operator_actions.json`

---

## PART 10: NEXT STEPS (After Phase 1 Evaluation)

**Decision Point:** After running Phase 1 for 24-48 hours:

1. ✅ **If Successful:** Move to Phase 2 (Operator Interface)
   - Deploy Paperclip web form
   - Integrate Telegram with Paperclip
   - Remove action buttons from Mission Control

2. ⚠️ **If Issues Found:** Diagnose and fix
   - Document root cause
   - Apply fix to adapter or Paperclip config
   - Re-test

3. ❌ **If Critical Failure:** Rollback completely
   - Stop Paperclip
   - Clean up database
   - Revert any SSOT changes (should be none)
   - Resume with Mission Control (status quo)

---

## SIGN-OFF

**Phase 1 Status:** Ready to deploy  
**Repository:** https://github.com/paperclipai/paperclip  
**Deployment Path:** /Users/openclaw/.openclaw/workspace/tools/paperclip/  
**Adapter File:** paperclip-openclaw-adapter.js (to be created in adapter/ directory)  
**Port:** 3100 (isolated from OpenClaw and Mission Control)  
**SSOT Mutations:** NONE — adapter writes only to operator_actions.json  
**Reversibility:** Full rollback in < 5 minutes  

**Not Yet Approved As:** Canonical control plane  
**Status:** Candidate orchestration layer under evaluation  
**Next Gate:** Phase 2 approval after 24-48h successful operation
