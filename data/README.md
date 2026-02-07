# Data Directory

Structured storage for all business materials across the Alpine ecosystem.

## Structure

```
data/
├── global/                    # Cross-entity facts and shared context
│   └── facts.json
├── alpine/                    # Alpine Property Group
│   ├── facts.json
│   ├── decks/
│   ├── proposals/
│   ├── contracts/
│   ├── sops/
│   ├── financial_models/
│   ├── emails/
│   ├── meeting_notes/
│   ├── marketing_assets/
│   └── product_specs/
├── massdwell/                 # MassDwell (Primary)
│   ├── facts.json
│   └── [same subdirectories]
└── atlantic_laser/            # Atlantic Laser Solutions (Secondary)
    ├── facts.json
    └── [same subdirectories]
```

## Facts Files

Each `facts.json` is a living document containing:
- Company information
- Products and pricing
- Key contacts and relationships
- Strategic context
- Open questions (gaps to fill)

**Format:** JSON for structured querying and programmatic updates.

**Maintenance:** Update whenever new information is learned. Agents should reference these for context before taking action.

## Document Types

| Directory | Contents |
|-----------|----------|
| `decks/` | Presentations, pitch decks |
| `proposals/` | Client proposals, project proposals |
| `contracts/` | Agreements, signed documents |
| `sops/` | Standard operating procedures |
| `financial_models/` | Proformas, budgets, projections |
| `emails/` | Important correspondence (archived) |
| `meeting_notes/` | Call notes, meeting summaries |
| `marketing_assets/` | Collateral, images, copy |
| `product_specs/` | Technical specifications, datasheets |

## Rules

1. **No cross-contamination** — Keep materials in their respective company namespace
2. **Living facts** — Update `facts.json` whenever context is learned
3. **Clear naming** — Use descriptive filenames with dates where relevant
4. **Agents reference facts** — Before acting, agents should load relevant `facts.json` for context

---

*Created: 2026-02-02*


## Google Workspace Integration (2026-02-03)

- **Account:** sales@massdwell.com
- **Scripts:** scripts/google/
- **Credentials:** credentials/google/
- **Documentation:** scripts/google/README.md

### Capabilities:
- Gmail: Read, send, modify
- Calendar: Read, write events  
- Drive: Read, write, download files

### Key Files Downloaded:
- data/massdwell/decks/MassDwell_Investor_Deck_v2.2.pdf (30MB)

