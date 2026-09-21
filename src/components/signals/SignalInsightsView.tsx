import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Globe,
  Compass,
  Layers,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface SignalInsightsViewProps {
  isDark: boolean;
  lang: Language;
}

export const SignalInsightsView: React.FC<SignalInsightsViewProps> = ({ isDark, lang }) => {
  const isId = lang === 'id';

  return (
    <div className="space-y-6 font-mono">
      <div
        className={`p-6 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MARKET INTELLIGENCE
              </span>
            </div>
            <h1 className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Wawasan Pasar & Arus Alpha
            </h1>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Analisis makro kuantitatif, rotasi likuiditas sektor koin, dan pemetaan probabilitas model sinyal saat ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className="text-xs text-slate-400 block">Sentimen Makro Likuiditas</span>
          <div className="text-2xl font-bold text-emerald-400">BULLISH DOMINANT</div>
          <p className="text-xs text-slate-400">
            CVD Spot Aggregator mencatat akumulasi bersih +$380M dalam 24 jam terakhir di Bitcoin & Solana.
          </p>
        </div>

        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className="text-xs text-slate-400 block">Sektor Unggulan Hari Ini</span>
          <div className="text-2xl font-bold text-pink-400">AI & L1 ROLLUPS</div>
          <p className="text-xs text-slate-400">
            Model ALPHA mendeteksi 6 sinyal terkonfirmasi STRONG di sektor infrastruktur AI & Layer-1.
          </p>
        </div>

        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className="text-xs text-slate-400 block">Rekomendasi Model Efektif</span>
          <div className="text-2xl font-bold text-purple-400">ALPHA + 4H TF</div>
          <p className="text-xs text-slate-400">
            Win rate model ALPHA pada timeframe 4H mencapai 91.2% dengan rata-rata reward 1:3.4.
          </p>
        </div>
      </div>
    </div>
  );
};
