const { TwitterApi } = require('twitter-api-v2');
const creds = require('../../credentials/x/x-api.json');

const client = new TwitterApi({
  appKey: creds.api_key,
  appSecret: creds.api_secret,
  accessToken: creds.access_token,
  accessSecret: creds.access_token_secret,
});

async function postTweet(text) {
  try {
    const result = await client.v2.tweet(text);
    console.log('Tweet posted:', JSON.stringify(result.data, null, 2));
    return result.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) console.error('Details:', JSON.stringify(error.data, null, 2));
    throw error;
  }
}

// If run directly with argument
if (process.argv[2]) {
  postTweet(process.argv[2]);
} else {
  module.exports = { postTweet, client };
}
