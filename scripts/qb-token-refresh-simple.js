#!/usr/bin/env node

/**
 * QuickBooks Token Refresh (Simple - using refresh token)
 * 
 * Uses existing refresh token to get a new access token
 * No browser OAuth flow needed
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');

const credsPath = path.join(__dirname, '../credentials/quickbooks/api-credentials.json');
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));

async function refreshToken() {
  const postData = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: creds.refresh_token,
    client_id: creds.client_id,
    client_secret: creds.client_secret
  });

  console.log('🔄 Attempting to refresh QB token...');
  console.log('   Refresh token: ' + creds.refresh_token.substring(0, 30) + '...');

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
      console.log('   Response code: ' + res.statusCode);
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            if (response.access_token) {
              console.log('✅ Token refreshed successfully!');
              
              // Update credentials
              creds.access_token = response.access_token;
              creds.refresh_token = response.refresh_token;
              creds.expires_in = response.expires_in;
              creds.token_type = response.token_type || 'bearer';
              
              if (response.x_refresh_token_expires_in) {
                creds.x_refresh_token_expires_in = response.x_refresh_token_expires_in;
              }
              
              fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2));
              console.log('✅ Credentials saved');
              
              resolve(creds);
            } else {
              reject(new Error('No access token in response: ' + JSON.stringify(response)));
            }
          } catch (e) {
            reject(new Error('Failed to parse response: ' + e.message));
          }
        } else {
          reject(new Error(`Refresh failed: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

if (require.main === module) {
  refreshToken()
    .then(() => {
      console.log('');
      console.log('Ready to test Pipedrive → QB estimate sync!');
      console.log('Run: node scripts/pipedrive-qb-estimate-sync.js');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { refreshToken };
