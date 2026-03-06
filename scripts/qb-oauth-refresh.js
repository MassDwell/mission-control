#!/usr/bin/env node

/**
 * QuickBooks OAuth Token Refresh
 * 
 * Generates auth URL → redirects to developer console → captures auth code → exchanges for new token
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const url = require('url');

const creds = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../credentials/quickbooks/api-credentials.json'), 'utf-8')
);

const CLIENT_ID = creds.client_id;
const CLIENT_SECRET = creds.client_secret;
const REDIRECT_URI = 'http://localhost:3847/callback';
const REALM_ID = creds.company_id; // QB company ID

class QBOAuthRefresh {
  constructor() {
    this.authCode = null;
    this.server = null;
  }

  startCallbackServer() {
    /**
     * Start local HTTP server to catch OAuth callback
     */
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        
        if (parsedUrl.pathname === '/callback') {
          this.authCode = parsedUrl.query.code;
          const realmId = parsedUrl.query.realmId;
          
          if (this.authCode) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                  <h1>✅ Authorization Successful!</h1>
                  <p>You can close this window and return to the terminal.</p>
                  <p>Your QuickBooks token is being refreshed...</p>
                </body>
              </html>
            `);
            console.log('✅ Auth code received:', this.authCode.substring(0, 20) + '...');
          } else {
            res.writeHead(400);
            res.end('Error: No auth code received');
          }
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      this.server.listen(3847, () => {
        console.log('✅ Callback server listening on http://localhost:3847');
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  generateAuthUrl() {
    /**
     * Generate QuickBooks OAuth authorization URL
     */
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('state', 'security_token_' + Date.now());
    
    return authUrl.toString();
  }

  exchangeCodeForToken() {
    /**
     * Exchange auth code for access token
     */
    return new Promise((resolve, reject) => {
      const postData = new url.URLSearchParams({
        grant_type: 'authorization_code',
        code: this.authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }).toString();

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
              const response = JSON.parse(body);
              resolve(response);
            } catch (e) {
              reject(new Error('Failed to parse token response: ' + e.message));
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

  saveTokens(tokenData) {
    /**
     * Save new tokens to credentials file
     */
    const updatedCreds = {
      ...creds,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      x_refresh_token_expires_in: tokenData.x_refresh_token_expires_in
    };

    fs.writeFileSync(
      path.join(__dirname, '../credentials/quickbooks/api-credentials.json'),
      JSON.stringify(updatedCreds, null, 2)
    );

    console.log('✅ Credentials saved to credentials/quickbooks/api-credentials.json');
    return updatedCreds;
  }

  async run() {
    console.log('🚀 QuickBooks OAuth Token Refresh');
    console.log('');

    // Start callback server
    await this.startCallbackServer();

    // Generate auth URL
    const authUrl = this.generateAuthUrl();
    console.log('');
    console.log('📍 Authorization URL:');
    console.log(authUrl);
    console.log('');
    console.log('👉 Click the link above to authorize, or copy it to your browser');
    console.log('');
    console.log('⏳ Waiting for authorization...');

    // Wait for auth code (timeout after 5 minutes)
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Authorization timeout')), 300000)
    );

    const checkCode = () => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (this.authCode) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
    };

    try {
      await Promise.race([checkCode(), timeout]);
      
      console.log('');
      console.log('🔄 Exchanging auth code for token...');
      
      const tokenData = await this.exchangeCodeForToken();
      
      console.log('');
      console.log('✅ Token received:');
      console.log('   - access_token: ' + tokenData.access_token.substring(0, 50) + '...');
      console.log('   - refresh_token: ' + tokenData.refresh_token.substring(0, 50) + '...');
      console.log('   - expires_in: ' + tokenData.expires_in + ' seconds');
      
      this.saveTokens(tokenData);
      
      console.log('');
      console.log('✅ QuickBooks OAuth refresh complete!');
      console.log('');
      console.log('You can now run the Pipedrive → QB estimate sync:');
      console.log('   node scripts/pipedrive-qb-estimate-sync.js');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      if (this.server) {
        this.server.close();
      }
    }
  }
}

if (require.main === module) {
  const refresh = new QBOAuthRefresh();
  refresh.run().catch(e => {
    console.error('Fatal error:', e.message);
    process.exit(1);
  });
}

module.exports = { QBOAuthRefresh };
