import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Info,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  Zap,
} from 'lucide-react';
import { ConfluenceEvaluation, OHLCVCandle, SupportedExchange, Timeframe } from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';
import { AkiraAvatar } from './AkiraAvatar';

interface BasicOverviewWorkspaceProps {
  symbol: string;
  timeframe: Timeframe;
  exchange?: SupportedExchange;
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  candles: OHLCVCandle[];
  evaluation?: ConfluenceEvaluation | null;
  accountMode?: 'DEMO' | 'REAL';
  demoBalance?: number;
  privacyBlurActive?: boolean;
  onSelectSymbol?: (symbol: string) => void;
  onSelectTimeframe?: (tf: Timeframe) => void;
  onTriggerAnalyze?: () => void;
  isLoading?: boolean;
  onSwitchPersona?: (persona: any) => void;
  onOpenAkira: () => void;
  lang?: Language;
  theme?: string;
}

export const BasicOverviewWorkspace: React.FC<BasicOverviewWorkspaceProps> = ({
  symbol,
  timeframe,
  exchange = 'Binance',
  livePrice = 0,
  candles,
  evaluation,
  accountMode = 'DEMO',
  demoBalance = 100000,
  privacyBlurActive = false,
  onOpenAkira,
  lang = 'id',
  theme = 'dark',
}) => {
  const isId = lang === 'id';
  const isDark = theme !== 'modern-pink-light' && theme !== 'theme-light' && theme !== 'light';

  // Active Glossary Tooltip Modal State
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const currentPrice = livePrice || (candles.length > 0 ? candles[candles.length - 1].close : 65000);
  const firstCandlePrice = candles.length > 0 ? candles[0].close : currentPrice;
  const priceChangePercent = firstCandlePrice > 0 ? ((currentPrice - firstCandlePrice) / firstCandlePrice) * 100 : 0;
  const isPricePositive = priceChangePercent >= 0;

  // Signal Evaluation
  const score = evaluation?.confluenceScore ?? 65;
  const bias = evaluation?.marketBias ?? 'NEUTRAL';
  const isBullish = String(bias).toUpperCase().includes('BULL');
  const isBearish = String(bias).toUpperCase().includes('BEAR');

  const signalLabel = isBullish ? (isId ? 'SINYAL BELI' : 'BUY SIGNAL') : isBearish ? (isId ? 'SINYAL JUAL' : 'SELL SIGNAL') : (isId ? 'SINYAL TUNGGU / NETRAL' : 'HOLD / NEUTRAL');

  // Risk Meter Calculation
  const riskStatus: 'SAFE' | 'CAUTION' | 'HIGH_RISK' =
    score > 70 ? 'SAFE' : score > 45 ? 'CAUTION' : 'HIGH_RISK';

  const cryptoGlossary: Record<string, { title: string; desc: string }> = {
    'Spot': {
      title: isId ? 'Pasar Spot' : 'Spot Market',
      desc: isId
        ? 'Perdagangan langsung di mana Anda memiliki aset kripto secara riil 1:1 tanpa hutang/leverage.'
        : 'Direct trading where you own the underlying cryptocurrency asset 1:1 without leverage.',
    },
    'Futures': {
      title: isId ? 'Pasar Kontrak (Futures)' : 'Futures Contract',
      desc: isId
        ? 'Perdagangan kontrak harga dengan daya ungkit (leverage 1x–125x), memungkinkan profit saat harga naik maupun turun.'
        : 'Derivative price trading with leverage multiplier, allowing profits in both rising and falling markets.',
    },
    'Stop Loss': {
      title: 'Stop Loss (SL)',
      desc: isId
        ? 'Batas pengaman otomatis untuk menutup posisi jika harga berlawanan, mencegah kerugian besar.'
        : 'An automated safety trigger to exit a trade if the market moves against your position.',
    },
    'Slippage': {
      title: 'Slippage',
      desc: isId
        ? 'Selisih antara harga pesanan yang Anda inginkan dengan harga eksekusi aktual saat pasar bergerak cepat.'
        : 'The difference between the expected price of an order and the actual executed price.',
    },
    'Order Book': {
      title: isId ? 'Buku Pesanan (Order Book)' : 'Order Book Depth',
      desc: isId
        ? 'Daftar antrean pesanan beli (Bid) dan pesanan jual (Ask) yang sedang menunggu eksekusi di bursa.'
        : 'The live electronic ledger of pending buy (Bid) and sell (Ask) orders on the exchange.',
    },
    'Risk:Reward': {
      title: 'Risk to Reward (R:R)',
      desc: isId
        ? 'Perbandingan antara potensi risiko kerugian vs potensi keuntungan yang ditargetkan (contoh: 1:2.5).'
        : 'The ratio comparing the capital you risk against the potential profit targeted.',
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* 1. Header Banner & Educational Intro */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#0B0F19] border-[#334155]'
            : 'bg-gradient-to-r from-pink-50/50 via-white to-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <AkiraAvatar size={40} isOnline={true} showGlow={true} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">
                {isId ? 'Dashboard Sederhana' : 'Basic Clean View'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/15 border border-pink-500/30 text-pink-400">
                {isId ? 'BEBAS DISTRAKSI' : 'NO CLUTTER'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isId
                ? 'Semua indikator rumit diringkas menjadi sinyal aksi bahasa manusia yang mudah dipahami.'
                : 'Complex multi-indicator noise distilled into clear, actionable human-readable decisions.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAkira}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isId ? 'Tanya Asisten Akira' : 'Ask Akira AI'}</span>
        </button>
      </div>

      {/* 2. Portfolio Summary & Asset Allocation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {accountMode === 'DEMO' ? (isId ? 'Saldo Demo Sandbox' : 'Sandbox Demo Balance') : (isId ? 'Nilai Portofolio Riil' : 'Live Portfolio Value')}
            </span>
            <Wallet className="w-4 h-4 text-pink-400" />
          </div>

          <div className="my-3">
            <div className={`text-2xl font-black font-mono tracking-tight ${privacyBlurActive ? 'privacy-blur' : ''}`}>
              ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-mono font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+4.85% ({isId ? '24 Jam Terakhir' : '24h Change'})</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono border-t pt-2 border-slate-700/40">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Bursa:</span>
            <span className="font-bold text-pink-400">{exchange}</span>
          </div>
        </div>

        {/* Current Asset Focus Card */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-pink-400">{symbol}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                {timeframe}
              </span>
            </div>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="my-3">
            <div className="text-2xl font-black font-mono tracking-tight">
              ${formatCryptoPrice(currentPrice)}
            </div>
            <div className={`flex items-center gap-1.5 mt-1 text-xs font-mono font-bold ${
              isPricePositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPricePositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>
                {priceChangePercent >= 0 ? '+' : ''}
                {priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono border-t pt-2 border-slate-700/40">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isId ? 'Volume 24 Jam:' : '24h Volume:'}</span>
            <span className="font-bold">$1.84 B</span>
          </div>
        </div>

        {/* Risk Meter Card */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isId ? 'Meter Risiko Pasar' : 'Market Risk Meter'}
            </span>
            {riskStatus === 'SAFE' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : riskStatus === 'CAUTION' ? (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
          </div>

          <div className="my-2">
            <div className="flex items-center justify-between mb-1 text-xs font-mono font-bold">
              <span
                className={
                  riskStatus === 'SAFE'
                    ? 'text-emerald-400'
                    : riskStatus === 'CAUTION'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {riskStatus === 'SAFE'
                  ? isId ? 'AMAN (Terkendali)' : 'SAFE (Low Risk)'
                  : riskStatus === 'CAUTION'
                  ? isId ? 'WASPADA (Volatilitas Sedang)' : 'CAUTION (Medium Risk)'
                  : isId ? 'RISIKO TINGGI (Manipulasi)' : 'HIGH RISK (High Volatility)'}
              </span>
              <span className="text-slate-400">{score}/100</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${
                  riskStatus === 'SAFE'
                    ? 'bg-emerald-400'
                    : riskStatus === 'CAUTION'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
              />
            </div>
          </div>

          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {riskStatus === 'SAFE'
              ? isId ? 'Struktur harga teratur, tren stabil di atas garis rata-rata.' : 'Clean market structure with consistent volume follow-through.'
              : riskStatus === 'CAUTION'
              ? isId ? 'Gunakan Stop Loss ketat; volatilitas berpotensi meningkat.' : 'Maintain disciplined stop losses; expect moderate wick volatility.'
              : isId ? 'Hindari posisi ber-leverage tinggi saat ini.' : 'Avoid high-leverage market orders under current choppy conditions.'}
          </p>
        </div>
      </div>

      {/* 3. Main Simplified Signal Card & Clean Price Area */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#1E293B]/90 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/40">
          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isId ? 'Keputusan Terpadu Akira' : 'Unified Decision Engine'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3
                className={`text-xl font-black font-mono ${
                  isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                {signalLabel}
              </h3>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {score}% {isId ? 'Konfidensi' : 'Confidence'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTerm('Risk:Reward')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono border border-slate-700/50 hover:border-pink-400 text-slate-400 hover:text-pink-300 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isId ? 'Panduan Entri' : 'Entry Guide'}</span>
            </button>
          </div>
        </div>

        {/* Clean Simplified Price Trend SVG Sparkline Area */}
        <div className="my-4">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
            <span>{isId ? 'Arah Tren Harga Terkini' : 'Recent Price Trajectory'}</span>
            <span className="text-pink-400 font-bold">{candles.length} Candles Synced</span>
          </div>

          <div className={`w-full h-36 rounded-xl border p-2 relative flex items-center justify-center overflow-hidden ${
            isDark ? 'bg-[#0B0F19] border-[#223149]' : 'bg-slate-50 border-slate-200'
          }`}>
            {candles.length > 5 ? (
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="basicAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Calculate simplified SVG path */}
                {(() => {
                  const prices = candles.slice(-40).map((c) => c.close);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  const range = max - min || 1;
                  const points = prices.map((p, i) => {
                    const x = (i / (prices.length - 1)) * 400;
                    const y = 90 - ((p - min) / range) * 80;
                    return `${x},${y}`;
                  });
                  const pathStr = `M ${points.join(' L ')}`;
                  const areaStr = `M 0,100 L ${points.join(' L ')} L 400,100 Z`;

                  return (
                    <>
                      <path d={areaStr} fill="url(#basicAreaGrad)" />
                      <path d={pathStr} fill="none" stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" />
                    </>
                  );
                })()}
              </svg>
            ) : (
              <span className="text-xs font-mono text-slate-500">
                {isId ? 'Sinkronisasi data lilin harga...' : 'Syncing price candles...'}
              </span>
            )}
          </div>
        </div>

        {/* Human-Readable Explanation */}
        <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
          isDark ? 'bg-[#0F172A] text-slate-300' : 'bg-slate-50 text-slate-700'
        }`}>
          <span className="font-bold text-pink-400 block mb-1">
            {isId ? '💡 Rangkuman Eksekutif untuk Pemula:' : '💡 Plain English Summary:'}
          </span>
          <p>
            {isBullish
              ? isId
                ? 'Pasar sedang dalam tekanan beli institusional yang stabil. Jika ingin membuka posisi, pasang Stop Loss di bawah level terendah baru-baru ini untuk melindungi modal Anda.'
                : 'The market exhibits steady institutional buying pressure. Consider entering with a disciplined stop loss anchored beneath recent lows.'
              : isBearish
              ? isId
                ? 'Tekanan jual mendominasi. Disarankan menunggu hingga terbentuk lantai harga yang jelas sebelum mengambil posisi beli baru.'
                : 'Seller dominance persists. Recommend awaiting a confirmed price floor before deploying fresh capital.'
              : isId
              ? 'Pasar bergerak menyamping (sideways). Tidak ada tren dominan yang jelas; disarankan menunggu terobosan harga sebelum bertindak.'
              : 'Market is range-bound. No distinct edge detected; consider standing aside until clear expansion occurs.'}
          </p>
        </div>
      </div>

      {/* 4. Interactive Crypto Glossary & Help Chips */}
      <div
        className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-pink-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400">
            {isId ? 'Glosarium & Penjelasan Istilah Kripto (Klik untuk Pelajari)' : 'Interactive Crypto Glossary (Click to Learn)'}
          </h4>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.keys(cryptoGlossary).map((term) => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                selectedTerm === term
                  ? 'bg-pink-500 text-white border-pink-400 shadow-xs'
                  : isDark
                  ? 'bg-[#0F172A] border-[#334155] text-slate-300 hover:text-white hover:border-pink-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-pink-400'
              }`}
            >
              {term}
            </button>
          ))}
        </div>

        {/* Selected Term Drawer / Box */}
        {selectedTerm && cryptoGlossary[selectedTerm] && (
          <div className={`mt-3 p-3.5 rounded-xl border animate-in fade-in duration-200 ${
            isDark ? 'bg-[#0B0F19] border-pink-500/40 text-slate-200' : 'bg-pink-50/60 border-pink-300 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-pink-400">
                {cryptoGlossary[selectedTerm].title}
              </span>
              <button
                onClick={() => setSelectedTerm(null)}
                className="text-xs opacity-60 hover:opacity-100 font-mono"
              >
                ✕ {isId ? 'Tutup' : 'Close'}
              </button>
            </div>
            <p className="text-xs leading-relaxed">
              {cryptoGlossary[selectedTerm].desc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
