import { OHLCVCandle, SupportedExchange, MarketType, Timeframe, ExchangeOptionInfo } from '../types/crypto.types';

export const SUPPORTED_EXCHANGES: ExchangeOptionInfo[] = [
  {
    id: 'BINANCE',
    name: 'Binance',
    shortName: 'BINANCE',
    tag: 'BNB',
    brandColor: '#F0B90B',
    borderColor: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.12)',
    hasSpot: true,
    hasFutures: true,
    description: 'Bursa global terbesar dengan likuiditas order book tier-1 dan latency terendah.',
  },
  {
    id: 'OKX',
    name: 'OKX',
    shortName: 'OKX',
    tag: 'OKX',
    brandColor: '#FFFFFF',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    hasSpot: true,
    hasFutures: true,
    description: 'Volume derivatif perpetual swap masif dengan arsitektur V5 API instan.',
  },
  {
    id: 'BYBIT',
    name: 'Bybit',
    shortName: 'BYBIT',
    tag: 'BYBIT',
    brandColor: '#F7A600',
    borderColor: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    hasSpot: true,
    hasFutures: true,
    description: 'Pusat likuiditas derivatif perpetual dan copy-trading tier-1.',
  },
  {
    id: 'KUCOIN',
    name: 'KuCoin',
    shortName: 'KUCOIN',
    tag: 'KCS',
    brandColor: '#24AE8F',
    borderColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    hasSpot: true,
    hasFutures: true,
    description: 'Pusat likuiditas altcoin dan kline feed cepat untuk token emerging.',
  },
  {
    id: 'BITGET',
    name: 'Bitget',
    shortName: 'BITGET',
    tag: 'BGB',
    brandColor: '#00F0FF',
    borderColor: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    hasSpot: true,
    hasFutures: true,
    description: 'Bursa crypto derivatif modern dengan volume USDT perpetual tinggi.',
  },
  {
    id: 'CRYPTO_COM',
    name: 'Crypto.com',
    shortName: 'CDC',
    tag: 'CRO',
    brandColor: '#002D74',
    borderColor: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    hasSpot: true,
    hasFutures: true,
    description: 'Ekosistem teregulasi global dengan kedalaman order book terpercaya.',
  },
  {
    id: 'BITUNIX',
    name: 'Bitunix',
    shortName: 'BITUNIX',
    tag: 'BTX',
    brandColor: '#8B5CF6',
    borderColor: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    hasSpot: true,
    hasFutures: true,
    description: 'Exchange crypto derivatif modern dengan eksekusi kline futures ultra-cepat.',
  },
];

/**
 * Format base asset and quote asset into exchange-specific ticker strings
 */
export function formatExchangeSymbol(
  rawSymbol: string,
  exchange: SupportedExchange,
  marketType: MarketType
): string {
  const clean = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const base = clean.endsWith('USDT') ? clean.slice(0, -4) : clean;
  const quote = 'USDT';

  switch (exchange) {
    case 'BINANCE':
      return `${base}${quote}`; // e.g. BTCUSDT

    case 'OKX':
      return marketType === 'FUTURES'
        ? `${base}-${quote}-SWAP` // e.g. BTC-USDT-SWAP
        : `${base}-${quote}`;      // e.g. BTC-USDT

    case 'KUCOIN':
      return marketType === 'FUTURES'
        ? (base === 'BTC' ? 'XBTUSDTM' : `${base}USDTM`) // e.g. XBTUSDTM, ETHUSDTM
        : `${base}-${quote}`;                            // e.g. BTC-USDT

    case 'CRYPTO_COM':
      return marketType === 'FUTURES'
        ? `${base}USD-PERP`  // e.g. BTCUSD-PERP
        : `${base}_${quote}`; // e.g. BTC_USDT

    case 'BITUNIX':
      return `${base}${quote}`; // e.g. BTCUSDT

    case 'BYBIT':
      return `${base}${quote}`; // e.g. BTCUSDT

    case 'BITGET':
      return `${base}${quote}`; // e.g. BTCUSDT

    default:
      return `${base}${quote}`;
  }
}

/**
 * Maps standard timeframe to exchange-specific query parameters
 */
export function mapTimeframeToExchange(timeframe: Timeframe, exchange: SupportedExchange): string {
  switch (exchange) {
    case 'BINANCE':
      const bnMap: Record<Timeframe, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1H': '1h',
        '4H': '4h',
        '1D': '1d',
        '1W': '1w',
      };
      return bnMap[timeframe] || '1h';

    case 'OKX':
      const okxMap: Record<Timeframe, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1H': '1H',
        '4H': '4H',
        '1D': '1D',
        '1W': '1W',
      };
      return okxMap[timeframe] || '1H';

    case 'BYBIT':
      const bybitMap: Record<Timeframe, string> = {
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '1H': '60',
        '4H': '240',
        '1D': 'D',
        '1W': 'W',
      };
      return bybitMap[timeframe] || '60';

    case 'BITGET':
      const bitgetMap: Record<Timeframe, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1H': '1h',
        '4H': '4h',
        '1D': '1day',
        '1W': '1week',
      };
      return bitgetMap[timeframe] || '1h';

    case 'KUCOIN':
      const kcsMap: Record<Timeframe, string> = {
        '1m': '1min',
        '5m': '5min',
        '15m': '15min',
        '1H': '1hour',
        '4H': '4hour',
        '1D': '1day',
        '1W': '1week',
      };
      return kcsMap[timeframe] || '1hour';

    case 'CRYPTO_COM':
      const cdcMap: Record<Timeframe, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1H': '1h',
        '4H': '4h',
        '1D': '1D',
        '1W': '7D',
      };
      return cdcMap[timeframe] || '1h';

    case 'BITUNIX':
      const btxMap: Record<Timeframe, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1H': '1h',
        '4H': '4h',
        '1D': '1d',
        '1W': '1w',
      };
      return btxMap[timeframe] || '1h';

    default:
      return '1h';
  }
}

/**
 * Multi-Exchange High Speed REST Candle Fetcher with Instant Fallback Pipeline
 */
export async function fetchMultiExchangeOHLCV(
  symbol: string,
  timeframe: Timeframe,
  limit: number = 150,
  exchange: SupportedExchange = 'BINANCE',
  marketType: MarketType = 'SPOT'
): Promise<{ candles: OHLCVCandle[]; sourceExchange: SupportedExchange; sourceMarket: MarketType; latencyMs: number }> {
  const startTime = Date.now();
  const formattedPair = formatExchangeSymbol(symbol, exchange, marketType);
  const tfParam = mapTimeframeToExchange(timeframe, exchange);

  // 1. OKX Route
  if (exchange === 'OKX') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://www.okx.com/api/v5/market/candles?instId=${formattedPair}&bar=${tfParam}&limit=${limit}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.code === '0' && Array.isArray(json.data) && json.data.length > 0) {
          // OKX returns newest first: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
          const candles: OHLCVCandle[] = json.data
            .map((item: string[]) => ({
              time: Number(item[0]),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
            }))
            .reverse(); // sort chronologically

          return {
            candles,
            sourceExchange: 'OKX',
            sourceMarket: marketType,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } catch (_okxErr) {
      // Fall through to Binance gateway
    }
  }

  // 2. KuCoin Route
  if (exchange === 'KUCOIN') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      let url = '';
      if (marketType === 'FUTURES') {
        const granMap: Record<Timeframe, number> = { '1m': 1, '5m': 5, '15m': 15, '1H': 60, '4H': 240, '1D': 1440, '1W': 10080 };
        const gran = granMap[timeframe] || 60;
        url = `https://api-futures.kucoin.com/api/v1/kline/query?symbol=${formattedPair}&granularity=${gran}`;
      } else {
        url = `https://api.kucoin.com/api/v1/market/candles?type=${tfParam}&symbol=${formattedPair}`;
      }

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const dataArr = json.data;
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          // Kucoin returns [time, open, close, high, low, volume, turnover]
          const candles: OHLCVCandle[] = dataArr
            .map((item: any[]) => ({
              time: Number(item[0]) * (String(item[0]).length === 10 ? 1000 : 1),
              open: parseFloat(item[1]),
              close: parseFloat(item[2]),
              high: parseFloat(item[3]),
              low: parseFloat(item[4]),
              volume: parseFloat(item[5]),
            }))
            .reverse();

          return {
            candles: candles.slice(-limit),
            sourceExchange: 'KUCOIN',
            sourceMarket: marketType,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } catch (_kcsErr) {
      // Fall through
    }
  }

  // 3. Crypto.com Route
  if (exchange === 'CRYPTO_COM') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://api.crypto.com/exchange/v1/public/get-candlestick?instrument_name=${formattedPair}&timeframe=${tfParam}&count=${limit}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const dataArr = json.result?.data;
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          const candles: OHLCVCandle[] = dataArr.map((item: any) => ({
            time: Number(item.t),
            open: parseFloat(item.o),
            high: parseFloat(item.h),
            low: parseFloat(item.l),
            close: parseFloat(item.c),
            volume: parseFloat(item.v),
          }));

          return {
            candles,
            sourceExchange: 'CRYPTO_COM',
            sourceMarket: marketType,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } catch (_cdcErr) {
      // Fall through
    }
  }

  // 4. Bitunix Route
  if (exchange === 'BITUNIX') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://api.bitunix.com/api/v1/market/kline?symbol=${formattedPair}&interval=${tfParam}&limit=${limit}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const dataArr = json.data || json.result;
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          const candles: OHLCVCandle[] = dataArr.map((item: any) => ({
            time: Number(item.time || item[0]),
            open: parseFloat(item.open || item[1]),
            high: parseFloat(item.high || item[2]),
            low: parseFloat(item.low || item[3]),
            close: parseFloat(item.close || item[4]),
            volume: parseFloat(item.vol || item.volume || item[5]),
            isSimulated: false,
          }));

          return {
            candles,
            sourceExchange: 'BITUNIX',
            sourceMarket: marketType,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } catch (_btxErr) {
      // Fall through
    }
  }

  // 5. Bybit Route (V5 API)
  if (exchange === 'BYBIT') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const cat = marketType === 'FUTURES' ? 'linear' : 'spot';
      const url = `https://api.bybit.com/v5/market/kline?category=${cat}&symbol=${formattedPair}&interval=${tfParam}&limit=${limit}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.retCode === 0 && json.result?.list && Array.isArray(json.result.list) && json.result.list.length > 0) {
          // Bybit returns newest first: [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
          const candles: OHLCVCandle[] = json.result.list
            .map((item: string[]) => ({
              time: Number(item[0]),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
              quoteVolume: parseFloat(item[6]),
              isSimulated: false,
            }))
            .reverse();

          return {
            candles,
            sourceExchange: 'BYBIT',
            sourceMarket: marketType,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } catch (_bybitErr) {
      // Fall through
    }
  }

  // 6. Bitget Route (V2 API)
  if (exchange === 'BITGET') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = marketType === 'FUTURES'
        ? `https://api.bitget.com/api/v2/mix/market/candles?symbol=${formattedPair}&granularity=${tfParam}&productType=USDT-FUTURES&limit=${limit}`
        : `https://api.bitget.com/api/v2/spot/market/candles?symbol=${formattedPair}&granularity=${tfParam}&limit=${limit}`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if ((json.code === '00000' || json.code === '0') && Array.isArray(json.data) && json.data.length > 0) {
          // Bitget returns [ts, open, high, low, close, baseVol, quoteVol]
          const candles: OHLCVCandle[] = json.data
            .map((item: any[]) => ({
              time: Number(item[0]),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
              quoteVolume: item[6] ? parseFloat(item[6]) : undefined,
              isSimulated: false,
            }))
            .sort((a: OHLCVCandle, b: OHLCVCandle) => a.time - b.time);

          return {
            candles,
            sourceExchange: 'BITGET',
            sourceMarket: marketType,
            latencyMs: Date.now() - startTime,
          };
        }
      }
    } catch (_bitgetErr) {
      // Fall through
    }
  }

  // 7. Binance Primary / Ultimate Ultra-Fast Gateway (Spot or Futures)
  const bnPair = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const bnTf = mapTimeframeToExchange(timeframe, 'BINANCE');

  try {
    const isFut = marketType === 'FUTURES' || ['KASUSDT', 'AKTUSDT', 'POPCATUSDT', 'BRETTUSDT', 'MEWUSDT'].includes(bnPair);
    const candidateUrls = isFut
      ? [`https://fapi.binance.com/fapi/v1/klines?symbol=${bnPair}&interval=${bnTf}&limit=${limit}`]
      : [
          `https://data-api.binance.vision/api/v3/klines?symbol=${bnPair}&interval=${bnTf}&limit=${limit}`,
          `https://api.binance.com/api/v3/klines?symbol=${bnPair}&interval=${bnTf}&limit=${limit}`,
        ];

    let res: Response | null = null;
    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (r.ok) {
          res = r;
          break;
        }
      } catch (_e) {}
    }

    if (res && res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const candles: OHLCVCandle[] = data.map((item: any[]) => ({
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

        return {
          candles,
          sourceExchange: exchange === 'BINANCE' ? 'BINANCE' : exchange,
          sourceMarket: marketType,
          latencyMs: Date.now() - startTime,
        };
      }
    }
  } catch (_bnErr) {
    // Return empty fallback
  }

  return {
    candles: [],
    sourceExchange: exchange,
    sourceMarket: marketType,
    latencyMs: Date.now() - startTime,
  };
}
