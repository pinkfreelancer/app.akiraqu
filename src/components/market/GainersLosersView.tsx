import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Zap, BarChart2, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';

interface GainersLosersViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface MoverItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: string;
  volatility: string;
  category: string;
}

export const GainersLosersView: React.FC<GainersLosersViewProps> = ({
  onSelectCoin,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activeTab, setActiveTab] = useState<'GAINERS' | 'LOSERS' | 'VOLUME'>('GAINERS');

  const topGainers: MoverItem[] = [
    { rank: 1, symbol: 'FET/USDT', name: 'Artificial Superintelligence', price: 1.48, change24h: +14.62, volume24h: '$195M', volatility: 'High (8.4%)', category: 'AI' },
    { rank: 2, symbol: 'SUI/USDT', name: 'Sui Network', price: 3.42, change24h: +12.45, volume24h: '$310M', volatility: 'High (7.2%)', category: 'L1' },
    { rank: 3, symbol: 'ONDO/USDT', name: 'Ondo Finance', price: 1.08, change24h: +11.20, volume24h: '$74M', volatility: 'Medium (5.8%)', category: 'RWA' },
    { rank: 4, symbol: 'RENDER/USDT', name: 'Render', price: 7.92, change24h: +9.84, volume24h: '$125M', volatility: 'Medium (6.1%)', category: 'AI' },
    { rank: 5, symbol: 'DOGE/USDT', name: 'Dogecoin', price: 0.284, change24h: +8.75, volume24h: '$580M', volatility: 'High (9.1%)', category: 'Meme' },
  ];

  const topLosers: MoverItem[] = [
    { rank: 1, symbol: 'PEPE/USDT', name: 'Pepe Meme', price: 0.0000185, change24h: -5.40, volume24h: '$240M', volatility: 'High (11.2%)', category: 'Meme' },
    { rank: 2, symbol: 'ARB/USDT', name: 'Arbitrum', price: 0.88, change24h: -3.85, volume24h: '$48M', volatility: 'Medium (4.9%)', category: 'L2' },
    { rank: 3, symbol: 'ADA/USDT', name: 'Cardano', price: 0.724, change24h: -2.82, volume24h: '$140M', volatility: 'Low (3.1%)', category: 'L1' },
    { rank: 4, symbol: 'TIA/USDT', name: 'Celestia', price: 5.12, change24h: -2.45, volume24h: '$65M', volatility: 'Medium (6.2%)', category: 'Modular' },
    { rank: 5, symbol: 'OP/USDT', name: 'Optimism', price: 1.72, change24h: -1.95, volume24h: '$39M', volatility: 'Medium (4.5%)', category: 'L2' },
  ];

  const currentList = activeTab === 'GAINERS' ? topGainers : topLosers;

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Top Gainers & Losers 24 Jam' : '24h Gainers & Losers'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">24H TICKER</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Peringkat koin dengan pergerakan harga terbesar dan breakout volatilitas.' : 'Leaderboard of top performing and declining crypto assets with direct trading jump.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('GAINERS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'GAINERS'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Top Gainers</span>
            </button>
            <button
              onClick={() => setActiveTab('LOSERS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'LOSERS'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Top Losers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Pasangan Koin</th>
                <th className="py-2.5 px-3">Harga Terakhir</th>
                <th className="py-2.5 px-3">Perubahan 24j</th>
                <th className="py-2.5 px-3">Volume 24j</th>
                <th className="py-2.5 px-3">Volatilitas</th>
                <th className="py-2.5 px-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {currentList.map((item) => (
                <tr key={item.symbol} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-400">#{item.rank}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{item.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{item.name}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    ${formatCryptoPrice(item.price)}
                  </td>
                  <td className={`py-3 px-3 font-bold ${item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="flex items-center gap-1">
                      {item.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{item.change24h >= 0 ? `+${item.change24h}%` : `${item.change24h}%`}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{item.volume24h}</td>
                  <td className="py-3 px-3 text-slate-400">{item.volatility}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectCoin && onSelectCoin(item.symbol)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Chart
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateToTrade && onNavigateToTrade(item.symbol)}
                        className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold cursor-pointer transition-colors"
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
