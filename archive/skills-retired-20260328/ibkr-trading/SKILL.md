---
name: ibkr-trading
description: Stock and options trading via Interactive Brokers with sentiment analysis, risk management, and adaptive strategies.
version: 1.0.0
author: Clawson
---

# IBKR Trading Skill

Autonomous trading for stocks and options via Interactive Brokers TWS API.

## Core Principles (Adapted from Alpha Arena)

### 1. Position Sizing: The 1-2% Rule
**HARD RULE: Never risk more than 2% of equity on a single trade.**

```
Max Position = Net Liq × 0.02 / Stop Distance
```

Example: $3,200 account, $1 stop on SPY option = max 64 contracts? NO. 
More realistically: 1-2 contracts max for options.

### 2. Sentiment BEFORE Thesis
**Always check X sentiment before entering a directional trade.**

```bash
# Check sentiment before any trade
bird search "$SPY OR SPY" -n 10 --plain | head -50
bird search "fed OR fomc OR rates" -n 5 --plain
```

Look for:
- Consensus (dangerous - crowded trade)
- Divergence (opportunity)
- Catalysts (earnings, data releases)

### 3. Don't Catch Knives
**Only trade in direction of higher-timeframe trend.**

Before going long:
- Is SPY above 20-day MA?
- Is daily trend up?

Before going short:
- Is SPY below 20-day MA?  
- Is daily trend down?

If trend conflicts with thesis → REDUCE SIZE or SKIP.

### 4. Calendar Awareness
**ALWAYS CHECK:**
- What day is it? (Weekend = no trading)
- Market hours? (9:30 AM - 4:00 PM ET)
- Upcoming catalysts? (NFP, FOMC, earnings)

```bash
# Before any trade decision
date
# Check economic calendar
bird search "economic calendar today" -n 3
```

### 5. Pre-Trade Checklist

Before EVERY trade:

- [ ] What day/time is it?
- [ ] Is market open?
- [ ] X sentiment checked?
- [ ] Trend direction confirmed?
- [ ] Position size ≤ 2% of equity?
- [ ] Stop loss defined?
- [ ] Catalyst calendar clear?

## Scripts

### check-sentiment.sh
```bash
#!/bin/bash
TICKER=${1:-SPY}
bird search "\$$TICKER" -n 15 --plain | head -80
```

### check-positions.js
```javascript
// See trading/check-positions.js
```

### autonomous-trader.js
```javascript
// See trading/autonomous-trader.js
// Monitors positions and executes rules automatically
```

## Trading Rules Format

When setting up a trade, define rules as:

```javascript
const RULES = {
  HOLD_BELOW: 682,    // Hold if price below this
  TRIM_ABOVE: 683,    // Trim position above this
  EXIT_ABOVE: 685,    // Full exit above this
  STOP_LOSS: -0.15,   // 15% max loss
};
```

## Risk Management

### Options
- Max 1-2 contracts per trade
- Define exit BEFORE entry
- Time decay = enemy (avoid holding overnight unless thesis is strong)

### Stocks
- Max 5% of portfolio per position
- Use stop losses
- Scale in, don't yolo

## Self-Evaluation Loop

After EVERY trade, log:

```markdown
## Trade Review: [DATE]
- **Ticker:** 
- **Direction:** Long/Short
- **Entry:** 
- **Exit:** 
- **P&L:** 
- **Thesis:** Why I entered
- **What happened:** What actually occurred
- **Lesson:** What I learned
```

Store in: `memory/trades/YYYY-MM-DD.md`

## Integration with TWS

```javascript
const ib = require('@stoqey/ib');
const client = new ib.IBApi({ port: 7496 });

// Always check connection first
client.on('connected', () => {
  client.reqPositions();
  client.reqAccountSummary(1, 'All', 'NetLiquidation');
});
```

## Files

| File | Purpose |
|------|---------|
| `trading/autonomous-trader.js` | Real-time position monitoring |
| `trading/check-connection.js` | TWS connection check |
| `trading/check-positions.js` | Current positions |
| `memory/trades/*.md` | Trade journal |
