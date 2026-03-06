# OpenClaw Drift Scan Report
**Date:** 2026-03-01 19:13:12 EST

=== OpenClaw Drift Scan Starting ===

Checking for duplicate SOUL.md files...
## [CRITICAL] Duplicate SOUL.md Files

**Duplicate SOUL.md files found for:**\n\n- `admin_assistant` exists in both `agents/` and `data/agents/`\n- `alpine_permitting` exists in both `agents/` and `data/agents/`\n- `alpine_property_mgmt` exists in both `agents/` and `data/agents/`\n- `chief_of_staff` exists in both `agents/` and `data/agents/`\n- `doc_proposal` exists in both `agents/` and `data/agents/`\n- `finance_underwriting` exists in both `agents/` and `data/agents/`\n- `marketing_content` exists in both `agents/` and `data/agents/`\n- `massdwell_factory_ops` exists in both `agents/` and `data/agents/`\n- `personal_life_cos` exists in both `agents/` and `data/agents/`\n- `security_ciso` exists in both `agents/` and `data/agents/`\n\n**Action:** Delete duplicates from `data/agents/` folder

Checking for orphaned SOUL.md files...
## [MEDIUM] Orphaned Agent Configurations

**Agents with SOUL.md but no active cron jobs:**\n\n- `agents/admin_assistant/SOUL.md`\n- `agents/atlantic_laser_sales/SOUL.md`\n- `agents/codesmith/SOUL.md`\n- `agents/marketing_content/SOUL.md`\n- `agents/money_printer/SOUL.md`\n- `agents/personal_life_cos/SOUL.md`\n- `agents/sales_followup/SOUL.md`\n\n**Action:** Archive or activate these agents

Checking for duplicate cron jobs...
✅ No duplicate cron jobs found

Checking for conflicting email signatures...
✅ Email signatures appear consistent

Checking for missing ownership tags...
## [LOW] Missing Ownership Tags

**SOUL.md files missing ownership tags:** 1\n\n**Action:** Add ownership tags to track file versions

Checking cron job registry...

---

## Summary

**Total Issues Found:** 3

⚠️  **Drift detected - review issues above**

**Report saved to:** `memory/drift-report-2026-03-01.md`
🚨 Sending Telegram alert (critical/high severity issues found)

=== Drift Scan Complete ===
