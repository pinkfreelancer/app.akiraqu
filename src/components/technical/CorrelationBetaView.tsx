import React, { useState } from 'react';
import { Network, BarChart3, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';

interface CorrelationBetaViewProps {
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

export const CorrelationBetaView: React.FC<CorrelationBetaViewProps> = ({
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [period, setPeriod] = useState<'30D' | '90D' | '1Y'>('30D');

  const assets = ['BTC', 'ETH', 'SOL', 'SPX', 'GOLD', 'DXY'];

  const correlationMatrix: Record<string, Record<string, number>> = {
    BTC: { BTC: 1.0, ETH: 0.88, SOL: 0.76, SPX: 0.42, GOLD: 0.28, DXY: -0.62 },
    ETH: { BTC: 0.88, ETH: 1.0, SOL: 0.82, SPX: 0.48, GOLD: 0.22, DXY: -0.58 },
    SOL: { BTC: 0.76, ETH: 0.82, SOL: 1.0, SPX: 0.52, GOLD: 0.15, DXY: -0.54 },
    SPX: { BTC: 0.42, ETH: 0.48, SOL: 0.52, SPX: 1.0, GOLD: 0.08, DXY: -0.45 },
    GOLD: { BTC: 0.28, ETH: 0.22, SOL: 0.15, SPX: 0.08, GOLD: 1.0, DXY: -0.72 },
    DXY: { BTC: -0.62, ETH: -0.58, SOL: -0.54, SPX: -0.45, GOLD: -0.72, DXY: 1.0 },
  };

  const betaList = [
    { asset: 'SOL', name: 'Solana', beta: 1.64, description: 'High Beta (64% more volatile than BTC)' },
    { asset: 'DOGE', name: 'Dogecoin', beta: 2.12, description: 'Hyper Beta (Memecoin beta leverage)' },
    { asset: 'FET', name: 'Artificial Superintelligence', beta: 1.85, description: 'High Beta (AI sector leader)' },
    { asset: 'ETH', name: 'Ethereum', beta: 1.15, description: 'Slightly higher volatility than BTC' },
    { asset: 'BNB', name: 'BNB Chain', beta: 0.78, description: 'Low Beta (Resilient exchange token)' },
    { asset: 'GOLD', name: 'Gold / XAU', beta: 0.12, description: 'Ultra-low beta safe haven hedge' },
  ];

  const getCellColor = (val: number) => {
    if (val === 1.0) return 'bg-slate-800 text-slate-400';
    if (val >= 0.7) return 'bg-emerald-600/80 text-white font-bold';
    if (val >= 0.3) return 'bg-emerald-800/60 text-emerald-200';
    if (val >= 0) return 'bg-slate-800/80 text-slate-300';
    if (val >= -0.4) return 'bg-amber-900/60 text-amber-200';
    return 'bg-rose-700/80 text-white font-bold';
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Network className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Matriks Korelasi & Analisis Beta Portofolio' : 'Correlation & Beta Matrix'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">MACRO CROSS-ASSET</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Matriks korelasi silang antar aset kripto, ekuitas global (S&P500), Emas, dan Indeks Dolar AS (DXY).' : 'Cross-asset correlation coefficients against S&P 500, Gold, DXY, and relative asset beta.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(['30D', '90D', '1Y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  period === p ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-Asset Correlation Table */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-sm font-bold font-mono text-slate-200 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>{isId ? 'Matriks Korelasi Spearman/Pearson' : 'Correlation Heatmap'}</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 text-left">Asset</th>
                {assets.map((a) => (
                  <th key={a} className="py-2.5 px-3">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((rowAsset) => (
                <tr key={rowAsset} className="border-b border-slate-800/40">
                  <td className="py-3 px-3 text-left font-bold text-white">{rowAsset}</td>
                  {assets.map((colAsset) => {
                    const val = correlationMatrix[rowAsset][colAsset];
                    return (
                      <td key={colAsset} className="py-2 px-2">
                        <span className={`inline-block px-2.5 py-1.5 rounded-lg text-xs font-mono w-14 ${getCellColor(val)}`}>
                          {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beta Relative to Bitcoin (BTC) */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-sm font-bold font-mono text-slate-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-400" />
          <span>{isId ? 'Koefisien Beta Relatif terhadap Bitcoin (BTC = 1.0)' : 'Beta Coefficient (vs. BTC Benchmark)'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {betaList.map((item) => (
            <div
              key={item.asset}
              className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{item.asset}</span>
                  <span className="text-[10px] text-slate-400 block">{item.name}</span>
                </div>
                <span className="text-sm font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Beta: {item.beta.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
