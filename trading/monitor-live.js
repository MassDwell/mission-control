const ib = require('@stoqey/ib');

const ALERT_THRESHOLD = 0.05; // 5% move triggers alert
let lastNetLiq = null;

function check() {
  return new Promise((resolve) => {
    const client = new ib.IBApi({ port: 7496 });
    
    client.on('connected', () => {
      client.reqAccountSummary(1, 'All', 'NetLiquidation');
    });
    
    client.on('accountSummary', (reqId, account, tag, value) => {
      const netliq = parseFloat(value);
      
      if (lastNetLiq !== null) {
        const change = (netliq - lastNetLiq) / lastNetLiq;
        if (Math.abs(change) >= ALERT_THRESHOLD) {
          console.log('🚨 ALERT: Net Liq ' + (change > 0 ? '+' : '') + (change * 100).toFixed(1) + '% | $' + netliq.toFixed(2));
        } else {
          console.log(new Date().toLocaleTimeString() + ' | $' + netliq.toFixed(2) + ' | ' + (change >= 0 ? '+' : '') + (change * 100).toFixed(2) + '%');
        }
      } else {
        console.log('Starting monitor | $' + netliq.toFixed(2));
      }
      lastNetLiq = netliq;
    });
    
    client.on('accountSummaryEnd', () => {
      client.disconnect();
      resolve();
    });
    
    client.on('error', () => {});
    client.connect();
    setTimeout(() => { try { client.disconnect(); } catch(e) {} resolve(); }, 3000);
  });
}

async function run() {
  console.log('=== LIVE MONITOR (3 min intervals) ===');
  while (true) {
    await check();
    await new Promise(r => setTimeout(r, 180000)); // 3 min
  }
}

run();
