import React, { useState, useMemo } from 'react';
import { IndicatorBentoGrid } from '../components/IndicatorBentoGrid';
import { IndicatorKey, IndicatorsSnapshot } from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { Sliders, Sparkles, Award, RefreshCw } from 'lucide-react';

interface IndicatorsPageProps {
  indicators: IndicatorsSnapshot;
  lang?: Language;
  onOpenBacktest: (key?: IndicatorKey) => void;
  theme?: 'light' | 'dark';
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  priceAction: 12,
  smc: 12,
  orderFlow: 11,
  ict: 10,
  optionFlow: 9,
  vwap: 8,
  rsi: 8,
  fibonacci: 8,
  macd: 8,
  ichimoku: 6,
  elliottWave: 4,
  tdSequential: 4,
};

export const IndicatorsPage: React.FC<IndicatorsPageProps> = React.memo(({
  indicators,
  lang = 'id',
  onOpenBacktest,
  theme = 'dark',
}) => {
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const isDark = theme === 'dark';

  const handleWeightChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  // Convert snapshot to a structured list for weight calculations
  const list = useMemo(() => [
    { key: 'priceAction', name: 'Price Action & S/R', signal: indicators.priceAction.signal },
    { key: 'smc', name: 'Smart Money Concepts', signal: indicators.smc.signal },
    { key: 'orderFlow', name: 'Order Flow (CVD & Delta)', signal: indicators.orderFlow.signal },
    { key: 'ict', name: 'ICT Killzones & OTE', signal: indicators.ict.signal },
    { key: 'optionFlow', name: 'Option Flow (PCR & Max Pain)', signal: indicators.optionFlow.signal },
    { key: 'vwap', name: 'Institutional VWAP', signal: indicators.vwap.signal },
    { key: 'rsi', name: 'RSI & Divergence', signal: indicators.rsi.signal },
    { key: 'ichimoku', name: 'Ichimoku Cloud', signal: indicators.ichimoku.signal },
    { key: 'fibonacci', name: 'Fibonacci Retracement', signal: indicators.fibonacci.signal },
    { key: 'macd', name: 'MACD Trend Crossover', signal: indicators.macd.signal },
    { key: 'elliottWave', name: 'Elliott Wave Count', signal: indicators.elliottWave.signal },
    { key: 'tdSequential', name: 'TD Sequential Countdown', signal: indicators.tdSequential.signal },
  ], [indicators]);

  // Compute a customized Confluence Score based on the custom weights
  const customConfluence = useMemo(() => {
    let totalScore = 0;
    let totalWeight = 0;

    list.forEach((ind) => {
      const weight = weights[ind.key] || 0;
      totalWeight += weight;

      // Map signal type (BULLISH, BEARISH, NEUTRAL) to scores
      let indScore = 50;
      if (ind.signal === 'BULLISH') indScore = 100;
      else if (ind.signal === 'BEARISH') indScore = 0;

      totalScore += indScore * weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }, [list, weights]);

  const customBias = useMemo(() => {
    if (customConfluence >= 70) return lang === 'id' ? 'BULLISH KUAT' : 'STRONG BULLISH';
    if (customConfluence >= 55) return lang === 'id' ? 'BULLISH' : 'BULLISH';
    if (customConfluence <= 30) return lang === 'id' ? 'BEARISH KUAT' : 'STRONG BEARISH';
    if (customConfluence <= 45) return lang === 'id' ? 'BEARISH' : 'BEARISH';
    return lang === 'id' ? 'NETRAL' : 'NEUTRAL';
  }, [customConfluence, lang]);

  return (
    <div className="space-y-6">
      {/* Top Tuning Ribbon */}
      <div className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 transition-colors duration-200 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-sm font-bold font-display ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {lang === 'id' ? 'Bobot Dinamis & Strategi Kustom' : 'Dynamic Weights & Custom Strategy'}
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {lang === 'id' 
                ? 'Sesuaikan persentase pengaruh masing-masing indikator di bawah untuk melihat Confluence kustom.' 
                : 'Configure individual indicators weights to simulate tailored signal confluence results.'}
            </p>
          </div>
        </div>

        {/* Custom Confluence Badge Output */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0b0f19] border-amber-500/20' : 'bg-amber-50/50 border-amber-500/30'
        }`}>
          <div className="text-right font-mono">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Custom Confluence</span>
            <span className={`text-xs font-bold ${
              customConfluence >= 55 ? 'text-emerald-500' : customConfluence <= 45 ? 'text-rose-500' : (isDark ? 'text-slate-300' : 'text-slate-700')
            }`}>
              {customBias}
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-500">
            {customConfluence}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9-Cols: The Primary 10-Indicator Grid */}
        <div className="xl:col-span-9">
          <IndicatorBentoGrid
            indicators={indicators}
            lang={lang}
            onOpenBacktest={onOpenBacktest}
            theme={theme}
          />
        </div>

        {/* Right 3-Cols: The Tuner Control Sliders */}
        <div className={`xl:col-span-3 rounded-xl border p-4 space-y-4 transition-colors duration-200 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-[#1e293b]' : 'border-slate-100'}`}>
            <span className={`text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tuner
            </span>
            <button
              type="button"
              onClick={handleResetWeights}
              className="text-[10px] font-mono text-cyan-500 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {list.map((ind) => {
              const weightVal = weights[ind.key] || 0;
              return (
                <div key={ind.key} className={`p-2 rounded border space-y-1 transition-colors ${
                  isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className={`font-medium truncate max-w-[120px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{ind.name}</span>
                    <span className="text-amber-500 font-bold">{weightVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={weightVal}
                    onChange={(e) => handleWeightChange(ind.key, parseInt(e.target.value) || 0)}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-300 dark:bg-slate-800 rounded-lg"
                    aria-label={`Weight for ${ind.name}`}
                  />
                </div>
              );
            })}
          </div>

          <div className={`p-2.5 rounded text-[10px] font-mono flex items-start gap-1.5 leading-relaxed ${
            isDark ? 'bg-cyan-950/20 border border-cyan-500/20 text-cyan-300' : 'bg-cyan-50 border border-cyan-100 text-cyan-800'
          }`}>
            <Award className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
            <span>
              {lang === 'id' 
                ? 'Confluence di atas dihitung dengan menjumlahkan bobot signal dikali skor internal indikator. Sangat efektif untuk analisis kuantitatif.' 
                : 'Confluence calculation is dynamically aggregated by normalizing signals times user-defined weights.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

IndicatorsPage.displayName = 'IndicatorsPage';
