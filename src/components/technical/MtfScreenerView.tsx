import React, { useState } from 'react';
import { Layers, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Zap, Filter, RefreshCw } from 'lucide-react';
import { Timeframe } from '../../types/crypto.types';

interface MtfScreenerViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface MtfRow {
  symbol: string;
  name: string;
  price: number;
  overallTrend: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR';
  tf1m: 'BULL' | 'BEAR' | 'NEUTRAL';
  tf5m: 'BULL' | 'BEAR' | 'NEUTRAL';
  tf15m: 'BULL' | 'BEAR' | 'NEUTRAL';
  tf1h: 'BULL' | 'BEAR' | 'NEUTRAL';
  tf4h: 'BULL' | 'BEAR' | 'NEUTRAL';
  tf1d: 'BULL' | 'BEAR' | 'NEUTRAL';
  confluenceRatio: string;
}

export const MtfScreenerView: React.FC<MtfScreenerViewProps> = ({
  onSelectCoin,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [filterMode, setFilterMode] = useState<'ALL' | 'ALIGNED_BULL' | 'ALIGNED_BEAR'>('ALL');

  const mtfData: MtfRow[] = [
    {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      price: 88450,
      overallTrend: 'STRONG_BULL',
      tf1m: 'BULL',
      tf5m: 'BULL',
      tf15m: 'BULL',
      tf1h: 'BULL',
      tf4h: 'BULL',
      tf1d: 'BULL',
      confluenceRatio: '6/6 Bullish (100%)',
    },
    {
      symbol: 'ETH/USDT',
      name: 'Ethereum',
      price: 3420,
      overallTrend: 'BULL',
      tf1m: 'NEUTRAL',
      tf5m: 'BULL',
      tf15m: 'BULL',
      tf1h: 'BULL',
      tf4h: 'BULL',
      tf1d: 'BULL',
      confluenceRatio: '5/6 Bullish (83%)',
    },
    {
      symbol: 'SOL/USDT',
      name: 'Solana',
      price: 184.3,
      overallTrend: 'STRONG_BULL',
      tf1m: 'BULL',
      tf5m: 'BULL',
      tf15m: 'BULL',
      tf1h: 'BULL',
      tf4h: 'BULL',
      tf1d: 'BULL',
      confluenceRatio: '6/6 Bullish (100%)',
    },
    {
      symbol: 'DOGE/USDT',
      name: 'Dogecoin',
      price: 0.284,
      overallTrend: 'BULL',
      tf1m: 'BULL',
      tf5m: 'BULL',
      tf15m: 'BULL',
      tf1h: 'BULL',
      tf4h: 'NEUTRAL',
      tf1d: 'BULL',
      confluenceRatio: '5/6 Bullish (83%)',
    },
    {
      symbol: 'PEPE/USDT',
      name: 'Pepe',
      price: 0.0000185,
      overallTrend: 'STRONG_BEAR',
      tf1m: 'BEAR',
      tf5m: 'BEAR',
      tf15m: 'BEAR',
      tf1h: 'BEAR',
      tf4h: 'BEAR',
      tf1d: 'BEAR',
      confluenceRatio: '6/6 Bearish (100%)',
    },
    {
      symbol: 'ARB/USDT',
      name: 'Arbitrum',
      price: 0.88,
      overallTrend: 'BEAR',
      tf1m: 'BEAR',
      tf5m: 'BEAR',
      tf15m: 'BEAR',
      tf1h: 'BEAR',
      tf4h: 'NEUTRAL',
      tf1d: 'BEAR',
      confluenceRatio: '5/6 Bearish (83%)',
    },
    {
      symbol: 'NEAR/USDT',
      name: 'NEAR Protocol',
      price: 6.84,
      overallTrend: 'BULL',
      tf1m: 'BULL',
      tf5m: 'BULL',
      tf15m: 'BULL',
      tf1h: 'BULL',
      tf4h: 'BULL',
      tf1d: 'NEUTRAL',
      confluenceRatio: '5/6 Bullish (83%)',
    },
  ];

  const filteredData = mtfData.filter((row) => {
    if (filterMode === 'ALIGNED_BULL') return row.overallTrend === 'STRONG_BULL';
    if (filterMode === 'ALIGNED_BEAR') return row.overallTrend === 'STRONG_BEAR';
    return true;
  });

  const renderBadge = (status: 'BULL' | 'BEAR' | 'NEUTRAL') => {
    if (status === 'BULL') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          BUY
        </span>
      );
    }
    if (status === 'BEAR') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          SELL
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
        FLAT
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Screener Multi-Timeframe (MTF Alignment)' : 'Multi-Timeframe Screener'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-mono">1m - 1D</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Deteksi penyelarasan arah tren dari 1m hingga 1D untuk menyaring peluang high-probability trend continuation.' : 'Multi-timeframe trend confluence matrix scanning for 100% directional alignment.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterMode === 'ALL' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterMode('ALIGNED_BULL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterMode === 'ALIGNED_BULL' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              100% All Bullish
            </button>
            <button
              onClick={() => setFilterMode('ALIGNED_BEAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterMode === 'ALIGNED_BEAR' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              100% All Bearish
            </button>
          </div>
        </div>
      </div>

      {/* MTF Matrix Table */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 px-3">Koin</th>
                <th className="py-2.5 px-3 text-center">1m</th>
                <th className="py-2.5 px-3 text-center">5m</th>
                <th className="py-2.5 px-3 text-center">15m</th>
                <th className="py-2.5 px-3 text-center">1H</th>
                <th className="py-2.5 px-3 text-center">4H</th>
                <th className="py-2.5 px-3 text-center">1D</th>
                <th className="py-2.5 px-3">Konfluensi</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map((row) => (
                <tr key={row.symbol} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{row.symbol}</div>
                    <div className="text-[10px] text-slate-400">${row.price}</div>
                  </td>
                  <td className="py-3 px-3 text-center">{renderBadge(row.tf1m)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(row.tf5m)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(row.tf15m)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(row.tf1h)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(row.tf4h)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(row.tf1d)}</td>
                  <td className="py-3 px-3 font-bold text-slate-200">{row.confluenceRatio}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectCoin && onSelectCoin(row.symbol)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold cursor-pointer"
                      >
                        Chart
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateToTrade && onNavigateToTrade(row.symbol)}
                        className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Trade
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
