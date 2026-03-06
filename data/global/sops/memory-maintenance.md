# Memory Maintenance SOP

**Purpose:** Keep the memory system lean, organized, and efficient after compaction  
**Frequency:** Weekly (Sundays, 8 PM EST)  
**Owner:** Clawson (can be delegated to chief_of_staff agent)

---

## 📅 Weekly Maintenance Checklist

### 1. Review Daily Logs (Last 7 Days)

**Goal:** Extract lessons learned, consolidate into MEMORY.md

**Process:**
```bash
# Check daily logs from last 7 days
ls -lt ~/.openclaw/workspace/memory/2026-*.md | head -7
```

**For each daily log:**
- [ ] Read through events
- [ ] Identify patterns, lessons, decisions worth keeping long-term
- [ ] Extract key insights → MEMORY.md
- [ ] Note any recurring issues (systems, workflows)

**What to extract:**
- ✅ Important decisions (business strategy, tool choices)
- ✅ Lessons learned (mistakes, successful approaches)
- ✅ New contacts/vendors with context
- ✅ System configurations that worked
- ✅ Process improvements discovered

**What to skip:**
- ❌ Routine operational logs (sales bot runs, cron outputs)
- ❌ Temporary debugging steps
- ❌ Resolved incidents (unless lesson learned)
- ❌ One-off tasks with no pattern

---

### 2. Clean WORKING.md

**Goal:** Keep WORKING.md under 100 lines, only active items

**Check for:**
- [ ] Completed workstreams still listed as active
- [ ] Closed trade positions
- [ ] Resolved system issues
- [ ] Stale scheduled items (past dates)
- [ ] Projects moved to "waiting" or "blocked" for >14 days

**Action:**
- Move completed items → today's daily log
- Move blocked items → MEMORY.md with "Blocked on:" note
- Update "Last updated:" timestamp at top

**Target size:** 50-100 lines

---

### 3. Update MEMORY.md

**Goal:** Keep long-term knowledge current and accurate

**Review sections:**
- [ ] **Key People** - Anyone new? Role changes? Contact updates?
- [ ] **Active Integrations** - Status still accurate? New tools connected?
- [ ] **Standing Instructions** - Any new rules established this week?
- [ ] **Lessons Learned** - Add distilled insights from daily logs
- [ ] **Active Projects** - Update status, remove completed

**Prune:**
- Outdated vendor info (no longer working with them)
- Deprecated tools/integrations (replaced or retired)
- Resolved incidents older than 30 days (unless valuable lesson)

**Target size:** 1,000-1,500 lines (if growing beyond this, consider splitting into memory/topics/)

---

### 4. Archive Old Daily Logs

**Goal:** Keep memory/ directory manageable

**Process:**
```bash
# Create archive directory if needed
mkdir -p ~/.openclaw/workspace/memory/archive/2026-03

# Move daily logs older than 30 days
find ~/.openclaw/workspace/memory/ -name "2026-*.md" -mtime +30 -exec mv {} ~/.openclaw/workspace/memory/archive/2026-03/ \;
```

**Archive policy:**
- Keep last 30 days in main memory/ directory
- Move older logs to memory/archive/YYYY-MM/
- Compress archives older than 90 days (optional)

---

### 5. Check File Sizes

**Goal:** Catch bloat early

**Thresholds:**
```bash
# Check key file sizes
wc -l ~/.openclaw/workspace/memory/WORKING.md
wc -l ~/.openclaw/workspace/memory/MEMORY.md
wc -l ~/.openclaw/workspace/WORKFLOW_AUTO.md
```

**Alert if:**
- WORKING.md > 150 lines
- MEMORY.md > 2,000 lines
- WORKFLOW_AUTO.md > 300 lines

**Action:** Review for redundancy, move historical content to daily logs

---

### 6. Verify Automation Files

**Goal:** Ensure automation docs are current

**Check:**
- [ ] WORKFLOW_AUTO.md matches current bot behavior
- [ ] Pipeline stage IDs still accurate (check against Kommo)
- [ ] Script paths still valid
- [ ] Cron schedules match config

**Update if:**
- Bot logic changed this week
- New automation added
- Scripts renamed/moved
- Alert thresholds adjusted

---

### 7. Git Commit Memory Changes

**Goal:** Version control for memory updates

**Process:**
```bash
cd ~/.openclaw/workspace
git add memory/MEMORY.md memory/WORKING.md WORKFLOW_AUTO.md
git commit -m "Memory maintenance: weekly review $(date +%Y-%m-%d)"
git push
```

**Commit message should include:**
- Date of maintenance
- Key updates made
- Any major lessons added

---

## 🔄 Daily Mini-Maintenance

**In addition to weekly, do daily (via heartbeat or morning briefing):**

### Check WORKING.md Size
```bash
if [ $(wc -l < ~/.openclaw/workspace/memory/WORKING.md) -gt 150 ]; then
  echo "⚠️ WORKING.md bloated (>150 lines) - cleanup needed"
fi
```

### Create Today's Daily Log
```bash
# If doesn't exist, create template
if [ ! -f ~/.openclaw/workspace/memory/$(date +%Y-%m-%d).md ]; then
  cat > ~/.openclaw/workspace/memory/$(date +%Y-%m-%d).md << EOF
# $(date +%Y-%m-%d) - Daily Log

_$(date +"%A, %B %d, %Y")_

---

EOF
fi
```

### Log Major Events Immediately
**Real-time logging rules (from WORKFLOW_AUTO.md):**
- Trade entries/exits → WORKING.md + daily log
- System failures → daily log
- Customer replies → daily log
- API auth changes → WORKING.md

---

## 📊 Maintenance Metrics

**Track these weekly:**

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| WORKING.md lines | <100 | Immediate cleanup |
| MEMORY.md lines | <1,500 | Review for redundancy |
| Daily logs (memory/) | <35 files | Archive older than 30 days |
| Post-compaction token load | <1,000 | Audit all loaded files |

---

## 🚨 Emergency Cleanup

**If post-compaction token usage spikes (>2,000 tokens for memory files):**

1. **Immediate triage:**
   ```bash
   # Find largest memory files
   wc -l ~/.openclaw/workspace/memory/*.md | sort -n | tail -5
   wc -l ~/.openclaw/workspace/*.md | sort -n | tail -10
   ```

2. **Quick wins:**
   - Move all daily logs >14 days old → archive
   - Remove duplicate entries in WORKING.md
   - Compress verbose sections in MEMORY.md

3. **Nuclear option (if desperate):**
   - Keep only: WORKING.md, MEMORY.md, WORKFLOW_AUTO.md, last 7 daily logs
   - Archive everything else
   - Rebuild from archives as needed

---

## 🎯 Success Criteria

**Weekly maintenance is successful when:**

✅ WORKING.md reflects current state (no stale entries)  
✅ MEMORY.md has this week's lessons added  
✅ Daily logs older than 30 days are archived  
✅ All file sizes within thresholds  
✅ Automation docs match reality  
✅ Git commit pushed with changes  

**Time budget:** 15-20 minutes/week

---

## 🤖 Automation Opportunity

**This SOP can be partially automated:**

**Scriptable tasks:**
- File size checks (alert if thresholds exceeded)
- Archive old daily logs (automatic move)
- Git commit memory changes
- Generate "review needed" report

**Human-required tasks:**
- Reading daily logs for insights
- Deciding what's worth keeping in MEMORY.md
- Verifying automation logic is current

**Future enhancement:** Create `scripts/memory-maintenance.sh` to automate the scriptable parts

---

_Last updated: 2026-03-03_
