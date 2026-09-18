import React, { useState } from 'react';
import {
  IndicatorsSnapshot,
  SignalType,
  IndicatorKey,
} from '../types/crypto.types';
import {
  CandlestickChart,
  Waves,
  Activity,
  Cloud,
  Grid,
  Zap,
  Boxes,
  Compass,
  GitBranch,
  Clock,
  ChevronRight,
  BarChart3,
  Layers,
  Scale,
} from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';

interface IndicatorBentoGridProps {
  indicators: IndicatorsSnapshot;
  lang?: Language;
  onOpenBacktest?: (indicatorKey: IndicatorKey) => void;
  theme?: 'light' | 'dark';
}

type FilterOption = 'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export const IndicatorBentoGrid: React.FC<IndicatorBentoGridProps> = React.memo(({
  indicators,
  lang = 'id',
  onOpenBacktest,
  theme = 'dark',
}) => {
  const t = getTranslation(lang);
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const getIndicatorName = (key: string, fallback: string) => {
    return (t.indicators.names as Record<string, string>)[key] || fallback;
  };

  const indicatorList = [
    {
      id: 'priceAction',
      name: 'Price Action & S/R',
      weight: '15%',
      icon: CandlestickChart,
      data: indicators.priceAction,
      keyMetric: `S: $${indicators.priceAction.keySupport} | R: $${indicators.priceAction.keyResistance}`,
      details: [
        { label: 'Identified Pattern', value: indicators.priceAction.candlestickPattern },
        { label: 'Swing High', value: `$${indicators.priceAction.swingHigh}` },
        { label: 'Swing Low', value: `$${indicators.priceAction.swingLow}` },
      ],
    },
    {
      id: 'smc',
      name: 'Smart Money Concepts (SMC)',
      weight: '15%',
      icon: Boxes,
      data: indicators.smc,
      keyMetric: `${indicators.smc.breakOfStructure} | OBs: ${indicators.smc.orderBlocks.length}`,
      details: [
        { label: 'Structure Break', value: indicators.smc.breakOfStructure },
        { label: 'Active Fair Value Gaps', value: `${indicators.smc.fairValueGaps.length} detected` },
        { label: 'Order Block Range', value: `$${indicators.smc.orderBlocks[0]?.low || 0} - $${indicators.smc.orderBlocks[0]?.high || 0}` },
      ],
    },
    {
      id: 'ict',
      name: 'ICT (Inner Circle Trader)',
      weight: '12%',
      icon: Compass,
      data: indicators.ict,
      keyMetric: `Zone: ${indicators.ict.premiumDiscountZone} | ${indicators.ict.currentKillzone}`,
      details: [
        { label: 'Optimal Trade Entry (OTE)', value: `$${indicators.ict.oteLevel.min} - $${indicators.ict.oteLevel.max}` },
        { label: 'Buy Side Liquidity (BSL)', value: `$${indicators.ict.buySideLiquidity}` },
        { label: 'Sell Side Liquidity (SSL)', value: `$${indicators.ict.sellSideLiquidity}` },
      ],
    },
    {
      id: 'vwap',
      name: 'Institutional VWAP',
      weight: '10%',
      icon: Waves,
      data: indicators.vwap,
      keyMetric: `VWAP: $${indicators.vwap.vwap} (${indicators.vwap.relation.replace('_', ' ')})`,
      details: [
        { label: 'Upper Band (+1σ)', value: `$${indicators.vwap.upperBand1}` },
        { label: 'Upper Band (+2σ)', value: `$${indicators.vwap.upperBand2}` },
        { label: 'Lower Band (-1σ)', value: `$${indicators.vwap.lowerBand1}` },
      ],
    },
    {
      id: 'rsi',
      name: 'RSI & Divergence',
      weight: '10%',
      icon: Activity,
      data: indicators.rsi,
      keyMetric: `RSI(14): ${indicators.rsi.rsi14} (${indicators.rsi.condition})`,
      details: [
        { label: 'RSI Level', value: indicators.rsi.rsi14.toString() },
        { label: 'Condition', value: indicators.rsi.condition },
        { label: 'Divergence Status', value: indicators.rsi.divergence.replace('_', ' ') },
      ],
    },
    {
      id: 'fibonacci',
      name: 'Fibonacci Retracement',
      weight: '10%',
      icon: Grid,
      data: indicators.fibonacci,
      keyMetric: `Golden Pocket: $${indicators.fibonacci.goldenPocket.min} - $${indicators.fibonacci.goldenPocket.max}`,
      details: [
        { label: 'Nearest Level', value: indicators.fibonacci.nearestLevel },
        { label: '0.618 Ratio', value: `$${indicators.fibonacci.levels.level618}` },
        { label: '1.618 Extension Target', value: `$${indicators.fibonacci.levels.level1618}` },
      ],
    },
    {
      id: 'macd',
      name: 'MACD Momentum',
      weight: '10%',
      icon: Zap,
      data: indicators.macd,
      keyMetric: `Histogram: ${indicators.macd.histogram} (${indicators.macd.trend.replace('_', ' ')})`,
      details: [
        { label: 'MACD Line', value: indicators.macd.macdLine.toString() },
        { label: 'Signal Line', value: indicators.macd.signalLine.toString() },
        { label: 'Crossover State', value: indicators.macd.crossover.replace('_', ' ') },
      ],
    },
    {
      id: 'ichimoku',
      name: 'Ichimoku Cloud',
      weight: '8%',
      icon: Cloud,
      data: indicators.ichimoku,
      keyMetric: `Tenkan: $${indicators.ichimoku.tenkanSen} | Kijun: $${indicators.ichimoku.kijunSen}`,
      details: [
        { label: 'Cloud Sentiment', value: indicators.ichimoku.cloudColor.replace('_', ' ') },
        { label: 'Senkou Span A', value: `$${indicators.ichimoku.senkouSpanA}` },
        { label: 'Senkou Span B', value: `$${indicators.ichimoku.senkouSpanB}` },
      ],
    },
    {
      id: 'tdSequential',
      name: 'TD Sequential (9-13)',
      weight: '5%',
      icon: Clock,
      data: indicators.tdSequential,
      keyMetric: `${indicators.tdSequential.setupCount}/9 ${indicators.tdSequential.setupDirection.replace('_', ' ')}`,
      details: [
        { label: 'Setup Count', value: `${indicators.tdSequential.setupCount} of 9` },
        { label: 'Countdown Count', value: `${indicators.tdSequential.countdownCount} of 13` },
        { label: 'Perfected Signal', value: indicators.tdSequential.isPerfected9 ? 'YES (Exhaustion Reversal)' : 'NO (Building)' },
      ],
    },
    {
      id: 'elliottWave',
      name: 'Elliott Wave Structure',
      weight: '4%',
      icon: GitBranch,
      data: indicators.elliottWave,
      keyMetric: `${indicators.elliottWave.currentWave}`,
      details: [
        { label: 'Wave Degree', value: indicators.elliottWave.structure.replace('_', ' ') },
        { label: 'Projected Target', value: `$${indicators.elliottWave.nextProjection}` },
        { label: 'Structural Invalidation', value: `$${indicators.elliottWave.invalidationLevel}` },
      ],
    },
    {
      id: 'orderFlow',
      name: 'Order Flow (CVD & Delta)',
      weight: '11%',
      icon: Layers,
      data: indicators.orderFlow,
      keyMetric: `CVD: ${indicators.orderFlow.cvd >= 0 ? '+' : ''}${indicators.orderFlow.cvd} | Delta: ${indicators.orderFlow.deltaRatio}x`,
      details: [
        { label: 'CVD Trajectory', value: indicators.orderFlow.cvdDirection.replace('_', ' ') },
        { label: 'Institutional Aggression', value: indicators.orderFlow.institutionalAggression.replace('_', ' ') },
        { label: 'Volume Delta Breakdown', value: `${indicators.orderFlow.buyVolumePercent}% Beli / ${indicators.orderFlow.sellVolumePercent}% Jual` },
        ...(indicators.orderFlow.absorptionZone
          ? [{ label: 'Zona Absorpsi Likuiditas', value: `$${indicators.orderFlow.absorptionZone.price} (${indicators.orderFlow.absorptionZone.type.replace('_', ' ')})` }]
          : []),
      ],
    },
    {
      id: 'optionFlow',
      name: 'Option Flow (PCR & Max Pain)',
      weight: '9%',
      icon: Scale,
      data: indicators.optionFlow,
      keyMetric: `PCR: ${indicators.optionFlow.putCallRatio} | Max Pain: $${indicators.optionFlow.maxPainPrice}`,
      details: [
        { label: 'Put/Call Ratio Sentiment', value: indicators.optionFlow.pcrSentiment.replace('_', ' ') },
        { label: 'Max Pain Gravitational Strike', value: `$${indicators.optionFlow.maxPainPrice} (${indicators.optionFlow.maxPainDistancePct >= 0 ? '+' : ''}${indicators.optionFlow.maxPainDistancePct}%)` },
        { label: 'Gamma Exposure (GEX)', value: indicators.optionFlow.gammaExposure.replace('_', ' ') },
        { label: '30-Day Implied Volatility (IV)', value: `${indicators.optionFlow.impliedVolatility}% (OI: ${indicators.optionFlow.openInterestNotional})` },
      ],
    },
  ];

  const filteredList = indicatorList.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.data.signal === activeFilter;
  });

  const getSignalBadge = (sig: SignalType) => {
    switch (sig) {
      case 'BULLISH':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'BEARISH':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
  };

  const getFilterLabel = (f: FilterOption) => {
    switch (f) {
      case 'ALL':
        return t.indicators.filterAll;
      case 'BULLISH':
        return t.indicators.filterBullish;
      case 'BEARISH':
        return t.indicators.filterBearish;
      case 'NEUTRAL':
        return t.indicators.filterNeutral;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t.indicators.title}
        </h2>

        <div className="flex items-center gap-2">
          {onOpenBacktest && (
            <button
              id="btn-bento-backtest-all"
              onClick={() => onOpenBacktest('confluence')}
              className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-blue-950/60 hover:bg-blue-900/70 border-blue-500/40 text-blue-300 hover:text-white'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
              }`}
              title={lang === 'id' ? 'Uji Backtest 10 Indikator Kuantitatif' : 'Backtest 10 Quantitative Indicators'}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              <span>{lang === 'id' ? 'Backtest 10 Indikator' : 'Backtest 10 Indicators'}</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className={`flex items-center gap-1.5 p-1 rounded-lg border text-xs font-mono ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as FilterOption[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  activeFilter === f
                    ? isDark
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-cyan-600 text-white font-bold shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getFilterLabel(f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 10-Indicator Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3.5">
        {filteredList.map((ind) => {
          const Icon = ind.icon;
          const isExpanded = expandedCard === ind.id;

          return (
            <div
              key={ind.id}
              className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-150 ${
                isExpanded
                  ? isDark
                    ? 'bg-[#131b2e] border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-lg'
                    : 'bg-white border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-md'
                  : isDark
                  ? 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                {/* Top Row: Icon, Title, Signal Pill */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
                      isDark ? 'bg-[#0b0f19] border-[#1e293b] text-cyan-400' : 'bg-cyan-50 border-cyan-100 text-cyan-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {ind.name}
                        </h4>
                      </div>
                      <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.indicators.weight}: {ind.weight}
                      </span>
                    </div>
                  </div>

                  <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${getSignalBadge(ind.data.signal)}`}>
                    {ind.data.signal}
                  </div>
                </div>

                {/* Key Metric Headline */}
                <div className={`my-2 p-2.5 rounded-lg border font-mono text-xs tabular-nums ${
                  isDark ? 'bg-[#0b0f19] border-[#1e293b]/60 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  {ind.keyMetric}
                </div>

                {/* Summary Text */}
                <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {ind.data.summary}
                </p>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className={`mt-3 pt-3 border-t space-y-1.5 font-mono text-xs tabular-nums ${
                    isDark ? 'border-[#1e293b]' : 'border-slate-100'
                  }`}>
                    {ind.details.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{d.label}:</span>
                        <span className={`font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{d.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.indicators.engineConfidence}</span>
                      <span className="text-emerald-500 font-bold">{ind.data.confidence}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Bar */}
              <div className={`flex items-center justify-between pt-3 mt-3 border-t text-xs ${
                isDark ? 'border-[#1e293b]/60' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.indicators.confidence}:</span>
                  <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${ind.data.confidence}%` }}
                    />
                  </div>
                  <span className={`font-bold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{ind.data.confidence}%</span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenBacktest && (
                    <button
                      id={`btn-card-backtest-${ind.id}`}
                      onClick={() => onOpenBacktest(ind.id as IndicatorKey)}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border transition cursor-pointer ${
                        isDark
                          ? 'bg-blue-950/40 border-blue-800/60 text-blue-400 hover:text-blue-300 hover:border-blue-500'
                          : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      }`}
                      title={lang === 'id' ? `Backtest ${ind.name}` : `Backtest ${ind.name}`}
                    >
                      <BarChart3 className="w-3 h-3 text-blue-500" />
                      <span>Backtest</span>
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : ind.id)}
                    className="flex items-center gap-0.5 text-xs text-cyan-500 hover:text-cyan-400 font-medium cursor-pointer transition-colors"
                  >
                    <span>{isExpanded ? t.indicators.collapse : t.indicators.inspect}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
