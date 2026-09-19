import React, { useEffect, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Zap,
  Activity,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../i18n/translations';

export interface FocusableFrameProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'purple' | 'danger' | 'pink';
  isFocused?: boolean;
  onToggleFocus?: () => void;
  onCloseFocus?: () => void;
  quickActions?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
  lang?: Language;
  accountMode?: 'DEMO' | 'REAL';
  marketType?: 'SPOT' | 'FUTURES';
}

export const FocusableFrame: React.FC<FocusableFrameProps> = ({
  id,
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'default',
  isFocused = false,
  onToggleFocus,
  onCloseFocus,
  quickActions,
  headerRight,
  children,
  className = '',
  isDark = true,
  lang = 'id',
  accountMode = 'DEMO',
  marketType = 'SPOT',
}) => {
  const isId = lang === 'id';

  // ESC key listener to exit focus mode
  useEffect(() => {
    if (!isFocused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCloseFocus) {
          onCloseFocus();
        } else if (onToggleFocus) {
          onToggleFocus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, onCloseFocus, onToggleFocus]);

  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'danger':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'pink':
        return 'bg-[#F89DB5]/15 text-[#F89DB5] border-[#F89DB5]/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  const content = (
    <div
      id={`frame-${id}`}
      className={`rounded-2xl border transition-all duration-200 flex flex-col ${
        isFocused
          ? isDark
            ? 'bg-[#2d2d2d] border-[#F89DB5]/40 shadow-2xl shadow-black/80'
            : 'bg-white border-pink-300 shadow-2xl shadow-slate-300/60'
          : isDark
          ? 'bg-[#323232] border-[#484848] hover:border-[#585858] text-slate-100'
          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
      } ${className}`}
    >
      {/* Frame Header Bar */}
      <div
        className={`px-3.5 sm:px-4 py-2.5 sm:py-3 border-b flex flex-wrap items-center justify-between gap-2 select-none ${
          isFocused
            ? isDark
              ? 'bg-[#242424] border-[#484848]'
              : 'bg-pink-50/70 border-pink-100'
            : isDark
            ? 'bg-[#2a2a2a] border-[#484848]'
            : 'bg-slate-50/80 border-slate-200'
        }`}
      >
        {/* Left: Title, Icon, Subtitle, Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div
              className={`p-1.5 rounded-lg border shrink-0 ${
                isDark
                  ? 'bg-[#323232] border-[#484848] text-[#F89DB5]'
                  : 'bg-white border-slate-200 text-pink-600'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-xs sm:text-sm font-bold font-mono tracking-tight truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {title}
              </h3>
              {badge && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${getBadgeStyle()}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick Contextual Actions & Focus Mode Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {quickActions && (
            <div className="flex items-center gap-1">
              {quickActions}
            </div>
          )}

          {headerRight}

          {/* Focus Mode Maximize/Minimize Button */}
          {onToggleFocus && (
            <button
              onClick={onToggleFocus}
              className={`p-1.5 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1 ${
                isFocused
                  ? isDark
                    ? 'bg-[#F89DB5]/20 border-[#F89DB5]/40 text-[#F89DB5] hover:bg-[#F89DB5]/30'
                    : 'bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200'
                  : isDark
                  ? 'bg-[#323232] border-[#484848] text-slate-300 hover:text-white hover:border-[#606060]'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isFocused ? (isId ? 'Kembali ke Tampilan Grid (ESC)' : 'Restore to Grid View (ESC)') : (isId ? 'Perbesar Mode Fokus (Drill-Down)' : 'Focus Mode / Maximize')}
              aria-label={isFocused ? 'Restore Grid' : 'Maximize Frame'}
            >
              {isFocused ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] font-bold uppercase">{isId ? 'Grid' : 'Restore'}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] font-bold uppercase">{isId ? 'Fokus' : 'Focus'}</span>
                </>
              )}
            </button>
          )}

          {/* Close button in focused mode */}
          {isFocused && (onCloseFocus || onToggleFocus) && (
            <button
              onClick={onCloseFocus || onToggleFocus}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isDark
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}
              title={isId ? 'Tutup Mode Fokus (ESC)' : 'Exit Focus Mode (ESC)'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Frame Body Content */}
      <div className="flex-1 p-3.5 sm:p-4 min-w-0">
        {children}
      </div>
    </div>
  );

  // If focused, render as an immersive focus overlay modal
  if (isFocused) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 lg:p-8 flex flex-col">
        {/* Focused Top Return Bar */}
        <div className="max-w-7xl w-full mx-auto mb-3 flex items-center justify-between">
          <button
            onClick={onCloseFocus || onToggleFocus}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#242424] border-[#484848] text-slate-200 hover:border-[#F89DB5] hover:text-[#F89DB5]'
                : 'bg-white border-slate-200 text-slate-800 hover:border-pink-500 hover:text-pink-600 shadow-md'
            }`}
          >
            ← {isId ? 'Kembali ke Dasbor Multi-Frame (Tekan ESC)' : 'Return to Multi-Frame Grid (Press ESC)'}
          </button>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${
              accountMode === 'DEMO'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}>
              {accountMode === 'DEMO' ? '[DEMO ENVIRONMENT]' : '[LIVE REAL ACCOUNT]'}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${
              marketType === 'FUTURES'
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
            }`}>
              {marketType === 'FUTURES' ? 'FUTURES DERIVATIVES' : 'SPOT MARKET'}
            </span>
          </div>
        </div>

        {/* Focused Modal Frame */}
        <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
