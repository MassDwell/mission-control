#!/usr/bin/env node

/**
 * Daily Sales Report Generator
 * Summarizes leads, pipeline movement, and system health
 */

const fs = require('fs');
const path = require('path');

class DailySalesReportGenerator {
  constructor() {
    this.emailLogPath = 'data/massdwell/sales/email-processing-log.json';
    this.syncLogPath = 'data/massdwell/sales/email-kommo-sync.json';
    this.followupLogPath = 'data/massdwell/sales/followup-log.json';
    this.dncListPath = 'data/massdwell/sales/do-not-contact-list.json';
    this.reportPath = 'data/massdwell/sales/daily-report.json';
  }

  loadLog(path) {
    try {
      return JSON.parse(fs.readFileSync(path));
    } catch {
      return null;
    }
  }

  generateReport() {
    const emailLog = this.loadLog(this.emailLogPath);
    const syncLog = this.loadLog(this.syncLogPath);
    const followupLog = this.loadLog(this.followupLogPath);
    const dncList = this.loadLog(this.dncListPath);

    const today = new Date().toISOString().split('T')[0];
    const todayEmails = emailLog?.emails?.filter(e => e.timestamp?.startsWith(today)) || [];
    const todayFollowups = followupLog?.followups?.filter(f => f.timestamp?.startsWith(today)) || [];
    const todaySyncs = syncLog?.syncs?.filter(s => s.timestamp?.startsWith(today)) || [];

    // Calculate stats
    const stats = {
      date: today,
      timestamp: new Date().toISOString(),
      email_system: {
        total_processed: todayEmails.length,
        sales_leads: todayEmails.filter(e => e.intent === 'SALES_LEAD').length,
        support: todayEmails.filter(e => e.intent === 'CUSTOMER_SUPPORT').length,
        vendor: todayEmails.filter(e => e.intent === 'VENDOR').length,
        finance_legal: todayEmails.filter(e => e.intent === 'FINANCE_OR_LEGAL').length,
        marketing: todayEmails.filter(e => e.intent === 'NEWSLETTER_OR_MARKETING').length,
        avg_response_priority: this.calculateAvgPriority(todayEmails)
      },
      pipeline: {
        new_deals_created: todaySyncs.length,
        businesses_touched: [...new Set(todaySyncs.map(s => s.business))],
        massdwell_leads: todaySyncs.filter(s => s.business === 'MassDwell').length,
        atlantic_laser_leads: todaySyncs.filter(s => s.business === 'Atlantic Laser').length
      },
      follow_ups: {
        sent_today: todayFollowups.filter(f => f.status === 'sent').length,
        by_wave: {
          wave_1_day3: todayFollowups.filter(f => f.days === 3).length,
          wave_2_day10: todayFollowups.filter(f => f.days === 10).length,
          wave_3_day30: todayFollowups.filter(f => f.days === 30).length
        }
      },
      compliance: {
        do_not_contact_respected: dncList?.contacts?.length || 0,
        total_blocked_emails: 0
      },
      health_score: this.calculateHealthScore({
        processed: todayEmails.length,
        leads: todayEmails.filter(e => e.intent === 'SALES_LEAD').length,
        followups: todayFollowups.filter(f => f.status === 'sent').length,
        syncs: todaySyncs.length
      })
    };

    return stats;
  }

  calculateAvgPriority(emails) {
    if (!emails.length) return 'N/A';
    const priorityValues = { 'P0': 3, 'P1': 2, 'P2': 1 };
    const avg = emails.reduce((sum, e) => sum + (priorityValues[e.priority] || 0), 0) / emails.length;
    return avg >= 2.5 ? 'P0 (Urgent)' : avg >= 1.5 ? 'P1 (Today)' : 'P2 (Informational)';
  }

  calculateHealthScore(stats) {
    let score = 50;

    // Email volume bonus
    if (stats.processed >= 10) score += 15;
    else if (stats.processed >= 5) score += 10;

    // Lead capture bonus
    if (stats.leads >= 3) score += 15;
    else if (stats.leads >= 1) score += 10;

    // Pipeline movement bonus
    if (stats.syncs >= 2) score += 10;
    else if (stats.syncs >= 1) score += 5;

    // Follow-up cadence bonus
    if (stats.followups >= 5) score += 10;
    else if (stats.followups >= 2) score += 5;

    return Math.min(100, score);
  }

  formatReportForDisplay(stats) {
    const report = `
╔════════════════════════════════════════════════════════════════╗
║                     DAILY SALES REPORT                         ║
║                    ${stats.date}                          ║
╚════════════════════════════════════════════════════════════════╝

📧 EMAIL PROCESSING
   Total Processed:        ${stats.email_system.total_processed}
   ├─ Sales Leads:        ${stats.email_system.sales_leads}
   ├─ Support:            ${stats.email_system.support}
   ├─ Vendor:             ${stats.email_system.vendor}
   ├─ Finance/Legal:      ${stats.email_system.finance_legal}
   └─ Marketing:          ${stats.email_system.marketing}
   Average Priority:      ${stats.email_system.avg_response_priority}

🔄 PIPELINE MOVEMENT
   New Deals Created:     ${stats.pipeline.new_deals_created}
   MassDwell Leads:       ${stats.pipeline.massdwell_leads}
   Atlantic Laser Leads:  ${stats.pipeline.atlantic_laser_leads}

📬 FOLLOW-UP CADENCE
   Sent Today:            ${stats.follow_ups.sent_today}
   ├─ Day 3 Follow-ups:   ${stats.follow_ups.by_wave.wave_1_day3}
   ├─ Day 10 Follow-ups:  ${stats.follow_ups.by_wave.wave_2_day10}
   └─ Day 30 Follow-ups:  ${stats.follow_ups.by_wave.wave_3_day30}

✅ COMPLIANCE
   Do-Not-Contact List:   ${stats.compliance.do_not_contact_respected} contacts
   Blocked Emails:        ${stats.compliance.total_blocked_emails}

🎯 HEALTH SCORE: ${stats.health_score}/100 ${this.getHealthLabel(stats.health_score)}
`;
    return report;
  }

  getHealthLabel(score) {
    if (score >= 85) return '🟢 Excellent';
    if (score >= 70) return '🟡 Good';
    if (score >= 50) return '🟠 Fair';
    return '🔴 Poor';
  }

  saveReport(stats) {
    const dir = path.dirname(this.reportPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.reportPath, JSON.stringify(stats, null, 2));
  }

  run() {
    console.log('📊 GENERATING DAILY SALES REPORT');
    console.log('');

    const stats = this.generateReport();
    this.saveReport(stats);

    const formatted = this.formatReportForDisplay(stats);
    console.log(formatted);

    console.log(`\n✅ Report saved to: ${this.reportPath}`);
  }
}

if (require.main === module) {
  const generator = new DailySalesReportGenerator();
  generator.run();
}

module.exports = { DailySalesReportGenerator };
