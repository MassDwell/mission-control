const { IBApi, EventName, SecType, OrderAction, OrderType, TimeInForce } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 4 });

const trades = [
  { symbol: "T", shares: 7, action: "BUY" },
  { symbol: "SOFI", shares: 9, action: "BUY" },
  { symbol: "F", shares: 14, action: "BUY" }
];

let orderId = 1;
let executed = [];

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS\n");
  console.log("Executing trades...\n");
  ib.reqIds();
});

ib.on(EventName.nextValidId, (id) => {
  orderId = id;
  
  trades.forEach((trade, i) => {
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
        orderType: OrderType.MKT, // Market order for immediate execution
        tif: TimeInForce.DAY,
        transmit: true
      };
      
      console.log(`📤 Placing order: BUY ${trade.shares} ${trade.symbol} @ MARKET`);
      ib.placeOrder(orderId + i, contract, order);
    }, i * 1000);
  });
});

ib.on(EventName.orderStatus, (id, status, filled, remaining, avgFillPrice) => {
  if (status === "Filled") {
    const trade = trades[id - orderId];
    if (trade) {
      console.log(`✅ FILLED: ${trade.shares} ${trade.symbol} @ $${avgFillPrice.toFixed(2)} = $${(trade.shares * avgFillPrice).toFixed(2)}`);
      executed.push({ ...trade, price: avgFillPrice, total: trade.shares * avgFillPrice });
    }
  } else if (status === "Submitted") {
    console.log(`📋 Order ${id} submitted...`);
  }
});

ib.on(EventName.error, (err, code, reqId) => {
  if (code === 201) {
    console.log(`❌ Order rejected: ${err.message || err}`);
  } else if (code !== 2104 && code !== 2106 && code !== 2158) {
    console.log(`Error ${code}: ${err.message || err}`);
  }
});

ib.connect();

setTimeout(() => {
  console.log("\n--- EXECUTION COMPLETE ---");
  if (executed.length > 0) {
    const total = executed.reduce((sum, t) => sum + t.total, 0);
    console.log(`Total invested: $${total.toFixed(2)}`);
  }
  ib.disconnect();
  process.exit(0);
}, 15000);
