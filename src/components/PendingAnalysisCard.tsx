import React from 'react';
import { Gauge, Zap, BarChart3, Clock, Sparkles } from 'lucide-react';
import { Language } from '../i18n/translations';
import { Timeframe } from '../types/crypto.types';

interface PendingAnalysisCardProps {
  symbol: string;
  timeframe: Timeframe;
  onTriggerAnalyze: () => void;
  onGoToChart?: () => void;
  isLoading?: boolean;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const PendingAnalysisCard: React.FC<PendingAnalysisCardProps> = ({
  symbol,
  timeframe,
  onTriggerAnalyze,
  onGoToChart,
  isLoading = false,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`max-w-2xl mx-auto my-8 p-8 rounded-2xl border text-center transition-all ${
        isDark
          ? 'bg-[#0f172a]/95 border-[#1e293b] shadow-2xl shadow-black/40'
          : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
      }`}
    >
      {/* Top Status Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
        <Clock className="w-3.5 h-3.5" />
        <span className="font-semibold uppercase tracking-wider">
          {lang === 'id' ? 'Mode Cepat: Buka Chart Dahulu' : 'Fast Mode: Chart-First Loaded'}
        </span>
      </div>

      {/* Main Icon */}
      <div className="flex justify-center mb-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            isDark
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-400'
              : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
          }`}
        >
          <Gauge className="w-8 h-8" />
        </div>
      </div>

      {/* Heading */}
      <h3 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}>
        {lang === 'id'
          ? `Chart ${symbol} (${timeframe}) Telah Siap`
          : `${symbol} (${timeframe}) Chart is Ready`}
      </h3>

      {/* Subtext */}
      <p className={`text-sm max-w-md mx-auto mb-6 leading-relaxed ${
        isDark ? 'text-slate-400' : 'text-slate-600'
      }`}>
        {lang === 'id'
          ? 'Chart langsung ditampilkan agar tidak membebani proses dan kuota kalkulasi. Klik tombol di bawah untuk memproses kalkulasi 12-Indikator & AI Confluence.'
          : 'The chart was loaded first to conserve processing power and quota. Click below whenever you wish to compute the full 12-Indicator & AI matrix.'}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onTriggerAnalyze}
          disabled={isLoading}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-cyan-500/25'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
          }`}
        >
          <Zap className={`w-4 h-4 fill-current ${isLoading ? 'animate-spin' : ''}`} />
          <span>
            {isLoading
              ? (lang === 'id' ? 'Sedang Memproses 12 Indikator...' : 'Processing 12 Indicators...')
              : (lang === 'id' ? `Jalankan Analisis 12-Indikator (${timeframe})` : `Run 12-Indicator Analysis (${timeframe})`)}
          </span>
        </button>

        {onGoToChart && (
          <button
            onClick={onGoToChart}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'id' ? 'Lihat Grafik (Chart)' : 'View Chart'}</span>
          </button>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>
          {lang === 'id'
            ? 'Pintasan keyboard: Tekan [R] untuk langsung analisa'
            : 'Keyboard shortcut: Press [R] to analyze anytime'}
        </span>
      </div>
    </div>
  );
};
