# MassDwell Address Capture Requirements

**Status:** ✅ ENFORCED  
**Date:** March 3, 2026  
**Purpose:** Ensure complete address data for all prospects

---

## Required Fields

For **every MassDwell prospect**, the following address fields MUST be captured:

| Field | Format | Example | Required |
|-------|--------|---------|----------|
| **street** | Street address | 123 Main St | ✅ Yes |
| **city** | City name | Boston | ✅ Yes |
| **state** | 2-letter state code | MA | ✅ Yes |
| **zip** | 5-digit ZIP code | 02101 | ✅ Yes |

---

## Data Structure

All prospects stored in tracking with this address structure:

```json
{
  "prospect_id": "kommo_12345",
  "email": "john.smith@email.com",
  "name": "John Smith",
  "address": {
    "street": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zip": "02101",
    "full": "123 Main St, Boston, MA 02101"
  }
}
```

**Note:** `full` address is auto-generated from component fields for email templates.

---

## Validation Logic

Before sending ANY email to a MassDwell prospect:

```javascript
function validateMasdwellAddress(prospect) {
  if (!prospect.address) return { valid: false };
  
  const required = ['street', 'city', 'state', 'zip'];
  const missing = required.filter(field => !prospect.address[field]);
  
  if (missing.length > 0) {
    // SKIP prospect until address is complete
    return { valid: false, error: `Missing: ${missing}` };
  }
  
  return { valid: true };
}
```

**Result:** Prospects with incomplete addresses are **SKIPPED** with error logged.

---

## Email Template Usage

Templates reference full address:

```
Subject: Quick question about ADU on {{property_address}}

Hi {{first_name}},

I noticed your property at {{property_address}} and thought of you...
```

**Where `{{property_address}}` = `street, city, state zip`**

Example output:
```
Subject: Quick question about ADU on 123 Main St, Boston, MA 02101

Hi John,

I noticed your property at 123 Main St, Boston, MA 02101 and thought of you...
```

---

## Kommo CRM Integration

When pulling prospects from Kommo CRM (stage 88661695):

1. **Map Kommo custom fields** to address structure:
   - Kommo `property_street` → address.street
   - Kommo `property_city` → address.city
   - Kommo `property_state` → address.state
   - Kommo `property_zip` → address.zip

2. **Validation step:** Before creating prospect record, check all 4 fields exist
   - If missing ANY field: Skip prospect, log warning
   - If all present: Create prospect record

3. **Auto-generate full address:**
   ```javascript
   address.full = `${address.street}, ${address.city}, ${address.state} ${address.zip}`
   ```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Prospect missing street | Skip, log: "Missing street address" |
| Prospect missing city | Skip, log: "Missing city" |
| Prospect missing state | Skip, log: "Missing state" |
| Prospect missing zip | Skip, log: "Missing zip" |
| All fields present | ✅ Send email |

---

## Tracking

All addresses are stored in:
`/Users/openclaw/.openclaw/workspace/data/massdwell/sales/email-prospecting-tracking.json`

Example:
```json
{
  "massdwell": {
    "conversations": [
      {
        "prospect_id": "kommo_789",
        "address": {
          "street": "456 Oak Ave",
          "city": "Cambridge",
          "state": "MA",
          "zip": "02139",
          "full": "456 Oak Ave, Cambridge, MA 02139"
        },
        "first_contact_sent": "2026-03-03"
      }
    ]
  }
}
```

---

## Why This Matters

1. **Personalization:** Specific address shows we researched their property
2. **Relevance:** Lot size + zoning varies by location → address confirms we're talking about right property
3. **Follow-up:** Complete address ensures we can reference property in future emails
4. **CRM sync:** Kommo deals need full address for internal tracking
5. **Data quality:** Garbage in = garbage out → validate upfront

---

## Checklist (Before Email Send)

- [ ] Street address present and valid
- [ ] City present and valid
- [ ] State is 2-letter code (MA, NY, CT, etc.)
- [ ] ZIP is 5-digit format
- [ ] Full address readable when concatenated
- [ ] Email template renders correctly with full address
- [ ] No special characters causing template breaks

---

**Enforcement:** STRICT — Any prospect missing address fields is skipped with error logging.
