import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  LayoutGrid,
  Layers,
  X,
  RefreshCw,
} from 'lucide-react';
import { useMarketDataStore } from '../../stores/useMarketDataStore';
import { formatSmartCryptoPrice } from '../../services/marketDataValidator';
import { CoinLogo } from '../ui/CoinLogo';
import { DataStatusBadge } from '../ui/DataStatusBadge';
import {
  HeatmapAssetItem,
  HeatmapTimeframe,
  HeatmapScope,
  CryptoSectorKey,
  getCryptoSector,
  computeProportionalTreemap,
  MarketOverviewPayload,
} from '../../services/marketOverviewLogic';

interface MarketHeatmapViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

type ViewMode = 'treemap' | 'grid';

function formatCompactUsd(value: number | null | undefined, isId: boolean): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return '—';
  }
  if (value >= 1e12) {
    const num = (value / 1e12).toFixed(2);
    return isId ? `$${num} T` : `$${num}T`;
  }
  if (value >= 1e9) {
    const num = (value / 1e9).toFixed(2);
    return isId ? `$${num} M` : `$${num}B`;
  }
  if (value >= 1e6) {
    const num = (value / 1e6).toFixed(2);
    return isId ? `$${num} Jt` : `$${num}M`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

function formatSignedPct(val: number | null | undefined, digits = 2, isId = true): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  const prefix = val > 0 ? '+' : '';
  const formatted = val.toFixed(digits);
  return isId ? `${prefix}${formatted.replace('.', ',')}%` : `${prefix}${formatted}%`;
}

export const MarketHeatmapView: React.FC<MarketHeatmapViewProps> = ({
  onSelectCoin,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const tickers = useMarketDataStore((s) => s.tickers);
  const isOnline = useMarketDataStore((s) => s.isOnline);

  const [heatmapData, setHeatmapData] = useState<HeatmapAssetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('treemap');
  const [scope, setScope] = useState<HeatmapScope>('top100');
  const [timeframe, setTimeframe] = useState<HeatmapTimeframe>('24h');
  const [selectedSector, setSelectedSector] = useState<CryptoSectorKey>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const cardSurface = isDark ? 'bg-[#0b111e] border-slate-800' : 'bg-white border-slate-200';
  const subtleSurface = isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';

  const fetchHeatmapUniverse = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/market-overview', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const payload: MarketOverviewPayload = json?.data ?? json;
      if (Array.isArray(payload?.heatmap) && payload.heatmap.length > 0) {
        setHeatmapData(payload.heatmap);
      }
    } catch {
      // Keep existing data if fetch fails
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHeatmapUniverse(false);
    const interval = window.setInterval(() => {
      fetchHeatmapUniverse(false);
    }, 45_000);
    return () => window.clearInterval(interval);
  }, [fetchHeatmapUniverse]);

  // Overlay live SSOT tickers on fetched items
  const hydratedAssets = useMemo<HeatmapAssetItem[]>(() => {
    return heatmapData.map((coin) => {
      const ssot = tickers[coin.symbol];
      if (!ssot || ssot.price <= 0) return coin;
      return {
        ...coin,
        price: ssot.price,
        change24h: Number.isFinite(ssot.change24h) ? ssot.change24h : coin.change24h,
      };
    });
  }, [heatmapData, tickers]);

  // Overall rank map (1-indexed based on full Top 100 universe)
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    hydratedAssets.forEach((item, index) => {
      map.set(item.symbol, index + 1);
    });
    return map;
  }, [hydratedAssets]);

  const getDelta = useCallback(
    (coin: HeatmapAssetItem): number | null => {
      if (timeframe === '1h') return coin.change1h;
      if (timeframe === '7d') return coin.change7d;
      return coin.change24h;
    },
    [timeframe]
  );

  // Apply scope: Top 25, Top 50, Top 100
  const scopedAssets = useMemo(() => {
    const limit = scope === 'top25' ? 25 : scope === 'top50' ? 50 : 100;
    return hydratedAssets.slice(0, limit);
  }, [hydratedAssets, scope]);

  // Apply sector and search filters
  const filteredAssets = useMemo(() => {
    let list = scopedAssets;
    if (selectedSector !== 'ALL') {
      list = list.filter((c) => getCryptoSector(c.baseAsset) === selectedSector);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.baseAsset.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [scopedAssets, selectedSector, searchQuery]);

  const treemapRects = useMemo(
    () => computeProportionalTreemap(filteredAssets, (c) => c.marketCap, 1.75),
    [filteredAssets]
  );

  const totalMcap = useMemo(
    () => filteredAssets.reduce((sum, c) => sum + (c.marketCap || 0), 0),
    [filteredAssets]
  );

  const breadthStats = useMemo(() => {
    let adv = 0;
    let dec = 0;
    for (const c of filteredAssets) {
      const d = getDelta(c);
      if (d !== null && Number.isFinite(d)) {
        if (d > 0.01) adv++;
        else if (d < -0.01) dec++;
      }
    }
    return { adv, dec, total: filteredAssets.length };
  }, [filteredAssets, getDelta]);

  const getTileStyles = (delta: number | null) => {
    if (delta === null || !Number.isFinite(delta)) {
      return {
        bgClass: isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-300 hover:bg-slate-200',
        borderClass: 'border-slate-700',
        textClass: 'text-slate-300',
        badgeClass: 'bg-slate-900/80 text-slate-300',
      };
    }
    if (delta >= 5) {
      return {
        bgClass: 'bg-emerald-600/95 hover:bg-emerald-500',
        borderClass: 'border-emerald-400',
        textClass: 'text-white',
        badgeClass: 'bg-emerald-950/70 text-emerald-100',
      };
    }
    if (delta >= 1.5) {
      return {
        bgClass: 'bg-emerald-700/90 hover:bg-emerald-600',
        borderClass: 'border-emerald-500/60',
        textClass: 'text-emerald-50',
        badgeClass: 'bg-emerald-950/70 text-emerald-200',
      };
    }
    if (delta > 0.05) {
      return {
        bgClass: isDark ? 'bg-emerald-950/95 hover:bg-emerald-900' : 'bg-emerald-600 hover:bg-emerald-500',
        borderClass: 'border-emerald-600/50',
        textClass: 'text-emerald-100',
        badgeClass: 'bg-emerald-900/80 text-emerald-200',
      };
    }
    if (delta <= -5) {
      return {
        bgClass: 'bg-rose-700/95 hover:bg-rose-600',
        borderClass: 'border-rose-400',
        textClass: 'text-white',
        badgeClass: 'bg-rose-950/70 text-rose-100',
      };
    }
    if (delta <= -1.5) {
      return {
        bgClass: 'bg-rose-800/90 hover:bg-rose-700',
        borderClass: 'border-rose-500/60',
        textClass: 'text-rose-50',
        badgeClass: 'bg-rose-950/70 text-rose-200',
      };
    }
    if (delta < -0.05) {
      return {
        bgClass: isDark ? 'bg-rose-950/95 hover:bg-rose-900' : 'bg-rose-600 hover:bg-rose-500',
        borderClass: 'border-rose-600/50',
        textClass: 'text-rose-100',
        badgeClass: 'bg-rose-900/80 text-rose-200',
      };
    }
    return {
      bgClass: isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-400 hover:bg-slate-300',
      borderClass: 'border-slate-600',
      textClass: 'text-slate-100',
      badgeClass: 'bg-slate-900/70 text-slate-200',
    };
  };

  return (
    <div className="space-y-4">
      {/* Banner & Kontrol Utama */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cardSurface} shadow-xs`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                  {isId
                    ? 'Heatmap Pasar Kripto (Top 100 by Market Cap)'
                    : 'Crypto Market Heatmap (Top 100 by Market Cap)'}
                </h1>
                <DataStatusBadge scope="ticker" lang={lang} compact />
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  {filteredAssets.length} {isId ? 'Koin Aktif' : 'Coins Active'}
                </span>
              </div>
              <p className={`text-xs ${mutedText} mt-0.5`}>
                {isId
                  ? 'Visualisasi momentum harga real-time SSOT berbobot Market Cap lintas sektor. Klik koin untuk membuka analisis grafik.'
                  : 'Proportional Market Cap momentum visualization from unified real-time SSOT. Click any asset to analyze chart.'}
              </p>
            </div>
          </div>

          {/* Tombol Aksi: Mode Tampilan, Scope, Timeframe */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Treemap vs Grid */}
            <div
              role="group"
              aria-label={isId ? 'Pilihan mode visualisasi' : 'View mode'}
              className={`inline-flex rounded-xl p-1 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('treemap')}
                aria-pressed={viewMode === 'treemap'}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'treemap'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Treemap</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>

            {/* Scope: Top 25 / 50 / 100 */}
            <div
              role="group"
              aria-label={isId ? 'Pilihan cakupan' : 'Scope'}
              className={`inline-flex rounded-xl p-1 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}
            >
              {(['top25', 'top50', 'top100'] as HeatmapScope[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setScope(sc)}
                  aria-pressed={scope === sc}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    scope === sc
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sc === 'top25' ? 'Top 25' : sc === 'top50' ? 'Top 50' : 'Top 100'}
                </button>
              ))}
            </div>

            {/* Timeframe: 1h / 24h / 7d */}
            <div
              role="group"
              aria-label={isId ? 'Rentang waktu' : 'Timeframe'}
              className={`inline-flex rounded-xl p-1 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}
            >
              {(['1h', '24h', '7d'] as HeatmapTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  aria-pressed={timeframe === tf}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    timeframe === tf
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchHeatmapUniverse(true)}
              disabled={isRefreshing}
              title={isId ? 'Perbarui data heatmap' : 'Refresh heatmap'}
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
              } transition cursor-pointer`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Toolbar Sekunder: Search + Sector Pills + Total MCap Metric */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-800/60">
          {/* Search Box */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Cari koin di Top 100...' : 'Search Top 100 coin...'}
              className={`w-full pl-9 pr-8 py-1.5 text-xs font-mono rounded-lg border ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sector Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
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
              const active = selectedSector === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setSelectedSector(sec.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    active
                      ? 'bg-pink-600/30 text-pink-300 border border-pink-500/50'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-transparent'
                  }`}
                >
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* Metrics Chip */}
          <div className="text-xs font-mono flex items-center gap-3 text-slate-400">
            <span>
              Total MCap:{' '}
              <strong className="text-slate-200 font-bold">
                {formatCompactUsd(totalMcap, isId)}
              </strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-semibold">▲ {breadthStats.adv}</span>
            <span className="text-rose-400 font-semibold">▼ {breadthStats.dec}</span>
          </div>
        </div>
      </div>

      {/* TAMPILAN 1: PROPORTIONAL TREEMAP VIEW */}
      {viewMode === 'treemap' && (
        <div className={`p-4 rounded-2xl border ${cardSurface} shadow-xs overflow-hidden`}>
          {treemapRects.length > 0 ? (
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-[520px] md:h-[620px] lg:h-[700px] block rounded-xl overflow-hidden"
              role="group"
              aria-label={
                isId
                  ? `Treemap ${treemapRects.length} koin terbesar berdasarkan Market Cap`
                  : `Proportional Market Cap treemap of top ${treemapRects.length} coins`
              }
            >
              {treemapRects.map((rect) => {
                const coin = rect.item;
                const delta = getDelta(coin);
                const tileStyles = getTileStyles(delta);
                const rank = rankMap.get(coin.symbol) || 1;
                const sector = getCryptoSector(coin.baseAsset);

                const svgX = rect.x * 10 + 1;
                const svgY = rect.y * 6 + 1;
                const svgW = Math.max(6, rect.w * 10 - 2);
                const svgH = Math.max(6, rect.h * 6 - 2);
                const area = svgW * svgH;

                const isHeroTile = area >= 300 && svgW >= 60 && svgH >= 50;
                const isMediumTile = area >= 100 && svgW >= 36 && svgH >= 32 && !isHeroTile;
                const isCompactTile =
                  area >= 40 && svgW >= 24 && svgH >= 20 && !isHeroTile && !isMediumTile;
                const isMicroTile = !isHeroTile && !isMediumTile && !isCompactTile;

                const tooltip = `#${rank} ${coin.name} (${coin.symbol}) • Sektor: ${sector} • Market Cap: ${formatCompactUsd(
                  coin.marketCap,
                  isId
                )} • Harga: $${formatSmartCryptoPrice(coin.price)} • Perubahan ${timeframe.toUpperCase()}: ${formatSignedPct(
                  delta,
                  2,
                  isId
                )}. Klik untuk buka grafik.`;

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
                      onClick={() => onSelectCoin && onSelectCoin(coin.symbol)}
                      title={tooltip}
                      className={`w-full h-full p-1 rounded-lg border relative flex flex-col items-center justify-center text-center overflow-hidden transition cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${tileStyles.bgClass} ${tileStyles.borderClass} ${tileStyles.textClass}`}
                    >
                      {/* Rank Badge */}
                      {(isHeroTile || isMediumTile) && (
                        <span className="absolute top-1 left-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 text-slate-300 leading-none">
                          #{rank}
                        </span>
                      )}

                      {/* Ticker & Logo */}
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

                      {/* Price */}
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

                      {/* Delta Badge */}
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums leading-none mt-0.5 px-1 py-0.5 rounded ${
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

                      {/* Market Cap for Hero Tiles */}
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
              className={`h-[420px] rounded-xl border ${subtleSurface} flex flex-col items-center justify-center gap-2 text-xs font-mono ${mutedText}`}
            >
              <span>
                {isId
                  ? 'Tidak ada koin yang sesuai dengan pencarian atau filter sektor'
                  : 'No coins match the search or sector filter'}
              </span>
              {(searchQuery || selectedSector !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSector('ALL');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-pink-600 text-white font-bold cursor-pointer hover:bg-pink-500"
                >
                  {isId ? 'Reset Filter' : 'Reset Filter'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAMPILAN 2: GRID VIEW CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredAssets.map((coin) => {
            const delta = getDelta(coin);
            const rank = rankMap.get(coin.symbol) || 1;
            const sector = getCryptoSector(coin.baseAsset);
            const isBig = rank <= 2;
            const tileStyles = getTileStyles(delta);

            return (
              <div
                key={coin.symbol}
                onClick={() => onSelectCoin && onSelectCoin(coin.symbol)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] hover:brightness-105 flex flex-col justify-between ${
                  isBig ? 'col-span-2 row-span-2 min-h-[160px]' : 'min-h-[110px]'
                } ${tileStyles.bgClass} ${tileStyles.borderClass} ${tileStyles.textClass}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CoinLogo symbol={coin.symbol} size={isBig ? 'md' : 'sm'} decorative />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold opacity-75">#{rank}</span>
                        <span className="font-bold font-mono text-sm sm:text-base leading-tight">
                          {coin.baseAsset}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-80 truncate max-w-[110px]">{coin.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 backdrop-blur-xs">
                    {sector}
                  </span>
                </div>

                <div className="mt-3 font-mono tabular-nums">
                  <div className="text-xs sm:text-sm font-bold">
                    ${formatSmartCryptoPrice(coin.price)}
                  </div>
                  <div className="flex items-center justify-between gap-1 text-xs font-black mt-0.5">
                    <div className="flex items-center gap-0.5">
                      {delta !== null && Number.isFinite(delta) ? (
                        <>
                          {delta >= 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>{formatSignedPct(delta, 2, isId)}</span>
                        </>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                    <span className="text-[10px] opacity-75 font-normal">
                      {formatCompactUsd(coin.marketCap, isId)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAssets.length === 0 && (
            <div
              className={`col-span-full p-8 text-center text-xs font-mono ${mutedText} rounded-2xl border ${subtleSurface}`}
            >
              {isId
                ? 'Tidak ada koin yang sesuai kriteria.'
                : 'No coins found matching criteria.'}
            </div>
          )}
        </div>
      )}

      {/* Skala Momentum Legend */}
      <div className={`p-3 rounded-xl border ${cardSurface} flex flex-wrap items-center justify-between gap-2 text-xs font-mono`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={mutedText}>{isId ? 'Skala Momentum:' : 'Momentum Scale:'}</span>
          <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold">▼ ≤ -5%</span>
          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-700/50">▼ -1.5%</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">• 0%</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-700/50">▲ +1.5%</span>
          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">▲ ≥ +5%</span>
        </div>
        <div className={mutedText}>
          {isId
            ? 'Sumber Data: Binance Futures & CoinGecko (Sinkron Real-Time)'
            : 'Data Source: Binance Futures & CoinGecko (Real-Time Sync)'}
        </div>
      </div>
    </div>
  );
};
