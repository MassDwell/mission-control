#!/usr/bin/env node
/**
 * VAPI Batch Caller for MassDwell Cold Leads
 * Calls leads during business hours: 9 AM - 12 PM and 2 PM - 6 PM EST
 * 
 * Usage:
 *   node scripts/vapi-batch-caller.js --dry-run    # Preview without calling
 *   node scripts/vapi-batch-caller.js --limit 10   # Call first 10 leads
 *   node scripts/vapi-batch-caller.js              # Run full batch (with rate limiting)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const VAPI_API_KEY = process.env.VAPI_API_KEY || '392756d9-a691-47d0-8265-fce0d5331503';
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || 'ebac8e3e-5285-4e6c-a185-6e2698a24ca5';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || '9112fc10-0b93-49ad-9593-ff4d9fdc6fa7'; // Twilio +17819922985

const CALL_LIST_PATH = path.join(__dirname, '../data/massdwell/sales/vapi-cold-call-list.json');
const CALL_LOG_PATH = path.join(__dirname, '../data/massdwell/sales/vapi-call-log.json');

// Calling hours (EST)
const CALLING_WINDOWS = [
  { start: 9, end: 12 },   // 9 AM - 12 PM
  { start: 14, end: 18 }   // 2 PM - 6 PM
];

// Rate limiting
const CALLS_PER_MINUTE = 5;
const DELAY_BETWEEN_CALLS_MS = (60 / CALLS_PER_MINUTE) * 1000; // 12 seconds

function isWithinCallingHours() {
  const now = new Date();
  const estHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();
  const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getDay();
  
  // Skip weekends (0 = Sunday, 6 = Saturday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { allowed: false, reason: 'Weekend - no calls' };
  }
  
  for (const window of CALLING_WINDOWS) {
    if (estHour >= window.start && estHour < window.end) {
      return { allowed: true, reason: `Within calling window (${window.start}:00 - ${window.end}:00 EST)` };
    }
  }
  
  return { allowed: false, reason: `Outside calling hours. EST hour: ${estHour}. Windows: 9-12, 14-18` };
}

function makeCall(phoneNumber, name) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      assistantId: VAPI_ASSISTANT_ID,
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
        name: name
      }
    });

    const options = {
      hostname: 'api.vapi.ai',
      port: 443,
      path: '/call/phone',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function loadCallLog() {
  try {
    return JSON.parse(fs.readFileSync(CALL_LOG_PATH, 'utf8'));
  } catch {
    return { calls: [], lastRun: null };
  }
}

function saveCallLog(log) {
  fs.writeFileSync(CALL_LOG_PATH, JSON.stringify(log, null, 2));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
  
  console.log('='.repeat(60));
  console.log('VAPI Batch Caller - MassDwell Lead Qualifier');
  console.log('='.repeat(60));
  
  // Check calling hours
  const hoursCheck = isWithinCallingHours();
  console.log(`\nCalling hours check: ${hoursCheck.reason}`);
  
  if (!hoursCheck.allowed && !dryRun) {
    console.log('\n❌ Cannot make calls right now. Run with --dry-run to preview.');
    process.exit(1);
  }
  
  // Load call list
  const callList = JSON.parse(fs.readFileSync(CALL_LIST_PATH, 'utf8'));
  console.log(`\nLoaded ${callList.length} contacts with phone numbers`);
  
  // Load call log to skip already-called numbers
  const callLog = loadCallLog();
  const calledNumbers = new Set(callLog.calls.map(c => c.phone));
  
  // Filter out already-called numbers
  const toCall = callList.filter(c => !calledNumbers.has(c.phone));
  console.log(`Already called: ${calledNumbers.size}`);
  console.log(`Remaining to call: ${toCall.length}`);
  
  // Apply limit if specified
  const batch = limit ? toCall.slice(0, limit) : toCall;
  console.log(`\nThis batch: ${batch.length} calls`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No calls will be made\n');
    batch.slice(0, 10).forEach((contact, i) => {
      console.log(`  ${i + 1}. ${contact.name} - ${contact.phone}`);
    });
    if (batch.length > 10) {
      console.log(`  ... and ${batch.length - 10} more`);
    }
    return;
  }
  
  // Make calls
  console.log('\n📞 Starting calls...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < batch.length; i++) {
    const contact = batch[i];
    const progress = `[${i + 1}/${batch.length}]`;
    
    try {
      console.log(`${progress} Calling ${contact.name} at ${contact.phone}...`);
      const result = await makeCall(contact.phone, contact.name);
      
      if (result.status === 201) {
        console.log(`  ✅ Call initiated: ${result.data.id}`);
        successCount++;
        
        // Log the call
        callLog.calls.push({
          phone: contact.phone,
          name: contact.name,
          callId: result.data.id,
          timestamp: new Date().toISOString(),
          status: 'initiated'
        });
      } else {
        console.log(`  ❌ Failed: ${JSON.stringify(result.data)}`);
        failCount++;
      }
      
      // Rate limiting
      if (i < batch.length - 1) {
        console.log(`  ⏱️  Waiting ${DELAY_BETWEEN_CALLS_MS / 1000}s before next call...`);
        await sleep(DELAY_BETWEEN_CALLS_MS);
      }
      
      // Re-check calling hours periodically
      if (i > 0 && i % 10 === 0) {
        const recheck = isWithinCallingHours();
        if (!recheck.allowed) {
          console.log(`\n⚠️  Now outside calling hours. Stopping batch.`);
          break;
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failCount++;
    }
  }
  
  // Save call log
  callLog.lastRun = new Date().toISOString();
  saveCallLog(callLog);
  
  console.log('\n' + '='.repeat(60));
  console.log(`COMPLETE: ${successCount} calls initiated, ${failCount} failed`);
  console.log(`Call log saved to: ${CALL_LOG_PATH}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
