const { IBApi, EventName } = require('@stoqey/ib');

const ib = new IBApi({ port: 7496, clientId: 99 });
let gotTick = false;

ib.on(EventName.connected, () => {
  ib.reqMarketDataType(1); // Real-time
  ib.reqMktData(9999, { symbol: 'T', secType: 'STK', exchange: 'SMART', currency: 'USD' }, '', false, false);
});

ib.on(EventName.tickPrice, (reqId, tickType, price) => {
  if (tickType === 4 && price > 0) { // Type 4 = real-time last
    gotTick = true;
    console.log('REALTIME_WORKING');
    ib.disconnect();
    process.exit(0);
  }
});

ib.on(EventName.error, (err, code) => {
  if (code === 10089 || code === 10168) {
    console.log('REALTIME_NOT_READY');
    ib.disconnect();
    process.exit(1);
  }
});

ib.connect();

setTimeout(() => {
  if (!gotTick) {
    console.log('REALTIME_TIMEOUT');
    ib.disconnect();
    process.exit(1);
  }
}, 8000);
