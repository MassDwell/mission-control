# Memory Maintenance Script

**Script:** `memory-maintenance.sh`  
**Purpose:** Automate the scriptable parts of weekly memory system maintenance

---

## Features

### Automated Tasks
✅ **File size monitoring** - Check WORKING.md, MEMORY.md, WORKFLOW_AUTO.md against thresholds  
✅ **Log archiving** - Auto-archive daily logs older than 30 days  
✅ **Daily log creation** - Ensure today's log exists  
✅ **Review report** - Generate maintenance checklist and status summary  
✅ **Git integration** - Auto-commit memory file changes  
✅ **Color-coded output** - Visual status indicators (✓ success, ⚠ warning, ✗ error)

---

## Usage

### Basic Usage
```bash
cd ~/.openclaw/workspace
./scripts/memory-maintenance.sh
```

### Dry Run (Preview)
```bash
./scripts/memory-maintenance.sh --dry-run
```
Shows what would be done without making changes

### Custom Archive Period
```bash
./scripts/memory-maintenance.sh --archive-days 45
```
Archive logs older than 45 days instead of default 30

### Help
```bash
./scripts/memory-maintenance.sh --help
```

---

## What It Checks

### File Size Thresholds

| File | Target | Alert | Action |
|------|--------|-------|--------|
| WORKING.md | <100 lines | >150 lines | Manual cleanup needed |
| MEMORY.md | <1,500 lines | >2,000 lines | Review for redundancy |
| WORKFLOW_AUTO.md | <300 lines | >500 lines | Consolidate rules |

### Daily Logs
- **Recommended:** <35 files in memory/ directory
- **Auto-archive:** Files older than 30 days → memory/archive/YYYY-MM/
- **Auto-create:** Today's log if missing

---

## Output

### Console Output
```
════════════════════════════════════════════════════════════
  Memory Maintenance - 2026-03-03 02:44:29
════════════════════════════════════════════════════════════

ℹ Step 1: Checking file sizes...

✓ WORKING.md:       78 lines (target: 100)
✓ MEMORY.md:       276 lines (target: 1500)
✓ WORKFLOW_AUTO.md: 204 lines (target: 300)

ℹ Step 2: Archiving daily logs older than 30 days...
✓ Archived 3 log file(s) to memory/archive/2026-03

ℹ Step 3: Counting current daily logs...
✓ Daily logs in memory/:        8

ℹ Step 4: Checking for today's daily log...
✓ Today's log exists: 2026-03-03.md

ℹ Step 5: Generating review report...
✓ Report generated: memory-maintenance-report.txt

ℹ Step 6: Checking for git changes...
✓ Changes committed to git

════════════════════════════════════════════════════════════
  Maintenance Complete
════════════════════════════════════════════════════════════

Summary:
  - Archived: 3 log file(s)
  - Current logs:        8
  - Files checked: 3
  - Report: memory-maintenance-report.txt

✓ All systems nominal
```

### Generated Report
Creates `memory-maintenance-report.txt` with:
- File size status
- Daily log count
- Manual review checklist
- List of recent logs (last 7 days)
- Files needing attention
- Next maintenance date

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - all files within targets |
| 1 | Warning - some files exceed target but still OK |
| 2 | Alert - one or more files exceed alert threshold |

---

## Integration

### Weekly Cron Job
Automatically runs every Sunday at 8 PM EST:
- **Job ID:** d4402ea5-ae3e-4d07-ab0f-0d92f0db91a4
- **Schedule:** `0 20 * * 0` (8 PM Sundays)
- **Next run:** 2026-03-09

### Manual Review (Still Required)
After script runs, human should:
1. Read last 7 daily logs
2. Extract lessons → MEMORY.md
3. Review WORKING.md for stale entries
4. Verify WORKFLOW_AUTO.md matches current bots
5. Update standing instructions if needed

**Time budget:** 10-15 minutes (after automation handles the tedious parts)

---

## Troubleshooting

### "No such file or directory: MEMORY.md"
- Check file location: Should be in workspace root (`~/.openclaw/workspace/MEMORY.md`)
- Not in `memory/` subdirectory

### "Git commit failed"
- Normal if workspace not a git repo
- Script continues - only a warning

### "Would archive" in normal mode
- You're in dry-run mode
- Run without `--dry-run` flag

### Too many logs being archived
- Adjust with `--archive-days N` flag
- Default is 30 days

---

## Files Modified

**Reads:**
- memory/WORKING.md
- MEMORY.md
- WORKFLOW_AUTO.md
- memory/20*.md (daily logs)

**Creates/Updates:**
- memory/archive/YYYY-MM/ (archive directory)
- memory-maintenance-report.txt
- memory/YYYY-MM-DD.md (today's log if missing)

**Git commits:**
- MEMORY.md
- memory/WORKING.md
- WORKFLOW_AUTO.md
- memory-maintenance-report.txt

---

## Best Practices

### When to Run
- **Scheduled:** Weekly (Sunday 8 PM) via cron
- **On-demand:** After major changes to memory files
- **Emergency:** If post-compaction token load spikes

### Before Major Updates
```bash
# Dry run first
./scripts/memory-maintenance.sh --dry-run

# Review what would change
cat memory-maintenance-report.txt

# Then execute
./scripts/memory-maintenance.sh
```

### Customize Archive Period
```bash
# Keep 60 days of logs instead of 30
./scripts/memory-maintenance.sh --archive-days 60
```

---

## Related Documentation

- **SOP:** `data/global/sops/memory-maintenance.md` (full manual procedure)
- **Memory system:** See AGENTS.md section on memory
- **Post-compaction:** HEARTBEAT.md startup checklist

---

_Created: 2026-03-03_  
_Part of Phase 4 memory system optimization_
