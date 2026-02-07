const { IBApi, EventName, SecType, OrderAction, OrderType, TimeInForce } = require("@stoqey/ib");
const https = require('https');

// Get current prices from Yahoo
async function getPrice(symbol) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.chart.result[0].meta.regularMarketPrice);
        } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function execute() {
  const trades = [
    { symbol: "T", shares: 7 },
    { symbol: "SOFI", shares: 9 },
    { symbol: "F", shares: 14 }
  ];
  
  // Get current prices
  console.log("Fetching current prices...\n");
  for (const t of trades) {
    t.price = await getPrice(t.symbol);
    // Add 0.5% buffer for limit price
    t.limitPrice = Math.round((t.price * 1.005) * 100) / 100;
    console.log(`${t.symbol}: $${t.price.toFixed(2)} → Limit: $${t.limitPrice.toFixed(2)}`);
  }
  
  const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 25 });
  
  let nextOrderId = null;
  let filled = [];
  
  ib.on(EventName.connected, () => {
    console.log("\n✅ Connected - requesting order ID...");
    ib.reqIds();
  });
  
  ib.on(EventName.nextValidId, (id) => {
    nextOrderId = id;
    console.log("Order ID:", nextOrderId);
    console.log("\n📊 PLACING LIMIT ORDERS:\n");
    
    trades.forEach((trade, i) => {
      const oid = nextOrderId + i;
      
      setTimeout(() => {
        const contract = {
          symbol: trade.symbol,
          secType: SecType.STK,
          exchange: "SMART",
          currency: "USD"
        };
        
        const order = {
          action: OrderAction.BUY,
          totalQuantity: trade.shares,
          orderType: OrderType.LMT,
          lmtPrice: trade.limitPrice,
          tif: TimeInForce.DAY,
          transmit: true
        };
        
        console.log(`📤 Order ${oid}: BUY ${trade.shares} ${trade.symbol} @ LIMIT $${trade.limitPrice}`);
        ib.placeOrder(oid, contract, order);
      }, i * 1500);
    });
  });
  
  ib.on(EventName.orderStatus, (orderId, status, filledQty, remaining, avgFillPrice) => {
    console.log(`   Status: ${status} | Filled: ${filledQty} @ $${avgFillPrice.toFixed(2)}`);
    
    if (status === "Filled" && avgFillPrice > 0) {
      const idx = orderId - nextOrderId;
      if (trades[idx] && !filled.find(f => f.symbol === trades[idx].symbol)) {
        filled.push({
          symbol: trades[idx].symbol,
          shares: filledQty,
          price: avgFillPrice,
          total: filledQty * avgFillPrice
        });
        console.log(`   ✅ FILLED: ${filledQty} ${trades[idx].symbol} @ $${avgFillPrice.toFixed(2)}`);
      }
    }
  });
  
  ib.on(EventName.error, (err, code) => {
    if (code && code !== 2104 && code !== 2106 && code !== 2158 && code !== 2119 && code !== 10147) {
      console.log(`   ⚠️ ${code}: ${err.message || err}`);
    }
  });
  
  ib.connect();
  
  setTimeout(() => {
    console.log("\n" + "═".repeat(50));
    if (filled.length > 0) {
      console.log("✅ FILLS:");
      filled.forEach(f => console.log(`   ${f.shares} ${f.symbol} @ $${f.price.toFixed(2)} = $${f.total.toFixed(2)}`));
      console.log(`\n   💰 Total: $${filled.reduce((s,f) => s + f.total, 0).toFixed(2)}`);
    } else {
      console.log("Orders placed - check TWS for status");
      console.log("(Limit orders may take a moment to fill)");
    }
    ib.disconnect();
    process.exit(0);
  }, 12000);
}

execute();
