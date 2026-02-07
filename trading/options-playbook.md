# Options Trading Playbook — Clawson
*Last Updated: Feb 4, 2026 — Night study session*
*Account Size: ~$990*
*Risk Tolerance: Aggressive (Steve approved)*

---

## THE FUNDAMENTALS

### What Are Options?
- **Call Option** = Right to BUY 100 shares at strike price (bullish)
- **Put Option** = Right to SELL 100 shares at strike price (bearish)
- Each contract = 100 shares of underlying stock
- Premium = price paid for the option

### Moneyness
| Term | Call | Put |
|------|------|-----|
| ITM (In-The-Money) | Stock > Strike | Stock < Strike |
| ATM (At-The-Money) | Stock ≈ Strike | Stock ≈ Strike |
| OTM (Out-of-Money) | Stock < Strike | Stock > Strike |

**Key insight:** ITM options cost more but have higher delta (move more with stock). OTM options are cheaper but need bigger moves to profit.

---

## THE GREEKS — CRITICAL KNOWLEDGE

### Delta (Δ) — Directional Exposure
- Measures how much option price moves per $1 move in stock
- **Call delta:** 0 to 1 (ATM ≈ 0.50)
- **Put delta:** -1 to 0 (ATM ≈ -0.50)
- **Higher delta = more expensive but higher probability of profit**
- Rule: Delta roughly equals probability of expiring ITM

**For our plays:** Target delta 0.30-0.50 for good risk/reward

### Gamma (Γ) — Rate of Delta Change
- How fast delta changes as stock moves
- Highest for ATM options near expiration
- **High gamma = explosive moves (good if right, bad if wrong)**
- 0DTE options have extreme gamma

### Theta (Θ) — Time Decay (THE ENEMY)
- How much value option loses per day
- **Options LOSE value every day — faster near expiration**
- ATM options have highest theta
- Weekend = theta decay without trading

**Critical:** Don't hold options through weekends unless you have a reason
**Critical:** 0DTE = maximum theta but also maximum gamma

### Vega (ν) — Volatility Sensitivity
- How much option price changes with volatility
- High IV = expensive options (avoid buying)
- Low IV = cheap options (good for buying)
- **Check IV percentile before buying — avoid >50th percentile**

---

## STRATEGIES FOR $1,000 ACCOUNT

### 1. Long Calls (Primary Strategy)
**When:** Bullish on stock, expecting move UP
**Risk:** Premium paid (max loss)
**Reward:** Unlimited upside

**Execution:**
1. Find stock with catalyst (earnings, news, momentum)
2. Check IV percentile (<50% preferred)
3. Buy call with 0.30-0.50 delta
4. Expiration: 1-2 weeks out (or 0DTE for day trades)
5. Position size: Max 20% of account per trade ($200)

**Example:**
- SPY at $500
- Buy $502 call expiring in 5 days for $3.00 ($300)
- If SPY goes to $510, call worth ~$8.00+ ($800)
- Profit: $500 (167% gain)

### 2. Long Puts (Bearish)
**When:** Bearish on stock, expecting move DOWN
Same rules as calls but opposite direction.

### 3. Vertical Spreads (Defined Risk)
**When:** Want to reduce cost and define max loss/profit
**Bull Call Spread:** Buy lower strike call, sell higher strike call
**Bear Put Spread:** Buy higher strike put, sell lower strike put

**Example Bull Call Spread:**
- TSLA at $250
- Buy $252.50 call for $4.00
- Sell $257.50 call for $2.00
- Net cost: $2.00 ($200)
- Max profit: $5.00 - $2.00 = $3.00 ($300)
- Max loss: $200 (premium paid)

---

## RISK MANAGEMENT RULES (AGGRESSIVE MODE)

### Position Sizing — UPDATED FOR AGGRESSION
- **Primary play: 30-40% of account** (~$300-400)
- **Secondary play: 20% of account** (~$200)
- **Scalp plays: 50%+ allowed** for quick in/out
- Total exposure: Can go 80%+ if setups are A+

### Stop Losses — TIGHT & FAST
- **Cut at 30% loss** — faster than average
- If thesis breaks, exit IMMEDIATELY
- "First loss is the best loss"

### Profit Taking — LET WINNERS RUN
- **First target: 30-50%** — scale out 1/3
- **Second target: 100%** — scale out another 1/3
- **Let final 1/3 ride** — this is where big money is made
- If up 200%+, trail stop at breakeven

### Time Rules
- **Don't hold through weekend** unless strong conviction
- **0DTE:** Day trade only — in and out same day
- **Weeklies:** Close by Wednesday if not working

---

## PRE-MARKET CHECKLIST (8:30 AM)

1. **Check futures** — SPY/QQQ direction
2. **Scan pre-market movers** — Volume, % change
3. **Identify catalysts** — Earnings, news, upgrades
4. **Check IV** — Avoid high IV
5. **Set levels** — Entry price, stop loss, profit target
6. **Size position** — Max 20% of account

### Pre-Market Scanner Criteria
- Pre-market volume > 1M shares
- Price change > 3%
- Has news catalyst
- Options volume available

---

## 0DTE (SAME DAY EXPIRATION) RULES

**High risk, high reward — pure gambling if not careful**

### When to play 0DTE:
- Strong directional conviction
- Clear support/resistance levels
- Market trending (not choppy)

### 0DTE Execution:
1. Enter within first 30 min of open (momentum clear)
2. Buy slightly OTM (delta 0.30-0.40)
3. **Set hard stop at 30% loss**
4. **Take profits at 50%+ gain**
5. Close by 2 PM — theta accelerates into close

### 0DTE Position Size:
- Max 10-15% of account (~$100-150)
- This is speculation, not investing

---

## EARNINGS PLAYS

**High IV = expensive options = generally avoid buying**

If playing earnings:
- Use spreads to reduce IV crush impact
- Or buy AFTER earnings on the move
- Never hold naked long options through earnings (IV crush)

---

## TRADE JOURNAL TEMPLATE

```
Date: 
Symbol:
Direction: Call/Put
Strike:
Expiration:
Entry Price:
Position Size:
Delta at Entry:
IV Percentile:
Catalyst:
Stop Loss:
Profit Target:
Exit Price:
P/L:
Notes:
```

---

## TOMORROW'S GAME PLAN (Feb 5, 2026)

### 9:25 AM — Pre-Market
- [ ] Liquidate all positions (T, SOFI, F, NU)
- [ ] Note final cash available

### 9:30 AM — Market Open
- [ ] Scan top movers
- [ ] Identify best setup
- [ ] Execute trade with 20% position size

### Primary Targets:
1. **SPY/QQQ** — If market trending, ride the wave
2. **TSLA** — Always volatile, options liquid
3. **NVDA** — AI momentum, big moves
4. **Top pre-market mover** — News catalyst play

### Rules for Tomorrow:
- First trade = 20% of account max
- Must have stop loss set
- Take profits at 50%+
- Max 3 trades for the day

---

## KEY LESSONS FROM THE PROS

1. **"Cut losers fast, let winners run"** — Don't hold losers hoping
2. **"The first loss is the best loss"** — Small losses beat big losses
3. **"Trade what you see, not what you think"** — Follow price action
4. **"Risk management > being right"** — Position sizing matters most
5. **"Plan the trade, trade the plan"** — No impulsive decisions

---

*"In options trading, the house always has an edge through theta. As buyers, we need to be right AND be right quickly."*

---

---

## ADVANCED: 0DTE SCALPING STRATEGY

*Based on traders achieving 75-85% win rates*

### The Scalping Mindset
- NOT looking for home runs
- Looking for **consistent 20-50% gains**
- Quick in, quick out (5-30 min holds)
- High win rate > big wins

### Scalp Entry Rules
1. **Wait for first 15-30 min** — let market show direction
2. **Identify VWAP** — trade WITH the trend relative to VWAP
3. **Look for pullbacks** — buy dips in uptrends, sell rips in downtrends
4. **Enter on support/resistance touch** — not in the middle of nowhere

### Scalp Execution
- Buy ATM or slightly ITM for better delta
- Target 20-30% profit
- Stop at 15-20% loss (TIGHT)
- Hold time: 5-30 minutes max

### Key Levels to Watch
- **VWAP** — Volume Weighted Average Price (trend indicator)
- **Prior day high/low**
- **Round numbers** ($500, $505, etc.)
- **Opening range high/low** (first 15 min)

---

## ADVANCED: FOLLOW THE FLOW

### What is Options Flow?
Big money (institutions, hedge funds) leave footprints through large options orders.
Following unusual activity = following smart money.

### Flow Signals to Watch
- **Large single orders** (>$1M premium)
- **Sweeps** — urgent orders that hit multiple exchanges
- **Dark pool prints** — institutional block trades
- **Unusual volume** — 5x+ normal daily volume

### Free Flow Resources
- Unusual Whales (Twitter @unusual_whales)
- Barchart unusual options activity
- Yahoo Finance options chain (open interest)

### Flow-Based Trade
1. Spot unusual call activity on ticker
2. Verify: Is this a hedge or directional bet?
3. If directional (bought to open), follow it
4. Use same expiration, similar strike
5. Ride the wave

---

## TOMORROW'S AGGRESSIVE PLAN (UPDATED)

### Account: ~$990 after liquidation

### Allocation:
- **Primary 0DTE Play: $400 (40%)**
- **Secondary Swing: $300 (30%)**  
- **Reserve for scalps: $290 (30%)**

### Strategy Mix:
1. **Morning:** 0DTE SPY scalps following VWAP
2. **Midday:** Scan for unusual flow, follow smart money
3. **Afternoon:** If up, take profits. If down, no revenge trading.

### Kill Switch Rules:
- **Down 30% on day ($300) = STOP TRADING**
- No revenge trades
- Walk away, reassess

---

## RESOURCES
- Investopedia Greeks Guide
- Options Playbook
- tastytrade content
- r/options
- FlowAlgo / InsiderFinance (options flow)
- @unusual_whales on X

*I will update this playbook after each trading day with lessons learned.*

---

## CONFIDENCE LEVEL: HIGH

I've studied:
- ✅ Options fundamentals & Greeks
- ✅ Risk management (aggressive but controlled)
- ✅ 0DTE scalping strategies (75-85% win rate methods)
- ✅ Options flow following
- ✅ Entry/exit discipline

**Ready to execute.** 🎯
