const { IBApi, EventName, SecType, OrderAction, OrderType, TimeInForce } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 100 });

// Adjusted for the 1 T share we already bought
const trades = [
  { symbol: "T", shares: 6 },     // 6 more (already have 1)
  { symbol: "SOFI", shares: 9 },
  { symbol: "F", shares: 14 }
];

let nextId = null;
let filled = [];

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS");
  ib.reqIds();
});

ib.on(EventName.nextValidId, (id) => {
  nextId = id;
  console.log("Starting order ID:", nextId);
  console.log("\n📊 EXECUTING TRADES:\n");
  
  trades.forEach((trade, i) => {
    const oid = nextId + i;
    setTimeout(() => {
      console.log(`📤 Order ${oid}: BUY ${trade.shares} ${trade.symbol} @ MKT`);
      ib.placeOrder(oid, {
        symbol: trade.symbol,
        secType: SecType.STK,
        exchange: "SMART",
        currency: "USD"
      }, {
        action: OrderAction.BUY,
        totalQuantity: trade.shares,
        orderType: OrderType.MKT,
        tif: TimeInForce.DAY,
        transmit: true
      });
    }, i * 2000);
  });
});

ib.on(EventName.orderStatus, (orderId, status, filledQty, remaining, avgFillPrice) => {
  if (status === "Filled" && avgFillPrice > 0) {
    const idx = orderId - nextId;
    if (trades[idx] && !filled.find(f => f.symbol === trades[idx].symbol)) {
      filled.push({
        symbol: trades[idx].symbol,
        shares: filledQty,
        price: avgFillPrice,
        total: filledQty * avgFillPrice
      });
      console.log(`✅ FILLED: ${filledQty} ${trades[idx].symbol} @ $${avgFillPrice.toFixed(2)} = $${(filledQty * avgFillPrice).toFixed(2)}`);
    }
  }
});

ib.on(EventName.error, (err, code) => {
  if (code === 354) {
    console.log("❌ Blocked - market data issue");
  } else if (code && code !== 2104 && code !== 2106 && code !== 2158 && code !== 2119) {
    console.log(`Error ${code}:`, err.message || err);
  }
});

ib.connect();

setTimeout(() => {
  console.log("\n" + "═".repeat(50));
  console.log("📋 EXECUTION SUMMARY:\n");
  
  // Add the initial T purchase
  filled.unshift({ symbol: "T", shares: 1, price: 26.86, total: 26.86 });
  
  if (filled.length > 0) {
    filled.forEach(f => {
      console.log(`   ✅ ${f.shares} ${f.symbol} @ $${f.price.toFixed(2)} = $${f.total.toFixed(2)}`);
    });
    const total = filled.reduce((s, f) => s + f.total, 0);
    console.log(`\n   💰 TOTAL INVESTED: $${total.toFixed(2)}`);
    console.log(`   💵 CASH REMAINING: $${(1000 - total).toFixed(2)}`);
  }
  
  ib.disconnect();
  process.exit(0);
}, 15000);
