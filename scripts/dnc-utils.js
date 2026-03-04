/**
 * DNC (Do-Not-Contact) Utilities
 * Shared module for checking if contacts are on the do-not-contact list
 * Used by: email-prospecting-engine.js, massdwell-daily-send.js, etc.
 */

const fs = require('fs');

const DNC_LIST_PATH = '/Users/openclaw/.openclaw/workspace/data/massdwell/sales/do-not-contact-list.json';

let DNC_CACHE = null;
let DNC_CACHE_TIME = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load DNC list from disk (cached)
 */
function loadDNCList() {
  const now = Date.now();
  
  // Return cached if fresh
  if (DNC_CACHE && (now - DNC_CACHE_TIME) < CACHE_DURATION) {
    return DNC_CACHE;
  }

  try {
    if (!fs.existsSync(DNC_LIST_PATH)) {
      console.warn('⚠️  DNC_LIST file not found:', DNC_LIST_PATH);
      DNC_CACHE = { contacts: [] };
      return DNC_CACHE;
    }

    const data = JSON.parse(fs.readFileSync(DNC_LIST_PATH, 'utf8'));
    DNC_CACHE = data;
    DNC_CACHE_TIME = now;
    console.log(`✅ DNC list loaded (${data.contacts.length} contacts)`);
    return data;
  } catch (err) {
    console.error('❌ Error loading DNC list:', err.message);
    DNC_CACHE = { contacts: [] };
    return DNC_CACHE;
  }
}

/**
 * Check if an email is on the DNC list
 * Returns: { blocked: bool, reason: string, contact: object|null }
 */
function checkDNC(email) {
  const dncList = loadDNCList();
  const emailLower = email.toLowerCase().trim();
  
  for (const contact of dncList.contacts) {
    // Check primary email
    if (contact.email.toLowerCase() === emailLower) {
      return {
        blocked: true,
        reason: contact.reason || 'Do not contact',
        contact: contact
      };
    }

    // Check alt emails if present
    if (contact.alt_emails && Array.isArray(contact.alt_emails)) {
      for (const altEmail of contact.alt_emails) {
        if (altEmail.toLowerCase() === emailLower) {
          return {
            blocked: true,
            reason: contact.reason || 'Do not contact (alt email)',
            contact: contact
          };
        }
      }
    }
  }

  return {
    blocked: false,
    reason: null,
    contact: null
  };
}

/**
 * Check if a name is on the DNC list (for additional safety)
 * Matches against name and aliases
 */
function checkDNCByName(name) {
  const dncList = loadDNCList();
  const nameLower = name.toLowerCase().trim();
  
  for (const contact of dncList.contacts) {
    // Check primary name
    if (contact.name && contact.name.toLowerCase() === nameLower) {
      return {
        blocked: true,
        reason: contact.reason || 'Do not contact',
        contact: contact
      };
    }

    // Check aliases if present
    if (contact.aliases && Array.isArray(contact.aliases)) {
      for (const alias of contact.aliases) {
        if (alias.toLowerCase() === nameLower) {
          return {
            blocked: true,
            reason: contact.reason || 'Do not contact (alias)',
            contact: contact
          };
        }
      }
    }
  }

  return {
    blocked: false,
    reason: null,
    contact: null
  };
}

/**
 * Filter prospects/contacts removing DNC entries
 * Returns filtered array and logs skips
 */
function filterDNC(contacts, emailField = 'email', nameField = 'name') {
  const filtered = [];
  const skipped = [];

  for (const contact of contacts) {
    const email = contact[emailField];
    const name = contact[nameField];

    if (!email) {
      filtered.push(contact);
      continue;
    }

    const dncCheck = checkDNC(email);
    if (dncCheck.blocked) {
      console.log(`⏭️  SKIPPING ${email} - ${dncCheck.reason}`);
      skipped.push({ contact, reason: dncCheck.reason });
      continue;
    }

    // Also check by name if available
    if (name) {
      const dncCheckByName = checkDNCByName(name);
      if (dncCheckByName.blocked) {
        console.log(`⏭️  SKIPPING ${name} (${email}) - ${dncCheckByName.reason}`);
        skipped.push({ contact, reason: dncCheckByName.reason });
        continue;
      }
    }

    filtered.push(contact);
  }

  console.log(`   Filtered: ${filtered.length} allowed, ${skipped.length} DNC-blocked`);
  return { filtered, skipped };
}

/**
 * Validate a contact before sending (returns true if safe to send)
 */
function canEmail(email, name = null) {
  const dncCheck = checkDNC(email);
  if (dncCheck.blocked) {
    console.log(`⏭️  BLOCKED: ${email} - ${dncCheck.reason}`);
    return false;
  }

  if (name) {
    const dncCheckByName = checkDNCByName(name);
    if (dncCheckByName.blocked) {
      console.log(`⏭️  BLOCKED: ${name} (${email}) - ${dncCheckByName.reason}`);
      return false;
    }
  }

  return true;
}

/**
 * Get DNC list for auditing/compliance
 */
function getDNCList() {
  return loadDNCList();
}

module.exports = {
  loadDNCList,
  checkDNC,
  checkDNCByName,
  filterDNC,
  canEmail,
  getDNCList
};
