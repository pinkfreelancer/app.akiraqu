import React from 'react';
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
  Filter,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Zap,
  Compass,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  HelpCircle,
  Radio,
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

interface NavGroup {
  groupName: string;
  icon: React.ElementType;
  items: {
    id: StageId;
    stepNumber: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[];
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

  const navGroups: NavGroup[] = [
    {
      groupName: isId ? 'Pasar & Data' : 'Market & Data',
      icon: Compass,
      items: [
        {
          id: 'ticker',
          stepNumber: '01',
          label: isId ? 'Grafik Utama' : 'Main Chart',
          icon: CandlestickChart,
        },
        {
          id: 'signal',
          stepNumber: '02',
          label: isId ? 'Sinyal Trading' : 'Trading Signals',
          icon: Radio,
          badge: 'LIVE',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'screening',
          stepNumber: '03',
          label: isId ? 'Penyaring Koin' : 'Market Screener',
          icon: BarChart3,
          badge: 'Filter',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
        {
          id: 'watchlist',
          stepNumber: '04',
          label: isId ? 'Watchlist Favorit' : 'Watchlist',
          icon: Star,
        },
        {
          id: 'orderflow',
          stepNumber: '05',
          label: isId ? 'Order Flow & Liq' : 'Order Flow & Liq',
          icon: Flame,
        },
        {
          id: 'sentiment',
          stepNumber: '06',
          label: isId ? 'Berita & Sentimen' : 'News & Sentiment',
          icon: Newspaper,
          badge: isId ? 'Alert' : 'Alert',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
    {
      groupName: isId ? 'Analisis Kuantitatif' : 'Quantitative Analysis',
      icon: Activity,
      items: [
        {
          id: 'indicators',
          stepNumber: '07',
          label: isId ? '12 Indikator' : '12 Indicators',
          icon: Layers,
        },
        {
          id: 'confluence',
          stepNumber: '08',
          label: isId ? 'Skor Konfluensi' : 'Confluence Score',
          icon: Gauge,
          badge: confluenceScore !== undefined ? `${confluenceScore}/100` : undefined,
          badgeColor:
            confluenceScore && confluenceScore >= 70
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : confluenceScore && confluenceScore <= 40
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        },
        {
          id: 'backtest',
          stepNumber: '09',
          label: isId ? 'Backtest Lab' : 'Backtest Lab',
          icon: FlaskConical,
        },
        {
          id: 'output',
          stepNumber: '10',
          label: isId ? 'Laporan AI' : 'Signal Report',
          icon: FileText,
          badge: 'AI',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
      ],
    },
    {
      groupName: isId ? 'Trading & Eksekusi' : 'Trading & Execution',
      icon: Zap,
      items: [
        {
          id: 'manual_trading',
          stepNumber: '11',
          label: isId ? 'Trading Manual' : 'Manual Trading',
          icon: Zap,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'bot',
          stepNumber: '12',
          label: isId ? 'Trading Bot' : 'Trading Bot',
          icon: Bot,
        },
        {
          id: 'journal',
          stepNumber: '13',
          label: isId ? 'Jurnal Trading' : 'Trading Journal',
          icon: BookOpen,
        },
        {
          id: 'portfolio',
          stepNumber: '14',
          label: isId ? 'Portofolio' : 'Portfolio',
          icon: Wallet,
        },
        {
          id: 'reports',
          stepNumber: '15',
          label: isId ? 'Laporan Kinerja' : 'Reports & Audit',
          icon: FileText,
          badge: 'CSV',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
        {
          id: 'risk',
          stepNumber: '16',
          label: isId ? 'Kalkulator Risiko' : 'Risk Management',
          icon: ShieldCheck,
        },
        {
          id: 'settings',
          stepNumber: '17',
          label: isId ? 'Pengaturan' : 'Settings',
          icon: Sliders,
        },
      ],
    },
  ];

  return (
    <aside
      id="terminal-sidebar"
      className={`relative shrink-0 flex flex-col transition-all duration-250 ease-in-out z-30 select-none ${
        isOpen ? 'w-60 lg:w-64' : 'w-14 lg:w-16'
      } ${
        isDark
          ? 'bg-[#090d16] border-r border-[#1e293b] text-slate-300'
          : 'bg-white border-r border-slate-200 text-slate-700'
      }`}
    >
      {/* Sidebar Header: Brand / Minimize Toggle */}
      <div
        className={`flex items-center justify-between px-3 py-3 border-b ${
          isDark ? 'border-[#1e293b]/80' : 'border-slate-100'
        }`}
      >
        {isOpen ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span
              className={`text-xs font-semibold tracking-tight truncate ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {isId ? 'Navigasi Terminal' : 'Terminal Navigation'}
            </span>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        )}

        <button
          onClick={onToggleOpen}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#0f172a] hover:bg-slate-800 border-[#1e293b] text-slate-400 hover:text-white'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title={isOpen ? (isId ? 'Sembunyikan Sidebar' : 'Collapse Sidebar') : (isId ? 'Buka Sidebar' : 'Expand Sidebar')}
          aria-label="Toggle Sidebar"
        >
          {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {navGroups.map((group) => {
          return (
            <div key={group.groupName} className="space-y-1">
              {isOpen && (
                <div className="px-2.5 py-1 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <group.icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{group.groupName}</span>
                </div>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = currentStage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectStage(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer group relative ${
                        isActive
                          ? isDark
                            ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs'
                            : 'bg-slate-100 text-slate-900 font-semibold border border-slate-300 shadow-xs'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                      }`}
                      title={!isOpen ? item.label : undefined}
                    >
                      {/* Active Indicator Bar on left when active */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-cyan-500" />
                      )}

                      <div
                        className={`shrink-0 p-1.5 rounded-md transition-colors ${
                          isActive
                            ? isDark
                              ? 'bg-slate-700 text-white'
                              : 'bg-white text-slate-900 border border-slate-200'
                            : isDark
                            ? 'bg-[#0f172a] text-slate-400 group-hover:text-slate-200'
                            : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                      </div>

                      {isOpen && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate text-left">{item.label}</span>

                          {item.badge && (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-medium border shrink-0 ml-1.5 ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer: Market Pulse & Status */}
      <div
        className={`p-2.5 border-t ${
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
                    : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {marketBias === 'BULLISH' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span className="font-bold">Bias: {marketBias}</span>
                </div>
                {confluenceScore !== undefined && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-black/40 text-slate-200">
                    {confluenceScore}%
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="capitalize">{wsStatus}</span>
              </div>
              <span className="font-mono">{latencyMs}ms</span>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-2 py-1 cursor-pointer"
            title={`Live Feed: ${wsStatus} (${latencyMs}ms)`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
