import React, { useState } from 'react';
import { OpenPosition } from '../../types/crypto.types';
import { Language } from '../../i18n/translations';
import { formatCryptoPrice } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  X,
  Maximize2,
  Minimize2,
  Shield,
  Layers,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface LaunchpadPositionsBarProps {
  positions: OpenPosition[];
  currentPrice: number;
  onClosePosition: (id: string) => void;
  onClearAllPositions?: () => void;
  isDark?: boolean;
  lang?: Language;
}

export const LaunchpadPositionsBar: React.FC<LaunchpadPositionsBarProps> = ({
  positions,
  currentPrice,
  onClosePosition,
  onClearAllPositions,
  isDark = true,
  lang = 'id',
}) => {
  const isId = lang === 'id';
  const [isExpanded, setIsExpanded] = useState(true);

  if (positions.length === 0) return null;

  // Calculate live floating PnL
  const computedPositions = positions.map((pos) => {
    const mark = pos.symbol.includes('BTC') ? currentPrice : pos.entryPrice;
    const priceDiff = pos.side === 'LONG' ? mark - pos.entryPrice : pos.entryPrice - mark;
    const unrealizedPnl = (priceDiff / pos.entryPrice) * pos.sizeUsd * pos.leverage;
    const unrealizedPnlPct = (priceDiff / pos.entryPrice) * 100 * pos.leverage;

    return {
      ...pos,
      markPrice: mark,
      unrealizedPnl,
      unrealizedPnlPct,
    };
  });

  const totalUnrealizedPnl = computedPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);

  return (
    <div
      className={`w-full rounded-2xl border transition-all font-mono text-xs overflow-hidden shadow-2xl ${
        isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b cursor-pointer select-none ${
          isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
            <Layers className="w-3 h-3" />
            <span>{isId ? 'POSISI GRID AKTIF' : 'ACTIVE GRID POSITIONS'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </span>

          <span className="text-slate-400 text-xs font-bold">
            {positions.length} {isId ? 'Posisi Terbuka' : 'Open Positions'}
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[10px] text-slate-500">{isId ? 'Total PnL:' : 'Floating PnL:'}</span>
            <span
              className={`font-bold tabular-nums text-xs ${
                totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onClearAllPositions && (
            <button
              onClick={onClearAllPositions}
              className="text-[10px] text-slate-500 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
              title={isId ? 'Tutup Semua Posisi Simulasi' : 'Close All Positions'}
            >
              <Trash2 className="w-3 h-3" />
              <span>{isId ? 'Tutup Semua' : 'Close All'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Table */}
      {isExpanded && (
        <div className="overflow-x-auto max-h-48 scrollbar-thin">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider bg-slate-900/40">
                <th className="py-2 px-3">{isId ? 'Aset' : 'Asset'}</th>
                <th className="py-2 px-3">{isId ? 'Arah' : 'Side'}</th>
                <th className="py-2 px-3">{isId ? 'Ukuran' : 'Size (USD)'}</th>
                <th className="py-2 px-3">{isId ? 'Entry' : 'Entry'}</th>
                <th className="py-2 px-3">{isId ? 'Harga Terkini' : 'Mark'}</th>
                <th className="py-2 px-3">{isId ? 'Stop Loss' : 'SL'}</th>
                <th className="py-2 px-3">{isId ? 'Take Profit' : 'TP'}</th>
                <th className="py-2 px-3">{isId ? 'Floating PnL' : 'Floating PnL'}</th>
                <th className="py-2 px-3 text-right">{isId ? 'Aksi' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {computedPositions.map((pos) => {
                const isLong = pos.side === 'LONG';
                return (
                  <tr
                    key={pos.id}
                    className={`border-b transition-colors ${
                      isDark ? 'border-slate-800/60 hover:bg-slate-900/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1">
                      <span>{pos.symbol}</span>
                      <span className="text-[9px] text-cyan-400 px-1 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {pos.leverage}x
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isLong
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {pos.side}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-slate-300 font-semibold tabular-nums">
                      ${pos.sizeUsd.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </td>

                    <td className="py-2 px-3 text-slate-300 tabular-nums">
                      ${formatCryptoPrice(pos.entryPrice)}
                    </td>

                    <td className="py-2 px-3 text-white font-bold tabular-nums">
                      ${formatCryptoPrice(pos.markPrice)}
                    </td>

                    <td className="py-2 px-3 text-rose-400 tabular-nums">
                      ${formatCryptoPrice(pos.stopLoss || 0)}
                    </td>

                    <td className="py-2 px-3 text-emerald-400 tabular-nums">
                      ${formatCryptoPrice(pos.takeProfit || 0)}
                    </td>

                    <td className="py-2 px-3 font-bold tabular-nums">
                      <span
                        className={pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                      >
                        {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPct >= 0 ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                      </span>
                    </td>

                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        {isId ? 'Tutup' : 'Close'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
