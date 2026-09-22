import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface GlossaryItem {
  term: string;
  category: 'SMC & Orderflow' | 'Derivatif' | 'Strategi & Level' | 'Sesi Pasar';
  shortDef: string;
  fullDef: string;
  formulaOrRule?: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'CVD (Cumulative Volume Delta)',
    category: 'SMC & Orderflow',
    shortDef: 'Akumulasi selisih volume beli pasar (taker buy) dan volume jual pasar (taker sell).',
    fullDef: 'CVD membantu melihat divergensi antara pergerakan harga dan tekanan beli/jual agresif. Jika harga naik tetapi CVD turun, ini menandakan potensi pelemahan tren (Bearish Absorption).',
    formulaOrRule: 'Delta = Taker Buy Vol - Taker Sell Vol; CVD = Σ(Delta)',
  },
  {
    term: 'MSS (Market Structure Shift)',
    category: 'SMC & Orderflow',
    shortDef: 'Perubahan struktur harga saat Higher Low atau Lower High tertembus.',
    fullDef: 'Konfirmasi awal pembalikan arah tren dalam konsep Smart Money Concept (SMC). Penembusan level swing penting disertai volume tinggi menandakan partisipasi institusi.',
    formulaOrRule: 'Bullish MSS: Penembusan swing high terakhir. Bearish MSS: Penembusan swing low terakhir.',
  },
  {
    term: 'FVG (Fair Value Gap / Imbalance)',
    category: 'SMC & Orderflow',
    shortDef: 'Ketidakseimbangan harga akibat dorongan satu arah yang sangat cepat (3 bar candle).',
    fullDef: 'Area di mana pasar bergerak terlalu cepat sehingga menyisakan likuiditas kosong. Harga cenderung kembali (retrace) untuk mengisi area FVG sebelum melanjutkan arah tren utama.',
    formulaOrRule: 'Celah antara High Candle 1 dan Low Candle 3 (pada dorongan naik).',
  },
  {
    term: 'Order Block (OB)',
    category: 'SMC & Orderflow',
    shortDef: 'Candle terakhir sebelum pergerakan impulsif institusi yang menciptakan BOS/MSS.',
    fullDef: 'Area di mana institusi besar menempatkan limit order dalam jumlah besar. Berfungsi sebagai level support/resistance dinamis berprobabilitas tinggi.',
  },
  {
    term: 'Golden Pocket (Fibonacci 0.618 - 0.65)',
    category: 'Strategi & Level',
    shortDef: 'Zona pembalikan harga optimal (Optimal Trade Entry - OTE) dalam penarikan retracement.',
    fullDef: 'Rasio emas yang paling sering menjadi titik balik swing sebelum tren utama berlanjut. Ideal digabungkan dengan level Order Block atau FVG.',
  },
  {
    term: 'Level Target r1 hingga r8',
    category: 'Strategi & Level',
    shortDef: 'Level take profit bertahap berdasarkan kelipatan unit risiko (R-Multiples).',
    fullDef: 'r1 mewakili 1x risiko (1R profit), r2 mewakili 2x risiko (2R profit), hingga r8 untuk tren jangka panjang berleverage terkontrol. Trader disarankan mengunci BEP (Break Even Point) saat r1 tercapai.',
    formulaOrRule: 'Target r(n) = Entry + (n × |Entry - StopLoss|)',
  },
  {
    term: 'Gamma Exposure (GEX)',
    category: 'Derivatif',
    shortDef: 'Tingkat sensitivitas delta opsi terhadap pergerakan harga aset acuan (Market Maker Hedging).',
    fullDef: 'Positive Gamma bertindak sebagai peredam volatilitas (harga cenderung mean-reverting), sedangkan Negative Gamma mempercepat volatilitas dan memicu breakout tajam.',
  },
  {
    term: 'Liquidation Cascade (Klaster Likuidasi)',
    category: 'Derivatif',
    shortDef: 'Peristiwa likuidasi berantai saat harga menembus level margin call leverage tinggi.',
    fullDef: 'Ketika posisi leverage 50x–100x terlikuidasi, order pasar otomatis terpicu dan mendorong harga lebih jauh, menciptakan sumbu lilin panjang (wick hunt).',
  },
  {
    term: 'London Open Killzone (07:00 - 10:00 UTC)',
    category: 'Sesi Pasar',
    shortDef: 'Sesi pembukaan bursa Eropa/London dengan likuiditas dan volatilitas tinggi.',
    fullDef: 'Sering menciptakan Judas Swing (gerakan tipuan awal) sebelum menentukan arah tren dominan harian pasar kripto dan forex.',
  },
  {
    term: 'NY AM Killzone (12:00 - 15:00 UTC)',
    category: 'Sesi Pasar',
    shortDef: 'Sesi pembukaan bursa New York dan rilis data ekonomi makro AS (CPI, NFP, FOMC).',
    fullDef: 'Sesi dengan volume perdagangan global terbesar. Sangat ideal untuk eksekusi strategi breakout terkonfirmasi dan kelanjutan tren.',
  },
];

interface TradingGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  lang?: Language;
}

export const TradingGlossaryModal: React.FC<TradingGlossaryModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = 'id',
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isId = lang === 'id';

  const categories = ['all', 'SMC & Orderflow', 'Derivatif', 'Strategi & Level', 'Sesi Pasar'];

  const filteredItems = useMemo(() => {
    return GLOSSARY_ITEMS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.shortDef.toLowerCase().includes(q) ||
        item.fullDef.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in font-mono">
      <div
        className={`w-full max-w-3xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isId ? 'Kamus Istilah Trading Kuantitatif & SMC' : 'Quantitative & SMC Trading Glossary'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isId ? 'Panduan cepat pemahaman metrik, orderflow, dan rumus level' : 'Quick reference for metrics, orderflow, and formulas'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-900/30">
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isId ? 'Cari istilah (misal: CVD, MSS, FVG, Killzone, r1-r8)...' : 'Search term...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 placeholder:text-slate-500 outline-hidden focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? (isId ? 'Semua Istilah' : 'All Terms') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              {isId ? 'Tidak ada istilah yang cocok dengan pencarian.' : 'No matching terms found.'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.term}
                className={`p-4 rounded-2xl border transition-colors space-y-2 ${
                  isDark ? 'bg-[#0f172a]/70 border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <span>{item.term}</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    {item.category}
                  </span>
                </div>

                <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  {item.shortDef}
                </p>

                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {item.fullDef}
                </p>

                {item.formulaOrRule && (
                  <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/20 text-[10px] text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span className="font-bold">{isId ? 'Rumus / Kaidah:' : 'Rule / Formula:'}</span>
                    <span className="text-slate-300">{item.formulaOrRule}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 text-right bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
