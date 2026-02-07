const ib = require('@stoqey/ib');

function checkPositions() {
  return new Promise((resolve) => {
    const client = new ib.IBApi({ port: 7496 });
    let data = { sofi: null, spy_put: null, net_liq: null };
    
    client.on('connected', () => {
      client.reqMarketDataType(3);
      client.reqPositions();
      client.reqAccountSummary(1, 'All', 'NetLiquidation');
      
      // Request market data for SOFI
      client.reqMktData(1, { symbol: 'SOFI', secType: 'STK', exchange: 'SMART', currency: 'USD' }, '', false, false);
      
      // Request market data for SPY put
      client.reqMktData(2, { 
        symbol: 'SPY', secType: 'OPT', exchange: 'SMART', currency: 'USD',
        lastTradeDateOrContractMonth: '20260206', strike: 685.0, right: 'P'
      }, '', false, false);
    });
    
    client.on('tickPrice', (reqId, tickType, price) => {
      if (tickType === 4 && price > 0) { // Last price
        if (reqId === 1) data.sofi = price;
        if (reqId === 2) data.spy_put = price;
      }
    });
    
    client.on('accountSummary', (reqId, account, tag, value) => {
      if (tag === 'NetLiquidation') data.net_liq = parseFloat(value);
    });
    
    setTimeout(() => {
      client.disconnect();
      resolve(data);
    }, 5000);
    
    client.connect();
  });
}

checkPositions().then(data => {
  console.log(JSON.stringify(data));
});
