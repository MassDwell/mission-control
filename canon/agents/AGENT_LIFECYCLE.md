# AGENT LIFECYCLE — Registry-Driven Management

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Purpose:** Safe, drift-free agent creation, modification, deprecation, and deletion

---

## OVERVIEW

All agents are declared in `canon/registry.json`:
- **Enabled agents** are compiled into `config/agents-compiled.json`
- **Disabled agents** are registered but inactive (templates for later)
- **Unauthorized agents** (outside registry) are quarantined + reported

This prevents drift while allowing agents to be added/removed without system conflicts.

---

## AGENT LIFECYCLE STATES

```
TEMPLATE
   ↓ (create + register disabled)
REGISTERED (disabled=true in registry)
   ↓ (configure + test)
ENABLED (enabled=true → compile → deployed)
   ↓ (if deprecated)
DEPRECATED (enabled=false, marked deprecated)
   ↓ (cleanup)
ARCHIVED (moved to archive/agents_deprecated/, removed from registry)
```

---

## 5-STEP AGENT ADD FLOW

### Step 1: Define Agent Specification

Create `canon/agents/{agent_id}/AGENT_SPEC.md`:

```markdown
# {Agent Name} Specification

## Identity
- ID: {agent_id}
- Name: {Display Name}
- Role: {What it does}
- Scope: {Which systems: massdwell, alpine, atlantic, global}

## Trigger
- Cron: {schedule} OR Manual
- Type: isolated or main

## Permissions
- Can read: [list]
- Can write: [list]
- Cannot: [list]

## Guardrails
- Max rate: [operations per hour]
- Data retention: [policy]
- Escalation: [approval needed for what]
```

### Step 2: Register as Disabled

Edit `canon/registry.json` and ADD to `disabled_agents_registry`:

```json
{
  "id": "{agent_id}",
  "name": "{Display Name}",
  "role": "{role}",
  "enabled": false,
  "type": "specialist",
  "config_path": "canon/agents/{agent_id}/",
  "scope": "{scope}",
  "permissions": [{list}],
  "integrations": [{list}],
  "status": "registered_but_disabled",
  "notes": "Ready for: [when will it be enabled]"
}
```

### Step 3: Create Agent Configuration

Create `canon/agents/{agent_id}/` with:
- `AGENT_SPEC.md` (spec)
- `SOUL.md` (persona, if needed)
- `MEMORY.md` (template)
- `HEARTBEAT.md` (if periodic)

### Step 4: Test & Compile (Still Disabled)

```bash
# Validate
bash scripts/deploy/validate-canonical.sh

# Compile (agent won't be included because enabled=false)
bash scripts/deploy/compile-configs.sh

# Verify config/agents-compiled.json does NOT include this agent yet
jq '.[] | select(.id == "{agent_id}")' config/agents-compiled.json  # Should be empty
```

### Step 5: Enable in Registry

Edit `canon/registry.json`:
- Move entry from `disabled_agents_registry` to `agents` array
- Set `enabled: true`
- Save

Then compile + deploy:

```bash
bash scripts/deploy/validate-canonical.sh
bash scripts/deploy/compile-configs.sh
bash scripts/deploy/deploy.sh
bash scripts/deploy/verify-deploy.sh
```

---

## MODIFYING AN AGENT

### Spec Update (No Behavior Change)

1. Edit `canon/agents/{agent_id}/AGENT_SPEC.md`
2. No compile needed (spec is documentation only)
3. Commit to git

### Behavior Change (Cron, permissions, scope)

1. Update `canon/agents/{agent_id}/HEART BEAT.md` or config
2. Update `canon/registry.json` (permissions, scope, etc.)
3. Run full compile + deploy cycle:
   ```bash
   bash scripts/deploy/validate-canonical.sh
   bash scripts/deploy/compile-configs.sh
   bash scripts/deploy/deploy.sh
   ```

### Disable Temporarily

1. In `canon/registry.json`: set `enabled: false` for that agent
2. Compile (agent removed from config)
3. Deploy (agent stops running)

---

## DEPRECATING AN AGENT

### Mark as Deprecated

1. Update `canon/registry.json`:
   ```json
   {
     "id": "{agent_id}",
     "enabled": false,
     "status": "deprecated",
     "replacement": "{new_agent_id or none}",
     "removal_date": "2026-04-04"
   }
   ```

2. Compile + deploy (removes from active)

### Archive (Cleanup)

After removal_date passes:

1. Move `canon/agents/{agent_id}/` → `archive/agents_deprecated_{date}/`
2. Remove from `canon/registry.json` entirely
3. Compile + deploy (clean config)
4. Commit

---

## ROLLBACK AN AGENT CHANGE

### If Agent Broke After Deploy

```bash
# Check last good config
cat observability/deployment/deploy-log-previous.json | jq '.version'

# Rollback
bash scripts/deploy/rollback.sh

# Verify
bash scripts/deploy/status-report.sh
```

### If You Made a Mistake in Registry

```bash
# Revert registry change
git checkout canon/registry.json

# Recompile
bash scripts/deploy/compile-configs.sh

# Redeploy
bash scripts/deploy/deploy.sh
```

---

## DRIFT DETECTION FOR AGENTS

**Daily drift audit checks:**

1. ✅ All agents in `agents/` directory match `canon/registry.json` (enabled or disabled)
2. ✅ No agent directories exist outside registry
3. ✅ No cron jobs target non-registry agents
4. ✅ No duplicate SOUL.md/IDENTITY.md outside canon/

**If drift detected:**
- 🔧 Auto-fix: Quarantine unauthorized agent directories
- 🚩 Manual flag: Report unauthorized cron jobs to Steve

---

## EXAMPLE: Adding a Sales Processor Agent

### Step 1: Create Spec
```bash
cat > canon/agents/sales_processor/AGENT_SPEC.md << 'EOF'
# Sales Lead Processor

## Identity
- ID: sales_processor
- Role: Email → Lead classification → Kommo deal creation
- Scope: massdwell

## Trigger
- Cron: Every 15 minutes (weekdays 9 AM - 6 PM)

## Permissions
- Can read: Gmail (sales@massdwell.com)
- Can write: Kommo (create deals, add notes)
- Cannot: Delete deals, approve contracts

## Guardrails
- Max 10 deals per run
- Skip if Kommo unavailable
- Escalate: Hot leads (>$200K) to Steve
EOF
```

### Step 2: Register Disabled
```bash
# Edit canon/registry.json
jq '.disabled_agents_registry += [{
  "id": "sales_processor",
  "name": "Sales Lead Processor",
  "enabled": false,
  "config_path": "canon/agents/sales_processor/",
  "scope": "massdwell",
  "status": "registered_but_disabled"
}]' canon/registry.json > /tmp/reg.json && mv /tmp/reg.json canon/registry.json
```

### Step 3: Create Config
```bash
mkdir -p canon/agents/sales_processor/
touch canon/agents/sales_processor/{SOUL.md,MEMORY.md,HEARTBEAT.md}
```

### Step 4: Test (Disabled)
```bash
bash scripts/deploy/compile-configs.sh
jq '.[] | select(.id == "sales_processor")' config/agents-compiled.json  # Empty = good
```

### Step 5: Enable
```bash
# Edit canon/registry.json: move to 'agents', set enabled=true
bash scripts/deploy/validate-canonical.sh
bash scripts/deploy/compile-configs.sh
bash scripts/deploy/deploy.sh
```

---

## SAFETY GUARDRAILS

✅ **Registry as single source of truth** — No agent exists outside it  
✅ **Disabled by default** — New agents start disabled, no auto-activation  
✅ **Compile-time filtering** — Only enabled agents in generated configs  
✅ **Drift detection** — Unauthorized agents quarantined + reported  
✅ **Rollback-ready** — Every deploy backs up previous config  
✅ **Audit trail** — All agent changes logged in git + observability/  

---

## COMMON QUESTIONS

**Q: Can I create an agent outside the registry?**  
A: No. Drift audit will quarantine it automatically. Always use the registry.

**Q: What if I need an agent to run immediately?**  
A: 1. Register (enabled=true), 2. Compile, 3. Deploy. Takes ~5 minutes.

**Q: Can I have agents in different states (some enabled, some disabled)?**  
A: Yes! That's the whole point. Disabled agents stay in registry as templates.

**Q: What happens if Kommo goes down and the agent depends on it?**  
A: Define the behavior in AGENT_SPEC.md. Drift audit will alert if it breaks.

**Q: How do I remove an agent permanently?**  
A: Mark deprecated, let it run until removal_date, then archive and remove from registry.

---

**Status:** ✅ **READY TO USE**

_Add agents without creating drift. Always reversible._
