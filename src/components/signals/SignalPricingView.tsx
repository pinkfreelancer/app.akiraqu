import React from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Shield,
  Send,
  Award,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface SignalPricingViewProps {
  isDark: boolean;
  lang: Language;
  onOpenContact: () => void;
}

export const SignalPricingView: React.FC<SignalPricingViewProps> = ({
  isDark,
  lang,
  onOpenContact,
}) => {
  const isId = lang === 'id';

  const plans = [
    {
      name: 'CLASSIC STANDARD',
      badge: 'TERSEDIA GRATIS',
      price: '$0',
      period: 'selamanya',
      desc: 'Akses ke model sinyal Classic dengan time frame 1D & 1W serta 3 level take-profit.',
      features: [
        'Model Sinyal Classic (1D, 1W)',
        'Level Target r1 – r3',
        'Notifikasi Web & Browser',
        'Win Rate Audit Dasar',
      ],
      isPopular: false,
      cta: 'Mulai Sekarang',
    },
    {
      name: 'PRO QUANT VIP',
      badge: 'PALING POPULER',
      price: '$49',
      period: '/ bulan',
      desc: 'Akses penuh ke seluruh model Alpha, Gamma, Classic & Inv dengan 8 level Take-Profit & Trailing Stop.',
      features: [
        'Semua Model (ALPHA, GAMMA, CLASSIC, INV)',
        'Seluruh Kerangka Waktu (1H, 4H, 8H, 12H, 1D, 1W)',
        '8 Level Take-Profit (r1 – r8) & Stop s1 – s4',
        'Sinyal Kekuatan STRONG Terkonfirmasi AI',
        'Webhook Telegram VIP Instan (<50ms)',
        'Trailing Stop Real-Time Automation',
      ],
      isPopular: true,
      cta: 'Dapatkan Akses VIP',
    },
    {
      name: 'INSTITUTIONAL DESK',
      badge: 'DANA KELOLAAN / API',
      price: '$199',
      period: '/ bulan',
      desc: 'Solusi sinyal otomatis via REST/WebSocket API dan eksekusi bot trading tanpa batas.',
      features: [
        'Semua fitur Pro Quant VIP',
        'Akses WebSocket & REST API Private',
        'Auto-Execution Adapter untuk Binance/Bybit',
        'Kustomisasi Formula Algoritmik',
        'Dedicated Quant Specialist Support 24/7',
      ],
      isPopular: false,
      cta: 'Hubungi Desk Institusi',
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
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                PAKET BERLANGGANAN SINYAL
              </span>
            </div>
            <h1 className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Harga & Akses Sinyal Kuantitatif
            </h1>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Pilih tingkat akses yang sesuai dengan strategi dan kebutuhan portofolio trading Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border flex flex-col justify-between space-y-5 relative ${
              plan.isPopular
                ? 'bg-gradient-to-b from-pink-950/30 to-[#0f172a] border-pink-500/50 shadow-lg shadow-pink-500/5'
                : isDark
                ? 'bg-[#0f172a] border-[#1e293b]'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-pink-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-xs">
                {plan.badge}
              </span>
            )}

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-pink-300 uppercase tracking-wider block">
                  {plan.name}
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plan.desc}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                <span className="text-[11px] font-bold text-slate-300 block mb-1">Fitur Termasuk:</span>
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenContact}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                plan.isPopular
                  ? 'bg-pink-600 hover:bg-pink-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <span>{plan.cta}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
