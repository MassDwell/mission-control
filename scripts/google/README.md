# Google Workspace Integration Scripts

**Account:** sales@massdwell.com  
**Scopes:** Gmail, Calendar, Drive

---

## Quick Commands

```bash
# Check unread emails
node scripts/google/google-api.js unread

# Get upcoming events
node scripts/google/google-api.js events

# Search Drive files
node scripts/google/google-api.js search "invoice"

# Refresh token manually
node scripts/google/google-api.js refresh

# Full Gmail scan (cross-ref with Kommo)
node scripts/google/gmail-scanner.js

# Full Drive index
node scripts/google/drive-indexer.js
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `google-api.js` | Unified API helper with CLI |
| `gmail-scanner.js` | Scans inbox, cross-refs with Kommo |
| `drive-indexer.js` | Full Drive file inventory |

---

## Credentials

| File | Purpose |
|------|---------|
| `credentials/google/gmail-oauth-credentials.json` | OAuth client config |
| `credentials/google/gmail-token.json` | Access & refresh tokens |
| `credentials/google/refresh-token.js` | Token refresh utility |
| `credentials/google/get-gmail-token.js` | Initial OAuth flow |

---

## Output Files

| File | Contents |
|------|----------|
| `data/massdwell/sales/gmail-scan-results.json` | Gmail scan results |
| `data/massdwell/drive-index.json` | Full Drive inventory |
| `data/massdwell/integrations/google-workspace-summary.md` | Integration summary |

---

## Notes

- Tokens auto-refresh when expired (401 triggers refresh)
- Token expires in ~1 hour, refresh token is permanent
- All scripts use the same token file
