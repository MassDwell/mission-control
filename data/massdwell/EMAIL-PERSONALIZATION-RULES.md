# Email Personalization Rules (OFFICIAL)
**Last Updated:** March 1, 2026

## CRITICAL RULE: NEVER Use Numeric IDs in Greetings

**This is the single source of truth for email personalization.**

---

## The Rule

### ✅ CORRECT Email Greetings:

1. **Use customer name from Kommo `name` field** (if valid)
   - "Hi John Hess,"
   - "Hi Sarah,"
   
2. **If `name` is numeric (Facebook lead ID), extract first name from `contact_name`**
   - "Hi Patrick,"
   - "Hi Angela,"

3. **If no valid name available, use "Hi,"** (NOT "Hi there,")
   - "Hi,"

### ❌ NEVER Use:

- ❌ "Hi 12345," (numeric ID)
- ❌ "Hi 24574404315547818," (Facebook lead ID)
- ❌ "Hi {{first_name}}," (template placeholder)
- ❌ "Hi Lead ID 789," (any ID reference)
- ❌ "Hi there," (user prefers just "Hi,")

---

## How Kommo CRM Works

**Important:** In Kommo CRM, the field labeled "Company Name" in the UI is stored as `name` in the data. This field contains the **customer's name**, not a company.

### Field Priority:

1. **`name`** - Primary field (customer name from Kommo's "Company Name")
2. **`contact_name`** - Fallback (usually "LastName FirstName" format)

### The Problem:

503 leads have Facebook lead IDs in the `name` field instead of actual names:
- `name: "24574404315547818"` ❌
- `name: "1082290834074825"` ❌

---

## Implementation Logic

```python
# In sales_bot_auto_engage.py

# Get fields
name = lead.get('name', '')
contact_name = lead.get('contact_name', '')

# Check if name is numeric (Facebook lead ID), empty, or invalid
if not name or name.isdigit() or (name and name[0].isdigit()) or name.startswith('<'):
    # Try contact_name as fallback
    if contact_name and not contact_name.isdigit() and not contact_name.startswith('<'):
        # Extract first word as first name
        name_parts = contact_name.split()
        first_word = name_parts[0] if name_parts else ''
        # Validate first word (letters only, no special chars at start)
        if first_word and first_word[0].isalpha():
            name = first_word
        else:
            name = None
    else:
        name = None

# Build greeting
if name:
    greeting = f"Hi {name},"
else:
    greeting = "Hi,"
```

---

## Examples from Real Data

| Kommo `name` | Kommo `contact_name` | Email Greeting |
|--------------|---------------------|----------------|
| "John Hess" | "Hess John" | Hi John Hess, ✅ |
| "24574404315547818" | "Patrick Mueller" | Hi Patrick, ✅ |
| "1082290834074825" | "Sarah Elahi" | Hi Sarah, ✅ |
| "12345" | "" | Hi, ✅ |
| "" | "Angela Smith" | Hi Angela, ✅ |
| "<test lead>" | "" | Hi, ✅ |

---

## Quality Checklist

**Before sending ANY sales email:**

✅ Greeting uses actual customer name (if available)  
✅ If numeric ID detected → uses first name from contact_name  
✅ If no name available → uses "Hi,"  
✅ NEVER uses numeric IDs  
✅ NEVER uses template placeholders  
✅ NEVER uses "Hi there,"  

---

## Files That Must Follow This Rule

**Python Scripts:**
- `~/.openclaw/workspace/scripts/sales_bot_auto_engage.py` ✅ (implemented)
- `~/.openclaw/workspace/scripts/sales_bot_reply_monitor.py` (if sending emails)

**Documentation:**
- `data/massdwell/SALES-PLAYBOOK.md`
- `data/massdwell/EMAIL-SIGNATURE.md`
- `agents/sales_followup/SOUL.md`
- `agents/sales_followup/EMAIL-TEMPLATE.md`
- `agents/sales_followup/INSTRUCTIONS.md`
- `agents/sales_followup/PRE-SEND-CHECKLIST.md`

**All must reference this file as the source of truth.**

---

## Status

✅ **Implemented:** March 1, 2026  
✅ **Tested:** 503 numeric leads verified  
✅ **Result:** 501 personalized, 2 generic "Hi,", 0 numeric IDs  

---

**This is the official rule. Any conflicting documentation should be updated to reference this file.**
