#!/usr/bin/env node

/**
 * EMERGENCY POSITION FIX - Money Printer
 * Liquidate losing oil positions, keep winning airline shorts + gold
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '../credentials/alpaca/paper-trading.json')));

const API_KEY = creds.api_key;
const ACCOUNT_ID = creds.account_id;
const BASE_URL = 'https://paper-api.alpaca.markets';

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'APCA-API-KEY-ID': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('🚨 EMERGENCY MONEY PRINTER FIX');
  console.log('');

  // Get current positions
  const positions = await makeRequest('/v2/positions');
  
  if (!positions || !positions.length) {
    console.log('No positions found');
    return;
  }

  console.log('📊 CURRENT POSITIONS:');
  console.log('');

  const toSell = [];
  const toKeep = [];

  positions.forEach(pos => {
    const symbol = pos.symbol;
    const qty = Math.abs(pos.qty);
    const side = pos.side;
    const unrealizedPL = parseFloat(pos.unrealized_pl || 0);
    const unrealizedPct = parseFloat(pos.unrealized_plpc || 0) * 100;

    console.log(`${symbol} (${side}): ${qty} shares | P&L: $${unrealizedPL.toFixed(2)} (${unrealizedPct.toFixed(2)}%)`);

    // SELL: Oil longs (losing badly)
    if ((symbol === 'USO' || symbol === 'XLE') && side === 'long' && unrealizedPL < 0) {
      console.log(`  ⚠️ LIQUIDATE - Oil long failing`);
      toSell.push({ symbol, qty, reason: 'Oil thesis failing - Brent up but equities down' });
    }
    // KEEP: Airline shorts (working)
    else if ((symbol === 'AAL' || symbol === 'UAL' || symbol === 'DAL' || symbol === 'LUV') && unrealizedPL > 0) {
      console.log(`  ✅ KEEP - Short working`);
      toKeep.push(symbol);
    }
    // KEEP: Gold (working)
    else if ((symbol === 'IAU' || symbol === 'GDX') && unrealizedPL > 0) {
      console.log(`  ✅ KEEP - Gold hedge working`);
      toKeep.push(symbol);
    }
    // QUESTION: QQQ short
    else if (symbol === 'QQQ') {
      console.log(`  ⚠️ QUESTION - QQQ short (check performance)`);
    }
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('ACTION PLAN:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`🩹 LIQUIDATE (${toSell.length} positions):`);
  toSell.forEach(pos => {
    console.log(`  • ${pos.symbol}: Sell all ${pos.qty} shares`);
    console.log(`    Reason: ${pos.reason}`);
  });

  console.log('');
  console.log(`✅ KEEP (${toKeep.length} positions):`);
  toKeep.forEach(sym => console.log(`  • ${sym}`));

  console.log('');
  console.log('💡 NEW STRATEGY:');
  console.log('  1. Oil thesis was RIGHT (Strait of Hormuz closed)');
  console.log('  2. BUT picked wrong instrument (XLE equities instead of futures)');
  console.log('  3. Keep airline shorts (they\"re printing)');
  console.log('  4. Keep gold (safe haven working)');
  console.log('  5. Redeploy capital to energy FUTURES or wait for equities to catch up');
  console.log('');

  // GET ACCOUNT SUMMARY
  const account = await makeRequest('/v2/account');
  console.log('ACCOUNT STATUS:');
  console.log(`  Portfolio Value: $${parseFloat(account.portfolio_value).toFixed(2)}`);
  console.log(`  Cash: $${parseFloat(account.cash).toFixed(2)}`);
  console.log(`  Buying Power: $${parseFloat(account.buying_power).toFixed(2)}`);
  console.log(`  Daily P&L: $${parseFloat(account.daily_pl).toFixed(2)}`);
  console.log('');
  console.log('👉 READY TO EXECUTE LIQUIDATIONS?');
  console.log('   Type: YES to liquidate failing oil positions');
}

run().catch(console.error);
