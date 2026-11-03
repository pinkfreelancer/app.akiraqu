import { useState, useEffect, useRef } from 'react';
import {
  Timeframe,
  OHLCVCandle,
  SupportedExchange,
  MarketType,
  WebSocketSyncMetrics,
  LiveTradeTick,
  LiveOrderBookLevel,
} from '../types/crypto.types';
import { formatExchangeSymbol, mapTimeframeToExchange } from '../services/exchangeService';
import {
  computeReconnectDelayMs,
  normalizeSymbol,
  RawDepthTuple,
} from '../services/marketDataValidator';
import { useMarketDataStore } from '../stores/useMarketDataStore';

export interface UseCryptoWebsocketResult {
  livePrice: number | null;
  priceChange24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  priceDirection: 'up' | 'down' | 'neutral';
  wsStatus: 'connected' | 'connecting' | 'fallback' | 'disconnected';
  liveCandle: OHLCVCandle | null;
  latencyMs: number;
  activeSource: string;
  syncMetrics: WebSocketSyncMetrics;
  recentLiveTrades: LiveTradeTick[];
  orderBookBids: LiveOrderBookLevel[];
  orderBookAsks: LiveOrderBookLevel[];
  bidTotal: number;
  askTotal: number;
}

interface RawBufferState {
  lastPrice: number | null;
  priceChange24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  liveCandle: OHLCVCandle | null;
  serverEventTime: number;
  clientReceivedTime: number;
  latencyMs: number;
  tradesBuffer: LiveTradeTick[];
  tradesDirty: boolean;
  bids: LiveOrderBookLevel[];
  asks: LiveOrderBookLevel[];
  bidTotal: number;
  askTotal: number;
  orderBookDirty: boolean;
  hasUpdate: boolean;
}

const CORE_BACKGROUND_TICKER_PAIRS = [
  'btcusdt',
  'ethusdt',
  'solusdt',
  'bnbusdt',
  'xrpusdt',
  'dogeusdt',
  'pepeusdt',
  'arbusdt',
  'nearusdt',
  'suiusdt',
  'avaxusdt',
  'fetusdt',
  'adausdt',
  'linkusdt',
  'renderusdt',
  'ondousdt',
  'opusdt',
  'tonusdt',
  'tiausdt',
  'aaveusdt',
  'uniusdt',
];

function formatQuoteVolume(val: number): string | undefined {
  if (!Number.isFinite(val) || val <= 0) return undefined;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function getProxyWsUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/market`;
  }
  return '';
}

export function useCryptoWebsocket(
  symbol: string,
  timeframe: Timeframe,
  _deprecatedFallbackBasePrice?: number,
  exchange: SupportedExchange = 'BINANCE',
  marketType: MarketType = 'SPOT'
): UseCryptoWebsocketResult {
  const normalizedInitSym = normalizeSymbol(symbol) || 'BTC/USDT';
  const initialValidatedPrice =
    useMarketDataStore.getState().tickers[normalizedInitSym]?.price ?? null;

  const [livePrice, setLivePrice] = useState<number | null>(initialValidatedPrice);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [high24h, setHigh24h] = useState<number | null>(null);
  const [low24h, setLow24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'fallback' | 'disconnected'>(
    'connecting'
  );
  const [liveCandle, setLiveCandle] = useState<OHLCVCandle | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(12);
  const [activeSource, setActiveSource] = useState<string>(`${exchange} ${marketType}`);

  const [recentLiveTrades, setRecentLiveTrades] = useState<LiveTradeTick[]>([]);
  const [orderBookBids, setOrderBookBids] = useState<LiveOrderBookLevel[]>([]);
  const [orderBookAsks, setOrderBookAsks] = useState<LiveOrderBookLevel[]>([]);
  const [bidTotal, setBidTotal] = useState<number>(0);
  const [askTotal, setAskTotal] = useState<number>(0);

  const [syncMetrics, setSyncMetrics] = useState<WebSocketSyncMetrics>({
    serverEventTime: Date.now(),
    clientReceivedTime: Date.now(),
    deltaLatencyMs: 12,
    streamProtocol: `${exchange} Native Stream`,
    fpsRenderRate: 60,
    droppedTicksSaved: 0,
    isFuturesAligned: marketType === 'FUTURES',
  });

  const prevPriceRef = useRef<number | null>(initialValidatedPrice);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const pingIntervalRef = useRef<number | null>(null);
  const watchdogIntervalRef = useRef<number | null>(null);
  const fallbackPollIntervalRef = useRef<number | null>(null);
  const lastWsMessageAtRef = useRef<number>(0);
  const lastPingSentAtRef = useRef<number>(0);

  const bufferRef = useRef<RawBufferState>({
    lastPrice: initialValidatedPrice,
    priceChange24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    liveCandle: null,
    serverEventTime: Date.now(),
    clientReceivedTime: Date.now(),
    latencyMs: 12,
    tradesBuffer: [],
    tradesDirty: false,
    bids: [],
    asks: [],
    bidTotal: 0,
    askTotal: 0,
    orderBookDirty: false,
    hasUpdate: false,
  });

  const rafIdRef = useRef<number | null>(null);
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(Date.now());
  const ticksSavedCounterRef = useRef<number>(0);
  const tradeCounterRef = useRef<number>(0);

  // -------------------------------------------------------------
  // RequestAnimationFrame Render Loop (60fps batched UI updates)
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    const flushBufferToUI = () => {
      if (!active) return;

      const buf = bufferRef.current;
      if (buf.hasUpdate) {
        if (buf.lastPrice !== null && buf.lastPrice !== prevPriceRef.current) {
          if (prevPriceRef.current !== null) {
            if (buf.lastPrice > prevPriceRef.current) setPriceDirection('up');
            else if (buf.lastPrice < prevPriceRef.current) setPriceDirection('down');
          }
          prevPriceRef.current = buf.lastPrice;
          setLivePrice(buf.lastPrice);
        } else if (buf.lastPrice === null && prevPriceRef.current !== null) {
          prevPriceRef.current = null;
          setLivePrice(null);
        }

        if (buf.priceChange24h !== null) setPriceChange24h(buf.priceChange24h);
        if (buf.high24h !== null) setHigh24h(buf.high24h);
        if (buf.low24h !== null) setLow24h(buf.low24h);
        if (buf.volume24h !== null) setVolume24h(buf.volume24h);
        if (buf.liveCandle !== null) setLiveCandle(buf.liveCandle);

        if (buf.tradesDirty) {
          setRecentLiveTrades([...buf.tradesBuffer]);
          buf.tradesDirty = false;
        }

        if (buf.orderBookDirty) {
          setOrderBookBids([...buf.bids]);
          setOrderBookAsks([...buf.asks]);
          setBidTotal(buf.bidTotal);
          setAskTotal(buf.askTotal);
          buf.orderBookDirty = false;
        }

        setLatencyMs(buf.latencyMs);

        fpsFrameCountRef.current += 1;
        const now = Date.now();
        const elapsed = now - fpsLastTimeRef.current;
        let currentFps = 60;
        if (elapsed >= 1000) {
          currentFps = Math.min(60, Math.round((fpsFrameCountRef.current * 1000) / elapsed));
          fpsFrameCountRef.current = 0;
          fpsLastTimeRef.current = now;
        }

        setSyncMetrics((prev) => ({
          ...prev,
          serverEventTime: buf.serverEventTime,
          clientReceivedTime: buf.clientReceivedTime,
          deltaLatencyMs: buf.latencyMs,
          fpsRenderRate: currentFps,
          droppedTicksSaved: ticksSavedCounterRef.current,
          isFuturesAligned: marketType === 'FUTURES',
        }));

        buf.hasUpdate = false;
      }

      rafIdRef.current = requestAnimationFrame(flushBufferToUI);
    };

    rafIdRef.current = requestAnimationFrame(flushBufferToUI);

    return () => {
      active = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [marketType]);

  // -------------------------------------------------------------
  // Main WebSocket Lifecycle + SSOT Validation + Symbol Hygiene
  // -------------------------------------------------------------
  useEffect(() => {
    const normalizedActiveSymbol = normalizeSymbol(symbol) || 'BTC/USDT';
    const cleanPair = normalizedActiveSymbol.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    const formattedPair = formatExchangeSymbol(normalizedActiveSymbol, exchange, marketType);
    const tfParam = mapTimeframeToExchange(timeframe, exchange);

    // 1. Increment SSOT epoch & synchronously purge all orderbook/trade state from previous symbol
    const currentEpoch = useMarketDataStore.getState().switchSymbol(normalizedActiveSymbol);
    const existingValidatedTicker = useMarketDataStore.getState().tickers[normalizedActiveSymbol];
    const seedPrice = existingValidatedTicker?.price ?? null;

    setActiveSource(`${exchange} ${marketType}`);
    setLivePrice(seedPrice);
    prevPriceRef.current = seedPrice;
    setLiveCandle(null);
    setPriceChange24h(existingValidatedTicker?.change24h ?? null);
    setHigh24h(existingValidatedTicker?.high24h ?? null);
    setLow24h(existingValidatedTicker?.low24h ?? null);
    setVolume24h(null);
    setPriceDirection(existingValidatedTicker?.direction ?? 'neutral');

    // Synchronously wipe local React states so zero stale bids/asks/trades ever render
    setOrderBookBids([]);
    setOrderBookAsks([]);
    setBidTotal(0);
    setAskTotal(0);
    setRecentLiveTrades([]);

    bufferRef.current = {
      lastPrice: seedPrice,
      priceChange24h: existingValidatedTicker?.change24h ?? null,
      high24h: existingValidatedTicker?.high24h ?? null,
      low24h: existingValidatedTicker?.low24h ?? null,
      volume24h: null,
      liveCandle: null,
      serverEventTime: Date.now(),
      clientReceivedTime: Date.now(),
      latencyMs: 12,
      tradesBuffer: [],
      tradesDirty: true,
      bids: [],
      asks: [],
      bidTotal: 0,
      askTotal: 0,
      orderBookDirty: true,
      hasUpdate: true,
    };

    const isBrowserOnline = () =>
      typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean'
        ? true
        : navigator.onLine;

    if (isBrowserOnline()) {
      setWsStatus('connecting');
      useMarketDataStore.getState().setConnectionState({
        wsStatus: 'connecting',
        fallbackPollingActive: false,
        reconnectAttempt: 0,
      });
    } else {
      setWsStatus('disconnected');
      useMarketDataStore.getState().setOnlineStatus(false);
    }

    let isSubscribed = true;
    let activeUnsubscribePayloads: string[] = [];

    const clearAllTimers = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current !== null) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (watchdogIntervalRef.current !== null) {
        window.clearInterval(watchdogIntervalRef.current);
        watchdogIntervalRef.current = null;
      }
      if (fallbackPollIntervalRef.current !== null) {
        window.clearInterval(fallbackPollIntervalRef.current);
        fallbackPollIntervalRef.current = null;
      }
    };

    const stopFallbackPolling = () => {
      if (fallbackPollIntervalRef.current !== null) {
        window.clearInterval(fallbackPollIntervalRef.current);
        fallbackPollIntervalRef.current = null;
      }
      useMarketDataStore.getState().setConnectionState({ fallbackPollingActive: false });
    };

    const teardownActiveSocket = (sendUnsubscribe = true) => {
      const currentWs = wsRef.current;
      wsRef.current = null;
      if (!currentWs) return;

      try {
        currentWs.onopen = null;
        currentWs.onmessage = null;
        currentWs.onerror = null;
        currentWs.onclose = null;

        if (sendUnsubscribe && currentWs.readyState === WebSocket.OPEN && activeUnsubscribePayloads.length > 0) {
          for (const unsubMsg of activeUnsubscribePayloads) {
            try {
              currentWs.send(unsubMsg);
            } catch (_e) {}
          }
        }
        currentWs.close();
      } catch (_e) {}
    };

    clearAllTimers();
    teardownActiveSocket(false);
    reconnectAttemptsRef.current = 0;

    // Helper: Validate & apply active-symbol price tick into SSOT + RAF buffer
    const applyValidatedActiveTick = (params: {
      payloadSymbol: string;
      price: number;
      change24h?: number;
      high24h?: number;
      low24h?: number;
      volume24h?: number;
      source: 'WS' | 'REST';
      now?: number;
    }): boolean => {
      if (!isSubscribed) return false;
      const store = useMarketDataStore.getState();
      if (store.symbolEpoch !== currentEpoch) return false;

      const accepted = store.ingestPriceTick({
        symbol: params.payloadSymbol,
        expectedSymbol: normalizedActiveSymbol,
        price: params.price,
        change24h: params.change24h,
        high24h: params.high24h ?? null,
        low24h: params.low24h ?? null,
        volume24h: params.volume24h !== undefined ? formatQuoteVolume(params.volume24h) ?? null : undefined,
        source: params.source,
        now: params.now,
      });

      if (!accepted) return false;

      const buf = bufferRef.current;
      buf.lastPrice = params.price;
      if (params.change24h !== undefined && Number.isFinite(params.change24h)) {
        buf.priceChange24h = params.change24h;
      }
      if (params.high24h !== undefined && Number.isFinite(params.high24h) && params.high24h > 0) {
        buf.high24h = params.high24h;
      }
      if (params.low24h !== undefined && Number.isFinite(params.low24h) && params.low24h > 0) {
        buf.low24h = params.low24h;
      }
      if (params.volume24h !== undefined && Number.isFinite(params.volume24h) && params.volume24h > 0) {
        buf.volume24h = params.volume24h;
      }
      buf.hasUpdate = true;
      return true;
    };

    // Helper: Validate & apply active-symbol L2 orderbook into SSOT + RAF buffer
    const applyValidatedOrderBook = (
      payloadSymbol: string,
      rawBids: RawDepthTuple[],
      rawAsks: RawDepthTuple[],
      source: 'WS' | 'REST',
      now = Date.now()
    ): boolean => {
      if (!isSubscribed) return false;
      const accepted = useMarketDataStore.getState().ingestOrderBook({
        payloadSymbol,
        epoch: currentEpoch,
        bids: rawBids,
        asks: rawAsks,
        source,
        now,
      });

      if (!accepted) return false;

      const validatedOb = useMarketDataStore.getState().orderBook;
      const buf = bufferRef.current;
      buf.bids = validatedOb.bids;
      buf.asks = validatedOb.asks;
      buf.bidTotal = validatedOb.bidTotal;
      buf.askTotal = validatedOb.askTotal;
      buf.orderBookDirty = true;
      buf.hasUpdate = true;
      return true;
    };

    // Helper: Validate & apply active-symbol trades into SSOT + RAF buffer
    const applyValidatedTrades = (
      payloadSymbol: string,
      incomingTrades: LiveTradeTick[],
      source: 'WS' | 'REST',
      now = Date.now()
    ): boolean => {
      if (!isSubscribed || incomingTrades.length === 0) return false;
      const accepted = useMarketDataStore.getState().ingestTrades({
        payloadSymbol,
        epoch: currentEpoch,
        trades: incomingTrades,
        source,
        now,
      });
      if (!accepted) return false;

      const latestTrades = useMarketDataStore.getState().recentTrades;
      const buf = bufferRef.current;
      buf.tradesBuffer = latestTrades.slice(0, 20);
      buf.tradesDirty = true;
      buf.hasUpdate = true;
      return true;
    };

    // -------------------------------------------------------------
    // Genuine REST Snapshot (Initial Hydration + Fallback Polling)
    // -------------------------------------------------------------
    const fetchLiveRestSnapshot = async () => {
      if (!isSubscribed || !isBrowserOnline()) return;
      const restStart = Date.now();

      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 3200);
        const snapRes = await fetch(
          `/api/v1/market-snapshot?symbol=${encodeURIComponent(normalizedActiveSymbol)}&exchange=${exchange}&timeframe=${timeframe}&marketType=${marketType}`,
          { signal: controller.signal }
        );
        window.clearTimeout(timeout);

        if (!isSubscribed || useMarketDataStore.getState().symbolEpoch !== currentEpoch) return;

        if (snapRes.ok) {
          const snap = await snapRes.json();
          const snapSym = normalizeSymbol(snap.symbol || normalizedActiveSymbol);
          if (snap.status === 'success' && snapSym === normalizedActiveSymbol) {
            const now = Date.now();
            if (snap.ticker && Number.isFinite(snap.ticker.price) && snap.ticker.price > 0) {
              applyValidatedActiveTick({
                payloadSymbol: snapSym,
                price: Number(snap.ticker.price),
                change24h: Number(snap.ticker.priceChangePercent),
                high24h: Number(snap.ticker.high),
                low24h: Number(snap.ticker.low),
                volume24h: Number(snap.ticker.volume),
                source: 'REST',
                now,
              });
            }

            if (snap.depth && Array.isArray(snap.depth.bids) && Array.isArray(snap.depth.asks)) {
              applyValidatedOrderBook(snapSym, snap.depth.bids, snap.depth.asks, 'REST', now);
            }

            if (Array.isArray(snap.trades) && snap.trades.length > 0) {
              const parsedTrades: LiveTradeTick[] = snap.trades.slice(0, 15).map((item: any, idx: number) => {
                const tp = parseFloat(item.price);
                const tv = parseFloat(item.qty || item.size || item.amount || 0);
                const isBuy = !item.isBuyerMaker;
                const ts = Number(item.time || item.ts || now);
                const seq = ++tradeCounterRef.current;
                return {
                  id: `${exchange.toLowerCase()}-snap-${item.id || item.tradeId || ts}-${idx}-${seq}`,
                  time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  timestamp: ts,
                  price: tp,
                  amount: Number(tv.toFixed(4)),
                  isBuy,
                };
              });
              applyValidatedTrades(snapSym, parsedTrades, 'REST', now);
            }

            if (snap.liveCandle && Number.isFinite(snap.liveCandle.close) && snap.liveCandle.close > 0) {
              const candlePriceCheck = useMarketDataStore.getState().tickers[normalizedActiveSymbol]?.price;
              const candleOk =
                !candlePriceCheck ||
                Math.abs(snap.liveCandle.close - candlePriceCheck) / candlePriceCheck <= 0.05;
              if (candleOk) {
                bufferRef.current.liveCandle = snap.liveCandle;
                bufferRef.current.hasUpdate = true;
              }
            }

            const rtt = Math.max(8, snap.latencyMs || Date.now() - restStart);
            bufferRef.current.latencyMs = rtt;
            bufferRef.current.serverEventTime = snap.serverTime || now;
            bufferRef.current.clientReceivedTime = now;
            bufferRef.current.hasUpdate = true;
            return;
          }
        }
      } catch (_snapErr) {
        // Continue to secondary endpoint fallback
      }

      if (!isSubscribed || useMarketDataStore.getState().symbolEpoch !== currentEpoch) return;

      // Secondary fallback via /api/v1/ticker + /api/v1/depth + /api/v1/trades
      try {
        const [tRes, dRes, trRes] = await Promise.allSettled([
          fetch(`/api/v1/ticker?symbol=${encodeURIComponent(normalizedActiveSymbol)}&marketType=${marketType}`, {
            signal: AbortSignal.timeout(3000),
          }),
          fetch(`/api/v1/depth?symbol=${encodeURIComponent(normalizedActiveSymbol)}&marketType=${marketType}&limit=10`, {
            signal: AbortSignal.timeout(3000),
          }),
          fetch(`/api/v1/trades?symbol=${encodeURIComponent(normalizedActiveSymbol)}&marketType=${marketType}&limit=15`, {
            signal: AbortSignal.timeout(3000),
          }),
        ]);

        if (!isSubscribed || useMarketDataStore.getState().symbolEpoch !== currentEpoch) return;
        const now = Date.now();

        if (tRes.status === 'fulfilled' && tRes.value.ok) {
          const td = await tRes.value.json();
          if (td.status === 'success' && Number.isFinite(td.price)) {
            applyValidatedActiveTick({
              payloadSymbol: td.symbol || normalizedActiveSymbol,
              price: Number(td.price),
              change24h: Number(td.priceChangePercent),
              high24h: Number(td.high),
              low24h: Number(td.low),
              volume24h: Number(td.volume),
              source: 'REST',
              now,
            });
          }
        }

        if (dRes.status === 'fulfilled' && dRes.value.ok) {
          const dd = await dRes.value.json();
          if (dd.status === 'success' && Array.isArray(dd.bids) && Array.isArray(dd.asks)) {
            applyValidatedOrderBook(dd.symbol || normalizedActiveSymbol, dd.bids, dd.asks, 'REST', now);
          }
        }

        if (trRes.status === 'fulfilled' && trRes.value.ok) {
          const trd = await trRes.value.json();
          if (trd.status === 'success' && Array.isArray(trd.trades)) {
            const parsedTrades: LiveTradeTick[] = trd.trades.slice(0, 15).map((item: any, idx: number) => {
              const tp = parseFloat(item.price);
              const tv = parseFloat(item.qty || 0);
              const isBuy = !item.isBuyerMaker;
              const ts = Number(item.time || now);
              const seq = ++tradeCounterRef.current;
              return {
                id: `bin-r-${item.id || ts}-${idx}-${seq}`,
                time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                timestamp: ts,
                price: tp,
                amount: Number(tv.toFixed(4)),
                isBuy,
              };
            });
            applyValidatedTrades(trd.symbol || normalizedActiveSymbol, parsedTrades, 'REST', now);
          }
        }
      } catch (_secErr) {
        // Handled by status indicators
      }
    };

    const activateFallbackPolling = () => {
      if (!isSubscribed) return;
      if (!isBrowserOnline()) {
        setWsStatus('disconnected');
        useMarketDataStore.getState().setOnlineStatus(false);
        stopFallbackPolling();
        return;
      }

      setWsStatus('fallback');
      useMarketDataStore.getState().setConnectionState({
        wsStatus: 'fallback',
        fallbackPollingActive: true,
      });

      fetchLiveRestSnapshot();
      if (fallbackPollIntervalRef.current === null) {
        fallbackPollIntervalRef.current = window.setInterval(() => {
          if (isSubscribed && isBrowserOnline()) {
            fetchLiveRestSnapshot();
          }
        }, 2500);
      }
    };

    const scheduleReconnect = () => {
      if (!isSubscribed) return;
      if (!isBrowserOnline()) return;
      if (reconnectTimeoutRef.current !== null) return;

      const attempt = reconnectAttemptsRef.current;
      reconnectAttemptsRef.current += 1;
      const delay = computeReconnectDelayMs(attempt, 1000, 30_000);

      useMarketDataStore.getState().setConnectionState({
        reconnectAttempt: reconnectAttemptsRef.current,
      });

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (isSubscribed && isBrowserOnline()) {
          initWebSocket();
        }
      }, delay);
    };

    // Hydrate initial snapshot once on symbol mount while WS handshakes
    fetchLiveRestSnapshot();

    // -------------------------------------------------------------
    // Native & Multiplexed Proxy WebSocket Initializer
    // -------------------------------------------------------------
    const initWebSocket = async () => {
      if (!isSubscribed || !isBrowserOnline()) return;

      teardownActiveSocket(false);
      if (pingIntervalRef.current !== null) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (watchdogIntervalRef.current !== null) {
        window.clearInterval(watchdogIntervalRef.current);
        watchdogIntervalRef.current = null;
      }

      try {
        let streamUrl = '';
        let protocolName = '';
        let pingIntervalMs = 15_000;
        let pingPayload: string | null = 'ping';
        let onOpenSubPayloads: string[] = [];
        activeUnsubscribePayloads = [];

        if (exchange === 'KUCOIN') {
          const isFut = marketType === 'FUTURES';
          protocolName = `KuCoin Native WebSocket (${isFut ? 'Futures' : 'Spot'})`;
          try {
            const proxyRes = await fetch(`/api/v1/market/kucoin-bullet?marketType=${marketType}`, { method: 'POST' });
            const bData = proxyRes.ok ? await proxyRes.json() : null;
            if (bData && bData.data?.token) {
              const endpoint =
                bData.data.instanceServers?.[0]?.endpoint ||
                (isFut ? 'wss://ws-api-futures.kucoin.com/' : 'wss://ws-api-spot.kucoin.com/');
              streamUrl = `${endpoint}?token=${bData.data.token}`;
            } else {
              streamUrl = isFut ? 'wss://ws-api-futures.kucoin.com/' : 'wss://ws-api-spot.kucoin.com/';
            }
          } catch (_kErr) {
            streamUrl = isFut ? 'wss://ws-api-futures.kucoin.com/' : 'wss://ws-api-spot.kucoin.com/';
          }

          pingIntervalMs = 18_000;
          pingPayload = JSON.stringify({ id: Date.now(), type: 'ping' });
          const depthTopic = isFut
            ? `/contractMarket/level2Depth5:${formattedPair}`
            : `/spotMarket/level2Depth5:${formattedPair}`;

          onOpenSubPayloads = [
            JSON.stringify({ id: 1, type: 'subscribe', topic: `/market/ticker:${formattedPair}`, privateChannel: false, response: true }),
            JSON.stringify({ id: 2, type: 'subscribe', topic: `/market/match:${formattedPair}`, privateChannel: false, response: true }),
            JSON.stringify({ id: 3, type: 'subscribe', topic: depthTopic, privateChannel: false, response: true }),
          ];
          activeUnsubscribePayloads = [
            JSON.stringify({ id: 11, type: 'unsubscribe', topic: `/market/ticker:${formattedPair}`, privateChannel: false }),
            JSON.stringify({ id: 12, type: 'unsubscribe', topic: `/market/match:${formattedPair}`, privateChannel: false }),
            JSON.stringify({ id: 13, type: 'unsubscribe', topic: depthTopic, privateChannel: false }),
          ];
        } else if (exchange === 'BITUNIX') {
          streamUrl = 'wss://fapi.bitunix.com/public/';
          protocolName = 'Bitunix Native WebSocket';
          pingIntervalMs = 15_000;
          pingPayload = JSON.stringify({ op: 'ping' });
          const btxSymbol = cleanPair.toUpperCase();
          const args = [
            { symbol: btxSymbol, ch: 'ticker' },
            { symbol: btxSymbol, ch: 'trade' },
            { symbol: btxSymbol, ch: 'depth_books' },
          ];
          onOpenSubPayloads = [JSON.stringify({ op: 'subscribe', args })];
          activeUnsubscribePayloads = [JSON.stringify({ op: 'unsubscribe', args })];
        } else if (exchange === 'BYBIT') {
          const isFut = marketType === 'FUTURES';
          streamUrl = `wss://stream.bybit.com/v5/public/${isFut ? 'linear' : 'spot'}`;
          protocolName = `Bybit V5 Native WebSocket (${isFut ? 'Linear' : 'Spot'})`;
          pingIntervalMs = 20_000;
          pingPayload = JSON.stringify({ op: 'ping' });
          const bybitPair = cleanPair.toUpperCase();
          const args = [`tickers.${bybitPair}`, `publicTrade.${bybitPair}`, `orderbook.50.${bybitPair}`];
          onOpenSubPayloads = [JSON.stringify({ op: 'subscribe', args })];
          activeUnsubscribePayloads = [JSON.stringify({ op: 'unsubscribe', args })];
        } else if (exchange === 'OKX') {
          streamUrl = 'wss://ws.okx.com:8443/ws/v5/public';
          protocolName = 'OKX V5 Native WebSocket';
          pingIntervalMs = 20_000;
          pingPayload = 'ping';
          const args = [
            { channel: 'tickers', instId: formattedPair },
            { channel: 'trades', instId: formattedPair },
            { channel: 'books5', instId: formattedPair },
            { channel: `candle${tfParam}`, instId: formattedPair },
          ];
          onOpenSubPayloads = [JSON.stringify({ op: 'subscribe', args })];
          activeUnsubscribePayloads = [JSON.stringify({ op: 'unsubscribe', args })];
        } else if (exchange === 'CRYPTO_COM') {
          streamUrl = 'wss://stream.crypto.com/exchange/v1/market';
          protocolName = 'Crypto.com V1 Native WebSocket';
          pingIntervalMs = 0;
          pingPayload = null;
          const channels = [
            `ticker.${formattedPair}`,
            `trade.${formattedPair}`,
            `candlestick.${tfParam}.${formattedPair}`,
            `book.${formattedPair}.10`,
          ];
          onOpenSubPayloads = [JSON.stringify({ id: 1, method: 'subscribe', params: { channels } })];
          activeUnsubscribePayloads = [JSON.stringify({ id: 2, method: 'unsubscribe', params: { channels } })];
        } else if (exchange === 'BITGET') {
          const isFut = marketType === 'FUTURES';
          streamUrl = 'wss://ws.bitget.com/v2/ws/public';
          protocolName = `Bitget V2 Native WebSocket (${isFut ? 'Futures' : 'Spot'})`;
          pingIntervalMs = 20_000;
          pingPayload = 'ping';
          const bitgetPair = cleanPair.toUpperCase();
          const instType = isFut ? 'USDT-FUTURES' : 'SPOT';
          const args = [
            { instType, channel: 'ticker', instId: bitgetPair },
            { instType, channel: 'trade', instId: bitgetPair },
            { instType, channel: 'books5', instId: bitgetPair },
          ];
          onOpenSubPayloads = [JSON.stringify({ op: 'subscribe', args })];
          activeUnsubscribePayloads = [JSON.stringify({ op: 'unsubscribe', args })];
        } else {
          // BINANCE via Server-Side Multiplexed Proxy /ws/market
          const isFut = marketType === 'FUTURES';
          const proxyUrl = getProxyWsUrl();
          const activeStreams = [
            `${cleanPair}@aggTrade`,
            `${cleanPair}@depth10@100ms`,
            `${cleanPair}@kline_${tfParam}`,
            `${cleanPair}@ticker`,
          ];
          const backgroundTickerStreams = CORE_BACKGROUND_TICKER_PAIRS.filter(
            (p) => p !== cleanPair
          ).map((p) => `${p}@ticker`);
          const allStreams = [...activeStreams, ...backgroundTickerStreams];

          if (proxyUrl) {
            streamUrl = proxyUrl;
            protocolName = isFut
              ? `AKIRAQU Multiplexed WS Proxy (Binance Futures)`
              : `AKIRAQU Multiplexed WS Proxy (Binance Spot)`;
            pingIntervalMs = 12_000;
            pingPayload = 'ping';

            onOpenSubPayloads = [
              JSON.stringify({
                method: 'SUBSCRIBE',
                params: allStreams,
                marketType,
                id: Date.now(),
              }),
            ];
            activeUnsubscribePayloads = [
              JSON.stringify({
                method: 'UNSUBSCRIBE',
                params: allStreams,
                marketType,
                id: Date.now() + 1,
              }),
            ];
          } else {
            const streams = activeStreams.join('/');
            streamUrl = isFut
              ? `wss://fstream.binance.com/stream?streams=${streams}`
              : `wss://data-stream.binance.vision/stream?streams=${streams}`;
            protocolName = `Binance Combined Stream`;
          }
        }

        setSyncMetrics((prev) => ({
          ...prev,
          streamProtocol: protocolName,
        }));

        if (!streamUrl) {
          activateFallbackPolling();
          return;
        }

        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed || wsRef.current !== ws) return;

          lastWsMessageAtRef.current = Date.now();
          reconnectAttemptsRef.current = 0;
          stopFallbackPolling();
          setWsStatus('connected');
          useMarketDataStore.getState().setConnectionState({
            wsStatus: 'connected',
            fallbackPollingActive: false,
            reconnectAttempt: 0,
            lastWsMessageAt: Date.now(),
          });

          // Automatically re-subscribe to all active + background streams
          for (const subMsg of onOpenSubPayloads) {
            try {
              ws.send(subMsg);
            } catch (_err) {}
          }

          // Heartbeat ping loop
          if (pingIntervalMs > 0 && pingPayload) {
            pingIntervalRef.current = window.setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                try {
                  lastPingSentAtRef.current = Date.now();
                  ws.send(pingPayload!);
                } catch (_pErr) {}
              }
            }, pingIntervalMs);
          }

          // Silence watchdog: if zero frames/pongs arrive for >18s, treat socket as dead & reconnect
          watchdogIntervalRef.current = window.setInterval(() => {
            if (!isSubscribed || wsRef.current !== ws) return;
            const silentMs = Date.now() - lastWsMessageAtRef.current;
            if (silentMs > 18_000) {
              try {
                ws.close();
              } catch (_e) {}
            }
          }, 5000);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed || wsRef.current !== ws) return;
          if (useMarketDataStore.getState().symbolEpoch !== currentEpoch) return;

          const clientRecv = Date.now();
          lastWsMessageAtRef.current = clientRecv;

          // If we were temporarily in fallback mode, automatically return to LIVE WebSocket
          if (fallbackPollIntervalRef.current !== null) {
            stopFallbackPolling();
            setWsStatus('connected');
            useMarketDataStore.getState().setConnectionState({
              wsStatus: 'connected',
              fallbackPollingActive: false,
            });
          }

          try {
            if (typeof event.data === 'string' && (event.data === 'pong' || event.data === 'ping')) {
              const rtt = lastPingSentAtRef.current > 0 ? clientRecv - lastPingSentAtRef.current : 12;
              useMarketDataStore.getState().recordHeartbeat(Math.min(250, Math.max(2, rtt)), clientRecv);
              return;
            }

            const raw = JSON.parse(event.data);

            if (raw.type === 'pong' || raw.op === 'pong' || raw.ret_msg === 'pong') {
              const rtt = lastPingSentAtRef.current > 0 ? clientRecv - lastPingSentAtRef.current : 10;
              useMarketDataStore.getState().recordHeartbeat(Math.min(250, Math.max(2, rtt)), clientRecv);
              return;
            }

            if (raw.type === 'PROXY_CONNECTED') {
              setWsStatus('connected');
              const proxyLat = Number(raw.latencyMs) || 8;
              setLatencyMs(proxyLat);
              useMarketDataStore.getState().setConnectionState({
                wsStatus: 'connected',
                fallbackPollingActive: false,
                latencyMs: proxyLat,
                lastWsMessageAt: clientRecv,
              });
              return;
            }

            const packet = raw.data || raw;
            const streamName: string = typeof raw.stream === 'string' ? raw.stream.toLowerCase() : '';
            const buf = bufferRef.current;

            // A. KuCoin Native Frame Processing
            if (exchange === 'KUCOIN') {
              if (raw.type === 'message') {
                const topicSym = typeof raw.topic === 'string' ? raw.topic.split(':')[1] || normalizedActiveSymbol : normalizedActiveSymbol;
                if (raw.subject === 'trade.ticker' && raw.data) {
                  const p = parseFloat(raw.data.price);
                  applyValidatedActiveTick({ payloadSymbol: topicSym, price: p, source: 'WS', now: clientRecv });
                } else if (raw.subject === 'trade.l3match' && raw.data) {
                  const tp = parseFloat(raw.data.price);
                  const tv = parseFloat(raw.data.size);
                  const isBuy = raw.data.side === 'buy';
                  const rawTs = Number(raw.data.time || clientRecv);
                  const ts = Math.floor(rawTs / (rawTs > 1e15 ? 1e6 : 1));
                  if (applyValidatedActiveTick({ payloadSymbol: topicSym, price: tp, source: 'WS', now: clientRecv })) {
                    const seq = ++tradeCounterRef.current;
                    applyValidatedTrades(
                      topicSym,
                      [
                        {
                          id: `kcn-ws-${raw.data.tradeId || ts}-${seq}`,
                          time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                          timestamp: ts,
                          price: tp,
                          amount: Number(tv.toFixed(4)),
                          isBuy,
                        },
                      ],
                      'WS',
                      clientRecv
                    );
                  }
                } else if (raw.subject === 'level2' && raw.data) {
                  applyValidatedOrderBook(topicSym, raw.data.bids, raw.data.asks, 'WS', clientRecv);
                }
              }
              return;
            }

            // B. Bitunix Native Frame Processing
            if (exchange === 'BITUNIX') {
              const btxSym = raw.symbol || normalizedActiveSymbol;
              if (raw.ch === 'ticker' && raw.data) {
                const p = parseFloat(raw.data.la || raw.data.c);
                const h = parseFloat(raw.data.h);
                const l = parseFloat(raw.data.l);
                const v = parseFloat(raw.data.q || raw.data.b);
                const o = parseFloat(raw.data.o);
                const chg = o > 0 && Number.isFinite(p) ? ((p - o) / o) * 100 : undefined;
                applyValidatedActiveTick({
                  payloadSymbol: btxSym,
                  price: p,
                  change24h: chg,
                  high24h: h,
                  low24h: l,
                  volume24h: v,
                  source: 'WS',
                  now: clientRecv,
                });
              } else if (raw.ch === 'trade' && Array.isArray(raw.data)) {
                const newTrades: LiveTradeTick[] = [];
                for (const item of raw.data) {
                  const tp = parseFloat(item.p);
                  const tv = parseFloat(item.v);
                  const isBuy = item.s === 'buy';
                  const dateObj = item.t ? new Date(item.t) : new Date(Number(raw.ts || clientRecv));
                  const ts = dateObj.getTime();
                  if (applyValidatedActiveTick({ payloadSymbol: btxSym, price: tp, source: 'WS', now: clientRecv })) {
                    const seq = ++tradeCounterRef.current;
                    newTrades.push({
                      id: `btx-ws-${ts}-${seq}`,
                      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      timestamp: ts,
                      price: tp,
                      amount: Number(tv.toFixed(4)),
                      isBuy,
                    });
                  }
                }
                applyValidatedTrades(btxSym, newTrades, 'WS', clientRecv);
              } else if (raw.ch === 'depth_books' && raw.data) {
                applyValidatedOrderBook(btxSym, raw.data.b, raw.data.a, 'WS', clientRecv);
              }
              return;
            }

            // C. Bybit V5 Native Frame Processing
            if (exchange === 'BYBIT') {
              const topicParts = typeof raw.topic === 'string' ? raw.topic.split('.') : [];
              const bybSym = topicParts[topicParts.length - 1] || normalizedActiveSymbol;
              if (raw.topic?.startsWith('tickers.') && raw.data) {
                const t = raw.data;
                const p = parseFloat(t.lastPrice);
                applyValidatedActiveTick({
                  payloadSymbol: bybSym,
                  price: p,
                  change24h: t.price24hPcnt ? parseFloat(t.price24hPcnt) * 100 : undefined,
                  high24h: t.highPrice24h ? parseFloat(t.highPrice24h) : undefined,
                  low24h: t.lowPrice24h ? parseFloat(t.lowPrice24h) : undefined,
                  volume24h: t.turnover24h ? parseFloat(t.turnover24h) : t.volume24h ? parseFloat(t.volume24h) : undefined,
                  source: 'WS',
                  now: clientRecv,
                });
              } else if (raw.topic?.startsWith('publicTrade.') && Array.isArray(raw.data)) {
                const newTrades: LiveTradeTick[] = [];
                for (const item of raw.data) {
                  const tp = parseFloat(item.p);
                  const tv = parseFloat(item.v || item.s);
                  const isBuy = item.S?.toLowerCase() === 'buy';
                  const ts = Number(item.T || clientRecv);
                  if (applyValidatedActiveTick({ payloadSymbol: bybSym, price: tp, source: 'WS', now: clientRecv })) {
                    const seq = ++tradeCounterRef.current;
                    newTrades.push({
                      id: `byb-ws-${item.i || ts}-${seq}`,
                      time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      timestamp: ts,
                      price: tp,
                      amount: Number(tv.toFixed(4)),
                      isBuy,
                    });
                  }
                }
                applyValidatedTrades(bybSym, newTrades, 'WS', clientRecv);
              } else if (raw.topic?.startsWith('orderbook.') && raw.data) {
                applyValidatedOrderBook(bybSym, raw.data.b, raw.data.a, 'WS', clientRecv);
              }
              return;
            }

            // D. OKX V5 Native Frame Processing
            if (exchange === 'OKX') {
              const okxSym = packet.arg?.instId || normalizedActiveSymbol;
              if (packet.arg?.channel === 'trades' && packet.data?.[0]) {
                const t = packet.data[0];
                const p = parseFloat(t.px);
                const sz = parseFloat(t.sz);
                const isBuy = t.side === 'buy';
                const ts = Number(t.ts || clientRecv);
                if (applyValidatedActiveTick({ payloadSymbol: okxSym, price: p, source: 'WS', now: clientRecv })) {
                  const seq = ++tradeCounterRef.current;
                  applyValidatedTrades(
                    okxSym,
                    [
                      {
                        id: `okx-ws-${t.tradeId || ts}-${seq}`,
                        time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        timestamp: ts,
                        price: p,
                        amount: sz,
                        isBuy,
                      },
                    ],
                    'WS',
                    clientRecv
                  );
                }
              } else if (packet.arg?.channel === 'books5' && packet.data?.[0]) {
                const book = packet.data[0];
                applyValidatedOrderBook(okxSym, book.bids, book.asks, 'WS', clientRecv);
              } else if (packet.arg?.channel === 'tickers' && packet.data?.[0]) {
                const t = packet.data[0];
                const p = parseFloat(t.last);
                const open24 = parseFloat(t.open24h);
                applyValidatedActiveTick({
                  payloadSymbol: okxSym,
                  price: p,
                  change24h: open24 > 0 && Number.isFinite(p) ? ((p - open24) / open24) * 100 : undefined,
                  high24h: t.high24h ? parseFloat(t.high24h) : undefined,
                  low24h: t.low24h ? parseFloat(t.low24h) : undefined,
                  volume24h: t.volCcy24h ? parseFloat(t.volCcy24h) : undefined,
                  source: 'WS',
                  now: clientRecv,
                });
              }
              return;
            }

            // E. Bitget V2 Native Frame Processing
            if (exchange === 'BITGET') {
              const bgSym = packet.arg?.instId || normalizedActiveSymbol;
              if (packet.arg?.channel === 'ticker' && packet.data?.[0]) {
                const t = packet.data[0];
                const p = parseFloat(t.lastPr);
                const open = parseFloat(t.open || '0');
                applyValidatedActiveTick({
                  payloadSymbol: bgSym,
                  price: p,
                  change24h: open > 0 && Number.isFinite(p) ? ((p - open) / open) * 100 : undefined,
                  high24h: t.high24h ? parseFloat(t.high24h) : undefined,
                  low24h: t.low24h ? parseFloat(t.low24h) : undefined,
                  volume24h: t.quoteVolume || t.usdtVolume ? parseFloat(t.quoteVolume || t.usdtVolume) : undefined,
                  source: 'WS',
                  now: clientRecv,
                });
              } else if (packet.arg?.channel === 'trade' && Array.isArray(packet.data)) {
                const newTrades: LiveTradeTick[] = [];
                for (const item of packet.data) {
                  const tp = parseFloat(item.price);
                  const tv = parseFloat(item.size);
                  const isBuy = item.side?.toLowerCase() === 'buy';
                  const ts = Number(item.ts || clientRecv);
                  if (applyValidatedActiveTick({ payloadSymbol: bgSym, price: tp, source: 'WS', now: clientRecv })) {
                    const seq = ++tradeCounterRef.current;
                    newTrades.push({
                      id: `bg-ws-${item.tradeId || ts}-${seq}`,
                      time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      timestamp: ts,
                      price: tp,
                      amount: Number(tv.toFixed(4)),
                      isBuy,
                    });
                  }
                }
                applyValidatedTrades(bgSym, newTrades, 'WS', clientRecv);
              } else if (packet.arg?.channel === 'books5' && packet.data?.[0]) {
                const book = packet.data[0];
                applyValidatedOrderBook(bgSym, book.bids, book.asks, 'WS', clientRecv);
              }
              return;
            }

            // F. Crypto.com Native Frame Processing
            if (exchange === 'CRYPTO_COM') {
              if (packet.method === 'public/heartbeat') {
                try {
                  ws.send(JSON.stringify({ id: packet.id, method: 'public/respond-heartbeat' }));
                } catch (_hbErr) {}
                return;
              }
              const resChannel = packet.result?.channel || packet.params?.channel || '';
              const cdcSym = packet.result?.instrument_name || packet.params?.instrument_name || normalizedActiveSymbol;
              const resData = packet.result?.data || packet.params?.data;

              if (resChannel === 'ticker' && resData?.[0]) {
                const t = resData[0];
                applyValidatedActiveTick({
                  payloadSymbol: cdcSym,
                  price: parseFloat(t.a),
                  change24h: t.c ? parseFloat(t.c) : undefined,
                  high24h: t.h ? parseFloat(t.h) : undefined,
                  low24h: t.l ? parseFloat(t.l) : undefined,
                  volume24h: t.v ? parseFloat(t.v) : undefined,
                  source: 'WS',
                  now: clientRecv,
                });
              } else if (resChannel === 'trade' && Array.isArray(resData)) {
                const newTrades: LiveTradeTick[] = [];
                for (const item of resData) {
                  const tp = parseFloat(item.p);
                  const tv = parseFloat(item.q);
                  const isBuy = item.s?.toUpperCase() === 'BUY';
                  const ts = Number(item.t || clientRecv);
                  if (applyValidatedActiveTick({ payloadSymbol: cdcSym, price: tp, source: 'WS', now: clientRecv })) {
                    const seq = ++tradeCounterRef.current;
                    newTrades.push({
                      id: `cdc-ws-${item.d || ts}-${seq}`,
                      time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      timestamp: ts,
                      price: tp,
                      amount: Number(tv.toFixed(4)),
                      isBuy,
                    });
                  }
                }
                applyValidatedTrades(cdcSym, newTrades, 'WS', clientRecv);
              } else if (resChannel.startsWith('book') && resData?.[0]) {
                const book = resData[0];
                applyValidatedOrderBook(cdcSym, book.bids, book.asks, 'WS', clientRecv);
              }
              return;
            }

            // -------------------------------------------------------------
            // G. Binance Multiplexed Proxy & Combined Stream Processing
            // -------------------------------------------------------------
            const streamPrefixSym = streamName ? streamName.split('@')[0] : '';
            const payloadSymbol = normalizeSymbol(packet.s || streamPrefixSym || '');

            // Background multi-symbol @ticker updates -> route straight into SSOT without touching active symbol buffer!
            if (payloadSymbol && payloadSymbol !== normalizedActiveSymbol) {
              if (packet.e === '24hrTicker' || streamName.includes('@ticker')) {
                const bgPrice = parseFloat(packet.c);
                const bgChange = parseFloat(packet.P || packet.p);
                const bgHigh = parseFloat(packet.h);
                const bgLow = parseFloat(packet.l);
                const bgVol = parseFloat(packet.q || packet.v);
                if (Number.isFinite(bgPrice) && bgPrice > 0) {
                  useMarketDataStore.getState().ingestPriceTick({
                    symbol: payloadSymbol,
                    price: bgPrice,
                    change24h: Number.isFinite(bgChange) ? bgChange : undefined,
                    high24h: Number.isFinite(bgHigh) ? bgHigh : null,
                    low24h: Number.isFinite(bgLow) ? bgLow : null,
                    volume24h: formatQuoteVolume(bgVol) ?? null,
                    source: 'WS',
                    now: clientRecv,
                  });
                }
              }
              return;
            }

            const effectiveSym = payloadSymbol || normalizedActiveSymbol;
            const serverEventTime = Number(packet.E || packet.T || packet.ts || clientRecv);
            const deltaLatency = Math.max(1, Math.min(250, clientRecv - serverEventTime));

            buf.serverEventTime = serverEventTime;
            buf.clientReceivedTime = clientRecv;
            buf.latencyMs = deltaLatency;
            useMarketDataStore.getState().recordHeartbeat(deltaLatency, clientRecv);

            // 1. aggTrade Tick
            if (packet.e === 'aggTrade' || streamName.includes('aggtrade')) {
              const tradePrice = parseFloat(packet.p);
              const tradeQty = parseFloat(packet.q);
              const isBuy = !packet.m;

              if (
                applyValidatedActiveTick({
                  payloadSymbol: effectiveSym,
                  price: tradePrice,
                  source: 'WS',
                  now: clientRecv,
                })
              ) {
                ticksSavedCounterRef.current += 1;
                const seq = ++tradeCounterRef.current;
                const newTrade: LiveTradeTick = {
                  id: `bin-ws-${packet.a || serverEventTime}-${seq}`,
                  time: new Date(serverEventTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                  timestamp: serverEventTime,
                  price: tradePrice,
                  amount: Number(tradeQty.toFixed(4)),
                  isBuy,
                };
                applyValidatedTrades(effectiveSym, [newTrade], 'WS', clientRecv);
              }
            }

            // 2. Order Book Depth (@depth10@100ms or depthUpdate)
            if (streamName.includes('depth') || packet.e === 'depthUpdate' || packet.bids || packet.b) {
              const rawBids = packet.bids || packet.b;
              const rawAsks = packet.asks || packet.a;
              if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
                applyValidatedOrderBook(effectiveSym, rawBids, rawAsks, 'WS', clientRecv);
              }
            }

            // 3. Kline
            if (packet.e === 'kline' && packet.k) {
              const k = packet.k;
              const kSym = normalizeSymbol(k.s || effectiveSym);
              const closePrice = parseFloat(k.c);
              if (
                kSym === normalizedActiveSymbol &&
                applyValidatedActiveTick({
                  payloadSymbol: kSym,
                  price: closePrice,
                  source: 'WS',
                  now: clientRecv,
                })
              ) {
                buf.liveCandle = {
                  time: Number(k.t),
                  open: parseFloat(k.o),
                  high: parseFloat(k.h),
                  low: parseFloat(k.l),
                  close: closePrice,
                  volume: parseFloat(k.v),
                };
                buf.hasUpdate = true;
              }
            }

            // 4. 24hr Ticker
            if (packet.e === '24hrTicker' || streamName.includes('ticker')) {
              const currentPrice = parseFloat(packet.c);
              const change = parseFloat(packet.P || packet.p);
              const high = parseFloat(packet.h);
              const low = parseFloat(packet.l);
              const qVol = parseFloat(packet.q || packet.v);
              const bestBid = parseFloat(packet.b);
              const bestAsk = parseFloat(packet.a);

              applyValidatedActiveTick({
                payloadSymbol: effectiveSym,
                price: currentPrice,
                change24h: Number.isFinite(change) ? change : undefined,
                high24h: Number.isFinite(high) ? high : undefined,
                low24h: Number.isFinite(low) ? low : undefined,
                volume24h: Number.isFinite(qVol) ? qVol : undefined,
                source: 'WS',
                now: clientRecv,
              });

              if (Number.isFinite(bestBid) && bestBid > 0 && Number.isFinite(bestAsk) && bestAsk > bestBid) {
                useMarketDataStore.getState().ingestPriceTick({
                  symbol: effectiveSym,
                  expectedSymbol: normalizedActiveSymbol,
                  price: currentPrice,
                  bid: bestBid,
                  ask: bestAsk,
                  source: 'WS',
                  now: clientRecv,
                });
              }
            }
          } catch (_err) {
            // Ignore malformed JSON frames
          }
        };

        ws.onerror = () => {
          if (!isSubscribed || wsRef.current !== ws) return;
          activateFallbackPolling();
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          if (pingIntervalRef.current !== null) {
            window.clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          if (watchdogIntervalRef.current !== null) {
            window.clearInterval(watchdogIntervalRef.current);
            watchdogIntervalRef.current = null;
          }

          if (!isBrowserOnline()) {
            setWsStatus('disconnected');
            useMarketDataStore.getState().setOnlineStatus(false);
            stopFallbackPolling();
            return;
          }

          activateFallbackPolling();
          scheduleReconnect();
        };
      } catch (_err) {
        activateFallbackPolling();
        scheduleReconnect();
      }
    };

    const handleOffline = () => {
      if (!isSubscribed) return;
      useMarketDataStore.getState().setOnlineStatus(false);
      setWsStatus('disconnected');
      stopFallbackPolling();
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      teardownActiveSocket(false);
    };

    const handleOnline = () => {
      if (!isSubscribed) return;
      useMarketDataStore.getState().setOnlineStatus(true);
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setWsStatus('connecting');
      useMarketDataStore.getState().setConnectionState({
        wsStatus: 'connecting',
        reconnectAttempt: 0,
      });
      fetchLiveRestSnapshot();
      initWebSocket();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
    }

    if (isBrowserOnline()) {
      initWebSocket();
    }

    return () => {
      isSubscribed = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
      }
      clearAllTimers();
      teardownActiveSocket(true);
    };
  }, [symbol, timeframe, exchange, marketType]);

  return {
    livePrice,
    priceChange24h,
    high24h,
    low24h,
    volume24h,
    priceDirection,
    wsStatus,
    liveCandle,
    latencyMs,
    activeSource,
    syncMetrics,
    recentLiveTrades,
    orderBookBids,
    orderBookAsks,
    bidTotal,
    askTotal,
  };
}
