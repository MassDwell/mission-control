const { IBApi, EventName, SecType, OrderAction, OrderType, TimeInForce } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 99 });

let nextId = null;

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS");
  ib.reqIds();
});

ib.on(EventName.nextValidId, (id) => {
  nextId = id;
  console.log("Order ID:", nextId);
  console.log("\n🚀 Placing test order: BUY 1 T @ MARKET\n");
  
  ib.placeOrder(nextId, {
    symbol: "T",
    secType: SecType.STK,
    exchange: "SMART",
    currency: "USD"
  }, {
    action: OrderAction.BUY,
    totalQuantity: 1,
    orderType: OrderType.MKT,
    tif: TimeInForce.DAY,
    transmit: true
  });
});

ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
  console.log(`Order ${orderId}: ${status}`);
  if (filled > 0) {
    console.log(`✅ FILLED: ${filled} shares @ $${avgFillPrice.toFixed(2)}`);
  }
});

ib.on(EventName.openOrder, (orderId, contract, order, state) => {
  console.log(`Open order: ${contract.symbol} - ${state.status}`);
});

ib.on(EventName.error, (err, code) => {
  if (code === 354) {
    console.log("❌ BLOCKED: Need market data or disable precaution");
    console.log("\n👉 In TWS: Edit → Global Configuration → API → Precautions");
    console.log("   Uncheck 'Bypass Order Precautions for API Orders'");
  } else if (code === 201) {
    console.log("❌ Order rejected:", err.message);
  } else if (code && code !== 2104 && code !== 2106 && code !== 2158) {
    console.log(`Error ${code}:`, err.message || err);
  }
});

ib.connect();

setTimeout(() => {
  ib.disconnect();
  process.exit(0);
}, 10000);
