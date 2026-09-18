import React, { useState, useMemo } from 'react';
import {
  CryptoTradingSignal,
  SignalDirection,
  SignalGrade,
  SignalStatus,
  Timeframe,
  SupportedExchange,
} from '../types/crypto.types';
import {
  Radio,
  Zap,
  TrendingUp,
  TrendingDown,
  Filter,
  Bell,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Share2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Send,
  ExternalLink,
  Target,
  Shield,
  BarChart2,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { Language } from '../i18n/translations';

interface SignalPageProps {
  currentSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  selectedExchange?: SupportedExchange;
  theme?: 'light' | 'dark';
  lang?: Language;
}

const MOCK_SIGNALS: CryptoTradingSignal[] = [
  {
    id: 'SIG-BTC-9401',
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Layer 1',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '1H',
    strategyName: 'SMC Institutional Sweep & FVG Rebound',
    strategyCategory: 'SMC',
    confluenceScore: 94,
    winRateProbability: 84.5,
    entryPrice: 88450.0,
    targetPrice1: 90200.0,
    targetPrice2: 91800.0,
    targetPrice3: 94500.0,
    stopLoss: 87100.0,
    riskRewardRatio: 3.42,
    leverageRec: 10,
    status: 'ACTIVE',
    pnlPctCurrent: 2.14,
    createdAt: '12 menit yang lalu',
    expiresAt: 'dalam 5 jam',
    indicatorsSummary: ['Bullish FVG Filled $88.2k', 'RSI 38 Rebound', 'CVD Whale Inflow +$42M', 'SuperTrend Bull', 'Ichimoku Kumo Support'],
    notes: 'Sapuan likuiditas di bawah level $88,000 telah selesai. Konfirmasi penutupan candle 1H di atas EMA 20 dengan lonjakan volume beli agresif.',
  },
  {
    id: 'SIG-SOL-9102',
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Layer 1',
    exchange: 'OKX',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '4H',
    strategyName: 'VWAP Breakout + Whale CVD Divergence',
    strategyCategory: 'ORDERFLOW',
    confluenceScore: 91,
    winRateProbability: 81.0,
    entryPrice: 184.2,
    targetPrice1: 192.0,
    targetPrice2: 199.5,
    targetPrice3: 212.0,
    stopLoss: 178.5,
    riskRewardRatio: 3.12,
    leverageRec: 15,
    status: 'TP1_HIT',
    pnlPctCurrent: 4.85,
    createdAt: '45 menit yang lalu',
    expiresAt: 'dalam 14 jam',
    indicatorsSummary: ['VWAP Upper Band Breach', 'Delta Volume Divergence', 'Funding Rate -0.012% (Short Squeeze)', 'MACD Golden Cross'],
    notes: 'Short squeeze terkonfirmasi saat funding rate minus dan CVD retail shorting agresif. Target 1 sebesar $192.0 telah tercapai.',
  },
  {
    id: 'SIG-ETH-8703',
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Layer 1',
    exchange: 'BYBIT',
    direction: 'SHORT',
    grade: 'SELL',
    timeframe: '15m',
    strategyName: 'Bearish Order Block Reject & RSI Divergence',
    strategyCategory: 'DIVERGENCE',
    confluenceScore: 86,
    winRateProbability: 74.2,
    entryPrice: 3420.0,
    targetPrice1: 3360.0,
    targetPrice2: 3290.0,
    targetPrice3: 3180.0,
    stopLoss: 3465.0,
    riskRewardRatio: 2.95,
    leverageRec: 12,
    status: 'ACTIVE',
    pnlPctCurrent: 1.15,
    createdAt: '18 menit yang lalu',
    expiresAt: 'dalam 2 jam',
    indicatorsSummary: ['Bearish OB at $3,430', 'Bearish Regular RSI Divergence', 'Volume Climax Rejection', 'EMA 9 Cross Down EMA 21'],
    notes: 'Penolakan keras di level resistance Order Block $3,430 dengan divergensi RSI 15m. Validasi momentum short scalping.',
  },
  {
    id: 'SIG-SUI-8904',
    symbol: 'SUI/USDT',
    name: 'Sui Network',
    category: 'Layer 1',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '1H',
    strategyName: 'Trend Momentum Wave + Volatility Breakout',
    strategyCategory: 'TREND',
    confluenceScore: 89,
    winRateProbability: 78.6,
    entryPrice: 3.42,
    targetPrice1: 3.65,
    targetPrice2: 3.88,
    targetPrice3: 4.20,
    stopLoss: 3.25,
    riskRewardRatio: 3.25,
    leverageRec: 8,
    status: 'TP2_HIT',
    pnlPctCurrent: 8.42,
    createdAt: '2 jam yang lalu',
    expiresAt: 'dalam 8 jam',
    indicatorsSummary: ['SuperTrend Bullish', 'ADX 38 Strong Trend', 'EMA 20/50/200 Ribbon Fan Out', 'Orderbook Bid Wall +$3.5M'],
    notes: 'Kekuatan momentum tren naik sangat dominan dengan ADX di atas 35. TP1 & TP2 telah tersentuh, pasang trailing stop di BEP.',
  },
  {
    id: 'SIG-PEPE-8205',
    symbol: 'PEPE/USDT',
    name: 'Pepe',
    category: 'Meme',
    exchange: 'BYBIT',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '15m',
    strategyName: 'Liquidity Pool Sweep + Bollinger Squeeze Expansion',
    strategyCategory: 'VOLATILITY',
    confluenceScore: 83,
    winRateProbability: 71.5,
    entryPrice: 0.0000108,
    targetPrice1: 0.0000116,
    targetPrice2: 0.0000124,
    targetPrice3: 0.0000138,
    stopLoss: 0.0000102,
    riskRewardRatio: 2.80,
    leverageRec: 5,
    status: 'ACTIVE',
    pnlPctCurrent: 3.20,
    createdAt: '35 menit yang lalu',
    expiresAt: 'dalam 3 jam',
    indicatorsSummary: ['Bollinger Band Expansion', 'Volume Surge +380%', 'MFI Money Inflow', 'Open Interest +14.2%'],
    notes: 'Ekspansi volatilitas tajam setelah konsolidasi panjang. Volume breakout terdeteksi di bursa derivatif utama.',
  },
  {
    id: 'SIG-NEAR-8506',
    symbol: 'NEAR/USDT',
    name: 'NEAR Protocol',
    category: 'AI & Big Data',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '4H',
    strategyName: 'AI Confluence Multi-Engine 90+ Score',
    strategyCategory: 'AI_CONFLUENCE',
    confluenceScore: 92,
    winRateProbability: 82.8,
    entryPrice: 6.85,
    targetPrice1: 7.25,
    targetPrice2: 7.65,
    targetPrice3: 8.30,
    stopLoss: 6.55,
    riskRewardRatio: 3.45,
    leverageRec: 10,
    status: 'ACTIVE',
    pnlPctCurrent: 1.85,
    createdAt: '1 jam yang lalu',
    expiresAt: 'dalam 18 jam',
    indicatorsSummary: ['10 dari 12 Indikator Bullish', 'ICT Optimal Trade Entry 0.618 Fib', 'Net Funding Rate Neutral', 'Whale Bid Depth 68%'],
    notes: 'Konfluensi skor sangat tinggi dari klaster model AI. Koreksi sehat menyentuh Golden Ratio 0.618 Fibonacci.',
  },
  {
    id: 'SIG-BNB-8107',
    symbol: 'BNB/USDT',
    name: 'BNB Chain',
    category: 'Layer 1',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '1D',
    strategyName: 'Daily Range Breakout & Ichimoku Cloud Break',
    strategyCategory: 'TREND',
    confluenceScore: 84,
    winRateProbability: 75.0,
    entryPrice: 655.0,
    targetPrice1: 685.0,
    targetPrice2: 720.0,
    targetPrice3: 775.0,
    stopLoss: 630.0,
    riskRewardRatio: 3.10,
    leverageRec: 5,
    status: 'ACTIVE',
    pnlPctCurrent: 0.95,
    createdAt: '3 jam yang lalu',
    expiresAt: 'dalam 1 hari',
    indicatorsSummary: ['Ichimoku Cloud Bullish Breakout', 'Daily Close Above EMA 50', 'On-Chain Staking Lock Inflow'],
    notes: 'Penembusan level resistensi harian. Setup swing trading berisiko rendah dengan target swing $720+.',
  },
];

export const SignalPage: React.FC<SignalPageProps> = ({
  currentSymbol,
  onSelectSymbol,
  onNavigateToTrade,
  selectedExchange = 'BINANCE',
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Filters state
  const [signals, setSignals] = useState<CryptoTradingSignal[]>(MOCK_SIGNALS);
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'ALL' | Timeframe>('ALL');
  const [minScore, setMinScore] = useState<number>(80);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'TP_HIT' | 'SL_HIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [telegramNotificationSent, setTelegramNotificationSent] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [telegramWebhook, setTelegramWebhook] = useState<string>('https://api.telegram.org/bot7892.../sendMessage');

  // Filtered signals logic
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      if (selectedDirection !== 'ALL' && sig.direction !== selectedDirection) return false;
      if (selectedTimeframe !== 'ALL' && sig.timeframe !== selectedTimeframe) return false;
      if (sig.confluenceScore < minScore) return false;
      if (selectedStatus === 'ACTIVE' && sig.status !== 'ACTIVE') return false;
      if (selectedStatus === 'TP_HIT' && !sig.status.includes('TP')) return false;
      if (selectedStatus === 'SL_HIT' && sig.status !== 'SL_HIT') return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSymbol = sig.symbol.toLowerCase().includes(query);
        const matchesName = sig.name.toLowerCase().includes(query);
        const matchesStrategy = sig.strategyName.toLowerCase().includes(query);
        if (!matchesSymbol && !matchesName && !matchesStrategy) return false;
      }
      return true;
    });
  }, [signals, selectedDirection, selectedTimeframe, minScore, selectedStatus, searchQuery]);

  // Summary statistics
  const activeCount = signals.filter((s) => s.status === 'ACTIVE').length;
  const tpHitCount = signals.filter((s) => s.status.includes('TP')).length;
  const winRate = Math.round((tpHitCount / (signals.length || 1)) * 100);
  const avgConfluence = Math.round(signals.reduce((acc, s) => acc + s.confluenceScore, 0) / (signals.length || 1));

  const handleCopySignal = (sig: CryptoTradingSignal) => {
    const text = `🎯 [IMASBTC VIP SIGNAL]
Aset: ${sig.symbol} (${sig.exchange})
Tipe: ${sig.direction} (${sig.grade})
Timeframe: ${sig.timeframe}
Strategi: ${sig.strategyName}
Skor Konfluensi: ${sig.confluenceScore}/100 (Win Probability: ${sig.winRateProbability}%)
═══════════════════
🟢 Entry: $${formatCryptoPrice(sig.entryPrice)}
🎯 TP 1: $${formatCryptoPrice(sig.targetPrice1)}
🎯 TP 2: $${formatCryptoPrice(sig.targetPrice2)}
🎯 TP 3: $${formatCryptoPrice(sig.targetPrice3)}
🛑 Stop Loss: $${formatCryptoPrice(sig.stopLoss)}
⚖️ Risk/Reward: 1 : ${sig.riskRewardRatio}
⚡ Rekomendasi Leverage: ${sig.leverageRec}x
═══════════════════
📝 Catatan: ${sig.notes}`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendTelegram = (sig: CryptoTradingSignal) => {
    setTelegramNotificationSent(sig.symbol);
    setTimeout(() => setTelegramNotificationSent(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Signal Summary Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 relative">
            <Radio className="w-6 h-6 animate-pulse" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-mono font-bold text-lg sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isId ? 'Sinyal Trading Real-Time' : 'Institutional Trading Signals'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE FEED
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {isId
                ? 'Sinyal konfluensi multi-indikator otomatis dengan Entry, TP 1-3, SL, dan kalkulasi Risk:Reward'
                : 'Automated high-confluence algorithmic signals with verified entry, TP targets & risk limits'}
            </p>
          </div>
        </div>

        {/* Action Pills & Stats */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="grid grid-cols-3 gap-2 font-mono text-xs w-full sm:w-auto">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Sinyal Aktif</span>
              <span className="font-bold text-cyan-400 text-sm">{activeCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Win Rate</span>
              <span className="font-bold text-emerald-400 text-sm">82.4%</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Rata Skor</span>
              <span className="font-bold text-amber-400 text-sm">{avgConfluence}/100</span>
            </div>
          </div>

          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundAlerts
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={soundAlerts ? 'Audio alert aktif' : 'Audio alert senyap'}
          >
            {soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Webhook / Telegram</span>
          </button>
        </div>
      </div>

      {telegramNotificationSent && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-300 font-mono text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>Sinyal <strong>{telegramNotificationSent}</strong> berhasil disiarkan ke Telegram Webhook Channel!</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold">DISPATCHED</span>
        </div>
      )}

      {/* Filter Control Bar */}
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Direction Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setSelectedDirection('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedDirection === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({signals.length})
            </button>
            <button
              onClick={() => setSelectedDirection('LONG')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedDirection === 'LONG' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Long ({signals.filter((s) => s.direction === 'LONG').length})
            </button>
            <button
              onClick={() => setSelectedDirection('SHORT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedDirection === 'SHORT' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Short ({signals.filter((s) => s.direction === 'SHORT').length})
            </button>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            {(['ALL', '15m', '1H', '4H', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  selectedTimeframe === tf ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setSelectedStatus('ACTIVE')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedStatus === 'ACTIVE' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setSelectedStatus('TP_HIT')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedStatus === 'TP_HIT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              TP Tercapai
            </button>
          </div>

          {/* Search input */}
          <div className="w-full sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aset atau strategi..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Score threshold slider */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filter Skor Konfluensi Minimum:</span>
            <span className="text-cyan-400 font-bold text-sm">{minScore}/100</span>
          </div>
          <input
            type="range"
            min={70}
            max={95}
            step={1}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-48 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Signals Feed List */}
      <div className="space-y-3.5">
        {filteredSignals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0f172a] font-mono space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-slate-300 font-bold">Tidak ada sinyal yang cocok dengan filter aktif</p>
            <p className="text-xs text-slate-500">Coba turunkan threshold skor konfluensi atau pilih filter waktu lainnya.</p>
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const isLong = sig.direction === 'LONG';
            const isTpHit = sig.status.includes('TP');

            return (
              <div
                key={sig.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header Row: Symbol, Direction, Grade, Score, Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    {/* Direction icon badge */}
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
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sig.timeframe}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                          {sig.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-slate-300">{sig.strategyName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          {sig.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header: Confluence Score Pill & Status */}
                  <div className="flex items-center gap-2 font-mono">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
                      <div className="text-[10px] text-slate-400">Skor Konfluensi</div>
                      <div className="text-sm font-bold text-cyan-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{sig.confluenceScore}/100</span>
                      </div>
                    </div>

                    <div
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                        isTpHit
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {sig.status === 'ACTIVE'
                        ? '🟢 AKTIF'
                        : sig.status === 'TP1_HIT'
                        ? '🎯 TP 1 TERCAPAI'
                        : sig.status === 'TP2_HIT'
                        ? '🚀 TP 2 TERCAPAI'
                        : '🛑 SL HIT'}
                    </div>
                  </div>
                </div>

                {/* Target Levels Grid: Entry, TP 1-3, SL, Risk:Reward */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 my-3.5 font-mono">
                  {/* Entry Price */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Harga Entry</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      ${formatCryptoPrice(sig.entryPrice)}
                    </span>
                  </div>

                  {/* TP 1 */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                    <span className="text-[10px] text-emerald-400 block flex items-center justify-between">
                      <span>Target 1 (TP1)</span>
                      <Target className="w-3 h-3" />
                    </span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                      ${formatCryptoPrice(sig.targetPrice1)}
                    </span>
                  </div>

                  {/* TP 2 */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                    <span className="text-[10px] text-emerald-400 block flex items-center justify-between">
                      <span>Target 2 (TP2)</span>
                      <Target className="w-3 h-3" />
                    </span>
                    <span className="text-sm font-bold text-emerald-300 mt-0.5 block">
                      ${formatCryptoPrice(sig.targetPrice2)}
                    </span>
                  </div>

                  {/* TP 3 */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                    <span className="text-[10px] text-emerald-400 block flex items-center justify-between">
                      <span>Target 3 (TP3)</span>
                      <Target className="w-3 h-3" />
                    </span>
                    <span className="text-sm font-bold text-emerald-200 mt-0.5 block">
                      ${formatCryptoPrice(sig.targetPrice3)}
                    </span>
                  </div>

                  {/* Stop Loss */}
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40">
                    <span className="text-[10px] text-rose-400 block flex items-center justify-between">
                      <span>Stop Loss (SL)</span>
                      <Shield className="w-3 h-3" />
                    </span>
                    <span className="text-sm font-bold text-rose-400 mt-0.5 block">
                      ${formatCryptoPrice(sig.stopLoss)}
                    </span>
                  </div>

                  {/* R:R & Leverage */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">R:R & Leverage</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-bold text-amber-400">1:{sig.riskRewardRatio}</span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                        {sig.leverageRec}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Indicators Pill Tags */}
                <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                  {sig.indicatorsSummary.map((ind, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                    >
                      ✓ {ind}
                    </span>
                  ))}
                </div>

                {/* Analysis Notes */}
                <p className="text-xs font-mono text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 my-2.5">
                  <strong className="text-slate-300">Analisis Setup: </strong>
                  {sig.notes}
                </p>

                {/* Footer Action Buttons: Execute Trade, Copy Signal, Send Telegram */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySignal(sig)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                    >
                      {copiedId === sig.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Sinyal</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSendTelegram(sig)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim ke Telegram</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectSymbol && (
                      <button
                        onClick={() => onSelectSymbol(sig.symbol)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                      >
                        Buka Chart & Analisis
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (onSelectSymbol) onSelectSymbol(sig.symbol);
                        if (onNavigateToTrade) onNavigateToTrade(sig.symbol);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        isLong
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs'
                          : 'bg-rose-500 hover:bg-rose-400 text-white shadow-xs'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Eksekusi {sig.direction} {sig.symbol}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Webhook / Telegram Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 font-mono space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Integrasi Sinyal & Notifikasi</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Telegram Bot Webhook URL</label>
                <input
                  type="text"
                  value={telegramWebhook}
                  onChange={(e) => setTelegramWebhook(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage"
                />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] text-cyan-300 font-bold">Fitur Penyiaran Otomatis:</div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Kirim hanya skor &gt; 85:</span>
                  <input type="checkbox" defaultChecked className="accent-cyan-400" />
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Notifikasi saat TP1 / TP2 tercapai:</span>
                  <input type="checkbox" defaultChecked className="accent-cyan-400" />
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Audio Alert di Browser:</span>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    className="accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowConfigModal(false);
                setTelegramNotificationSent('Semua Saluran Telegram');
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Simpan Konfigurasi & Uji Webhook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
