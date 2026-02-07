#!/usr/bin/env node
/**
 * MassDwell Daily Content Generator + Poster
 * Generates fresh ADU images with Imagen 4 and posts to X
 */

const fs = require('fs');
const path = require('path');
const { TwitterApi } = require('twitter-api-v2');

const WORKSPACE = '/Users/openclaw/.openclaw/workspace';
const IMAGEN_API_KEY = process.env.GEMINI_API_KEY || require('../credentials/google/gemini-api.json').apiKey;
const IMAGEN_MODEL = 'imagen-4.0-fast-generate-001';

// Load credentials
const xCreds = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'credentials/x/x-api.json')));
const calendar = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'scripts/massdwell-content-calendar.json')));

// X client
const xClient = new TwitterApi({
  appKey: xCreds.api_key,
  appSecret: xCreds.api_secret,
  accessToken: xCreds.access_token,
  accessSecret: xCreds.access_token_secret,
});

// Get day of week
function getDayName() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

// Pick random item from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate image with Imagen 4
async function generateImage(prompt) {
  console.log('🎨 Generating image with Imagen 4...');
  console.log(`   Prompt: "${prompt.substring(0, 80)}..."`);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${IMAGEN_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' }
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Imagen error: ${data.error.message}`);
  }
  
  if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
    const imageBuffer = Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
    const timestamp = Date.now();
    const outputPath = path.join(WORKSPACE, `data/massdwell/marketing_assets/generated/daily-${timestamp}.jpg`);
    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`✅ Image saved: daily-${timestamp}.jpg`);
    return outputPath;
  }
  
  throw new Error('Unexpected Imagen response format');
}

// Post to X with image
async function postToX(imagePath, text) {
  console.log('📤 Uploading to X...');
  const mediaId = await xClient.v1.uploadMedia(imagePath);
  console.log(`✅ Media uploaded: ${mediaId}`);
  
  console.log('📝 Posting tweet...');
  const result = await xClient.v2.tweet({
    text: text,
    media: { media_ids: [mediaId] }
  });
  console.log(`✅ Posted! Tweet ID: ${result.data.id}`);
  return result.data;
}

// Log post to tracking file
function logPost(tweetId, imagePath, text, theme) {
  const logPath = path.join(WORKSPACE, 'data/massdwell/marketing_assets/x-post-log.json');
  const log = JSON.parse(fs.readFileSync(logPath));
  
  log.posts.push({
    id: tweetId,
    timestamp: new Date().toISOString(),
    image: path.basename(imagePath),
    text: text.substring(0, 100) + '...',
    type: theme,
    generated: true
  });
  
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log('📊 Logged to x-post-log.json');
}

// Main
async function main() {
  const day = getDayName();
  const dayConfig = calendar.themes[day];
  
  if (!dayConfig) {
    console.error(`No config for ${day}`);
    process.exit(1);
  }
  
  console.log(`\n🗓️  ${day.charAt(0).toUpperCase() + day.slice(1)} - ${dayConfig.theme}\n`);
  
  // Pick random prompt and template
  const promptIndex = Math.floor(Math.random() * dayConfig.imagePrompts.length);
  const imagePrompt = dayConfig.imagePrompts[promptIndex];
  const postText = dayConfig.postTemplates[promptIndex] || pick(dayConfig.postTemplates);
  
  try {
    // Generate image
    const imagePath = await generateImage(imagePrompt);
    
    // Post to X
    const tweet = await postToX(imagePath, postText);
    
    // Log it
    logPost(tweet.id, imagePath, postText, dayConfig.theme);
    
    console.log('\n✅ Daily post complete!\n');
    console.log(`View: https://twitter.com/massdwell/status/${tweet.id}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
