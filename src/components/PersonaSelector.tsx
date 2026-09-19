import React from 'react';
import { User, Cpu, Layers, Eye, EyeOff, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { TradingPersona } from '../types/crypto.types';
import { Language } from '../i18n/translations';

interface PersonaSelectorProps {
  currentPersona: TradingPersona;
  onSelectPersona: (persona: TradingPersona) => void;
  privacyBlurActive?: boolean;
  onTogglePrivacyBlur?: () => void;
  lang?: Language;
  theme?: string;
  className?: string;
  showPrivacyToggle?: boolean;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  currentPersona,
  onSelectPersona,
  privacyBlurActive = false,
  onTogglePrivacyBlur,
  lang = 'id',
  theme = 'dark',
  className = '',
  showPrivacyToggle = true,
}) => {
  const isId = lang === 'id';
  const isDark = theme !== 'modern-pink-light' && theme !== 'theme-light' && theme !== 'light';

  const personas: { id: TradingPersona; label: string; sub: string; icon: React.ElementType }[] = [
    {
      id: 'basic',
      label: isId ? 'Basic' : 'Basic',
      sub: isId ? 'Edukasi & Ringkas' : 'Clean & Education',
      icon: User,
    },
    {
      id: 'pro',
      label: isId ? 'Pro' : 'Pro',
      sub: isId ? 'Analitik Multi-Panel' : 'Bento Grid Analytics',
      icon: Cpu,
    },
    {
      id: 'whales',
      label: isId ? 'Whales' : 'Whales',
      sub: isId ? 'On-Chain & Intel Makro' : 'Macro & Whale Flow',
      icon: Layers,
    },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Persona Pill Segment Control */}
      <div
        className={`flex items-center p-1 rounded-xl border transition-colors shadow-xs ${
          isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-slate-100 border-slate-200'
        }`}
      >
        {personas.map((p) => {
          const Icon = p.icon;
          const isActive = currentPersona === p.id;
          return (
            <button
              key={p.id}
              id={`btn-persona-${p.id}`}
              onClick={() => onSelectPersona(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-pink-500 text-white shadow-xs scale-100'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title={`${p.label} Mode: ${p.sub}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-pink-400'}`} />
              <span className="tracking-wide">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Privacy Blur Toggle Button (Particularly useful in Whales & stream presentation mode) */}
      {showPrivacyToggle && onTogglePrivacyBlur && (
        <button
          id="btn-privacy-blur-toggle"
          onClick={onTogglePrivacyBlur}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
            privacyBlurActive
              ? isDark
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-amber-100 border-amber-300 text-amber-900'
              : isDark
              ? 'bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-white hover:border-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title={
            privacyBlurActive
              ? isId
                ? 'Privasi Aktif: Nominal Saldo Disamarkan'
                : 'Privacy Active: Values Blurred'
              : isId
              ? 'Klik untuk Menyamarkan Nominal Sensitif'
              : 'Click to Hide Sensitive Balances'
          }
        >
          {privacyBlurActive ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px] text-amber-400">BLUR ON</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">BLUR OFF</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
