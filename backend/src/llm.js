// ============================================================
// llm.js — OpenRouter API Helper
// Updated to currently working free models (March 2026)
// ============================================================

import dotenv from "dotenv";
dotenv.config();

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";


const MODELS = [
  "openai/gpt-4o-mini",          
  "anthropic/claude-3-haiku",    
  "meta-llama/llama-3-8b-instruct"
];

// Track which models are known-dead this session to skip them fast
const deadModels = new Set();

export async function callLLM(prompt, options = {}) {
  const {
    systemPrompt = "You are an expert financial advisor AI for Economic Times India. Respond with precise, actionable guidance. For JSON requests, return ONLY valid JSON — no markdown, no backticks.",
    temperature = 0.3,
    preferredModel = null,
  } = options;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set. Get a free key at https://openrouter.ai/keys and add to backend/.env");
  }

  // Build try order: preferred first, then live models (skip known-dead ones)
  const liveModels = MODELS.filter(m => !deadModels.has(m));
  const tryOrder = preferredModel
    ? [preferredModel, ...liveModels.filter(m => m !== preferredModel)]
    : liveModels;

  if (tryOrder.length === 0) {
    // All models dead this session — reset and retry
    deadModels.clear();
    tryOrder.push(...MODELS);
  }

  let lastError;
  for (const model of tryOrder) {
    try {
      const shortName = model.split("/")[1]?.split(":")[0] || model;
      console.log(`  → ${shortName}`);

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://economictimes.indiatimes.com",
          "X-Title": "ET AI Concierge",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: prompt },
          ],
          temperature,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        if (response.status === 404 || response.status === 503) {
          // Model not available — mark dead, skip to next
          deadModels.add(model);
          throw new Error(`model unavailable (${response.status})`);
        }
        if (response.status === 401) {
          throw new Error(`Invalid API key. Check OPENROUTER_API_KEY in backend/.env`);
        }
        if (response.status === 429) {
          throw new Error(`Rate limited on ${shortName} — trying next`);
        }
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 120)}`);
      }

      const data = await response.json();

      // Handle OpenRouter error responses wrapped in 200
      if (data.error) {
        const errMsg = data.error?.message || JSON.stringify(data.error);
        if (errMsg.includes("not found") || errMsg.includes("404")) {
          deadModels.add(model);
          throw new Error(`model not found: ${errMsg.slice(0, 80)}`);
        }
        throw new Error(errMsg.slice(0, 100));
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("empty response");

      console.log(`  ✓ ${shortName} (${content.length} chars)`);
      return content;

    } catch (err) {
      const shortName = model.split("/")[1]?.split(":")[0] || model;
      console.warn(`  ✗ ${shortName}: ${err.message.slice(0, 60)}`);
      lastError = err;
    }
  }

  throw new Error(`All models failed. Last: ${lastError?.message}. Visit https://openrouter.ai/models?q=free to see current free models.`);
}

// callLLMJSON — NEVER throws, always returns fallback on any failure
export async function callLLMJSON(prompt, fallback = {}) {
  try {
    const raw = await callLLM(
      `${prompt}\n\nCRITICAL: Respond with ONLY valid JSON. No markdown fences, no explanation, no preamble. Start your response with { or [.`,
      { temperature: 0.1 }
    );

    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const start = cleaned.search(/[{[]/);
    const end   = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));

    if (start === -1 || end === -1) return fallback;
    return JSON.parse(cleaned.slice(start, end + 1));

  } catch (err) {
    console.warn(`  ✗ callLLMJSON failed: ${err.message.slice(0, 60)} → using fallback`);
    return fallback;
  }
}

// Export model list so health endpoint can show it
export { MODELS, deadModels };
