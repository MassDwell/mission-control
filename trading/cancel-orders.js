const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 89 });

ib.on(EventName.connected, () => {
  console.log('Connected - cancelling all open orders');
  ib.reqGlobalCancel();
  setTimeout(() => {
    console.log('Cancel request sent');
    ib.disconnect();
    process.exit(0);
  }, 2000);
});

ib.on(EventName.error, (err, code) => {
  if (![2104, 2106, 2158].includes(code)) console.log(`Error ${code}: ${err}`);
});

ib.connect();
