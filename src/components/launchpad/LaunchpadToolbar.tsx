import React, { useState, useMemo, useEffect } from 'react';
import {
  CryptoSymbolInfo,
  Timeframe,
  SupportedExchange,
  MarketType,
  WebSocketSyncMetrics,
  ConfluenceEvaluation,
} from '../../types/crypto.types';
import { Language } from '../../i18n/translations';
import { formatCryptoPrice } from '../../utils/formatters';
import {
  LayoutGrid,
  Zap,
  Search,
  Volume2,
  VolumeX,
  HelpCircle,
  Sliders,
  Clock,
  Radio,
  ChevronDown,
  Layers,
  BarChart2,
  Shield,
  Activity,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export type LaunchpadLayoutPreset =
  | 'quad'
  | 'chart_focus'
  | 'execution_focus'
  | 'dual_chart_confluence'
  | 'triple_analytics';

const POPULAR_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'AVAX/USDT',
  'XRP/USDT',
  'DOGE/USDT',
  'NEAR/USDT',
  'LINK/USDT',
  'SUI/USDT',
];

const TIMEFRAME_OPTIONS: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D'];

const EXCHANGES: SupportedExchange[] = ['BINANCE', 'OKX', 'BYBIT', 'KUCOIN', 'BITGET', 'CRYPTO_COM', 'BITUNIX'];

interface LaunchpadToolbarProps {
  symbol: string;
  symbols?: CryptoSymbolInfo[];
  timeframe: Timeframe;
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  layoutPreset: LaunchpadLayoutPreset;
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  evaluation: ConfluenceEvaluation | null;
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  latencyMs?: number;
  syncMetrics?: WebSocketSyncMetrics;
  soundAlerts: boolean;
  showWorkflowGuide: boolean;
  isLoading?: boolean;
  isDark?: boolean;
  lang?: Language;
  onSelectSymbol?: (symbol: string) => void;
  onSelectTimeframe?: (tf: Timeframe) => void;
  onSelectExchange?: (ex: SupportedExchange) => void;
  onSelectMarketType?: (mt: MarketType) => void;
  onSelectLayout: (preset: LaunchpadLayoutPreset) => void;
  onToggleSoundAlerts: () => void;
  onToggleGuide: () => void;
  onOpenCustomizer: () => void;
  onTriggerAnalyze?: () => void;
}

export const LaunchpadToolbar: React.FC<LaunchpadToolbarProps> = ({
  symbol,
  symbols = [],
  timeframe,
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  layoutPreset,
  livePrice = 0,
  priceDirection = 'neutral',
  evaluation,
  wsStatus = 'connected',
  latencyMs = 14,
  soundAlerts,
  showWorkflowGuide,
  isLoading = false,
  isDark = true,
  lang = 'id',
  onSelectSymbol,
  onSelectTimeframe,
  onSelectExchange,
  onSelectMarketType,
  onSelectLayout,
  onToggleSoundAlerts,
  onToggleGuide,
  onOpenCustomizer,
  onTriggerAnalyze,
}) => {
  const isId = lang === 'id';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentKillzone, setCurrentKillzone] = useState<string>('LONDON OPEN');

  // Clock & Killzone ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const utcMin = now.getUTCMinutes();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
      setCurrentTime(timeStr);

      // Killzones in UTC
      if (utcHour >= 7 && utcHour < 10) {
        setCurrentKillzone('LONDON OPEN (07-10 UTC)');
      } else if (utcHour >= 12 && utcHour < 15) {
        setCurrentKillzone('NY AM KILLZONE (12-15 UTC)');
      } else if (utcHour >= 15 && utcHour < 17) {
        setCurrentKillzone('LONDON CLOSE (15-17 UTC)');
      } else if (utcHour >= 0 && utcHour < 6) {
        setCurrentKillzone('ASIAN RANGE (00-06 UTC)');
      } else {
        setCurrentKillzone('GLOBAL EQUITIES (IN PLAY)');
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return symbols.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return symbols
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [symbols, searchQuery]);

  const activeSymbolData = useMemo(() => {
    return symbols.find((s) => s.symbol === symbol);
  }, [symbols, symbol]);

  const change24h = activeSymbolData?.change24h ?? 0;

  return (
    <div className="w-full space-y-2 font-mono">
      {/* Upper Control Bar */}
      <div
        className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#0b0f19] border-[#1e293b] text-slate-200'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        {/* Section 1: Branding, Symbol Selector & Ticker Info */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          {/* Desk Header Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-bold text-xs shrink-0">
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span className="tracking-wide">{isId ? 'MEJA KERJA GRID' : 'GRID WORKSPACE'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>

          {/* Quick Symbol Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-700 hover:border-cyan-500 text-white'
                  : 'bg-slate-100 border-slate-300 hover:border-cyan-600 text-slate-900'
              }`}
              title={isId ? 'Ganti Aset Kripto' : 'Switch Crypto Asset'}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-400 font-bold">{symbol}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown search modal */}
            {isSearchOpen && (
              <div
                className={`absolute top-full left-0 mt-1.5 w-64 p-2 rounded-xl border shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                  isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="p-1 mb-1.5 border-b border-slate-700/50">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isId ? 'Cari koin (BTC, ETH, SOL)...' : 'Search coin...'}
                    autoFocus
                    className="w-full px-2 py-1 bg-transparent text-xs outline-hidden text-cyan-300 placeholder:text-slate-500 font-mono"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredSymbols.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        if (onSelectSymbol) onSelectSymbol(item.symbol);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        item.symbol === symbol
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{item.symbol}</div>
                        <div className="text-[10px] text-slate-400">{item.name}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.change24h >= 0 ? '+' : ''}
                        {item.change24h.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Real-Time Price & 24h Delta */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-900/60 border-slate-800 text-xs">
            <span
              className={`font-bold tabular-nums text-sm transition-colors duration-300 ${
                priceDirection === 'up'
                  ? 'text-emerald-400'
                  : priceDirection === 'down'
                  ? 'text-rose-400'
                  : isDark
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              ${formatCryptoPrice(livePrice)}
            </span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                change24h >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {change24h >= 0 ? '+' : ''}
              {change24h.toFixed(2)}%
            </span>
          </div>

          {/* Market Bias Consensus Tag */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
              evaluation?.marketBias?.includes('Bullish')
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : evaluation?.marketBias?.includes('Bearish')
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>
              {evaluation?.marketBias || (isLoading ? (isId ? 'MEMPROSES...' : 'COMPUTING...') : 'STANDBY')}
            </span>
            {evaluation && (
              <span className="text-[10px] opacity-80">({evaluation.confluenceScore}/100)</span>
            )}
          </div>
        </div>

        {/* Section 2: Timeframe, Presets, Actions */}
        <div className="flex flex-wrap items-center justify-between xl:justify-end gap-2 text-xs">
          {/* Timeframe Selector */}
          {onSelectTimeframe && (
            <div
              className={`flex items-center gap-0.5 p-1 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {TIMEFRAME_OPTIONS.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onSelectTimeframe(tf)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                    timeframe === tf
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'bg-cyan-600 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {/* Layout Presets Buttons */}
          <div
            className={`flex items-center gap-0.5 p-1 rounded-xl border overflow-x-auto ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => onSelectLayout('quad')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                layoutPreset === 'quad'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? '4 Panel: Grafik + Konfluensi + Likuidasi + Risiko' : '4-Panel Quad Desk'}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{isId ? '4 Panel' : '4-Grid'}</span>
            </button>

            <button
              onClick={() => onSelectLayout('chart_focus')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                layoutPreset === 'chart_focus'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? 'Fokus Grafik Lebar (8 kolom) + Samping' : 'Wide Chart Focus'}
            >
              <BarChart2 className="w-3 h-3" />
              <span>{isId ? 'Fokus Grafik' : 'Chart+'}</span>
            </button>

            <button
              onClick={() => onSelectLayout('execution_focus')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                layoutPreset === 'execution_focus'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? 'Fokus Eksekusi Cepat & Orderbook L2' : 'Quick Execution & Depth'}
            >
              <Shield className="w-3 h-3" />
              <span>{isId ? 'Eksekusi' : 'Exec'}</span>
            </button>

            <button
              onClick={() => onSelectLayout('dual_chart_confluence')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                layoutPreset === 'dual_chart_confluence'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? '2 Panel Kritis: Candlestick & Skor Konfluensi' : 'Dual Critical Desk'}
            >
              <Layers className="w-3 h-3" />
              <span>{isId ? '2 Panel' : 'Dual'}</span>
            </button>

            <button
              onClick={() => onSelectLayout('triple_analytics')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                layoutPreset === 'triple_analytics'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? '3 Panel Kuantitatif: Grafik, Likuidasi, dan Matriks' : 'Triple Analytics Desk'}
            >
              <Activity className="w-3 h-3" />
              <span>{isId ? '3 Panel' : 'Triple'}</span>
            </button>
          </div>

          {/* Action Trigger Button: Analyze Confluence */}
          {onTriggerAnalyze && (
            <button
              onClick={onTriggerAnalyze}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                isLoading
                  ? 'bg-cyan-500/40 text-slate-400 cursor-not-allowed'
                  : isDark
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 hover:from-cyan-400 hover:to-cyan-300 shadow-cyan-500/20 active:scale-95'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20 active:scale-95'
              }`}
              title={isId ? 'Jalankan kalkulasi konfluensi 12 algoritma (Shortcut: [R])' : 'Run 12-indicator confluence scan (Shortcut: [R])'}
            >
              <Zap className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'fill-current'}`} />
              <span className="hidden sm:inline">
                {isLoading ? (isId ? 'Menganalisis...' : 'Scanning...') : isId ? 'Pindai [R]' : 'Scan [R]'}
              </span>
            </button>
          )}

          {/* Sound, Guide & Customizer Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSoundAlerts}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                soundAlerts
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
              }`}
              title={soundAlerts ? (isId ? 'Suara Notifikasi: Aktif' : 'Audio Alerts: On') : (isId ? 'Suara Notifikasi: Mati' : 'Audio Alerts: Off')}
            >
              {soundAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onToggleGuide}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                showWorkflowGuide
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
              }`}
              title={isId ? 'Panduan Alur Meja Kerja' : 'Workflow Guide'}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenCustomizer}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-cyan-700 hover:border-slate-300'
              }`}
              title={isId ? 'Kustomisasi Tampilan Panel' : 'Panel Customizer'}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Pair Switcher Ribbon & Global Market Status */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border text-[11px] ${
          isDark ? 'bg-[#090d16] border-[#1e293b]/70 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        {/* Popular Coin Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
            {isId ? 'Aset Populer:' : 'Quick Pairs:'}
          </span>
          {POPULAR_SYMBOLS.map((sym) => {
            const isSelected = sym === symbol;
            const coinData = symbols.find((s) => s.symbol === sym);
            const delta = coinData?.change24h ?? 0;
            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol && onSelectSymbol(sym)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? isDark
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                    : isDark
                    ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{sym.replace('/USDT', '')}</span>
                {coinData && (
                  <span className={delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Market Killzone & Latency */}
        <div className="flex items-center gap-3 shrink-0 ml-auto text-[10px] font-mono">
          <div className="flex items-center gap-1 text-cyan-400">
            <Clock className="w-3 h-3" />
            <span className="font-bold">{currentKillzone}</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-slate-400">
            <span>{currentTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">{latencyMs}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
