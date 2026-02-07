const { IBApi, EventName, SecType, BarSizeSetting, WhatToShow } = require("@stoqey/ib");

const ib = new IBApi({ host: "127.0.0.1", port: 7496, clientId: 2 });

// Quality stocks to scan - liquid, tradeable with small account
const watchlist = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "META", name: "Meta" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "QQQ", name: "Nasdaq ETF" },
  { symbol: "SOFI", name: "SoFi" },
  { symbol: "PLTR", name: "Palantir" },
  { symbol: "COIN", name: "Coinbase" },
  { symbol: "SQ", name: "Block" },
  { symbol: "UBER", name: "Uber" }
];

let prices = {};
let reqId = 1;

ib.on(EventName.connected, () => {
  console.log("Scanning market...\n");
  
  watchlist.forEach((stock, i) => {
    setTimeout(() => {
      ib.reqMktData(reqId + i, {
        symbol: stock.symbol,
        secType: SecType.STK,
        exchange: "SMART",
        currency: "USD"
      }, "", false, false);
    }, i * 200);
  });
});

ib.on(EventName.tickPrice, (tickerId, field, price) => {
  // field 4 = last price, field 1 = bid, field 2 = ask
  if (field === 4 && price > 0) {
    const stock = watchlist[tickerId - 1];
    if (stock && !prices[stock.symbol]) {
      prices[stock.symbol] = { ...stock, price: price };
      
      // Check if we can afford it with position sizing
      const maxPosition = 200; // $200 max per position
      const canAfford = price <= maxPosition;
      const shares = canAfford ? Math.floor(maxPosition / price) : 0;
      
      console.log(`${stock.symbol.padEnd(6)} $${price.toFixed(2).padStart(8)} | ${canAfford ? shares + ' shares @ $' + (shares * price).toFixed(0) : 'Too expensive'}`);
    }
  }
});

ib.on(EventName.error, (err, code) => {
  if (code !== 2104 && code !== 2106 && code !== 2158) {
    // Ignore market data farm messages
    if (!err.message?.includes('market data')) {
      console.log(`Error: ${err.message || err}`);
    }
  }
});

ib.connect();

setTimeout(() => {
  console.log("\n--- SCAN COMPLETE ---");
  ib.disconnect();
  process.exit(0);
}, 8000);
