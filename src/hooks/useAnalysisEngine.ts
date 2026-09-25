import { useState, useRef, useCallback } from 'react';
import {
  ConfluenceEvaluation,
  OHLCVCandle,
  Timeframe,
  SupportedExchange,
  MarketType,
  MarketBias,
} from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { generateInstantCandlesForPrice } from '../services/marketData';
import { fetchOHLCVOnDemandCCXT } from '../services/ccxtService';
import { calculateAllIndicators } from '../services/indicators/indicatorEngine';
import { evaluateConfluence } from '../services/confluence/confluenceEngine';
import { calculateRiskPlan } from '../services/risk/riskCalculator';

export interface UseAnalysisEngineReturn {
  evaluation: ConfluenceEvaluation | null;
  setEvaluation: React.Dispatch<React.SetStateAction<ConfluenceEvaluation | null>>;
  isLoading: boolean;
  errorNotice: string | null;
  setErrorNotice: React.Dispatch<React.SetStateAction<string | null>>;
  runAnalysis: (
    sym: string,
    tf: Timeframe,
    reqLang?: Language,
    reqExchange?: SupportedExchange,
    reqMarketType?: MarketType,
    onSuccessCandles?: (candles: OHLCVCandle[]) => void
  ) => Promise<void>;
  checkCache: (key: string) => { evaluation: ConfluenceEvaluation; candles: OHLCVCandle[] } | undefined;
  saveCache: (key: string, data: { evaluation: ConfluenceEvaluation; candles: OHLCVCandle[] }) => void;
  generatePlaceholderCandles: (price: number, sym: string, tf: Timeframe) => OHLCVCandle[];
}

export function useAnalysisEngine(currentLang: Language = 'id'): UseAnalysisEngineReturn {
  const [evaluation, setEvaluation] = useState<ConfluenceEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // In-memory analysis cache for instant 0ms pair and timeframe switching
  const analysisCacheRef = useRef<Map<string, { evaluation: ConfluenceEvaluation; candles: OHLCVCandle[]; timestamp: number }>>(
    new Map()
  );

  const activeSymbolRef = useRef<string>('BTC/USDT');
  const activeTimeframeRef = useRef<Timeframe>('1H');
  const activeExchangeRef = useRef<SupportedExchange>('BINANCE');
  const activeMarketTypeRef = useRef<MarketType>('SPOT');

  const checkCache = useCallback((key: string) => {
    const cached = analysisCacheRef.current.get(key);
    if (cached) {
      return { evaluation: cached.evaluation, candles: cached.candles };
    }
    return undefined;
  }, []);

  const saveCache = useCallback((key: string, data: { evaluation: ConfluenceEvaluation; candles: OHLCVCandle[] }) => {
    analysisCacheRef.current.set(key, {
      evaluation: data.evaluation,
      candles: data.candles,
      timestamp: Date.now(),
    });
  }, []);

  const generatePlaceholderCandles = useCallback((price: number, sym: string, tf: Timeframe) => {
    return generateInstantCandlesForPrice(price, sym, tf);
  }, []);

  const runAnalysis = useCallback(
    async (
      sym: string,
      tf: Timeframe,
      reqLang?: Language,
      reqExchange?: SupportedExchange,
      reqMarketType?: MarketType,
      onSuccessCandles?: (candles: OHLCVCandle[]) => void
    ) => {
      activeSymbolRef.current = sym;
      activeTimeframeRef.current = tf;
      const targetLang = reqLang || currentLang;
      const targetExchange = reqExchange || 'BINANCE';
      const targetMarketType = reqMarketType || 'SPOT';
      activeExchangeRef.current = targetExchange;
      activeMarketTypeRef.current = targetMarketType;

      const cacheKey = `${sym}-${tf}-${targetLang}-${targetExchange}-${targetMarketType}`;
      const cached = analysisCacheRef.current.get(cacheKey);

      // If cached, render immediately and re-validate quietly in background
      if (cached) {
        setEvaluation(cached.evaluation);
        if (cached.candles && cached.candles.length > 0 && onSuccessCandles) {
          onSuccessCandles(cached.candles);
        }
      } else {
        setIsLoading(true);
      }

      setErrorNotice(null);
      const idempotencyKey = crypto.randomUUID();

      try {
        const res = await fetch('/api/v1/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            symbol: sym,
            timeframe: tf,
            exchange: targetExchange,
            marketType: targetMarketType,
            idempotencyKey,
            language: targetLang,
            lang: targetLang,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const detailMsg = errJson?.message || errJson?.error;
          throw new Error(
            detailMsg ||
              (targetLang === 'id'
                ? 'Kegagalan komputasi mesin analisis institusional.'
                : 'Institutional engine computation failure.')
          );
        }

        const json = await res.json();
        // Guard against race conditions if user changed params during fetch
        if (
          activeSymbolRef.current !== sym ||
          activeTimeframeRef.current !== tf ||
          activeExchangeRef.current !== targetExchange ||
          activeMarketTypeRef.current !== targetMarketType
        ) {
          return;
        }

        if (json.status === 'success' && json.data) {
          setEvaluation(json.data);
          if (json.candles && json.candles.length > 0 && onSuccessCandles) {
            onSuccessCandles(json.candles);
          }
          // Save to fast client cache
          analysisCacheRef.current.set(cacheKey, {
            evaluation: json.data,
            candles: json.candles || [],
            timestamp: Date.now(),
          });
        }
      } catch (err: any) {
        if (
          activeSymbolRef.current !== sym ||
          activeTimeframeRef.current !== tf ||
          activeExchangeRef.current !== targetExchange ||
          activeMarketTypeRef.current !== targetMarketType
        ) {
          return;
        }

        // Resilient fallback: Run institutional engine calculation client-side
        try {
          console.warn('[useAnalysisEngine] Server API error, running local institutional engine fallback:', err);
          const localCandles = await fetchOHLCVOnDemandCCXT(sym, tf, 150, targetExchange, targetMarketType);
          const localIndicators = calculateAllIndicators(localCandles);
          const localLastClose = localCandles[localCandles.length - 1].close;

          let weightedScoreSum = 0;
          const weights = [
            { weight: 0.12, signal: localIndicators.priceAction.signal, confidence: localIndicators.priceAction.confidence },
            { weight: 0.12, signal: localIndicators.smc.signal, confidence: localIndicators.smc.confidence },
            { weight: 0.11, signal: localIndicators.orderFlow.signal, confidence: localIndicators.orderFlow.confidence },
            { weight: 0.10, signal: localIndicators.ict.signal, confidence: localIndicators.ict.confidence },
            { weight: 0.09, signal: localIndicators.optionFlow.signal, confidence: localIndicators.optionFlow.confidence },
            { weight: 0.08, signal: localIndicators.rsi.signal, confidence: localIndicators.rsi.confidence },
            { weight: 0.08, signal: localIndicators.vwap.signal, confidence: localIndicators.vwap.confidence },
            { weight: 0.08, signal: localIndicators.fibonacci.signal, confidence: localIndicators.fibonacci.confidence },
            { weight: 0.08, signal: localIndicators.macd.signal, confidence: localIndicators.macd.confidence },
            { weight: 0.06, signal: localIndicators.ichimoku.signal, confidence: localIndicators.ichimoku.confidence },
            { weight: 0.04, signal: localIndicators.tdSequential.signal, confidence: localIndicators.tdSequential.confidence },
            { weight: 0.04, signal: localIndicators.elliottWave.signal, confidence: localIndicators.elliottWave.confidence },
          ];

          for (const item of weights) {
            if (item.signal === 'BULLISH') {
              weightedScoreSum += item.weight * (50 + (item.confidence / 100) * 50);
            } else if (item.signal === 'BEARISH') {
              weightedScoreSum += item.weight * (50 - (item.confidence / 100) * 50);
            } else {
              weightedScoreSum += item.weight * 50;
            }
          }

          const consensusScore = Math.max(5, Math.min(96, Math.round(weightedScoreSum)));
          let weightedBias: MarketBias = 'Neutral';
          if (consensusScore >= 78) weightedBias = 'Strong Bullish';
          else if (consensusScore >= 58) weightedBias = 'Bullish';
          else if (consensusScore <= 22) weightedBias = 'Strong Bearish';
          else if (consensusScore <= 42) weightedBias = 'Bearish';

          const localRiskPlan = calculateRiskPlan({
            currentPrice: localLastClose,
            bias: weightedBias,
            keySupport: localIndicators.priceAction.keySupport,
            keyResistance: localIndicators.priceAction.keyResistance,
            accountBalance: 10000,
            riskPercentage: 1.5,
          });

          const localEval = await evaluateConfluence({
            symbol: sym,
            timeframe: tf,
            indicators: localIndicators,
            riskPlan: localRiskPlan,
            idempotencyKey,
            useAI: false,
            language: targetLang,
          });

          setEvaluation(localEval);
          if (onSuccessCandles && localCandles.length > 0) {
            onSuccessCandles(localCandles);
          }
          analysisCacheRef.current.set(cacheKey, {
            evaluation: localEval,
            candles: localCandles,
            timestamp: Date.now(),
          });
          setErrorNotice(null);
          return;
        } catch (fallbackErr) {
          console.error('[useAnalysisEngine] Local fallback failure:', fallbackErr);
        }

        if (!cached) {
          setErrorNotice(
            err.message ||
              (targetLang === 'id'
                ? 'Gagal berkomunikasi dengan mesin analisis institusional'
                : 'Failed to communicate with institutional analysis engine')
          );
        }
      } finally {
        if (
          activeSymbolRef.current === sym &&
          activeTimeframeRef.current === tf &&
          activeExchangeRef.current === targetExchange &&
          activeMarketTypeRef.current === targetMarketType
        ) {
          setIsLoading(false);
        }
      }
    },
    [currentLang]
  );

  return {
    evaluation,
    setEvaluation,
    isLoading,
    errorNotice,
    setErrorNotice,
    runAnalysis,
    checkCache,
    saveCache,
    generatePlaceholderCandles,
  };
}
