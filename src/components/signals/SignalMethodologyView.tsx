import React, { useState } from 'react';
import {
  FileCode2,
  TrendingUp,
  TrendingDown,
  Layers,
  Clock,
  Zap,
  Target,
  Shield,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock3,
  HelpCircle,
  Sliders,
  ChevronRight,
  Info,
  Check,
  Percent,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface SignalMethodologyViewProps {
  isDark: boolean;
  lang: Language;
  onNavigateToSignals?: () => void;
}

export const SignalMethodologyView: React.FC<SignalMethodologyViewProps> = ({
  isDark,
  lang,
  onNavigateToSignals,
}) => {
  const isId = lang === 'id';

  // Interactive Level Calculator Simulator State
  const [simDirection, setSimDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [simEntry, setSimEntry] = useState<number>(90000);
  const [simAtrPct, setSimAtrPct] = useState<number>(1.5);
  const [activeTabSection, setActiveTabSection] = useState<'ALL' | 'TAXONOMY' | 'LEVELS' | 'LIFECYCLE' | 'PERFORMANCE'>('ALL');

  // Compute 8 target and 4 stop levels for the simulator
  const isLong = simDirection === 'LONG';
  const sign = isLong ? 1 : -1;
  const step = (simEntry * (simAtrPct / 100));

  const simLevels = {
    entry: simEntry,
    r1: simEntry + sign * step * 1.0,
    r2: simEntry + sign * step * 1.8,
    r3: simEntry + sign * step * 2.8,
    r4: simEntry + sign * step * 4.0,
    r5: simEntry + sign * step * 5.5,
    r6: simEntry + sign * step * 7.2,
    r7: simEntry + sign * step * 9.2,
    r8: simEntry + sign * step * 12.0,
    s1: simEntry - sign * step * 1.2,
    s2: simEntry - sign * step * 2.0,
    s3: simEntry - sign * step * 3.0,
    s4: simEntry - sign * step * 4.2,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400 shrink-0">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                DOKUMENTASI SISTEM
              </span>
              <span className="text-xs font-mono text-slate-400">AKIRAQU V3 QUANT</span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Metodologi
            </h1>
            <p className="text-sm font-mono text-pink-400 font-semibold">
              Cara kerja sinyal, siklus hidup, dan kinerja.
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
          Setiap metrik utama di AKIRAQU memiliki definisi matematis dan operasional di baliknya. Halaman ini mendokumentasikan jenis sinyal, tahapan siklus hidup, definisi menang/kalah, perhitungan P/L (laba/rugi), serta konteks risiko yang perlu Anda baca sebelum menindaklanjuti sinyal apa pun.
        </p>

        {/* Quick Jump Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 font-mono text-xs">
          <span className="text-slate-500 text-[11px] mr-1">Navigasi Dokumen:</span>
          {[
            { id: 'ALL', label: 'Tampilkan Semua' },
            { id: 'TAXONOMY', label: '1. Taksonomi Sinyal' },
            { id: 'LEVELS', label: '2. Level Harga (r1-r8 & s1-s4)' },
            { id: 'LIFECYCLE', label: '3. Siklus Hidup' },
            { id: 'PERFORMANCE', label: '4. Perhitungan Kinerja' },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveTabSection(sec.id as any)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeTabSection === sec.id
                  ? 'bg-pink-600 text-white font-bold shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SECTION 1: TAKSONOMI SINYAL */}
      {(activeTabSection === 'ALL' || activeTabSection === 'TAXONOMY') && (
        <section
          className={`p-6 rounded-2xl border space-y-5 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <Layers className="w-5 h-5 text-pink-400" />
            <h2 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Taksonomi sinyal
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            Setiap sinyal dijelaskan melalui empat dimensi kuantitatif: arah, kategori model, kerangka waktu, dan kekuatan keyakinan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dimensi 1: Arah (Tipe 1) */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                  Arah (Tipe 1)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">2 Tipe</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 font-mono space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">LONG (Posisi Beli)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Sinyal <em>bullish</em>. Analisis mengantisipasi pergerakan harga naik dari harga masuk (<em>entry</em>) menuju target resistansi (<strong>r1–r8</strong>).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 font-mono space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-300">SHORT (Posisi Jual)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Sinyal <em>bearish</em>. Analisis mengantisipasi pergerakan harga turun dari harga masuk (<em>entry</em>) menuju target <em>take-profit</em> yang lebih rendah (<strong>r1–r8</strong>).
                  </p>
                </div>
              </div>
            </div>

            {/* Dimensi 2: Kategori Model (Tipe 2) */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                  Kategori (Tipe 2)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">4 Model</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-950/20 space-y-1">
                  <span className="font-bold text-purple-300">ALPHA</span>
                  <p className="text-[10px] text-slate-300">
                    Sinyal yang diidentifikasi oleh konfigurasi model Alpha. Berdasarkan kriteria <em>setup</em> terkuat yang dideteksi oleh mesin analisis.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 space-y-1">
                  <span className="font-bold text-cyan-300">GAMMA</span>
                  <p className="text-[10px] text-slate-300">
                    Sinyal yang diidentifikasi oleh konfigurasi model Gamma. Berdasarkan konfigurasi pola sekunder yang kuat.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-blue-500/30 bg-blue-950/20 space-y-1">
                  <span className="font-bold text-blue-300">CLASSIC</span>
                  <p className="text-[10px] text-slate-300">
                    Sinyal yang diidentifikasi oleh konfigurasi model Classic. Berdasarkan metodologi pengenalan pola inti.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-1">
                  <span className="font-bold text-amber-300">INV (Inverse)</span>
                  <p className="text-[10px] text-slate-300">
                    Sinyal model Inverse. Pola <em>counter-trend</em> (melawan tren) yang bergerak berlawanan dengan arah utama.
                  </p>
                </div>
              </div>
            </div>

            {/* Dimensi 3: Kerangka Waktu */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                  Kerangka Waktu
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">6 Resolusi Candle</span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                Sinyal dianalisis menggunakan salah satu dari enam resolusi <em>candle</em>: <strong>1-JAM</strong>, <strong>4-JAM</strong>, <strong>8-JAM</strong>, <strong>12-JAM</strong>, <strong>1-HARI</strong>, atau <strong>1-MINGGU</strong>. Kerangka waktu yang lebih panjang biasanya menghasilkan sinyal yang membutuhkan waktu lebih lama untuk mencapai penyelesaian dan memiliki target level harga yang lebih besar.
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {['1-JAM', '4-JAM', '8-JAM', '12-JAM', '1-HARI', '1-MINGGU'].map((tf) => (
                  <span key={tf} className="px-2 py-1 rounded bg-slate-800 text-pink-300 border border-slate-700 font-bold">
                    {tf}
                  </span>
                ))}
              </div>
            </div>

            {/* Dimensi 4: Kekuatan */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                  Kekuatan
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Tingkat Keyakinan</span>
              </div>
              <div className="space-y-2 font-mono">
                <div className="p-2.5 rounded-lg border border-slate-700 bg-slate-900/60 space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">NORMAL</span>
                  <p className="text-[11px] text-slate-400">
                    Sinyal standar yang memenuhi ambang batas keyakinan dasar untuk kategori tersebut.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-pink-500/40 bg-pink-950/20 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-xs font-bold text-pink-300">STRONG (Kuat)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Keyakinan lebih tinggi berdasarkan faktor-faktor konfirmasi tambahan dalam model analisis (volume anomali, CVD whale flow, & MSS terkonfirmasi).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. SECTION 2: LEVEL HARGA */}
      {(activeTabSection === 'ALL' || activeTabSection === 'LEVELS') && (
        <section
          className={`p-6 rounded-2xl border space-y-5 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <Target className="w-5 h-5 text-pink-400" />
            <h2 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Level harga
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            Setiap sinyal mencakup serangkaian batasan harga terukur yang digunakan untuk memantau perkembangan dan menentukan hasil:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {/* Entry */}
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="font-bold text-blue-300 text-sm">Entry (Harga Masuk)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Harga acuan saat sinyal dibuat. Level <em>take-profit</em> dan <em>stop</em> sinyal ditentukan berdasarkan harga ini.
              </p>
            </div>

            {/* r1 - r8 */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-bold text-emerald-300 text-sm">r1 – r8 (Take-Profit)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Hingga 8 target <em>take-profit</em>. <strong>r1</strong> adalah yang terdekat dengan harga masuk; <strong>r8</strong> adalah yang terjauh. Sinyal LONG bergerak menuju nilai r yang lebih tinggi; sinyal SHORT bergerak menuju nilai r yang lebih rendah.
              </p>
            </div>

            {/* s1 - s4 */}
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="font-bold text-rose-300 text-sm">s1 – s4 (Support / Stop)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Level support yang digunakan sebagai batas stop-loss. Jika harga mencapai <strong>s1</strong> sebelum mencapai level r mana pun, sinyal ditutup dengan status rugi (<em>loss</em>).
              </p>
            </div>

            {/* Trailing Stop */}
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="font-bold text-purple-300 text-sm">Trailing stop</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Setelah tercapainya sebagian target profit (<em>partial take-profit</em> r1+), trailing stop dapat aktif untuk mengunci keuntungan dan menutup sinyal jika harga berbalik arah melewati batas trailing.
              </p>
            </div>
          </div>

          {/* Interactive Calculator / Level Visualizer Sandbox */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-[#090d16] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-mono font-bold text-white">
                  Kalkulator Simulasi Level Harga (r1–r8 & s1–s4)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setSimDirection('LONG')}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                    simDirection === 'LONG' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setSimDirection('SHORT')}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                    simDirection === 'SHORT' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Entry Price ($):</label>
                <input
                  type="number"
                  value={simEntry}
                  onChange={(e) => setSimEntry(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Langkah Volatilitas ATR (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={simAtrPct}
                  onChange={(e) => setSimAtrPct(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                  Arah: <strong className={isLong ? 'text-emerald-400' : 'text-rose-400'}>{simDirection}</strong> • Stop: <strong className="text-rose-400">s1 (${simLevels.s1.toLocaleString()})</strong>
                </div>
              </div>
            </div>

            {/* Level Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-2 border-t border-slate-800 font-mono text-center">
              {(['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'] as const).map((key, idx) => (
                <div key={key} className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-bold block">{key.toUpperCase()}</span>
                  <span className="text-xs font-bold text-white">${simLevels[key].toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className="text-[9px] text-emerald-300 block">+{((idx + 1) * 1.5).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
              {(['s1', 's2', 's3', 's4'] as const).map((key, idx) => (
                <div key={key} className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30">
                  <span className="text-[10px] text-rose-400 font-bold block">{key.toUpperCase()} (Stop)</span>
                  <span className="text-xs font-bold text-white">${simLevels[key].toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className="text-[9px] text-rose-300 block">-{((idx + 1) * 1.2).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. SECTION 3: SIKLUS HIDUP SINYAL */}
      {(activeTabSection === 'ALL' || activeTabSection === 'LIFECYCLE') && (
        <section
          className={`p-6 rounded-2xl border space-y-5 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <RotateCcw className="w-5 h-5 text-pink-400" />
            <h2 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Siklus hidup sinyal
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            Sinyal mengalami perubahan status seiring dengan pergerakan harga. Tabel di bawah ini menjelaskan setiap status secara komprehensif.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#090d16] border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Kode</th>
                  <th className="py-3 px-4 w-48">Status Siklus Hidup</th>
                  <th className="py-3 px-4">Deskripsi & Perilaku Sistem</th>
                  <th className="py-3 px-4 w-40 text-center">Dampak Kinerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-[#090d16]/50">
                {/* 1. PENDING */}
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold inline-flex items-center justify-center border border-blue-500/30">
                      1
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-blue-300">
                    PENDING
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    Sinyal telah dibuat dan aktif. Harga belum bergerak secara signifikan menuju target mana pun.
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      Sedang Berjalan (Floating)
                    </span>
                  </td>
                </tr>

                {/* 2. R1 - R8 */}
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold inline-flex items-center justify-center border border-cyan-500/30">
                      2
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-cyan-300">
                    R1 – R8 (Sedang Berjalan)
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    Harga telah mencapai level <em>take-profit</em> yang sesuai (<strong>r1</strong> hingga <strong>r8</strong>). Sinyal tetap aktif dan bergerak menuju target yang lebih tinggi.
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px]">
                      In-Progress Profit
                    </span>
                  </td>
                </tr>

                {/* 3. TRAILING */}
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold inline-flex items-center justify-center border border-purple-500/30">
                      3
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-purple-300">
                    TRAILING
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    Setidaknya satu level <em>take-profit</em> telah tercapai dan trailing stop kini aktif. Sinyal ditutup ketika harga berbalik arah melewati batas trailing.
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30 text-[10px]">
                      Profit Terkunci
                    </span>
                  </td>
                </tr>

                {/* ✓. TAKEPROFIT */}
                <tr className="hover:bg-slate-800/40 transition bg-emerald-950/15">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center justify-center border border-emerald-500/30">
                      ✓
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-300">
                    TAKEPROFIT
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    Sinyal ditutup pada batas <em>take-profit</em>. Dihitung sebagai kemenangan (<strong>win</strong>) dalam perhitungan kinerja.
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[10px]">
                      WIN (Menang)
                    </span>
                  </td>
                </tr>

                {/* ✗. STOPLOSS */}
                <tr className="hover:bg-slate-800/40 transition bg-rose-950/15">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold inline-flex items-center justify-center border border-rose-500/30">
                      ✗
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-300">
                    STOPLOSS
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    Harga mencapai level stop support (<strong>s1</strong>) sebelum mencapai level <em>take-profit</em> mana pun. Dihitung sebagai kerugian (<strong>loss</strong>).
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 text-[10px]">
                      LOSS (Rugi)
                    </span>
                  </td>
                </tr>

                {/* —. EXPIRED */}
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold inline-flex items-center justify-center border border-slate-700">
                      —
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-400">
                    EXPIRED (Kedaluwarsa)
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    Sinyal melampaui durasi yang diizinkan tanpa mencapai level stop atau <em>take-profit</em>. Tidak disertakan dalam perhitungan tingkat kemenangan/kekalahan (<em>win/loss rate</em>).
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      Dikecualikan (Transparan)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. SECTION 4: PERHITUNGAN KINERJA */}
      {(activeTabSection === 'ALL' || activeTabSection === 'PERFORMANCE') && (
        <section
          className={`p-6 rounded-2xl border space-y-5 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <Percent className="w-5 h-5 text-pink-400" />
            <h2 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Perhitungan kinerja
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            Setiap sinyal yang dipublikasikan diaudit secara deterministik dengan formula yang terstandardisasi dan transparan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Win */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#090d16] space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Win (Menang)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sinyal yang ditutup pada batas <em>take-profit</em> (hasil <strong>TAKEPROFIT</strong>). Termasuk sinyal yang dihentikan oleh <strong>trailing stop</strong> setelah mencapai setidaknya level <strong>r1</strong>.
              </p>
            </div>

            {/* Loss */}
            <div className="p-4 rounded-xl border border-rose-500/30 bg-[#090d16] space-y-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Loss (Rugi)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sinyal yang dihentikan pada batas support sebelum mencapai level <em>take-profit</em> mana pun (hasil <strong>STOPLOSS</strong> pada level s1).
              </p>
            </div>

            {/* Tingkat Keberhasilan (Win Rate) Formula */}
            <div className="p-4 rounded-xl border border-pink-500/30 bg-[#090d16] space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">
                  Tingkat keberhasilan (win rate)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                  Rumus Baku
                </span>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-slate-800 text-pink-200 text-center font-bold text-sm">
                Win Rate (%) = ( Jumlah Kemenangan ÷ (Jumlah Kemenangan + Jumlah Kekalahan) ) × 100
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dihitung berdasarkan sinyal yang telah selesai (tidak kedaluwarsa) dalam rentang waktu yang dipilih.
              </p>
            </div>

            {/* Persentase P/L (Laba/Rugi) */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] space-y-2 md:col-span-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Persentase P/L (Laba/Rugi)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Persentase pergerakan harga dari harga masuk (<em>entry price</em>) hingga level stop akhir, dijumlahkan dari seluruh sinyal yang telah selesai. Ini adalah P/L tingkat sinyal dan tidak memperhitungkan ukuran posisi, leverage, atau biaya trading.
              </p>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-pink-300">
                  <Info className="w-3.5 h-3.5" />
                  <span>Transparansi Sinyal Kedaluwarsa & In-Progress:</span>
                </div>
                <p>
                  Sinyal yang kedaluwarsa <strong>tidak disertakan</strong> dalam perhitungan win rate maupun total P/L sinyal yang telah selesai. Angka P/L untuk sinyal yang sedang berjalan (<em>in-progress</em>) dan kedaluwarsa <strong>dilaporkan secara terpisah</strong> pada halaman kinerja agar metrik utama tetap akurat dan transparan.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA: Ke Feed Sinyal Real-Time */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-0.5 text-center sm:text-left font-mono">
          <span className="text-xs font-bold text-white">Siap mengeksplorasi sinyal langsung?</span>
          <p className="text-[11px] text-slate-400">
            Terapkan metodologi di atas secara real-time pada katalog sinyal aktif.
          </p>
        </div>
        {onNavigateToSignals && (
          <button
            type="button"
            onClick={onNavigateToSignals}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <span>Buka Feed Sinyal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
