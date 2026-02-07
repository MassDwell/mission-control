const { IBApi, EventName, BarSizeSetting, WhatToShow } = require('@stoqey/ib');
const WebSocket = require('ws');

const PORT = 8089;
const TWS_PORT = 7496;

// Our positions
const SYMBOLS = ['T', 'SOFI', 'F', 'NU'];

// State
const prices = {};
const clients = new Set();

// WebSocket server for dashboard
const wss = new WebSocket.Server({ port: PORT });
console.log(`[STREAM] WebSocket server on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('[STREAM] Client connected');
  clients.add(ws);
  
  // Send current state immediately
  ws.send(JSON.stringify({ type: 'snapshot', prices }));
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('[STREAM] Client disconnected');
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// IBKR connection
const ib = new IBApi({ port: TWS_PORT, clientId: 2 });

ib.on(EventName.connected, () => {
  console.log('[TWS] Connected');
  
  // Type 3 = delayed
  ib.reqMarketDataType(3);
  console.log('[TWS] Using DELAYED');
  
  // Request market data for each symbol
  SYMBOLS.forEach((symbol, idx) => {
    const reqId = 1000 + idx;
    const contract = {
      symbol,
      secType: 'STK',
      exchange: 'SMART',
      currency: 'USD'
    };
    
    prices[symbol] = { symbol, bid: null, ask: null, last: null, change: null, time: null };
    
    ib.reqMktData(reqId, contract, '', false, false);
    console.log(`[TWS] Subscribed to ${symbol} (reqId: ${reqId})`);
  });
});

ib.on(EventName.tickPrice, (reqId, tickType, price) => {
  const idx = reqId - 1000;
  const symbol = SYMBOLS[idx];
  if (!symbol) return;
  
  // tickType: 1=bid, 2=ask, 4=last, 6=high, 7=low, 9=close
  // DELAYED: 66=bid, 67=ask, 68=last, 72=high, 73=low, 75=close
  const field = { 
    1: 'bid', 2: 'ask', 4: 'last', 6: 'high', 7: 'low', 9: 'prevClose',
    66: 'bid', 67: 'ask', 68: 'last', 72: 'high', 73: 'low', 75: 'prevClose'
  }[tickType];
  console.log(`[TICK] ${symbol} type=${tickType} price=${price}`);
  if (field && price > 0) {
    prices[symbol][field] = price;
    prices[symbol].time = new Date().toISOString();
    
    // Calculate change if we have last and prevClose
    if (prices[symbol].last && prices[symbol].prevClose) {
      prices[symbol].change = ((prices[symbol].last - prices[symbol].prevClose) / prices[symbol].prevClose * 100).toFixed(2);
    }
    
    broadcast({ type: 'tick', symbol, field, price, data: prices[symbol] });
  }
});

ib.on(EventName.error, (err, code, reqId) => {
  // Ignore common non-critical errors
  if (code === 2104 || code === 2106 || code === 2158) return; // Market data farm messages
  console.error(`[TWS] Error ${code}: ${err}`);
});

ib.on(EventName.disconnected, () => {
  console.log('[TWS] Disconnected - reconnecting in 5s...');
  setTimeout(() => ib.connect(), 5000);
});

// Connect
console.log('[TWS] Connecting to TWS...');
ib.connect();

// Keep alive
setInterval(() => {
  broadcast({ type: 'heartbeat', time: new Date().toISOString(), prices });
}, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[STREAM] Shutting down...');
  ib.disconnect();
  wss.close();
  process.exit(0);
});
