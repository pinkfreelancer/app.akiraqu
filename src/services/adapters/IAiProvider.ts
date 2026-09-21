export interface AiSynthesisOptions {
  timeoutMs?: number;
  temperature?: number;
  cacheKey?: string;
  maxTokens?: number;
}

export interface AiSynthesisResult {
  text: string;
  providerName: string;
  model: string;
  latencyMs: number;
  usedFallback: boolean;
}

export interface IAiProvider {
  readonly id: string;
  readonly name: string;

  isConfigured(): boolean;
  generateSynthesis(prompt: string, options?: AiSynthesisOptions): Promise<AiSynthesisResult | null>;
}
