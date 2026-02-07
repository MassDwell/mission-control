#!/usr/bin/env node
/**
 * TWS Connection Checker
 * Returns exit code 0 if connected, 1 if not
 */
const net = require('net');

const client = new net.Socket();
client.setTimeout(5000);

client.on('connect', () => {
  console.log('TWS_CONNECTED');
  client.end();
  process.exit(0);
});

client.on('error', () => {
  console.log('TWS_DISCONNECTED');
  process.exit(1);
});

client.on('timeout', () => {
  console.log('TWS_TIMEOUT');
  client.destroy();
  process.exit(1);
});

client.connect(7496, '127.0.0.1');
