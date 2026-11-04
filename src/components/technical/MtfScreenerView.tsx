import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Link2,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useMarketDataStore } from '../../stores/useMarketDataStore';
import { useWatchlistStore } from '../../stores/useWatchlistStore';
import { useTerminal } from '../../contexts/TerminalContext';
import { formatSmartCryptoPrice } from '../../services/marketDataValidator';
import {
  biasToActionSignal,
  computeMtfConfluence,
  DEFAULT_MTF_FILTERS,
  DEFAULT_MTF_SORT,
  filterMtfRows,
  hasActiveMtfFilters,
  MTF_TIMEFRAME_KEYS,
  MtfActionSignal,
  MtfQuickTab,
  MtfScreenerFilterState,
  MtfScreenerRowModel,
  MtfSortColumn,
  MtfSortConfig,
  MtfTimeframeKey,
  parseMtfStateFromSearchParams,
  serializeMtfStateToSearchParams,
  sortMtfRows,
} from '../../services/confluence/mtfScreenerLogic';
import { DataStatusBadge } from '../ui/DataStatusBadge';
import { CoinLogo } from '../ui/CoinLogo';

const VIRTUAL_ROW_HEIGHT_PX = 52;
const VIRTUAL_OVERSCAN_ROWS = 4;
const VIRTUAL_VIEWPORT_FALLBACK_PX = 640;

interface MtfScreenerViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface ScreenerTelemetry {
  totalCoins: number;
  fullyHydratedCoins: number;
  partiallyHydratedCoins: number;
  hydrationPct: number;
  sourceExchange: string;
  usedWeight1m: number;
  budgetWeight1m: number;
}

function formatCompactUsd(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val) || val <= 0) return '—';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function formatExactTime(ts: number | null, isId: boolean): string {
  if (!ts) return '—';
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

export const MtfScreenerView: React.FC<MtfScreenerViewProps> = ({
  onSelectCoin,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const {
    selectedSymbol,
    selectedTimeframe,
    selectedExchange,
    selectedMarketType,
    handleExchangeChange,
    handleMarketTypeChange,
    evaluation,
  } = useTerminal();

  // Single Source of Truth price store (shared with Header, Chart, Order Book, Calculator)
  const ssotTickers = useMarketDataStore((s) => s.tickers);
  const ingestBatchTickers = useMarketDataStore((s) => s.ingestBatchTickers);

  // Shared Watchlist store (synced with WatchlistPage)
  const watchlistItems = useWatchlistStore((s) => s.items);
  const toggleWatchlistSymbol = useWatchlistStore((s) => s.toggleSymbol);
  const watchedSet = useMemo(
    () => new Set(watchlistItems.map((i) => i.symbol.toUpperCase())),
    [watchlistItems]
  );

  // Initialize filter & sort state from URL query parameters on mount
  const initialUrlState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { filters: DEFAULT_MTF_FILTERS, sort: DEFAULT_MTF_SORT };
    }
    return parseMtfStateFromSearchParams(window.location.search);
  }, []);

  const [filters, setFilters] = useState<MtfScreenerFilterState>(initialUrlState.filters);
  const [sortConfig, setSortConfig] = useState<MtfSortConfig>(initialUrlState.sort);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(() => {
    const f = initialUrlState.filters;
    return (
      f.volume24hMin !== null ||
      f.marketCapMin !== null ||
      f.marketCapMax !== null ||
      f.change24hMin !== null ||
      f.change24hMax !== null ||
      f.rsiMin !== null ||
      f.rsiMax !== null ||
      f.fundingMin !== null ||
      f.fundingMax !== null ||
      Object.keys(f.tfFilters).length > 0
    );
  });
  const [showRulesInfo, setShowRulesInfo] = useState<boolean>(false);

  // Pagination & Virtualized Viewport state (50/100/All virtualized rows)
  const [pageSize, setPageSize] = useState<50 | 100 | 300>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const tableViewportRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(VIRTUAL_VIEWPORT_FALLBACK_PX);

  // Server snapshot state
  const [serverRows, setServerRows] = useState<MtfScreenerRowModel[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<ScreenerTelemetry>({
    totalCoins: 0,
    fullyHydratedCoins: 0,
    partiallyHydratedCoins: 0,
    hydrationPct: 100,
    sourceExchange: 'BINANCE_FUTURES',
    usedWeight1m: 0,
    budgetWeight1m: 1450,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const priorityRef = useRef<string[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Persist filter & sort state in URL query parameters without triggering navigation reloads
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = serializeMtfStateToSearchParams(
      filters,
      sortConfig,
      window.location.search
    );
    const nextQuery = params.toString();
    const nextUrl = nextQuery
      ? `${window.location.pathname}?${nextQuery}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [filters, sortConfig]);

  // Reset to Page 1 whenever filter criteria or sort column/direction changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig, pageSize]);

  const fetchScreenerSnapshot = useCallback(
    async (signal?: AbortSignal, force = false) => {
      try {
        setIsRefreshing(true);
        setFetchError(null);

        const params = new URLSearchParams();
        if (force) params.set('force', 'true');

        const prioList = Array.from(
          new Set([selectedSymbol, ...priorityRef.current].filter(Boolean))
        ).slice(0, 55);
        if (prioList.length > 0) {
          params.set('priority', prioList.join(','));
        }

        const res = await fetch(`/api/v1/mtf-screener?${params.toString()}`, { signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        const incomingRows: MtfScreenerRowModel[] = Array.isArray(json?.data) ? json.data : [];
        const now = Date.now();

        // Feed live prices into Single Source of Truth (SSOT automatically preserves fresher WS ticks <5s old)
        if (incomingRows.length > 0) {
          ingestBatchTickers(
            incomingRows
              .filter((r) => typeof r.price === 'number' && r.price > 0)
              .map((r) => ({
                symbol: r.symbol,
                price: r.price,
                change24h: r.change24h ?? undefined,
                volume24h:
                  typeof r.volume24h === 'number' && r.volume24h > 0
                    ? formatCompactUsd(r.volume24h)
                    : undefined,
              })),
            'REST',
            typeof json?.updatedAt === 'number' ? json.updatedAt : now
          );
        }

        setServerRows(incomingRows);
        setLastFetchedAt(typeof json?.updatedAt === 'number' ? json.updatedAt : now);
        setTelemetry({
          totalCoins: Number(json?.totalCoins ?? incomingRows.length),
          fullyHydratedCoins: Number(json?.fullyHydratedCoins ?? 0),
          partiallyHydratedCoins: Number(json?.partiallyHydratedCoins ?? 0),
          hydrationPct: Number(json?.hydrationPct ?? 100),
          sourceExchange: String(json?.sourceExchange || 'BINANCE_FUTURES'),
          usedWeight1m: Number(json?.rateLimitTelemetry?.usedWeight1m ?? 0),
          budgetWeight1m: Number(json?.rateLimitTelemetry?.budgetWeight1m ?? 1450),
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setFetchError(
          isId
            ? 'Gagal memperbarui sebagian snapshot MTF dari server. Menampilkan cache terakhir.'
            : 'Failed to refresh MTF snapshot from server. Displaying latest cached state.'
        );
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedSymbol, ingestBatchTickers, isId]
  );

  // Adaptive polling: poll every 4.5s while background hydration < 100%, then every 25s once hydrated
  useEffect(() => {
    const controller = new AbortController();
    void fetchScreenerSnapshot(controller.signal, false);

    const pollMs = telemetry.hydrationPct < 100 ? 4500 : 25_000;
    const timer = window.setInterval(() => {
      void fetchScreenerSnapshot(undefined, false);
    }, pollMs);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [fetchScreenerSnapshot, telemetry.hydrationPct]);

  // Overlay SSOT live prices + Main Chart active timeframe consensus onto all 200+ rows
  const liveRows = useMemo<MtfScreenerRowModel[]>(() => {
    return serverRows.map((row) => {
      const ssot = ssotTickers[row.symbol];
      const effectivePrice = ssot?.price && ssot.price > 0 ? ssot.price : row.price;
      const effectiveChange =
        typeof ssot?.change24h === 'number' && Number.isFinite(ssot.change24h)
          ? ssot.change24h
          : row.change24h;

      let signals = row.signals;
      let confluence = row.confluence;
      let rsi14 = row.rsi14;

      // Guarantee 100% instant parity with Main Chart for the active symbol & active timeframe
      if (
        row.symbol === selectedSymbol &&
        evaluation &&
        evaluation.symbol === selectedSymbol &&
        MTF_TIMEFRAME_KEYS.includes(selectedTimeframe as MtfTimeframeKey)
      ) {
        const activeTf = selectedTimeframe as MtfTimeframeKey;
        const syncedAction = biasToActionSignal(
          evaluation.marketBias,
          evaluation.confluenceScore
        );
        if (signals[activeTf] !== syncedAction) {
          signals = { ...signals, [activeTf]: syncedAction };
          confluence = computeMtfConfluence(signals);
        }
        if (activeTf === '1H' && typeof evaluation.indicators?.rsi?.rsi14 === 'number') {
          rsi14 = Number(evaluation.indicators.rsi.rsi14.toFixed(1));
        }
      }

      return {
        ...row,
        price: effectivePrice,
        change24h: effectiveChange,
        rsi14,
        signals,
        confluence,
      };
    });
  }, [serverRows, ssotTickers, selectedSymbol, selectedTimeframe, evaluation]);

  // Counts for Quick Tabs (computed on base dataset respecting search + hideStablecoins)
  const quickTabCounts = useMemo(() => {
    const baseFiltered = filterMtfRows(liveRows, {
      ...filters,
      quickTab: 'ALL',
    });
    let bull100 = 0;
    let bear100 = 0;
    let bullGte5 = 0;
    let bearGte5 = 0;
    let mixed = 0;

    for (const r of baseFiltered) {
      if (r.confluence.isAllBull) bull100++;
      if (r.confluence.isAllBear) bear100++;
      if (r.confluence.isGte5Bull) bullGte5++;
      if (r.confluence.isGte5Bear) bearGte5++;
      if (r.confluence.isMixed) mixed++;
    }

    return {
      ALL: baseFiltered.length,
      BULL_100: bull100,
      BEAR_100: bear100,
      BULL_GTE5: bullGte5,
      BEAR_GTE5: bearGte5,
      MIXED: mixed,
    };
  }, [liveRows, filters]);

  // Filtered + Sorted rows (< 15ms for 240+ rows)
  const filteredAndSortedRows = useMemo(() => {
    const filtered = filterMtfRows(liveRows, filters);
    return sortMtfRows(filtered, sortConfig);
  }, [liveRows, filters, sortConfig]);

  const totalFiltered = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const visiblePageRows = useMemo(() => {
    const startIdx = (safePage - 1) * pageSize;
    const slice = filteredAndSortedRows.slice(startIdx, startIdx + pageSize);
    priorityRef.current = slice.map((r) => r.symbol);
    return slice;
  }, [filteredAndSortedRows, safePage, pageSize]);

  // Reset virtual scroll position when page, filter, or sort changes
  useEffect(() => {
    setScrollTop(0);
    if (tableViewportRef.current) {
      tableViewportRef.current.scrollTop = 0;
    }
  }, [safePage, pageSize, filters, sortConfig]);

  // Measure scrollable viewport height for accurate row windowing
  useEffect(() => {
    const el = tableViewportRef.current;
    if (!el) return;
    const syncHeight = () => {
      const h = el.clientHeight;
      if (h > 0) setViewportHeight(h);
    };
    syncHeight();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const virtualWindow = useMemo(() => {
    const total = visiblePageRows.length;
    if (total === 0) {
      return { startIdx: 0, endIdx: 0 };
    }
    const startIdx = Math.max(
      0,
      Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT_PX) - VIRTUAL_OVERSCAN_ROWS
    );
    const endIdx = Math.min(
      total,
      Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ROW_HEIGHT_PX) + VIRTUAL_OVERSCAN_ROWS
    );
    return { startIdx, endIdx };
  }, [visiblePageRows.length, scrollTop, viewportHeight]);

  const handleSortColumn = useCallback((column: MtfSortColumn) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === 'desc' ? 'asc' : 'desc',
        };
      }
      // Default direction: ascending for alphabetical symbol, descending for metrics/signals
      return {
        column,
        direction: column === 'symbol' ? 'asc' : 'desc',
      };
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_MTF_FILTERS);
    setSortConfig(DEFAULT_MTF_SORT);
    setCurrentPage(1);
    showToast(isId ? 'Filter & urutan dikembalikan ke default' : 'Filters & sorting reset to default');
  }, [isId, showToast]);

  const handleCopyShareLink = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(
        isId
          ? 'Tautan filter Screener MTF berhasil disalin!'
          : 'Shareable MTF Screener URL copied!'
      );
    } catch {
      showToast(isId ? 'URL telah diperbarui di bilah alamat browser' : 'URL updated in address bar');
    }
  }, [isId, showToast]);

  const handleOpenChart = useCallback(
    (row: MtfScreenerRowModel) => {
      // Align Main Chart to Binance USDT-M Futures so 100% of 240 perpetual pairs & signals match identically
      if (selectedExchange !== 'BINANCE') {
        handleExchangeChange('BINANCE');
      }
      if (selectedMarketType !== 'FUTURES') {
        handleMarketTypeChange('FUTURES');
      }
      if (onSelectCoin) {
        onSelectCoin(row.symbol);
      }
    },
    [
      selectedExchange,
      selectedMarketType,
      handleExchangeChange,
      handleMarketTypeChange,
      onSelectCoin,
    ]
  );

  const handleOpenTrade = useCallback(
    (row: MtfScreenerRowModel) => {
      if (row.spotAvailable === false && selectedMarketType !== 'FUTURES') {
        handleMarketTypeChange('FUTURES');
      }
      if (onNavigateToTrade) {
        onNavigateToTrade(row.symbol);
      }
    },
    [selectedMarketType, handleMarketTypeChange, onNavigateToTrade]
  );

  const handleToggleWatchlist = useCallback(
    (row: MtfScreenerRowModel) => {
      const res = toggleWatchlistSymbol({
        symbol: row.symbol,
        name: row.name,
        price: row.price,
        change24h: row.change24h ?? 0,
        volume24h: row.volume24h ?? undefined,
        marketCap: row.marketCap ?? undefined,
        confluenceScore:
          row.confluence.confluenceRank >= 0 ? row.confluence.confluenceRank : 70,
      });
      showToast(
        res.added
          ? isId
            ? `${res.symbol} ditambahkan ke Watchlist`
            : `${res.symbol} added to Watchlist`
          : isId
          ? `${res.symbol} dihapus dari Watchlist`
          : `${res.symbol} removed from Watchlist`
      );
    },
    [toggleWatchlistSymbol, showToast, isId]
  );

  const parseMillionInput = (val: string): number | null => {
    if (val.trim() === '') return null;
    const num = Number(val);
    return Number.isFinite(num) && num >= 0 ? num * 1_000_000 : null;
  };

  const parsePlainNumberInput = (val: string): number | null => {
    if (val.trim() === '') return null;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  };

  const renderSortIcon = (column: MtfSortColumn) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-45 shrink-0" aria-hidden="true" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-pink-400 shrink-0" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3 h-3 text-pink-400 shrink-0" aria-hidden="true" />
    );
  };

  const getAriaSort = (
    column: MtfSortColumn
  ): 'ascending' | 'descending' | 'none' => {
    if (sortConfig.column !== column) return 'none';
    return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
  };

  const renderSignalCell = (
    sig: MtfActionSignal | null,
    tf: MtfTimeframeKey,
    score: number | undefined,
    isActiveCell: boolean,
    rowError?: string | null
  ) => {
    if (sig === null) {
      const tip = rowError
        ? isId
          ? `Data candle ${tf} belum tersedia (${rowError})`
          : `${tf} candle data unavailable (${rowError})`
        : isId
        ? `Sedang memuat & menghitung candle ${tf} di server...`
        : `Hydrating ${tf} candles on server...`;
      return (
        <span
          title={tip}
          aria-label={tip}
          className={`inline-block px-2 py-0.5 rounded-[3px] text-[11px] font-mono cursor-help ${
            isDark
              ? 'text-slate-400 bg-slate-900/80 border border-slate-800'
              : 'text-slate-500 bg-slate-100 border border-slate-200'
          }`}
        >
          —
        </span>
      );
    }

    const ringClass = isActiveCell ? 'ring-1 ring-pink-400' : '';
    const scoreTip =
      typeof score === 'number'
        ? `${tf}: ${sig} (Skor Konsensus ${score}/100)`
        : `${tf}: ${sig}`;

    if (sig === 'BUY') {
      return (
        <span
          title={scoreTip}
          className={`inline-block min-w-[44px] text-center px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold tracking-wide ${
            isDark
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/45'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          } ${ringClass}`}
        >
          BUY
        </span>
      );
    }

    if (sig === 'SELL') {
      return (
        <span
          title={scoreTip}
          className={`inline-block min-w-[44px] text-center px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold tracking-wide ${
            isDark
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/45'
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          } ${ringClass}`}
        >
          SELL
        </span>
      );
    }

    return (
      <span
        title={scoreTip}
        className={`inline-block min-w-[44px] text-center px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold tracking-wide ${
          isDark
            ? 'bg-slate-800 text-slate-300 border border-slate-700'
            : 'bg-slate-200 text-slate-700 border border-slate-300'
        } ${ringClass}`}
      >
        FLAT
      </span>
    );
  };

  const activeAdvancedFilterCount = useMemo(() => {
    let c = 0;
    if (filters.volume24hMin !== null) c++;
    if (filters.marketCapMin !== null || filters.marketCapMax !== null) c++;
    if (filters.change24hMin !== null || filters.change24hMax !== null) c++;
    if (filters.rsiMin !== null || filters.rsiMax !== null) c++;
    if (filters.fundingMin !== null || filters.fundingMax !== null) c++;
    if (filters.hideStablecoins) c++;
    for (const tf of MTF_TIMEFRAME_KEYS) {
      if (filters.tfFilters[tf] && filters.tfFilters[tf] !== 'ANY') c++;
    }
    return c;
  }, [filters]);

  const quickTabs: Array<{ id: MtfQuickTab; labelId: string; labelEn: string; count: number }> = [
    { id: 'ALL', labelId: 'Semua', labelEn: 'All', count: quickTabCounts.ALL },
    {
      id: 'BULL_100',
      labelId: '100% Bullish',
      labelEn: '100% Bullish',
      count: quickTabCounts.BULL_100,
    },
    {
      id: 'BEAR_100',
      labelId: '100% Bearish',
      labelEn: '100% Bearish',
      count: quickTabCounts.BEAR_100,
    },
    {
      id: 'BULL_GTE5',
      labelId: '≥5/6 Bullish',
      labelEn: '≥5/6 Bullish',
      count: quickTabCounts.BULL_GTE5,
    },
    {
      id: 'BEAR_GTE5',
      labelId: '≥5/6 Bearish',
      labelEn: '≥5/6 Bearish',
      count: quickTabCounts.BEAR_GTE5,
    },
    { id: 'MIXED', labelId: 'Mixed', labelEn: 'Mixed', count: quickTabCounts.MIXED },
  ];

  const startRowNum = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRowNum = Math.min(totalFiltered, safePage * pageSize);

  return (
    <div className="space-y-4">
      {/* Header & Status Bar */}
      <div
        className={`p-4 sm:p-5 rounded-xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-lg bg-pink-500/15 text-pink-400 border border-pink-500/30 shrink-0">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {isId
                    ? 'Screener Multi-Timeframe (USDT-M Perpetual)'
                    : 'Multi-Timeframe Screener (USDT-M Perpetual)'}
                </h1>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-[3px] font-mono font-semibold border ${
                    isDark
                      ? 'bg-slate-900 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {telemetry.totalCoins > 0 ? `${telemetry.totalCoins} Koin` : '200+ Koin'} · 1m–1D
                </span>
                <DataStatusBadge
                  symbol={selectedSymbol}
                  scope="screener"
                  updatedAtOverride={lastFetchedAt}
                  lang={lang}
                  compact
                />
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {isId
                  ? ' Alam semesta dinamis Top 240 Binance Futures USDT-M berdasarkan volume 24j. Harga live dari Single Source of Truth & sinyal selaras 100% dengan Grafik Utama.'
                  : 'Dynamic Top 240 Binance Futures USDT-M universe by 24h volume. Live SSOT pricing & 100% signal parity with Main Chart.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span
              className={`px-2.5 py-1.5 rounded-lg border tabular-nums ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title={
                isId
                  ? 'Waktu pembaruan snapshot terakhir dari server'
                  : 'Last server snapshot update timestamp'
              }
            >
              {isId ? 'Update:' : 'Updated:'} {formatExactTime(lastFetchedAt, isId)}
            </span>

            <button
              type="button"
              onClick={() => setShowRulesInfo((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                showRulesInfo
                  ? 'bg-pink-600 text-white border-pink-500'
                  : isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>{isId ? 'Aturan Sinyal' : 'Signal Rules'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
              title={
                isId
                  ? 'Salin URL dengan filter & urutan saat ini'
                  : 'Copy URL with active filters & sort'
              }
            >
              <Link2 className="w-3.5 h-3.5 text-pink-400" />
              <span>{isId ? 'Bagikan Filter' : 'Share URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchScreenerSnapshot(undefined, true)}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-pink-400 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isId ? 'Refresh' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Background Hydration Progress Bar (shown only while server worker warms up remaining timeframes) */}
        {telemetry.hydrationPct < 100 && telemetry.totalCoins > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/70">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>
                {isId
                  ? `Menghitung matriks candle 6-timeframe di server (batch rate-limit-safe): ${telemetry.fullyHydratedCoins}/${telemetry.totalCoins} koin lengkap`
                  : `Computing 6-timeframe candle matrix on server (rate-limit-safe): ${telemetry.fullyHydratedCoins}/${telemetry.totalCoins} coins ready`}
              </span>
              <span className="font-bold text-pink-400 tabular-nums">
                {telemetry.hydrationPct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-all duration-300"
                style={{ width: `${Math.max(5, telemetry.hydrationPct)}%` }}
              />
            </div>
          </div>
        )}

        {/* Documented Signal & Cache Rules Panel */}
        {showRulesInfo && (
          <div
            className={`mt-3 p-3.5 rounded-lg border text-xs font-mono space-y-1.5 ${
              isDark
                ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="font-bold text-pink-400">
              {isId
                ? 'Spesifikasi Deterministik Sinyal Per Timeframe & Cache Server'
                : 'Deterministic Per-Timeframe Signal & Server Cache Specification'}
            </div>
            <p>
              • <strong>BUY</strong>:{' '}
              {isId
                ? 'Skor Konsensus 12-Indikator ≥ 58 (Bullish / Strong Bullish — identik 100% dengan mesin analisis Grafik Utama pada 150 candle).'
                : '12-Indicator Consensus Score ≥ 58 (Bullish / Strong Bullish — 100% identical to Main Chart engine on 150 candles).'}
            </p>
            <p>
              • <strong>SELL</strong>:{' '}
              {isId
                ? 'Skor Konsensus 12-Indikator ≤ 42 (Bearish / Strong Bearish).'
                : '12-Indicator Consensus Score ≤ 42 (Bearish / Strong Bearish).'}
            </p>
            <p>
              • <strong>FLAT</strong>:{' '}
              {isId
                ? 'Skor Konsensus 43–57 (Netral / keseimbangan tren).'
                : 'Consensus Score 43–57 (Neutral / equilibrium).'}
            </p>
            <p className="text-[11px] opacity-85">
              • <strong>TTL Cache per Timeframe</strong>: 1m = 30 dtk · 5m = 75 dtk · 15m = 2,5 mnt · 1H = 5 mnt · 4H = 10 mnt · 1D = 15 mnt.
            </p>
          </div>
        )}

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 px-3 py-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {fetchError && (
          <div
            role="alert"
            className="mt-3 px-3 py-2 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div
        className={`p-4 rounded-xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Row 1: Search + Quick Alignment Tabs + Hide Stablecoins + Advanced Toggle + Reset */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Symbol Search */}
          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder={isId ? 'Cari simbol (mis. BTC, SOL, PEPE)...' : 'Search symbol (BTC, SOL)...'}
              aria-label={isId ? 'Cari simbol koin' : 'Search coin symbol'}
              className={`w-full pl-9 pr-8 py-2 rounded-lg border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'
              }`}
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                aria-label={isId ? 'Hapus pencarian' : 'Clear search'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Tabs */}
          <div
            role="tablist"
            aria-label={isId ? 'Filter cepat konfluensi' : 'Confluence quick filters'}
            className={`flex flex-wrap items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {quickTabs.map((tab) => {
              const active = filters.quickTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilters((prev) => ({ ...prev, quickTab: tab.id }))}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    active
                      ? tab.id.includes('BULL')
                        ? 'bg-emerald-500 text-slate-950'
                        : tab.id.includes('BEAR')
                        ? 'bg-rose-600 text-white'
                        : 'bg-pink-600 text-white'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white'
                  }`}
                >
                  <span>{isId ? tab.labelId : tab.labelEn}</span>
                  <span className="ml-1.5 opacity-80 tabular-nums">({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Hide Stablecoins + Advanced Filters + Reset */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono cursor-pointer select-none ${
                filters.hideStablecoins
                  ? 'bg-pink-500/15 border-pink-500/50 text-pink-300'
                  : isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={filters.hideStablecoins}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, hideStablecoins: e.target.checked }))
                }
                className="accent-pink-500 rounded cursor-pointer"
              />
              <span>{isId ? 'Hide Stablecoins' : 'Hide Stablecoins'}</span>
            </label>

            <button
              type="button"
              aria-expanded={showAdvancedFilters}
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                showAdvancedFilters || activeAdvancedFilterCount > 0
                  ? 'bg-pink-600/20 border-pink-500/50 text-pink-300'
                  : isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isId ? 'Filter Lanjutan' : 'Advanced Filters'}</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-pink-600 text-white text-[10px] tabular-nums">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </button>

            {(hasActiveMtfFilters(filters) ||
              sortConfig.column !== DEFAULT_MTF_SORT.column ||
              sortConfig.direction !== DEFAULT_MTF_SORT.direction) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  isDark
                    ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/40 text-rose-300'
                    : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters + Per-Timeframe Matrix Selectors */}
        {showAdvancedFilters && (
          <div
            className={`pt-3 border-t space-y-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            {/* Numeric Range Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
              {/* Volume 24h Min ($M) */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isId ? 'Volume 24j Min ($ Juta)' : '24h Volume Min ($M)'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={
                    filters.volume24hMin !== null ? filters.volume24hMin / 1_000_000 : ''
                  }
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      volume24hMin: parseMillionInput(e.target.value),
                    }))
                  }
                  placeholder="e.g. 25 ($25M)"
                  className={`w-full px-2.5 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Market Cap Min/Max ($M) */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isId ? 'Market Cap ($ Juta Min–Maks)' : 'Market Cap ($M Min–Max)'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={
                      filters.marketCapMin !== null ? filters.marketCapMin / 1_000_000 : ''
                    }
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        marketCapMin: parseMillionInput(e.target.value),
                      }))
                    }
                    placeholder="Min"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={
                      filters.marketCapMax !== null ? filters.marketCapMax / 1_000_000 : ''
                    }
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        marketCapMax: parseMillionInput(e.target.value),
                      }))
                    }
                    placeholder="Max"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* 24h Change (%) */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isId ? 'Perubahan 24j (% Min–Maks)' : '24h Change (% Min–Max)'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    step="any"
                    value={filters.change24hMin ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        change24hMin: parsePlainNumberInput(e.target.value),
                      }))
                    }
                    placeholder="-10"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="number"
                    step="any"
                    value={filters.change24hMax ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        change24hMax: parsePlainNumberInput(e.target.value),
                      }))
                    }
                    placeholder="+25"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* RSI (14) Min/Max */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  RSI (14) (Min–Maks)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={filters.rsiMin ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        rsiMin: parsePlainNumberInput(e.target.value),
                      }))
                    }
                    placeholder="30"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={filters.rsiMax ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        rsiMax: parsePlainNumberInput(e.target.value),
                      }))
                    }
                    placeholder="70"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Funding Rate (%) Min/Max */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Funding Rate (% Min–Maks)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    step="0.005"
                    value={filters.fundingMin ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        fundingMin: parsePlainNumberInput(e.target.value),
                      }))
                    }
                    placeholder="-0.05"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="number"
                    step="0.005"
                    value={filters.fundingMax ?? ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        fundingMax: parsePlainNumberInput(e.target.value),
                      }))
                    }
                    placeholder="0.05"
                    className={`w-full px-2 py-1.5 rounded-lg border tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Per-Timeframe Exact Filter (e.g. 4H = BUY && 1D = BUY) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">
                {isId ? 'Filter per Timeframe:' : 'Per-Timeframe Filter:'}
              </span>
              {MTF_TIMEFRAME_KEYS.map((tf) => {
                const selectedVal = filters.tfFilters[tf] || 'ANY';
                return (
                  <div
                    key={tf}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                      selectedVal !== 'ANY'
                        ? 'border-pink-500/60 bg-pink-500/10'
                        : isDark
                        ? 'border-slate-800 bg-slate-900'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <label
                      htmlFor={`mtf-filter-${tf}`}
                      className="text-[11px] font-bold text-slate-300"
                    >
                      {tf}:
                    </label>
                    <select
                      id={`mtf-filter-${tf}`}
                      value={selectedVal}
                      onChange={(e) => {
                        const val = e.target.value as MtfActionSignal | 'ANY';
                        setFilters((prev) => {
                          const nextTf = { ...prev.tfFilters };
                          if (val === 'ANY') delete nextTf[tf];
                          else nextTf[tf] = val;
                          return { ...prev, tfFilters: nextTf };
                        });
                      }}
                      className={`bg-transparent font-bold text-xs focus:outline-none cursor-pointer ${
                        selectedVal === 'BUY'
                          ? 'text-emerald-400'
                          : selectedVal === 'SELL'
                          ? 'text-rose-400'
                          : isDark
                          ? 'text-slate-200'
                          : 'text-slate-800'
                      }`}
                    >
                      <option value="ANY" className="bg-slate-900 text-slate-200">
                        {isId ? 'Semua' : 'Any'}
                      </option>
                      <option value="BUY" className="bg-slate-900 text-emerald-400">
                        BUY
                      </option>
                      <option value="SELL" className="bg-slate-900 text-rose-400">
                        SELL
                      </option>
                      <option value="FLAT" className="bg-slate-900 text-slate-300">
                        FLAT
                      </option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Screener Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div
          ref={tableViewportRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          className="overflow-auto max-h-[640px]"
        >
          <table className="w-full min-w-[1120px] text-left text-xs font-mono tabular-nums border-collapse">
            <thead className="sticky top-0 z-20">
              <tr
                className={`border-b ${
                  isDark
                    ? 'bg-[#0f172a] border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <th
                  scope="col"
                  aria-sort={getAriaSort('symbol')}
                  className={`py-3 px-3 sticky left-0 z-30 ${
                    isDark ? 'bg-[#111b30]' : 'bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSortColumn('symbol')}
                    className="flex items-center gap-1.5 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1 -mx-1"
                  >
                    <span>{isId ? 'Koin' : 'Coin'}</span>
                    {renderSortIcon('symbol')}
                  </button>
                </th>

                <th scope="col" aria-sort={getAriaSort('price')} className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSortColumn('price')}
                    className="ml-auto flex items-center justify-end gap-1 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1"
                  >
                    <span>{isId ? 'Harga' : 'Price'}</span>
                    {renderSortIcon('price')}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={getAriaSort('change24h')}
                  className="py-3 px-2.5 text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSortColumn('change24h')}
                    className="ml-auto flex items-center justify-end gap-1 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1"
                  >
                    <span>24h %</span>
                    {renderSortIcon('change24h')}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={getAriaSort('volume24h')}
                  className="py-3 px-2.5 text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSortColumn('volume24h')}
                    className="ml-auto flex items-center justify-end gap-1 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1"
                  >
                    <span>{isId ? 'Volume 24j' : '24h Vol'}</span>
                    {renderSortIcon('volume24h')}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={getAriaSort('rsi14')}
                  className="py-3 px-2.5 text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSortColumn('rsi14')}
                    className="ml-auto flex items-center justify-end gap-1 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1"
                  >
                    <span>RSI</span>
                    {renderSortIcon('rsi14')}
                  </button>
                </th>

                <th
                  scope="col"
                  aria-sort={getAriaSort('fundingRate')}
                  className="py-3 px-2.5 text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSortColumn('fundingRate')}
                    className="ml-auto flex items-center justify-end gap-1 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1"
                  >
                    <span>Funding</span>
                    {renderSortIcon('fundingRate')}
                  </button>
                </th>

                {MTF_TIMEFRAME_KEYS.map((tf) => (
                  <th
                    key={tf}
                    scope="col"
                    aria-sort={getAriaSort(tf)}
                    className="py-3 px-2 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => handleSortColumn(tf)}
                      className="mx-auto flex items-center justify-center gap-1 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1"
                    >
                      <span>{tf}</span>
                      {renderSortIcon(tf)}
                    </button>
                  </th>
                ))}

                <th
                  scope="col"
                  aria-sort={getAriaSort('confluence')}
                  className="py-3 px-3 text-left"
                >
                  <button
                    type="button"
                    onClick={() => handleSortColumn('confluence')}
                    className="flex items-center gap-1.5 font-bold hover:text-pink-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1 -mx-1"
                  >
                    <span>{isId ? 'Konfluensi' : 'Confluence'}</span>
                    {renderSortIcon('confluence')}
                  </button>
                </th>

                <th scope="col" className="py-3 px-3 text-right">
                  <span className="font-bold">{isId ? 'Aksi' : 'Actions'}</span>
                </th>
              </tr>
            </thead>

            <tbody
              className={`divide-y ${
                isDark ? 'divide-slate-800/70' : 'divide-slate-200'
              }`}
            >
              {isInitialLoading && serverRows.length === 0 ? (
                // Skeleton loading state
                Array.from({ length: 12 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-800" />
                        <div className="h-3.5 w-24 rounded bg-slate-800" />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="h-3.5 w-20 rounded bg-slate-800 ml-auto" />
                    </td>
                    <td className="py-3 px-2.5 text-right">
                      <div className="h-3.5 w-14 rounded bg-slate-800 ml-auto" />
                    </td>
                    <td className="py-3 px-2.5 text-right">
                      <div className="h-3.5 w-16 rounded bg-slate-800 ml-auto" />
                    </td>
                    <td className="py-3 px-2.5 text-right">
                      <div className="h-3.5 w-10 rounded bg-slate-800 ml-auto" />
                    </td>
                    <td className="py-3 px-2.5 text-right">
                      <div className="h-3.5 w-14 rounded bg-slate-800 ml-auto" />
                    </td>
                    {MTF_TIMEFRAME_KEYS.map((tf) => (
                      <td key={tf} className="py-3 px-2 text-center">
                        <div className="h-4 w-11 rounded bg-slate-800 mx-auto" />
                      </td>
                    ))}
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-28 rounded bg-slate-800" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="h-6 w-28 rounded bg-slate-800 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : visiblePageRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 px-4 text-center">
                    <p className="text-sm font-bold text-slate-300">
                      {isId
                        ? 'Tidak ada koin yang cocok dengan kriteria filter saat ini.'
                        : 'No coins match the active filter criteria.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-3 px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold cursor-pointer"
                    >
                      {isId ? 'Reset Semua Filter' : 'Reset All Filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                visiblePageRows.map((row, rowIdx) => {
                  // Virtualized row window: offscreen rows do NOT mount <CoinLogo /> or action cells
                  if (rowIdx < virtualWindow.startIdx || rowIdx >= virtualWindow.endIdx) {
                    return (
                      <tr
                        key={`spacer-${row.symbol}`}
                        aria-hidden="true"
                        className="h-[52px] pointer-events-none"
                      >
                        <td colSpan={14} className="p-0 border-0" />
                      </tr>
                    );
                  }

                  try {
                    const isSelected = row.symbol === selectedSymbol;
                    const isWatched = watchedSet.has(row.symbol.toUpperCase());

                    return (
                      <tr
                        key={row.symbol}
                        className={`h-[52px] transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-pink-500/12'
                              : 'bg-pink-50'
                            : isDark
                            ? 'hover:bg-slate-800/40'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Sticky Symbol Column */}
                        <td
                          className={`py-2 px-3 sticky left-0 z-10 ${
                            isSelected
                              ? isDark
                                ? 'bg-[#1f1630]'
                                : 'bg-pink-50'
                              : isDark
                              ? 'bg-[#0f172a]'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleWatchlist(row)}
                              aria-label={
                                isWatched
                                  ? isId
                                    ? `Hapus ${row.symbol} dari Watchlist`
                                    : `Remove ${row.symbol} from Watchlist`
                                  : isId
                                  ? `Tambah ${row.symbol} ke Watchlist`
                                  : `Add ${row.symbol} to Watchlist`
                              }
                              title={
                                isWatched
                                  ? isId
                                    ? 'Tersimpan di Watchlist (klik untuk hapus)'
                                    : 'In Watchlist (click to remove)'
                                  : isId
                                  ? 'Tambah ke Watchlist'
                                  : 'Add to Watchlist'
                              }
                              className="p-1 rounded hover:bg-slate-800/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 shrink-0"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  isWatched
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-500 hover:text-amber-300'
                                }`}
                              />
                            </button>

                            <CoinLogo
                              symbol={row.symbol}
                              size="sm"
                              decorative
                              showTooltip
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-bold truncate ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                  }`}
                                >
                                  {row.symbol}
                                </span>
                                {isSelected && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold">
                                    AKTIF
                                  </span>
                                )}
                                {row.rowError && (
                                  <span
                                    title={row.rowError}
                                    aria-label={row.rowError}
                                    className="text-amber-400 cursor-help"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {row.marketCap
                                  ? `MCap ${formatCompactUsd(row.marketCap)}`
                                  : 'Perpetual USDT-M'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Live Price (SSOT) */}
                        <td
                          className={`py-2.5 px-3 text-right font-semibold ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {row.price > 0 ? (
                            `$${formatSmartCryptoPrice(row.price)}`
                          ) : (
                            <span
                              title={
                                isId ? 'Harga belum tersedia' : 'Price not yet available'
                              }
                              className="text-slate-500 cursor-help"
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* 24h Change */}
                        <td className="py-2.5 px-2.5 text-right font-semibold">
                          {typeof row.change24h === 'number' && Number.isFinite(row.change24h) ? (
                            <span
                              className={
                                row.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }
                            >
                              {row.change24h >= 0 ? '+' : ''}
                              {row.change24h.toFixed(2)}%
                            </span>
                          ) : (
                            <span
                              title={
                                isId
                                  ? 'Data perubahan 24 jam tidak tersedia'
                                  : '24h change data unavailable'
                              }
                              className="text-slate-500 cursor-help"
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* 24h Volume */}
                        <td
                          className={`py-2.5 px-2.5 text-right ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          {row.volume24h !== null && row.volume24h > 0 ? (
                            formatCompactUsd(row.volume24h)
                          ) : (
                            <span
                              title={
                                isId
                                  ? 'Data volume 24 jam tidak tersedia'
                                  : '24h volume data unavailable'
                              }
                              className="text-slate-500 cursor-help"
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* RSI (14) */}
                        <td className="py-2.5 px-2.5 text-right">
                          {row.rsi14 !== null ? (
                            <span
                              className={`font-semibold ${
                                row.rsi14 >= 70
                                  ? 'text-rose-400'
                                  : row.rsi14 <= 30
                                  ? 'text-emerald-400'
                                  : isDark
                                  ? 'text-slate-200'
                                  : 'text-slate-800'
                              }`}
                              title="RSI(14) pada timeframe jangkar 1H"
                            >
                              {row.rsi14.toFixed(1)}
                            </span>
                          ) : (
                            <span
                              title={
                                isId
                                  ? 'RSI(14) sedang dihitung dari candle 1H di server'
                                  : 'RSI(14) hydrating from 1H server candles'
                              }
                              className="text-slate-500 cursor-help"
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* Funding Rate */}
                        <td className="py-2.5 px-2.5 text-right">
                          {row.fundingRate !== null ? (
                            <span
                              className={
                                row.fundingRate > 0.03
                                  ? 'text-amber-300'
                                  : row.fundingRate < 0
                                  ? 'text-cyan-300'
                                  : isDark
                                  ? 'text-slate-300'
                                  : 'text-slate-700'
                              }
                              title={
                                isId
                                  ? 'Funding rate kontrak perpetual saat ini'
                                  : 'Current perpetual contract funding rate'
                              }
                            >
                              {row.fundingRate >= 0 ? '+' : ''}
                              {row.fundingRate.toFixed(4)}%
                            </span>
                          ) : (
                            <span
                              title={
                                isId
                                  ? 'Data funding rate tidak tersedia untuk aset ini'
                                  : 'Funding rate unavailable for this asset'
                              }
                              className="text-slate-500 cursor-help"
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* 6 Timeframe Signal Cells */}
                        {MTF_TIMEFRAME_KEYS.map((tf) => (
                          <td key={tf} className="py-2.5 px-2 text-center">
                            {renderSignalCell(
                              row.signals[tf],
                              tf,
                              row.tfScores?.[tf],
                              isSelected && selectedTimeframe === tf,
                              row.rowError
                            )}
                          </td>
                        ))}

                        {/* MTF Confluence Summary */}
                        <td className="py-2.5 px-3">
                          {row.confluence.evaluatedCount === 0 ? (
                            <span
                              title={
                                isId
                                  ? 'Menunggu pemuatan sinyal multi-timeframe dari worker server'
                                  : 'Awaiting multi-timeframe candle evaluation from server worker'
                              }
                              className="text-slate-500 cursor-help"
                            >
                              —
                            </span>
                          ) : (
                            <span
                              className={`font-bold ${
                                row.confluence.dominantSide === 'BULL' &&
                                row.confluence.buyCount >= 3
                                  ? 'text-emerald-400'
                                  : row.confluence.dominantSide === 'BEAR' &&
                                    row.confluence.sellCount >= 3
                                  ? 'text-rose-400'
                                  : isDark
                                  ? 'text-slate-300'
                                  : 'text-slate-700'
                              }`}
                            >
                              {isId ? row.confluence.labelId : row.confluence.labelEn}
                            </span>
                          )}
                        </td>

                        {/* Row Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenChart(row)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                                isDark
                                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
                              }`}
                            >
                              Chart
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenTrade(row)}
                              className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                            >
                              Trade
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  } catch {
                    // Isolated per-row fallback so a corrupted item never breaks the entire 240-row table
                    return (
                      <tr key={row.symbol || Math.random()}>
                        <td colSpan={14} className="py-2 px-3 text-xs text-amber-400 font-mono">
                          {row.symbol}: {isId ? 'Gagal merender baris data.' : 'Row render error.'}
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          className={`px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono ${
            isDark
              ? 'bg-slate-900/70 border-slate-800 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="tabular-nums">
              {isId
                ? `Menampilkan ${startRowNum}–${endRowNum} dari ${totalFiltered} koin`
                : `Showing ${startRowNum}–${endRowNum} of ${totalFiltered} coins`}
            </span>

            <div className="flex items-center gap-1.5">
              <label htmlFor="mtf-page-size" className="text-slate-400">
                {isId ? 'Baris/hal:' : 'Rows/page:'}
              </label>
              <select
                id="mtf-page-size"
                value={pageSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPageSize(val === 300 ? 300 : val === 100 ? 100 : 50);
                }}
                className={`px-2 py-1 rounded border font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={300}>{isId ? 'Semua (Virtual)' : 'All (Virtual)'}</option>
              </select>
            </div>
            <span className="text-[11px] text-slate-400">
              {isId ? 'Data & logo koin oleh CoinGecko' : 'Coin data & logos by CoinGecko'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label={isId ? 'Halaman sebelumnya' : 'Previous page'}
              className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
              .map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  aria-current={pageNum === safePage ? 'page' : undefined}
                  className={`min-w-[32px] px-2 py-1 rounded-lg border font-bold tabular-nums transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    pageNum === safePage
                      ? 'bg-pink-600 border-pink-500 text-white'
                      : isDark
                      ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label={isId ? 'Halaman berikutnya' : 'Next page'}
              className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
