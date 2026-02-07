# Prediction Market Arbitrage Research
**Date:** 2026-02-03
**Requested by:** Steve Vettori

---

## Executive Summary

Prediction market arbitrage is **real and documented**. Between April 2024-2025, traders extracted an estimated **$40 million in profits** from Polymarket alone. Bots dominate, achieving 85%+ win rates. One bot famously turned **$313 into $414,000** in a single month.

---

## How It Works

### Complete-Set Arbitrage (Spread Farming)
Every binary market resolves to exactly $1.00 total (YES pays $1 or NO pays $1).

If: `Price(YES) + Price(NO) < $1.00`
Then: Buy both sides → Guaranteed profit at settlement

**Example:**
- Buy YES @ $0.42 = $420 (1,000 shares)
- Buy NO @ $0.55 = $550 (1,000 shares)
- Total cost: $970
- Guaranteed payout: $1,000
- Profit: $30 (3% return, risk-free)

### Cross-Platform Arbitrage
Same event priced differently on Polymarket vs Kalshi:
- Polymarket: YES @ $0.45
- Kalshi: NO @ $0.52
- Total cost: $0.97 → Payout: $1.00 → Profit: $0.03/pair

### Best Markets for Arbitrage
Short-term crypto volatility (BTC/ETH 15-minute and 1-hour windows) — most consistent opportunities due to high volume and frequent mispricing.

---

## Documented Profits

| Source | Timeframe | Profit |
|--------|-----------|--------|
| IMDEA Networks Research | Apr 2024 - Apr 2025 | $40M total arbitrage |
| French trader (Théo) | Election night 2024 | $85M single event |
| One arbitrage bot | 1 month | $313 → $414,000 |
| Typical bot ROI | Per 15-min window | 1-3% |

---

## Technical Requirements

### Infrastructure
- **Language:** Rust for core engine (speed), Python for UI/monitoring
- **Data:** WebSocket connections for real-time orderbook
- **Latency:** Milliseconds matter — opportunities last seconds
- **Accounts:** Multiple wallets, rotate every few days to avoid front-runner detection

### Capital
- Start small ($500-$1,000) for testing
- Scale after validating execution
- Position sizing limited by liquidity

### Platforms
1. **Polymarket** (crypto-based, USDC)
   - Maker orders = 0 fees
   - US users technically restricted (use VPN + non-US KYC)
2. **Kalshi** (CFTC-regulated, US legal)
   - Transaction fees on earnings
   - More restrictive position limits

---

## Tools Mentioned

| Tool | Purpose | Link |
|------|---------|------|
| pmxt | Cross-platform arbitrage scanner | github.com/qoery-com/pmxt |
| Claude Opus 4.5 | Bot development | "Can help you build a solid basis" |
| Custom bots | Execution | Rust + Python stack common |

---

## Risks & Challenges

### Technical
- **Slippage** — Price moves between detection and execution
- **Front-runners** — Other bots watch for your behavior, snipe orders
- **Fees** — Can eat 3¢ margin entirely if not careful

### Competitive
- **Sophisticated players entering** — Susquehanna (Sig) and similar firms
- **Edge erosion** — Estimated 8-10 months before arbitrage becomes unprofitable
- **Speed wars** — Firms will get direct fiber access, hard to compete

### Regulatory/TOS
- Polymarket TOS technically prohibits automation
- US access to Polymarket is gray area
- Kalshi is fully US-legal but more restrictive

---

## Reddit Consensus

From r/algotrading, r/arbitragebetting, r/PolymarketTrading:

**Bullish takes:**
- "1% return in 15 minutes is insane risk-adjusted"
- "Complete-set arb on crypto volatility markets is still printing"
- "Claude Opus 4.5 can help you build a solid basis"

**Bearish takes:**
- "Don't trust Claude to do all the work for you lol there's a reason you immediately lost $2k"
- "Poly market is not even close to an efficient market. Using it for anything but pure gambling is foolish."
- "A lot of these markets have already been exploited to the point..."

---

## My Assessment

### Pros
✅ Documented $40M+ in profits  
✅ Risk-free when executed correctly  
✅ I can help build the bot (Claude/AI-assisted development)  
✅ Scales linearly with capital  
✅ Diversifies from IBKR stock trading  

### Cons
❌ Competitive — edge eroding  
❌ Requires technical sophistication (latency, execution)  
❌ Polymarket US access is gray area  
❌ TOS prohibits automation (account risk)  
❌ Capital tied up in crypto (USDC)  

### Recommendation

**Worth exploring with small capital ($500-$1,000) as a learning exercise and potential alpha source.**

The opportunity is real but narrowing. If we're going to play, better to start now than in 6 months. I'd recommend:

1. **Start with Kalshi only** (fully US-legal, no VPN games)
2. **Build a scanner first** — detect opportunities before committing capital
3. **Paper trade** the logic, then go live small
4. **Focus on crypto volatility markets** — most consistent edge

This is lower priority than IBKR trading but could be a fun side project that generates real returns.

---

*Research compiled by Clawson | Sources: Reddit, Google, IMDEA Networks, Yahoo Finance, various trading blogs*
