const https = require('https');

async function getQuote(symbol) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const meta = json.chart.result[0].meta;
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          const change = ((price - prevClose) / prevClose * 100);
          resolve({ symbol, price, prevClose, change: change.toFixed(2) });
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function scan() {
  const watchlist = ['SPY', 'QQQ', 'SOFI', 'PLTR', 'F', 'BAC', 'NIO', 'RIVN', 'LCID', 'UBER', 'HOOD', 'COIN', 'AMD', 'INTC', 'T', 'WBD', 'SNAP', 'PINS', 'RBLX', 'DKNG'];
  
  console.log('📊 FULL MARKET SCAN - ' + new Date().toLocaleTimeString());
  console.log('═'.repeat(60) + '\n');
  
  const results = [];
  for (const symbol of watchlist) {
    const data = await getQuote(symbol);
    if (data) results.push(data);
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Sort by change
  results.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
  
  console.log('Symbol  Price      Change    Shares@$200  Cost');
  console.log('-'.repeat(55));
  
  results.forEach(s => {
    const shares = Math.floor(200 / s.price);
    const cost = (shares * s.price).toFixed(0);
    const changeStr = parseFloat(s.change) >= 0 ? `+${s.change}%` : `${s.change}%`;
    const indicator = parseFloat(s.change) >= 0 ? '🟢' : '🔴';
    if (s.price <= 200) {
      console.log(`${indicator} ${s.symbol.padEnd(6)} $${s.price.toFixed(2).padStart(7)}  ${changeStr.padStart(7)}   ${String(shares).padStart(3)} shares   $${cost}`);
    }
  });
  
  // Pick recommendations
  console.log('\n' + '═'.repeat(60));
  console.log('🎯 RECOMMENDATIONS:\n');
  
  const affordable = results.filter(s => s.price <= 50 && s.price >= 5);
  const momentum = affordable.filter(s => parseFloat(s.change) > 0.5);
  const dips = affordable.filter(s => parseFloat(s.change) < -1 && parseFloat(s.change) > -5);
  
  if (momentum.length > 0) {
    console.log('MOMENTUM PLAYS (riding winners):');
    momentum.slice(0, 3).forEach(s => {
      console.log(`  → ${s.symbol}: $${s.price.toFixed(2)} (+${s.change}%) - BUY ${Math.floor(200/s.price)} shares`);
    });
  }
  
  if (dips.length > 0) {
    console.log('\nDIP BUYS (oversold bounce):');
    dips.slice(0, 3).forEach(s => {
      console.log(`  → ${s.symbol}: $${s.price.toFixed(2)} (${s.change}%) - BUY ${Math.floor(200/s.price)} shares`);
    });
  }
}

scan();
