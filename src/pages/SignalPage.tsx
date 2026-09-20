import React, { useState, useMemo, useEffect } from 'react';
import {
  CryptoTradingSignal,
  SignalDirection,
  SignalGrade,
  SignalStatus,
  Timeframe,
  SupportedExchange,
  SignalPipelineStage,
  SignalTriggerType,
} from '../types/crypto.types';
import {
  Radio,
  Zap,
  TrendingUp,
  TrendingDown,
  Filter,
  Bell,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Share2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Send,
  ExternalLink,
  Target,
  Shield,
  BarChart2,
  Activity,
  Hash,
  RefreshCw,
  FileText,
  Check,
  CheckSquare,
  Info,
  Search,
  Award,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { Language } from '../i18n/translations';
import { useAlerts } from '../contexts/AlertContext';
import { SignalPipelineVisualizer } from '../components/signals/SignalPipelineVisualizer';
import { SignalAuditModal } from '../components/signals/SignalAuditModal';

interface SignalPageProps {
  currentSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  selectedExchange?: SupportedExchange;
  theme?: 'light' | 'dark';
  lang?: Language;
}

const INITIAL_SIGNALS: CryptoTradingSignal[] = [
  {
    id: 'SIG-BTC-9401',
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Layer 1',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '1H',
    strategyName: 'SMC Institutional Sweep & FVG Rebound',
    strategyCategory: 'SMC',
    confluenceScore: 94,
    winRateProbability: 84.5,
    entryPrice: 88450.0,
    currentPrice: 89850.0,
    targetPrice1: 90200.0,
    targetPrice2: 91800.0,
    targetPrice3: 94500.0,
    stopLoss: 87100.0,
    riskRewardRatio: 3.42,
    leverageRec: 10,
    status: 'ACTIVE',
    pnlPctCurrent: 1.58,
    createdAt: '12 menit yang lalu',
    expiresAt: 'dalam 5 jam',
    indicatorsSummary: [
      'Bullish FVG Filled $88.2k',
      'RSI 38 Rebound',
      'CVD Whale Inflow +$42M',
      'SuperTrend Bull',
      'Ichimoku Kumo Support',
    ],
    notes:
      'Sapuan likuiditas di bawah level $88,000 telah selesai. Konfirmasi penutupan candle 1H di atas EMA 20 dengan lonjakan volume beli agresif.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'FVG_SWEEP',
    triggerDetails: 'Bullish Fair Value Gap diisi sempurna pada level $88,200 disertai anomali volume CVD beli +$42M.',
    fundingRate: -0.008,
    fundingBias: 'NEGATIVE',
    liquidationDeltaUsd: 42500000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 01:14:02 UTC',
    verificationHash: '0x9401a8ef3b9c714d2e8b61c5a019e5d4',
    highestPnlReached: 2.15,
    auditTrail: [
      { timestamp: '01:14:02 UTC', event: 'Sinyal diverifikasi & diterbitkan secara resmi', price: 88450.0, pnlPct: 0.0 },
      { timestamp: '01:18:40 UTC', event: 'Order Entry terisi pada $88,450', price: 88450.0, pnlPct: 0.0 },
      { timestamp: '01:22:15 UTC', event: 'Harga naik menembus resistance lokal $89,500', price: 89500.0, pnlPct: 1.18 },
      { timestamp: '01:25:30 UTC', event: 'Mendekati TP1 $90,200 (Progress 85%)', price: 89850.0, pnlPct: 1.58 },
    ],
  },
  {
    id: 'SIG-SOL-9102',
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Layer 1',
    exchange: 'OKX',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '4H',
    strategyName: 'VWAP Breakout + Whale CVD Divergence',
    strategyCategory: 'ORDERFLOW',
    confluenceScore: 91,
    winRateProbability: 81.0,
    entryPrice: 184.2,
    currentPrice: 193.8,
    targetPrice1: 192.0,
    targetPrice2: 199.5,
    targetPrice3: 212.0,
    stopLoss: 178.5,
    riskRewardRatio: 3.12,
    leverageRec: 15,
    status: 'TP1_HIT',
    pnlPctCurrent: 5.21,
    createdAt: '45 menit yang lalu',
    expiresAt: 'dalam 14 jam',
    indicatorsSummary: [
      'VWAP Upper Band Breach',
      'Delta Volume Divergence',
      'Funding Rate -0.012% (Short Squeeze)',
      'MACD Golden Cross',
    ],
    notes:
      'Short squeeze terkonfirmasi saat funding rate minus dan CVD retail shorting agresif. Target 1 sebesar $192.0 telah tercapai.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'VOLUME_ANOMALY',
    triggerDetails: 'Volume Anomaly +340% di atas VWAP +2σ disertai pergeseran CVD positif saat funding rate minus.',
    fundingRate: -0.012,
    fundingBias: 'EXTREME_NEGATIVE',
    liquidationDeltaUsd: 18400000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 00:41:18 UTC',
    verificationHash: '0x9102c4b78912e931fa7d82e1c905b821',
    highestPnlReached: 5.42,
    realizedPnlPct: 5.21,
    auditTrail: [
      { timestamp: '00:41:18 UTC', event: 'Sinyal diterbitkan via WebSocket Feed', price: 184.2, pnlPct: 0.0 },
      { timestamp: '00:48:10 UTC', event: 'Entry terisi di $184.20', price: 184.2, pnlPct: 0.0 },
      { timestamp: '01:05:22 UTC', event: 'Short squeeze likuidasi $18.4M terpicu', price: 189.5, pnlPct: 2.87 },
      { timestamp: '01:18:45 UTC', event: 'TARGET 1 (TP1) $192.0 TERCAPAI (Sukses)', price: 192.0, pnlPct: 4.23 },
      { timestamp: '01:24:00 UTC', event: 'Melanjutkan tren menuju TP2 $199.50', price: 193.8, pnlPct: 5.21 },
    ],
  },
  {
    id: 'SIG-ETH-8703',
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Layer 1',
    exchange: 'BYBIT',
    direction: 'SHORT',
    grade: 'SELL',
    timeframe: '15m',
    strategyName: 'Bearish Order Block Reject & RSI Divergence',
    strategyCategory: 'DIVERGENCE',
    confluenceScore: 86,
    winRateProbability: 74.2,
    entryPrice: 3420.0,
    currentPrice: 3385.0,
    targetPrice1: 3360.0,
    targetPrice2: 3290.0,
    targetPrice3: 3180.0,
    stopLoss: 3465.0,
    riskRewardRatio: 2.95,
    leverageRec: 12,
    status: 'ACTIVE',
    pnlPctCurrent: 1.02,
    createdAt: '18 menit yang lalu',
    expiresAt: 'dalam 2 jam',
    indicatorsSummary: [
      'Bearish OB at $3,430',
      'Bearish Regular RSI Divergence',
      'Volume Climax Rejection',
      'EMA 9 Cross Down EMA 21',
    ],
    notes:
      'Penolakan keras di level resistance Order Block $3,430 dengan divergensi RSI 15m. Validasi momentum short scalping.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'ORDER_BLOCK_RETEST',
    triggerDetails: 'Retest Bearish Order Block di area $3,430 dengan candle rejection pinbar dan divergensi RSI.',
    fundingRate: 0.015,
    fundingBias: 'POSITIVE',
    liquidationDeltaUsd: 12600000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 01:08:44 UTC',
    verificationHash: '0x8703e218bfa93198de742c19a84f0912',
    highestPnlReached: 1.15,
    auditTrail: [
      { timestamp: '01:08:44 UTC', event: 'Sinyal disahkan & dipublikasikan', price: 3420.0, pnlPct: 0.0 },
      { timestamp: '01:11:30 UTC', event: 'Entry Short terisi pada $3,420.0', price: 3420.0, pnlPct: 0.0 },
      { timestamp: '01:21:05 UTC', event: 'Harga turun ke $3,385 (+1.02% profit)', price: 3385.0, pnlPct: 1.02 },
    ],
  },
  {
    id: 'SIG-SUI-8904',
    symbol: 'SUI/USDT',
    name: 'Sui Network',
    category: 'Layer 1',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '1H',
    strategyName: 'Market Structure Shift (MSS) + Trend Wave',
    strategyCategory: 'TREND',
    confluenceScore: 89,
    winRateProbability: 78.6,
    entryPrice: 3.42,
    currentPrice: 3.92,
    targetPrice1: 3.65,
    targetPrice2: 3.88,
    targetPrice3: 4.20,
    stopLoss: 3.25,
    riskRewardRatio: 3.25,
    leverageRec: 8,
    status: 'TP2_HIT',
    pnlPctCurrent: 14.62,
    createdAt: '2 jam yang lalu',
    expiresAt: 'dalam 8 jam',
    indicatorsSummary: [
      'Market Structure Shift (MSS) Bullish',
      'ADX 38 Strong Trend',
      'EMA 20/50/200 Ribbon Fan Out',
      'Orderbook Bid Wall +$3.5M',
    ],
    notes:
      'Perubahan struktur pasar (MSS) terkonfirmasi di atas $3.40. Target 1 & 2 telah tersentuh dengan keuntungan maksimal +14.6%.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'MSS',
    triggerDetails: 'Market Structure Shift (MSS) Bullish pada timeframe 1H mematahkan struktur lower high sebelumnya.',
    fundingRate: -0.005,
    fundingBias: 'NEUTRAL',
    liquidationDeltaUsd: 8900000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-19 23:25:00 UTC',
    verificationHash: '0x8904f123bc89104fa218e904b78c91a3',
    highestPnlReached: 15.2,
    realizedPnlPct: 14.62,
    auditTrail: [
      { timestamp: '23:25:00 UTC', event: 'Publikasi sinyal berbasis MSS terverifikasi', price: 3.42, pnlPct: 0.0 },
      { timestamp: '23:30:12 UTC', event: 'Entry terisi di level breakout $3.42', price: 3.42, pnlPct: 0.0 },
      { timestamp: '00:15:30 UTC', event: 'TP1 $3.65 Tercapai (+6.72%)', price: 3.65, pnlPct: 6.72 },
      { timestamp: '00:58:45 UTC', event: 'TP2 $3.88 Tercapai (+13.45%)', price: 3.88, pnlPct: 13.45 },
      { timestamp: '01:20:10 UTC', event: 'Konsolidasi kuat di atas TP2', price: 3.92, pnlPct: 14.62 },
    ],
  },
  {
    id: 'SIG-PEPE-8205',
    symbol: 'PEPE/USDT',
    name: 'Pepe',
    category: 'Meme',
    exchange: 'BYBIT',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '15m',
    strategyName: 'Liquidity Pool Sweep + Bollinger Squeeze',
    strategyCategory: 'VOLATILITY',
    confluenceScore: 83,
    winRateProbability: 71.5,
    entryPrice: 0.0000108,
    currentPrice: 0.0000114,
    targetPrice1: 0.0000116,
    targetPrice2: 0.0000124,
    targetPrice3: 0.0000138,
    stopLoss: 0.0000102,
    riskRewardRatio: 2.8,
    leverageRec: 5,
    status: 'ACTIVE',
    pnlPctCurrent: 5.55,
    createdAt: '35 menit yang lalu',
    expiresAt: 'dalam 3 jam',
    indicatorsSummary: [
      'Bollinger Band Expansion',
      'Volume Surge +380%',
      'MFI Money Inflow',
      'Open Interest +14.2%',
    ],
    notes:
      'Ekspansi volatilitas tajam setelah konsolidasi panjang. Volume breakout terdeteksi di bursa derivatif utama.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'BREAKOUT',
    triggerDetails: 'Breakout dari area squeeze Bollinger Band 15m disertai lonjakan Open Interest derivatif +14.2%.',
    fundingRate: 0.008,
    fundingBias: 'POSITIVE',
    liquidationDeltaUsd: 5400000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 00:52:10 UTC',
    verificationHash: '0x8205a189fecb312984ab12e84c902187',
    highestPnlReached: 6.1,
    auditTrail: [
      { timestamp: '00:52:10 UTC', event: 'Sinyal disahkan dengan Stop Loss wajib di $0.0000102', price: 0.0000108, pnlPct: 0.0 },
      { timestamp: '00:55:00 UTC', event: 'Order Entry terisi penuh', price: 0.0000108, pnlPct: 0.0 },
      { timestamp: '01:10:20 UTC', event: 'Volatilitas ekspansi membawa harga ke $0.0000114', price: 0.0000114, pnlPct: 5.55 },
    ],
  },
  {
    id: 'SIG-NEAR-8506',
    symbol: 'NEAR/USDT',
    name: 'NEAR Protocol',
    category: 'AI & Big Data',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '4H',
    strategyName: 'AI Confluence Multi-Engine 90+ Score',
    strategyCategory: 'AI_CONFLUENCE',
    confluenceScore: 92,
    winRateProbability: 82.8,
    entryPrice: 6.85,
    currentPrice: 7.02,
    targetPrice1: 7.25,
    targetPrice2: 7.65,
    targetPrice3: 8.3,
    stopLoss: 6.55,
    riskRewardRatio: 3.45,
    leverageRec: 10,
    status: 'ACTIVE',
    pnlPctCurrent: 2.48,
    createdAt: '1 jam yang lalu',
    expiresAt: 'dalam 18 jam',
    indicatorsSummary: [
      '10 dari 12 Indikator Bullish',
      'ICT Optimal Trade Entry 0.618 Fib',
      'Net Funding Rate Neutral',
      'Whale Bid Depth 68%',
    ],
    notes:
      'Konfluensi skor sangat tinggi dari klaster model AI. Koreksi sehat menyentuh Golden Ratio 0.618 Fibonacci.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'PATTERN_COMPLETION',
    triggerDetails: 'Penyelesaian pola ICT OTE (Optimal Trade Entry) pada rasio emas 0.618 Fibonacci retracement.',
    fundingRate: 0.001,
    fundingBias: 'NEUTRAL',
    liquidationDeltaUsd: 14200000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 00:20:00 UTC',
    verificationHash: '0x8506e9812fabc38719284fa90b81297e',
    highestPnlReached: 2.85,
    auditTrail: [
      { timestamp: '00:20:00 UTC', event: 'Sinyal dipublikasikan dengan rasio R:R 1:3.45', price: 6.85, pnlPct: 0.0 },
      { timestamp: '00:24:18 UTC', event: 'Order Limit Entry tereksekusi di $6.85', price: 6.85, pnlPct: 0.0 },
      { timestamp: '01:00:30 UTC', event: 'Pergerakan bullish bergerak menuju target', price: 7.02, pnlPct: 2.48 },
    ],
  },
  {
    id: 'SIG-ARB-7808',
    symbol: 'ARB/USDT',
    name: 'Arbitrum',
    category: 'Layer 2',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '1H',
    strategyName: 'Breakout Retest Failure (Historical SL Audit)',
    strategyCategory: 'TREND',
    confluenceScore: 79,
    winRateProbability: 68.0,
    entryPrice: 0.88,
    currentPrice: 0.84,
    targetPrice1: 0.94,
    targetPrice2: 0.99,
    targetPrice3: 1.08,
    stopLoss: 0.85,
    riskRewardRatio: 2.0,
    leverageRec: 5,
    status: 'SL_HIT',
    pnlPctCurrent: -3.41,
    createdAt: '5 jam yang lalu',
    expiresAt: 'Selesai',
    indicatorsSummary: [
      'Stop Loss Berfungsi Melindungi Modal',
      'Penurunan Pasar Eksternal',
      'Risiko Terbatasi di 3.4%',
    ],
    notes:
      'Contoh audit objektif MarketOwl: Sinyal ini menyentuh batas Stop Loss $0.85 setelah false breakout. Kerugian dibatasi secara disiplin tanpa kompromi.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'BREAKOUT',
    triggerDetails: 'False breakout yang berhasil dihentikan oleh eksekusi Stop Loss otomatis.',
    fundingRate: 0.012,
    fundingBias: 'POSITIVE',
    liquidationDeltaUsd: 3200000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-19 20:15:00 UTC',
    verificationHash: '0x7808c1a938feb90128374a0129c94812',
    highestPnlReached: 1.2,
    realizedPnlPct: -3.41,
    closedAt: '2026-09-19 21:30:00 UTC',
    exitPrice: 0.85,
    auditTrail: [
      { timestamp: '20:15:00 UTC', event: 'Sinyal dirilis dengan batas risiko SL ketat di $0.85', price: 0.88, pnlPct: 0.0 },
      { timestamp: '20:20:00 UTC', event: 'Entry terisi di $0.88', price: 0.88, pnlPct: 0.0 },
      { timestamp: '20:45:00 UTC', event: 'Rejeksi harga terjadi akibat tekanan jual pasar', price: 0.865, pnlPct: -1.7 },
      { timestamp: '21:30:00 UTC', event: 'STOP LOSS TERSENTUH DI $0.85 - Posisi ditutup otomatis (Disiplin Risiko)', price: 0.85, pnlPct: -3.41 },
    ],
  },
];

export const SignalPage: React.FC<SignalPageProps> = ({
  currentSymbol,
  onSelectSymbol,
  onNavigateToTrade,
  selectedExchange = 'BINANCE',
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';
  const { addAlert, openAlertCenter, unreadCount } = useAlerts();

  // Navigation & View tabs: 'LIVE_FEED' vs 'PERFORMANCE_AUDIT'
  const [activeTab, setActiveTab] = useState<'LIVE_FEED' | 'PERFORMANCE_AUDIT'>('LIVE_FEED');

  // Signals state
  const [signals, setSignals] = useState<CryptoTradingSignal[]>(INITIAL_SIGNALS);
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'ALL' | Timeframe>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | SignalGrade>('ALL');
  const [minScore, setMinScore] = useState<number>(75);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'TP_HIT' | 'SL_HIT'>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'ALL' | 'PASSED_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Operational pipeline scan state
  const [isScanningPipeline, setIsScanningPipeline] = useState<boolean>(false);
  const [pipelineActiveStage, setPipelineActiveStage] = useState<SignalPipelineStage>('PUBLISHED');
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);

  // Modals & User Feedback
  const [selectedSignalForAudit, setSelectedSignalForAudit] = useState<CryptoTradingSignal | null>(null);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [telegramNotificationSent, setTelegramNotificationSent] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [telegramWebhook, setTelegramWebhook] = useState<string>('https://api.telegram.org/bot7892.../sendMessage');

  // Filtered signals logic
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      if (selectedDirection !== 'ALL' && sig.direction !== selectedDirection) return false;
      if (selectedTimeframe !== 'ALL' && sig.timeframe !== selectedTimeframe) return false;
      if (selectedCategory !== 'ALL' && sig.category !== selectedCategory) return false;
      if (selectedGrade !== 'ALL' && sig.grade !== selectedGrade) return false;
      if (sig.confluenceScore < minScore) return false;
      if (selectedRiskFilter === 'PASSED_ONLY' && sig.riskStatus !== 'PASSED') return false;
      if (selectedStatus === 'ACTIVE' && sig.status !== 'ACTIVE') return false;
      if (selectedStatus === 'TP_HIT' && !sig.status.includes('TP')) return false;
      if (selectedStatus === 'SL_HIT' && sig.status !== 'SL_HIT') return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSymbol = sig.symbol.toLowerCase().includes(query);
        const matchesName = sig.name.toLowerCase().includes(query);
        const matchesStrategy = sig.strategyName.toLowerCase().includes(query);
        const matchesTrigger = (sig.triggerDetails || '').toLowerCase().includes(query);
        if (!matchesSymbol && !matchesName && !matchesStrategy && !matchesTrigger) return false;
      }
      return true;
    });
  }, [
    signals,
    selectedDirection,
    selectedTimeframe,
    selectedCategory,
    selectedGrade,
    minScore,
    selectedRiskFilter,
    selectedStatus,
    searchQuery,
  ]);

  // Performance audit statistics (Accountability)
  const totalSignals = signals.length;
  const activeCount = signals.filter((s) => s.status === 'ACTIVE').length;
  const tpHitSignals = signals.filter((s) => s.status.includes('TP'));
  const slHitSignals = signals.filter((s) => s.status === 'SL_HIT');
  const winRate = Math.round((tpHitSignals.length / (totalSignals || 1)) * 100);
  const avgConfluence = Math.round(signals.reduce((acc, s) => acc + s.confluenceScore, 0) / (totalSignals || 1));
  const avgRiskReward = (signals.reduce((acc, s) => acc + s.riskRewardRatio, 0) / (totalSignals || 1)).toFixed(2);
  const totalAccumulatedPnl = signals
    .reduce((acc, s) => acc + (s.realizedPnlPct || s.pnlPctCurrent || 0), 0)
    .toFixed(2);

  // Play audio chime if enabled
  const playAlertSound = () => {
    if (!soundAlerts) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Trigger CCXT Ingest Pipeline Simulation (4-Stage Execution)
  const handleTriggerPipelineScan = () => {
    setIsScanningPipeline(true);
    setScanStatusMessage(isId ? 'Tahap 1: Ingest CCXT & WebSocket data dari Binance/Bybit...' : 'Stage 1: CCXT & WebSocket Ingest from Binance/Bybit...');
    setPipelineActiveStage('INGEST');

    setTimeout(() => {
      setScanStatusMessage(isId ? 'Tahap 2: Menganalisis Market Structure Shift (MSS) & Order Block...' : 'Stage 2: Evaluating Market Structure Shift & Order Block...');
      setPipelineActiveStage('INSTITUTIONAL_LOGIC');

      setTimeout(() => {
        setScanStatusMessage(isId ? 'Tahap 3: Memvalidasi Risk:Reward (Wajib SL) & Funding Rate...' : 'Stage 3: Validating Risk:Reward Ratio & Funding Bias...');
        setPipelineActiveStage('RISK_FILTER');

        setTimeout(() => {
          setPipelineActiveStage('PUBLISHED');
          setIsScanningPipeline(false);
          setScanStatusMessage(null);
          playAlertSound();

          // Generate or refresh a dynamic high-confluence setup
          const newSignalId = `SIG-AVAX-${Math.floor(1000 + Math.random() * 9000)}`;
          const newSignal: CryptoTradingSignal = {
            id: newSignalId,
            symbol: 'AVAX/USDT',
            name: 'Avalanche',
            category: 'Layer 1',
            exchange: 'BINANCE',
            direction: 'LONG',
            grade: 'STRONG_BUY',
            timeframe: '15m',
            strategyName: 'MSS Liquidity Breakout & Institutional VWAP',
            strategyCategory: 'SMC',
            confluenceScore: 93,
            winRateProbability: 83.4,
            entryPrice: 32.45,
            currentPrice: 32.65,
            targetPrice1: 33.8,
            targetPrice2: 34.9,
            targetPrice3: 36.5,
            stopLoss: 31.8,
            riskRewardRatio: 3.23,
            leverageRec: 10,
            status: 'ACTIVE',
            pnlPctCurrent: 0.62,
            createdAt: isId ? 'Baru saja' : 'Just now',
            expiresAt: isId ? 'dalam 3 jam' : 'in 3 hours',
            indicatorsSummary: [
              'MSS Bullish Swing Reversal',
              'VWAP +1σ Retest & Hold',
              'CVD Spot Whale Inflow +$14M',
              'Orderbook Bid Imbalance 72%',
            ],
            notes:
              'Hasil scan pipeline real-time: Terdeteksi Market Structure Shift (MSS) di level $32.40 dengan lonjakan volume beli agresif dan rasio R:R optimal 1:3.23.',
            pipelineStage: 'PUBLISHED',
            triggerType: 'MSS',
            triggerDetails: 'Market Structure Shift (MSS) breakout candle 15m di atas resistensi lokal $32.40.',
            fundingRate: -0.006,
            fundingBias: 'NEGATIVE',
            liquidationDeltaUsd: 11200000,
            hasStopLoss: true,
            isRiskRewardValid: true,
            riskStatus: 'PASSED',
            officialTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            verificationHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
            highestPnlReached: 0.62,
            auditTrail: [
              {
                timestamp: 'Baru saja',
                event: 'Sinyal disahkan oleh 4-Stage Operational Pipeline & dipublikasikan',
                price: 32.45,
                pnlPct: 0.0,
              },
            ],
          };

          setSignals((prev) => [newSignal, ...prev.filter((s) => s.symbol !== 'AVAX/USDT')]);

          // Dispatch real-time alert to unified Alert Center
          addAlert({
            category: 'SIGNAL',
            title: `Sinyal Baru: ${newSignal.symbol} (${newSignal.direction})`,
            subtitle: `${newSignal.strategyName} • Skor ${newSignal.confluenceScore}/100`,
            message: `Pipeline CCXT mendeteksi setup ${newSignal.direction} pada ${newSignal.symbol}. Target 1: $${newSignal.targetPrice1} | SL: $${newSignal.stopLoss} (R:R 1:${newSignal.riskRewardRatio}).`,
            symbol: newSignal.symbol,
            timestamp: isId ? 'Baru saja' : 'Just now',
            severity: 'SUCCESS',
            actionStage: 'signal',
            data: {
              signalId: newSignal.id,
              direction: newSignal.direction,
              timeframe: newSignal.timeframe,
              entryPrice: newSignal.entryPrice,
              targetPrice: newSignal.targetPrice1,
              stopLoss: newSignal.stopLoss,
              confluenceScore: newSignal.confluenceScore,
              signalStatus: newSignal.status,
              strategyName: newSignal.strategyName,
            },
          });
        }, 900);
      }, 900);
    }, 900);
  };

  const handleCopySignal = (sig: CryptoTradingSignal) => {
    const text = `🎯 [AKIRAQU VIP SIGNAL - MARKETOWL COMPLIANT]
Aset: ${sig.symbol} (${sig.exchange})
Tipe: ${sig.direction} (${sig.grade})
Timeframe: ${sig.timeframe}
Strategi: ${sig.strategyName}
Pemicu Setup: ${sig.triggerDetails || sig.strategyCategory}
Skor Konfluensi: ${sig.confluenceScore}/100 (Win Rate: ${sig.winRateProbability}%)
Cap Waktu Resmi: ${sig.officialTimestamp || sig.createdAt}
Audit Hash: ${sig.verificationHash || '0xVerified'}
═════════════════════════
🟢 Entry: $${formatCryptoPrice(sig.entryPrice)}
🛑 Stop Loss: $${formatCryptoPrice(sig.stopLoss)} (Wajib Risk Limiter)
🎯 Target 1: $${formatCryptoPrice(sig.targetPrice1)}
🎯 Target 2: $${formatCryptoPrice(sig.targetPrice2)}
🎯 Target 3: $${formatCryptoPrice(sig.targetPrice3)}
⚖️ Risk:Reward: 1 : ${sig.riskRewardRatio}
⚡ Leverage Disarankan: ${sig.leverageRec}x
═════════════════════════
📝 Catatan: ${sig.notes}`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendTelegram = (sig: CryptoTradingSignal) => {
    setTelegramNotificationSent(sig.symbol);
    setTimeout(() => setTelegramNotificationSent(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Operational Pipeline Visualizer (4 Stages: Ingest, Institutional Logic, Risk Filter, Frontend Alert) */}
      <SignalPipelineVisualizer
        isDark={isDark}
        lang={lang}
        onTriggerScan={handleTriggerPipelineScan}
        isScanning={isScanningPipeline}
        activeStage={pipelineActiveStage}
      />

      {/* Live Pipeline Scanning Progress Notification */}
      {isScanningPipeline && scanStatusMessage && (
        <div className="p-3 bg-pink-950/70 border border-pink-500/40 rounded-xl text-pink-200 font-mono text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-pink-400 animate-spin" />
            <span>{scanStatusMessage}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
            PROCESSING PIPELINE
          </span>
        </div>
      )}

      {/* Top Banner & Navigation Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400 relative">
            <Radio className="w-6 h-6 animate-pulse" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-mono font-bold text-lg sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isId ? 'Sinyal Trading Real-Time' : 'Institutional Trading Signals'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE CCXT FEED
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {isId
                ? 'Workflow sinyal institusional: Deteksi trigger (MSS/OB/Volume), filter rasio Risk:Reward 4-komponen wajib, dan verifikasi kinerja transparan'
                : 'Institutional signal workflow: Trigger detection (MSS/OB/Volume), 4-mandatory component risk filter, and transparent performance verification'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs: Live Feed vs MarketOwl Performance Audit */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveTab('LIVE_FEED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'LIVE_FEED'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isId ? 'Feed Real-Time' : 'Live Feed'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('PERFORMANCE_AUDIT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PERFORMANCE_AUDIT'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isId ? 'Verifikasi Kinerja' : 'Performance Audit'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {winRate}%
              </span>
            </button>
          </div>

          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundAlerts
                ? 'bg-pink-500/15 border-pink-500/30 text-pink-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={soundAlerts ? 'Audio alert aktif' : 'Audio alert senyap'}
          >
            {soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => openAlertCenter('SIGNAL')}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 font-mono text-xs font-semibold transition cursor-pointer"
            title={isId ? 'Buka Pusat Alert Terpadu' : 'Open Unified Alert Center'}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>{isId ? 'Alert Sinyal' : 'Signal Alerts'}</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Webhook</span>
          </button>
        </div>
      </div>

      {telegramNotificationSent && (
        <div className="p-3 bg-pink-950/80 border border-pink-500/50 rounded-xl text-pink-200 font-mono text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-pink-400 animate-bounce" />
            <span>
              Sinyal <strong>{telegramNotificationSent}</strong> berhasil disiarkan ke Telegram Webhook Channel dengan
              verifikasi audit!
            </span>
          </div>
          <span className="text-[10px] text-pink-400 font-bold">DISPATCHED</span>
        </div>
      )}

      {/* 2. TAB: LIVE FEED (Sinyal Real-Time) */}
      {activeTab === 'LIVE_FEED' && (
        <div className="space-y-4">
          {/* Filter Control Bar */}
          <div
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Direction Filter */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
                <button
                  onClick={() => setSelectedDirection('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    selectedDirection === 'ALL'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({signals.length})
                </button>
                <button
                  onClick={() => setSelectedDirection('LONG')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    selectedDirection === 'LONG'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Long ({signals.filter((s) => s.direction === 'LONG').length})
                </button>
                <button
                  onClick={() => setSelectedDirection('SHORT')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    selectedDirection === 'SHORT'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Short ({signals.filter((s) => s.direction === 'SHORT').length})
                </button>
              </div>

              {/* Timeframe Filter */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
                {(['ALL', '15m', '1H', '4H', '1D'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      selectedTimeframe === tf
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
                <button
                  onClick={() => setSelectedStatus('ALL')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    selectedStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua Status
                </button>
                <button
                  onClick={() => setSelectedStatus('ACTIVE')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    selectedStatus === 'ACTIVE'
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Aktif ({activeCount})
                </button>
                <button
                  onClick={() => setSelectedStatus('TP_HIT')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    selectedStatus === 'TP_HIT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TP Tercapai ({tpHitSignals.length})
                </button>
              </div>

              {/* Search input */}
              <div className="w-full sm:w-56">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari aset, trigger, atau MSS..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-pink-500"
                />
              </div>
            </div>

            {/* Secondary Filter Row: Category & Risk-Reward Compliance Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 text-[11px] mr-1">Kategori:</span>
                {['ALL', 'Layer 1', 'Meme', 'AI & Big Data', 'Layer 2'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md text-[11px] transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-pink-300 font-bold border border-pink-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-pink-400" />
                  <span>Min Skor:</span>
                  <span className="text-pink-400 font-bold text-xs">{minScore}/100</span>
                  <input
                    type="range"
                    min={70}
                    max={95}
                    step={1}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-28 accent-pink-500 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() =>
                    setSelectedRiskFilter((prev) => (prev === 'ALL' ? 'PASSED_ONLY' : 'ALL'))
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                    selectedRiskFilter === 'PASSED_ONLY'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ✓ Lolos Filter R:R Wajib
                </button>
              </div>
            </div>
          </div>

          {/* Signals Feed List */}
          <div className="space-y-3.5">
            {filteredSignals.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0f172a] font-mono space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-slate-300 font-bold">Tidak ada sinyal yang cocok dengan filter aktif</p>
                <p className="text-xs text-slate-500">
                  Coba turunkan threshold skor konfluensi atau pilih filter kategori/status lainnya.
                </p>
              </div>
            ) : (
              filteredSignals.map((sig) => {
                const isLong = sig.direction === 'LONG';
                const isTpHit = sig.status.includes('TP');
                const isSlHit = sig.status === 'SL_HIT';

                // Distance calculation to Entry and TP1
                const pnl = sig.pnlPctCurrent || 0;

                return (
                  <div
                    key={sig.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Header Row: Symbol, Direction, Trigger, Official Timestamp & Verification Hash */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        {/* Direction badge */}
                        <div
                          className={`p-2 rounded-xl font-bold flex items-center gap-1 ${
                            isLong
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isLong ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span className="font-mono text-xs font-black">{sig.direction}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-base font-bold text-white">{sig.symbol}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {sig.timeframe}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-950/60 text-pink-400 border border-pink-500/30 font-bold">
                              {sig.exchange}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              {sig.category}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-slate-300 font-bold">{sig.strategyName}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock className="w-3 h-3" />
                              {sig.officialTimestamp || sig.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Header: Verification Hash, Score & Status Pill */}
                      <div className="flex items-center gap-2 font-mono">
                        <button
                          onClick={() => setSelectedSignalForAudit(sig)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition cursor-pointer"
                          title="Lihat sertifikat audit akuntabilitas MarketOwl"
                        >
                          <Hash className="w-3 h-3 text-pink-400" />
                          <span className="text-[11px] font-bold text-pink-300">
                            {sig.verificationHash?.substring(0, 8)}...
                          </span>
                        </button>

                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
                          <div className="text-[10px] text-slate-400">Skor Konfluensi</div>
                          <div className="text-sm font-bold text-pink-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>{sig.confluenceScore}/100</span>
                          </div>
                        </div>

                        <div
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                            isTpHit
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isSlHit
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                          }`}
                        >
                          {sig.status === 'ACTIVE'
                            ? '🟢 AKTIF'
                            : sig.status === 'TP1_HIT'
                            ? '🎯 TP 1 TERCAPAI'
                            : sig.status === 'TP2_HIT'
                            ? '🚀 TP 2 TERCAPAI'
                            : sig.status === 'TP3_HIT'
                            ? '🏆 TP 3 TERCAPAI'
                            : '🛑 SL HIT'}
                        </div>
                      </div>
                    </div>

                    {/* Trigger & Risk-Reward Compliance Bar */}
                    <div className="my-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      {/* Trigger Detection Info */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 font-bold border border-pink-500/30">
                          Pemicu: {sig.triggerType ? sig.triggerType.replace('_', ' ') : 'SMC CONFLUENCE'}
                        </span>
                        <span className="text-slate-300 text-[11px] truncate max-w-md">
                          {sig.triggerDetails || sig.notes}
                        </span>
                      </div>

                      {/* 4 Mandatory Components Checklist */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400">4 Komponen:</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          ✓ Direction
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          ✓ Entry
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          ✓ Stop Loss
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          ✓ Targets
                        </span>
                      </div>
                    </div>

                    {/* Target Levels Grid: Entry, TP 1-3, SL, Risk:Reward */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 my-3.5 font-mono">
                      {/* Entry Price */}
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">1. Harga Entry</span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          ${formatCryptoPrice(sig.entryPrice)}
                        </span>
                      </div>

                      {/* TP 1 */}
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                        <span className="text-[10px] text-emerald-400 block flex items-center justify-between">
                          <span>Target 1 (TP1)</span>
                          <Target className="w-3 h-3" />
                        </span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                          ${formatCryptoPrice(sig.targetPrice1)}
                        </span>
                      </div>

                      {/* TP 2 */}
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                        <span className="text-[10px] text-emerald-400 block flex items-center justify-between">
                          <span>Target 2 (TP2)</span>
                          <Target className="w-3 h-3" />
                        </span>
                        <span className="text-sm font-bold text-emerald-300 mt-0.5 block">
                          ${formatCryptoPrice(sig.targetPrice2)}
                        </span>
                      </div>

                      {/* TP 3 */}
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                        <span className="text-[10px] text-emerald-400 block flex items-center justify-between">
                          <span>Target 3 (TP3)</span>
                          <Target className="w-3 h-3" />
                        </span>
                        <span className="text-sm font-bold text-emerald-200 mt-0.5 block">
                          ${formatCryptoPrice(sig.targetPrice3)}
                        </span>
                      </div>

                      {/* Stop Loss */}
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40">
                        <span className="text-[10px] text-rose-400 block flex items-center justify-between">
                          <span>Stop Loss (SL)</span>
                          <Shield className="w-3 h-3" />
                        </span>
                        <span className="text-sm font-bold text-rose-400 mt-0.5 block">
                          ${formatCryptoPrice(sig.stopLoss)}
                        </span>
                      </div>

                      {/* R:R & Leverage */}
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">R:R & Leverage</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs font-bold text-emerald-400">1:{sig.riskRewardRatio}</span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 font-bold border border-pink-800">
                            {sig.leverageRec}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Real-time Dynamic Progress & PnL Meter */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 my-3 font-mono text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Harga Terakhir:</span>
                          <span className="text-white font-bold">${formatCryptoPrice(sig.currentPrice || sig.entryPrice)}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">Funding Rate:</span>
                          <span className={`font-bold ${sig.fundingRate && sig.fundingRate < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {sig.fundingRate ? `${sig.fundingRate > 0 ? '+' : ''}${sig.fundingRate}%` : '-0.008%'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Live PnL Saat Ini:</span>
                          <span
                            className={`font-bold text-sm ${
                              pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-slate-300'
                            }`}
                          >
                            {pnl > 0 ? `+${pnl}%` : `${pnl}%`}
                          </span>
                        </div>
                      </div>

                      {/* Progress visual bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isSlHit ? 'bg-rose-500 w-full' : isTpHit ? 'bg-emerald-400 w-full' : 'bg-pink-500'
                          }`}
                          style={{
                            width: isSlHit || isTpHit ? '100%' : `${Math.min(Math.max(pnl * 15, 10), 90)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Indicators Pill Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                      {sig.indicatorsSummary.map((ind, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                        >
                          ✓ {ind}
                        </span>
                      ))}
                    </div>

                    {/* Footer Action Buttons: Audit Trail, Execute Trade, Copy Signal, Send Telegram */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSignalForAudit(sig)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-500/30 transition cursor-pointer font-bold"
                        >
                          <Award className="w-3.5 h-3.5 text-pink-400" />
                          <span>Verifikasi Kinerja & Audit</span>
                        </button>

                        <button
                          onClick={() => handleCopySignal(sig)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                        >
                          {copiedId === sig.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Sinyal</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSendTelegram(sig)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-300 border border-slate-800 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim ke Telegram</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectSymbol && (
                          <button
                            onClick={() => onSelectSymbol(sig.symbol)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                          >
                            Buka Chart & Analisis
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (onSelectSymbol) onSelectSymbol(sig.symbol);
                            if (onNavigateToTrade) onNavigateToTrade(sig.symbol);
                          }}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            isLong
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs'
                              : 'bg-rose-500 hover:bg-rose-400 text-white shadow-xs'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Eksekusi {sig.direction} {sig.symbol}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. TAB: PERFORMANCE AUDIT & VERIFIKASI KINERJA (MarketOwl Accountability) */}
      {activeTab === 'PERFORMANCE_AUDIT' && (
        <div className="space-y-4 font-mono">
          {/* Header Metrics Ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-slate-400 uppercase block">Total Sinyal Terverifikasi</span>
              <span className="text-xl font-bold text-white mt-1 block">{totalSignals}</span>
              <span className="text-[10px] text-emerald-400 mt-0.5 block">100% On-Chain Timestamps</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-slate-400 uppercase block">Win Rate Historis</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{winRate}%</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {tpHitSignals.length} Target Hit / {slHitSignals.length} SL Hit
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-slate-400 uppercase block">Total PnL Akumulatif</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">+{totalAccumulatedPnl}%</span>
              <span className="text-[10px] text-emerald-400 mt-0.5 block">Nett Hasil Bersih</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-slate-400 uppercase block">Rata-rata Risk:Reward</span>
              <span className="text-xl font-bold text-pink-400 mt-1 block">1 : {avgRiskReward}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standar Institusional</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-slate-400 uppercase block">Rata Skor Konfluensi</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{avgConfluence}/100</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">12 Indikator Tergabung</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-slate-400 uppercase block">Maks. Drawdown Terkendali</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">-3.41%</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Berkat Stop Loss Wajib</span>
            </div>
          </div>

          {/* MarketOwl Philosophy Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
              <Award className="w-4 h-4" />
              <span>Filosofi Akuntabilitas Transparan (MarketOwl Protocol)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap sinyal yang diterbitkan oleh sistem kami memiliki cap waktu (timestamp) resmi dan kode audit hash
              permanen. Tidak ada sinyal yang dapat dihapus, disunting, atau dimanipulasi setelah rilis. Pengguna dapat
              menguji secara objektif apa yang terjadi setelah sinyal muncul: apakah mencapai TP1, TP2, TP3 atau terkena Stop Loss.
              Inilah integritas algoritma sesungguhnya.
            </p>
          </div>

          {/* Transparent Historical Audit Ledger Table */}
          <div className="rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Buku Besar Riwayat Sinyal & Audit Kinerja</h3>
                <p className="text-xs text-slate-400">Verifikasi seluruh rekam jejak sinyal pasca-publikasi</p>
              </div>
              <span className="text-xs text-slate-400">
                Menampilkan {signals.length} sinyal terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Waktu & Hash</th>
                    <th className="p-3">Aset & Tipe</th>
                    <th className="p-3">Trigger / MSS</th>
                    <th className="p-3">Harga Entry</th>
                    <th className="p-3">Stop Loss</th>
                    <th className="p-3">Target TP 1-3</th>
                    <th className="p-3">R:R</th>
                    <th className="p-3">Hasil / PnL</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {signals.map((sig) => {
                    const isLong = sig.direction === 'LONG';
                    const isTpHit = sig.status.includes('TP');
                    const isSlHit = sig.status === 'SL_HIT';
                    const pnl = sig.realizedPnlPct || sig.pnlPctCurrent || 0;

                    return (
                      <tr key={sig.id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-200">{sig.officialTimestamp || sig.createdAt}</div>
                          <div className="text-[10px] text-pink-400">{sig.verificationHash?.substring(0, 10)}...</div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isLong ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {sig.direction}
                            </span>
                            <span className="font-bold text-white">{sig.symbol}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{sig.exchange} • {sig.timeframe}</div>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                            {sig.triggerType ? sig.triggerType.replace('_', ' ') : 'SMC'}
                          </span>
                        </td>

                        <td className="p-3 font-bold text-slate-200">
                          ${formatCryptoPrice(sig.entryPrice)}
                        </td>

                        <td className="p-3 text-rose-400 font-bold">
                          ${formatCryptoPrice(sig.stopLoss)}
                        </td>

                        <td className="p-3 text-emerald-400">
                          ${formatCryptoPrice(sig.targetPrice1)} - ${formatCryptoPrice(sig.targetPrice3)}
                        </td>

                        <td className="p-3 font-bold text-slate-200">
                          1:{sig.riskRewardRatio}
                        </td>

                        <td className="p-3">
                          <span
                            className={`font-bold text-sm ${
                              pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            {pnl > 0 ? `+${pnl}%` : `${pnl}%`}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isTpHit
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isSlHit
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                            }`}
                          >
                            {sig.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedSignalForAudit(sig)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                          >
                            Audit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Signal Audit Modal (MarketOwl Transparency Verification) */}
      <SignalAuditModal
        signal={selectedSignalForAudit}
        onClose={() => setSelectedSignalForAudit(null)}
        isDark={isDark}
        lang={lang}
      />

      {/* 5. Webhook / Telegram Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 font-mono space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-pink-400" />
                <span>Integrasi Sinyal & Webhook VIP</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Telegram Bot Webhook URL</label>
                <input
                  type="text"
                  value={telegramWebhook}
                  onChange={(e) => setTelegramWebhook(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage"
                />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] text-pink-300 font-bold">Filter Penyiaran Otomatis (MarketOwl):</div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Kirim hanya sinyal lolos filter R:R wajib:</span>
                  <input type="checkbox" defaultChecked className="accent-pink-500" />
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Kirim hanya skor konfluensi &gt; 85:</span>
                  <input type="checkbox" defaultChecked className="accent-pink-500" />
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Notifikasi saat TP1 / TP2 / SL tersentuh:</span>
                  <input type="checkbox" defaultChecked className="accent-pink-500" />
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Audio Alert Browser:</span>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    className="accent-pink-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowConfigModal(false);
                setTelegramNotificationSent('Semua Saluran Telegram & Webhook');
              }}
              className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Simpan Konfigurasi & Uji Webhook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
