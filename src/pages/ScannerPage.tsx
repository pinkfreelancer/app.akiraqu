import React, { useState, useEffect, useMemo } from 'react';
import { MarketScannerItem, SupportedExchange, MarketType } from '../types/crypto.types';
import { fetchLiveMarketScanner } from '../services/terminalExtensionService';
import {
  Search,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  Zap,
  Eye,
  BarChart3,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Percent,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Radio,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { Language, getTranslation } from '../i18n/translations';

interface ScannerPageProps {
  onSelectCoin: (symbol: string) => void;
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const ScannerPage: React.FC<ScannerPageProps> = ({
  onSelectCoin,
  selectedExchange,
  selectedMarketType,
  lang = 'id',
  theme = 'dark',
}) => {
  const [items, setItems] = useState<MarketScannerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [lastScanTime, setLastScanTime] = useState<string>('Baru saja');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'REALTIME' | 'BULLISH' | 'VOLUME' | 'FUNDING' | 'HOT' | 'OVERSOLD'>('REALTIME');
  const [sortBy, setSortBy] = useState<'change' | 'score' | 'volume' | 'funding' | 'criteria' | 'rsi'>('criteria');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // Bullish parameter threshold filter toggles
  const [onlyFullCriteria, setOnlyFullCriteria] = useState<boolean>(false);
  const [minVolumeFilter, setMinVolumeFilter] = useState<number>(0); // in Millions
  const [fundingFilterMode, setFundingFilterMode] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>('ALL');

  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const loadScannerData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveMarketScanner(selectedExchange, selectedMarketType);
      setItems(data);
      const now = new Date();
      setLastScanTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load scanner:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScannerData();
    if (!isRealtimeActive) return;
    const interval = setInterval(loadScannerData, 8000); // 8-second real-time polling
    return () => clearInterval(interval);
  }, [selectedExchange, selectedMarketType, isRealtimeActive]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

        // Base parameter buttons filter
        let matchesFilter = true;
        if (activeFilter === 'REALTIME') {
          matchesFilter = true; // Shows all live stream assets
        } else if (activeFilter === 'BULLISH') {
          matchesFilter = (item.bullishCriteria?.criteriaMetCount ?? 0) >= 6 || item.bias.includes('Bullish');
        } else if (activeFilter === 'VOLUME') {
          matchesFilter = item.volume24hUsd >= 150_000_000 || item.change24h > 3;
        } else if (activeFilter === 'FUNDING') {
          matchesFilter = item.fundingRate > 0 && item.fundingRate <= 0.035;
        } else if (activeFilter === 'HOT') {
          matchesFilter = !!item.isHot;
        } else if (activeFilter === 'OVERSOLD') {
          matchesFilter = item.rsi <= 38;
        }

        // Additional fine-grained criteria
        if (onlyFullCriteria && (item.bullishCriteria?.criteriaMetCount ?? 0) < 7) {
          matchesFilter = false;
        }

        if (minVolumeFilter > 0 && item.volume24hUsd < minVolumeFilter * 1_000_000) {
          matchesFilter = false;
        }

        if (fundingFilterMode === 'POSITIVE' && item.fundingRate <= 0) {
          matchesFilter = false;
        } else if (fundingFilterMode === 'NEUTRAL' && Math.abs(item.fundingRate) > 0.005) {
          matchesFilter = false;
        } else if (fundingFilterMode === 'NEGATIVE' && item.fundingRate >= 0) {
          matchesFilter = false;
        }

        return matchesSearch && matchesCategory && matchesFilter;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'change') {
          valA = a.change24h;
          valB = b.change24h;
        } else if (sortBy === 'score') {
          valA = a.confluenceScore;
          valB = b.confluenceScore;
        } else if (sortBy === 'volume') {
          valA = a.volume24hUsd;
          valB = b.volume24hUsd;
        } else if (sortBy === 'funding') {
          valA = a.fundingRate;
          valB = b.fundingRate;
        } else if (sortBy === 'criteria') {
          valA = a.bullishCriteria?.criteriaMetCount ?? 0;
          valB = b.bullishCriteria?.criteriaMetCount ?? 0;
        } else if (sortBy === 'rsi') {
          valA = a.rsi;
          valB = b.rsi;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [
    items,
    searchQuery,
    selectedCategory,
    activeFilter,
    sortBy,
    sortOrder,
    onlyFullCriteria,
    minVolumeFilter,
    fundingFilterMode,
  ]);

  const topGainer = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.change24h - a.change24h)[0];
  }, [items]);

  const topVolume = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.volume24hUsd - a.volume24hUsd)[0];
  }, [items]);

  const bestBullish = useMemo(() => {
    if (items.length === 0) return null;
    return [...items].sort(
      (a, b) => (b.bullishCriteria?.criteriaMetCount ?? 0) - (a.bullishCriteria?.criteriaMetCount ?? 0)
    )[0];
  }, [items]);

  const avgFunding = useMemo(() => {
    if (items.length === 0) return 0.01;
    const sum = items.reduce((acc, i) => acc + i.fundingRate, 0);
    return sum / items.length;
  }, [items]);

  const toggleExpand = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol));
  };

  return (
    <div id="page-market-scanner" className="space-y-5">
      {/* Realtime Telemetry Summary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Parameter 1: Realtime Scan Telemetry */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-mono flex items-center gap-1.5 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Radio className={`w-3.5 h-3.5 ${isRealtimeActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              Realtime Scan Feed
            </span>
            <button
              onClick={() => setIsRealtimeActive(!isRealtimeActive)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                isRealtimeActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {isRealtimeActive ? 'LIVE (8s)' : 'PAUSED'}
            </button>
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`font-mono font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedExchange} {selectedMarketType}
            </div>
            <div className={`font-mono text-[11px] font-semibold tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lastScanTime}</div>
          </div>
          <div className={`text-[10px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>{items.length} Aset Terpantau</span>
            <span className="text-cyan-500 font-semibold">{filteredItems.length} Sesuai Filter</span>
          </div>
        </div>

        {/* Parameter 2: Bullish Confluence Leader */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono font-bold flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
              Top Bullish Setup
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
              9/9 Kriteria
            </span>
          </div>
          {bestBullish ? (
            <div
              className="flex items-baseline justify-between cursor-pointer group"
              onClick={() => onSelectCoin(bestBullish.symbol)}
            >
              <div className={`font-mono font-bold text-base group-hover:text-cyan-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {bestBullish.symbol}
              </div>
              <div className="font-mono font-bold text-emerald-500 flex items-center gap-1 tabular-nums">
                <span>{bestBullish.bullishCriteria?.criteriaMetCount}/9</span>
                <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  (R:R {bestBullish.bullishCriteria?.calculatedRRR}:1)
                </span>
              </div>
            </div>
          ) : (
            <div className={`h-6 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
          )}
          <div className={`text-[10px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Skor Konfluensi:</span>
            <span className="text-emerald-500 font-mono font-bold tabular-nums">{bestBullish?.confluenceScore ?? 0}/100</span>
          </div>
        </div>

        {/* Parameter 3: 24h Volume Leader */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono font-bold flex items-center gap-1 text-cyan-500">
              <BarChart3 className="w-3.5 h-3.5" />
              Volume 24h Terbesar
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Spot & Perp</span>
          </div>
          {topVolume ? (
            <div
              className="flex items-baseline justify-between cursor-pointer group"
              onClick={() => onSelectCoin(topVolume.symbol)}
            >
              <div className={`font-mono font-bold text-base group-hover:text-cyan-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {topVolume.symbol}
              </div>
              <div className="font-mono font-bold text-cyan-500 tabular-nums">
                ${(topVolume.volume24hUsd / 1_000_000).toFixed(1)}M
              </div>
            </div>
          ) : (
            <div className={`h-6 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
          )}
          <div className={`text-[10px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Perubahan 24j:</span>
            <span className={`font-mono tabular-nums font-semibold ${topVolume && topVolume.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {topVolume ? (topVolume.change24h >= 0 ? '+' : '') + topVolume.change24h.toFixed(2) + '%' : '-'}
            </span>
          </div>
        </div>

        {/* Parameter 4: Funding Rate Market Telemetry */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono font-bold flex items-center gap-1 text-amber-500">
              <Percent className="w-3.5 h-3.5" />
              Derivatives Funding Rate
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>8h Settlement</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`font-mono font-bold text-base tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {(avgFunding * 100).toFixed(4)}%
            </div>
            <div className={`font-mono text-xs font-semibold ${avgFunding > 0.02 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {avgFunding > 0.02 ? 'Overheated Longs' : 'Healthy Basis'}
            </div>
          </div>
          <div className={`text-[10px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Funding Bias:</span>
            <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Spot & Futures Neutral</span>
          </div>
        </div>
      </div>

      {/* Main Parameters Bar: Realtime Scan, Bullish, Volume, Funding */}
      <div className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Requested Filter Parameters Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1 shrink-0">
              Parameter:
            </span>

            {/* 1. Realtime Scan */}
            <button
              onClick={() => setActiveFilter('REALTIME')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                activeFilter === 'REALTIME'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                  : isDark
                  ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${activeFilter === 'REALTIME' ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>Realtime Scan</span>
            </button>

            {/* 2. Bullish Confluence */}
            <button
              onClick={() => setActiveFilter('BULLISH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                activeFilter === 'BULLISH'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                  : isDark
                  ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${activeFilter === 'BULLISH' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Bullish (9 Kriteria)</span>
            </button>

            {/* 3. Volume Surge */}
            <button
              onClick={() => setActiveFilter('VOLUME')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                activeFilter === 'VOLUME'
                  ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-xs'
                  : isDark
                  ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeFilter === 'VOLUME' ? 'text-slate-950' : 'text-blue-400'}`} />
              <span>Volume</span>
            </button>

            {/* 4. Funding Rate Optimal */}
            <button
              onClick={() => setActiveFilter('FUNDING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                activeFilter === 'FUNDING'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : isDark
                  ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Percent className={`w-3.5 h-3.5 ${activeFilter === 'FUNDING' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Funding</span>
            </button>

            {/* Supplementary Filters */}
            <button
              onClick={() => setActiveFilter('HOT')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 ${
                activeFilter === 'HOT'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : isDark
                  ? 'bg-[#1e293b]/60 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Hot / Volatile</span>
            </button>

            <button
              onClick={() => setActiveFilter('OVERSOLD')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 ${
                activeFilter === 'OVERSOLD'
                  ? 'bg-purple-500 text-slate-950 font-bold'
                  : isDark
                  ? 'bg-[#1e293b]/60 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span>RSI &lt; 38</span>
            </button>
          </div>

          {/* Search bar & Refresh */}
          <div className="flex items-center gap-2 justify-between">
            <div className="relative min-w-[200px] flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari simbol kripto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg bg-[#070b14] border border-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[#070b14] border border-[#1e293b] text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>

            <button
              onClick={loadScannerData}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Refresh Scanner Feed Sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 9 Kriteria Bullish Breakdown Guidance Legend Bar */}
        <div className={`p-3 rounded-lg border text-xs ${
          isDark ? 'bg-[#070b14]/70 border-[#1e293b]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200 font-mono">
                Kriteria Terpenuhi pada Bullish (9-Point Institutional Verification Checklist):
              </span>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-cyan-400 cursor-pointer font-mono font-semibold select-none">
              <input
                type="checkbox"
                checked={onlyFullCriteria}
                onChange={(e) => setOnlyFullCriteria(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>Tampilkan Hanya Lolos Kualifikasi (≥ 7 Kriteria)</span>
            </label>
          </div>

          {/* Grid of the 9 Criteria Tags */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5 text-[11px] font-mono">
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">1. Struktur</span>
              <span className="font-bold text-emerald-400">Trend 4H</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">2. Momentum</span>
              <span className="font-bold text-emerald-400">RSI 45-68</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">3. Derivatif</span>
              <span className="font-bold text-emerald-400">Funding +</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">4. Multi-TF</span>
              <span className="font-bold text-emerald-400">EMA 4TF</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">5. Likuiditas</span>
              <span className="font-bold text-emerald-400">Volume &gt;1.2x</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">6. Makro</span>
              <span className="font-bold text-emerald-400">Chart 1D</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">7. Akselerasi</span>
              <span className="font-bold text-emerald-400">MACD Cross</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[9px] uppercase">8. Arus Kas</span>
              <span className="font-bold text-emerald-400">OBV Inflow</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-emerald-500/30 bg-emerald-950/20 text-center">
              <span className="text-emerald-400 block text-[9px] uppercase">9. Rasio Untung</span>
              <span className="font-bold text-emerald-300">R:R ≥ 1.5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner Data Table with 9 Bullish Criteria Breakdown */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className={`border-b ${isDark ? 'bg-[#0b101f] border-[#1e293b] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="py-3 px-3.5">Simbol & Kategori</th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => {
                    setSortBy('change');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Harga & 24j % {sortBy === 'change' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => {
                    setSortBy('criteria');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Kriteria Bullish (9-Check) {sortBy === 'criteria' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => {
                    setSortBy('score');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Confluence AI {sortBy === 'score' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => {
                    setSortBy('volume');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Volume 24h {sortBy === 'volume' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:text-white select-none"
                  onClick={() => {
                    setSortBy('funding');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Funding & OI {sortBy === 'funding' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="py-3 px-3.5">Setup / Pola Terdeteksi</th>
                <th className="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-mono">
                    Tidak ada koin yang sesuai dengan parameter filter scanner saat ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isPositive = item.change24h >= 0;
                  const crit = item.bullishCriteria;
                  const isExpanded = expandedSymbol === item.symbol;
                  const passedCount = crit?.criteriaMetCount ?? 0;
                  const isHighQuality = passedCount >= 7;

                  return (
                    <React.Fragment key={item.symbol}>
                      <tr
                        className={`hover:bg-cyan-500/5 transition-colors cursor-pointer ${
                          item.isHot ? 'bg-cyan-500/[0.02]' : ''
                        } ${isExpanded ? 'bg-slate-900/90' : ''}`}
                        onClick={() => onSelectCoin(item.symbol)}
                      >
                        {/* 1. Symbol & Details */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            {item.isHot && <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                {item.symbol}
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                                  {item.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">{item.name}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Price & 24h Change */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-white">${formatCryptoPrice(item.price)}</div>
                          <div className={`flex items-center text-[11px] font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
                          </div>
                        </td>

                        {/* 3. 9 Bullish Criteria Score & Badge */}
                        <td className="py-3 px-3.5" onClick={(e) => toggleExpand(item.symbol, e)}>
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                              isHighQuality
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : passedCount >= 5
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              <span>{passedCount}/9 Kriteria</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>

                            {crit?.riskReward && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                                R:R {crit.calculatedRRR}:1
                              </span>
                            )}
                          </div>

                          {/* Quick checklist mini indicators bar */}
                          {crit && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <span title="Trend 4H" className={`w-2 h-2 rounded-full ${crit.trend4h ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="RSI Momentum" className={`w-2 h-2 rounded-full ${crit.rsi ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="Funding Rate" className={`w-2 h-2 rounded-full ${crit.funding ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="EMA 4TF" className={`w-2 h-2 rounded-full ${crit.ema4tf ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="Volume Surge" className={`w-2 h-2 rounded-full ${crit.volume ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="Chart 1D" className={`w-2 h-2 rounded-full ${crit.chart1d ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="MACD Cross" className={`w-2 h-2 rounded-full ${crit.macd ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="OBV Inflow" className={`w-2 h-2 rounded-full ${crit.obv ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span title="R:R >= 1.5" className={`w-2 h-2 rounded-full ${crit.riskReward ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                            </div>
                          )}
                        </td>

                        {/* 4. Confluence Score & Bias */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${
                                  item.confluenceScore >= 75
                                    ? 'bg-emerald-400'
                                    : item.confluenceScore >= 55
                                    ? 'bg-cyan-400'
                                    : 'bg-rose-400'
                                }`}
                                style={{ width: `${item.confluenceScore}%` }}
                              />
                            </div>
                            <span className="font-bold text-white">{item.confluenceScore}%</span>
                          </div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${
                            item.bias.includes('Bullish') ? 'text-emerald-400' : item.bias.includes('Bearish') ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {item.bias}
                          </div>
                        </td>

                        {/* 5. 24h Volume */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-white font-mono">
                            ${(item.volume24hUsd / 1_000_000).toFixed(1)}M
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            CVD: <span className={item.cvdDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{item.cvdDelta > 0 ? '+' : ''}{item.cvdDelta}%</span>
                          </div>
                        </td>

                        {/* 6. Funding Rate & OI */}
                        <td className="py-3 px-3.5">
                          <div className="text-slate-300">
                            FR: <span className={`font-bold ${item.fundingRate > 0.025 ? 'text-amber-400' : item.fundingRate < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                              {(item.fundingRate * 100).toFixed(4)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            OI Δ: <span className={item.openInterestDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{item.openInterestDeltaPct > 0 ? '+' : ''}{item.openInterestDeltaPct}%</span>
                          </div>
                        </td>

                        {/* 7. Detected Pattern */}
                        <td className="py-3 px-3.5">
                          {item.detectedPattern ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                              {item.detectedPattern}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </td>

                        {/* 8. Action Button */}
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCoin(item.symbol);
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            Analisa
                          </button>
                        </td>
                      </tr>

                      {/* Expandable 9 Bullish Criteria Diagnostic Row */}
                      {isExpanded && crit && (
                        <tr className="bg-slate-900/90 border-b border-slate-800">
                          <td colSpan={8} className="py-3.5 px-4">
                            <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e293b] space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="font-bold text-cyan-400 flex items-center gap-2">
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                  <span>Diagnostik 9 Kriteria Bullish Terpenuhi: {item.symbol}</span>
                                </div>
                                <span className="font-mono text-slate-400">
                                  Skor Kelayakan: <strong className="text-emerald-400">{crit.criteriaMetCount}/9 Kriteria Terverifikasi</strong>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                                {/* 1. Trend 4H */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.trend4h ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>1. Trend 4H (Higher Highs)</span>
                                  {crit.trend4h ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 2. RSI */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.rsi ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>2. RSI Sehat ({item.rsi} / 45-68)</span>
                                  {crit.rsi ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 3. Funding */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.funding ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>3. Funding Rate ({(item.fundingRate * 100).toFixed(4)}%)</span>
                                  {crit.funding ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 4. EMA 4TF */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.ema4tf ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>4. EMA 4TF (15m, 1h, 4h, 1d)</span>
                                  {crit.ema4tf ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 5. Volume */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.volume ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>5. Volume Surge (&gt;1.2x Rata-rata)</span>
                                  {crit.volume ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 6. Chart 1D */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.chart1d ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>6. Struktur Chart 1D Makro</span>
                                  {crit.chart1d ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 7. MACD */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.macd ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>7. MACD Histogram Bullish Cross</span>
                                  {crit.macd ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 8. OBV */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.obv ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>8. OBV (On-Balance Volume) Inflow</span>
                                  {crit.obv ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>

                                {/* 9. R:R >= 1.5 */}
                                <div className={`p-2 rounded border flex items-center justify-between ${
                                  crit.riskReward ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                }`}>
                                  <span>9. R:R Feasibility ({crit.calculatedRRR}:1 ≥ 1.5)</span>
                                  {crit.riskReward ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
