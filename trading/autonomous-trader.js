const ib = require('@stoqey/ib');
const fs = require('fs');

// === SPY 686C 0DTE TRADING RULES (Feb 6, 2026 11:05 AM) ===
const RULES = {
  ENTRY_PRICE: 2.02,
  TARGET_PRICE: 3.00,      // 50% gain - take profit
  STOP_PRICE: 1.01,        // 50% loss - stop out
  TIME_STOP_HOUR: 14,      // Exit by 2 PM
  CHECK_INTERVAL: 60000,   // 1 min for active 0DTE trade
};

const POSITION = {
  localSymbol: 'SPY   260206C00686000',
};

function log(msg) {
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync('/tmp/autonomous-trader.log', line + '\n');
}

function alertSteve(msg) {
  log('📱 ALERTING STEVE: ' + msg);
  fs.writeFileSync('/tmp/steve-alert.txt', msg);
  fs.appendFileSync('/tmp/trading-alerts.log', `[${new Date().toISOString()}] ${msg}\n`);
}

function isMarketHours() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  if (hour < 9 || hour >= 16) return false;
  if (hour === 9 && min < 30) return false;
  return true;
}

function getPortfolioData() {
  return new Promise((resolve) => {
    const client = new ib.IBApi({ port: 7496 });
    let data = {};
    
    client.on('connected', () => {
      client.reqAccountUpdates(true, '');
    });
    
    client.on('updatePortfolio', (contract, pos, mktPrice, mktValue, avgCost, unrealizedPnL, realizedPnL, account) => {
      if (pos !== 0) {
        const sym = contract.localSymbol || contract.symbol;
        data[sym] = { contract, pos, mktPrice, mktValue, avgCost, unrealizedPnL };
      }
    });
    
    client.on('error', () => {});
    
    setTimeout(() => {
      client.reqAccountUpdates(false, '');
      client.disconnect();
      resolve(data);
    }, 4000);
    
    client.connect();
  });
}

async function executeSell(contract, qty, reason) {
  return new Promise((resolve) => {
    const client = new ib.IBApi({ port: 7496 });
    
    client.on('connected', () => {
      const orderContract = {
        conId: contract.conId,
        symbol: contract.symbol,
        secType: contract.secType,
        exchange: 'SMART',
        currency: 'USD'
      };
      const order = { 
        action: 'SELL', 
        orderType: 'MKT', 
        totalQuantity: qty, 
        transmit: true 
      };
      const orderId = Math.floor(Date.now() / 1000);
      log(`🔴 EXECUTING: SELL ${qty} ${contract.localSymbol} (${reason})`);
      client.placeOrder(orderId, orderContract, order);
    });
    
    client.on('orderStatus', (id, status, filled, remaining, avgPrice) => {
      if (status === 'Filled' || (filled > 0 && avgPrice > 0)) {
        const msg = `✅ SOLD ${filled} @ $${avgPrice.toFixed(2)} (${reason})`;
        log(msg);
        alertSteve(msg);
        client.disconnect();
        resolve({ filled, avgPrice });
      }
    });
    
    client.on('error', (e, code, msg) => {
      if (code !== 2104 && code !== 2106 && code !== 2158 && code !== 10349) {
        log(`Order error: ${code} - ${msg}`);
      }
    });
    
    client.connect();
    setTimeout(() => { client.disconnect(); resolve(null); }, 10000);
  });
}

async function checkAndExecute() {
  const now = new Date();
  const hour = now.getHours();
  
  // Get portfolio data
  const portfolio = await getPortfolioData();
  const callData = portfolio[POSITION.localSymbol];
  
  if (!callData) {
    log('No SPY 686C position found - trade may be closed');
    return;
  }
  
  const currentPrice = callData.mktPrice;
  const qty = callData.pos;
  const unrealizedPnL = callData.unrealizedPnL;
  const pnlPct = ((currentPrice - RULES.ENTRY_PRICE) / RULES.ENTRY_PRICE * 100).toFixed(1);
  
  log(`CHECK: SPY 686C @ $${currentPrice.toFixed(2)} | Entry: $${RULES.ENTRY_PRICE} | P&L: ${pnlPct}% ($${unrealizedPnL.toFixed(2)}) | Qty: ${qty}`);
  
  // RULE 1: TIME STOP - Exit by 2 PM
  if (hour >= RULES.TIME_STOP_HOUR) {
    log(`⏰ TIME STOP: It's past ${RULES.TIME_STOP_HOUR}:00 - closing position`);
    alertSteve(`⏰ TIME STOP: Closing SPY 686C @ $${currentPrice.toFixed(2)} - past 2 PM`);
    await executeSell(callData.contract, qty, 'Time Stop');
    return;
  }
  
  // RULE 2: TAKE PROFIT
  if (currentPrice >= RULES.TARGET_PRICE) {
    log(`🎯 TARGET HIT: $${currentPrice.toFixed(2)} >= $${RULES.TARGET_PRICE}`);
    alertSteve(`🎯 TARGET HIT! SPY 686C @ $${currentPrice.toFixed(2)} - Taking profit! P&L: +$${unrealizedPnL.toFixed(2)}`);
    await executeSell(callData.contract, qty, 'Target Hit');
    return;
  }
  
  // RULE 3: STOP LOSS
  if (currentPrice <= RULES.STOP_PRICE) {
    log(`🛑 STOP LOSS: $${currentPrice.toFixed(2)} <= $${RULES.STOP_PRICE}`);
    alertSteve(`🛑 STOP LOSS! SPY 686C @ $${currentPrice.toFixed(2)} - Cutting loss. P&L: $${unrealizedPnL.toFixed(2)}`);
    await executeSell(callData.contract, qty, 'Stop Loss');
    return;
  }
  
  // Status update
  if (currentPrice > RULES.ENTRY_PRICE * 1.20) {
    log(`📈 Looking good! +${pnlPct}% - holding for target`);
  } else if (currentPrice < RULES.ENTRY_PRICE * 0.80) {
    log(`📉 Under pressure ${pnlPct}% - watching stop`);
  } else {
    log(`➡️ Holding - price stable`);
  }
}

async function run() {
  log('=== AUTONOMOUS TRADER v7 - 0DTE MODE ===');
  log(`Position: SPY 686C 0DTE @ $${RULES.ENTRY_PRICE}`);
  log(`Target: $${RULES.TARGET_PRICE} (+${((RULES.TARGET_PRICE/RULES.ENTRY_PRICE-1)*100).toFixed(0)}%)`);
  log(`Stop: $${RULES.STOP_PRICE} (${((RULES.STOP_PRICE/RULES.ENTRY_PRICE-1)*100).toFixed(0)}%)`);
  log(`Time Stop: ${RULES.TIME_STOP_HOUR}:00`);
  log(`Check interval: ${RULES.CHECK_INTERVAL / 1000}s`);
  
  while (true) {
    try {
      if (isMarketHours()) {
        await checkAndExecute();
      } else {
        log('Outside market hours');
      }
    } catch (e) {
      log('Error: ' + e.message);
    }
    await new Promise(r => setTimeout(r, RULES.CHECK_INTERVAL));
  }
}

run();
