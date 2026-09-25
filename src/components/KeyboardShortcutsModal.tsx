import React from 'react';
import { X, Keyboard, Zap, Command, Clock, Layers, Monitor, Sliders } from 'lucide-react';
import { Language } from '../i18n/translations';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  lang = 'id',
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const shortcutGroups = [
    {
      title: lang === 'id' ? 'Navigasi & Pencarian Cepat' : 'Quick Navigation & Search',
      icon: Command,
      shortcuts: [
        { keys: ['⌘', 'K'], altKeys: ['Ctrl', 'K'], desc: lang === 'id' ? 'Buka Kotak Perintah & Pencarian Cepat' : 'Open Quick Search & Command Bar' },
        { keys: ['/'], desc: lang === 'id' ? 'Pencarian Koin Instan (/)' : 'Instant Coin Search (/)' },
        { keys: ['Alt', '↑'], altKeys: ['['], desc: lang === 'id' ? 'Pindah ke Koin Sebelumnya' : 'Previous Coin in Watchlist' },
        { keys: ['Alt', '↓'], altKeys: [']'], desc: lang === 'id' ? 'Pindah ke Koin Berikutnya' : 'Next Coin in Watchlist' },
        { keys: ['Esc'], desc: lang === 'id' ? 'Tutup Modal / Batal' : 'Close Modal / Dismiss' },
      ],
    },
    {
      title: lang === 'id' ? 'Kontrol Timeframe (1-Click)' : 'Timeframe Controls (1-Click)',
      icon: Clock,
      shortcuts: [
        { keys: ['1'], desc: lang === 'id' ? 'Pindah ke Timeframe 1m' : 'Switch to 1m Timeframe' },
        { keys: ['2'], desc: lang === 'id' ? 'Pindah ke Timeframe 5m' : 'Switch to 5m Timeframe' },
        { keys: ['3'], desc: lang === 'id' ? 'Pindah ke Timeframe 15m' : 'Switch to 15m Timeframe' },
        { keys: ['4'], desc: lang === 'id' ? 'Pindah ke Timeframe 1H' : 'Switch to 1H Timeframe' },
        { keys: ['5'], desc: lang === 'id' ? 'Pindah ke Timeframe 4H' : 'Switch to 4H Timeframe' },
        { keys: ['6'], desc: lang === 'id' ? 'Pindah ke Timeframe 1D' : 'Switch to 1D Timeframe' },
        { keys: ['7'], desc: lang === 'id' ? 'Pindah ke Timeframe 1W' : 'Switch to 1W Timeframe' },
      ],
    },
    {
      title: lang === 'id' ? 'Workspace & Tampilan Terminal' : 'Workspace & Layout Modes',
      icon: Layers,
      shortcuts: [
        { keys: ['W'], desc: lang === 'id' ? 'Ganti Tampilan (Meja Kerja Multi-Panel vs Alur Bertahap)' : 'Toggle View (Multi-Panel vs Stepped Flow)' },
        { keys: ['H'], desc: lang === 'id' ? 'Sembunyikan / Tampilkan Meja Kerja Trader' : 'Toggle Trader Workbench (Hide/Show)' },
        { keys: ['F'], desc: lang === 'id' ? 'Toggle Fullscreen Tanpa Distraksi' : 'Toggle Distraction-Free Fullscreen' },
        { keys: ['R'], desc: lang === 'id' ? 'Re-analisa Confluence / Refresh Data' : 'Recompute Confluence / Refresh' },
        { keys: ['?'], desc: lang === 'id' ? 'Buka Panduan Shortcut Ini' : 'Open this Shortcuts Guide' },
        { keys: ['Doc'], desc: lang === 'id' ? 'Buka Dokumentasi & Panduan API' : 'Open Documentation & API Guide' },
      ],
    },
    {
      title: lang === 'id' ? 'Pintasan Halaman Cepat (via Kotak Perintah)' : 'Quick Stage Jumps (via Command Bar)',
      icon: Sliders,
      shortcuts: [
        { keys: ['⌘', 'K'], suffix: '> chart', desc: lang === 'id' ? 'Grafik Interaktif & Live Tape' : 'Interactive Chart & Live Tape' },
        { keys: ['⌘', 'K'], suffix: '> scan', desc: lang === 'id' ? 'Screener 32 Koin Kuantitatif' : '32-Pair Quantitative Screener' },
        { keys: ['⌘', 'K'], suffix: '> flow', desc: lang === 'id' ? 'Order Flow & Liquidation Heatmap' : 'Order Flow & Liquidation Heatmap' },
        { keys: ['⌘', 'K'], suffix: '> conf', desc: lang === 'id' ? 'Matriks Confluence 12 Indikator' : '12-Indicator Confluence Matrix' },
        { keys: ['⌘', 'K'], suffix: '> risk', desc: lang === 'id' ? 'Kalkulator Manajemen Risiko & RRR' : 'Risk Management & RRR Calculator' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 ${
          isDark
            ? 'bg-[#0b0f19] border-[#1e293b] text-slate-200'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isDark ? 'border-[#1e293b] bg-[#090d16]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wide">
                {lang === 'id' ? 'Pintasan Papan Ketik Institusional' : 'Institutional Keyboard Shortcuts'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {lang === 'id'
                  ? 'Dirancang untuk eksekusi cepat tanpa jeda mouse'
                  : 'Designed for high-speed terminal execution without mouse lag'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5 font-mono text-xs">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-800'
              }`}>
                <group.icon className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                <span>{group.title}</span>
              </div>
              <div
                className={`divide-y rounded-lg border overflow-hidden ${
                  isDark ? 'border-[#1e293b] bg-[#0f172a]/50 divide-[#1e293b]' : 'border-slate-200 bg-white divide-slate-200 shadow-xs'
                }`}
              >
                {group.shortcuts.map((sc, scIdx) => (
                  <div key={scIdx} className={`flex items-center justify-between px-3.5 py-2 transition-colors ${
                    isDark ? 'hover:bg-cyan-500/5' : 'hover:bg-slate-50'
                  }`}>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{sc.desc}</span>
                    <div className="flex items-center gap-1.5">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border shadow-xs ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-cyan-300'
                              : 'bg-slate-100 border-slate-300 text-slate-900'
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                      {sc.altKeys && (
                        <>
                          <span className={isDark ? 'text-slate-500 text-[10px]' : 'text-slate-400 text-[10px]'}>/</span>
                          {sc.altKeys.map((ak, akIdx) => (
                            <kbd
                              key={akIdx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                isDark
                                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              {ak}
                            </kbd>
                          ))}
                        </>
                      )}
                      {sc.suffix && (
                        <span className={`text-[11px] font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{sc.suffix}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div
          className={`px-5 py-2.5 border-t text-[11px] flex items-center justify-between font-mono ${
            isDark ? 'border-[#1e293b] bg-[#090d16] text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <span>
            {lang === 'id' ? 'Tekan ESC kapan saja untuk menutup' : 'Press ESC at any time to dismiss'}
          </span>
          <span className="text-cyan-400 font-semibold">{lang === 'id' ? 'Pintasan Keyboard Cepat • AKIRA.QU' : 'Trading Shortcuts • AKIRA.QU'}</span>
        </div>
      </div>
    </div>
  );
};
