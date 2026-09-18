import React from 'react';
import { MarketBias } from '../types/crypto.types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';

interface GaugeChartProps {
  score: number; // 0 - 100
  bias: MarketBias;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const GaugeChart: React.FC<GaugeChartProps> = React.memo(({
  score,
  bias,
  bullishCount,
  bearishCount,
  neutralCount,
  lang = 'id',
  theme = 'dark',
}) => {
  const t = getTranslation(lang);
  const isDark = theme === 'dark';

  const getLocalizedBias = (b: MarketBias): string => {
    if (lang === 'en') return b;
    switch (b) {
      case 'Strong Bullish':
        return t.gauge.strongBullish;
      case 'Bullish':
        return t.gauge.bullish;
      case 'Neutral':
        return t.gauge.neutral;
      case 'Bearish':
        return t.gauge.bearish;
      case 'Strong Bearish':
        return t.gauge.strongBearish;
    }
  };

  // SVG Semi-circle gauge geometry
  const width = 280;
  const height = 155;
  const radius = 100;
  const cx = width / 2;
  const cy = height - 15;

  // Score mapping: 0 -> -180 deg (left), 100 -> 0 deg (right)
  const angleDeg = -180 + (score / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  const needleLength = radius * 0.85;
  const needleX = cx + needleLength * Math.cos(angleRad);
  const needleY = cy + needleLength * Math.sin(angleRad);

  const getBiasColor = (b: MarketBias) => {
    switch (b) {
      case 'Strong Bullish':
        return { 
          text: isDark ? 'text-cyan-300' : 'text-cyan-800', 
          bg: isDark ? 'bg-cyan-500/15' : 'bg-cyan-50', 
          border: isDark ? 'border-cyan-500/40' : 'border-cyan-300', 
          fill: '#00F2FE' 
        };
      case 'Bullish':
        return { 
          text: isDark ? 'text-emerald-300' : 'text-emerald-800', 
          bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50', 
          border: isDark ? 'border-emerald-500/40' : 'border-emerald-300', 
          fill: '#10b981' 
        };
      case 'Neutral':
        return { 
          text: isDark ? 'text-amber-300' : 'text-amber-800', 
          bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50', 
          border: isDark ? 'border-amber-500/40' : 'border-amber-300', 
          fill: '#f59e0b' 
        };
      case 'Bearish':
        return { 
          text: isDark ? 'text-rose-300' : 'text-rose-800', 
          bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50', 
          border: isDark ? 'border-rose-500/40' : 'border-rose-300', 
          fill: '#f43f5e' 
        };
      case 'Strong Bearish':
        return { 
          text: isDark ? 'text-red-300' : 'text-red-800', 
          bg: isDark ? 'bg-red-500/15' : 'bg-red-50', 
          border: isDark ? 'border-red-500/40' : 'border-red-300', 
          fill: '#ef4444' 
        };
    }
  };

  const biasStyle = getBiasColor(bias);
  const localizedBias = getLocalizedBias(bias);

  return (
    <div className={`flex flex-col items-center justify-between p-5 rounded-xl border shadow-md h-full transition-colors duration-200 ${
      isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Title */}
      <div className={`w-full flex items-center justify-between border-b pb-2 mb-2 ${isDark ? 'border-[#1e293b]' : 'border-slate-100'}`}>
        <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {t.gauge.title}
        </span>
        <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
          {t.gauge.subtitle}
        </span>
      </div>

      {/* Semi-Circular SVG Gauge */}
      <div className="relative my-2">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="gaugeTrackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#00F2FE" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={isDark ? '#1e293b' : '#e2e8f0'}
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Value Gradient Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeTrackGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="314"
            strokeDashoffset={314 - (score / 100) * 314}
            className="transition-all duration-700 ease-out"
          />

          {/* Center Needle & Pivot */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={isDark ? '#f8fafc' : '#334155'}
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          <circle cx={cx} cy={cy} r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />

          {/* Scale Labels */}
          <text x={cx - radius - 2} y={cy + 16} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            0
          </text>
          <text x={cx} y={cy - radius - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            50
          </text>
          <text x={cx + radius + 4} y={cy + 16} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            100
          </text>
        </svg>

        {/* Score in Center */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center">
          <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {score}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Market Bias Pill */}
      <div className={`mt-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${biasStyle.bg} ${biasStyle.text} ${biasStyle.border} flex items-center gap-1.5 shadow-xs`}>
        {bias.includes('Bullish') ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : bias.includes('Bearish') ? (
          <TrendingDown className="w-3.5 h-3.5" />
        ) : (
          <Minus className="w-3.5 h-3.5" />
        )}
        <span>{lang === 'id' ? `Bias ${localizedBias}` : `${bias} Bias`}</span>
      </div>

      {/* Multi-Indicator Consensus Chips */}
      <div className={`w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t ${isDark ? 'border-[#1e293b]' : 'border-slate-100'}`}>
        <div className={`flex flex-col items-center p-2 rounded-lg border ${
          isDark ? 'bg-[#0b0f19] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <span className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{t.gauge.bullishLabel}</span>
          <span className={`text-base font-bold font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{bullishCount}</span>
        </div>
        <div className={`flex flex-col items-center p-2 rounded-lg border ${
          isDark ? 'bg-[#0b0f19] border-slate-700/50' : 'bg-slate-50 border-slate-300'
        }`}>
          <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>{t.gauge.neutralLabel}</span>
          <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{neutralCount}</span>
        </div>
        <div className={`flex flex-col items-center p-2 rounded-lg border ${
          isDark ? 'bg-[#0b0f19] border-rose-500/20' : 'bg-rose-50 border-rose-200'
        }`}>
          <span className={`text-[10px] font-bold ${isDark ? 'text-rose-400' : 'text-rose-800'}`}>{t.gauge.bearishLabel}</span>
          <span className={`text-base font-bold font-mono ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>{bearishCount}</span>
        </div>
      </div>
    </div>
  );
});

GaugeChart.displayName = 'GaugeChart';
