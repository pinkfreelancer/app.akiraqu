import React, { useState } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Cpu, Activity, PieChart, Sparkles } from 'lucide-react';

interface ReturnDistributionViewProps {
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

export const ReturnDistributionView: React.FC<ReturnDistributionViewProps> = ({
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [simRuns, setSimRuns] = useState<number>(1000);

  const stats = [
    { label: 'Sharpe Ratio', value: '2.48', rating: 'Exceptional (> 2.0)', color: 'text-emerald-400' },
    { label: 'Sortino Ratio', value: '3.82', rating: 'High Downside Protection', color: 'text-cyan-400' },
    { label: 'Max Historical Drawdown', value: '-11.4%', rating: 'Low Risk Profile', color: 'text-amber-400' },
    { label: 'Value at Risk (VaR 95%)', value: '-2.18% / day', rating: '95% Confidence Bound', color: 'text-indigo-400' },
    { label: 'Skewness (Distribusi)', value: '+0.42 (Right Skew)', rating: 'Positive Asymmetric Gains', color: 'text-pink-400' },
    { label: 'Kurtosis (Fat Tails)', value: '3.14 (Mesokurtic)', rating: 'Normal Tail Risk', color: 'text-purple-400' },
  ];

  const distributionBins = [
    { range: '< -4%', frequency: 4, count: 18, color: 'bg-rose-600' },
    { range: '-4% s/d -2%', frequency: 12, count: 54, color: 'bg-rose-500' },
    { range: '-2% s/d 0%', frequency: 28, count: 126, color: 'bg-amber-600' },
    { range: '0% s/d +2%', frequency: 36, count: 162, color: 'bg-emerald-600' },
    { range: '+2% s/d +4%', frequency: 14, count: 63, color: 'bg-emerald-500' },
    { range: '> +4%', frequency: 6, count: 27, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Statistik & Distribusi Return Portofolio' : 'Statistical Return Distribution'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-mono">MONTE CARLO</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Uji distribusi statistik return, skewness, fat-tail risk (kurtosis), dan simulasi kuantitatif Monte Carlo.' : 'Empirical returns distribution histogram, Sharpe/Sortino ratios, VaR 95%, and Monte Carlo paths.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">{isId ? 'Simulasi:' : 'Runs:'}</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-pink-300 font-bold border border-slate-700">
              1,000 Iterasi
            </span>
          </div>
        </div>
      </div>

      {/* Statistical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <div className="text-xs font-mono text-slate-400">{s.label}</div>
            <div className={`text-2xl font-black font-mono mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-[11px] font-mono text-slate-400 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              {s.rating}
            </div>
          </div>
        ))}
      </div>

      {/* Return Distribution Histogram */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-sm font-bold font-mono text-slate-200 mb-3 flex items-center justify-between">
          <span>{isId ? 'Histogram Distribusi Return Harian (%)' : 'Daily Return Distribution Histogram'}</span>
          <span className="text-xs text-slate-400 font-normal">Sample Size: 450 Trades</span>
        </h2>

        <div className="space-y-3 mt-4">
          {distributionBins.map((bin) => (
            <div key={bin.range} className="space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>{bin.range}</span>
                <span>{bin.frequency}% ({bin.count} trades)</span>
              </div>
              <div className="w-full bg-slate-800 h-4 rounded-md overflow-hidden p-0.5">
                <div
                  className={`${bin.color} h-full rounded transition-all duration-500`}
                  style={{ width: `${bin.frequency * 2.2}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
