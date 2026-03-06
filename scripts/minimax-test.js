#!/usr/bin/env node

/**
 * MiniMax API Connection Test
 * Validates Coding Plan key + tests a simple DOM analysis prompt
 */

const fs = require('fs');
const path = require('path');

// Load credentials
const credPath = path.join(__dirname, '../credentials/minimax/api-key.json');
const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));

const apiKey = creds.api_key;
const baseUrl = creds.base_url || 'https://api.minimax.io/v1';
const model = creds.model || 'MiniMax-M2.1';

console.log('🧪 Testing MiniMax Coding Plan Connection...\n');
console.log(`API Key: ${apiKey.substring(0, 20)}...`);
console.log(`Base URL: ${baseUrl}`);
console.log(`Model: ${model}\n`);

// Test prompt: simple sentiment analysis
const testPrompt = `
You are a sentiment analyst. Analyze this Twitter feed snippet for oil market sentiment:

"CL breaking through $82! Strait of Hormuz blockade rumors intensifying. Energy ETF crushing it. 
$USO calls printing money 🚀 #oiltrader #iran"

Provide:
1. Sentiment (bullish/bearish/neutral)
2. Conviction (0-100)
3. Key signal

Keep response under 50 words.
`;

async function testConnection() {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: testPrompt
          }
        ],
        max_tokens: 200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      process.exit(1);
    }

    console.log('✅ CONNECTION SUCCESSFUL\n');
    console.log('Response:', data.choices[0].message.content);
    console.log('\n💰 Tokens used:', data.usage.prompt_tokens + data.usage.completion_tokens);
    console.log('✅ MiniMax Coding Plan is LIVE and ready for Money Printer scraping');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
