import React, { useState, useMemo } from 'react';
import {
  OHLCVCandle,
  Timeframe,
  MMPlaybookAnalysis,
  LiveOrderBookLevel,
} from '../types/crypto.types';
import { analyzeMarketMakerPlaybook } from '../services/marketMaker/mmEngine';
import {
  Fingerprint,
  Skull,
  Layers,
  Crosshair,
  TrendingUp,
  AlertTriangle,
  Radio,
  Info,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface MarketMakerPlaybookCardProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  currentPrice?: number;
  mmData?: MMPlaybookAnalysis;
  orderBookBids?: LiveOrderBookLevel[];
  orderBookAsks?: LiveOrderBookLevel[];
  lang?: Language;
  theme?: 'dark' | 'light';
}

export const MarketMakerPlaybookCard: React.FC<MarketMakerPlaybookCardProps> = ({
  candles,
  symbol,
  timeframe,
  currentPrice: overridePrice,
  mmData: precomputedMMData,
  orderBookBids,
  orderBookAsks,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activePattern, setActivePattern] = useState<'trap' | 'absorption' | 'sweep'>('trap');

  const livePrice = overridePrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  const lastCandleTime = candles.length > 0 ? candles[candles.length - 1].time : 0;
  const candleCount = candles.length;
  const bidsCount = orderBookBids?.length || 0;
  const asksCount = orderBookAsks?.length || 0;

  const mmData: MMPlaybookAnalysis = useMemo(() => {
    if (precomputedMMData) return precomputedMMData;
    return analyzeMarketMakerPlaybook(candles, livePrice, symbol, timeframe, orderBookBids, orderBookAsks);
  }, [precomputedMMData, candleCount, lastCandleTime, livePrice, symbol, timeframe, bidsCount, asksCount]);

  const {
    regime,
    dominantMMBotAction,
    retailCautionAlert,
    institutionalEntryWindow,
    trapAndSpike,
    absorptionPhase,
    liquiditySweep,
  } = mmData;

  const formatPrice = (p: number) => formatCryptoPrice(p);

  return (
    <div
      id="mm-playbook-anatomy-card"
      className={`rounded-[2px] border p-5 transition-all duration-200 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Header Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[2px] bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 shadow-xs">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight font-display flex items-center gap-2">
                <span>{isId ? 'Anatomi Pola Manipulasi Algoritma' : 'Algorithmic Manipulation Playbook'}</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-[2px] border font-bold uppercase ${
                  isDark ? 'bg-pink-500/15 border-pink-500/30 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-700'
                }`}>
                  MM Playbook
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {isId
                ? 'Dekonstruksi Strategi Kuantitatif: The Trap & Spike, Absorption Phase, & The Flush / Liquidity Sweep'
                : 'Deconstructing Market Maker Patterns: The Trap & Spike, Silent Absorption, & Liquidity Flush'}
            </p>
          </div>
        </div>

        {/* Current Market Regime Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] border text-xs font-mono ${
          isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <span className="text-slate-400 text-[11px] uppercase font-bold">{isId ? 'Rezim MM:' : 'MM Regime:'}</span>
          <span className={`font-extrabold ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>{regime.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Institutional Alert Strip */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-3 rounded-[2px] border text-xs font-mono ${
          isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-xs text-pink-400 uppercase font-bold mb-1 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-pink-400" />
            {isId ? 'Aktivitas Bot Dominan' : 'Dominant Bot Activity'}
          </span>
          <p className={`leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{dominantMMBotAction}</p>
        </div>

        <div className={`p-3 rounded-[2px] border text-xs font-mono ${
          isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-xs text-amber-400 uppercase font-bold mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            {isId ? 'Peringatan Jebakan Ritel' : 'Retail Caution Alert'}
          </span>
          <p className={`leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{retailCautionAlert}</p>
        </div>

        <div className={`p-3 rounded-[2px] border text-xs font-mono ${
          isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-xs text-emerald-400 uppercase font-bold mb-1 flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            {isId ? 'Jendela Entri Institusional' : 'Smart Money Entry Window'}
          </span>
          <p className={`leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{institutionalEntryWindow}</p>
        </div>
      </div>

      {/* Pattern Selection Tabs */}
      <div className={`mt-6 flex flex-wrap gap-2 border-b pb-3 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        {/* Tab 1: The Trap & Spike */}
        <button
          onClick={() => setActivePattern('trap')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer ${
            activePattern === 'trap'
              ? 'bg-rose-500 text-white font-extrabold shadow-xs'
              : trapAndSpike.isDetected
              ? isDark ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-700'
              : isDark ? 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          <Skull className="w-4 h-4" />
          <span>1. The Trap & Spike</span>
          {trapAndSpike.isDetected && (
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          )}
        </button>

        {/* Tab 2: Absorption Phase */}
        <button
          onClick={() => setActivePattern('absorption')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer ${
            activePattern === 'absorption'
              ? 'bg-indigo-600 text-white font-extrabold shadow-xs'
              : absorptionPhase.isDetected
              ? isDark ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
              : isDark ? 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Absorption Phase</span>
          {absorptionPhase.isDetected && (
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          )}
        </button>

        {/* Tab 3: The Flush / Liquidity Sweep */}
        <button
          onClick={() => setActivePattern('sweep')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer ${
            activePattern === 'sweep'
              ? 'bg-pink-600 text-white font-extrabold shadow-xs'
              : liquiditySweep.isDetected
              ? isDark ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300' : 'bg-pink-50 border border-pink-200 text-pink-700'
              : isDark ? 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>3. The Flush / Liquidity Sweep</span>
          {liquiditySweep.isDetected && (
            <span className="w-2 h-2 rounded-full bg-pink-400" />
          )}
        </button>
      </div>

      {/* Active Pattern Anatomy Display */}
      <div className="mt-5">
        {/* ======================================================== */}
        {/* PATTERN 1: THE TRAP & SPIKE (Penciptaan Volatilitas Palsu)*/}
        {/* ======================================================== */}
        {activePattern === 'trap' && (
          <div className="space-y-5">
            {/* Live Detection Summary Banner */}
            <div className={`p-4 rounded-[2px] border flex flex-wrap items-center justify-between gap-3 ${
              trapAndSpike.isDetected
                ? isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
                : isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-[2px] ${trapAndSpike.isDetected ? 'bg-rose-500/20 text-rose-400' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                  <Skull className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase font-mono">
                      {trapAndSpike.isDetected ? `Pola Aktif: ${trapAndSpike.trapType.replace(/_/g, ' ')}` : 'Status: Tidak Terdeteksi False Spike Ekstrem'}
                    </span>
                    {trapAndSpike.isDetected && (
                      <span className="text-[11px] px-2 py-0.5 rounded-[2px] bg-rose-500/20 text-rose-400 font-bold font-mono border border-rose-500/30">
                        Konfidensi {trapAndSpike.confidence}%
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {trapAndSpike.mmObjective}
                  </p>
                </div>
              </div>

              {trapAndSpike.isDetected && (
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[11px] uppercase">Target Reversal Reclaim</span>
                  <span className="text-base font-black text-rose-400">${formatPrice(trapAndSpike.reversalTarget)}</span>
                </div>
              )}
            </div>

            {/* Characteristics list */}
            {trapAndSpike.characteristics.length > 0 && (
              <div className={`p-3 rounded-[2px] border text-xs font-mono ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-slate-400 uppercase font-bold block mb-1">Karakteristik Sinyal:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {trapAndSpike.characteristics.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step-by-Step Anatomical Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-mono text-rose-400 font-bold block mb-1">FASE 1: INDUCEMENT</span>
                <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Pemancingan Minat Ritel</h4>
                <p className={`text-xs leading-relaxed font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Bot MM memasang bid/ask walls tebal secara bertahap untuk memancing trader ritel membuka posisi searah menjelang resistance/support.
                </p>
              </div>

              <div className={`p-3.5 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-mono text-rose-400 font-bold block mb-1">FASE 2: THE SPIKE</span>
                <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Spike Volatilitas Kilat</h4>
                <p className={`text-xs leading-relaxed font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Eksekusi order pasar agresif dalam pecahan detik menembus level kunci (wicking) untuk melikuidasi stop short atau memicu breakout buy.
                </p>
              </div>

              <div className={`p-3.5 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-mono text-rose-400 font-bold block mb-1">FASE 3: THE TRAP</span>
                <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Pencabutan Likuiditas (Spoof)</h4>
                <p className={`text-xs leading-relaxed font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Tembok bid palsu seketika ditarik (cancelled), meninggalkan pembeli ritel terjebak di puncak tanpa ada support order book di bawahnya.
                </p>
              </div>

              <div className={`p-3.5 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-mono text-rose-400 font-bold block mb-1">FASE 4: MEAN REVERSION</span>
                <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Bantingan Balik Cepat</h4>
                <p className={`text-xs leading-relaxed font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Harga dibanting kembali ke dalam range (V-shape drop) menuju level VWAP / OTE zone di mana MM meraup profit dari likuidasi ritel.
                </p>
              </div>
            </div>

            {/* Smart Money Action Playbook */}
            <div className={`p-4 rounded-[2px] border ${
              isDark ? 'bg-rose-950/15 border-rose-500/30' : 'bg-rose-50/70 border-rose-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold font-mono uppercase text-rose-400">
                  {isId ? 'Panduan Aksi Anti-Jebakan (Institutional Counter-Play)' : 'Institutional Counter-Play Plan'}
                </span>
              </div>
              <p className={`text-xs font-mono leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {trapAndSpike.actionPlan}
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PATTERN 2: ABSORPTION PHASE (Akumulasi Senyap)           */}
        {/* ======================================================== */}
        {activePattern === 'absorption' && (
          <div className="space-y-5">
            {/* Live Detection Summary Banner */}
            <div className={`p-4 rounded-[2px] border flex flex-wrap items-center justify-between gap-3 ${
              absorptionPhase.isDetected
                ? isDark ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                : isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-[2px] ${absorptionPhase.isDetected ? 'bg-indigo-500/20 text-indigo-400' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase font-mono">
                      {absorptionPhase.isDetected ? `Pola Aktif: ${absorptionPhase.absorptionType.replace(/_/g, ' ')}` : 'Status: Aliran Likuiditas Normal'}
                    </span>
                    {absorptionPhase.isDetected && (
                      <span className="text-[11px] px-2 py-0.5 rounded-[2px] bg-indigo-500/20 text-indigo-400 font-bold font-mono border border-indigo-500/30">
                        Konfidensi {absorptionPhase.confidence}%
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {absorptionPhase.mmObjective}
                  </p>
                </div>
              </div>

              {absorptionPhase.isDetected && (
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[11px] uppercase">Level Pertahanan (Defense Level)</span>
                  <span className="text-base font-black text-indigo-400">${formatPrice(absorptionPhase.defenseLevel)}</span>
                </div>
              )}
            </div>

            {/* Key Absorption Metrics Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3.5 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  {isId ? 'Rasio Divergensi Delta' : 'Delta Divergence Ratio'}
                </span>
                <div className="text-xl font-black font-mono text-indigo-400">
                  {absorptionPhase.deltaDivergenceRatio}x
                </div>
                <p className={`text-xs mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isId ? 'Volume agresif jual diserap tanpa menurunkan harga' : 'Aggressive sell volume absorbed with zero downward price progress'}
                </p>
              </div>

              <div className={`p-3.5 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  {isId ? 'Estimasi Volume Terserap' : 'Estimated Absorbed Volume'}
                </span>
                <div className="text-xl font-black font-mono text-pink-400">
                  ${(absorptionPhase.passiveVolumeAbsorbedUsd / 1000000).toFixed(1)}M
                </div>
                <p className={`text-xs mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isId ? 'Total estimasi notional limit yang dieksekusi pasif' : 'Total estimated passive limit execution'}
                </p>
              </div>

              <div className={`p-3.5 rounded-[2px] border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  {isId ? 'Arah Breakout Imminent' : 'Imminent Breakout'}
                </span>
                <div className={`text-xl font-black font-mono ${
                  absorptionPhase.breakoutImminentDirection === 'UP'
                    ? 'text-emerald-400'
                    : absorptionPhase.breakoutImminentDirection === 'DOWN'
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}>
                  {absorptionPhase.breakoutImminentDirection === 'UP' ? 'EXPANSION UP ↗' : absorptionPhase.breakoutImminentDirection === 'DOWN' ? 'EXPANSION DOWN ↘' : 'PENDING'}
                </div>
                <p className={`text-xs mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isId ? 'Ekspektasi arah ekspansi pasca absorpsi' : 'Expected post-absorption breakout velocity'}
                </p>
              </div>
            </div>

            {/* Characteristics list */}
            {absorptionPhase.characteristics.length > 0 && (
              <div className={`p-3 rounded-[2px] border text-xs font-mono ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-slate-400 uppercase font-bold block mb-1">Karakteristik Sinyal:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {absorptionPhase.characteristics.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PATTERN 3: THE FLUSH / LIQUIDITY SWEEP                   */}
        {/* ======================================================== */}
        {activePattern === 'sweep' && (
          <div className="space-y-5">
            {/* Live Detection Summary Banner */}
            <div className={`p-4 rounded-[2px] border flex flex-wrap items-center justify-between gap-3 ${
              liquiditySweep.isDetected
                ? isDark ? 'bg-pink-950/30 border-pink-500/40 text-pink-200' : 'bg-pink-50 border-pink-200 text-pink-800'
                : isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-[2px] ${liquiditySweep.isDetected ? 'bg-pink-500/20 text-pink-400' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase font-mono">
                      {liquiditySweep.isDetected ? `Pola Aktif: ${liquiditySweep.sweepType.replace(/_/g, ' ')}` : 'Status: Belum Ada Sweep Signifikan'}
                    </span>
                    {liquiditySweep.isDetected && (
                      <span className="text-[11px] px-2 py-0.5 rounded-[2px] bg-pink-500/20 text-pink-400 font-bold font-mono border border-pink-500/30">
                        Konfidensi {liquiditySweep.confidence}%
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {liquiditySweep.mmObjective}
                  </p>
                </div>
              </div>

              {liquiditySweep.isDetected && (
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[11px] uppercase">Level Reclaim Validasi</span>
                  <span className="text-base font-black text-pink-400">${formatPrice(liquiditySweep.reclaimLevel)}</span>
                </div>
              )}
            </div>

            {/* Characteristics list */}
            {liquiditySweep.characteristics.length > 0 && (
              <div className={`p-3 rounded-[2px] border text-xs font-mono ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-slate-400 uppercase font-bold block mb-1">Karakteristik Sinyal:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {liquiditySweep.characteristics.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
