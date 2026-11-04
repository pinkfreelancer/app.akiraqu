export type HeatmapTimeframe = '1h' | '24h' | '7d';
export type HeatmapScope = 'top25' | 'top50' | 'top100';
export type CryptoSectorKey = 'ALL' | 'L1' | 'L2' | 'DeFi' | 'AI' | 'Meme' | 'RWA' | 'Other';

export function getCryptoSector(symbolOrBase: string): CryptoSectorKey {
  const base = String(symbolOrBase || '')
    .replace('/USDT', '')
    .replace(/^1000/, '')
    .toUpperCase();

  if (
    [
      'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'SUI', 'TON', 'DOT',
      'NEAR', 'APT', 'SEI', 'TIA', 'INJ', 'KAS', 'ALGO', 'FTM', 'S', 'HBAR',
      'ICP', 'ATOM', 'MINA', 'RON', 'KLAY', 'EOS', 'FLOW', 'XTZ', 'BCH', 'LTC',
      'ETC', 'XLM', 'TRX', 'NEO', 'IOTA', 'EGLD', 'KAVA'
    ].includes(base)
  ) {
    return 'L1';
  }

  if (
    [
      'ARB', 'OP', 'POL', 'MATIC', 'STRK', 'ZK', 'MANTA', 'METIS', 'BLAST',
      'IMX', 'STX', 'SCR', 'LINEA'
    ].includes(base)
  ) {
    return 'L2';
  }

  if (
    [
      'UNI', 'AAVE', 'MKR', 'LDO', 'CRV', 'SNX', 'COMP', 'PENDLE', 'JUP',
      'RAY', 'ENA', 'CAKE', 'SUSHI', 'DYDX', 'RUNE', 'GMX', '1INCH', 'BAL',
      'YFI', 'CVX', 'RPL', 'COW'
    ].includes(base)
  ) {
    return 'DeFi';
  }

  if (
    [
      'FET', 'RENDER', 'TAO', 'GRT', 'AKT', 'WLD', 'AR', 'IO', 'GLM', 'THETA',
      'PHB', 'AGIX', 'OCEAN', 'JASMY', 'ARKM', 'AI', 'NFP'
    ].includes(base)
  ) {
    return 'AI';
  }

  if (
    [
      'DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'BRETT', 'POPCAT',
      'MEME', 'BOME', 'MEW', 'NEIRO', 'TURBO', 'BABYDOGE', '1000SATS', 'ORDI',
      'MOG', 'PEOPLE', 'SLERF'
    ].includes(base)
  ) {
    return 'Meme';
  }

  if (
    [
      'ONDO', 'OM', 'CFG', 'POLYX', 'LINK', 'TRU', 'MPL', 'CHCS', 'GFI'
    ].includes(base)
  ) {
    return 'RWA';
  }

  return 'Other';
}

export type FearGreedZoneKey =
  | 'EXTREME_FEAR'
  | 'FEAR'
  | 'NEUTRAL'
  | 'GREED'
  | 'EXTREME_GREED';

export interface FearGreedPoint {
  timestamp: number;
  value: number;
}

export interface FearGreedOverview {
  current: number | null;
  yesterday: number | null;
  lastWeek: number | null;
  lastMonth: number | null;
  history30d: FearGreedPoint[];
  updatedAt: number | null;
}

export interface GlobalMarketSummary {
  totalMarketCapUsd: number | null;
  marketCapChange24hPct: number | null;
  totalVolume24hUsd: number | null;
  btcDominancePct: number | null;
  ethDominancePct: number | null;
  updatedAt: number | null;
}

export interface MarketBreadth24h {
  advancing: number;
  declining: number;
  unchanged: number;
  total: number;
  advancingPct: number;
}

export interface HeatmapAssetItem {
  symbol: string; // e.g. "BTC/USDT"
  baseAsset: string; // e.g. "BTC"
  name: string;
  price: number;
  marketCap: number;
  volume24h: number | null;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  spotAvailable?: boolean;
}

export interface MoverCoinItem {
  symbol: string;
  baseAsset: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number | null;
  /** Turnover percentage (24h Volume / Market Cap * 100) or relative spike factor */
  volumeSpikeScore: number;
  volumeSpikeLabel: string;
  spotAvailable?: boolean;
}

export interface FundingExtremeItem {
  symbol: string;
  baseAsset: string;
  name: string;
  price: number;
  change24h: number | null;
  fundingRatePct: number; // e.g. +0.0425 means +0.0425%
  volume24h: number | null;
}

export interface OpenInterestSurgeItem {
  symbol: string;
  baseAsset: string;
  name: string;
  price: number;
  change24h: number | null;
  openInterestUsd: number;
  oiChange24hPct: number;
  oiChange4hPct: number | null;
}

export interface MarketOverviewPayload {
  updatedAt: number;
  global: GlobalMarketSummary;
  breadth: MarketBreadth24h;
  fearGreed: FearGreedOverview;
  heatmap: HeatmapAssetItem[];
  topGainers: MoverCoinItem[];
  topLosers: MoverCoinItem[];
  volumeSpikes: MoverCoinItem[];
  derivatives: {
    mostPositiveFunding: FundingExtremeItem[];
    mostNegativeFunding: FundingExtremeItem[];
    fastestOpenInterest: OpenInterestSurgeItem[];
    averageFundingPct: number | null;
  };
}

export interface TreemapRect<T> {
  item: T;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  w: number; // percentage 0..100
  h: number; // percentage 0..100
}

export interface FearGreedClassification {
  zone: FearGreedZoneKey;
  labelId: string;
  labelEn: string;
  actionId: string;
  rangeLabel: string;
  shortDescId: string;
  textColorClass: string;
  badgeBgClass: string;
  strokeHex: string;
}

export function classifyFearGreed(value: number | null | undefined): FearGreedClassification {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return {
      zone: 'NEUTRAL',
      labelId: 'Belum Tersedia',
      labelEn: 'Unavailable',
      actionId: 'Wait & See',
      rangeLabel: '—',
      shortDescId: 'Data indeks sentimen belum tersedia.',
      textColorClass: 'text-slate-400',
      badgeBgClass: 'bg-slate-800/80 border-slate-700 text-slate-300',
      strokeHex: '#94a3b8',
    };
  }

  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  if (clamped <= 25) {
    return {
      zone: 'EXTREME_FEAR',
      labelId: 'Extreme Fear',
      labelEn: 'Extreme Fear',
      actionId: 'Wait & See',
      rangeLabel: '0–25',
      shortDescId: 'Ketakutan ekstrem: pasar dalam tekanan jual berat, disarankan Wait & See atau tunggu konfirmasi sebelum bertindak.',
      textColorClass: 'text-rose-400',
      badgeBgClass: 'bg-rose-500/20 border-rose-500/45 text-rose-300',
      strokeHex: '#fb7185',
    };
  }
  if (clamped <= 45) {
    return {
      zone: 'FEAR',
      labelId: 'Fear',
      labelEn: 'Fear',
      actionId: 'DCA',
      rangeLabel: '26–45',
      shortDescId: 'Ketakutan: volatilitas tinggi dan harga terkoreksi, zona ideal untuk akumulasi bertahap (DCA).',
      textColorClass: 'text-amber-400',
      badgeBgClass: 'bg-amber-500/20 border-amber-500/45 text-amber-300',
      strokeHex: '#fbbf24',
    };
  }
  if (clamped <= 55) {
    return {
      zone: 'NEUTRAL',
      labelId: 'Neutral',
      labelEn: 'Neutral',
      actionId: 'Good Entry',
      rangeLabel: '46–55',
      shortDescId: 'Netral: sentimen seimbang dan struktur tren berkonsolidasi, peluang Good Entry pada support terkonfirmasi.',
      textColorClass: 'text-slate-200',
      badgeBgClass: 'bg-slate-700/60 border-slate-600 text-slate-200',
      strokeHex: '#e2e8f0',
    };
  }
  if (clamped <= 75) {
    return {
      zone: 'GREED',
      labelId: 'Greed',
      labelEn: 'Greed',
      actionId: 'Warning',
      rangeLabel: '56–75',
      shortDescId: 'Keserakahan: optimisme tinggi dan aksi beli agresif, berikan Warning untuk mulai pasang trailing stop.',
      textColorClass: 'text-emerald-400',
      badgeBgClass: 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300',
      strokeHex: '#34d399',
    };
  }
  return {
    zone: 'EXTREME_GREED',
    labelId: 'Ext. Greed',
    labelEn: 'Ext. Greed',
    actionId: "Don't FOMO",
    rangeLabel: '76–100',
    shortDescId: 'Keserakahan ekstrem: pasar sangat euforia, rawan koreksi tajam. Waspada dan jangan terbawa FOMO.',
    textColorClass: 'text-pink-400',
    badgeBgClass: 'bg-pink-500/20 border-pink-500/45 text-pink-300',
    strokeHex: '#f472b6',
  };
}

export interface MarketConclusionInput {
  btcChange24h: number | null;
  ethChange24h?: number | null;
  marketCapChange24hPct: number | null;
  btcDominancePct: number | null;
  advancingCount: number;
  decliningCount: number;
  fearGreedValue: number | null;
  averageFundingPct: number | null;
}

export interface MarketConclusionResult {
  regime: 'BULLISH' | 'BEARISH' | 'MIXED';
  headlineId: string;
  headlineEn: string;
  summaryId: string;
  summaryEn: string;
}

function fmtSignedId(val: number, decimals = 1): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals).replace('.', ',')}%`;
}

function fmtSignedEn(val: number, decimals = 1): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}

/**
 * Generates a clear, plain-language 2–3 sentence summary strictly from live market telemetry.
 * Designed so beginners immediately understand whether the crypto market is rising, falling, or mixed.
 */
export function generateMarketConclusion(input: MarketConclusionInput): MarketConclusionResult {
  const {
    btcChange24h,
    marketCapChange24hPct,
    btcDominancePct,
    advancingCount,
    decliningCount,
    fearGreedValue,
    averageFundingPct,
  } = input;

  const totalBreadth = Math.max(1, advancingCount + decliningCount);
  const greenRatio = advancingCount / totalBreadth;
  const primaryDelta = marketCapChange24hPct ?? btcChange24h ?? 0;

  let regime: 'BULLISH' | 'BEARISH' | 'MIXED' = 'MIXED';
  if (primaryDelta >= 0.75 && greenRatio >= 0.55) {
    regime = 'BULLISH';
  } else if (primaryDelta <= -0.75 && greenRatio <= 0.45) {
    regime = 'BEARISH';
  } else if ((btcChange24h ?? 0) >= 1.8 && greenRatio >= 0.5) {
    regime = 'BULLISH';
  } else if ((btcChange24h ?? 0) <= -1.8 && greenRatio <= 0.5) {
    regime = 'BEARISH';
  }

  const fgClass = classifyFearGreed(fearGreedValue);

  // Sentence 1: Overall direction + BTC anchor + Sentiment
  let s1Id = '';
  let s1En = '';
  const btcClauseId =
    btcChange24h !== null
      ? `BTC ${btcChange24h >= 0 ? 'naik' : 'turun'} ${fmtSignedId(btcChange24h, 2)}`
      : 'harga utama bergerak terbatas';
  const btcClauseEn =
    btcChange24h !== null
      ? `BTC is ${btcChange24h >= 0 ? 'up' : 'down'} ${fmtSignedEn(btcChange24h, 2)}`
      : 'major assets are range-bound';

  const fgClauseId =
    fearGreedValue !== null
      ? `dengan sentimen berada di zona ${fgClass.labelId} (${Math.round(fearGreedValue)}/100)`
      : 'dengan sentimen pasar cenderung hati-hati';
  const fgClauseEn =
    fearGreedValue !== null
      ? `while sentiment sits in ${fgClass.labelEn} (${Math.round(fearGreedValue)}/100)`
      : 'with cautious market sentiment';

  if (regime === 'BULLISH') {
    s1Id = `Pasar kripto sedang menguat hari ini — ${btcClauseId} ${fgClauseId}.`;
    s1En = `The crypto market is advancing today — ${btcClauseEn} ${fgClauseEn}.`;
  } else if (regime === 'BEARISH') {
    s1Id = `Pasar kripto cenderung melemah dalam 24 jam terakhir — ${btcClauseId} ${fgClauseId}.`;
    s1En = `The crypto market is pulling back over the last 24h — ${btcClauseEn} ${fgClauseEn}.`;
  } else {
    s1Id = `Pasar bergerak bervariasi (konsolidasi) hari ini — ${btcClauseId} ${fgClauseId}.`;
    s1En = `The market is trading mixed today — ${btcClauseEn} ${fgClauseEn}.`;
  }

  // Sentence 2: Altcoin breadth + BTC Dominance
  let s2Id = '';
  let s2En = '';
  const greenPct = Math.round(greenRatio * 100);
  if (greenRatio >= 0.62) {
    s2Id = `Mayoritas altcoin menghijau (${advancingCount} naik berbanding ${decliningCount} turun, atau ${greenPct}% aset menguat)`;
    s2En = `Most altcoins are in the green (${advancingCount} advancing vs ${decliningCount} declining, ${greenPct}% positive)`;
  } else if (greenRatio <= 0.38) {
    s2Id = `Mayoritas altcoin berada di zona merah (${decliningCount} turun berbanding ${advancingCount} naik)`;
    s2En = `Most altcoins are in the red (${decliningCount} declining vs ${advancingCount} advancing)`;
  } else {
    s2Id = `Kekuatan altcoin terbagi cukup merata (${advancingCount} koin naik vs ${decliningCount} koin turun)`;
    s2En = `Altcoin breadth is evenly split (${advancingCount} advancing vs ${decliningCount} declining)`;
  }

  if (btcDominancePct !== null) {
    if (btcDominancePct >= 56) {
      s2Id += `, sementara dominasi BTC yang tinggi (${btcDominancePct.toFixed(1).replace('.', ',')}%) menandakan modal masih terfokus pada Bitcoin.`;
      s2En += `, while elevated BTC dominance (${btcDominancePct.toFixed(1)}%) shows capital remains concentrated in Bitcoin.`;
    } else {
      s2Id += ` dengan dominasi BTC di level ${btcDominancePct.toFixed(1).replace('.', ',')}%.`;
      s2En += ` with BTC dominance at ${btcDominancePct.toFixed(1)}%.`;
    }
  } else {
    s2Id += '.';
    s2En += '.';
  }

  // Sentence 3: Derivatives funding positioning cue (optional concise 3rd sentence)
  let s3Id = '';
  let s3En = '';
  if (averageFundingPct !== null) {
    if (averageFundingPct > 0.02) {
      s3Id = 'Di pasar futures, rata-rata funding rate positif cukup tinggi sehingga posisi beli (long) leverage perlu mewaspadai koreksi cepat.';
      s3En = 'In futures markets, elevated positive funding indicates crowded leveraged longs.';
    } else if (averageFundingPct < -0.005) {
      s3Id = 'Rata-rata funding rate negatif menunjukkan penjual (short) mendominasi derivatif, yang kerap membuka peluang pantulan cepat (short squeeze).';
      s3En = 'Negative average funding shows aggressive short positioning, raising short-squeeze potential.';
    } else {
      s3Id = 'Biaya funding derivatif terpantau normal dan sehat tanpa kelebihan leverage ekstrem.';
      s3En = 'Derivatives funding rates remain neutral without excessive leverage buildup.';
    }
  }

  const headlineId =
    regime === 'BULLISH'
      ? 'Pasar Sedang Menguat (Bullish)'
      : regime === 'BEARISH'
      ? 'Pasar Sedang Melemah (Bearish)'
      : 'Pasar Bergerak Campuran (Sideways)';

  const headlineEn =
    regime === 'BULLISH'
      ? 'Market Advancing (Bullish)'
      : regime === 'BEARISH'
      ? 'Market Pulling Back (Bearish)'
      : 'Market Consolidating (Mixed)';

  return {
    regime,
    headlineId,
    headlineEn,
    summaryId: [s1Id, s2Id, s3Id].filter(Boolean).join(' '),
    summaryEn: [s1En, s2En, s3En].filter(Boolean).join(' '),
  };
}

/**
 * Computes a clean binary-partition proportional treemap layout in [0..100] x [0..100] percentage coordinates.
 * Guarantees every item's rectangle area is strictly proportional to its positive weight (e.g. marketCap),
 * with balanced aspect ratios across wide and tall sub-containers.
 */
export function computeProportionalTreemap<T>(
  items: T[],
  getWeight: (item: T) => number,
  aspectRatio = 2.0
): Array<TreemapRect<T>> {
  const valid = items
    .map((item) => ({
      item,
      // Damped market-cap weight preserves strict monotonic Market Cap ordering
      // (BTC biggest > ETH second > SOL/BNB/XRP > midcaps > smaller caps) while keeping boxes legible & clickable!
      rawWeight: Math.max(0, getWeight(item)),
    }))
    .filter((entry) => entry.rawWeight > 0)
    .sort((a, b) => b.rawWeight - a.rawWeight);

  if (valid.length === 0) return [];

  // Adaptive damping exponent:
  // For small lists (<= 25), 0.58 preserves strong contrast between mega-caps and mid-caps.
  // For larger lists (50–100 items), 0.46 ensures rank 50–100 tiles remain visible & interactive.
  const exponent = valid.length > 50 ? 0.46 : valid.length > 25 ? 0.52 : 0.58;

  const weighted = valid.map((v) => ({
    item: v.item,
    weight: Math.pow(v.rawWeight, exponent),
  }));

  const results: Array<TreemapRect<T>> = [];

  function partition(
    slice: Array<{ item: T; weight: number }>,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    if (slice.length === 0 || w <= 0 || h <= 0) return;
    if (slice.length === 1) {
      results.push({ item: slice[0].item, x, y, w, h });
      return;
    }

    const total = slice.reduce((acc, s) => acc + s.weight, 0);
    if (total <= 0) return;

    // Find split index closest to half of total weight (at least 1 item on left)
    let accum = 0;
    let splitIdx = 1;
    let bestDiff = Infinity;
    for (let i = 0; i < slice.length - 1; i++) {
      accum += slice[i].weight;
      const diff = Math.abs(accum - total / 2);
      if (diff < bestDiff) {
        bestDiff = diff;
        splitIdx = i + 1;
      }
    }

    const leftSlice = slice.slice(0, splitIdx);
    const rightSlice = slice.slice(splitIdx);
    const leftSum = leftSlice.reduce((acc, s) => acc + s.weight, 0);
    const ratio = leftSum / total;

    // Choose split orientation using visual width vs height (accounting for container aspectRatio)
    const effectiveWidth = w * aspectRatio;
    if (effectiveWidth >= h) {
      const leftW = w * ratio;
      partition(leftSlice, x, y, leftW, h);
      partition(rightSlice, x + leftW, y, w - leftW, h);
    } else {
      const topH = h * ratio;
      partition(leftSlice, x, y, w, topH);
      partition(rightSlice, x, y + topH, w, h - topH);
    }
  }

  partition(weighted, 0, 0, 100, 100);
  return results;
}

export interface GlossaryEntry {
  term: string;
  simpleMeaningId: string;
  howToReadId: string;
}

export const BEGINNER_GLOSSARY_ID: GlossaryEntry[] = [
  {
    term: 'Total Market Cap (Kapitalisasi Pasar)',
    simpleMeaningId:
      'Nilai gabungan dari seluruh koin kripto yang beredar di dunia (Harga koin × Jumlah koin beredar).',
    howToReadId:
      'Jika naik, berarti uang secara keseluruhan sedang masuk ke pasar kripto. Jika turun, uang sedang keluar.',
  },
  {
    term: 'Dominasi BTC (BTC Dominance)',
    simpleMeaningId:
      'Persentase porsi nilai Bitcoin dibandingkan total seluruh pasar kripto.',
    howToReadId:
      'Dominasi tinggi (>55%) berarti investor lebih memilih keamanan Bitcoin dibanding altcoin. Saat dominasi turun tapi pasar hijau, biasanya altcoin sedang reli (Altseason).',
  },
  {
    term: 'Fear & Greed Index (Ketakutan & Keserakahan)',
    simpleMeaningId:
      'Termometer emosi pasar kripto (0–100) berbasis 5 zona aksi: 0–25 Extreme Fear (Wait & See), 26–45 Fear (DCA), 46–55 Neutral (Good Entry), 56–75 Greed (Warning), dan 76–100 Ext. Greed (Don\'t FOMO).',
    howToReadId:
      'Saat Extreme Fear (0–25), prioritaskan Wait & See. Saat Fear (26–45), akumulasi bertahap (DCA). Di Neutral (46–55), manfaatkan Good Entry. Di Greed (56–75), perhatikan Warning/trailing stop. Di Ext. Greed (76–100), disiplin Don\'t FOMO.',
  },
  {
    term: 'Breadth Pasar 24 Jam',
    simpleMeaningId:
      'Jumlah koin yang harganya naik dibandingkan jumlah koin yang turun dalam 24 jam terakhir.',
    howToReadId:
      'Membantu melihat apakah kenaikan pasar merata di banyak koin atau hanya didorong oleh segelintir koin besar saja.',
  },
  {
    term: 'Volume Spike (Lonjakan Volume)',
    simpleMeaningId:
      'Koin yang nilai perputaran transaksinya hari ini sangat besar dibanding ukuran kapitalisasi pasarnya.',
    howToReadId:
      'Menandakan adanya minat mendadak dari trader besar atau berita penting pada koin tersebut.',
  },
  {
    term: 'Funding Rate (Biaya Pendanaan Futures)',
    simpleMeaningId:
      'Biaya berkala antar trader posisi Beli (Long) dan Jual (Short) di kontrak berjangka perpetual.',
    howToReadId:
      'Funding positif (+) berarti mayoritas trader pasang Long; funding negatif (-) berarti mayoritas pasang Short (sering memicu pantulan naik / short squeeze jika terlalu ekstrem).',
  },
  {
    term: 'Open Interest (OI)',
    simpleMeaningId:
      'Total nilai kontrak futures aktif yang masih terbuka dan belum ditutup.',
    howToReadId:
      'Jika OI naik cepat bersamaan dengan harga naik, berarti uang baru benar-benar masuk mendukung tren tersebut.',
  },
];
