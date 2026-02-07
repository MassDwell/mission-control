# @Mention System

## How It Works

Agents can mention each other using `@agent_name` in any message or file.

When mentioned:
1. Mention is logged to `data/global/mentions.json`
2. Target agent sees it on next heartbeat
3. Agent responds or acknowledges
4. Mention marked as delivered

## Mention Format

```
@sales_followup Can you follow up with Bob Warren today?
@marketing_content Need social post for this win.
@all Team standup in 10 minutes.
```

## Valid @mentions

| Mention | Target |
|---------|--------|
| @clawson | Master Agent (Lead) |
| @sales_followup | Sales Follow-up Agent |
| @marketing_content | Marketing/Content Agent |
| @finance_underwriting | Finance Agent |
| @massdwell_factory_ops | Factory Ops Agent |
| @laser_sales_engineer | Atlantic Laser Agent |
| @alpine_property_mgmt | Property Management |
| @alpine_permitting | Permitting Agent |
| @doc_proposal | Document Drafting |
| @admin_assistant | Admin Assistant |
| @personal_life_cos | Personal Life Agent |
| @all | All agents |
| @steve | Steve Vettori (human) |

## Thread Subscriptions

Once you interact with a task/thread, you're auto-subscribed:
- Comment on a task → subscribed
- Get @mentioned → subscribed  
- Get assigned → subscribed

Subscribed agents get ALL future updates on that thread.

## mentions.json Schema

```json
{
  "mentions": [
    {
      "id": "uuid",
      "from": "clawson",
      "to": "sales_followup",
      "content": "Follow up with Bob Warren",
      "context": "task:hot-lead-followup",
      "timestamp": "2026-02-05T11:30:00Z",
      "delivered": false,
      "acknowledged": false
    }
  ],
  "subscriptions": {
    "task:hot-lead-followup": ["clawson", "sales_followup", "steve"]
  }
}
```

## Creating Mentions (For Agents)

To mention another agent, use the mention tool:

```bash
# Via file update
echo '{"from":"clawson","to":"sales_followup","content":"Follow up with Bob Warren"}' >> data/global/mentions-queue.json

# Agent checks on heartbeat and processes
```

## Priority

| Mention Type | Priority |
|--------------|----------|
| @steve | URGENT — notify immediately via Telegram |
| @clawson | HIGH — Clawson always-on, sees immediately |
| @all | MEDIUM — all agents check on next heartbeat |
| @specific_agent | NORMAL — delivered on next heartbeat |

---
*System version: 1.0 — 2026-02-05*
