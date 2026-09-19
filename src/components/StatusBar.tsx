import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Gauge,
  Sliders,
  Maximize,
  Minimize,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { MarketType, SupportedExchange, ConfluenceEvaluation } from '../types/crypto.types';
import { formatCryptoPrice } from '../utils/formatters';

interface StatusBarProps {
  accountMode: 'DEMO' | 'REAL';
  onToggleAccountMode?: () => void;
  demoBalance: number;
  marketType: MarketType;
  onSelectMarketType?: (marketType: MarketType) => void;
  selectedExchange: SupportedExchange;
  selectedSymbol: string;
  livePrice?: number | null;
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  latencyMs?: number;
  evaluation?: ConfluenceEvaluation | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenShortcuts?: () => void;
  onOpenGridCustomizer?: () => void;
  lang?: Language;
  theme?: 'dark' | 'light';
}

export const StatusBar: React.FC<StatusBarProps> = ({
  accountMode,
  onToggleAccountMode,
  demoBalance,
  marketType,
  onSelectMarketType,
  selectedExchange,
  selectedSymbol,
  livePrice,
  wsStatus = 'connected',
  latencyMs = 18,
  evaluation,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenShortcuts,
  onOpenGridCustomizer,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Live clocks: UTC and WIB (UTC+7)
  const [timeUtc, setTimeUtc] = useState('');
  const [timeWib, setTimeWib] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setTimeWib(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      id="terminal-status-bar"
      className={`shrink-0 z-30 border-t py-1.5 px-3 sm:px-4 lg:px-6 text-[11px] font-mono select-none flex flex-wrap items-center justify-between gap-2 transition-colors duration-200 ${
        isDark ? 'bg-[#242424] border-[#484848] text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
      }`}
    >
      {/* Left: Account Environment, Market Mode & Exchange Feed */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Global Account Environment Badge */}
        <button
          onClick={onToggleAccountMode}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
            accountMode === 'DEMO'
              ? isDark
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              : isDark
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
          }`}
          title={isId ? 'Klik untuk beralih mode akun' : 'Click to switch account mode'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${accountMode === 'DEMO' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span>{accountMode === 'DEMO' ? `[DEMO SANDBOX: $${demoBalance.toLocaleString()}]` : '[REAL LIVE ACCOUNT]'}</span>
        </button>

        {/* Market Mode Switcher */}
        <div className="flex items-center rounded-md border border-[#484848] overflow-hidden">
          <button
            onClick={() => onSelectMarketType?.('SPOT')}
            className={`px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              marketType === 'SPOT'
                ? isDark
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold'
                  : 'bg-white text-cyan-700 font-bold shadow-xs'
                : isDark
                ? 'bg-[#2a2a2a] text-slate-400 hover:text-slate-200'
                : 'bg-slate-200/70 text-slate-600 hover:text-slate-800'
            }`}
          >
            SPOT
          </button>
          <button
            onClick={() => onSelectMarketType?.('FUTURES')}
            className={`px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              marketType === 'FUTURES'
                ? isDark
                  ? 'bg-orange-500/25 text-orange-300 font-bold'
                  : 'bg-white text-orange-700 font-bold shadow-xs'
                : isDark
                ? 'bg-[#2a2a2a] text-slate-400 hover:text-slate-200'
                : 'bg-slate-200/70 text-slate-600 hover:text-slate-800'
            }`}
          >
            FUTURES
          </button>
        </div>

        {/* Exchange & Symbol Feed Status */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-400">
          <span className="font-semibold text-slate-200">{selectedExchange}</span>
          <span>•</span>
          <span className="text-[#F89DB5] font-bold">{selectedSymbol}</span>
          {livePrice && (
            <span className="text-slate-200 font-bold">${formatCryptoPrice(livePrice)}</span>
          )}
        </div>
      </div>

      {/* Center: Real-time Confluence & Algorithmic Pulse */}
      <div className="hidden lg:flex items-center gap-3">
        {evaluation ? (
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#1e1e1e] border border-[#484848]">
            <Gauge className="w-3.5 h-3.5 text-[#F89DB5]" />
            <span className="text-slate-400">{isId ? 'Konfluensi:' : 'Confluence:'}</span>
            <span className={`font-bold ${
              evaluation.confluenceScore >= 70 ? 'text-emerald-400' : evaluation.confluenceScore <= 40 ? 'text-rose-400' : 'text-cyan-400'
            }`}>
              {evaluation.confluenceScore}/100
            </span>
            <span className="text-slate-500">|</span>
            <span className="font-semibold text-slate-300">{evaluation.marketBias}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-[#F89DB5] animate-spin" />
            <span>AKIRAQU Quant Engine v4.2</span>
          </div>
        )}
      </div>

      {/* Right: Latency, Clocks & Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Latency & WS Health */}
        <div
          className="flex items-center gap-1 text-[10px]"
          title={`Feed status: ${wsStatus} (${latencyMs}ms)`}
        >
          <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-bold text-emerald-400">{latencyMs}ms</span>
        </div>

        <span className="text-slate-500">|</span>

        {/* Real-time Global Clocks */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <Clock className="w-3 h-3 text-[#F89DB5] shrink-0" />
          <span title="Greenwich Mean Time (UTC)">UTC: <strong className="text-slate-200">{timeUtc || '--:--:--'}</strong></span>
          <span className="hidden sm:inline" title="Waktu Indonesia Barat (UTC+7)">WIB: <strong className="text-slate-200">{timeWib || '--:--:--'}</strong></span>
        </div>

        {/* Quick Grid Customizer Button */}
        {onOpenGridCustomizer && (
          <button
            onClick={onOpenGridCustomizer}
            className={`p-1 rounded border text-[10px] transition-colors cursor-pointer ${
              isDark ? 'bg-[#323232] border-[#484848] text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700'
            }`}
            title={isId ? 'Kustomisasi Tampilan Grid' : 'Customize Grid Layout'}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Fullscreen Quick Toggle */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className={`p-1 rounded border text-[10px] transition-colors cursor-pointer ${
              isDark ? 'bg-[#323232] border-[#484848] text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Shortcuts Guide Button */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] transition-colors cursor-pointer ${
              isDark ? 'bg-[#323232] border-[#484848] text-slate-400 hover:text-white' : 'bg-white border-slate-300 text-slate-600'
            }`}
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-3 h-3 text-[#F89DB5]" />
            <span>?</span>
          </button>
        )}
      </div>
    </footer>
  );
};
