/**
 * Shared Do-Not-Contact (DNC) enforcement module
 * ALL email-sending scripts MUST use this before sending.
 * 
 * Features:
 * - Case-insensitive matching
 * - Matches primary email AND alt_emails
 * - Logs all skips for audit trail
 * - Safe default: if DNC list fails to load, blocks ALL sends (fail-closed)
 */

const fs = require('fs');
const path = require('path');

const DNC_LIST_PATH = path.join(
  process.env.HOME || '/Users/openclaw',
  '.openclaw/workspace/data/massdwell/sales/do-not-contact-list.json'
);

let _cachedEmails = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60000; // Re-read file every 60s

/**
 * Load all DNC emails (primary + alt_emails), lowercased.
 * Returns Set<string> of blocked emails.
 * Throws on file read error (fail-closed).
 */
function loadDNCEmails() {
  const now = Date.now();
  if (_cachedEmails && (now - _cacheTime) < CACHE_TTL_MS) {
    return _cachedEmails;
  }

  if (!fs.existsSync(DNC_LIST_PATH)) {
    console.error(`🚨 DNC list not found at ${DNC_LIST_PATH} — BLOCKING ALL SENDS (fail-closed)`);
    return null; // null = fail-closed
  }

  const data = JSON.parse(fs.readFileSync(DNC_LIST_PATH, 'utf8'));
  const emails = new Set();

  for (const contact of (data.contacts || [])) {
    if (contact.email) emails.add(contact.email.toLowerCase().trim());
    if (Array.isArray(contact.alt_emails)) {
      for (const alt of contact.alt_emails) {
        emails.add(alt.toLowerCase().trim());
      }
    }
  }

  _cachedEmails = emails;
  _cacheTime = now;
  return emails;
}

/**
 * Check if an email is on the DNC list.
 * @param {string} email - Email to check
 * @param {string} [context] - Calling script name for logging
 * @returns {boolean} true if blocked (DO NOT SEND)
 */
function isDNC(email, context = 'unknown') {
  if (!email) return true; // No email = don't send

  const dncEmails = loadDNCEmails();

  // Fail-closed: if list couldn't load, block everything
  if (dncEmails === null) {
    console.error(`🚨 [DNC:${context}] BLOCKING ${email} — DNC list failed to load (fail-closed)`);
    return true;
  }

  const normalized = email.toLowerCase().trim();
  if (dncEmails.has(normalized)) {
    console.log(`⏭️ [DNC:${context}] SKIPPING ${email} — on do-not-contact list`);
    return true;
  }

  return false;
}

/**
 * Filter an array of prospects/objects, removing DNC entries.
 * @param {Array} prospects - Array of objects with 'email' field
 * @param {string} [context] - Calling script name for logging
 * @returns {Array} Filtered array with DNC entries removed
 */
function filterDNC(prospects, context = 'unknown') {
  return prospects.filter(p => !isDNC(p.email, context));
}

module.exports = { isDNC, filterDNC, loadDNCEmails };
