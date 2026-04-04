#!/usr/bin/env node
/**
 * Atlantic Laser Solutions — Gmail → Pipedrive Lead Intake
 * 
 * PURPOSE:
 *   Scans vettoristeve@gmail.com inbox for Atlantic Laser inbound inquiries,
 *   deduplicates against existing Pipedrive deals, and creates new leads.
 *
 * GMAIL AUTH NOTE:
 *   Uses vettoristeve@gmail.com (default gog account, authenticated).
 *   steve@atlanticlasersolutions.com is NOT yet authenticated via gog.
 *   When steve@atlanticlasersolutions.com gmail is added (gog auth add), 
 *   update GMAIL_SEARCH_QUERY to use that account instead.
 *
 * USAGE:
 *   GOG_KEYRING_PASSWORD=openclaw123 node scripts/als-lead-intake.js [--dry-run]
 *   --dry-run: detect and log leads without writing to Pipedrive
 *
 * OUTPUT:
 *   Logs to stdout. Results appended to data/atlantic-laser/lead-intake-log.jsonl
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(process.env.HOME, '.openclaw/workspace');
const LOG_FILE = path.join(WORKSPACE, 'data/atlantic-laser/lead-intake-log.jsonl');
const STATE_FILE = path.join(WORKSPACE, 'data/atlantic-laser/lead-intake-state.json');

const DRY_RUN = process.argv.includes('--dry-run');
const GOG_ENV = { ...process.env, GOG_KEYRING_PASSWORD: process.env.GOG_KEYRING_PASSWORD || 'openclaw123' };

// ── Config ─────────────────────────────────────────────────────────────────

// Keywords that suggest an Atlantic Laser inquiry in personal Gmail
// (forwarded from atlanticlasersolutions.com contact form, direct emails, etc.)
const ALS_KEYWORDS = [
  'atlantic laser',
  'laser welder',
  'laser welding',
  'theo laser',
  'ma1',
  'handheld laser',
  'fiber laser',
  'atlanticlasersolutions',
  'laser machine inquiry',
  'welding machine'
];

// Pipedrive config
const PIPEDRIVE_TOKEN = (() => {
  try {
    return JSON.parse(fs.readFileSync(
      path.join(WORKSPACE, 'credentials/pipedrive/api-token.json'), 'utf8'
    )).api_token;
  } catch (e) {
    console.error('ERROR: Could not read Pipedrive token:', e.message);
    process.exit(1);
  }
})();

const PIPEDRIVE_PIPELINE_ID = 1; // Atlantic Laser Pipeline
const PIPEDRIVE_STAGE_ID = 1;    // New Lead
const PIPEDRIVE_BASE = 'api.pipedrive.com';

// ── Gmail Query ─────────────────────────────────────────────────────────────

// Build query: look for ALS-related emails in last 30 days, not already processed
const LOOKBACK_DAYS = 30;
const GMAIL_SEARCH_QUERY = `(${ALS_KEYWORDS.slice(0,4).map(k => `"${k}"`).join(' OR ')}) newer_than:${LOOKBACK_DAYS}d in:inbox OR in:sent`;

// ── Helpers ─────────────────────────────────────────────────────────────────

function pipedrive(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: PIPEDRIVE_BASE,
      path: `/v1${path}?api_token=${PIPEDRIVE_TOKEN}`,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { processedThreadIds: [], lastRun: null };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, lastRun: new Date().toISOString() }, null, 2));
}

function appendLog(entry) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n');
}

function gogSearch(query, limit = 50) {
  try {
    const result = execSync(
      `gog gmail search "${query.replace(/"/g, '\\"')}" --limit ${limit} --format json`,
      { env: GOG_ENV, encoding: 'utf8', timeout: 30000 }
    );
    return JSON.parse(result);
  } catch (e) {
    // gog may not have --format json; fall back to structured parse
    return [];
  }
}

function extractLeadFromEmail(email) {
  // Extract contact info from email subject/body heuristics
  const subject = email.subject || '';
  const from = email.from || '';
  const body = email.snippet || '';

  // Parse name from From field: "John Smith <john@example.com>" or "john@example.com"
  const fromMatch = from.match(/^(.+?)\s*<(.+?)>/) || from.match(/(.+)/);
  const name = fromMatch ? (fromMatch[1] || fromMatch[2] || from).trim().replace(/"/g, '') : from;
  const emailAddr = fromMatch ? (fromMatch[2] || fromMatch[1] || from) : from;

  // Determine likely product interest from subject/body
  let productInterest = 'General Inquiry';
  const combined = (subject + ' ' + body).toLowerCase();
  if (combined.includes('ma1-35') || combined.includes('800w')) productInterest = 'MA1-35 (800W)';
  else if (combined.includes('ma1-45') || combined.includes('1200w')) productInterest = 'MA1-45 (1200W)';
  else if (combined.includes('ma1-65') || combined.includes('1500w')) productInterest = 'MA1-65 (1500W)';
  else if (combined.includes('ultra') || combined.includes('ma1-ultra')) productInterest = 'MA1-Ultra';
  else if (combined.includes('enclosure') || combined.includes('safety')) productInterest = 'Safety Enclosure';
  else if (combined.includes('wire feeder')) productInterest = 'Wire Feeder';
  else if (combined.includes('quote') || combined.includes('pricing') || combined.includes('cost')) productInterest = 'Quote Request';

  return { name, email: emailAddr, subject, productInterest, rawFrom: from, snippet: body.slice(0, 200) };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== ALS Lead Intake ${DRY_RUN ? '[DRY RUN] ' : ''}=== ${new Date().toISOString()}`);

  const state = loadState();
  console.log(`Previously processed threads: ${state.processedThreadIds.length}`);

  // Fetch existing Pipedrive deals to dedup by email/name
  console.log('\nFetching existing Pipedrive deals for dedup...');
  const dealsResp = await pipedrive('GET', `/deals?status=all_not_deleted&limit=500`);
  const existingDeals = (dealsResp.data || []);
  const existingTitles = new Set(existingDeals.map(d => d.title?.toLowerCase().trim()));
  console.log(`Existing deals: ${existingDeals.length}`);

  // Search Gmail
  console.log(`\nSearching Gmail for ALS inquiries...`);
  console.log(`Query: ${GMAIL_SEARCH_QUERY}`);

  let emails = [];
  try {
    // Use gog gmail search (plain text output, parse it)
    const raw = execSync(
      `gog gmail search "${GMAIL_SEARCH_QUERY.replace(/"/g, '\\"')}" --limit 50`,
      { env: GOG_ENV, encoding: 'utf8', timeout: 30000 }
    );
    // Parse gog tabular output: ID DATE FROM SUBJECT LABELS THREAD
    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('ID'));
    for (const line of lines) {
      const parts = line.trim().split(/\s{2,}/);
      if (parts.length >= 4) {
        emails.push({
          id: parts[0],
          date: parts[1],
          from: parts[2],
          subject: parts[3],
          labels: parts[4] || '',
          snippet: ''
        });
      }
    }
    console.log(`Found ${emails.length} matching emails`);
  } catch (e) {
    console.error('Gmail search failed:', e.message);
    appendLog({ event: 'error', phase: 'gmail_search', error: e.message });
    return;
  }

  // Filter out already processed
  const newEmails = emails.filter(e => !state.processedThreadIds.includes(e.id));
  console.log(`New (unprocessed) emails: ${newEmails.length}`);

  let created = 0;
  let skipped = 0;

  for (const email of newEmails) {
    const lead = extractLeadFromEmail(email);

    // Skip our own sent emails
    if (email.labels?.includes('SENT') && !email.labels?.includes('INBOX')) {
      console.log(`  SKIP (sent): ${email.subject}`);
      state.processedThreadIds.push(email.id);
      continue;
    }

    // Dedup: check if a deal with similar name/subject already exists
    const dealTitle = `${lead.name} — ${lead.productInterest}`;
    const titleKey = dealTitle.toLowerCase().trim();
    const nameKey = lead.name.toLowerCase().trim();

    if (existingTitles.has(titleKey) || existingTitles.has(nameKey)) {
      console.log(`  SKIP (exists in Pipedrive): ${dealTitle}`);
      skipped++;
      state.processedThreadIds.push(email.id);
      continue;
    }

    console.log(`\n  NEW LEAD: ${dealTitle}`);
    console.log(`    From: ${lead.email}`);
    console.log(`    Subject: ${lead.subject}`);
    console.log(`    Product Interest: ${lead.productInterest}`);
    console.log(`    Date: ${email.date}`);

    if (!DRY_RUN) {
      try {
        // Find or create person in Pipedrive
        const personResp = await pipedrive('POST', '/persons', {
          name: lead.name,
          email: [{ value: lead.email, primary: true }]
        });
        const personId = personResp.data?.id;

        // Create deal
        const dealResp = await pipedrive('POST', '/deals', {
          title: dealTitle,
          pipeline_id: PIPEDRIVE_PIPELINE_ID,
          stage_id: PIPEDRIVE_STAGE_ID,
          person_id: personId,
          status: 'open'
        });

        if (dealResp.success) {
          console.log(`    ✅ Created Pipedrive deal #${dealResp.data.id}`);
          created++;

          // Add note with email context
          await pipedrive('POST', '/notes', {
            content: `Inbound email detected by ALS Lead Intake (auto)\n\nFrom: ${lead.rawFrom}\nDate: ${email.date}\nSubject: ${lead.subject}\nSnippet: ${lead.snippet}\n\nAuto-created from Gmail scan. Review and update with call notes.`,
            deal_id: dealResp.data.id
          });

          appendLog({ event: 'lead_created', dealTitle, dealId: dealResp.data.id, lead, emailId: email.id });
          existingTitles.add(titleKey);
        } else {
          console.log(`    ❌ Pipedrive create failed:`, dealResp.error);
          appendLog({ event: 'error', phase: 'pipedrive_create', error: dealResp.error, lead });
        }
      } catch (e) {
        console.error(`    ERROR creating deal:`, e.message);
        appendLog({ event: 'error', phase: 'deal_create_exception', error: e.message, lead });
      }
    } else {
      console.log(`    [DRY RUN] Would create Pipedrive deal: "${dealTitle}"`);
      appendLog({ event: 'dry_run_lead_detected', dealTitle, lead, emailId: email.id });
      created++;
    }

    state.processedThreadIds.push(email.id);
  }

  // Keep state manageable (last 500 thread IDs)
  if (state.processedThreadIds.length > 500) {
    state.processedThreadIds = state.processedThreadIds.slice(-500);
  }

  saveState(state);

  console.log(`\n=== SUMMARY ===`);
  console.log(`  New leads ${DRY_RUN ? 'detected' : 'created'}: ${created}`);
  console.log(`  Skipped (dedup): ${skipped}`);
  console.log(`  Log: ${LOG_FILE}`);
  console.log(`  State: ${STATE_FILE}`);

  appendLog({ event: 'run_complete', created, skipped, dryRun: DRY_RUN });
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
