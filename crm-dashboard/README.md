# MassDwell CRM Dashboard

Internal CRM mirror for Clawson to track and plan MassDwell sales pipeline.

## Architecture

```
Kommo (Source of Truth) ──READ ONLY──> Sync Service ──> Local CRM Database
                                                              │
                                                              ▼
                                                    CRM Dashboard (Full Control)
                                                    - Track leads
                                                    - Add notes/plans
                                                    - Set follow-up reminders
                                                    - Analyze pipeline
```

## Rules

1. **Kommo is READ-ONLY** - Never modify Kommo data unless Steve explicitly approves
2. **Local CRM is mine** - Free to add notes, plans, analysis, follow-ups
3. **Sync regularly** - Pull latest from Kommo to stay current
4. **Track everything** - Every lead interaction, plan, and outcome

## Data Structure

- `data/leads.json` - Synced lead data from Kommo
- `data/notes.json` - My notes and plans per lead
- `data/pipeline.json` - Pipeline stage assignments
- `data/sync-log.json` - Sync history

## Components

- **Sync Service** - Pulls data from Kommo API
- **Dashboard UI** - Visual pipeline and lead management
- **Planning Tools** - Follow-up scheduling, task creation
