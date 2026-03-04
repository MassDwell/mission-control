# 🚀 Quick Start - Revert Closed Won Leads

**Time to execute:** 5 minutes  
**Difficulty:** Easy (just follow steps)

---

## Step 1: Get Kommo Credentials (2 min)

1. Log into your Kommo account: https://massdwell.kommo.com (or your domain)
2. Click **Settings** (gear icon, top right)
3. Go to **Integrations** → **API**
4. Find your integration OR click **+ Create Integration**
5. Click **Generate Access Token** or copy existing token
6. You'll need:
   - Domain (e.g., massdwell.kommo.com)
   - Access Token
   - Refresh Token (if shown)
   - Client ID
   - Client Secret

---

## Step 2: Configure Credentials (1 min)

Edit the file: `credentials/kommo/api-token.json`

```json
{
  "domain": "massdwell.kommo.com",
  "access_token": "paste_your_token_here",
  "refresh_token": "paste_refresh_token",
  "client_id": "paste_client_id",
  "client_secret": "paste_client_secret",
  "redirect_uri": "https://massdwell.com/callback"
}
```

**Save the file.**

---

## Step 3: Test Connection (30 sec)

Open terminal, navigate to this directory, run:

```bash
node scripts/test-kommo-connection.js
```

**Expected output:**
```
✅ Credentials file found
✅ Domain: massdwell.kommo.com
✅ Access token present
✅ API connection successful!
   Account: MassDwell
🎉 All checks passed!
```

If you see errors, check credentials and try again.

---

## Step 4: Dry Run - Review What Would Happen (1 min)

```bash
node scripts/revert-closed-won-mistakes.js
```

This shows you exactly what it would do **WITHOUT making changes**.

**Review the output:**
- How many leads found in Closed Won?
- How many will be reverted?
- How many will stay as Closed Won?
- Any high-value deals being preserved?

**If it looks good, proceed to Step 5.**  
**If something looks wrong, stop and review.**

---

## Step 5: Execute Reversion (30 sec)

```bash
CONFIRM=yes node scripts/revert-closed-won-mistakes.js
```

This actually makes the changes.

**Watch for:**
```
✅ Successfully reverted: 69
⚠️  Kept as Closed Won: 3
❌ Errors: 0
```

**Done!** Audit log saved to: `data/massdwell/sales/revert-audit.json`

---

## Step 6: Verify (1 min)

1. Open Kommo in browser
2. Go to **Incoming Leads** pipeline
3. You should see ~69 leads that weren't there before
4. Check **Closed Won** pipeline
5. Should only have legitimate high-value deals left

**Spot-check 3-5 leads** from the audit log to confirm they're in correct status.

---

## ✅ You're Done!

**Total time:** ~5 minutes

**Results:**
- ✅ 69 incorrectly moved leads reverted
- ✅ Pipeline metrics accurate again
- ✅ Complete audit trail saved
- ✅ Real Closed Won deals preserved

---

## 🆘 Need Help?

**Connection test fails?**  
→ Check credentials in `credentials/kommo/api-token.json`

**API 401 error?**  
→ Token expired, generate new one in Kommo

**Script finds 0 leads?**  
→ They may already be reverted, or check status ID

**Want more details?**  
→ Read `CLOSED-WON-REVERSION-REPORT.md` (full documentation)

---

**Questions?** Check `scripts/REVERT-CLOSED-WON-README.md` for troubleshooting.
