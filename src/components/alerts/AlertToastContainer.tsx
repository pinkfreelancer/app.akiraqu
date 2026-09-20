import React from 'react';
import { useAlerts } from '../../contexts/AlertContext';
import { Zap, SlidersHorizontal, Newspaper, X, ArrowUpRight, BellRing } from 'lucide-react';
import { Language, getTranslation } from '../../i18n/translations';

interface AlertToastContainerProps {
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const AlertToastContainer: React.FC<AlertToastContainerProps> = ({
  lang = 'id',
  theme = 'dark',
}) => {
  const { activeToast, dismissToast, navigateToAlertTarget } = useAlerts();
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  if (!activeToast) return null;

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'SIGNAL':
        return {
          label: isId ? 'Sinyal Trading' : 'Trading Signal',
          icon: Zap,
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          accentBorder: 'border-emerald-500/60',
          dotBg: 'bg-emerald-400',
        };
      case 'SCREENER':
        return {
          label: isId ? 'Penyaring Koin' : 'Coin Screener',
          icon: SlidersHorizontal,
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          accentBorder: 'border-amber-500/60',
          dotBg: 'bg-amber-400',
        };
      case 'SENTIMENT':
      default:
        return {
          label: isId ? 'Berita Sentimen' : 'Sentiment News',
          icon: Newspaper,
          badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
          accentBorder: 'border-cyan-500/60',
          dotBg: 'bg-cyan-400',
        };
    }
  };

  const config = getCategoryConfig(activeToast.category);
  const Icon = config.icon;

  return (
    <div
      id="alert-toast-container"
      className="fixed bottom-5 right-5 z-[9999] max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div
        className={`p-4 rounded-xl shadow-2xl border ${config.accentBorder} ${
          isDark ? 'bg-[#0f172a]/95 text-slate-100 backdrop-blur-md' : 'bg-white/95 text-slate-900 backdrop-blur-md'
        } transition-all`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.badgeBg} shrink-0 mt-0.5`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${config.badgeBg}`}>
                  {config.label}
                </span>
                {activeToast.symbol && (
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {activeToast.symbol}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {activeToast.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-semibold leading-snug line-clamp-1 mb-1">
              {activeToast.title}
            </h4>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {activeToast.message}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/40">
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${config.dotBg} animate-ping`} />
                {isId ? 'Update Real-Time' : 'Live Update'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={dismissToast}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded transition-colors cursor-pointer"
                >
                  {isId ? 'Tutup' : 'Dismiss'}
                </button>
                <button
                  onClick={() => navigateToAlertTarget(activeToast)}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                    activeToast.category === 'SIGNAL'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : activeToast.category === 'SCREENER'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  <span>{isId ? 'Lihat Sekarang' : 'View Now'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800/50 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
