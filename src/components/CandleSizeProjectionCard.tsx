import React, { useState, useMemo } from 'react';
import {
  OHLCVCandle,
  Timeframe,
} from '../types/crypto.types';
import {
  analyzeCandleSizeProjection,
  CandleProjectionAnalysis,
} from '../services/indicators/candleProjectionEngine';
import {
  Maximize2,
  TrendingUp,
  TrendingDown,
  Target,
  CornerDownRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  BarChart2,
  Zap,
  Copy,
  Check,
  Scale,
  Compass,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface CandleSizeProjectionCardProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  currentPrice?: number;
  lang?: Language;
  theme?: 'dark' | 'light';
}

export const CandleSizeProjectionCard: React.FC<CandleSizeProjectionCardProps> = ({
  candles,
  symbol,
  timeframe,
  currentPrice: overridePrice,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'reentry' | 'improvement'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const livePrice = overridePrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  const data: CandleProjectionAnalysis = useMemo(() => {
    return analyzeCandleSizeProjection(candles, livePrice, symbol, timeframe);
  }, [candles, livePrice, symbol, timeframe]);

  const { trendStatus, metrics, projection, reentryZone, improvement } = data;

  const formatPrice = (p: number) => formatCryptoPrice(p);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTrendBadgeColor = () => {
    if (trendStatus.bias === 'BULLISH') {
      return isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700';
    }
    if (trendStatus.bias === 'BEARISH') {
      return isDark ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-300 text-rose-700';
    }
    return isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-700';
  };

  const getGradeBadge = (grade: string) => {
    if (grade === 'A+' || grade === 'A') {
      return isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (grade === 'B') {
      return isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-sky-800 border-sky-300';
    }
    return isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div
      id="candle-size-projection-card"
      className={`rounded-[2px] border p-5 transition-all duration-200 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* 1. HEADER SECTION */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[2px] bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 shadow-xs">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight font-display">
                {isId ? 'Proyeksi Ukuran Candle & Target Ekstensi' : 'Candle Size Projection & Extension Targets'}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-[2px] border font-bold ${getTrendBadgeColor()}`}>
                {trendStatus.bias === 'BULLISH' ? <TrendingUp className="w-3 h-3" /> : trendStatus.bias === 'BEARISH' ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                {isId ? trendStatus.labelId : trendStatus.labelEn}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {symbol} • {timeframe} • {isId ? 'Volatilitas Bar Saat Ini' : 'Current Bar Volatility'}: <span className="font-semibold text-pink-400">{metrics.rangeVsAtrRatio.toFixed(2)}x ATR</span> (${formatPrice(metrics.candleRange)} / {metrics.candleRangePercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Quick Badges & Copy Controls */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold ${
            isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Score: {improvement.confidenceScore}%</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getGradeBadge(improvement.grade)}`}>
              Grade {improvement.grade}
            </span>
          </div>

          <button
            onClick={() => handleCopy(
              `[AKIRAQU CANDLE PROJECTION]\nSymbol: ${symbol} (${timeframe})\nTrend: ${trendStatus.labelId}\nTarget 1: $${formatPrice(projection.target1)} (${projection.target1Percent.toFixed(2)}%)\nTarget 2: $${formatPrice(projection.target2)} (${projection.target2Percent.toFixed(2)}%)\nRe-entry Zone: $${formatPrice(reentryZone.optimalPrice)} (Range: $${formatPrice(reentryZone.lowerBound)} - $${formatPrice(reentryZone.upperBound)})\nInvalidation: $${formatPrice(reentryZone.invalidationLevel)} (-${reentryZone.invalidationPercent.toFixed(2)}%)\nRRR: 1 : ${reentryZone.riskRewardRatioTarget2}`,
              'all-projection'
            )}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-pink-600/20 hover:bg-pink-600/30 border-pink-500/40 text-pink-300'
                : 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700'
            }`}
            title="Salin Parameter Lengkap"
          >
            {copiedKey === 'all-projection' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedKey === 'all-projection' ? 'Tersalin' : 'Salin Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. TOP TELEMETRY PILLARS (4 CORE METRICS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        {/* Metric 1: Trend Status & Strength */}
        <div className={`p-3 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-pink-400" />
              <span>{isId ? 'Status Tren & Bias' : 'Trend Status & Bias'}</span>
            </span>
            <span className="font-bold text-pink-400">{trendStatus.strength}%</span>
          </div>
          <div className={`text-sm font-bold font-mono truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {isId ? trendStatus.labelId : trendStatus.labelEn}
          </div>
          <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className={`h-full transition-all duration-300 ${trendStatus.bias === 'BULLISH' ? 'bg-emerald-400' : trendStatus.bias === 'BEARISH' ? 'bg-rose-400' : 'bg-amber-400'}`}
              style={{ width: `${trendStatus.strength}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Projected Target 1 & 2 */}
        <div className={`p-3 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isId ? 'Target Proyeksi 1 (T1)' : 'Projected Target 1'}</span>
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              {projection.target1Percent >= 0 ? '+' : ''}{projection.target1Percent.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm font-extrabold font-mono text-emerald-400 tabular-nums">
            ${formatPrice(projection.target1)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            T2: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>${formatPrice(projection.target2)}</span> ({projection.target2Percent >= 0 ? '+' : ''}{projection.target2Percent.toFixed(2)}%)
          </div>
        </div>

        {/* Metric 3: Re-entry Zone (OTE) */}
        <div className={`p-3 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5 text-sky-400" />
              <span>{isId ? 'Zona Re-Entry (OTE 61.8%)' : 'Re-entry Zone (OTE)'}</span>
            </span>
            <span className="text-sky-400 font-bold font-mono">Golden</span>
          </div>
          <div className="text-sm font-extrabold font-mono text-sky-400 tabular-nums">
            ${formatPrice(reentryZone.optimalPrice)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
            Range: ${formatPrice(reentryZone.lowerBound)} - ${formatPrice(reentryZone.upperBound)}
          </div>
        </div>

        {/* Metric 4: Status Improvement & Risk:Reward */}
        <div className={`p-3 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isId ? 'Rasio R:R & Kualitas' : 'R:R Ratio & Quality'}</span>
            </span>
            <span className="text-indigo-400 font-bold font-mono">1 : {reentryZone.riskRewardRatioTarget2}</span>
          </div>
          <div className={`text-sm font-bold font-mono truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {isId ? improvement.statusLabelId : improvement.statusLabelEn}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Stop Loss: <span className="text-rose-400 font-semibold">${formatPrice(reentryZone.invalidationLevel)}</span> (-{reentryZone.invalidationPercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className={`flex border-b mb-4 overflow-x-auto no-scrollbar gap-1 text-xs font-mono ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-2 px-3 border-b-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-pink-500 text-pink-400 bg-pink-500/10'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isId ? 'Ikhtisar Lengkap (All-in-One)' : 'Complete Overview'}</span>
        </button>

        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center gap-2 py-2 px-3 border-b-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'targets'
              ? 'border-pink-500 text-pink-400 bg-pink-500/10'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>{isId ? 'Target Proyeksi (Proj Target)' : 'Projected Targets'}</span>
        </button>

        <button
          onClick={() => setActiveTab('reentry')}
          className={`flex items-center gap-2 py-2 px-3 border-b-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reentry'
              ? 'border-pink-500 text-pink-400 bg-pink-500/10'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>{isId ? 'Zona Re-Entry & Retest' : 'Re-entry & Retest Zone'}</span>
        </button>

        <button
          onClick={() => setActiveTab('improvement')}
          className={`flex items-center gap-2 py-2 px-3 border-b-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'improvement'
              ? 'border-pink-500 text-pink-400 bg-pink-500/10'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isId ? 'Status Improvement & Taktikal' : 'Improvement & Actions'}</span>
        </button>
      </div>

      {/* 4. TAB PANELS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Dual Column: Trend & Metrics vs Visual Candle Extension Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Trend & Candlestick Anatomy Breakdown */}
            <div className={`lg:col-span-6 p-4 rounded-[2px] border space-y-3 ${
              isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Activity className="w-4 h-4 text-pink-400" />
                  <span>{isId ? 'Anatomi Candle & Struktur Tren' : 'Candle Anatomy & Trend Stack'}</span>
                </span>
                <span className="text-[10px] text-slate-400">ATR 14: ${formatPrice(metrics.atr14)}</span>
              </div>

              {/* Body vs Wick Proportion Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{isId ? 'Dominasi Body (Kekuatan Impulsif)' : 'Body Dominance (Impulse)'}</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{metrics.bodyRatio.toFixed(1)}%</span>
                </div>
                <div className={`h-2.5 w-full rounded-[1px] overflow-hidden flex ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div
                    className={`h-full ${metrics.isBullish ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${metrics.bodyRatio}%` }}
                    title={`Body: ${metrics.bodyRatio.toFixed(1)}%`}
                  />
                  <div
                    className="h-full bg-slate-500"
                    style={{ width: `${100 - metrics.bodyRatio}%` }}
                    title={`Wick / Sumbu: ${(100 - metrics.bodyRatio).toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Upper Wick: ${formatPrice(metrics.upperWick)}</span>
                  <span>Lower Wick: ${formatPrice(metrics.lowerWick)}</span>
                </div>
              </div>

              {/* EMA Ribbon Confirmation */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
                <div className={`p-2 rounded-[2px] border ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                }`}>
                  <span className="text-slate-400 block text-[10px]">EMA 9</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>${formatPrice(trendStatus.ema9)}</span>
                </div>
                <div className={`p-2 rounded-[2px] border ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                }`}>
                  <span className="text-slate-400 block text-[10px]">EMA 21</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>${formatPrice(trendStatus.ema21)}</span>
                </div>
                <div className={`p-2 rounded-[2px] border ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                }`}>
                  <span className="text-slate-400 block text-[10px]">EMA 50</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>${formatPrice(trendStatus.ema50)}</span>
                </div>
              </div>

              {/* Description */}
              <p className={`text-[11px] leading-relaxed p-2.5 rounded-[2px] border ${
                isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
              }`}>
                💡 <strong className="text-pink-400">{isId ? 'Diagnosa:' : 'Diagnosis:'}</strong> {isId ? trendStatus.descriptionId : trendStatus.descriptionEn}
              </p>
            </div>

            {/* Right: Visual Projection Targets & Ladder */}
            <div className={`lg:col-span-6 p-4 rounded-[2px] border space-y-3 ${
              isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>{isId ? 'Tangga Ekstensi Target Proyeksi' : 'Projection Extension Ladder'}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">
                  Bias: {projection.direction}
                </span>
              </div>

              {/* Target Ladder Rows */}
              <div className="space-y-2">
                {/* Target 3 */}
                <div className={`flex items-center justify-between p-2 rounded-[2px] border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 block uppercase">
                      Target 3 (Max Volatility Spillover - 2.618x ATR)
                    </span>
                    <span className={`text-xs font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>${formatPrice(projection.target3)}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                    {projection.target3Percent >= 0 ? '+' : ''}{projection.target3Percent.toFixed(2)}%
                  </span>
                </div>

                {/* Target 2 */}
                <div className={`flex items-center justify-between p-2 rounded-[2px] border ${
                  isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-300'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 block uppercase">
                      Target 2 (Standard Momentum - 1.618x ATR)
                    </span>
                    <span className="text-xs font-extrabold text-emerald-400">${formatPrice(projection.target2)}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    {projection.target2Percent >= 0 ? '+' : ''}{projection.target2Percent.toFixed(2)}%
                  </span>
                </div>

                {/* Target 1 */}
                <div className={`flex items-center justify-between p-2 rounded-[2px] border ${
                  isDark ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-emerald-100/70 border-emerald-400'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 block uppercase">
                      Target 1 (Base Extension - 1.0x ATR)
                    </span>
                    <span className="text-xs font-extrabold text-emerald-400">${formatPrice(projection.target1)}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/30 px-2 py-0.5 rounded">
                    {projection.target1Percent >= 0 ? '+' : ''}{projection.target1Percent.toFixed(2)}%
                  </span>
                </div>

                {/* Current Price Anchor */}
                <div className={`flex items-center justify-between p-2 rounded-[2px] border ${
                  isDark ? 'bg-pink-950/20 border-pink-500/30' : 'bg-pink-50 border-pink-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-pink-400" />
                    <span className={`text-[11px] font-bold ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>Live Anchor Price</span>
                  </div>
                  <span className="text-xs font-bold text-pink-400">${formatPrice(livePrice)}</span>
                </div>

                {/* Invalidation Level */}
                <div className={`flex items-center justify-between p-2 rounded-[2px] border ${
                  isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 block uppercase">
                      Batas Invalidasi / Stop Loss
                    </span>
                    <span className={`text-xs font-extrabold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>${formatPrice(reentryZone.invalidationLevel)}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    -{reentryZone.invalidationPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJ TARGET */}
      {activeTab === 'targets' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-500">TARGET 1 (CONSERVATIVE)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">1.0x ATR</span>
              </div>
              <div className="text-lg font-extrabold text-emerald-400 tabular-nums">
                ${formatPrice(projection.target1)}
              </div>
              <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Target konservatif untuk mengamankan 40%-50% keuntungan dari posisi aktif.
              </p>
            </div>

            <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-emerald-500/40 shadow-sm' : 'bg-emerald-50 border-emerald-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-500">TARGET 2 (MOMENTUM)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">1.618 Fib Ext</span>
              </div>
              <div className="text-lg font-extrabold text-emerald-400 tabular-nums">
                ${formatPrice(projection.target2)}
              </div>
              <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Target ekspansi penuh berdasarkan proyeksi rasio emas Fibonacci 1.618.
              </p>
            </div>

            <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-500">TARGET 3 (SPILLOVER)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">2.618x ATR</span>
              </div>
              <div className="text-lg font-extrabold text-emerald-400 tabular-nums">
                ${formatPrice(projection.target3)}
              </div>
              <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Target puncak saat terjadi lonjakan volume abnormal / short squeeze.
              </p>
            </div>
          </div>

          {/* Range Proyeksi Bar Berikutnya */}
          <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4" />
              <span>{isId ? 'Estimasi Rentang Bar Candle Berikutnya (Next Bar Projection)' : 'Next Candle Projected Volatility Range'}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">{isId ? 'Rentang Min - Max ($)' : 'Min - Max Range ($)'}</span>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>${formatPrice(projection.projectedRangeUsd.min)} - ${formatPrice(projection.projectedRangeUsd.max)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isId ? 'Rentang Min - Max (%)' : 'Min - Max Range (%)'}</span>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{projection.projectedRangePercent.min.toFixed(2)}% - {projection.projectedRangePercent.max.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isId ? 'Proyeksi High Bar' : 'Projected High Bar'}</span>
                <span className="font-bold text-emerald-400">${formatPrice(projection.projectedNextHigh)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isId ? 'Proyeksi Low Bar' : 'Projected Low Bar'}</span>
                <span className="font-bold text-rose-400">${formatPrice(projection.projectedNextLow)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REENTRY ZONE */}
      {activeTab === 'reentry' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OTE Golden Zone */}
            <div className={`p-4 rounded-[2px] border space-y-3 ${
              isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <CornerDownRight className="w-4 h-4" />
                  <span>{isId ? 'Zona Re-entry Optimal (OTE 61.8% - 78.6%)' : 'Optimal Trade Entry (OTE)'}</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30">
                  Golden Retest
                </span>
              </div>

              <div className={`p-3 rounded-[2px] border ${
                isDark ? 'bg-sky-950/20 border-sky-500/30' : 'bg-sky-50 border-sky-200'
              }`}>
                <span className="text-[10px] text-slate-400 block uppercase">{isId ? 'Harga Re-entry Utama (Golden Pocket)' : 'Primary Re-entry Price'}</span>
                <span className="text-xl font-extrabold text-sky-400 tabular-nums">
                  ${formatPrice(reentryZone.optimalPrice)}
                </span>
                <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Area Retest: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>${formatPrice(reentryZone.lowerBound)}</strong> s/d <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>${formatPrice(reentryZone.upperBound)}</strong>
                </div>
              </div>

              <div className={`space-y-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <p>• <strong>Dynamic EMA Pullback:</strong> Level support bergerak terdeteksi di level <span className="text-pink-400 font-bold">${formatPrice(reentryZone.dynamicEmaPullback)}</span>.</p>
                <p>• <strong>Fair Value Gap (FVG):</strong> {reentryZone.fvgImbalance.hasGap ? <span className="text-emerald-400 font-bold">Imbalance aktif ($${formatPrice(reentryZone.fvgImbalance.bottom)} - $${formatPrice(reentryZone.fvgImbalance.top)})</span> : <span className="text-slate-400">Tidak ada celah FVG terbuka</span>}.</p>
              </div>
            </div>

            {/* Risk:Reward & Invalidation Boundary */}
            <div className={`p-4 rounded-[2px] border space-y-3 ${
              isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>{isId ? 'Batas Invalidasi & Parameter Risiko' : 'Risk & Invalidation Protocol'}</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                  Strict Cut Loss
                </span>
              </div>

              <div className={`p-3 rounded-[2px] border ${
                isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'
              }`}>
                <span className="text-[10px] text-slate-400 block uppercase">{isId ? 'Garis Invalidasi Mutlak (Stop Loss)' : 'Hard Invalidation Level'}</span>
                <span className="text-xl font-extrabold text-rose-400 tabular-nums">
                  ${formatPrice(reentryZone.invalidationLevel)}
                </span>
                <div className="text-[11px] text-rose-400 mt-1">
                  Jarak Resiko: <strong>-{reentryZone.invalidationPercent.toFixed(2)}%</strong> dari harga pasar saat ini.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className={`p-2.5 rounded-[2px] border ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                }`}>
                  <span className="text-slate-400 block text-[10px]">R:R ke Target 1</span>
                  <span className="font-bold text-emerald-400 text-sm">1 : {reentryZone.riskRewardRatioTarget1}</span>
                </div>
                <div className={`p-2.5 rounded-[2px] border ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                }`}>
                  <span className="text-slate-400 block text-[10px]">R:R ke Target 2</span>
                  <span className="font-bold text-emerald-400 text-sm">1 : {reentryZone.riskRewardRatioTarget2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STATUS IMPROVEMENT & ACTIONABLE ADVICE */}
      {activeTab === 'improvement' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Status Header Banner */}
          <div className={`p-4 rounded-[2px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDark ? 'bg-[#0b0f19] border-pink-500/30' : 'bg-pink-50/50 border-pink-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold uppercase text-pink-400">
                  {isId ? 'Status Kualitas & Peningkatan Sistem' : 'System Quality & Improvement Telemetry'}
                </span>
              </div>
              <h4 className={`text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {isId ? improvement.statusLabelId : improvement.statusLabelEn}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isId
                  ? 'Kalkulasi multivariat berdasarkan konfirmasi volume bar, rasio body-to-wick, dan keselarasan pita EMA.'
                  : 'Multivariate calculation based on volume validation, body dominance, and EMA alignment.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{isId ? 'Tingkat Akurasi Proyeksi' : 'Confidence Score'}</span>
                <span className="text-lg font-black text-emerald-400">{improvement.confidenceScore}%</span>
              </div>
              <div className={`px-3 py-2 rounded-[2px] text-sm font-black border ${getGradeBadge(improvement.grade)}`}>
                GRADE {improvement.grade}
              </div>
            </div>
          </div>

          {/* 4 Actionable Tactical Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {improvement.tacticalAdvice.map((adv) => {
              const isAction = adv.type === 'ACTION';
              const isOpp = adv.type === 'OPPORTUNITY';
              const isRisk = adv.type === 'RISK';

              const borderClass = isAction
                ? isDark ? 'border-pink-500/30 bg-pink-950/15' : 'border-pink-200 bg-pink-50/70'
                : isOpp
                ? isDark ? 'border-emerald-500/30 bg-emerald-950/15' : 'border-emerald-200 bg-emerald-50/70'
                : isRisk
                ? isDark ? 'border-rose-500/30 bg-rose-950/15' : 'border-rose-200 bg-rose-50/70'
                : isDark ? 'border-amber-500/30 bg-amber-950/15' : 'border-amber-200 bg-amber-50/70';

              const iconColor = isAction
                ? 'text-pink-400'
                : isOpp
                ? 'text-emerald-400'
                : isRisk
                ? 'text-rose-400'
                : 'text-amber-400';

              return (
                <div key={adv.id} className={`p-3.5 rounded-[2px] border ${borderClass} space-y-1.5`}>
                  <div className="flex items-center gap-2">
                    <span className={iconColor}>
                      {isAction ? <Zap className="w-4 h-4" /> : isOpp ? <CheckCircle2 className="w-4 h-4" /> : isRisk ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </span>
                    <strong className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {isId ? adv.titleId : adv.titleEn}
                    </strong>
                  </div>
                  <p className={`text-[11px] leading-relaxed pl-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isId ? adv.descriptionId : adv.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
