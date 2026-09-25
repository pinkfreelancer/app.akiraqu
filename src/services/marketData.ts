import { CryptoSymbolInfo, OHLCVCandle, Timeframe, SupportedExchange, MarketType } from '../types/crypto.types';
import { getCryptoPrecision } from '../utils/formatters';
import { SUPPORTED_SYMBOLS } from '../data/supportedCoins';

export { SUPPORTED_SYMBOLS };

let cachedSymbols: CryptoSymbolInfo[] = [...SUPPORTED_SYMBOLS];
let lastSymbolsFetchTime = 0;

/**
 * Fetch live 24h ticker prices and volumes directly from Binance API using O(1) hash map indexing
 */
export async function fetchLiveSymbolsCatalog(): Promise<CryptoSymbolInfo[]> {
  const now = Date.now();
  // Cache for 6 seconds to prevent excessive API requests
  if (now - lastSymbolsFetchTime < 6000 && cachedSymbols.length > 0) {
    return cachedSymbols;
  }

  // 1. Try server-side proxy first (bypasses any client ISP blocks & CORS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('/api/v1/symbols', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        cachedSymbols = json.data;
        lastSymbolsFetchTime = now;
        return json.data;
      }
    }
  } catch (_e) {}

  // 2. Fallback to Binance Vision and standard Binance API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`https://data-api.binance.vision/api/v3/ticker/24hr`, {
      signal: controller.signal,
    }).catch(() => fetch(`https://api.binance.com/api/v3/ticker/24hr`, { signal: controller.signal }));
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const tickerMap = new Map<string, any>();
        for (const item of data) {
          tickerMap.set(item.symbol, item);
        }

        const updated = SUPPORTED_SYMBOLS.map((sym) => {
          const clean = sym.symbol.replace('/', '').toUpperCase();
          const match = tickerMap.get(clean);
          if (match) {
            const lastPrice = parseFloat(match.lastPrice);
            const priceChangePercent = parseFloat(match.priceChangePercent);
            const quoteVol = parseFloat(match.quoteVolume);
            let formattedVol = `$${(quoteVol / 1e9).toFixed(1)}B`;
            if (quoteVol < 1e9) {
              formattedVol = `$${(quoteVol / 1e6).toFixed(0)}M`;
            }

            return {
              ...sym,
              basePrice: lastPrice,
              change24h: Number(priceChangePercent.toFixed(2)),
              volume24h: formattedVol,
            };
          }
          return sym;
        });

        cachedSymbols = updated;
        lastSymbolsFetchTime = now;
        return updated;
      }
    }
  } catch (_err) {
    // Fallback to latest known cached symbols
  }

  return cachedSymbols;
}

/**
 * Fetch live OHLCV candles from public Binance API or generate deterministic institutional candles
 */
export async function fetchOHLCV(symbol: string, timeframe: Timeframe, count: number = 150): Promise<OHLCVCandle[]> {
  const cleanSymbol = symbol.replace('/', '').toUpperCase();
  const tfMap: Record<Timeframe, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
    '1W': '1w',
  };

  // 1. Try server-side on-demand candle proxy first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `/api/v1/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&exchange=BINANCE&marketType=SPOT&limit=${count}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (_e) {}

  // 2. Direct client fetch with Binance Vision fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${cleanSymbol}&interval=${tfMap[timeframe]}&limit=${count}`, {
      signal: controller.signal,
    }).catch(() => fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${tfMap[timeframe]}&limit=${count}`, {
      signal: controller.signal,
    }));
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any[]) => ({
          time: Number(item[0]),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
          quoteVolume: item[7] ? parseFloat(item[7]) : undefined,
          takerBuyVolume: item[9] ? parseFloat(item[9]) : undefined,
          isSimulated: false,
        }));
      }
    }
  } catch (_err) {
    // Network failed or offline: generate accurate pseudo-market data with institutional volatility
  }

  // High-fidelity algorithmic candle simulation
  return generateDeterministicCandles(symbol, timeframe, count);
}

export function generateInstantCandlesForPrice(currentPrice: number, symbol: string, timeframe: Timeframe, count: number = 150): OHLCVCandle[] {
  const norm = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const match = cachedSymbols.find((s) => s.symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === norm) ||
    SUPPORTED_SYMBOLS.find((s) => s.symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === norm);
  const vol = match ? match.volatility : 0.035;

  const tfIntervalMinutes: Record<Timeframe, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1H': 60,
    '4H': 240,
    '1D': 1440,
    '1W': 10080,
  };

  const stepMs = tfIntervalMinutes[timeframe] * 60 * 1000;
  const now = Date.now();
  const startTime = now - count * stepMs;

  const candles: OHLCVCandle[] = [];
  let price = currentPrice * (1 - vol * 2.2);

  for (let i = 0; i < count; i++) {
    const candleTime = startTime + i * stepMs;
    const wave = Math.sin((i / count) * Math.PI * 3) * 0.008;
    const noise = (Math.sin(i * 997.3) * 0.5 + Math.cos(i * 331.7) * 0.5) * vol * 0.4;
    const deltaPercent = wave + noise;

    const open = price;
    const close = Math.max(open * (1 + deltaPercent), open * 0.4);
    const wickHighFactor = Math.abs(Math.sin(i * 51.1)) * vol * 0.5;
    const wickLowFactor = Math.abs(Math.cos(i * 73.3)) * vol * 0.5;

    const high = Math.max(open, close) * (1 + wickHighFactor);
    const low = Math.min(open, close) * (1 - wickLowFactor);
    const baseVolume = match ? parseFloat(match.volume24h.replace(/[^0-9.]/g, '')) * 10000 : 50000;
    const volume = Math.max(100, baseVolume * (0.6 + Math.abs(Math.sin(i * 12.3)) * 0.8));

    const decimals = getCryptoPrecision(open);

    candles.push({
      time: candleTime,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume: Math.round(volume),
      isSimulated: true,
    });

    price = close;
  }

  // Ensure the very last candle's close matches currentPrice exactly
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = currentPrice;
    last.high = Math.max(last.high, currentPrice);
    last.low = Math.min(last.low, currentPrice);
  }

  return candles;
}

export function generateDeterministicCandles(symbol: string, timeframe: Timeframe, count: number): OHLCVCandle[] {
  const norm = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const match = cachedSymbols.find((s) => s.symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === norm) ||
    SUPPORTED_SYMBOLS.find((s) => s.symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === norm);
  const currentPrice = match ? match.basePrice : 1.0;
  return generateInstantCandlesForPrice(currentPrice, symbol, timeframe, count);
}

/**
 * Fast on-demand candlestick fetcher for instant chart loading without heavy analysis
 */
export async function fetchFastCandles(
  symbol: string,
  timeframe: Timeframe,
  exchange: SupportedExchange = 'BINANCE',
  marketType: MarketType = 'SPOT',
  count: number = 150
): Promise<OHLCVCandle[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `/api/v1/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&exchange=${exchange}&marketType=${marketType}&limit=${count}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (_err) {
    // Fallback below
  }
  return fetchOHLCV(symbol, timeframe, count);
}

