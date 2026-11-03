import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Timeframe,
  OHLCVCandle,
  SupportedExchange,
  MarketType,
  WebSocketSyncMetrics,
  LiveTradeTick,
  LiveOrderBookLevel,
} from '../types/crypto.types';
import { useCryptoWebsocket } from './useCryptoWebsocket';
import { fetchFastCandles } from '../services/marketData';
import { useMarketDataStore } from '../stores/useMarketDataStore';
import { normalizeSymbol } from '../services/marketDataValidator';

export interface UseMarketDataOptions {
  symbol: string;
  timeframe: Timeframe;
  fallbackBasePrice?: number;
  exchange?: SupportedExchange;
  marketType?: MarketType;
  initialCandles?: OHLCVCandle[];
}

export interface UseMarketDataReturn {
  livePrice: number | null;
  activeDisplayPrice: number | null | undefined;
  priceDirection: 'up' | 'down' | 'neutral';
  wsStatus: 'connected' | 'connecting' | 'fallback' | 'disconnected';
  latencyMs: number;
  syncMetrics: WebSocketSyncMetrics;
  recentLiveTrades: LiveTradeTick[];
  orderBookBids: LiveOrderBookLevel[];
  orderBookAsks: LiveOrderBookLevel[];
  bidTotal: number;
  askTotal: number;
  candles: OHLCVCandle[];
  setCandles: React.Dispatch<React.SetStateAction<OHLCVCandle[]>>;
}

const TIMEFRAME_MS_MAP: Record<Timeframe, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1H': 60 * 60 * 1000,
  '4H': 4 * 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
};

/**
 * useMarketData
 * High-level unified real-time abstraction hook.
 * Handles WebSocket connection, live trade feeds, order book L2 streaming,
 * automatic historical gap backfilling, and synchronized candle updates.
 */
export function useMarketData({
  symbol,
  timeframe,
  fallbackBasePrice,
  exchange = 'BINANCE',
  marketType = 'SPOT',
  initialCandles = [],
}: UseMarketDataOptions): UseMarketDataReturn {
  const [candles, setCandles] = useState<OHLCVCandle[]>(initialCandles);
  const isBackfillingRef = useRef<boolean>(false);
  const lastKlineTimeRef = useRef<number>(0);
  const lastIntraTickTimeRef = useRef<number>(0);
  const pendingIntraPriceRef = useRef<number | null>(null);

  // Sync external initial candles if passed or changed
  useEffect(() => {
    if (initialCandles && initialCandles.length > 0) {
      setCandles(initialCandles);
      lastKlineTimeRef.current = initialCandles[initialCandles.length - 1].time;
    }
  }, [initialCandles]);

  const normSymbol = normalizeSymbol(symbol) || 'BTC/USDT';
  const ssotPrice = useMarketDataStore((s) => s.tickers[normSymbol]?.price ?? null);

  // Connect to underlying exchange streaming service
  const wsData = useCryptoWebsocket(
    symbol,
    timeframe,
    undefined,
    exchange,
    marketType
  );

  // Derived current active display price strictly from SSOT / live WS / genuine candles (never static catalog basePrice)
  const activeDisplayPrice = useMemo(() => {
    if (ssotPrice && ssotPrice > 0) return ssotPrice;
    if (wsData.livePrice && wsData.livePrice > 0) return wsData.livePrice;
    const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
    if (lastCandle && !lastCandle.isSimulated && lastCandle.close > 0) {
      return lastCandle.close;
    }
    return null;
  }, [ssotPrice, wsData.livePrice, candles]);

  // Handle incoming authoritative kline bar with gap detection & backfilling
  useEffect(() => {
    if (!wsData.liveCandle) return;
    const incoming = wsData.liveCandle;

    setCandles((prev) => {
      if (prev.length === 0) {
        lastKlineTimeRef.current = incoming.time;
        return [incoming];
      }

      const last = prev[prev.length - 1];

      // Case 1: In-flight candle update (same timestamp)
      if (last.time === incoming.time) {
        lastKlineTimeRef.current = incoming.time;
        return [...prev.slice(0, prev.length - 1), incoming];
      }

      // Case 2: New candle arrived
      if (incoming.time > last.time) {
        const expectedInterval = TIMEFRAME_MS_MAP[timeframe] || 60000;
        const timeDiff = incoming.time - last.time;

        // Gap detected (> 1.8x timeframe step): background backfill from exchange REST
        if (timeDiff > expectedInterval * 1.8 && !isBackfillingRef.current) {
          isBackfillingRef.current = true;
          fetchFastCandles(symbol, timeframe, exchange, marketType, 150)
            .then((backfilled) => {
              if (backfilled && backfilled.length > 0) {
                setCandles(backfilled);
              }
            })
            .catch(() => {})
            .finally(() => {
              isBackfillingRef.current = false;
            });
        }

        lastKlineTimeRef.current = incoming.time;
        const nextArr = [...prev, incoming];
        if (nextArr.length > 200) {
          return nextArr.slice(nextArr.length - 150);
        }
        return nextArr;
      }

      return prev;
    });
  }, [wsData.liveCandle, symbol, timeframe, exchange, marketType]);

  // Handle intra-candle price ticks between klines cleanly with high-efficiency 100ms batching
  useEffect(() => {
    if (!activeDisplayPrice || isNaN(activeDisplayPrice) || activeDisplayPrice <= 0) return;
    pendingIntraPriceRef.current = activeDisplayPrice;

    const now = Date.now();
    const elapsed = now - lastIntraTickTimeRef.current;

    const applyIntraTick = (price: number) => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.close === price) return prev;

        const updatedLast: OHLCVCandle = {
          ...last,
          close: price,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
        };

        return [...prev.slice(0, prev.length - 1), updatedLast];
      });
      lastIntraTickTimeRef.current = Date.now();
    };

    if (elapsed >= 100) {
      applyIntraTick(activeDisplayPrice);
    } else {
      const timer = window.setTimeout(() => {
        if (pendingIntraPriceRef.current !== null) {
          applyIntraTick(pendingIntraPriceRef.current);
        }
      }, 100 - elapsed);
      return () => clearTimeout(timer);
    }
  }, [activeDisplayPrice]);

  return {
    livePrice: wsData.livePrice,
    activeDisplayPrice,
    priceDirection: wsData.priceDirection,
    wsStatus: wsData.wsStatus,
    latencyMs: wsData.latencyMs,
    syncMetrics: wsData.syncMetrics,
    recentLiveTrades: wsData.recentLiveTrades,
    orderBookBids: wsData.orderBookBids,
    orderBookAsks: wsData.orderBookAsks,
    bidTotal: wsData.bidTotal,
    askTotal: wsData.askTotal,
    candles,
    setCandles,
  };
}
