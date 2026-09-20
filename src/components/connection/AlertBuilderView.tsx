import React, { useState } from 'react';
import { Bell, BellRing, Plus, Trash2, ShieldCheck, CheckCircle2, Sliders, Zap } from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';

interface AlertBuilderViewProps {
  currentSymbol?: string;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface CustomAlertRule {
  id: string;
  symbol: string;
  metric: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'CONFLUENCE_SCORE' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'WHALE_INFLOW';
  threshold: number | string;
  channel: 'IN_APP' | 'TELEGRAM_DISPATCH' | 'WEBHOOK';
  isActive: boolean;
}

export const AlertBuilderView: React.FC<AlertBuilderViewProps> = ({
  currentSymbol = 'BTC/USDT',
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [alerts, setAlerts] = useState<CustomAlertRule[]>([
    {
      id: 'ALT-1',
      symbol: 'BTC/USDT',
      metric: 'PRICE_ABOVE',
      threshold: 90000,
      channel: 'IN_APP',
      isActive: true,
    },
    {
      id: 'ALT-2',
      symbol: 'BTC/USDT',
      metric: 'CONFLUENCE_SCORE',
      threshold: '>= 80 (Strong Conviction)',
      channel: 'TELEGRAM_DISPATCH',
      isActive: true,
    },
    {
      id: 'ALT-3',
      symbol: 'SOL/USDT',
      metric: 'RSI_OVERSOLD',
      threshold: '<= 30 (15m)',
      channel: 'IN_APP',
      isActive: true,
    },
  ]);

  const [newSymbol, setNewSymbol] = useState(currentSymbol);
  const [newMetric, setNewMetric] = useState<CustomAlertRule['metric']>('PRICE_ABOVE');
  const [newThreshold, setNewThreshold] = useState('89000');
  const [newChannel, setNewChannel] = useState<CustomAlertRule['channel']>('IN_APP');

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreshold) return;
    const item: CustomAlertRule = {
      id: `ALT-${Date.now()}`,
      symbol: newSymbol,
      metric: newMetric,
      threshold: newThreshold,
      channel: newChannel,
      isActive: true,
    };
    setAlerts((prev) => [item, ...prev]);
    setNewThreshold('');
  };

  const handleRemove = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggle = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <BellRing className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Pembangun Alert & Notifikasi Kuantitatif' : 'Alert & Notification Builder'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-mono">
                  {alerts.filter((a) => a.isActive).length} Aktif
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Buat aturan peringatan cerdas berdasarkan harga, skor konfluensi sinyal AI, RSI ekstrem, atau lonjakan volume.' : 'Automated threshold notifications for price spikes, confluence scores, and RSI extremes.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Alert Form */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-sm font-bold font-mono text-slate-200 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-pink-400" />
          <span>{isId ? 'Buat Peringatan Baru' : 'Create Custom Alert Rule'}</span>
        </h2>

        <form onSubmit={handleAddAlert} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Pasangan Koin</label>
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Kondisi / Metrik</label>
            <select
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value as CustomAlertRule['metric'])}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden"
            >
              <option value="PRICE_ABOVE">Harga &gt; Target</option>
              <option value="PRICE_BELOW">Harga &lt; Target</option>
              <option value="CONFLUENCE_SCORE">Skor Konfluensi &gt;= Nilai</option>
              <option value="RSI_OVERSOLD">RSI Oversold (&lt;= 30)</option>
              <option value="RSI_OVERBOUGHT">RSI Overbought (&gt;= 70)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Ambang Batas (Threshold)</label>
            <input
              type="text"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              placeholder="Contoh: 89000 atau 80"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden focus:border-pink-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Saluran Notifikasi</label>
            <select
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value as CustomAlertRule['channel'])}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden"
            >
              <option value="IN_APP">In-App Toast & Audio</option>
              <option value="TELEGRAM_DISPATCH">Telegram Bot Dispatch</option>
              <option value="WEBHOOK">Custom HTTP Webhook</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              + Buat Alert
            </button>
          </div>
        </form>
      </div>

      {/* Alert Rules List */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Pasangan</th>
                <th className="py-2.5 px-3">Metrik Pemicu</th>
                <th className="py-2.5 px-3">Nilai Target</th>
                <th className="py-2.5 px-3">Kanal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-400">{a.id}</td>
                  <td className="py-3 px-3 font-bold text-white">{a.symbol}</td>
                  <td className="py-3 px-3 text-cyan-400">{a.metric.replace('_', ' ')}</td>
                  <td className="py-3 px-3 font-bold text-white">{a.threshold}</td>
                  <td className="py-3 px-3 text-slate-300">{a.channel}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(a.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        a.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {a.isActive ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(a.id)}
                      className="p-1 rounded hover:bg-slate-800 text-rose-400 cursor-pointer"
                      title="Hapus Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
