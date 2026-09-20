import React, { useState, useMemo } from 'react';
import {
  CandlestickChart,
  Search,
  Flame,
  Newspaper,
  Layers,
  Gauge,
  FlaskConical,
  FileText,
  ShieldCheck,
  Bot,
  BookOpen,
  Wallet,
  Star,
  BarChart3,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Zap,
  Compass,
  TrendingUp,
  TrendingDown,
  Radio,
  X,
  Sparkles,
  RotateCcw,
  Globe,
  Database,
  Calendar,
  Network,
  Calculator,
  BellRing,
  Clock,
  PieChart,
  Settings as SettingsIcon,
} from 'lucide-react';
import { StageId, MarketBias } from '../types/market.types';
import { Language } from '../i18n/translations';

interface SidebarProps {
  currentStage: StageId;
  onSelectStage: (stage: StageId) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  lang: Language;
  theme: 'light' | 'dark';
  confluenceScore?: number;
  marketBias?: MarketBias | string;
  wsStatus?: 'connected' | 'connecting' | 'disconnected' | 'error' | 'fallback';
  latencyMs?: number;
}

type CategoryKey =
  | 'all'
  | 'macro'
  | 'market'
  | 'technical'
  | 'research'
  | 'execution'
  | 'connection'
  | 'evaluation'
  | 'system';

interface NavItem {
  id: StageId;
  stepNumber: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  category: CategoryKey;
}

interface NavGroup {
  key: CategoryKey;
  groupName: string;
  icon: React.ElementType;
  isSystemDivider?: boolean;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentStage,
  onSelectStage,
  isOpen,
  onToggleOpen,
  lang,
  theme,
  confluenceScore,
  marketBias,
  wsStatus = 'connected',
  latencyMs = 28,
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Functional Efficiency States: Search & Category Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  const navGroups: NavGroup[] = useMemo(
    () => [
      // 1. 🌐 DATA MAKRO & KONTEKS (Buka Sesi)
      {
        key: 'macro',
        groupName: isId ? '🌐 1. DATA MAKRO & KONTEKS' : '🌐 1. MACRO & CONTEXT DATA',
        icon: Globe,
        items: [
          {
            id: 'btc_dominance',
            stepNumber: '01',
            label: isId ? 'Dominasi BTC/Altcoin' : 'BTC/Altcoin Dominance',
            icon: PieChart,
            category: 'macro',
          },
          {
            id: 'onchain_data',
            stepNumber: '02',
            label: isId ? 'Data On-Chain' : 'On-Chain Data',
            icon: Database,
            category: 'macro',
          },
          {
            id: 'economic_calendar',
            stepNumber: '03',
            label: isId ? 'Kalender Ekonomi & Crypto' : 'Economic & Crypto Calendar',
            icon: Calendar,
            category: 'macro',
          },
          {
            id: 'sentiment',
            stepNumber: '04',
            label: isId ? 'Berita & Sentimen' : 'News & Sentiment',
            icon: Newspaper,
            badge: 'Alert',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            category: 'macro',
          },
        ],
      },

      // 2. 📊 PASAR & SCREENING (Cari Peluang)
      {
        key: 'market',
        groupName: isId ? '📊 2. PASAR & SCREENING' : '📊 2. MARKET & SCREENING',
        icon: Compass,
        items: [
          {
            id: 'market_heatmap',
            stepNumber: '05',
            label: isId ? 'Heatmap Pasar' : 'Market Heatmap',
            icon: Flame,
            category: 'market',
          },
          {
            id: 'gainers_losers',
            stepNumber: '06',
            label: isId ? 'Top Gainers & Losers' : 'Top Gainers & Losers',
            icon: TrendingUp,
            category: 'market',
          },
          {
            id: 'screening',
            stepNumber: '07',
            label: isId ? 'Penyaring Koin' : 'Coin Screener',
            icon: BarChart3,
            badge: 'Filter',
            badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
            category: 'market',
          },
          {
            id: 'watchlist',
            stepNumber: '08',
            label: isId ? 'Watchlist' : 'Watchlist',
            icon: Star,
            category: 'market',
          },
          {
            id: 'signal',
            stepNumber: '09',
            label: isId ? 'Sinyal Trading' : 'Trading Signals',
            icon: Radio,
            badge: 'LIVE',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            category: 'market',
          },
        ],
      },

      // 3. 🔍 INDIKATOR & SCREENING TEKNIKAL (Validasi Sinyal)
      {
        key: 'technical',
        groupName: isId ? '🔍 3. INDIKATOR & TEKNIKAL' : '🔍 3. INDICATORS & TECHNICAL',
        icon: Layers,
        items: [
          {
            id: 'ticker',
            stepNumber: '10',
            label: isId ? 'Grafik Utama' : 'Main Chart',
            icon: CandlestickChart,
            category: 'technical',
          },
          {
            id: 'indicators',
            stepNumber: '11',
            label: isId ? '12 Indikator' : '12 Indicators',
            icon: Layers,
            category: 'technical',
          },
          {
            id: 'confluence',
            stepNumber: '12',
            label: isId ? 'Skor Konfluensi' : 'Confluence Score',
            icon: Gauge,
            badge: confluenceScore !== undefined ? `${confluenceScore}/100` : undefined,
            badgeColor:
              confluenceScore && confluenceScore >= 70
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : confluenceScore && confluenceScore <= 40
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-pink-500/15 text-pink-300 border-pink-500/30',
            category: 'technical',
          },
          {
            id: 'mtf_screener',
            stepNumber: '13',
            label: isId ? 'Screener Multi-Timeframe' : 'Multi-Timeframe Screener',
            icon: Layers,
            category: 'technical',
          },
          {
            id: 'orderflow',
            stepNumber: '14',
            label: isId ? 'Order Flow & Likuiditas' : 'Order Flow & Liquidity',
            icon: Flame,
            category: 'technical',
          },
          {
            id: 'volatility_scanner',
            stepNumber: '15',
            label: isId ? 'Volatility Scanner' : 'Volatility Scanner',
            icon: Activity,
            category: 'technical',
          },
          {
            id: 'correlation_beta',
            stepNumber: '16',
            label: isId ? 'Correlation & Beta Analyzer' : 'Correlation & Beta Analyzer',
            icon: Network,
            category: 'technical',
          },
        ],
      },

      // 4. 🧪 RISET & STRATEGI (Hitung Risiko)
      {
        key: 'research',
        groupName: isId ? '🧪 4. RISET & STRATEGI' : '🧪 4. RESEARCH & STRATEGY',
        icon: FlaskConical,
        items: [
          {
            id: 'risk',
            stepNumber: '17',
            label: isId ? 'Kalkulator Risiko' : 'Risk Calculator',
            icon: ShieldCheck,
            category: 'research',
          },
          {
            id: 'backtest',
            stepNumber: '18',
            label: isId ? 'Backtest Lab' : 'Backtest Lab',
            icon: FlaskConical,
            category: 'research',
          },
          {
            id: 'return_distribution',
            stepNumber: '19',
            label: isId ? 'Statistik & Distribusi Return' : 'Return Stats & Distribution',
            icon: BarChart3,
            category: 'research',
          },
          {
            id: 'output',
            stepNumber: '20',
            label: isId ? 'Laporan AI' : 'AI Report',
            icon: FileText,
            badge: 'AI',
            badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
            category: 'research',
          },
        ],
      },

      // 5. ⚡ EKSEKUSI AKTIF (Eksekusi)
      {
        key: 'execution',
        groupName: isId ? '⚡ 5. EKSEKUSI AKTIF' : '⚡ 5. ACTIVE EXECUTION',
        icon: Zap,
        items: [
          {
            id: 'manual_trading',
            stepNumber: '21',
            label: isId ? 'Trading Manual' : 'Manual Trading',
            icon: Zap,
            badge: 'Live',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            category: 'execution',
          },
          {
            id: 'bot',
            stepNumber: '22',
            label: isId ? 'Trading Bot' : 'Trading Bot',
            icon: Bot,
            category: 'execution',
          },
          {
            id: 'position_sizing',
            stepNumber: '23',
            label: isId ? 'Position Sizing Otomatis' : 'Automated Position Sizing',
            icon: Calculator,
            category: 'execution',
          },
          {
            id: 'active_orders',
            stepNumber: '24',
            label: isId ? 'Manajemen Order Aktif' : 'Active Orders Management',
            icon: Clock,
            category: 'execution',
          },
        ],
      },

      // 6. 🔧 KONEKSI & ALERT (Pantau)
      {
        key: 'connection',
        groupName: isId ? '🔧 6. KONEKSI & ALERT' : '🔧 6. CONNECTIONS & ALERTS',
        icon: BellRing,
        items: [
          {
            id: 'alerts',
            stepNumber: '25',
            label: isId ? 'Alert & Notifikasi Builder' : 'Alert & Notification Builder',
            icon: BellRing,
            category: 'connection',
          },
          {
            id: 'portfolio',
            stepNumber: '26',
            label: isId ? 'Portofolio' : 'Portfolio',
            icon: Wallet,
            category: 'connection',
          },
          {
            id: 'multi_exchange',
            stepNumber: '27',
            label: isId ? 'Multi-Exchange Manager' : 'Multi-Exchange Manager',
            icon: Layers,
            category: 'connection',
          },
        ],
      },

      // 7. 📈 EVALUASI & RIWAYAT (Evaluasi)
      {
        key: 'evaluation',
        groupName: isId ? '📈 7. EVALUASI & RIWAYAT' : '📈 7. EVALUATION & HISTORY',
        icon: BookOpen,
        items: [
          {
            id: 'journal',
            stepNumber: '28',
            label: isId ? 'Jurnal Trading' : 'Trading Journal',
            icon: BookOpen,
            category: 'evaluation',
          },
          {
            id: 'reports',
            stepNumber: '29',
            label: isId ? 'Laporan Kinerja' : 'Performance Reports',
            icon: FileText,
            badge: 'CSV',
            badgeColor: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
            category: 'evaluation',
          },
        ],
      },

      // 8. ⚙️ SISTEM (Divided)
      {
        key: 'system',
        groupName: isId ? '⚙️ SISTEM' : '⚙️ SYSTEM',
        icon: SettingsIcon,
        isSystemDivider: true,
        items: [
          {
            id: 'settings',
            stepNumber: '30',
            label: isId ? 'Pengaturan' : 'Settings',
            icon: Sliders,
            category: 'system',
          },
        ],
      },
    ],
    [isId, confluenceScore]
  );

  // Filter groups and items based on search query and category tab
  const filteredNavGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return navGroups
      .filter((group) => activeCategory === 'all' || group.key === activeCategory)
      .map((group) => {
        if (!query) return group;
        const matchingItems = group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.stepNumber.includes(query) ||
            item.id.toLowerCase().includes(query) ||
            (item.badge && item.badge.toLowerCase().includes(query))
        );
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, searchQuery, activeCategory]);

  const totalFilteredCount = useMemo(
    () => filteredNavGroups.reduce((acc, g) => acc + g.items.length, 0),
    [filteredNavGroups]
  );

  // Efficient stage selection: Auto-close drawer on mobile screens (<768px)
  const handleItemClick = (stageId: StageId) => {
    onSelectStage(stageId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  return (
    <>
      {/* 1. Mobile Backdrop Overlay (Only visible on small screens when drawer is open) */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          onClick={onToggleOpen}
          aria-label={isId ? 'Tutup Sidebar' : 'Close Sidebar'}
        />
      )}

      {/* 2. Sidebar Container */}
      <aside
        id="terminal-sidebar"
        role="navigation"
        aria-label="Terminal Navigation"
        className={`shrink-0 flex flex-col select-none transition-all duration-200 ease-in-out ${
          /* Mobile styling */
          isOpen
            ? 'fixed inset-y-0 left-0 z-50 w-72 sm:w-80 shadow-2xl md:shadow-none'
            : 'hidden md:flex'
        } ${
          /* Desktop styling */
          isOpen ? 'md:relative md:inset-auto md:z-30 md:w-64 lg:md:w-72' : 'md:relative md:inset-auto md:z-30 md:w-14 lg:md:w-16'
        } ${
          isDark
            ? 'bg-[#090d16] border-r border-[#1e293b] text-slate-300'
            : 'bg-white border-r border-slate-200 text-slate-700'
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex items-center justify-between border-b shrink-0 transition-colors ${
            isOpen ? 'px-3 py-3' : 'py-2.5 px-1 justify-center'
          } ${
            isDark ? 'border-[#1e293b]/80 bg-[#070b14]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          {isOpen ? (
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs font-bold tracking-tight truncate ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {isId ? 'Navigasi Terminal AKIRAQU' : 'AKIRAQU Terminal Nav'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">30 {isId ? 'Modul Kuantitatif' : 'Quant Modules'}</span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-center shrink-0">
            {/* Mobile Close Button */}
            {isOpen && (
              <button
                type="button"
                onClick={onToggleOpen}
                className={`md:hidden p-1.5 rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title={isId ? 'Tutup Sidebar' : 'Close Drawer'}
                aria-label="Close Mobile Sidebar"
              >
                <X className="w-4 h-4 text-pink-400" />
              </button>
            )}

            {/* Desktop Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={onToggleOpen}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={
                isOpen
                  ? (isId ? 'Sembunyikan Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)')
                  : (isId ? 'Buka Sidebar (Ctrl+B)' : 'Expand Sidebar (Ctrl+B)')
              }
              aria-label="Toggle Desktop Sidebar"
            >
              {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Controls: Search & Category Tabs */}
        {isOpen && (
          <div
            className={`p-2.5 space-y-2 border-b shrink-0 ${
              isDark ? 'border-[#1e293b]/60 bg-[#090d16]' : 'border-slate-100 bg-white'
            }`}
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isId ? 'Cari modul (30 fitur)...' : 'Search 30 modules...'}
                className={`w-full pl-8 pr-7 py-1.5 rounded-lg text-xs font-mono transition-all outline-hidden border ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-white placeholder-slate-500 focus:border-pink-500/50'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-pink-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Clear"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Pills (Ordered by Workflow) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-mono font-semibold">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'all'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isId ? 'Semua' : 'All'} (30)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('macro')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'macro'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                1. {isId ? 'Makro' : 'Macro'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('market')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'market'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                2. {isId ? 'Pasar' : 'Market'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('technical')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'technical'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                3. {isId ? 'Teknikal' : 'Technical'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('research')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'research'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                4. {isId ? 'Riset' : 'Research'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('execution')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'execution'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                5. {isId ? 'Eksekusi' : 'Execution'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('connection')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'connection'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                6. {isId ? 'Koneksi' : 'Connect'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('evaluation')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'evaluation'
                    ? isDark
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                7. {isId ? 'Evaluasi' : 'Evaluate'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
          {totalFilteredCount === 0 ? (
            <div className="py-8 px-3 text-center space-y-2">
              <p className="text-xs text-slate-400">
                {isId ? 'Tidak ada modul yang cocok.' : 'No matching tools found.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-pink-600 hover:bg-pink-500 text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isId ? 'Reset Filter' : 'Reset Filter'}</span>
              </button>
            </div>
          ) : (
            filteredNavGroups.map((group) => {
              return (
                <div key={group.key} className="space-y-1">
                  {group.isSystemDivider && (
                    <div className="my-2 border-t border-slate-800/80" />
                  )}

                  {isOpen && (
                    <div className="px-2.5 py-1 text-[11px] font-mono font-bold text-slate-400 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="uppercase tracking-wider truncate font-semibold text-slate-300">
                          {group.groupName}
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/60 text-slate-400 font-mono">
                        {group.items.length}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = currentStage === item.id;

                      // Collapsed Rail Mode
                      if (!isOpen) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemClick(item.id)}
                            className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                              isActive
                                ? isDark
                                  ? 'bg-pink-500/15 text-[#EC4899] shadow-xs'
                                  : 'bg-pink-100/90 text-pink-700 shadow-xs'
                                : isDark
                                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title={`${item.stepNumber}. ${item.label}`}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <ItemIcon
                              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                                isActive ? 'text-[#EC4899]' : ''
                              }`}
                            />
                          </button>
                        );
                      }

                      // Expanded Sidebar Mode
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer group min-h-[34px] ${
                            isActive
                              ? isDark
                                ? 'bg-pink-500/15 text-pink-100 font-semibold shadow-xs'
                                : 'bg-pink-50 text-pink-950 font-semibold shadow-xs'
                              : isDark
                              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <div
                            className={`shrink-0 p-1 rounded-md transition-colors ${
                              isActive
                                ? isDark
                                  ? 'text-[#EC4899]'
                                  : 'text-pink-600'
                                : isDark
                                ? 'text-slate-400 group-hover:text-slate-200'
                                : 'text-slate-500 group-hover:text-slate-800'
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate text-left">{item.label}</span>

                            {item.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold shrink-0 ml-1.5 ${item.badgeColor}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div
          className={`p-2.5 border-t shrink-0 ${
            isDark ? 'border-[#1e293b]/80 bg-[#070b14]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          {isOpen ? (
            <div className="space-y-2">
              {marketBias && (
                <div
                  className={`p-2 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
                    marketBias === 'BULLISH'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : marketBias === 'BEARISH'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {marketBias === 'BULLISH' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold truncate">Bias: {marketBias}</span>
                  </div>
                  {confluenceScore !== undefined && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-black/40 text-slate-200 shrink-0">
                      {confluenceScore}%
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="capitalize">{wsStatus}</span>
                </div>
                <span className="font-mono text-pink-400 font-bold">{latencyMs}ms</span>
              </div>

              {/* Quick Jump to Chart button if user is on other stages */}
              {currentStage !== 'ticker' && (
                <button
                  type="button"
                  onClick={() => handleItemClick('ticker')}
                  className={`w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-pink-300 hover:border-pink-500/40'
                      : 'bg-white border-slate-200 text-pink-700 hover:border-pink-400'
                  }`}
                >
                  <CandlestickChart className="w-3.5 h-3.5" />
                  <span>{isId ? 'Ke Grafik Utama' : 'Go to Main Chart'}</span>
                </button>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-1.5 cursor-pointer transition-colors hover:bg-slate-800/30 rounded-lg"
              title={`Live Feed: ${wsStatus} (${latencyMs}ms) - Klik untuk membuka sidebar`}
              onClick={onToggleOpen}
            >
              <span className="text-[10px] font-mono text-slate-400 font-bold tracking-tighter">
                {latencyMs}ms
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
