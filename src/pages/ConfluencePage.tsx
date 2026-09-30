import React, { useMemo } from 'react';
import { GaugeChart } from '../components/GaugeChart';
import { MarketBias, IndicatorsSnapshot } from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { ListTodo } from 'lucide-react';
import { ConfluenceFactorList, ConfluenceFactorItem } from '../components/confluence/ConfluenceFactorList';
import { ConfluenceBiasGuidelines } from '../components/confluence/ConfluenceBiasGuidelines';

interface ConfluencePageProps {
  score: number;
  bias: MarketBias;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  indicators: IndicatorsSnapshot;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const ConfluencePage: React.FC<ConfluencePageProps> = React.memo(({
  score,
  bias,
  bullishCount,
  bearishCount,
  neutralCount,
  indicators,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Convert snapshot to an array for easy checklist rendering
  const factorItems: ConfluenceFactorItem[] = useMemo(() => [
    { key: 'priceAction', name: 'Price Action & S/R', signal: indicators.priceAction.signal, summary: indicators.priceAction.summary },
    { key: 'smc', name: 'Smart Money Concepts', signal: indicators.smc.signal, summary: indicators.smc.summary },
    { key: 'orderFlow', name: 'Order Flow (CVD & Delta)', signal: indicators.orderFlow.signal, summary: indicators.orderFlow.summary },
    { key: 'ict', name: 'ICT Killzones & OTE', signal: indicators.ict.signal, summary: indicators.ict.summary },
    { key: 'optionFlow', name: 'Option Flow (PCR & Max Pain)', signal: indicators.optionFlow.signal, summary: indicators.optionFlow.summary },
    { key: 'vwap', name: 'Institutional VWAP', signal: indicators.vwap.signal, summary: indicators.vwap.summary },
    { key: 'rsi', name: 'RSI & Divergence', signal: indicators.rsi.signal, summary: indicators.rsi.summary },
    { key: 'ichimoku', name: 'Ichimoku Cloud', signal: indicators.ichimoku.signal, summary: indicators.ichimoku.summary },
    { key: 'fibonacci', name: 'Fibonacci Retracement', signal: indicators.fibonacci.signal, summary: indicators.fibonacci.summary },
    { key: 'macd', name: 'MACD Trend Crossover', signal: indicators.macd.signal, summary: indicators.macd.summary },
    { key: 'elliottWave', name: 'Elliott Wave Count', signal: indicators.elliottWave.signal, summary: indicators.elliottWave.summary },
    { key: 'tdSequential', name: 'TD Sequential Countdown', signal: indicators.tdSequential.signal, summary: indicators.tdSequential.summary },
  ], [indicators]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Column: Traditional Gauge Chart */}
      <div className="lg:col-span-4 h-full">
        <GaugeChart
          score={score}
          bias={bias}
          bullishCount={bullishCount}
          bearishCount={bearishCount}
          neutralCount={neutralCount}
          lang={lang}
          theme={theme}
        />
      </div>

      {/* Right Column: Detailed Confluence Factors & Checklist Guidance */}
      <div className={`lg:col-span-8 rounded-[2px] border p-4 sm:p-5 flex flex-col justify-between space-y-5 transition-colors duration-200 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
      }`}>
        {/* Title */}
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#1e293b]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-cyan-500" />
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {lang === 'id' ? 'Detail Parameter Verifikasi Bias' : 'Confluence Factor Verification'}
            </span>
          </div>
          <span className={`text-[10px] font-mono tabular-nums px-2.5 py-1 rounded-[2px] border ${
            isDark ? 'text-slate-400 bg-[#0b0f19] border-[#1e293b]' : 'text-slate-600 bg-slate-50 border-slate-200'
          }`}>
            {`${bullishCount} Bullish | ${bearishCount} Bearish`}
          </span>
        </div>

        {/* Fact Checklist Sub-component */}
        <ConfluenceFactorList items={factorItems} theme={theme} />

        {/* Actionable Guidelines Sub-component based on current Bias */}
        <ConfluenceBiasGuidelines bias={bias} lang={lang} theme={theme} />
      </div>
    </div>
  );
});

ConfluencePage.displayName = 'ConfluencePage';
