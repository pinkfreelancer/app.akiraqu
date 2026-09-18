import React, { useState } from 'react';
import { SupportedExchange, MarketType } from '../types/crypto.types';
import { SUPPORTED_EXCHANGES } from '../services/exchangeService';
import { Zap, Radio, Layers, Flame, ArrowRightLeft, Check, ChevronDown } from 'lucide-react';

interface ExchangeMarketSelectorProps {
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  onSelectExchange: (exchange: SupportedExchange) => void;
  onSelectMarketType: (marketType: MarketType) => void;
  latencyMs?: number;
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  theme?: 'light' | 'dark';
  compact?: boolean;
}

export const ExchangeMarketSelector: React.FC<ExchangeMarketSelectorProps> = ({
  selectedExchange,
  selectedMarketType,
  onSelectExchange,
  onSelectMarketType,
  latencyMs = 18,
  wsStatus = 'connected',
  theme = 'dark',
  compact = false,
}) => {
  const isDark = theme === 'dark';
  const [showDropdown, setShowDropdown] = useState(false);

  const activeExchangeObj = SUPPORTED_EXCHANGES.find((e) => e.id === selectedExchange) || SUPPORTED_EXCHANGES[0];

  return (
    <div
      id="exchange-market-source-selector"
      className={`flex flex-wrap items-center gap-2 p-1.5 rounded-xl border transition-all ${
        isDark
          ? 'bg-[#0b101f] border-[#1e293b] text-slate-200'
          : 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
      }`}
    >
      {/* 1. Market Type Switcher: SPOT vs FUTURES */}
      <div
        id="market-type-toggle-group"
        className={`flex items-center p-0.5 rounded-lg border text-xs font-semibold ${
          isDark ? 'bg-[#0f172a] border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <button
          id="btn-market-spot"
          type="button"
          onClick={() => onSelectMarketType('SPOT')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            selectedMarketType === 'SPOT'
              ? 'bg-emerald-500 text-white shadow-xs font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Pasar Spot (Fisik / Cash Asset)"
        >
          <Layers className="w-3 h-3" />
          <span>SPOT</span>
        </button>

        <button
          id="btn-market-futures"
          type="button"
          onClick={() => onSelectMarketType('FUTURES')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            selectedMarketType === 'FUTURES'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Pasar Futures / Perpetual Swap (Derivatif & Leverage)"
        >
          <Flame className="w-3 h-3" />
          <span>FUTURES</span>
        </button>
      </div>

      {/* 2. Desktop Direct Exchange Buttons */}
      <div className="hidden md:flex items-center gap-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 pl-1">
          Sumber:
        </span>
        {SUPPORTED_EXCHANGES.map((ex) => {
          const isSelected = selectedExchange === ex.id;
          return (
            <button
              key={ex.id}
              id={`btn-exchange-${ex.id.toLowerCase()}`}
              type="button"
              onClick={() => onSelectExchange(ex.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-xs'
                  : isDark
                  ? 'border-[#1e293b] bg-[#0f172a] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
              title={`${ex.name} (${ex.description})`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ex.brandColor }}
              />
              <span>{ex.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Mobile Dropdown Exchange Selector */}
      <div className="relative md:hidden">
        <button
          id="btn-exchange-mobile-dropdown"
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
            isDark ? 'bg-[#0f172a] border-[#334155] text-slate-100' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activeExchangeObj.brandColor }}
          />
          <span>{activeExchangeObj.name}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showDropdown && (
          <div
            className={`absolute top-full left-0 mt-1 w-44 rounded-xl border p-1 shadow-xl z-50 ${
              isDark ? 'bg-[#0b101f] border-[#334155]' : 'bg-white border-slate-200'
            }`}
          >
            {SUPPORTED_EXCHANGES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  onSelectExchange(ex.id);
                  setShowDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                  selectedExchange === ex.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ex.brandColor }}
                  />
                  <span>{ex.name}</span>
                </div>
                {selectedExchange === ex.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Realtime Speed & Latency Badge */}
      <div
        id="realtime-latency-telemetry-badge"
        className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border ${
          wsStatus === 'connected'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : wsStatus === 'connecting'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
        }`}
        title={`WebSocket status: ${wsStatus}. Round-trip latency: ${latencyMs}ms`}
      >
        <span className="relative flex h-2 w-2">
          {wsStatus === 'connected' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              wsStatus === 'connected'
                ? 'bg-emerald-500'
                : wsStatus === 'connecting'
                ? 'bg-amber-500'
                : 'bg-cyan-500'
            }`}
          ></span>
        </span>
        <span className="font-bold">{latencyMs}ms</span>
        <span className="hidden sm:inline text-slate-400">
          • {activeExchangeObj.name} {selectedMarketType}
        </span>
      </div>
    </div>
  );
};
