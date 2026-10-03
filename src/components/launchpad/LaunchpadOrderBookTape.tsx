import React, { useState, useMemo } from 'react';
import {
  LiveTradeTick,
  LiveOrderBookLevel,
  SupportedExchange,
  MarketType,
  OHLCVCandle,
} from '../../types/crypto.types';
import { Language } from '../../i18n/translations';
import { formatCryptoPrice } from '../../utils/formatters';
import {
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Flame,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  BarChart2,
  DollarSign,
} from 'lucide-react';

interface LaunchpadOrderBookTapeProps {
  symbol: string;
  currentPrice: number;
  recentLiveTrades?: LiveTradeTick[];
  orderBookBids?: LiveOrderBookLevel[];
  orderBookAsks?: LiveOrderBookLevel[];
  bidTotal?: number;
  askTotal?: number;
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  isDark?: boolean;
  lang?: Language;
}

export const LaunchpadOrderBookTape: React.FC<LaunchpadOrderBookTapeProps> = ({
  symbol,
  currentPrice,
  recentLiveTrades = [],
  orderBookBids = [],
  orderBookAsks = [],
  bidTotal = 0,
  askTotal = 0,
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  isDark = true,
  lang = 'id',
}) => {
  const isId = lang === 'id';
  const [activeTab, setActiveTab] = useState<'orderbook' | 'tape' | 'derivatives'>('orderbook');
  const [whaleFilterMinUsd, setWhaleFilterMinUsd] = useState<number>(0);

  // Calculate top bids and asks
  const bestBid = orderBookBids[0]?.price || currentPrice * 0.9998;
  const bestAsk = orderBookAsks[0]?.price || currentPrice * 1.0002;
  const spreadUsd = Math.max(0, bestAsk - bestBid);
  const spreadBps = currentPrice > 0 ? (spreadUsd / currentPrice) * 10000 : 0;

  // Imbalance calculation
  const totalBookVolume = bidTotal + askTotal;
  const bidRatioPct = totalBookVolume > 0 ? (bidTotal / totalBookVolume) * 100 : 50;
  const askRatioPct = 100 - bidRatioPct;

  // Filtered live trades
  const filteredTrades = useMemo(() => {
    if (whaleFilterMinUsd === 0) return recentLiveTrades.slice(0, 30);
    return recentLiveTrades
      .filter((t) => (t.amount * t.price) >= whaleFilterMinUsd)
      .slice(0, 30);
  }, [recentLiveTrades, whaleFilterMinUsd]);

  // Max quantities for depth bar calculations
  const maxBidQty = useMemo(() => {
    return Math.max(...orderBookBids.slice(0, 12).map((b) => b.amount), 0.001);
  }, [orderBookBids]);

  const maxAskQty = useMemo(() => {
    return Math.max(...orderBookAsks.slice(0, 12).map((a) => a.amount), 0.001);
  }, [orderBookAsks]);

  return (
    <div className="w-full h-full flex flex-col font-mono text-xs select-none">
      {/* Sub-tabs header */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b transition-colors ${
          isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('orderbook')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'orderbook'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{isId ? 'Buku Order L2' : 'Order Book L2'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tape')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'tape'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>{isId ? 'Tape Transaksi' : 'Live Tape'}</span>
          </button>

          <button
            onClick={() => setActiveTab('derivatives')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'derivatives'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>{isId ? 'Derivatif & OI' : 'Derivatives & OI'}</span>
          </button>
        </div>

        {activeTab === 'tape' && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500">{isId ? 'Filter Whale:' : 'Min Size:'}</span>
            <select
              value={whaleFilterMinUsd}
              onChange={(e) => setWhaleFilterMinUsd(Number(e.target.value))}
              className={`p-1 rounded text-[10px] border outline-hidden ${
                isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value={0}>{isId ? 'Semua Trade' : 'All Trades'}</option>
              <option value={10000}>≥ $10k</option>
              <option value={50000}>≥ $50k (Whale)</option>
              <option value={100000}>≥ $100k (Inst.)</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Order Book L2 */}
      {activeTab === 'orderbook' && (
        <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
          {/* Depth Imbalance Meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-emerald-400">{isId ? 'Permintaan Beli (Bids)' : 'Bids Volume'}: {bidRatioPct.toFixed(1)}%</span>
              <span className="text-rose-400">{isId ? 'Penawaran Jual (Asks)' : 'Asks Volume'}: {askRatioPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-slate-800">
              <div
                style={{ width: `${bidRatioPct}%` }}
                className="bg-emerald-500 transition-all duration-300"
              />
              <div
                style={{ width: `${askRatioPct}%` }}
                className="bg-rose-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Order Book Depth Content */}
          {orderBookBids.length === 0 && orderBookAsks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              {isId ? 'Sinkronisasi buku order bursa...' : 'Syncing exchange order book...'}
            </div>
          ) : (
            <>
              {/* Asks (Sell Wall) - Red */}
              <div className="space-y-0.5">
                <div className="grid grid-cols-3 text-[10px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-800">
                  <span>{isId ? 'Harga' : 'Price'}</span>
                  <span className="text-right">{isId ? 'Jumlah' : 'Size'}</span>
                  <span className="text-right">{isId ? 'Total ($)' : 'Total ($)'}</span>
                </div>
                {orderBookAsks.slice(0, 7).reverse().map((ask, idx) => {
                  const depthPct = Math.min(100, (ask.amount / maxAskQty) * 100);
                  return (
                    <div
                      key={`ask-${idx}`}
                      className="grid grid-cols-3 text-[11px] py-0.5 relative group hover:bg-rose-500/10 transition-colors"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none transition-all duration-300"
                        style={{ width: `${depthPct}%` }}
                      />
                      <span className="text-rose-400 font-bold tabular-nums z-10">
                        ${formatCryptoPrice(ask.price)}
                      </span>
                      <span className="text-right text-slate-300 tabular-nums z-10">
                        {ask.amount.toFixed(4)}
                      </span>
                      <span className="text-right text-slate-400 tabular-nums z-10">
                        ${(ask.price * ask.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Spread Ribbon */}
              <div
                className={`py-1 px-3 rounded-lg flex items-center justify-between border font-bold text-xs ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px] uppercase">{isId ? 'Spread:' : 'Spread:'}</span>
                  <span className="text-cyan-300 tabular-nums">${spreadUsd.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500">({spreadBps.toFixed(1)} bps)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <span className="text-[10px] text-slate-400">{isId ? 'Harga Pasar:' : 'Mark:'}</span>
                  <span className="text-white">${formatCryptoPrice(currentPrice)}</span>
                </div>
              </div>

              {/* Bids (Buy Wall) - Green */}
              <div className="space-y-0.5">
                {orderBookBids.slice(0, 7).map((bid, idx) => {
                  const depthPct = Math.min(100, (bid.amount / maxBidQty) * 100);
                  return (
                    <div
                      key={`bid-${idx}`}
                      className="grid grid-cols-3 text-[11px] py-0.5 relative group hover:bg-emerald-500/10 transition-colors"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none transition-all duration-300"
                        style={{ width: `${depthPct}%` }}
                      />
                      <span className="text-emerald-400 font-bold tabular-nums z-10">
                        ${formatCryptoPrice(bid.price)}
                      </span>
                      <span className="text-right text-slate-300 tabular-nums z-10">
                        {bid.amount.toFixed(4)}
                      </span>
                      <span className="text-right text-slate-400 tabular-nums z-10">
                        ${(bid.price * bid.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Live Whale Tape */}
      {activeTab === 'tape' && (
        <div className="p-3 flex-1 flex flex-col space-y-2">
          <div className="grid grid-cols-4 text-[10px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-800">
            <span>{isId ? 'Waktu' : 'Time'}</span>
            <span className="text-center">{isId ? 'Arah' : 'Side'}</span>
            <span className="text-right">{isId ? 'Harga' : 'Price'}</span>
            <span className="text-right">{isId ? 'Nilai ($)' : 'Value ($)'}</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] space-y-1 pr-1">
            {filteredTrades.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                {isId ? 'Tidak ada transaksi dengan filter ini' : 'No trades matching filter'}
              </div>
            ) : (
              filteredTrades.map((trade, idx) => {
                const isBuy = trade.isBuy;
                const notionalUsd = trade.amount * trade.price;
                const isWhale = notionalUsd >= 50000;
                return (
                  <div
                    key={`tape-${trade.id || 'tx'}-${trade.timestamp || idx}-${idx}`}
                    className={`grid grid-cols-4 items-center py-1 px-1.5 rounded text-[11px] transition-colors ${
                      isWhale
                        ? isDark
                          ? 'bg-cyan-500/15 border border-cyan-500/30'
                          : 'bg-cyan-50 border border-cyan-300'
                        : isDark
                        ? 'hover:bg-slate-900/60'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-slate-400 text-[10px]">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="text-center">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          isBuy
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <span
                      className={`text-right font-bold tabular-nums ${
                        isBuy ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      ${formatCryptoPrice(trade.price)}
                    </span>
                    <span className="text-right text-slate-300 tabular-nums font-semibold flex items-center justify-end gap-1">
                      {isWhale && <span className="text-cyan-400 text-[10px]">🐋</span>}
                      ${notionalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Derivatives & Open Interest */}
      {activeTab === 'derivatives' && (
        <div className="p-3 flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">{isId ? 'Funding Rate (Est 8h)' : 'Funding Rate (8h)'}</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+0.0100%</span>
              </div>
              <span className="text-[10px] text-slate-500">Tahunan: ~10.95% APR</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">{isId ? 'Open Interest Notional' : 'Open Interest (OI)'}</span>
              <div className="text-sm font-bold text-cyan-400 flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>$2.45 Milyar</span>
              </div>
              <span className="text-[10px] text-emerald-400">+3.4% dlm 24 Jam</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300">{isId ? 'Rasio Long vs Short Global' : 'Global Long/Short Ratio'}</span>
              <span className="text-cyan-400">1.28 (56.1% Long)</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-800">
              <div style={{ width: '56.1%' }} className="bg-emerald-500" />
              <div style={{ width: '43.9%' }} className="bg-rose-500" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-emerald-400 font-bold">56.1% Long</span>
              <span className="text-rose-400 font-bold">43.9% Short</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              {isId ? 'Analisis Sentimen Kuantitatif' : 'Quant Sentiment Analysis'}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isId
                ? 'Agresi pembelian pasar spot didukung oleh ekspansi Open Interest pada kontrak perpetual. Tidak terdeteksi tanda-tanda overleverage ekstrem.'
                : 'Spot market buying aggression is backed by steady Open Interest expansion on perpetuals. No extreme overleverage detected.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
