import React, { useState } from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  Radio,
  ArrowRight,
  Zap,
  Server,
  Cpu,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  ExternalLink,
} from 'lucide-react';
import { SignalPipelineStage } from '../../types/signal.types';
import { Language } from '../../i18n/translations';

interface SignalPipelineVisualizerProps {
  isDark: boolean;
  lang: Language;
  onTriggerScan?: () => void;
  isScanning?: boolean;
  activeStage?: SignalPipelineStage;
}

export const SignalPipelineVisualizer: React.FC<SignalPipelineVisualizerProps> = ({
  isDark,
  lang,
  onTriggerScan,
  isScanning = false,
  activeStage = 'PUBLISHED',
}) => {
  const isId = lang === 'id';
  const [selectedStageTab, setSelectedStageTab] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const stages = [
    {
      id: 1,
      code: 'INGEST',
      name: isId ? '1. Ingest & Normalization' : '1. Ingest & Normalization',
      subtitle: isId ? 'Backend / CCXT / WebSocket' : 'Backend / CCXT / WebSocket Feed',
      icon: Server,
      color: 'text-pink-400',
      borderColor: 'border-pink-500/40',
      bgColor: 'bg-pink-500/10',
      summary: isId
        ? 'Mengumpulkan data real-time asinkron dari Binance, Bybit, dan OKX (Tick harga, volume L2, dan data likuidasi derivatif) secara dinormalisasi.'
        : 'Asynchronously aggregate real-time exchange feeds via CCXT & WebSockets with normalized data contracts.',
      metrics: [
        { label: isId ? 'Koneksi Feed' : 'Feed Source', val: 'CCXT + Binance/Bybit WS' },
        { label: isId ? 'Throughput' : 'Data Ingestion', val: '1,480 ticks/detik' },
        { label: isId ? 'Latensi Rata-rata' : 'Ingest Latency', val: '18ms' },
        { label: isId ? 'Pasangan Termonitor' : 'Active Pairs', val: '54 Crypto Pairs' },
      ],
      details: isId
        ? [
            'Normalisasi format data ticker, candlestick OHLCV, dan orderbook lintas bursa ke standar seragam.',
            'Stream volume likuidasi real-time untuk mendeteksi sapuan likuiditas (liquidity sweep).',
            'Sinkronisasi delta volume kumulatif (CVD) dan Open Interest (OI) asinkron.',
          ]
        : [
            'Normalized OHLCV, tick, and orderbook schema across multi-exchange sources.',
            'Real-time liquidation spike stream tracking derivative sweeps.',
            'Asynchronous sync of Cumulative Volume Delta (CVD) and Open Interest.',
          ],
    },
    {
      id: 2,
      code: 'INSTITUTIONAL_LOGIC',
      name: isId ? '2. Institutional Logic Layer' : '2. Institutional Logic Layer',
      subtitle: isId ? 'SMC / ICT & Technical Confluence' : 'SMC / ICT & Volume Confluence',
      icon: Cpu,
      color: 'text-pink-400',
      borderColor: 'border-pink-500/40',
      bgColor: 'bg-pink-500/10',
      summary: isId
        ? 'Menerapkan algoritma pendeteksi struktur pasar (MSS, Order Block demand/supply, FVG) dan anomali VWAP guna memfilter false breakout (noise).'
        : 'Applies market structure algorithms (MSS, Order Block, FVG, VWAP anomaly) to filter market noise.',
      metrics: [
        { label: isId ? 'Model Struktur' : 'Structure Model', val: 'MSS + FVG + Order Block' },
        { label: isId ? 'Penyaring Noise' : 'Noise Filtering', val: 'VWAP 2σ + Volume Z-Score' },
        { label: isId ? 'Setup Terdeteksi' : 'Detected Setups', val: '18 Pola Valid' },
        { label: isId ? 'Konfirmasi Candle' : 'Candle Close', val: '15m / 1H / 4H Closes' },
      ],
      details: isId
        ? [
            'Market Structure Shift (MSS): Deteksi pergeseran struktur higher high / lower low institusional.',
            'Order Block (OB) & Fair Value Gap (FVG): Penandaan area ketidakseimbangan likuiditas bank/whale.',
            'Volume VWAP Anomaly: Menghindari trap breakout dengan memeriksa konfirmasi volume institusional.',
          ]
        : [
            'Market Structure Shift (MSS): Detects institutional swing structural breaks.',
            'Order Block & FVG: Identifies smart money imbalances and liquidity sweeps.',
            'VWAP Volume Anomaly: Prevents fakeouts through institutional volume validation.',
          ],
    },
    {
      id: 3,
      code: 'RISK_FILTER',
      name: isId ? '3. Scoring & Risk Filtering' : '3. Scoring & Risk Filtering',
      subtitle: isId ? 'Risk-Reward Engine & Funding Filter' : 'Risk-Reward Engine & Compliance',
      icon: Scale,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      bgColor: 'bg-amber-500/10',
      summary: isId
        ? 'Memberikan Confidence Score (0-100) dan memvalidasi 4 komponen wajib (Direction, Entry, SL, TP). Sinyal tanpa SL atau R:R < 1:1.5 difilter atau diberi peringatan.'
        : 'Calculates confidence score, enforces 4 mandatory components (Direction, Entry, SL, TP) and eliminates bad R:R setups.',
      metrics: [
        { label: isId ? 'Standar Wajib' : 'Mandatory Components', val: '4 Komponen (Dir, Entry, SL, TP)' },
        { label: isId ? 'Minimal R:R' : 'Min R:R Threshold', val: '1 : 1.5 (Ideal ≥ 1:2.5)' },
        { label: isId ? 'Analisis Funding' : 'Funding Rate Metric', val: 'Short/Long Squeeze Check' },
        { label: isId ? 'Sinyal Ditolak' : 'Noise Filtered', val: '76% Setup Dieliminasi' },
      ],
      details: isId
        ? [
            'Filosofi Tanpa Kompromi: Sinyal tanpa batas risiko (Stop Loss) otomatis ditolak.',
            'Penyaringan Rasio Risk-Reward: Target profit harus proporsional terhadap jarak risiko kerugian.',
            'Pemeriksaan Funding Rate: Mencegah posisi long saat funding ekstrim tinggi atau short saat squeeze funding minus.',
          ]
        : [
            'Strict Risk Mandate: Any signal lacking a defined Stop Loss is disqualified.',
            'Risk-Reward Filter: Profit targets must be mathematically favorable vs SL distance.',
            'Funding Rate Bias: Guards against crowded funding traps and short squeeze risks.',
          ],
    },
    {
      id: 4,
      code: 'PUBLISHED',
      name: isId ? '4. Frontend Rendering & Alert' : '4. Frontend Rendering & Alert',
      subtitle: isId ? 'UI Real-Time & MarketOwl Tracking' : 'Real-Time Alert & Tracking',
      icon: Radio,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      bgColor: 'bg-emerald-500/10',
      summary: isId
        ? 'Menyajikan sinyal di UI dengan timestamp resmi transparan, pembaruan status dinamis, dan pelacakan historis akuntabel (TP tercapai vs SL hit).'
        : 'Displays verified signals with official timestamp, live PnL tracking, and transparent performance verification.',
      metrics: [
        { label: isId ? 'Publikasi' : 'Publication', val: 'Official Timestamp & Hash' },
        { label: isId ? 'Broadcast' : 'Alert Dispatch', val: 'Telegram VIP + Webhook' },
        { label: isId ? 'Akuntabilitas' : 'Accountability', val: 'Audit Trail & Win Rate' },
        { label: isId ? 'Status Dinamis' : 'Tracking Mode', val: 'ACTIVE / TP1-3 / SL' },
      ],
      details: isId
        ? [
            'Pembaruan Status Real-Time: Pelacakan jarak harga terhadap Entry, TP 1-3, dan Stop Loss.',
            'Cap Waktu Transparan: Setiap sinyal memiliki timestamp paten dan kode verifikasi audit.',
            'Verifikasi Kinerja Historis: Menguji performa secara objektif apakah mencapai TP atau terkena SL.',
          ]
        : [
            'Dynamic Real-Time Updates: Live tracking of price distance to Entry, TP1-3, and Stop Loss.',
            'Transparent Publication Timestamp: Every signal carries an official audit hash.',
            'Performance Verification: Objective historical tracking of hits vs stops.',
          ],
    },
  ];

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-mono font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isId ? 'Workflow Implementasi Sinyal Real-Time' : 'Real-Time Signal Operational Pipeline'}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                MARKETOWL STANDARD
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {isId
                ? 'Pipeline data 4-tahap: Ingest & Normalization → Institutional Logic → Risk Filter → Frontend Alert'
                : '4-Stage End-to-End Data & Analytics Pipeline from exchange ingestion to verified performance tracking'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onTriggerScan && (
            <button
              onClick={onTriggerScan}
              disabled={isScanning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isScanning
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-500 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? (isId ? 'Memproses Pipeline...' : 'Running Pipeline...') : (isId ? 'Scan Bursa CCXT' : 'Run CCXT Ingest Scan')}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition text-xs font-mono"
            title={isExpanded ? 'Kecilkan tampilan pipeline' : 'Buka detail pipeline'}
          >
            {isExpanded ? (isId ? 'Ringkas' : 'Collapse') : (isId ? 'Detail' : 'Expand')}
          </button>
        </div>
      </div>

      {/* 4 Pipeline Stage Stepper */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {stages.map((stage, idx) => {
            const StageIcon = stage.icon;
            const isSelected = selectedStageTab === idx;
            const isCurrentActive = isScanning && (
              (idx === 0 && activeStage === 'INGEST') ||
              (idx === 1 && activeStage === 'INSTITUTIONAL_LOGIC') ||
              (idx === 2 && activeStage === 'RISK_FILTER') ||
              (idx === 3 && activeStage === 'PUBLISHED')
            );

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageTab(idx)}
                className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? `${stage.bgColor} ${stage.borderColor} shadow-xs`
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Active Stage Indicator */}
                {isCurrentActive && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                  </span>
                )}

                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-1.5 rounded-lg ${stage.bgColor} ${stage.color}`}>
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                      {stage.subtitle}
                    </div>
                    <div className={`text-xs font-mono font-bold truncate ${isSelected ? stage.color : isDark ? 'text-white' : 'text-slate-900'}`}>
                      {stage.name}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-slate-400 line-clamp-2 leading-relaxed">
                  {stage.summary}
                </p>

                {/* Stage Step Status */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Tahap {stage.id}/4</span>
                  <span className={`font-bold flex items-center gap-1 ${stage.color}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Aktif</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Interactive Detail Inspector */}
        {isExpanded && (
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            } space-y-3 font-mono text-xs animate-in fade-in`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-md ${stages[selectedStageTab].bgColor} ${stages[selectedStageTab].color}`}>
                  {React.createElement(stages[selectedStageTab].icon, { className: 'w-4 h-4' })}
                </span>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    {stages[selectedStageTab].name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {stages[selectedStageTab].subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Status Engine: Terkalibrasi & Normal</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stages[selectedStageTab].metrics.map((m, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">{m.label}</div>
                  <div className="font-bold text-slate-200 text-xs mt-0.5">{m.val}</div>
                </div>
              ))}
            </div>

            {/* Operational Specs Checklist */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-300">
                {isId ? 'Spesifikasi & Mekanisme Algoritma:' : 'Algorithmic Specifications & Execution Rules:'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {stages[selectedStageTab].details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
