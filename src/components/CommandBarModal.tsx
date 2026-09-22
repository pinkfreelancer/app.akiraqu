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
  lang = 'id',
  theme = 'dark',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
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
    onClose,
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Default: show top recommended actions, workspaces, timeframes, and top 8 symbols
      return allCommands.slice(0, 18);
    }

    const q = query.toLowerCase().trim();
    return allCommands
      .filter((cmd) => {
        return (
          cmd.title.toLowerCase().includes(q) ||
          (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
          cmd.type.toLowerCase().includes(q) ||
          (cmd.badge && cmd.badge.toLowerCase().includes(q))
        );
      })
      .slice(0, 24);
  }, [allCommands, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 ${
          isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Search Input Bar */}
        <div
          className={`flex items-center gap-3 px-4 py-3.5 border-b ${
            isDark ? 'border-[#1e293b] bg-[#090d16]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold shrink-0">
            &gt;_
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              lang === 'id'
                ? 'Ketik nama koin (BTC, ETH), stage (/risk, /scan), timeframe (15m, 1h), atau tindakan...'
                : 'Type pair (BTC, ETH), stage (/risk, /scan), timeframe (15m, 1h), or command...'
            }
            className={`w-full bg-transparent text-sm font-mono placeholder-slate-500 focus:outline-hidden ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          />
          <kbd
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider shrink-0 ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
            }`}
          >
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-transparent font-mono text-xs">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
              <p>{lang === 'id' ? 'Tidak ada perintah atau simbol yang cocok' : 'No matching command or symbol found'}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                {lang === 'id' ? 'Coba cari "BTC", "Multi-Panel", "1H", atau "Risk"' : 'Try searching "BTC", "Multi-Panel", "1H", or "Risk"'}
              </p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;

              return (
                <div
                  key={cmd.id}
                  data-index={idx}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? isDark
                        ? 'bg-cyan-500/15 text-white border border-cyan-500/30'
                        : 'bg-cyan-50 text-cyan-900 border border-cyan-200'
                      : isDark
                      ? 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                      : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-1.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : isDark
                          ? 'bg-slate-800 text-cyan-400'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">{cmd.title}</span>
                        {cmd.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                              cmd.badge === 'AKTIF'
                                ? isDark
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : cmd.badge.startsWith('+')
                                ? isDark
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-emerald-100 text-emerald-800'
                                : cmd.badge.startsWith('-')
                                ? isDark
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-rose-100 text-rose-800'
                                : isDark
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p className={`text-[11px] truncate mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>{cmd.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd
                        className={`px-1.5 py-0.5 rounded text-[10px] border ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-cyan-300'
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Keys */}
        <div
          className={`flex items-center justify-between px-4 py-2 border-t text-[11px] font-mono ${
            isDark ? 'border-[#1e293b] bg-[#090d16] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 bg-slate-800 text-slate-300 rounded mr-1">↑↓</kbd> Navigasi
            </span>
            <span>
              <kbd className="px-1 bg-slate-800 text-slate-300 rounded mr-1">↵</kbd> Eksekusi
            </span>
          </div>
          <span className="text-cyan-400 font-semibold">{lang === 'id' ? 'Pencarian & Perintah Cepat • Meja Kerja Trading' : 'Quick Search & Commands • Trading Workspace'}</span>
        </div>
      </div>
    </div>
  );
};
