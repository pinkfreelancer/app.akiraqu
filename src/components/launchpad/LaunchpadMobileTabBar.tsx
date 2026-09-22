import React from 'react';
import {
  CandlestickChart,
  Gauge,
  Flame,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

export type MobileTabKey = 'chart' | 'confluence' | 'liquidity' | 'risk';

interface LaunchpadMobileTabBarProps {
  activeTab: MobileTabKey;
  onSelectTab: (tab: MobileTabKey) => void;
  confluenceScore?: number;
  marketBias?: string;
  isDark?: boolean;
  lang?: Language;
}

export const LaunchpadMobileTabBar: React.FC<LaunchpadMobileTabBarProps> = ({
  activeTab,
  onSelectTab,
  confluenceScore,
  marketBias,
  isDark = true,
  lang = 'id',
}) => {
  const isId = lang === 'id';

  const tabs: {
    id: MobileTabKey;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'chart',
      label: isId ? 'Grafik' : 'Chart',
      sublabel: 'L1/L2 Live',
      icon: CandlestickChart,
    },
    {
      id: 'confluence',
      label: isId ? 'Konfluensi' : 'Confluence',
      sublabel: confluenceScore !== undefined ? `${confluenceScore}/100` : '12-Ind',
      icon: Gauge,
      badge: confluenceScore !== undefined ? `${confluenceScore}` : undefined,
      badgeColor:
        (confluenceScore || 0) >= 65
          ? 'bg-emerald-500 text-slate-950'
          : (confluenceScore || 0) <= 35
          ? 'bg-rose-500 text-white'
          : 'bg-amber-500 text-slate-950',
    },
    {
      id: 'liquidity',
      label: isId ? 'Likuiditas' : 'Liquidity',
      sublabel: 'Heatmap',
      icon: Flame,
    },
    {
      id: 'risk',
      label: isId ? 'Risiko & Order' : 'Risk & Trade',
      sublabel: isId ? 'Eksekusi' : 'Execute',
      icon: ShieldCheck,
    },
  ];

  return (
    <div
      className={`lg:hidden w-full p-1.5 rounded-2xl border mb-3 flex items-center justify-between gap-1 select-none ${
        isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-100 border-slate-300'
      }`}
    >
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            className={`flex-1 min-h-[46px] py-1.5 px-1 rounded-xl font-mono text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
              isActive
                ? isDark
                  ? 'bg-gradient-to-b from-cyan-500/25 to-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-white text-cyan-900 border border-cyan-400 shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
          >
            <div className="flex items-center gap-1">
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="text-xs font-bold">{t.label}</span>
              {t.badge && (
                <span
                  className={`px-1 py-0.2 rounded-full text-[9px] font-extrabold ${t.badgeColor}`}
                >
                  {t.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] font-medium tracking-tight truncate max-w-[85px] ${
                isActive
                  ? isDark
                    ? 'text-cyan-400'
                    : 'text-cyan-700'
                  : 'text-slate-500'
              }`}
            >
              {t.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
