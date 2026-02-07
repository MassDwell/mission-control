#!/usr/bin/env node
/**
 * Stock Price Fetcher
 * Uses Finnhub free tier API for real-time stock prices
 * 
 * Usage: node scripts/get-stock-prices.js [SYMBOL1] [SYMBOL2] ...
 * Default: T, SOFI, F, NU (our portfolio)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load API key from credentials
const credPath = path.join(__dirname, '../credentials/trading/finnhub.json');
let API_KEY;

try {
  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  API_KEY = creds.apiKey;
} catch (e) {
  console.error('Error: Finnhub credentials not found at', credPath);
  console.error('Get a free API key at https://finnhub.io and save as:');
  console.error('{ "apiKey": "YOUR_KEY" }');
  process.exit(1);
}

// Default portfolio symbols
const DEFAULT_SYMBOLS = ['T', 'SOFI', 'F', 'NU'];
const symbols = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_SYMBOLS;

// Portfolio data for P&L calculation
const PORTFOLIO = {
  T: { shares: 7, avgPrice: 26.87 },
  SOFI: { shares: 9, avgPrice: 21.21 },
  F: { shares: 14, avgPrice: 13.70 },
  NU: { shares: 11, avgPrice: 18.02 }
};

function fetchQuote(symbol) {
  return new Promise((resolve, reject) => {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error));
          } else {
            resolve({ symbol, ...json });
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('📊 Stock Price Report');
  console.log('='.repeat(60));
  console.log(`Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET\n`);
  
  let totalValue = 0;
  let totalCost = 0;
  
  const results = [];
  
  for (const symbol of symbols) {
    try {
      const quote = await fetchQuote(symbol);
      // c = current, pc = previous close, h = high, l = low, o = open
      const current = quote.c;
      const prevClose = quote.pc;
      const dayChange = current - prevClose;
      const dayChangePct = ((dayChange / prevClose) * 100).toFixed(2);
      
      const position = PORTFOLIO[symbol];
      let positionInfo = '';
      
      if (position) {
        const cost = position.shares * position.avgPrice;
        const value = position.shares * current;
        const pnl = value - cost;
        const pnlPct = ((pnl / cost) * 100).toFixed(2);
        
        totalCost += cost;
        totalValue += value;
        
        positionInfo = ` | ${position.shares} shares @ $${position.avgPrice.toFixed(2)} → $${value.toFixed(2)} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} / ${pnlPct}%)`;
      }
      
      const arrow = dayChange >= 0 ? '▲' : '▼';
      console.log(`${symbol}: $${current.toFixed(2)} ${arrow} ${dayChange >= 0 ? '+' : ''}${dayChangePct}%${positionInfo}`);
      
      results.push({
        symbol,
        price: current,
        prevClose,
        dayChange,
        dayChangePct: parseFloat(dayChangePct),
        position: position ? {
          shares: position.shares,
          avgPrice: position.avgPrice,
          value: position.shares * current,
          pnl: (position.shares * current) - (position.shares * position.avgPrice)
        } : null
      });
      
    } catch (e) {
      console.error(`${symbol}: Error - ${e.message}`);
    }
  }
  
  if (totalCost > 0) {
    const totalPnL = totalValue - totalCost;
    const totalPnLPct = ((totalPnL / totalCost) * 100).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log(`PORTFOLIO: $${totalValue.toFixed(2)} (Cost: $${totalCost.toFixed(2)})`);
    console.log(`P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)} (${totalPnLPct}%)`);
    console.log(`Cash: $231.08`);
    console.log(`Total Account Value: $${(totalValue + 231.08).toFixed(2)}`);
    console.log(`Target: $1,050 by Friday (${((1050 - totalValue - 231.08) / (totalValue + 231.08) * 100).toFixed(1)}% to go)`);
  }
  
  // Save results to JSON
  const output = {
    timestamp: new Date().toISOString(),
    quotes: results,
    portfolio: {
      invested: totalCost,
      value: totalValue,
      pnl: totalValue - totalCost,
      cash: 231.08,
      totalAccountValue: totalValue + 231.08
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../data/trading/latest-prices.json'),
    JSON.stringify(output, null, 2)
  );
}

main().catch(console.error);
