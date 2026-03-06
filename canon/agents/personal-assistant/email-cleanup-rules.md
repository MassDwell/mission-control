# EMAIL CLEANUP RULES — Personal Assistant

**Version:** 2.0.0  
**Date:** 2026-03-04  
**Target Inbox:** vettoristeve@gmail.com  

---

## AUTO-ARCHIVE DETECTION (Version 2.0)

### Rule Set: BULK & AUTO-GENERATED EMAILS

Auto-archive immediately if **ANY** of the following headers/values are present:

#### Rule 1: Precedence Header
```
Precedence: bulk
Precedence: list
Precedence: junk
```

#### Rule 2: Auto-Submitted Header
```
Auto-Submitted: auto-generated
Auto-Submitted: auto-replied
```

#### Rule 3: X-Auto-Response-Suppress Header
```
X-Auto-Response-Suppress: All
X-Auto-Response-Suppress: OOF
```

#### Rule 4: List-Id Header
```
List-Id: [any value present]
```

#### Rule 5: List-Unsubscribe Header (Original)
```
List-Unsubscribe: [header present]
```

#### Rule 6: Gmail Labels (Fallback)
```
Gmail promotional classification
```

#### Rule 7: Sender Domain Patterns
```
Sender address contains: newsletter, updates, no-reply, marketing
```

---

## SMART ARCHIVING LOGIC

### Check Contact Status BEFORE Archiving

**If email matches bulk headers AND sender is in one of these categories:**
- ✅ Known contacts (address book)
- ✅ VIP senders (manually defined)
- ✅ Previous correspondents (has reply history)

**Then:**
- ❌ Do NOT archive
- ✅ Classify as "FYI" instead
- ✅ Include in briefing under "FYI" section

### Decision Tree

```
Email arrives
  ↓
Check raw headers for bulk/auto-generated rules
  ↓
  ├─ Match found? (Rule 1-7)
  │  ├─ Check if sender in contacts/VIP/previous
  │  │  ├─ YES → Classify as FYI (briefing)
  │  │  └─ NO → Archive (don't brief)
  │  │
  └─ No match?
     ├─ Categorize: urgent / action-required / waiting / FYI
     └─ Flag if urgent or action-required
```

---

## DETECTION SEQUENCE (Per Run)

**Every 2-hour execution:**

1. **Scan Inbox** — Get all unread + recent emails
2. **Apply Rules 1-7** — Check raw message headers
3. **Check Contact Status** — VIP/contact/correspondent?
4. **Decide Action:**
   - Matches bulk + is known contact → Classify FYI
   - Matches bulk + NOT known contact → Archive
   - No match → Categorize (urgent/action/waiting/FYI)
5. **Flag & Count** — Flag urgent/action, count archived
6. **Briefing (8 AM, 1 PM, 6 PM only)** — Send summary to Clawson

---

## RULES SUMMARY TABLE

| Rule # | Header/Pattern | Match Value | Archive? | Precedence |
|--------|----------------|-------------|----------|-----------|
| 1 | Precedence | bulk, list, junk | YES* | Check contact first |
| 2 | Auto-Submitted | auto-generated, auto-replied | YES* | Check contact first |
| 3 | X-Auto-Response-Suppress | All, OOF | YES* | Check contact first |
| 4 | List-Id | [any value] | YES* | Check contact first |
| 5 | List-Unsubscribe | [header present] | YES* | Check contact first |
| 6 | Gmail Label | promotional | YES* | Check contact first |
| 7 | Sender Domain | newsletter, updates, no-reply, marketing | YES* | Check contact first |

*Archive only if sender NOT in contacts/VIP/previous correspondents

---

## SAFETY RULES (UNCHANGED)

```
❌ NEVER auto-reply to emails
❌ NEVER delete emails
❌ NEVER unsubscribe automatically
✅ ONLY archive low-priority bulk/marketing emails
✅ Never archive known contacts (even if bulk headers)
✅ Classify known contacts with bulk headers as FYI
```

---

## SAMPLE DECISION LOG

Example decisions from last run:

```
Email 1: AWS notifications
  From: noreply@aws.amazon.com
  Headers: Auto-Submitted: auto-generated
  Sender Status: Known contact (AWS account)
  Decision: CLASSIFY AS FYI (not archived, known contact)
  Rule Triggered: Auto-Submitted: auto-generated + contact check

Email 2: Mailchimp campaign
  From: campaign.notifier@mailchimp.com
  Headers: Precedence: bulk, List-Unsubscribe: [present]
  Sender Status: Not in contacts
  Decision: ARCHIVE
  Rule Triggered: Precedence: bulk

Email 3: GitHub notification
  From: noreply@github.com
  Headers: X-Auto-Response-Suppress: All
  Sender Status: Known contact (GitHub account)
  Decision: CLASSIFY AS FYI
  Rule Triggered: X-Auto-Response-Suppress: All + contact check

Email 4: Newsletter signup
  From: newsletter@example.com
  Headers: List-Id: [newsletter.example.com]
  Sender Status: Not in contacts
  Decision: ARCHIVE
  Rule Triggered: List-Id header present

Email 5: Personal email from John
  From: john@example.com
  Headers: [none of the bulk rules]
  Sender Status: Previous correspondent
  Decision: CATEGORIZE (urgent/action/waiting/FYI)
  Rule Triggered: No bulk rules, normal classification
```

---

## IMPLEMENTATION

### Header Inspection

Use raw message headers (not just subject/sender text):
```
From: [sender]
Precedence: [value]
Auto-Submitted: [value]
X-Auto-Response-Suppress: [value]
List-Id: [value]
List-Unsubscribe: [value]
X-Mailer: [value]
[other headers]
```

### Contact Lookup

Check sender email against:
1. Steve's Gmail contacts
2. Manually defined VIP senders
3. Email thread history (replied to before?)

### Categorization

If no bulk rules match:
- **Urgent:** From VIP/important contact, time-sensitive
- **Action Required:** Needs reply from Steve
- **Waiting:** Awaiting response, follow-up
- **FYI:** Informational, no action needed

---

## VERSION HISTORY

**v1.0.0** (Original)
- List-Unsubscribe header
- Gmail promotional label
- Sender domain patterns

**v2.0.0** (Current)
- Added: Precedence header
- Added: Auto-Submitted header
- Added: X-Auto-Response-Suppress header
- Added: List-Id header
- Enhanced: Smart contact checking before archiving
- Enhanced: Classify bulk-from-known-contacts as FYI

---

## NEXT REVIEW

- Date: 2026-03-11 (1 week)
- Check: False positive rate (archived important emails?)
- Check: False negative rate (marketing not archived?)
- Adjust rules if needed

---

_Last Updated: 2026-03-04 14:13 EST_
