# Sales Email SOP - MANDATORY READ BEFORE EVERY EMAIL

---

## 🚨 OFFICIAL EMAIL PERSONALIZATION RULE

**SEE:** `EMAIL-PERSONALIZATION-RULES.md` (single source of truth)

**Quick Summary:**
- Use customer name from Kommo `name` field
- If numeric ID (Facebook lead) → extract first name from `contact_name`
- If no valid name → use "Hi,"
- ❌ NEVER use numeric IDs in greetings

---

**CRITICAL RULES - NEVER BREAK THESE:**

## 1. PERSONALIZATION - NO IDS!

**This section is deprecated. See EMAIL-PERSONALIZATION-RULES.md for current implementation.**

**Example:**
```
❌ WRONG: "Hi 12345, Thanks for your interest..."
❌ WRONG: "Hi {{first_name}}, Thanks for your interest..."
✅ CORRECT: "Hi Sarah, Thanks for your interest..."
✅ CORRECT: "Hi, Thanks for your interest..."
```

## 2. EMAIL SIGNATURE - EXACT FORMAT

**Use this signature EXACTLY:**

```
Best regards,
MassDwell Team

---
Want to speak directly with a sales rep?
Call or text: (781) 531-8593

MassDwell | Factory-Built ADUs for Massachusetts
massdwell.com | sales@massdwell.com
```

**NO VARIATIONS. Copy this exactly.**

## 3. SUBJECT LINES - REQUIRED

**EVERY email must have a subject line:**
- Replies: "Re: [original subject]"
- New threads: Descriptive subject about their inquiry

**❌ NEVER send an email without a Subject header.**

## 4. PRE-SEND CHECKLIST

Before sending ANY email, verify:
- [ ] Greeting uses actual name or "Hi,"
- [ ] No ID numbers or placeholders visible
- [ ] Subject line is present
- [ ] Signature matches exact format above
- [ ] Email addresses the person's actual question
- [ ] Professional tone (not too salesy)

## 5. DATA SOURCE PRIORITY

**When personalizing, check in this order:**
1. CRM lead data (first_name, last_name, company)
2. Email "From" header (parse name from email)
3. Generic fallback: "Hi,"

**If lead data has ID or missing name:**
```python
# CORRECT approach:
name = lead.get('first_name', '').strip()
if not name or name.isdigit():
    greeting = "Hi,"
else:
    greeting = f"Hi {name},"
```

## 6. MATERIALS - NEVER MENTION

**❌ DO NOT mention:**
- AAC Steel
- Autoclaved aerated concrete
- Concrete (we don't use it)
- External manufacturing partners for framing

**✅ DO say:**
- "Light gauge steel framing fabricated in-house by MassDwell"
- "Factory-built with custom steel fabrication"
- "Energy-efficient, sustainable materials"

## 7. TONE & VOICE

- Professional yet warm
- Helpful expert, not pushy salesperson
- Answer their actual question
- Provide value in every email
- Clear next step (schedule call, send info, etc.)

---

**This SOP is MANDATORY. Read it before EVERY email send.**

**Violations = immediate escalation to Steve for review.**

---

## ⚠️ CRITICAL: Objection Handling

**NEVER accept these objections as final:**

1. **"Different aesthetic" / "More design forward"**
   - We do CUSTOM DESIGN
   - Catalog is just starting points
   - Offer: Call to discuss vision + 3D renderings

2. **"Too expensive"**
   - Financing options exist
   - Can value-engineer
   - Offer: Budget conversation

3. **"Not sure about timing"**
   - Planning now = ahead of the game
   - Prices may increase
   - Offer: Site evaluation

**See:** `OBJECTION-HANDLING-RULES.md` for full scripts

**The Rule: Always make ONE MORE OFFER before accepting no.**

