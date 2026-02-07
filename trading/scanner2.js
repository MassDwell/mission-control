const { IBApi, EventName, SecType } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 3 });

// Try with explicit exchange
const watchlist = ["SPY", "QQQ", "AAPL", "AMD", "SOFI", "PLTR", "F", "T", "BAC", "NIO"];

ib.on(EventName.connected, () => {
  console.log("Connected - requesting market data...\n");
  
  watchlist.forEach((symbol, i) => {
    setTimeout(() => {
      console.log("Requesting:", symbol);
      ib.reqMktData(i + 1, {
        symbol: symbol,
        secType: SecType.STK,
        exchange: "SMART",
        primaryExch: "NASDAQ",
        currency: "USD"
      }, "", false, false);
    }, i * 500);
  });
});

ib.on(EventName.tickPrice, (tickerId, field, price) => {
  const symbol = watchlist[tickerId - 1];
  if (field === 4 && price > 0) { // Last price
    console.log(`✅ ${symbol}: $${price.toFixed(2)}`);
  }
});

ib.on(EventName.error, (err, code, reqId) => {
  if (code === 354) {
    console.log("⚠️ No market data subscription - need to subscribe in IBKR");
  } else if (code !== 2104 && code !== 2106 && code !== 2158 && code !== 10167) {
    console.log(`Error ${code}: ${err.message || err}`);
  }
});

ib.connect();

setTimeout(() => {
  ib.disconnect();
  process.exit(0);
}, 12000);
