#!/usr/bin/env node
/**
 * Mention System — Create @mentions between agents
 * 
 * Usage:
 *   node scripts/mention.js <from> <to> <message> [context]
 * 
 * Examples:
 *   node scripts/mention.js clawson sales_followup "Follow up with Bob Warren" "task:hot-leads"
 *   node scripts/mention.js marketing_content all "New content ready for review"
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MENTIONS_FILE = path.join(__dirname, '..', 'data', 'global', 'mentions.json');

function loadMentions() {
  try {
    return JSON.parse(fs.readFileSync(MENTIONS_FILE, 'utf8'));
  } catch {
    return { mentions: [], subscriptions: {}, lastUpdated: new Date().toISOString() };
  }
}

function saveMentions(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MENTIONS_FILE, JSON.stringify(data, null, 2));
}

function createMention(from, to, content, context = null) {
  const data = loadMentions();
  
  const mention = {
    id: crypto.randomUUID(),
    from,
    to,
    content,
    context,
    timestamp: new Date().toISOString(),
    delivered: false,
    acknowledged: false
  };
  
  data.mentions.push(mention);
  
  // Auto-subscribe both parties to context if provided
  if (context) {
    if (!data.subscriptions[context]) {
      data.subscriptions[context] = [];
    }
    if (!data.subscriptions[context].includes(from)) {
      data.subscriptions[context].push(from);
    }
    if (!data.subscriptions[context].includes(to)) {
      data.subscriptions[context].push(to);
    }
  }
  
  saveMentions(data);
  
  console.log(`✅ Mention created: @${to} from @${from}`);
  console.log(`   "${content}"`);
  if (context) console.log(`   Context: ${context}`);
  
  return mention;
}

function listPending(agent = null) {
  const data = loadMentions();
  const pending = data.mentions.filter(m => 
    !m.delivered && (agent ? m.to === agent || m.to === 'all' : true)
  );
  
  if (pending.length === 0) {
    console.log('No pending mentions.');
    return [];
  }
  
  console.log(`📬 ${pending.length} pending mention(s):`);
  pending.forEach(m => {
    console.log(`  @${m.to} from @${m.from}: "${m.content}"`);
  });
  
  return pending;
}

function markDelivered(mentionId) {
  const data = loadMentions();
  const mention = data.mentions.find(m => m.id === mentionId);
  if (mention) {
    mention.delivered = true;
    mention.deliveredAt = new Date().toISOString();
    saveMentions(data);
    console.log(`✅ Marked delivered: ${mentionId}`);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listPending(args[1]);
} else if (command === 'deliver') {
  markDelivered(args[1]);
} else if (args.length >= 3) {
  createMention(args[0], args[1], args[2], args[3]);
} else {
  console.log('Usage:');
  console.log('  node mention.js <from> <to> <message> [context]');
  console.log('  node mention.js list [agent]');
  console.log('  node mention.js deliver <mention-id>');
}
