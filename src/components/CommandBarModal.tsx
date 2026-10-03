import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Command,
  ArrowRight,
  CandlestickChart,
  Flame,
  Layers,
  Gauge,
  ShieldCheck,
  BookOpen,
  Wallet,
  Bot,
  FlaskConical,
  FileText,
  Clock,
  Radio,
  Sliders,
  Moon,
  Sun,
  Maximize,
  Download,
  HelpCircle,
  LayoutGrid,
  Zap,
  Star,
  BarChart3,
} from 'lucide-react';
import { CryptoSymbolInfo, Timeframe, SupportedExchange, MarketType, StageId } from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';
import { ModalWrapper } from './ui/ModalWrapper';

interface CommandItem {
  id: string;
  type: 'symbol' | 'stage' | 'timeframe' | 'exchange' | 'workspace' | 'action';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

interface CommandBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: CryptoSymbolInfo[];
  selectedSymbol: string;
  selectedTimeframe: Timeframe;
  selectedExchange: SupportedExchange;
  workspaceMode: 'classic' | 'split' | 'launchpad';
  onSelectSymbol: (sym: string) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
  onSelectExchange: (ex: SupportedExchange) => void;
  onSelectStage: (stage: StageId) => void;
  onSelectWorkspaceMode: (mode: 'classic' | 'split' | 'launchpad') => void;
  onToggleFullscreen: () => void;
  onToggleTheme: () => void;
  onOpenExportModal: () => void;
  onOpenAssuranceModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenDocsModal?: () => void;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const CommandBarModal: React.FC<CommandBarModalProps> = ({
  isOpen,
  onClose,
  symbols,
  selectedSymbol,
  selectedTimeframe,
  selectedExchange,
  workspaceMode,
  onSelectSymbol,
  onSelectTimeframe,
  onSelectExchange,
  onSelectStage,
  onSelectWorkspaceMode,
  onToggleFullscreen,
  onToggleTheme,
  onOpenExportModal,
  onOpenAssuranceModal,
  onOpenShortcutsModal,
  onOpenDocsModal,
  lang = 'id',
  theme = 'dark',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'stage' | 'symbol' | 'timeframe' | 'exchange' | 'action'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setSelectedCategory('ALL');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command catalogue
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // 1. Workspace Layout Options
    list.push({
      id: 'ws-split',
      type: 'workspace',
      title: lang === 'id' ? 'Tata Letak Split (Master Chart + Modul)' : 'Split Layout (Master Chart + Module)',
      subtitle: lang === 'id' ? 'Chart tetap terpaku di kiri, modul aktif di kanan' : 'Anchor chart pinned left, active module right',
      badge: workspaceMode === 'split' ? 'AKTIF' : undefined,
      icon: LayoutGrid,
      action: () => {
        onSelectWorkspaceMode('split');
        onClose();
      },
    });

    list.push({
      id: 'ws-launchpad',
      type: 'workspace',
      title: lang === 'id' ? 'Meja Kerja Multi-Panel (Trading Desk)' : 'Multi-Panel Workspace (Trading Desk)',
      subtitle: lang === 'id' ? 'Tampilkan Chart, Confluence, Heatmap & Risk simultan' : 'View Chart, Confluence, Heatmap & Risk simultaneously',
      badge: workspaceMode === 'launchpad' ? 'AKTIF' : 'RECOMMENDED',
      icon: LayoutGrid,
      shortcut: 'W',
      action: () => {
        onSelectWorkspaceMode('launchpad');
        onClose();
      },
    });

    list.push({
      id: 'ws-classic',
      type: 'workspace',
      title: lang === 'id' ? 'Alur Bertahap (Tampilan Standar)' : 'Step-by-Step Flow (Standard)',
      subtitle: lang === 'id' ? 'Alur bertahap 1-layar terstruktur' : 'Structured 1-screen stepped flow',
      badge: workspaceMode === 'classic' ? 'AKTIF' : undefined,
      icon: Layers,
      action: () => {
        onSelectWorkspaceMode('classic');
        onClose();
      },
    });

    // 2. Stage Navigation Items
    const stages: { id: StageId; title: string; subtitle: string; icon: React.ElementType }[] = [
      { id: 'ticker', title: 'Interactive Chart & Live Ticker', subtitle: 'Grafik Lilin, Live Trades & Depth', icon: CandlestickChart },
      { id: 'signal', title: 'Trading Signals (Sinyal Real-time)', subtitle: 'Sinyal AI Confluence, TP/SL, R:R & Filter Koin', icon: Radio },
      { id: 'screening', title: 'Penyaring Pasar (Market Screener)', subtitle: 'Pemindai Multi-faktor RSI, SuperTrend & Funding Rate', icon: BarChart3 },
      { id: 'watchlist', title: 'Watchlist & Multi-Folder Favorit', subtitle: 'Folder Portofolio Pantauan & Price Alerts', icon: Star },
      { id: 'scanner', title: 'Market Overview Scanner', subtitle: 'Pemindai Momentum & Pola Bullish Kuantitatif', icon: Search },
      { id: 'orderflow', title: 'Order Flow & Liquidation Heatmap', subtitle: 'Peta Likuidasi Paus, CVD & MM Trap', icon: Flame },
      { id: 'confluence', title: 'Confluence Radar (12 Indikator)', subtitle: 'Skor Evaluasi Pembobotan Multi-Model', icon: Gauge },
      { id: 'indicators', title: '12 Technical Indicators Bento', subtitle: 'SMC, ICT, VWAP, Ichimoku, Elliott Wave, dll', icon: Layers },
      { id: 'manual_trading', title: 'Trading Manual Execution Terminal', subtitle: 'Eksekusi Order Limit/Market, Leverage, TP/SL & Posisi', icon: Zap },
      { id: 'bot', title: 'Trading Bot Hub (Grid, DCA, AI Signals)', subtitle: 'Automasi Eksekusi & Algoritma Trading', icon: Bot },
      { id: 'journal', title: 'Institutional Trading Journal', subtitle: 'Pencatatan Evaluasi, Win Rate, Psikologi & Mistake Tagging', icon: BookOpen },
      { id: 'portfolio', title: 'Portofolio & Multi-Exchange Assets', subtitle: 'Total Nilai Akun, Distribusi Alokasi Koin & Saldo', icon: Wallet },
      { id: 'reports', title: 'Laporan Kinerja & Audit Performance', subtitle: 'Audit Sharpe, Max Drawdown, Heatmap PnL & Ekspor CSV', icon: FileText },
      { id: 'risk', title: 'Risk Management Calculator', subtitle: 'Perhitungan RRR, Entry, SL, TP1-3 & Position Sizing', icon: ShieldCheck },
      { id: 'backtest', title: 'Quantitative Backtesting Engine', subtitle: 'Uji Coba Historis Strategi & Equity Curve', icon: FlaskConical },
      { id: 'output', title: 'Executive Output Report', subtitle: 'Ringkasan Naratif & JSON Mesin AI', icon: FileText },
    ];

    stages.forEach((st) => {
      list.push({
        id: `stage-${st.id}`,
        type: 'stage',
        title: st.title,
        subtitle: st.subtitle,
        badge: 'STAGE',
        icon: st.icon,
        action: () => {
          onSelectStage(st.id);
          onClose();
        },
      });
    });

    // 3. Timeframe Switching
    const tfOptions: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];
    tfOptions.forEach((tf, idx) => {
      list.push({
        id: `tf-${tf}`,
        type: 'timeframe',
        title: `Timeframe: ${tf}`,
        subtitle: lang === 'id' ? `Ubah interval analisis ke ${tf}` : `Switch analysis interval to ${tf}`,
        badge: selectedTimeframe === tf ? 'AKTIF' : undefined,
        icon: Clock,
        shortcut: String(idx + 1),
        action: () => {
          onSelectTimeframe(tf);
          onClose();
        },
      });
    });

    // 4. Exchange Switching
    const exchanges: { id: SupportedExchange; label: string }[] = [
      { id: 'BINANCE', label: 'Binance Exchange (Global L1/L2)' },
      { id: 'OKX', label: 'OKX Crypto (Futures & Spot)' },
      { id: 'BYBIT', label: 'Bybit Institutional' },
      { id: 'KUCOIN', label: 'KuCoin Spot/Derivatives' },
      { id: 'BITGET', label: 'Bitget Copy & Derivatives' },
      { id: 'CRYPTO_COM', label: 'Crypto.com Global' },
      { id: 'BITUNIX', label: 'Bitunix Derivatives' },
    ];

    exchanges.forEach((ex) => {
      list.push({
        id: `ex-${ex.id}`,
        type: 'exchange',
        title: `Exchange: ${ex.label}`,
        subtitle: lang === 'id' ? `Alihkan sumber data feed ke ${ex.id}` : `Switch market data provider to ${ex.id}`,
        badge: selectedExchange === ex.id ? 'AKTIF' : undefined,
        icon: Radio,
        action: () => {
          onSelectExchange(ex.id);
          onClose();
        },
      });
    });

    // 5. Crypto Coin Symbols
    symbols.forEach((sym) => {
      list.push({
        id: `sym-${sym.symbol}`,
        type: 'symbol',
        title: `${sym.symbol} (${sym.name})`,
        subtitle: `${sym.category} • Vol 24h: ${sym.volume24h}`,
        badge: `${sym.change24h >= 0 ? '+' : ''}${sym.change24h.toFixed(2)}% | $${formatCryptoPrice(sym.basePrice)}`,
        icon: CandlestickChart,
        action: () => {
          onSelectSymbol(sym.symbol);
          onClose();
        },
      });
    });

    // 6. Action Tools
    list.push(
      {
        id: 'act-shortcuts',
        type: 'action',
        title: lang === 'id' ? 'Buka Panduan Pintasan Keyboard (?)' : 'Open Keyboard Shortcuts Guide (?)',
        subtitle: lang === 'id' ? 'Lihat semua hotkeys kecepatan tinggi' : 'View all institutional hotkeys',
        icon: HelpCircle,
        shortcut: '?',
        action: () => {
          onClose();
          onOpenShortcutsModal();
        },
      },
      {
        id: 'act-theme',
        type: 'action',
        title: lang === 'id' ? 'Ganti Tema (Dark / Light)' : 'Toggle Dark / Light Theme',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'act-fullscreen',
        type: 'action',
        title: lang === 'id' ? 'Toggle Layar Penuh (Fullscreen)' : 'Toggle Fullscreen Mode',
        icon: Maximize,
        shortcut: 'F',
        action: () => {
          onToggleFullscreen();
          onClose();
        },
      },
      {
        id: 'act-export',
        type: 'action',
        title: lang === 'id' ? 'Ekspor Data & Analisa (PDF/JSON)' : 'Export Data & Analysis (PDF/JSON)',
        icon: Download,
        action: () => {
          onClose();
          onOpenExportModal();
        },
      },
      {
        id: 'act-assurance',
        type: 'action',
        title: lang === 'id' ? 'Register Jaminan Keamanan & Assurance' : 'Security Assurance Register',
        icon: ShieldCheck,
        action: () => {
          onClose();
          onOpenAssuranceModal();
        },
      },
      {
        id: 'act-docs',
        type: 'action',
        title: lang === 'id' ? 'Buka Dokumentasi & Panduan API (Mintlify)' : 'Open Documentation & API Guide (Mintlify)',
        subtitle: 'introduction.mdx • api-security.mdx • mintlify.json',
        icon: BookOpen,
        shortcut: 'Doc',
        badge: 'MINTLIFY',
        action: () => {
          onClose();
          if (onOpenDocsModal) onOpenDocsModal();
        },
      }
    );

    return list;
  }, [
    symbols,
    selectedSymbol,
    selectedTimeframe,
    selectedExchange,
    workspaceMode,
    lang,
    theme,
    onSelectSymbol,
    onSelectTimeframe,
    onSelectExchange,
    onSelectStage,
    onSelectWorkspaceMode,
    onToggleFullscreen,
    onToggleTheme,
    onOpenExportModal,
    onOpenAssuranceModal,
    onOpenShortcutsModal,
    onOpenDocsModal,
    onClose,
  ]);

  // Filter commands by search query and category
  const filteredCommands = useMemo(() => {
    let pool = allCommands;
    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'action') {
        pool = pool.filter((c) => c.type === 'action' || c.type === 'workspace');
      } else {
        pool = pool.filter((c) => c.type === selectedCategory);
      }
    }

    if (!query.trim()) {
      return pool.slice(0, 28);
    }

    const q = query.toLowerCase().trim();
    return pool
      .filter((cmd) => {
        return (
          cmd.title.toLowerCase().includes(q) ||
          (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
          cmd.type.toLowerCase().includes(q) ||
          (cmd.badge && cmd.badge.toLowerCase().includes(q))
        );
      })
      .slice(0, 30);
  }, [allCommands, query, selectedCategory]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Keyboard navigation inside omnibar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure active element is scrolled into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const activeEl = listEl.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (activeEl) {
      const itemTop = activeEl.offsetTop - listEl.offsetTop;
      const itemBottom = itemTop + activeEl.offsetHeight;
      const containerTop = listEl.scrollTop;
      const containerBottom = containerTop + listEl.clientHeight;

      if (itemTop < containerTop) {
        listEl.scrollTop = itemTop;
      } else if (itemBottom > containerBottom) {
        listEl.scrollTop = itemBottom - listEl.clientHeight;
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const CATEGORY_TABS = [
    { id: 'ALL', label: lang === 'id' ? 'Semua' : 'All' },
    { id: 'stage', label: lang === 'id' ? 'Tahap Modul' : 'Stages' },
    { id: 'symbol', label: lang === 'id' ? 'Koin / Pasangan' : 'Coins / Pairs' },
    { id: 'timeframe', label: 'Timeframe' },
    { id: 'exchange', label: lang === 'id' ? 'Bursa Data' : 'Exchanges' },
    { id: 'action', label: lang === 'id' ? 'Aksi & Layout' : 'Actions & Layout' },
  ];

  const getTypeBadge = (type: CommandItem['type']) => {
    switch (type) {
      case 'stage':
        return { label: 'TAHAP', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'symbol':
        return { label: 'KOIN', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'timeframe':
        return { label: 'TIMEFRAME', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'exchange':
        return { label: 'BURSA', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'workspace':
        return { label: 'LAYOUT', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'action':
        return { label: 'AKSI', cls: 'bg-slate-700/60 text-slate-300 border-slate-600' };
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      role="dialog"
      ariaLabel={lang === 'id' ? 'Kotak Perintah & Pencarian Cepat' : 'Quick Search & Command Bar'}
      maxWidth="max-w-2xl"
      alignTop={false}
      hideCloseButton={true}
      noPadding={true}
      initialFocusRef={inputRef}
      className="border border-cyan-500/40 shadow-2xl shadow-black/95 ring-1 ring-cyan-500/20 bg-[#090d16] text-slate-100"
    >
      {/* Top Header & Search Bar (Fixed at top, High Contrast) */}
      <div className="shrink-0 border-b border-[#1e293b] bg-[#0c1322]">
        {/* Quick Header */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                {lang === 'id' ? 'Kotak Perintah & Navigasi Cepat' : 'Terminal Command Palette'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {lang === 'id' ? 'Akses instan koin, modul, timeframe, bursa & tata letak' : 'Instant access to coins, modules, timeframes & layout'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
              {filteredCommands.length} {lang === 'id' ? 'opsi' : 'options'}
            </span>
            <button
              onClick={onClose}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#090d16]">
          <div className="p-1 rounded bg-pink-500/10 text-pink-400 font-mono text-xs font-bold shrink-0">
            &gt;_
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={filteredCommands.length > 0}
            aria-controls="command-bar-list"
            aria-label={
              lang === 'id'
                ? 'Ketik nama koin, stage, timeframe, atau tindakan'
                : 'Search symbol, stage, timeframe, or command'
            }
            placeholder={
              lang === 'id'
                ? 'Cari koin (BTC, ETH), stage (/risk, /scan), timeframe (15m, 1h), bursa...'
                : 'Search coin (BTC, ETH), stage (/risk, /scan), timeframe (15m, 1h), exchange...'
            }
            className="w-full bg-transparent text-sm font-sans font-medium text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono cursor-pointer shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#080c14] border-t border-slate-800/80 overflow-x-auto scrollbar-none text-xs">
          {CATEGORY_TABS.map((cat) => {
            const isTabActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                  isTabActive
                    ? 'bg-pink-500/25 text-pink-300 border border-pink-500/60 font-bold shadow-xs'
                    : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Command Items List */}
      <div
        id="command-bar-list"
        role="listbox"
        aria-label={lang === 'id' ? 'Daftar Perintah & Hasil Pencarian' : 'Command list & search results'}
        ref={listRef}
        className="flex-1 min-h-0 max-h-[55vh] overflow-y-auto p-2 divide-y divide-slate-800/50 font-mono text-xs"
      >
        {filteredCommands.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 text-pink-400/60" />
            <p className="text-sm font-semibold text-slate-200">
              {lang === 'id' ? 'Tidak ada perintah atau simbol yang cocok' : 'No matching command or symbol found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'id' ? 'Coba cari "BTC", "Multi-Panel", "1H", atau "Risk"' : 'Try searching "BTC", "Multi-Panel", "1H", or "Risk"'}
            </p>
          </div>
        ) : (
          filteredCommands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            const Icon = cmd.icon;
            const typeBadge = getTypeBadge(cmd.type);

            return (
              <div
                key={cmd.id}
                role="option"
                aria-selected={isSelected}
                data-index={idx}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-pink-500/20 text-white border border-pink-400/50 shadow-sm'
                    : 'text-slate-200 border border-transparent hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div
                    className={`p-2 rounded-md shrink-0 border ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-500 font-bold'
                        : 'bg-slate-800/90 text-pink-400 border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white truncate">{cmd.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${typeBadge.cls}`}>
                        {typeBadge.label}
                      </span>
                      {cmd.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                            cmd.badge === 'AKTIF'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : cmd.badge.startsWith('+')
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : cmd.badge.startsWith('-')
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {cmd.badge}
                        </span>
                      )}
                    </div>
                    {cmd.subtitle && (
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {cmd.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {cmd.shortcut && (
                    <kbd className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-pink-300 shadow-xs">
                      {cmd.shortcut}
                    </kbd>
                  )}
                  {isSelected && <ArrowRight className="w-4 h-4 text-pink-400" />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Quick Keys */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-[#1e293b] bg-[#0c1322] text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded mr-1">↑↓</kbd> Navigasi
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded mr-1">↵</kbd> Eksekusi
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded mr-1">ESC</kbd> Tutup
          </span>
        </div>
        <span className="text-pink-400 font-semibold hidden sm:inline">
          {lang === 'id' ? 'Pencarian & Perintah Cepat • AKIRA.QU' : 'Trading Workspace • AKIRA.QU'}
        </span>
      </div>
    </ModalWrapper>
  );
};
