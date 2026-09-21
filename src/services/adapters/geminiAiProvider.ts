import { IAiProvider, AiSynthesisOptions, AiSynthesisResult } from './IAiProvider';
import { executeResilientGeminiCall } from '../geminiService';

export class GeminiAiProvider implements IAiProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini (Flash / Pro)';

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  }

  async generateSynthesis(prompt: string, options?: AiSynthesisOptions): Promise<AiSynthesisResult | null> {
    const start = Date.now();
    try {
      const response = await executeResilientGeminiCall({
        prompt,
        cacheKey: options?.cacheKey || `ai-prompt-${prompt.slice(0, 32)}`,
        timeoutMs: options?.timeoutMs || 8000,
      });

      if (!response || !response.text) return null;

      return {
        text: response.text,
        providerName: response.engineName,
        model: response.engineName,
        latencyMs: Date.now() - start,
        usedFallback: response.usedFallback,
      };
    } catch (err) {
      console.warn('[GeminiAiProvider] Failed synthesis:', err);
      return null;
    }
  }
}
