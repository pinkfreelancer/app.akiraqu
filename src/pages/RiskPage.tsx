import React from 'react';
import { RiskCalculatorCard } from '../components/RiskCalculatorCard';
import {
  RiskManagementPlan,
  IndicatorsSnapshot,
  LiquidationHeatmapSummary,
} from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { ShieldCheck, AlertTriangle, Scale, Target } from 'lucide-react';

interface RiskPageProps {
  initialRiskPlan: RiskManagementPlan;
  symbol: string;
  indicators?: IndicatorsSnapshot;
  liquidationHeatmap?: LiquidationHeatmapSummary;
  currentPrice?: number;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const RiskPage: React.FC<RiskPageProps> = React.memo(({
  initialRiskPlan,
  symbol,
  indicators,
  liquidationHeatmap,
  currentPrice,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Primary Risk & Position Sizing Calculator (Single Source of Truth) */}
      <RiskCalculatorCard
        initialRiskPlan={initialRiskPlan}
        symbol={symbol}
        indicators={indicators}
        liquidationHeatmap={liquidationHeatmap}
        currentPrice={currentPrice}
        lang={lang}
        theme={theme}
      />

      {/* Institutional Risk Discipline Reference (Non-Conflicting Educational Protocol) */}
      <div className={`rounded-xl border p-4 sm:p-5 transition-colors duration-200 ${
        isDark ? 'bg-[#0b101d] border-[#1e293b] text-white' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isDark ? 'border-[#1e293b]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {lang === 'id' ? 'Protokol Disiplin Risiko Institusional' : 'Institutional Risk Discipline Protocol'}
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isDark ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            Anti-Liquidation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className={`p-3 rounded-lg border ${
            isDark ? 'bg-[#080d1a] border-[#1e293b]/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
              <Scale className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Aturan Risiko 1-2%' : '1-2% Risk Rule'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'id'
                ? 'Jangan pertaruhkan lebih dari 1-2% total modal per posisi demi mencegah drawdown signifikan.'
                : 'Never risk more than 1-2% of total equity per trade to prevent irreversible drawdowns.'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${
            isDark ? 'bg-[#080d1a] border-[#1e293b]/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Batas Leverage' : 'Leverage Cap'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'id'
                ? 'Leverage tinggi memotong jarak likuidasi. Pastikan titik likuidasi selalu berada jauh di luar level Stop Loss.'
                : 'High leverage shrinks liquidation buffer. Always verify liquidation sits well beyond your Stop Loss.'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${
            isDark ? 'bg-[#080d1a] border-[#1e293b]/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'R:R Minimum 1:2' : 'Min 1:2 R:R'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'id'
                ? 'Hanya eksekusi rencana trading jika potensi keuntungan minimal 2x lebih besar daripada risiko stop loss.'
                : 'Only execute setups where expected reward is at least double the risk (RRR ≥ 2.0).'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${
            isDark ? 'bg-[#080d1a] border-[#1e293b]/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Scale-In Terpadu' : 'Unified Scale-In'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'id'
                ? 'Gunakan tab "Scale-In / DCA Ladder" di kartu kalkulator atas untuk membagi entry menjadi beberapa tier pesanan.'
                : 'Use the "Scale-In / DCA Ladder" tab in the calculator card above to stagger orders into multiple tiers.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

RiskPage.displayName = 'RiskPage';
