# Atlantic Laser - Pipedrive Deal Creation Policy

**Updated:** March 2, 2026 6:15 PM

---

## ⚠️ CRITICAL RULE

**DO NOT create Pipedrive deals for cold emails.**

**ONLY create deals when prospects respond.**

---

## Why This Matters

**Cold emails = Top of funnel**
- 15 emails/day = 300/month
- 95% won't respond
- Creating 300 deals/month = CRM pollution
- Hard to find real opportunities

**Responses = Qualified interest**
- Only 5-10% respond
- These are the real opportunities
- 15-30 deals/month = manageable
- Clean, focused pipeline

---

## New Workflow

### Morning (9 AM) - Send Cold Emails
```
1. Identify 20 prospects
2. Send 15 cold emails
3. Log to local database
4. ❌ NO Pipedrive deal creation
```

### Midday (1 PM) - Handle Responses
```
1. Check inbox for responses
2. Match responses to contacted prospects
3. ✅ CREATE Pipedrive deal (only now!)
4. Log response as activity
5. Move prospect to "responded" list
```

### Afternoon (5 PM) - Follow-ups
```
1. Check for more responses
2. Update deal stages
3. Schedule demos
4. EOD summary
```

---

## Scripts Updated

**`atlantic_laser_prospector.py`**
- Removed automatic deal creation from `send_cold_outreach()`
- Cold emails now ONLY send email + log locally
- No Pipedrive API calls during morning block

**`atlantic_laser_response_handler.py` (NEW)**
- Checks inbox for prospect responses
- Creates Pipedrive deal ONLY when they reply
- Logs response as activity in deal
- Moves prospect from "contacted" → "responded"

---

## Example Flow

**Day 1 - Morning:**
```
✅ Sent cold email to Boston Metal Fabrication
✅ Logged to local database
❌ NO Pipedrive deal created
```

**Day 2 - Midday:**
```
📧 Response received from Boston Metal Fabrication
   "Yes, interested in learning more about laser welding"
✅ Created Pipedrive deal: "Boston Metal Fabrication - Theo Laser Demo"
✅ Logged response as activity
✅ Moved to "responded" list
```

---

## Expected Results

**Before (wrong way):**
- 15 deals/day = 300/month
- 95% go nowhere
- CRM is cluttered
- Can't find real opportunities

**After (correct way):**
- 0-2 deals/day = 15-30/month
- 100% are interested prospects
- Clean CRM
- Easy to track real pipeline

---

## Monitoring

**Daily logs show:**
- Cold emails sent (15/day)
- Responses received (1-2/day avg)
- Deals created (only for responses)
- Pipeline health (quality > quantity)

**Pipedrive shows:**
- ONLY qualified leads
- Clean deal pipeline
- Real revenue opportunities
- Accurate forecasting

---

*Quality over quantity. Only track real opportunities.*
