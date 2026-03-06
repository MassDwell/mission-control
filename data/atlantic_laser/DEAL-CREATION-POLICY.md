# Atlantic Laser - Deal Creation Policy

**Updated:** March 2, 2026 6:10 PM

---

## 🚨 CRITICAL RULE

**THE BOT NEVER CREATES PIPEDRIVE DEALS. EVER.**

**Only Steve creates deals.**

---

## Bot's Job: Business Development

The bot handles **outbound prospecting** and **response tracking**:

1. **Send cold emails** (15/day from Pipedrive database)
2. **Track responses** (log who replied)
3. **Alert Steve** when prospects respond
4. **Provide context** (what they said, their company info)

That's it. No deal creation.

---

## Steve's Job: Deal Qualification

**Steve decides** if a response becomes a deal:

1. Reviews response
2. Evaluates if it's worth pursuing
3. **Manually creates Pipedrive deal** if qualified
4. Handles follow-up and closes

---

## Why This Matters

**Bot creating deals = Bad:**
- ❌ Cluttered CRM
- ❌ Fake pipeline
- ❌ Can't distinguish real opportunities
- ❌ No human judgment on lead quality

**Steve creating deals = Good:**
- ✅ Clean pipeline
- ✅ Only real opportunities tracked
- ✅ Human judgment on every deal
- ✅ Accurate revenue forecasting

---

## Workflow

### Day 1 - Bot Sends Email
```
✅ Cold email to Metalwerx (jon@metalwerx.com)
✅ Logged locally
✅ Marked as contacted in Pipedrive log
❌ NO Pipedrive deal created
```

### Day 2 - Prospect Responds
```
📧 Response received from Metalwerx
   "Yes, I'm interested in learning more about laser welding"
   
✅ Response logged to daily activity log
✅ Alert generated for Steve
✅ Context provided (company, email, message)
❌ NO Pipedrive deal created
```

### Day 3 - Steve Qualifies
```
Steve reviews response:
- Reads what they said
- Checks company size/fit
- Evaluates opportunity

If qualified:
  ✅ Steve manually creates Pipedrive deal
  ✅ Steve handles follow-up
  ✅ Deal moves through pipeline

If not qualified:
  ❌ No deal created
  ✅ Response archived
  ✅ Move on to next prospect
```

---

## Scripts Updated

**`atlantic_laser_prospector.py`**
- ❌ NO deal creation on cold emails

**`atlantic_laser_response_handler.py`**
- ❌ NO deal creation on responses
- ✅ Logs responses
- ✅ Alerts Steve
- ✅ Provides context

**`atlantic_laser_pipedrive.py`**
- Tool available for Steve to use manually
- Not called automatically by bot

---

## Bot Reports

**Daily log shows:**
```
📊 Morning Summary:
   • 15 cold emails sent
   • 2 responses received
   • 0 deals created (Steve decides)
   
📧 Responses to review:
   1. Metalwerx - "Interested in demo"
   2. Weld Kraft - "Tell me more about pricing"
```

**Steve then:**
1. Reads the responses
2. Decides which are worth pursuing
3. Creates deals manually in Pipedrive

---

## Benefits

✅ **Clean CRM** - Only real opportunities  
✅ **Human judgment** - Steve controls pipeline  
✅ **Accurate forecasting** - No fake deals  
✅ **Efficient prospecting** - Bot handles volume  
✅ **Smart qualification** - Human makes final call  

---

**The bot does business development. Steve does deal qualification.**

**Clear separation of responsibilities.**
