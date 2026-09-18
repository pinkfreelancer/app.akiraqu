import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  RefreshCw,
  Search,
  ChevronDown,
  Radio,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Maximize,
  Minimize,
  StretchHorizontal,
  LayoutGrid,
  Layers,
  Command,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  Home,
  Newspaper,
  Bell,
  BellRing,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  CandlestickChart,
  Bot,
  BookOpen,
  FlaskConical,
  Gauge,
  Flame,
  FileText,
  Compass,
  Activity,
  Zap,
  Sliders,
} from 'lucide-react';
import { CryptoSymbolInfo, Timeframe, WebSocketSyncMetrics, StageId } from '../types/crypto.types';
import { Language, getTranslation } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';
import { SearchCoinModal } from './SearchCoinModal';
import { AkiraQuLogo } from './AkiraQuLogo';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  symbols: CryptoSymbolInfo[];
  selectedSymbol: string;
  selectedTimeframe: Timeframe;
  onSelectSymbol: (symbol: string) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
  onTriggerAnalyze: () => void;
  isLoading: boolean;
  hasEvaluation?: boolean;
  onOpenExportModal: () => void;
  onOpenAssuranceModal: () => void;
  onOpenBacktest?: () => void;
  onNavigateToLanding?: () => void;
  onNavigateToLogin?: () => void;
  healthStatus: { uptime: number; latency: number; ok: boolean };
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  syncMetrics?: WebSocketSyncMetrics;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isFullWidth?: boolean;
  onToggleFullWidth?: () => void;
  workspaceMode?: 'classic' | 'launchpad';
  onToggleWorkspaceMode?: () => void;
  onOpenCommandBar?: () => void;
  onOpenShortcuts?: () => void;
  currentStage?: StageId;
  onSelectStage?: (stage: StageId) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const formatPrice = (p: number) => {
  return formatCryptoPrice(p);
};

export const Header: React.FC<HeaderProps> = ({
  symbols,
  selectedSymbol,
  selectedTimeframe,
  onSelectSymbol,
  onSelectTimeframe,
  onTriggerAnalyze,
  isLoading,
  hasEvaluation = true,
  onOpenExportModal,
  onOpenAssuranceModal,
  onOpenBacktest,
  onNavigateToLanding,
  onNavigateToLogin,
  healthStatus,
  livePrice,
  priceDirection = 'neutral',
  wsStatus = 'connected',
  syncMetrics,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  isFullscreen = false,
  onToggleFullscreen,
  isFullWidth = true,
  onToggleFullWidth,
  workspaceMode = 'classic',
  onToggleWorkspaceMode,
  onOpenCommandBar,
  onOpenShortcuts,
  currentStage = 'ticker',
  onSelectStage,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  const { user, isAuthenticated } = useAuth();
  const t = getTranslation(lang);
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pageMenuRef = useRef<HTMLDivElement>(null);

  const currentCoin = symbols.find((s) => s.symbol === selectedSymbol);
  const displayPrice = livePrice && livePrice > 0 ? livePrice : currentCoin?.basePrice || 0;
  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

  // Global keyboard shortcut to open pair search (/ or Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (pageMenuRef.current && !pageMenuRef.current.contains(e.target as Node)) {
        setIsPageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stagesList = [
    {
      group: isId ? 'Pasar & Berita' : 'Market & News',
      icon: Compass,
      items: [
        { id: 'ticker' as StageId, num: '01', name: isId ? 'Grafik Utama' : 'Main Chart', icon: CandlestickChart },
        { id: 'scanner' as StageId, num: '02', name: isId ? 'Screener Pasar' : 'Market Screener', icon: Search },
        { id: 'orderflow' as StageId, num: '03', name: isId ? 'Order Flow & Liq' : 'Order Flow & Liq', icon: Flame },
        { id: 'sentiment' as StageId, num: '04', name: isId ? 'News (Berita & Sentimen)' : 'News & Sentiment', icon: Newspaper, highlight: true },
      ],
    },
    {
      group: isId ? 'Analisis Kuantitatif' : 'Quantitative Analysis',
      icon: Activity,
      items: [
        { id: 'indicators' as StageId, num: '05', name: isId ? '12 Indikator' : '12 Indicators', icon: Layers },
        { id: 'confluence' as StageId, num: '06', name: isId ? 'Skor Konfluensi' : 'Confluence Score', icon: Gauge },
        { id: 'backtest' as StageId, num: '07', name: isId ? 'Backtest Lab' : 'Backtest Lab', icon: FlaskConical },
        { id: 'output' as StageId, num: '08', name: isId ? 'Laporan Sinyal & Analisis' : 'Signal Report', icon: FileText, highlight: true },
      ],
    },
    {
      group: isId ? 'Eksekusi & Bot' : 'Execution & Bots',
      icon: Zap,
      items: [
        { id: 'risk' as StageId, num: '09', name: isId ? 'Manajemen Risiko' : 'Risk Management', icon: ShieldCheck },
        { id: 'bot' as StageId, num: '10', name: isId ? 'Trading Bot' : 'Trading Bots', icon: Bot },
        { id: 'journal' as StageId, num: '11', name: isId ? 'Jurnal Trading' : 'Trading Journal', icon: BookOpen },
        { id: 'settings' as StageId, num: '12', name: isId ? 'Pengaturan & Sistem' : 'Settings & Security', icon: Sliders },
      ],
    },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors duration-200 ${
        isDark ? 'border-[#1e293b] bg-[#090d16]/95' : 'border-slate-200 bg-white/95'
      } backdrop-blur-md`}
    >
      {/* Top Bar: Brand Logo, Page Navigator, Auth & Settings */}
      <div
        className={`flex items-center justify-between px-3 sm:px-4 lg:px-8 py-1.5 text-xs border-b transition-colors duration-200 ${
          isDark ? 'border-[#1e293b]/50 bg-[#0b0f19] text-slate-400' : 'border-slate-200/60 bg-slate-50 text-slate-600'
        }`}
      >
        {/* Brand Logo & Brand Tagline */}
        <div className="flex items-center gap-3">
          <div
            onClick={onNavigateToLanding}
            className="flex items-center gap-2 cursor-pointer group select-none"
            title={isId ? 'AKIRA.QU - Beranda' : 'AKIRA.QU - Home'}
          >
            <AkiraQuLogo size={26} className="shadow-xs rounded-lg shrink-0 group-hover:scale-105 transition-transform" />
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs sm:text-sm font-black tracking-tight font-display leading-tight flex items-center ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                AKIRA<span className="text-cyan-400">.QU</span>
              </span>
              <span className="hidden md:inline text-[10px] text-slate-400">| {t.header.brandSubtitle}</span>
            </div>
          </div>

          {/* Quick Page Menu Dropdown in Top Bar */}
          {onSelectStage && (
            <div className="relative hidden sm:block" ref={pageMenuRef}>
              <button
                onClick={() => setIsPageMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isPageMenuOpen
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                    : isDark
                    ? 'bg-[#0f172a] hover:bg-slate-800 border-[#1e293b] text-slate-300'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isId ? 'Menu Halaman' : 'Pages'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Page Navigator Grid Dropdown */}
              {isPageMenuOpen && (
                <div
                  className={`absolute left-0 mt-2 w-[420px] rounded-2xl border p-4 shadow-2xl z-50 transition-all ${
                    isDark
                      ? 'bg-[#0f172a] border-[#1e293b] text-white shadow-black/80'
                      : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/30 font-mono">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      {isId ? 'Navigasi Cepat Modul Terminal' : 'Quick Terminal Navigation'}
                    </span>
                    <span className="text-[10px] text-slate-400">11 Halaman</span>
                  </div>

                  <div className="space-y-3">
                    {stagesList.map((grp, gIdx) => {
                      const GrpIcon = grp.icon;
                      return (
                        <div key={gIdx} className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1 uppercase">
                            <GrpIcon className="w-3 h-3 text-amber-400" />
                            {grp.group}
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {grp.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isCur = currentStage === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    onSelectStage(item.id);
                                    setIsPageMenuOpen(false);
                                  }}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-mono transition-all cursor-pointer border ${
                                    isCur
                                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-xs'
                                      : item.highlight
                                      ? isDark
                                        ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40'
                                        : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100'
                                      : isDark
                                      ? 'bg-[#070b14] border-[#1e293b] text-slate-300 hover:bg-slate-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="text-[10px] opacity-70">{item.num}</span>
                                  <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{item.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Top Bar Controls: Landing, Auth, Settings, Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Landing Page Quick Navigation */}
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100'
              }`}
              title={isId ? 'Kembali ke Halaman Landing' : 'Go to Landing Page'}
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{isId ? 'Beranda' : 'Landing'}</span>
            </button>
          )}

          {/* User Gmail Auth Button */}
          {onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer border ${
                isAuthenticated && user
                  ? isDark
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title={isAuthenticated && user ? `Akun: ${user.displayName || user.email}` : 'Masuk dengan Akun Google (Gmail)'}
            >
              {isAuthenticated && user ? (
                user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'U'}
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] flex items-center justify-center font-bold">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )
              ) : (
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="hidden sm:inline max-w-[90px] truncate">
                {isAuthenticated && user ? user.displayName?.split(' ')[0] : 'Gmail'}
              </span>
            </button>
          )}

          <span className={`hidden sm:inline ${isDark ? 'text-[#1e293b]' : 'text-slate-200'}`}>|</span>

          {/* Combined Settings Dropdown (Theme, Language, Fullscreen) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-500/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">{isId ? 'Pengaturan' : 'Settings'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu Overlay */}
            {isSettingsOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-xl border p-4 shadow-xl z-50 transition-all ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-white shadow-black/50'
                    : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
                }`}
              >
                <div className="space-y-4">
                  {/* Theme Section */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      {isId ? 'Tema Tampilan' : 'Display Theme'}
                    </span>
                    <div
                      className={`flex p-0.5 rounded-lg border ${
                        isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => theme !== 'light' && onToggleTheme()}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          !isDark ? 'bg-white text-cyan-600 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => isDark !== true && onToggleTheme()}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          isDark ? 'bg-cyan-500/25 text-cyan-300 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* Layout Width Section */}
                  {onToggleFullWidth && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                        {t.header.layoutMode}
                      </span>
                      <div
                        className={`flex p-0.5 rounded-lg border ${
                          isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => !isFullWidth && onToggleFullWidth()}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            isFullWidth
                              ? isDark
                                ? 'bg-cyan-500/25 text-cyan-300 shadow-xs'
                                : 'bg-white text-cyan-600 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <StretchHorizontal className="w-3.5 h-3.5" />
                          <span>Full Width</span>
                        </button>
                        <button
                          onClick={() => isFullWidth && onToggleFullWidth()}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            !isFullWidth
                              ? isDark
                                ? 'bg-cyan-500/25 text-cyan-300 shadow-xs'
                                : 'bg-white text-cyan-600 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Centered</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Language Section */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      {isId ? 'Bahasa Pengantar' : 'Interface Language'}
                    </span>
                    <div
                      className={`flex p-0.5 rounded-lg border ${
                        isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => onToggleLang('id')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
                          lang === 'id'
                            ? isDark
                              ? 'bg-cyan-500/25 text-cyan-300'
                              : 'bg-white text-cyan-600 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Bahasa (ID)
                      </button>
                      <button
                        onClick={() => onToggleLang('en')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
                          lang === 'en'
                            ? isDark
                              ? 'bg-cyan-500/25 text-cyan-300'
                              : 'bg-white text-cyan-600 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        English (EN)
                      </button>
                    </div>
                  </div>

                  {/* Fullscreen Quick Action */}
                  {onToggleFullscreen && (
                    <button
                      onClick={() => {
                        onToggleFullscreen();
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#0b0f19] border-[#1e293b] hover:bg-slate-800/70 text-slate-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isFullscreen ? (
                          <Minimize className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Maximize className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>{isFullscreen ? t.header.exitFullscreen : t.header.fullscreen}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">F11 / ESC</span>
                    </button>
                  )}

                  {/* Full Settings Hub Button */}
                  {onSelectStage && (
                    <button
                      onClick={() => {
                        onSelectStage('settings');
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isId ? 'Buka Pengaturan Lengkap' : 'Open Full Settings'}</span>
                    </button>
                  )}

                  {/* Latency Info */}
                  <div
                    className={`pt-2.5 border-t text-[10px] font-mono flex items-center justify-between ${
                      isDark ? 'border-[#1e293b] text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <span>System Latency:</span>
                    <span className="font-bold text-emerald-400">{healthStatus.latency.toFixed(0)} ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`flex md:hidden items-center justify-center p-1.5 rounded-lg border text-xs cursor-pointer min-h-[36px] min-w-[36px] ${
              isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 sm:px-4 lg:px-6 py-2">
        {/* Left Side: Sidebar Toggle, Coin Selector, Quick Coins, Timeframe, & Run Analysis */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              id="btn-toggle-sidebar"
              type="button"
              onClick={onToggleSidebar}
              className={`flex items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer min-h-[38px] min-w-[38px] ${
                isSidebarOpen
                  ? isDark
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
                  : isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={isSidebarOpen ? (isId ? 'Sembunyikan Menu Sidebar' : 'Collapse Sidebar') : (isId ? 'Tampilkan Menu Sidebar' : 'Expand Sidebar')}
              aria-label="Toggle Sidebar Navigation"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-cyan-400" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          )}

          {/* Unified Clean Asset Selector Button */}
          <button
            id="btn-open-pair-search"
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-mono transition-all cursor-pointer shadow-xs group min-h-[38px] ${
              isDark
                ? 'bg-[#0f172a] border-[#1e293b] text-slate-200 hover:border-cyan-500/50 hover:bg-slate-800/80'
                : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-400 hover:bg-slate-50'
            }`}
            title={`${t.header.searchModalTitle} (Shortcut: Ctrl+K atau /)`}
          >
            <Search
              className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`}
            />
            <span className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedSymbol}
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              ${formatPrice(displayPrice)}
            </span>

            {currentCoin && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  currentCoin.change24h >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {currentCoin.change24h >= 0 ? '+' : ''}
                {currentCoin.change24h}%
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
          </button>

          {/* Quick 1-Click Popular Tickers (Clean and minimal) */}
          <div
            className={`hidden 2xl:flex items-center gap-1 p-0.5 rounded-lg border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'PEPE/USDT'].map((sym) => {
              const isSelected = sym === selectedSymbol;
              const short = sym.split('/')[0];
              return (
                <button
                  key={sym}
                  onClick={() => onSelectSymbol(sym)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-cyan-600 text-white font-bold shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                  title={`Pindah cepat ke ${sym}`}
                >
                  {short}
                </button>
              );
            })}
          </div>

          {/* Segmented Timeframe Buttons */}
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onSelectTimeframe(tf)}
                className={`px-2 sm:px-2.5 py-1 text-[11px] font-mono rounded-md font-semibold transition-all cursor-pointer min-h-[30px] flex items-center justify-center ${
                  selectedTimeframe === tf
                    ? isDark
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-cyan-600 text-white font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Primary Action Button: Jalankan Analisis */}
          <button
            onClick={onTriggerAnalyze}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-xs rounded-lg transition-all shadow-md disabled:opacity-50 cursor-pointer min-h-[38px] ${
              !hasEvaluation && !isLoading
                ? isDark
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
                : isDark
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
            title={
              !hasEvaluation
                ? isId
                  ? `Jalankan analisa 12-indikator (${selectedTimeframe})`
                  : `Run 12-indicator analysis (${selectedTimeframe})`
                : undefined
            }
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="font-bold">
              {isLoading
                ? t.header.analyzing
                : !hasEvaluation
                ? isId
                  ? `Analisis (${selectedTimeframe})`
                  : `Analyze (${selectedTimeframe})`
                : isId
                ? 'Jalankan Analisis'
                : 'Run Analysis'}
            </span>
          </button>
        </div>

        {/* Right Side: Simple Alert Icon, Backtest, Workspace Switch, Search, Export */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Simple Alert / Breaking News Notification Icon */}
          {onSelectStage && (
            <button
              onClick={() => onSelectStage('sentiment')}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer min-h-[38px] border ${
                currentStage === 'sentiment'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : isDark
                  ? 'bg-[#0f172a] hover:bg-amber-950/40 border-[#1e293b] hover:border-amber-500/40 text-amber-400'
                  : 'bg-white hover:bg-amber-50 border-slate-200 hover:border-amber-300 text-amber-700'
              }`}
              title={isId ? 'Alert Berita Terkini & Sentimen Pasar' : 'Breaking News & Sentiment Alerts'}
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              </div>
              <span className="hidden sm:inline">Alert</span>
            </button>
          )}

          {/* Quantitative Backtest Button (Simple & Compact) */}
          {onOpenBacktest && (
            <button
              id="btn-header-backtest"
              onClick={() => onOpenBacktest()}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all cursor-pointer text-xs min-h-[38px] ${
                currentStage === 'backtest'
                  ? 'bg-blue-500 text-white font-bold border-blue-400 shadow-xs'
                  : isDark
                  ? 'bg-[#0f172a] hover:bg-blue-950/40 border-[#1e293b] hover:border-blue-500/40 text-blue-300'
                  : 'bg-white hover:bg-blue-50 border-slate-200 text-blue-700'
              }`}
              title={isId ? 'Backtest Lab Kuantitatif' : 'Quantitative Backtest Lab'}
            >
              <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold">Backtest</span>
            </button>
          )}

          {/* Workspace Mode Switcher (Compact) */}
          {onToggleWorkspaceMode && (
            <button
              id="btn-header-workspace-mode"
              onClick={onToggleWorkspaceMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold transition-all cursor-pointer min-h-[38px] ${
                workspaceMode === 'launchpad'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-xs'
                  : isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-cyan-700'
              }`}
              title={
                isId
                  ? 'Ganti Tampilan: Meja Kerja Multi-Panel vs Alur Tunggal (Tekan W)'
                  : 'Switch Layout: Multi-Panel Workspace vs Single Stage (Key: W)'
              }
            >
              {workspaceMode === 'launchpad' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden xl:inline">Grid</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xl:inline">{isId ? 'Alur' : 'Stages'}</span>
                </>
              )}
            </button>
          )}

          {/* Quick Search & Command Bar Launcher (⌘K) */}
          {onOpenCommandBar && (
            <button
              id="btn-header-omnibar"
              onClick={onOpenCommandBar}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold transition-all cursor-pointer min-h-[38px] ${
                isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-white hover:border-cyan-500/40'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-400'
              }`}
              title={isId ? 'Pencarian Cepat (⌘K atau /)' : 'Quick Search (⌘K or /)'}
            >
              <Command className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <kbd className="text-[10px] hidden md:inline">⌘K</kbd>
            </button>
          )}

          {/* Export Action Button */}
          <button
            onClick={onOpenExportModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border text-xs rounded-lg transition-colors cursor-pointer min-h-[38px] ${
              isDark
                ? 'bg-[#0f172a] hover:bg-slate-800 border-[#1e293b] hover:border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title={t.header.exportArtifacts}
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden xl:inline">{isId ? 'Ekspor' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Action Drawer */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden border-t px-4 py-3 space-y-3 transition-all ${
            isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          {/* Quick Page Navigator on Mobile */}
          {onSelectStage && (
            <div>
              <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1.5">
                {isId ? 'Navigasi Halaman' : 'Page Navigation'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {stagesList.flatMap((g) => g.items).map((stg) => {
                  const StgIcon = stg.icon;
                  const isCur = currentStage === stg.id;
                  return (
                    <button
                      key={stg.id}
                      onClick={() => {
                        onSelectStage(stg.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                        isCur
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : isDark
                          ? 'bg-[#0f172a] border-[#1e293b] text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <StgIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{stg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Popular Tickers on Mobile */}
          <div className="pt-2 border-t border-slate-700/40">
            <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1.5">
              {isId ? 'Koin Populer' : 'Popular Coins'}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'PEPE/USDT', 'DOGE/USDT'].map((sym) => {
                const isSelected = sym === selectedSymbol;
                const short = sym.split('/')[0];
                return (
                  <button
                    key={sym}
                    onClick={() => {
                      onSelectSymbol(sym);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer min-h-[38px] shrink-0 ${
                      isSelected
                        ? isDark
                          ? 'bg-cyan-500 text-slate-950 shadow-xs'
                          : 'bg-cyan-600 text-white shadow-xs'
                        : isDark
                        ? 'bg-[#0f172a] text-slate-300 border border-[#1e293b]'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Action Buttons on Mobile */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40">
            <button
              onClick={() => {
                onOpenExportModal();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>{t.header.exportArtifacts}</span>
            </button>

            {onToggleFullscreen && (
              <button
                onClick={() => {
                  onToggleFullscreen();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                  isFullscreen
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
                <span>{isFullscreen ? t.header.exitFullscreen : t.header.fullscreen}</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenAssuranceModal();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.header.assuranceRegister}</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      <SearchCoinModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={onSelectSymbol}
        lang={lang}
      />
    </header>
  );
};
