const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 14 });

ib.on(EventName.connected, () => {
  console.log('Checking open orders...');
  ib.reqOpenOrders();
  ib.reqAllOpenOrders();
});

ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
  console.log(`Open: ${order.action} ${order.totalQuantity} ${contract.symbol} - Status: ${orderState.status}`);
});

ib.on(EventName.openOrderEnd, () => {
  console.log('--- Open Orders End ---');
  setTimeout(() => { ib.disconnect(); process.exit(0); }, 1000);
});

ib.on(EventName.error, (err, code) => {
  if (code !== 2104 && code !== 2106 && code !== 2158) {
    console.log(`Error ${code}: ${err}`);
  }
});

ib.connect();
setTimeout(() => { ib.disconnect(); process.exit(0); }, 8000);
