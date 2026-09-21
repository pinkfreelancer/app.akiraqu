import { Router, Request, Response } from 'express';
import { SUPPORTED_SYMBOLS } from '../../src/services/marketData';
import {
  fetchTickersParallelCCXT,
  fetchOHLCVOnDemandCCXT,
  getPipelineTelemetry,
} from '../../src/services/ccxtService';
import { fetchLiveComprehensiveNewsAndSentiment } from '../../src/services/newsSentimentService';

export const marketRouter = Router();

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

// 2. Pipeline Telemetry & Architecture Status
marketRouter.get('/pipeline-info', (_req: Request, res: Response) => {
  const telemetry = getPipelineTelemetry();
  res.json({
    status: 'success',
    data: {
      ...telemetry,
      activeMemoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
      lazyLoadPolicy: '10 Indicators computed solely upon user selection/search; zero unselected coins computed.',
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
    const candles = await fetchOHLCVOnDemandCCXT(symbol, timeframe, 85, exchange, marketType);
    res.json({ status: 'success', data: candles, exchange, marketType, onDemand: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch market candles on-demand', details: err.message });
  }
});

// 4. Multi-Source Crypto News & Macro Sentiment Aggregator
marketRouter.get('/news-sentiment', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const data = await fetchLiveComprehensiveNewsAndSentiment();
    res.json({
      status: 'success',
      data,
      meta: {
        latencyMs: Date.now() - startTime,
        sources: [
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
