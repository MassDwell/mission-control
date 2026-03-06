#!/usr/bin/env node

/**
 * Gmail OAuth Token Refresh Automation
 * 
 * Automatically refreshes Gmail OAuth access tokens using stored refresh token.
 * Runs every 25 minutes via cron to keep tokens fresh before 60-min expiry.
 * 
 * Usage: node scripts/gmail-token-refresh-oauth.js
 * 
 * Exit codes:
 *   0 = Success (token refreshed)
 *   1 = Error (logged, no token updated)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw/workspace/credentials/google/gmail-oauth-credentials.json');
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw/workspace/credentials/google/gmail-token.json');
const LOG_PATH = path.join(process.env.HOME, '.openclaw/workspace/data/logs/gmail-token-refresh.log');
const LOG_DIR = path.dirname(LOG_PATH);

// Utility: Log with timestamp
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const level = isError ? 'ERROR' : 'INFO';
  const logMessage = `[${timestamp}] ${level}: ${message}`;
  
  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  // Append to log file
  fs.appendFileSync(LOG_PATH, logMessage + '\n');
}

// Main: Refresh token
async function refreshToken() {
  try {
    // Load credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      log(`Credentials file not found: ${CREDENTIALS_PATH}. Skipping refresh.`);
      process.exit(0); // Not an error, just skip
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.installed;
    
    if (!client_id || !client_secret) {
      log('Missing client_id or client_secret in credentials file', true);
      process.exit(1);
    }
    
    // Load existing token (to get refresh_token)
    if (!fs.existsSync(TOKEN_PATH)) {
      log(`Token file not found: ${TOKEN_PATH}. Need manual authentication.`, true);
      process.exit(1);
    }
    
    const existingToken = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const { refresh_token } = existingToken;
    
    if (!refresh_token) {
      log('No refresh_token in existing token file. Need manual re-authentication.', true);
      process.exit(1);
    }
    
    // Prepare refresh request
    const postData = new URLSearchParams({
      client_id,
      client_secret,
      refresh_token,
      grant_type: 'refresh_token'
    }).toString();
    
    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    // Make request
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const newTokenData = JSON.parse(data);
              
              // Merge: keep refresh_token, update access_token + expiry
              const mergedToken = {
                ...existingToken,
                access_token: newTokenData.access_token,
                expires_in: newTokenData.expires_in,
                token_type: newTokenData.token_type,
                scope: newTokenData.scope || existingToken.scope,
                refreshed_at: new Date().toISOString()
              };
              
              // Save updated token
              fs.writeFileSync(TOKEN_PATH, JSON.stringify(mergedToken, null, 2));
              fs.chmodSync(TOKEN_PATH, 0o600); // Ensure secure permissions
              
              log(`Token refreshed successfully. Expires in ${newTokenData.expires_in}s.`);
              resolve();
            } catch (parseErr) {
              log(`Failed to parse token response: ${parseErr.message}`, true);
              reject(parseErr);
            }
          } else {
            const errorMsg = `Google OAuth returned status ${res.statusCode}: ${data}`;
            log(errorMsg, true);
            reject(new Error(errorMsg));
          }
        });
      });
      
      req.on('error', (err) => {
        log(`Request error: ${err.message}`, true);
        reject(err);
      });
      
      req.write(postData);
      req.end();
    });
  } catch (error) {
    log(`Unexpected error: ${error.message}`, true);
    process.exit(1);
  }
}

// Execute
refreshToken()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });
