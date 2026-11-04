import { Router, Request, Response } from 'express';
import v8 from 'v8';
import { SUPPORTED_SYMBOLS } from '../../src/services/marketData';
import {
  fetchTickersParallelCCXT,
  fetchOHLCVOnDemandCCXT,
  getPipelineTelemetry,
} from '../../src/services/ccxtService';
import { fetchLiveComprehensiveNewsAndSentiment } from '../../src/services/newsSentimentService';
import { marketWsProxy } from '../services/marketWsProxy';
import { mtfScreenerEngine } from '../services/mtfScreenerEngine';
import { marketOverviewService } from '../services/marketOverviewService';
import { coinMetadataService } from '../services/coinMetadataService';

export const marketRouter = Router();

// Start background rate-limit-aware 240-coin MTF engine & warm up Market Overview + Coin Metadata caches on boot
mtfScreenerEngine.start();
marketOverviewService.warmUp();
coinMetadataService.warmUp();

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

// 1. Symbols Catalog with Live 24hr Ticker Feed (CCXT Async Parallel Batch)
marketRouter.get('/symbols', async (_req: Request, res: Response) => {
  try {
    const result = await fetchTickersParallelCCXT();
    res.json({
      status: 'success',
      data: result.symbols,
      meta: {
        engine: result.engine,
        isParallelAsync: result.isParallelAsync,
        isLiveFeed: result.isLiveFeed,
        latencyMs: result.latencyMs,
        count: result.symbols.length,
        serverTime: Date.now(),
      },
    });
  } catch (_err) {
    res.json({
      status: 'success',
      data: SUPPORTED_SYMBOLS,
      meta: {
        engine: 'Static Fallback',
        isParallelAsync: false,
        isLiveFeed: false,
        latencyMs: 1,
        count: SUPPORTED_SYMBOLS.length,
        serverTime: Date.now(),
      },
    });
  }
});

// 2. Pipeline Telemetry & Architecture Status (V8 Heap & Uptime Observability for Developers)
marketRouter.get(['/pipeline-info', '/market/pipeline-info'], (_req: Request, res: Response) => {
  const telemetry = getPipelineTelemetry();
  const mem = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    status: 'success',
    data: {
      ...telemetry,
      activeMemoryUsage: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
      lazyLoadPolicy: '10 Indicators computed solely upon user selection/search; zero unselected coins computed.',
      serverUptime: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds),
        startedAt: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      },
      v8HeapMemory: {
        heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
        rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
        externalMb: Number((mem.external / 1024 / 1024).toFixed(2)),
        arrayBuffersMb: Number(((mem.arrayBuffers || 0) / 1024 / 1024).toFixed(2)),
        heapLimitMb: Number((heapStats.heap_size_limit / 1024 / 1024).toFixed(1)),
        totalAvailableMb: Number((heapStats.total_available_size / 1024 / 1024).toFixed(2)),
        usedHeapPercentage: Number(((mem.heapUsed / heapStats.heap_size_limit) * 100).toFixed(1)),
        allocatedPercentage: Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)),
      },
      wsProxy: marketWsProxy.getStats(),
      timestamp: new Date().toISOString(),
    },
  });
});

// 3. Historical OHLCV Candles (Fetched strictly on-demand for selected coin and exchange)
marketRouter.get('/candles', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTC/USDT';
    const timeframe = (req.query.timeframe as any) || '1H';
    const exchange = ((req.query.exchange as string) || 'BINANCE').toUpperCase() as any;
    const marketType = ((req.query.marketType as string) || 'SPOT').toUpperCase() as any;
    const limit = parseInt(req.query.limit as string, 10) || 150;
    const candles = await fetchOHLCVOnDemandCCXT(symbol, timeframe, limit, exchange, marketType);
    res.json({ status: 'success', data: candles, exchange, marketType, limit, onDemand: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch market candles on-demand', details: err.message });
  }
});

// 4. KuCoin Public Bullet Token Proxy (Eliminates Browser CORS restrictions for KuCoin WebSocket)
marketRouter.all(['/kucoin-bullet', '/market/kucoin-bullet'], async (req: Request, res: Response) => {
  try {
    const marketType = (req.query.marketType || (req.body && req.body.marketType) || 'SPOT') as string;
    const isFut = String(marketType).toUpperCase() === 'FUTURES';
    const bulletUrl = isFut
      ? 'https://api-futures.kucoin.com/api/v1/bullet-public'
      : 'https://api.kucoin.com/api/v1/bullet-public';
    const r = await fetch(bulletUrl, { method: 'POST' });
    const json = await r.json();
    res.json(json);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch KuCoin bullet token', details: err.message });
  }
});

// 5. Real-time Single Ticker Snapshot (Direct server-side proxy to guarantee 100% exchange accuracy even if client ISP blocks Binance)
marketRouter.get('/ticker', async (req: Request, res: Response) => {
  try {
    const rawSymbol = (req.query.symbol as string) || 'BTC/USDT';
    const clean = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const isFut = (req.query.marketType as string)?.toUpperCase() === 'FUTURES';

    const urls = isFut
      ? [`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${clean}`]
      : [
          `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${clean}`,
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${clean}`,
          `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${clean}`,
        ];

    let data: any = null;
    for (const u of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const r = await fetch(u, { signal: controller.signal });
        clearTimeout(timeout);
        if (r.ok) {
          data = await r.json();
          break;
        }
      } catch (_e) {}
    }

    if (data) {
      return res.json({
        status: 'success',
        symbol: rawSymbol,
        price: parseFloat(data.lastPrice || data.price),
        priceChangePercent: parseFloat(data.priceChangePercent),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        volume: parseFloat(data.quoteVolume || data.volume),
      });
    }

    res.status(404).json({ error: 'Ticker not found' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch ticker proxy', details: err.message });
  }
});

// 6. Level 2 Order Book Depth Proxy (Bypasses CORS & ISP geoblocking)
marketRouter.get(['/depth', '/market/depth'], async (req: Request, res: Response) => {
  try {
    const rawSymbol = (req.query.symbol as string) || 'BTC/USDT';
    const clean = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const isFut = (req.query.marketType as string)?.toUpperCase() === 'FUTURES';
    const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 50);

    const urls = isFut
      ? [`https://fapi.binance.com/fapi/v1/depth?symbol=${clean}&limit=${limit}`]
      : [
          `https://data-api.binance.vision/api/v3/depth?symbol=${clean}&limit=${limit}`,
          `https://api.binance.com/api/v3/depth?symbol=${clean}&limit=${limit}`,
          `https://fapi.binance.com/fapi/v1/depth?symbol=${clean}&limit=${limit}`,
        ];

    let data: any = null;
    for (const u of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const r = await fetch(u, { signal: controller.signal });
        clearTimeout(timeout);
        if (r.ok) {
          data = await r.json();
          break;
        }
      } catch (_e) {}
    }

    if (data && data.bids && data.asks) {
      return res.json({
        status: 'success',
        symbol: rawSymbol,
        lastUpdateId: data.lastUpdateId,
        bids: data.bids,
        asks: data.asks,
      });
    }

    res.status(404).json({ error: 'Depth not found' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch depth proxy', details: err.message });
  }
});

// 7. Recent Public Trades Proxy (Bypasses CORS & ISP geoblocking)
marketRouter.get(['/trades', '/market/trades'], async (req: Request, res: Response) => {
  try {
    const rawSymbol = (req.query.symbol as string) || 'BTC/USDT';
    const clean = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const isFut = (req.query.marketType as string)?.toUpperCase() === 'FUTURES';
    const limit = Math.min(parseInt((req.query.limit as string) || '15', 10), 50);

    const urls = isFut
      ? [`https://fapi.binance.com/fapi/v1/trades?symbol=${clean}&limit=${limit}`]
      : [
          `https://data-api.binance.vision/api/v3/trades?symbol=${clean}&limit=${limit}`,
          `https://api.binance.com/api/v3/trades?symbol=${clean}&limit=${limit}`,
          `https://fapi.binance.com/fapi/v1/trades?symbol=${clean}&limit=${limit}`,
        ];

    let data: any = null;
    for (const u of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const r = await fetch(u, { signal: controller.signal });
        clearTimeout(timeout);
        if (r.ok) {
          data = await r.json();
          break;
        }
      } catch (_e) {}
    }

    if (Array.isArray(data)) {
      return res.json({
        status: 'success',
        symbol: rawSymbol,
        trades: data,
      });
    }

    res.status(404).json({ error: 'Trades not found' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch trades proxy', details: err.message });
  }
});

// 8. Consolidated Market Snapshot (Multi-Exchange Synchronized Fallback Polling Engine)
marketRouter.get(['/market-snapshot', '/market/snapshot'], async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const rawSymbol = (req.query.symbol as string) || 'BTC/USDT';
    const clean = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const base = clean.endsWith('USDT') ? clean.slice(0, -4) : clean;
    const isFut = (req.query.marketType as string)?.toUpperCase() === 'FUTURES';
    const exchange = ((req.query.exchange as string) || 'BINANCE').toUpperCase();
    const rawTf = ((req.query.timeframe as string) || '1H').toLowerCase();

    let ticker: any = null;
    let depth: { bids: any[]; asks: any[] } | null = null;
    let trades: any[] = [];
    let liveCandle: any = null;

    if (exchange === 'OKX') {
      const formattedPair = isFut ? `${base}-USDT-SWAP` : `${base}-USDT`;
      const okxTf = rawTf === '1m' ? '1m' : rawTf === '5m' ? '5m' : rawTf === '15m' ? '15m' : rawTf === '4h' ? '4H' : rawTf === '1d' ? '1D' : rawTf === '1w' ? '1W' : '1H';
      const [tRes, dRes, trRes, kRes] = await Promise.allSettled([
        fetch(`https://www.okx.com/api/v5/market/ticker?instId=${formattedPair}`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(`https://www.okx.com/api/v5/market/books?instId=${formattedPair}&sz=10`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(`https://www.okx.com/api/v5/market/trades?instId=${formattedPair}&limit=15`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(`https://www.okx.com/api/v5/market/candles?instId=${formattedPair}&bar=${okxTf}&limit=1`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
      ]);

      const tRaw = tRes.status === 'fulfilled' && tRes.value?.data?.[0] ? tRes.value.data[0] : null;
      if (tRaw) {
        const p = parseFloat(tRaw.last);
        const open24 = parseFloat(tRaw.open24h);
        ticker = {
          price: p,
          priceChangePercent: open24 > 0 ? ((p - open24) / open24) * 100 : 0,
          high: parseFloat(tRaw.high24h || '0'),
          low: parseFloat(tRaw.low24h || '0'),
          volume: parseFloat(tRaw.volCcy24h || tRaw.vol24h || '0'),
        };
      }

      const dRaw = dRes.status === 'fulfilled' && dRes.value?.data?.[0] ? dRes.value.data[0] : null;
      if (dRaw && dRaw.bids && dRaw.asks) {
        depth = { bids: dRaw.bids, asks: dRaw.asks };
      }

      const trRaw = trRes.status === 'fulfilled' && Array.isArray(trRes.value?.data) ? trRes.value.data : null;
      if (trRaw) {
        trades = trRaw.slice(0, 15).map((item: any) => ({
          id: item.tradeId || item.ts,
          price: item.px,
          qty: item.sz,
          time: Number(item.ts),
          isBuyerMaker: item.side !== 'buy',
        }));
      }

      const kRaw = kRes.status === 'fulfilled' && Array.isArray(kRes.value?.data?.[0]) ? kRes.value.data[0] : null;
      if (kRaw) {
        liveCandle = {
          time: Number(kRaw[0]),
          open: parseFloat(kRaw[1]),
          high: parseFloat(kRaw[2]),
          low: parseFloat(kRaw[3]),
          close: parseFloat(kRaw[4]),
          volume: parseFloat(kRaw[5]),
        };
      }
    } else if (exchange === 'BYBIT') {
      const cat = isFut ? 'linear' : 'spot';
      const bybitTf = rawTf === '1h' ? '60' : rawTf === '4h' ? '240' : rawTf === '1d' ? 'D' : rawTf === '1w' ? 'W' : rawTf.replace('m', '');
      const [tRes, dRes, trRes, kRes] = await Promise.allSettled([
        fetch(`https://api.bybit.com/v5/market/tickers?category=${cat}&symbol=${clean}`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(`https://api.bybit.com/v5/market/orderbook?category=${cat}&symbol=${clean}&limit=10`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(`https://api.bybit.com/v5/market/recent-trade?category=${cat}&symbol=${clean}&limit=15`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(`https://api.bybit.com/v5/market/kline?category=${cat}&symbol=${clean}&interval=${bybitTf}&limit=1`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
      ]);

      const tRaw = tRes.status === 'fulfilled' && tRes.value?.result?.list?.[0] ? tRes.value.result.list[0] : null;
      if (tRaw) {
        ticker = {
          price: parseFloat(tRaw.lastPrice),
          priceChangePercent: parseFloat(tRaw.price24hPcnt || '0') * 100,
          high: parseFloat(tRaw.highPrice24h || '0'),
          low: parseFloat(tRaw.lowPrice24h || '0'),
          volume: parseFloat(tRaw.volume24h || '0'),
        };
      }

      const dRaw = dRes.status === 'fulfilled' && dRes.value?.result ? dRes.value.result : null;
      if (dRaw && dRaw.b && dRaw.a) {
        depth = { bids: dRaw.b, asks: dRaw.a };
      }

      const trRaw = trRes.status === 'fulfilled' && Array.isArray(trRes.value?.result?.list) ? trRes.value.result.list : null;
      if (trRaw) {
        trades = trRaw.slice(0, 15).map((item: any) => ({
          id: item.execId || item.time,
          price: item.price,
          qty: item.size,
          time: Number(item.time),
          isBuyerMaker: item.side?.toLowerCase() !== 'buy',
        }));
      }

      const kRaw = kRes.status === 'fulfilled' && Array.isArray(kRes.value?.result?.list?.[0]) ? kRes.value.result.list[0] : null;
      if (kRaw) {
        liveCandle = {
          time: Number(kRaw[0]),
          open: parseFloat(kRaw[1]),
          high: parseFloat(kRaw[2]),
          low: parseFloat(kRaw[3]),
          close: parseFloat(kRaw[4]),
          volume: parseFloat(kRaw[5]),
        };
      }
    } else if (exchange === 'BITGET') {
      const cleanSym = `${clean}`;
      const [tRes, dRes, trRes] = await Promise.allSettled([
        fetch(isFut ? `https://api.bitget.com/api/v2/mix/market/ticker?symbol=${cleanSym}&productType=USDT-FUTURES` : `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${cleanSym}`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(isFut ? `https://api.bitget.com/api/v2/mix/market/merge-depth?symbol=${cleanSym}&productType=USDT-FUTURES&limit=10` : `https://api.bitget.com/api/v2/spot/market/orderbook?symbol=${cleanSym}&type=step0&limit=10`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
        fetch(isFut ? `https://api.bitget.com/api/v2/mix/market/fills?symbol=${cleanSym}&productType=USDT-FUTURES&limit=15` : `https://api.bitget.com/api/v2/spot/market/fills?symbol=${cleanSym}&limit=15`, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()),
      ]);

      const tRaw = tRes.status === 'fulfilled' && tRes.value?.data?.[0] ? tRes.value.data[0] : null;
      if (tRaw) {
        const p = parseFloat(tRaw.lastPr);
        const op = parseFloat(tRaw.open || '0');
        ticker = {
          price: p,
          priceChangePercent: op > 0 ? ((p - op) / op) * 100 : 0,
          high: parseFloat(tRaw.high24h || '0'),
          low: parseFloat(tRaw.low24h || '0'),
          volume: parseFloat(tRaw.quoteVolume || tRaw.usdtVolume || '0'),
        };
      }

      const dRaw = dRes.status === 'fulfilled' && dRes.value?.data ? dRes.value.data : null;
      if (dRaw && dRaw.bids && dRaw.asks) {
        depth = { bids: dRaw.bids, asks: dRaw.asks };
      }

      const trRaw = trRes.status === 'fulfilled' && Array.isArray(trRes.value?.data) ? trRes.value.data : null;
      if (trRaw) {
        trades = trRaw.slice(0, 15).map((item: any) => ({
          id: item.tradeId || item.ts,
          price: item.price,
          qty: item.size,
          time: Number(item.ts),
          isBuyerMaker: item.side?.toLowerCase() !== 'buy',
        }));
      }
    } else {
      // Default: Binance (Spot or Futures) — prefer data-api.binance.vision for Spot to bypass regional ISP blocks
      const klineInterval = rawTf === '1h' ? '1h' : rawTf === '4h' ? '4h' : rawTf === '1d' ? '1d' : rawTf === '1w' ? '1w' : rawTf;
      const baseCandidates = isFut
        ? ['https://fapi.binance.com/fapi/v1']
        : [
            'https://data-api.binance.vision/api/v3',
            'https://api.binance.com/api/v3',
            'https://fapi.binance.com/fapi/v1',
          ];

      const fetchWithFallback = async (pathSuffix: string) => {
        for (const baseUrl of baseCandidates) {
          try {
            const r = await fetch(`${baseUrl}${pathSuffix}`, { signal: AbortSignal.timeout(3000) });
            if (r.ok) return await r.json();
          } catch (_e) {}
        }
        return null;
      };

      const [tickerRaw, depthRaw, tradesRaw, klinesArr] = await Promise.all([
        fetchWithFallback(`/ticker/24hr?symbol=${clean}`),
        fetchWithFallback(`/depth?symbol=${clean}&limit=10`),
        fetchWithFallback(`/trades?symbol=${clean}&limit=15`),
        fetchWithFallback(`/klines?symbol=${clean}&interval=${klineInterval}&limit=1`),
      ]);

      const klineRaw = Array.isArray(klinesArr) ? klinesArr[0] : null;

      if (tickerRaw && (tickerRaw.lastPrice || tickerRaw.price)) {
        ticker = {
          price: parseFloat(tickerRaw.lastPrice || tickerRaw.price),
          priceChangePercent: parseFloat(tickerRaw.priceChangePercent || '0'),
          high: parseFloat(tickerRaw.highPrice || '0'),
          low: parseFloat(tickerRaw.lowPrice || '0'),
          volume: parseFloat(tickerRaw.quoteVolume || tickerRaw.volume || '0'),
        };
      }

      if (depthRaw && depthRaw.bids && depthRaw.asks) {
        depth = { bids: depthRaw.bids, asks: depthRaw.asks };
      }

      if (Array.isArray(tradesRaw)) {
        trades = tradesRaw;
      }

      if (klineRaw && Array.isArray(klineRaw) && klineRaw.length >= 6) {
        liveCandle = {
          time: Number(klineRaw[0]),
          open: parseFloat(klineRaw[1]),
          high: parseFloat(klineRaw[2]),
          low: parseFloat(klineRaw[3]),
          close: parseFloat(klineRaw[4]),
          volume: parseFloat(klineRaw[5]),
        };
      }
    }

    res.json({
      status: 'success',
      symbol: rawSymbol,
      exchange,
      isFutures: isFut,
      timeframe: req.query.timeframe || '1H',
      ticker,
      depth,
      trades,
      liveCandle,
      latencyMs: Date.now() - startTime,
      serverTime: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch consolidated market snapshot', details: err.message });
  }
});

// 4. Multi-Source Crypto News & Macro Sentiment Aggregator
marketRouter.get('/news-sentiment', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const force = req.query.force === 'true';
  try {
    const data = await fetchLiveComprehensiveNewsAndSentiment(force);
    res.json({
      status: 'success',
      data,
      meta: {
        latencyMs: Date.now() - startTime,
        sources: [
          'Binance PAXGUSDT (24/7 Spot Gold Feed)',
          'Binance EURUSDT (FX Currency Basket DXY Proxy)',
          'Binance BTCUSDT (Dynamic Macro Co-movement)',
          'CryptoCompare API',
          'CoinGecko API',
          'CoinDesk Primary',
          'The Block Research',
          'Twitter/X V2 Sentiment Stream',
          'Reddit Community Sentiment (r/CryptoCurrency, r/Bitcoin, r/Ethereum)',
          'Federal Reserve & Central Bank Wire',
          'Reuters Global Financial Markets',
        ],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch news & sentiment',
      message: err.message,
    });
  }
});

// 9. Multi-Timeframe (MTF) 240+ Coin Binance Futures USDT-M Screener
marketRouter.get(['/mtf-screener', '/market/mtf-screener'], async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const force = req.query.force === 'true';
    const prioritySymbols =
      typeof req.query.priority === 'string' && req.query.priority.trim()
        ? req.query.priority
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 60)
        : undefined;

    const subsetSymbols =
      typeof req.query.symbols === 'string' && req.query.symbols.trim()
        ? req.query.symbols
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const snapshot = await mtfScreenerEngine.getSnapshot({
      prioritySymbols,
      subsetSymbols,
      force,
    });

    res.json({
      status: 'success',
      updatedAt: snapshot.updatedAt,
      latencyMs: Date.now() - startTime,
      totalCoins: snapshot.totalCoins,
      fullyHydratedCoins: snapshot.fullyHydratedCoins,
      partiallyHydratedCoins: snapshot.partiallyHydratedCoins,
      hydrationPct: snapshot.hydrationPct,
      sourceExchange: snapshot.sourceExchange,
      ttlConfigMs: snapshot.ttlConfigMs,
      rateLimitTelemetry: snapshot.rateLimitTelemetry,
      data: snapshot.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to load MTF screener snapshot',
      details: err.message,
    });
  }
});

// 10. Unified Market Overview Snapshot ("Ringkasan Pasar" — Reuses 240-coin MTF universe + Global/F&G/OI)
marketRouter.get(['/market-overview', '/market/overview'], async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const force = req.query.force === 'true';
    const overview = await marketOverviewService.getOverview(force);
    res.json({
      success: true,
      status: 'success',
      latencyMs: Date.now() - startTime,
      data: overview,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Failed to load Market Overview',
      details: err.message,
    });
  }
});

// 11. Static Coin Logo Metadata Proxy (/api/coins/meta & /api/v1/coins/meta)
// Strictly decoupled from real-time price SSOT; caches CoinGecko /coins/markets { id, symbol, name, image, market_cap_rank }
marketRouter.get(['/coins/meta', '/market/coins-meta'], async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const force = req.query.force === 'true';
    const snapshot = await coinMetadataService.getCoinsMetadata({ force });

    if (snapshot.items.length > 0) {
      res.setHeader(
        'Cache-Control',
        'public, max-age=21600, s-maxage=43200, stale-while-revalidate=86400'
      );
    } else {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    res.json({
      success: true,
      status: 'success',
      updatedAt: snapshot.updatedAt,
      stale: snapshot.stale,
      degraded: snapshot.degraded,
      cacheAgeSec: snapshot.cacheAgeSec,
      count: snapshot.items.length,
      latencyMs: Date.now() - startTime,
      data: snapshot.items,
    });
  } catch (err: any) {
    // Graceful fallback: never break UI if CoinGecko upstream fails
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.status(200).json({
      success: true,
      status: 'success',
      updatedAt: Date.now(),
      stale: true,
      degraded: true,
      cacheAgeSec: 0,
      count: 0,
      latencyMs: Date.now() - startTime,
      error: err?.message || 'Coin metadata temporarily unavailable',
      data: [],
    });
  }
});


