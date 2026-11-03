import React, { useState, useMemo } from 'react';
import { Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMarketDataStore } from '../../stores/useMarketDataStore';
import { useTerminal } from '../../contexts/TerminalContext';
import { formatSmartCryptoPrice } from '../../services/marketDataValidator';
import { CryptoIcon } from '../ui/CryptoIcon';
import { DataStatusBadge } from '../ui/DataStatusBadge';

interface MarketHeatmapViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

type SectorCategory = 'L1' | 'L2' | 'DeFi' | 'AI' | 'Meme' | 'RWA';

interface HeatmapMeta {
  symbol: string;
  name: string;
  category: SectorCategory;
}

const HEATMAP_UNIVERSE: HeatmapMeta[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', category: 'L1' },
  { symbol: 'ETH/USDT', name: 'Ethereum', category: 'L1' },
  { symbol: 'SOL/USDT', name: 'Solana', category: 'L1' },
  { symbol: 'BNB/USDT', name: 'BNB Chain', category: 'L1' },
  { symbol: 'XRP/USDT', name: 'XRP', category: 'L1' },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', category: 'Meme' },
  { symbol: 'ADA/USDT', name: 'Cardano', category: 'L1' },
  { symbol: 'AVAX/USDT', name: 'Avalanche', category: 'L1' },
  { symbol: 'SUI/USDT', name: 'Sui Network', category: 'L1' },
  { symbol: 'NEAR/USDT', name: 'NEAR Protocol', category: 'AI' },
  { symbol: 'FET/USDT', name: 'Artificial Superintelligence', category: 'AI' },
  { symbol: 'RENDER/USDT', name: 'Render Network', category: 'AI' },
  { symbol: 'AAVE/USDT', name: 'Aave DeFi', category: 'DeFi' },
  { symbol: 'UNI/USDT', name: 'Uniswap', category: 'DeFi' },
  { symbol: 'ONDO/USDT', name: 'Ondo Finance', category: 'RWA' },
  { symbol: 'PEPE/USDT', name: 'Pepe Meme', category: 'Meme' },
  { symbol: 'ARB/USDT', name: 'Arbitrum', category: 'L2' },
  { symbol: 'OP/USDT', name: 'Optimism', category: 'L2' },
];

export const MarketHeatmapView: React.FC<MarketHeatmapViewProps> = ({
  onSelectCoin,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const { symbols } = useTerminal();
  const tickers = useMarketDataStore((s) => s.tickers);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const tiles = useMemo(() => {
    return HEATMAP_UNIVERSE.map((meta) => {
      const ssot = tickers[meta.symbol];
      const symInfo = symbols.find((s) => s.symbol === meta.symbol);
      return {
        ...meta,
        name: symInfo?.name || meta.name,
        price: ssot?.price ?? 0,
        change24h: ssot?.change24h ?? 0,
        hasLive: Boolean(ssot && ssot.price > 0),
      };
    });
  }, [tickers, symbols]);

  const filteredTiles = useMemo(
    () => tiles.filter((t) => selectedCategory === 'ALL' || t.category === selectedCategory),
    [tiles, selectedCategory]
  );

  const getTileBg = (change: number, hasLive: boolean) => {
    if (!hasLive) return 'bg-slate-900/80 text-slate-300 border-slate-800';
    if (change >= 8) return 'bg-emerald-600/90 text-white border-emerald-400';
    if (change >= 3) return 'bg-emerald-700/80 text-white border-emerald-500/60';
    if (change >= 0) return 'bg-emerald-900/60 text-emerald-200 border-emerald-700/40';
    if (change <= -5) return 'bg-rose-700/90 text-white border-rose-500';
    return 'bg-rose-900/60 text-rose-200 border-rose-700/40';
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                  {isId ? 'Heatmap Pasar Kripto (Live SSOT)' : 'Crypto Market Heatmap (Live SSOT)'}
                </h1>
                <DataStatusBadge scope="ticker" lang={lang} compact />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isId
                  ? 'Visualisasi momentum harga 24 jam real-time lintas sektor dari sumber harga terpusat.'
                  : 'Real-time 24h sector momentum weighted from the unified market data store.'}
              </p>
            </div>
          </div>

          {/* Sector filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['ALL', 'L1', 'L2', 'DeFi', 'AI', 'Meme', 'RWA'].map((cat) => (
              <button
                key={cat}
                type="button"
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
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] flex flex-col justify-between ${
                isBig ? 'col-span-2 row-span-2 min-h-[160px]' : 'min-h-[110px]'
              } ${getTileBg(tile.change24h, tile.hasLive)}`}
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

              <div className="mt-3 font-mono tabular-nums">
                <div className="text-xs sm:text-sm font-bold">
                  {tile.hasLive
                    ? `$${formatSmartCryptoPrice(tile.price)}`
                    : isId
                    ? 'Sinkron...'
                    : 'Syncing...'}
                </div>
                {tile.hasLive && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm font-black mt-0.5">
                    {tile.change24h >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>
                      {tile.change24h >= 0 ? `+${tile.change24h.toFixed(2)}%` : `${tile.change24h.toFixed(2)}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
