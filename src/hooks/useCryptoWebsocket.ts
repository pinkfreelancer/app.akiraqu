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
import { getCryptoPrecision } from '../utils/formatters';

export interface UseCryptoWebsocketResult {
  livePrice: number | null;
  priceChange24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  priceDirection: 'up' | 'down' | 'neutral';
  wsStatus: 'connected' | 'connecting' | 'fallback';
  liveCandle: OHLCVCandle | null;
  latencyMs: number;
  activeSource: string;
  // Real-time synchronization metrics & orderflow telemetry
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
  bids: LiveOrderBookLevel[];
  asks: LiveOrderBookLevel[];
  bidTotal: number;
  askTotal: number;
  hasUpdate: boolean;
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
  fallbackBasePrice?: number,
  exchange: SupportedExchange = 'BINANCE',
  marketType: MarketType = 'SPOT'
): UseCryptoWebsocketResult {
  // Rendered States for UI
  const [livePrice, setLivePrice] = useState<number | null>(fallbackBasePrice || null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [high24h, setHigh24h] = useState<number | null>(null);
  const [low24h, setLow24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'fallback'>('connecting');
  const [liveCandle, setLiveCandle] = useState<OHLCVCandle | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(12);
  const [activeSource, setActiveSource] = useState<string>(`${exchange} ${marketType}`);
  
  // Real-time synced order book & trade ticks (100% genuine data)
  const [recentLiveTrades, setRecentLiveTrades] = useState<LiveTradeTick[]>([]);
  const [orderBookBids, setOrderBookBids] = useState<LiveOrderBookLevel[]>([]);
  const [orderBookAsks, setOrderBookAsks] = useState<LiveOrderBookLevel[]>([]);
  const [bidTotal, setBidTotal] = useState<number>(0);
  const [askTotal, setAskTotal] = useState<number>(0);

  // Sync Telemetry
  const [syncMetrics, setSyncMetrics] = useState<WebSocketSyncMetrics>({
    serverEventTime: Date.now(),
    clientReceivedTime: Date.now(),
    deltaLatencyMs: 12,
    streamProtocol: `${exchange} Native Stream`,
    fpsRenderRate: 60,
    droppedTicksSaved: 0,
    isFuturesAligned: marketType === 'FUTURES',
  });

  const prevPriceRef = useRef<number | null>(fallbackBasePrice || null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  
  // RAF (RequestAnimationFrame) Throttling Buffer
  const bufferRef = useRef<RawBufferState>({
    lastPrice: fallbackBasePrice || null,
    priceChange24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    liveCandle: null,
    serverEventTime: Date.now(),
    clientReceivedTime: Date.now(),
    latencyMs: 12,
    tradesBuffer: [],
    bids: [],
    asks: [],
    bidTotal: 0,
    askTotal: 0,
    hasUpdate: false,
  });

  const rafIdRef = useRef<number | null>(null);
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(Date.now());
  const ticksSavedCounterRef = useRef<number>(0);
  const tradeCounterRef = useRef<number>(0);

  // -------------------------------------------------------------
  // RequestAnimationFrame Render Loop with Smart 60fps Batching
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
        }

        if (buf.priceChange24h !== null) setPriceChange24h(buf.priceChange24h);
        if (buf.high24h !== null) setHigh24h(buf.high24h);
        if (buf.low24h !== null) setLow24h(buf.low24h);
        if (buf.volume24h !== null) setVolume24h(buf.volume24h);
        if (buf.liveCandle !== null) setLiveCandle(buf.liveCandle);

        if (buf.tradesBuffer.length > 0) {
          setRecentLiveTrades([...buf.tradesBuffer]);
        }

        if (buf.bids.length > 0) setOrderBookBids([...buf.bids]);
        if (buf.asks.length > 0) setOrderBookAsks([...buf.asks]);
        if (buf.bidTotal > 0) setBidTotal(buf.bidTotal);
        if (buf.askTotal > 0) setAskTotal(buf.askTotal);

        setLatencyMs(buf.latencyMs);

        // Calculate Render FPS Performance
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
  // Main WebSocket Lifecycle with Dedicated Exchange Drivers
  // -------------------------------------------------------------
  useEffect(() => {
    const cleanPair = symbol.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    const formattedPair = formatExchangeSymbol(symbol, exchange, marketType);
    const tfParam = mapTimeframeToExchange(timeframe, exchange);

    setWsStatus('connecting');
    setActiveSource(`${exchange} ${marketType}`);
    setLivePrice(fallbackBasePrice || null);
    prevPriceRef.current = fallbackBasePrice || null;
    setLiveCandle(null);
    setPriceChange24h(null);
    setHigh24h(null);
    setLow24h(null);
    setVolume24h(null);
    setPriceDirection('neutral');

    // Reset buffer (Strictly genuine data, no synthetic random seeding)
    bufferRef.current.lastPrice = fallbackBasePrice || null;
    bufferRef.current.bids = [];
    bufferRef.current.asks = [];
    bufferRef.current.bidTotal = 0;
    bufferRef.current.askTotal = 0;
    bufferRef.current.tradesBuffer = [];
    bufferRef.current.hasUpdate = true;

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_e) {}
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    let isSubscribed = true;

    // Helper: Map raw depth arrays into typed orderbook levels
    const parseDepthLevels = (rawBids: any[], rawAsks: any[], lastP: number) => {
      let bTot = 0;
      let aTot = 0;
      const dec = getCryptoPrecision(lastP || 100);

      const parsedBids: LiveOrderBookLevel[] = (rawBids || []).slice(0, 10).map((b: any[]) => {
        const p = parseFloat(b[0]);
        const a = parseFloat(b[1]);
        bTot += a;
        return {
          price: Number(p.toFixed(dec)),
          amount: Number(a.toFixed(4)),
          total: Number(bTot.toFixed(4)),
        };
      });

      const parsedAsks: LiveOrderBookLevel[] = (rawAsks || []).slice(0, 10).map((a: any[]) => {
        const p = parseFloat(a[0]);
        const aAmount = parseFloat(a[1]);
        aTot += aAmount;
        return {
          price: Number(p.toFixed(dec)),
          amount: Number(aAmount.toFixed(4)),
          total: Number(aTot.toFixed(4)),
        };
      });

      return { bids: parsedBids, asks: parsedAsks, bidTotal: bTot, askTotal: aTot };
    };

    // -------------------------------------------------------------
    // Genuine REST Snapshot: Fetches actual 24h ticker, L2 depth, and recent trades
    // -------------------------------------------------------------
    const fetchLiveRestSnapshot = async () => {
      const restStart = Date.now();
      try {
        const isFut = marketType === 'FUTURES';
        let tickerUrls: string[] = [];
        let depthUrl = '';
        let tradesUrl = '';

        if (exchange === 'OKX') {
          tickerUrls = [`https://www.okx.com/api/v5/market/ticker?instId=${formattedPair}`];
          depthUrl = `https://www.okx.com/api/v5/market/books?instId=${formattedPair}&sz=10`;
          tradesUrl = `https://www.okx.com/api/v5/market/trades?instId=${formattedPair}&limit=15`;
        } else if (exchange === 'KUCOIN') {
          tickerUrls = [
            isFut
              ? `https://api-futures.kucoin.com/api/v1/ticker?symbol=${formattedPair}`
              : `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${formattedPair}`,
          ];
          depthUrl = isFut
            ? `https://api-futures.kucoin.com/api/v1/level2/depth20?symbol=${formattedPair}`
            : `https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=${formattedPair}`;
          tradesUrl = isFut
            ? `https://api-futures.kucoin.com/api/v1/trade/history?symbol=${formattedPair}`
            : `https://api.kucoin.com/api/v1/market/histories?symbol=${formattedPair}`;
        } else if (exchange === 'BITUNIX') {
          tickerUrls = [
            `https://fapi.bitunix.com/api/v1/futures/market/kline?symbol=${cleanPair.toUpperCase()}&interval=1m&limit=1`,
            `/api/v1/ticker?symbol=${encodeURIComponent(symbol)}&marketType=FUTURES`,
          ];
          depthUrl = `https://fapi.bitunix.com/api/v1/futures/market/depth?symbol=${cleanPair.toUpperCase()}`;
        } else if (exchange === 'BYBIT') {
          const cat = isFut ? 'linear' : 'spot';
          tickerUrls = [`https://api.bybit.com/v5/market/tickers?category=${cat}&symbol=${cleanPair.toUpperCase()}`];
          depthUrl = `https://api.bybit.com/v5/market/orderbook?category=${cat}&symbol=${cleanPair.toUpperCase()}&limit=10`;
          tradesUrl = `https://api.bybit.com/v5/market/recent-trade?category=${cat}&symbol=${cleanPair.toUpperCase()}&limit=15`;
        } else if (exchange === 'CRYPTO_COM') {
          tickerUrls = [`https://api.crypto.com/exchange/v1/public/get-ticker?instrument_name=${formattedPair}`];
          depthUrl = `https://api.crypto.com/exchange/v1/public/get-book?instrument_name=${formattedPair}&depth=10`;
          tradesUrl = `https://api.crypto.com/exchange/v1/public/get-trades?instrument_name=${formattedPair}`;
        } else {
          // Binance (Spot / Futures)
          tickerUrls = isFut
            ? [
                `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${cleanPair.toUpperCase()}`,
                `/api/v1/ticker?symbol=${encodeURIComponent(symbol)}&marketType=FUTURES`,
              ]
            : [
                `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${cleanPair.toUpperCase()}`,
                `/api/v1/ticker?symbol=${encodeURIComponent(symbol)}&marketType=SPOT`,
                `https://api.binance.com/api/v3/ticker/24hr?symbol=${cleanPair.toUpperCase()}`,
              ];
          depthUrl = isFut
            ? `https://fapi.binance.com/fapi/v1/depth?symbol=${cleanPair.toUpperCase()}&limit=10`
            : `https://api.binance.com/api/v3/depth?symbol=${cleanPair.toUpperCase()}&limit=10`;
          tradesUrl = isFut
            ? `https://fapi.binance.com/fapi/v1/trades?symbol=${cleanPair.toUpperCase()}&limit=15`
            : `https://api.binance.com/api/v3/trades?symbol=${cleanPair.toUpperCase()}&limit=15`;
        }

        // 1. Fetch Ticker
        let tickerRes: Response | null = null;
        for (const targetUrl of tickerUrls) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const r = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeout);
            if (r.ok) {
              tickerRes = r;
              break;
            }
          } catch (_e) {}
        }

        if (tickerRes && tickerRes.ok && isSubscribed) {
          const d = await tickerRes.json();
          let p = NaN;
          let c = NaN;
          let h = NaN;
          let l = NaN;
          let v = NaN;

          if (d.status === 'success' && d.price !== undefined) {
            p = parseFloat(d.price);
            c = parseFloat(d.priceChangePercent);
            h = parseFloat(d.high);
            l = parseFloat(d.low);
            v = parseFloat(d.volume);
          } else if (exchange === 'OKX' && d.data?.[0]) {
            const t = d.data[0];
            p = parseFloat(t.last);
            h = parseFloat(t.high24h);
            l = parseFloat(t.low24h);
            v = parseFloat(t.volCcy24h || t.vol24h);
            const open24 = parseFloat(t.open24h);
            if (open24 > 0) c = ((p - open24) / open24) * 100;
          } else if (exchange === 'KUCOIN' && d.data) {
            p = parseFloat(d.data.price || d.data.last);
            v = parseFloat(d.data.volume || d.data.size);
          } else if (exchange === 'BITUNIX' && d.data?.[0]) {
            const k = d.data[0];
            p = parseFloat(k.close);
            h = parseFloat(k.high);
            l = parseFloat(k.low);
            v = parseFloat(k.baseVol || k.quoteVol);
            const o = parseFloat(k.open);
            if (o > 0) c = ((p - o) / o) * 100;
          } else if (exchange === 'BYBIT' && d.result?.list?.[0]) {
            const t = d.result.list[0];
            p = parseFloat(t.lastPrice);
            h = parseFloat(t.highPrice24h);
            l = parseFloat(t.lowPrice24h);
            c = parseFloat(t.price24hPcnt) * 100;
            v = parseFloat(t.volume24h);
          } else if (exchange === 'CRYPTO_COM' && d.result?.data?.[0]) {
            const t = d.result.data[0];
            p = parseFloat(t.a);
            c = parseFloat(t.c);
            h = parseFloat(t.h);
            l = parseFloat(t.l);
            v = parseFloat(t.v);
          } else {
            p = parseFloat(d.lastPrice || d.price);
            c = parseFloat(d.priceChangePercent);
            h = parseFloat(d.highPrice);
            l = parseFloat(d.lowPrice);
            v = parseFloat(d.quoteVolume);
          }

          if (!isNaN(p)) {
            const buf = bufferRef.current;
            buf.lastPrice = p;
            if (!isNaN(c)) buf.priceChange24h = c;
            if (!isNaN(h)) buf.high24h = h;
            if (!isNaN(l)) buf.low24h = l;
            if (!isNaN(v)) buf.volume24h = v;
            buf.latencyMs = Math.max(10, Date.now() - restStart);
            buf.clientReceivedTime = Date.now();
            buf.serverEventTime = Date.now();
            buf.hasUpdate = true;
          }
        }

        // 2. Fetch Genuine L2 Order Book Depth
        if (depthUrl && isSubscribed) {
          try {
            const depthCtrl = new AbortController();
            const dTimeout = setTimeout(() => depthCtrl.abort(), 3500);
            const dRes = await fetch(depthUrl, { signal: depthCtrl.signal });
            clearTimeout(dTimeout);
            if (dRes.ok) {
              const dJson = await dRes.json();
              let rawBids: any[] = [];
              let rawAsks: any[] = [];

              if (exchange === 'OKX' && dJson.data?.[0]) {
                rawBids = dJson.data[0].bids;
                rawAsks = dJson.data[0].asks;
              } else if (exchange === 'KUCOIN' && dJson.data) {
                rawBids = dJson.data.bids;
                rawAsks = dJson.data.asks;
              } else if (exchange === 'BITUNIX' && dJson.data) {
                rawBids = dJson.data.bids || dJson.data.b;
                rawAsks = dJson.data.asks || dJson.data.a;
              } else if (exchange === 'BYBIT' && dJson.result) {
                rawBids = dJson.result.b;
                rawAsks = dJson.result.a;
              } else if (exchange === 'CRYPTO_COM' && dJson.result?.data?.[0]) {
                rawBids = dJson.result.data[0].bids;
                rawAsks = dJson.result.data[0].asks;
              } else if (dJson.bids && dJson.asks) {
                rawBids = dJson.bids;
                rawAsks = dJson.asks;
              }

              if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
                const parsed = parseDepthLevels(rawBids, rawAsks, bufferRef.current.lastPrice || 100);
                bufferRef.current.bids = parsed.bids;
                bufferRef.current.asks = parsed.asks;
                bufferRef.current.bidTotal = parsed.bidTotal;
                bufferRef.current.askTotal = parsed.askTotal;
                bufferRef.current.hasUpdate = true;
              }
            }
          } catch (_depthErr) {}
        }

        // 3. Fetch Genuine Recent Live Trades
        if (tradesUrl && isSubscribed) {
          try {
            const tradesCtrl = new AbortController();
            const tTimeout = setTimeout(() => tradesCtrl.abort(), 3500);
            const tRes = await fetch(tradesUrl, { signal: tradesCtrl.signal });
            clearTimeout(tTimeout);
            if (tRes.ok) {
              const tJson = await tRes.json();
              const parsedTrades: LiveTradeTick[] = [];

              if (exchange === 'KUCOIN' && Array.isArray(tJson.data)) {
                tJson.data.slice(0, 15).forEach((item: any, idx: number) => {
                  const tp = parseFloat(item.price);
                  const tv = parseFloat(item.size);
                  const isBuy = item.side === 'buy';
                  const ts = Math.floor(Number(item.time) / (item.time > 1e15 ? 1e6 : 1));
                  const seq = ++tradeCounterRef.current;
                  parsedTrades.push({
                    id: `kcn-r-${item.sequence || item.tradeId || ts}-${idx}-${seq}`,
                    time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    timestamp: ts,
                    price: tp,
                    amount: Number(tv.toFixed(4)),
                    isBuy,
                  });
                });
              } else if (exchange === 'OKX' && Array.isArray(tJson.data)) {
                tJson.data.slice(0, 15).forEach((item: any, idx: number) => {
                  const tp = parseFloat(item.px);
                  const tv = parseFloat(item.sz);
                  const isBuy = item.side === 'buy';
                  const ts = Number(item.ts);
                  const seq = ++tradeCounterRef.current;
                  parsedTrades.push({
                    id: `okx-r-${item.tradeId || ts}-${idx}-${seq}`,
                    time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    timestamp: ts,
                    price: tp,
                    amount: Number(tv.toFixed(4)),
                    isBuy,
                  });
                });
              } else if (exchange === 'BYBIT' && Array.isArray(tJson.result?.list)) {
                tJson.result.list.slice(0, 15).forEach((item: any, idx: number) => {
                  const tp = parseFloat(item.price);
                  const tv = parseFloat(item.size);
                  const isBuy = item.side?.toLowerCase() === 'buy';
                  const ts = Number(item.time);
                  const seq = ++tradeCounterRef.current;
                  parsedTrades.push({
                    id: `byb-r-${item.execId || ts}-${idx}-${seq}`,
                    time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    timestamp: ts,
                    price: tp,
                    amount: Number(tv.toFixed(4)),
                    isBuy,
                  });
                });
              } else if (Array.isArray(tJson)) {
                // Binance format
                tJson.slice(0, 15).forEach((item: any, idx: number) => {
                  const tp = parseFloat(item.price);
                  const tv = parseFloat(item.qty);
                  const isBuy = !item.isBuyerMaker;
                  const ts = Number(item.time);
                  const seq = ++tradeCounterRef.current;
                  parsedTrades.push({
                    id: `bin-r-${item.id || ts}-${idx}-${seq}`,
                    time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    timestamp: ts,
                    price: tp,
                    amount: Number(tv.toFixed(4)),
                    isBuy,
                  });
                });
              }

              if (parsedTrades.length > 0) {
                bufferRef.current.tradesBuffer = parsedTrades;
                bufferRef.current.hasUpdate = true;
              }
            }
          } catch (_tradesErr) {}
        }
      } catch (_e) {
        // Safe error handling
      }
    };

    fetchLiveRestSnapshot();

    // -------------------------------------------------------------
    // WebSocket Connection Initialization with Native Protocols
    // -------------------------------------------------------------
    const initWebSocket = async () => {
      try {
        let streamUrl = '';
        let protocolName = '';
        let pingIntervalMs = 0;
        let pingPayload: string | null = null;
        let onOpenSubPayloads: string[] = [];

        if (exchange === 'KUCOIN') {
          // Dedicated KuCoin WebSocket Channel via Bullet-Public Handshake
          const isFut = marketType === 'FUTURES';
          protocolName = `KuCoin Native WebSocket (${isFut ? 'Futures' : 'Spot'} @match + @level2Depth5 + @ticker)`;

          try {
            // Fetch public token via backend proxy or direct
            let bData: any = null;
            try {
              const proxyRes = await fetch(`/api/v1/market/kucoin-bullet?marketType=${marketType}`, { method: 'POST' });
              if (proxyRes.ok) bData = await proxyRes.json();
            } catch (_err) {}

            if (!bData || bData.code !== '200000') {
              const directUrl = isFut
                ? 'https://api-futures.kucoin.com/api/v1/bullet-public'
                : 'https://api.kucoin.com/api/v1/bullet-public';
              const directRes = await fetch(directUrl, { method: 'POST' });
              if (directRes.ok) bData = await directRes.json();
            }

            if (bData && bData.data?.token) {
              const token = bData.data.token;
              const endpoint = bData.data.instanceServers?.[0]?.endpoint || (isFut ? 'wss://ws-api-futures.kucoin.com/' : 'wss://ws-api-spot.kucoin.com/');
              streamUrl = `${endpoint}?token=${token}`;
            }
          } catch (_kErr) {
            streamUrl = isFut ? 'wss://ws-api-futures.kucoin.com/' : 'wss://ws-api-spot.kucoin.com/';
          }

          pingIntervalMs = 18000;
          pingPayload = JSON.stringify({ id: Date.now(), type: 'ping' });

          const depthTopic = isFut
            ? `/contractMarket/level2Depth5:${formattedPair}`
            : `/spotMarket/level2Depth5:${formattedPair}`;

          onOpenSubPayloads = [
            JSON.stringify({ id: Date.now(), type: 'subscribe', topic: `/market/ticker:${formattedPair}`, privateChannel: false, response: true }),
            JSON.stringify({ id: Date.now() + 1, type: 'subscribe', topic: `/market/match:${formattedPair}`, privateChannel: false, response: true }),
            JSON.stringify({ id: Date.now() + 2, type: 'subscribe', topic: depthTopic, privateChannel: false, response: true }),
          ];
        } else if (exchange === 'BITUNIX') {
          // Dedicated Bitunix WebSocket Channel (Direct to fapi.bitunix.com/public/)
          streamUrl = 'wss://fapi.bitunix.com/public/';
          protocolName = 'Bitunix Native WebSocket (fapi @trade + @depth_books + @ticker)';
          pingIntervalMs = 15000;
          pingPayload = JSON.stringify({ op: 'ping' });

          const btxSymbol = cleanPair.toUpperCase();
          onOpenSubPayloads = [
            JSON.stringify({
              op: 'subscribe',
              args: [
                { symbol: btxSymbol, ch: 'ticker' },
                { symbol: btxSymbol, ch: 'trade' },
                { symbol: btxSymbol, ch: 'depth_books' },
              ],
            }),
          ];
        } else if (exchange === 'BYBIT') {
          // Dedicated Bybit V5 WebSocket Channel
          const isFut = marketType === 'FUTURES';
          streamUrl = `wss://stream.bybit.com/v5/public/${isFut ? 'linear' : 'spot'}`;
          protocolName = `Bybit V5 Native WebSocket (${isFut ? 'Linear' : 'Spot'} @publicTrade + @orderbook.5)`;
          pingIntervalMs = 20000;
          pingPayload = JSON.stringify({ op: 'ping' });

          const bybitPair = cleanPair.toUpperCase();
          onOpenSubPayloads = [
            JSON.stringify({
              op: 'subscribe',
              args: [
                `tickers.${bybitPair}`,
                `publicTrade.${bybitPair}`,
                `orderbook.5.${bybitPair}`,
              ],
            }),
          ];
        } else if (exchange === 'OKX') {
          // Dedicated OKX V5 WebSocket Channel
          streamUrl = 'wss://ws.okx.com:8443/ws/v5/public';
          protocolName = 'OKX-v5 Native WebSocket (@trades + @books5 + @tickers)';
          pingIntervalMs = 25000;
          pingPayload = 'ping';

          onOpenSubPayloads = [
            JSON.stringify({
              op: 'subscribe',
              args: [
                { channel: 'tickers', instId: formattedPair },
                { channel: 'trades', instId: formattedPair },
                { channel: 'books5', instId: formattedPair },
                { channel: `candle${tfParam}`, instId: formattedPair },
              ],
            }),
          ];
        } else if (exchange === 'CRYPTO_COM') {
          // Dedicated Crypto.com WebSocket Channel
          streamUrl = 'wss://stream.crypto.com/exchange/v1/market';
          protocolName = 'CryptoCom-v1 Native WebSocket (@trade + @depth + @ticker)';
          onOpenSubPayloads = [
            JSON.stringify({
              id: 1,
              method: 'subscribe',
              params: {
                channels: [
                  `ticker.${formattedPair}`,
                  `trade.${formattedPair}`,
                  `candlestick.${tfParam}.${formattedPair}`,
                ],
              },
            }),
          ];
        } else {
          // Binance Stream via Server-Side Multiplexed WebSocket Proxy /ws/market
          const isFut = marketType === 'FUTURES';
          const depthSpeed = '100ms';
          const proxyUrl = getProxyWsUrl();

          const streamParams = [
            `${cleanPair}@aggTrade`,
            `${cleanPair}@depth10@${depthSpeed}`,
            `${cleanPair}@kline_${tfParam}`,
            `${cleanPair}@ticker`,
          ];

          if (proxyUrl) {
            streamUrl = proxyUrl;
            protocolName = isFut
              ? `AKIRAQU Server Proxy Binance Futures (@aggTrade + @depth10@100ms + @kline_${tfParam})`
              : `AKIRAQU Server Proxy Binance Spot (@aggTrade + @depth10@100ms + @kline_${tfParam})`;

            onOpenSubPayloads = [
              JSON.stringify({
                method: 'SUBSCRIBE',
                params: streamParams,
                marketType,
                id: Date.now(),
              }),
            ];
          } else {
            const streams = streamParams.join('/');
            streamUrl = isFut
              ? `wss://fstream.binance.com/stream?streams=${streams}`
              : `wss://stream.binance.com/stream?streams=${streams}`;

            protocolName = isFut
              ? `Binance Futures fstream (@aggTrade + @depth10@100ms + @kline_${tfParam})`
              : `Binance Spot combinedStream (@aggTrade + @depth10@100ms + @kline_${tfParam})`;
          }
        }

        setSyncMetrics((prev) => ({
          ...prev,
          streamProtocol: protocolName,
        }));

        if (!streamUrl) return;

        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setWsStatus('connected');

          // Send subscription frames
          for (const subMsg of onOpenSubPayloads) {
            try {
              ws.send(subMsg);
            } catch (_err) {}
          }

          // Start persistent ping timer if specified
          if (pingIntervalMs > 0 && pingPayload) {
            pingIntervalRef.current = window.setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                try {
                  ws.send(pingPayload!);
                } catch (_pErr) {}
              }
            }, pingIntervalMs);
          }
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const clientRecv = Date.now();
            const raw = JSON.parse(event.data);

            // Handle Server-Side WS Proxy Greeting Frame
            if (raw.type === 'PROXY_CONNECTED') {
              setWsStatus('connected');
              if (raw.latencyMs) setLatencyMs(raw.latencyMs);
              return;
            }

            const packet = raw.data || raw;
            const streamName: string = raw.stream || '';
            const buf = bufferRef.current;

            // -------------------------------------------------------------
            // A. KuCoin Native Frame Processing
            // -------------------------------------------------------------
            if (exchange === 'KUCOIN') {
              if (raw.type === 'message') {
                // Ticker
                if (raw.subject === 'trade.ticker' && raw.data) {
                  const p = parseFloat(raw.data.price);
                  if (!isNaN(p)) {
                    buf.lastPrice = p;
                    const sTime = Number(raw.data.time || clientRecv);
                    buf.serverEventTime = sTime;
                    buf.clientReceivedTime = clientRecv;
                    buf.latencyMs = Math.max(1, Math.min(250, clientRecv - sTime));
                    buf.hasUpdate = true;
                  }
                }
                // Live Trade Match
                else if (raw.subject === 'trade.l3match' && raw.data) {
                  const tp = parseFloat(raw.data.price);
                  const tv = parseFloat(raw.data.size);
                  const isBuy = raw.data.side === 'buy';
                  const rawTs = Number(raw.data.time || Date.now());
                  const ts = Math.floor(rawTs / (rawTs > 1e15 ? 1e6 : 1));

                  if (!isNaN(tp)) {
                    buf.lastPrice = tp;
                    ticksSavedCounterRef.current += 1;
                    const dateObj = new Date(ts);
                    const formattedTime = dateObj.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    const seq = ++tradeCounterRef.current;
                    const newTrade: LiveTradeTick = {
                      id: `kcn-ws-${raw.data.tradeId || raw.data.sequence || ts}-${seq}`,
                      time: formattedTime,
                      timestamp: ts,
                      price: tp,
                      amount: Number(tv.toFixed(4)),
                      isBuy,
                    };

                    buf.tradesBuffer = [newTrade, ...buf.tradesBuffer.slice(0, 19)];
                    buf.serverEventTime = ts;
                    buf.clientReceivedTime = clientRecv;
                    buf.latencyMs = Math.max(1, Math.min(250, clientRecv - ts));
                    buf.hasUpdate = true;
                  }
                }
                // Order Book Depth
                else if (raw.subject === 'level2' && raw.data) {
                  const rawBids = raw.data.bids;
                  const rawAsks = raw.data.asks;
                  if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
                    const parsed = parseDepthLevels(rawBids, rawAsks, buf.lastPrice || 100);
                    buf.bids = parsed.bids;
                    buf.asks = parsed.asks;
                    buf.bidTotal = parsed.bidTotal;
                    buf.askTotal = parsed.askTotal;
                    buf.hasUpdate = true;
                  }
                }
              }
              return;
            }

            // -------------------------------------------------------------
            // B. Bitunix Native Frame Processing
            // -------------------------------------------------------------
            if (exchange === 'BITUNIX') {
              // Ticker
              if (raw.ch === 'ticker' && raw.data) {
                const p = parseFloat(raw.data.la || raw.data.c);
                const h = parseFloat(raw.data.h);
                const l = parseFloat(raw.data.l);
                const v = parseFloat(raw.data.q || raw.data.b);
                const o = parseFloat(raw.data.o);

                if (!isNaN(p)) buf.lastPrice = p;
                if (!isNaN(h)) buf.high24h = h;
                if (!isNaN(l)) buf.low24h = l;
                if (!isNaN(v)) buf.volume24h = v;
                if (o > 0 && !isNaN(p)) buf.priceChange24h = ((p - o) / o) * 100;

                const ts = Number(raw.ts || clientRecv);
                buf.serverEventTime = ts;
                buf.clientReceivedTime = clientRecv;
                buf.latencyMs = Math.max(1, Math.min(250, clientRecv - ts));
                buf.hasUpdate = true;
              }
              // Trades
              else if (raw.ch === 'trade' && Array.isArray(raw.data)) {
                for (const item of raw.data) {
                  const tp = parseFloat(item.p);
                  const tv = parseFloat(item.v);
                  const isBuy = item.s === 'buy';
                  const dateObj = item.t ? new Date(item.t) : new Date(Number(raw.ts || Date.now()));
                  const ts = dateObj.getTime();

                  if (!isNaN(tp)) {
                    buf.lastPrice = tp;
                    ticksSavedCounterRef.current += 1;
                    const seq = ++tradeCounterRef.current;
                    const newTrade: LiveTradeTick = {
                      id: `btx-ws-${ts}-${tp}-${seq}`,
                      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      timestamp: ts,
                      price: tp,
                      amount: Number(tv.toFixed(4)),
                      isBuy,
                    };
                    buf.tradesBuffer = [newTrade, ...buf.tradesBuffer.slice(0, 19)];
                    buf.serverEventTime = ts;
                    buf.clientReceivedTime = clientRecv;
                    buf.latencyMs = Math.max(1, Math.min(250, clientRecv - ts));
                    buf.hasUpdate = true;
                  }
                }
              }
              // Order Book Depth
              else if (raw.ch === 'depth_books' && raw.data) {
                const rawBids = raw.data.b;
                const rawAsks = raw.data.a;
                if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
                  const parsed = parseDepthLevels(rawBids, rawAsks, buf.lastPrice || 100);
                  buf.bids = parsed.bids;
                  buf.asks = parsed.asks;
                  buf.bidTotal = parsed.bidTotal;
                  buf.askTotal = parsed.askTotal;
                  buf.hasUpdate = true;
                }
              }
              return;
            }

            // -------------------------------------------------------------
            // C. Bybit V5 Native Frame Processing
            // -------------------------------------------------------------
            if (exchange === 'BYBIT') {
              if (raw.topic?.startsWith('tickers.') && raw.data) {
                const t = raw.data;
                const p = parseFloat(t.lastPrice);
                if (!isNaN(p)) buf.lastPrice = p;
                if (t.highPrice24h) buf.high24h = parseFloat(t.highPrice24h);
                if (t.lowPrice24h) buf.low24h = parseFloat(t.lowPrice24h);
                if (t.volume24h) buf.volume24h = parseFloat(t.volume24h);
                if (t.price24hPcnt) buf.priceChange24h = parseFloat(t.price24hPcnt) * 100;
                buf.hasUpdate = true;
              } else if (raw.topic?.startsWith('publicTrade.') && Array.isArray(raw.data)) {
                for (const item of raw.data) {
                  const tp = parseFloat(item.p);
                  const tv = parseFloat(item.s);
                  const isBuy = item.S?.toLowerCase() === 'buy';
                  const ts = Number(item.T);

                  if (!isNaN(tp)) {
                    buf.lastPrice = tp;
                    ticksSavedCounterRef.current += 1;
                    const seq = ++tradeCounterRef.current;
                    const newTrade: LiveTradeTick = {
                      id: `byb-ws-${item.i || ts}-${seq}`,
                      time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      timestamp: ts,
                      price: tp,
                      amount: Number(tv.toFixed(4)),
                      isBuy,
                    };
                    buf.tradesBuffer = [newTrade, ...buf.tradesBuffer.slice(0, 19)];
                    buf.hasUpdate = true;
                  }
                }
              } else if (raw.topic?.startsWith('orderbook.') && raw.data) {
                const rawBids = raw.data.b;
                const rawAsks = raw.data.a;
                if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
                  const parsed = parseDepthLevels(rawBids, rawAsks, buf.lastPrice || 100);
                  buf.bids = parsed.bids;
                  buf.asks = parsed.asks;
                  buf.bidTotal = parsed.bidTotal;
                  buf.askTotal = parsed.askTotal;
                  buf.hasUpdate = true;
                }
              }
              return;
            }

            // -------------------------------------------------------------
            // D. OKX V5 Native Frame Processing
            // -------------------------------------------------------------
            if (exchange === 'OKX') {
              if (packet.arg?.channel === 'trades' && packet.data?.[0]) {
                const t = packet.data[0];
                const p = parseFloat(t.px);
                const sz = parseFloat(t.sz);
                const isBuy = t.side === 'buy';
                if (!isNaN(p)) {
                  buf.lastPrice = p;
                  const ts = Number(t.ts);
                  const seq = ++tradeCounterRef.current;
                  const newTrade: LiveTradeTick = {
                    id: `okx-ws-${t.tradeId || ts}-${seq}`,
                    time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    timestamp: ts,
                    price: p,
                    amount: sz,
                    isBuy,
                  };
                  buf.tradesBuffer = [newTrade, ...buf.tradesBuffer.slice(0, 19)];
                  buf.hasUpdate = true;
                }
              } else if (packet.arg?.channel === 'books5' && packet.data?.[0]) {
                const book = packet.data[0];
                const parsed = parseDepthLevels(book.bids, book.asks, buf.lastPrice || 100);
                buf.bids = parsed.bids;
                buf.asks = parsed.asks;
                buf.bidTotal = parsed.bidTotal;
                buf.askTotal = parsed.askTotal;
                buf.hasUpdate = true;
              } else if (packet.arg?.channel === 'tickers' && packet.data?.[0]) {
                const t = packet.data[0];
                const p = parseFloat(t.last);
                if (!isNaN(p)) buf.lastPrice = p;
                if (t.high24h) buf.high24h = parseFloat(t.high24h);
                if (t.low24h) buf.low24h = parseFloat(t.low24h);
                if (t.volCcy24h) buf.volume24h = parseFloat(t.volCcy24h);
                const open24 = parseFloat(t.open24h);
                if (open24 > 0 && !isNaN(p)) buf.priceChange24h = ((p - open24) / open24) * 100;
                buf.hasUpdate = true;
              }
              return;
            }

            // -------------------------------------------------------------
            // E. Binance Standard & Fallback Frame Processing
            // -------------------------------------------------------------
            const serverEventTime = packet.E || packet.T || packet.ts || clientRecv;
            const deltaLatency = Math.max(1, Math.min(250, clientRecv - serverEventTime));
            
            buf.serverEventTime = Number(serverEventTime);
            buf.clientReceivedTime = clientRecv;
            buf.latencyMs = deltaLatency;

            // 1. aggTrade Tick
            if (packet.e === 'aggTrade' || streamName.includes('aggTrade')) {
              const tradePrice = parseFloat(packet.p);
              const tradeQty = parseFloat(packet.q);
              const isBuyerMaker = !!packet.m;
              const isBuy = !isBuyerMaker;

              if (!isNaN(tradePrice)) {
                buf.lastPrice = tradePrice;
                ticksSavedCounterRef.current += 1;

                const dateObj = new Date(Number(serverEventTime));
                const formattedTime = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                const seq = ++tradeCounterRef.current;
                const newTrade: LiveTradeTick = {
                  id: `bin-ws-${packet.a || serverEventTime}-${seq}`,
                  time: formattedTime,
                  timestamp: Number(serverEventTime),
                  price: tradePrice,
                  amount: Number(tradeQty.toFixed(4)),
                  isBuy,
                };

                buf.tradesBuffer = [newTrade, ...buf.tradesBuffer.slice(0, 19)];
                buf.hasUpdate = true;
              }
            }

            // 2. Order Book Depth
            if (streamName.includes('depth') || packet.e === 'depthUpdate' || packet.bids || packet.b) {
              const rawBids = packet.bids || packet.b;
              const rawAsks = packet.asks || packet.a;

              if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
                const parsed = parseDepthLevels(rawBids, rawAsks, buf.lastPrice || 100);
                buf.bids = parsed.bids;
                buf.asks = parsed.asks;
                buf.bidTotal = parsed.bidTotal;
                buf.askTotal = parsed.askTotal;
                buf.hasUpdate = true;
              }
            }

            // 3. Kline
            if (packet.e === 'kline' && packet.k) {
              const k = packet.k;
              const candle: OHLCVCandle = {
                time: Number(k.t),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
              };
              buf.liveCandle = candle;
              buf.lastPrice = candle.close;
              buf.hasUpdate = true;
            }

            // 4. 24hr Ticker
            if (packet.e === '24hrTicker' || streamName.includes('ticker')) {
              const currentPrice = parseFloat(packet.c);
              const change = parseFloat(packet.P || packet.p);
              const high = parseFloat(packet.h);
              const low = parseFloat(packet.l);
              const qVol = parseFloat(packet.q || packet.v);

              if (!isNaN(currentPrice)) buf.lastPrice = currentPrice;
              if (!isNaN(change)) buf.priceChange24h = change;
              if (!isNaN(high)) buf.high24h = high;
              if (!isNaN(low)) buf.low24h = low;
              if (!isNaN(qVol)) buf.volume24h = qVol;
              buf.hasUpdate = true;
            }
          } catch (_err) {
            // Safe JSON parse error handling
          }
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setWsStatus('fallback');
          fetchLiveRestSnapshot();
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setWsStatus('fallback');
          fetchLiveRestSnapshot();
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isSubscribed) {
              setWsStatus('connecting');
              initWebSocket();
            }
          }, 4000);
        };
      } catch (_err) {
        setWsStatus('fallback');
        fetchLiveRestSnapshot();
      }
    };

    initWebSocket();

    return () => {
      isSubscribed = false;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_e) {}
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [symbol, timeframe, exchange, marketType, fallbackBasePrice]);

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
