import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Lock,
  Bolt,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Terminal as TerminalIcon,
  Layers,
  Database,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flame,
  Bot,
  FileCode2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Home,
  Code,
  Compass,
  Cpu,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Radar,
  Radio,
  Share2,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { StageId } from '../types/crypto.types';
import { AkiraQuLogo } from '../components/AkiraQuLogo';

interface DocsPageProps {
  lang: Language;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSetLang: (lang: Language) => void;
  onNavigateToTerminal: (stage?: StageId) => void;
  onNavigateToLanding: () => void;
}

type DocPageId =
  | 'introduction'
  | 'quickstart'
  | 'chart-analytics'
  | 'scanner'
  | 'order-flow'
  | 'macro-heatmap'
  | 'arbitrage'
  | 'strategy-matrix'
  | 'backtest-lab'
  | 'signal-output'
  | 'risk-management'
  | 'trading-bots'
  | 'trading-journal'
  | 'system-settings'
  | 'api-security'
  | 'client-security'
  | 'mintlify-config';

interface NavItem {
  id: DocPageId;
  title: string;
  titleEn: string;
  badge?: string;
  stageId?: StageId;
}

interface NavGroup {
  group: string;
  groupEn: string;
  pages: NavItem[];
}

export const DocsPage: React.FC<DocsPageProps> = ({
  lang,
  theme,
  onToggleTheme,
  onSetLang,
  onNavigateToTerminal,
  onNavigateToLanding,
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activePage, setActivePage] = useState<DocPageId>('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openExchange, setOpenExchange] = useState<'binance' | 'okx' | 'bybit'>('binance');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Scroll to top when activePage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        group: 'Memulai',
        groupEn: 'Getting Started',
        pages: [
          { id: 'introduction', title: 'Pengenalan AkiraQu', titleEn: 'Introduction to AkiraQu', badge: 'v2.4' },
          { id: 'quickstart', title: 'Panduan Memulai Cepat', titleEn: 'Quick Start Guide' },
        ],
      },
      {
        group: 'Navigasi Terminal Akiraqu',
        groupEn: 'Akiraqu Terminal Navigation',
        pages: [
          { id: 'chart-analytics', title: '01. Grafik Utama & Indikator', titleEn: '01. Main Chart & Indicators', stageId: 'ticker' },
          { id: 'scanner', title: '02. Screener Pasar 900+ Koin', titleEn: '02. 900+ Market Screener', stageId: 'scanner' },
          { id: 'order-flow', title: '03. Order Flow & Likuiditas', titleEn: '03. Order Flow & Liquidity', stageId: 'orderflow' },
          { id: 'macro-heatmap', title: '04. Makro Heatmap & Korelasi', titleEn: '04. Macro Heatmap & Correlation', stageId: 'market_heatmap' },
          { id: 'arbitrage', title: '05. Arbitrase Multi-Bursa', titleEn: '05. Multi-Exchange Arbitrage', stageId: 'multi_exchange' },
          { id: 'strategy-matrix', title: '06. Matriks Konfluensi Strategi', titleEn: '06. Strategy Confluence Matrix', stageId: 'confluence' },
          { id: 'backtest-lab', title: '07. Backtest Lab Kuantitatif', titleEn: '07. Quantitative Backtest Lab', stageId: 'backtest' },
          { id: 'signal-output', title: '08. Laporan Sinyal & Analisis', titleEn: '08. Signal & Analysis Report', stageId: 'output' },
          { id: 'risk-management', title: '09. Manajemen Risiko & DCA', titleEn: '09. Risk Management & DCA', stageId: 'risk' },
          { id: 'trading-bots', title: '10. Trading Bots & Automasi', titleEn: '10. Automated Trading Bots', stageId: 'bot' },
          { id: 'trading-journal', title: '11. Jurnal Trading Cloud', titleEn: '11. Cloud Trading Journal', stageId: 'journal' },
          { id: 'system-settings', title: '12. Pengaturan & Sistem', titleEn: '12. System Settings', stageId: 'settings' },
        ],
      },
      {
        group: 'Keamanan & Kredensial',
        groupEn: 'Security & Credentials',
        pages: [
          { id: 'api-security', title: 'Keamanan Kunci API', titleEn: 'API Key Security', badge: 'KRITIS' },
          { id: 'client-security', title: 'Enkripsi & Proteksi Data', titleEn: 'Encryption & Data Protection' },
        ],
      },
      {
        group: 'Konfigurasi & Skema',
        groupEn: 'Configuration & Schemas',
        pages: [
          { id: 'mintlify-config', title: 'mintlify.json & Tema', titleEn: 'mintlify.json & Theming', badge: 'MINTLIFY' },
        ],
      },
    ],
    []
  );

  // Flat list for search and pagination
  const allPages = useMemo(() => navGroups.flatMap((g) => g.pages), [navGroups]);
  const currentPageIndex = allPages.findIndex((p) => p.id === activePage);
  const prevPage = currentPageIndex > 0 ? allPages[currentPageIndex - 1] : null;
  const nextPage = currentPageIndex < allPages.length - 1 ? allPages[currentPageIndex + 1] : null;

  // Filtered pages for search
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.titleEn.toLowerCase().includes(q) || p.id.includes(q)
    );
  }, [allPages, searchQuery]);

  const mintlifyConfigString = `{
  "$schema": "https://mintlify.com/schema.json",
  "name": "AkiraQu Quantitative Terminal",
  "logo": {
    "dark": "/images/logo-dark.svg",
    "light": "/images/logo-light.svg",
    "href": "https://vercel.app"
  },
  "favicon": "/favicon.ico",
  "colors": {
    "primary": "#f43f5e",
    "light": "#fb7185",
    "dark": "#e11d48",
    "background": {
      "dark": "#070b14",
      "light": "#ffffff"
    }
  },
  "topbarLinks": [
    {
      "name": "Landing Page",
      "url": "https://vercel.app"
    },
    {
      "name": "Dasbor Terminal",
      "url": "https://vercel.app/terminal"
    }
  ],
  "topbarCtaButton": {
    "name": "Buka Terminal",
    "url": "https://vercel.app"
  },
  "navigation": [
    {
      "group": "Memulai",
      "pages": [
        "introduction",
        "quickstart"
      ]
    },
    {
      "group": "Navigasi Terminal Akiraqu",
      "pages": [
        "features/chart-analytics",
        "features/order-book-flow",
        "features/trading-journal",
        "features/risk-management",
        "features/multi-exchange"
      ]
    },
    {
      "group": "Keamanan & Kredensial",
      "pages": [
        "api-security"
      ]
    }
  ]
}`;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#070b14] text-slate-100' : 'bg-[#fafafa] text-slate-900'
      }`}
    >
      {/* 1. MINTLIFY TOP NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#070b14]/90 border-[#1a2333]/80'
            : 'bg-white/90 border-slate-200 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onNavigateToLanding}
              className="flex items-center gap-2.5 group cursor-pointer text-left"
              title="Kembali ke Landing Page"
            >
              <div className="w-8 h-8 rounded-[2px] bg-pink-500/10 border border-pink-500/30 flex items-center justify-center transition-all group-hover:border-pink-500/60">
                <AkiraQuLogo size={20} theme={theme} variant="symbol" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono tracking-tight group-hover:text-pink-400 transition-colors">
                  AkiraQu
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  DOCS
                </span>
              </div>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className={`md:hidden p-1.5 rounded-[2px] border text-xs font-mono transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <Compass className="w-4 h-4 text-pink-400" />
            </button>
          </div>

          {/* Center: Search input */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isId ? 'Cari dokumentasi atau fitur (contoh: API, CVD, risk)...' : 'Search docs or features...'}
                className={`w-full pl-9 pr-8 py-1.5 rounded-[2px] border text-xs font-mono outline-hidden transition-all ${
                  isDark
                    ? 'bg-[#0d1424] border-[#1e293b] text-slate-200 placeholder-slate-500 focus:border-pink-500/60 focus:bg-[#0f172a]'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:bg-white'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-mono"
                >
                  ✕
                </button>
              )}

              {/* Instant Search Dropdown */}
              {filteredPages.length > 0 && (
                <div
                  className={`absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-[2px] border shadow-xl z-50 p-1 font-mono text-xs ${
                    isDark ? 'bg-[#0c1220] border-[#1e293b]' : 'bg-white border-slate-200'
                  }`}
                >
                  {filteredPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setActivePage(page.id);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-[2px] text-left transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-pink-950/40 text-slate-200' : 'hover:bg-pink-50 text-slate-800'
                      }`}
                    >
                      <span>{isId ? page.title : page.titleEn}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-pink-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Navigation Links, Theme/Lang, and Buka Terminal CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateToLanding}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium transition-colors ${
                isDark ? 'text-slate-400 hover:text-pink-300' : 'text-slate-600 hover:text-pink-600'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => onSetLang(isId ? 'en' : 'id')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-pink-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600'
              }`}
              title="Ganti Bahasa (ID / EN)"
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>{isId ? 'ID' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-[2px] border text-xs transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-pink-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600'
              }`}
              title="Ganti Tema (Dark / Light)"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Buka Terminal CTA Button */}
            <button
              onClick={() => onNavigateToTerminal()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>{isId ? 'Buka Terminal' : 'Open Terminal'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT: SIDEBAR + MAIN DOCUMENTATION AREA + RIGHT TOC */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full flex flex-col md:flex-row gap-6 lg:gap-8 py-6">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside
          className={`w-full md:w-64 lg:w-72 shrink-0 md:sticky md:top-21 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto no-scrollbar pb-8 ${
            isMobileNavOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div
            className={`p-3 rounded-[2px] border ${
              isDark ? 'bg-[#090d16] border-[#182234]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            {/* Quick Domain Banner */}
            <div className={`p-2.5 mb-3 rounded-[2px] border text-xs font-mono ${
              isDark ? 'bg-[#0c1220] border-pink-500/20 text-slate-300' : 'bg-pink-50/60 border-pink-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-pink-400">DOMAIN VERIFIED</span>
                <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
              </div>
              <a
                href="https://vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-[11px] font-semibold hover:underline text-pink-400"
              >
                <span>https://vercel.app</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-5">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <h4 className="px-2 text-[11px] font-mono font-bold uppercase tracking-wider text-pink-400/90">
                    {isId ? group.group : group.groupEn}
                  </h4>
                  <div className="space-y-0.5">
                    {group.pages.map((page) => {
                      const isActive = activePage === page.id;
                      return (
                        <button
                          key={page.id}
                          onClick={() => {
                            setActivePage(page.id);
                            setIsMobileNavOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-xs font-mono transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-pink-600 text-white font-bold shadow-xs'
                              : isDark
                              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{isId ? page.title : page.titleEn}</span>
                          {page.badge && (
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ml-1.5 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                              }`}
                            >
                              {page.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Direct Launch Terminal CTA in Sidebar */}
            <div className="mt-5 pt-4 border-t border-slate-800/60">
              <button
                onClick={() => onNavigateToTerminal()}
                className={`w-full py-2 px-3 rounded-[2px] border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-pink-300 hover:border-pink-500/50'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-pink-600 hover:bg-white'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>{isId ? 'Ke Layar Terminal' : 'Launch Terminal'}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN DOCUMENTATION ARTICLE */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb Bar */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-4 pb-2 border-b border-slate-800/40">
            <button onClick={onNavigateToLanding} className="hover:text-pink-400 transition-colors">
              AkiraQu
            </button>
            <span>/</span>
            <span className="text-pink-400 font-semibold">Docs</span>
            <span>/</span>
            <span className="text-slate-200 font-bold uppercase truncate">
              {allPages.find((p) => p.id === activePage)?.title}
            </span>
          </div>

          {/* PAGE CONTENT SWITCHER */}
          <div className="space-y-8">
            {/* 1. INTRODUCTION */}
            {activePage === 'introduction' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    introduction.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    {isId ? 'Pengenalan Terminal Kuantitatif AkiraQu' : 'Introduction to AkiraQu Quantitative Terminal'}
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isId
                      ? 'Terminal analitik kuantitatif kripto multi-exchange berlatensi rendah dengan sinkronisasi cloud real-time, 10 indikator mandiri, dan arsitektur non-kustodian.'
                      : 'Institutional-grade crypto quantitative analytics terminal with ultra-low latency feeds, 10 self-hosted indicators, and non-custodial architecture.'}
                  </p>
                </div>

                {/* Mintlify CardGroup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-[2px] border transition-all ${
                      isDark ? 'bg-[#0a0f1d] border-[#1a2538]' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-[2px] bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                      <Bolt className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold font-mono mb-1.5">Multi-Exchange Ultra-Fast</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Konektivitas WebSocket langsung ke Binance, OKX, Bybit, KuCoin, Bitget, dan Crypto.com tanpa sensor ISP dengan gateway anti-blokir.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border transition-all ${
                      isDark ? 'bg-[#0a0f1d] border-[#1a2538]' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-[2px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold font-mono mb-1.5">Mesin Kuantitatif Lokal</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Kalkulasi algoritma SuperTrend (10, 3.0), Order Flow CVD, Volume Profile, EMA Cloud, dan VWAP diproses di bawah 16ms langsung pada browser Anda.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border transition-all ${
                      isDark ? 'bg-[#0a0f1d] border-[#1a2538]' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-[2px] bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
                      <Database className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold font-mono mb-1.5">Jurnal Trading Cloud</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Pencatatan riwayat trading, rekaman emosi psikologi trader, dan evaluasi PnL tersimpan aman di Google Cloud Firestore secara instan.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border transition-all ${
                      isDark ? 'bg-[#0a0f1d] border-[#1a2538]' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-[2px] bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold font-mono mb-1.5">Arsitektur Non-Kustodian</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Kunci API Anda hanya digunakan untuk analisis dan eksekusi. Sistem tidak pernah meminta atau memproses izin penarikan aset (*strictly no withdrawals*).
                    </p>
                  </div>
                </div>

                {/* Mintlify Note Component */}
                <div
                  className={`p-4 rounded-[2px] border font-mono text-xs flex items-start gap-3 ${
                    isDark ? 'bg-sky-950/30 border-sky-500/40 text-sky-200' : 'bg-sky-50 border-sky-300 text-sky-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sky-400 font-bold mb-0.5">Note: Autentikasi Modern Google</strong>
                    <span>
                      AkiraQu terintegrasi langsung dengan Firebase Authentication & Google OAuth 2.0. Anda dapat masuk langsung menggunakan akun Gmail tanpa perlu mengingat kata sandi tambahan.
                    </span>
                  </div>
                </div>

                {/* Solusi Masalah Trading */}
                <div
                  className={`p-5 rounded-[2px] border space-y-3 font-mono ${
                    isDark ? 'bg-[#080d17] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wide">
                    {isId ? 'Solusi yang Ditawarkan AkiraQu' : 'The Solution Provided by AkiraQu'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-black/20 rounded-[2px] border border-slate-800/80">
                      <strong className="text-slate-200 block mb-1">1. Likuiditas Agregasi</strong>
                      <p className="text-slate-400">
                        Membandingkan harga Spot vs Perpetual di berbagai bursa untuk mengidentifikasi spread arbitrase & likuiditas tersembunyi.
                      </p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-[2px] border border-slate-800/80">
                      <strong className="text-slate-200 block mb-1">2. Zero Memory Bloat</strong>
                      <p className="text-slate-400">
                        Sistem hanya merender aset aktif sehingga konsumsi RAM hemat 80% dan grafik tetap berjalan mulus di 60 FPS.
                      </p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-[2px] border border-slate-800/80">
                      <strong className="text-slate-200 block mb-1">3. Disiplin Risiko Kuantitatif</strong>
                      <p className="text-slate-400">
                        Kalkulator ukuran lot dan simulasi DCA membatasi risiko kerugian maksimal per perdagangan sesuai aturan modal Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. QUICK START */}
            {activePage === 'quickstart' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    quickstart.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    {isId ? 'Panduan Memulai Cepat (Quick Start)' : 'Quick Start Guide'}
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isId
                      ? 'Langkah demi langkah memulai analisis kuantitatif dan eksekusi trading di AkiraQu dalam waktu kurang dari dua menit.'
                      : 'Step-by-step guide to starting quantitative analysis and execution in AkiraQu within two minutes.'}
                  </p>
                </div>

                {/* Mintlify Steps Component */}
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-[2px] border flex items-start gap-4 ${
                      isDark ? 'bg-[#090e1b] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                      1
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      <h3 className="text-sm font-bold text-slate-100">
                        {isId ? 'Masuk dengan Akun Google (Gmail)' : 'Sign In with Google Account'}
                      </h3>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        Buka aplikasi dan klik tombol <strong>Masuk dengan Google</strong>. Sistem menggunakan protokol resmi OAuth 2.0 yang menghubungkan Jurnal Trading dan preferensi Anda langsung ke database Firestore pribadi.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border flex items-start gap-4 ${
                      isDark ? 'bg-[#090e1b] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                      2
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      <h3 className="text-sm font-bold text-slate-100">
                        {isId ? 'Pilih Pasangan Koin & Bursa' : 'Select Coin Pair & Exchange'}
                      </h3>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        Tekan tombol pintasan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-pink-300 border border-slate-700">Ctrl + K</kbd> atau klik bilah pencarian atas untuk memilih salah satu dari 900+ koin. Pilih mode pasar: <strong>SPOT</strong> atau <strong>FUTURES</strong>.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border flex items-start gap-4 ${
                      isDark ? 'bg-[#090e1b] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                      3
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      <h3 className="text-sm font-bold text-slate-100">
                        {isId ? 'Aktifkan Indikator Kuantitatif' : 'Toggle Quantitative Indicators'}
                      </h3>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        Gunakan tombol filter di atas kanvas grafik untuk menyalakan indikator:
                        <br />• <strong>Trend:</strong> SuperTrend (10, 3.0) & EMA Ribbon (20/50/200).
                        <br />• <strong>Order Flow:</strong> CVD (Cumulative Volume Delta) & Volume Profile.
                        <br />• <strong>Momentum:</strong> Stochastic RSI & Dynamic VWAP.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border flex items-start gap-4 ${
                      isDark ? 'bg-[#090e1b] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                      4
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      <h3 className="text-sm font-bold text-slate-100">
                        {isId ? 'Tentukan Batas Risiko & Eksekusi' : 'Set Risk Limits & Execute'}
                      </h3>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        Buka tab <strong>09. Manajemen Risiko</strong> untuk menentukan risiko modal (1%-2%). Sistem otomatis menghitung ukuran posisi (*lot sizing*). Simpan catatan ke <strong>Jurnal Trading</strong> dengan satu klik!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigateToTerminal('ticker')}
                    className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <span>{isId ? 'Mulai Eksplorasi di Layar Terminal' : 'Start in Terminal Screen'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. API SECURITY (CRITICAL RESTRICTIVE PERMISSIONS) */}
            {activePage === 'api-security' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 mb-2">
                    api-security.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    {isId ? 'Keamanan Kunci API Bursa (Restrictive Permissions)' : 'Exchange API Key Security (Restrictive Permissions)'}
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isId
                      ? 'Panduan menghubungkan API Key bursa secara aman dengan prinsip hak akses terbatas (Least Privilege). Tanpa izin penarikan dana.'
                      : 'Essential security guide on connecting exchange API Keys with restrictive permissions (Read & Trade only, strictly NO withdrawals).'}
                  </p>
                </div>

                {/* Mintlify Critical Warning Banner */}
                <div className="p-4 sm:p-5 rounded-[2px] bg-rose-950/40 border-2 border-rose-500/60 text-rose-200 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>PERINGATAN DANA KRITIS (STRICTLY NO WITHDRAWALS)</span>
                  </div>
                  <p className="leading-relaxed">
                    <strong>JANGAN PERNAH mengaktifkan izin Penarikan (Withdrawals) atau Transfer Dana</strong> saat membuat API Key di bursa mana pun. AkiraQu beroperasi sepenuhnya secara <em>Non-Custodial</em> dan <strong>HANYA</strong> memerlukan izin <strong>Baca (*Read-Only*)</strong> serta <strong>Perdagangan (*Trade Execution*)</strong>.
                  </p>
                </div>

                {/* Permission Matrix Table */}
                <div
                  className={`p-4 rounded-[2px] border ${
                    isDark ? 'bg-[#090e1a] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <h3 className="text-sm font-bold font-mono mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Matriks Izin Akses API Kunci Bursa (*Permission Matrix*)</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                          <th className="py-2 px-3">Jenis Izin</th>
                          <th className="py-2 px-3">Status di Bursa</th>
                          <th className="py-2 px-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-emerald-400">Can Read / Read-Only</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              WAJIB AKTIF
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Membaca saldo akun, posisi terbuka, dan riwayat transaksi.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-sky-400">Spot & Margin Trading</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                              OPSIONAL
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Aktifkan hanya jika Anda ingin memasang order Spot langsung dari terminal.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-indigo-400">Futures Trading</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                              OPSIONAL
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Aktifkan hanya jika Anda memperdagangkan kontrak perpetual / derivatif.
                          </td>
                        </tr>
                        <tr className="bg-rose-950/30">
                          <td className="py-2.5 px-3 font-bold text-rose-400">Enable Withdrawals</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                              DILARANG (OFF)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-rose-300 font-semibold">
                            Jangan pernah dicentang! AkiraQu menolak transaksi penarikan dana.
                          </td>
                        </tr>
                        <tr className="bg-rose-950/30">
                          <td className="py-2.5 px-3 font-bold text-rose-400">Internal Transfer</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                              DILARANG (OFF)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-rose-300 font-semibold">
                            Tolak pemindahan aset internal antar sub-akun demi keamanan mutlak.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Petunjuk Pembuatan API Key per Bursa */}
                <div className="space-y-3 font-mono">
                  <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wide">
                    Panduan Konfigurasi per Bursa Kripto
                  </h3>

                  {/* Binance Accordion */}
                  <div className={`rounded-[2px] border overflow-hidden ${
                    isDark ? 'border-slate-800 bg-[#0a0e1a]' : 'border-slate-200 bg-white'
                  }`}>
                    <button
                      onClick={() => setOpenExchange(openExchange === 'binance' ? 'okx' : 'binance')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold text-left cursor-pointer hover:bg-slate-800/20"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span>1. Binance (Spot & USDⓈ-M Futures)</span>
                      </span>
                      {openExchange === 'binance' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openExchange === 'binance' && (
                      <div className="p-4 border-t border-slate-800/60 font-mono text-xs space-y-2 text-slate-300">
                        <p>1. Masuk ke Akun Binance ➔ Klik ikon Profil ➔ <strong>API Management</strong>.</p>
                        <p>2. Klik <strong>Create API</strong> ➔ Pilih <em>System generated</em> ➔ Beri label <code className="text-pink-400">AkiraQu-Terminal</code>.</p>
                        <p>3. Di pengaturan izin, centang <strong>Can Read</strong> dan <strong>Enable Futures</strong> (jika trading perpetual).</p>
                        <p className="text-rose-400 font-bold">4. PASTIKAN centang "Enable Withdrawals" tetap KOSONG.</p>
                        <p>5. Salin dan simpan <em>API Key</em> dan <em>API Secret</em> Anda secara aman.</p>
                      </div>
                    )}
                  </div>

                  {/* OKX Accordion */}
                  <div className={`rounded-[2px] border overflow-hidden ${
                    isDark ? 'border-slate-800 bg-[#0a0e1a]' : 'border-slate-200 bg-white'
                  }`}>
                    <button
                      onClick={() => setOpenExchange(openExchange === 'okx' ? 'bybit' : 'okx')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold text-left cursor-pointer hover:bg-slate-800/20"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <span>2. OKX (V5 API with Passphrase)</span>
                      </span>
                      {openExchange === 'okx' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openExchange === 'okx' && (
                      <div className="p-4 border-t border-slate-800/60 font-mono text-xs space-y-2 text-slate-300">
                        <p>1. Masuk ke OKX ➔ Arahkan ke avatar profil ➔ <strong>API Keys</strong>.</p>
                        <p>2. Klik <strong>Create V5 API Key</strong> ➔ Masukkan nama catatan dan buat <em>Passphrase</em> aman.</p>
                        <p>3. Di kolom <em>Permissions</em>, centang <strong>Read</strong> dan <strong>Trade</strong>.</p>
                        <p className="text-rose-400 font-bold">4. JANGAN centang izin "Withdraw". Selesaikan 2FA untuk menyimpan.</p>
                      </div>
                    )}
                  </div>

                  {/* Bybit Accordion */}
                  <div className={`rounded-[2px] border overflow-hidden ${
                    isDark ? 'border-slate-800 bg-[#0a0e1a]' : 'border-slate-200 bg-white'
                  }`}>
                    <button
                      onClick={() => setOpenExchange(openExchange === 'bybit' ? 'binance' : 'bybit')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold text-left cursor-pointer hover:bg-slate-800/20"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                        <span>3. Bybit (Unified Trading Account)</span>
                      </span>
                      {openExchange === 'bybit' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openExchange === 'bybit' && (
                      <div className="p-4 border-t border-slate-800/60 font-mono text-xs space-y-2 text-slate-300">
                        <p>1. Buka Akun Bybit ➔ <strong>API Management</strong> ➔ <strong>Create New Key</strong>.</p>
                        <p>2. Pilih <strong>System-generated API Keys</strong> dengan tipe <em>API Transaction</em>.</p>
                        <p>3. Pilih izin <strong>Read-Write</strong> hanya untuk kategori <em>Orders & Positions</em>.</p>
                        <p className="text-rose-400 font-bold">4. Pastikan opsi Transfer & Withdraw diblokir sepenuhnya.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. CLIENT SECURITY & ENCRYPTION */}
            {activePage === 'client-security' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    client-security.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    {isId ? 'Enkripsi & Proteksi Data AkiraQu' : 'Encryption & Data Protection in AkiraQu'}
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isId
                      ? 'Arsitektur keamanan multi-layer yang melindungi kredensial, sesi peramban, dan data cloud Anda.'
                      : 'Multi-layered security model protecting user credentials, local browser storage, and cloud databases.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-[2px] border ${
                      isDark ? 'bg-[#090d18] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Enkripsi Sisi Klien (Local-First)</span>
                    </div>
                    <p className={`text-xs font-mono leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Kunci API bursa disimpan secara lokal di memori peramban Anda. Server tidak pernah menyimpan rahasia Anda dalam format teks terbuka (*plain text*).
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border ${
                      isDark ? 'bg-[#090d18] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-xs mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Blokir Penarikan Tingkat Gateway</span>
                    </div>
                    <p className={`text-xs font-mono leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Lapisan proxy REST dan CCXT AkiraQu diprogram secara permanen untuk menolak pemanggilan fungsi seperti <code className="text-rose-300">withdraw()</code> atau <code className="text-rose-300">transfer()</code>.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border ${
                      isDark ? 'bg-[#090d18] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sky-400 font-bold font-mono text-xs mb-2">
                      <Lock className="w-4 h-4" />
                      <span>Enkripsi TLS 1.3 / HTTPS</span>
                    </div>
                    <p className={`text-xs font-mono leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Semua pertukaran data harga, order flow, dan autentikasi melewati kanal terenkripsi standar industri TLS 1.3 dengan sertifikasi SSL global.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-[2px] border ${
                      isDark ? 'bg-[#090d18] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-indigo-400 font-bold font-mono text-xs mb-2">
                      <Database className="w-4 h-4" />
                      <span>Isolasi Firestore RBAC</span>
                    </div>
                    <p className={`text-xs font-mono leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Aturan keamanan Firestore (<code className="text-pink-300">firestore.rules</code>) mengunci jurnal dan data hanya untuk identitas pengguna yang terverifikasi via Google Auth.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. 12 TERMINAL NAVIGATION PAGES (DETAILED STAGE GUIDES) */}
            {activePage === 'chart-analytics' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/chart-analytics.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    01. Grafik Utama & Indikator Kuantitatif
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Kanvas candlestick multi-timeframe berkecepatan tinggi dengan kalkulasi 10 indikator mandiri dan agregasi harga multi-bursa.
                  </p>
                </div>

                <div className={`p-4 rounded-[2px] border space-y-3 font-mono text-xs ${
                  isDark ? 'bg-[#090e1b] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <h3 className="text-sm font-bold text-pink-400">Kemampuan Utama:</h3>
                  <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
                    <li>Rendering candlestick 60 FPS menggunakan Lightweight Charts & HTML5 Canvas.</li>
                    <li>Indikator SuperTrend (10, 3.0) dengan penanda sinyal tren hijau/merah dinamis.</li>
                    <li>EMA Cloud (20, 50, 100, 200) untuk konfirmasi tren jangka pendek hingga jangka panjang.</li>
                    <li>Visualisasi Order Flow CVD (Cumulative Volume Delta) untuk mendeteksi agresi pembeli vs penjual.</li>
                    <li>Tampilan multi-timeframe: 1m, 5m, 15m, 1h, 4h, 1D.</li>
                  </ul>
                </div>

                <button
                  onClick={() => onNavigateToTerminal('ticker')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Tahap 01 di Layar Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'scanner' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/scanner.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    02. Screener Pasar 900+ Koin Real-Time
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Penyaring pasar otomatis yang memindai lonjakan volume, anomali volatilitas, dan momentum RSI di ratusan aset kripto.
                  </p>
                </div>
                <div className={`p-4 rounded-[2px] border space-y-3 font-mono text-xs ${
                  isDark ? 'bg-[#090e1b] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <p>• Filter instan berdasarkan perubahan harga 24 jam (Top Gainers & Top Losers).</p>
                  <p>• Deteksi koin dengan RSI jenuh jual (&lt;30) atau jenuh beli (&gt;70).</p>
                  <p>• Klik pada koin mana pun untuk langsung membuka grafik analitiknya.</p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('scanner')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Screener Pasar di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'order-flow' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/order-book-flow.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    03. Order Flow & Likuiditas Heatmap
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Pemantauan mendalam terhadap buku pesanan (Order Book depth), likuiditas dinding beli/jual, dan Cumulative Volume Delta.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('orderflow')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Order Flow di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'macro-heatmap' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/macro-heatmap.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    04. Makro Heatmap & Korelasi Pasar
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Peta panas korelasi Bitcoin terhadap indeks dolar (DXY), dominasi pasar (BTC.D), dan likuiditas makro global.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('market_heatmap')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Makro Heatmap di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'arbitrage' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/multi-exchange.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    05. Arbitrase Multi-Bursa Real-Time
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Mendeteksi perbedaan spread harga koin yang sama antara Binance, OKX, Bybit, KuCoin, dan Bitget secara simultan.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('multi_exchange')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Arbitrase di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'strategy-matrix' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/strategy-matrix.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    06. Matriks Konfluensi Strategi
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Menggabungkan sinyal dari berbagai indikator teknikal menjadi skor konfluensi tunggal (0-100) dengan probabilitas teruji.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('confluence')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Matriks Strategi di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'backtest-lab' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/backtest-lab.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    07. Backtest Lab Kuantitatif
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Menguji strategi perdagangan Anda pada data historis dengan metrik institusional: Win Rate, Sharpe Ratio, Profit Factor, dan Maximum Drawdown.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('backtest')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Backtest Lab di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'signal-output' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/signal-output.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    08. Laporan Sinyal & Analisis
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Menampilkan rekomendasi sinyal terstruktur (BUY/SELL), level entri ideal, target take-profit bertahap, dan rasio Risk/Reward.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('output')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Laporan Sinyal di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'risk-management' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/risk-management.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    09. Manajemen Risiko & Kalkulator Posisi
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Kalkulator ukuran posisi otomatis (*position sizing*), simulasi DCA (Dollar-Cost Averaging), dan proteksi drawdown modal.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('risk')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Manajemen Risiko di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'trading-bots' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/trading-bots.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    10. Trading Bots & Automasi Eksekusi
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Pusat automasi bot trading: Grid Trading, DCA Bots, dan integrasi webhook sinyal kuantitatif terstruktur.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('bot')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Trading Bots di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'trading-journal' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/trading-journal.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    11. Jurnal Trading Cloud & Psikologi
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Pencatatan riwayat trading otomatis dengan evaluasi emosi psikologis (Disiplin, FOMO, Balas Dendam) yang tersinkronisasi via Firestore.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('journal')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Jurnal Trading di Terminal</span>
                </button>
              </div>
            )}

            {activePage === 'system-settings' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    features/settings.mdx
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    12. Pengaturan Sistem & 5 Tema Visual
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Konfigurasi engine visual (Cyber Dark, Bloomberg Amber, Minimal Light, OLED Black, Neon Pink), preferensi bahasa, dan audit latensi feed.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTerminal('settings')}
                  className="flex items-center gap-2 py-2 px-4 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Buka Pengaturan di Terminal</span>
                </button>
              </div>
            )}

            {/* 6. MINTLIFY CONFIGURATION */}
            {activePage === 'mintlify-config' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
                    mintlify.json
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                    Spesifikasi Konfigurasi Mintlify
                  </h1>
                  <p className={`mt-2 text-sm font-mono leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    File konfigurasi resmi framework Mintlify untuk membangun portal dokumentasi modern dengan tema warna dan hierarki navigasi AkiraQu.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">File target: <code className="text-pink-400">mintlify.json</code></span>
                  <button
                    onClick={() => handleCopy(mintlifyConfigString, 'mintlify-code')}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    {copiedKey === 'mintlify-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'mintlify-code' ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>
                </div>

                <div className="relative rounded-[2px] overflow-hidden border border-slate-800 bg-[#060a13]">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0b101c] border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <span>mintlify.json</span>
                    <span className="text-pink-400">JSON Schema Validated</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                    {mintlifyConfigString}
                  </pre>
                </div>

                <div
                  className={`p-4 rounded-[2px] border font-mono text-xs space-y-1.5 ${
                    isDark ? 'bg-[#090d18] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <strong className="text-pink-400">Instruksi Menjalankan Mintlify:</strong>
                  <p>1. Jalankan perintah: <code className="text-emerald-400">npm i -g mintlify</code></p>
                  <p>2. Jalankan server pratinjau: <code className="text-emerald-400">mintlify dev</code></p>
                  <p>3. Portal dokumentasi otomatis online dan tersinkronisasi dengan repositori GitHub.</p>
                </div>
              </div>
            )}
          </div>

          {/* ARTICLE PAGINATION (PREVIOUS / NEXT) */}
          <div className="mt-12 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono">
            {prevPage ? (
              <button
                onClick={() => setActivePage(prevPage.id)}
                className={`flex-1 p-3 rounded-[2px] border text-left transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#0a0f1c] border-slate-800 hover:border-pink-500/50 hover:bg-[#0d1424]'
                    : 'bg-white border-slate-200 hover:border-pink-300'
                }`}
              >
                <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
                  <ArrowLeft className="w-3 h-3" />
                  <span>Sebelumnya</span>
                </span>
                <span className="block text-xs font-bold text-slate-200 mt-1">
                  {isId ? prevPage.title : prevPage.titleEn}
                </span>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextPage && (
              <button
                onClick={() => setActivePage(nextPage.id)}
                className={`flex-1 p-3 rounded-[2px] border text-right transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#0a0f1c] border-slate-800 hover:border-pink-500/50 hover:bg-[#0d1424]'
                    : 'bg-white border-slate-200 hover:border-pink-300'
                }`}
              >
                <span className="flex items-center justify-end gap-1 text-[10px] text-slate-400 uppercase">
                  <span>Selanjutnya</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
                <span className="block text-xs font-bold text-pink-400 mt-1">
                  {isId ? nextPage.title : nextPage.titleEn}
                </span>
              </button>
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR (TABLE OF CONTENTS / ON THIS PAGE) */}
        <aside className="hidden xl:block w-60 shrink-0 sticky top-21 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar font-mono text-xs">
          <div className="p-3.5 rounded-[2px] border space-y-4 bg-transparent border-slate-800/40">
            <div>
              <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Di Halaman Ini</span>
              </h5>
              <div className="space-y-1.5 text-slate-400">
                <a href="#overview" className="block hover:text-pink-400 transition-colors">
                  • Ringkasan Dokumen
                </a>
                <a href="#features" className="block hover:text-pink-400 transition-colors">
                  • Fitur Utama
                </a>
                <a href="#security" className="block hover:text-pink-400 transition-colors">
                  • Keamanan & Izin
                </a>
                <a href="#integration" className="block hover:text-pink-400 transition-colors">
                  • Integrasi Terminal
                </a>
              </div>
            </div>

            <div className={`p-3 rounded-[2px] border space-y-2 ${
              isDark ? 'bg-[#090e1c] border-pink-500/20' : 'bg-pink-50/50 border-pink-200'
            }`}>
              <div className="flex items-center gap-1 text-pink-400 font-bold text-[11px]">
                <Sparkles className="w-3 h-3" />
                <span>Uji Coba Langsung</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ingin mencoba fitur ini langsung di grafik kuantitatif?
              </p>
              <button
                onClick={() => onNavigateToTerminal()}
                className="w-full py-1.5 px-2.5 rounded-[2px] bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                Buka Terminal Sekarang
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. FOOTER */}
      <footer
        className={`border-t py-6 transition-colors ${
          isDark ? 'bg-[#050810] border-[#182234] text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AkiraQuLogo size={16} theme={theme} variant="symbol" />
            <span>AkiraQu Quantitative Terminal Documentation • Powered by Mintlify</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onNavigateToLanding} className="hover:text-pink-400 transition-colors">
              Landing Page
            </button>
            <button onClick={() => onNavigateToTerminal()} className="hover:text-pink-400 transition-colors">
              Dasbor Terminal
            </button>
            <a href="https://vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
              vercel.app
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
