import React, { useState } from 'react';
import { Flame, Filter, ArrowUpRight, ArrowDownRight, Layers, Sparkles } from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';
import { CryptoIcon } from '../ui/CryptoIcon';

interface MarketHeatmapViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface HeatmapTile {
  symbol: string;
  name: string;
  category: 'L1' | 'L2' | 'DeFi' | 'AI' | 'Meme' | 'RWA';
  price: number;
  change24h: number;
  marketCap: number; // in Millions USD
  volume24h: number;
}

export const MarketHeatmapView: React.FC<MarketHeatmapViewProps> = ({
  onSelectCoin,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const tiles: HeatmapTile[] = [
    { symbol: 'BTC/USDT', name: 'Bitcoin', category: 'L1', price: 88450, change24h: +3.24, marketCap: 1740000, volume24h: 38200 },
    { symbol: 'ETH/USDT', name: 'Ethereum', category: 'L1', price: 3420.5, change24h: +1.85, marketCap: 412000, volume24h: 18400 },
    { symbol: 'SOL/USDT', name: 'Solana', category: 'L1', price: 184.3, change24h: +6.42, marketCap: 86000, volume24h: 9200 },
    { symbol: 'BNB/USDT', name: 'BNB Chain', category: 'L1', price: 612.8, change24h: -0.45, marketCap: 89000, volume24h: 2100 },
    { symbol: 'XRP/USDT', name: 'XRP', category: 'L1', price: 1.14, change24h: +2.18, marketCap: 64000, volume24h: 4200 },
    { symbol: 'DOGE/USDT', name: 'Dogecoin', category: 'Meme', price: 0.284, change24h: +8.75, marketCap: 41000, volume24h: 5800 },
    { symbol: 'ADA/USDT', name: 'Cardano', category: 'L1', price: 0.724, change24h: -1.82, marketCap: 26000, volume24h: 1400 },
    { symbol: 'AVAX/USDT', name: 'Avalanche', category: 'L1', price: 38.6, change24h: +4.15, marketCap: 16000, volume24h: 1200 },
    { symbol: 'SUI/USDT', name: 'Sui Network', category: 'L1', price: 3.42, change24h: +12.4, marketCap: 9800, volume24h: 3100 },
    { symbol: 'NEAR/USDT', name: 'NEAR Protocol', category: 'AI', price: 6.84, change24h: +7.2, marketCap: 8200, volume24h: 1800 },
    { symbol: 'FET/USDT', name: 'Artificial Superintelligence', category: 'AI', price: 1.48, change24h: +14.6, marketCap: 3800, volume24h: 1950 },
    { symbol: 'RENDER/USDT', name: 'Render Network', category: 'AI', price: 7.92, change24h: +9.8, marketCap: 4100, volume24h: 1250 },
    { symbol: 'AAVE/USDT', name: 'Aave DeFi', category: 'DeFi', price: 182.4, change24h: +5.3, marketCap: 2700, volume24h: 890 },
    { symbol: 'UNI/USDT', name: 'Uniswap', category: 'DeFi', price: 10.45, change24h: +0.6, marketCap: 6300, volume24h: 620 },
    { symbol: 'ONDO/USDT', name: 'Ondo Finance', category: 'RWA', price: 1.08, change24h: +11.2, marketCap: 1550, volume24h: 740 },
    { symbol: 'PEPE/USDT', name: 'Pepe Meme', category: 'Meme', price: 0.0000185, change24h: -3.4, marketCap: 7800, volume24h: 2400 },
    { symbol: 'ARB/USDT', name: 'Arbitrum', category: 'L2', price: 0.88, change24h: -2.1, marketCap: 3600, volume24h: 480 },
    { symbol: 'OP/USDT', name: 'Optimism', category: 'L2', price: 1.72, change24h: +1.4, marketCap: 2200, volume24h: 390 },
  ];

  const filteredTiles = tiles.filter(
    (t) => selectedCategory === 'ALL' || t.category === selectedCategory
  );

  const getTileBg = (change: number) => {
    if (change >= 10) return 'bg-emerald-600/90 text-white border-emerald-400';
    if (change >= 5) return 'bg-emerald-700/80 text-white border-emerald-500/60';
    if (change > 0) return 'bg-emerald-900/60 text-emerald-200 border-emerald-700/40';
    if (change <= -5) return 'bg-rose-700/90 text-white border-rose-500';
    return 'bg-rose-900/60 text-rose-200 border-rose-700/40';
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Heatmap Pasar Kripto' : 'Crypto Market Heatmap'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-mono">TOP 100</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Visualisasi intensitas momentum dan kapitalisasi pasar aset kripto berdasarkan sektor.' : 'Performance intensity and market cap weighting categorized by crypto sectors.'}
              </p>
            </div>
          </div>

          {/* Sector filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['ALL', 'L1', 'L2', 'DeFi', 'AI', 'Meme', 'RWA'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredTiles.map((tile) => {
          const isBig = tile.symbol === 'BTC/USDT' || tile.symbol === 'ETH/USDT';
          return (
            <div
              key={tile.symbol}
              onClick={() => onSelectCoin && onSelectCoin(tile.symbol)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between ${
                isBig ? 'col-span-2 row-span-2 min-h-[160px]' : 'min-h-[110px]'
              } ${getTileBg(tile.change24h)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CryptoIcon symbol={tile.symbol} size="sm" className="rounded-full shadow-xs shrink-0" />
                  <div>
                    <div className="font-bold font-mono text-sm sm:text-base leading-tight">
                      {tile.symbol.replace('/USDT', '')}
                    </div>
                    <div className="text-[10px] opacity-80 truncate">{tile.name}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 backdrop-blur-xs">
                  {tile.category}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xs sm:text-sm font-bold font-mono">
                  ${formatCryptoPrice(tile.price)}
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm font-black font-mono mt-0.5">
                  {tile.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span>{tile.change24h >= 0 ? `+${tile.change24h}%` : `${tile.change24h}%`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
