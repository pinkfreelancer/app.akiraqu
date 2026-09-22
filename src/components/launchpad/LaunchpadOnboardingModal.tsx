import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CandlestickChart,
  Gauge,
  Flame,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface LaunchpadOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  lang?: Language;
}

export const LaunchpadOnboardingModal: React.FC<LaunchpadOnboardingModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = 'id',
}) => {
  const [step, setStep] = useState(0);
  const isId = lang === 'id';

  if (!isOpen) return null;

  const steps = [
    {
      title: isId ? 'Selamat Datang di Meja Kerja Grid AKIRAQU' : 'Welcome to AKIRAQU Grid Workspace',
      subtitle: isId ? 'Pusat Analisis Kuantitatif & Eksekusi Cepat' : 'Quant Intelligence & Execution Desk',
      description: isId
        ? 'Meja kerja ini dirancang untuk menyatukan 4 aspek kritis trading profesional ke dalam satu tampilan real-time tanpa perlu berpindah-pindah tab browser.'
        : 'This desk unifies the 4 critical pillars of pro trading into a single real-time multi-window workspace without tab-switching friction.',
      icon: Sparkles,
      iconColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      tips: [
        isId ? 'Gunakan Quick-Pairs di bilah atas untuk ganti koin seketika.' : 'Use Quick-Pairs top bar to switch assets instantly.',
        isId ? 'Pantau sesi pasar global & Killzone aktif (London, NY AM, Asian).' : 'Track live global sessions & active Killzones in real-time.',
      ],
    },
    {
      title: isId ? 'Panel 1: Grafik Candlestick & Buku Order L2' : 'Panel 1: Candlestick & L2 Depth Tape',
      subtitle: isId ? 'Analisis Struktur Harga & Jejak Transaksi Whale' : 'Price Action & Whale Flow Tracking',
      description: isId
        ? 'Beralih dengan mudah antara grafik candlestick interaktif dan buku order L2 Depth serta aliran order whale (≥$10k, ≥$50k, ≥$100k).'
        : 'Easily toggle between interactive candlesticks and live L2 depth orderbook with real-time whale trade filters.',
      icon: CandlestickChart,
      iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      tips: [
        isId ? 'Tekan [1] untuk memperbesar grafik secara penuh, [Esc] untuk kembali.' : 'Press [1] to maximize the chart, [Esc] to return.',
        isId ? 'Gunakan tombol L2 Depth / Tape untuk membaca dominasi bid vs ask.' : 'Use Depth / Tape toggle to inspect bid vs ask walls.',
      ],
    },
    {
      title: isId ? 'Panel 2: Radar Konfluensi 12 Algoritma' : 'Panel 2: 12-Indicator Confluence Matrix',
      subtitle: isId ? 'Validasi Statistik Berbasis Data Kuantitatif' : 'Multi-Strategy Statistical Consensus',
      description: isId
        ? 'Menghitung secara objektif konsensus 12 indikator kuantitatif (SMC, RSI, VWAP, Orderflow, Fibonacci, Gamma Exposure) dengan skor 0–100.'
        : 'Objectively computes consensus across 12 quantitative models (SMC, RSI, VWAP, Order Flow, Fib, Gamma Exposure) from 0 to 100.',
      icon: Gauge,
      iconColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      tips: [
        isId ? 'Tekan shortcut [R] kapan saja untuk memindai ulang konfluensi.' : 'Press shortcut [R] anytime to re-scan the market confluence.',
        isId ? 'Filter indikator berdasarkan kategori: Bullish, Bearish, atau SMC.' : 'Filter indicators by category: Bullish, Bearish, or SMC.',
      ],
    },
    {
      title: isId ? 'Panel 3 & 4: Likuiditas & Eksekusi Cepat' : 'Panel 3 & 4: Liquidity Traps & Fast Execution',
      subtitle: isId ? 'Deteksi Jebakan Whale & Pasang Posisi Terukur' : 'Detect Whale Clusters & Execute Sized Orders',
      description: isId
        ? 'Heatmap likuidasi mendeteksi klaster stop loss pasar, sementara meja eksekusi memungkinkan penempatan paper trade dengan level Stop Loss & Target R:R otomatis.'
        : 'Liquidation heatmap maps out stop-hunt clusters, while the execution desk lets you simulate trades with auto-calculated SL and TP levels.',
      icon: ShieldCheck,
      iconColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      tips: [
        isId ? 'Pantau posisi berjalan di bar bawah (Active Positions Bar).' : 'Monitor active running trades on the bottom bar with live PnL.',
        isId ? 'Gunakan kalkulator ukuran posisi untuk menjaga risiko modal ≤ 2% per transaksi.' : 'Use position sizing calculator to keep risk per trade ≤ 2%.',
      ],
    },
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('imasbtc_onboarding_completed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in font-mono">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#0b0f19] border-cyan-500/30 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              {isId ? `Langkah ${step + 1} dari ${steps.length}` : `Step ${step + 1} of ${steps.length}`}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {isId ? 'Tur Meja Kerja' : 'Workspace Tour'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border shrink-0 ${currentStep.iconColor}`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentStep.title}
              </h3>
              <p className="text-xs text-cyan-400 font-semibold mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {currentStep.description}
          </p>

          {/* Pro Tips */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              💡 {isId ? 'Tips Efisiensi' : 'Pro Tips'}:
            </div>
            {currentStep.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{tip}</span>
              </div>
            ))}
          </div>

          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/40">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
              step === 0
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : isDark
                ? 'hover:bg-slate-800 text-slate-300'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isId ? 'Kembali' : 'Back'}</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>{step === steps.length - 1 ? (isId ? 'Selesai & Mulai Trading' : 'Finish & Trade') : isId ? 'Lanjut' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
