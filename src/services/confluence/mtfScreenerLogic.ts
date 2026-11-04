import { OHLCVCandle, MarketBias } from '../../types/crypto.types';
import {
  biasToMtfSignal,
  computeCandleConsensus,
  MtfCellSignal,
} from './signalConsensus';

export type MtfActionSignal = 'BUY' | 'SELL' | 'FLAT';
export type MtfTimeframeKey = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';

export const MTF_TIMEFRAME_KEYS: readonly MtfTimeframeKey[] = [
  '1m',
  '5m',
  '15m',
  '1H',
  '4H',
  '1D',
] as const;

export type MtfQuickTab =
  | 'ALL'
  | 'BULL_100'
  | 'BEAR_100'
  | 'BULL_GTE5'
  | 'BEAR_GTE5'
  | 'MIXED';

export type MtfSortColumn =
  | 'symbol'
  | 'price'
  | 'change24h'
  | 'volume24h'
  | 'marketCap'
  | 'rsi14'
  | 'fundingRate'
  | '1m'
  | '5m'
  | '15m'
  | '1H'
  | '4H'
  | '1D'
  | 'confluence';

export type SortDirection = 'asc' | 'desc';

export interface MtfSortConfig {
  column: MtfSortColumn;
  direction: SortDirection;
}

export interface MtfScreenerFilterState {
  search: string;
  quickTab: MtfQuickTab;
  volume24hMin: number | null;
  marketCapMin: number | null;
  marketCapMax: number | null;
  change24hMin: number | null;
  change24hMax: number | null;
  rsiMin: number | null;
  rsiMax: number | null;
  fundingMin: number | null; // percentage units, e.g. 0.01 means 0.01%
  fundingMax: number | null;
  hideStablecoins: boolean;
  tfFilters: Partial<Record<MtfTimeframeKey, MtfActionSignal | 'ANY'>>;
}

export const DEFAULT_MTF_FILTERS: MtfScreenerFilterState = {
  search: '',
  quickTab: 'ALL',
  volume24hMin: null,
  marketCapMin: null,
  marketCapMax: null,
  change24hMin: null,
  change24hMax: null,
  rsiMin: null,
  rsiMax: null,
  fundingMin: null,
  fundingMax: null,
  hideStablecoins: false,
  tfFilters: {},
};

export const DEFAULT_MTF_SORT: MtfSortConfig = {
  column: 'confluence',
  direction: 'desc',
};

export interface EvaluatedTimeframeResult {
  signal: MtfActionSignal;
  mtfCell: MtfCellSignal;
  score: number;
  marketBias: MarketBias;
  rsi14: number;
  ema20: number;
  ema50: number;
  closePrice: number;
}

export interface MtfConfluenceSummary {
  buyCount: number;
  sellCount: number;
  flatCount: number;
  evaluatedCount: number;
  totalTimeframes: number;
  dominantSide: 'BULL' | 'BEAR' | 'NEUTRAL';
  alignmentPct: number;
  /**
   * Deterministic numeric rank for sorting Confluence:
   * -1 when 0 timeframes are hydrated yet;
   * 0..100+ where 6/6 aligned = 100, 5/6 aligned = 83.3 (minus opposing penalty), etc.
   */
  confluenceRank: number;
  isAllBull: boolean;
  isAllBear: boolean;
  isGte5Bull: boolean;
  isGte5Bear: boolean;
  isMixed: boolean;
  labelId: string;
  labelEn: string;
}

export interface MtfScreenerRowModel {
  symbol: string;
  baseAsset: string;
  name: string;
  price: number;
  change24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  rsi14: number | null;
  fundingRate: number | null; // In percentage points, e.g. 0.01 = +0.0100%
  nextFundingTime?: number | null;
  spotAvailable?: boolean;
  signals: Record<MtfTimeframeKey, MtfActionSignal | null>;
  tfScores?: Partial<Record<MtfTimeframeKey, number>>;
  tfUpdatedAt?: Partial<Record<MtfTimeframeKey, number>>;
  confluence: MtfConfluenceSummary;
  hydratedCount: number;
  rowError?: string | null;
  updatedAt: number | null;
}

const STABLECOIN_BASES = new Set([
  'USDT',
  'USDC',
  'FDUSD',
  'TUSD',
  'USDP',
  'DAI',
  'USDE',
  'USD1',
  'PYUSD',
  'FRAX',
  'LUSD',
  'BUSD',
  'RLUSD',
  'USDD',
  'GUSD',
  'CRVUSD',
  'GHO',
  'USTC',
  'EUR',
  'AEUR',
  'EURC',
  'EURI',
]);

/**
 * Checks whether a trading pair's base asset is a fiat/USD-pegged stablecoin.
 */
export function isStablecoinPair(symbol: string): boolean {
  if (!symbol) return false;
  const upper = symbol.trim().toUpperCase();
  const base = upper.includes('/')
    ? upper.split('/')[0]
    : upper.endsWith('USDT')
    ? upper.slice(0, -4)
    : upper;
  return STABLECOIN_BASES.has(base);
}

/**
 * Computes standard Exponential Moving Average (EMA) on closing prices.
 */
export function calculateEMA(closes: number[], period: number): number {
  if (!closes.length) return 0;
  if (closes.length < period) {
    return closes.reduce((acc, v) => acc + v, 0) / closes.length;
  }
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((acc, v) => acc + v, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * Maps internal MtfCellSignal ('BULL' | 'BEAR' | 'NEUTRAL') to UI/API MtfActionSignal ('BUY' | 'SELL' | 'FLAT').
 */
export function mtfCellToActionSignal(cell: MtfCellSignal): MtfActionSignal {
  if (cell === 'BULL') return 'BUY';
  if (cell === 'BEAR') return 'SELL';
  return 'FLAT';
}

/**
 * Maps Main Chart MarketBias + confluenceScore directly to MtfActionSignal ('BUY' | 'SELL' | 'FLAT')
 * using the exact same threshold as signalConsensus.ts so Main Chart and MTF Screener never diverge.
 */
export function biasToActionSignal(bias: MarketBias | string, score?: number): MtfActionSignal {
  return mtfCellToActionSignal(biasToMtfSignal(bias, score));
}

/**
 * Deterministic Per-Timeframe Signal Rule (Shared with Main Chart / Grafik Utama):
 *
 * Evaluates 12-indicator weighted institutional consensus (`computeCandleConsensus` from `signalConsensus.ts`):
 * - Score >= 58 (Bullish / Strong Bullish alignment across Price Action, SMC, OrderFlow, ICT, RSI, MACD, VWAP, etc.) => 'BUY'
 * - Score <= 42 (Bearish / Strong Bearish alignment) => 'SELL'
 * - 43 <= Score <= 57 (Neutral / conflicting structure) => 'FLAT'
 *
 * Also computes EMA20, EMA50, and RSI(14) from the exact same candle series for screener diagnostics & filtering.
 * Requires at least 20 valid candles; returns null if candle series is insufficient.
 */
export function evaluateMtfTimeframeSignal(
  candles: OHLCVCandle[]
): EvaluatedTimeframeResult | null {
  const consensus = computeCandleConsensus(candles);
  if (!consensus) return null;

  const closes = candles.map((c) => c.close).filter((v) => Number.isFinite(v) && v > 0);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  return {
    signal: mtfCellToActionSignal(consensus.mtfSignal),
    mtfCell: consensus.mtfSignal,
    score: consensus.score,
    marketBias: consensus.marketBias,
    rsi14: consensus.rsi14,
    ema20,
    ema50,
    closePrice: consensus.closePrice,
  };
}

/**
 * Aggregates up to 6 timeframe signals ('1m', '5m', '15m', '1H', '4H', '1D') into a
 * deterministic Confluence score and classification for tabs & sorting.
 */
export function computeMtfConfluence(
  signals: Record<MtfTimeframeKey, MtfActionSignal | null>
): MtfConfluenceSummary {
  let buyCount = 0;
  let sellCount = 0;
  let flatCount = 0;

  for (const tf of MTF_TIMEFRAME_KEYS) {
    const s = signals[tf];
    if (s === 'BUY') buyCount++;
    else if (s === 'SELL') sellCount++;
    else if (s === 'FLAT') flatCount++;
  }

  const evaluatedCount = buyCount + sellCount + flatCount;
  const totalTimeframes = MTF_TIMEFRAME_KEYS.length;

  if (evaluatedCount === 0) {
    return {
      buyCount: 0,
      sellCount: 0,
      flatCount: 0,
      evaluatedCount: 0,
      totalTimeframes,
      dominantSide: 'NEUTRAL',
      alignmentPct: 0,
      confluenceRank: -1,
      isAllBull: false,
      isAllBear: false,
      isGte5Bull: false,
      isGte5Bear: false,
      isMixed: false,
      labelId: '—',
      labelEn: '—',
    };
  }

  const isFullyHydrated = evaluatedCount === totalTimeframes;
  const isAllBull = isFullyHydrated && buyCount === totalTimeframes;
  const isAllBear = isFullyHydrated && sellCount === totalTimeframes;
  const isGte5Bull = isFullyHydrated && buyCount >= 5;
  const isGte5Bear = isFullyHydrated && sellCount >= 5;
  const isMixed = evaluatedCount > 0 && !isGte5Bull && !isGte5Bear;

  let dominantSide: 'BULL' | 'BEAR' | 'NEUTRAL' = 'NEUTRAL';
  if (buyCount > sellCount) dominantSide = 'BULL';
  else if (sellCount > buyCount) dominantSide = 'BEAR';

  const dominantCount = Math.max(buyCount, sellCount);
  const opposingCount = Math.min(buyCount, sellCount);
  const alignmentPct = Math.round((dominantCount / evaluatedCount) * 100);

  // Rank formula:
  // Scales hydrated alignment (6/6 = 100, 5/6 = 83.33, 4/6 = 66.67...)
  // Penalizes partial hydration slightly vs full 6/6, and penalizes opposing signals (-1.5 per opposing TF)
  const hydrationFactor = evaluatedCount / totalTimeframes;
  const rawAlignment = (dominantCount / totalTimeframes) * 100;
  const opposingPenalty = opposingCount * 1.5;
  const confluenceRank = Number(
    Math.max(0, rawAlignment * hydrationFactor - opposingPenalty).toFixed(3)
  );

  let labelId: string;
  let labelEn: string;

  if (buyCount > sellCount && buyCount >= 3) {
    labelId = `${buyCount}/${evaluatedCount} Bullish (${alignmentPct}%)`;
    labelEn = `${buyCount}/${evaluatedCount} Bullish (${alignmentPct}%)`;
  } else if (sellCount > buyCount && sellCount >= 3) {
    labelId = `${sellCount}/${evaluatedCount} Bearish (${alignmentPct}%)`;
    labelEn = `${sellCount}/${evaluatedCount} Bearish (${alignmentPct}%)`;
  } else if (buyCount === 0 && sellCount === 0) {
    labelId = `Netral (${flatCount}/${evaluatedCount} Flat)`;
    labelEn = `Neutral (${flatCount}/${evaluatedCount} Flat)`;
  } else {
    labelId = `Mixed (${buyCount}B · ${sellCount}S · ${flatCount}F)`;
    labelEn = `Mixed (${buyCount}B · ${sellCount}S · ${flatCount}F)`;
  }

  return {
    buyCount,
    sellCount,
    flatCount,
    evaluatedCount,
    totalTimeframes,
    dominantSide,
    alignmentPct,
    confluenceRank,
    isAllBull,
    isAllBear,
    isGte5Bull,
    isGte5Bear,
    isMixed,
    labelId,
    labelEn,
  };
}

function signalNumericOrder(sig: MtfActionSignal | null): number {
  if (sig === 'BUY') return 3;
  if (sig === 'FLAT') return 2;
  if (sig === 'SELL') return 1;
  return 0;
}

/**
 * Filters MTF Screener rows according to Quick Tab, Search, Advanced Numeric Ranges,
 * Hide Stablecoins toggle, and Per-Timeframe exact match rules.
 */
export function filterMtfRows(
  rows: MtfScreenerRowModel[],
  filters: MtfScreenerFilterState
): MtfScreenerRowModel[] {
  const q = filters.search.trim().toUpperCase();

  return rows.filter((row) => {
    if (filters.hideStablecoins && isStablecoinPair(row.symbol)) {
      return false;
    }

    if (q) {
      const matchSym = row.symbol.toUpperCase().includes(q);
      const matchBase = row.baseAsset.toUpperCase().includes(q);
      const matchName = row.name.toUpperCase().includes(q);
      if (!matchSym && !matchBase && !matchName) return false;
    }

    // Quick alignment tab
    switch (filters.quickTab) {
      case 'BULL_100':
        if (!row.confluence.isAllBull) return false;
        break;
      case 'BEAR_100':
        if (!row.confluence.isAllBear) return false;
        break;
      case 'BULL_GTE5':
        if (!row.confluence.isGte5Bull) return false;
        break;
      case 'BEAR_GTE5':
        if (!row.confluence.isGte5Bear) return false;
        break;
      case 'MIXED':
        if (!row.confluence.isMixed) return false;
        break;
      case 'ALL':
      default:
        break;
    }

    // Numeric range filters
    if (filters.volume24hMin !== null) {
      if (row.volume24h === null || row.volume24h < filters.volume24hMin) return false;
    }
    if (filters.marketCapMin !== null) {
      if (row.marketCap === null || row.marketCap < filters.marketCapMin) return false;
    }
    if (filters.marketCapMax !== null) {
      if (row.marketCap === null || row.marketCap > filters.marketCapMax) return false;
    }
    if (filters.change24hMin !== null) {
      if (row.change24h === null || row.change24h < filters.change24hMin) return false;
    }
    if (filters.change24hMax !== null) {
      if (row.change24h === null || row.change24h > filters.change24hMax) return false;
    }
    if (filters.rsiMin !== null) {
      if (row.rsi14 === null || row.rsi14 < filters.rsiMin) return false;
    }
    if (filters.rsiMax !== null) {
      if (row.rsi14 === null || row.rsi14 > filters.rsiMax) return false;
    }
    if (filters.fundingMin !== null) {
      if (row.fundingRate === null || row.fundingRate < filters.fundingMin) return false;
    }
    if (filters.fundingMax !== null) {
      if (row.fundingRate === null || row.fundingRate > filters.fundingMax) return false;
    }

    // Per-timeframe filters (e.g. 4H = BUY && 1D = BUY)
    for (const tf of MTF_TIMEFRAME_KEYS) {
      const desired = filters.tfFilters[tf];
      if (desired && desired !== 'ANY') {
        if (row.signals[tf] !== desired) return false;
      }
    }

    return true;
  });
}

/**
 * Sorts MTF Screener rows on any column with null-last semantics and
 * deterministic tie-breaking by 24h Volume descending, then Symbol ascending.
 */
export function sortMtfRows(
  rows: MtfScreenerRowModel[],
  sort: MtfSortConfig
): MtfScreenerRowModel[] {
  const dir = sort.direction === 'asc' ? 1 : -1;
  const copy = [...rows];

  const compareNullableNum = (a: number | null | undefined, b: number | null | undefined): number => {
    const aValid = typeof a === 'number' && Number.isFinite(a);
    const bValid = typeof b === 'number' && Number.isFinite(b);
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1; // Always push missing/null values to bottom
    if (!bValid) return -1;
    if (a === b) return 0;
    return a < b ? -1 * dir : 1 * dir;
  };

  copy.sort((a, b) => {
    let primary = 0;

    switch (sort.column) {
      case 'symbol':
        primary = a.symbol.localeCompare(b.symbol) * dir;
        break;
      case 'price':
        primary = compareNullableNum(a.price > 0 ? a.price : null, b.price > 0 ? b.price : null);
        break;
      case 'change24h':
        primary = compareNullableNum(a.change24h, b.change24h);
        break;
      case 'volume24h':
        primary = compareNullableNum(a.volume24h, b.volume24h);
        break;
      case 'marketCap':
        primary = compareNullableNum(a.marketCap, b.marketCap);
        break;
      case 'rsi14':
        primary = compareNullableNum(a.rsi14, b.rsi14);
        break;
      case 'fundingRate':
        primary = compareNullableNum(a.fundingRate, b.fundingRate);
        break;
      case '1m':
      case '5m':
      case '15m':
      case '1H':
      case '4H':
      case '1D': {
        const ordA = signalNumericOrder(a.signals[sort.column]);
        const ordB = signalNumericOrder(b.signals[sort.column]);
        if (ordA === 0 && ordB === 0) primary = 0;
        else if (ordA === 0) primary = 1;
        else if (ordB === 0) primary = -1;
        else if (ordA !== ordB) primary = (ordA < ordB ? -1 : 1) * dir;
        break;
      }
      case 'confluence':
      default: {
        const rA = a.confluence.confluenceRank;
        const rB = b.confluence.confluenceRank;
        if (rA < 0 && rB < 0) primary = 0;
        else if (rA < 0) primary = 1;
        else if (rB < 0) primary = -1;
        else if (rA !== rB) primary = (rA < rB ? -1 : 1) * dir;
        break;
      }
    }

    if (primary !== 0) return primary;

    // Secondary tie-breaker: 24h Volume descending
    const volA = a.volume24h ?? 0;
    const volB = b.volume24h ?? 0;
    if (volA !== volB) return volB - volA;

    return a.symbol.localeCompare(b.symbol);
  });

  return copy;
}

/**
 * Serializes active filter & sort state into compact URLSearchParams so screener views can be shared via URL.
 */
export function serializeMtfStateToSearchParams(
  filters: MtfScreenerFilterState,
  sort: MtfSortConfig,
  baseSearch = ''
): URLSearchParams {
  const params = new URLSearchParams(baseSearch);

  // Clear previous mtf_* keys first
  for (const key of Array.from(params.keys())) {
    if (key.startsWith('mtf_')) {
      params.delete(key);
    }
  }

  params.set('stage', 'mtf_screener');

  if (filters.search.trim()) params.set('mtf_q', filters.search.trim());
  if (filters.quickTab !== 'ALL') params.set('mtf_tab', filters.quickTab);
  if (filters.volume24hMin !== null) params.set('mtf_vmin', String(filters.volume24hMin));
  if (filters.marketCapMin !== null) params.set('mtf_mcmin', String(filters.marketCapMin));
  if (filters.marketCapMax !== null) params.set('mtf_mcmax', String(filters.marketCapMax));
  if (filters.change24hMin !== null) params.set('mtf_cmin', String(filters.change24hMin));
  if (filters.change24hMax !== null) params.set('mtf_cmax', String(filters.change24hMax));
  if (filters.rsiMin !== null) params.set('mtf_rsimin', String(filters.rsiMin));
  if (filters.rsiMax !== null) params.set('mtf_rsimax', String(filters.rsiMax));
  if (filters.fundingMin !== null) params.set('mtf_fmin', String(filters.fundingMin));
  if (filters.fundingMax !== null) params.set('mtf_fmax', String(filters.fundingMax));
  if (filters.hideStablecoins) params.set('mtf_nostable', '1');

  for (const tf of MTF_TIMEFRAME_KEYS) {
    const val = filters.tfFilters[tf];
    if (val && val !== 'ANY') {
      params.set(`mtf_tf_${tf}`, val);
    }
  }

  if (sort.column !== DEFAULT_MTF_SORT.column || sort.direction !== DEFAULT_MTF_SORT.direction) {
    params.set('mtf_sort', sort.column);
    params.set('mtf_dir', sort.direction);
  }

  return params;
}

function parseOptionalNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

const VALID_QUICK_TABS = new Set<MtfQuickTab>([
  'ALL',
  'BULL_100',
  'BEAR_100',
  'BULL_GTE5',
  'BEAR_GTE5',
  'MIXED',
]);

const VALID_SORT_COLUMNS = new Set<MtfSortColumn>([
  'symbol',
  'price',
  'change24h',
  'volume24h',
  'marketCap',
  'rsi14',
  'fundingRate',
  '1m',
  '5m',
  '15m',
  '1H',
  '4H',
  '1D',
  'confluence',
]);

/**
 * Parses URLSearchParams back into MtfScreenerFilterState & MtfSortConfig.
 */
export function parseMtfStateFromSearchParams(search: string): {
  filters: MtfScreenerFilterState;
  sort: MtfSortConfig;
} {
  const params = new URLSearchParams(search);
  const rawTab = (params.get('mtf_tab') || 'ALL') as MtfQuickTab;
  const quickTab = VALID_QUICK_TABS.has(rawTab) ? rawTab : 'ALL';

  const tfFilters: Partial<Record<MtfTimeframeKey, MtfActionSignal | 'ANY'>> = {};
  for (const tf of MTF_TIMEFRAME_KEYS) {
    const v = params.get(`mtf_tf_${tf}`);
    if (v === 'BUY' || v === 'SELL' || v === 'FLAT') {
      tfFilters[tf] = v;
    }
  }

  const rawSort = (params.get('mtf_sort') || DEFAULT_MTF_SORT.column) as MtfSortColumn;
  const rawDir = params.get('mtf_dir');

  return {
    filters: {
      search: params.get('mtf_q') || '',
      quickTab,
      volume24hMin: parseOptionalNumber(params.get('mtf_vmin')),
      marketCapMin: parseOptionalNumber(params.get('mtf_mcmin')),
      marketCapMax: parseOptionalNumber(params.get('mtf_mcmax')),
      change24hMin: parseOptionalNumber(params.get('mtf_cmin')),
      change24hMax: parseOptionalNumber(params.get('mtf_cmax')),
      rsiMin: parseOptionalNumber(params.get('mtf_rsimin')),
      rsiMax: parseOptionalNumber(params.get('mtf_rsimax')),
      fundingMin: parseOptionalNumber(params.get('mtf_fmin')),
      fundingMax: parseOptionalNumber(params.get('mtf_fmax')),
      hideStablecoins: params.get('mtf_nostable') === '1' || params.get('mtf_nostable') === 'true',
      tfFilters,
    },
    sort: {
      column: VALID_SORT_COLUMNS.has(rawSort) ? rawSort : DEFAULT_MTF_SORT.column,
      direction: rawDir === 'asc' || rawDir === 'desc' ? rawDir : DEFAULT_MTF_SORT.direction,
    },
  };
}

export function hasActiveMtfFilters(filters: MtfScreenerFilterState): boolean {
  if (filters.search.trim() !== '') return true;
  if (filters.quickTab !== 'ALL') return true;
  if (filters.volume24hMin !== null) return true;
  if (filters.marketCapMin !== null || filters.marketCapMax !== null) return true;
  if (filters.change24hMin !== null || filters.change24hMax !== null) return true;
  if (filters.rsiMin !== null || filters.rsiMax !== null) return true;
  if (filters.fundingMin !== null || filters.fundingMax !== null) return true;
  if (filters.hideStablecoins) return true;
  for (const tf of MTF_TIMEFRAME_KEYS) {
    const v = filters.tfFilters[tf];
    if (v && v !== 'ANY') return true;
  }
  return false;
}
