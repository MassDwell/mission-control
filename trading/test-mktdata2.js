const { IBApi, EventName, SecType } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 30 });

console.log("Testing market data...\n");

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS");
  
  ["T", "F", "SOFI"].forEach((symbol, i) => {
    setTimeout(() => {
      console.log(`Requesting data for ${symbol}...`);
      ib.reqMktData(i + 1, {
        symbol: symbol,
        secType: SecType.STK,
        exchange: "SMART",
        currency: "USD"
      }, "", false, false);
    }, i * 500);
  });
});

let prices = {};
ib.on(EventName.tickPrice, (reqId, field, price) => {
  const symbols = ["T", "F", "SOFI"];
  if (field === 4 && price > 0) {
    const sym = symbols[reqId - 1];
    if (!prices[sym]) {
      prices[sym] = price;
      console.log(`✅ ${sym}: $${price.toFixed(2)}`);
    }
  }
});

ib.on(EventName.error, (err, code) => {
  if (code === 354 || code === 10089 || code === 10168) {
    console.log("❌ Market data NOT available yet");
  }
});

ib.connect();

setTimeout(() => {
  const count = Object.keys(prices).length;
  if (count > 0) {
    console.log(`\n✅ Market data WORKING! Got ${count} prices`);
  } else {
    console.log("\n⚠️ No market data yet - may need more time to activate");
  }
  ib.disconnect();
  process.exit(0);
}, 6000);
