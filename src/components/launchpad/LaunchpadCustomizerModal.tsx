import React from 'react';
import { Language } from '../../i18n/translations';
import {
  Sliders,
  X,
  Check,
  RotateCcw,
  LayoutGrid,
  CandlestickChart,
  Gauge,
  Flame,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { LaunchpadLayoutPreset } from './LaunchpadToolbar';

export interface GridPanelVisibilityConfig {
  showChart: boolean;
  showConfluence: boolean;
  showLiquidity: boolean;
  showRisk: boolean;
  showPositionsBar: boolean;
}

interface LaunchpadCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelConfig: GridPanelVisibilityConfig;
  onUpdatePanelConfig: (config: GridPanelVisibilityConfig) => void;
  layoutPreset: LaunchpadLayoutPreset;
  onSelectLayoutPreset: (preset: LaunchpadLayoutPreset) => void;
  soundAlerts: boolean;
  onToggleSoundAlerts: () => void;
  isDark?: boolean;
  lang?: Language;
}

export const LaunchpadCustomizerModal: React.FC<LaunchpadCustomizerModalProps> = ({
  isOpen,
  onClose,
  panelConfig,
  onUpdatePanelConfig,
  layoutPreset,
  onSelectLayoutPreset,
  soundAlerts,
  onToggleSoundAlerts,
  isDark = true,
  lang = 'id',
}) => {
  const isId = lang === 'id';

  if (!isOpen) return null;

  const handleToggle = (key: keyof GridPanelVisibilityConfig) => {
    onUpdatePanelConfig({
      ...panelConfig,
      [key]: !panelConfig[key],
    });
  };

  const handleResetDefaults = () => {
    onUpdatePanelConfig({
      showChart: true,
      showConfluence: true,
      showLiquidity: true,
      showRisk: true,
      showPositionsBar: true,
    });
    onSelectLayoutPreset('quad');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in select-none font-mono">
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 space-y-4 shadow-2xl transition-colors ${
          isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">
              {isId ? 'Kustomisasi Meja Kerja Grid' : 'Grid Workspace Customizer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Visibility Toggles */}
        <div className="space-y-3 text-xs">
          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
            {isId ? 'Visibilitas Panel Meja Kerja' : 'Panel Visibility Controls'}
          </div>

          <div className="space-y-2">
            {/* Panel 1 */}
            <div
              onClick={() => handleToggle('showChart')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                panelConfig.showChart
                  ? isDark
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CandlestickChart className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold">{isId ? 'Panel 1: Grafik Candlestick & Kedalaman L2' : 'Panel 1: Candlestick Chart & L2 Depth'}</span>
                  <p className="text-[10px] text-slate-400">
                    {isId ? 'Struktur harga teknikal, orderbook level 2 & live tape' : 'Technical price structure, orderbook depth & live tape'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={panelConfig.showChart}
                readOnly
                className="accent-cyan-400 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Panel 2 */}
            <div
              onClick={() => handleToggle('showConfluence')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                panelConfig.showConfluence
                  ? isDark
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold">{isId ? 'Panel 2: Radar Konfluensi 12 Algoritma' : 'Panel 2: 12-Algo Confluence Radar'}</span>
                  <p className="text-[10px] text-slate-400">
                    {isId ? 'Skor kuantitatif, SMC, ICT, order flow & indikator teknikal' : 'Quantitative score, SMC, ICT, order flow & technical indicators'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={panelConfig.showConfluence}
                readOnly
                className="accent-cyan-400 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Panel 3 */}
            <div
              onClick={() => handleToggle('showLiquidity')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                panelConfig.showLiquidity
                  ? isDark
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold">{isId ? 'Panel 3: Heatmap Likuidasi & Sentimen' : 'Panel 3: Liquidation Heatmap & Sentiment'}</span>
                  <p className="text-[10px] text-slate-400">
                    {isId ? 'Klaster likuidasi whale, CVD akumulasi & aliran derivatif' : 'Whale liquidation clusters, CVD accumulation & derivatives flow'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={panelConfig.showLiquidity}
                readOnly
                className="accent-cyan-400 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Panel 4 */}
            <div
              onClick={() => handleToggle('showRisk')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                panelConfig.showRisk
                  ? isDark
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold">{isId ? 'Panel 4: Protokol Risiko & Eksekusi Cepat' : 'Panel 4: Risk Protocol & Quick Execution'}</span>
                  <p className="text-[10px] text-slate-400">
                    {isId ? 'Kalkulasi lot & margin, target r1–r8 & simulasi paper trade' : 'Lot sizing, r1–r8 targets & paper trade simulation'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={panelConfig.showRisk}
                readOnly
                className="accent-cyan-400 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isId ? 'Suara Notifikasi & Sinyal Audio:' : 'Audio Chime Alerts:'}</span>
            </span>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={onToggleSoundAlerts}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300">
              {isId ? 'Tampilkan Bar Posisi Grid Aktif:' : 'Show Active Grid Positions Bar:'}
            </span>
            <input
              type="checkbox"
              checked={panelConfig.showPositionsBar}
              onChange={() => handleToggle('showPositionsBar')}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isId ? 'Reset Default' : 'Reset Defaults'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            {isId ? 'Simpan & Terapkan' : 'Save & Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};
