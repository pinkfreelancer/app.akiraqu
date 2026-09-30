import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  Compass,
  Layers,
  FlaskConical,
  Zap,
  BellRing,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
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
  UserCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  LayoutGrid,
  Columns,
  Maximize2,
  RefreshCw,
  EyeOff,
  X,
} from 'lucide-react';
import { StageId } from '../types/market.types';
import { Language } from '../i18n/translations';

export type TraderPersona = 'full_cycle' | 'scalper' | 'swing' | 'bot_algo' | 'portfolio';

export interface WorkflowStep {
  stepId: number;
  key: string;
  name: { id: string; en: string };
  categoryLabel: { id: string; en: string };
  question: { id: string; en: string };
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
  onPersonaChange?: (persona: TraderPersona) => void;
  activePersona?: TraderPersona;
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
  onPersonaChange,
  activePersona = 'full_cycle',
  workspaceMode = 'classic',
  onSelectWorkspaceMode,
  onTriggerAnalyze,
  isAnalyzing = false,
  onClose,
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [persona, setPersona] = useState<TraderPersona>(activePersona);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (activePersona !== persona) {
      setPersona(activePersona);
    }
  }, [activePersona]);

  const handlePersonaSelect = (newPersona: TraderPersona) => {
    setPersona(newPersona);
    if (onPersonaChange) {
      onPersonaChange(newPersona);
    }
  };

  // 7 Workflow Steps definition
  const WORKFLOW_STEPS: WorkflowStep[] = useMemo(
    () => [
      {
        stepId: 1,
        key: 'macro',
        name: { id: '01. Buka Sesi', en: '01. Session Open' },
        categoryLabel: { id: 'Data Makro & Konteks', en: 'Macro & Context Data' },
        question: {
          id: '"Apa yang terjadi di pasar hari ini?"',
          en: '"What is happening in the global market today?"',
        },
        actionTip: {
          id: 'Periksa Dominasi BTC, data On-Chain & sentimen makro sebelum entry.',
          en: 'Review BTC dominance, on-chain flows & macro catalysts prior to entries.',
        },
        icon: Globe,
        color: 'text-cyan-400',
        borderColor: 'border-cyan-500/40',
        bgColor: 'bg-cyan-500/10',
        modules: [
          { id: 'btc_dominance', label: { id: 'Dominasi BTC/Alt', en: 'BTC/Alt Dominance' }, icon: PieChart, isPrimary: true },
          { id: 'onchain_data', label: { id: 'Data On-Chain', en: 'On-Chain Metrics' }, icon: Database },
          { id: 'economic_calendar', label: { id: 'Kalender Ekonomi', en: 'Economic Calendar' }, icon: Calendar },
          { id: 'sentiment', label: { id: 'Berita & Sentimen', en: 'News & Sentiment' }, icon: Newspaper, badge: 'Alert' },
        ],
      },
      {
        stepId: 2,
        key: 'market',
        name: { id: '02. Cari Peluang', en: '02. Find Opportunities' },
        categoryLabel: { id: 'Pasar & Screening', en: 'Market & Screening' },
        question: {
          id: '"Koin apa yang menarik hari ini?"',
          en: '"Which crypto assets look compelling today?"',
        },
        actionTip: {
          id: 'Gunakan Heatmap dan Filter Screener untuk menyaring koin bervolume tinggi.',
          en: 'Use Heatmaps & coin screeners to filter highest momentum and volume assets.',
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
        name: { id: '03. Validasi Sinyal', en: '03. Validate Signals' },
        categoryLabel: { id: 'Indikator & Teknikal', en: 'Technical & Indicators' },
        question: {
          id: '"Apakah sinyal teknikal & konfluensinya kuat?"',
          en: '"Is the technical signal & confluence strong enough?"',
        },
        actionTip: {
          id: 'Konfirmasi struktur chart, 12 indikator kuantitatif, dan kedalaman Order Flow.',
          en: 'Confirm chart structure, 12 quantitative indicators, and Order Flow liquidity.',
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
        categoryLabel: { id: 'Riset & Strategi', en: 'Research & Strategy' },
        question: {
          id: '"Berapa besar posisi yang aman dan terukur?"',
          en: '"What is the mathematically sound position size?"',
        },
        actionTip: {
          id: 'Hitung Stop Loss, Target TP, dan Rasio Risk/Reward sebelum entry.',
          en: 'Calculate stop loss, take profit targets & R:R ratio before placing orders.',
        },
        icon: FlaskConical,
        color: 'text-indigo-400',
        borderColor: 'border-indigo-500/40',
        bgColor: 'bg-indigo-500/10',
        modules: [
          { id: 'risk', label: { id: 'Kalkulator Risiko', en: 'Risk Calculator' }, icon: Calculator, isPrimary: true },
          { id: 'backtest', label: { id: 'Backtest Lab', en: 'Backtest Lab' }, icon: RotateCcw },
          { id: 'return_distribution', label: { id: 'Distribusi Return', en: 'Return Distribution' }, icon: BarChart3 },
          { id: 'output', label: { id: 'Laporan AI', en: 'AI Report' }, icon: Sparkles, badge: 'AI' },
        ],
      },
      {
        stepId: 5,
        key: 'execution',
        name: { id: '05. Eksekusi', en: '05. Execute Trades' },
        categoryLabel: { id: 'Eksekusi Aktif', en: 'Active Execution' },
        question: {
          id: '"Masuk posisi sesuai strategi"',
          en: '"Deploy capital into active positions"',
        },
        actionTip: {
          id: 'Eksekusi order spot/futures dengan sizing otomatis & monitoring pending orders.',
          en: 'Execute spot/futures orders with automated sizing and order book management.',
        },
        icon: Zap,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        bgColor: 'bg-emerald-500/10',
        modules: [
          { id: 'manual_trading', label: { id: 'Trading Manual', en: 'Manual Trading' }, icon: Zap, badge: 'Live', isPrimary: true },
          { id: 'bot', label: { id: 'Trading Bot', en: 'Trading Bot' }, icon: Activity },
          { id: 'position_sizing', label: { id: 'Position Sizing', en: 'Position Sizing' }, icon: Calculator },
          { id: 'active_orders', label: { id: 'Manajemen Order', en: 'Order Manager' }, icon: Layers },
        ],
      },
      {
        stepId: 6,
        key: 'connection',
        name: { id: '06. Pantau', en: '06. Monitor & Alerts' },
        categoryLabel: { id: 'Koneksi & Alert', en: 'Connections & Alerts' },
        question: {
          id: '"Set alert & pantau posisi berjalan"',
          en: '"Set smart triggers and monitor open PnL"',
        },
        actionTip: {
          id: 'Pasang alert otomatis agar tidak perlu memantau layar terus menerus.',
          en: 'Configure smart price & indicator alerts to automate active monitoring.',
        },
        icon: BellRing,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/40',
        bgColor: 'bg-purple-500/10',
        modules: [
          { id: 'alerts', label: { id: 'Alert Builder', en: 'Alert Builder' }, icon: BellRing, isPrimary: true },
          { id: 'portfolio', label: { id: 'Portofolio', en: 'Portfolio' }, icon: Wallet },
          { id: 'multi_exchange', label: { id: 'Multi-Exchange', en: 'Multi-Exchange' }, icon: Layers },
        ],
      },
      {
        stepId: 7,
        key: 'evaluation',
        name: { id: '07. Evaluasi', en: '07. Evaluate & Log' },
        categoryLabel: { id: 'Evaluasi & Riwayat', en: 'Review & Analytics' },
        question: {
          id: '"Bagaimana hasilnya, apa yang bisa diperbaiki?"',
          en: '"What were the results and actionable improvements?"',
        },
        actionTip: {
          id: 'Catat pelajaran ke Jurnal Trading & analisis winrate di Laporan Kinerja.',
          en: 'Record post-trade notes in Trading Journal & audit metrics in Performance Report.',
        },
        icon: BookOpen,
        color: 'text-teal-400',
        borderColor: 'border-teal-500/40',
        bgColor: 'bg-teal-500/10',
        modules: [
          { id: 'journal', label: { id: 'Jurnal Trading', en: 'Trading Journal' }, icon: BookOpen, isPrimary: true },
          { id: 'reports', label: { id: 'Laporan Kinerja', en: 'Performance Report' }, icon: BarChart3, badge: 'CSV' },
        ],
      },
    ],
    []
  );

  // Determine active step index based on current stage
  const currentStepIndex = useMemo(() => {
    for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
      if (WORKFLOW_STEPS[i].modules.some((m) => m.id === currentStage)) {
        return i;
      }
    }
    // If settings or unmapped, default to step 1
    return 0;
  }, [currentStage, WORKFLOW_STEPS]);

  const activeStep = WORKFLOW_STEPS[currentStepIndex];

  // Helper to check if a step is skipped in the active persona
  const isStepSkippedInPersona = (stepId: number): boolean => {
    if (persona === 'scalper') {
      return stepId === 1 || stepId === 4; // Scalper skips Macro & Heavy Research
    }
    if (persona === 'swing') {
      return false; // Swing covers most
    }
    if (persona === 'bot_algo') {
      return stepId === 1 || stepId === 2; // Bot trader skips manual screening
    }
    if (persona === 'portfolio') {
      return stepId === 3 || stepId === 5; // Portfolio manager skips daily micro tech & manual rapid trade
    }
    return false;
  };

  const personaConfig = {
    full_cycle: {
      name: isId ? 'Siklus Harian Lengkap' : 'Full Daily Cycle',
      desc: isId ? '7 Langkah Lengkap (Buka Sesi → Pantau → Evaluasi)' : 'All 7 Standard Steps',
      badge: 'STANDAR',
    },
    scalper: {
      name: isId ? 'Scalper (Cepat)' : 'Scalper Mode',
      desc: isId ? 'Grafik Utama → Order Flow → Eksekusi Cepat' : 'Main Chart → Order Flow → Instant Execution',
      badge: 'FAST',
    },
    swing: {
      name: isId ? 'Swing Trader' : 'Swing Trader',
      desc: isId ? 'Makro → Screening → Riset → Eksekusi → Evaluasi' : 'Macro → Screener → Research → Execution',
      badge: 'MULTI-DAY',
    },
    bot_algo: {
      name: isId ? 'Bot / Algo User' : 'Bot & Algo Trader',
      desc: isId ? 'Backtest Lab → Trading Bot → Evaluasi Kinerja' : 'Backtest Lab → Trading Bot → Evaluation',
      badge: 'AUTOMATED',
    },
    portfolio: {
      name: isId ? 'Portfolio Manager' : 'Portfolio Manager',
      desc: isId ? 'Makro → Korelasi & Beta → Portofolio Aset' : 'Macro → Correlation Matrix → Portfolio',
      badge: 'ALLOCATION',
    },
  };

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
      className={`rounded-2xl border transition-all duration-200 mb-4 overflow-hidden ${
        isDark ? 'bg-[#0b101b] border-[#1e293b] shadow-lg shadow-black/40' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Top Header: Persona Selector & Workflow Status */}
      <div
        className={`px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isDark ? 'border-slate-800/80 bg-[#0e1626]/70' : 'border-slate-100 bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>{isId ? 'MEJA KERJA TRADER' : 'TRADER WORKSPACE'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-500 text-xs font-mono">
            <span>•</span>
            <span>{isId ? 'Alur Kerja:' : 'Workflow:'}</span>
          </div>

          {/* Persona Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar max-w-[calc(100vw-120px)] sm:max-w-none">
            {(Object.keys(personaConfig) as TraderPersona[]).map((pKey) => {
              const isActive = persona === pKey;
              const cfg = personaConfig[pKey];
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => handlePersonaSelect(pKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-pink-600 text-white shadow-xs font-bold'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title={cfg.desc}
                >
                  <span>{cfg.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Modes & Action / Minimize Toggle */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Layout Mode Presets */}
          {onSelectWorkspaceMode && (
            <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onSelectWorkspaceMode('classic')}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  workspaceMode === 'classic'
                    ? 'bg-pink-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isId ? 'Tampilan Fokus Alur Tunggal (1 Modul Penuh)' : 'Focused Single View'}
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">{isId ? 'Fokus' : 'Focus'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectWorkspaceMode('split')}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  workspaceMode === 'split'
                    ? 'bg-pink-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isId ? 'Tampilan Split (Chart Jangkar di Kiri + Modul Aktif di Kanan)' : 'Split Master-Detail Anchor View'}
              >
                <Columns className="w-3 h-3 text-pink-400" />
                <span className="hidden sm:inline">{isId ? 'Split Chart' : 'Split'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectWorkspaceMode('launchpad')}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  workspaceMode === 'launchpad'
                    ? 'bg-pink-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isId ? 'Meja Kerja 4 Kuadran (Launchpad Grid)' : 'Quad-Grid Workspace'}
              >
                <LayoutGrid className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          )}

          {/* Quick Trigger Analyze Button */}
          {onTriggerAnalyze && (
            <button
              type="button"
              onClick={onTriggerAnalyze}
              disabled={isAnalyzing}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAnalyzing
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 animate-pulse cursor-not-allowed'
                  : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:text-pink-300 hover:border-pink-500/40'
              }`}
              title={isId ? 'Jalankan kalkulasi kuantitatif 12 indikator' : 'Run 12-indicator quant scan'}
            >
              <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin text-pink-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline">{isAnalyzing ? (isId ? 'Memindai...' : 'Scanning...') : (isId ? 'Scan Kuantitatif' : 'Quant Scan')}</span>
            </button>
          )}

          <span className="hidden md:inline-block text-[11px] font-mono text-slate-400">
            {isId ? 'Tahap' : 'Step'} <strong className="text-pink-400">{currentStepIndex + 1}</strong> / 7
          </span>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-black'
            }`}
            title={isCollapsed ? (isId ? 'Buka Panduan Alur' : 'Expand Workflow') : (isId ? 'Ciutkan Panduan' : 'Collapse Workflow')}
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
              title={isId ? 'Sembunyikan Meja Kerja Trader (Tekan H atau tombol di Header untuk membuka kembali)' : 'Hide Trader Workbench (Press H or click Header button to reopen)'}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 7-Step Stepper Bar (Horizontal) */}
      <div
        className={`px-3 sm:px-4 py-2.5 overflow-x-auto no-scrollbar border-b ${
          isDark ? 'border-slate-800/60 bg-[#090d16]' : 'border-slate-100 bg-slate-50/40'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-[760px] lg:min-w-0 justify-between">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            const isSkipped = isStepSkippedInPersona(step.stepId);
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.stepId}>
                <button
                  type="button"
                  onClick={() => {
                    const target = step.modules.find((m) => m.isPrimary) || step.modules[0];
                    onSelectStage(target.id);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-left group cursor-pointer border ${
                    isCurrent
                      ? `${step.bgColor} ${step.borderColor} ring-1 ring-pink-500/40 shadow-xs`
                      : isSkipped
                      ? isDark
                        ? 'bg-slate-900/40 border-slate-800/40 opacity-45 hover:opacity-80'
                        : 'bg-slate-100/40 border-slate-200/40 opacity-45 hover:opacity-80'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
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
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[11px] font-mono font-bold truncate block ${
                            isCurrent ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          {isId ? step.name.id : step.name.en}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 truncate block font-sans">
                        {isSkipped ? (isId ? '(Dilewati)' : '(Skipped)') : (isId ? step.categoryLabel.id : step.categoryLabel.en)}
                      </span>
                    </div>
                  </div>
                </button>

                {idx < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 hidden lg:block ${
                      idx < currentStepIndex ? 'text-emerald-500/40' : 'text-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Expanded Active Step Guidance & Quick Sub-module Pill Navigators */}
      {!isCollapsed && activeStep && (
        <div className={`p-3.5 sm:p-4 ${isDark ? 'bg-[#0f172a]/70' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Guiding Question & Action Tip */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${activeStep.bgColor} ${activeStep.color} border ${activeStep.borderColor}`}>
                  <activeStep.icon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                    <span>{isId ? activeStep.question.id : activeStep.question.en}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {isId ? activeStep.actionTip.id : activeStep.actionTip.en}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Sub-module Switcher for Active Step */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1">
                {isId ? 'Akses Modul:' : 'Step Modules:'}
              </span>
              {activeStep.modules.map((mod) => {
                const isSelected = currentStage === mod.id;
                const ModIcon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onSelectStage(mod.id)}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-500 shadow-xs font-bold'
                        : isDark
                        ? 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:border-pink-500/50 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-pink-400 hover:bg-slate-200'
                    }`}
                  >
                    <ModIcon className="w-3.5 h-3.5" />
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
              <div className="flex items-center gap-1 ml-auto pt-1 lg:pt-0">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={`p-1.5 rounded-xl border font-mono text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                    isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isId ? 'Langkah Sebelumnya' : 'Previous Step'}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>{isId ? 'Langkah Berikutnya' : 'Next Step'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
