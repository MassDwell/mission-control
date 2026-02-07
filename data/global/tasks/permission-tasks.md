# Permission Tasks Queue

## Pending

### 1. Screen Recording Permission (Peekaboo)
**Priority:** High  
**App:** Terminal (or whichever terminal app runs OpenClaw)  
**Steps:**
1. Open **System Settings** → **Privacy & Security** → **Screen & System Audio Recording**
2. Enable access for Terminal application
3. Restart terminal session

**Why:** Peekaboo screenshot/screen capture tool needs this to function.

---

### 2. Peekaboo AI Provider Config
**Priority:** Medium  
**Steps:**
```bash
# Option A: Environment variables
export PEEKABOO_AI_PROVIDERS="openai/gpt-4,anthropic/claude-sonnet-4"
export OPENAI_API_KEY="your-key"

# Option B: Config file
peekaboo config init
```

---

## Completed

### ✅ Screen Recording Permission (Peekaboo)
**Completed:** 2025-02-02  
**Solution:** Added `/usr/local/bin/node` to Screen & System Audio Recording (not Terminal — OpenClaw runs as Node.js process directly)

### ✅ API Keys Stored
**Completed:** 2025-02-02  
**Location:** `.env.local`
- Nano Bots (Google AI)
- Google Local Places API
