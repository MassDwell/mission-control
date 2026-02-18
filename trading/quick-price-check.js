const ib = require('@stoqey/ib');

const client = new ib.IBApi({ port: 7496 });

const tickers = ['SOFI', 'CIFR', 'MAT'];
let priceData = {};

client.on('connected', () => {
  console.log('🔗 Connected to IBKR');
  tickers.forEach((ticker, idx) => {
    const contract = {
      symbol: ticker,
      secType: 'STK',
      exchange: 'SMART',
      currency: 'USD'
    };
    client.reqMktData(idx + 1, contract, '', false, false);
  });
});

client.on('tickPrice', (tickerId, field, price) => {
  const ticker = tickers[tickerId - 1];
  if (field === 2) { // Last price
    priceData[ticker] = price;
    console.log(`${ticker}: $${price.toFixed(2)}`);
  }
});

client.on('error', (err) => {
  console.log('Error:', err);
});

setTimeout(() => {
  client.disconnect();
  process.exit(0);
}, 2000);

client.connect();
