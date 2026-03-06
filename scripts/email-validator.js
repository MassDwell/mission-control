#!/usr/bin/env node

/**
 * Email Validator for Lead Capture
 * Catches typos in email domains before they enter the system
 * 
 * Usage: node email-validator.js "test@gmail.con"
 */

const VALID_DOMAINS = {
  // Gmail variants
  'gmail.com': true,
  'googlemail.com': true,
  
  // Outlook/Microsoft
  'outlook.com': true,
  'hotmail.com': true,
  'live.com': true,
  'msn.com': true,
  
  // Yahoo
  'yahoo.com': true,
  'ymail.com': true,
  
  // AOL
  'aol.com': true,
  
  // Corporate domains (allow any)
  'comcast.net': true,
  'netzero.net': true,
  'verizon.net': true,
  
  // Custom domains (allow most)
};

const COMMON_TYPOS = {
  'gmail.con': 'gmail.com',
  'gmail.coms': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.coms': 'yahoo.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.coms': 'hotmail.com',
  'outlook.con': 'outlook.com',
  'outlook.coms': 'outlook.com',
};

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is empty' };
  }

  email = email.toLowerCase().trim();

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  const [, domain] = email.split('@');

  // Check for common typos
  if (COMMON_TYPOS[domain]) {
    return {
      valid: false,
      error: `Typo detected: "${domain}" → should be "${COMMON_TYPOS[domain]}"`,
      suggestion: email.replace(domain, COMMON_TYPOS[domain])
    };
  }

  // Check for obvious typos (ends with .coms, .con, .co, etc)
  if (domain.endsWith('.coms') || domain.endsWith('.con') || domain === domain.slice(0, -1)) {
    return {
      valid: false,
      error: `Domain looks suspicious: "${domain}"`,
      suggestion: domain.replace(/\.con$/, '.com').replace(/\.coms$/, '.com')
    };
  }

  // If it's a known domain, validate it
  if (VALID_DOMAINS[domain]) {
    return { valid: true };
  }

  // Unknown domains get a warning but pass (could be corporate)
  if (!domain.includes('test') && !domain.includes('example')) {
    return { valid: true, warning: `Unknown domain: ${domain} (manually verify)` };
  }

  return { valid: false, error: 'Test/example domain not allowed' };
}

// CLI usage
if (require.main === module) {
  const email = process.argv[2];
  const result = validateEmail(email);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

module.exports = { validateEmail };
