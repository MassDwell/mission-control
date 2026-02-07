const { IBApi, EventName, SecType, OrderAction, OrderType, TimeInForce } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 101 });

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS");
  ib.reqIds();
});

ib.on(EventName.nextValidId, (orderId) => {
  console.log("Order ID:", orderId);
  console.log("\n📤 BUY 11 NU @ MKT\n");
  
  ib.placeOrder(orderId, {
    symbol: "NU",
    secType: SecType.STK,
    exchange: "SMART",
    currency: "USD"
  }, {
    action: OrderAction.BUY,
    totalQuantity: 11,
    orderType: OrderType.MKT,
    tif: TimeInForce.DAY,
    transmit: true
  });
});

ib.on(EventName.orderStatus, (orderId, status, filledQty, remaining, avgFillPrice) => {
  console.log(`Order ${orderId}: ${status} - Filled: ${filledQty} @ $${avgFillPrice}`);
  if (status === "Filled" && avgFillPrice > 0) {
    console.log(`\n✅ FILLED: 11 NU @ $${avgFillPrice.toFixed(2)} = $${(11 * avgFillPrice).toFixed(2)}`);
    setTimeout(() => {
      ib.disconnect();
      process.exit(0);
    }, 1000);
  }
});

ib.on(EventName.error, (err, code) => {
  if (code && code !== 2104 && code !== 2106 && code !== 2158 && code !== 2119) {
    console.log(`Error ${code}:`, err.message || err);
  }
});

ib.connect();

setTimeout(() => {
  console.log("\nTimeout - check TWS for order status");
  ib.disconnect();
  process.exit(0);
}, 15000);
