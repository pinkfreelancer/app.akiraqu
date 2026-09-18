import { useState, useEffect, useMemo, useCallback } from 'react';
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
  wsStatus: 'connected' | 'connecting' | 'fallback';
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

/**
 * useMarketData
 * High-level unified real-time abstraction hook.
 * Handles WebSocket connection, live trade feeds, order book L2 streaming,
 * and live candlestick synchronization.
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

  // Sync external initial candles if passed or changed
  useEffect(() => {
    if (initialCandles && initialCandles.length > 0) {
      setCandles(initialCandles);
    }
  }, [initialCandles]);

  // Connect to underlying exchange streaming service
  const wsData = useCryptoWebsocket(
    symbol,
    timeframe,
    fallbackBasePrice,
    exchange,
    marketType
  );

  // Derived current active display price
  const activeDisplayPrice = useMemo(() => {
    return (
      wsData.livePrice ||
      (candles.length > 0 ? candles[candles.length - 1].close : fallbackBasePrice)
    );
  }, [wsData.livePrice, candles, fallbackBasePrice]);

  // Sync live price ticker ticks into latest candle in chart
  useEffect(() => {
    if (!activeDisplayPrice) return;
    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.close === activeDisplayPrice) return prev;
      const updatedLast: OHLCVCandle = {
        ...last,
        close: activeDisplayPrice,
        high: Math.max(last.high, activeDisplayPrice),
        low: Math.min(last.low, activeDisplayPrice),
      };
      return [...prev.slice(0, prev.length - 1), updatedLast];
    });
  }, [activeDisplayPrice]);

  // Sync live kline bar updates
  useEffect(() => {
    if (!wsData.liveCandle) return;
    const incoming = wsData.liveCandle;
    setCandles((prev) => {
      if (prev.length === 0) return [incoming];
      const last = prev[prev.length - 1];
      if (last.time === incoming.time) {
        return [...prev.slice(0, prev.length - 1), incoming];
      }
      if (incoming.time > last.time) {
        return [...prev.slice(1), incoming];
      }
      return prev;
    });
  }, [wsData.liveCandle]);

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
