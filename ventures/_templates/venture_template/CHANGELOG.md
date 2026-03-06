# Changelog

**Venture:** [Venture Name]  
**First Entry:** [YYYY-MM-DD]  

---

## How to Use This File

Codesmith adds an entry after each Claude Code run or major milestone.

**Format:**
```markdown
## [YYYY-MM-DD] — [Milestone or Claude Code Run]

### What Changed
- [Change 1]
- [Change 2]
- [Change 3]

### Quality Gates
- [Gate 1]: ✅ PASS
- [Gate 2]: ✅ PASS
- [Gate 3]: ❌ FAIL (details)

### Tests
- [X] tests pass ([Y] new)
- Coverage: [X%]

### Commits
- [Commit hash]: Commit message

### Time
- Duration: [X] minutes
- Status: [Completed / Reverted]
```

---

## Entries

### 2026-03-04 — Initial Template

**Milestone:** Venture template created (Moonshot PRD + experiment plan)

**What Changed**
- Created venture_config.json (metadata + metrics)
- Created PRD.md (product requirements)
- Created experiment_plan.md (3-week validation plan)
- Created metrics.md (metrics tracker)
- Created this CHANGELOG.md

**Owner:** Moonshot  
**Status:** Ready for development

---

### [YYYY-MM-DD] — [Codesmith Task]

**Milestone:** [Brief description]

**What Changed**
- [Change 1]
- [Change 2]
- [Change 3]

**Quality Gates**
- Format: ✅ PASS
- Lint: ✅ PASS
- Type check: ✅ PASS
- Tests: ✅ PASS ([X]/[Y] pass)
- Secrets: ✅ PASS (0 found)
- Diff review: ✅ APPROVED

**Tests**
- [X] tests pass ([Y] new)
- Coverage: [X%]

**Commits**
- abc1234: Claude Code: [task description] ([X] tests pass)

**Time**
- Duration: [X] minutes
- Status: Completed

**Notes**
- [Optional note 1]
- [Optional note 2]

---

### [YYYY-MM-DD] — [Next Milestone]

[Same format as above]

---

## Build Timeline

| Date | Milestone | Owner | Status |
|------|-----------|-------|--------|
| [YYYY-MM-DD] | PRD + Experiment Plan | Moonshot | ✅ Complete |
| [YYYY-MM-DD] | Architecture Plan | Codesmith | ⏳ In Progress |
| [YYYY-MM-DD] | API Scaffold | Codesmith | ⏳ Planned |
| [YYYY-MM-DD] | First Feature | Codesmith | ⏳ Planned |
| [YYYY-MM-DD] | Deploy | Codesmith | ⏳ Planned |

---

## Summary by Phase

### Phase 1: Research
- Started: [YYYY-MM-DD]
- Ended: [YYYY-MM-DD]
- Deliverables: [List]
- Status: [Complete / In Progress / Blocked]

### Phase 2: Prototype
- Started: [YYYY-MM-DD]
- Ended: [YYYY-MM-DD]
- Deliverables: [List]
- Status: [Complete / In Progress / Blocked]

### Phase 3: Validation
- Started: [YYYY-MM-DD]
- Ended: [YYYY-MM-DD]
- Deliverables: [List]
- Status: [Complete / In Progress / Blocked]

---

## Rollbacks

If a Claude Code run is reverted, document it here:

### [YYYY-MM-DD] — Revert: [Task Description]

**Reason:** [Type mismatch / Test failure / Secret detected / Other]

**Git Commit:** git revert [hash]

**Resolution:** [How we fixed it and retried]

---

## Known Issues

| Issue | Severity | Status | Resolution |
|-------|----------|--------|-----------|
| [Issue 1] | [High/Med/Low] | [Open/In Progress/Closed] | [Resolution] |
| [Issue 2] | [High/Med/Low] | [Open/In Progress/Closed] | [Resolution] |

---

## Performance Notes

### Build Time
- Initial setup: [X] minutes
- Typical Claude Code run: [X] minutes
- Testing: [X] minutes
- Deployment: [X] minutes

### Quality Metrics
- Tests pass rate: [X]%
- Lint errors: [X]
- Type errors: [X]
- Code coverage: [X]%

---

_Changelog Template v1.0_  
_Codesmith uses this to track all build progress._
