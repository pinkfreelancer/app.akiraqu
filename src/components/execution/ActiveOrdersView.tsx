import React, { useState } from 'react';
import { Zap, XCircle, CheckCircle2, Clock, Filter, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';

interface ActiveOrdersViewProps {
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface ActiveOrder {
  id: string;
  symbol: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT';
  price: number;
  triggerPrice?: number;
  amount: number;
  totalUsd: number;
  placedTime: string;
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'TRIGGER_PENDING';
}

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [orders, setOrders] = useState<ActiveOrder[]>([
    {
      id: 'ORD-98214',
      symbol: 'BTC/USDT',
      exchange: 'BINANCE',
      side: 'BUY',
      type: 'LIMIT',
      price: 86500,
      amount: 0.25,
      totalUsd: 21625,
      placedTime: '10 mins ago',
      status: 'OPEN',
    },
    {
      id: 'ORD-98215',
      symbol: 'SOL/USDT',
      exchange: 'OKX',
      side: 'SELL',
      type: 'TAKE_PROFIT',
      price: 198.5,
      amount: 40,
      totalUsd: 7940,
      placedTime: '25 mins ago',
      status: 'OPEN',
    },
    {
      id: 'ORD-98216',
      symbol: 'ETH/USDT',
      exchange: 'BYBIT',
      side: 'SELL',
      type: 'STOP_MARKET',
      price: 3340,
      triggerPrice: 3340,
      amount: 2.5,
      totalUsd: 8350,
      placedTime: '1 hr ago',
      status: 'TRIGGER_PENDING',
    },
    {
      id: 'ORD-98217',
      symbol: 'FET/USDT',
      exchange: 'BINANCE',
      side: 'BUY',
      type: 'LIMIT',
      price: 1.35,
      amount: 5000,
      totalUsd: 6750,
      placedTime: '2 hrs ago',
      status: 'OPEN',
    },
  ]);

  const handleCancelOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const handleCancelAll = () => {
    if (window.confirm(isId ? 'Batalkan semua open orders?' : 'Cancel all active orders?')) {
      setOrders([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Manajemen Order Aktif (Active Orders)' : 'Active Order Management'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                  {orders.length} Open
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Pantau dan batalkan order aktif (Limit, Stop-Loss, Take-Profit, Trailing) lintas bursa.' : 'Real-time order queue management across connected exchanges.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {orders.length > 0 && (
              <button
                type="button"
                onClick={handleCancelAll}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{isId ? 'Batalkan Semua (Cancel All)' : 'Cancel All Orders'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            {isId ? 'Tidak ada order aktif terbuka saat ini.' : 'No active open orders in queue.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 pb-2">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Pasangan Koin</th>
                  <th className="py-2.5 px-3">Exchange</th>
                  <th className="py-2.5 px-3">Sisi</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3">Harga Limit / Trigger</th>
                  <th className="py-2.5 px-3">Jumlah & Nilai</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-slate-400">{ord.id}</td>
                    <td className="py-3 px-3 font-bold text-white">{ord.symbol}</td>
                    <td className="py-3 px-3 text-cyan-400">{ord.exchange}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.side === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {ord.side}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{ord.type}</td>
                    <td className="py-3 px-3 font-bold text-white">
                      ${formatCryptoPrice(ord.price)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white font-bold">{ord.amount}</div>
                      <div className="text-[10px] text-slate-400">${ord.totalUsd.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(ord.id)}
                        className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
