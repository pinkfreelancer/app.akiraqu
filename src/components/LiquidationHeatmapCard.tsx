import React, { useState, useMemo } from 'react';
import { OHLCVCandle, Timeframe } from '../types/crypto.types';
import { computeLiquidationHeatmap } from '../services/liquidation/liquidationEngine';
import {
  Flame,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Compass,
  Sparkles,
  Info,
  TrendingUp,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface LiquidationHeatmapCardProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  currentPrice?: number;
  lang?: Language;
  theme?: 'dark' | 'light';
}

export const LiquidationHeatmapCard: React.FC<LiquidationHeatmapCardProps> = ({
  candles,
  symbol,
  timeframe,
  currentPrice: overridePrice,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activeTab, setActiveTab] = useState<'summary' | 'clusters' | 'playbook'>('summary');
  const [selectedTier, setSelectedTier] = useState<'ALL' | '100x' | '50x' | '25x' | '10x'>('ALL');
  const [simLeverage, setSimLeverage] = useState<number>(50);
  const [simDirection, setSimDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [copiedPrice, setCopiedPrice] = useState<string | null>(null);

  const summary = useMemo(() => {
    return computeLiquidationHeatmap(candles, symbol, overridePrice);
  }, [candles, symbol, overridePrice]);

  const currentPrice = overridePrice || summary.currentPrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  const filteredClusters = useMemo(() => {
    if (selectedTier === 'ALL') return summary.clusters;
    return summary.clusters.filter((c) => c.leverageTier === selectedTier);
  }, [summary.clusters, selectedTier]);

  const shortClusters = filteredClusters.filter((c) => c.type === 'SHORT_LIQUIDATION');
  const longClusters = filteredClusters.filter((c) => c.type === 'LONG_LIQUIDATION');

  const formatPrice = (val: number) => {
    return formatCryptoPrice(val);
  };

  const handleCopyPrice = (price: number, label?: string) => {
    const formatted = formatPrice(price);
    navigator.clipboard.writeText(formatted);
    setCopiedPrice(label ? `${label}: $${formatted}` : `$${formatted}`);
    setTimeout(() => setCopiedPrice(null), 1800);
  };

  const simulatedLiqPrice = useMemo(() => {
    if (!currentPrice || currentPrice <= 0 || simLeverage <= 0) return 0;
    const maintenanceMargin = 0.006;
    if (simDirection === 'LONG') {
      return currentPrice * (1 - 1 / simLeverage + maintenanceMargin);
    } else {
      return currentPrice * (1 + 1 / simLeverage - maintenanceMargin);
    }
  }, [currentPrice, simLeverage, simDirection]);

  const collisionAlert = useMemo(() => {
    if (!simulatedLiqPrice || simulatedLiqPrice <= 0) return null;
    const relevantClusters = simDirection === 'LONG' ? longClusters : shortClusters;
    const closeCluster = relevantClusters.find((c) => {
      const diff = Math.abs(c.price - simulatedLiqPrice) / simulatedLiqPrice;
      return diff <= 0.015;
    });
    return closeCluster || null;
  }, [simulatedLiqPrice, simDirection, longClusters, shortClusters]);

  return (
    <div
      id="liquidation-heatmap-hybrid-card"
      className={`rounded-[2px] border p-5 transition-colors duration-200 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Toast feedback for price copy */}
      {copiedPrice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-[2px] bg-emerald-600 text-white font-mono text-xs shadow-lg">
          <Check className="w-3.5 h-3.5 text-white" />
          <span>{isId ? `Tersalin: ${copiedPrice}` : `Copied: ${copiedPrice}`}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[2px] bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-tight">
                {isId ? 'Peta Panas Likuidasi & Klaster Leverage' : 'Liquidation Heatmap & Leverage Clusters'}
              </h3>
              <span className={`px-2 py-0.5 rounded-[2px] text-xs font-mono font-semibold uppercase border ${
                isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isId ? 'Model Hibrida' : 'Hybrid Model'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {isId
                ? `Estimasi klaster likuidasi kontrak berjangka & zona tarikan likuiditas • ${symbol} (${timeframe})`
                : `Perpetual futures liquidation pools & magnetic liquidity sweeps • ${symbol} (${timeframe})`}
            </p>
          </div>
        </div>

        {/* Progressive Disclosure: Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center rounded-[2px] p-1 border text-xs font-mono ${
            isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              id="liq-tab-summary"
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? isDark ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isId ? 'Ringkas (Pemula)' : 'Summary (Beginner)'}</span>
            </button>
            <button
              id="liq-tab-clusters"
              type="button"
              onClick={() => setActiveTab('clusters')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'clusters'
                  ? isDark ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>{isId ? 'Klaster & Kedalaman' : 'Clusters & Depth'}</span>
            </button>
            <button
              id="liq-tab-playbook"
              type="button"
              onClick={() => setActiveTab('playbook')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'playbook'
                  ? isDark ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isId ? 'Panduan Taktis' : 'Tactical Playbook'}</span>
            </button>
          </div>

          {/* Leverage Filter Pills (shown in Clusters tab) */}
          {activeTab === 'clusters' && (
            <div className={`flex items-center rounded-[2px] p-1 border text-xs font-mono ${
              isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              {(['ALL', '100x', '50x', '25x', '10x'] as const).map((tier) => (
                <button
                  key={tier}
                  id={`liq-tier-filter-${tier.toLowerCase()}`}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2 py-1 rounded-[2px] text-xs transition-colors cursor-pointer ${
                    selectedTier === tier
                      ? isDark ? 'bg-slate-800 text-pink-300 font-semibold' : 'bg-white text-pink-700 font-semibold shadow-2xs'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tier === 'ALL' ? (isId ? 'Semua' : 'All') : tier}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Metric Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-4">
        {/* 1. Squeeze Imbalance Meter */}
        <div className={`p-3.5 rounded-[2px] border flex flex-col justify-between ${
          isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>{isId ? 'Bias Imbalance Pasar' : 'Market Imbalance Bias'}</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <div
              className={`text-sm font-bold font-mono ${
                summary.imbalanceBias === 'SHORT_SQUEEZE_RISK'
                  ? 'text-amber-400'
                  : summary.imbalanceBias === 'LONG_SQUEEZE_RISK'
                  ? isDark ? 'text-pink-300' : 'text-pink-600'
                  : isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {summary.imbalanceBias === 'SHORT_SQUEEZE_RISK'
                ? isId
                  ? `Risiko Short Squeeze (${summary.squeezeProbability}%)`
                  : `Short Squeeze Risk (${summary.squeezeProbability}%)`
                : summary.imbalanceBias === 'LONG_SQUEEZE_RISK'
                ? isId
                  ? `Risiko Long Squeeze (${summary.squeezeProbability}%)`
                  : `Long Squeeze Risk (${summary.squeezeProbability}%)`
                : isId
                ? 'Distribusi Seimbang'
                : 'Balanced Distribution'}
            </div>
            {/* Visual ratio bar */}
            <div className={`w-full h-2 rounded-[2px] overflow-hidden flex mt-2 ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}>
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${summary.shortLiqRatio}%` }}
                title={`Short Liq: ${summary.shortLiqRatio}%`}
              />
              <div
                className="h-full bg-pink-500 transition-all duration-300"
                style={{ width: `${summary.longLiqRatio}%` }}
                title={`Long Liq: ${summary.longLiqRatio}%`}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mt-1">
            <span className="text-amber-400 font-medium">Shorts: {summary.shortLiqRatio}%</span>
            <span className={isDark ? 'text-pink-300 font-medium' : 'text-pink-600 font-medium'}>Longs: {summary.longLiqRatio}%</span>
          </div>
        </div>

        {/* 2. Major Overhead Magnet (Short Liquidation) */}
        <div
          onClick={() => summary.majorShortMagnet && handleCopyPrice(summary.majorShortMagnet.price, 'Short Magnet')}
          className={`p-3.5 rounded-[2px] border flex flex-col justify-between cursor-pointer hover:border-amber-500/40 transition-colors group ${
            isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}
          title={isId ? 'Klik untuk menyalin harga level magnet short' : 'Click to copy short magnet price'}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              {isId ? 'Magnet Short Terbesar' : 'Top Short Magnet'}
              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
          {summary.majorShortMagnet && summary.majorShortMagnet.price > 0 ? (
            <div>
              <div className={`text-base font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ${formatPrice(summary.majorShortMagnet.price)}
              </div>
              <div className="text-xs font-mono text-amber-400 font-semibold mt-0.5">
                +{summary.majorShortMagnet.distancePct.toFixed(2)}% {isId ? 'dari harga saat ini' : 'from current'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono">
              {isId ? 'Tidak ada klaster terdekat' : 'No near cluster'}
            </div>
          )}
          <div className="text-xs font-mono text-slate-400 mt-1">
            Est. Vol:{' '}
            <span className="text-amber-400 font-bold">${summary.majorShortMagnet?.estimatedVolumeUsd || 0}M</span> (
            {summary.majorShortMagnet?.leverageTier || '50x'})
          </div>
        </div>

        {/* 3. Major Downside Magnet (Long Liquidation) */}
        <div
          onClick={() => summary.majorLongMagnet && handleCopyPrice(summary.majorLongMagnet.price, 'Long Magnet')}
          className={`p-3.5 rounded-[2px] border flex flex-col justify-between cursor-pointer hover:border-pink-500/40 transition-colors group ${
            isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}
          title={isId ? 'Klik untuk menyalin harga level magnet long' : 'Click to copy long magnet price'}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
              {isId ? 'Magnet Long Terbesar' : 'Top Long Magnet'}
              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-pink-400" />
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-pink-400" />
          </div>
          {summary.majorLongMagnet && summary.majorLongMagnet.price > 0 ? (
            <div>
              <div className={`text-base font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ${formatPrice(summary.majorLongMagnet.price)}
              </div>
              <div className="text-xs font-mono text-pink-400 font-semibold mt-0.5">
                {summary.majorLongMagnet.distancePct.toFixed(2)}% {isId ? 'dari harga saat ini' : 'from current'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono">
              {isId ? 'Tidak ada klaster terdekat' : 'No near cluster'}
            </div>
          )}
          <div className="text-xs font-mono text-slate-400 mt-1">
            Est. Vol:{' '}
            <span className={`font-bold ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>${summary.majorLongMagnet?.estimatedVolumeUsd || 0}M</span> (
            {summary.majorLongMagnet?.leverageTier || '50x'})
          </div>
        </div>

        {/* 4. Total Liquidity Pool Volume */}
        <div className={`p-3.5 rounded-[2px] border flex flex-col justify-between ${
          isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>{isId ? 'Total Likuiditas Terlacak' : 'Total Tracked Liquidity'}</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <div className={`text-base font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ${(summary.totalShortLiqUsd + summary.totalLongLiqUsd).toFixed(1)}M
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Delta:{' '}
              <span
                className={
                  summary.totalShortLiqUsd >= summary.totalLongLiqUsd
                    ? 'text-amber-400 font-bold'
                    : 'text-pink-400 font-bold'
                }
              >
                {summary.totalShortLiqUsd >= summary.totalLongLiqUsd ? '+' : '-'}$
                {Math.abs(summary.totalShortLiqUsd - summary.totalLongLiqUsd).toFixed(1)}M
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            {summary.clusters.length} {isId ? 'klaster aktif teridentifikasi' : 'active clusters identified'}
          </div>
        </div>
      </div>

      {/* Main Content: Progressive Disclosure View Switcher */}
      {activeTab === 'summary' && (
        <div className="space-y-4 font-mono">
          {/* Executive Summary & Tactical Orientation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Actionable Market Trap Summary */}
            <div className={`p-4 rounded-[2px] border space-y-3 ${
              isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[2px] bg-amber-500/10 text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isId ? 'Diagnosis Perangkap Likuiditas Pasar' : 'Market Liquidity Trap Diagnosis'}
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {summary.imbalanceBias === 'SHORT_SQUEEZE_RISK' ? (
                  isId ? (
                    <>
                      Terdapat akumulasi likuidasi <strong className="text-amber-400">posisi Short sebesar {summary.shortLiqRatio}%</strong> di atas harga pasar. Pembuat pasar (Market Maker) memiliki insentif tinggi untuk memicu lonjakan harga cepat (short squeeze) menuju area <strong className={isDark ? 'text-white' : 'text-slate-900'}>${formatPrice(summary.majorShortMagnet?.price || 0)}</strong>.
                    </>
                  ) : (
                    <>
                      Significant accumulation of <strong className="text-amber-400">Short liquidations ({summary.shortLiqRatio}%)</strong> above market price. Market makers have strong incentive to push prices upward toward <strong className={isDark ? 'text-white' : 'text-slate-900'}>${formatPrice(summary.majorShortMagnet?.price || 0)}</strong>.
                    </>
                  )
                ) : summary.imbalanceBias === 'LONG_SQUEEZE_RISK' ? (
                  isId ? (
                    <>
                      Terdapat penumpukan likuidasi <strong className="text-pink-400">posisi Long sebesar {summary.longLiqRatio}%</strong> di bawah harga saat ini. Waspadai penurunan tajam (long cascade) yang membidik kumpulan stop loss di area <strong className={isDark ? 'text-white' : 'text-slate-900'}>${formatPrice(summary.majorLongMagnet?.price || 0)}</strong>.
                    </>
                  ) : (
                    <>
                      Heavy concentration of <strong className="text-pink-400">Long liquidations ({summary.longLiqRatio}%)</strong> below market price. Watch out for a downside wick sweep into <strong className={isDark ? 'text-white' : 'text-slate-900'}>${formatPrice(summary.majorLongMagnet?.price || 0)}</strong>.
                    </>
                  )
                ) : (
                  isId ? (
                    <>
                      Kolam likuidasi seimbang antara posisi Long ({summary.longLiqRatio}%) dan Short ({summary.shortLiqRatio}%). Pasar saat ini berada dalam fase konsolidasi atau rentang sideways hingga salah satu sisi mengakumulasi klaster leverage baru.
                    </>
                  ) : (
                    <>
                      Liquidity pools are balanced between Longs ({summary.longLiqRatio}%) and Shorts ({summary.shortLiqRatio}%). The market is in consolidation until one side builds new leveraged clusters.
                    </>
                  )
                )}
              </p>

              {/* Action Recommendation Badges */}
              <div className={`pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className={`p-2.5 rounded-[2px] border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isId ? 'Target Ambil Profit (TP)' : 'Take Profit (TP) Target'}</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {summary.majorShortMagnet
                      ? isId
                        ? `Di batas bawah klaster $${formatPrice(summary.majorShortMagnet.price)} sebelum pembalikan arah.`
                        : `At lower boundary of $${formatPrice(summary.majorShortMagnet.price)} before reversal.`
                      : '-'}
                  </p>
                </div>

                <div className={`p-2.5 rounded-[2px] border ${
                  isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{isId ? 'Zona Lindung Stop Loss' : 'Stop Loss Protection'}</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {summary.majorLongMagnet
                      ? isId
                        ? `Beri buffer di luar $${formatPrice(summary.majorLongMagnet.price)}, jangan di dalamnya.`
                        : `Place SL below $${formatPrice(summary.majorLongMagnet.price)} with ATR buffer.`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Leverage Risk Calculator */}
            <div className={`p-4 rounded-[2px] border space-y-3 ${
              isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-[2px] bg-pink-500/10 text-pink-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isId ? 'Simulator Sensitivitas Leverage' : 'Leverage Sensitivity Simulator'}
                  </h4>
                </div>
                <span className="text-xs text-slate-400">
                  {isId ? 'Harga Acuan:' : 'Ref Price:'} <strong className={isDark ? 'text-white' : 'text-slate-900'}>${formatPrice(currentPrice)}</strong>
                </span>
              </div>

              {/* Leverage Selector Pills & Direction Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Direction Toggle */}
                <div className={`flex items-center rounded-[2px] p-1 border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/80 border-slate-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => setSimDirection('LONG')}
                    className={`px-2.5 py-0.5 rounded-[2px] cursor-pointer transition-colors ${
                      simDirection === 'LONG' ? 'bg-pink-600 text-white font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimDirection('SHORT')}
                    className={`px-2.5 py-0.5 rounded-[2px] cursor-pointer transition-colors ${
                      simDirection === 'SHORT' ? 'bg-amber-600 text-white font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Short
                  </button>
                </div>

                {/* Leverage Tiers */}
                <div className="flex items-center gap-1">
                  {[5, 10, 20, 50, 100].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setSimLeverage(lev)}
                      className={`px-2 py-0.5 rounded-[2px] text-xs cursor-pointer transition-colors border ${
                        simLeverage === lev
                          ? isDark ? 'bg-slate-800 border-pink-400 text-pink-300 font-bold' : 'bg-pink-500 border-pink-600 text-white font-bold'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className={`p-3 rounded-[2px] border space-y-1.5 ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {isId ? `Estimasi Titik Likuidasi (${simLeverage}x ${simDirection}):` : `Estimated Liq Price (${simLeverage}x ${simDirection}):`}
                  </span>
                  <span className={`text-sm font-bold font-mono flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ${formatPrice(simulatedLiqPrice)}
                    <button
                      type="button"
                      onClick={() => handleCopyPrice(simulatedLiqPrice, 'Est. Liq')}
                      className="p-1 rounded-[2px] text-slate-400 hover:text-pink-400 transition-colors cursor-pointer"
                      title={isId ? 'Salin harga likuidasi ini' : 'Copy this liquidation price'}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </span>
                </div>

                {/* Proximity / Danger Assessment */}
                {collisionAlert ? (
                  <div className={`flex items-start gap-1.5 p-2 rounded-[2px] border text-xs ${
                    isDark ? 'bg-rose-950/30 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      {isId
                        ? `Waspada: Titik likuidasi ${simLeverage}x Anda ($${formatPrice(simulatedLiqPrice)}) berdekatan dengan klaster pasar ($${formatPrice(collisionAlert.price)} • ${collisionAlert.estimatedVolumeUsd}M). Risiko tersapu sangat tinggi!`
                        : `Warning: Your ${simLeverage}x liq price ($${formatPrice(simulatedLiqPrice)}) aligns with a major market cluster ($${formatPrice(collisionAlert.price)}). High sweep risk!`}
                    </span>
                  </div>
                ) : (
                  <div className={`flex items-start gap-1.5 p-2 rounded-[2px] border text-xs ${
                    isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {isId
                        ? `Penyangga Aman: Titik likuidasi ${simLeverage}x Anda ($${formatPrice(simulatedLiqPrice)}) berada di luar klaster padat terdekat.`
                        : `Safe Buffer: Your ${simLeverage}x liq price ($${formatPrice(simulatedLiqPrice)}) sits away from heavy liquidation clusters.`}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500">
                {isId
                  ? 'Gunakan tab "Klaster & Kedalaman" untuk melihat seluruh buku tingkat harga likuidasi secara presisi.'
                  : 'Switch to "Clusters & Depth" to view the comprehensive ladder of liquidation price levels.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Clusters & Depth Tab */}
      {activeTab === 'clusters' && (
        <div className="space-y-4">
          {/* Dual-Column / Stacked Cluster Ladder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: Short Liquidation Clusters (Overhead Squeeze Magnets) */}
            <div className={`p-4 rounded-[2px] border ${
              isDark ? 'bg-[#0b0f19] border-amber-500/20' : 'bg-slate-50 border-amber-300/40'
            }`}>
              <div className={`flex items-center justify-between pb-2 mb-3 border-b ${
                isDark ? 'border-amber-500/20' : 'border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wide">
                    {isId ? 'Klaster Likuidasi Short (Di Atas Harga)' : 'Short Liquidation Clusters (Overhead)'}
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  Total: ${summary.totalShortLiqUsd}M
                </span>
              </div>

              {shortClusters.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono py-6 text-center">
                  {isId ? 'Tidak ada klaster short pada filter leverage ini' : 'No short clusters at this leverage tier'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {shortClusters.map((cluster) => (
                    <div
                      key={cluster.id}
                      className={`p-2 rounded-[2px] border transition-all ${
                        cluster.isMajorMagnet
                          ? isDark ? 'bg-amber-950/30 border-amber-500/50 shadow-xs' : 'bg-amber-50 border-amber-300 shadow-2xs'
                          : isDark ? 'bg-slate-900/70 border-slate-800 hover:border-amber-500/30' : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyPrice(cluster.price, 'Short Liq')}
                            className={`font-bold hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer group ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                            title={isId ? 'Klik untuk menyalin harga' : 'Click to copy price'}
                          >
                            <span>${formatPrice(cluster.price)}</span>
                            <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
                          </button>
                          <span className={`px-1.5 py-0.5 rounded-[2px] text-xs font-semibold border ${
                            isDark ? 'bg-slate-800 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {cluster.leverageTier}
                          </span>
                          {cluster.isMajorMagnet && (
                            <span className={`px-1.5 py-0.5 rounded-[2px] text-xs font-semibold border ${
                              isDark ? 'bg-amber-500/30 text-amber-200 border-amber-500/50' : 'bg-amber-200 text-amber-900 border-amber-400'
                            }`}>
                              ★ Magnet
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold">${cluster.estimatedVolumeUsd}M</span>
                          <span className="text-slate-400 text-xs">
                            ({cluster.distancePct > 0 ? '+' : ''}{cluster.distancePct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Heat Intensity Bar */}
                      <div className={`w-full h-1.5 rounded-[2px] mt-2 overflow-hidden ${
                        isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${cluster.intensity}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Box: Long Liquidation Clusters (Downside Cascade Targets) */}
            <div className={`p-4 rounded-[2px] border ${
              isDark ? 'bg-[#0b0f19] border-pink-500/20' : 'bg-slate-50 border-pink-300/40'
            }`}>
              <div className={`flex items-center justify-between pb-2 mb-3 border-b ${
                isDark ? 'border-pink-500/20' : 'border-pink-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wide">
                    {isId ? 'Klaster Likuidasi Long (Di Bawah Harga)' : 'Long Liquidation Clusters (Downside)'}
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                  Total: ${summary.totalLongLiqUsd}M
                </span>
              </div>

              {longClusters.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono py-6 text-center">
                  {isId ? 'Tidak ada klaster long pada filter leverage ini' : 'No long clusters at this leverage tier'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {longClusters.map((cluster) => (
                    <div
                      key={cluster.id}
                      className={`p-2 rounded-[2px] border transition-all ${
                        cluster.isMajorMagnet
                          ? isDark ? 'bg-pink-950/30 border-pink-500/50 shadow-xs' : 'bg-pink-50 border-pink-300 shadow-2xs'
                          : isDark ? 'bg-slate-900/70 border-slate-800 hover:border-pink-500/30' : 'bg-white border-slate-200 hover:border-pink-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyPrice(cluster.price, 'Long Liq')}
                            className={`font-bold hover:text-pink-400 flex items-center gap-1 transition-colors cursor-pointer group ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                            title={isId ? 'Klik untuk menyalin harga' : 'Click to copy price'}
                          >
                            <span>${formatPrice(cluster.price)}</span>
                            <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-pink-400 transition-opacity" />
                          </button>
                          <span className={`px-1.5 py-0.5 rounded-[2px] text-xs font-semibold border ${
                            isDark ? 'bg-slate-800 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-800 border-pink-200'
                          }`}>
                            {cluster.leverageTier}
                          </span>
                          {cluster.isMajorMagnet && (
                            <span className={`px-1.5 py-0.5 rounded-[2px] text-xs font-semibold border ${
                              isDark ? 'bg-pink-500/30 text-pink-200 border-pink-500/50' : 'bg-pink-200 text-pink-900 border-pink-400'
                            }`}>
                              ★ Magnet
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-pink-400 font-bold">${cluster.estimatedVolumeUsd}M</span>
                          <span className="text-slate-400 text-xs">
                            ({cluster.distancePct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Heat Intensity Bar */}
                      <div className={`w-full h-1.5 rounded-[2px] mt-2 overflow-hidden ${
                        isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
                        <div
                          className="h-full bg-pink-500"
                          style={{ width: `${cluster.intensity}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Tactical Playbook Tab */}
      {activeTab === 'playbook' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className={`p-4 rounded-[2px] border space-y-2 ${
            isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              <h4>{isId ? '1. Strategi Squeeze Run' : '1. Squeeze Front-Run'}</h4>
            </div>
            <p className={`leading-relaxed text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isId
                ? 'Ketika terjadi ketidakseimbangan likuidasi Short (>60%), algoritma market maker cenderung mendorong harga ke klaster utama untuk memicu cascading stop-loss. Tempatkan Take-Profit tepat di batas bawah klaster sebelum terjadi pembalikan (reversal).'
                : 'When short liquidation imbalance exceeds 60%, algorithmic market makers push price into major overhead clusters to trigger cascading buy stops. Place Take-Profit orders right inside the cluster before exhaustion.'}
            </p>
          </div>

          <div className={`p-4 rounded-[2px] border space-y-2 ${
            isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              <h4>{isId ? '2. Proteksi Stop-Loss' : '2. SL Invalidation Buffer'}</h4>
            </div>
            <p className={`leading-relaxed text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isId
                ? 'JANGAN meletakkan Stop Loss di dalam klaster padat (misal zona 50x-100x). Area ini adalah target utama sapuan likuiditas (wick sweep). Letakkan SL di luar area likuidasi terluar dengan penyangga ATR minimal 1.5x.'
                : 'NEVER place your Stop Loss directly inside a dense liquidation cluster (50x-100x zones). These are prime liquidity raid targets. Buffer your SL beyond the outer boundary of the cluster with at least 1.5x ATR.'}
            </p>
          </div>

          <div className={`p-4 rounded-[2px] border space-y-2 ${
            isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
              <Compass className="w-4 h-4" />
              <h4>{isId ? '3. Reversal Absorption' : '3. Reversal Absorption'}</h4>
            </div>
            <p className={`leading-relaxed text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isId
                ? 'Setelah klaster likuidasi besar tersapu (ditandai dengan lonjakan volume tinggi dan ekor candle panjang), perhatikan Order Flow CVD. Jika delta mulai berbalik, itu sinyal masuk pembalikan arah dengan probabilitas tinggi.'
                : 'After a major cluster is swept (marked by sudden high volume wicks and delta absorption), observe Order Flow CVD. A delta reversal indicates smart money absorption, offering high RRR mean-reversion entries.'}
            </p>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <span>
          {isId
            ? 'Kalkulasi hibrida: Menggabungkan level visual pada chart candlestick dan metrik kedalaman derivatif'
            : 'Hybrid computation: Combines on-chart price level overlays with derivative depth metrics'}
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-3.5 h-3.5 text-pink-400" />
          {isId ? 'Penyelarasan Presisi Desimal Aktif' : 'Dynamic Decimal Precision Active'}
        </span>
      </div>
    </div>
  );
};
