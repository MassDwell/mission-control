#!/usr/bin/env node
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'credentials', 'x', 'x-api.json')));

const client = new TwitterApi({
  appKey: creds.api_key,
  appSecret: creds.api_secret,
  accessToken: creds.access_token,
  accessSecret: creds.access_token_secret,
});

async function main() {
  const [,, imagePath, ...textParts] = process.argv;
  const text = textParts.join(' ');
  
  if (!imagePath || !text) {
    console.log('Usage: node x-post-v2.js <image-path> <tweet text>');
    process.exit(1);
  }
  
  console.log('📤 Uploading image...');
  const mediaId = await client.v1.uploadMedia(imagePath);
  console.log(`✅ Media uploaded: ${mediaId}`);
  
  console.log('📝 Posting tweet...');
  const result = await client.v2.tweet({
    text: text,
    media: { media_ids: [mediaId] }
  });
  console.log('✅ Posted!');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
