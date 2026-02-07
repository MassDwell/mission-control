const https = require('https');

// Use Yahoo Finance API (free, no key needed)
async function getPrice(symbol) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const quote = json.chart.result[0].meta;
          const price = quote.regularMarketPrice;
          const prevClose = quote.previousClose;
          const change = ((price - prevClose) / prevClose * 100).toFixed(2);
          resolve({ symbol, price, prevClose, change });
        } catch (e) {
          resolve({ symbol, error: true });
        }
      });
    }).on('error', () => resolve({ symbol, error: true }));
  });
}

async function scan() {
  const watchlist = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'AMD', 'META', 'GOOGL', 'AMZN', 'TSLA', 
                     'SOFI', 'PLTR', 'COIN', 'UBER', 'SQ', 'F', 'BAC', 'NIO', 'RIVN', 'LCID'];
  
  console.log('📊 MARKET SCAN - ' + new Date().toLocaleTimeString());
  console.log('═'.repeat(50));
  
  const results = [];
  for (const symbol of watchlist) {
    const data = await getPrice(symbol);
    if (!data.error) {
      results.push(data);
    }
  }
  
  // Sort by daily change
  results.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
  
  console.log('\n🟢 TOP GAINERS:');
  results.slice(0, 5).forEach(s => {
    const affordable = s.price <= 200 ? `✅ ${Math.floor(200/s.price)} shares` : '❌ too expensive';
    console.log(`  ${s.symbol.padEnd(6)} $${s.price.toFixed(2).padStart(8)} | +${s.change}% | ${affordable}`);
  });
  
  console.log('\n🔴 TOP LOSERS (potential buys):');
  results.slice(-5).reverse().forEach(s => {
    const affordable = s.price <= 200 ? `✅ ${Math.floor(200/s.price)} shares` : '❌ too expensive';
    console.log(`  ${s.symbol.padEnd(6)} $${s.price.toFixed(2).padStart(8)} | ${s.change}% | ${affordable}`);
  });
  
  console.log('\n💰 AFFORDABLE PICKS ($10-50 range):');
  results.filter(s => s.price >= 10 && s.price <= 50).forEach(s => {
    console.log(`  ${s.symbol.padEnd(6)} $${s.price.toFixed(2).padStart(8)} | ${s.change}% | ${Math.floor(200/s.price)} shares for ~$${(Math.floor(200/s.price) * s.price).toFixed(0)}`);
  });
  
  return results;
}

scan();
