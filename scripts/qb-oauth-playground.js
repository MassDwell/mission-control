#!/usr/bin/env node

/**
 * QuickBooks OAuth via Intuit OAuth2 Playground
 * 
 * Uses Intuit's OAuth2 Playground to authorize and get auth code
 * Then exchanges code for access token
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const credsPath = path.join(__dirname, '../credentials/quickbooks/api-credentials.json');
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));

const CLIENT_ID = creds.client_id;
const CLIENT_SECRET = creds.client_secret;
const REDIRECT_URI = 'https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function generateAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: REDIRECT_URI,
    state: 'security_token_' + Date.now()
  });

  return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
}

async function exchangeCodeForToken(authCode) {
  const postData = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  }).toString();

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'oauth.platform.intuit.com',
      path: '/oauth2/tokens',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Failed to parse token response'));
          }
        } else {
          reject(new Error(`Token exchange failed: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function saveTokens(tokenData) {
  const updatedCreds = {
    ...creds,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type || 'bearer',
    x_refresh_token_expires_in: tokenData.x_refresh_token_expires_in
  };

  fs.writeFileSync(credsPath, JSON.stringify(updatedCreds, null, 2));
  console.log('✅ Credentials saved');
  return updatedCreds;
}

async function run() {
  console.log('🚀 QuickBooks OAuth via Intuit OAuth2 Playground\n');

  const authUrl = await generateAuthUrl();

  console.log('📍 Authorization URL:');
  console.log(authUrl);
  console.log('');
  console.log('👉 Steps:');
  console.log('   1. Click the link above (or copy to browser)');
  console.log('   2. You\'ll be redirected to the OAuth2 Playground');
  console.log('   3. Click "Get Authorization Code"');
  console.log('   4. Copy the "Authorization Code" value');
  console.log('   5. Paste it below when prompted');
  console.log('');

  try {
    const authCode = await prompt('📋 Paste your authorization code here: ');

    if (!authCode || authCode.trim().length === 0) {
      console.error('❌ No authorization code provided');
      process.exit(1);
    }

    console.log('\n🔄 Exchanging code for token...');
    const tokenData = await exchangeCodeForToken(authCode.trim());

    console.log('✅ Token received:');
    console.log('   - access_token: ' + tokenData.access_token.substring(0, 50) + '...');
    console.log('   - refresh_token: ' + tokenData.refresh_token.substring(0, 50) + '...');
    console.log('   - expires_in: ' + tokenData.expires_in + ' seconds');

    await saveTokens(tokenData);

    console.log('\n✅ QuickBooks OAuth complete!\n');
    console.log('You can now run the Pipedrive → QB estimate sync:');
    console.log('   node scripts/pipedrive-qb-estimate-sync.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

run();
