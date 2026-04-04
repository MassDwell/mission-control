#!/usr/bin/env node
/**
 * gemma-extract.js — Structured extraction utility using Gemma 3 27B
 *
 * ROLE: Free, deterministic structured extraction for high-frequency batch tasks.
 *       Called explicitly by scripts/crons only. Never in the main agent loop.
 *
 * KNOWN LIMITATIONS:
 *   - No system_instruction support (API error 400 on Gemma 3)
 *   - No tool/function calling
 *   - No multimodal (even though API says it works — vision is poor on text-heavy docs)
 *   - Sometimes verbose before the JSON — handled by extractJsonFromResponse()
 *   - NOT suitable for reasoning, planning, user-facing responses, or agentic tasks
 *
 * PROMPT STRATEGY: All instructions embedded in user turn (no system prompt).
 *   Use "Return ONLY valid JSON:" as the final instruction before the data.
 *   Works reliably for classification and simple extraction.
 *
 * Usage:
 *   node gemma-extract.js --test
 *   node gemma-extract.js --task classify --input "text" --labels "a,b,c"
 *   node gemma-extract.js --task extract_json --schema '{"field":"string"}' --input "text"
 *
 * Returns: JSON to stdout, errors to stderr, exit 1 on failure.
 * Logs: ~/.openclaw/workspace/data/logs/gemma-extract.log
 */

import fs from 'fs';

const API_KEY = 'AIzaSyCbgeBiGv3YZOrNl9ipo1clILdtgrW1Fis';
const MODEL   = 'gemma-3-27b-it';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const LOG_FILE = '/Users/openclaw/.openclaw/workspace/data/logs/gemma-extract.log';

// ── Logging ────────────────────────────────────────────────────────────────────

function log(level, msg, data = null) {
  try {
    const entry = { ts: new Date().toISOString(), level, msg, ...(data && { data }) };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  } catch { /* log failure is non-fatal */ }
}

// ── JSON Extraction ────────────────────────────────────────────────────────────
// Gemma 3 27B sometimes reasons before the JSON. This extractor handles:
// 1. Clean JSON response
// 2. JSON wrapped in ```json ... ``` fences
// 3. JSON after a reasoning preamble ("Plan:\n...\n\n{...}")
// 4. JSON embedded in a sentence

function extractJsonFromResponse(text) {
  const t = text.trim();

  // 1. Try direct parse first (clean response)
  try { return JSON.parse(t); } catch {}

  // 2. Try to extract from markdown code fence
  const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // 3. Find first { or [ and try to parse from there (handles preamble)
  const objIdx = t.indexOf('{');
  const arrIdx = t.indexOf('[');
  const startIdx = (objIdx === -1) ? arrIdx : (arrIdx === -1) ? objIdx : Math.min(objIdx, arrIdx);
  if (startIdx !== -1) {
    // Find matching close
    const sub = t.slice(startIdx);
    const closerObj = '}', closerArr = ']';
    const closer = sub[0] === '{' ? closerObj : closerArr;
    const lastIdx = sub.lastIndexOf(closer);
    if (lastIdx !== -1) {
      try { return JSON.parse(sub.slice(0, lastIdx + 1)); } catch {}
    }
  }

  throw new Error(`Could not extract JSON from response: ${t.slice(0, 200)}`);
}

// ── API Call ───────────────────────────────────────────────────────────────────

async function callGemma(userPrompt, maxTokens = 512, retries = 2) {
  const t0 = Date.now();
  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0 },
  };

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      const latencyMs = Date.now() - t0;
      const json = await res.json();

      if (!res.ok || json.error) {
        const err = json.error || { message: `HTTP ${res.status}` };
        log('error', `Gemma API error (attempt ${attempt})`, { err, latencyMs });
        lastErr = new Error(`Gemma API error: ${err.message}`);
        if (res.status >= 400 && res.status < 500) throw lastErr; // no retry on 4xx
        continue;
      }

      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      log('info', 'Gemma call ok', { latencyMs, attempt, inputChars: userPrompt.length, outputChars: text.length });
      return text;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

// ── Task Handlers ──────────────────────────────────────────────────────────────

async function taskClassify(input, labels) {
  const labelList = labels.join(', ');
  const prompt =
    `Classify the following text into exactly one of these categories: ${labelList}\n` +
    `Return ONLY valid JSON — no explanation, no preamble, no markdown:\n` +
    `{"label": "<chosen_label>", "confidence": <0.0-1.0>}\n\n` +
    `Text:\n${input}`;

  const raw = await callGemma(prompt, 80);
  return extractJsonFromResponse(raw);
}

async function taskExtractJson(input, schema) {
  const prompt =
    `Extract structured data from the text below. Return ONLY valid JSON matching this schema — no explanation, no markdown:\n` +
    `${JSON.stringify(schema, null, 2)}\n\n` +
    `Text:\n${input}`;

  const raw = await callGemma(prompt, 1024);
  return extractJsonFromResponse(raw);
}

async function taskTest() {
  // Verify all supported task types work
  const classify = await taskClassify(
    'The project is located in Needham, MA and the budget is $250,000',
    ['real_estate', 'finance', 'technology', 'other']
  );

  const extract = await taskExtractJson(
    'Invoice #INV-2024-0891 from BuildRight Supplies. Date March 15 2024. Total $2,200.00 USD.',
    { vendor: 'string', invoice_number: 'string', total_amount: 'number' }
  );

  return {
    status: 'ok',
    model: MODEL,
    limitations: [
      'no system_instruction support',
      'no tool/function calling',
      'no multimodal for text-heavy documents',
      'not suitable for reasoning or agentic tasks',
    ],
    test_classify: classify,
    test_extract: extract,
  };
}

// ── CLI Entry ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    flags[args[i].slice(2)] = args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    if (args[i + 1] !== undefined && !args[i + 1].startsWith('--')) i++;
  }
}

(async () => {
  try {
    let result;

    if (flags.test) {
      result = await taskTest();
    } else if (flags.task === 'classify') {
      if (!flags.input || !flags.labels) throw new Error('--input and --labels required');
      result = await taskClassify(flags.input, flags.labels.split(','));
    } else if (flags.task === 'extract_json') {
      if (!flags.input || !flags.schema) throw new Error('--input and --schema required');
      result = await taskExtractJson(flags.input, JSON.parse(flags.schema));
    } else {
      throw new Error(
        'Unknown task. Use:\n' +
        '  --test\n' +
        '  --task classify --input "..." --labels "a,b,c"\n' +
        '  --task extract_json --schema \'{"k":"type"}\' --input "..."'
      );
    }

    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(0);
  } catch (err) {
    log('error', 'gemma-extract fatal', { error: err.message });
    process.stderr.write(JSON.stringify({ error: err.message }) + '\n');
    process.exit(1);
  }
})();
