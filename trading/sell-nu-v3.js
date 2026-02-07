const { IBApi, EventName, SecType, OrderAction, OrderType, TimeInForce } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 200 });

let nextId = null;

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS");
  ib.reqIds();
});

ib.on(EventName.nextValidId, (id) => {
  nextId = id;
  console.log("Order ID:", nextId);
  console.log("\n🔴 EXECUTING STOP LOSS - SELL NU\n");
  
  ib.placeOrder(nextId, {
    symbol: "NU",
    secType: SecType.STK,
    exchange: "SMART",
    currency: "USD"
  }, {
    action: OrderAction.SELL,
    totalQuantity: 11,
    orderType: OrderType.MKT,
    tif: TimeInForce.DAY,
    transmit: true
  });
  
  console.log("📤 SELL order placed for 11 NU @ MKT");
});

ib.on(EventName.orderStatus, (orderId, status, filledQty, remaining, avgFillPrice) => {
  console.log(`Order ${orderId}: ${status}, filled: ${filledQty}, price: $${avgFillPrice}`);
  if (status === "Filled" && avgFillPrice > 0) {
    const total = filledQty * avgFillPrice;
    console.log(`\n✅ EXECUTED: SOLD ${filledQty} NU @ $${avgFillPrice.toFixed(2)} = $${total.toFixed(2)}`);
    console.log(`   Loss: $${(11 * 18.02 - total).toFixed(2)}`);
  }
});

ib.on(EventName.execDetails, (reqId, contract, exec) => {
  console.log(`EXECUTION: ${exec.side} ${exec.shares} ${contract.symbol} @ $${exec.price}`);
});

ib.on(EventName.error, (err, code) => {
  if (code && code !== 2104 && code !== 2106 && code !== 2158 && code !== 2119 && code !== 201) {
    console.log(`Error ${code}:`, err.message || err);
  }
});

ib.connect();

setTimeout(() => {
  console.log("\nTimeout - disconnecting");
  ib.disconnect();
  process.exit(0);
}, 12000);
