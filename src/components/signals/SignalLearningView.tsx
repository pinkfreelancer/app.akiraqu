import React from 'react';
import {
  BookOpen,
  ShieldAlert,
  Target,
  RotateCcw,
  Sparkles,
  Award,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface SignalLearningViewProps {
  isDark: boolean;
  lang: Language;
  onNavigateToMethodology: () => void;
}

export const SignalLearningView: React.FC<SignalLearningViewProps> = ({
  isDark,
  lang,
  onNavigateToMethodology,
}) => {
  const isId = lang === 'id';

  const lessons = [
    {
      title: '1. Memahami 4 Model Sinyal (Alpha, Gamma, Classic, Inv)',
      desc: 'Setiap model dirancang untuk kondisi pasar tertentu. Model ALPHA mengeksploitasi anomali likuiditas institusional terkuat, GAMMA menangkap momentum breakout sekunder, CLASSIC menggunakan struktur swing trend fundamental, sedangkan INV (Inverse) memanfaatkan pembalikan arah ekstrim (counter-trend).',
      badge: 'TAKSONOMI',
    },
    {
      title: '2. Cara Menjalankan Eksekusi Tangga Take-Profit (r1–r8)',
      desc: 'Jangan pernah menunggu hingga r8 secara penuh tanpa manajemen risiko. Praktik terbaik institusional adalah mengambil profit parsial 25-30% di level r1-r2 untuk mengamankan modal (Break Even), kemudian membiarkan sisa posisi berjalan dengan Trailing Stop aktif.',
      badge: 'MANAJEMEN PROFIT',
    },
    {
      title: '3. Aturan Ketat Stop Loss (s1–s4) & Anti-Bocor Risiko',
      desc: 'Tingkat s1 adalah batas invalidasi mutlak sinyal. Jika harga menyentuh s1, setup teknikal dianggap gagal (Loss). Menyeret stop-loss ke s2-s4 secara manual adalah kesalahan fatal dalam disiplin trading.',
      badge: 'RISK MANAGEMENT',
    },
    {
      title: '4. Mengapa Sinyal Expired Dikecualikan dari Win Rate?',
      desc: 'Sinyal yang melewati durasi resolusinya tanpa menyentuh stop ataupun target dianggap kedaluwarsa (Expired). Mengikutsertakan sinyal netral dalam win rate akan mendistorsi statistik kuantitatif yang sebenarnya.',
      badge: 'TRANSPARANSI AUDIT',
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      <div
        className={`p-6 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                PUSAT EDUKASI INSTITUSIONAL
              </span>
            </div>
            <h1 className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Belajar Sinyal & Disiplin Kuantitatif
            </h1>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Kuasai cara mengeksekusi sinyal AKIRAQU dengan metodologi profesional, ukuran posisi (position sizing) yang terukur, dan perlindungan modal trading.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessons.map((lesson, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold text-[10px]">
                {lesson.badge}
              </span>
            </div>
            <h3 className="font-bold text-sm text-white">{lesson.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{lesson.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-[#090d16] border border-slate-800 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Ingin membaca dokumentasi lengkap rumus & taksonomi?</h4>
          <p className="text-xs text-slate-400">
            Lihat halaman Metodologi untuk membaca definisi matematis r1–r8, s1–s4, dan siklus hidup sinyal.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToMethodology}
          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition cursor-pointer shadow-xs shrink-0"
        >
          Buka Metodologi
        </button>
      </div>
    </div>
  );
};
