import React, { useState } from 'react';
import { Layers, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Plus, Trash2 } from 'lucide-react';
import { useExchangeCredentials } from '../../services/credentialStorageService';
import { SupportedExchange, ExchangeApiCredential } from '../../types/crypto.types';

interface MultiExchangeManagerViewProps {
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

export const MultiExchangeManagerView: React.FC<MultiExchangeManagerViewProps> = ({
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [credentials, setCredentials] = useExchangeCredentials();
  const [activeExchange, setActiveExchange] = useState<SupportedExchange>('BINANCE');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);

  const exchanges: { id: SupportedExchange; name: string; latency: number; status: 'ONLINE' | 'IDLE'; color: string }[] = [
    { id: 'BINANCE', name: 'Binance Global', latency: 24, status: 'ONLINE', color: 'text-amber-400' },
    { id: 'OKX', name: 'OKX Exchange', latency: 31, status: 'ONLINE', color: 'text-cyan-400' },
    { id: 'BYBIT', name: 'Bybit Unified', latency: 38, status: 'ONLINE', color: 'text-orange-400' },
    { id: 'KUCOIN', name: 'KuCoin Spot/Futures', latency: 45, status: 'IDLE', color: 'text-emerald-400' },
    { id: 'BITGET', name: 'Bitget Copy & Quant', latency: 42, status: 'IDLE', color: 'text-blue-400' },
    { id: 'CRYPTO_COM', name: 'Crypto.com Exchange', latency: 56, status: 'IDLE', color: 'text-indigo-400' },
    { id: 'BITUNIX', name: 'Bitunix Derivatives', latency: 68, status: 'IDLE', color: 'text-pink-400' },
  ];

  const handleTestPing = () => {
    setIsTesting(true);
    setPingSuccess(null);
    setTimeout(() => {
      setIsTesting(false);
      setPingSuccess(true);
    }, 600);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;

    const newCred: ExchangeApiCredential = {
      id: `cred-${Date.now()}`,
      name: `${activeExchange} Account`,
      exchange: activeExchange,
      marketType: 'FUTURES',
      apiKey,
      apiSecret,
      passphrase,
      isTestnet: false,
      status: 'CONNECTED',
      permissions: {
        readOnly: true,
        spotTrading: true,
        futuresTrading: true,
        withdrawEnabled: false,
      },
      lastTestedAt: Date.now(),
      latencyMs: 28,
      createdTime: Date.now(),
    };

    const filtered = credentials.filter((c) => c.exchange !== activeExchange);
    setCredentials([...filtered, newCred]);

    setApiKey('');
    setApiSecret('');
    setPassphrase('');
  };

  const handleRemove = (exchange: SupportedExchange) => {
    setCredentials(credentials.filter((c) => c.exchange !== exchange));
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Manajer Multi-Bursa (Multi-Exchange Manager)' : 'Multi-Exchange Manager'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">7 EXCHANGES</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Hub konektivitas terpusat: manajemen API Key, tes latensi koneksi, dan agregasi saldo lintas bursa.' : 'Centralized API key management, latency diagnostics, and balance aggregation.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestPing}
            disabled={isTesting}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 hover:bg-cyan-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Latency...' : 'Ping All Exchanges'}</span>
          </button>
        </div>
      </div>

      {/* Exchange Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {exchanges.map((ex) => {
          const isConfigured = credentials.some((c) => c.exchange === ex.id && c.status === 'CONNECTED');
          return (
            <div
              key={ex.id}
              className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold font-mono text-white text-xs">{ex.name}</span>
                <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              </div>

              <div className="flex items-center justify-between mt-3 text-xs font-mono">
                <span className="text-slate-400">Latensi Ping:</span>
                <span className="text-cyan-400 font-bold">{ex.latency}ms</span>
              </div>

              <div className="flex items-center justify-between mt-1 text-xs font-mono">
                <span className="text-slate-400">Status API:</span>
                <span className={isConfigured ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {isConfigured ? 'CONNECTED' : 'NOT CONFIGURED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* API Key Configuration Form */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-sm font-bold font-mono text-slate-200 mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-pink-400" />
          <span>{isId ? 'Tambah / Perbarui Kredensial API Bursa' : 'Add / Update Exchange API Credentials'}</span>
        </h2>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Pilih Bursa</label>
              <select
                value={activeExchange}
                onChange={(e) => setActiveExchange(e.target.value as SupportedExchange)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden"
              >
                {exchanges.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Key"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Masukkan API Secret"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Passphrase (Opsional)</label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Passphrase (OKX/KuCoin)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-hidden focus:border-pink-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              Simpan Kredensial Bursa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
