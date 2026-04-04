# Gemma Integration Architecture
_Created: 2026-04-02 | Status: CONSTRAINED — narrow utility role only_

---

## Decision Summary

**Gemma belongs in one narrow role: free structured extraction for batch/script workloads.**

It does NOT belong in:
- The main OpenClaw agent loop
- Model routing fallbacks
- Hermes (no model calls — stays pure JS)
- Any user-facing response path
- Agentic tasks (no tool support)
- Multimodal document parsing in DrawStack (Gemini handles that)

This was the conclusion after full system assessment. Gemma's real value is cost reduction on scripted classification and JSON extraction, not capability expansion.

---

## Confirmed Limitations (Tested 2026-04-02)

| Limitation | Impact |
|---|---|
| `system_instruction` unsupported (API 400) | All instructions go in user turn |
| No function/tool calling | Can't be used in agentic flows |
| Verbose on complex prompts | Use `extractJsonFromResponse()` in every caller |
| Vision unreliable for text-heavy documents | Don't replace Gemini on invoice/SOV/lien parsing |
| Rate limits on free tier | Not suitable for high-concurrency production routes |

---

## What Gemma Does (Approved)

| Task | Command | Notes |
|---|---|---|
| Text classification | `gemma-extract.js --task classify` | Works cleanly |
| JSON schema extraction | `gemma-extract.js --task extract_json` | Works with preamble strip |
| Batch pre-processing | Any Node script calling the API directly | Script-level only |

---

## What Gemma Does NOT Do (Prohibited)

- DrawStack invoice parse route — uses multimodal (Gemini keeps this)
- DrawStack photo analyze — requires vision on real images (Gemini keeps this)
- DrawStack lien waiver extract — PDF multimodal (Gemini keeps this)
- SOV ai-pdf route — PDF multimodal (Gemini keeps this)
- ai/chat route — conversational, needs system prompt (Gemini keeps this)
- Cost prediction — reasoning required (Gemini keeps this)
- Main Clawson session — tool use required, fallbacks must work (Gemini/Claude keep this)

---

## Config SSOT

**openclaw.json:** `models.providers.google.models` — Gemma registered as a provider model
**NOT in:** `agents.defaults.models` — explicitly excluded from agent allowlist
**NOT as alias:** No `/model gemma` shortcut in chat — prevents accidental routing

---

## Files

| File | Purpose |
|---|---|
| `scripts/gemma-extract.js` | Main utility — classify + extract_json tasks |
| `scripts/model-health-check.js` | Validates all AI providers (including Gemma) |
| `data/logs/gemma-extract.log` | Call log with latency, input/output sizes |
| `data/gemma/GEMMA-ARCHITECTURE.md` | This file — design decisions |

---

## Phase Roadmap

| Phase | Description | Status |
|---|---|---|
| 1 | Register model in openclaw.json | ✅ DONE |
| 2 | Build gemma-extract.js + model-health-check.js | ✅ DONE |
| 3 | Evaluate SOV ai-map route swap (text-only, good candidate) | 🔲 Pending — need usage data |
| 4 | Paperclip task pre-classification | 🔲 Optional, post-Hermes observation window |

---

## Reversal

Remove Gemma entirely:
1. `rm scripts/gemma-extract.js`
2. Remove `google/gemma-3-27b-it` from `openclaw.json` `models.providers.google.models`
3. No other changes needed — it was never in the main routing loop
