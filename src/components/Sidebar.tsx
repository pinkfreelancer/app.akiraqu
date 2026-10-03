import React, { useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  TrendingDown,
  X,
  CandlestickChart,
  BookOpen,
} from 'lucide-react';
import { StageId, MarketBias } from '../types/market.types';
import { Language } from '../i18n/translations';
import {
  SIDEBAR_NAV_GROUPS,
} from './sidebarConfig';

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
  onOpenDocs?: () => void;
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
  onOpenDocs,
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Compute localized Nav Groups with dynamic badges (e.g. confluence score)
  const navGroups = useMemo(() => {
    return SIDEBAR_NAV_GROUPS.map((group) => {
      const localizedItems = group.items.map((item) => {
        let badge = item.badge;
        let badgeColor = item.badgeColor;

        // Dynamic badge for confluence score
        if (item.id === 'confluence') {
          badge = confluenceScore !== undefined ? `${confluenceScore}/100` : undefined;
          badgeColor =
            confluenceScore && confluenceScore >= 70
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : confluenceScore && confluenceScore <= 40
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-pink-500/15 text-pink-300 border-pink-500/30';
        }

        return {
          id: item.id,
          stepNumber: item.stepNumber,
          label: isId ? item.labelId : item.labelEn,
          icon: item.icon,
          badge,
          badgeColor,
          category: item.category,
        };
      });

      return {
        key: group.key,
        groupName: isId ? group.groupNameId : group.groupNameEn,
        icon: group.icon,
        isSystemDivider: group.isSystemDivider,
        items: localizedItems,
      };
    });
  }, [isId, confluenceScore]);

  // Auto-close drawer on mobile (<768px)
  const handleItemClick = (stageId: StageId) => {
    onSelectStage(stageId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  return (
    <>
      {/* 1. Mobile Backdrop Overlay */}
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
          isOpen
            ? 'fixed inset-y-0 left-0 z-50 w-72 sm:w-80 shadow-2xl md:shadow-none'
            : 'hidden md:flex'
        } ${
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
                    isDark ? 'text-pink-300' : 'text-pink-700'
                  }`}
                >
                  {isId ? 'Navigasi Terminal (17 Alat)' : 'Terminal Navigation (17 Tools)'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isId ? 'Pilih stage analisis' : 'Select analysis stage'}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile Close Button */}
            {isOpen && (
              <button
                type="button"
                onClick={onToggleOpen}
                className={`md:hidden p-1.5 rounded-[2px] border transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-white hover:border-pink-500/40'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-pink-400'
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
              className={`hidden md:flex p-1.5 rounded-[2px] transition-colors cursor-pointer items-center justify-center min-h-[32px] min-w-[32px] ${
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

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((group) => {
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
                    <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-slate-800/60 text-slate-400 font-mono tabular-nums">
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
                          className={`w-10 h-10 mx-auto rounded-[2px] flex items-center justify-center transition-all cursor-pointer relative group ${
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
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] text-xs transition-all cursor-pointer group min-h-[34px] ${
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
                          className={`shrink-0 p-1 rounded-[2px] transition-colors ${
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
                              className={`text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono font-semibold shrink-0 ml-1.5 ${item.badgeColor}`}
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
          })}
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
                  className={`p-2 rounded-[2px] border flex items-center justify-between text-[11px] font-mono ${
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
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-[2px] bg-black/40 text-slate-200 shrink-0 tabular-nums">
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

              {/* Documentation Quick Button */}
              {onOpenDocs && (
                <button
                  type="button"
                  onClick={onOpenDocs}
                  className={`w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-pink-300 hover:border-pink-500/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600 hover:border-pink-400'
                  }`}
                  title={isId ? 'Dokumentasi & Panduan API (Mintlify)' : 'Documentation & API Guide (Mintlify)'}
                >
                  <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                  <span>{isId ? 'Dokumentasi (Doc)' : 'Documentation (Doc)'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {onOpenDocs && (
                <button
                  type="button"
                  onClick={onOpenDocs}
                  className="p-1 rounded-md text-slate-400 hover:text-pink-400 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  title={isId ? 'Dokumentasi (Doc)' : 'Documentation (Doc)'}
                >
                  <BookOpen className="w-4 h-4 text-pink-400" />
                </button>
              )}
              <div
                className="flex flex-col items-center justify-center py-1 cursor-pointer transition-colors hover:bg-slate-800/30 rounded-lg"
                title={`Live Feed: ${wsStatus} (${latencyMs}ms) - Klik untuk membuka sidebar`}
                onClick={onToggleOpen}
              >
                <span className="text-[10px] font-mono text-slate-400 font-bold tracking-tighter">
                  {latencyMs}ms
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
