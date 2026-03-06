# OpenClaw File Organization Rules

**Date:** March 1, 2026  
**Status:** ENFORCED - Violations detected by nightly drift scanner

---

## 🚨 GOLDEN RULE: One Agent = One Location

**NEVER duplicate agent configuration files.**

Each agent has EXACTLY ONE canonical location for its configuration.

---

## 📁 Directory Structure (ENFORCED)

```
~/.openclaw/workspace/
├── agents/                    ← AGENT CONFIGS ONLY
│   ├── [agent_name]/
│   │   ├── SOUL.md           ← Agent identity (REQUIRED)
│   │   ├── INSTRUCTIONS.md   ← Operating procedures (OPTIONAL)
│   │   ├── MEMORY.md         ← Agent's memory (OPTIONAL)
│   │   └── HEARTBEAT.md      ← Heartbeat checklist (OPTIONAL)
│   │
│   └── [another_agent]/
│       └── ...
│
├── data/                      ← REFERENCE DATA ONLY
│   ├── massdwell/            ← MassDwell business data
│   ├── atlantic-laser/       ← Atlantic Laser business data
│   ├── alpine/               ← Alpine Property Group data
│   ├── global/               ← Cross-business data
│   └── [NO AGENT CONFIGS]    ← ❌ NEVER put SOUL.md here
│
├── scripts/                   ← Automation scripts
├── memory/                    ← Daily logs, working memory
├── credentials/               ← API keys, tokens
└── ...
```

---

## ✅ ALLOWED Locations

### Agent Configuration Files

**Location:** `agents/[agent_name]/`

**Allowed files:**
- `SOUL.md` - Agent identity, role, personality (REQUIRED)
- `INSTRUCTIONS.md` - Step-by-step operating procedures
- `MEMORY.md` - Agent's long-term memory
- `HEARTBEAT.md` - Heartbeat checklist
- `BRAIN.md` - Current working state (if using brain pattern)

**Ownership tags (REQUIRED in SOUL.md):**
```html
<!-- OWNER: agents/[agent_name] -->
<!-- VERSION: 2026-03-01 -->
<!-- DO-NOT-DUPLICATE: true -->
```

---

### Reference Data Files

**Location:** `data/[business_name]/`

**Allowed files:**
- Product specs
- Sales playbooks
- Email templates
- Customer lists
- Market research
- Policy documents

**NOT ALLOWED:**
- ❌ `SOUL.md` (belongs in `agents/`)
- ❌ `INSTRUCTIONS.md` (belongs in `agents/`)
- ❌ Any agent configuration

---

## ❌ PROHIBITED Actions

### 1. Duplicate Agent Configs

**WRONG:**
```
agents/sales_followup/SOUL.md          ← ✅ CORRECT
data/agents/sales_followup/SOUL.md    ← ❌ DUPLICATE (delete this)
```

**Why it's bad:**
- Agents read both and get conflicting instructions
- Updates to one file don't apply to the other
- Creates "which one is right?" confusion

**Fix:** Delete all duplicates from `data/` folders

---

### 2. Agent Configs in Data Folders

**WRONG:**
```
data/massdwell/sales-agent-config.md   ← ❌ Agent config in data folder
```

**CORRECT:**
```
agents/sales_followup/SOUL.md          ← ✅ Agent config in agents folder
data/massdwell/SALES-PLAYBOOK.md       ← ✅ Reference doc in data folder
```

---

### 3. Missing Ownership Tags

**WRONG:**
```markdown
# Sales Agent - MassDwell

## Identity
...
```

**CORRECT:**
```markdown
<!-- OWNER: agents/sales_followup -->
<!-- VERSION: 2026-03-01 -->
<!-- DO-NOT-DUPLICATE: true -->

# Sales Agent - MassDwell

## Identity
...
```

---

## 🔍 Drift Detection

### Nightly Scanner Checks:

**At 1:00 AM daily, the drift scanner checks:**

1. ✅ No duplicate SOUL.md files
2. ✅ No agent configs in `data/` folders
3. ✅ All SOUL.md files have ownership tags
4. ✅ No orphaned configs (SOUL.md with no active agent)
5. ✅ Cron jobs match registry
6. ✅ No conflicting SOPs

**Report saved to:** `memory/drift-report-YYYY-MM-DD.md`

**Telegram alert if:** CRITICAL or HIGH severity issues found

---

## 🛠️ How to Add a New Agent

**Step 1:** Create agent directory
```bash
mkdir -p ~/.openclaw/workspace/agents/my_new_agent
```

**Step 2:** Create SOUL.md with ownership tags
```bash
cat > ~/.openclaw/workspace/agents/my_new_agent/SOUL.md << 'EOF'
<!-- OWNER: agents/my_new_agent -->
<!-- VERSION: 2026-03-01 -->
<!-- DO-NOT-DUPLICATE: true -->

# My New Agent

## Identity
...
EOF
```

**Step 3:** Add agent to cron registry (if it will have cron jobs)
```bash
# Edit data/cron-job-registry.json
# Add "my_new_agent": [] to active_jobs
```

**Step 4:** Create cron jobs if needed
```bash
openclaw cron add --agent my_new_agent ...
```

---

## 🧹 How to Clean Up Drift

**If drift scanner reports issues:**

### Duplicate SOUL.md Files
```bash
# Keep the one in agents/, delete the one in data/
rm ~/.openclaw/workspace/data/agents/[agent_name]/SOUL.md
```

### Orphaned Configs
```bash
# If agent is no longer used:
mv ~/.openclaw/workspace/agents/[agent_name] \
   ~/.openclaw/workspace/agents/ARCHIVED-[agent_name]-$(date +%Y-%m-%d)

# OR activate the agent by creating cron jobs
```

### Missing Ownership Tags
```bash
# Add tags to top of SOUL.md:
<!-- OWNER: agents/[agent_name] -->
<!-- VERSION: $(date +%Y-%m-%d) -->
<!-- DO-NOT-DUPLICATE: true -->
```

---

## 📊 Migration from Old Structure

**If you have configs in wrong locations:**

**Before:**
```
data/agents/sales_followup/SOUL.md     ← Wrong location
agents/sales_followup/SOUL.md          ← Right location
```

**Migration:**
```bash
# 1. Check if they're different
diff data/agents/sales_followup/SOUL.md agents/sales_followup/SOUL.md

# 2. If agents/ version is newer/correct, delete data/ version:
rm data/agents/sales_followup/SOUL.md

# 3. If data/ version has important content, merge manually then delete
```

---

## 🎯 Goals

**This structure ensures:**

1. ✅ **One source of truth** - Each agent has exactly one SOUL.md
2. ✅ **Clear ownership** - Tags show which agent owns each file
3. ✅ **No drift** - Nightly scanner catches violations
4. ✅ **Easy debugging** - When something breaks, you know where to look
5. ✅ **Fast iteration** - Edit files directly, no compilation step

---

## 🚨 Enforcement

**Nightly drift scanner runs at 1:00 AM**

**Script:** `scripts/nightly-drift-scan.sh`

**Cron job:** "OpenClaw Nightly Drift Scan"

**READ-ONLY:** Scanner only reports issues, never auto-fixes

**You decide:** Review report, fix issues manually

---

**Last Updated:** March 1, 2026  
**Enforced By:** Nightly drift scanner  
**Violations:** Reported in `memory/drift-report-*.md`
