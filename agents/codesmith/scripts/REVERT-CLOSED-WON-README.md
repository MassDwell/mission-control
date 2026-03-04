# Closed Won Lead Reversion - Operation Guide

## 🚨 SITUATION

**Bug:** The `email-to-kommo-integration.js` script incorrectly moved **69 leads** from their proper classification to **Closed Won** (status 142) instead of **Incoming Leads** (status 88661695).

**Impact:** Prospects that should be in the pipeline are showing as closed deals, skewing metrics and potentially causing follow-up issues.

**Status:** Bug is fixed. This script reverts the incorrectly moved leads.

---

## 🎯 WHAT THIS SCRIPT DOES

1. **Connects to Kommo API** using credentials in `credentials/kommo/api-token.json`
2. **Fetches ALL leads** currently in Closed Won status (142)
3. **Analyzes each lead** to determine if it's a mistake or legitimate win
4. **Reverts mistakes** back to Incoming Leads (88661695)
5. **Preserves real wins** (high-value deals with documentation)
6. **Logs everything** to `data/massdwell/sales/revert-audit.json`

---

## 📋 BEFORE YOU RUN

### Step 1: Configure Kommo API Credentials

Edit `credentials/kommo/api-token.json`:

```json
{
  "domain": "yourcompany.kommo.com",
  "access_token": "your_actual_access_token",
  "refresh_token": "your_refresh_token",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "redirect_uri": "https://yourcompany.com/callback"
}
```

**How to get credentials:**

1. Log into your Kommo account
2. Go to Settings → Integrations → API
3. Create a new integration or use existing
4. Generate access token
5. Copy all credentials to the JSON file

### Step 2: Install Node.js (if not already installed)

This script requires Node.js 14+. Check with:

```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org)

---

## 🚀 RUNNING THE SCRIPT

### Dry Run First (RECOMMENDED)

Run the script WITHOUT making changes to see what would happen:

```bash
node scripts/revert-closed-won-mistakes.js
```

This will:
- Fetch all Closed Won leads
- Analyze each one
- Show you exactly what it would do
- Save analysis to audit log
- **NOT make any changes**

### Execute the Reversion

After reviewing the dry run, execute with:

```bash
CONFIRM=yes node scripts/revert-closed-won-mistakes.js
```

This will:
- Perform the same analysis
- **Actually revert** the identified mistakes
- Log every action to audit file

---

## 🔬 HOW IT DECIDES WHAT TO REVERT

The script uses a **confidence-based system**. A lead is reverted ONLY if confidence >= 95%.

### Confidence Factors:

| Check | Points | Description |
|-------|--------|-------------|
| **Created in last 2 days** | +40% | Matches bug period timing |
| **Deal value < $200k or not set** | +30% | Too low for typical closed deal |
| **Source = Email** | +15% | Auto-classified, not manual |
| **No contract documentation** | +15% | No proof of actual close |
| **High deal value (>= $200k)** | -20% | Might be real win |
| **Contract docs present** | -30% | Likely legitimate close |
| **Created before bug period** | Auto-reject | Can't be from this bug |

### Example: Lead A
- ✅ Created 1 day ago: +40%
- ✅ Deal value: $0: +30%
- ✅ Source: Email: +15%
- ✅ No contract docs: +15%
- **Total: 100% → REVERT**

### Example: Lead B
- ✅ Created 1 day ago: +40%
- ✅ Deal value: $350k: -20% (high value)
- ✅ Source: Email: +15%
- ❌ Contract docs present: -30%
- **Total: 5% → KEEP AS CLOSED WON**

---

## 📊 UNDERSTANDING THE OUTPUT

### During Analysis:

```
📊 Lead #12345: John Smith - New Project
   Created: 2026-03-02T14:30:00.000Z
   Value: $150,000
   Source: Email
   Confidence: 100%
   Decision: ✅ REVERT
   Reasons:
     - Created in last 2 days (bug period)
     - Deal value: $150,000 (< $200k threshold)
     - Source: Email (likely auto-classified)
     - No contract documentation found
```

### Summary:

```
🎯 Summary of Analysis:
   Total leads analyzed: 72
   To revert: 69
   To keep as Closed Won: 3
```

### After Execution:

```
✅ REVERSION COMPLETE

📊 Final Results:
   ✅ Successfully reverted: 69
   ⚠️  Kept as Closed Won: 3
   ❌ Errors: 0

📝 Full audit log: data/massdwell/sales/revert-audit.json
```

---

## 📝 AUDIT LOG STRUCTURE

The script creates `data/massdwell/sales/revert-audit.json`:

```json
{
  "timestamp": "2026-03-03T19:52:00.000Z",
  "totalLeadsInClosedWon": 72,
  "analyzed": [
    {
      "id": 12345,
      "name": "John Smith - New Project",
      "createdAt": "2026-03-02T14:30:00.000Z",
      "dealValue": 150000,
      "source": "Email",
      "confidence": 100,
      "reasons": [...],
      "shouldRevert": true,
      "reverted": true,
      "revertedAt": "2026-03-03T19:52:15.000Z"
    }
  ],
  "reverted": [...],
  "keptAsClosedWon": [...],
  "errors": []
}
```

This provides:
- Complete audit trail
- Timestamp of every action
- Reasoning for every decision
- Error tracking

---

## ⚠️ SAFETY FEATURES

1. **Conservative approach**: 95% confidence threshold (only revert if VERY sure)
2. **Dry run default**: Must explicitly confirm with `CONFIRM=yes`
3. **Preserves real wins**: High-value deals stay in Closed Won
4. **Rate limiting**: 100ms delay between API calls
5. **Error handling**: Continues on errors, logs everything
6. **Full audit trail**: Every decision logged with reasoning

---

## 🐛 TROUBLESHOOTING

### "Failed to load credentials"

- Check that `credentials/kommo/api-token.json` exists
- Verify JSON is valid (no trailing commas, proper quotes)
- Ensure access_token is filled in (not placeholder)

### "API Error 401: Unauthorized"

- Access token may be expired
- Generate new token in Kommo settings
- Update credentials file

### "API Error 429: Too Many Requests"

- Kommo rate limit hit
- Script has 100ms delay, but if you have other integrations running...
- Wait 5 minutes and try again

### "Found 0 leads in Closed Won"

- Either they've already been reverted
- Or there's an issue with the status ID (142)
- Check Kommo to verify Closed Won pipeline/status IDs

### Script hangs or times out

- Network issue or Kommo API slow
- Check internet connection
- Try again in a few minutes

---

## 📞 REPORTING TO STEVE

After running the script, report:

### 1. Total Leads Reverted
Example: "✅ Reverted 69 leads from Closed Won back to Incoming Leads"

### 2. Leads Kept in Closed Won (if any)
Example: "⚠️ Kept 3 leads as Closed Won (high value, documented)"

List them:
- Lead #12345: ABC Corp ($350k, contract signed)
- Lead #67890: XYZ Industries ($500k, purchase order received)
- Lead #11111: Big Client ($1.2M, legal docs attached)

### 3. Edge Cases or Concerns
Example: "ℹ️ Lead #99999 had $180k value but no docs - reverted based on confidence threshold"

### 4. Audit Log Location
"📝 Full audit trail: `data/massdwell/sales/revert-audit.json`"

### 5. Errors (if any)
Example: "❌ Failed to revert Lead #77777 due to API timeout - requires manual review"

---

## 🔍 VERIFICATION

After running, verify in Kommo:

1. **Check Incoming Leads pipeline**: Should see ~69 leads that weren't there before
2. **Check Closed Won pipeline**: Should only have legitimate high-value deals
3. **Spot-check 5-10 reverted leads**: Confirm they're back in correct status
4. **Review audit log**: Cross-reference with Kommo UI

---

## 📚 FILES CREATED

```
credentials/
  kommo/
    api-token.json          # API credentials (FILL THIS IN!)

scripts/
  revert-closed-won-mistakes.js   # Main reversion script
  REVERT-CLOSED-WON-README.md     # This file

data/
  massdwell/
    sales/
      revert-audit.json     # Generated after running script
```

---

## ✅ CHECKLIST

Before running:
- [ ] Kommo credentials configured in `credentials/kommo/api-token.json`
- [ ] Node.js installed (check with `node --version`)
- [ ] Reviewed dry run output
- [ ] Confirmed with Steve to proceed

After running:
- [ ] Verified audit log created
- [ ] Checked Kommo UI for reverted leads
- [ ] Reported results to Steve
- [ ] Kept audit log for records

---

## 🎓 LEARNING

**What caused the bug?**
The `email-to-kommo-integration.js` script had incorrect status mapping. When classifying emails, it should have moved leads to Incoming Leads (88661695) but instead used Closed Won (142).

**How was it fixed?**
The status mapping in the integration script was corrected. This reversion script cleans up the damage.

**How to prevent future occurrences?**
- Add validation in integration script (e.g., require high deal value + documentation before setting Closed Won)
- Implement dry-run mode for integrations
- Add status change notifications for Closed Won
- Periodic audit of Closed Won leads (e.g., weekly report of recent additions)

---

**Questions?** Check the script source code for inline comments explaining logic.

**Need help?** Contact Codesmith agent or review audit log for detailed reasoning.
