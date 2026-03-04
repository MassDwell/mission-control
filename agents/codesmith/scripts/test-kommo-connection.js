#!/usr/bin/env node
/**
 * Test Kommo API Connection
 * 
 * Quick script to verify your Kommo credentials are working
 * Run this before the reversion script to catch auth issues early
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const CREDENTIALS_PATH = path.join(__dirname, '../credentials/kommo/api-token.json');

async function makeRequest(domain, accessToken, endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://${domain}/api/v4${endpoint}`);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ success: true, data: JSON.parse(body), status: res.statusCode });
          } catch (e) {
            resolve({ success: true, data: body, status: res.statusCode });
          }
        } else {
          resolve({ success: false, error: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Kommo API Connection\n');
  console.log('='.repeat(50));
  
  // Load credentials
  console.log('\n📋 Step 1: Loading credentials...');
  let credentials;
  try {
    const credData = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    credentials = JSON.parse(credData);
    console.log('✅ Credentials file found');
  } catch (error) {
    console.error('❌ Failed to load credentials:', error.message);
    console.error('\n💡 Expected location:', CREDENTIALS_PATH);
    console.error('💡 Make sure you\'ve created and filled in the credentials file!');
    process.exit(1);
  }
  
  // Validate credentials
  console.log('\n🔍 Step 2: Validating credentials...');
  
  if (!credentials.domain || credentials.domain.includes('YOUR_')) {
    console.error('❌ Domain not configured');
    console.error('   Please set "domain" in credentials file (e.g., "yourcompany.kommo.com")');
    process.exit(1);
  }
  console.log(`✅ Domain: ${credentials.domain}`);
  
  if (!credentials.access_token || credentials.access_token.includes('YOUR_')) {
    console.error('❌ Access token not configured');
    console.error('   Please set "access_token" in credentials file');
    console.error('\n💡 How to get access token:');
    console.error('   1. Log into Kommo');
    console.error('   2. Settings → Integrations → API');
    console.error('   3. Create integration or use existing');
    console.error('   4. Generate/copy access token');
    process.exit(1);
  }
  console.log('✅ Access token present');
  
  // Test API connection
  console.log('\n🌐 Step 3: Testing API connection...');
  try {
    const result = await makeRequest(credentials.domain, credentials.access_token, '/account');
    
    if (result.success) {
      console.log('✅ API connection successful!');
      console.log(`   Status: ${result.status}`);
      
      if (result.data && result.data.name) {
        console.log(`   Account: ${result.data.name}`);
      }
      if (result.data && result.data.id) {
        console.log(`   Account ID: ${result.data.id}`);
      }
      
      console.log('\n🎉 All checks passed! You\'re ready to run the reversion script.\n');
      
    } else {
      console.error('❌ API connection failed');
      console.error(`   Status: ${result.status}`);
      console.error(`   Error: ${result.error}`);
      
      if (result.status === 401) {
        console.error('\n💡 This is an authentication error. Your token may be:');
        console.error('   - Expired (generate a new one)');
        console.error('   - Invalid (check for typos)');
        console.error('   - From wrong account');
      } else if (result.status === 429) {
        console.error('\n💡 Rate limit hit. Wait a few minutes and try again.');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('\n💡 Check your internet connection and try again.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
