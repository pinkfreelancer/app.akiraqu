import React, { useState, useMemo } from 'react';
import {
  Globe,
  Compass,
  Layers,
  FlaskConical,
  Zap,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Flame,
  Radio,
  BarChart3,
  TrendingUp,
  Star,
  PieChart,
  Database,
  Calendar,
  Newspaper,
  CandlestickChart,
  Gauge,
  Activity,
  Calculator,
  RotateCcw,
  Sliders,
  Wallet,
  Settings,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  EyeOff,
} from 'lucide-react';
import { StageId } from '../types/market.types';
import { Language } from '../i18n/translations';

export type TraderPersona = 'full_cycle' | 'scalper' | 'swing' | 'bot_algo' | 'portfolio';

export interface WorkflowStep {
  stepId: number;
  key: string;
  name: { id: string; en: string };
  categoryLabel: { id: string; en: string };
  actionTip: { id: string; en: string };
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  modules: {
    id: StageId;
    label: { id: string; en: string };
    icon: React.ElementType;
    badge?: string;
    isPrimary?: boolean;
  }[];
}

interface TraderWorkflowBarProps {
  currentStage: StageId;
  onSelectStage: (stage: StageId) => void;
  lang?: Language;
  theme?: 'light' | 'dark';
  onPersonaChange?: (persona: any) => void;
  activePersona?: string;
  workspaceMode?: 'classic' | 'split' | 'launchpad';
  onSelectWorkspaceMode?: (mode: 'classic' | 'split' | 'launchpad') => void;
  onTriggerAnalyze?: () => void;
  isAnalyzing?: boolean;
  onClose?: () => void;
}

export const TraderWorkflowBar: React.FC<TraderWorkflowBarProps> = ({
  currentStage,
  onSelectStage,
  lang = 'id',
  theme = 'dark',
  onClose,
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // 7 Workflow Steps definition (Complete & Clean)
  const WORKFLOW_STEPS: WorkflowStep[] = useMemo(
    () => [
      {
        stepId: 1,
        key: 'macro',
        name: { id: '01. Buka Sesi', en: '01. Session Open' },
        categoryLabel: { id: 'Data Makro & Konteks', en: 'Macro Context' },
        actionTip: {
          id: 'Periksa Dominasi BTC, data On-Chain & sentimen sebelum entry.',
          en: 'Review BTC dominance, on-chain flows & macro catalysts.',
        },
        icon: Globe,
        color: 'text-pink-400',
        borderColor: 'border-pink-500/40',
        bgColor: 'bg-pink-500/10',
        modules: [
          { id: 'btc_dominance', label: { id: 'Dominasi BTC', en: 'BTC Dominance' }, icon: PieChart, isPrimary: true },
          { id: 'onchain_data', label: { id: 'Data On-Chain', en: 'On-Chain Metrics' }, icon: Database },
          { id: 'economic_calendar', label: { id: 'Kalender Ekonomi', en: 'Economic Calendar' }, icon: Calendar },
          { id: 'sentiment', label: { id: 'Berita & Sentimen', en: 'News & Sentiment' }, icon: Newspaper, badge: 'Alert' },
        ],
      },
      {
        stepId: 2,
        key: 'market',
        name: { id: '02. Cari Peluang', en: '02. Find Opportunity' },
        categoryLabel: { id: 'Pasar & Screening', en: 'Market Screener' },
        actionTip: {
          id: 'Gunakan Heatmap dan Filter Screener untuk menyaring koin berpotensi.',
          en: 'Scan heatmaps & screeners for high-momentum crypto pairs.',
        },
        icon: Compass,
        color: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        bgColor: 'bg-amber-500/10',
        modules: [
          { id: 'market_heatmap', label: { id: 'Heatmap Pasar', en: 'Market Heatmap' }, icon: Flame, isPrimary: true },
          { id: 'gainers_losers', label: { id: 'Gainers & Losers', en: 'Gainers & Losers' }, icon: TrendingUp },
          { id: 'screening', label: { id: 'Penyaring Koin', en: 'Coin Screener' }, icon: BarChart3, badge: 'Filter' },
          { id: 'watchlist', label: { id: 'Watchlist', en: 'Watchlist' }, icon: Star },
          { id: 'signal', label: { id: 'Sinyal Trading', en: 'Trading Signals' }, icon: Radio, badge: 'LIVE' },
        ],
      },
      {
        stepId: 3,
        key: 'technical',
        name: { id: '03. Validasi Sinyal', en: '03. Validate Signal' },
        categoryLabel: { id: 'Indikator & Teknikal', en: 'Technical & Flow' },
        actionTip: {
          id: 'Konfirmasi struktur chart, 12 indikator kuantitatif & Order Flow.',
          en: 'Confirm candlestick structure, 12 quant indicators & order flow.',
        },
        icon: Layers,
        color: 'text-pink-400',
        borderColor: 'border-pink-500/40',
        bgColor: 'bg-pink-500/10',
        modules: [
          { id: 'ticker', label: { id: 'Grafik Utama', en: 'Main Chart' }, icon: CandlestickChart, isPrimary: true },
          { id: 'indicators', label: { id: '12 Indikator', en: '12 Indicators' }, icon: Layers },
          { id: 'confluence', label: { id: 'Skor Konfluensi', en: 'Confluence Score' }, icon: Gauge },
          { id: 'mtf_screener', label: { id: 'Screener MTF', en: 'MTF Screener' }, icon: Layers },
          { id: 'orderflow', label: { id: 'Order Flow', en: 'Order Flow' }, icon: Flame },
          { id: 'volatility_scanner', label: { id: 'Volatility Scanner', en: 'Volatility Scanner' }, icon: Activity },
          { id: 'correlation_beta', label: { id: 'Correlation & Beta', en: 'Correlation & Beta' }, icon: Activity },
        ],
      },
      {
        stepId: 4,
        key: 'research',
        name: { id: '04. Hitung Risiko', en: '04. Calculate Risk' },
        categoryLabel: { id: 'Riset & Sizing', en: 'Risk & Sizing' },
        actionTip: {
          id: 'Tentukan ukuran lot posisi proporsional & rasio Risk-Reward.',
          en: 'Calculate position sizing, stop-loss distance & Kelly fraction.',
        },
        icon: FlaskConical,
        color: 'text-indigo-400',
        borderColor: 'border-indigo-500/40',
        bgColor: 'bg-indigo-500/10',
        modules: [
          { id: 'risk', label: { id: 'Kalkulator Risiko', en: 'Risk Calculator' }, icon: Calculator, isPrimary: true },
          { id: 'position_sizing', label: { id: 'Position Sizing', en: 'Position Sizing' }, icon: Calculator },
          { id: 'return_distribution', label: { id: 'Distribusi Return', en: 'Return Distribution' }, icon: BarChart3 },
        ],
      },
      {
        stepId: 5,
        key: 'execution',
        name: { id: '05. Eksekusi Order', en: '05. Execute Trade' },
        categoryLabel: { id: 'Trading & Eksekusi', en: 'Execution Desk' },
        actionTip: {
          id: 'Kirim order trading dan pantau antrean orderbook bursa.',
          en: 'Dispatch smart orders & manage live orderbook queue.',
        },
        icon: Zap,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        bgColor: 'bg-emerald-500/10',
        modules: [
          { id: 'trading', label: { id: 'Terminal Eksekusi', en: 'Execution Desk' }, icon: Zap, isPrimary: true },
          { id: 'active_orders', label: { id: 'Order Aktif', en: 'Active Orders' }, icon: ClockIcon },
        ],
      },
      {
        stepId: 6,
        key: 'algo',
        name: { id: '06. Lab Algoritma', en: '06. Algo Lab' },
        categoryLabel: { id: 'Bot & Backtest', en: 'Bot & Backtest' },
        actionTip: {
          id: 'Uji strategi historis & kelola otomatisasi Grid / DCA Bot.',
          en: 'Backtest quantitative models & run automated execution bots.',
        },
        icon: Sliders,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/40',
        bgColor: 'bg-purple-500/10',
        modules: [
          { id: 'bot', label: { id: 'Hub Bot Trading', en: 'Bot Trading Hub' }, icon: Sliders, isPrimary: true },
          { id: 'backtest', label: { id: 'Lab Backtest', en: 'Backtest Lab' }, icon: RotateCcw },
        ],
      },
      {
        stepId: 7,
        key: 'portfolio',
        name: { id: '07. Jurnal Trading', en: '07. Journal & Log' },
        categoryLabel: { id: 'Jurnal & Portofolio', en: 'Journal & Portfolio' },
        actionTip: {
          id: 'Catat hasil trade, pantau Win Rate & kelola integrasi API.',
          en: 'Log trade outcomes, audit win rates & manage multi-exchange APIs.',
        },
        icon: BookOpen,
        color: 'text-teal-400',
        borderColor: 'border-teal-500/40',
        bgColor: 'bg-teal-500/10',
        modules: [
          { id: 'journal', label: { id: 'Jurnal Trading', en: 'Trading Journal' }, icon: BookOpen, isPrimary: true },
          { id: 'portfolio', label: { id: 'Portofolio Akun', en: 'Portfolio Wallet' }, icon: Wallet },
          { id: 'multi_exchange', label: { id: 'Koneksi Bursa API', en: 'Exchange APIs' }, icon: Settings },
        ],
      },
    ],
    []
  );

  // Active step index
  const currentStepIndex = useMemo(() => {
    for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
      if (WORKFLOW_STEPS[i].modules.some((m) => m.id === currentStage)) {
        return i;
      }
    }
    return 2; // Default to Technical / Chart
  }, [currentStage, WORKFLOW_STEPS]);

  const activeStep = WORKFLOW_STEPS[currentStepIndex];

  const handleNextStep = () => {
    const nextIdx = (currentStepIndex + 1) % WORKFLOW_STEPS.length;
    const nextStep = WORKFLOW_STEPS[nextIdx];
    const targetModule = nextStep.modules.find((m) => m.isPrimary) || nextStep.modules[0];
    onSelectStage(targetModule.id);
  };

  const handlePrevStep = () => {
    const prevIdx = (currentStepIndex - 1 + WORKFLOW_STEPS.length) % WORKFLOW_STEPS.length;
    const prevStep = WORKFLOW_STEPS[prevIdx];
    const targetModule = prevStep.modules.find((m) => m.isPrimary) || prevStep.modules[0];
    onSelectStage(targetModule.id);
  };

  return (
    <div
      className={`w-full max-w-full rounded-2xl border transition-all duration-200 mb-4 overflow-hidden ${
        isDark ? 'bg-[#0b101b] border-[#1e293b] shadow-lg shadow-black/40' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Top Header: Title & Step Status */}
      <div
        className={`px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isDark ? 'border-slate-800/80 bg-[#0e1626]/70' : 'border-slate-100 bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>{isId ? 'ALUR KERJA TRADER' : 'TRADER WORKFLOW'}</span>
          </div>

          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            {isId ? 'Tahap Aktif:' : 'Active Step:'} <strong className="text-pink-400 font-bold">{currentStepIndex + 1}/7</strong> ({isId ? activeStep.name.id : activeStep.name.en})
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-black'
            }`}
            title={isCollapsed ? (isId ? 'Buka Detail Alur' : 'Expand Workflow') : (isId ? 'Ciutkan Detail' : 'Collapse Workflow')}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/40'
                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-rose-600'
              }`}
              title={isId ? 'Sembunyikan Meja Kerja Trader (Tekan H)' : 'Hide Workflow Bar (Press H)'}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 7-Step Stepper Bar (Clean Responsive Grid) */}
      <div
        className={`px-3 sm:px-4 py-2 border-b w-full ${
          isDark ? 'border-slate-800/60 bg-[#090d16]' : 'border-slate-100 bg-slate-50/40'
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2 w-full">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            const StepIcon = step.icon;

            return (
              <button
                key={step.stepId}
                type="button"
                onClick={() => {
                  const target = step.modules.find((m) => m.isPrimary) || step.modules[0];
                  onSelectStage(target.id);
                }}
                className={`py-1.5 px-2 rounded-xl transition-all text-left group cursor-pointer border min-w-0 ${
                  isCurrent
                    ? `${step.bgColor} ${step.borderColor} ring-1 ring-pink-500/40 shadow-xs`
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-mono font-bold ${
                      isCurrent
                        ? `${step.color} bg-black/40`
                        : isCompleted
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-slate-500 bg-slate-800/40'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <StepIcon className="w-3 h-3" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[11px] font-mono font-bold truncate block ${
                        isCurrent ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {isId ? step.name.id : step.name.en}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block font-sans">
                      {isId ? step.categoryLabel.id : step.categoryLabel.en}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Active Step Sub-module Pill Navigators (Direct Action) */}
      {!isCollapsed && activeStep && (
        <div className={`px-3.5 sm:px-4 py-2.5 ${isDark ? 'bg-[#0f172a]/70' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Action Tip */}
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${activeStep.bgColor} ${activeStep.color} border ${activeStep.borderColor}`}>
                <activeStep.icon className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-slate-300 font-mono">
                {isId ? activeStep.actionTip.id : activeStep.actionTip.en}
              </p>
            </div>

            {/* Sub-modules */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeStep.modules.map((mod) => {
                const isSelected = currentStage === mod.id;
                const ModIcon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onSelectStage(mod.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-500 shadow-xs font-bold'
                        : isDark
                        ? 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:border-pink-500/50 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-pink-400 hover:bg-slate-200'
                    }`}
                  >
                    <ModIcon className="w-3 h-3" />
                    <span>{isId ? mod.label.id : mod.label.en}</span>
                    {mod.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-pink-500/20 text-pink-300 font-bold">
                        {mod.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Prev / Next Step Buttons */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={`p-1.5 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isId ? 'Tahap Sebelumnya' : 'Previous Step'}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>{isId ? 'Berikutnya' : 'Next'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Clock helper icon
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
