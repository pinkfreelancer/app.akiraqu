import React from 'react';
import {
  X,
  LayoutGrid,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  Maximize2,
  Layers,
  BarChart3,
  Flame,
  Bot,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { Language } from '../i18n/translations';

interface GridLayoutCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleFrames: Record<string, boolean>;
  onToggleFrame: (key: string) => void;
  onResetFrames: () => void;
  lang?: Language;
  theme?: 'dark' | 'light';
}

export const GridLayoutCustomizerModal: React.FC<GridLayoutCustomizerModalProps> = ({
  isOpen,
  onClose,
  visibleFrames,
  onToggleFrame,
  onResetFrames,
  lang = 'id',
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const frameOptions = [
    {
      key: 'chart',
      label: isId ? 'Grafik Candlestick & Overlays (SMC, VWAP)' : 'Candlestick Chart & Overlays (SMC, VWAP)',
      icon: BarChart3,
      desc: isId ? 'Grafik utama interaktif dengan cluster likuidasi & Fibonacci' : 'Primary interactive chart with liquidation clusters',
      category: 'Primary',
    },
    {
      key: 'orderbook',
      label: isId ? 'Live Order Book & Feed Transaksi (@aggTrade)' : 'Live Order Book & Trade Feed (@aggTrade)',
      icon: Layers,
      desc: isId ? 'Kedalaman bid/ask dan riwayat transaksi real-time' : 'Real-time bid/ask depth and recent aggregated trades',
      category: 'Execution',
    },
    {
      key: 'mmbot',
      label: isId ? 'MM Bot Tracker & Kecepatan Institusional' : 'MM Bot Tracker & Institutional Flow',
      icon: Bot,
      desc: isId ? 'Deteksi bot maker, spoofing pressure, dan kecepatan delta' : 'Maker bot detection, spoofing pressure, and delta flow',
      category: 'Analytics',
    },
    {
      key: 'playbook',
      label: isId ? 'Algorithmic Manipulation & MM Playbook' : 'Algorithmic Manipulation & MM Playbook',
      icon: Sparkles,
      desc: isId ? 'Fase akumulasi, manipulasi liquidity sweep, dan panduan entri' : 'Accumulation phase, liquidity sweep, and playbook guide',
      category: 'Strategy',
    },
    {
      key: 'liquidation',
      label: isId ? 'Heatmap Likuidasi & Cluster Leverage' : 'Liquidation Heatmap & Leverage Clusters',
      icon: Flame,
      desc: isId ? 'Estimasi likuidasi short/long dan magnet squeeze harga' : 'Estimated short/long liquidations and squeeze magnets',
      category: 'Derivatives',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all ${
          isDark ? 'bg-[#2d2d2d] border-[#484848] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#484848]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F89DB5]/15 border border-[#F89DB5]/30 text-[#F89DB5]">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono">
                {isId ? 'Kustomisasi Layout Dasbor' : 'Customize Dashboard Layout'}
              </h2>
              <p className="text-xs text-slate-400">
                {isId ? 'Atur modul yang ditampilkan di area kerja utama' : 'Choose which modular frames to display in the main workspace'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#484848] hover:bg-[#383838] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Frames Toggles */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {frameOptions.map((item) => {
            const Icon = item.icon;
            const isVisible = visibleFrames[item.key] !== false;

            return (
              <div
                key={item.key}
                onClick={() => onToggleFrame(item.key)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isVisible
                    ? isDark
                      ? 'bg-[#323232] border-[#555] hover:border-[#F89DB5]/60'
                      : 'bg-slate-50 border-slate-300 hover:border-pink-400'
                    : isDark
                    ? 'bg-[#242424] border-[#383838] opacity-50'
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg border ${
                      isVisible
                        ? isDark
                          ? 'bg-[#282828] border-[#484848] text-[#F89DB5]'
                          : 'bg-white border-slate-200 text-pink-600'
                        : isDark
                        ? 'bg-[#202020] border-[#333] text-slate-500'
                        : 'bg-slate-200 border-slate-300 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold font-mono block truncate">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {item.desc}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                      isVisible
                        ? 'bg-[#F89DB5] border-[#F89DB5] text-slate-950 font-bold'
                        : 'border-[#484848] text-transparent'
                    }`}
                  >
                    {isVisible && <Check className="w-4 h-4 stroke-[3]" />}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-[#484848] flex items-center justify-between gap-3">
          <button
            onClick={onResetFrames}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#242424] border-[#484848] text-slate-300 hover:text-white hover:bg-[#323232]'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isId ? 'Reset Default' : 'Reset Default'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#F89DB5] hover:bg-[#faafc2] text-slate-950 text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
          >
            {isId ? 'Terapkan Tampilan' : 'Apply Layout'}
          </button>
        </div>
      </div>
    </div>
  );
};
