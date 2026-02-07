#!/usr/bin/env node
/**
 * Send Morning Team Briefing via Gmail API
 */

const fs = require('fs');
const https = require('https');

const CREDENTIALS_PATH = process.env.HOME + '/.openclaw/workspace/credentials/google/gmail-oauth-credentials.json';
const TOKEN_PATH = process.env.HOME + '/.openclaw/workspace/credentials/google/gmail-token.json';

async function refreshToken(credentials, token) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      client_id: credentials.installed.client_id,
      client_secret: credentials.installed.client_secret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token'
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const newToken = JSON.parse(data);
          token.access_token = newToken.access_token;
          token.expiry_date = Date.now() + (newToken.expires_in * 1000);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
          resolve(token.access_token);
        } else {
          reject(new Error(`Token refresh failed: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function sendEmail(accessToken, to, subject, body) {
  return new Promise((resolve, reject) => {
    const email = [
      `To: ${to}`,
      'From: sales@massdwell.com',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      body
    ].join('\r\n');

    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const postData = JSON.stringify({ raw: encodedEmail });

    const req = https.request({
      hostname: 'gmail.googleapis.com',
      path: '/gmail/v1/users/me/messages/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Send failed: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const recipients = process.argv[2];
  const subject = process.argv[3];
  const bodyFile = process.argv[4];

  if (!recipients || !subject || !bodyFile) {
    console.error('Usage: node send-team-briefing.js "email1,email2" "Subject" body.html');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  let token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const body = fs.readFileSync(bodyFile, 'utf-8');

  // Refresh token if expired
  if (Date.now() >= token.expiry_date - 60000) {
    console.log('Refreshing token...');
    await refreshToken(credentials, token);
  }

  // Send to each recipient
  const emails = recipients.split(',').map(e => e.trim());
  for (const email of emails) {
    try {
      const result = await sendEmail(token.access_token, email, subject, body);
      console.log(`✅ Sent to ${email}: ${result.id}`);
    } catch (err) {
      console.error(`❌ Failed to send to ${email}: ${err.message}`);
    }
  }
}

main().catch(console.error);
