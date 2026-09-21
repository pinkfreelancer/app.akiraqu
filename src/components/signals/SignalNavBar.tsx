import React from 'react';
import {
  Radio,
  Award,
  BookOpen,
  LineChart,
  FileCode2,
  TrendingUp,
  CreditCard,
  Headphones,
  Bell,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

export type SignalNavTab =
  | 'SINYAL'
  | 'KINERJA'
  | 'ANALISIS_LANGSUNG'
  | 'BELAJAR'
  | 'METODOLOGI'
  | 'WAWASAN'
  | 'HARGA'
  | 'KONTAK';

interface SignalNavBarProps {
  activeTab: SignalNavTab;
  onSelectTab: (tab: SignalNavTab) => void;
  isDark: boolean;
  lang: Language;
  activeSignalCount: number;
  winRate: number;
  soundAlerts: boolean;
  onToggleSoundAlerts: () => void;
  onOpenAlertCenter: () => void;
  unreadAlertCount: number;
  onOpenTelegramModal: () => void;
}

export const SignalNavBar: React.FC<SignalNavBarProps> = ({
  activeTab,
  onSelectTab,
  isDark,
  lang,
  activeSignalCount,
  winRate,
  soundAlerts,
  onToggleSoundAlerts,
  onOpenAlertCenter,
  unreadAlertCount,
  onOpenTelegramModal,
}) => {
  const isId = lang === 'id';

  const productTabs: { id: SignalNavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; badgeColor?: string }[] = [
    {
      id: 'SINYAL',
      label: isId ? 'Sinyal' : 'Signals',
      icon: Radio,
      badge: `${activeSignalCount} Live`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'KINERJA',
      label: isId ? 'Kinerja' : 'Performance',
      icon: Award,
      badge: `${winRate}% Win`,
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    },
    {
      id: 'ANALISIS_LANGSUNG',
      label: isId ? 'Analisis Langsung' : 'Live Analysis',
      icon: LineChart,
    },
    {
      id: 'BELAJAR',
      label: isId ? 'Belajar' : 'Learn',
      icon: BookOpen,
    },
  ];

  const sectionLinks: { id: SignalNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'METODOLOGI',
      label: isId ? 'Metodologi' : 'Methodology',
      icon: FileCode2,
    },
    {
      id: 'WAWASAN',
      label: isId ? 'Wawasan' : 'Insights',
      icon: TrendingUp,
    },
    {
      id: 'HARGA',
      label: isId ? 'Harga' : 'Pricing',
      icon: CreditCard,
    },
    {
      id: 'KONTAK',
      label: isId ? 'Kontak' : 'Contact',
      icon: Headphones,
    },
  ];

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl border space-y-3 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Brand & Mode Identifier */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 relative shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isId ? 'Sinyal Trading Real-Time' : 'Real-Time Trading Signals'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                AKIRAQU QUANT
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              {isId
                ? 'Model Alpha, Gamma, Classic & Inv dengan verifikasi 8-level Take-Profit & Trailing Stop'
                : 'Alpha, Gamma, Classic & Inv models with 8-level Take-Profit & Trailing Stop verification'}
            </p>
          </div>
        </div>

        {/* Action Controls: Sound Alert, Unified Notification Center, Webhook */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            type="button"
            onClick={onToggleSoundAlerts}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundAlerts
                ? 'bg-pink-500/15 border-pink-500/30 text-pink-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={soundAlerts ? (isId ? 'Audio alert aktif' : 'Sound active') : (isId ? 'Audio alert senyap' : 'Muted')}
          >
            {soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenAlertCenter}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 font-mono text-xs font-semibold transition cursor-pointer"
            title={isId ? 'Pusat Notifikasi Alert' : 'Alert Notification Center'}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isId ? 'Alert' : 'Alerts'}</span>
            {unreadAlertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {unreadAlertCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTelegramModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telegram Webhook</span>
            <span className="sm:hidden">VIP</span>
          </button>
        </div>
      </div>

      {/* Navigation Bars: Produk vs Section Links */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        {/* Main Product Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono text-xs">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mr-1 shrink-0 hidden md:inline">
            {isId ? 'Produk:' : 'Product:'}
          </span>
          {productTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-pink-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-semibold border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section Links: Metodologi, Wawasan, Harga, Kontak */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono text-xs border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-800/60">
          {sectionLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onSelectTab(link.id)}
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
