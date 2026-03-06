# Browser Relay Setup for Money Printer Scraping

**Purpose:** OpenClaw Browser Relay controls authenticated Chrome tabs in real-time  
**Cost Model:** Uses MiniMax (per-prompt) instead of Claude tokens (per-token)  
**Setup Time:** ~10 minutes  

---

## Step 1: Install OpenClaw Browser Relay Extension

1. Open Chrome
2. Go to: **chrome://extensions/**
3. Enable **Developer mode** (toggle in top right)
4. You should see "OpenClaw Browser Relay" available
5. If not visible, check OpenClaw docs: https://docs.openclaw.ai/browser-relay

---

## Step 2: Create & Attach Tabs

Create dedicated Chrome tabs for each scraping target and attach them to OpenClaw:

### **Tab 1: X (Twitter) - Oil/Energy Sentiment**

1. New Chrome tab → https://x.com/
2. Login with your account (or use existing session)
3. Once logged in, search for: `oil iran war` (save this search)
4. Keep this tab open
5. **Attach to OpenClaw:** Click "OpenClaw Browser Relay" extension icon → Select "Attach this tab" → Name it `sentiment-x-oil`

**Chrome tab stays open and authenticated.** OpenClaw can take DOM snapshots anytime.

---

### **Tab 2: Reddit - r/wallstreetbets**

1. New Chrome tab → https://www.reddit.com/r/wallstreetbets/new/
2. Login if needed
3. **Attach to OpenClaw:** Icon → "Attach" → Name it `sentiment-reddit-wsb`

---

### **Tab 3: StockTwits**

1. New Chrome tab → https://stocktwits.com/
2. Login (optional, public data accessible)
3. Search or browse: CL, USO, DAL, XLE, ITA
4. **Attach to OpenClaw:** Icon → "Attach" → Name it `sentiment-stocktwits`

---

### **Tab 4: MarineTraffic (Optional - Can use API)**

1. New Chrome tab → https://www.marinetraffic.com/
2. Set view to: **Strait of Hormuz + Persian Gulf**
3. Zoom in, filter by tanker ships
4. **Attach to OpenClaw:** Icon → "Attach" → Name it `sentiment-marine-traffic`

---

### **Tab 5: Bloomberg News (Optional)**

1. New Chrome tab → https://www.bloomberg.com/news
2. Set filter to: **Search for "Iran"**
3. **Attach to OpenClaw:** Icon → "Attach" → Name it `sentiment-bloomberg`

---

## Step 3: Verify Attachment

In OpenClaw terminal or UI, run:

```bash
openclaw browser relay status
```

Should show:
```
✅ sentiment-x-oil (attached, authenticated)
✅ sentiment-reddit-wsb (attached, authenticated)
✅ sentiment-stocktwits (attached, authenticated)
✅ sentiment-marine-traffic (attached, authenticated)
✅ sentiment-bloomberg (attached, authenticated)
```

---

## Step 4: Configure Sentiment Scraper

Update `scripts/sentiment-scraper.js` to use Browser Relay snapshots instead of hardcoded samples:

```javascript
// Instead of:
const xFeedSample = `[hardcoded sample]...`;

// Use:
const xDOM = await getTabSnapshot('sentiment-x-oil');
const xAnalysis = await analyzeWithMiniMax(xDOM);
```

---

## Step 5: Test the Connection

Run:

```bash
node ~/.openclaw/workspace/scripts/sentiment-scraper.js
```

Should produce:
```
🔍 SentimentIntelligence Scraper Starting...
📱 Scraping X (Twitter) sentiment via Browser Relay...
✅ X sentiment captured
🤖 Scraping Reddit r/wallstreetbets via Browser Relay...
✅ Reddit sentiment captured
[... continues ...]
✅ SentimentIntelligence report complete
```

---

## Daily Workflow

**9:05 AM:** SentimentIntelligence cron wakes up
1. Snapshots each attached tab (X, Reddit, StockTwits, MarineTraffic, Bloomberg)
2. Sends snapshots to MiniMax for analysis (cheaper than Claude per-token)
3. Generates conviction scores + escalation risk
4. Reports to Telegram
5. StrategyGenerator picks up the intel at 9:15 AM

---

## Cost Breakdown

| Step | Tokens | Cost |
|------|--------|------|
| 1. Snapshot X DOM | 0 | $0 (Browser Relay = local) |
| 2. Send to MiniMax | 1 prompt | ~$0.02-0.05 |
| 3. Repeat 5 sources | 5 prompts | ~$0.10-0.25 |
| 4. Aggregation analysis | 1 prompt | ~$0.02-0.05 |
| **Total per cycle** | | **~$0.14-0.35** |
| **3 cycles/day** | | **~$0.42-1.05/day** |

Compare to Claude:
- X DOM snapshot = 50,000 tokens = $1.50/scrape
- 5 sources × $1.50 = $7.50/cycle
- 3 cycles × $7.50 = $22.50/day = **50x more expensive**

**MiniMax wins. 100% use this.**

---

## Keep Tabs Alive

Chrome tabs will auto-log out after 30 days. Refresh periodically:

**Cron job (weekly):**
```bash
# Refresh each tab to keep auth session alive
openclaw browser relay refresh-tab sentiment-x-oil
openclaw browser relay refresh-tab sentiment-reddit-wsb
... (etc for each)
```

Or manually: Click each tab once per week.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tab shows "not attached" | Re-attach by clicking extension icon |
| DOM snapshot is blank | Tab may be logged out — refresh & re-attach |
| MiniMax returns error | Check API key in `/credentials/minimax/api-key.json` |
| Slow scrapes (>30s) | Browser Relay can take 15-30s per snapshot — normal |

---

## Full Scraping Loop Integration

Once Browser Relay is set up, the **Money Printer daily cycle** becomes:

```
9:00 AM  ← MarketIntelligence (traditional APIs: oil curve, VIX)
9:05 AM  ← SentimentIntelligence (Browser Relay snapshots + MiniMax analysis)
9:15 AM  ← StrategyGenerator (combines both intel sources)
9:20 AM  ← RiskGuardian (approval)
9:30 AM  ← Execution (place trades)
```

**Fully automated, real-time sentiment edge.**

---

_Updated: 2026-03-03 @ 12:30 PM EST_
