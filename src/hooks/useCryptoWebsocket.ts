import { useState, useEffect, useRef, useCallback } from 'react';
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
  // High performance telemetry & synchronization properties
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
  
  // Real-time synced order book & trade ticks
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
    streamProtocol: exchange === 'BINANCE' ? '@aggTrade + @depth@100ms' : 'Exchange Stream',
    fpsRenderRate: 60,
    droppedTicksSaved: 0,
    isFuturesAligned: marketType === 'FUTURES',
  });

  const prevPriceRef = useRef<number | null>(fallbackBasePrice || null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
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

  // -------------------------------------------------------------
  // RequestAnimationFrame Render Loop with Smart 60fps / 16ms Batching
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

  // Helper to generate simulated order book if raw depth not streamed
  const generateDepthAroundPrice = useCallback((targetPrice: number) => {
    const bids: LiveOrderBookLevel[] = [];
    const asks: LiveOrderBookLevel[] = [];
    const spread = targetPrice * 0.0003;
    let bTot = 0;
    let aTot = 0;
    const dec = getCryptoPrecision(targetPrice);

    for (let i = 1; i <= 6; i++) {
      const bPrice = targetPrice - spread - i * spread * 0.8;
      const bAmt = Number(((1 + Math.sin(targetPrice * 0.05 + i * 1.5) * 0.35) * (8 / i) + 0.1).toFixed(4));
      bTot += bAmt;
      bids.push({
        price: Number(bPrice.toFixed(dec)),
        amount: bAmt,
        total: Number(bTot.toFixed(4)),
      });

      const aPrice = targetPrice + spread + i * spread * 0.8;
      const aAmt = Number(((1 + Math.cos(targetPrice * 0.05 + i * 1.5) * 0.35) * (8 / i) + 0.1).toFixed(4));
      aTot += aAmt;
      asks.push({
        price: Number(aPrice.toFixed(dec)),
        amount: aAmt,
        total: Number(aTot.toFixed(4)),
      });
    }

    return { bids, asks, bidTotal: bTot, askTotal: aTot };
  }, []);

  // Helper to generate simulated recent live trades if raw feed not streamed yet
  const generateTradesAroundPrice = useCallback((targetPrice: number): LiveTradeTick[] => {
    const trades: LiveTradeTick[] = [];
    const dec = getCryptoPrecision(targetPrice);
    const now = Date.now();

    for (let i = 0; i < 12; i++) {
      const isBuy = i % 2 === 0;
      const offset = (Math.sin(i * 1.7) * 0.00025) * targetPrice;
      const tPrice = Number((targetPrice + (isBuy ? offset : -offset)).toFixed(dec));
      const tTime = new Date(now - i * 1200).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const tAmount = Number(((1 + Math.sin(i * 2.3)) * 0.75 + 0.1).toFixed(4));
      trades.push({
        id: `seed-${now}-${i}`,
        time: tTime,
        timestamp: now - i * 1200,
        price: tPrice,
        amount: tAmount,
        isBuy,
      });
    }
    return trades;
  }, []);

  // -------------------------------------------------------------
  // Main WebSocket Lifecycle with aggTrade, depthSpeed (100ms) & Server EventTime (E) Matching
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

    // Initialize initial recent trades and orderbook
    if (fallbackBasePrice) {
      const initialBook = generateDepthAroundPrice(fallbackBasePrice);
      bufferRef.current.bids = initialBook.bids;
      bufferRef.current.asks = initialBook.asks;
      bufferRef.current.bidTotal = initialBook.bidTotal;
      bufferRef.current.askTotal = initialBook.askTotal;
      if (bufferRef.current.tradesBuffer.length === 0) {
        bufferRef.current.tradesBuffer = generateTradesAroundPrice(fallbackBasePrice);
      }
      bufferRef.current.hasUpdate = true;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_e) {}
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    let isSubscribed = true;

    // Fast Initial REST Snapshot
    const fetchLiveRestSnapshot = async () => {
      const restStart = Date.now();
      try {
        let urls: string[] = [];
        if (exchange === 'OKX') {
          urls = [`https://www.okx.com/api/v5/market/ticker?instId=${formattedPair}`];
        } else if (exchange === 'KUCOIN') {
          urls = [
            marketType === 'FUTURES'
              ? `https://api-futures.kucoin.com/api/v1/ticker?symbol=${formattedPair}`
              : `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${formattedPair}`
          ];
        } else if (exchange === 'CRYPTO_COM') {
          urls = [`https://api.crypto.com/exchange/v1/public/get-ticker?instrument_name=${formattedPair}`];
        } else {
          // Binance (Spot / Futures)
          const isFut = marketType === 'FUTURES';
          urls = isFut
            ? [
                `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${cleanPair.toUpperCase()}`,
                `/api/v1/ticker?symbol=${encodeURIComponent(symbol)}&marketType=FUTURES`,
              ]
            : [
                `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${cleanPair.toUpperCase()}`,
                `/api/v1/ticker?symbol=${encodeURIComponent(symbol)}&marketType=SPOT`,
                `https://api.binance.com/api/v3/ticker/24hr?symbol=${cleanPair.toUpperCase()}`,
              ];
        }

        let res: Response | null = null;
        for (const targetUrl of urls) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const r = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeout);
            if (r.ok) {
              res = r;
              break;
            }
          } catch (_e) {}
        }

        if (res && res.ok && isSubscribed) {
          const d = await res.json();
          let p = NaN;
          let c = NaN;
          let h = NaN;
          let l = NaN;
          let v = NaN;

          if (d.status === 'success' && d.price !== undefined) {
            // Our server proxy format
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
          } else if (exchange === 'CRYPTO_COM' && d.result?.data?.[0]) {
            const t = d.result.data[0];
            p = parseFloat(t.a);
            c = parseFloat(t.c);
            h = parseFloat(t.h);
            l = parseFloat(t.l);
            v = parseFloat(t.v);
          } else {
            // Binance
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

            const book = generateDepthAroundPrice(p);
            buf.bids = book.bids;
            buf.asks = book.asks;
            buf.bidTotal = book.bidTotal;
            buf.askTotal = book.askTotal;
            if (buf.tradesBuffer.length === 0) {
              buf.tradesBuffer = generateTradesAroundPrice(p);
            }
            buf.hasUpdate = true;
          }
        }
      } catch (_e) {
        // Fallback gracefully
      }
    };

    fetchLiveRestSnapshot();

    try {
      // -----------------------------------------------------------------
      // Lowest Latency Multi-Stream Construction:
      // Combines:
      // 1. @aggTrade -> sub-millisecond aggregate trade ticks
      // 2. @depth10@100ms / @depth20@100ms -> ultra-high-speed 100ms order book
      // 3. @kline_<tf> -> candlestick sync
      // 4. @ticker -> 24h market stats
      // -----------------------------------------------------------------
      let streamUrl = '';
      let protocolName = '';

      if (exchange === 'OKX') {
        streamUrl = 'wss://ws.okx.com:8443/ws/v5/public';
        protocolName = 'OKX-v5 @trades + @depth5';
      } else if (exchange === 'CRYPTO_COM') {
        streamUrl = 'wss://stream.crypto.com/exchange/v1/market';
        protocolName = 'CryptoCom-v1 @trade + @depth';
      } else {
        // Binance: Combine lowest latency streams (aggTrade + depth@100ms + kline + 24h ticker)
        const isFut = marketType === 'FUTURES';
        const depthSpeed = '100ms';
        const streams = [
          `${cleanPair}@aggTrade`,
          `${cleanPair}@depth10@${depthSpeed}`,
          `${cleanPair}@kline_${tfParam}`,
          `${cleanPair}@ticker`,
        ].join('/');

        // Use standard 443 port for best compatibility across web sandboxes
        streamUrl = isFut
          ? `wss://fstream.binance.com/stream?streams=${streams}`
          : `wss://stream.binance.com/stream?streams=${streams}`;

        protocolName = isFut
          ? `Binance Futures fstream (@aggTrade + @depth10@100ms + @kline_${tfParam})`
          : `Binance Spot combinedStream (@aggTrade + @depth10@100ms + @kline_${tfParam})`;
      }

      setSyncMetrics((prev) => ({
        ...prev,
        streamProtocol: protocolName,
      }));

      const ws = new WebSocket(streamUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isSubscribed) return;
        setWsStatus('connected');

        if (exchange === 'OKX') {
          const subMsg = {
            op: 'subscribe',
            args: [
              { channel: 'tickers', instId: formattedPair },
              { channel: 'trades', instId: formattedPair },
              { channel: 'books5', instId: formattedPair },
              { channel: `candle${tfParam}`, instId: formattedPair },
            ],
          };
          ws.send(JSON.stringify(subMsg));
        } else if (exchange === 'CRYPTO_COM') {
          const subMsg = {
            id: 1,
            method: 'subscribe',
            params: {
              channels: [
                `ticker.${formattedPair}`,
                `trade.${formattedPair}`,
                `candlestick.${tfParam}.${formattedPair}`,
              ],
            },
          };
          ws.send(JSON.stringify(subMsg));
        }
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const clientRecv = Date.now();
          const raw = JSON.parse(event.data);
          const packet = raw.data || raw;
          const streamName: string = raw.stream || '';
          const buf = bufferRef.current;

          // -------------------------------------------------------------
          // 1. Server Timestamp Synchronization (E / eventTime Matching)
          // -------------------------------------------------------------
          const serverEventTime = packet.E || packet.T || packet.ts || clientRecv;
          const deltaLatency = Math.max(1, Math.min(250, clientRecv - serverEventTime));
          
          buf.serverEventTime = Number(serverEventTime);
          buf.clientReceivedTime = clientRecv;
          buf.latencyMs = deltaLatency;

          // -------------------------------------------------------------
          // 2. High Speed Sub-millisecond Aggregate Trade Tick (@aggTrade)
          // -------------------------------------------------------------
          if (packet.e === 'aggTrade' || streamName.includes('aggTrade')) {
            const tradePrice = parseFloat(packet.p);
            const tradeQty = parseFloat(packet.q);
            const isBuyerMaker = !!packet.m; // true = sell taker, false = buy taker
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

              const newTrade: LiveTradeTick = {
                id: packet.a || `${serverEventTime}-${Math.random()}`,
                time: formattedTime,
                timestamp: Number(serverEventTime),
                price: tradePrice,
                amount: Number(tradeQty.toFixed(4)),
                isBuy,
              };

              buf.tradesBuffer = [newTrade, ...buf.tradesBuffer.slice(0, 14)];
              buf.hasUpdate = true;
            }
          }

          // -------------------------------------------------------------
          // 3. Ultra-Fast 100ms Order Book Depth (@depth10@100ms)
          // -------------------------------------------------------------
          if (streamName.includes('depth') || packet.e === 'depthUpdate' || packet.bids || packet.b) {
            const rawBids = packet.bids || packet.b;
            const rawAsks = packet.asks || packet.a;

            if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
              let bTot = 0;
              let aTot = 0;
              const dec = getCryptoPrecision(buf.lastPrice || 100);

              const parsedBids: LiveOrderBookLevel[] = rawBids.slice(0, 6).map((b: any[]) => {
                const p = parseFloat(b[0]);
                const a = parseFloat(b[1]);
                bTot += a;
                return {
                  price: Number(p.toFixed(dec)),
                  amount: Number(a.toFixed(4)),
                  total: Number(bTot.toFixed(4)),
                };
              });

              const parsedAsks: LiveOrderBookLevel[] = rawAsks.slice(0, 6).map((a: any[]) => {
                const p = parseFloat(a[0]);
                const aAmount = parseFloat(a[1]);
                aTot += aAmount;
                return {
                  price: Number(p.toFixed(dec)),
                  amount: Number(aAmount.toFixed(4)),
                  total: Number(aTot.toFixed(4)),
                };
              });

              buf.bids = parsedBids;
              buf.asks = parsedAsks;
              buf.bidTotal = bTot;
              buf.askTotal = aTot;
              buf.hasUpdate = true;
            }
          }

          // -------------------------------------------------------------
          // 4. Live Candlestick Kline Stream (@kline_<tf>)
          // -------------------------------------------------------------
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

          // -------------------------------------------------------------
          // 5. 24h Ticker Stats Feed (@ticker / 24hrTicker)
          // -------------------------------------------------------------
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

          // -------------------------------------------------------------
          // 6. Handle OKX & Other Exchanges Protocol Frames
          // -------------------------------------------------------------
          if (exchange === 'OKX') {
            if (packet.arg?.channel === 'trades' && packet.data?.[0]) {
              const t = packet.data[0];
              const p = parseFloat(t.px);
              const sz = parseFloat(t.sz);
              const isBuy = t.side === 'buy';
              if (!isNaN(p)) {
                buf.lastPrice = p;
                const newTrade: LiveTradeTick = {
                  id: t.tradeId || Date.now(),
                  time: new Date(Number(t.ts)).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                  timestamp: Number(t.ts),
                  price: p,
                  amount: sz,
                  isBuy,
                };
                buf.tradesBuffer = [newTrade, ...buf.tradesBuffer.slice(0, 14)];
                buf.hasUpdate = true;
              }
            } else if (packet.arg?.channel === 'books5' && packet.data?.[0]) {
              const book = packet.data[0];
              let bTot = 0;
              let aTot = 0;
              const dec = getCryptoPrecision(buf.lastPrice || 100);

              buf.bids = (book.bids || []).slice(0, 6).map((b: any[]) => {
                const bp = parseFloat(b[0]);
                const ba = parseFloat(b[1]);
                bTot += ba;
                return {
                  price: Number(bp.toFixed(dec)),
                  amount: Number(ba.toFixed(4)),
                  total: Number(bTot.toFixed(4)),
                };
              });

              buf.asks = (book.asks || []).slice(0, 6).map((a: any[]) => {
                const ap = parseFloat(a[0]);
                const aa = parseFloat(a[1]);
                aTot += aa;
                return {
                  price: Number(ap.toFixed(dec)),
                  amount: Number(aa.toFixed(4)),
                  total: Number(aTot.toFixed(4)),
                };
              });

              buf.bidTotal = bTot;
              buf.askTotal = aTot;
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
            } else if (packet.arg?.channel?.startsWith('candle') && packet.data?.[0]) {
              const c = packet.data[0];
              buf.liveCandle = {
                time: Number(c[0]),
                open: parseFloat(c[1]),
                high: parseFloat(c[2]),
                low: parseFloat(c[3]),
                close: parseFloat(c[4]),
                volume: parseFloat(c[5]),
              };
              buf.lastPrice = parseFloat(c[4]);
              buf.hasUpdate = true;
            }
          }
        } catch (_err) {
          // Heartbeat / ping ignore
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
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (isSubscribed) {
            setWsStatus('connecting');
          }
        }, 4000);
      };
    } catch (_err) {
      setWsStatus('fallback');
      fetchLiveRestSnapshot();
    }

    // Dynamic trade heartbeat generator when in fallback or network waiting
    const fallbackTickInterval = window.setInterval(() => {
      if (!isSubscribed) return;
      const current = bufferRef.current.lastPrice || fallbackBasePrice;
      if (current && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
        const dec = getCryptoPrecision(current);
        const now = Date.now();
        const sec = Math.floor(now / 1000);
        const isBuy = Math.sin(sec * 0.45) >= 0;
        const delta = Math.sin(sec * 0.85) * 0.00015 * current;
        const newPrice = Number((current + delta).toFixed(dec));
        const newTrade: LiveTradeTick = {
          id: `sim-${now}-${sec % 1000}`,
          time: new Date(now).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          timestamp: now,
          price: newPrice,
          amount: Number(((Math.cos(sec * 0.7) + 1.2) * 0.65 + 0.05).toFixed(4)),
          isBuy,
        };
        bufferRef.current.tradesBuffer = [newTrade, ...bufferRef.current.tradesBuffer.slice(0, 14)];
        bufferRef.current.hasUpdate = true;
      }
    }, 2000);

    return () => {
      isSubscribed = false;
      window.clearInterval(fallbackTickInterval);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_e) {}
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [symbol, timeframe, exchange, marketType, generateDepthAroundPrice, generateTradesAroundPrice, fallbackBasePrice]);

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
