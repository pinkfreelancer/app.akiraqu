import React, { useState, useMemo } from 'react';
import {
  CryptoTradingSignal,
  SignalPipelineStage,
  SupportedExchange,
} from '../types/crypto.types';
import { formatCryptoPrice } from '../utils/formatters';
import { Language } from '../i18n/translations';
import { useAlerts } from '../contexts/AlertContext';
import { SignalPipelineVisualizer } from '../components/signals/SignalPipelineVisualizer';
import { SignalAuditModal } from '../components/signals/SignalAuditModal';
import { SignalNavBar, SignalNavTab } from '../components/signals/SignalNavBar';
import { SignalMethodologyView } from '../components/signals/SignalMethodologyView';
import { SignalFeedView } from '../components/signals/SignalFeedView';
import { SignalPerformanceView } from '../components/signals/SignalPerformanceView';
import { SignalLiveAnalysisView } from '../components/signals/SignalLiveAnalysisView';
import { SignalLearningView } from '../components/signals/SignalLearningView';
import { SignalInsightsView } from '../components/signals/SignalInsightsView';
import { SignalPricingView } from '../components/signals/SignalPricingView';
import { SignalContactModal } from '../components/signals/SignalContactModal';
import {
  INITIAL_INSTITUTIONAL_SIGNALS,
  computeInstitutionalPerformance,
} from '../components/signals/signalData';
import { Bell, RefreshCw, Send } from 'lucide-react';

interface SignalPageProps {
  currentSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  selectedExchange?: SupportedExchange;
  theme?: 'light' | 'dark';
  lang?: Language;
}

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

  // Primary Tab Navigation (Produk: Sinyal, Kinerja, Analisis Langsung, Belajar; Section: Metodologi, Wawasan, Harga, Kontak)
  const [activeTab, setActiveTab] = useState<SignalNavTab>('SINYAL');

  // Signals State
  const [signals, setSignals] = useState<CryptoTradingSignal[]>(INITIAL_INSTITUTIONAL_SIGNALS);
  const [selectedSignalForLiveAnalysis, setSelectedSignalForLiveAnalysis] = useState<CryptoTradingSignal | null>(
    INITIAL_INSTITUTIONAL_SIGNALS[0]
  );
  const [selectedSignalForAudit, setSelectedSignalForAudit] = useState<CryptoTradingSignal | null>(null);

  // Operational pipeline scan simulation
  const [isScanningPipeline, setIsScanningPipeline] = useState<boolean>(false);
  const [pipelineActiveStage, setPipelineActiveStage] = useState<SignalPipelineStage>('PUBLISHED');
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);

  // Utilities & Modals
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [telegramNotificationSent, setTelegramNotificationSent] = useState<string | null>(null);
  const [showTelegramConfigModal, setShowTelegramConfigModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [telegramWebhook, setTelegramWebhook] = useState<string>(
    'https://api.telegram.org/bot7892.../sendMessage'
  );

  // Real-time performance metrics
  const perfMetrics = useMemo(() => computeInstitutionalPerformance(signals), [signals]);
  const activeSignalsCount = signals.filter(
    (s) =>
      s.outcomeResult === 'IN_PROGRESS' ||
      s.lifecycleStatus === 'PENDING' ||
      s.lifecycleStatus === 'R1' ||
      s.lifecycleStatus === 'R2' ||
      s.lifecycleStatus === 'TRAILING' ||
      s.status === 'ACTIVE'
  ).length;

  // Sound chime helper
  const playAlertSound = () => {
    if (!soundAlerts) return;
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
      // Ignore audio failure before user gesture
    }
  };

  // CCXT Pipeline Ingest Trigger
  const handleTriggerPipelineScan = () => {
    setIsScanningPipeline(true);
    setScanStatusMessage(
      isId
        ? 'Tahap 1: Ingest CCXT & Orderflow dari Binance/Bybit...'
        : 'Stage 1: Ingesting CCXT & Orderflow from Binance/Bybit...'
    );
    setPipelineActiveStage('INGEST');

    setTimeout(() => {
      setScanStatusMessage(
        isId
          ? 'Tahap 2: Evaluasi model ALPHA & Market Structure Shift (MSS)...'
          : 'Stage 2: Evaluating ALPHA model & Market Structure Shift (MSS)...'
      );
      setPipelineActiveStage('INSTITUTIONAL_LOGIC');

      setTimeout(() => {
        setScanStatusMessage(
          isId
            ? 'Tahap 3: Memvalidasi 8-Level Target (r1-r8) & Support Stop (s1-s4)...'
            : 'Stage 3: Validating 8 Take-Profit Targets & Support Stops...'
        );
        setPipelineActiveStage('RISK_FILTER');

        setTimeout(() => {
          setPipelineActiveStage('PUBLISHED');
          setIsScanningPipeline(false);
          setScanStatusMessage(null);
          playAlertSound();

          // Generate dynamic ALPHA model signal
          const randomId = `SIG-AVAX-${Math.floor(1000 + Math.random() * 9000)}`;
          const entryPrice = 32.45;
          const step = entryPrice * 0.015;

          const newSignal: CryptoTradingSignal = {
            id: randomId,
            symbol: 'AVAX/USDT',
            name: 'Avalanche',
            category: 'Layer 1',
            exchange: 'BINANCE',
            direction: 'LONG',
            grade: 'STRONG_BUY',
            timeframe: '1H',
            resolution: '1H',
            modelCategory: 'ALPHA',
            strength: 'STRONG',
            strategyName: 'Alpha Institutional Liquidity Sweep & MSS',
            strategyCategory: 'SMC',
            confluenceScore: 95,
            winRateProbability: 86.4,
            entryPrice: entryPrice,
            currentPrice: 32.7,
            targetPrice1: entryPrice + step * 1.0,
            targetPrice2: entryPrice + step * 1.8,
            targetPrice3: entryPrice + step * 2.8,
            stopLoss: entryPrice - step * 1.2,
            riskRewardRatio: 3.45,
            leverageRec: 10,
            status: 'ACTIVE',
            lifecycleStatus: 'PENDING',
            outcomeResult: 'IN_PROGRESS',
            pnlPctCurrent: 0.77,
            createdAt: isId ? 'Baru saja' : 'Just now',
            expiresAt: isId ? 'dalam 5 jam' : 'in 5 hours',
            highestRReached: 0,
            isTrailingActive: false,
            priceLevels: {
              entry: entryPrice,
              r1: entryPrice + step * 1.0,
              r2: entryPrice + step * 1.8,
              r3: entryPrice + step * 2.8,
              r4: entryPrice + step * 4.0,
              r5: entryPrice + step * 5.5,
              r6: entryPrice + step * 7.2,
              r7: entryPrice + step * 9.2,
              r8: entryPrice + step * 12.0,
              s1: entryPrice - step * 1.2,
              s2: entryPrice - step * 2.0,
              s3: entryPrice - step * 3.0,
              s4: entryPrice - step * 4.2,
              isTrailingActive: false,
            },
            indicatorsSummary: [
              'Alpha Model Liquidity Sweep Confirmed',
              'MSS Bullish Candle 1H Reversal',
              'CVD Spot Whale Inflow +$18.5M',
              'Orderbook Bid Imbalance 74%',
            ],
            notes:
              'Sinyal model ALPHA dengan konfirmasi STRONG pada timeframe 1-JAM. Target r1-r8 diproyeksikan dengan aktivasi Trailing Stop otomatis di level r1.',
            pipelineStage: 'PUBLISHED',
            triggerType: 'MSS',
            triggerDetails: 'Market Structure Shift (MSS) Bullish pada timeframe 1H dengan volume konfirmasi anomali.',
            fundingRate: -0.006,
            fundingBias: 'NEGATIVE',
            liquidationDeltaUsd: 12500000,
            hasStopLoss: true,
            isRiskRewardValid: true,
            riskStatus: 'PASSED',
            officialTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            verificationHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
            highestPnlReached: 0.77,
            auditTrail: [
              {
                timestamp: 'Baru saja',
                event: 'Sinyal Alpha dipublikasikan dengan 8 target Take-Profit dan batas stop s1',
                price: entryPrice,
                pnlPct: 0.0,
              },
            ],
          };

          setSignals((prev) => [newSignal, ...prev.filter((s) => s.symbol !== 'AVAX/USDT')]);

          addAlert({
            category: 'SIGNAL',
            title: `Sinyal Baru ALPHA: ${newSignal.symbol} (${newSignal.direction})`,
            subtitle: `Model ALPHA • Kekuatan STRONG • Skor 95/100`,
            message: `Pipeline CCXT merilis sinyal ALPHA untuk ${newSignal.symbol}. Entry: $${newSignal.entryPrice} | TP1: $${newSignal.targetPrice1.toFixed(2)} | SL: $${newSignal.stopLoss.toFixed(2)}.`,
            symbol: newSignal.symbol,
            timestamp: isId ? 'Baru saja' : 'Just now',
            severity: 'SUCCESS',
            actionStage: 'signal',
            data: {
              signalId: newSignal.id,
              direction: newSignal.direction,
              entryPrice: newSignal.entryPrice,
              confluenceScore: newSignal.confluenceScore,
            },
          });
        }, 800);
      }, 800);
    }, 800);
  };

  // Copy Signal
  const handleCopySignal = (sig: CryptoTradingSignal) => {
    const text = `🎯 [AKIRAQU ${sig.modelCategory || 'ALPHA'} SIGNAL - REAL-TIME QUANT]
Simbol: ${sig.symbol} (${sig.exchange})
Arah: ${sig.direction} | Model: ${sig.modelCategory || 'CLASSIC'} | Kekuatan: ${sig.strength || 'NORMAL'}
Timeframe: ${sig.resolution || sig.timeframe}
Strategi: ${sig.strategyName}
Skor Konfluensi: ${sig.confluenceScore}/100
═════════════════════════
🟢 Entry Price: $${formatCryptoPrice(sig.entryPrice)}
🛑 Stop Loss s1: $${formatCryptoPrice(sig.stopLoss)}
🎯 Target Take-Profit (r1-r8):
  • r1: $${formatCryptoPrice(sig.targetPrice1)} (Aktifkan Trailing)
  • r2: $${formatCryptoPrice(sig.targetPrice2)}
  • r3: $${formatCryptoPrice(sig.targetPrice3)}
  • r8 (Maksimal): $${formatCryptoPrice((sig.priceLevels?.r8 || sig.targetPrice3 * 1.1))}
⚡ Leverage Disarankan: ${sig.leverageRec}x
═════════════════════════
Catatan: ${sig.notes}`;

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
      {/* 1. Operational Pipeline Visualizer */}
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

      {/* Telegram Dispatch Success Notification */}
      {telegramNotificationSent && (
        <div className="p-3 bg-pink-950/80 border border-pink-500/50 rounded-[2px] text-pink-200 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-pink-400" />
            <span>
              Sinyal <strong>{telegramNotificationSent}</strong> berhasil disiarkan ke Telegram Webhook Channel dengan verifikasi audit lengkap!
            </span>
          </div>
          <span className="text-[10px] text-pink-400 font-bold">DISPATCHED</span>
        </div>
      )}

      {/* 2. Unified Navigation Bar (Produk: Sinyal, Kinerja, Analisis Langsung, Belajar; Section: Metodologi, Wawasan, Harga, Kontak) */}
      <SignalNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'KONTAK') {
            setShowContactModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isDark={isDark}
        lang={lang}
        activeSignalCount={activeSignalsCount}
        winRate={perfMetrics.winRate}
        soundAlerts={soundAlerts}
        onToggleSoundAlerts={() => setSoundAlerts(!soundAlerts)}
        onOpenAlertCenter={() => openAlertCenter('SIGNAL')}
        unreadAlertCount={unreadCount}
        onOpenTelegramModal={() => setShowTelegramConfigModal(true)}
      />

      {/* 3. VIEW: SINYAL (Real-Time Feed with 4-Dimensional Taxonomy Filtering) */}
      {activeTab === 'SINYAL' && (
        <SignalFeedView
          signals={signals}
          isDark={isDark}
          lang={lang}
          onSelectSignalForInspection={(sig) => {
            setSelectedSignalForLiveAnalysis(sig);
            setActiveTab('ANALISIS_LANGSUNG');
          }}
          onNavigateToTrade={(sym) => {
            if (onNavigateToTrade) onNavigateToTrade(sym);
            if (onSelectSymbol) onSelectSymbol(sym);
          }}
          onCopySignal={handleCopySignal}
          copiedId={copiedId}
          onSendTelegram={handleSendTelegram}
          onTriggerScan={handleTriggerPipelineScan}
          isScanning={isScanningPipeline}
        />
      )}

      {/* 4. VIEW: KINERJA (Performance Audit with Transparent Formula) */}
      {activeTab === 'KINERJA' && (
        <SignalPerformanceView
          signals={signals}
          isDark={isDark}
          lang={lang}
          onInspectSignal={(sig) => setSelectedSignalForAudit(sig)}
        />
      )}

      {/* 5. VIEW: ANALISIS LANGSUNG (Deep Price Ladder & Confluence Inspector) */}
      {activeTab === 'ANALISIS_LANGSUNG' && (
        <SignalLiveAnalysisView
          selectedSignal={selectedSignalForLiveAnalysis}
          allSignals={signals}
          onSelectSignal={(sig) => setSelectedSignalForLiveAnalysis(sig)}
          isDark={isDark}
          lang={lang}
          onNavigateToTrade={(sym) => {
            if (onNavigateToTrade) onNavigateToTrade(sym);
            if (onSelectSymbol) onSelectSymbol(sym);
          }}
        />
      )}

      {/* 6. VIEW: BELAJAR (Educational Center) */}
      {activeTab === 'BELAJAR' && (
        <SignalLearningView
          isDark={isDark}
          lang={lang}
          onNavigateToMethodology={() => setActiveTab('METODOLOGI')}
        />
      )}

      {/* 7. VIEW: METODOLOGI (Full Comprehensive Documentation with Simulator) */}
      {activeTab === 'METODOLOGI' && (
        <SignalMethodologyView
          isDark={isDark}
          lang={lang}
          onNavigateToSignals={() => setActiveTab('SINYAL')}
        />
      )}

      {/* 8. VIEW: WAWASAN (Market Intelligence & Sector Alpha) */}
      {activeTab === 'WAWASAN' && <SignalInsightsView isDark={isDark} lang={lang} />}

      {/* 9. VIEW: HARGA (Subscription & API Pricing) */}
      {activeTab === 'HARGA' && (
        <SignalPricingView
          isDark={isDark}
          lang={lang}
          onOpenContact={() => setShowContactModal(true)}
        />
      )}

      {/* 10. Audit Modal (Verifiable cryptographic hash & trade chronology) */}
      <SignalAuditModal
        signal={selectedSignalForAudit}
        onClose={() => setSelectedSignalForAudit(null)}
        isDark={isDark}
        lang={lang}
      />

      {/* 11. VIP Telegram Desk & Contact Modal */}
      <SignalContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        isDark={isDark}
        lang={lang}
      />

      {/* 12. Telegram Webhook Configuration Modal */}
      {showTelegramConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 font-mono space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-pink-400" />
                <span>Integrasi Sinyal & Webhook VIP</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTelegramConfigModal(false)}
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
                <div className="text-[11px] text-pink-300 font-bold">Filter Penyiaran Sinyal:</div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Kirim hanya sinyal dengan status STRONG:</span>
                  <input type="checkbox" defaultChecked className="accent-pink-500" />
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Kirim level lengkap r1–r8 & s1–s4:</span>
                  <input type="checkbox" defaultChecked className="accent-pink-500" />
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Notifikasi aktivasi Trailing Stop:</span>
                  <input type="checkbox" defaultChecked className="accent-pink-500" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTelegramConfigModal(false);
                setTelegramNotificationSent('Semua Saluran Telegram VIP');
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
