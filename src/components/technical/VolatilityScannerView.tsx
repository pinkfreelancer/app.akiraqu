import React, { useState } from 'react';
import { Activity, Gauge, Zap, AlertCircle, ArrowUpRight, Flame } from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';

interface VolatilityScannerViewProps {
  onSelectCoin?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface VolatilityItem {
  symbol: string;
  name: string;
  atr14: number;
  atrPercent: number;
  bbWidth: number; // Bollinger Band width %
  status: 'BB_SQUEEZE' | 'EXPLOSIVE_EXPANSION' | 'NORMAL' | 'HIGH_VOLATILITY';
  breakoutPotential: number; // 0-100
  historicalVol30d: number;
}

export const VolatilityScannerView: React.FC<VolatilityScannerViewProps> = ({
  onSelectCoin,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [filter, setFilter] = useState<'ALL' | 'SQUEEZE' | 'EXPANSION'>('ALL');

  const volData: VolatilityItem[] = [
    {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      atr14: 2150.4,
      atrPercent: 2.43,
      bbWidth: 3.12,
      status: 'BB_SQUEEZE',
      breakoutPotential: 92,
      historicalVol30d: 38.4,
    },
    {
      symbol: 'SOL/USDT',
      name: 'Solana',
      atr14: 12.8,
      atrPercent: 6.94,
      bbWidth: 8.45,
      status: 'EXPLOSIVE_EXPANSION',
      breakoutPotential: 88,
      historicalVol30d: 62.1,
    },
    {
      symbol: 'FET/USDT',
      name: 'Artificial Superintelligence',
      atr14: 0.16,
      atrPercent: 10.81,
      bbWidth: 14.2,
      status: 'HIGH_VOLATILITY',
      breakoutPotential: 95,
      historicalVol30d: 84.5,
    },
    {
      symbol: 'ETH/USDT',
      name: 'Ethereum',
      atr14: 98.4,
      atrPercent: 2.87,
      bbWidth: 3.65,
      status: 'BB_SQUEEZE',
      breakoutPotential: 85,
      historicalVol30d: 44.2,
    },
    {
      symbol: 'XRP/USDT',
      name: 'XRP',
      atr14: 0.045,
      atrPercent: 3.94,
      bbWidth: 4.80,
      status: 'NORMAL',
      breakoutPotential: 62,
      historicalVol30d: 49.0,
    },
  ];

  const filtered = volData.filter((item) => {
    if (filter === 'SQUEEZE') return item.status === 'BB_SQUEEZE';
    if (filter === 'EXPANSION') return item.status === 'EXPLOSIVE_EXPANSION' || item.status === 'HIGH_VOLATILITY';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Pemindai Volatilitas (Volatility & Squeeze Scanner)' : 'Volatility & Squeeze Scanner'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-mono">ATR & BB</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Identifikasi kompresi Bollinger Bands (Squeeze) sebelum terjadinya breakout eksplosif dan ukur ATR volatilitas.' : 'Identify Bollinger Band squeezes prior to explosive breakouts and quantify ATR variance.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === 'ALL' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('SQUEEZE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === 'SQUEEZE' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              BB Squeeze (Breakout Setup)
            </button>
            <button
              onClick={() => setFilter('EXPANSION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === 'EXPANSION' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ekspansi Volatilitas Tinggi
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Volatility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.symbol}
            className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold font-mono text-white">{item.symbol}</span>
                <span className="text-[10px] text-slate-400 block">{item.name}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                item.status === 'BB_SQUEEZE'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : item.status === 'EXPLOSIVE_EXPANSION'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {item.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ATR(14) Vol</span>
                <span className="text-white font-bold">{item.atrPercent}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">BB Width Band</span>
                <span className="text-pink-400 font-bold">{item.bbWidth}%</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Potensi Breakout:</span>
              <span className="text-amber-400 font-bold">{item.breakoutPotential}%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-pink-500 h-full rounded-full"
                style={{ width: `${item.breakoutPotential}%` }}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => onSelectCoin && onSelectCoin(item.symbol)}
                className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                Lihat Chart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
