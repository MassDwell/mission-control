#!/usr/bin/env node

/**
 * Sales Bot Email Validation Hook
 * Runs BEFORE lead entry to catch invalid/typo emails
 * 
 * Integrates with sales_bot_auto_engage.py
 */

const { validateEmail } = require('./email-validator.js');
const fs = require('fs');
const path = require('path');

class EmailValidationGate {
  constructor() {
    this.rejectionLog = path.join(__dirname, '../data/massdwell/sales/rejected-emails.json');
    this.loadRejectionLog();
  }

  loadRejectionLog() {
    try {
      if (fs.existsSync(this.rejectionLog)) {
        this.rejections = JSON.parse(fs.readFileSync(this.rejectionLog, 'utf-8'));
      } else {
        this.rejections = [];
      }
    } catch (e) {
      this.rejections = [];
    }
  }

  saveRejectionLog() {
    fs.writeFileSync(
      this.rejectionLog,
      JSON.stringify(this.rejections, null, 2)
    );
  }

  validateAndClean(email, contactName = '') {
    const validation = validateEmail(email);

    if (!validation.valid) {
      // Log rejection
      this.rejections.push({
        timestamp: new Date().toISOString(),
        originalEmail: email,
        contactName: contactName,
        reason: validation.error,
        suggestion: validation.suggestion || null
      });
      this.saveRejectionLog();

      return {
        valid: false,
        originalEmail: email,
        error: validation.error,
        suggestion: validation.suggestion,
        action: 'REJECT'
      };
    }

    if (validation.warning) {
      return {
        valid: true,
        originalEmail: email,
        warning: validation.warning,
        action: 'WARN_BUT_PROCEED'
      };
    }

    return {
      valid: true,
      originalEmail: email,
      action: 'ACCEPT'
    };
  }

  bulkValidate(leads) {
    /**
     * Validate array of leads
     * Returns: { accepted, rejected, warnings }
     */
    const results = {
      accepted: [],
      rejected: [],
      warnings: []
    };

    leads.forEach(lead => {
      const validation = this.validateAndClean(lead.email, lead.name);

      if (validation.valid && !validation.warning) {
        results.accepted.push(lead);
      } else if (validation.valid && validation.warning) {
        results.warnings.push({ ...lead, warning: validation.warning });
      } else {
        results.rejected.push({
          ...lead,
          rejectionReason: validation.error,
          suggestion: validation.suggestion
        });
      }
    });

    return results;
  }

  getStats() {
    return {
      totalRejections: this.rejections.length,
      recentRejections: this.rejections.slice(-10),
      commonErrors: this.getCommonErrors()
    };
  }

  getCommonErrors() {
    const errorCounts = {};
    this.rejections.forEach(r => {
      errorCounts[r.reason] = (errorCounts[r.reason] || 0) + 1;
    });
    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }
}

// CLI usage
if (require.main === module) {
  const gate = new EmailValidationGate();

  if (process.argv[2] === 'stats') {
    console.log(JSON.stringify(gate.getStats(), null, 2));
  } else if (process.argv[2]) {
    const email = process.argv[2];
    const name = process.argv[3] || '';
    const result = gate.validateAndClean(email, name);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Usage: node sales-bot-email-validation.js <email> [name]');
    console.log('       node sales-bot-email-validation.js stats');
  }
}

module.exports = { EmailValidationGate };
