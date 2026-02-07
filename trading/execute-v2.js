const { IBApi, EventName, SecType, OrderAction, OrderType, TimeInForce } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 10 });

const trades = [
  { symbol: "T", shares: 7 },
  { symbol: "SOFI", shares: 9 },
  { symbol: "F", shares: 14 }
];

let nextOrderId = null;
let filled = [];

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS\n");
  ib.reqIds();
});

ib.on(EventName.nextValidId, (id) => {
  nextOrderId = id;
  console.log("Starting order ID:", nextOrderId);
  console.log("\n📊 EXECUTING TRADES:\n");
  
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
        orderType: OrderType.MKT,
        tif: TimeInForce.DAY,
        transmit: true
      };
      
      console.log(`📤 Order ${oid}: BUY ${trade.shares} ${trade.symbol} @ MKT`);
      ib.placeOrder(oid, contract, order);
    }, i * 2000);
  });
});

ib.on(EventName.orderStatus, (orderId, status, filledQty, remaining, avgFillPrice) => {
  console.log(`   Order ${orderId}: ${status} | Filled: ${filledQty} @ $${avgFillPrice.toFixed(2)}`);
  
  if (status === "Filled" && filledQty > 0) {
    const idx = orderId - nextOrderId;
    if (trades[idx]) {
      filled.push({
        symbol: trades[idx].symbol,
        shares: filledQty,
        price: avgFillPrice,
        total: filledQty * avgFillPrice
      });
    }
  }
});

ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
  console.log(`   Open order: ${order.action} ${order.totalQuantity} ${contract.symbol} - ${orderState.status}`);
});

ib.on(EventName.error, (err, code, reqId) => {
  if (code && code !== 2104 && code !== 2106 && code !== 2158 && code !== 2119) {
    console.log(`❌ Error ${code}: ${err.message || err}`);
  }
});

ib.connect();

setTimeout(() => {
  console.log("\n" + "═".repeat(50));
  console.log("📋 EXECUTION SUMMARY:");
  if (filled.length > 0) {
    filled.forEach(f => {
      console.log(`   ✅ ${f.shares} ${f.symbol} @ $${f.price.toFixed(2)} = $${f.total.toFixed(2)}`);
    });
    const total = filled.reduce((s, f) => s + f.total, 0);
    console.log(`\n   💰 Total invested: $${total.toFixed(2)}`);
  } else {
    console.log("   No fills recorded yet - check TWS for order status");
  }
  ib.disconnect();
  process.exit(0);
}, 12000);
