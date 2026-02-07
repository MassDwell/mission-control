const { IBApi, EventName } = require('@stoqey/ib');
const ib = new IBApi({ port: 7496, clientId: 12 });

ib.on(EventName.connected, () => {
  console.log('Requesting positions...');
  ib.reqPositions();
});

ib.on(EventName.position, (account, contract, pos, avgCost) => {
  if (pos !== 0) {
    console.log(`${contract.symbol}: ${pos} shares @ $${(avgCost).toFixed(2)}`);
  }
});

ib.on(EventName.positionEnd, () => {
  console.log('--- Position End ---');
  setTimeout(() => { ib.disconnect(); process.exit(0); }, 1000);
});

ib.on(EventName.error, (err, code) => {
  if (code !== 2104 && code !== 2106 && code !== 2158) {
    console.error(`Error ${code}: ${err}`);
  }
});

ib.connect();
setTimeout(() => { ib.disconnect(); process.exit(0); }, 10000);
