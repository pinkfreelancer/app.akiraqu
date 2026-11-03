import { LiveOrderBookLevel } from '../types/market.types';

export type DataFeedStatus = 'LIVE' | 'DELAYED' | 'STALE' | 'OFFLINE';
export type TransportWsStatus = 'connected' | 'connecting' | 'fallback' | 'disconnected' | 'error';

const KNOWN_QUOTES = ['USDT', 'USDC', 'USD', 'BUSD', 'FDUSD', 'BTC', 'ETH'] as const;

/**
 * Normalizes exchange-specific symbol formats (e.g. "btcusdt", "BTC-USDT-SWAP", "BTC_USDT", "BTC/USDT:USDT")
 * into canonical "BASE/QUOTE" format (e.g. "BTC/USDT").
 */
export function normalizeSymbol(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim().toUpperCase();
  if (!cleaned) return '';

  // Strip futures settlement suffix like ":USDT" or "-SWAP" or "-PERP"
  cleaned = cleaned.split(':')[0];
  cleaned = cleaned.replace(/[-_](SWAP|PERP|PERPETUAL)$/i, '');

  if (cleaned.includes('/')) {
    const [base, quote] = cleaned.split('/');
    if (base && quote) return `${base.trim()}/${quote.trim()}`;
  }

  if (cleaned.includes('-') || cleaned.includes('_')) {
    const parts = cleaned.split(/[-_]/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  }

  for (const quote of KNOWN_QUOTES) {
    if (cleaned.endsWith(quote) && cleaned.length > quote.length) {
      const base = cleaned.slice(0, cleaned.length - quote.length);
      return `${base}/${quote}`;
    }
  }

  return cleaned;
}

export interface PriceValidationInput {
  payloadSymbol: string;
  expectedSymbol?: string;
  price: number;
  referencePrice?: number | null;
  referenceUpdatedAt?: number | null;
  maxDeviationPct?: number;
  maxReferenceAgeMs?: number;
  allowAnchorReset?: boolean;
  now?: number;
}

export interface PriceValidationResult {
  valid: boolean;
  normalizedSymbol: string;
  price: number;
  deviationPct: number;
  reason?: 'EMPTY_SYMBOL' | 'SYMBOL_MISMATCH' | 'NON_POSITIVE_PRICE' | 'EXCESSIVE_DEVIATION';
}

/**
 * Validates incoming price tick against symbol identity, numeric sanity, and reference price deviation (>5% rejected).
 */
export function validatePriceTick(input: PriceValidationInput): PriceValidationResult {
  const {
    payloadSymbol,
    expectedSymbol,
    price,
    referencePrice,
    referenceUpdatedAt,
    maxDeviationPct = 5,
    maxReferenceAgeMs = 120_000,
    allowAnchorReset = false,
    now = Date.now(),
  } = input;

  const normalizedSymbol = normalizeSymbol(payloadSymbol);
  if (!normalizedSymbol) {
    return { valid: false, normalizedSymbol: '', price: 0, deviationPct: 0, reason: 'EMPTY_SYMBOL' };
  }

  if (expectedSymbol) {
    const normExpected = normalizeSymbol(expectedSymbol);
    if (normExpected && normalizedSymbol !== normExpected) {
      return { valid: false, normalizedSymbol, price, deviationPct: 0, reason: 'SYMBOL_MISMATCH' };
    }
  }

  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return { valid: false, normalizedSymbol, price: 0, deviationPct: 0, reason: 'NON_POSITIVE_PRICE' };
  }

  if (
    !allowAnchorReset &&
    typeof referencePrice === 'number' &&
    Number.isFinite(referencePrice) &&
    referencePrice > 0
  ) {
    const refIsFresh =
      typeof referenceUpdatedAt === 'number' && referenceUpdatedAt > 0
        ? now - referenceUpdatedAt <= maxReferenceAgeMs
        : true;

    if (refIsFresh) {
      const deviationPct = (Math.abs(price - referencePrice) / referencePrice) * 100;
      if (deviationPct > maxDeviationPct) {
        return {
          valid: false,
          normalizedSymbol,
          price,
          deviationPct,
          reason: 'EXCESSIVE_DEVIATION',
        };
      }
      return { valid: true, normalizedSymbol, price, deviationPct };
    }
  }

  return { valid: true, normalizedSymbol, price, deviationPct: 0 };
}

export type RawDepthTuple = [number | string, number | string] | { price: number | string; amount: number | string };

export interface OrderBookValidationInput {
  payloadSymbol: string;
  expectedSymbol: string;
  bids: RawDepthTuple[];
  asks: RawDepthTuple[];
  referencePrice?: number | null;
  maxBestQuoteDeviationPct?: number;
  maxLevelDeviationPct?: number;
  maxLevels?: number;
}

export interface OrderBookValidationResult {
  valid: boolean;
  normalizedSymbol: string;
  bids: LiveOrderBookLevel[];
  asks: LiveOrderBookLevel[];
  rawBids: [number, number][];
  rawAsks: [number, number][];
  bidTotal: number;
  askTotal: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPct: number;
  reason?:
    | 'SYMBOL_MISMATCH'
    | 'EMPTY_BOOK'
    | 'CROSSED_OR_INVALID_SPREAD'
    | 'BEST_QUOTE_DEVIATION';
}

function parseRawLevel(entry: RawDepthTuple): [number, number] | null {
  if (Array.isArray(entry) && entry.length >= 2) {
    const p = typeof entry[0] === 'number' ? entry[0] : parseFloat(String(entry[0]));
    const q = typeof entry[1] === 'number' ? entry[1] : parseFloat(String(entry[1]));
    if (Number.isFinite(p) && p > 0 && Number.isFinite(q) && q > 0) {
      return [p, q];
    }
    return null;
  }
  if (entry && typeof entry === 'object' && 'price' in entry && 'amount' in entry) {
    const p = typeof entry.price === 'number' ? entry.price : parseFloat(String(entry.price));
    const q = typeof entry.amount === 'number' ? entry.amount : parseFloat(String(entry.amount));
    if (Number.isFinite(p) && p > 0 && Number.isFinite(q) && q > 0) {
      return [p, q];
    }
  }
  return null;
}

/**
 * Validates L2 OrderBook payloads to prevent cross-symbol contamination (e.g. $0.03 levels on $80k BTC/USDT).
 */
export function validateOrderBookPayload(input: OrderBookValidationInput): OrderBookValidationResult {
  const {
    payloadSymbol,
    expectedSymbol,
    bids,
    asks,
    referencePrice,
    maxBestQuoteDeviationPct = 5,
    maxLevelDeviationPct = 20,
    maxLevels = 15,
  } = input;

  const normPayload = normalizeSymbol(payloadSymbol);
  const normExpected = normalizeSymbol(expectedSymbol);

  const emptyResult = (
    reason: OrderBookValidationResult['reason']
  ): OrderBookValidationResult => ({
    valid: false,
    normalizedSymbol: normPayload,
    bids: [],
    asks: [],
    rawBids: [],
    rawAsks: [],
    bidTotal: 0,
    askTotal: 0,
    bestBid: 0,
    bestAsk: 0,
    spread: 0,
    spreadPct: 0,
    reason,
  });

  if (!normPayload || !normExpected || normPayload !== normExpected) {
    return emptyResult('SYMBOL_MISMATCH');
  }

  if (!Array.isArray(bids) || !Array.isArray(asks) || bids.length === 0 || asks.length === 0) {
    return emptyResult('EMPTY_BOOK');
  }

  const hasValidReference =
    typeof referencePrice === 'number' && Number.isFinite(referencePrice) && referencePrice > 0;

  let parsedBids = bids
    .map(parseRawLevel)
    .filter((lvl): lvl is [number, number] => lvl !== null)
    .sort((a, b) => b[0] - a[0]);

  let parsedAsks = asks
    .map(parseRawLevel)
    .filter((lvl): lvl is [number, number] => lvl !== null)
    .sort((a, b) => a[0] - b[0]);

  if (parsedBids.length === 0 || parsedAsks.length === 0) {
    return emptyResult('EMPTY_BOOK');
  }

  const rawBestBid = parsedBids[0][0];
  const rawBestAsk = parsedAsks[0][0];

  if (rawBestBid <= 0 || rawBestAsk <= 0 || rawBestBid >= rawBestAsk) {
    return emptyResult('CROSSED_OR_INVALID_SPREAD');
  }

  if (hasValidReference) {
    const bidDevPct = (Math.abs(rawBestBid - referencePrice!) / referencePrice!) * 100;
    const askDevPct = (Math.abs(rawBestAsk - referencePrice!) / referencePrice!) * 100;
    if (bidDevPct > maxBestQuoteDeviationPct || askDevPct > maxBestQuoteDeviationPct) {
      return emptyResult('BEST_QUOTE_DEVIATION');
    }

    parsedBids = parsedBids.filter(
      ([p]) => (Math.abs(p - referencePrice!) / referencePrice!) * 100 <= maxLevelDeviationPct
    );
    parsedAsks = parsedAsks.filter(
      ([p]) => (Math.abs(p - referencePrice!) / referencePrice!) * 100 <= maxLevelDeviationPct
    );

    if (parsedBids.length === 0 || parsedAsks.length === 0) {
      return emptyResult('BEST_QUOTE_DEVIATION');
    }
  }

  const slicedBids = parsedBids.slice(0, maxLevels);
  const slicedAsks = parsedAsks.slice(0, maxLevels);

  let bidCum = 0;
  const formattedBids: LiveOrderBookLevel[] = slicedBids.map(([price, amount]) => {
    bidCum += amount;
    return { price, amount, total: bidCum };
  });

  let askCum = 0;
  const formattedAsks: LiveOrderBookLevel[] = slicedAsks.map(([price, amount]) => {
    askCum += amount;
    return { price, amount, total: askCum };
  });

  const bestBid = formattedBids[0].price;
  const bestAsk = formattedAsks[0].price;
  const spread = Math.max(0, bestAsk - bestBid);
  const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  return {
    valid: true,
    normalizedSymbol: normExpected,
    bids: formattedBids,
    asks: formattedAsks,
    rawBids: slicedBids,
    rawAsks: slicedAsks,
    bidTotal: bidCum,
    askTotal: askCum,
    bestBid,
    bestAsk,
    spread,
    spreadPct,
  };
}

/**
 * Exponential backoff with +/-25% jitter so reconnecting clients do not thunder-herd.
 */
export function computeReconnectDelayMs(
  attempt: number,
  baseMs = 1000,
  maxMs = 30_000,
  randomFn: () => number = Math.random
): number {
  const safeAttempt = Math.max(0, Math.min(20, Math.floor(attempt)));
  const expDelay = Math.min(maxMs, baseMs * Math.pow(2, safeAttempt));
  const clampedRand = Math.max(0, Math.min(1, randomFn()));
  const jitterFactor = 0.75 + 0.5 * clampedRand; // [0.75, 1.25]
  return Math.max(250, Math.min(maxMs, Math.round(expDelay * jitterFactor)));
}

export interface FeedStatusInput {
  updatedAt?: number | null;
  wsStatus: TransportWsStatus;
  isOnline?: boolean;
  fallbackPollingActive?: boolean;
  now?: number;
  liveThresholdMs?: number;
  staleThresholdMs?: number;
  lang?: 'id' | 'en';
}

export interface FeedStatusResult {
  status: DataFeedStatus;
  ageMs: number | null;
  ageLabel: string;
}

export function formatRelativeAge(
  ageMs: number | null,
  lang: 'id' | 'en' = 'id',
  isOffline = false
): string {
  if (ageMs === null || !Number.isFinite(ageMs) || ageMs < 0) {
    if (isOffline) return lang === 'en' ? 'offline' : 'terputus';
    return lang === 'en' ? 'syncing' : 'sinkronisasi';
  }
  const sec = Math.floor(ageMs / 1000);
  if (sec <= 0) {
    return lang === 'en' ? '<1s ago' : 'baru saja';
  }
  if (sec < 60) {
    return lang === 'en' ? `${sec}s ago` : `${sec} dtk lalu`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return lang === 'en' ? `${min}m ago` : `${min} mnt lalu`;
  }
  const hr = Math.floor(min / 60);
  return lang === 'en' ? `${hr}h ago` : `${hr} jam lalu`;
}

/**
 * Computes truthful per-data UI status: LIVE / DELAYED / STALE / OFFLINE with relative age.
 */
export function computeFeedStatus(input: FeedStatusInput): FeedStatusResult {
  const {
    updatedAt,
    wsStatus,
    isOnline = true,
    fallbackPollingActive = false,
    now = Date.now(),
    liveThresholdMs = 6000,
    staleThresholdMs = 15_000,
    lang = 'id',
  } = input;

  const hasTimestamp = typeof updatedAt === 'number' && Number.isFinite(updatedAt) && updatedAt > 0;
  const ageMs = hasTimestamp ? Math.max(0, now - updatedAt!) : null;

  if (!isOnline || ((wsStatus === 'disconnected' || wsStatus === 'error') && !fallbackPollingActive)) {
    return {
      status: 'OFFLINE',
      ageMs,
      ageLabel: formatRelativeAge(ageMs, lang, true),
    };
  }

  if (ageMs === null || ageMs > staleThresholdMs) {
    return {
      status: 'STALE',
      ageMs,
      ageLabel: formatRelativeAge(ageMs, lang, false),
    };
  }

  if (
    fallbackPollingActive ||
    wsStatus === 'fallback' ||
    wsStatus === 'connecting' ||
    ageMs > liveThresholdMs
  ) {
    return {
      status: 'DELAYED',
      ageMs,
      ageLabel: formatRelativeAge(ageMs, lang, false),
    };
  }

  return {
    status: 'LIVE',
    ageMs,
    ageLabel: formatRelativeAge(ageMs, lang, false),
  };
}

/**
 * Formats crypto prices across micro-cap ($0.0000185) and large-cap ($80,484.20) ranges cleanly.
 */
export function formatSmartCryptoPrice(price: number | null | undefined): string {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return '—';
  }
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  if (price >= 0.01) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 5 });
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
}
