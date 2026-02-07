const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 55 });

ib.on(EventName.connected, () => {
  console.log('Connected to TWS');
  ib.reqIds();
});

ib.on(EventName.nextValidId, (orderId) => {
  console.log('Placing LIMIT SELL for 11 NU @ $16.90...');
  const contract = { symbol: 'NU', secType: 'STK', exchange: 'SMART', currency: 'USD' };
  const order = { 
    action: 'SELL', 
    totalQuantity: 11, 
    orderType: 'LMT', 
    lmtPrice: 16.90,
    transmit: true,
    tif: 'DAY'
  };
  ib.placeOrder(orderId, contract, order);
});

ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
  console.log(`Order ${orderId}: ${status}, filled: ${filled}/${filled+remaining} @ $${avgFillPrice}`);
  if (status === 'Filled') {
    console.log(`✅ SOLD 11 NU @ $${avgFillPrice}`);
    setTimeout(() => process.exit(0), 1000);
  }
  if (status === 'Submitted' || status === 'PreSubmitted') {
    console.log('Order submitted - waiting for fill...');
  }
});

ib.on(EventName.error, (err, code) => {
  if (code !== 2104 && code !== 2106 && code !== 2158 && code !== 10349) {
    console.error(`Error ${code}: ${err}`);
  }
});

ib.connect();
setTimeout(() => { 
  console.log('Order may be working - check TWS');
  ib.disconnect();
  process.exit(0); 
}, 12000);
