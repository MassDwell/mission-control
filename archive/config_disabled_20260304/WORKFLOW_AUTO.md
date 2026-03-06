# WORKFLOW_AUTO.md - Automation Protocols

_Rules and logic for automated systems. Read this after compaction to restore automation behavior._

---

## 🤖 MassDwell Sales Bot

### Pipeline Stage IDs
```
Cold Stages (bot emails these):
- 88661695: Initial Contact
- 94100935: Follow-Up Sequence 1
- 86738631: Follow-Up Sequence 2
- 86738627: Follow-Up Sequence 3
- 97920535: Re-engagement
- 93011343: Long-term Nurture

Stop Stages (bot skips these):
- 86738635: Conversation Started (manual follow-up)
- 66451842: Future Contact (not ready, stop emailing)
- Negotiation+: All advanced stages (human-only)
```

### Auto-Advance Rules
**When leads reply to bot emails:**
- FROM: Any cold stage (88661695, 94100935, 86738631, 86738627, 97920535, 93011343)
- TO: 86738635 (Conversation Started)
- RESULT: Bot stops emailing, human takes over

**When leads say "just researching":**
- Detection: "just researching", "not ready", "not doing anything", "maybe in the future"
- TO: 66451842 (Future Contact)
- RESULT: Bot stops emailing, lead archived for future re-engagement

### Email Personalization
- Validate first_name is NOT numeric (reject IDs like "2162980874529785")
- If invalid: Use "Hi," (with comma, no name)
- Never use placeholders like {{first_name}}

### Tracking
- File: `~/.openclaw/workspace/data/sales_replied_messages.json`
- Window: 7 days (older entries auto-pruned)
- Format: `{ "message_id": "gmail_id", "timestamp": "ISO8601", "lead_id": "kommo_id" }`

### Scripts
- **Auto-engage:** `scripts/sales_bot_auto_engage.py` (hourly cron)
- **Reply monitor:** `scripts/sales_bot_reply_monitor.py` (hourly cron)

### SOP Reference
- Full workflow: `data/massdwell/sales/SALES-BOT-REPLY-WORKFLOW.md`
- Email templates: `data/massdwell/sales/email-templates/`
- Objection handling: `data/massdwell/sales/OBJECTION-HANDLING-RULES.md`

---

## 🔧 Atlantic Laser Prospecting

### Schedule
- **Runs:** 9 AM, 1 PM, 5 PM daily (3x/day)
- **Volume:** 15 emails per run = 45/day, 225/week, ~900/month
- **Source:** Pipedrive database (3,000+ fabrication/welding contacts)

### Deal Creation Policy
**CRITICAL RULE:** Bot NEVER creates Pipedrive deals
- Bot sends cold emails only
- Bot monitors responses
- Bot ALERTS Steve when prospects reply
- Steve manually reviews and creates deals for qualified prospects

### Scripts
- **Prospector:** `scripts/atlantic_laser_prospector.py`
- **Response handler:** `scripts/atlantic_laser_response_handler.py`
- **Gmail wrapper:** `scripts/atlantic_laser_gmail_handler.py`
- **Pipedrive integration:** `scripts/atlantic_laser_pipedrive_prospector.py`

### Tracking
- **Contacted log:** `data/atlantic-laser/prospects/pipedrive-contacted.json`
- **Daily logs:** `data/atlantic-laser/prospects/daily-log-YYYY-MM-DD.md`

### Email Account
- **Address:** team@atlanticlasersolutions.com
- **Token:** `credentials/google/gmail-token-atlantic-laser.json`
- **OAuth creds:** `credentials/google/atlantic-laser-oauth-credentials.json`

---

## 📧 Gmail Token Management

### Auto-Refresh Protocol
- **Frequency:** Every 30 minutes (cron)
- **Script:** `credentials/google/refresh-all-tokens.js`
- **Accounts refreshed:**
  - vettoristeve@gmail.com → `gmail-token-steve.vettori.json`
  - sales@massdwell.com → `gmail-token-sales-fixed.json`
  - team@atlanticlasersolutions.com → `gmail-token-atlantic-laser.json`

### Token Failure Response
1. Attempt auto-refresh via script
2. If refresh fails: Alert Steve
3. Manual re-auth required (OAuth flow)

### Email Health Checks
- **Threshold:** <50 actions/24h = alert
- **Normal volume:** 400-500 actions/24h (MassDwell sales bot)
- **Check frequency:** Every 2 hours (cron)

---

## 📊 Morning/Evening Briefings

### Morning Briefing (7:00 AM)
- **Script:** `scripts/massdwell-morning-briefing-consolidated.py` (if exists)
- **Fallback:** `scripts/send-team-briefing.js`
- **Contents:**
  - New leads (last 24h)
  - Hot pipeline updates
  - Scheduled calls/site visits
  - Outstanding follow-ups

### Evening Briefing (7:00 PM)
- **Script:** `scripts/massdwell-evening-briefing-consolidated.py` (if exists)
- **Contents:**
  - Day's activity summary
  - Qualified leads
  - Lost leads (with reasons)
  - Tomorrow's schedule

---

## 💰 Money Printer Trading (INACTIVE)

### Platform
- **Exchange:** Alpaca Paper Trading
- **Account:** $100,000 equity
- **Mode:** DEFENSIVE (tight 2-3% stop-losses, risk-off bias)

### Schedule (when active)
- **Frequency:** Every 5 min during market hours (9:30 AM - 4 PM EST, weekdays)
- **Script:** `trading/alpaca-trader.js`
- **Credentials:** `credentials/alpaca-paper-credentials.json`

### Current Status
⚠️ **INFRASTRUCTURE MISSING** - Scripts lost during compaction
- Need rebuild before reactivation
- Cron job exists but fails (no script to run)

---

## 🔄 Cron Job Protocols

### Failed Cron Response
1. Check if script exists on filesystem
2. If missing: Check daily logs for last successful run
3. Determine if infrastructure lost (compaction) or script intentionally removed
4. Alert Steve if business-critical system down

### Cron Export
- **Schedule:** Every 2 hours
- **Script:** Mission Control cron exporter
- **Output:** `data/crons.json`
- **Repo:** Auto-commit to MassDwell/mission-control

---

## 🚨 Alert Thresholds

### Sales Bot
- **No emails sent in 24h:** ALERT (bot stuck)
- **Gmail API 401 errors:** Auto-refresh tokens, alert if fails
- **Reply detection = 0 for 48h:** Check inbox manually

### Atlantic Laser
- **Prospect response:** Immediate Telegram notification to Steve
- **No emails sent in run:** Log warning (may be out of prospects)

### System
- **Compaction frequency >1/hour:** Investigate token usage
- **WORKING.md >500 lines:** Cleanup needed
- **Memory files missing post-compaction:** Read error alerts

---

## 📝 Logging Standards

### Real-Time Logging (Write immediately)
- Trade entries/exits → `memory/WORKING.md` + daily log
- API auth changes → `memory/WORKING.md`
- System failures → daily log
- Customer replies → daily log

### Batch Logging (End of day)
- Sales bot engagement stats → daily log
- Cron job summaries → daily log
- Completed tasks → daily log

### Archive Protocol
- Daily logs: Keep 30 days, then compress
- WORKING.md: Clean weekly (move to daily logs)
- MEMORY.md: Review monthly, consolidate lessons

---

_Last updated: 2026-03-03_
