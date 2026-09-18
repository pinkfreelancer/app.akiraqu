import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { MarketBias } from '../../types/crypto.types';
import { Language } from '../../i18n/translations';

interface ConfluenceBiasGuidelinesProps {
  bias: MarketBias;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const ConfluenceBiasGuidelines: React.FC<ConfluenceBiasGuidelinesProps> = ({
  bias,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const biasGuidelines = useMemo(() => {
    if (bias === 'Strong Bullish') {
      return {
        strategy: lang === 'id' ? 'Agresif Buy / Long di Retest Support' : 'Aggressive Buy / Long on Support Retests',
        riskProfile: lang === 'id' ? 'Sangat Menguntungkan (Rasio RRR Tinggi)' : 'Highly Favorable (High RRR)',
        leverageAdvice: lang === 'id' ? 'Leverage Maksimal 10x - 15x dianjurkan' : 'Max 10x - 15x leverage recommended',
        invalidation: lang === 'id' ? 'Tembusnya Support Utama & Volume Bearish Meningkat' : 'Break of primary support & surge in bearish volume',
        color: isDark ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20' : 'border-cyan-200 text-cyan-700 bg-cyan-50/50',
      };
    } else if (bias === 'Bullish') {
      return {
        strategy: lang === 'id' ? 'Membeli Bertahap (DCA) di Area EMA 20/50' : 'Scale-in (DCA) buy near EMA 20/50',
        riskProfile: lang === 'id' ? 'Menguntungkan (Gunakan RRR minimum 1.5:1)' : 'Favorable (Aim for minimum 1.5:1 RRR)',
        leverageAdvice: lang === 'id' ? 'Maksimal 5x - 10x leverage' : 'Max 5x - 10x leverage recommended',
        invalidation: lang === 'id' ? 'Harga ditutup di bawah EMA 200 Harian' : 'Daily candle close below EMA 200',
        color: isDark ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20' : 'border-emerald-200 text-emerald-700 bg-emerald-50/50',
      };
    } else if (bias === 'Strong Bearish') {
      return {
        strategy: lang === 'id' ? 'Agresif Sell / Short di Retest Resistansi' : 'Aggressive Sell / Short on Resistance Retests',
        riskProfile: lang === 'id' ? 'Sangat Menguntungkan untuk Posisi Short' : 'Highly Favorable for Short Positions',
        leverageAdvice: lang === 'id' ? 'Leverage Maksimal 10x - 15x untuk Posisi Turun' : 'Max 10x - 15x leverage for shorts',
        invalidation: lang === 'id' ? 'Tembusnya Resistansi Kunci & Stochastic Oversold memantul' : 'Break of key resistance & Stochastic bounce',
        color: isDark ? 'border-red-500/30 text-red-400 bg-red-950/20' : 'border-red-200 text-red-700 bg-red-50/50',
      };
    } else if (bias === 'Bearish') {
      return {
        strategy: lang === 'id' ? 'Ambil Posisi Short di Reli Sementara (Faded Rallies)' : 'Short faded rallies near key resistance levels',
        riskProfile: lang === 'id' ? 'Menguntungkan untuk Pemegang Kontrak Derivatif' : 'Favorable for Derivative Contract holders',
        leverageAdvice: lang === 'id' ? 'Leverage Maksimal 5x - 10x' : 'Max 5x - 10x leverage recommended',
        invalidation: lang === 'id' ? 'Volume Beli Melonjak & RSI menembus level 55' : 'Bullish volume spike & RSI breakout above 55',
        color: isDark ? 'border-rose-500/30 text-rose-400 bg-rose-950/20' : 'border-rose-200 text-rose-700 bg-rose-50/50',
      };
    } else {
      return {
        strategy: lang === 'id' ? 'Tunggu breakout (Sideways). Jangan paksakan entry.' : 'Range trading or Wait for breakout. Avoid overtrading.',
        riskProfile: lang === 'id' ? 'Rendah - fluktuasi tanpa arah yang jelas' : 'Low conviction - directionless chop',
        leverageAdvice: lang === 'id' ? 'Gunakan Leverage rendah (maksimal 2x - 3x)' : 'Strictly low leverage (Max 2x - 3x)',
        invalidation: lang === 'id' ? 'Breakout di atas resistensi atau di bawah support konsolidasi' : 'Clean break above range resistance or below range support',
        color: isDark ? 'border-amber-500/30 text-amber-400 bg-amber-950/20' : 'border-amber-200 text-amber-700 bg-amber-50/50',
      };
    }
  }, [bias, lang, isDark]);

  return (
    <div className={`p-4 rounded-xl border ${biasGuidelines.color}`}>
      <div className="flex items-center gap-1.5 font-mono text-xs font-bold mb-3">
        <FileText className="w-4 h-4" />
        <span>
          {lang === 'id' ? `Panduan Arah Bias: ${bias}` : `${bias} Bias Trading Instructions`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
        <div>
          <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {lang === 'id' ? 'Strategi Eksekusi' : 'Execution Strategy'}
          </span>
          <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{biasGuidelines.strategy}</p>
        </div>
        <div>
          <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {lang === 'id' ? 'Rekomendasi Daya Ungkit (Leverage)' : 'Leverage Recommendation'}
          </span>
          <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{biasGuidelines.leverageAdvice}</p>
        </div>
        <div>
          <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {lang === 'id' ? 'Kondisi Pembatalan Bias (Invalidasi)' : 'Invalidation Point'}
          </span>
          <p className="text-amber-500 font-bold mt-0.5">{biasGuidelines.invalidation}</p>
        </div>
        <div>
          <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {lang === 'id' ? 'Profil Risiko Rasio' : 'Conviction & Risk Profile'}
          </span>
          <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{biasGuidelines.riskProfile}</p>
        </div>
      </div>
    </div>
  );
};
