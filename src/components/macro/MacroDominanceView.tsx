import React, { useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Globe, Shield, RefreshCw, Zap, Layers } from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';

interface MacroDominanceViewProps {
  onSelectCoin?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

export const MacroDominanceView: React.FC<MacroDominanceViewProps> = ({
  onSelectCoin,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [altSeasonScore] = useState<number>(38); // 0-100 (<=25 BTC Season, >=75 Alt Season)
  const [btcDominance] = useState<number>(57.42);
  const [ethDominance] = useState<number>(14.18);
  const [usdtDominance] = useState<number>(5.62);
  const [othersDominance] = useState<number>(22.78);
  const [totalMarketCap] = useState<number>(2.84e12); // $2.84 Trillion
  const [totalVolume24h] = useState<number>(94.6e9);

  const marketShares = [
    { name: 'Bitcoin (BTC)', share: btcDominance, color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', change24h: +0.42, symbol: 'BTC/USDT' },
    { name: 'Ethereum (ETH)', share: ethDominance, color: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30', change24h: -0.18, symbol: 'ETH/USDT' },
    { name: 'Stablecoins (USDT/USDC)', share: usdtDominance, color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', change24h: -0.05, symbol: 'USDT/USD' },
    { name: 'Altcoins (Others)', share: othersDominance, color: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/30', change24h: -0.19, symbol: 'SOL/USDT' },
  ];

  const sectorRotations = [
    { sector: 'Layer 1 (L1)', change7d: '+6.8%', dominance: '18.4%', flow: 'INFLOW', status: 'Leading' },
    { sector: 'AI & Big Data', change7d: '+14.2%', dominance: '4.2%', flow: 'STRONG_INFLOW', status: 'Hyper Growth' },
    { sector: 'DeFi & DEX', change7d: '-1.4%', dominance: '3.8%', flow: 'NEUTRAL', status: 'Consolidating' },
    { sector: 'Real World Assets (RWA)', change7d: '+8.9%', dominance: '2.1%', flow: 'INFLOW', status: 'Emerging' },
    { sector: 'Memecoins & Culture', change7d: '-5.2%', dominance: '3.4%', flow: 'OUTFLOW', status: 'Cooling Off' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner & Total Market Cap Overview */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                  <span>{isId ? 'Dominasi BTC & Altcoin Index' : 'BTC Dominance & Macro Context'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-sans font-medium">LIVE</span>
                </h1>
                <p className="text-xs text-slate-400">
                  {isId
                    ? 'Analisis distribusi kapitalisasi pasar global, rotasi modal, dan status siklus Altcoin Season.'
                    : 'Global crypto market cap distribution, capital flow rotation, and Altcoin Season index cycle.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['7D', '30D', '90D', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Core Global Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/60">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 font-mono">{isId ? 'Total Market Cap' : 'Total Market Cap'}</div>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-1">${(totalMarketCap / 1e12).toFixed(2)}T</div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +2.4% (24j)
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 font-mono">{isId ? 'Volume 24 Jam' : '24h Total Volume'}</div>
            <div className="text-base sm:text-lg font-bold font-mono text-cyan-400 mt-1">${(totalVolume24h / 1e9).toFixed(1)}B</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Likuiditas Sehat</div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 font-mono">BTC Dominance</div>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-1">{btcDominance}%</div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">High Conviction</div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-[11px] text-slate-400 font-mono">Altcoin Season Index</div>
            <div className="text-base sm:text-lg font-bold font-mono text-pink-400 mt-1">{altSeasonScore}/100</div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">Bitcoin Dominant Regime</div>
          </div>
        </div>
      </div>

      {/* Dominance Gauge & Distribution Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Bar Breakdown */}
        <div className={`lg:col-span-8 p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center justify-between">
            <span>{isId ? 'Distribusi Pangsa Pasar Kripto' : 'Crypto Market Share Distribution'}</span>
            <span className="text-xs text-slate-400 font-normal">100% Normalized</span>
          </h2>

          {/* Multi-segmented progress bar */}
          <div className="w-full h-5 rounded-full overflow-hidden flex my-4 bg-slate-800 p-0.5 border border-slate-700">
            {marketShares.map((m) => (
              <div
                key={m.name}
                style={{ width: `${m.share}%` }}
                className={`${m.color} h-full transition-all duration-500`}
                title={`${m.name}: ${m.share}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {marketShares.map((m) => (
              <div
                key={m.name}
                onClick={() => onSelectCoin && onSelectCoin(m.symbol)}
                className={`p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${m.color}`} />
                    <span className="text-xs font-bold text-slate-200">{m.name}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${m.text}`}>{m.share}%</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-slate-400">
                  <span>Perubahan 24j:</span>
                  <span className={m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {m.change24h >= 0 ? `+${m.change24h}%` : `${m.change24h}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Altcoin Season Gauge Status */}
        <div className={`lg:col-span-4 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-200">{isId ? 'Status Siklus Musim' : 'Season Index Cycle'}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isId ? 'Jika > 75 = Altcoin Season. Jika < 25 = Bitcoin Season.' : '> 75 indicates Altcoin Season. < 25 indicates Bitcoin Season.'}
            </p>

            <div className="my-6 flex flex-col items-center">
              <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-4 border-amber-500/30 bg-amber-500/5">
                <div className="text-center">
                  <div className="text-3xl font-black font-mono text-amber-400">{altSeasonScore}</div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Index Score</div>
                </div>
              </div>
              <div className="mt-3 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                {isId ? 'Fase Akumulasi BTC' : 'Bitcoin Regime Phase'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">BTC Outperforming:</span>
              <strong className="text-emerald-400">68% Top 50 Alts</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rekomendasi Strategi:</span>
              <strong className="text-cyan-400">Fokus Long BTC & High-Beta L1</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Capital Flow Rotation Matrix */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{isId ? 'Rotasi Arus Modal Sektoral (Sector Flow Matrix)' : 'Sector Capital Flow Matrix'}</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 px-3">Sektor</th>
                <th className="py-2.5 px-3">Performa 7 Hari</th>
                <th className="py-2.5 px-3">Pangsa Pasar</th>
                <th className="py-2.5 px-3">Arus Modal (Net Flow)</th>
                <th className="py-2.5 px-3 text-right">Status Momentum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sectorRotations.map((sec) => (
                <tr key={sec.sector} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {sec.sector}
                  </td>
                  <td className={`py-3 px-3 font-semibold ${sec.change7d.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sec.change7d}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{sec.dominance}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sec.flow === 'STRONG_INFLOW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : sec.flow === 'INFLOW'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : sec.flow === 'NEUTRAL'
                        ? 'bg-slate-700/50 text-slate-300'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {sec.flow}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-medium">
                    {sec.status}
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
