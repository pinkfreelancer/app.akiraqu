import React, { useState, useMemo } from 'react';
import {
  OHLCVCandle,
  Timeframe,
  MMPlaybookAnalysis,
  TheTrapAndSpikePattern,
  AbsorptionPhasePattern,
  TheFlushLiquiditySweepPattern,
} from '../types/crypto.types';
import { analyzeMarketMakerPlaybook } from '../services/marketMaker/mmEngine';
import {
  Skull,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Zap,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Radio,
  ArrowRight,
  BookOpen,
  Layers,
  Fingerprint,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface MarketMakerPlaybookCardProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  currentPrice?: number;
  lang?: Language;
  theme?: 'dark' | 'light';
}

export const MarketMakerPlaybookCard: React.FC<MarketMakerPlaybookCardProps> = ({
  candles,
  symbol,
  timeframe,
  currentPrice: overridePrice,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activePattern, setActivePattern] = useState<'trap' | 'absorption' | 'sweep'>('sweep');

  const livePrice = overridePrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  const mmData: MMPlaybookAnalysis = useMemo(() => {
    return analyzeMarketMakerPlaybook(candles, livePrice, symbol, timeframe);
  }, [candles, livePrice, symbol, timeframe]);

  const { trapAndSpike, absorptionPhase, liquiditySweep, regime, dominantMMBotAction, retailCautionAlert, institutionalEntryWindow } = mmData;

  const formatPrice = (p: number) => formatCryptoPrice(p);

  return (
    <div
      id="mm-playbook-anatomy-card"
      className={`rounded-2xl border p-5 transition-all duration-200 ${
        isDark ? 'bg-[#080d1a] border-indigo-500/30 text-slate-100' : 'bg-white border-indigo-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-sm">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight font-display flex items-center gap-2">
                <span>{isId ? 'Anatomi Pola Manipulasi Algoritma' : 'Algorithmic Manipulation Playbook'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold uppercase">
                  MM Playbook
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {isId
                ? 'Dekonstruksi Strategi Market Maker: The Trap & Spike, Absorption Phase, & The Flush / Liquidity Sweep'
                : 'Deconstructing Market Maker Patterns: The Trap & Spike, Silent Absorption, & Liquidity Flush'}
            </p>
          </div>
        </div>

        {/* Current Market Regime Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-purple-950/30 border-purple-500/30 text-xs font-mono">
          <span className="text-slate-400 text-[10px] uppercase font-bold">{isId ? 'Rezim MM:' : 'MM Regime:'}</span>
          <span className="font-extrabold text-purple-300">{regime.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Institutional Alert Strip */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-3 rounded-xl border text-xs font-mono ${
          isDark ? 'bg-[#0e162b] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1 flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            {isId ? 'Aktivitas Bot Dominan' : 'Dominant Bot Activity'}
          </span>
          <p className="text-slate-300 leading-snug">{dominantMMBotAction}</p>
        </div>

        <div className={`p-3 rounded-xl border text-xs font-mono ${
          isDark ? 'bg-[#0e162b] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            {isId ? 'Peringatan Jebakan Ritel' : 'Retail Caution Alert'}
          </span>
          <p className="text-slate-300 leading-snug">{retailCautionAlert}</p>
        </div>

        <div className={`p-3 rounded-xl border text-xs font-mono ${
          isDark ? 'bg-[#0e162b] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1 flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-emerald-400" />
            {isId ? 'Jendela Entri Institusional' : 'Smart Money Entry Window'}
          </span>
          <p className="text-slate-300 leading-snug">{institutionalEntryWindow}</p>
        </div>
      </div>

      {/* Pattern Selection Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {/* Tab 1: The Trap & Spike */}
        <button
          onClick={() => setActivePattern('trap')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activePattern === 'trap'
              ? 'bg-rose-500 text-slate-950 font-extrabold shadow-lg shadow-rose-500/20'
              : trapAndSpike.isDetected
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
              : isDark ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
          }`}
        >
          <Skull className="w-4 h-4" />
          <span>1. The Trap & Spike</span>
          {trapAndSpike.isDetected && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        {/* Tab 2: Absorption Phase */}
        <button
          onClick={() => setActivePattern('absorption')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activePattern === 'absorption'
              ? 'bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-500/20'
              : absorptionPhase.isDetected
              ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
              : isDark ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Absorption Phase</span>
          {absorptionPhase.isDetected && (
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          )}
        </button>

        {/* Tab 3: The Flush / Liquidity Sweep */}
        <button
          onClick={() => setActivePattern('sweep')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activePattern === 'sweep'
              ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/20'
              : liquiditySweep.isDetected
              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
              : isDark ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>3. The Flush / Liquidity Sweep</span>
          {liquiditySweep.isDetected && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>
      </div>

      {/* Active Pattern Anatomy Display */}
      <div className="mt-5">
        {/* ======================================================== */}
        {/* PATTERN 1: THE TRAP & SPIKE (Penciptaan Volatilitas Palsu)*/}
        {/* ======================================================== */}
        {activePattern === 'trap' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Live Detection Summary Banner */}
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              trapAndSpike.isDetected
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${trapAndSpike.isDetected ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Skull className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase font-mono">
                      {trapAndSpike.isDetected ? `Pola Aktif: ${trapAndSpike.trapType.replace(/_/g, ' ')}` : 'Status: Tidak Terdeteksi Fake Spike Ekstrem'}
                    </span>
                    {trapAndSpike.isDetected && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold font-mono">
                        Konfidensi {trapAndSpike.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {trapAndSpike.mmObjective}
                  </p>
                </div>
              </div>

              {trapAndSpike.isDetected && (
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase">Target Reversal Reclaim</span>
                  <span className="text-base font-black text-rose-400">${formatPrice(trapAndSpike.reversalTarget)}</span>
                </div>
              )}
            </div>

            {/* Step-by-Step Anatomical Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-1">FASE 1: INDUCEMENT</span>
                <h5 className="text-xs font-bold text-slate-200 mb-1">Pemancingan Minat Ritel</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Bot MM memasang bid/ask walls tebal secara bertahap untuk memancing trader ritel membuka posisi searah menjelang resistance/support.
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-1">FASE 2: THE SPIKE</span>
                <h5 className="text-xs font-bold text-slate-200 mb-1">Spike Volatilitas Kilat</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Eksekusi order pasar agresif dalam pecahan detik menembus level kunci (wicking) untuk melikuidasi stop short atau memicu breakout buy.
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-1">FASE 3: THE TRAP</span>
                <h5 className="text-xs font-bold text-slate-200 mb-1">Pencabutan Likuiditas (Spoof)</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Tembok bid palsu seketika ditarik (cancelled), meninggalkan pembeli ritel terjebak di puncak tanpa ada support order book di bawahnya.
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-1">FASE 4: MEAN REVERSION</span>
                <h5 className="text-xs font-bold text-slate-200 mb-1">Bantingan Balik Cepat</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Harga dibanting kembali ke dalam range (V-shape drop) menuju level VWAP / OTE zone di mana MM meraup profit dari likuidasi ritel.
                </p>
              </div>
            </div>

            {/* Smart Money Action Playbook */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0c1222] border-rose-500/30' : 'bg-rose-50/60 border-rose-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold font-mono uppercase text-rose-400">
                  {isId ? 'Panduan Aksi Anti-Jebakan (Institutional Counter-Play)' : 'Institutional Counter-Play Plan'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-200 leading-relaxed">
                {trapAndSpike.actionPlan}
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PATTERN 2: ABSORPTION PHASE (Akumulasi Senyap)           */}
        {/* ======================================================== */}
        {activePattern === 'absorption' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Live Detection Summary Banner */}
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              absorptionPhase.isDetected
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${absorptionPhase.isDetected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase font-mono">
                      {absorptionPhase.isDetected ? `Pola Aktif: ${absorptionPhase.absorptionType.replace(/_/g, ' ')}` : 'Status: Aliran Likuiditas Normal'}
                    </span>
                    {absorptionPhase.isDetected && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                        Konfidensi {absorptionPhase.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {absorptionPhase.mmObjective}
                  </p>
                </div>
              </div>

              {absorptionPhase.isDetected && (
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase">Level Pertahanan (Defense Level)</span>
                  <span className="text-base font-black text-indigo-400">${formatPrice(absorptionPhase.defenseLevel)}</span>
                </div>
              )}
            </div>

            {/* Key Absorption Metrics Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  {isId ? 'Rasio Divergensi Delta' : 'Delta Divergence Ratio'}
                </span>
                <div className="text-xl font-black font-mono text-indigo-400">
                  {absorptionPhase.deltaDivergenceRatio}x
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {isId ? 'Volume agresif jual diserap tanpa menurunkan harga' : 'Aggressive sell volume absorbed with zero downward price progress'}
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  {isId ? 'Estimasi Volume Terserap' : 'Estimated Absorbed Volume'}
                </span>
                <div className="text-xl font-black font-mono text-cyan-400">
                  ${(absorptionPhase.passiveVolumeAbsorbedUsd / 1000000).toFixed(1)}M
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {isId ? 'Total akumulasi limit order pasif (Iceberg)' : 'Total passive iceberg limit orders executed'}
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  {isId ? 'Arah Breakout Imminent' : 'Breakout Trajectory'}
                </span>
                <div className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-5 h-5" />
                  <span>{absorptionPhase.breakoutImminentDirection}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {isId ? 'Potensi ledakan momentum pasca penyerapan tuntas' : 'Anticipated momentum impulse following absorption exhaustion'}
                </p>
              </div>
            </div>

            {/* Smart Money Action Playbook */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0c1222] border-indigo-500/30' : 'bg-indigo-50/60 border-indigo-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold font-mono uppercase text-indigo-400">
                  {isId ? 'Panduan Aksi Akumulasi (Institutional Accumulation Play)' : 'Institutional Accumulation Plan'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-200 leading-relaxed">
                {absorptionPhase.actionPlan}
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PATTERN 3: THE FLUSH / LIQUIDITY SWEEP                   */}
        {/* ======================================================== */}
        {activePattern === 'sweep' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Live Detection Summary Banner */}
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              liquiditySweep.isDetected
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${liquiditySweep.isDetected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase font-mono">
                      {liquiditySweep.isDetected ? `Pola Aktif: ${liquiditySweep.sweepType.replace(/_/g, ' ')}` : 'Status: Menunggu Pemicu Sapuan Likuiditas'}
                    </span>
                    {liquiditySweep.isDetected && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                        Konfidensi {liquiditySweep.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {liquiditySweep.mmObjective}
                  </p>
                </div>
              </div>

              {liquiditySweep.isDetected && (
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase">Level Reclaim Konfirmasi</span>
                  <span className="text-base font-black text-cyan-400">${formatPrice(liquiditySweep.reclaimLevel)}</span>
                </div>
              )}
            </div>

            {/* Anatomy Breakdown: Why Liquidity Sweeps Happen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                  1. TARGET POOL LIKUIDITAS
                </span>
                <h5 className="text-xs font-bold text-slate-200 mb-1">Equal Highs / Equal Lows (EQH/EQL)</h5>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Traders ritel menempatkan ribuan stop-loss dan breakout orders persis beberapa poin di luar swing high / swing low. Ini adalah magnet likuiditas raksasa bagi Market Maker.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                  2. THE SWEEP & DISPLACEMENT
                </span>
                <h5 className="text-xs font-bold text-slate-200 mb-1">Sapuan Stop Run Kilat</h5>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Harga disapu beberapa pips untuk mengaktifkan seluruh stop loss menjadi market order, yang langsung ditelan oleh limit order institusional tanpa slippage (Filling Size).
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                  3. THE RECLAIM ENTRY
                </span>
                <h5 className="text-xs font-bold text-slate-200 mb-1">Konfirmasi Reclaim Kunci</h5>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Begitu candle merebut kembali (reclaim) level yang disapu, momentum berbalik tajam menuju sisi berlawanan dari range likuiditas (Liquidity Run).
                </p>
              </div>
            </div>

            {/* Smart Money Action Playbook */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0c1222] border-cyan-500/30' : 'bg-cyan-50/60 border-cyan-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono uppercase text-cyan-400">
                  {isId ? 'Panduan Aksi Likuiditas (Smart Money Sweep Play)' : 'Smart Money Sweep Action Plan'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-200 leading-relaxed">
                {liquiditySweep.actionPlan}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
