# Task Execution Loop — Standard Operating Procedure

**Every agent heartbeat MUST follow this loop:**

## The Loop

```
1. READ CONTEXT
   - Read your SOUL.md
   - Read your memory/WORKING.md
   
2. CHECK MENTIONS
   - Scan data/global/mentions.json for @your_agent_name
   - If mentioned, handle that first
   
3. CHECK MISSION CONTROL
   - Read /Users/openclaw/.openclaw/workspace/data/tasks.json
   - Find tasks where:
     - assignee == your_agent_id OR
     - task is in your domain (check SOUL.md for your domain)
     - status == "in_progress"
     - processingStartedAt is NOT set (idle)
   
4. IF TASK FOUND:
   a. Mark active: scripts/mc-update.sh start <task_id> "<your_agent_name>"
   b. Execute the work (read description, subtasks, dod)
   c. Update subtasks as you complete them
   d. When done: scripts/mc-update.sh complete <task_id> "summary"
   e. Git push the changes
   
5. IF NO TASK:
   - Do domain-specific checks (see SOUL.md)
   - If nothing needs attention: reply HEARTBEAT_OK
```

## Task Ownership

| Agent | Owns tasks tagged with |
|-------|----------------------|
| marketing_content | portal, content, social, x-twitter |
| sales_followup | sales, crm, leads, follow-up |
| chief_of_staff | cross-business, briefing, standup |
| admin_assistant | admin, cleanup, email |
| finance_underwriting | finance, underwriting, analysis |
| doc_proposal | documents, proposals, contracts |

## Rules

1. **One task at a time** — Don't start a new task until current one is complete or blocked
2. **Mark active immediately** — Before doing any work, run mc-update.sh start
3. **Update progress** — Add comments for significant progress
4. **Don't abandon** — If you can't finish, add a comment explaining why and stop the task
5. **Push changes** — Always git push after updating tasks.json

## Blocked Tasks

If a task is blocked:
1. Add comment explaining the blocker
2. Run: mc-update.sh stop <task_id>
3. @mention whoever can unblock (e.g., @steve for approvals)

---
*All agents must follow this loop. No exceptions.*
