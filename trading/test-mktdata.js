const { IBApi, EventName, SecType } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 20 });

ib.on(EventName.connected, () => {
  console.log("Testing market data subscription...\n");
  
  ib.reqMktData(1, {
    symbol: "T",
    secType: SecType.STK,
    exchange: "SMART",
    currency: "USD"
  }, "", false, false);
});

let gotPrice = false;

ib.on(EventName.tickPrice, (reqId, field, price) => {
  if (price > 0 && !gotPrice) {
    const fieldName = field === 1 ? "Bid" : field === 2 ? "Ask" : field === 4 ? "Last" : `Field ${field}`;
    console.log(`✅ ${fieldName}: $${price.toFixed(2)}`);
    if (field === 4) gotPrice = true;
  }
});

ib.on(EventName.error, (err, code) => {
  if (code === 354 || code === 10089 || code === 10168) {
    console.log("❌ Market data NOT available:", err.message || err);
  } else if (code !== 2104 && code !== 2106 && code !== 2158) {
    console.log(`Note: ${code} - ${err.message || err}`);
  }
});

ib.connect();

setTimeout(() => {
  if (gotPrice) {
    console.log("\n✅ Market data is WORKING!");
  } else {
    console.log("\n⚠️ No price received - subscription may still be activating");
  }
  ib.disconnect();
  process.exit(0);
}, 5000);
