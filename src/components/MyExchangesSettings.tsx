import React, { useState } from 'react';
import { ExchangeApiCredential, SupportedExchange, MarketType } from '../types/crypto.types';
import { testExchangeApiConnection, generateNewDemoAccount } from '../services/terminalExtensionService';
import {
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowUpRight,
  Edit2,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';

interface MyExchangesSettingsProps {
  credentials: ExchangeApiCredential[];
  onSaveCredentials: (creds: ExchangeApiCredential[]) => void;
  theme?: 'light' | 'dark';
  onLinkBotWithExchange?: (exchange: SupportedExchange, marketType: MarketType) => void;
}

const SUPPORTED_EXCHANGE_LIST: {
  id: SupportedExchange;
  name: string;
  spotSupported: boolean;
  futuresSupported: boolean;
  requiresPassphrase?: boolean;
  docsUrl: string;
}[] = [
  { id: 'BINANCE', name: 'Binance', spotSupported: true, futuresSupported: true, docsUrl: 'https://binance.com' },
  { id: 'OKX', name: 'OKX', spotSupported: true, futuresSupported: true, requiresPassphrase: true, docsUrl: 'https://okx.com' },
  { id: 'BYBIT', name: 'Bybit', spotSupported: true, futuresSupported: true, docsUrl: 'https://bybit.com' },
  { id: 'KUCOIN', name: 'KuCoin', spotSupported: true, futuresSupported: true, requiresPassphrase: true, docsUrl: 'https://kucoin.com' },
  { id: 'BITGET', name: 'Bitget', spotSupported: true, futuresSupported: true, requiresPassphrase: true, docsUrl: 'https://bitget.com' },
  { id: 'CRYPTO_COM', name: 'Crypto.com', spotSupported: true, futuresSupported: true, docsUrl: 'https://crypto.com' },
];

const PRESET_DEMO_BALANCES = [5000, 10000, 25000, 50000, 100000];

export const MyExchangesSettings: React.FC<MyExchangesSettingsProps> = ({
  credentials,
  onSaveCredentials,
  theme = 'dark',
  onLinkBotWithExchange,
}) => {
  const isDark = theme === 'dark';

  // Filters
  const [filterAccountType, setFilterAccountType] = useState<'ALL' | 'DEMO' | 'REAL'>('ALL');
  const [filterMarket, setFilterMarket] = useState<'ALL' | 'SPOT' | 'FUTURES'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'DEMO' | 'REAL'>('DEMO');
  const [editingCredId, setEditingCredId] = useState<string | null>(null);

  // Top Up / Reset Demo Modal
  const [topUpModalCred, setTopUpModalCred] = useState<ExchangeApiCredential | null>(null);
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number>(10000);

  // Testing & Secrets State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formExchange, setFormExchange] = useState<SupportedExchange>('BINANCE');
  const [formMarketType, setFormMarketType] = useState<MarketType>('SPOT');
  const [formVirtualBalance, setFormVirtualBalance] = useState<number>(10000);
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiSecret, setFormApiSecret] = useState('');
  const [formPassphrase, setFormPassphrase] = useState('');
  const [formIsTestnet, setFormIsTestnet] = useState(false);
  const [formIsTesting, setFormIsTesting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Filtered List
  const filteredCredentials = credentials.filter((c) => {
    if (filterAccountType === 'DEMO' && !c.isDemo) return false;
    if (filterAccountType === 'REAL' && c.isDemo) return false;
    if (filterMarket !== 'ALL' && c.marketType !== filterMarket) return false;
    return true;
  });

  const demoCount = credentials.filter((c) => c.isDemo).length;
  const realCount = credentials.filter((c) => !c.isDemo).length;
  const spotCount = credentials.filter((c) => c.marketType === 'SPOT').length;
  const futuresCount = credentials.filter((c) => c.marketType === 'FUTURES').length;

  const totalDemoBalanceUsd = credentials
    .filter((c) => c.isDemo)
    .reduce((sum, c) => sum + (c.accountBalanceUsd || 0), 0);
  const totalRealBalanceUsd = credentials
    .filter((c) => !c.isDemo)
    .reduce((sum, c) => sum + (c.accountBalanceUsd || 0), 0);

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleOpenAddDemoModal = (presetMarket?: MarketType) => {
    setEditingCredId(null);
    setModalMode('DEMO');
    setFormExchange('BINANCE');
    setFormMarketType(presetMarket || 'SPOT');
    setFormVirtualBalance(presetMarket === 'FUTURES' ? 50000 : 10000);
    setFormName('');
    setFormApiKey('');
    setFormApiSecret('');
    setFormPassphrase('');
    setFormIsTestnet(true);
    setFormFeedback(null);
    setShowModal(true);
  };

  const handleOpenAddRealModal = () => {
    setEditingCredId(null);
    setModalMode('REAL');
    setFormExchange('BINANCE');
    setFormMarketType('SPOT');
    setFormName('');
    setFormApiKey('');
    setFormApiSecret('');
    setFormPassphrase('');
    setFormIsTestnet(false);
    setFormFeedback(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (cred: ExchangeApiCredential) => {
    setEditingCredId(cred.id);
    setModalMode(cred.isDemo ? 'DEMO' : 'REAL');
    setFormName(cred.name);
    setFormExchange(cred.exchange);
    setFormMarketType(cred.marketType);
    setFormVirtualBalance(cred.accountBalanceUsd || 10000);
    setFormApiKey(cred.apiKey);
    setFormApiSecret(cred.apiSecret);
    setFormPassphrase(cred.passphrase || '');
    setFormIsTestnet(cred.isTestnet);
    setFormFeedback(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const updated = credentials.filter((c) => c.id !== id);
    onSaveCredentials(updated);
  };

  const handleResetDemoBalance = (cred: ExchangeApiCredential, newAmount: number) => {
    const updated = credentials.map((c) =>
      c.id === cred.id
        ? {
            ...c,
            accountBalanceUsd: newAmount,
            initialDemoBalanceUsd: newAmount,
            lastTestedAt: Date.now(),
          }
        : c
    );
    onSaveCredentials(updated);
    setTopUpModalCred(null);
  };

  const handleTestConnection = async (cred: ExchangeApiCredential) => {
    setTestingId(cred.id);
    setTestResult(null);

    const res = await testExchangeApiConnection(
      cred.exchange,
      cred.marketType,
      cred.apiKey,
      cred.apiSecret,
      cred.isTestnet,
      cred.isDemo
    );

    setTestingId(null);
    setTestResult({
      id: cred.id,
      success: res.success,
      message: res.message,
    });

    if (res.success) {
      const updated = credentials.map((c) =>
        c.id === cred.id
          ? {
              ...c,
              status: 'CONNECTED' as const,
              latencyMs: res.latencyMs,
              accountBalanceUsd: cred.isDemo ? (c.accountBalanceUsd || 10000) : res.balanceUsd,
              lastTestedAt: Date.now(),
            }
          : c
      );
      onSaveCredentials(updated);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'DEMO') {
      if (editingCredId) {
        const updated = credentials.map((c) =>
          c.id === editingCredId
            ? {
                ...c,
                name: formName || `${formExchange} ${formMarketType} Demo ($${formVirtualBalance.toLocaleString()})`,
                exchange: formExchange,
                marketType: formMarketType,
                accountBalanceUsd: formVirtualBalance,
                initialDemoBalanceUsd: formVirtualBalance,
                lastTestedAt: Date.now(),
              }
            : c
        );
        onSaveCredentials(updated);
      } else {
        const newDemo = generateNewDemoAccount(
          formExchange,
          formMarketType,
          formVirtualBalance,
          formName || undefined
        );
        onSaveCredentials([...credentials, newDemo]);
      }
      setShowModal(false);
      return;
    }

    if (!formApiKey || !formApiSecret) {
      setFormFeedback('Mohon isi API Key dan API Secret bursa Anda.');
      return;
    }

    setFormIsTesting(true);
    setFormFeedback(null);

    const testRes = await testExchangeApiConnection(
      formExchange,
      formMarketType,
      formApiKey,
      formApiSecret,
      formIsTestnet,
      false
    );

    setFormIsTesting(false);

    if (editingCredId) {
      const updated = credentials.map((c) =>
        c.id === editingCredId
          ? {
              ...c,
              name: formName || `${formExchange} ${formMarketType} Real Account`,
              exchange: formExchange,
              marketType: formMarketType,
              apiKey: formApiKey,
              apiSecret: formApiSecret,
              passphrase: formPassphrase || undefined,
              isTestnet: formIsTestnet,
              isDemo: false,
              status: (testRes.success ? 'CONNECTED' : 'ERROR') as 'CONNECTED' | 'ERROR',
              latencyMs: testRes.latencyMs,
              accountBalanceUsd: testRes.balanceUsd,
              lastTestedAt: Date.now(),
            }
          : c
      );
      onSaveCredentials(updated);
    } else {
      const newCred: ExchangeApiCredential = {
        id: `cred-${formExchange.toLowerCase()}-${formMarketType.toLowerCase()}-${Date.now()}`,
        name: formName || `${formExchange} ${formMarketType} Real Account`,
        exchange: formExchange,
        marketType: formMarketType,
        apiKey: formApiKey,
        apiSecret: formApiSecret,
        passphrase: formPassphrase || undefined,
        isTestnet: formIsTestnet,
        isDemo: false,
        status: testRes.success ? 'CONNECTED' : 'UNTESTED',
        permissions: {
          readOnly: true,
          spotTrading: formMarketType === 'SPOT',
          futuresTrading: formMarketType === 'FUTURES',
          withdrawEnabled: false,
        },
        latencyMs: testRes.latencyMs,
        accountBalanceUsd: testRes.balanceUsd,
        lastTestedAt: Date.now(),
        createdTime: Date.now(),
      };
      onSaveCredentials([...credentials, newCred]);
    }

    setShowModal(false);
  };

  const selectedExchangeMeta = SUPPORTED_EXCHANGE_LIST.find((e) => e.id === formExchange);

  return (
    <div className="space-y-5 font-mono">
      {/* Header & Overview Card */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Key className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Pengaturan My Exchanges &amp; Demo Akun
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  Paper Demo &amp; Live API Ready
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Kelola akun simulasi <strong className="text-white">Demo Virtual</strong> bebas risiko atau tautkan <strong className="text-white">API Key Bursa</strong> asli untuk eksekusi <strong className="text-cyan-300">Market SPOT</strong> dan <strong className="text-purple-300">FUTURES</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            <button
              onClick={() => handleOpenAddDemoModal('SPOT')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              + Buat Demo Akun
            </button>
            <button
              onClick={handleOpenAddRealModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Tambah API Real
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700 text-xs">
          <div className="p-3 rounded-xl border bg-[#070b14] border-slate-700">
            <span className="text-slate-300 block text-xs uppercase font-bold">Akun Demo (Virtual)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-emerald-400">{demoCount} Akun</span>
              <span className="text-xs text-slate-300 tabular-nums">(${formatCryptoPrice(totalDemoBalanceUsd)})</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-[#070b14] border-slate-700">
            <span className="text-slate-300 block text-xs uppercase font-bold">Akun Real (API Live)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-cyan-300">{realCount} Akun</span>
              <span className="text-xs text-slate-300 tabular-nums">(${formatCryptoPrice(totalRealBalanceUsd)})</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-[#070b14] border-slate-700">
            <span className="text-slate-300 block text-xs uppercase font-bold">Sumber SPOT / FUTURES</span>
            <span className="text-sm font-bold text-white block mt-0.5">
              <span className="text-cyan-300">{spotCount} Spot</span> / <span className="text-purple-300">{futuresCount} Fut</span>
            </span>
          </div>
          <div className="p-3 rounded-xl border bg-[#070b14] border-slate-700">
            <span className="text-slate-300 block text-xs uppercase font-bold">Protokol Eksekusi</span>
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> WebSocket Sub-10ms
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Account Type Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0f172a] border border-slate-700">
            <button
              onClick={() => setFilterAccountType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAccountType === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Semua ({credentials.length})
            </button>
            <button
              onClick={() => setFilterAccountType('DEMO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterAccountType === 'DEMO'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Akun ({demoCount})
            </button>
            <button
              onClick={() => setFilterAccountType('REAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAccountType === 'REAL'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Real API ({realCount})
            </button>
          </div>

          {/* Market Type Sub-Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0f172a] border border-slate-700">
            <button
              onClick={() => setFilterMarket('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                filterMarket === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Semua Market
            </button>
            <button
              onClick={() => setFilterMarket('SPOT')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                filterMarket === 'SPOT' ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50' : 'text-slate-300 hover:text-white'
              }`}
            >
              SPOT ({spotCount})
            </button>
            <button
              onClick={() => setFilterMarket('FUTURES')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                filterMarket === 'FUTURES' ? 'bg-purple-950 text-purple-200 border border-purple-500/50' : 'text-slate-300 hover:text-white'
              }`}
            >
              FUTURES ({futuresCount})
            </button>
          </div>
        </div>

        {/* Demo Fast-Add Shortcut Badges */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold hidden md:inline">Preset Demo Cepat:</span>
          <button
            onClick={() => handleOpenAddDemoModal('SPOT')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-colors"
          >
            + Spot Demo $10k
          </button>
          <button
            onClick={() => handleOpenAddDemoModal('FUTURES')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 flex items-center gap-1 cursor-pointer transition-colors"
          >
            + Futures Demo $50k
          </button>
        </div>
      </div>

      {/* Credentials Grid */}
      {filteredCredentials.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center space-y-3 ${
          isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Tidak ada akun pada filter ini</h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Buka Akun Demo gratis untuk simulasi trading bot tanpa risiko, atau masukkan API Key bursa Anda.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleOpenAddDemoModal('SPOT')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Buat Demo Akun SPOT ($10k)
            </button>
            <button
              onClick={() => handleOpenAddDemoModal('FUTURES')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-400 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Buat Demo Akun FUTURES ($50k)
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCredentials.map((cred) => {
            const isSpot = cred.marketType === 'SPOT';
            const isDemo = Boolean(cred.isDemo);
            const isSecretVisible = visibleSecrets[cred.id] || false;
            const isTesting = testingId === cred.id;

            return (
              <div
                key={cred.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isDemo
                    ? 'bg-[#0a1424] border-emerald-500/40 hover:border-emerald-500/70'
                    : isDark
                    ? 'bg-[#0f172a] border-slate-700 hover:border-slate-600'
                    : 'bg-white border-slate-300'
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                        isDemo
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : cred.exchange === 'BINANCE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : cred.exchange === 'OKX'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : cred.exchange === 'BYBIT'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {cred.exchange.slice(0, 3)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {cred.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                          <span>{cred.exchange}</span>
                          <span>•</span>
                          <span className={isSpot ? 'text-cyan-300 font-bold' : 'text-purple-300 font-bold'}>
                            Market {cred.marketType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isDemo ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          DEMO VIRTUAL
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-950 text-cyan-200 border border-cyan-500/50">
                          REAL API
                        </span>
                      )}

                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
                        cred.status === 'CONNECTED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-yellow-950 text-yellow-300 border border-yellow-500/40'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {cred.status} {cred.latencyMs ? `(${cred.latencyMs}ms)` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Balance and Details Box */}
                  <div className={`p-3.5 rounded-xl border space-y-2.5 text-xs mb-4 ${
                    isDemo ? 'bg-[#050c18] border-emerald-500/30' : 'bg-[#070b14] border-slate-700'
                  }`}>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        {isDemo ? 'Saldo Virtual Demo:' : 'Perkiraan Saldo Akun:'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-400 tabular-nums">
                          ${formatCryptoPrice(cred.accountBalanceUsd || 0)} USD
                        </span>
                        {isDemo && (
                          <button
                            onClick={() => {
                              setSelectedTopUpAmount(cred.initialDemoBalanceUsd || 10000);
                              setTopUpModalCred(cred);
                            }}
                            className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-colors font-bold"
                            title="Reset / Top Up Saldo Demo"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* API Key info */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-xs font-semibold">
                        {isDemo ? 'Virtual Credential ID:' : 'API Key:'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-100 text-xs font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                          {isSecretVisible ? cred.apiKey : `${cred.apiKey.slice(0, 6)}••••••••${cred.apiKey.slice(-4)}`}
                        </span>
                        <button
                          onClick={() => handleCopyKey(`key-${cred.id}`, cred.apiKey)}
                          className="p-1.5 rounded text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                          title="Salin Key"
                        >
                          {copiedKeyId === `key-${cred.id}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* API Secret */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-xs font-semibold">
                        {isDemo ? 'Sandbox Key Secret:' : 'API Secret:'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-100 text-xs font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                          {isSecretVisible ? cred.apiSecret : '••••••••••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => toggleSecretVisibility(cred.id)}
                          className="p-1.5 rounded text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                          title={isSecretVisible ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {isSecretVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Passphrase for OKX / KuCoin */}
                    {cred.passphrase && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-xs font-semibold">Passphrase:</span>
                        <span className="text-slate-200 text-xs font-mono">
                          {isSecretVisible ? cred.passphrase : '••••••••'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Permissions Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      ✓ Read Live Stream
                    </span>
                    {isSpot ? (
                      <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-200 border border-cyan-500/40">
                        ✓ Spot Market Trading
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-200 border border-purple-500/40">
                        ✓ Futures &amp; Perp Trading
                      </span>
                    )}
                    {isDemo ? (
                      <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        ✓ Zero Risk Sandbox
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                        ✕ Withdraw Blocked
                      </span>
                    )}
                  </div>

                  {/* Test Feedback Notice */}
                  {testResult && testResult.id === cred.id && (
                    <div className={`p-2.5 rounded-lg text-xs mb-3 border font-semibold ${
                      testResult.success
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                    }`}>
                      {testResult.message}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(cred)}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(cred)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                      title="Edit Akun"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors cursor-pointer"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {onLinkBotWithExchange && (
                    <button
                      onClick={() => onLinkBotWithExchange(cred.exchange, cred.marketType)}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                    >
                      <span>Tautkan ke Bot</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reset / Top Up Demo Balance Modal */}
      {topUpModalCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 font-mono ${
            isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <RotateCcw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Reset / Top Up Saldo Demo</h3>
                  <p className="text-xs text-slate-300">{topUpModalCred.name}</p>
                </div>
              </div>
              <button
                onClick={() => setTopUpModalCred(null)}
                className="text-slate-300 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-slate-200 font-bold block">
                Pilih Nominal Saldo Virtual (USDT):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_DEMO_BALANCES.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedTopUpAmount(amt)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedTopUpAmount === amt
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                        : 'bg-[#070b14] border-slate-700 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Atau Masukkan Nominal Kustom ($):</label>
                <input
                  type="number"
                  min="100"
                  max="1000000"
                  value={selectedTopUpAmount}
                  onChange={(e) => setSelectedTopUpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
              <button
                onClick={() => setTopUpModalCred(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleResetDemoBalance(topUpModalCred, selectedTopUpAmount)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Konfirmasi Reset Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Exchange & Demo Account Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 transition-all max-h-[90vh] overflow-y-auto font-mono ${
            isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl border ${
                  modalMode === 'DEMO'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {modalMode === 'DEMO' ? <Sparkles className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCredId ? 'Edit Akun Bursa' : modalMode === 'DEMO' ? 'Buka Akun Demo Baru (Virtual)' : 'Tambah API Key Bursa Real'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {modalMode === 'DEMO' ? 'Simulasi paper trading tanpa risiko modal' : 'Konfigurasi API bursa untuk live execution'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-300 hover:text-white text-lg p-1 rounded-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            {!editingCredId && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#070b14] border border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalMode('DEMO')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalMode === 'DEMO'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  1. Mode Demo (Virtual)
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('REAL')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalMode === 'REAL'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  2. Mode Real (API Key)
                </button>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Account Label / Name */}
              <div>
                <label className="block text-xs text-slate-200 font-bold mb-1.5">
                  Label / Nama Akun
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={modalMode === 'DEMO' ? `Contoh: ${formExchange} ${formMarketType} Demo Trader` : 'Contoh: Binance Spot Utama / OKX Futures Desk'}
                  className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>

              {/* Exchange Selection */}
              <div>
                <label className="block text-xs text-slate-200 font-bold mb-1.5">
                  Pilih Bursa (Exchange Source)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUPPORTED_EXCHANGE_LIST.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setFormExchange(ex.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        formExchange === ex.id
                          ? modalMode === 'DEMO'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-[#070b14] border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Source: SPOT vs FUTURES */}
              <div>
                <label className="block text-xs text-slate-200 font-bold mb-1.5">
                  Tipe Pasar (Market Engine Target)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMarketType('SPOT');
                      if (modalMode === 'DEMO' && formVirtualBalance === 50000) {
                        setFormVirtualBalance(10000);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formMarketType === 'SPOT'
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-[#070b14] border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Market SPOT</span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">1x Fisik</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-tight">
                      Simulasi beli/jual koin fisik tanpa risiko likuidasi margin.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormMarketType('FUTURES');
                      if (modalMode === 'DEMO' && formVirtualBalance === 10000) {
                        setFormVirtualBalance(50000);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formMarketType === 'FUTURES'
                        ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-sm'
                        : 'bg-[#070b14] border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Market FUTURES</span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">Margin</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-tight">
                      Kontrak perpetual leverage &amp; hedging dua arah (Long &amp; Short).
                    </p>
                  </button>
                </div>
              </div>

              {/* DEMO-SPECIFIC FIELDS */}
              {modalMode === 'DEMO' ? (
                <div className="space-y-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Modal Virtual Akun Demo:</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_DEMO_BALANCES.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormVirtualBalance(amt)}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                          formVirtualBalance === amt
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                            : 'bg-[#070b14] border-slate-700 text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        ${amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 Akun Demo menggunakan feed harga live WebSocket bursa asli, tanpa perlu mendaftar atau memasukkan API Key bursa Anda.
                  </p>
                </div>
              ) : (
                /* REAL API-SPECIFIC FIELDS */
                <>
                  {/* API Key */}
                  <div>
                    <label className="block text-xs text-slate-200 font-bold mb-1.5">
                      API Key
                    </label>
                    <input
                      type="text"
                      required
                      value={formApiKey}
                      onChange={(e) => setFormApiKey(e.target.value)}
                      placeholder="Masukkan API Key dari exchange..."
                      className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* API Secret */}
                  <div>
                    <label className="block text-xs text-slate-200 font-bold mb-1.5">
                      API Secret
                    </label>
                    <input
                      type="password"
                      required
                      value={formApiSecret}
                      onChange={(e) => setFormApiSecret(e.target.value)}
                      placeholder="Masukkan API Secret..."
                      className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Passphrase for OKX / KuCoin */}
                  {selectedExchangeMeta?.requiresPassphrase && (
                    <div>
                      <label className="block text-xs text-amber-300 font-bold mb-1.5 flex items-center gap-1">
                        <span>API Passphrase ({formExchange} Wajib)</span>
                      </label>
                      <input
                        type="password"
                        value={formPassphrase}
                        onChange={(e) => setFormPassphrase(e.target.value)}
                        placeholder={`Masukkan Passphrase API ${formExchange}...`}
                        className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-amber-500/50 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  )}

                  {/* Testnet toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-700">
                    <div>
                      <span className="text-xs text-white font-bold block">Gunakan Mode Testnet Sandbox</span>
                      <span className="text-xs text-slate-300">Endpoint simulasi testnet resmi exchange</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formIsTestnet}
                      onChange={(e) => setFormIsTestnet(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Security Warning Notice */}
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <strong className="text-rose-200">Peringatan Keamanan:</strong> Jangan pernah mencentang izin <em>"Enable Withdrawals"</em> pada akun real. AKIRAQU Terminal hanya membutuhkan izin membaca pasar dan menempatkan order simulasi/eksekusi.
                </div>
              </div>

              {/* Error feedback */}
              {formFeedback && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-semibold">
                  {formFeedback}
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formIsTesting}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                    modalMode === 'DEMO'
                      ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 font-black'
                      : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20 font-black'
                  }`}
                >
                  {formIsTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {formIsTesting ? 'Memverifikasi...' : modalMode === 'DEMO' ? 'Buat Akun Demo Sekarang' : 'Verifikasi & Simpan API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
