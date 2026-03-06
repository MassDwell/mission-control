# Sales Bot - Reply Pipeline Automation

**Implemented:** March 2, 2026

## Rule 1: Auto-Advance to "Conversation Started"

**When a lead replies to outreach:**
1. **Move to "Conversation Started" stage** (status_id: 86738635)
2. **Stop automated follow-ups** (manual follow-up by Nick/Steve)
3. **Log their response** as note in Kommo

**Only advances from cold stages:**
- Incoming Leads (88661695)
- Welcome email sent (94100935)
- Follow-up 1 (86738631)
- Recycle follow-up (86738627)
- Recap emails (97920535)
- Future Contact (93011343)

**Skips advancement for leads already in:**
- Conversation Started (already there)
- Site Feasibility, Negotiation, Contract stages (too advanced)

---

## Rule 2: "Just Researching" → Future Contact

**When a prospect replies with signals that they're **not ready** to move forward:
- "Just researching"
- "Not doing anything right now"
- "Maybe in the future"
- "Not ready yet"
- "Just browsing"
- "Exploring options"
- "Down the road"
- "Preliminary research"

## Automatic Actions

1. **Classify as "researching" sentiment**
2. **Move lead to "Future Contact" stage in Kommo** (status_id: 66451842)
3. **STOP all email follow-ups** (sales bot will skip these leads)
4. **Log the response** as a note in Kommo

## Implementation

### Files Updated

**`scripts/sales_bot_reply_monitor.py`:**
- Added `researching` signals detection in `classify_sentiment()`
- Added `move_to_future_contact()` function
- When detected, moves lead and stops processing

**`scripts/sales_bot_auto_engage.py`:**
- Added Future Contact (66451842) to `skip_stages` list
- Bot will not send emails to leads in this stage

## Re-engagement

Leads in "Future Contact" stage should be:
- Re-contacted manually after 3-6 months
- Or moved back to active pipeline if they reach out again
- Never auto-engaged by sales bot

## Status IDs Reference

- **142, 143:** Closed/Lost (already skipped)
- **66451842:** Future Contact (now skipped)
- **86738635:** (added to skip list)
- **Active stages:** 86738623, 88661695, 94100935, 86738631, 86738627

## Testing

**Test Case 1: Normal Reply**
1. Lead in "Welcome email sent" stage replies: "Yes, interested!"
2. Should move to "Conversation Started" (86738635)
3. Sales bot stops emailing (Nick/Steve follow up manually)

**Test Case 2: "Just Researching" Reply**
1. Lead replies: "Just researching, not ready right now"
2. Should move to "Future Contact" (66451842)
3. Sales bot stops emailing
4. No auto-engagement for 3-6 months

**Test Case 3: Advanced Stage Reply**
1. Lead already in "Site Feasibility Booked" replies
2. Should NOT move (already advanced)
3. Just log the response
