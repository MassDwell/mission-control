#!/usr/bin/env node
// One-time OAuth setup for GA4 Data API + Google Search Console
// Saves token to: credentials/google/analytics-token.json
// Run: node scripts/google-analytics-auth.js

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const WORKSPACE = path.join(os.homedir(), '.openclaw/workspace');
const CREDS_PATH = path.join(WORKSPACE, 'credentials/google/gmail-oauth-credentials.json');
const TOKEN_PATH = path.join(WORKSPACE, 'credentials/google/analytics-token.json');

const PORT = 8085;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
];

const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
const { client_id, client_secret } = creds.installed;

const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
authUrl.searchParams.set('client_id', client_id);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES.join(' '));
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\n🔐 Google Analytics + Search Console OAuth Setup\n');
console.log('Scopes:', SCOPES.join('\n       '));
console.log('\nOpening browser for vettoristeve@gmail.com authorization...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback' || !url.searchParams.get('code')) {
    res.writeHead(404); res.end(); return;
  }

  const code = url.searchParams.get('code');
  console.log('✓ Authorization code received — exchanging for tokens...');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id, client_secret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.access_token) {
      tokens.account = 'vettoristeve@gmail.com';
      tokens.created_at = new Date().toISOString();
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>✅ Success!</h1><p>Analytics + Search Console authorized. You can close this window.</p>');

      console.log('\n✅ Token saved to:', TOKEN_PATH);
      console.log('Scopes granted:', tokens.scope);
      console.log('\nRun to verify:\n  node scripts/drawstack-daily-kpi.js\n');
      server.close();
      process.exit(0);
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>❌ Error</h1><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
      console.error('Token exchange failed:', tokens);
      server.close();
      process.exit(1);
    }
  } catch (e) {
    res.writeHead(500); res.end('Internal error');
    console.error('Error:', e.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  exec(`open "${authUrl.toString()}"`);
  console.log(`Listening on http://localhost:${PORT}/callback`);
  console.log('Waiting for browser callback...\n');
});

// Timeout after 5 minutes
setTimeout(() => {
  console.error('❌ Timed out waiting for authorization (5 min).');
  server.close();
  process.exit(1);
}, 5 * 60 * 1000);
