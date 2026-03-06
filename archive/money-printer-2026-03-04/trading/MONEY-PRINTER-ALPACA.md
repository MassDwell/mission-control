# Money Printer — Alpaca Trading Infrastructure

**Updated:** March 3, 2026 2:25 AM

---

## Platform

**Trading Platform:** Alpaca Paper Trading  
**Account:** PA3RY5502SN6  
**Balance:** $100,000 paper money  
**Buying Power:** $200,000 (2x leverage)  
**Status:** Active  

---

## Credentials

**Location:** `~/.openclaw/workspace/credentials/alpaca/paper-trading.json`

```json
{
  "endpoint": "https://paper-api.alpaca.markets/v2",
  "key_id": "PKPJFMEC4QHVAQAPLNW43O7PZZ",
  "secret_key": "83ELaZ8bLgdmk3EehqN5WHHCyRhtcRwVCDxwWS9scqZt",
  "account_id": "PA3RY5502SN6"
}
```

---

## Scripts (Archived)

**Location:** `agents/ARCHIVED-money_printer-2026-03-01/archive/v1-v2-backup/trading-alpaca/`

**Key Files:**
- `enhanced-autonomous-trader.js` — Main trading engine
- `market-hours-validator.js` — Market hours checking
- `check_positions.js` — Position monitoring
- `execute-trade.js` — Trade execution
- `emergency_sell.js` — Stop-loss handler
- `btc-scalper.js` — BTC momentum scalper
- `profit_targets.js` — Take-profit logic
- `scrapers/signal-aggregator.js` — Multi-source signals

---

## Cron Job

**Name:** Money Printer Trading Cycle  
**ID:** 5a9d0c82-eeff-4025-a26c-e85019640488  
**Schedule:** 10 AM & 2 PM weekdays (Mon-Fri)  
**Status:** ✅ Enabled  

**Task:**
1. Check Alpaca account status
2. Review current positions and equity
3. Analyze market conditions
4. Report: balance, positions, daily P&L

---

## Status

**Money Printer Agent:** Archived (2026-03-01)  
**Trading Infrastructure:** Active (Alpaca paper account)  
**Monitoring:** Automated via cron (twice daily)  
**Next Run:** Next weekday at 10 AM EST  

---

**Remember: Money Printer uses ALPACA, not IBKR.**

The `/trading` folder has IBKR scripts (SPY options, autonomous-trader.js).  
The Money Printer Alpaca scripts are in the archived agent folder.
