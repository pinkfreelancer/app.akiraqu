import { GoogleGenAI } from '@google/genai';

// Cache store for AI generation to prevent redundant quota consumption
interface CachedResponse {
  timestamp: number;
  text: string;
  engine: string;
}

const aiResponseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

// Circuit breaker for models that encountered 429 RESOURCE_EXHAUSTED or 503 UNAVAILABLE
const modelCooldownMap = new Map<string, number>();

function isModelInCooldown(model: string): boolean {
  const cooldownUntil = modelCooldownMap.get(model);
  if (!cooldownUntil) return false;
  if (Date.now() > cooldownUntil) {
    modelCooldownMap.delete(model);
    return false;
  }
  return true;
}

function recordModelCooldown(model: string, retryDelaySeconds: number = 45, reason: string = 'rate limit or temporary load') {
  const cooldownUntil = Date.now() + Math.max(retryDelaySeconds, 20) * 1000;
  modelCooldownMap.set(model, cooldownUntil);
  const remainingSec = Math.round((cooldownUntil - Date.now()) / 1000);
  console.log(`[GeminiService] Model ${model} ${reason}. Cooldown active for ${remainingSec}s; routing traffic to backup model.`);
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface RobustAiResult {
  text: string;
  engineName: string;
  usedFallback: boolean;
}

/**
 * Executes a resilient text generation request with:
 * 1. In-memory response caching
 * 2. Multi-tier model cascade ('gemini-3.8-flash' -> 'gemini-3.1-flash-lite' -> 'gemini-flash-latest')
 * 3. 429 Quota & 503 High-Demand circuit breaker
 * 4. Silent, clean fallback without raw error dumps
 */
export async function executeResilientGeminiCall(params: {
  cacheKey: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<RobustAiResult | null> {
  const { cacheKey, prompt, timeoutMs = 5500 } = params;

  // 1. Check in-memory cache
  const cached = aiResponseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      text: cached.text,
      engineName: cached.engine,
      usedFallback: false,
    };
  }

  const client = getAiClient();
  if (!client) {
    return null;
  }

  // Multi-tier model cascade: try 3.8-flash, then 3.1-flash-lite, then gemini-flash-latest
  const candidateModels = [
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
    { id: 'gemini-flash-latest', label: 'Gemini Flash Latest' },
  ];

  for (const candidate of candidateModels) {
    if (isModelInCooldown(candidate.id)) {
      continue;
    }

    try {
      const aiPromise = client.models.generateContent({
        model: candidate.id,
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);

      if (response && response.text && response.text.trim().length > 0) {
        const resultText = response.text.trim();
        const engineLabel = `${candidate.label} (Neural Pattern Synthesis)`;

        // Store in cache
        aiResponseCache.set(cacheKey, {
          timestamp: Date.now(),
          text: resultText,
          engine: engineLabel,
        });

        return {
          text: resultText,
          engineName: engineLabel,
          usedFallback: false,
        };
      }
    } catch (err: any) {
      const code = err?.status || err?.code || 0;
      const rawMsg = typeof err?.message === 'string' ? err.message : '';

      const isQuotaError =
        code === 429 ||
        rawMsg.includes('429') ||
        rawMsg.includes('RESOURCE_EXHAUSTED') ||
        rawMsg.includes('Quota exceeded');

      const isUnavailableError =
        code === 503 ||
        code === 500 ||
        code === 502 ||
        code === 504 ||
        rawMsg.includes('503') ||
        rawMsg.includes('UNAVAILABLE') ||
        rawMsg.includes('high demand') ||
        rawMsg.includes('overloaded');

      if (isQuotaError) {
        let retrySeconds = 60;
        try {
          const match = rawMsg.match(/retry in ([0-9.]+)s/i);
          if (match && match[1]) {
            retrySeconds = Math.ceil(parseFloat(match[1])) + 2;
          }
        } catch (_parseErr) {
          // ignore
        }
        recordModelCooldown(candidate.id, retrySeconds, 'quota limit reached (429)');
        continue;
      }

      if (isUnavailableError) {
        // High demand spike on this model, set short 45s cooldown and try next model
        recordModelCooldown(candidate.id, 45, 'high demand spike (503)');
        continue;
      }

      if (rawMsg === 'AI_TIMEOUT' || rawMsg.includes('timeout')) {
        continue;
      }

      // For other transient errors, silently try the next model without printing raw JSON error objects
      continue;
    }
  }

  return null;
}
