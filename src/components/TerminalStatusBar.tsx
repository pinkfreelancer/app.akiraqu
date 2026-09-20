import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  Clock,
  ShieldCheck,
  Command,
  LayoutGrid,
  Layers,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { Timeframe, SupportedExchange, MarketType, WebSocketSyncMetrics } from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface TerminalStatusBarProps {
  selectedSymbol: string;
  selectedTimeframe: Timeframe;
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  latencyMs?: number;
  syncMetrics?: WebSocketSyncMetrics;
  workspaceMode: 'classic' | 'launchpad';
  onToggleWorkspaceMode: () => void;
  onOpenCommandBar: () => void;
  onOpenShortcuts: () => void;
  lang?: Language;
  theme?: 'light' | 'dark';
  isFullWidth?: boolean;
}

export const TerminalStatusBar: React.FC<TerminalStatusBarProps> = ({
  selectedSymbol,
  selectedTimeframe,
  selectedExchange,
  selectedMarketType,
  livePrice,
  priceDirection = 'neutral',
  wsStatus = 'connected',
  latencyMs = 12,
  syncMetrics,
  workspaceMode,
  onToggleWorkspaceMode,
  onOpenCommandBar,
  onOpenShortcuts,
  lang = 'id',
  theme = 'dark',
  isFullWidth = true,
}) => {
  const isDark = theme === 'dark';
  const [currentTime, setCurrentTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');

  // Live ticking clock
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`sticky bottom-0 z-30 w-full border-t text-[11px] font-mono select-none transition-colors duration-200 ${
        isDark ? 'border-[#1e293b] bg-[#070a12]/95 text-slate-400' : 'border-slate-200 bg-slate-50/95 text-slate-600'
      } backdrop-blur-md`}
    >
      <div
        className="w-full mx-auto px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2"
      >
        {/* Left: Feed Provenance & Exchange Latency */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected'
                  ? 'bg-emerald-500'
                  : wsStatus === 'connecting'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className={wsStatus === 'connected' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : ''}>
              {selectedExchange} {selectedMarketType}
            </span>
          </div>

          <span className={`text-slate-600 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>|</span>

          <span className="font-mono tabular-nums text-slate-300">
            {latencyMs.toFixed(0)}ms
          </span>

          <span className={`hidden sm:inline ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>|</span>

          <span className="hidden sm:inline text-slate-200 font-medium truncate max-w-[140px]">
            {selectedSymbol} • {selectedTimeframe}
          </span>

          {livePrice && livePrice > 0 && (
            <span
              className={`hidden md:inline font-mono font-bold tabular-nums ${
                priceDirection === 'up'
                  ? 'text-emerald-400'
                  : priceDirection === 'down'
                  ? 'text-rose-400'
                  : isDark
                  ? 'text-slate-300'
                  : 'text-slate-700'
              }`}
            >
              ${formatCryptoPrice(livePrice)}
            </span>
          )}
        </div>

        {/* Middle: Shortcut Pills */}
        <div className="hidden xl:flex items-center gap-2">
          <button
            onClick={onOpenCommandBar}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                : 'bg-white border-slate-300 text-slate-800 hover:text-slate-950 hover:border-slate-400'
            }`}
            title={lang === 'id' ? 'Buka Pencarian & Perintah Cepat (⌘K atau /)' : 'Open Quick Search & Commands (⌘K or /)'}
          >
            <Command className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            <span>[⌘K] {lang === 'id' ? 'Perintah' : 'Commands'}</span>
          </button>

          <button
            onClick={onToggleWorkspaceMode}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              workspaceMode === 'launchpad'
                ? isDark
                  ? 'bg-slate-800 border-slate-700 text-white font-semibold'
                  : 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
                : isDark
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:border-slate-400'
            }`}
            title={lang === 'id' ? 'Ganti Tampilan: Meja Kerja Multi-Panel vs Alur Bertahap (W)' : 'Toggle Workspace: Multi-Panel vs Stepped Flow (W)'}
          >
            <LayoutGrid className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            <span>[W] {workspaceMode === 'launchpad' ? (lang === 'id' ? 'Multi-Panel' : 'Multi-Panel') : (lang === 'id' ? 'Alur Bertahap' : 'Stepped Flow')}</span>
          </button>

          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            [1-4] TF
          </span>

          <button
            onClick={onOpenShortcuts}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-950'
            }`}
            title="Pintasan Keyboard (?)"
          >
            <HelpCircle className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            <span>[?]</span>
          </button>
        </div>

        {/* Right: Real-time Clocks & Provenance */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`flex items-center gap-1 text-xs font-mono tabular-nums ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <Clock className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <span>{currentTime}</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{utcTime}</span>
          </div>

          <div
            className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${
              isDark
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            }`}
          >
            {lang === 'id' ? 'L1/L2 TERVERIFIKASI' : 'L1/L2 VERIFIED'}
          </div>
        </div>
      </div>
    </div>
  );
};
