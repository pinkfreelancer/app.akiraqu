import React, { useState } from 'react';
import {
  TradingBotConfig,
  BotExecutionLog,
  SupportedExchange,
  MarketType,
  ExchangeApiCredential,
  BotTradeRecord,
  BotStrategyType,
} from '../types/crypto.types';
import {
  INITIAL_BOT_CONFIGS,
  INITIAL_EXCHANGE_CREDENTIALS,
  INITIAL_BOT_TRADES,
} from '../services/terminalExtensionService';
import {
  Bot,
  Play,
  Pause,
  ShieldAlert,
  Terminal,
  Plus,
  Zap,
  CheckCircle2,
  Key,
  Layers,
  ShieldCheck,
  BarChart3,
  Grid,
  ArrowDownCircle,
  Repeat,
  Sliders,
  Copy,
  Trash2,
  Filter,
  Info,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { MyExchangesSettings } from '../components/MyExchangesSettings';
import { BotAnalyticsView } from '../components/BotAnalyticsView';
import { BotStrategyConfigModal } from '../components/BotStrategyConfigModal';

interface BotTradingHubPageProps {
  currentSymbol: string;
  currentPrice: number;
  currentScore?: number;
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  theme?: 'light' | 'dark';
}

const STRATEGY_INFO_GUIDE: Record<
  BotStrategyType,
  { title: string; desc: string; bestFor: string; formula: string }
> = {
  GRID_BOT: {
    title: 'GRID Trading (Spot & Futures)',
    desc: 'Membagi rentang harga menjadi jaring order beli dan jual secara simetris/geometris untuk mengambil profit mikro saat pasar sideways.',
    bestFor: 'Pasar konsolidasi / ranging dengan volatilitas tinggi',
    formula: 'Profit = (Grid Jual - Grid Beli) * Volume per Level',
  },
  QFL_BOT: {
    title: 'Quickfingers Luc (QFL Base Rebound)',
    desc: 'Membeli saat harga jatuh menembus level support (Base Crack) akibat kepanikan pasar, lalu menjual saat harga memantul kembali ke equilibrium.',
    bestFor: 'Panic selling & flash drops tajam di bawah support kuat',
    formula: 'Trigger Entry = Base Price * (1 - Crack %)',
  },
  DCA_BOT: {
    title: 'DCA Multi-Layer Martingale',
    desc: 'Membuka Safety Orders bertahap dengan volume yang diperbesar saat harga berlawanan, menurunkan rata-rata harga masuk agar cepat Take Profit.',
    bestFor: 'Pasar tren koreksi yang diperkirakan akan berbalik arah',
    formula: 'Avg Price = Total Modal / Total Koin Terakumulasi',
  },
  BTD_BOT: {
    title: 'Buy The Dip (BTD Momentum Sniper)',
    desc: 'Mendeteksi penurunan harga instan dengan kecepatan tinggi disertai konfirmasi indikator RSI oversold ekstrim untuk menangkap titik terendah.',
    bestFor: 'Likuidasi cepat & capitulation candle',
    formula: 'Trigger = Flash Drop % + RSI < Threshold',
  },
  LOOP_BOT: {
    title: 'Loop Bot (Continuous Cyclical)',
    desc: 'Mengeksekusi siklus beli-jual berulang tanpa henti dengan menginvestasikan kembali (auto-compound) profit ke siklus berikutnya.',
    bestFor: 'Akumulasi jangka panjang pada aset berfundamental tinggi',
    formula: 'Modal Siklus N = Modal Awal + (Total Profit * Compound %)',
  },
  CONFLUENCE_TREND: {
    title: 'Confluence Multi-Indicator Trend',
    desc: 'Strategi pemantauan momentum dan konfluensi indikator multi-timeframe untuk menangkap tren kuat.',
    bestFor: 'Pasar trending dengan volume tinggi',
    formula: 'Trigger = Confluence Score >= 80 & EMA Alignment',
  },
  LIQUIDITY_SWEEP_REVERSAL: {
    title: 'Liquidity Sweep Reversal',
    desc: 'Mendeteksi perburuan likuidasi di atas swing high atau di bawah swing low dan masuk saat reclaim.',
    bestFor: 'Pembalikan arah saat stop hunt terjadi',
    formula: 'Trigger = Liquidity Sweep + Aggressive Delta Reversal',
  },
  GRID_SCALPER: {
    title: 'Dynamic Grid Scalper',
    desc: 'Grid bot dengan penyesuaian otomatis berdasarkan volatilitas ATR pasar.',
    bestFor: 'Scalping jangka pendek di pasar aktif',
    formula: 'Grid Spacing = ATR * Multiplier',
  },
  VWAP_MEAN_REVERSION: {
    title: 'Anchored VWAP Mean Reversion',
    desc: 'Mengeksekusi saat harga menjauh dari band deviasi standard VWAP anchor dan kembali ke mean.',
    bestFor: 'Mean reversion di pasar ranging',
    formula: 'Trigger = Price touch Band 2 & RSI extreme',
  },
};

export const BotTradingHubPage: React.FC<BotTradingHubPageProps> = ({
  currentSymbol,
  currentPrice,
  currentScore = 80,
  selectedExchange,
  selectedMarketType,
  theme = 'dark',
}) => {
  const [bots, setBots] = useState<TradingBotConfig[]>(() => {
    const saved = localStorage.getItem('nexus_trading_bots');
    return saved ? JSON.parse(saved) : INITIAL_BOT_CONFIGS;
  });

  const [credentials, setCredentials] = useState<ExchangeApiCredential[]>(() => {
    const saved = localStorage.getItem('nexus_exchange_credentials');
    return saved ? JSON.parse(saved) : INITIAL_EXCHANGE_CREDENTIALS;
  });

  const [botTrades, setBotTrades] = useState<BotTradeRecord[]>(() => {
    const saved = localStorage.getItem('nexus_bot_trades');
    return saved ? JSON.parse(saved) : INITIAL_BOT_TRADES;
  });

  const [logs, setLogs] = useState<BotExecutionLog[]>([
    {
      id: 'log-1',
      botId: 'bot-grid-spot-futures',
      timestamp: Date.now() - 1000 * 60 * 18,
      symbol: 'BTC/USDT',
      action: 'BUY_LONG',
      price: currentPrice * 0.995,
      qty: 0.05,
      reason: 'GRID Arithmetic Order Triggered at lower boundary level',
      executionStatus: 'SUCCESS',
    },
    {
      id: 'log-2',
      botId: 'bot-qfl-rebound',
      timestamp: Date.now() - 1000 * 60 * 45,
      symbol: 'SOL/USDT',
      action: 'CLOSE_TAKE_PROFIT',
      price: 205.2,
      qty: 25,
      pnl: 220.0,
      reason: 'QFL Base Rebound Target +4.5% reached',
      executionStatus: 'SIMULATED',
    },
  ]);

  const [emergencyHaltAll, setEmergencyHaltAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'bots' | 'my-exchanges' | 'analytics' | 'logs' | 'api-security'>('bots');
  const [strategyFilter, setStrategyFilter] = useState<'ALL' | BotStrategyType>('ALL');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'SPOT' | 'FUTURES'>('ALL');
  
  // Education Drawer / Tooltip State
  const [selectedGuideStrategy, setSelectedGuideStrategy] = useState<BotStrategyType | null>(null);

  // Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<TradingBotConfig | null>(null);

  const isDark = theme === 'dark';

  const saveBots = (newBots: TradingBotConfig[]) => {
    setBots(newBots);
    localStorage.setItem('nexus_trading_bots', JSON.stringify(newBots));
  };

  const saveCredentials = (newCreds: ExchangeApiCredential[]) => {
    setCredentials(newCreds);
    localStorage.setItem('nexus_exchange_credentials', JSON.stringify(newCreds));
  };

  const saveBotTrades = (newTrades: BotTradeRecord[]) => {
    setBotTrades(newTrades);
    localStorage.setItem('nexus_bot_trades', JSON.stringify(newTrades));
  };

  const handleOpenCreateBot = () => {
    setEditingBot(null);
    setIsConfigModalOpen(true);
  };

  const handleOpenEditBot = (bot: TradingBotConfig) => {
    setEditingBot(bot);
    setIsConfigModalOpen(true);
  };

  const handleSaveBot = (savedBot: TradingBotConfig) => {
    const existingIndex = bots.findIndex((b) => b.id === savedBot.id);
    let updated: TradingBotConfig[];
    if (existingIndex >= 0) {
      updated = [...bots];
      updated[existingIndex] = savedBot;
    } else {
      updated = [savedBot, ...bots];
    }
    saveBots(updated);

    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        botId: savedBot.id,
        timestamp: Date.now(),
        symbol: savedBot.targetSymbols[0] || currentSymbol,
        action: 'SIGNAL_ALERT',
        price: currentPrice,
        qty: 0,
        reason: `Bot "${savedBot.name}" disimpan & aktif pada ${savedBot.exchange} (${savedBot.marketType})`,
        executionStatus: 'SUCCESS',
      },
      ...prev,
    ]);
  };

  const handleDeleteBot = (id: string) => {
    const updated = bots.filter((b) => b.id !== id);
    saveBots(updated);
  };

  const handleDuplicateBot = (bot: TradingBotConfig) => {
    const duplicated: TradingBotConfig = {
      ...bot,
      id: `bot-${Date.now()}`,
      name: `${bot.name} (Copy)`,
      isActive: false,
    };
    saveBots([duplicated, ...bots]);
  };

  const handleSimulateNewTrade = () => {
    const activeBots = bots.filter((b) => b.isActive);
    const targetBot = activeBots.length > 0 ? activeBots[Math.floor(Math.random() * activeBots.length)] : bots[0];
    const isWin = Math.random() > 0.25;
    const pnlPct = isWin ? +(2.5 + Math.random() * 18).toFixed(2) : -(1.5 + Math.random() * 6).toFixed(2);
    const size = targetBot.allocatedCapitalUsd * (targetBot.riskPerTradePct / 100) * (targetBot.leverage || 1);
    const pnlUsd = +(size * (pnlPct / 100)).toFixed(2);
    const entryP = currentPrice * (1 + (Math.random() * 0.02 - 0.01));
    const exitP = isWin
      ? entryP * (1 + (pnlPct / 100) / (targetBot.leverage || 1))
      : entryP * (1 - (Math.abs(pnlPct) / 100) / (targetBot.leverage || 1));

    const newRecord: BotTradeRecord = {
      id: `btrade-${Date.now()}`,
      botId: targetBot.id,
      botName: targetBot.name,
      strategyType: targetBot.type,
      symbol: targetBot.targetSymbols[0] || currentSymbol,
      side: Math.random() > 0.4 ? 'LONG' : 'SHORT',
      marketType: targetBot.marketType,
      exchange: targetBot.exchange,
      isDemo: targetBot.mode === 'PAPER_SIMULATION',
      entryTime: Date.now() - 1000 * 60 * Math.floor(30 + Math.random() * 180),
      exitTime: Date.now(),
      entryPrice: Math.round(entryP * 100) / 100,
      exitPrice: Math.round(exitP * 100) / 100,
      qty: +(size / entryP).toFixed(4),
      sizeUsd: Math.round(size),
      leverage: targetBot.leverage,
      pnlUsd,
      pnlPct,
      status: isWin ? 'WIN' : 'LOSS',
      confluenceScore: Math.min(96, Math.max(68, Math.round(currentScore + (Math.random() * 10 - 5)))),
      durationMinutes: Math.floor(45 + Math.random() * 240),
      exitReason: isWin ? (Math.random() > 0.5 ? 'TAKE_PROFIT' : 'TRAILING_STOP') : 'STOP_LOSS',
      feeUsd: +(size * 0.0005).toFixed(2),
    };

    const updatedTrades = [newRecord, ...botTrades];
    saveBotTrades(updatedTrades);

    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        botId: targetBot.id,
        timestamp: Date.now(),
        symbol: targetBot.targetSymbols[0] || currentSymbol,
        action: isWin ? 'CLOSE_TAKE_PROFIT' : 'CLOSE_STOP_LOSS',
        price: exitP,
        qty: newRecord.qty,
        pnl: pnlUsd,
        reason: `${targetBot.name} triggered ${newRecord.exitReason} at PnL ${pnlPct}%`,
        executionStatus: targetBot.mode === 'PAPER_SIMULATION' ? 'SIMULATED' : 'SUCCESS',
      },
      ...prev,
    ]);
  };

  const handleResetTrades = () => {
    saveBotTrades(INITIAL_BOT_TRADES);
  };

  const toggleBot = (id: string) => {
    const updated = bots.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    saveBots(updated);
  };

  const toggleBotMode = (id: string) => {
    const updated = bots.map((b) => {
      if (b.id === id) {
        const nextMode = b.mode === 'EXCHANGE_API' ? 'PAPER_SIMULATION' : 'EXCHANGE_API';
        return { ...b, mode: nextMode as 'PAPER_SIMULATION' | 'EXCHANGE_API' };
      }
      return b;
    });
    saveBots(updated);
  };

  const handleHaltAll = () => {
    const updated = bots.map((b) => ({ ...b, isActive: false, emergencyKillSwitch: true }));
    saveBots(updated);
    setEmergencyHaltAll(true);
    setLogs((prev) => [
      {
        id: `halt-${Date.now()}`,
        botId: 'ALL',
        timestamp: Date.now(),
        symbol: 'SYSTEM',
        action: 'SAFETY_HALT',
        price: currentPrice,
        qty: 0,
        reason: 'Master Emergency Kill Switch Activated by User',
        executionStatus: 'SUCCESS',
      },
      ...prev,
    ]);
  };

  const handleLinkBotWithExchange = (exchange: SupportedExchange, marketType: MarketType) => {
    setActiveTab('bots');
  };

  const filteredBots = bots.filter((b) => {
    if (strategyFilter !== 'ALL' && b.type !== strategyFilter) return false;
    if (marketFilter !== 'ALL' && b.marketType !== marketFilter) return false;
    return true;
  });

  const getStrategyIcon = (type: BotStrategyType) => {
    switch (type) {
      case 'GRID_BOT':
      case 'GRID_SCALPER':
        return Grid;
      case 'QFL_BOT':
        return Zap;
      case 'DCA_BOT':
        return Layers;
      case 'BTD_BOT':
        return ArrowDownCircle;
      case 'LOOP_BOT':
        return Repeat;
      default:
        return Bot;
    }
  };

  // High-contrast clean styling
  const activeBotsCount = bots.filter((b) => b.isActive).length;
  const totalAllocatedUsd = bots.reduce((acc, b) => acc + (b.isActive ? b.allocatedCapitalUsd : 0), 0);

  return (
    <div id="page-bot-trading-hub" className="space-y-5">
      {/* ------------------------------------------------------------- */}
      {/* 1. Cockpit Header: High Contrast & Live Telemetry Summary     */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          emergencyHaltAll
            ? 'border-rose-500/80 bg-rose-950/30'
            : isDark
            ? 'bg-[#0f172a] border-slate-700/80 shadow-sm'
            : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Bot className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-white">
                  Algorithmic Bot Trading Hub &amp; Router
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  {activeBotsCount} Bot Aktif
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                  Alokasi Aktif: ${totalAllocatedUsd.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Eksekusi otomatis Spot &amp; Futures: <strong>GRID</strong>, <strong>QFL</strong>, <strong>DCA Martingale</strong>, <strong>BTD Sniper</strong>, &amp; <strong>Loop</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-open-strategy-guide"
              onClick={() => setSelectedGuideStrategy(selectedGuideStrategy ? null : 'GRID_BOT')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Buka Buku Panduan & Logika Strategi"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Panduan Strategi</span>
            </button>

            <button
              id="btn-create-new-bot-hub"
              onClick={() => handleOpenCreateBot()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Bot Baru</span>
            </button>

            <button
              id="btn-emergency-kill-switch"
              onClick={handleHaltAll}
              disabled={emergencyHaltAll}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                emergencyHaltAll
                  ? 'bg-rose-900/60 text-rose-200 border border-rose-500/40 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{emergencyHaltAll ? 'HALTED' : 'Kill-Switch'}</span>
            </button>
          </div>
        </div>

        {/* Strategy Guide Drawer (Progressive Disclosure - Clean Separation of Education & Action) */}
        {selectedGuideStrategy && (
          <div className="mt-4 pt-4 border-t border-slate-700/80">
            <div className="p-4 rounded-xl bg-[#0b101f] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Logika &amp; Matematika Strategi Bot
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {(['GRID_BOT', 'QFL_BOT', 'DCA_BOT', 'BTD_BOT', 'LOOP_BOT'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedGuideStrategy(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedGuideStrategy === type
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      {type.replace(/_BOT/g, '')}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedGuideStrategy(null)}
                    className="ml-2 px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Tutup ✕
                  </button>
                </div>
              </div>

              {selectedGuideStrategy && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1 font-mono">
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1 font-semibold">Konsep Dasar:</span>
                    <p className="text-slate-200 leading-relaxed">
                      {STRATEGY_INFO_GUIDE[selectedGuideStrategy].desc}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800">
                    <span className="text-cyan-400 block text-[11px] mb-1 font-semibold">Kondisi Pasar Terbaik:</span>
                    <p className="text-slate-200 leading-relaxed">
                      {STRATEGY_INFO_GUIDE[selectedGuideStrategy].bestFor}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800">
                    <span className="text-emerald-400 block text-[11px] mb-1 font-semibold">Formula / Trigger:</span>
                    <p className="text-slate-200 font-bold leading-relaxed">
                      {STRATEGY_INFO_GUIDE[selectedGuideStrategy].formula}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Navigation Cockpit Sub-Tabs                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3 overflow-x-auto">
        {[
          { id: 'bots', label: 'Bot Strategies Cockpit', count: bots.length, icon: Bot },
          { id: 'analytics', label: 'Analytics & PnL Ledger', count: botTrades.length, icon: BarChart3 },
          { id: 'my-exchanges', label: 'Exchanges & Demo Accounts', count: credentials.length, icon: Key },
          { id: 'logs', label: 'Execution Audit Logs', count: logs.length, icon: Terminal },
          { id: 'api-security', label: 'API Bridge & Safety', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                    isActive ? 'bg-slate-950 text-cyan-300' : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Tab 1: Active Bot Strategies Cockpit                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bots' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-300 font-bold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                Tipe Strategi:
              </span>
              {[
                { id: 'ALL', label: 'Semua Tipe' },
                { id: 'GRID_BOT', label: 'GRID' },
                { id: 'QFL_BOT', label: 'QFL' },
                { id: 'DCA_BOT', label: 'DCA' },
                { id: 'BTD_BOT', label: 'BTD' },
                { id: 'LOOP_BOT', label: 'Loop' },
              ].map((f) => (
                <button
                  key={f.id}
                  id={`filter-bot-type-${f.id.toLowerCase()}`}
                  onClick={() => setStrategyFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    strategyFilter === f.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-bold mr-1">Market:</span>
              {(['ALL', 'SPOT', 'FUTURES'] as const).map((m) => (
                <button
                  key={m}
                  id={`filter-market-${m.toLowerCase()}`}
                  onClick={() => setMarketFilter(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    marketFilter === m
                      ? m === 'SPOT'
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50 font-bold'
                        : m === 'FUTURES'
                        ? 'bg-purple-950 text-purple-200 border border-purple-500/50 font-bold'
                        : 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {m === 'ALL' ? 'Semua' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Bot Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBots.map((bot) => {
              const matchingCred = credentials.find(
                (c) => c.exchange === bot.exchange && c.marketType === bot.marketType
              );
              const isSpot = bot.marketType === 'SPOT';
              const StrategyIcon = getStrategyIcon(bot.type);

              return (
                <div
                  key={bot.id}
                  id={`bot-card-${bot.id}`}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    bot.isActive
                      ? 'border-cyan-500/60 bg-[#0f172a] shadow-lg shadow-cyan-950/20'
                      : 'border-slate-700/80 bg-[#0b101f]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold ${
                            bot.isActive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {bot.isActive ? 'RUNNING' : 'STOPPED'}
                        </span>
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                          <StrategyIcon className="w-3.5 h-3.5 text-cyan-400" />
                          {bot.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          isSpot
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                        }`}
                      >
                        {bot.exchange} ({bot.marketType})
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {bot.name}
                    </h3>

                    {/* Linked API Key */}
                    <div className="p-2.5 rounded-xl border border-slate-700 bg-[#070b14] text-xs font-mono flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate text-slate-200">
                        <Key className={`w-3.5 h-3.5 shrink-0 ${matchingCred?.isDemo ? 'text-emerald-400' : 'text-cyan-400'}`} />
                        <span className="truncate">
                          {matchingCred
                            ? `${matchingCred.isDemo ? '[DEMO] ' : '[LIVE] '}${matchingCred.name}`
                            : 'Paper Demo Sandbox'}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleBotMode(bot.id)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer shrink-0 ml-2"
                      >
                        {bot.mode === 'EXCHANGE_API' ? 'Switch Demo' : 'Switch Live'}
                      </button>
                    </div>

                    {/* Clean Structured Data Grid (Tabular Alignment & High Contrast) */}
                    <div className="space-y-2 text-xs font-mono bg-[#070b14] p-3.5 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400">Modal Alokasi:</span>
                        <span className="text-white font-bold tabular-nums text-sm">
                          ${bot.allocatedCapitalUsd.toLocaleString()}
                        </span>
                      </div>

                      {/* GRID Params */}
                      {bot.gridParams && (
                        <>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Grid Rentang:</span>
                            <span className="text-cyan-300 font-bold tabular-nums">
                              ${formatCryptoPrice(bot.gridParams.lowerPrice)} - ${formatCryptoPrice(bot.gridParams.upperPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Jaring &amp; Profit:</span>
                            <span className="text-emerald-400 font-bold tabular-nums">
                              {bot.gridParams.gridQuantity} Jaring (~{bot.gridParams.profitPerGridPct}%/grid)
                            </span>
                          </div>
                        </>
                      )}

                      {/* QFL Params */}
                      {bot.qflParams && (
                        <>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Base Pivot:</span>
                            <span className="text-amber-300 font-bold tabular-nums">${formatCryptoPrice(bot.qflParams.basePrice)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Crack / Target TP:</span>
                            <span className="text-rose-300 font-bold tabular-nums">
                              -{bot.qflParams.crackPct}% → <span className="text-emerald-400">+{bot.qflParams.reboundTargetPct}%</span>
                            </span>
                          </div>
                        </>
                      )}

                      {/* DCA Params */}
                      {bot.dcaParams && (
                        <>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Base / Safety Order:</span>
                            <span className="text-white font-bold tabular-nums">
                              ${bot.dcaParams.baseOrderSizeUsd} / ${bot.dcaParams.safetyOrderSizeUsd}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Safety Order Step:</span>
                            <span className="text-cyan-300 font-bold tabular-nums">
                              {bot.dcaParams.maxSafetyOrders} Lapisan ({bot.dcaParams.volumeMultiplier}x Multiplier)
                            </span>
                          </div>
                        </>
                      )}

                      {/* BTD Params */}
                      {bot.btdParams && (
                        <>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Flash Dip Trigger:</span>
                            <span className="text-rose-300 font-bold tabular-nums">
                              ≥ -{bot.btdParams.dipTriggerPct}% ({bot.btdParams.dipTimeframeMinutes}m)
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">RSI Max / TP:</span>
                            <span className="text-purple-300 font-bold tabular-nums">
                              RSI &lt; {bot.btdParams.rsiMaxThreshold} → +{bot.btdParams.takeProfitPct}%
                            </span>
                          </div>
                        </>
                      )}

                      {/* Loop Params */}
                      {bot.loopParams && (
                        <>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Profit per Siklus:</span>
                            <span className="text-emerald-400 font-bold tabular-nums">+{bot.loopParams.profitPerCyclePct}%</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">Compounding:</span>
                            <span className="text-blue-300 font-bold tabular-nums">
                              {bot.loopParams.autoCompoundPct}% (Siklus #{bot.loopParams.completedCycles})
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-slate-700/80">
                        <span className="text-slate-400">Target &amp; Leverage:</span>
                        <span className={isSpot ? 'text-cyan-300 font-bold' : 'text-purple-300 font-bold'}>
                          {bot.marketType} ({bot.leverage}x) • {bot.targetSymbols.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-3 mt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        id={`btn-edit-bot-${bot.id}`}
                        onClick={() => handleOpenEditBot(bot)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit Parameter</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateBot(bot)}
                        title="Duplikasi Strategi"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteBot(bot.id)}
                        title="Hapus Bot"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      id={`btn-toggle-bot-${bot.id}`}
                      onClick={() => toggleBot(bot.id)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        bot.isActive
                          ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/40'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                      }`}
                    >
                      {bot.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {bot.isActive ? 'Pause Strategi' : 'Start & Jalankan Bot'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Tab 2: Bot Analytics & Quantitative PnL Performance           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'analytics' && (
        <BotAnalyticsView
          trades={botTrades}
          bots={bots}
          theme={theme}
          onSimulateNewTrade={handleSimulateNewTrade}
          onResetTrades={handleResetTrades}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* Tab 3: My Exchanges (Pengaturan API Key SPOT & FUTURES)       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'my-exchanges' && (
        <MyExchangesSettings
          credentials={credentials}
          onSaveCredentials={saveCredentials}
          onLinkBotWithExchange={handleLinkBotWithExchange}
          theme={theme}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* Tab 4: Execution Telemetry Logs                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Execution &amp; Trigger Audit Log</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{logs.length} Total Events</span>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-700 bg-[#0f172a] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      log.action.includes('BUY')
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : log.action.includes('SELL') || log.action.includes('STOP')
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {log.action}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{log.symbol}</span>
                      <span className="text-slate-300">@{formatCryptoPrice(log.price)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{log.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {log.pnl !== undefined && (
                    <span
                      className={`font-bold tabular-nums text-sm ${
                        log.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {log.pnl >= 0 ? `+$${log.pnl}` : `-$${Math.abs(log.pnl)}`}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Tab 5: Exchange API Bridge & Security Protocols               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'api-security' && (
        <div className="p-6 rounded-2xl border border-slate-700 bg-[#0f172a] space-y-5 text-slate-200 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Arsitektur Keamanan &amp; Protokol Eksekusi API</h3>
              <p className="text-slate-300 text-xs mt-0.5">Standar isolasi kredensial dan validasi parameter order.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-700 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Zero-Withdrawal Enforcement
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Kunci API yang terhubung hanya meminta hak akses 'Read &amp; Trade (SPOT &amp; FUTURES)'. Akses penarikan aset (Withdraw) diblokir secara mutlak pada tingkat protokol client &amp; server.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-700 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Dual-Layer Stop Loss Circuit Breakers
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Setiap bot dilengkapi dengan hard stop-loss berbasis persentase pada level pesanan individu serta Master Emergency Kill-Switch yang memutus semua order aktif dalam 1 klik jika kerugian portofolio harian tercapai.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Bot Strategy Config Modal                                     */}
      {/* ------------------------------------------------------------- */}
      <BotStrategyConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaveBot={handleSaveBot}
        initialBot={editingBot}
        currentSymbol={currentSymbol}
        currentPrice={currentPrice}
        theme={theme}
      />
    </div>
  );
};
