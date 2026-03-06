#!/usr/bin/env node
/**
 * CR-008: Integration Test
 * Tests full flow: UI → POST /api/decisions/action → queue append → status read
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const BASE_URL = 'http://localhost:3000';
const MC_TOKEN = 'local_dev_token_12345';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  testsRun++;
  return fn()
    .then(() => {
      testsPassed++;
      console.log(`✓ ${name}`);
    })
    .catch(err => {
      testsFailed++;
      console.error(`✗ ${name}`);
      console.error(`  ${err.message}`);
    });
}

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runIntegrationTests() {
  console.log('[TEST] CR-008: Integration Tests\n');

  // Start server in background
  const { spawn } = require('child_process');
  const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Test 1: Health check
    await test('Health endpoint responds', async () => {
      const res = await makeRequest('GET', '/api/health');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.status) throw new Error('No status in response');
    });

    // Test 2: Get decisions
    await test('GET /api/decisions returns decisions', async () => {
      const res = await makeRequest('GET', '/api/decisions');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.decisions)) throw new Error('decisions not an array');
      if (res.body.decisions.length === 0) throw new Error('No sample decisions');
    });

    // Test 3: POST without token (should fail)
    await test('POST /api/decisions/action without token returns 401', async () => {
      const res = await makeRequest('POST', '/api/decisions/action', {}, {
        decision_id: 'dec_ws_001_ph2',
        action: 'approve'
      });
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // Test 4: POST with invalid token (should fail)
    await test('POST /api/decisions/action with wrong token returns 401', async () => {
      const res = await makeRequest('POST', '/api/decisions/action', 
        { 'X-MC-TOKEN': 'wrong_token' },
        {
          decision_id: 'dec_ws_001_ph2',
          action: 'approve'
        }
      );
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // Test 5: POST with valid token but missing decision_id
    await test('POST /api/decisions/action missing decision_id returns 400', async () => {
      const res = await makeRequest('POST', '/api/decisions/action',
        { 'X-MC-TOKEN': MC_TOKEN },
        {
          action: 'approve'
        }
      );
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    // Test 6: POST with valid token but invalid action
    await test('POST /api/decisions/action invalid action returns 400', async () => {
      const res = await makeRequest('POST', '/api/decisions/action',
        { 'X-MC-TOKEN': MC_TOKEN },
        {
          decision_id: 'dec_ws_001_ph2',
          action: 'invalid'
        }
      );
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    // Test 7: POST with valid token but non-existent decision_id
    await test('POST /api/decisions/action non-existent decision returns 404', async () => {
      const res = await makeRequest('POST', '/api/decisions/action',
        { 'X-MC-TOKEN': MC_TOKEN },
        {
          decision_id: 'dec_nonexistent',
          action: 'approve'
        }
      );
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    });

    // Test 8: POST with valid token, decision, and action (should succeed)
    await test('POST /api/decisions/action valid request returns 202', async () => {
      const res = await makeRequest('POST', '/api/decisions/action',
        { 'X-MC-TOKEN': MC_TOKEN },
        {
          decision_id: 'dec_ws_001_ph2',
          action: 'approve',
          requested_by: 'steve'
        }
      );
      if (res.status !== 202) throw new Error(`Expected 202, got ${res.status}`);
      if (!res.body.action_id) throw new Error('No action_id in response');
      if (res.body.status !== 'queued') throw new Error('Status should be queued');
    });

    // Test 9: Verify queue was appended
    await test('Queue file contains appended action', async () => {
      const queuePath = path.join(process.env.HOME, '.openclaw/workspace/data/mission-control/decision_actions_queue.json');
      const queue = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
      if (!Array.isArray(queue.items)) throw new Error('Queue items not an array');
      if (queue.items.length === 0) throw new Error('Queue is empty (action not appended)');
      
      const lastItem = queue.items[queue.items.length - 1];
      if (lastItem.status !== 'queued') throw new Error('Last item status should be queued');
      if (lastItem.action !== 'approve') throw new Error('Last item action should be approve');
    });

    // Test 10: GET /api/decisions shows queue
    await test('GET /api/decisions shows queue items', async () => {
      const res = await makeRequest('GET', '/api/decisions');
      if (!Array.isArray(res.body.queue)) throw new Error('queue not an array');
      if (res.body.queue.length === 0) throw new Error('Queue should have items');
    });

    console.log(`\n[TEST SUMMARY]\nTotal: ${testsRun} | Passed: ${testsPassed} | Failed: ${testsFailed}\n`);

  } finally {
    // Kill server
    server.kill();
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runIntegrationTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
