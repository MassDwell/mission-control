#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'credentials', 'x', 'x-api.json')));

function oauthSign(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

function buildAuthHeader(method, url, extraParams = {}) {
  const oauthParams = {
    oauth_consumer_key: creds.api_key,
    oauth_token: creds.access_token,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
    ...extraParams
  };
  
  const allParams = { ...oauthParams };
  oauthParams.oauth_signature = oauthSign(method, url, allParams, creds.api_secret, creds.access_token_secret);
  
  const header = 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`).join(', ');
  return header;
}

async function uploadMedia(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const body = `media_data=${encodeURIComponent(base64)}`;
  
  const auth = buildAuthHeader('POST', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data.media_id_string;
}

async function postTweet(text, mediaIds = []) {
  const url = 'https://api.twitter.com/2/tweets';
  const body = { text };
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }
  
  const auth = buildAuthHeader('POST', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  const [,, imagePath, ...textParts] = process.argv;
  const text = textParts.join(' ');
  
  if (!imagePath || !text) {
    console.log('Usage: node x-post-with-image.js <image-path> <tweet text>');
    process.exit(1);
  }
  
  console.log('📤 Uploading image...');
  const mediaId = await uploadMedia(imagePath);
  console.log(`✅ Media uploaded: ${mediaId}`);
  
  console.log('📝 Posting tweet...');
  const result = await postTweet(text, [mediaId]);
  console.log('✅ Posted!', result);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
