const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 77 });

ib.on(EventName.connected, () => {
  console.log('Connected');
  ib.reqIds();
});

ib.on(EventName.nextValidId, (orderId) => {
  console.log(`Got order ID: ${orderId}`);
  console.log('Placing LIMIT SELL for 11 NU @ $16.85...');
  const contract = { symbol: 'NU', secType: 'STK', exchange: 'SMART', currency: 'USD' };
  const order = { 
    action: 'SELL', 
    totalQuantity: 11, 
    orderType: 'LMT', 
    lmtPrice: 16.85,
    transmit: true
  };
  ib.placeOrder(orderId, contract, order);
});

ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
  console.log(`Status: ${status}, filled: ${filled} @ $${avgFillPrice}`);
  if (status === 'Filled') {
    console.log(`✅ SOLD 11 NU @ $${avgFillPrice}`);
    ib.disconnect();
    process.exit(0);
  }
});

ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
  console.log(`Open order: ${order.action} ${order.totalQuantity} ${contract.symbol} @ $${order.lmtPrice} - ${orderState.status}`);
});

ib.on(EventName.error, (err, code) => {
  if (code !== 2104 && code !== 2106 && code !== 2158 && code !== 10349) {
    console.error(`Error ${code}: ${err}`);
  }
});

ib.connect();
setTimeout(() => { 
  console.log('Timeout - order may be working in TWS');
  ib.disconnect();
  process.exit(0); 
}, 15000);
