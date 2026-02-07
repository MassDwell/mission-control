const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 88 });
let orderPlaced = false;

ib.on(EventName.connected, () => {
  console.log('Connected');
  ib.reqIds();
});

ib.on(EventName.nextValidId, (orderId) => {
  if (orderPlaced) return;
  orderPlaced = true;
  const useId = orderId + 100; // Offset to avoid duplicates
  console.log(`Using order ID: ${useId}`);
  console.log('Placing LIMIT SELL: 11 NU @ $16.80');
  
  const contract = { symbol: 'NU', secType: 'STK', exchange: 'SMART', currency: 'USD' };
  const order = { 
    action: 'SELL', 
    totalQuantity: 11, 
    orderType: 'LMT', 
    lmtPrice: 16.80,
    transmit: true
  };
  ib.placeOrder(useId, contract, order);
});

ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
  console.log(`[${status}] filled: ${filled} @ $${avgFillPrice}`);
  if (status === 'Filled') {
    console.log(`✅ SOLD @ $${avgFillPrice}`);
    process.exit(0);
  }
});

ib.on(EventName.error, (err, code) => {
  if ([2104, 2106, 2158, 10349].includes(code)) return;
  console.error(`Error ${code}: ${err}`);
});

ib.connect();
setTimeout(() => { console.log('Check TWS for order status'); process.exit(0); }, 10000);
