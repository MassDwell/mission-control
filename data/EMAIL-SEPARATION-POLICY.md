# Email Separation Policy - MassDwell vs Atlantic Laser

**Date:** March 1, 2026  
**Status:** MANDATORY - NEVER VIOLATE

---

## 🚨 CRITICAL RULE: NO CROSS-CONTAMINATION

**MassDwell emails (sales@massdwell.com) can ONLY contact MassDwell prospects/customers.**

**Atlantic Laser emails (team@atlanticlasersolutions.com) can ONLY contact Atlantic Laser prospects/customers.**

**NEVER send emails from the wrong company to any contact.**

---

## Business Separation

### MassDwell
- **Email:** sales@massdwell.com
- **Product:** Modular ADUs (Accessory Dwelling Units)
- **Target Customer:** Homeowners, property owners, real estate investors
- **Geographic Focus:** Massachusetts
- **CRM:** ~~Kommo (massdwellcrm)~~ **[DEPRECATED - No CRM access as of 2026-03-04]** — Manual tracking only (local contact files)
- **Price Range:** $141,000 - $270,000

### Atlantic Laser Solutions
- **Email:** team@atlanticlasersolutions.com
- **Product:** Theo MA1 Series Laser Welding Equipment
- **Target Customer:** Fabrication shops, manufacturers, welding companies
- **Geographic Focus:** New England (6 states)
- **CRM:** Pipedrive
- **Price Range:** $15,000 - $35,000

---

## ⚠️ VALIDATION RULES (MANDATORY)

### Before Sending ANY Email:

**Step 1: Check sender email**
- If sending from sales@massdwell.com → Proceed to Step 2 (MassDwell check)
- If sending from team@atlanticlasersolutions.com → Proceed to Step 3 (Atlantic check)

**Step 2: MassDwell Email Check**
```
REQUIRED CHECKS:
✅ Contact is in MassDwell leads database (manual check — Kommo no longer accessible)
✅ Contact inquiry is about ADUs, housing, or real estate
✅ Contact is NOT in Atlantic Laser prospect/customer list
✅ Email content mentions MassDwell products (ADUs)

PROHIBITED:
❌ Sending to fabrication shops
❌ Sending to manufacturing companies
❌ Sending to welding businesses
❌ Sending to anyone in Atlantic Laser CRM
```

**Step 3: Atlantic Laser Email Check**
```
REQUIRED CHECKS:
✅ Contact is in Pipedrive CRM (Atlantic Laser prospects)
✅ Contact inquiry is about welding, fabrication, or manufacturing
✅ Contact is NOT in MassDwell leads database
✅ Email content mentions Atlantic Laser products (Theo MA1 series)

PROHIBITED:
❌ Sending to homeowners
❌ Sending to property investors
❌ Sending to real estate contacts
❌ Sending to anyone in MassDwell leads database
```

---

## 🔒 Contact Database Separation

### MassDwell Contacts
**Source:** ~~Kommo CRM~~ Local contact files (Kommo no longer accessible as of 2026-03-04)
**File:** `~/.openclaw/workspace/crm-dashboard/data/leads.json`

**Contact Types:**
- Homeowners inquiring about ADUs
- Property owners interested in rental income
- Real estate investors
- Individuals from Meta ads, website forms

### Atlantic Laser Contacts
**Source:** Pipedrive CRM (when integrated)  
**File:** `~/.openclaw/workspace/data/atlantic-laser/prospect-list.json`

**Contact Types:**
- Fabrication shops
- Manufacturing facilities
- Welding companies
- Metal working businesses

---

## 🚫 Cross-Contamination Prevention

### Scenario 1: Contact Exists in BOTH Databases
**Rule:** Use the ORIGINAL inquiry context

**Example:**
- Contact inquired about ADUs → Use sales@massdwell.com ONLY
- Contact inquired about laser welding → Use team@atlanticlasersolutions.com ONLY

**If unclear:** Escalate to Steve, DO NOT send from either email

### Scenario 2: Cold Prospecting
**MassDwell:**
- Only prospect homeowners, property owners
- Only target residential real estate context
- Use Meta ads, Google ads, real estate channels

**Atlantic Laser:**
- Only prospect businesses (fabrication shops, manufacturers)
- Only target commercial/industrial context
- Use LinkedIn, industry directories, trade shows

### Scenario 3: Referrals
**If MassDwell customer has welding business:**
- DO NOT automatically add to Atlantic Laser prospects
- Ask permission first: "Would you be interested in laser welding equipment info?"
- If yes → Add to Atlantic Laser CRM with note "Referred from MassDwell"

**If Atlantic Laser customer owns property:**
- DO NOT automatically add to MassDwell prospects
- Ask permission first: "Interested in ADU information for your property?"
- If yes → Add to MassDwell CRM with note "Referred from Atlantic Laser"

---

## 🛡️ Pre-Send Validation Script (Pseudocode)

```python
def validate_email_separation(sender_email, recipient_email, recipient_name, contact_context):
    """
    Validates email separation policy before sending.
    Returns: (can_send: bool, reason: str)
    """
    
    # Check sender
    if sender_email == "sales@massdwell.com":
        # MassDwell validation
        
        # Check if contact is in Atlantic Laser database
        if is_in_atlantic_laser_crm(recipient_email):
            return (False, "BLOCKED: Contact is Atlantic Laser prospect/customer")
        
        # Check if contact context is business/welding related
        if is_business_contact(contact_context) or is_welding_related(contact_context):
            return (False, "BLOCKED: Contact appears to be business/industrial (should use Atlantic Laser)")
        
        # Check if contact is in MassDwell CRM
        if not is_in_massdwell_leads(recipient_email):  # NOTE: is_in_kommo_crm deprecated 2026-03-04; use local leads file
            return (False, "WARNING: Contact not in MassDwell CRM - verify before sending")
        
        return (True, "OK: MassDwell email validated")
    
    elif sender_email == "team@atlanticlasersolutions.com":
        # Atlantic Laser validation
        
        # Check if contact is in MassDwell database
        if is_in_massdwell_leads(recipient_email):  # NOTE: is_in_kommo_crm deprecated 2026-03-04; use local leads file
            return (False, "BLOCKED: Contact is MassDwell prospect/customer")
        
        # Check if contact context is residential/homeowner related
        if is_homeowner_contact(contact_context) or is_residential_related(contact_context):
            return (False, "BLOCKED: Contact appears to be residential (should use MassDwell)")
        
        # Check if contact is fabrication/manufacturing business
        if not is_business_contact(contact_context):
            return (False, "WARNING: Contact doesn't appear to be fabrication/manufacturing business")
        
        return (True, "OK: Atlantic Laser email validated")
    
    else:
        return (False, "BLOCKED: Unknown sender email")
```

---

## 📋 Implementation Checklist

**MassDwell Sales Bot:**
- [ ] Read EMAIL-SEPARATION-POLICY.md before every email
- [ ] Verify contact is in MassDwell leads database (manual — Kommo no longer accessible)
- [ ] Verify contact is NOT in Atlantic Laser prospect list
- [ ] Verify inquiry context is residential/ADU-related
- [ ] Only send from sales@massdwell.com

**Atlantic Laser Sales Bot:**
- [ ] Read EMAIL-SEPARATION-POLICY.md before every email
- [ ] Verify contact is business/fabrication-related
- [ ] Verify contact is NOT in MassDwell leads database
- [ ] Verify inquiry context is welding/manufacturing-related
- [ ] Only send from team@atlanticlasersolutions.com

---

## 🚨 Violation Escalation

**If separation policy is violated:**

1. **STOP** - Do not send the email
2. **LOG** - Record the attempted violation with details
3. **ESCALATE** - Alert Steve immediately with:
   - Which email was about to be sent
   - To which contact
   - Why it violated the policy
   - Recommendation for correct action

**DO NOT GUESS - When in doubt, escalate to Steve**

---

## Examples

### ✅ CORRECT: MassDwell Email

**To:** john.homeowner@gmail.com (MassDwell leads, inquired about ADUs)
**From:** sales@massdwell.com
**Subject:** Your ADU Inquiry - MassDwell Options
**Status:** ✅ PASS - Residential contact, ADU inquiry, in MassDwell leads database

### ❌ WRONG: MassDwell Email to Business

**To:** info@precisionfab.com (fabrication shop)  
**From:** sales@massdwell.com  
**Subject:** Your ADU Inquiry  
**Status:** ❌ BLOCKED - Business contact, should use Atlantic Laser

### ✅ CORRECT: Atlantic Laser Email

**To:** shop@metalworks.com (fabrication shop, LinkedIn prospecting)  
**From:** team@atlanticlasersolutions.com  
**Subject:** Cut Welding Time by 75%  
**Status:** ✅ PASS - Business contact, welding-related, not in MassDwell CRM

### ❌ WRONG: Atlantic Laser Email to Homeowner

**To:** sarah.jones@gmail.com (MassDwell customer)
**From:** team@atlanticlasersolutions.com
**Subject:** Laser Welding Demo
**Status:** ❌ BLOCKED - Contact in MassDwell leads database, residential customer

---

## 🔑 Key Principle

**Each business has its own email, its own CRM, its own customers.**

**Never cross the streams.**

---

**Last Updated:** March 1, 2026  
**Enforcement:** MANDATORY for all sales bots  
**Violations:** Escalate to Steve immediately
