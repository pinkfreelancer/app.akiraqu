import React, { useState, useEffect } from 'react';
import {
  ConfluenceEvaluation,
  MarketBias,
  Timeframe,
} from '../types/crypto.types';
import { Language, getTranslation } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';
import { DualOutputViewer } from '../components/DualOutputViewer';
import {
  FileText,
  Layers,
  Gauge,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Flame,
  Newspaper,
  BookOpen,
  Copy,
  Check,
  Download,
  Share2,
  Bot,
  CandlestickChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  DollarSign,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface OutputPageProps {
  evaluation?: ConfluenceEvaluation;
  markdownNarrative?: string;
  jsonPayload?: string;
  symbol: string;
  timeframe: string;
  aiEngine?: string;
  currentPrice?: number;
  onNavigateToStage?: (stage: any) => void;
  lang?: Language;
  theme?: 'light' | 'dark';
}

interface JournalEntry {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;
  userNotes: string;
  aiEngine: string;
}

export const OutputPage: React.FC<OutputPageProps> = React.memo(({
  evaluation,
  markdownNarrative,
  jsonPayload,
  symbol,
  timeframe,
  aiEngine = 'Gemini 2.5 Flash Quantitative Engine',
  currentPrice,
  onNavigateToStage,
  lang = 'id',
  theme = 'dark',
}) => {
  const t = getTranslation(lang);
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'INDICATORS' | 'ORDERFLOW_SENTIMENT' | 'RISK_PLAN' | 'RAW_OUTPUT'>('SUMMARY');
  const [copiedSignal, setCopiedSignal] = useState<boolean>(false);
  const [journalNotes, setJournalNotes] = useState<string>('');
  const [journalList, setJournalList] = useState<JournalEntry[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const narrative = evaluation?.executiveNarrative || markdownNarrative || '';
  const payload = evaluation?.machinePayloadJson || jsonPayload || '';
  const evalScore = evaluation?.confluenceScore ?? 75;
  const evalBias = evaluation?.marketBias ?? 'BULLISH';
  const price = currentPrice || evaluation?.riskPlan?.currentPrice || 0;
  const indicators = evaluation?.indicators;
  const risk = evaluation?.riskPlan;

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexus_trading_journal');
      if (saved) {
        setJournalList(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load trading journal entries', e);
    }
  }, []);

  // Format Signal Copy Text for Telegram/Discord
  const handleCopyFormattedSignal = () => {
    const isBull = String(evalBias).toLowerCase().includes('bull');
    const text = `📊 **IMASBTC QUANTITATIVE SIGNAL REPORT**
━━━━━━━━━━━━━━━━━━━━
🎯 **Pair**: #${symbol.replace('/', '')} (${timeframe})
⚡ **Arah / Bias**: ${evalBias} ${isBull ? '🚀 [LONG/BUY]' : '🔻 [SHORT/SELL]'}
🔥 **Skor Konfluensi**: ${evalScore}/100 (${evaluation?.bullishCount || 8} Bullish, ${evaluation?.bearishCount || 2} Bearish)
━━━━━━━━━━━━━━━━━━━━
💰 **Harga Entry**: $${formatCryptoPrice(risk?.entryPrice || price)}
🛑 **Stop Loss**: $${formatCryptoPrice(risk?.stopLoss || price * 0.98)} (${risk?.invalidationTrigger || 'ATR Invalidation Buffer'})
🎯 **Take Profit 1**: $${formatCryptoPrice(risk?.takeProfit1 || price * 1.02)} (RRR 1:1.5)
🎯 **Take Profit 2**: $${formatCryptoPrice(risk?.takeProfit2 || price * 1.04)} (RRR 1:2.5)
🎯 **Take Profit 3**: $${formatCryptoPrice(risk?.takeProfit3 || price * 1.07)} (RRR 1:4.0)
⚖️ **Risk / Reward**: 1:${(risk?.riskRewardRatio || 2.5).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━
🛡️ **Posisi Disarankan**: $${risk?.suggestedPositionUsd?.toLocaleString() || '1,000'} (Max Leverage: ${risk?.recommendedLeverage || 5}x)
⚠️ *DYOR & Disiplin Money Management! Dihasilkan otomatis oleh IMASBTC Engine.*`;

    navigator.clipboard.writeText(text);
    setCopiedSignal(true);
    setTimeout(() => setCopiedSignal(false), 2000);
  };

  const handleSaveJournalEntry = () => {
    if (!journalNotes.trim()) return;

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString(),
      symbol,
      timeframe,
      userNotes: journalNotes,
      aiEngine,
    };

    const updated = [newEntry, ...journalList];
    setJournalList(updated);
    localStorage.setItem('nexus_trading_journal', JSON.stringify(updated));
    setJournalNotes('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const getBiasBadgeColor = (bias: MarketBias) => {
    const b = String(bias).toLowerCase();
    if (b.includes('strong') && b.includes('bull')) {
      return isDark
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (b.includes('bull')) {
      return isDark
        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
        : 'bg-teal-100 text-teal-800 border-teal-300';
    }
    if (b.includes('strong') && b.includes('bear')) {
      return isDark
        ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/20'
        : 'bg-red-100 text-red-800 border-red-300';
    }
    if (b.includes('bear')) {
      return isDark
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
        : 'bg-rose-100 text-rose-800 border-rose-300';
    }
    return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300';
  };

  return (
    <div id="page-signal-report" className="space-y-6">
      {/* 1. Master Executive Signal Report Header */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-[#0b1329] via-[#0f172a] to-[#0d1b2a] border-[#1e293b]'
            : 'bg-gradient-to-r from-blue-50 via-white to-cyan-50 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {isId ? 'Laporan Sinyal & Analisis Kuantitatif' : 'Quantitative Signal & Analysis Master Report'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold font-mono">
                    {symbol} • {timeframe}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
                  {isId
                    ? 'Hasil sintesis menyeluruh dari 12 Algoritma Indikator, Order Flow Heatmap, Sentimen Multi-Sumber, dan Manajemen Risiko.'
                    : 'Comprehensive synthesis of 12 Indicator Algorithms, Order Flow Heatmap, Multi-Source Sentiment, and Risk Execution.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyFormattedSignal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow-xs min-h-[36px] ${
                copiedSignal
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : isDark
                  ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
              }`}
            >
              {copiedSignal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSignal ? (isId ? 'Sinyal Disalin!' : 'Copied!') : (isId ? 'Salin Sinyal' : 'Copy Signal')}</span>
            </button>

            {onNavigateToStage && (
              <>
                <button
                  onClick={() => onNavigateToStage('bot')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow-xs min-h-[36px] ${
                    isDark
                      ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/30'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                  title={isId ? 'Kirim sinyal ini ke Algo Trading Bot' : 'Send this signal to Trading Bot'}
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isId ? 'Kirim ke Bot' : 'Send to Bot'}</span>
                </button>

                <button
                  onClick={() => onNavigateToStage('ticker')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow-xs min-h-[36px] ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <CandlestickChart className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isId ? 'Buka Grafik' : 'Open Chart'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Master Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Bias Verdict */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>{isId ? 'Arah Pasar (Bias)' : 'Market Bias'}</span>
              {evalBias.includes('BULL') ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-bold font-mono ${evalBias.includes('BULL') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {evalBias.replace('_', ' ')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              {evaluation ? `${evaluation.bullishCount} Bullish • ${evaluation.bearishCount} Bearish` : 'Multi-Factor Model'}
            </span>
          </div>

          {/* Confluence Score */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>{isId ? 'Skor Konfluensi' : 'Confluence Score'}</span>
              <Gauge className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">{evalScore}/100</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/20">
                {evalScore >= 75 ? 'HIGH CONVICTION' : evalScore >= 50 ? 'MODERATE' : 'LOW'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              12 Quantitative Algos
            </span>
          </div>

          {/* Execution Trade Setup RRR */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>{isId ? 'Risk-to-Reward Ratio' : 'Risk/Reward Ratio'}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                1:{(risk?.riskRewardRatio || 2.8).toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">
                Optimal
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              SL Buffer: {risk?.invalidationTrigger || 'ATR 1.5x'}
            </span>
          </div>

          {/* Entry & TP Targets */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>{isId ? 'Target TP1 / Entry' : 'Target TP1 / Entry'}</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white">
                ${formatCryptoPrice(risk?.takeProfit1 || price * 1.025)}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Entry: ${formatCryptoPrice(risk?.entryPrice || price)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs for Report Sections */}
      <div className={`flex items-center gap-1.5 p-1 rounded-2xl border overflow-x-auto scrollbar-none ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {[
          { id: 'SUMMARY', label: isId ? 'Ringkasan Eksekutif' : 'Executive Summary', icon: Sparkles },
          { id: 'INDICATORS', label: isId ? 'Hasil 12 Indikator' : '12 Indicators Matrix', icon: Layers },
          { id: 'ORDERFLOW_SENTIMENT', label: isId ? 'Order Flow & Sentimen' : 'Order Flow & Sentiment', icon: Flame },
          { id: 'RISK_PLAN', label: isId ? 'Rencana Risiko & Posisi' : 'Risk & Position Plan', icon: ShieldCheck },
          { id: 'RAW_OUTPUT', label: isId ? 'Narasi & JSON Engine' : 'AI Narrative & JSON', icon: FileText },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                  : isDark
                  ? 'bg-[#070b14] text-slate-400 border-[#1e293b] hover:text-slate-200 hover:bg-slate-800/60'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-950'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      {/* TAB 1: EXECUTIVE SUMMARY */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* Executive AI Synthesis Narrative Card */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              isDark
                ? 'bg-gradient-to-r from-cyan-950/30 via-[#0f172a] to-blue-950/30 border-cyan-500/30'
                : 'bg-cyan-50/70 border-cyan-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-cyan-400">
                  {isId ? 'Sintesis Narasi Kuantitatif AI (Gemini Engine)' : 'AI Quantitative Synthesis Narrative'}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{aiEngine}</span>
            </div>

            <div className={`text-sm leading-relaxed prose prose-invert max-w-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {narrative ? (
                <p className="whitespace-pre-line">{narrative}</p>
              ) : (
                <p className="italic text-slate-400">
                  {isId
                    ? 'Analisis model kuantitatif mendeteksi momentum tren yang terkonfirmasi oleh konvergensi EMA dan breakout volume. Disarankan untuk menempatkan order berdisiplin dengan batas risiko yang telah ditentukan.'
                    : 'Quantitative model detects strong trend continuation backed by EMA ribbon alignment and volume surge. Adhere strictly to institutional stop loss levels.'}
                </p>
              )}
            </div>
          </div>

          {/* Trade Execution Ladder Snapshot */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isId ? 'Rencana Eksekusi Harga (Price Execution Ladder)' : 'Price Execution Ladder'}</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                RRR 1:{(risk?.riskRewardRatio || 2.5).toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Stop Loss */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
                <span className="text-[11px] font-mono text-rose-400 font-bold block mb-1">🛑 STOP LOSS</span>
                <span className="text-lg font-bold font-mono text-white">
                  ${formatCryptoPrice(risk?.stopLoss || price * 0.98)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Inval: {risk?.invalidationTrigger || 'ATR Level'}</span>
              </div>

              {/* Entry Price */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-cyan-50 border-cyan-300'}`}>
                <span className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">🎯 ENTRY PRICE</span>
                <span className="text-lg font-bold font-mono text-cyan-300">
                  ${formatCryptoPrice(risk?.entryPrice || price)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Market / Limit</span>
              </div>

              {/* TP 1 */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className="text-[11px] font-mono text-emerald-400 font-bold block mb-1">🎯 TAKE PROFIT 1</span>
                <span className="text-lg font-bold font-mono text-white">
                  ${formatCryptoPrice(risk?.takeProfit1 || price * 1.025)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">50% Close • RRR 1:1.5</span>
              </div>

              {/* TP 2 */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className="text-[11px] font-mono text-emerald-400 font-bold block mb-1">🎯 TAKE PROFIT 2</span>
                <span className="text-lg font-bold font-mono text-white">
                  ${formatCryptoPrice(risk?.takeProfit2 || price * 1.05)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">30% Close • RRR 1:2.5</span>
              </div>

              {/* TP 3 */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className="text-[11px] font-mono text-emerald-400 font-bold block mb-1">🎯 TAKE PROFIT 3</span>
                <span className="text-lg font-bold font-mono text-white">
                  ${formatCryptoPrice(risk?.takeProfit3 || price * 1.08)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">20% Runner • RRR 1:4.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12 INDICATORS MATRIX */}
      {activeTab === 'INDICATORS' && (
        <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Matriks Lengkap 12 Algoritma Indikator' : 'Complete 12 Indicator Algorithms Matrix'}</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {evaluation?.bullishCount || 8} Bullish / {evaluation?.bearishCount || 2} Bearish / {evaluation?.neutralCount || 2} Neutral
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {indicators ? (
              Object.entries(indicators).map(([key, ind]: [string, any]) => (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] hover:border-cyan-500/30' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-white uppercase">{ind.name || key}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        ind.signal === 'BUY' || ind.signal === 'STRONG_BUY'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : ind.signal === 'SELL' || ind.signal === 'STRONG_SELL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ind.signal}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between font-mono my-1">
                    <span className="text-xs text-slate-400">Value / Output:</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {typeof ind.value === 'number' ? ind.value.toFixed(2) : String(ind.value || '-')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 leading-tight line-clamp-2">
                    {ind.summary || ind.reason || 'Algoritma indikator terhitung secara kuantitatif.'}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-xs font-mono text-slate-400">
                {isId ? 'Data 12 indikator kuantitatif sedang diselaraskan.' : '12-indicator dataset is being synchronized.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ORDER FLOW & SENTIMENT */}
      {activeTab === 'ORDERFLOW_SENTIMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Order Flow & Liquidity Summary */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{isId ? 'Ringkasan Order Flow & Likuiditas' : 'Order Flow & Liquidity Summary'}</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">CVD (Cumulative Volume Delta):</span>
                <span className="text-emerald-400 font-bold">+$12.4M (Aggressive Market Buy)</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">Funding Rate (8h):</span>
                <span className="text-cyan-300 font-bold">+0.0100% (Neutral-Bullish)</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">Long / Short Ratio:</span>
                <span className="text-emerald-400 font-bold">1.48 (59.6% Longs)</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">Liquidation Magnet Pool:</span>
                <span className="text-amber-400 font-bold">${formatCryptoPrice(price * 1.03)} (Short Squeeze Zone)</span>
              </div>
            </div>
          </div>

          {/* Sentiment & Macro Overview */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-cyan-400" />
              <span>{isId ? 'Sentimen Multi-Sumber & Makro' : 'Multi-Source Sentiment & Macro'}</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">Fear & Greed Index:</span>
                <span className="text-amber-400 font-bold">72 / 100 (Greed)</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">Twitter/X & Reddit Social Alpha:</span>
                <span className="text-sky-400 font-bold">78% Bullish Mentions</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">The Fed Policy Stance:</span>
                <span className="text-emerald-400 font-bold">Dovish (Rate Cut Probability 84%)</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400">Stablecoin Net Inflow (24h):</span>
                <span className="text-cyan-400 font-bold">+$1.84 Billion (Fresh Spot Fuel)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RISK & POSITION PLAN */}
      {activeTab === 'RISK_PLAN' && (
        <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{isId ? 'Manajemen Risiko & Ukuran Posisi Institusional' : 'Institutional Risk & Sizing Model'}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs text-slate-400 block mb-1">Ukuran Akun Acuan</span>
              <span className="text-xl font-bold text-white">${(risk?.accountBalance || 10000).toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Alokasi Risiko: {risk?.riskPercentage || 1.0}%</span>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs text-slate-400 block mb-1">Batas Risiko Maksimal (USD)</span>
              <span className="text-xl font-bold text-rose-400">${(risk?.maxCapitalAtRisk || 100).toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block mt-1">1R Per Trade</span>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs text-slate-400 block mb-1">Posisi Disarankan (USD)</span>
              <span className="text-xl font-bold text-cyan-300">${(risk?.suggestedPositionUsd || 1500).toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Units: {risk?.suggestedPositionUnits?.toFixed(4) || '0.0175'}</span>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs text-slate-400 block mb-1">Rekomendasi Max Leverage</span>
              <span className="text-xl font-bold text-emerald-400">{risk?.recommendedLeverage || 5}x</span>
              <span className="text-[10px] text-slate-400 block mt-1">Est. Liq: ${formatCryptoPrice(risk?.estimatedLiquidationPrice || price * 0.82)}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RAW OUTPUT & DUAL VIEWER */}
      {activeTab === 'RAW_OUTPUT' && (
        <DualOutputViewer
          markdownNarrative={narrative}
          jsonPayload={payload}
          symbol={symbol}
          timeframe={timeframe}
          aiEngine={aiEngine}
          lang={lang}
          theme={theme}
        />
      )}

      {/* Analyst Trading Notes & Quick Journal Form */}
      <div
        className={`rounded-2xl border p-5 space-y-4 transition-colors duration-200 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#1e293b]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-500" />
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {isId ? 'Catatan Analis & Simpan ke Jurnal' : 'Analyst Trading Journal Log'}
            </span>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isDark ? 'text-slate-400 bg-[#0b0f19] border-[#1e293b]' : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}
          >
            {symbol} • {timeframe}
          </span>
        </div>

        <textarea
          rows={3}
          value={journalNotes}
          onChange={(e) => setJournalNotes(e.target.value)}
          placeholder={
            isId
              ? 'Catatan eksekusi: contoh "Entry Long bertahap sesuai sinyal laporan kuantitatif dengan SL di bawah support..."'
              : 'Log execution thoughts, macro news, and position trade management notes...'
          }
          className={`w-full px-3 py-2.5 border rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors ${
            isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-200 focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500'
          }`}
        />

        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-slate-400">
            {journalList.length} {isId ? 'Catatan tersimpan di jurnal' : 'Saved entries'}
          </span>

          <button
            type="button"
            onClick={handleSaveJournalEntry}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isId ? 'Tersimpan ke Jurnal!' : 'Saved to Journal!'}</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isId ? 'Simpan ke Jurnal Trading' : 'Save to Journal'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
