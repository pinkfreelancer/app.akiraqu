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

export const marketRouter = Router();

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
        latencyMs: result.latencyMs,
        count: result.symbols.length,
      },
    });
  } catch (_err) {
    res.json({
      status: 'success',
      data: SUPPORTED_SYMBOLS,
      meta: {
        engine: 'Static Fallback',
        isParallelAsync: false,
        latencyMs: 1,
        count: SUPPORTED_SYMBOLS.length,
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
