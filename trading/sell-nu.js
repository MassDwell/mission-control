const { IBApi, EventName, OrderAction, OrderType, SecType } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 50 });

ib.on(EventName.connected, () => {
  console.log('Connected to TWS');
  ib.reqIds();
});

ib.on(EventName.nextValidId, (orderId) => {
  console.log('Selling 11 shares of NU at market...');
  const contract = { symbol: 'NU', secType: 'STK', exchange: 'SMART', currency: 'USD' };
  const order = { action: 'SELL', totalQuantity: 11, orderType: 'MKT', transmit: true };
  ib.placeOrder(orderId, contract, order);
});

ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
  console.log(`Order ${orderId}: ${status}, filled: ${filled}/${filled+remaining} @ $${avgFillPrice}`);
  if (status === 'Filled') {
    console.log(`SOLD 11 NU @ $${avgFillPrice}`);
    setTimeout(() => process.exit(0), 1000);
  }
});

ib.on(EventName.error, (err, code) => {
  if (code !== 2104 && code !== 2106 && code !== 2158) console.error(`Error ${code}: ${err}`);
});

ib.connect();
setTimeout(() => { console.log('Timeout'); process.exit(1); }, 15000);
