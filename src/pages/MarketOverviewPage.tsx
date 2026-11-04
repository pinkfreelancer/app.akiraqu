import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Flame,
  Gauge,
  HelpCircle,
  Layers,
  LineChart,
  Minus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { StageId } from '../types/market.types';
import { useMarketDataStore } from '../stores/useMarketDataStore';
import { formatSmartCryptoPrice } from '../services/marketDataValidator';
import {
  BEGINNER_GLOSSARY_ID,
  classifyFearGreed,
  computeProportionalTreemap,
  CryptoSectorKey,
  FundingExtremeItem,
  generateMarketConclusion,
  getCryptoSector,
  HeatmapAssetItem,
  HeatmapScope,
  HeatmapTimeframe,
  MarketOverviewPayload,
  MoverCoinItem,
  OpenInterestSurgeItem,
} from '../services/marketOverviewLogic';
import { DataStatusBadge } from '../components/ui/DataStatusBadge';
import { CoinLogo } from '../components/ui/CoinLogo';

interface MarketOverviewPageProps {
  onSelectSymbol: (symbol: string, requireFutures?: boolean) => void;
  onNavigateStage: (stage: StageId) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

type MoversMobileTab = 'GAINERS' | 'LOSERS' | 'SPIKES';
type DerivativesMobileTab = 'NEG_FUNDING' | 'POS_FUNDING' | 'OI_SURGE';

const STALE_THRESHOLD_MS = 90_000;
const AUTO_REFRESH_MS = 30_000;

function formatCompactUsd(value: number | null | undefined, isId: boolean): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return '—';
  }
  if (value >= 1e12) {
    const num = (value / 1e12).toFixed(2);
    return `$${isId ? num.replace('.', ',') : num}T`;
  }
  if (value >= 1e9) {
    const num = (value / 1e9).toFixed(2);
    return `$${isId ? num.replace('.', ',') : num}${isId ? 'M' : 'B'}`;
  }
  if (value >= 1e6) {
    const num = (value / 1e6).toFixed(1);
    return `$${isId ? num.replace('.', ',') : num}Jt`;
  }
  if (value >= 1e3) {
    const num = (value / 1e3).toFixed(1);
    return `$${isId ? num.replace('.', ',') : num}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatSignedPct(value: number | null | undefined, decimals = 2, isId = true): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  const raw = `${sign}${value.toFixed(decimals)}%`;
  return isId ? raw.replace('.', ',') : raw;
}

function formatClockTime(ts: number | null | undefined, isId: boolean): string {
  if (!ts || !Number.isFinite(ts)) return '—';
  try {
    return new Date(ts).toLocaleTimeString(isId ? 'id-ID' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
}

function getHeatmapTileClasses(changePct: number | null, isDark: boolean): {
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
} {
  if (changePct === null || !Number.isFinite(changePct)) {
    return {
      bgClass: isDark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-100 hover:bg-slate-200',
      borderClass: isDark ? 'border-slate-700' : 'border-slate-300',
      textClass: isDark ? 'text-slate-200' : 'text-slate-800',
      badgeClass: isDark ? 'bg-slate-800 text-slate-300' : 'bg-white/80 text-slate-700',
    };
  }

  if (changePct >= 5) {
    return {
      bgClass: 'bg-emerald-700 hover:bg-emerald-600',
      borderClass: 'border-emerald-400/70',
      textClass: 'text-white',
      badgeClass: 'bg-emerald-950/65 text-emerald-100',
    };
  }
  if (changePct >= 1.5) {
    return {
      bgClass: 'bg-emerald-800/95 hover:bg-emerald-700',
      borderClass: 'border-emerald-500/60',
      textClass: 'text-white',
      badgeClass: 'bg-emerald-950/60 text-emerald-200',
    };
  }
  if (changePct > 0.05) {
    return {
      bgClass: isDark ? 'bg-emerald-950/95 hover:bg-emerald-900' : 'bg-emerald-600 hover:bg-emerald-500',
      borderClass: 'border-emerald-600/50',
      textClass: 'text-emerald-50',
      badgeClass: 'bg-emerald-900/80 text-emerald-200',
    };
  }
  if (changePct <= -5) {
    return {
      bgClass: 'bg-rose-700 hover:bg-rose-600',
      borderClass: 'border-rose-400/70',
      textClass: 'text-white',
      badgeClass: 'bg-rose-950/65 text-rose-100',
    };
  }
  if (changePct <= -1.5) {
    return {
      bgClass: 'bg-rose-800/95 hover:bg-rose-700',
      borderClass: 'border-rose-500/60',
      textClass: 'text-white',
      badgeClass: 'bg-rose-950/60 text-rose-200',
    };
  }
  if (changePct < -0.05) {
    return {
      bgClass: isDark ? 'bg-rose-950/95 hover:bg-rose-900' : 'bg-rose-600 hover:bg-rose-500',
      borderClass: 'border-rose-600/50',
      textClass: 'text-rose-50',
      badgeClass: 'bg-rose-900/80 text-rose-200',
    };
  }

  return {
    bgClass: isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-600 hover:bg-slate-500',
    borderClass: 'border-slate-600',
    textClass: 'text-slate-100',
    badgeClass: 'bg-slate-900/70 text-slate-200',
  };
}

export const MarketOverviewPage: React.FC<MarketOverviewPageProps> = ({
  onSelectSymbol,
  onNavigateStage,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [overview, setOverview] = useState<MarketOverviewPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [heatmapTf, setHeatmapTf] = useState<HeatmapTimeframe>('24h');
  const [heatmapScope, setHeatmapScope] = useState<HeatmapScope>('top100');
  const [heatmapSector, setHeatmapSector] = useState<CryptoSectorKey>('ALL');
  const [heatmapSearch, setHeatmapSearch] = useState<string>('');
  const [mobileHeatmapVisibleCount, setMobileHeatmapVisibleCount] = useState<number>(25);
  const [showGlossary, setShowGlossary] = useState<boolean>(false);
  const [moversTab, setMoversTab] = useState<MoversMobileTab>('GAINERS');
  const [derivTab, setDerivTab] = useState<DerivativesMobileTab>('NEG_FUNDING');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const mountedRef = useRef<boolean>(true);

  // Single Source of Truth (SSOT) subscriptions so BTC/ETH/altcoin prices match Header 100%
  const ssotTickers = useMarketDataStore((s) => s.tickers);
  const isOnline = useMarketDataStore((s) => s.isOnline);
  const ingestBatchTickers = useMarketDataStore((s) => s.ingestBatchTickers);

  const syncPayloadIntoSSOT = useCallback(
    (payload: MarketOverviewPayload) => {
      const batchMap = new Map<
        string,
        { symbol: string; price: number; change24h?: number; volume24h?: string }
      >();

      const registerCoin = (
        symbol: string,
        price: number,
        change24h?: number | null,
        volume24h?: number | null
      ) => {
        if (!symbol || !Number.isFinite(price) || price <= 0) return;
        batchMap.set(symbol, {
          symbol,
          price,
          change24h:
            change24h !== null && change24h !== undefined && Number.isFinite(change24h)
              ? change24h
              : undefined,
          volume24h:
            volume24h !== null && volume24h !== undefined && Number.isFinite(volume24h)
              ? String(volume24h)
              : undefined,
        });
      };

      payload.heatmap.forEach((c) => registerCoin(c.symbol, c.price, c.change24h, c.volume24h));
      payload.topGainers.forEach((c) => registerCoin(c.symbol, c.price, c.change24h, c.volume24h));
      payload.topLosers.forEach((c) => registerCoin(c.symbol, c.price, c.change24h, c.volume24h));
      payload.volumeSpikes.forEach((c) => registerCoin(c.symbol, c.price, c.change24h, c.volume24h));
      payload.derivatives.mostPositiveFunding.forEach((c) =>
        registerCoin(c.symbol, c.price, c.change24h, c.volume24h)
      );
      payload.derivatives.mostNegativeFunding.forEach((c) =>
        registerCoin(c.symbol, c.price, c.change24h, c.volume24h)
      );
      payload.derivatives.fastestOpenInterest.forEach((c) =>
        registerCoin(c.symbol, c.price, c.change24h, null)
      );

      if (batchMap.size > 0) {
        ingestBatchTickers(Array.from(batchMap.values()), 'REST');
      }
    },
    [ingestBatchTickers]
  );

  const fetchMarketOverview = useCallback(
    async (manual = false) => {
      if (manual) {
        setIsRefreshing(true);
      }
      try {
        const endpoint = manual
          ? '/api/v1/market-overview?force=true'
          : '/api/v1/market-overview';
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const isOk = json?.status === 'success' || json?.success === true;
        const rawData = json?.data ?? (json?.global && json?.breadth ? json : null);
        if (!isOk && !rawData) {
          throw new Error('Payload ringkasan pasar tidak valid');
        }
        if (!rawData || typeof rawData !== 'object' || !rawData.global || !rawData.breadth) {
          throw new Error('Struktur data ringkasan pasar tidak lengkap');
        }
        const payload = rawData as MarketOverviewPayload;
        if (!mountedRef.current) return;

        syncPayloadIntoSSOT(payload);
        setOverview(payload);
        setErrorMsg(null);
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        const msg =
          err instanceof Error ? err.message : 'Gagal memuat ringkasan pasar';
        setErrorMsg(msg);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [syncPayloadIntoSSOT]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchMarketOverview(false);

    const pollTimer = window.setInterval(() => {
      fetchMarketOverview(false);
    }, AUTO_REFRESH_MS);

    const clockTimer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 5_000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(pollTimer);
      window.clearInterval(clockTimer);
    };
  }, [fetchMarketOverview]);

  // Close glossary modal with Escape key for accessibility
  useEffect(() => {
    if (!showGlossary) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGlossary(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGlossary]);

  // Overlay live SSOT prices & 24h changes on every displayed asset
  const hydratedHeatmap = useMemo<HeatmapAssetItem[]>(() => {
    if (!overview) return [];
    return overview.heatmap.map((item) => {
      const live = ssotTickers[item.symbol];
      if (!live || live.price <= 0) return item;
      return {
        ...item,
        price: live.price,
        change24h: Number.isFinite(live.change24h) ? live.change24h : item.change24h,
      };
    });
  }, [overview, ssotTickers]);

  const hydrateMovers = useCallback(
    (items: MoverCoinItem[]): MoverCoinItem[] =>
      items.map((item) => {
        const live = ssotTickers[item.symbol];
        if (!live || live.price <= 0) return item;
        return {
          ...item,
          price: live.price,
          change24h: Number.isFinite(live.change24h) ? live.change24h : item.change24h,
        };
      }),
    [ssotTickers]
  );

  const hydratedGainers = useMemo(
    () => (overview ? hydrateMovers(overview.topGainers) : []),
    [overview, hydrateMovers]
  );
  const hydratedLosers = useMemo(
    () => (overview ? hydrateMovers(overview.topLosers) : []),
    [overview, hydrateMovers]
  );
  const hydratedSpikes = useMemo(
    () => (overview ? hydrateMovers(overview.volumeSpikes) : []),
    [overview, hydrateMovers]
  );

  const hydratedNegFunding = useMemo<FundingExtremeItem[]>(() => {
    if (!overview) return [];
    return overview.derivatives.mostNegativeFunding.map((item) => {
      const live = ssotTickers[item.symbol];
      return live && live.price > 0
        ? { ...item, price: live.price, change24h: live.change24h }
        : item;
    });
  }, [overview, ssotTickers]);

  const hydratedPosFunding = useMemo<FundingExtremeItem[]>(() => {
    if (!overview) return [];
    return overview.derivatives.mostPositiveFunding.map((item) => {
      const live = ssotTickers[item.symbol];
      return live && live.price > 0
        ? { ...item, price: live.price, change24h: live.change24h }
        : item;
    });
  }, [overview, ssotTickers]);

  const hydratedFastestOi = useMemo<OpenInterestSurgeItem[]>(() => {
    if (!overview) return [];
    return overview.derivatives.fastestOpenInterest.map((item) => {
      const live = ssotTickers[item.symbol];
      return live && live.price > 0
        ? { ...item, price: live.price, change24h: live.change24h }
        : item;
    });
  }, [overview, ssotTickers]);

  // Live BTC & ETH SSOT anchors
  const btcLiveChange24h = useMemo(() => {
    const ssotBtc = ssotTickers['BTC/USDT'];
    if (ssotBtc && Number.isFinite(ssotBtc.change24h)) return ssotBtc.change24h;
    const hmBtc = hydratedHeatmap.find((c) => c.symbol === 'BTC/USDT');
    return hmBtc?.change24h ?? null;
  }, [ssotTickers, hydratedHeatmap]);

  const btcLivePrice = useMemo(() => {
    const ssotBtc = ssotTickers['BTC/USDT'];
    if (ssotBtc && ssotBtc.price > 0) return ssotBtc.price;
    const hmBtc = hydratedHeatmap.find((c) => c.symbol === 'BTC/USDT');
    return hmBtc?.price ?? null;
  }, [ssotTickers, hydratedHeatmap]);

  const conclusion = useMemo(() => {
    if (!overview) return null;
    return generateMarketConclusion({
      btcChange24h: btcLiveChange24h,
      marketCapChange24hPct: overview.global.marketCapChange24hPct,
      btcDominancePct: overview.global.btcDominancePct,
      advancingCount: overview.breadth.advancing,
      decliningCount: overview.breadth.declining,
      fearGreedValue: overview.fearGreed.current,
      averageFundingPct: overview.derivatives.averageFundingPct,
    });
  }, [overview, btcLiveChange24h]);

  const getHeatmapDelta = useCallback(
    (item: HeatmapAssetItem): number | null => {
      if (heatmapTf === '1h') return item.change1h;
      if (heatmapTf === '7d') return item.change7d;
      return item.change24h;
    },
    [heatmapTf]
  );

  // Overall rank map (1-indexed) based on full Market-Cap sorted universe
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    hydratedHeatmap.forEach((item, index) => {
      map.set(item.symbol, index + 1);
    });
    return map;
  }, [hydratedHeatmap]);

  const scopedHeatmap = useMemo(() => {
    const limit = heatmapScope === 'top25' ? 25 : heatmapScope === 'top50' ? 50 : 100;
    return hydratedHeatmap.slice(0, limit);
  }, [hydratedHeatmap, heatmapScope]);

  const filteredHeatmap = useMemo(() => {
    let list = scopedHeatmap;
    if (heatmapSector !== 'ALL') {
      list = list.filter((c) => getCryptoSector(c.baseAsset) === heatmapSector);
    }
    if (heatmapSearch.trim()) {
      const q = heatmapSearch.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.baseAsset.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [scopedHeatmap, heatmapSector, heatmapSearch]);

  const treemapRects = useMemo(
    () => computeProportionalTreemap(filteredHeatmap, (item) => item.marketCap, 1.72),
    [filteredHeatmap]
  );

  const totalHeatmapMcap = useMemo(
    () => filteredHeatmap.reduce((acc, c) => acc + (c.marketCap || 0), 0),
    [filteredHeatmap]
  );

  const heatmapBreadth = useMemo(() => {
    let adv = 0;
    let dec = 0;
    for (const c of filteredHeatmap) {
      const d = getHeatmapDelta(c);
      if (d !== null && Number.isFinite(d)) {
        if (d > 0.01) adv++;
        else if (d < -0.01) dec++;
      }
    }
    return { adv, dec, total: filteredHeatmap.length };
  }, [filteredHeatmap, getHeatmapDelta]);

  const fgClassification = useMemo(
    () => classifyFearGreed(overview?.fearGreed.current ?? null),
    [overview?.fearGreed.current]
  );

  const isDataStale = useMemo(() => {
    if (!overview) return false;
    if (!isOnline) return true;
    return nowMs - overview.updatedAt > STALE_THRESHOLD_MS;
  }, [overview, isOnline, nowMs]);

  // Build 30-day Fear & Greed SVG sparkline path
  const fgSparklineGeometry = useMemo(() => {
    const pts = overview?.fearGreed.history30d ?? [];
    if (pts.length < 2) return null;
    const w = 280;
    const h = 64;
    const padX = 6;
    const padY = 8;
    const values = pts.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const span = Math.max(10, maxVal - minVal);

    const coords = pts.map((pt, idx) => {
      const x = padX + (idx / (pts.length - 1)) * (w - padX * 2);
      const y = h - padY - ((pt.value - minVal) / span) * (h - padY * 2);
      return { x, y, value: pt.value };
    });

    const linePath = coords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${h} L${coords[0].x.toFixed(1)},${h} Z`;
    const last = coords[coords.length - 1];

    return { linePath, areaPath, last, minVal, maxVal, w, h };
  }, [overview?.fearGreed.history30d]);

  const cardSurface = isDark
    ? 'bg-[#0b101b] border-[#1e293b] text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-xs';
  const subtleSurface = isDark
    ? 'bg-[#070b14] border-[#182234]'
    : 'bg-slate-50 border-slate-200';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';

  const renderSignedBadge = (
    pct: number | null | undefined,
    decimals = 2,
    sizeClass = 'text-xs'
  ) => {
    if (pct === null || pct === undefined || !Number.isFinite(pct)) {
      return (
        <span
          className={`inline-flex items-center gap-1 font-mono tabular-nums ${sizeClass} text-slate-400`}
          title={
            isId
              ? 'Data persentase perubahan belum tersedia untuk rentang waktu ini'
              : 'Percentage change unavailable for this timeframe'
          }
        >
          —
        </span>
      );
    }

    if (pct > 0.01) {
      return (
        <span
          className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums ${sizeClass} text-emerald-400`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{formatSignedPct(pct, decimals, isId)}</span>
        </span>
      );
    }

    if (pct < -0.01) {
      return (
        <span
          className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums ${sizeClass} text-rose-400`}
        >
          <ArrowDownRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{formatSignedPct(pct, decimals, isId)}</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums ${sizeClass} text-slate-300`}
      >
        <Minus className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>{formatSignedPct(0, decimals, isId)}</span>
      </span>
    );
  };

  // =========================================================================
  // SKELETON LOADING STATE (Never shows fake 0s or mock numbers)
  // =========================================================================
  if (isLoading && !overview) {
    return (
      <div
        className="w-full space-y-4 pb-8"
        aria-busy="true"
        aria-label={isId ? 'Memuat Ringkasan Pasar' : 'Loading Market Overview'}
      >
        {/* Skeleton Block 1: Hero Conclusion */}
        <div className={`p-4 sm:p-5 rounded-[2px] border ${cardSurface}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="h-5 w-52 rounded-[2px] bg-slate-800/80 animate-pulse" />
            <div className="h-5 w-36 rounded-[2px] bg-slate-800/80 animate-pulse" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full rounded-[2px] bg-slate-800/70 animate-pulse" />
            <div className="h-4 w-5/6 rounded-[2px] bg-slate-800/70 animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-36 rounded-[2px] bg-pink-500/20 animate-pulse" />
            <div className="h-8 w-36 rounded-[2px] bg-slate-800/80 animate-pulse" />
            <div className="h-8 w-32 rounded-[2px] bg-slate-800/80 animate-pulse" />
          </div>
        </div>

        {/* Skeleton Block 2: Top 5 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div key={idx} className={`p-3.5 rounded-[2px] border ${cardSurface} space-y-2.5`}>
              <div className="h-3.5 w-28 rounded-[2px] bg-slate-800/80 animate-pulse" />
              <div className="h-7 w-36 rounded-[2px] bg-slate-800/90 animate-pulse" />
              <div className="h-3 w-24 rounded-[2px] bg-slate-800/70 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton Block 3 & 4: Heatmap + Fear & Greed */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className={`xl:col-span-8 p-4 rounded-[2px] border ${cardSurface}`}>
            <div className="h-5 w-48 rounded-[2px] bg-slate-800/80 animate-pulse mb-3" />
            <div className="h-[380px] w-full rounded-[2px] bg-slate-800/50 animate-pulse" />
          </div>
          <div className={`xl:col-span-4 p-4 rounded-[2px] border ${cardSurface} space-y-4`}>
            <div className="h-5 w-44 rounded-[2px] bg-slate-800/80 animate-pulse" />
            <div className="h-36 w-full rounded-[2px] bg-slate-800/50 animate-pulse" />
            <div className="h-20 w-full rounded-[2px] bg-slate-800/50 animate-pulse" />
            <div className="h-16 w-full rounded-[2px] bg-slate-800/50 animate-pulse" />
          </div>
        </div>

        {/* Skeleton Block 5: Top Gainers / Losers / Volume Spike */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((col) => (
            <div key={col} className={`p-4 rounded-[2px] border ${cardSurface} space-y-2.5`}>
              <div className="h-4 w-40 rounded-[2px] bg-slate-800/80 animate-pulse mb-2" />
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="h-8 w-full rounded-[2px] bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error screen only if initial load completely failed and we have no data at all
  if (!overview && errorMsg) {
    return (
      <div className={`p-8 rounded-[2px] border ${cardSurface} text-center space-y-4`}>
        <AlertTriangle className="w-9 h-9 text-amber-400 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold font-mono">
            {isId ? 'Ringkasan Pasar Belum Dapat Dimuat' : 'Unable to Load Market Overview'}
          </h2>
          <p className={`text-xs ${mutedText} max-w-md mx-auto`}>
            {isId
              ? `Terjadi kendala saat mengambil data agregat pasar (${errorMsg}). Silakan coba muat ulang atau buka Grafik Utama langsung.`
              : `Encountered an error fetching market overview (${errorMsg}). Please retry or jump to the Main Chart.`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              fetchMarketOverview(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isId ? 'Coba Lagi' : 'Retry'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateStage('ticker')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[2px] border border-slate-700 hover:border-pink-500/50 text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            <LineChart className="w-3.5 h-3.5 text-pink-400" />
            <span>{isId ? 'Buka Grafik Utama' : 'Open Main Chart'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const volToMcapPct =
    overview.global.totalVolume24hUsd &&
    overview.global.totalMarketCapUsd &&
    overview.global.totalMarketCapUsd > 0
      ? (overview.global.totalVolume24hUsd / overview.global.totalMarketCapUsd) * 100
      : null;

  const btcDom = overview.global.btcDominancePct;
  const ethDom = overview.global.ethDominancePct;
  const othersDom =
    btcDom !== null && ethDom !== null ? Math.max(0, 100 - btcDom - ethDom) : null;

  const fgScore = overview.fearGreed.current;
  const fgNeedleAngleDeg =
    fgScore !== null && Number.isFinite(fgScore)
      ? -90 + (Math.max(0, Math.min(100, fgScore)) / 100) * 180
      : 0;
  const fgNeedleRad = ((fgNeedleAngleDeg - 90) * Math.PI) / 180;
  const fgNeedleTipX = 100 + 62 * Math.cos(fgNeedleRad);
  const fgNeedleTipY = 96 + 62 * Math.sin(fgNeedleRad);

  const renderMoverRow = (
    coin: MoverCoinItem,
    rank: number,
    mode: 'GAINER' | 'LOSER' | 'SPIKE'
  ) => (
    <button
      key={`${mode}-${coin.symbol}`}
      type="button"
      onClick={() => onSelectSymbol(coin.symbol, coin.spotAvailable === false)}
      title={
        isId
          ? `Klik untuk membuka Grafik Utama ${coin.symbol} — Volume 24j: ${formatCompactUsd(coin.volume24h, true)}`
          : `Click to open Main Chart for ${coin.symbol} — 24h Volume: ${formatCompactUsd(coin.volume24h, false)}`
      }
      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[2px] border transition text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
        isDark
          ? 'bg-[#070b14] border-[#162032] hover:border-pink-500/50 hover:bg-[#0f172a]'
          : 'bg-slate-50 border-slate-200 hover:border-pink-500/50 hover:bg-pink-50/40'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-4 text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
          {rank}
        </span>
        <CoinLogo symbol={coin.symbol} size="sm" decorative showTooltip />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold truncate">{coin.baseAsset}</span>
            <span className="text-[10px] font-mono text-slate-500">/USDT</span>
          </div>
          {mode === 'SPIKE' && (
            <div className="text-[10px] font-mono tabular-nums text-pink-400 truncate">
              {coin.volumeSpikeLabel} · Vol {formatCompactUsd(coin.volume24h, isId)}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-right">
        <span className="text-xs font-mono font-semibold tabular-nums">
          ${formatSmartCryptoPrice(coin.price)}
        </span>
        <div className="min-w-[74px] text-right">
          {renderSignedBadge(coin.change24h, 2, 'text-xs')}
        </div>
      </div>
    </button>
  );

  return (
    <div className="w-full space-y-4 pb-8">
      {/* STALE OR WARNING BANNER */}
      {(isDataStale || errorMsg) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-[2px] border border-amber-500/50 bg-amber-950/40 text-amber-200 text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              {isDataStale
                ? isId
                  ? 'Status STALE: Data ringkasan pasar berusia lebih dari 90 detik atau koneksi sedang terputus. Angka terakhir tetap ditampilkan tanpa nilai palsu.'
                  : 'STALE Status: Market overview data is older than 90 seconds or offline.'
                : isId
                ? `Pembaruan latar belakang tertunda (${errorMsg}). Menampilkan snapshot valid terakhir.`
                : `Background refresh delayed (${errorMsg}). Showing last valid snapshot.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchMarketOverview(true)}
            className="px-2.5 py-1 rounded-[2px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {isId ? 'Segarkan Sekarang' : 'Refresh Now'}
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* BLOK 1: KESIMPULAN PASAR HARI INI + JALAN PINTAS ALAT UTAMA         */}
      {/* =================================================================== */}
      <section
        aria-labelledby="market-conclusion-heading"
        className={`p-4 sm:p-5 rounded-[2px] border relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-[#0b101b] via-[#101322] to-[#160d1d] border-pink-500/30'
            : 'bg-gradient-to-r from-white via-pink-50/30 to-white border-pink-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2.5 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-mono font-bold uppercase tracking-wider bg-pink-500/15 text-pink-400 border border-pink-500/35">
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                {isId ? 'Ringkasan Pasar Hari Ini' : "Today's Market Pulse"}
              </span>

              {conclusion && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold border ${
                    conclusion.regime === 'BULLISH'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : conclusion.regime === 'BEARISH'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {conclusion.regime === 'BULLISH' ? (
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : conclusion.regime === 'BEARISH' ? (
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isId ? conclusion.headlineId : conclusion.headlineEn}</span>
                </span>
              )}

              {btcLivePrice !== null && (
                <button
                  type="button"
                  onClick={() => onSelectSymbol('BTC/USDT')}
                  title={
                    isId
                      ? 'Harga Bitcoin real-time tersinkronisasi langsung dengan Header (Single Source of Truth). Klik untuk buka Grafik BTC/USDT.'
                      : 'Live Bitcoin price synced with Header SSOT. Click to open BTC/USDT chart.'
                  }
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-xs font-mono tabular-nums cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    isDark
                      ? 'bg-[#070b14] border-slate-700/80 hover:border-pink-500/50 text-slate-200'
                      : 'bg-white border-slate-300 hover:border-pink-500 text-slate-800'
                  }`}
                >
                  <CoinLogo symbol="BTC/USDT" size="xs" priority decorative />
                  <span className="font-bold">BTC</span>
                  <span>${formatSmartCryptoPrice(btcLivePrice)}</span>
                  {renderSignedBadge(btcLiveChange24h, 2, 'text-[11px]')}
                </button>
              )}
            </div>

            <h1 id="market-conclusion-heading" className="sr-only">
              {isId ? 'Kesimpulan Pasar Hari Ini' : 'Market Overview Summary'}
            </h1>

            <p
              className={`text-sm sm:text-[15px] leading-relaxed ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {conclusion
                ? isId
                  ? conclusion.summaryId
                  : conclusion.summaryEn
                : isId
                ? 'Menghitung kesimpulan kondisi pasar dari data real-time...'
                : 'Computing plain-language market summary from live telemetry...'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => setShowGlossary((prev) => !prev)}
                aria-expanded={showGlossary}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-[2px]"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {isId ? 'Pelajari istilah untuk pemula' : 'Learn crypto terms for beginners'}
                </span>
              </button>

              <span className="text-slate-600 select-none" aria-hidden="true">
                •
              </span>

              <DataStatusBadge
                symbol="BTC/USDT"
                updatedAtOverride={overview.updatedAt}
                scope="screener"
                lang={lang}
              />

              <span
                className={`text-[11px] font-mono tabular-nums ${mutedText}`}
                title={
                  isId
                    ? 'Waktu terakhir seluruh data ringkasan pasar berhasil diperbarui dari server'
                    : 'Last timestamp when market overview snapshot was refreshed'
                }
              >
                {isId ? 'Diperbarui' : 'Updated'}: {formatClockTime(overview.updatedAt, isId)}
              </span>

              <button
                type="button"
                onClick={() => fetchMarketOverview(true)}
                disabled={isRefreshing}
                title={isId ? 'Segarkan data Ringkasan Pasar sekarang' : 'Refresh Market Overview now'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border text-[11px] font-mono transition cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  isDark
                    ? 'bg-[#070b14] border-slate-700 text-slate-300 hover:border-pink-500/50 hover:text-pink-300'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-pink-500'
                }`}
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`}
                  aria-hidden="true"
                />
                <span>{isId ? 'Segarkan' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* JALAN PINTAS KE ALAT LAIN (Screener MTF, Grafik Utama, Alert) */}
          <div className="flex flex-wrap lg:flex-col xl:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateStage('ticker')}
              title={
                isId
                  ? 'Buka Grafik Utama interaktif, indikator teknikal, dan order book real-time'
                  : 'Open interactive Main Chart and real-time order book'
              }
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white text-xs font-mono font-bold transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            >
              <LineChart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Grafik Utama' : 'Main Chart'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateStage('mtf_screener')}
              title={
                isId
                  ? 'Pindai keselarasan tren 6 timeframe (1m–1D) pada 240+ koin Futures'
                  : 'Scan 6-timeframe trend confluence across 240+ coins'
              }
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[2px] border text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isDark
                  ? 'bg-[#070b14] border-pink-500/40 text-pink-300 hover:bg-pink-500/15'
                  : 'bg-white border-pink-400 text-pink-700 hover:bg-pink-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Screener MTF</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateStage('alerts')}
              title={
                isId
                  ? 'Pasang pengingat harga otomatis atau sinyal teknikal'
                  : 'Create automated price and technical alerts'
              }
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[2px] border text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isDark
                  ? 'bg-[#070b14] border-slate-700 text-slate-200 hover:border-pink-500/50'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-pink-500'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-pink-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Pasang Alert' : 'Alerts'}</span>
            </button>
          </div>
        </div>

        {/* PANEL GLOSARIUM PEMULA ("Pelajari Istilah") */}
        {showGlossary && (
          <div
            role="region"
            aria-label={isId ? 'Panduan Istilah Pasar Kripto' : 'Crypto Market Glossary'}
            className={`mt-4 pt-4 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-pink-400" aria-hidden="true" />
                <h2 className="text-xs sm:text-sm font-mono font-bold">
                  {isId
                    ? 'Kamus Ringkas Pemula — Cara Membaca Ringkasan Pasar'
                    : 'Beginner Guide — How to Read Market Metrics'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGlossary(false)}
                aria-label={isId ? 'Tutup panduan istilah' : 'Close glossary'}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isId ? 'Tutup (Esc)' : 'Close (Esc)'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {BEGINNER_GLOSSARY_ID.map((g) => (
                <div
                  key={g.term}
                  className={`p-3 rounded-[2px] border ${subtleSurface} space-y-1`}
                >
                  <div className="text-xs font-mono font-bold text-pink-400">{g.term}</div>
                  <p className="text-xs leading-snug text-slate-300">{g.simpleMeaningId}</p>
                  <p className={`text-[11px] leading-snug ${mutedText}`}>
                    <span className="font-semibold text-slate-300">Cara baca: </span>
                    {g.howToReadId}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* BLOK 2: BARIS METRIK ATAS (5 KARTU RINGKAS HIERARKIS)               */}
      {/* =================================================================== */}
      <section
        aria-label={isId ? 'Metrik Utama Pasar Global' : 'Global Market Key Metrics'}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        {/* 1. Total Market Cap + Perubahan 24h */}
        <div
          className={`p-3.5 rounded-[2px] border ${cardSurface} flex flex-col justify-between`}
          title={
            isId
              ? 'Total nilai kapitalisasi seluruh aset kripto dunia dalam USD beserta persentase perubahannya selama 24 jam terakhir.'
              : 'Combined market capitalization of all crypto assets in USD and 24h percentage change.'
          }
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${mutedText}`}>
              Total Market Cap
            </span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold tabular-nums tracking-tight">
            {formatCompactUsd(overview.global.totalMarketCapUsd, isId)}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-800/60">
            <span className={`text-[11px] font-mono ${mutedText}`}>
              {isId ? 'Perubahan 24j' : '24h Change'}
            </span>
            {renderSignedBadge(overview.global.marketCapChange24hPct, 2, 'text-xs')}
          </div>
        </div>

        {/* 2. Volume 24 Jam */}
        <div
          className={`p-3.5 rounded-[2px] border ${cardSurface} flex flex-col justify-between`}
          title={
            isId
              ? 'Total nilai transaksi jual-beli kripto global selama 24 jam terakhir. Semakin besar rasio Vol/MCap, semakin aktif likuiditas pasar.'
              : 'Total 24-hour global crypto trading volume across spot and derivatives markets.'
          }
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${mutedText}`}>
              {isId ? 'Volume Global 24j' : '24h Global Volume'}
            </span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold tabular-nums tracking-tight">
            {formatCompactUsd(overview.global.totalVolume24hUsd, isId)}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-800/60">
            <span className={`text-[11px] font-mono ${mutedText}`}>
              {isId ? 'Rasio Vol / MCap' : 'Vol / MCap Ratio'}
            </span>
            <span className="text-xs font-mono font-bold tabular-nums text-pink-400">
              {volToMcapPct !== null
                ? `${isId ? volToMcapPct.toFixed(2).replace('.', ',') : volToMcapPct.toFixed(2)}%`
                : '—'}
            </span>
          </div>
        </div>

        {/* 3. Dominasi BTC & ETH */}
        <div
          className={`p-3.5 rounded-[2px] border ${cardSurface} flex flex-col justify-between`}
          title={
            isId
              ? 'Porsi kapitalisasi pasar Bitcoin (BTC) dan Ethereum (ETH) terhadap total pasar kripto. Dominasi BTC tinggi menandakan modal terkonsentrasi di Bitcoin.'
              : 'Share of total crypto market capitalization held by Bitcoin (BTC) and Ethereum (ETH).'
          }
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${mutedText}`}>
              {isId ? 'Dominasi BTC & ETH' : 'BTC & ETH Dominance'}
            </span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-3 font-mono tabular-nums">
            <div>
              <span className="text-[11px] text-amber-400 font-bold mr-1">BTC</span>
              <span className="text-xl sm:text-2xl font-extrabold">
                {btcDom !== null
                  ? `${isId ? btcDom.toFixed(1).replace('.', ',') : btcDom.toFixed(1)}%`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-indigo-400 font-bold mr-1">ETH</span>
              <span className="text-sm sm:text-base font-bold text-slate-300">
                {ethDom !== null
                  ? `${isId ? ethDom.toFixed(1).replace('.', ',') : ethDom.toFixed(1)}%`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <svg
              viewBox="0 0 100 6"
              preserveAspectRatio="none"
              className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800"
              aria-hidden="true"
            >
              <rect
                x={0}
                y={0}
                width={Math.max(0, Math.min(100, btcDom ?? 0))}
                height={6}
                className="fill-amber-400"
              />
              <rect
                x={Math.max(0, Math.min(100, btcDom ?? 0))}
                y={0}
                width={Math.max(0, Math.min(100 - (btcDom ?? 0), ethDom ?? 0))}
                height={6}
                className="fill-indigo-400"
              />
            </svg>
            <div className={`flex justify-between text-[10px] font-mono tabular-nums ${mutedText}`}>
              <span>
                Altcoin:{' '}
                {othersDom !== null
                  ? `${isId ? othersDom.toFixed(1).replace('.', ',') : othersDom.toFixed(1)}%`
                  : '—'}
              </span>
              <button
                type="button"
                onClick={() => onNavigateStage('btc_dominance')}
                className="text-pink-400 hover:text-pink-300 underline cursor-pointer"
              >
                {isId ? 'Detail Makro' : 'Macro View'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Fear & Greed Ringkas */}
        <div
          className={`p-3.5 rounded-[2px] border ${cardSurface} flex flex-col justify-between`}
          title={
            isId
              ? 'Indeks Sentimen Fear & Greed (0–100): 0–25 Extreme Fear (Wait & See), 26–45 Fear (DCA), 46–55 Neutral (Good Entry), 56–75 Greed (Warning), 76–100 Ext. Greed (Don\'t FOMO).'
              : 'Crypto Fear & Greed Index (0–100): 0–25 Extreme Fear (Wait & See), 26–45 Fear (DCA), 46–55 Neutral (Good Entry), 56–75 Greed (Warning), 76–100 Ext. Greed (Don\'t FOMO).'
          }
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${mutedText}`}>
              Fear &amp; Greed
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-[2px] border text-[10px] font-mono font-bold tracking-tight ${fgClassification.badgeBgClass}`}
            >
              {fgClassification.actionId}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl sm:text-2xl font-mono font-extrabold tabular-nums ${fgClassification.textColorClass}`}
            >
              {fgScore !== null ? Math.round(fgScore) : '—'}
            </span>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
            <div className="ml-auto text-right">
              <span
                className={`inline-block px-2 py-0.5 rounded-[2px] border text-[11px] font-mono font-bold ${fgClassification.badgeBgClass}`}
              >
                {fgClassification.labelId}
              </span>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Zona {fgClassification.rangeLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-800/60 text-[11px] font-mono tabular-nums">
            <span className={mutedText}>{isId ? 'Kemarin' : 'Yesterday'}:</span>
            <span className="font-bold text-slate-300">
              {overview.fearGreed.yesterday !== null ? overview.fearGreed.yesterday : '—'}
              {fgScore !== null && overview.fearGreed.yesterday !== null && (
                <span
                  className={`ml-1.5 ${
                    fgScore - overview.fearGreed.yesterday >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  ({fgScore - overview.fearGreed.yesterday >= 0 ? '▲ +' : '▼ '}
                  {fgScore - overview.fearGreed.yesterday})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* 5. Breadth 24 Jam (Koin Naik vs Turun) */}
        <div
          className={`p-3.5 rounded-[2px] border ${cardSurface} flex flex-col justify-between`}
          title={
            isId
              ? `Perbandingan jumlah koin yang naik (hijau) vs turun (merah) dalam 24 jam terakhir dari ${overview.breadth.total} koin likuid teratas.`
              : `Number of advancing vs declining coins over the last 24h across ${overview.breadth.total} liquid pairs.`
          }
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${mutedText}`}>
              {isId ? 'Breadth Pasar 24j' : '24h Market Breadth'}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-slate-500">
              {overview.breadth.total} {isId ? 'koin' : 'coins'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="inline-flex items-center gap-1 text-base sm:text-lg font-extrabold text-emerald-400">
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{overview.breadth.advancing}</span>
              <span className="text-[11px] font-normal text-emerald-300/90">
                {isId ? 'Naik' : 'Up'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-base sm:text-lg font-extrabold text-rose-400">
              <ArrowDownRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{overview.breadth.declining}</span>
              <span className="text-[11px] font-normal text-rose-300/90">
                {isId ? 'Turun' : 'Down'}
              </span>
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <svg
              viewBox="0 0 100 6"
              preserveAspectRatio="none"
              className="w-full h-1.5 rounded-full overflow-hidden bg-rose-500/70"
              aria-hidden="true"
            >
              <rect
                x={0}
                y={0}
                width={Math.max(0, Math.min(100, overview.breadth.advancingPct))}
                height={6}
                className="fill-emerald-400"
              />
            </svg>
            <div className={`flex justify-between text-[10px] font-mono tabular-nums ${mutedText}`}>
              <span>
                {overview.breadth.advancingPct.toFixed(0)}% {isId ? 'menghijau' : 'green'}
              </span>
              <span>
                {(100 - overview.breadth.advancingPct).toFixed(0)}% {isId ? 'merah' : 'red'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* BLOK 3 & 4: HEATMAP PROPORSIONAL MARKET CAP + FEAR & GREED 30 HARI  */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* BLOK 3: PETA PANAS KAPITALISASI PASAR (HEATMAP) TOP 100 */}
        <section
          aria-labelledby="overview-heatmap-heading"
          className={`xl:col-span-8 p-4 rounded-[2px] border ${cardSurface} flex flex-col justify-between`}
        >
          {/* Header Baris 1: Judul + Scope (Top 25/50/100) + Timeframe (1H/24H/7D) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="overview-heatmap-heading"
                  className="text-sm font-mono font-bold flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" aria-hidden="true" />
                  <span>
                    {isId
                      ? 'Peta Panas Kapitalisasi Pasar (Heatmap) Top 100'
                      : 'Market Cap Heatmap Top 100'}
                  </span>
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  {filteredHeatmap.length} {isId ? 'Koin Aktif' : 'Active Coins'}
                </span>
              </div>
              <p className={`text-[11px] ${mutedText} mt-0.5`}>
                {isId
                  ? 'Ukuran kotak proporsional Market Cap, warna sesuai momentum harga real-time SSOT. Klik koin untuk membuka Grafik Utama.'
                  : 'Tile area is proportional to Market Cap; color reflects live SSOT price momentum. Click any asset to open Main Chart.'}
              </p>
            </div>

            {/* Pilihan Scope (Top 25, Top 50, Top 100) dan Timeframe (1h, 24h, 7d) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Pilihan Cakupan Top Koin */}
              <div
                role="group"
                aria-label={isId ? 'Pilihan cakupan koin' : 'Heatmap coin scope'}
                className={`inline-flex rounded-[2px] p-0.5 border ${
                  isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-100 border-slate-300'
                }`}
              >
                {(['top25', 'top50', 'top100'] as HeatmapScope[]).map((scope) => {
                  const active = heatmapScope === scope;
                  const label =
                    scope === 'top25' ? 'Top 25' : scope === 'top50' ? 'Top 50' : 'Top 100';
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setHeatmapScope(scope)}
                      aria-pressed={active}
                      className={`px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                        active
                          ? 'bg-pink-600 text-white shadow-xs'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Tombol Timeframe Heatmap: 1h / 24h / 7d */}
              <div
                role="group"
                aria-label={isId ? 'Rentang waktu heatmap' : 'Heatmap timeframe'}
                className={`inline-flex rounded-[2px] p-0.5 border ${
                  isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-100 border-slate-300'
                }`}
              >
                {(['1h', '24h', '7d'] as HeatmapTimeframe[]).map((tf) => {
                  const active = heatmapTf === tf;
                  return (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setHeatmapTf(tf)}
                      aria-pressed={active}
                      className={`px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                        active
                          ? 'bg-pink-600 text-white shadow-xs'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Header Baris 2: Toolbar Pencarian + Filter Sektor + Statistik Ringkas */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/60">
            {/* Input Pencarian Koin di Heatmap */}
            <div className="relative min-w-[160px] max-w-xs flex-1">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={heatmapSearch}
                onChange={(e) => setHeatmapSearch(e.target.value)}
                placeholder={isId ? 'Cari koin di Top 100...' : 'Search Top 100 coin...'}
                className={`w-full pl-8 pr-7 py-1 text-xs font-mono rounded-[2px] border ${
                  isDark
                    ? 'bg-[#070b14] border-slate-800 text-slate-200 placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500`}
              />
              {heatmapSearch && (
                <button
                  type="button"
                  onClick={() => setHeatmapSearch('')}
                  aria-label={isId ? 'Hapus pencarian' : 'Clear search'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Sektor */}
            <div
              role="group"
              aria-label={isId ? 'Filter sektor pasar' : 'Sector filter'}
              className="flex flex-wrap items-center gap-1 text-[11px] font-mono"
            >
              {(
                [
                  { key: 'ALL', label: isId ? 'Semua' : 'All' },
                  { key: 'L1', label: 'Layer 1' },
                  { key: 'L2', label: 'Layer 2' },
                  { key: 'DeFi', label: 'DeFi' },
                  { key: 'AI', label: 'AI' },
                  { key: 'Meme', label: 'Meme' },
                  { key: 'RWA', label: 'RWA' },
                ] as Array<{ key: CryptoSectorKey; label: string }>
              ).map((sec) => {
                const active = heatmapSector === sec.key;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setHeatmapSector(sec.key)}
                    className={`px-2 py-0.5 rounded-[2px] transition cursor-pointer ${
                      active
                        ? 'bg-pink-600/30 text-pink-300 border border-pink-500/50 font-bold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-transparent'
                    }`}
                  >
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {/* Metrik Porsi & Breadth Seleksi */}
            <div className="text-[11px] font-mono flex items-center gap-2 text-slate-400">
              <span>
                MCap:{' '}
                <strong className="text-slate-200">
                  {formatCompactUsd(totalHeatmapMcap, isId)}
                </strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">▲ {heatmapBreadth.adv}</span>
              <span className="text-rose-400 font-semibold">▼ {heatmapBreadth.dec}</span>
            </div>
          </div>

          {/* DESKTOP & TABLET (>= 768px): TREEMAP PROPORSIONAL SESUAI MARKET CAP */}
          <div className="hidden md:block w-full">
            {treemapRects.length > 0 ? (
              <svg
                viewBox="0 0 1000 580"
                className="w-full h-[480px] md:h-[540px] lg:h-[580px] block rounded-[2px] overflow-hidden"
                role="group"
                aria-label={
                  isId
                    ? `Treemap ${treemapRects.length} koin terbesar berdasarkan Market Cap`
                    : `Proportional Market Cap treemap of top ${treemapRects.length} coins`
                }
              >
                {treemapRects.map((rect) => {
                  const coin = rect.item;
                  const delta = getHeatmapDelta(coin);
                  const tileStyles = getHeatmapTileClasses(delta, isDark);
                  const rank = rankMap.get(coin.symbol) || 1;
                  const sector = getCryptoSector(coin.baseAsset);

                  const svgX = rect.x * 10 + 1;
                  const svgY = rect.y * 5.8 + 1;
                  const svgW = Math.max(6, rect.w * 10 - 2);
                  const svgH = Math.max(6, rect.h * 5.8 - 2);
                  const area = svgW * svgH;

                  const isHeroTile = area >= 280 && svgW >= 60 && svgH >= 50;
                  const isMediumTile = area >= 95 && svgW >= 36 && svgH >= 32 && !isHeroTile;
                  const isCompactTile = area >= 36 && svgW >= 24 && svgH >= 20 && !isHeroTile && !isMediumTile;
                  const isMicroTile = !isHeroTile && !isMediumTile && !isCompactTile;

                  const tooltipId = `#${rank} ${coin.name} (${coin.symbol}) • Sektor: ${sector} • Market Cap: ${formatCompactUsd(
                    coin.marketCap,
                    isId
                  )} • Harga: $${formatSmartCryptoPrice(coin.price)} • Perubahan ${heatmapTf.toUpperCase()}: ${formatSignedPct(
                    delta,
                    2,
                    isId
                  )}. Klik untuk buka Grafik Utama.`;

                  return (
                    <foreignObject
                      key={coin.symbol}
                      x={svgX}
                      y={svgY}
                      width={svgW}
                      height={svgH}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onSelectSymbol(coin.symbol, coin.spotAvailable === false)
                        }
                        title={tooltipId}
                        className={`w-full h-full p-1 rounded-[2px] border relative flex flex-col items-center justify-center text-center overflow-hidden transition cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${tileStyles.bgClass} ${tileStyles.borderClass} ${tileStyles.textClass}`}
                      >
                        {/* Rank Badge di Sudut Kiri Atas pada Tile Cukup Besar */}
                        {(isHeroTile || isMediumTile) && (
                          <span className="absolute top-1 left-1 text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-black/40 text-slate-300 leading-none">
                            #{rank}
                          </span>
                        )}

                        {/* Konten Koin: Logo + Simbol */}
                        <div className="flex items-center justify-center gap-1 max-w-full">
                          {(isHeroTile || isMediumTile) && (
                            <CoinLogo
                              symbol={coin.symbol}
                              size={isHeroTile ? 'md' : 'xs'}
                              decorative
                            />
                          )}
                          <span
                            className={`font-mono font-extrabold tracking-tight leading-none truncate max-w-full ${
                              isHeroTile
                                ? 'text-lg sm:text-xl'
                                : isMediumTile
                                ? 'text-xs sm:text-sm'
                                : isCompactTile
                                ? 'text-[11px]'
                                : 'text-[9px]'
                            }`}
                          >
                            {coin.baseAsset}
                          </span>
                        </div>

                        {/* Harga Koin */}
                        {!isMicroTile && (
                          <span
                            className={`font-mono tabular-nums font-semibold leading-tight mt-0.5 truncate max-w-full ${
                              isHeroTile
                                ? 'text-sm opacity-95'
                                : isMediumTile
                                ? 'text-[11px] opacity-90'
                                : 'text-[9px] opacity-85'
                            }`}
                          >
                            ${formatSmartCryptoPrice(coin.price)}
                          </span>
                        )}

                        {/* Badge Perubahan Persentase */}
                        <span
                          className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums leading-none mt-0.5 px-1 py-0.5 rounded-[2px] ${
                            isHeroTile
                              ? 'text-xs'
                              : isMediumTile
                              ? 'text-[10px]'
                              : isCompactTile
                              ? 'text-[9px]'
                              : 'text-[8px] px-0.5 py-0'
                          } ${tileStyles.badgeClass}`}
                        >
                          {delta !== null && Number.isFinite(delta) ? (
                            <>
                              {!isMicroTile && (
                                <span aria-hidden="true">
                                  {delta > 0.01 ? '▲' : delta < -0.01 ? '▼' : '•'}
                                </span>
                              )}
                              <span>
                                {isMicroTile
                                  ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
                                  : formatSignedPct(delta, 2, isId)}
                              </span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </span>

                        {/* Market Cap untuk Hero Tile */}
                        {isHeroTile && (
                          <span className="text-[10px] font-mono tabular-nums opacity-80 mt-1">
                            MCap {formatCompactUsd(coin.marketCap, isId)}
                          </span>
                        )}
                      </button>
                    </foreignObject>
                  );
                })}
              </svg>
            ) : (
              <div
                className={`h-[420px] rounded-[2px] border ${subtleSurface} flex flex-col items-center justify-center gap-2 text-xs font-mono ${mutedText}`}
              >
                <span>
                  {isId
                    ? 'Tidak ada koin yang sesuai dengan pencarian atau filter sektor'
                    : 'No coins match the search or sector filter'}
                </span>
                {(heatmapSearch || heatmapSector !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeatmapSearch('');
                      setHeatmapSector('ALL');
                    }}
                    className="px-3 py-1 rounded-[2px] bg-pink-600 text-white font-bold cursor-pointer hover:bg-pink-500"
                  >
                    {isId ? 'Reset Filter' : 'Reset Filter'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MOBILE (< 768px): DAFTAR RESPONSIF TOP 100 DENGAN PENCARIAN & FILTER */}
          <div className="md:hidden space-y-2">
            <div
              className="space-y-1.5 max-h-[460px] overflow-y-auto pr-0.5"
              aria-label={isId ? 'Daftar koin berdasarkan Market Cap' : 'Market Cap asset list'}
            >
              {filteredHeatmap.slice(0, mobileHeatmapVisibleCount).map((coin) => {
                const delta = getHeatmapDelta(coin);
                const rank = rankMap.get(coin.symbol) || 1;
                const sector = getCryptoSector(coin.baseAsset);
                const sharePct =
                  totalHeatmapMcap > 0 ? (coin.marketCap / totalHeatmapMcap) * 100 : 0;
                return (
                  <button
                    key={coin.symbol}
                    type="button"
                    onClick={() => onSelectSymbol(coin.symbol, coin.spotAvailable === false)}
                    className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-[2px] border text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${subtleSurface}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-slate-500 w-5 text-right shrink-0">
                        #{rank}
                      </span>
                      <CoinLogo symbol={coin.symbol} size="sm" decorative showTooltip />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold truncate flex items-center gap-1.5">
                          <span>{coin.baseAsset}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                            {sector}
                          </span>
                          <span className="text-[10px] font-normal text-slate-500 truncate hidden sm:inline">
                            {coin.name}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-400">
                          MCap {formatCompactUsd(coin.marketCap, isId)} ({sharePct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold tabular-nums">
                        ${formatSmartCryptoPrice(coin.price)}
                      </div>
                      <div>{renderSignedBadge(delta, 2, 'text-[11px]')}</div>
                    </div>
                  </button>
                );
              })}

              {filteredHeatmap.length === 0 && (
                <div
                  className={`p-6 text-center text-xs font-mono ${mutedText} rounded-[2px] border ${subtleSurface}`}
                >
                  {isId
                    ? 'Tidak ada koin yang sesuai kriteria.'
                    : 'No coins found matching criteria.'}
                </div>
              )}
            </div>

            {/* Tombol Load More untuk Tampilan Mobile jika koin melebihi 25 */}
            {filteredHeatmap.length > mobileHeatmapVisibleCount && (
              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMobileHeatmapVisibleCount((prev) =>
                      Math.min(filteredHeatmap.length, prev + 25)
                    )
                  }
                  className="px-3 py-1.5 rounded-[2px] border border-slate-700 bg-slate-800 text-xs font-mono font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  {isId
                    ? `Tampilkan 25 Koin Berikutnya (${mobileHeatmapVisibleCount}/${filteredHeatmap.length})`
                    : `Show Next 25 Coins (${mobileHeatmapVisibleCount}/${filteredHeatmap.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileHeatmapVisibleCount(filteredHeatmap.length)}
                  className="px-3 py-1.5 rounded-[2px] bg-pink-600/20 border border-pink-500/40 text-pink-300 text-xs font-mono font-semibold hover:bg-pink-600/30 cursor-pointer"
                >
                  {isId ? 'Tampilkan Semua' : 'Show All'}
                </button>
              </div>
            )}
          </div>

          {/* Legend warna + panduan aksesibilitas + pintasan ke Heatmap Penuh */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className={mutedText}>{isId ? 'Skala Momentum:' : 'Momentum Scale:'}</span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-rose-700 text-white font-bold">
                ▼ ≤ -5%
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-rose-950 text-rose-200 border border-rose-700/50">
                ▼ -1%
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-800 text-slate-200">
                • 0%
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-950 text-emerald-200 border border-emerald-700/50">
                ▲ +1%
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-700 text-white font-bold">
                ▲ ≥ +5%
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateStage('market_heatmap')}
              className="text-pink-400 hover:text-pink-300 underline cursor-pointer font-semibold flex items-center gap-1"
            >
              <span>{isId ? 'Buka Tampilan Heatmap Penuh' : 'Open Full Heatmap View'}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        {/* BLOK 4: PANEL FEAR & GREED (GAUGE + SPARKLINE 30H + HISTORIS) */}
        <section
          aria-labelledby="fear-greed-panel-heading"
          className={`xl:col-span-4 p-4 rounded-[2px] border ${cardSurface} flex flex-col justify-between space-y-4`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2
                id="fear-greed-panel-heading"
                className="text-sm font-mono font-bold flex items-center gap-2"
              >
                <Gauge className="w-4 h-4 text-pink-400" aria-hidden="true" />
                <span>{isId ? 'Sentimen Fear & Greed' : 'Fear & Greed Sentiment'}</span>
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span
                  className={`px-2 py-0.5 rounded-[2px] border text-[11px] font-mono font-bold ${fgClassification.badgeBgClass}`}
                >
                  {fgClassification.labelId} ({fgClassification.rangeLabel})
                </span>
                <span
                  className="px-2 py-0.5 rounded-[2px] bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[11px] font-mono font-bold"
                >
                  Aksi: {fgClassification.actionId}
                </span>
              </div>
            </div>
            <p className={`text-[11px] ${mutedText}`}>{fgClassification.shortDescId}</p>
          </div>

          {/* 5 ELEMEN PANDUAN AKSI FEAR & GREED (0–25 Wait & See, 26–45 DCA, 46–55 Good Entry, 56–75 Warning, 76–100 Don't FOMO) */}
          <div
            role="group"
            aria-label={isId ? 'Panduan Aksi 5 Zona Sentimen' : '5 Sentiment Zone Action Guide'}
            className="grid grid-cols-2 sm:grid-cols-5 gap-1.5"
          >
            {[
              {
                zone: 'EXTREME_FEAR',
                name: 'Extreme Fear',
                range: '0–25',
                action: 'Wait & See',
                colorClass: 'text-rose-400',
                activeClass: 'bg-rose-500/25 border-rose-400 shadow-xs shadow-rose-500/20 ring-1 ring-rose-400',
                idleClass: isDark
                  ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                  : 'bg-rose-50 border-rose-200 hover:border-rose-300',
              },
              {
                zone: 'FEAR',
                name: 'Fear',
                range: '26–45',
                action: 'DCA',
                colorClass: 'text-amber-400',
                activeClass: 'bg-amber-500/25 border-amber-400 shadow-xs shadow-amber-500/20 ring-1 ring-amber-400',
                idleClass: isDark
                  ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                  : 'bg-amber-50 border-amber-200 hover:border-amber-300',
              },
              {
                zone: 'NEUTRAL',
                name: 'Neutral',
                range: '46–55',
                action: 'Good Entry',
                colorClass: 'text-slate-200',
                activeClass: 'bg-slate-700/60 border-slate-300 shadow-xs shadow-slate-400/20 ring-1 ring-slate-300',
                idleClass: isDark
                  ? 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500/60'
                  : 'bg-slate-100 border-slate-300 hover:border-slate-400',
              },
              {
                zone: 'GREED',
                name: 'Greed',
                range: '56–75',
                action: 'Warning',
                colorClass: 'text-emerald-400',
                activeClass: 'bg-emerald-500/25 border-emerald-400 shadow-xs shadow-emerald-500/20 ring-1 ring-emerald-400',
                idleClass: isDark
                  ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60'
                  : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
              },
              {
                zone: 'EXTREME_GREED',
                name: 'Ext. Greed',
                range: '76–100',
                action: "Don't FOMO",
                colorClass: 'text-pink-400',
                activeClass: 'bg-pink-500/25 border-pink-400 shadow-xs shadow-pink-500/20 ring-1 ring-pink-400',
                idleClass: isDark
                  ? 'bg-pink-950/20 border-pink-900/40 hover:border-pink-700/60'
                  : 'bg-pink-50 border-pink-200 hover:border-pink-300',
              },
            ].map((item) => {
              const isActive = fgClassification.zone === item.zone;
              return (
                <div
                  key={item.zone}
                  className={`p-2 rounded-[2px] border transition-all text-center flex flex-col justify-between ${
                    isActive ? item.activeClass : item.idleClass
                  }`}
                  title={`${item.name} (${item.range}): Aksi yang disarankan "${item.action}"`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {item.range}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                    )}
                  </div>
                  <div className={`text-xs font-mono font-bold leading-tight ${item.colorClass}`}>
                    {item.name}
                  </div>
                  <div
                    className={`mt-1 text-[10px] font-mono font-extrabold uppercase px-1 py-0.5 rounded-[2px] ${
                      isActive
                        ? 'bg-pink-600 text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-900/80 text-slate-300 border border-slate-700/60'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.action}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gauge Setengah Lingkaran SVG */}
          <div
            className={`p-3 rounded-[2px] border ${subtleSurface} flex flex-col items-center`}
            title={
              isId
                ? 'Indeks Fear & Greed: 0–25 Extreme Fear (Wait & See), 26–45 Fear (DCA), 46–55 Neutral (Good Entry), 56–75 Greed (Warning), 76–100 Ext. Greed (Don\'t FOMO).'
                : 'Fear & Greed Index: 0–25 Extreme Fear (Wait & See), 26–45 Fear (DCA), 46–55 Neutral (Good Entry), 56–75 Greed (Warning), 76–100 Ext. Greed (Don\'t FOMO).'
            }
          >
            <svg viewBox="0 0 200 112" className="w-52 h-28 overflow-visible" aria-hidden="true">
              {/* Zona warna busur setengah lingkaran */}
              <path
                d="M 20 96 A 80 80 0 0 1 52 32"
                fill="none"
                stroke="#fb7185"
                strokeWidth="12"
                strokeLinecap="butt"
              />
              <path
                d="M 54 31 A 80 80 0 0 1 88 17"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="12"
              />
              <path
                d="M 90 17 A 80 80 0 0 1 110 17"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="12"
              />
              <path
                d="M 112 17 A 80 80 0 0 1 146 31"
                fill="none"
                stroke="#34d399"
                strokeWidth="12"
              />
              <path
                d="M 148 32 A 80 80 0 0 1 180 96"
                fill="none"
                stroke="#ec4899"
                strokeWidth="12"
                strokeLinecap="butt"
              />

              {/* Jarum Penunjuk */}
              {fgScore !== null && (
                <>
                  <line
                    x1={100}
                    y1={96}
                    x2={fgNeedleTipX}
                    y2={fgNeedleTipY}
                    stroke={fgClassification.strokeHex}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx={100} cy={96} r="5" fill={fgClassification.strokeHex} />
                </>
              )}

              <text
                x="18"
                y="110"
                className="fill-slate-500 text-[9px] font-mono"
                textAnchor="start"
              >
                0 Fear
              </text>
              <text
                x="100"
                y="82"
                className="fill-white text-2xl font-mono font-extrabold"
                textAnchor="middle"
              >
                {fgScore !== null ? Math.round(fgScore) : '—'}
              </text>
              <text
                x="182"
                y="110"
                className="fill-slate-500 text-[9px] font-mono"
                textAnchor="end"
              >
                100 Greed
              </text>
            </svg>
          </div>

          {/* Sparkline 30 Hari */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={mutedText}>
                {isId ? 'Tren Sentimen 30 Hari Terakhir' : '30-Day Sentiment Trend'}
              </span>
              {fgSparklineGeometry && (
                <span className="tabular-nums text-slate-400">
                  Min {fgSparklineGeometry.minVal} · Maks {fgSparklineGeometry.maxVal}
                </span>
              )}
            </div>

            {fgSparklineGeometry ? (
              <div
                className={`p-2 rounded-[2px] border ${subtleSurface}`}
                title={
                  isId
                    ? 'Pergerakan harian indeks Fear & Greed selama 30 hari terakhir'
                    : 'Daily Fear & Greed Index trajectory over the past 30 days'
                }
              >
                <svg
                  viewBox={`0 0 ${fgSparklineGeometry.w} ${fgSparklineGeometry.h}`}
                  className="w-full h-16 block"
                  aria-label={isId ? 'Grafik sparkline 30 hari Fear & Greed' : '30d sparkline'}
                >
                  <defs>
                    <linearGradient id="fgSparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d={fgSparklineGeometry.areaPath} fill="url(#fgSparkGrad)" />
                  <path
                    d={fgSparklineGeometry.linePath}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2"
                  />
                  <circle
                    cx={fgSparklineGeometry.last.x}
                    cy={fgSparklineGeometry.last.y}
                    r="3.5"
                    fill="#f472b6"
                  />
                </svg>
              </div>
            ) : (
              <div
                className={`h-16 rounded-[2px] border ${subtleSurface} flex items-center justify-center text-xs font-mono ${mutedText}`}
              >
                —
              </div>
            )}
          </div>

          {/* Perbandingan Historis: Kemarin / Minggu Lalu / Bulan Lalu */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: isId ? 'Kemarin' : 'Yesterday',
                val: overview.fearGreed.yesterday,
              },
              {
                label: isId ? 'Minggu Lalu' : 'Last Week',
                val: overview.fearGreed.lastWeek,
              },
              {
                label: isId ? 'Bulan Lalu' : 'Last Month',
                val: overview.fearGreed.lastMonth,
              },
            ].map((hist) => {
              const cls = classifyFearGreed(hist.val);
              const diff =
                fgScore !== null && hist.val !== null ? Math.round(fgScore - hist.val) : null;
              return (
                <div
                  key={hist.label}
                  className={`p-2.5 rounded-[2px] border ${subtleSurface} text-center`}
                  title={
                    hist.val !== null
                      ? `${hist.label}: ${hist.val}/100 (${isId ? cls.labelId : cls.labelEn})`
                      : isId
                      ? 'Data historis tidak tersedia'
                      : 'Historical data unavailable'
                  }
                >
                  <div className={`text-[10px] font-mono ${mutedText} truncate`}>
                    {hist.label}
                  </div>
                  <div
                    className={`text-base font-mono font-extrabold tabular-nums mt-0.5 ${cls.textColorClass}`}
                  >
                    {hist.val !== null ? hist.val : '—'}
                  </div>
                  <div className="text-[10px] font-mono tabular-nums mt-0.5">
                    {diff !== null ? (
                      <span
                        className={
                          diff > 0
                            ? 'text-emerald-400'
                            : diff < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : '• 0'}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* =================================================================== */}
      {/* BLOK 5: TOP GAINERS (8), TOP LOSERS (8), & VOLUME SPIKE (8)         */}
      {/* =================================================================== */}
      <section aria-label={isId ? 'Pergerakan Koin Teratas 24 Jam' : 'Top 24h Coin Movers'}>
        {/* Tab Pemilih Cepat khusus layar kecil (< 1024px) agar rapi di 375px */}
        <div className="flex lg:hidden gap-1.5 mb-2.5">
          {[
            { id: 'GAINERS' as MoversMobileTab, label: 'Top Gainers (8)' },
            { id: 'LOSERS' as MoversMobileTab, label: 'Top Losers (8)' },
            { id: 'SPIKES' as MoversMobileTab, label: 'Volume Spike (8)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMoversTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-[2px] border text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                moversTab === tab.id
                  ? 'bg-pink-600 border-pink-500 text-white'
                  : `${subtleSurface} ${mutedText}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Kolom 1: Top Gainers (8) */}
          <div
            className={`p-4 rounded-[2px] border ${cardSurface} ${
              moversTab !== 'GAINERS' ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 text-emerald-400">
                <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Top Gainers (8 Teratas)' : 'Top 8 Gainers (24h)'}</span>
              </h3>
              <span className={`text-[10px] font-mono ${mutedText}`}>24J %</span>
            </div>
            <div className="space-y-1.5">
              {hydratedGainers.length > 0 ? (
                hydratedGainers
                  .slice(0, 8)
                  .map((coin, i) => renderMoverRow(coin, i + 1, 'GAINER'))
              ) : (
                <div className={`py-6 text-center text-xs font-mono ${mutedText}`}>—</div>
              )}
            </div>
          </div>

          {/* Kolom 2: Top Losers (8) */}
          <div
            className={`p-4 rounded-[2px] border ${cardSurface} ${
              moversTab !== 'LOSERS' ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 text-rose-400">
                <TrendingDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Top Losers (8 Teratas)' : 'Top 8 Losers (24h)'}</span>
              </h3>
              <span className={`text-[10px] font-mono ${mutedText}`}>24J %</span>
            </div>
            <div className="space-y-1.5">
              {hydratedLosers.length > 0 ? (
                hydratedLosers
                  .slice(0, 8)
                  .map((coin, i) => renderMoverRow(coin, i + 1, 'LOSER'))
              ) : (
                <div className={`py-6 text-center text-xs font-mono ${mutedText}`}>—</div>
              )}
            </div>
          </div>

          {/* Kolom 3: Volume Spike (8) */}
          <div
            className={`p-4 rounded-[2px] border ${cardSurface} ${
              moversTab !== 'SPIKES' ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 text-pink-400"
                title={
                  isId
                    ? 'Koin dengan lonjakan perputaran volume 24 jam tertinggi dibandingkan kapitalisasi pasarnya'
                    : 'Coins with highest 24h volume turnover relative to market cap'
                }
              >
                <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Volume Spike (8 Teratas)' : 'Volume Spike (Top 8)'}</span>
              </h3>
              <span className={`text-[10px] font-mono ${mutedText}`}>
                {isId ? 'Harga & 24J' : 'Price & 24h'}
              </span>
            </div>
            <div className="space-y-1.5">
              {hydratedSpikes.length > 0 ? (
                hydratedSpikes
                  .slice(0, 8)
                  .map((coin, i) => renderMoverRow(coin, i + 1, 'SPIKE'))
              ) : (
                <div className={`py-6 text-center text-xs font-mono ${mutedText}`}>—</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* BLOK 6: FUNDING RATE & OPEN INTEREST (RADAR DERIVATIF FUTURES)      */}
      {/* =================================================================== */}
      <section aria-label={isId ? 'Funding Rate dan Open Interest' : 'Funding & Open Interest'}>
        <div className="flex lg:hidden gap-1.5 mb-2.5">
          {[
            {
              id: 'NEG_FUNDING' as DerivativesMobileTab,
              label: isId ? 'Funding Negatif' : 'Neg Funding',
            },
            {
              id: 'POS_FUNDING' as DerivativesMobileTab,
              label: isId ? 'Funding Positif' : 'Pos Funding',
            },
            {
              id: 'OI_SURGE' as DerivativesMobileTab,
              label: isId ? 'OI Naik Cepat' : 'Fastest OI',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDerivTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-[2px] border text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                derivTab === tab.id
                  ? 'bg-pink-600 border-pink-500 text-white'
                  : `${subtleSurface} ${mutedText}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1. Funding Paling Negatif */}
          <div
            className={`p-4 rounded-[2px] border ${cardSurface} ${
              derivTab !== 'NEG_FUNDING' ? 'hidden lg:block' : ''
            }`}
          >
            <div
              className="flex items-center justify-between mb-3"
              title={
                isId
                  ? 'Kontrak perpetual dengan funding rate paling negatif: posisi Short sangat padat dan membayar biaya ke posisi Long (waspadai potensi short squeeze).'
                  : 'Most negative perpetual funding rates (crowded shorts paying longs).'
              }
            >
              <h3 className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Funding Paling Negatif' : 'Most Negative Funding'}</span>
              </h3>
              <span className={`text-[10px] font-mono ${mutedText}`}>Funding 8j</span>
            </div>
            <div className="space-y-1.5">
              {hydratedNegFunding.length > 0 ? (
                hydratedNegFunding.map((item) => (
                  <button
                    key={`neg-${item.symbol}`}
                    type="button"
                    onClick={() => onSelectSymbol(item.symbol, true)}
                    title={
                      isId
                        ? `Funding ${item.symbol}: ${formatSignedPct(item.fundingRatePct, 4, true)} — Klik untuk membuka Grafik Futures ${item.symbol}`
                        : `Open ${item.symbol} Futures chart`
                    }
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[2px] border text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                      isDark
                        ? 'bg-[#070b14] border-[#162032] hover:border-pink-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-pink-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CoinLogo symbol={item.symbol} size="sm" decorative showTooltip />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold truncate">
                          {item.baseAsset}
                          <span className="text-[10px] font-normal text-slate-500"> PERP</span>
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-400">
                          ${formatSmartCryptoPrice(item.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div>{renderSignedBadge(item.fundingRatePct, 4, 'text-xs')}</div>
                      <div className="text-[10px] font-mono tabular-nums">
                        {renderSignedBadge(item.change24h, 1, 'text-[10px]')}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div
                  className={`py-6 text-center text-xs font-mono ${mutedText}`}
                  title={
                    isId
                      ? 'Saat ini belum ada koin dengan funding rate bernilai negatif'
                      : 'No negative funding rates currently active'
                  }
                >
                  {isId ? 'Tidak ada funding negatif ekstrem saat ini' : '—'}
                </div>
              )}
            </div>
          </div>

          {/* 2. Funding Paling Positif */}
          <div
            className={`p-4 rounded-[2px] border ${cardSurface} ${
              derivTab !== 'POS_FUNDING' ? 'hidden lg:block' : ''
            }`}
          >
            <div
              className="flex items-center justify-between mb-3"
              title={
                isId
                  ? 'Kontrak perpetual dengan funding rate paling positif: posisi Long sangat padat dan membayar biaya ke posisi Short.'
                  : 'Most positive perpetual funding rates (crowded longs paying shorts).'
              }
            >
              <h3 className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Funding Paling Positif' : 'Most Positive Funding'}</span>
              </h3>
              <span className={`text-[10px] font-mono ${mutedText}`}>Funding 8j</span>
            </div>
            <div className="space-y-1.5">
              {hydratedPosFunding.length > 0 ? (
                hydratedPosFunding.map((item) => (
                  <button
                    key={`pos-${item.symbol}`}
                    type="button"
                    onClick={() => onSelectSymbol(item.symbol, true)}
                    title={
                      isId
                        ? `Funding ${item.symbol}: ${formatSignedPct(item.fundingRatePct, 4, true)} — Klik untuk membuka Grafik Futures ${item.symbol}`
                        : `Open ${item.symbol} Futures chart`
                    }
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[2px] border text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                      isDark
                        ? 'bg-[#070b14] border-[#162032] hover:border-pink-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-pink-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CoinLogo symbol={item.symbol} size="sm" decorative showTooltip />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold truncate">
                          {item.baseAsset}
                          <span className="text-[10px] font-normal text-slate-500"> PERP</span>
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-400">
                          ${formatSmartCryptoPrice(item.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div>{renderSignedBadge(item.fundingRatePct, 4, 'text-xs')}</div>
                      <div className="text-[10px] font-mono tabular-nums">
                        {renderSignedBadge(item.change24h, 1, 'text-[10px]')}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className={`py-6 text-center text-xs font-mono ${mutedText}`}>—</div>
              )}
            </div>
          </div>

          {/* 3. Open Interest Naik Paling Cepat */}
          <div
            className={`p-4 rounded-[2px] border ${cardSurface} ${
              derivTab !== 'OI_SURGE' ? 'hidden lg:block' : ''
            }`}
          >
            <div
              className="flex items-center justify-between mb-3"
              title={
                isId
                  ? 'Koin dengan pertumbuhan nilai kontrak terbuka (Open Interest) tercepat dalam 24 jam terakhir — menandakan arus modal baru masuk ke pasar futures.'
                  : 'Fastest 24-hour Open Interest growth across liquid perpetual contracts.'
              }
            >
              <h3 className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-pink-400 shrink-0" aria-hidden="true" />
                <span>{isId ? 'OI Naik Paling Cepat (24j)' : 'Fastest Rising OI (24h)'}</span>
              </h3>
              <span className={`text-[10px] font-mono ${mutedText}`}>Δ OI 24J</span>
            </div>
            <div className="space-y-1.5">
              {hydratedFastestOi.length > 0 ? (
                hydratedFastestOi.map((item) => (
                  <button
                    key={`oi-${item.symbol}`}
                    type="button"
                    onClick={() => onSelectSymbol(item.symbol, true)}
                    title={
                      isId
                        ? `Open Interest ${item.symbol}: ${formatCompactUsd(item.openInterestUsd, true)} (Perubahan 24j: ${formatSignedPct(item.oiChange24hPct, 2, true)}). Klik untuk buka Grafik Futures.`
                        : `Open ${item.symbol} Futures chart`
                    }
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[2px] border text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                      isDark
                        ? 'bg-[#070b14] border-[#162032] hover:border-pink-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-pink-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CoinLogo symbol={item.symbol} size="sm" decorative showTooltip />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold truncate">
                          {item.baseAsset}
                          <span className="text-[10px] font-normal text-slate-500">
                            {' '}
                            · OI {formatCompactUsd(item.openInterestUsd, isId)}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-400">
                          ${formatSmartCryptoPrice(item.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {renderSignedBadge(item.oiChange24hPct, 2, 'text-xs')}
                      {item.oiChange4hPct !== null && (
                        <div className={`text-[10px] font-mono tabular-nums ${mutedText}`}>
                          4j: {formatSignedPct(item.oiChange4hPct, 1, isId)}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div
                  className={`py-6 text-center text-xs font-mono ${mutedText}`}
                  title={
                    isId
                      ? 'Data pertumbuhan Open Interest sedang disinkronkan dari bursa berjangka'
                      : 'Open Interest history syncing'
                  }
                >
                  —
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* BLOK 7: PREFERENSI TAMPILAN AWAL & CATATAN KAKI DISCLAIMER          */}
      {/* =================================================================== */}
      <footer
        className={`p-3.5 rounded-[2px] border ${subtleSurface} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-[11px] font-mono`}
      >
        <div className="flex items-start sm:items-center gap-2 text-slate-400">
          <ShieldAlert className="w-4 h-4 text-pink-400 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <span>
            <strong className="text-slate-200">
              {isId ? 'Bukan nasihat keuangan:' : 'Not financial advice:'}
            </strong>{' '}
            {isId
              ? 'Seluruh angka dan ringkasan di halaman ini disusun otomatis dari data pasar real-time sebagai alat bantu riset, bukan rekomendasi jual/beli.'
              : 'All metrics and summaries are generated automatically from live market data for informational purposes only.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-slate-400">
            {isId ? 'Data & logo koin oleh ' : 'Coin data & logos by '}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 underline underline-offset-2"
            >
              CoinGecko
            </a>
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={() => onNavigateStage('settings')}
            className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 underline underline-offset-4 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-[2px]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isId
                ? 'Atur halaman awal di Pengaturan'
                : 'Configure startup page in Settings'}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
