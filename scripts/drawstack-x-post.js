#!/usr/bin/env node
/**
 * DrawStack X (Twitter) Auto-poster
 * Posts content from the blog post queue to @TheDrawStack
 * 
 * Usage:
 *   node drawstack-x-post.js --type blog --slug <slug>
 *   node drawstack-x-post.js --type insight --text "..."
 *   node drawstack-x-post.js --type engagement  (search + engage mode)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '../data/drawstack/x-post-queue.json');
const LOG_FILE = path.join(__dirname, '../data/logs/drawstack-x-posts.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function xurl(args) {
  try {
    const result = execSync(`xurl --app drawstack ${args}`, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (e) {
    log(`xurl error: ${e.message}`);
    return null;
  }
}

function postTweet(text) {
  if (text.length > 280) {
    text = text.substring(0, 277) + '...';
  }
  log(`Posting: ${text.substring(0, 60)}...`);
  const result = xurl(`post "${text.replace(/"/g, '\\"')}"`);
  if (result?.data?.id) {
    log(`Posted successfully: https://x.com/TheDrawStack/status/${result.data.id}`);
    return result.data.id;
  }
  return null;
}

// Blog post announcement templates
function buildBlogPostTweet(post) {
  const templates = [
    `📋 New post: "${post.title}"\n\n${post.excerpt.substring(0, 100)}...\n\n🔗 drawstack.ai/blog/${post.slug}`,
    `${post.excerpt.substring(0, 150)}...\n\nFull guide → drawstack.ai/blog/${post.slug}`,
    `New on the DrawStack blog:\n\n"${post.title}"\n\n${post.excerpt.substring(0, 100)}...\n\ndrawstack.ai/blog/${post.slug}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Construction industry engagement keywords to monitor
const ENGAGEMENT_QUERIES = [
  '"construction draws" -is:retweet',
  '"AIA G702" -is:retweet',
  '"construction loan draw" -is:retweet',
  '"lien waiver" construction -is:retweet',
  '"draw request" construction -is:retweet',
  'rabbet software construction -is:retweet',
];

async function engagementMode() {
  log('Starting engagement mode...');
  
  for (const query of ENGAGEMENT_QUERIES) {
    const results = xurl(`search "${query}" -n 5`);
    if (!results?.data) continue;
    
    for (const tweet of results.data) {
      // Only engage with tweets < 24h old, not already replied to
      log(`Found tweet ${tweet.id}: ${tweet.text?.substring(0, 60)}`);
      // Queue for manual review — don't auto-reply without approval
    }
  }
}

// Scheduled post queue
function processQueue() {
  if (!fs.existsSync(QUEUE_FILE)) {
    log('No queue file found');
    return;
  }
  
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  const now = Date.now();
  const pending = queue.filter(p => !p.posted && p.scheduledAt <= now);
  
  for (const item of pending) {
    const id = postTweet(item.text);
    if (id) {
      item.posted = true;
      item.postedAt = now;
      item.tweetId = id;
    }
  }
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  log(`Processed ${pending.length} queued posts`);
}

// Add a post to the queue
function queuePost(text, scheduledAt = Date.now()) {
  let queue = [];
  if (fs.existsSync(QUEUE_FILE)) {
    queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  }
  queue.push({ text, scheduledAt, posted: false, createdAt: Date.now() });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  log(`Queued post for ${new Date(scheduledAt).toISOString()}: ${text.substring(0, 60)}...`);
}

// Pre-generated tweet bank for DrawStack
const TWEET_BANK = [
  "Construction draws shouldn't require 12 emails and a prayer 🙏\n\nDrawStack gives lenders a real-time portal. Subs get instant status. GCs stop playing middleman.\n\ndrawstack.ai",
  "The AIA G702 is 40+ years old and still the industry standard.\n\nWe didn't reinvent it — we just made it automatic.\n\nUpload your SOV, DrawStack handles the G702. drawstack.ai",
  "The #1 reason construction draws get delayed:\n\nMissing lien waivers from subs.\n\nDrawStack tracks every waiver, flags what's missing, and blocks the draw until it's done.\n\n(Yes, it's that simple.)",
  "Real estate developers: how much time did you spend chasing draw approvals last month?\n\nFor most, it's 5-10 hours per project per draw cycle.\n\nThat time should be yours back. drawstack.ai",
  "\"We use Excel for our draw schedule\" is the construction equivalent of \"we still use fax machines\"\n\nThere's a better way. drawstack.ai",
  "Construction loan draws, simplified:\n\n1️⃣ GC submits request\n2️⃣ Lender reviews in their portal\n3️⃣ Inspector signs off\n4️⃣ Wire hits\n\nNo PDFs. No email chains. No chasing.\n\n→ drawstack.ai",
  "AI invoice parsing is live on DrawStack.\n\nUpload a sub's PDF invoice → AI maps every line to your SOV in seconds.\n\nYou review, approve, done. drawstack.ai",
];

function scheduleTweetBank() {
  // Schedule one tweet per day at 9 AM EST for the next 7 days
  const nineAM = new Date();
  nineAM.setHours(9, 0, 0, 0);
  
  for (let i = 0; i < TWEET_BANK.length; i++) {
    const scheduledAt = new Date(nineAM);
    scheduledAt.setDate(scheduledAt.getDate() + i);
    queuePost(TWEET_BANK[i], scheduledAt.getTime());
  }
  log(`Scheduled ${TWEET_BANK.length} tweets over ${TWEET_BANK.length} days`);
}

// CLI
const args = process.argv.slice(2);
const mode = args[0];

switch (mode) {
  case '--process-queue':
    processQueue();
    break;
  case '--schedule-bank':
    scheduleTweetBank();
    break;
  case '--engagement':
    engagementMode();
    break;
  case '--post':
    postTweet(args.slice(1).join(' '));
    break;
  default:
    processQueue();
}
