const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 51 });

ib.on(EventName.connected, () => {
  console.log('Connected to TWS');
  ib.reqIds();
});

ib.on(EventName.nextValidId, (orderId) => {
  console.log('Selling 1x SPY 686C 0DTE at market...');
  
  const contract = {
    symbol: 'SPY',
    secType: 'OPT',
    exchange: 'SMART',
    currency: 'USD',
    lastTradeDateOrContractMonth: '20260206',
    strike: 686,
    right: 'C',
    multiplier: '100'
  };
  
  const order = {
    action: 'SELL',
    totalQuantity: 1,
    orderType: 'MKT',
    transmit: true
  };
  
  ib.placeOrder(orderId, contract, order);
  console.log(`Order ${orderId} submitted`);
});

ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
  console.log(`Order ${orderId}: ${status}, filled: ${filled}/${filled+remaining} @ $${avgFillPrice}`);
  if (status === 'Filled') {
    const proceeds = avgFillPrice * 100;
    const profit = proceeds - 202; // Entry was $2.02 * 100
    console.log(`✅ SOLD 1x SPY 686C @ $${avgFillPrice}`);
    console.log(`Proceeds: $${proceeds.toFixed(2)}`);
    console.log(`P/L: $${profit.toFixed(2)} (${((profit/202)*100).toFixed(1)}%)`);
    setTimeout(() => process.exit(0), 1000);
  }
});

ib.on(EventName.error, (err, code, reqId) => {
  if (code !== 2104 && code !== 2106 && code !== 2158) {
    console.error(`Error ${code}: ${err}`);
  }
});

ib.connect();
setTimeout(() => { console.log('Timeout - check TWS'); process.exit(1); }, 20000);
