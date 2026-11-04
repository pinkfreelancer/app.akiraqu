import { isStablecoinPair } from '../../src/services/confluence/mtfScreenerLogic';
import {
  FearGreedOverview,
  FundingExtremeItem,
  GlobalMarketSummary,
  HeatmapAssetItem,
  MarketBreadth24h,
  MarketOverviewPayload,
  MoverCoinItem,
  OpenInterestSurgeItem,
} from '../../src/services/marketOverviewLogic';
import { mtfScreenerEngine } from './mtfScreenerEngine';

const GLOBAL_CACHE_TTL_MS = 60_000; // 1 min
const FNG_CACHE_TTL_MS = 10 * 60_000; // 10 min
const HEATMAP_CG_TTL_MS = 75_000; // 75 sec
const OI_SURGE_TTL_MS = 2 * 60_000; // 2 min

// Exclude wrapped/pegged tokens from Heatmap & Movers so beginners see genuine crypto assets
const EXCLUDED_HEATMAP_SYMBOLS = new Set([
  'USDT',
  'USDC',
  'DAI',
  'FDUSD',
  'TUSD',
  'USDE',
  'USDS',
  'PYUSD',
  'WBTC',
  'WETH',
  'STETH',
  'WSTETH',
  'WEETH',
  'CBBTC',
  'BUSD',
  'USD1',
]);

// High-activity USDT-M perpetual contracts scanned for real 24h Open Interest % growth
const OI_SCAN_RAW_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'SUIUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'NEARUSDT',
  'LTCUSDT',
  'AAVEUSDT',
  'UNIUSDT',
  'ARBUSDT',
  'OPUSDT',
  'INJUSDT',
  'TIAUSDT',
  'APTUSDT',
  'ONDOUSDT',
  'RENDERUSDT',
  'FETUSDT',
  'WIFUSDT',
  'ZECUSDT',
];

class MarketOverviewService {
  private globalCache: GlobalMarketSummary = {
    totalMarketCapUsd: null,
    marketCapChange24hPct: null,
    totalVolume24hUsd: null,
    btcDominancePct: null,
    ethDominancePct: null,
    updatedAt: null,
  };
  private lastGlobalFetchAt = 0;

  private fngCache: FearGreedOverview = {
    current: null,
    yesterday: null,
    lastWeek: null,
    lastMonth: null,
    history30d: [],
    updatedAt: null,
  };
  private lastFngFetchAt = 0;

  private cgHeatmapMap = new Map<
    string,
    {
      name: string;
      marketCap: number;
      change1h: number | null;
      change24h: number | null;
      change7d: number | null;
    }
  >();
  private lastHeatmapCgFetchAt = 0;

  private oiGrowthMap = new Map<
    string,
    {
      openInterestUsd: number;
      oiChange24hPct: number;
      oiChange4hPct: number | null;
    }
  >();
  private lastOiFetchAt = 0;
  private oiRefreshPromise: Promise<void> | null = null;

  public warmUp(): void {
    void this.refreshExternalCaches(false);
    void this.refreshOpenInterestChanges(false);
  }

  private async refreshGlobalSummary(now: number, force: boolean): Promise<void> {
    if (
      !force &&
      this.globalCache.totalMarketCapUsd !== null &&
      now - this.lastGlobalFetchAt < GLOBAL_CACHE_TTL_MS
    ) {
      return;
    }

    try {
      const res = await fetch('https://api.coingecko.com/api/v3/global', {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const json = await res.json();
        const d = json?.data;
        if (d) {
          const mcap = Number(d.total_market_cap?.usd);
          const vol = Number(d.total_volume?.usd);
          const chg = Number(d.market_cap_change_percentage_24h_usd);
          const btcD = Number(d.market_cap_percentage?.btc);
          const ethD = Number(d.market_cap_percentage?.eth);

          this.globalCache = {
            totalMarketCapUsd: Number.isFinite(mcap) && mcap > 0 ? mcap : this.globalCache.totalMarketCapUsd,
            marketCapChange24hPct: Number.isFinite(chg) ? Number(chg.toFixed(2)) : this.globalCache.marketCapChange24hPct,
            totalVolume24hUsd: Number.isFinite(vol) && vol > 0 ? vol : this.globalCache.totalVolume24hUsd,
            btcDominancePct: Number.isFinite(btcD) && btcD > 0 ? Number(btcD.toFixed(2)) : this.globalCache.btcDominancePct,
            ethDominancePct: Number.isFinite(ethD) && ethD > 0 ? Number(ethD.toFixed(2)) : this.globalCache.ethDominancePct,
            updatedAt: Date.now(),
          };
          this.lastGlobalFetchAt = Date.now();
        }
      }
    } catch {
      // Retain last valid globalCache (updatedAt accurately reflects age for STALE detection)
    }
  }

  private async refreshFearAndGreed(now: number, force: boolean): Promise<void> {
    if (
      !force &&
      this.fngCache.current !== null &&
      now - this.lastFngFetchAt < FNG_CACHE_TTL_MS
    ) {
      return;
    }

    try {
      const res = await fetch('https://api.alternative.me/fng/?limit=31', {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const json = await res.json();
        const arr: any[] = Array.isArray(json?.data) ? json.data : [];
        if (arr.length > 0) {
          const parseVal = (idx: number): number | null => {
            if (!arr[idx]) return null;
            const n = Number(arr[idx].value);
            return Number.isFinite(n) ? Math.round(n) : null;
          };

          const history30d = arr
            .slice(0, 30)
            .map((item) => ({
              timestamp: Number(item.timestamp) * 1000,
              value: Number(item.value),
            }))
            .filter((p) => Number.isFinite(p.timestamp) && Number.isFinite(p.value))
            .reverse();

          this.fngCache = {
            current: parseVal(0),
            yesterday: parseVal(1),
            lastWeek: parseVal(7),
            lastMonth: parseVal(Math.min(30, arr.length - 1)),
            history30d,
            updatedAt: Date.now(),
          };
          this.lastFngFetchAt = Date.now();
        }
      }
    } catch {
      // Keep cached Fear & Greed with accurate updatedAt
    }
  }

  private async refreshHeatmapMultiTfChanges(now: number, force: boolean): Promise<void> {
    if (
      !force &&
      this.cgHeatmapMap.size > 0 &&
      now - this.lastHeatmapCgFetchAt < HEATMAP_CG_TTL_MS
    ) {
      return;
    }

    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h,24h,7d',
        { signal: AbortSignal.timeout(6500) }
      );
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0) {
          const next = new Map<
            string,
            {
              name: string;
              marketCap: number;
              change1h: number | null;
              change24h: number | null;
              change7d: number | null;
            }
          >();

          for (const coin of arr) {
            const sym = String(coin?.symbol || '').toUpperCase();
            if (!sym || EXCLUDED_HEATMAP_SYMBOLS.has(sym) || next.has(sym)) continue;
            const mcap = Number(coin?.market_cap);
            if (!Number.isFinite(mcap) || mcap <= 0) continue;

            const c1h = Number(coin?.price_change_percentage_1h_in_currency);
            const c24h = Number(
              coin?.price_change_percentage_24h_in_currency ?? coin?.price_change_percentage_24h
            );
            const c7d = Number(coin?.price_change_percentage_7d_in_currency);

            next.set(sym, {
              name: String(coin?.name || sym),
              marketCap: mcap,
              change1h: Number.isFinite(c1h) ? Number(c1h.toFixed(2)) : null,
              change24h: Number.isFinite(c24h) ? Number(c24h.toFixed(2)) : null,
              change7d: Number.isFinite(c7d) ? Number(c7d.toFixed(2)) : null,
            });
          }

          if (next.size >= 10) {
            this.cgHeatmapMap = next;
            this.lastHeatmapCgFetchAt = Date.now();
          }
        }
      }
    } catch {
      // Retain existing cgHeatmapMap
    }
  }

  private async refreshOpenInterestChanges(force: boolean): Promise<void> {
    const now = Date.now();
    if (
      !force &&
      this.oiGrowthMap.size >= 8 &&
      now - this.lastOiFetchAt < OI_SURGE_TTL_MS
    ) {
      return;
    }

    if (this.oiRefreshPromise) {
      return this.oiRefreshPromise;
    }

    this.oiRefreshPromise = (async () => {
      try {
        const nextMap = new Map<
          string,
          { openInterestUsd: number; oiChange24hPct: number; oiChange4hPct: number | null }
        >();

        // Fetch in polite batches of 8 (each openInterestHist call costs weight = 1 -> 24 weight total every 2m)
        const batchSize = 8;
        for (let i = 0; i < OI_SCAN_RAW_SYMBOLS.length; i += batchSize) {
          const slice = OI_SCAN_RAW_SYMBOLS.slice(i, i + batchSize);
          await Promise.allSettled(
            slice.map(async (rawSym) => {
              const url = `https://fapi.binance.com/futures/data/openInterestHist?symbol=${rawSym}&period=1h&limit=25`;
              const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
              if (!res.ok) return;
              const arr = await res.json();
              if (!Array.isArray(arr) || arr.length < 5) return;

              const oldest = Number(arr[0]?.sumOpenInterestValue);
              const newest = Number(arr[arr.length - 1]?.sumOpenInterestValue);
              const fourHoursAgoIdx = Math.max(0, arr.length - 5);
              const fourHoursAgo = Number(arr[fourHoursAgoIdx]?.sumOpenInterestValue);

              if (
                Number.isFinite(oldest) &&
                oldest > 0 &&
                Number.isFinite(newest) &&
                newest > 0
              ) {
                const pct24h = ((newest - oldest) / oldest) * 100;
                const pct4h =
                  Number.isFinite(fourHoursAgo) && fourHoursAgo > 0
                    ? Number((((newest - fourHoursAgo) / fourHoursAgo) * 100).toFixed(2))
                    : null;

                const base = rawSym.slice(0, -4);
                nextMap.set(`${base}/USDT`, {
                  openInterestUsd: newest,
                  oiChange24hPct: Number(pct24h.toFixed(2)),
                  oiChange4hPct: pct4h,
                });
              }
            })
          );
        }

        if (nextMap.size > 0) {
          this.oiGrowthMap = nextMap;
          this.lastOiFetchAt = Date.now();
        }
      } catch {
        // Keep last valid OI growth map
      } finally {
        this.oiRefreshPromise = null;
      }
    })();

    return this.oiRefreshPromise;
  }

  private async refreshExternalCaches(force: boolean): Promise<void> {
    const now = Date.now();
    await Promise.allSettled([
      this.refreshGlobalSummary(now, force),
      this.refreshFearAndGreed(now, force),
      this.refreshHeatmapMultiTfChanges(now, force),
    ]);
  }

  public async getOverview(force = false): Promise<MarketOverviewPayload> {
    // Run mtfScreenerEngine snapshot + macro metadata in parallel; kick off OI refresh non-blocking if already warm
    const oiPromise =
      this.oiGrowthMap.size === 0 || force
        ? this.refreshOpenInterestChanges(force)
        : (void this.refreshOpenInterestChanges(false), Promise.resolve());

    const [screenerSnap] = await Promise.all([
      mtfScreenerEngine.getSnapshot({ force }),
      this.refreshExternalCaches(force),
      oiPromise,
    ]);

    const universeRows = screenerSnap.rows.filter(
      (r) => !isStablecoinPair(r.symbol) && !EXCLUDED_HEATMAP_SYMBOLS.has(r.baseAsset)
    );

    // 1. Breadth 24h across our unified 240-coin universe
    let advancing = 0;
    let declining = 0;
    let unchanged = 0;
    for (const r of universeRows) {
      if (r.change24h === null) continue;
      if (r.change24h > 0) advancing++;
      else if (r.change24h < 0) declining++;
      else unchanged++;
    }
    const breadthTotal = advancing + declining + unchanged;
    const breadth: MarketBreadth24h = {
      advancing,
      declining,
      unchanged,
      total: breadthTotal,
      advancingPct: breadthTotal > 0 ? Math.round((advancing / breadthTotal) * 100) : 50,
    };

    // Fallback global summary derivation from live universe if CoinGecko global endpoint hasn't populated yet
    let globalSummary: GlobalMarketSummary = { ...this.globalCache };
    if (globalSummary.totalMarketCapUsd === null && universeRows.length > 0) {
      const mcapRows = universeRows.filter((r) => r.marketCap && r.marketCap > 0);
      if (mcapRows.length >= 10) {
        const sumMcap = mcapRows.reduce((s, r) => s + (r.marketCap || 0), 0);
        const sumVol = universeRows.reduce((s, r) => s + (r.volume24h || 0), 0);
        const btcMcap = mcapRows.find((r) => r.symbol === 'BTC/USDT')?.marketCap || 0;
        const ethMcap = mcapRows.find((r) => r.symbol === 'ETH/USDT')?.marketCap || 0;
        const btcChg = universeRows.find((r) => r.symbol === 'BTC/USDT')?.change24h ?? null;

        globalSummary = {
          totalMarketCapUsd: sumMcap > 0 ? sumMcap : null,
          marketCapChange24hPct: btcChg,
          totalVolume24hUsd: sumVol > 0 ? sumVol : null,
          btcDominancePct: sumMcap > 0 && btcMcap > 0 ? Number(((btcMcap / sumMcap) * 100).toFixed(2)) : null,
          ethDominancePct: sumMcap > 0 && ethMcap > 0 ? Number(((ethMcap / sumMcap) * 100).toFixed(2)) : null,
          updatedAt: screenerSnap.updatedAt,
        };
      }
    }

    // 2. Heatmap (Top 100 Market-Cap Assets merged with Unified SSOT Symbols)
    const heatmapCandidates: HeatmapAssetItem[] = [];
    const seenBaseAssets = new Set<string>();

    for (const r of universeRows) {
      const lookupBase = r.baseAsset.startsWith('1000')
        ? r.baseAsset.slice(4)
        : r.baseAsset;
      if (seenBaseAssets.has(lookupBase)) continue;

      const cg = this.cgHeatmapMap.get(lookupBase);
      // Real market cap from CoinGecko or screener cache; fallback to volume-based proxy if API unpopulated
      const effectiveMcap =
        cg?.marketCap ??
        r.marketCap ??
        (r.volume24h && r.volume24h > 0 ? r.volume24h * 5.5 : 50_000_000);

      if (!effectiveMcap || effectiveMcap <= 0 || r.price <= 0) continue;

      seenBaseAssets.add(lookupBase);
      heatmapCandidates.push({
        symbol: r.symbol,
        baseAsset: r.baseAsset,
        name: cg?.name || r.name,
        price: r.price,
        marketCap: effectiveMcap,
        volume24h: r.volume24h,
        change1h: cg?.change1h ?? null,
        change24h: r.change24h ?? cg?.change24h ?? null,
        change7d: cg?.change7d ?? null,
        spotAvailable: r.spotAvailable,
      });
    }

    heatmapCandidates.sort((a, b) => b.marketCap - a.marketCap);
    const heatmap = heatmapCandidates.slice(0, 100);

    // 3. Top Gainers (8), Top Losers (8), Volume Spikes (8)
    const validMovers: MoverCoinItem[] = universeRows
      .filter(
        (r) =>
          r.price > 0 &&
          typeof r.change24h === 'number' &&
          Number.isFinite(r.change24h) &&
          typeof r.volume24h === 'number' &&
          r.volume24h > 0
      )
      .map((r) => {
        const vol = r.volume24h as number;
        const mcap = r.marketCap && r.marketCap > 0 ? r.marketCap : null;
        // Turnover intensity: if Market Cap is available, Volume/MarketCap %; otherwise normalized liquidity surge
        const turnoverPct = mcap ? (vol / mcap) * 100 : (vol / 25_000_000) * 12;
        const spikeScore = Number(turnoverPct.toFixed(1));
        const spikeLabel = mcap
          ? `${Math.min(999, Math.round(turnoverPct))}% Vol/MCap`
          : `Vol Tinggi`;

        return {
          symbol: r.symbol,
          baseAsset: r.baseAsset,
          name: r.name,
          price: r.price,
          change24h: r.change24h as number,
          volume24h: vol,
          marketCap: mcap,
          volumeSpikeScore: spikeScore,
          volumeSpikeLabel: spikeLabel,
          spotAvailable: r.spotAvailable,
        };
      });

    const topGainers = [...validMovers]
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 8);

    const topLosers = [...validMovers]
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 8);

    // Volume Spikes: require meaningful liquidity (>= $15M 24h volume) and sort by highest turnover intensity
    const volumeSpikes = validMovers
      .filter((m) => m.volume24h >= 15_000_000 && m.marketCap !== null)
      .sort((a, b) => b.volumeSpikeScore - a.volumeSpikeScore)
      .slice(0, 8);

    const finalVolumeSpikes =
      volumeSpikes.length >= 8
        ? volumeSpikes
        : [...validMovers]
            .sort((a, b) => b.volume24h - a.volume24h)
            .slice(0, 8);

    // 4. Derivatives: Most Positive Funding, Most Negative Funding, & Fastest Rising OI
    const fundingRows: FundingExtremeItem[] = universeRows
      .filter(
        (r) =>
          r.price > 0 &&
          typeof r.fundingRate === 'number' &&
          Number.isFinite(r.fundingRate)
      )
      .map((r) => ({
        symbol: r.symbol,
        baseAsset: r.baseAsset,
        name: r.name,
        price: r.price,
        change24h: r.change24h,
        fundingRatePct: r.fundingRate as number,
        volume24h: r.volume24h,
      }));

    const mostPositiveFunding = fundingRows
      .filter((f) => f.fundingRatePct > 0)
      .sort((a, b) => b.fundingRatePct - a.fundingRatePct)
      .slice(0, 6);

    const mostNegativeFunding = fundingRows
      .filter((f) => f.fundingRatePct < 0)
      .sort((a, b) => a.fundingRatePct - b.fundingRatePct)
      .slice(0, 6);

    const averageFundingPct =
      fundingRows.length > 0
        ? Number(
            (
              fundingRows.reduce((acc, f) => acc + f.fundingRatePct, 0) /
              fundingRows.length
            ).toFixed(4)
          )
        : null;

    const fastestOpenInterest: OpenInterestSurgeItem[] = [];
    for (const [symbol, oi] of this.oiGrowthMap.entries()) {
      const match = universeRows.find((r) => r.symbol === symbol);
      if (!match || match.price <= 0) continue;
      fastestOpenInterest.push({
        symbol,
        baseAsset: match.baseAsset,
        name: match.name,
        price: match.price,
        change24h: match.change24h,
        openInterestUsd: oi.openInterestUsd,
        oiChange24hPct: oi.oiChange24hPct,
        oiChange4hPct: oi.oiChange4hPct,
      });
    }
    fastestOpenInterest.sort((a, b) => b.oiChange24hPct - a.oiChange24hPct);

    return {
      updatedAt: screenerSnap.updatedAt || Date.now(),
      global: globalSummary,
      breadth,
      fearGreed: this.fngCache,
      heatmap,
      topGainers,
      topLosers,
      volumeSpikes: finalVolumeSpikes,
      derivatives: {
        mostPositiveFunding,
        mostNegativeFunding,
        fastestOpenInterest: fastestOpenInterest.slice(0, 6),
        averageFundingPct,
      },
    };
  }
}

export const marketOverviewService = new MarketOverviewService();
