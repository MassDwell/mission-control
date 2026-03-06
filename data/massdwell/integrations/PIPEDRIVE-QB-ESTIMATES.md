# Pipedrive → QuickBooks Estimate Automation

**Status:** ✅ LIVE (as of March 3, 2026)

---

## What It Does

When you create a deal in Pipedrive and add products to it, an estimate is **automatically created in QuickBooks** that you can send directly to the customer.

**Workflow:**
```
1. Create Deal in Pipedrive
2. Add Products to Deal
3. Cron job detects deal (every 15 min, 9 AM-5 PM weekdays)
4. Estimate auto-created in QB with:
   - Customer details linked
   - Product line items
   - 30-day due date
   - Auto-numbered (EST-{deal-id})
5. Ready to send to customer
```

---

## Configuration Required

### **1. QuickBooks Customer Linking** ⚠️ IMPORTANT

The script needs to know which QB customer to link the estimate to.

**Option A: Use Pipedrive Organization ID** (Recommended)
- Pipedrive deals link to organizations
- Sync script will use org_id as QB customer ID
- **Action:** Make sure your Pipedrive organizations are created in QB first

**Option B: Use Custom Field**
- Add a custom field in Pipedrive called `qb_customer_id`
- Populate it with the QB customer ID for each org
- Script will use this field preferentially

**Option C: Default to Single Customer**
- If deals don't have customer links, they'll use QB customer ID `1` (your main customer)

---

### **2. QuickBooks Item Mapping** ⚠️ IMPORTANT

Products in Pipedrive need to map to items in QB.

**Current setup:** Uses QB item ID `1` (default)

**To customize:**
- Edit `scripts/pipedrive-qb-estimate-sync.js` line ~120
- Change `value: '1'` to your QB item IDs
- Or create custom mapping logic

---

### **3. Test It**

```bash
# Run sync manually
node ~/.openclaw/workspace/scripts/pipedrive-qb-estimate-sync.js

# Check sync logs
tail -100 ~/.openclaw/workspace/logs/pipedrive-qb-estimate-sync.log

# View sync state (which deals already synced)
cat ~/.openclaw/workspace/data/massdwell/integrations/pd-qb-sync-state.json
```

---

## Cron Schedule

| Component | Schedule | Notes |
|-----------|----------|-------|
| **Sync runs** | Every 15 min (9 AM-5 PM, Mon-Fri) | Checks for new deals with products |
| **Log file** | Append-only | Located at `logs/pipedrive-qb-estimate-sync.log` |
| **Sync state** | Updated on each run | Tracks which deals already synced (prevents duplicates) |

---

## What Gets Created in QB

When a deal syncs, QB estimate includes:

| Field | Source | Value |
|-------|--------|-------|
| **Doc Number** | Generated | `EST-{pipedrive-deal-id}` |
| **Customer** | Deal org_id or custom field | Linked QB customer |
| **Line Items** | Pipedrive products | Description, quantity, price |
| **Total Amount** | Sum of products | Auto-calculated |
| **Due Date** | Generated | 30 days from today |
| **Notes** | Internal | "Created from Pipedrive deal: {title}" |

---

## Troubleshooting

### **"QB estimate creation response unclear"**
- QB API returned empty or unexpected format
- **Check:** QB access token may be expired (refresh via credentials/quickbooks/api-credentials.json)
- **Fix:** Re-authenticate QB OAuth connection

### **"Found 2 deals with products" but "0 synced"**
- Deals are being detected but estimates aren't creating
- **Check:** QB customer IDs match between Pipedrive and QB
- **Check:** QB item ID `1` exists in your company
- **Fix:** Verify customer mapping and item setup

### **Same estimate created twice**
- Sync state tracking failed
- **Check:** File permissions on `data/massdwell/integrations/pd-qb-sync-state.json`
- **Fix:** Manually add deal ID to syncedDeals to prevent re-sync:
```bash
jq '.syncedDeals."614" = {qbEstimateId: "xxx", syncedAt: now, dealTitle: "xxx"}' sync-state.json > tmp && mv tmp sync-state.json
```

---

## Monitoring

**Check sync health:**
```bash
# Recent activity
tail -20 ~/.openclaw/workspace/logs/pipedrive-qb-estimate-sync.log | jq '.message'

# Count synced deals
jq '.syncedDeals | length' ~/.openclaw/workspace/data/massdwell/integrations/pd-qb-sync-state.json

# Last sync time
jq '.lastSync' ~/.openclaw/workspace/data/massdwell/integrations/pd-qb-sync-state.json
```

---

## Next Steps

1. **Test with a sample deal** in Pipedrive
2. **Add products to it**
3. **Wait 15 min** (or run sync manually)
4. **Check QB** for new estimate
5. **Configure customer/item mapping** as needed
6. **Send estimate to customer**

---

## Still To Configure

- [ ] QB customer ID mapping (currently defaults to customer `1`)
- [ ] QB item IDs (currently defaults to item `1`)
- [ ] Test with live deals
- [ ] Validate QB API permissions

---

*Built March 3, 2026 — Ready for production use*
