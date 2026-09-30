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
  Terminal as TerminalIcon,
  Columns,
  Eye,
  EyeOff,
  User,
  LogOut,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { CryptoSymbolInfo, Timeframe, WebSocketSyncMetrics, StageId } from '../types/crypto.types';
import { Language, getTranslation } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';
import { SearchCoinModal } from './SearchCoinModal';
import { AkiraQuLogo } from './AkiraQuLogo';
import { CryptoIcon } from './ui/CryptoIcon';
import { EngineThemeId, normalizeEngineTheme } from '../types/theme.types';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';

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
  theme: EngineThemeId | 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectTheme?: (theme: EngineThemeId, customColor?: string, customBg?: string) => void;
  customThemeColor?: string;
  onUpdateCustomColor?: (color: string) => void;
  customThemeBg?: string;
  onUpdateCustomBg?: (bg: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isFullWidth?: boolean;
  onToggleFullWidth?: () => void;
  workspaceMode?: 'classic' | 'split' | 'launchpad';
  onToggleWorkspaceMode?: () => void;
  onSelectWorkspaceMode?: (mode: 'classic' | 'split' | 'launchpad') => void;
  isWorkbenchVisible?: boolean;
  onToggleWorkbench?: () => void;
  onOpenCommandBar?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDocs?: () => void;
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
  onSelectTheme,
  customThemeColor = '#EC4899',
  onUpdateCustomColor,
  customThemeBg = '#0B0F19',
  onUpdateCustomBg,
  isFullscreen = false,
  onToggleFullscreen,
  isFullWidth = true,
  onToggleFullWidth,
  workspaceMode = 'classic',
  onToggleWorkspaceMode,
  isWorkbenchVisible = true,
  onToggleWorkbench,
  onOpenCommandBar,
  onOpenShortcuts,
  onOpenDocs,
  currentStage = 'ticker',
  onSelectStage,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, isAlertCenterOpen, openAlertCenter, closeAlertCenter, toggleAlertCenter } = useAlerts();
  const t = getTranslation(lang);
  const normalizedTheme = normalizeEngineTheme(theme);
  const isDark = normalizedTheme !== 'theme-light';
  const isId = lang === 'id';

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
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
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-200 ${
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
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            title={isId ? 'AKIRAQU - Beranda' : 'AKIRAQU - Home'}
          >
            <AkiraQuLogo
              size={28}
              theme={isDark ? 'dark' : 'light'}
              className="shrink-0 group-hover:scale-105 transition-transform"
            />
            <span
              className={`text-xs sm:text-sm font-extrabold tracking-wider font-display leading-tight flex items-center transition-colors ${
                isDark ? 'text-[#F89DB5]' : 'text-[#21242B]'
              }`}
            >
              AKIRAQU
            </span>
          </div>
        </div>

        {/* Right Top Bar Controls: Alert, Settings & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Unified Alert Center Toggle Button (Beside Settings) */}
          <button
            id="btn-header-alert-toggle"
            onClick={() => {
              if (toggleAlertCenter) {
                toggleAlertCenter();
              } else if (isAlertCenterOpen) {
                closeAlertCenter();
              } else {
                openAlertCenter();
              }
            }}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer min-h-[30px] ${
              isAlertCenterOpen
                ? 'bg-pink-600/25 border-pink-500 text-pink-300 ring-1 ring-pink-500/50 shadow-xs'
                : unreadCount > 0
                ? 'bg-pink-600/15 hover:bg-pink-600/25 border-pink-500/50 text-pink-400'
                : isDark
                ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-pink-300 hover:border-pink-500/30'
                : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600 hover:border-pink-500/30'
            }`}
            title={
              isId
                ? `Pusat Alert: ${unreadCount} pembaruan (${isAlertCenterOpen ? 'Klik untuk menutup sidebar kanan' : 'Buka di sidebar kanan'})`
                : `Alert Center: ${unreadCount} updates (${isAlertCenterOpen ? 'Click to close right sidebar' : 'Open in right sidebar'})`
            }
          >
            <div className="relative flex items-center justify-center">
              {unreadCount > 0 ? (
                <BellRing className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-400" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] px-0.5 rounded-full bg-pink-600 text-white text-[9px] font-bold font-mono items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Alert</span>
          </button>

          {/* Documentation Menu Button (Doc) */}
          {onOpenDocs && (
            <button
              id="btn-header-docs-toggle"
              type="button"
              onClick={onOpenDocs}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer min-h-[30px] ${
                isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-pink-300 hover:border-pink-500/40 hover:bg-slate-800/80'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600 hover:border-pink-500/30'
              }`}
              title={isId ? 'Buka Dokumentasi & Panduan API (Mintlify)' : 'Open Documentation & API Guide (Mintlify)'}
            >
              <BookOpen className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span>Doc</span>
            </button>
          )}

          {/* Combined Settings Dropdown (Theme, Language, Fullscreen) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-pink-300 hover:border-pink-500/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600 hover:border-pink-500/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">{isId ? 'Pengaturan' : 'Settings'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu Overlay */}
            {isSettingsOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-[2px] border p-4 shadow-xl z-50 transition-all ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-white shadow-black/50'
                    : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
                }`}
              >
                <div className="space-y-4">
                  {/* Theme Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                        {isId ? 'Tema Engine' : 'Engine Theme'}
                      </span>
                      <span className="text-[10px] font-mono text-pink-400 font-semibold">
                        {normalizedTheme === 'theme-glassnode' && 'Glassnode'}
                        {normalizedTheme === 'theme-light' && 'Light'}
                        {normalizedTheme === 'theme-dark' && 'Dark'}
                        {normalizedTheme === 'theme-terminal' && 'Terminal'}
                        {normalizedTheme === 'theme-custom' && 'Custom'}
                      </span>
                    </div>
                    <div
                      className={`grid grid-cols-2 gap-1 p-1 rounded-[2px] border ${
                        isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectTheme ? onSelectTheme('theme-glassnode') : onToggleTheme()}
                        className={`col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[2px] text-[11px] font-bold transition-all cursor-pointer ${
                          normalizedTheme === 'theme-glassnode'
                            ? 'bg-white text-[#DB2777] shadow-xs border border-[#FBCFE8]'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200 bg-[#070b14]'
                            : 'text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white'
                        }`}
                        title="Glassnode Research Console (Soft Pink)"
                      >
                        <Layers className="w-3 h-3 text-[#DB2777]" />
                        <span>Glassnode Research (Soft Pink 2px)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTheme ? onSelectTheme('theme-light') : onToggleTheme()}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-[2px] text-[11px] font-bold transition-all cursor-pointer ${
                          normalizedTheme === 'theme-light'
                            ? 'bg-white text-pink-600 shadow-xs border border-pink-200'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Light Theme"
                      >
                        <Sun className="w-3 h-3 text-[#F472B6]" />
                        <span>Light</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTheme ? onSelectTheme('theme-dark') : onToggleTheme()}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-[2px] text-[11px] font-bold transition-all cursor-pointer ${
                          normalizedTheme === 'theme-dark'
                            ? 'bg-pink-500/20 text-pink-300 shadow-xs border border-pink-500/40'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Dark Theme"
                      >
                        <Moon className="w-3 h-3 text-[#EC4899]" />
                        <span>Dark</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTheme ? onSelectTheme('theme-terminal') : onToggleTheme()}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-[2px] text-[11px] font-bold transition-all cursor-pointer ${
                          normalizedTheme === 'theme-terminal'
                            ? 'bg-[#030712] text-[#FF007A] shadow-xs border border-emerald-500/40'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Terminal Theme"
                      >
                        <TerminalIcon className="w-3 h-3 text-[#FF007A]" />
                        <span>Terminal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTheme ? onSelectTheme('theme-custom', customThemeColor, customThemeBg) : onToggleTheme()}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-[2px] text-[11px] font-bold transition-all cursor-pointer ${
                          normalizedTheme === 'theme-custom'
                            ? 'bg-pink-950/60 text-pink-300 shadow-xs border border-pink-500/40'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Custom Theme"
                      >
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <span>Custom</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Section */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      {isId ? 'Bahasa Pengantar' : 'Interface Language'}
                    </span>
                    <div
                      className={`flex p-0.5 rounded-[2px] border ${
                        isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => onToggleLang('id')}
                        className={`flex-1 py-1.5 rounded-[2px] text-xs font-bold transition-all cursor-pointer text-center ${
                          lang === 'id'
                            ? isDark
                              ? 'bg-pink-500/25 text-pink-300'
                              : 'bg-white text-pink-600 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Bahasa (ID)
                      </button>
                      <button
                        onClick={() => onToggleLang('en')}
                        className={`flex-1 py-1.5 rounded-[2px] text-xs font-bold transition-all cursor-pointer text-center ${
                          lang === 'en'
                            ? isDark
                              ? 'bg-pink-500/25 text-pink-300'
                              : 'bg-white text-pink-600 shadow-xs'
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-mono border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#0b0f19] border-[#1e293b] hover:bg-slate-800/70 text-slate-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isFullscreen ? (
                          <Minimize className="w-3.5 h-3.5 text-pink-400" />
                        ) : (
                          <Maximize className="w-3.5 h-3.5 text-pink-400" />
                        )}
                        <span>{isFullscreen ? t.header.exitFullscreen : t.header.fullscreen}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">F11 / ESC</span>
                    </button>
                  )}

                  {/* Documentation Quick Action */}
                  {onOpenDocs && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenDocs();
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-mono border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#0b0f19] border-[#1e293b] hover:bg-slate-800/70 text-slate-200 hover:border-pink-500/40'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-pink-400'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                        <span>{isId ? 'Dokumentasi & API' : 'Documentation & API'}</span>
                      </span>
                      <span className="text-[10px] text-pink-400 font-bold">Doc</span>
                    </button>
                  )}

                  {/* Full Settings Hub Button */}
                  {onSelectStage && (
                    <button
                      onClick={() => {
                        onSelectStage('settings');
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[2px] bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
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

          {/* Google / Gmail Account & Login Menu */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated && user ? (
              <button
                id="btn-header-user-menu"
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer min-h-[30px] ${
                  isUserMenuOpen
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                    : isDark
                    ? 'bg-[#0f172a] border-emerald-500/40 text-emerald-400 hover:bg-slate-800/80 hover:border-emerald-500/60'
                    : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
                title={user.email || 'Akun Google / Gmail'}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-4 h-4 rounded-full border border-emerald-400/50 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    {user.displayName?.charAt(0).toUpperCase() || 'G'}
                  </span>
                )}
                <span className="hidden sm:inline truncate max-w-[85px]">
                  {user.displayName || 'Gmail'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <button
                id="btn-header-login"
                type="button"
                onClick={onNavigateToLogin}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer min-h-[30px] shadow-xs active:scale-[0.98] ${
                  isDark
                    ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                }`}
                title={isId ? 'Masuk dengan Akun Google (Gmail)' : 'Sign in with Google (Gmail)'}
              >
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
                <span className="hidden sm:inline">{isId ? 'Masuk' : 'Sign In'}</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* User Profile Popover */}
            {isUserMenuOpen && isAuthenticated && user && (
              <div
                className={`absolute right-0 mt-2 w-72 rounded-[2px] border p-4 shadow-xl z-50 transition-all ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-white shadow-black/60'
                    : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Account Header */}
                  <div className="flex items-start gap-3 pb-3 border-b border-slate-800/60">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-10 h-10 rounded-full border border-emerald-400/60 object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/40 shrink-0">
                        {user.displayName?.charAt(0).toUpperCase() || 'G'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Google Verified</span>
                      </div>
                      <h4 className="text-xs font-bold truncate mt-0.5">{user.displayName}</h4>
                      <p className="text-[11px] font-mono text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Sync Status Badge */}
                  <div className={`p-2.5 rounded-[2px] border space-y-1 text-[11px] font-mono ${
                    isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Database className="w-3 h-3 text-pink-400" />
                        <span>Cloud Firestore:</span>
                      </span>
                      <span className="text-emerald-400 font-bold">Online & Active</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Auth Provider:</span>
                      <span>Google OAuth 2.0</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    {onSelectStage && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStage('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-[#0b0f19] border-slate-800 hover:bg-slate-800 text-slate-200 hover:border-pink-500/40'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-pink-400" />
                          <span>{isId ? 'Profil & Preferensi' : 'Profile & Settings'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Ctrl+12</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[2px] text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-rose-950/30 hover:bg-rose-950/60 border-rose-500/30 text-rose-300'
                          : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isId ? 'Keluar Akun Gmail' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`flex md:hidden items-center justify-center p-1.5 rounded-[2px] border text-xs cursor-pointer min-h-[36px] min-w-[36px] ${
              isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-pink-400" /> : <Menu className="w-4 h-4 text-pink-400" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 sm:px-4 lg:px-6 py-2">
        {/* Left Side: Coin Selector, Timeframe, & Run Analysis */}
        <div className="flex flex-wrap items-center gap-2">          

          {/* Unified Clean Asset Selector Button (Widened) */}
          <button
            id="btn-open-pair-search"
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={`flex items-center justify-between gap-2 px-3.5 py-1.5 border rounded-[2px] text-xs font-mono transition-all cursor-pointer shadow-xs group min-h-[38px] w-56 sm:w-64 md:w-72 lg:w-80 ${
              isDark
                ? 'bg-[#0f172a] border-[#1e293b] text-slate-200 hover:border-pink-500/50 hover:bg-slate-800/80'
                : 'bg-white border-slate-200 text-slate-800 hover:border-pink-400 hover:bg-slate-50'
            }`}
            title={`${t.header.searchModalTitle} (Shortcut: Ctrl+K atau /)`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CryptoIcon symbol={selectedSymbol} size="sm" className="rounded-full shadow-xs shrink-0" />
              <span className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedSymbol}
              </span>
              <span className={`text-xs font-semibold shrink-0 ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
                ${formatPrice(displayPrice)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentCoin && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] ${
                    currentCoin.change24h >= 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {currentCoin.change24h >= 0 ? '+' : ''}
                  {currentCoin.change24h}%
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-400" />
            </div>
          </button>

          {/* Segmented Timeframe Buttons */}
          <div
            className={`flex items-center p-0.5 rounded-[2px] border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onSelectTimeframe(tf)}
                className={`px-2 sm:px-2.5 py-1 text-xs font-mono rounded-[2px] transition-colors cursor-pointer min-h-[30px] flex items-center justify-center ${
                  selectedTimeframe === tf
                    ? isDark
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'bg-white text-slate-900 font-semibold shadow-xs'
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-xs rounded-[2px] transition-colors bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white disabled:opacity-50 cursor-pointer min-h-[38px] shadow-xs"
            title={
              !hasEvaluation
                ? isId
                  ? `Jalankan analisa 12-indikator (${selectedTimeframe})`
                  : `Run 12-indicator analysis (${selectedTimeframe})`
                : undefined
            }
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="font-semibold">
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

        {/* Right Side: Workspace Mode Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Workspace Mode Switcher (Compact 3-state: Fokus, Split, Grid) */}
          {onToggleWorkspaceMode && (
            <button
              id="btn-header-workspace-mode"
              onClick={onToggleWorkspaceMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[38px] ${
                workspaceMode === 'launchpad'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-xs'
                  : workspaceMode === 'split'
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-xs'
                  : isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-pink-300 hover:border-pink-500/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-pink-700'
              }`}
              title={
                isId
                  ? 'Ganti Tata Letak Meja Kerja: Fokus (Alur Tunggal) ➔ Split (Jangkar Chart) ➔ Grid (4 Kuadran) (Tekan W)'
                  : 'Switch Layout: Single Focus ➔ Split Chart Anchor ➔ Quad Grid (Key: W)'
              }
            >
              {workspaceMode === 'launchpad' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden xl:inline">Grid 4P</span>
                </>
              ) : workspaceMode === 'split' ? (
                <>
                  <Columns className="w-3.5 h-3.5 text-pink-400" />
                  <span className="hidden xl:inline">Split Chart</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xl:inline">{isId ? 'Fokus' : 'Focus'}</span>
                </>
              )}
            </button>
          )}

          {/* Tombol Meja Kerja Trader (Hide/Show Workbench) */}
          {onToggleWorkbench && (
            <button
              id="btn-header-toggle-workbench"
              type="button"
              onClick={onToggleWorkbench}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[38px] ${
                isWorkbenchVisible
                  ? isDark
                    ? 'bg-pink-500/15 border-pink-500/40 text-pink-300 hover:bg-pink-500/25'
                    : 'bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100'
                  : isDark
                  ? 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title={
                isId
                  ? (isWorkbenchVisible
                      ? 'Sembunyikan Meja Kerja Trader (Maksimalkan Ruang Kerja) (Tekan H)'
                      : 'Tampilkan Meja Kerja Trader (7 Tahap & Personalisasi) (Tekan H)')
                  : (isWorkbenchVisible
                      ? 'Hide Trader Workbench (Maximize Screen) (Key: H)'
                      : 'Show Trader Workbench (7 Steps & Persona) (Key: H)')
              }
            >
              {isWorkbenchVisible ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="hidden xl:inline">{isId ? 'Meja Kerja' : 'Workbench'}</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 animate-pulse" title={isId ? 'Aktif' : 'Active'} />
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden xl:inline">{isId ? 'Meja Kerja' : 'Workbench'}</span>
                  <span className="px-1 py-0.2 rounded-xs text-[9px] bg-slate-800 text-slate-400 border border-slate-700 font-normal">
                    {isId ? 'Sembunyi' : 'Hidden'}
                  </span>
                </>
              )}
            </button>
          )}
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
                      className={`flex items-center gap-2 p-2 rounded-[2px] text-xs font-mono font-semibold border transition cursor-pointer ${
                        isCur
                          ? 'bg-pink-500 text-white font-bold border-pink-400'
                          : isDark
                          ? 'bg-[#0f172a] border-[#1e293b] text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <StgIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
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
                    className={`px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold transition cursor-pointer min-h-[38px] shrink-0 ${
                      isSelected
                        ? isDark
                          ? 'bg-pink-500 text-white shadow-xs'
                          : 'bg-pink-600 text-white shadow-xs'
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
            {onToggleSidebar && (
              <button
                onClick={() => {
                  onToggleSidebar();
                  setIsMobileMenuOpen(false);
                }}
                className={`col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-[2px] text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                  isSidebarOpen
                    ? 'bg-pink-500/15 border-pink-500/30 text-pink-200'
                    : isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <PanelLeft className={`w-4 h-4 ${isSidebarOpen ? 'text-pink-400' : 'text-slate-400'}`} />
                <span>{isId ? 'Navigasi Sidebar Terminal (17 Alat)' : 'Terminal Sidebar (17 Tools)'}</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenExportModal();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-[2px] text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Download className="w-4 h-4 text-pink-400" />
              <span>{t.header.exportArtifacts}</span>
            </button>

            {onToggleFullscreen && (
              <button
                onClick={() => {
                  onToggleFullscreen();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-[2px] text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                  isFullscreen
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                    : isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4 text-pink-400" /> : <Maximize className="w-4 h-4 text-pink-400" />}
                <span>{isFullscreen ? t.header.exitFullscreen : t.header.fullscreen}</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenAssuranceModal();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-[2px] text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.header.assuranceRegister}</span>
            </button>

            {onOpenDocs && (
              <button
                type="button"
                onClick={() => {
                  onOpenDocs();
                  setIsMobileMenuOpen(false);
                }}
                className={`col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-[2px] text-xs font-semibold border transition cursor-pointer min-h-[44px] ${
                  isDark ? 'bg-[#0f172a] border-pink-500/30 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-700'
                }`}
              >
                <BookOpen className="w-4 h-4 text-pink-400" />
                <span>{isId ? 'Dokumentasi & Panduan API (Doc)' : 'Documentation & API Guide (Doc)'}</span>
              </button>
            )}
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
