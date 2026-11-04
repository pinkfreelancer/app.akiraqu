import { OHLCVCandle, MarketBias, Timeframe } from '../../src/types/crypto.types';
import { SUPPORTED_SYMBOLS } from '../../src/services/marketData';
import { normalizeSymbol } from '../../src/services/marketDataValidator';
import {
  computeMtfConfluence,
  evaluateMtfTimeframeSignal,
  MTF_TIMEFRAME_KEYS,
  MtfActionSignal,
  MtfScreenerRowModel,
  MtfTimeframeKey,
  mtfCellToActionSignal,
} from '../../src/services/confluence/mtfScreenerLogic';
import { MtfCellSignal } from '../../src/services/confluence/signalConsensus';

const TARGET_UNIVERSE_COUNT = 240; // >= 200 USDT-M perpetual coins by 24h quote volume
const KLINE_CANDLE_LIMIT = 150; // Identical 150-candle window to Main Chart (/api/v1/analyze)

// Timeframe-appropriate cache TTLs (Requirement #2)
export const MTF_TIMEFRAME_TTL_MS: Record<MtfTimeframeKey, number> = {
  '1m': 30_000, // 30 seconds
  '5m': 75_000, // 1.25 minutes
  '15m': 150_000, // 2.5 minutes
  '1H': 300_000, // 5 minutes
  '4H': 600_000, // 10 minutes
  '1D': 900_000, // 15 minutes
};

const EXCHANGE_INFO_TTL_MS = 15 * 60_000; // 15 min
const TICKER_METADATA_TTL_MS = 12_000; // 12 sec
const PREMIUM_INDEX_TTL_MS = 30_000; // 30 sec
const MARKET_CAP_TTL_MS = 15 * 60_000; // 15 min
const SPOT_SYMBOLS_TTL_MS = 15 * 60_000; // 15 min

// Binance Futures default IP limit is 2,400 weight/min. Keep strict budget <= 1,450 weight/min.
const SAFE_WEIGHT_BUDGET_PER_MIN = 1450;
const KLINE_REQUEST_WEIGHT = 2; // limit=150 on fapi/v1/klines costs weight 2

interface UniverseCoinMeta {
  rawSymbol: string; // e.g. "BTCUSDT"
  symbol: string; // e.g. "BTC/USDT"
  baseAsset: string; // e.g. "BTC"
  name: string;
  price: number;
  change24h: number | null;
  volume24h: number | null;
  fundingRate: number | null; // percentage units e.g. 0.01 => +0.0100%
  nextFundingTime: number | null;
  marketCap: number | null;
  spotAvailable: boolean;
  sourceExchange: 'BINANCE_FUTURES' | 'BYBIT_LINEAR';
  updatedAt: number;
}

interface CachedTimeframeEntry {
  signal: MtfActionSignal;
  score: number;
  marketBias: MarketBias;
  rsi14: number;
  ema20: number;
  ema50: number;
  closePrice: number;
  updatedAt: number;
  expiresAt: number;
  error?: string | null;
}

const KNOWN_ASSET_NAMES: Record<string, string> = Object.fromEntries(
  SUPPORTED_SYMBOLS.map((s) => [s.symbol.split('/')[0].toUpperCase(), s.name])
);

function normalizeCoinGeckoLookupKey(baseAsset: string): string {
  const upper = baseAsset.toUpperCase();
  if (upper.startsWith('1000000')) return upper.slice(7);
  if (upper.startsWith('1000')) return upper.slice(4);
  if (upper === '1MBABYDOGE') return 'BABYDOGE';
  return upper;
}

class MtfScreenerEngine {
  private started = false;
  private universe: UniverseCoinMeta[] = [];
  private universeMap = new Map<string, UniverseCoinMeta>();
  private lastUniverseRefreshAt = 0;
  private universeRefreshPromise: Promise<void> | null = null;

  // Cached auxiliary catalogs
  private validPerpRawSymbols = new Set<string>();
  private lastExchangeInfoAt = 0;

  private fundingMap = new Map<string, { ratePct: number; nextFundingTime: number | null }>();
  private lastFundingAt = 0;

  private marketCapMap = new Map<string, number>();
  private lastMarketCapAt = 0;

  private spotRawSymbolSet = new Set<string>();
  private lastSpotCheckAt = 0;

  // Per-(symbol, tf) signal cache
  private tfCache = new Map<string, CachedTimeframeEntry>();
  // Per-symbol non-fatal error tracker
  private rowErrors = new Map<string, string>();
  // Priority symbols requested by active user view/search
  private prioritySymbols = new Set<string>();

  // Rate-limit & scheduler telemetry
  private exchangeReportedWeight1m = 0;
  private localWeightWindow: Array<{ ts: number; weight: number }> = [];
  private backoffUntil = 0;
  private rateLimitHits = 0;
  private workerTimer: NodeJS.Timeout | null = null;
  private workerBusy = false;
  private lastForceRefreshAt = 0;

  public start(): void {
    if (this.started) return;
    this.started = true;

    // Kick off non-blocking initial universe discovery + priority hydration
    void this.refreshUniverseMetadata(false).then(() => {
      void this.runSchedulerTick();
    });

    this.workerTimer = setInterval(() => {
      void this.runSchedulerTick();
    }, 650);
  }

  public stop(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
    }
    this.started = false;
  }

  private recordWeight(weight: number, responseHeaders?: Headers): void {
    const now = Date.now();
    this.localWeightWindow.push({ ts: now, weight });
    const cutoff = now - 60_000;
    while (this.localWeightWindow.length > 0 && this.localWeightWindow[0].ts < cutoff) {
      this.localWeightWindow.shift();
    }

    if (responseHeaders) {
      const headerVal =
        responseHeaders.get('x-mbx-used-weight-1m') ||
        responseHeaders.get('x-mbx-used-weight');
      if (headerVal) {
        const parsed = parseInt(headerVal, 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
          this.exchangeReportedWeight1m = parsed;
        }
      }
    }
  }

  private getEffectiveWeight1m(): number {
    const now = Date.now();
    const cutoff = now - 60_000;
    let localSum = 0;
    for (const item of this.localWeightWindow) {
      if (item.ts >= cutoff) localSum += item.weight;
    }
    return Math.max(localSum, this.exchangeReportedWeight1m);
  }

  private registerRateLimitBackoff(status: number, retryAfterSec?: number): void {
    this.rateLimitHits++;
    const baseDelayMs = retryAfterSec
      ? retryAfterSec * 1000
      : status === 418
      ? 60_000
      : Math.min(45_000, 4000 * Math.pow(2, Math.min(4, this.rateLimitHits)));
    const jitter = Math.round(baseDelayMs * (0.85 + Math.random() * 0.3));
    this.backoffUntil = Math.max(this.backoffUntil, Date.now() + jitter);
    console.warn(`[MtfScreenerEngine] Exchange HTTP ${status}; backing off for ${jitter}ms`);
  }

  private getCacheKey(symbol: string, tf: MtfTimeframeKey): string {
    return `${symbol}::${tf}`;
  }

  /**
   * Synchronizes a freshly computed evaluation from Main Chart (/api/v1/analyze)
   * directly into the MTF Screener per-timeframe cache so both views match 100%.
   */
  public syncSignalFromAnalysis(
    rawSymbol: string,
    timeframe: Timeframe,
    consensus: {
      score: number;
      marketBias: MarketBias;
      mtfSignal: MtfCellSignal;
      rsi14: number;
      closePrice: number;
      ema20?: number;
      ema50?: number;
    }
  ): void {
    if (!MTF_TIMEFRAME_KEYS.includes(timeframe as MtfTimeframeKey)) return;
    const tf = timeframe as MtfTimeframeKey;
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return;

    const now = Date.now();
    this.tfCache.set(this.getCacheKey(symbol, tf), {
      signal: mtfCellToActionSignal(consensus.mtfSignal),
      score: consensus.score,
      marketBias: consensus.marketBias,
      rsi14: consensus.rsi14,
      ema20: consensus.ema20 ?? consensus.closePrice,
      ema50: consensus.ema50 ?? consensus.closePrice,
      closePrice: consensus.closePrice,
      updatedAt: now,
      expiresAt: now + MTF_TIMEFRAME_TTL_MS[tf],
      error: null,
    });
  }

  public prioritizeSymbols(symbols: string[]): void {
    for (const raw of symbols.slice(0, 60)) {
      const norm = normalizeSymbol(raw);
      if (norm) this.prioritySymbols.add(norm);
    }
    if (this.prioritySymbols.size > 120) {
      const arr = Array.from(this.prioritySymbols).slice(-80);
      this.prioritySymbols = new Set(arr);
    }
  }

  private async refreshAuxiliaryCatalogs(now: number): Promise<void> {
    const tasks: Array<Promise<void>> = [];

    // 1. Binance Futures USDT-M active TRADING PERPETUAL list
    if (
      this.validPerpRawSymbols.size === 0 ||
      now - this.lastExchangeInfoAt > EXCHANGE_INFO_TTL_MS
    ) {
      tasks.push(
        (async () => {
          try {
            const res = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo', {
              signal: AbortSignal.timeout(5000),
            });
            this.recordWeight(1, res.headers);
            if (res.ok) {
              const json = await res.json();
              if (Array.isArray(json?.symbols)) {
                const nextSet = new Set<string>();
                for (const s of json.symbols) {
                  if (
                    s.contractType === 'PERPETUAL' &&
                    s.quoteAsset === 'USDT' &&
                    s.status === 'TRADING' &&
                    /^[A-Z0-9]{2,20}USDT$/.test(s.symbol)
                  ) {
                    nextSet.add(s.symbol);
                  }
                }
                if (nextSet.size >= 100) {
                  this.validPerpRawSymbols = nextSet;
                  this.lastExchangeInfoAt = now;
                }
              }
            }
          } catch {
            // Retain existing set or fall back dynamically
          }
        })()
      );
    }

    // 2. Binance Futures Funding Rates (premiumIndex)
    if (this.fundingMap.size === 0 || now - this.lastFundingAt > PREMIUM_INDEX_TTL_MS) {
      tasks.push(
        (async () => {
          try {
            const res = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex', {
              signal: AbortSignal.timeout(4500),
            });
            this.recordWeight(10, res.headers);
            if (res.ok) {
              const arr = await res.json();
              if (Array.isArray(arr)) {
                const nextMap = new Map<
                  string,
                  { ratePct: number; nextFundingTime: number | null }
                >();
                for (const item of arr) {
                  if (!item?.symbol) continue;
                  const rateNum = parseFloat(item.lastFundingRate);
                  if (Number.isFinite(rateNum)) {
                    nextMap.set(item.symbol, {
                      ratePct: Number((rateNum * 100).toFixed(4)),
                      nextFundingTime: Number(item.nextFundingTime) || null,
                    });
                  }
                }
                if (nextMap.size > 0) {
                  this.fundingMap = nextMap;
                  this.lastFundingAt = now;
                }
              }
            }
          } catch {
            // Keep existing funding map
          }
        })()
      );
    }

    // 3. Binance Spot symbol availability (non-blocking enrichment so UI knows if Spot also exists)
    if (this.spotRawSymbolSet.size === 0 || now - this.lastSpotCheckAt > SPOT_SYMBOLS_TTL_MS) {
      tasks.push(
        (async () => {
          try {
            const res = await fetch(
              'https://data-api.binance.vision/api/v3/ticker/price',
              { signal: AbortSignal.timeout(4500) }
            );
            if (res.ok) {
              const arr = await res.json();
              if (Array.isArray(arr)) {
                const nextSpot = new Set<string>();
                for (const item of arr) {
                  if (typeof item?.symbol === 'string' && item.symbol.endsWith('USDT')) {
                    nextSpot.add(item.symbol);
                  }
                }
                if (nextSpot.size > 50) {
                  this.spotRawSymbolSet = nextSpot;
                  this.lastSpotCheckAt = now;
                }
              }
            }
          } catch {
            // Optional metadata
          }
        })()
      );
    }

    // 4. CoinGecko top 250 market caps (cached 15m to respect public tier limits)
    if (this.marketCapMap.size === 0 || now - this.lastMarketCapAt > MARKET_CAP_TTL_MS) {
      tasks.push(
        (async () => {
          try {
            const res = await fetch(
              'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false',
              { signal: AbortSignal.timeout(4500) }
            );
            if (res.ok) {
              const arr = await res.json();
              if (Array.isArray(arr)) {
                const nextMcap = new Map<string, number>();
                for (const coin of arr) {
                  const sym = String(coin?.symbol || '').toUpperCase();
                  const mcap = Number(coin?.market_cap);
                  if (sym && Number.isFinite(mcap) && mcap > 0 && !nextMcap.has(sym)) {
                    nextMcap.set(sym, mcap);
                  }
                }
                if (nextMcap.size > 0) {
                  this.marketCapMap = nextMcap;
                  this.lastMarketCapAt = now;
                }
              }
            }
          } catch {
            // Market cap is optional per Requirement #4 ("market cap min/max (jika tersedia)")
          }
        })()
      );
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  }

  public async refreshUniverseMetadata(force = false): Promise<void> {
    const now = Date.now();
    if (
      !force &&
      this.universe.length >= 200 &&
      now - this.lastUniverseRefreshAt < TICKER_METADATA_TTL_MS
    ) {
      return;
    }

    if (this.universeRefreshPromise) {
      return this.universeRefreshPromise;
    }

    this.universeRefreshPromise = (async () => {
      try {
        await this.refreshAuxiliaryCatalogs(now);

        // Primary: Binance Futures USDT-M 24hr tickers
        let loadedFromBinance = false;
        if (Date.now() >= this.backoffUntil) {
          try {
            const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', {
              signal: AbortSignal.timeout(5000),
            });
            this.recordWeight(40, res.headers);

            if (res.status === 429 || res.status === 418) {
              const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10);
              this.registerRateLimitBackoff(res.status, retryAfter || undefined);
            } else if (res.ok) {
              const tickers = await res.json();
              if (Array.isArray(tickers) && tickers.length > 0) {
                const filtered = tickers.filter((t: any) => {
                  const rawSym = String(t?.symbol || '');
                  if (!/^[A-Z0-9]{2,20}USDT$/.test(rawSym)) return false;
                  if (
                    this.validPerpRawSymbols.size > 0 &&
                    !this.validPerpRawSymbols.has(rawSym)
                  ) {
                    return false;
                  }
                  const price = parseFloat(t.lastPrice);
                  const qVol = parseFloat(t.quoteVolume);
                  return Number.isFinite(price) && price > 0 && Number.isFinite(qVol) && qVol > 0;
                });

                filtered.sort(
                  (a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
                );

                const topSlice = filtered.slice(0, TARGET_UNIVERSE_COUNT);
                if (topSlice.length >= 200) {
                  const ts = Date.now();
                  const nextUniverse: UniverseCoinMeta[] = topSlice.map((t: any) => {
                    const rawSymbol = String(t.symbol);
                    const baseAsset = rawSymbol.slice(0, -4);
                    const symbol = `${baseAsset}/USDT`;
                    const funding = this.fundingMap.get(rawSymbol);
                    const cgKey = normalizeCoinGeckoLookupKey(baseAsset);
                    const mcap = this.marketCapMap.get(cgKey) ?? null;

                    return {
                      rawSymbol,
                      symbol,
                      baseAsset,
                      name: KNOWN_ASSET_NAMES[baseAsset] || baseAsset,
                      price: parseFloat(t.lastPrice),
                      change24h: Number.isFinite(parseFloat(t.priceChangePercent))
                        ? Number(parseFloat(t.priceChangePercent).toFixed(2))
                        : null,
                      volume24h: Number.isFinite(parseFloat(t.quoteVolume))
                        ? parseFloat(t.quoteVolume)
                        : null,
                      fundingRate: funding ? funding.ratePct : null,
                      nextFundingTime: funding ? funding.nextFundingTime : null,
                      marketCap: mcap,
                      spotAvailable:
                        this.spotRawSymbolSet.size > 0
                          ? this.spotRawSymbolSet.has(rawSymbol)
                          : true,
                      sourceExchange: 'BINANCE_FUTURES',
                      updatedAt: ts,
                    };
                  });

                  this.universe = nextUniverse;
                  this.universeMap = new Map(nextUniverse.map((u) => [u.symbol, u]));
                  this.lastUniverseRefreshAt = ts;
                  loadedFromBinance = true;
                }
              }
            }
          } catch {
            // Fall through to Bybit USDT Linear backup if Binance Futures unreachable
          }
        }

        // Fallback: Bybit Linear USDT Perpetual (also >350 coins with live 24h volume & fundingRate)
        if (!loadedFromBinance && this.universe.length < 200) {
          try {
            const res = await fetch(
              'https://api.bybit.com/v5/market/tickers?category=linear',
              { signal: AbortSignal.timeout(5000) }
            );
            if (res.ok) {
              const json = await res.json();
              const list: any[] = json?.result?.list || [];
              const usdtPerps = list.filter((item) => {
                const rawSym = String(item?.symbol || '');
                if (!/^[A-Z0-9]{2,20}USDT$/.test(rawSym)) return false;
                const price = parseFloat(item.lastPrice);
                const turnover = parseFloat(item.turnover24h);
                return (
                  Number.isFinite(price) &&
                  price > 0 &&
                  Number.isFinite(turnover) &&
                  turnover > 0
                );
              });

              usdtPerps.sort(
                (a, b) => parseFloat(b.turnover24h) - parseFloat(a.turnover24h)
              );

              const topSlice = usdtPerps.slice(0, TARGET_UNIVERSE_COUNT);
              if (topSlice.length >= 200) {
                const ts = Date.now();
                const nextUniverse: UniverseCoinMeta[] = topSlice.map((t) => {
                  const rawSymbol = String(t.symbol);
                  const baseAsset = rawSymbol.slice(0, -4);
                  const symbol = `${baseAsset}/USDT`;
                  const rawFunding = parseFloat(t.fundingRate);
                  const cgKey = normalizeCoinGeckoLookupKey(baseAsset);

                  return {
                    rawSymbol,
                    symbol,
                    baseAsset,
                    name: KNOWN_ASSET_NAMES[baseAsset] || baseAsset,
                    price: parseFloat(t.lastPrice),
                    change24h: Number.isFinite(parseFloat(t.price24hPcnt))
                      ? Number((parseFloat(t.price24hPcnt) * 100).toFixed(2))
                      : null,
                    volume24h: parseFloat(t.turnover24h),
                    fundingRate: Number.isFinite(rawFunding)
                      ? Number((rawFunding * 100).toFixed(4))
                      : null,
                    nextFundingTime: Number(t.nextFundingTimestamp) || null,
                    marketCap: this.marketCapMap.get(cgKey) ?? null,
                    spotAvailable: this.spotRawSymbolSet.has(rawSymbol),
                    sourceExchange: 'BYBIT_LINEAR',
                    updatedAt: ts,
                  };
                });

                this.universe = nextUniverse;
                this.universeMap = new Map(nextUniverse.map((u) => [u.symbol, u]));
                this.lastUniverseRefreshAt = ts;
              }
            }
          } catch (err: any) {
            console.warn('[MtfScreenerEngine] Backup universe fetch failed:', err?.message);
          }
        }
      } finally {
        this.universeRefreshPromise = null;
      }
    })();

    return this.universeRefreshPromise;
  }

  private async fetchFuturesCandles(
    coin: UniverseCoinMeta,
    tf: MtfTimeframeKey
  ): Promise<OHLCVCandle[]> {
    const binanceIntervalMap: Record<MtfTimeframeKey, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1H': '1h',
      '4H': '4h',
      '1D': '1d',
    };

    if (coin.sourceExchange === 'BINANCE_FUTURES' && Date.now() >= this.backoffUntil) {
      const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${coin.rawSymbol}&interval=${binanceIntervalMap[tf]}&limit=${KLINE_CANDLE_LIMIT}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
      this.recordWeight(KLINE_REQUEST_WEIGHT, res.headers);

      if (res.status === 429 || res.status === 418) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10);
        this.registerRateLimitBackoff(res.status, retryAfter || undefined);
        throw new Error(`HTTP ${res.status} rate limit`);
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length >= 20) {
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
    }

    // Resilient fallback: Bybit Linear kline if fapi kline failed or in backoff
    const bybitIntervalMap: Record<MtfTimeframeKey, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '1H': '60',
      '4H': '240',
      '1D': 'D',
    };
    const bybitUrl = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${coin.rawSymbol}&interval=${bybitIntervalMap[tf]}&limit=${KLINE_CANDLE_LIMIT}`;
    const bRes = await fetch(bybitUrl, { signal: AbortSignal.timeout(4500) });
    if (bRes.ok) {
      const bJson = await bRes.json();
      const list: any[] = bJson?.result?.list;
      if (Array.isArray(list) && list.length >= 20) {
        // Bybit returns newest-first; reverse to chronological oldest-first
        return [...list].reverse().map((k: any[]) => ({
          time: Number(k[0]),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          quoteVolume: k[6] ? parseFloat(k[6]) : undefined,
          isSimulated: false,
        }));
      }
    }

    throw new Error(`Insufficient candles for ${coin.symbol} (${tf})`);
  }

  private async evaluateSingleCell(coin: UniverseCoinMeta, tf: MtfTimeframeKey): Promise<void> {
    const key = this.getCacheKey(coin.symbol, tf);
    const now = Date.now();
    try {
      const candles = await this.fetchFuturesCandles(coin, tf);
      const evaluated = evaluateMtfTimeframeSignal(candles);
      if (!evaluated) {
        throw new Error('Insufficient candle history (<20)');
      }

      this.tfCache.set(key, {
        signal: evaluated.signal,
        score: evaluated.score,
        marketBias: evaluated.marketBias,
        rsi14: evaluated.rsi14,
        ema20: evaluated.ema20,
        ema50: evaluated.ema50,
        closePrice: evaluated.closePrice,
        updatedAt: now,
        expiresAt: now + MTF_TIMEFRAME_TTL_MS[tf],
        error: null,
      });
      this.rowErrors.delete(coin.symbol);
    } catch (err: any) {
      const existing = this.tfCache.get(key);
      if (existing) {
        // Extend stale entry briefly so transient network hiccup doesn't wipe table or spam retries
        this.tfCache.set(key, {
          ...existing,
          expiresAt: now + 20_000,
          error: err?.message || 'Fetch error',
        });
      } else {
        this.rowErrors.set(coin.symbol, err?.message || 'Gagal memuat sebagian candle');
      }
    }
  }

  /**
   * Background rate-limit-aware scheduler tick.
   * Prioritizes:
   *  1. User-prioritized symbols (search / active page) with missing TFs
   *  2. Top-55 volume coins (Page 1) with missing TFs
   *  3. Remaining coins (56..240) with missing TFs
   *  4. Expired TFs ordered by priority & volume
   */
  private async runSchedulerTick(): Promise<void> {
    if (this.workerBusy) return;
    const now = Date.now();
    if (now < this.backoffUntil) return;

    this.workerBusy = true;
    try {
      // Refresh ticker/funding universe periodically
      if (
        this.universe.length === 0 ||
        now - this.lastUniverseRefreshAt >= TICKER_METADATA_TTL_MS
      ) {
        await this.refreshUniverseMetadata(false);
      }

      if (this.universe.length === 0) return;

      const effectiveWeight = this.getEffectiveWeight1m();
      if (effectiveWeight >= SAFE_WEIGHT_BUDGET_PER_MIN) {
        // Respect rate-limit ceiling strictly
        return;
      }

      interface WorkTask {
        coin: UniverseCoinMeta;
        tf: MtfTimeframeKey;
        priority: number;
      }

      const tasks: WorkTask[] = [];

      for (let idx = 0; idx < this.universe.length; idx++) {
        const coin = this.universe[idx];
        const isUserPriority = this.prioritySymbols.has(coin.symbol);
        const isPageOne = idx < 55;

        for (const tf of MTF_TIMEFRAME_KEYS) {
          const entry = this.tfCache.get(this.getCacheKey(coin.symbol, tf));
          if (!entry) {
            // Cold/missing cell — highest priority
            const basePrio = isUserPriority ? 1000 : isPageOne ? 800 : 500;
            // Hydrate 1H, 4H, 1D first so RSI(14) & swing TFs appear immediately
            const tfBonus = tf === '1H' ? 30 : tf === '4H' ? 25 : tf === '1D' ? 20 : 10;
            tasks.push({ coin, tf, priority: basePrio + tfBonus - idx * 0.5 });
          } else if (now >= entry.expiresAt) {
            // Expired cell — refresh only if within comfortable weight budget
            if (effectiveWeight > SAFE_WEIGHT_BUDGET_PER_MIN * 0.8 && !isUserPriority && !isPageOne) {
              continue;
            }
            const basePrio = isUserPriority ? 400 : isPageOne ? 250 : 100;
            tasks.push({ coin, tf, priority: basePrio - idx * 0.2 });
          }
        }
      }

      if (tasks.length === 0) return;

      tasks.sort((a, b) => b.priority - a.priority);

      // During initial cold hydration (when Page 1 isn't hydrated yet), run batch of 10;
      // Steady-state runs gentle batch of 6 every 650ms (~9 req/s = ~1,080 weight/min peak, ~500 avg).
      const hydratedPageOneCount = this.universe.slice(0, 50).filter((c) =>
        MTF_TIMEFRAME_KEYS.every((tf) => this.tfCache.has(this.getCacheKey(c.symbol, tf)))
      ).length;

      const remainingWeightAllowance = Math.max(
        0,
        Math.floor((SAFE_WEIGHT_BUDGET_PER_MIN - effectiveWeight) / KLINE_REQUEST_WEIGHT)
      );
      const desiredBatchSize = hydratedPageOneCount < 50 ? 12 : 6;
      const batchSize = Math.min(tasks.length, desiredBatchSize, remainingWeightAllowance);

      if (batchSize <= 0) return;

      const selectedBatch = tasks.slice(0, batchSize);
      await Promise.allSettled(
        selectedBatch.map((item) => this.evaluateSingleCell(item.coin, item.tf))
      );

      // Drain priority set for fully hydrated symbols
      for (const sym of Array.from(this.prioritySymbols)) {
        const allDone = MTF_TIMEFRAME_KEYS.every((tf) => {
          const e = this.tfCache.get(this.getCacheKey(sym, tf));
          return e && Date.now() < e.expiresAt;
        });
        if (allDone) this.prioritySymbols.delete(sym);
      }
    } finally {
      this.workerBusy = false;
    }
  }

  public async triggerSafeManualRefresh(prioritySymbols?: string[]): Promise<void> {
    const now = Date.now();
    if (prioritySymbols && prioritySymbols.length > 0) {
      this.prioritizeSymbols(prioritySymbols);
    }
    // Enforce 8-second minimum cooldown on forced metadata refresh so spamming button cannot trip 429
    if (now - this.lastForceRefreshAt >= 8_000) {
      this.lastForceRefreshAt = now;
      await this.refreshUniverseMetadata(true);
    }
    void this.runSchedulerTick();
  }

  public async getSnapshot(options?: {
    prioritySymbols?: string[];
    subsetSymbols?: string[];
    force?: boolean;
  }): Promise<{
    rows: MtfScreenerRowModel[];
    totalCoins: number;
    fullyHydratedCoins: number;
    partiallyHydratedCoins: number;
    hydrationPct: number;
    updatedAt: number;
    sourceExchange: string;
    ttlConfigMs: Record<MtfTimeframeKey, number>;
    rateLimitTelemetry: {
      usedWeight1m: number;
      budgetWeight1m: number;
      isBackingOff: boolean;
      rateLimitHits: number;
    };
  }> {
    this.start();

    if (options?.prioritySymbols?.length) {
      this.prioritizeSymbols(options.prioritySymbols);
    }

    if (options?.force) {
      await this.triggerSafeManualRefresh(options.prioritySymbols);
    } else if (this.universe.length === 0) {
      await this.refreshUniverseMetadata(false);
    }

    let sourceList = this.universe;
    if (options?.subsetSymbols && options.subsetSymbols.length > 0) {
      const wanted = new Set(options.subsetSymbols.map((s) => normalizeSymbol(s)).filter(Boolean));
      sourceList = this.universe.filter((c) => wanted.has(c.symbol));
    }

    let fullyHydratedCoins = 0;
    let partiallyHydratedCoins = 0;

    const rows: MtfScreenerRowModel[] = sourceList.map((coin) => {
      const signals: Record<MtfTimeframeKey, MtfActionSignal | null> = {
        '1m': null,
        '5m': null,
        '15m': null,
        '1H': null,
        '4H': null,
        '1D': null,
      };
      const tfScores: Partial<Record<MtfTimeframeKey, number>> = {};
      const tfUpdatedAt: Partial<Record<MtfTimeframeKey, number>> = {};

      let latestTfUpdate = 0;
      for (const tf of MTF_TIMEFRAME_KEYS) {
        const cached = this.tfCache.get(this.getCacheKey(coin.symbol, tf));
        if (cached) {
          signals[tf] = cached.signal;
          tfScores[tf] = cached.score;
          tfUpdatedAt[tf] = cached.updatedAt;
          if (cached.updatedAt > latestTfUpdate) latestTfUpdate = cached.updatedAt;
        }
      }

      // Anchor RSI(14) from 1H (standard intraday anchor) or 4H/15m fallback if 1H still hydrating
      const anchorEntry =
        this.tfCache.get(this.getCacheKey(coin.symbol, '1H')) ||
        this.tfCache.get(this.getCacheKey(coin.symbol, '4H')) ||
        this.tfCache.get(this.getCacheKey(coin.symbol, '15m')) ||
        null;

      const confluence = computeMtfConfluence(signals);
      if (confluence.evaluatedCount === MTF_TIMEFRAME_KEYS.length) {
        fullyHydratedCoins++;
      } else if (confluence.evaluatedCount > 0) {
        partiallyHydratedCoins++;
      }

      return {
        symbol: coin.symbol,
        baseAsset: coin.baseAsset,
        name: coin.name,
        price: coin.price,
        change24h: coin.change24h,
        volume24h: coin.volume24h,
        marketCap: coin.marketCap,
        rsi14: anchorEntry ? Number(anchorEntry.rsi14.toFixed(1)) : null,
        fundingRate: coin.fundingRate,
        nextFundingTime: coin.nextFundingTime,
        spotAvailable: coin.spotAvailable,
        signals,
        tfScores,
        tfUpdatedAt,
        confluence,
        hydratedCount: confluence.evaluatedCount,
        rowError:
          confluence.evaluatedCount === 0 ? this.rowErrors.get(coin.symbol) || null : null,
        updatedAt: Math.max(coin.updatedAt, latestTfUpdate) || Date.now(),
      };
    });

    const totalCells = Math.max(1, sourceList.length * MTF_TIMEFRAME_KEYS.length);
    const hydratedCells = rows.reduce((sum, r) => sum + r.hydratedCount, 0);
    const hydrationPct = Math.min(100, Math.round((hydratedCells / totalCells) * 100));

    return {
      rows,
      totalCoins: rows.length,
      fullyHydratedCoins,
      partiallyHydratedCoins,
      hydrationPct,
      updatedAt: this.lastUniverseRefreshAt || Date.now(),
      sourceExchange: this.universe[0]?.sourceExchange || 'BINANCE_FUTURES',
      ttlConfigMs: MTF_TIMEFRAME_TTL_MS,
      rateLimitTelemetry: {
        usedWeight1m: this.getEffectiveWeight1m(),
        budgetWeight1m: SAFE_WEIGHT_BUDGET_PER_MIN,
        isBackingOff: Date.now() < this.backoffUntil,
        rateLimitHits: this.rateLimitHits,
      },
    };
  }
}

export const mtfScreenerEngine = new MtfScreenerEngine();
