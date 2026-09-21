import React, { useState, useMemo } from 'react';
import {
  CryptoTradingSignal,
  SignalDirection,
  SignalModelCategory,
  SignalStrength,
  SignalResolution,
  SignalLifecycleStatus,
} from '../../types/signal.types';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Shield,
  Clock,
  Zap,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
  SlidersHorizontal,
  Search,
  AlertTriangle,
  LineChart,
  Layers,
  Award,
  RefreshCw,
} from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';
import { Language } from '../../i18n/translations';

interface SignalFeedViewProps {
  signals: CryptoTradingSignal[];
  isDark: boolean;
  lang: Language;
  onSelectSignalForInspection: (sig: CryptoTradingSignal) => void;
  onNavigateToTrade?: (symbol: string) => void;
  onCopySignal: (sig: CryptoTradingSignal) => void;
  copiedId: string | null;
  onSendTelegram: (sig: CryptoTradingSignal) => void;
  onTriggerScan: () => void;
  isScanning: boolean;
}

export const SignalFeedView: React.FC<SignalFeedViewProps> = ({
  signals,
  isDark,
  lang,
  onSelectSignalForInspection,
  onNavigateToTrade,
  onCopySignal,
  copiedId,
  onSendTelegram,
  onTriggerScan,
  isScanning,
}) => {
  const isId = lang === 'id';

  // 4 Dimensions of Taxonomy Filter States
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | SignalDirection>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | SignalModelCategory>('ALL');
  const [selectedResolution, setSelectedResolution] = useState<'ALL' | SignalResolution>('ALL');
  const [selectedStrength, setSelectedStrength] = useState<'ALL' | SignalStrength>('ALL');

  // Lifecycle Status Filter
  const [selectedLifecycle, setSelectedLifecycle] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'TRAILING' | 'TAKEPROFIT' | 'STOPLOSS' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(75);

  // Filtered signals logic
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      // 1. Direction Filter
      if (selectedDirection !== 'ALL' && sig.direction !== selectedDirection) return false;

      // 2. Category Model Filter
      if (selectedCategory !== 'ALL' && (sig.modelCategory || 'CLASSIC') !== selectedCategory) return false;

      // 3. Resolution / Timeframe Filter
      const sigTf = sig.resolution || sig.timeframe;
      if (selectedResolution !== 'ALL' && sigTf !== selectedResolution) return false;

      // 4. Strength Filter
      if (selectedStrength !== 'ALL' && (sig.strength || 'NORMAL') !== selectedStrength) return false;

      // 5. Lifecycle Filter
      if (selectedLifecycle !== 'ALL') {
        if (selectedLifecycle === 'PENDING' && sig.lifecycleStatus !== 'PENDING' && sig.status !== 'ACTIVE') return false;
        if (selectedLifecycle === 'IN_PROGRESS' && !['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'].includes(sig.lifecycleStatus || '') && !sig.status.startsWith('TP')) return false;
        if (selectedLifecycle === 'TRAILING' && !sig.isTrailingActive && sig.lifecycleStatus !== 'TRAILING') return false;
        if (selectedLifecycle === 'TAKEPROFIT' && sig.lifecycleStatus !== 'TAKEPROFIT' && sig.outcomeResult !== 'WIN') return false;
        if (selectedLifecycle === 'STOPLOSS' && sig.lifecycleStatus !== 'STOPLOSS' && sig.outcomeResult !== 'LOSS' && sig.status !== 'SL_HIT') return false;
        if (selectedLifecycle === 'EXPIRED' && sig.lifecycleStatus !== 'EXPIRED' && sig.status !== 'EXPIRED') return false;
      }

      // 6. Confluence Score Filter
      if (sig.confluenceScore < minScore) return false;

      // 7. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSymbol = sig.symbol.toLowerCase().includes(q);
        const matchesName = sig.name.toLowerCase().includes(q);
        const matchesStrategy = sig.strategyName.toLowerCase().includes(q);
        const matchesCat = (sig.modelCategory || '').toLowerCase().includes(q);
        if (!matchesSymbol && !matchesName && !matchesStrategy && !matchesCat) return false;
      }

      return true;
    });
  }, [
    signals,
    selectedDirection,
    selectedCategory,
    selectedResolution,
    selectedStrength,
    selectedLifecycle,
    minScore,
    searchQuery,
  ]);

  return (
    <div className="space-y-4">
      {/* 1. Control & Filter Panel (4-Dimensional Taxonomy) */}
      <div
        className={`p-4 rounded-2xl border space-y-3.5 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Row 1: Direction, Category & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Dimensi 1: Arah (LONG / SHORT) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedDirection('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedDirection === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Arah
            </button>
            <button
              type="button"
              onClick={() => setSelectedDirection('LONG')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedDirection === 'LONG'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              LONG
            </button>
            <button
              type="button"
              onClick={() => setSelectedDirection('SHORT')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedDirection === 'SHORT'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              SHORT
            </button>
          </div>

          {/* Dimensi 2: Kategori Model (ALPHA, GAMMA, CLASSIC, INV) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none font-mono text-xs">
            <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">Model:</span>
            {(['ALL', 'ALPHA', 'GAMMA', 'CLASSIC', 'INV'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Pipeline Trigger */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari simbol / model..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-pink-500"
              />
            </div>
            <button
              type="button"
              onClick={onTriggerScan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-mono font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              title="Pindai Pasar CCXT"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isScanning ? 'Memindai...' : 'Pindai CCXT'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Kerangka Waktu (6 Resolusi), Kekuatan (NORMAL / STRONG), & Status Siklus */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80 font-mono text-xs">
          {/* Dimensi 3: Resolusi Timeframe */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-slate-500 text-[11px] mr-1 hidden md:inline">Resolusi:</span>
            {(['ALL', '1H', '4H', '8H', '12H', '1D', '1W'] as const).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setSelectedResolution(res)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  selectedResolution === res
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {res === 'ALL' ? 'Semua TF' : res}
              </button>
            ))}
          </div>

          {/* Dimensi 4: Kekuatan */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px] mr-1 hidden md:inline">Kekuatan:</span>
            {(['ALL', 'NORMAL', 'STRONG'] as const).map((str) => (
              <button
                key={str}
                type="button"
                onClick={() => setSelectedStrength(str)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  selectedStrength === str
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {str}
              </button>
            ))}
          </div>

          {/* Siklus Hidup Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {(
              [
                { id: 'ALL', label: 'Semua Status' },
                { id: 'PENDING', label: '1. Pending' },
                { id: 'IN_PROGRESS', label: '2. In Progress (R1-R8)' },
                { id: 'TRAILING', label: '3. Trailing' },
                { id: 'TAKEPROFIT', label: '✓ Win (TP)' },
                { id: 'STOPLOSS', label: '✗ Loss (SL)' },
                { id: 'EXPIRED', label: '— Expired' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedLifecycle(st.id as any)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition cursor-pointer shrink-0 ${
                  selectedLifecycle === st.id
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Signal Cards Grid */}
      <div className="space-y-4">
        {filteredSignals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0f172a] font-mono space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-slate-300 font-bold text-sm">Tidak ada sinyal yang cocok dengan taksonomi aktif</p>
            <p className="text-xs text-slate-500">
              Coba atur ulang filter arah, model kategori, atau resolusi kerangka waktu.
            </p>
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const isLong = sig.direction === 'LONG';
            const cat = sig.modelCategory || 'CLASSIC';
            const str = sig.strength || 'NORMAL';
            const tf = sig.resolution || sig.timeframe;
            const pnl = sig.realizedPnlPct !== undefined ? sig.realizedPnlPct : sig.pnlPctCurrent || 0;
            const isWin = sig.outcomeResult === 'WIN' || sig.lifecycleStatus === 'TAKEPROFIT';
            const isLoss = sig.outcomeResult === 'LOSS' || sig.lifecycleStatus === 'STOPLOSS' || sig.status === 'SL_HIT';
            const isExpired = sig.outcomeResult === 'EXPIRED' || sig.lifecycleStatus === 'EXPIRED';

            // Price Levels
            const levels = sig.priceLevels || {
              entry: sig.entryPrice,
              r1: sig.targetPrice1,
              r2: sig.targetPrice2,
              r3: sig.targetPrice3,
              r4: sig.targetPrice3 * 1.02,
              r5: sig.targetPrice3 * 1.04,
              r6: sig.targetPrice3 * 1.06,
              r7: sig.targetPrice3 * 1.08,
              r8: sig.targetPrice3 * 1.10,
              s1: sig.stopLoss,
              s2: sig.stopLoss * 0.98,
              s3: sig.stopLoss * 0.96,
              s4: sig.stopLoss * 0.94,
              trailingStop: sig.trailingStopPrice,
              isTrailingActive: sig.isTrailingActive,
            };

            return (
              <div
                key={sig.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header: Taxonomy Badges (4 Dimensions) + Lifecycle Status */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    {/* Direction Badge */}
                    <div
                      className={`p-2 rounded-xl font-bold flex items-center gap-1 ${
                        isLong
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isLong ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span className="font-mono text-xs font-black">{sig.direction}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-base font-bold text-white">{sig.symbol}</span>
                        {/* 4-Dimensional Tags */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            cat === 'ALPHA'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : cat === 'GAMMA'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : cat === 'INV'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {cat} MODEL
                        </span>

                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {tf}
                        </span>

                        {str === 'STRONG' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-pink-400" />
                            STRONG
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-slate-300 font-bold">{sig.strategyName}</span>
                        <span>•</span>
                        <span className="text-slate-500">{sig.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header: Lifecycle Status & PnL */}
                  <div className="flex items-center gap-2">
                    {/* Lifecycle Badge */}
                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl font-mono font-bold border ${
                        isWin
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : isLoss
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : isExpired
                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                          : sig.isTrailingActive
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 animate-pulse'
                          : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      {isWin
                        ? '✓ TAKEPROFIT (WIN)'
                        : isLoss
                        ? '✗ STOPLOSS (LOSS)'
                        : isExpired
                        ? '— EXPIRED'
                        : sig.isTrailingActive
                        ? `TRAILING (${sig.trailingStopPrice ? `$${formatCryptoPrice(sig.trailingStopPrice)}` : 'ACTIVE'})`
                        : `IN PROGRESS (${sig.lifecycleStatus || 'R1-R8'})`}
                    </span>

                    {/* Current / Realized PnL */}
                    <div
                      className={`px-3 py-1 rounded-xl font-mono font-bold text-sm ${
                        pnl >= 0
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {pnl >= 0 ? '+' : ''}
                      {pnl.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Body Row: Price Levels Table (Entry, r1–r8, s1–s4) */}
                <div className="py-3.5 grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
                  {/* Column 1: Entry & Current Price */}
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                      Harga Acuan (Entry)
                    </span>
                    <div className="text-sm font-bold text-white">${formatCryptoPrice(levels.entry)}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Harga Live:</span>
                      <span className="text-pink-400 font-bold">${formatCryptoPrice(sig.currentPrice)}</span>
                    </div>
                  </div>

                  {/* Column 2: Take-Profit Level Targets (r1–r8) */}
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                        Target Take-Profit (r1 – r8)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tertinggi: r{sig.highestRReached || 0}
                      </span>
                    </div>
                    {/* Visual 8 Target Pills */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center">
                      {(['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'] as const).map((rKey, idx) => {
                        const targetPrice = levels[rKey];
                        const isHit = (sig.highestRReached || 0) >= idx + 1;
                        return (
                          <div
                            key={rKey}
                            className={`p-1 rounded-md border text-[10px] font-mono transition ${
                              isHit
                                ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-200 font-bold shadow-xs'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400'
                            }`}
                            title={`${rKey.toUpperCase()}: $${formatCryptoPrice(targetPrice)}`}
                          >
                            <span className="block text-[9px] uppercase font-bold">{rKey}</span>
                            <span className="truncate block font-semibold">${formatCryptoPrice(targetPrice)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 3: Support Stop Levels (s1–s4) & Trailing Stop */}
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">
                        Batas Stop (s1 – s4)
                      </span>
                      {sig.isTrailingActive && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                          Trailing ON
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {(['s1', 's2', 's3', 's4'] as const).map((sKey) => (
                        <div
                          key={sKey}
                          className="p-1 rounded-md bg-rose-950/20 border border-rose-500/30 text-[10px] font-mono text-rose-300"
                        >
                          <span className="block text-[9px] font-bold uppercase">{sKey}</span>
                          <span className="truncate block font-semibold">${formatCryptoPrice(levels[sKey])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Indicator Checklist & Risk Summary */}
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-[10px] font-mono text-slate-500">Konfluensi:</span>
                  {sig.indicatorsSummary.map((item, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>

                {/* Footer Action Bar: Audit, Telegram, Copy, Trade */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span>Skor: <strong className="text-pink-400">{sig.confluenceScore}/100</strong></span>
                    <span>•</span>
                    <span>R:R: <strong className="text-emerald-400">1:{sig.riskRewardRatio}</strong></span>
                    <span>•</span>
                    <span>Lev: <strong className="text-purple-300">{sig.leverageRec}x</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectSignalForInspection(sig)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-pink-300 font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <LineChart className="w-3.5 h-3.5" />
                      <span>Analisis Langsung</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCopySignal(sig)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold transition cursor-pointer flex items-center gap-1.5"
                      title="Salin Sinyal VIP"
                    >
                      {copiedId === sig.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === sig.id ? 'Tersalin' : 'Salin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSendTelegram(sig)}
                      className="px-2.5 py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900/60 border border-pink-500/40 text-pink-300 font-bold transition cursor-pointer flex items-center gap-1.5"
                      title="Kirim ke Telegram Channel"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram</span>
                    </button>

                    {onNavigateToTrade && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTrade(sig.symbol)}
                        className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Eksekusi</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
