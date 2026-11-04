import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMarketDataStore } from '../../stores/useMarketDataStore';
import { useTerminal } from '../../contexts/TerminalContext';
import { formatSmartCryptoPrice } from '../../services/marketDataValidator';
import { CoinLogo } from '../ui/CoinLogo';
import { DataStatusBadge } from '../ui/DataStatusBadge';

interface GainersLosersViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

function formatVolCompact(vol?: string | number | null, fallbackStr?: string): string {
  if (typeof vol === 'string' && vol.trim().length > 0) {
    return vol;
  }
  if (typeof vol === 'number' && Number.isFinite(vol) && vol > 0) {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  }
  return fallbackStr || '--';
}

export const GainersLosersView: React.FC<GainersLosersViewProps> = ({
  onSelectCoin,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const { symbols } = useTerminal();
  const tickers = useMarketDataStore((s) => s.tickers);
  const [activeTab, setActiveTab] = useState<'GAINERS' | 'LOSERS'>('GAINERS');

  const currentList = useMemo(() => {
    const liveItems = symbols
      .map((sym) => {
        const ssot = tickers[sym.symbol];
        if (!ssot || !(ssot.price > 0)) return null;
        const absChange = Math.abs(ssot.change24h ?? 0);
        const volatilityLabel =
          absChange >= 7
            ? `High (${absChange.toFixed(1)}%)`
            : absChange >= 3
            ? `Medium (${absChange.toFixed(1)}%)`
            : `Low (${absChange.toFixed(1)}%)`;

        return {
          symbol: sym.symbol,
          name: sym.name,
          price: ssot.price,
          change24h: ssot.change24h ?? 0,
          volume24h: formatVolCompact(ssot.volume24h, sym.volume24h),
          volatility: volatilityLabel,
          category: sym.category || 'Crypto',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const sorted = [...liveItems].sort((a, b) =>
      activeTab === 'GAINERS' ? b.change24h - a.change24h : a.change24h - b.change24h
    );

    return sorted.slice(0, 12).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [symbols, tickers, activeTab]);

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
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                  {isId ? 'Top Gainers & Losers 24 Jam (Live)' : 'Live 24h Gainers & Losers'}
                </h1>
                <DataStatusBadge scope="ticker" lang={lang} compact />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isId
                  ? 'Peringkat pergerakan harga terbesar 24 jam yang dihitung langsung dari Single Source of Truth.'
                  : 'Real-time 24h gainers and losers ranked directly from the live ticker SSOT.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
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
              type="button"
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
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
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
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {isId
                      ? 'Menunggu sinkronisasi ticker 24 jam live dari bursa...'
                      : 'Waiting for live 24h exchange ticker synchronization...'}
                  </td>
                </tr>
              ) : (
                currentList.map((item) => (
                  <tr key={item.symbol} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-400">#{item.rank}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <CoinLogo symbol={item.symbol} size="sm" decorative />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      ${formatSmartCryptoPrice(item.price)}
                    </td>
                    <td
                      className={`py-3 px-3 font-bold ${
                        item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {item.change24h >= 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span>
                          {item.change24h >= 0
                            ? `+${item.change24h.toFixed(2)}%`
                            : `${item.change24h.toFixed(2)}%`}
                        </span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
