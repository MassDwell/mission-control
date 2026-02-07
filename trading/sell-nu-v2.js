const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 13 });

ib.on(EventName.nextValidId, (id) => {
  console.log(`Order ID: ${id}`);
  
  ib.placeOrder(id, {
    symbol: 'NU',
    secType: 'STK', 
    exchange: 'SMART',
    currency: 'USD'
  }, {
    action: 'SELL',
    totalQuantity: 11,
    orderType: 'MKT',
    tif: 'GTC'
  });
  console.log('SELL order placed');
});

ib.on(EventName.execDetails, (reqId, contract, exec) => {
  console.log(`EXEC: ${exec.side} ${exec.shares} ${contract.symbol} @ $${exec.price}`);
});

ib.on(EventName.orderStatus, (oid, status, filled, remaining, avgFillPrice) => {
  console.log(`STATUS: ${status} - filled ${filled}, remaining ${remaining}, price $${avgFillPrice}`);
  if (status === 'Filled') {
    console.log(`✅ SOLD 11 NU @ $${avgFillPrice}`);
    ib.disconnect();
    process.exit(0);
  }
});

ib.on(EventName.error, (err, code, reqId) => {
  console.log(`ERR ${code}: ${err}`);
});

ib.on(EventName.connected, () => {
  console.log('Connected');
  ib.reqIds();
});

ib.connect();
setTimeout(() => { console.log('Timeout - checking...'); ib.disconnect(); process.exit(0); }, 15000);
