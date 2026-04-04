# MassDwell Address Capture — Requirement Enforced

**Date:** March 3, 2026 @ 18:35 EST  
**Owner:** Steve Vettori  
**Status:** ✅ IMPLEMENTED & ENFORCED

---

## The Requirement

For **every MassDwell prospect**, we capture FULL address:
- Street
- City
- State (2-letter code)
- ZIP (5-digit)

**Why:** Personalization, relevance, follow-up tracking, data quality.

---

## Implementation

### Data Structure
```json
{
  "address": {
    "street": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zip": "02101",
    "full": "123 Main St, Boston, MA 02101"
  }
}
```

### Validation
Before EVERY email send:
- Check all 4 fields exist
- If any missing → SKIP prospect + log error
- If all present → Generate `full` address + send email

### Email Template
Uses full address for personalization:
```
Subject: Quick question about ADU on {{property_address}}

Hi {{first_name}},

I noticed your property at {{property_address}} and thought of you...
```

---

## Files Updated

1. `data/massdwell/sales/email-prospecting-tracking.json` — Updated schema with address structure
2. `scripts/email-prospecting-engine.js` — Added `validateMasdwellAddress()` function
3. `data/massdwell/sales/email-templates/01-initial-contact-consultative.txt` — Updated to use full address
4. `data/massdwell/sales/ADDRESS-CAPTURE-REQUIREMENTS.md` — Complete documentation

---

## Kommo Integration

When pulling from Kommo CRM:
1. Query for street, city, state, zip custom fields
2. Validate all 4 fields present
3. Skip any prospect with missing address component
4. Log skipped prospects for manual review

---

## Standing Rule

**Going forward:** No MassDwell prospect email is sent without complete address data.
