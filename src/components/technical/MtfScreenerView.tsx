import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { useMarketDataStore } from '../../stores/useMarketDataStore';
import { useTerminal } from '../../contexts/TerminalContext';
import { formatSmartCryptoPrice } from '../../services/marketDataValidator';
import { biasToMtfSignal, MtfCellSignal } from '../../services/confluence/signalConsensus';
import { DataStatusBadge } from '../ui/DataStatusBadge';
import { CryptoIcon } from '../ui/CryptoIcon';

interface MtfScreenerViewProps {
  onSelectCoin?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface ApiMtfRow {
  symbol: string;
  price?: number;
  candleClosePrice?: number | null;
  tf1m: MtfCellSignal;
  tf5m: MtfCellSignal;
  tf15m: MtfCellSignal;
  tf1h: MtfCellSignal;
  tf4h: MtfCellSignal;
  tf1d: MtfCellSignal;
  tfScores?: Record<string, number>;
  anchorScore?: number;
  anchorBias?: string;
  computedAt?: number;
  updatedAt?: number;
}

const DEFAULT_MTF_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'DOGE/USDT',
  'SUI/USDT',
  'PEPE/USDT',
  'ARB/USDT',
  'NEAR/USDT',
];

function summarizeMtfSignals(
  cells: MtfCellSignal[],
  isId: boolean
): {
  overallTrend: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR';
  confluenceRatio: string;
  bullCount: number;
  bearCount: number;
} {
  const bullCount = cells.filter((c) => c === 'BULL').length;
  const bearCount = cells.filter((c) => c === 'BEAR').length;
  const total = cells.length || 6;

  if (bullCount >= 5 && bearCount === 0) {
    return {
      overallTrend: 'STRONG_BULL',
      confluenceRatio: `${bullCount}/${total} Bullish (${Math.round((bullCount / total) * 100)}%)`,
      bullCount,
      bearCount,
    };
  }
  if (bearCount >= 5 && bullCount === 0) {
    return {
      overallTrend: 'STRONG_BEAR',
      confluenceRatio: `${bearCount}/${total} Bearish (${Math.round((bearCount / total) * 100)}%)`,
      bullCount,
      bearCount,
    };
  }
  if (bullCount > bearCount && bullCount >= 3) {
    return {
      overallTrend: 'BULL',
      confluenceRatio: `${bullCount}/${total} Bullish (${Math.round((bullCount / total) * 100)}%)`,
      bullCount,
      bearCount,
    };
  }
  if (bearCount > bullCount && bearCount >= 3) {
    return {
      overallTrend: 'BEAR',
      confluenceRatio: `${bearCount}/${total} Bearish (${Math.round((bearCount / total) * 100)}%)`,
      bullCount,
      bearCount,
    };
  }
  return {
    overallTrend: 'NEUTRAL',
    confluenceRatio: isId
      ? `Netral (${bullCount}B / ${bearCount}S)`
      : `Neutral (${bullCount}B / ${bearCount}S)`,
    bullCount,
    bearCount,
  };
}

export const MtfScreenerView: React.FC<MtfScreenerViewProps> = ({
  onSelectCoin,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const {
    selectedSymbol,
    selectedTimeframe,
    selectedExchange,
    selectedMarketType,
    evaluation,
    symbols: catalogSymbols,
  } = useTerminal();

  const tickers = useMarketDataStore((s) => s.tickers);
  const ingestPriceTick = useMarketDataStore((s) => s.ingestPriceTick);

  const [filterMode, setFilterMode] = useState<'ALL' | 'ALIGNED_BULL' | 'ALIGNED_BEAR'>('ALL');
  const [apiRows, setApiRows] = useState<Record<string, ApiMtfRow>>({});
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const trackedSymbols = useMemo(() => {
    const ordered = [
      selectedSymbol,
      ...DEFAULT_MTF_SYMBOLS.filter((s) => s !== selectedSymbol),
    ].filter(Boolean);
    return Array.from(new Set(ordered)).slice(0, 10);
  }, [selectedSymbol]);

  const fetchMtfMatrix = useCallback(
    async (signal?: AbortSignal, force = false) => {
      try {
        setIsFetching(true);
        setFetchError(null);
        const params = new URLSearchParams({
          exchange: selectedExchange,
          marketType: selectedMarketType,
          symbols: trackedSymbols.join(','),
        });
        if (force) params.set('force', 'true');
        const res = await fetch(`/api/v1/mtf-screener?${params.toString()}`, { signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const rows: ApiMtfRow[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.rows)
          ? json.rows
          : [];
        const nextMap: Record<string, ApiMtfRow> = {};
        const now = Date.now();

        for (const r of rows) {
          nextMap[r.symbol] = r;
          const seedPrice = Number(r.candleClosePrice ?? r.price ?? 0);
          const rowTs = r.computedAt ?? r.updatedAt ?? now;
          // Seed SSOT only if ticker has not yet received a live WS tick
          if (seedPrice > 0 && !useMarketDataStore.getState().tickers[r.symbol]) {
            ingestPriceTick({
              symbol: r.symbol,
              price: seedPrice,
              source: 'REST',
              now: rowTs,
            });
          }
        }

        setApiRows(nextMap);
        setLastFetchedAt(
          typeof json?.updatedAt === 'number'
            ? json.updatedAt
            : typeof json?.timestamp === 'number'
            ? json.timestamp
            : now
        );
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setFetchError(isId ? 'Gagal memuat matriks candle MTF live' : 'Failed to load live MTF candle matrix');
      } finally {
        setIsFetching(false);
      }
    },
    [selectedExchange, selectedMarketType, trackedSymbols, ingestPriceTick, isId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMtfMatrix(controller.signal);
    const intervalId = setInterval(() => {
      fetchMtfMatrix();
    }, 20_000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [fetchMtfMatrix]);

  const mtfRows = useMemo(() => {
    return trackedSymbols.map((sym) => {
      const baseRow = apiRows[sym];
      const catalogMeta = catalogSymbols.find((c) => c.symbol === sym);
      const ssot = tickers[sym];
      const livePrice = ssot?.price ?? 0;

      let tf1m: MtfCellSignal = baseRow?.tf1m ?? 'NEUTRAL';
      let tf5m: MtfCellSignal = baseRow?.tf5m ?? 'NEUTRAL';
      let tf15m: MtfCellSignal = baseRow?.tf15m ?? 'NEUTRAL';
      let tf1h: MtfCellSignal = baseRow?.tf1h ?? 'NEUTRAL';
      let tf4h: MtfCellSignal = baseRow?.tf4h ?? 'NEUTRAL';
      let tf1d: MtfCellSignal = baseRow?.tf1d ?? 'NEUTRAL';

      // Synchronize active symbol's active timeframe directly with Main Chart evaluation
      if (sym === selectedSymbol && evaluation && evaluation.symbol === selectedSymbol) {
        const syncedSignal = biasToMtfSignal(evaluation.marketBias, evaluation.confluenceScore);
        if (selectedTimeframe === '1m') tf1m = syncedSignal;
        else if (selectedTimeframe === '5m') tf5m = syncedSignal;
        else if (selectedTimeframe === '15m') tf15m = syncedSignal;
        else if (selectedTimeframe === '1H') tf1h = syncedSignal;
        else if (selectedTimeframe === '4H') tf4h = syncedSignal;
        else if (selectedTimeframe === '1D') tf1d = syncedSignal;
      }

      const summary = summarizeMtfSignals([tf1m, tf5m, tf15m, tf1h, tf4h, tf1d], isId);

      return {
        symbol: sym,
        name: catalogMeta?.name || sym.split('/')[0],
        price: livePrice,
        change24h: ssot?.change24h,
        hasMatrix: Boolean(baseRow),
        tf1m,
        tf5m,
        tf15m,
        tf1h,
        tf4h,
        tf1d,
        overallTrend: summary.overallTrend,
        confluenceRatio: baseRow || (sym === selectedSymbol && evaluation)
          ? summary.confluenceRatio
          : isId
          ? 'Memuat candle...'
          : 'Loading candles...',
      };
    });
  }, [
    trackedSymbols,
    apiRows,
    catalogSymbols,
    tickers,
    selectedSymbol,
    selectedTimeframe,
    evaluation,
    isId,
  ]);

  const filteredData = useMemo(() => {
    return mtfRows.filter((row) => {
      if (filterMode === 'ALIGNED_BULL') {
        return row.overallTrend === 'STRONG_BULL' || row.overallTrend === 'BULL';
      }
      if (filterMode === 'ALIGNED_BEAR') {
        return row.overallTrend === 'STRONG_BEAR' || row.overallTrend === 'BEAR';
      }
      return true;
    });
  }, [mtfRows, filterMode]);

  const renderBadge = (status: MtfCellSignal, hasMatrix: boolean, isActiveCell: boolean) => {
    if (!hasMatrix && !isActiveCell) {
      return (
        <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono text-slate-500 border border-slate-800">
          ...
        </span>
      );
    }
    const ringClass = isActiveCell ? 'ring-1 ring-pink-400/70' : '';
    if (status === 'BULL') {
      return (
        <span
          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ${ringClass}`}
        >
          BUY
        </span>
      );
    }
    if (status === 'BEAR') {
      return (
        <span
          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 ${ringClass}`}
        >
          SELL
        </span>
      );
    }
    return (
      <span
        className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 ${ringClass}`}
      >
        FLAT
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                  {isId ? 'Screener Multi-Timeframe (MTF Live)' : 'Live Multi-Timeframe Screener'}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-[2px] bg-pink-500/15 text-pink-400 border border-pink-500/30 font-mono">
                  1m - 1D • {selectedExchange} {selectedMarketType}
                </span>
                <DataStatusBadge
                  symbol={selectedSymbol}
                  scope="screener"
                  updatedAtOverride={lastFetchedAt}
                  lang={lang}
                  compact
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isId
                  ? 'Harga tersinkronisasi 100% dari Single Source of Truth (WebSocket) & sinyal dihitung dari konsensus 12-indikator candle live yang sama dengan Grafik Utama.'
                  : 'Prices synchronized from the WebSocket Single Source of Truth & signals computed from the exact 12-indicator candle consensus as Main Chart.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchMtfMatrix(undefined, true)}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isId ? 'Sinkron Ulang' : 'Refresh'}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isId ? 'Semua' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ALIGNED_BULL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterMode === 'ALIGNED_BULL'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bullish
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ALIGNED_BEAR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterMode === 'ALIGNED_BEAR'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bearish
              </button>
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono">
            {fetchError}
          </div>
        )}
      </div>

      {/* MTF Matrix Table */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 px-3">{isId ? 'Pasangan & Harga Live' : 'Pair & Live Price'}</th>
                <th className="py-2.5 px-3 text-center">1m</th>
                <th className="py-2.5 px-3 text-center">5m</th>
                <th className="py-2.5 px-3 text-center">15m</th>
                <th className="py-2.5 px-3 text-center">1H</th>
                <th className="py-2.5 px-3 text-center">4H</th>
                <th className="py-2.5 px-3 text-center">1D</th>
                <th className="py-2.5 px-3">{isId ? 'Konfluensi MTF' : 'MTF Confluence'}</th>
                <th className="py-2.5 px-3 text-right">{isId ? 'Aksi' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map((row) => {
                const isSelected = row.symbol === selectedSymbol;
                return (
                  <tr
                    key={row.symbol}
                    className={`transition-colors ${
                      isSelected ? 'bg-pink-500/10' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <CryptoIcon symbol={row.symbol} size="sm" className="rounded-full shrink-0" />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{row.symbol}</span>
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-pink-500/20 text-pink-300 border border-pink-500/40">
                                AKTIF
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-pink-300 tabular-nums flex items-center gap-1.5">
                            <span>
                              {row.price > 0
                                ? `$${formatSmartCryptoPrice(row.price)}`
                                : isId
                                ? 'Sinkron...'
                                : 'Syncing...'}
                            </span>
                            {typeof row.change24h === 'number' && row.price > 0 && (
                              <span
                                className={`text-[10px] ${
                                  row.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                ({row.change24h >= 0 ? '+' : ''}
                                {row.change24h.toFixed(2)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderBadge(row.tf1m, row.hasMatrix, isSelected && selectedTimeframe === '1m')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderBadge(row.tf5m, row.hasMatrix, isSelected && selectedTimeframe === '5m')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderBadge(row.tf15m, row.hasMatrix, isSelected && selectedTimeframe === '15m')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderBadge(row.tf1h, row.hasMatrix, isSelected && selectedTimeframe === '1H')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderBadge(row.tf4h, row.hasMatrix, isSelected && selectedTimeframe === '4H')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderBadge(row.tf1d, row.hasMatrix, isSelected && selectedTimeframe === '1D')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          row.overallTrend === 'STRONG_BULL' || row.overallTrend === 'BULL'
                            ? 'text-emerald-400'
                            : row.overallTrend === 'STRONG_BEAR' || row.overallTrend === 'BEAR'
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {row.confluenceRatio}
                      </span>
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
