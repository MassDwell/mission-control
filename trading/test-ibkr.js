const net = require('net');

const client = new net.Socket();
const HOST = '127.0.0.1';
const PORT = 7496;

console.log('Connecting to TWS on port', PORT, '...');

client.connect(PORT, HOST, () => {
  console.log('✅ Connected to TWS!');
  
  // Send API version handshake
  const clientVersion = 'v100..176';
  const buffer = Buffer.alloc(clientVersion.length + 4);
  buffer.writeInt32BE(clientVersion.length, 0);
  buffer.write(clientVersion, 4);
  client.write(buffer);
});

client.on('data', (data) => {
  console.log('Received:', data.toString().substring(0, 100));
  client.destroy();
});

client.on('error', (err) => {
  console.log('❌ Connection error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.log('Make sure TWS is running and API is enabled');
  }
});

client.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout - closing');
  client.destroy();
  process.exit(1);
}, 5000);
