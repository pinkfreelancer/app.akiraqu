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
import { calculateAllIndicators } from '../services/indicators/indicatorEngine';
import { evaluateConfluence } from '../services/confluence/confluenceEngine';
import { computeIndicatorConsensus } from '../services/confluence/signalConsensus';
import { calculateRiskPlan } from '../services/risk/riskCalculator';

async function fetchBrowserFallbackCandles(
  symbol: string,
  timeframe: Timeframe,
  limit = 150
): Promise<OHLCVCandle[]> {
  const clean = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const intervalMap: Record<Timeframe, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
    '1W': '1w',
  };
  const interval = intervalMap[timeframe] || '1h';
  const res = await fetch(
    `https://data-api.binance.vision/api/v3/klines?symbol=${clean}&interval=${interval}&limit=${limit}`,
    { signal: AbortSignal.timeout(4500) }
  );
  if (!res.ok) {
    throw new Error(`Fallback kline HTTP ${res.status}`);
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Empty fallback klines');
  }
  return rows.map((r: any) => ({
    time: Number(r[0]),
    open: parseFloat(r[1]),
    high: parseFloat(r[2]),
    low: parseFloat(r[3]),
    close: parseFloat(r[4]),
    volume: parseFloat(r[5]),
  }));
}

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

      let activeUserEmail: string | undefined;
      let activeUserId: string | undefined;
      try {
        const rawSession = localStorage.getItem('imasbtc_user_session');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed?.email) activeUserEmail = parsed.email;
          if (parsed?.uid) activeUserId = parsed.uid;
        }
      } catch (_e) {
        // ignore storage parse error
      }

      try {
        const res = await fetch('/api/v1/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
            ...(activeUserEmail ? { 'X-User-Email': activeUserEmail } : {}),
          },
          body: JSON.stringify({
            symbol: sym,
            timeframe: tf,
            exchange: targetExchange,
            marketType: targetMarketType,
            idempotencyKey,
            language: targetLang,
            lang: targetLang,
            userEmail: activeUserEmail,
            userId: activeUserId,
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
          const localCandles = await fetchBrowserFallbackCandles(sym, tf, 150);
          const localIndicators = calculateAllIndicators(localCandles);
          const localLastClose = localCandles[localCandles.length - 1].close;
          const { marketBias: weightedBias } = computeIndicatorConsensus(localIndicators, localLastClose);

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
