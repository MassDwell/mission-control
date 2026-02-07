#!/usr/bin/env node
/**
 * Daily Intelligence Monitor
 * Monitors: Competitors, Lead Research, Modular Factory News, AI/Robotics
 * Run via cron or manually: node scripts/daily-intel-monitor.js [category]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/Users/openclaw/.openclaw/workspace';
const OUTPUT_DIR = path.join(WORKSPACE, 'data/intel');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Search queries by category
const MONITORS = {
  competitors: {
    name: 'ADU Competitor Monitor',
    searches: [
      'Millbrook ADU Massachusetts',
      'Boston ADU builders 2026',
      'Massachusetts modular ADU company',
      'Backyard ADU Massachusetts',
      'accessory dwelling unit Boston',
      '"ADU" "Massachusetts" site:instagram.com OR site:facebook.com'
    ],
    xAccounts: ['@MillbrookADU', '@BackyardADUs'],
    keywords: ['ADU', 'accessory dwelling', 'backyard cottage', 'granny flat', 'in-law suite']
  },
  leads: {
    name: 'Lead Research Monitor',
    searches: [
      'Massachusetts ADU zoning changes 2026',
      'Boston housing shortage ADU',
      'Newton MA ADU permit',
      'Needham MA accessory dwelling',
      'Wellesley MA zoning ADU',
      '"looking for ADU" Massachusetts',
      'multigenerational housing Massachusetts'
    ],
    keywords: ['zoning', 'permit', 'housing shortage', 'rental income', 'aging parents']
  },
  modular: {
    name: 'Modular Factory News',
    searches: [
      'modular construction news 2026',
      'prefab housing manufacturing',
      'factory-built homes news',
      'modular building industry',
      'offsite construction technology',
      'light gauge steel construction'
    ],
    sources: [
      'https://www.modularhomecoach.com/blog/',
      'https://www.constructiondive.com/topic/modular/',
      'https://www.bdcnetwork.com/modular-building'
    ],
    keywords: ['modular', 'prefab', 'factory-built', 'offsite', 'panelized']
  },
  ai_robotics: {
    name: 'AI & Robotics Daily Pulse',
    searches: [
      'artificial intelligence news today',
      'robotics breakthrough 2026',
      'AI startup funding',
      'OpenAI announcement',
      'Anthropic Claude news',
      'AI automation business',
      'robot manufacturing'
    ],
    xAccounts: ['@OpenAI', '@AnthropicAI', '@Google', '@elonmusk', '@sama'],
    sources: [
      'https://techcrunch.com/category/artificial-intelligence/',
      'https://www.theverge.com/ai-artificial-intelligence',
      'https://arstechnica.com/ai/'
    ],
    keywords: ['AI', 'LLM', 'GPT', 'Claude', 'robotics', 'automation', 'machine learning']
  }
};

async function runSearch(query) {
  try {
    const result = execSync(
      `curl -s "https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5" -H "X-Subscription-Token: BSAn1T3RQRmNOGGWqfSXPt-p44DBdLi"`,
      { encoding: 'utf8', timeout: 15000 }
    );
    return JSON.parse(result);
  } catch (e) {
    console.error(`Search failed for: ${query}`);
    return null;
  }
}

async function fetchUrl(url) {
  try {
    const result = execSync(
      `curl -s "${url}" | head -c 50000`,
      { encoding: 'utf8', timeout: 15000 }
    );
    return result;
  } catch (e) {
    return null;
  }
}

async function monitorCategory(category) {
  const config = MONITORS[category];
  if (!config) {
    console.error(`Unknown category: ${category}`);
    return null;
  }

  console.log(`\n📡 Running: ${config.name}`);
  
  const results = {
    category,
    name: config.name,
    timestamp: new Date().toISOString(),
    findings: []
  };

  // Run searches (with rate limiting)
  for (const query of config.searches) {
    console.log(`  Searching: ${query.substring(0, 50)}...`);
    const searchResult = await runSearch(query);
    
    if (searchResult?.web?.results) {
      for (const item of searchResult.web.results.slice(0, 3)) {
        results.findings.push({
          type: 'search',
          query,
          title: item.title,
          url: item.url,
          description: item.description,
          age: item.age || 'unknown'
        });
      }
    }
    
    // Rate limit: 1 request per second for Brave free tier
    await new Promise(r => setTimeout(r, 1100));
  }

  return results;
}

async function generateReport(category) {
  const results = await monitorCategory(category);
  if (!results) return;

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${category}-${dateStr}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Report saved: ${filepath}`);
  
  // Generate markdown summary
  let markdown = `# ${results.name}\n`;
  markdown += `**Date:** ${dateStr}\n\n`;
  markdown += `## Findings\n\n`;
  
  const seen = new Set();
  for (const finding of results.findings) {
    if (seen.has(finding.url)) continue;
    seen.add(finding.url);
    markdown += `### ${finding.title}\n`;
    markdown += `${finding.description}\n`;
    markdown += `🔗 ${finding.url}\n\n`;
  }
  
  const mdPath = path.join(OUTPUT_DIR, `${category}-${dateStr}.md`);
  fs.writeFileSync(mdPath, markdown);
  
  return { json: filepath, md: mdPath, count: seen.size };
}

async function runAll() {
  console.log('🔍 Daily Intelligence Monitor Starting...\n');
  
  const reports = [];
  for (const category of Object.keys(MONITORS)) {
    const report = await generateReport(category);
    if (report) reports.push({ category, ...report });
  }
  
  console.log('\n📊 Summary:');
  for (const r of reports) {
    console.log(`  ${r.category}: ${r.count} unique findings`);
  }
  
  return reports;
}

// Main
const category = process.argv[2];
if (category && category !== 'all') {
  generateReport(category).then(() => process.exit(0));
} else {
  runAll().then(() => process.exit(0));
}
