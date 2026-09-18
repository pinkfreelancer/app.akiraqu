import React, { useState, useEffect } from 'react';
import {
  SupportedExchange,
  MarketType,
  TradingHubTab,
  StageId,
} from '../types/crypto.types';
import {
  Zap,
  Bot,
  BookOpen,
  Wallet,
  FileText,
  Sliders,
  BarChart3,
  Flame,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { ManualTradingView } from '../components/trading/ManualTradingView';
import { PortfolioView } from '../components/trading/PortfolioView';
import { ReportsView } from '../components/trading/ReportsView';
import { BotTradingHubPage } from './BotTradingHubPage';
import { TradingJournalPage } from './TradingJournalPage';

interface TradingHubPageProps {
  currentSymbol: string;
  currentPrice: number;
  currentScore?: number;
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  initialTab?: TradingHubTab;
  currentStage?: StageId;
  onSelectStage?: (stage: StageId) => void;
  onSelectSymbol?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: Language;
}

export const TradingHubPage: React.FC<TradingHubPageProps> = ({
  currentSymbol,
  currentPrice,
  currentScore = 78,
  selectedExchange,
  selectedMarketType,
  initialTab = 'manual',
  currentStage,
  onSelectStage,
  onSelectSymbol,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Map stage to tab if passed
  const getTabFromStage = (stage?: StageId): TradingHubTab => {
    if (stage === 'manual_trading') return 'manual';
    if (stage === 'bot') return 'bot';
    if (stage === 'journal') return 'journal';
    if (stage === 'portfolio') return 'portfolio';
    if (stage === 'reports') return 'report';
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState<TradingHubTab>(() => getTabFromStage(currentStage));

  // Sync if currentStage changes externally
  useEffect(() => {
    if (currentStage) {
      setActiveTab(getTabFromStage(currentStage));
    }
  }, [currentStage]);

  const handleTabChange = (tab: TradingHubTab) => {
    setActiveTab(tab);
    if (onSelectStage) {
      if (tab === 'manual') onSelectStage('manual_trading');
      else if (tab === 'bot') onSelectStage('bot');
      else if (tab === 'journal') onSelectStage('journal');
      else if (tab === 'portfolio') onSelectStage('portfolio');
      else if (tab === 'report') onSelectStage('reports');
    }
  };

  const tabs: { id: TradingHubTab; label: string; icon: any; badge?: string; desc: string }[] = [
    {
      id: 'manual',
      label: isId ? 'Trading Manual' : 'Manual Trading',
      icon: Zap,
      badge: 'Live',
      desc: isId ? 'Eksekusi order langsung, leverage, TP/SL, dan posisi terbuka' : 'Direct order placement, leverage & live positions',
    },
    {
      id: 'bot',
      label: isId ? 'Trading Bot' : 'Trading Bot',
      icon: Bot,
      badge: 'AI Grid/DCA',
      desc: isId ? 'Bot otomatis Grid, DCA, Breakout, dan sinyal konfluensi' : 'Automated grid, DCA & AI signal bots',
    },
    {
      id: 'journal',
      label: isId ? 'Trading Journal' : 'Trading Journal',
      icon: BookOpen,
      desc: isId ? 'Pencatatan evaluasi, psikologi trade, win rate, dan audit mistake' : 'Trade logger, psychology & win-rate metrics',
    },
    {
      id: 'portfolio',
      label: isId ? 'Portofolio' : 'Portfolio',
      icon: Wallet,
      desc: isId ? 'Total aset, alokasi koin, saldo multi-exchange, dan equity curve' : 'Total net worth, asset allocation & multi-exchange balances',
    },
    {
      id: 'report',
      label: isId ? 'Laporan' : 'Reports',
      icon: FileText,
      badge: 'CSV',
      desc: isId ? 'Laporan performa, heatmap bulanan, audit fee, dan ekspor data' : 'Performance audit, heatmap calendar & statement exports',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Trading Suite Navigation Bar */}
      <div
        className={`p-2 sm:p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
                title={tab.desc}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold hidden md:inline-block ${
                      isActive ? 'bg-black/30 text-slate-950' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Pair & Mode Pill in Right Header */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-400 px-3 py-1.5 rounded-xl bg-[#090d16] border border-slate-800">
          <span>Active Asset: <strong className="text-white">{currentSymbol}</strong></span>
          <span>•</span>
          <span>Exchange: <strong className="text-cyan-400">{selectedExchange}</strong></span>
        </div>
      </div>

      {/* Render Active Trading Tab View */}
      {activeTab === 'manual' && (
        <ManualTradingView
          currentSymbol={currentSymbol}
          currentPrice={currentPrice}
          currentScore={currentScore}
          selectedExchange={selectedExchange}
          selectedMarketType={selectedMarketType}
          theme={theme}
          lang={lang}
        />
      )}

      {activeTab === 'bot' && (
        <BotTradingHubPage
          currentSymbol={currentSymbol}
          currentPrice={currentPrice}
          currentScore={currentScore}
          selectedExchange={selectedExchange}
          selectedMarketType={selectedMarketType}
          theme={theme}
        />
      )}

      {activeTab === 'journal' && (
        <TradingJournalPage
          currentSymbol={currentSymbol}
          currentPrice={currentPrice}
          currentScore={currentScore}
          selectedExchange={selectedExchange}
          theme={theme}
        />
      )}

      {activeTab === 'portfolio' && (
        <PortfolioView
          onSelectSymbol={onSelectSymbol}
          onNavigateToTrade={() => handleTabChange('manual')}
          theme={theme}
          lang={lang}
        />
      )}

      {activeTab === 'report' && (
        <ReportsView
          theme={theme}
          lang={lang}
        />
      )}
    </div>
  );
};
