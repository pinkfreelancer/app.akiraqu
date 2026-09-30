import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AkiraQuLogo } from '../components/AkiraQuLogo';
import { 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  Cpu, 
  Activity, 
  Zap, 
  Compass, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  Terminal as TerminalIcon, 
  Sun, 
  Moon, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Lock, 
  Database, 
  Globe, 
  Flame, 
  Eye, 
  ChevronRight,
  ExternalLink,
  Bot,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { THEME_OPTIONS, EngineThemeId } from '../types/theme.types';
import { StageId } from '../types/crypto.types';

interface LandingPageProps {
  lang: Language;
  theme: 'light' | 'dark';
  onSetLang: (lang: Language) => void;
  onToggleTheme: () => void;
  onNavigateToTerminal: (stage?: string) => void;
  onNavigateToLogin: () => void;
  onOpenDocs?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  theme,
  onSetLang,
  onToggleTheme,
  onNavigateToTerminal,
  onNavigateToLogin,
  onOpenDocs,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Protected navigation handler: Requires Google authentication before entering terminal
  const handleProtectedAction = (stage?: StageId) => {
    if (isAuthenticated && user) {
      onNavigateToTerminal(stage);
    } else {
      onNavigateToLogin();
    }
  };

  // Active persona tab preview in Bento Grid
  const [activePersona, setActivePersona] = useState<'basic' | 'pro' | 'whales'>('basic');
  // Selected theme preview in Theme Showcase
  const [selectedThemePreview, setSelectedThemePreview] = useState<EngineThemeId>('theme-dark');
  // Mobile navigation drawer toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const trustMetrics = [
    {
      label: isId ? 'Sinkronisasi Data Real-time' : 'Real-time Data Sync',
      value: '< 85ms',
      sub: isId ? 'WebSocket Binance & CCXT' : 'Binance WS & CCXT Pipeline',
      icon: Activity,
    },
    {
      label: isId ? 'Trader Aktif Terbantu' : 'Active Traders Guided',
      value: '14,200+',
      sub: isId ? 'Komunitas Kuantitatif Global' : 'Global Quantitative Community',
      icon: Zap,
    },
    {
      label: isId ? 'Volume Paus Terlacak' : 'Whale Volumes Tracked',
      value: '$2.8B+',
      sub: isId ? 'Deteksi Likuiditas On-Chain' : 'On-Chain Liquidity Footprints',
      icon: ShieldCheck,
    },
    {
      label: isId ? 'Konfluensi Indikator' : 'Confluence Engine',
      value: '12 Matriks',
      sub: isId ? 'SMC, Order Flow & Sentimen' : 'SMC, Order Flow & Sentiment',
      icon: Layers,
    },
  ];

  const personas = [
    {
      id: 'basic' as const,
      title: isId ? 'Persona Basic' : 'Basic Persona',
      subtitle: isId ? 'Pemula & Investor Santai' : 'Beginners & Casual Investors',
      badge: isId ? 'Ketenangan & Disiplin' : 'Calm & Disciplined',
      badgeColor: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
      description: isId
        ? 'Dirancang khusus untuk menghapus FOMO dan kepanikan pasar. Kartu indikator intuitif, skor konfluensi ringkas, dan kalkulator manajemen risiko otomatis tanpa kerumitan visual.'
        : 'Engineered to eliminate FOMO and market anxiety. Clean cards, simplified confluence scores, and automated risk management guidance for calm, confident execution.',
      features: isId
        ? ['Skor Bias Konfluensi Bullish / Bearish instan', 'Kalkulator Ukuran Posisi & Stop-Loss otomatis', 'Panduan AI ramah tanpa jargon teknis berlebihan']
        : ['Instant Confluence Bias Score (Bullish / Bearish)', 'Automated Position Size & Stop Loss calculator', 'Friendly AI narrative without confusing jargon'],
      icon: Activity,
      accentGlow: 'rgba(244, 114, 182, 0.25)',
      previewHighlight: isId ? 'Sinyal Terverifikasi • Rasio RR 1:2.8' : 'Verified Signal • 1:2.8 RR Ratio',
    },
    {
      id: 'pro' as const,
      title: isId ? 'Persona Pro' : 'Pro Persona',
      subtitle: isId ? 'Day Trader & Scalper Teknikal' : 'Technical Day Traders & Scalpers',
      badge: isId ? 'Kecepatan & Presisi' : 'Speed & High Precision',
      badgeColor: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
      description: isId
        ? 'Workspace multi-panel bento grid mutakhir dengan grafik interaktif TradingView, depth order book live, 12 indikator kuantitatif lengkap (RSI, MACD, Bollinger, ATR), serta modul backtest Monte Carlo.'
        : 'Advanced multi-panel modular workspace featuring interactive charts, real-time depth order books, complete 12 quantitative indicators, and statistical Monte Carlo backtesting.',
      features: isId
        ? ['Grafik Multi-Timeframe (1m s/d 1W) & WebSocket live feed', 'Analisis CVD (Cumulative Volume Delta) & Delta Imbalance', 'Lab Backtest Strategi Kuantitatif historis 500+ candle']
        : ['Multi-Timeframe charts (1m to 1W) & live WebSocket', 'CVD (Cumulative Volume Delta) & Delta Imbalance tracking', 'Quantitative Backtest Lab across 500+ historical candles'],
      icon: Zap,
      accentGlow: 'rgba(168, 85, 247, 0.25)',
      previewHighlight: isId ? 'Delta Positif +420 BTC • Konfirmasi RSI 64.2' : 'Positive Delta +420 BTC • RSI 64.2 Confirmed',
    },
    {
      id: 'whales' as const,
      title: isId ? 'Persona Whales' : 'Whales Persona',
      subtitle: isId ? 'Institusional & Pengelola Dana' : 'Institutions & High-Net-Worth',
      badge: isId ? 'Intelijen Makro On-Chain' : 'Macro On-Chain Intelligence',
      badgeColor: 'from-blue-500/20 to-pink-500/20 text-blue-300 border-blue-500/30',
      description: isId
        ? 'Dashboard intelijen eksekutif untuk melacak pergerakan dompet besar (Whale Tracker), peta panas likuidasi multi-exchange, serta paparan risiko institusional dengan keamanan GDPR True Erasure.'
        : 'Executive intelligence dashboard tracking institutional wallet movements, multi-exchange liquidation heatmaps, and macro market-maker exposures with enterprise-grade privacy.',
      features: isId
        ? ['Peta Panas Likuidasi (Liquidation Heatmap) beresolusi tinggi', 'Deteksi Spoofing & Taktik Market Maker (MM Playbook)', 'Kepatuhan Privasi GDPR Article 17 True Erasure 1-klik']
        : ['High-resolution Liquidation Heatmap cluster tracking', 'Spoofing detection & Market Maker Playbook breakdown', '1-Click GDPR Article 17 True Data Erasure compliance'],
      icon: ShieldCheck,
      accentGlow: 'rgba(59, 130, 246, 0.25)',
      previewHighlight: isId ? 'Kluster Likuidasi $14.2M di Level $66,800' : '$14.2M Liquidation Cluster at $66,800',
    },
  ];

  return (
    <div className={`min-h-screen font-sans selection:bg-pink-500 selection:text-white transition-colors duration-200 ${
      isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors ${
        isDark ? 'bg-[#0B0F19]/85 border-slate-800/80 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo dengan sentuhan Cyborg Soft Pink Glow */}
          <div 
            role="button"
            tabIndex={0}
            aria-label="AKIRAQU"
            onClick={() => handleProtectedAction()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (e.key === ' ') e.preventDefault();
                handleProtectedAction();
              }
            }}
            className="flex items-center space-x-2 sm:space-x-3 min-w-0 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[2px] bg-pink-500/10 border border-pink-500/40 flex items-center justify-center transition-all">
                <AkiraQuLogo size={26} theme={isDark ? 'dark' : 'light'} variant="symbol" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full pointer-events-none" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-base min-[400px]:text-lg sm:text-xl font-black tracking-normal min-[400px]:tracking-wider font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  AKIRAQU
                </span>
                <span className="hidden min-[520px]:inline-block px-1.5 py-0.5 rounded-[2px] bg-pink-500/10 border border-pink-500/30 text-[9px] font-mono text-pink-400 font-bold">
                  CYBORG INTELLIGENCE
                </span>
              </div>
              <span className={`text-[11px] font-sans tracking-wide -mt-0.5 hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Analytic Quantitative Crypto Tools
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-mono font-semibold">
            <a href="#features" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-pink-400' : 'text-slate-600 hover:text-pink-600'}`}>
              {isId ? 'Fitur' : 'Features'}
            </a>
            <a href="#personas" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-pink-400' : 'text-slate-600 hover:text-pink-600'}`}>
              {isId ? 'Persona' : 'Personas'}
            </a>
            <a href="#ai-core" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-pink-400' : 'text-slate-600 hover:text-pink-600'}`}>
              Akira AI
            </a>
            <a href="#themes" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-pink-400' : 'text-slate-600 hover:text-pink-600'}`}>
              {isId ? '5 Tema' : '5 Themes'}
            </a>
            <button
              onClick={onOpenDocs}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-[2px] border ${
                isDark
                  ? 'border-pink-500/30 text-pink-300 hover:bg-pink-950/40 hover:text-pink-200'
                  : 'border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800'
              }`}
              title={isId ? 'Buka Dokumentasi & Panduan API (Mintlify)' : 'Open Documentation & API Guide (Mintlify)'}
            >
              <BookOpen className="w-3.5 h-3.5 text-pink-400" />
              <span>Doc</span>
            </button>
          </nav>

          {/* Top Actions: Theme, Lang, Mobile Menu & Launch App CTA */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Language Toggle */}
            <button
              onClick={() => onSetLang(isId ? 'en' : 'id')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-[2px] border text-xs font-mono font-bold transition-colors cursor-pointer ${
                isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-pink-400' : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600'
              }`}
              title={isId ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              {lang.toUpperCase()}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className={`hidden min-[400px]:inline-flex items-center justify-center p-1.5 sm:p-2 rounded-[2px] border transition-colors cursor-pointer ${
                isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-pink-400' : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600'
              }`}
              title={isDark ? 'Mode Terang' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-pink-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Google / Gmail Sign-In CTA */}
            {isAuthenticated && user ? (
              <button
                onClick={onNavigateToLogin}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900/80 border-emerald-500/40 text-emerald-400' : 'bg-white border-emerald-300 text-emerald-700'
                }`}
                title={user.email || 'Akun Gmail'}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-4 h-4 rounded-full" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">G</span>
                )}
                <span className="hidden sm:inline truncate max-w-[85px]">{user.displayName || 'Gmail'}</span>
              </button>
            ) : (
              <button
                onClick={onNavigateToLogin}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
                }`}
                title={isId ? 'Masuk dengan Akun Google (Gmail)' : 'Sign in with Google (Gmail)'}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">Gmail</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Launch App CTA */}
            <button
              onClick={() => handleProtectedAction()}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-[2px] bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-mono font-bold text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 cursor-pointer active:scale-95"
            >
              <span className="hidden xs:inline sm:inline">{isId ? 'Buka Terminal' : 'Launch Terminal'}</span>
              <span className="xs:hidden sm:hidden font-mono text-xs font-bold">App</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-[2px] border transition-colors cursor-pointer ${
                isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-pink-400' : 'bg-white border-slate-200 text-slate-700 hover:text-pink-600'
              }`}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-pink-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-b px-4 py-4 space-y-3 transition-colors ${
            isDark ? 'bg-[#0B0F19]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
          } backdrop-blur-md`}>
            <div className="flex flex-col space-y-2 text-sm font-mono font-semibold">
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-[2px] transition-colors ${isDark ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                {isId ? 'Fitur & Analisis' : 'Features & Analysis'}
              </a>
              <a
                href="#personas"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-[2px] transition-colors ${isDark ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                {isId ? 'Persona Trading' : 'Trading Personas'}
              </a>
              <a
                href="#ai-core"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-[2px] transition-colors ${isDark ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                Akira AI Cybernetic
              </a>
              <a
                href="#themes"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-[2px] transition-colors ${isDark ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                {isId ? '5 Tema Engine' : '5 Engine Themes'}
              </a>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenDocs) onOpenDocs();
                }}
                className={`flex items-center gap-2 py-2 px-3 rounded-[2px] text-left transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800/60 text-pink-300' : 'hover:bg-slate-100 text-pink-700'
                }`}
              >
                <BookOpen className="w-4 h-4 text-pink-400" />
                <span>{isId ? 'Dokumentasi (Doc)' : 'Documentation (Doc)'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Cybernetic Intelligence Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-[2px] bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-mono font-semibold mb-6">
            <Zap className="w-3.5 h-3.5 text-pink-400" />
            <span>Precision Crypto Analytics, Guided by Cybernetic Intelligence.</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.12] font-display [text-wrap:balance]">
            {isId ? (
              <>
                Menghubungkan Intuisi & Teknologi untuk{' '}
                <span className="text-pink-400">
                  Kesuksesan Finansial
                </span>
              </>
            ) : (
              <>
                Bridging Intuition & Technology for{' '}
                <span className="text-pink-400">
                  Crypto Success
                </span>
              </>
            )}
          </h1>

          {/* Subtext: Cyborg Woman Hand Philosophy */}
          <p className={`mt-6 text-base sm:text-lg md:text-xl max-w-3xl mx-auto font-normal leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {isId
              ? 'Terinspirasi oleh filosofi wanita setengah robot (Cyborg Woman) yang mengulurkan tangan hangat nan presisi untuk menuntun trader menembus badai pasar kripto menuju kesuksesan finansial tanpa beban kognitif berlebih.'
              : 'Inspired by the philosophy of a cybernetic guide reaching out with human warmth and robotic precision to lead traders through volatile crypto markets toward financial triumph without cognitive overload.'}
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            <button 
              onClick={() => handleProtectedAction()} 
              className="w-full sm:w-auto px-8 py-4 rounded-[2px] bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-mono font-bold text-sm transition-all flex items-center justify-center space-x-3 cursor-pointer active:scale-98"
            >
              <span>{isId ? 'Jelajahi Akiraqu' : 'Explore Akiraqu'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => handleProtectedAction('ticker')} 
              className={`w-full sm:w-auto px-8 py-4 rounded-[2px] border font-mono font-bold text-sm transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-98 ${
                isDark 
                  ? 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border-slate-800 hover:border-pink-500/40 shadow-sm shadow-black/40' 
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
              }`}
            >
              <Activity className="w-4 h-4 text-pink-400" />
              <span>{isId ? 'Lihat Analitik Live' : 'View Live Analytics'}</span>
            </button>
          </div>

          {/* Hero Graphic: Visual Abstract / Soft Pink Cyborg Hand Interface */}
          <div className="mt-14 relative max-w-4xl mx-auto">
            <div className={`p-4 sm:p-6 rounded-[2px] border transition-all relative overflow-hidden ${
              isDark 
                ? 'bg-[#0D1322] border-pink-500/30 shadow-xl' 
                : 'bg-white border-pink-200 shadow-md shadow-slate-200/50'
            }`}>
              {/* Soft Pink decorative top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500" />

              {/* Mock Terminal Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/40 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className={`ml-2 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    AKIRAQU Institutional Quantitative Workspace
                  </span>
                </div>
                <div className="flex items-center gap-2 text-pink-400 font-bold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>SYNAPSE ACTIVE</span>
                </div>
              </div>

              {/* Graphic Body: Interactive Data Teaser */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
                <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>ASSET BIAS</span>
                    <span className="text-emerald-400 font-bold">BULLISH 84%</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-pink-400">BTC/USDT $68,450.00</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Confluence Matrix Verified</span>
                  </div>
                </div>

                <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>CYBORG GUIDANCE</span>
                    <span className="text-pink-400 font-bold">OPTIMAL EDGE</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {isId ? 'Akumulasi Whales di Support $67,200' : 'Whale Accumulation at $67,200 Support'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    {isId ? 'Rekomendasi Risk/Reward 1:3.2' : 'Recommended Risk/Reward 1:3.2'}
                  </div>
                </div>

                <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>EXECUTION ENGINE</span>
                    <span className="text-cyan-400 font-bold">READY</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    {isId ? '12 Indikator • 0 Latensi Eksternal' : '12 Indicators • 0 External Lag'}
                  </div>
                  <button 
                    onClick={() => onNavigateToTerminal('ticker')}
                    className="mt-2 w-full py-1.5 rounded-[2px] bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-[11px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isId ? 'Akses Layar Utama' : 'Open Main Screen'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST METRICS BAR */}
      <section className={`py-8 border-y transition-colors ${
        isDark ? 'bg-[#080C16] border-slate-800/80' : 'bg-slate-100/90 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {trustMetrics.map((metric, idx) => {
              const IconComp = metric.icon;
              return (
                <div key={idx} className="flex items-center space-x-3.5 group min-w-0">
                  <div className="w-10 h-10 rounded-[2px] bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-pink-400">
                      {metric.value}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {metric.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 truncate">
                      {metric.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. BENTO GRID FEATURES: PERSONA-BASED (Basic, Pro, Whales) */}
      <section id="personas" className={`py-24 border-b transition-colors ${
        isDark ? 'bg-[#070A12] border-slate-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>{isId ? 'Sistem 3 Persona Kuantitatif' : '3 Persona Architecture'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display">
              {isId ? 'Dirancang Khusus untuk Setiap Trader' : 'Engineered for Every Trader Persona'}
            </h2>
            <p className={`mt-4 text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isId
                ? 'Arsitektur antarmuka fleksibel yang bertransisi dinamis dari bimbingan emosional yang ramah hingga kedalaman data kuantitatif institusional.'
                : 'A tailored UI/UX layout switching seamlessly from casual emotional guidance to institutional execution depth.'}
            </p>

            {/* Interactive Persona Tab Selectors */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePersona(p.id)}
                  className={`px-4 py-2 rounded-[2px] text-xs font-mono font-bold border transition-all cursor-pointer ${
                    activePersona === p.id
                      ? 'bg-pink-500 text-white border-pink-400 shadow-xs'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {personas.map((persona) => {
              const Icon = persona.icon;
              const isSelected = activePersona === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => setActivePersona(persona.id)}
                  className={`p-6 sm:p-8 rounded-[2px] border transition-all duration-200 relative flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-slate-900/90 border-pink-500'
                        : 'bg-white border-pink-500 shadow-md shadow-pink-500/10'
                      : isDark
                      ? 'bg-slate-900/50 border-slate-800/80 hover:border-pink-500/30'
                      : 'bg-slate-50 border-slate-200 hover:border-pink-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div 
                        className="w-12 h-12 rounded-[2px] border flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${persona.accentGlow}`, borderColor: 'rgba(244,114,182,0.3)' }}
                      >
                        <Icon className="w-6 h-6 text-pink-400" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-[2px] border bg-gradient-to-r ${persona.badgeColor}`}>
                        {persona.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-display tracking-tight text-white mb-1">
                      {persona.title}
                    </h3>
                    <div className="text-xs font-mono text-pink-400 mb-4">
                      {persona.subtitle}
                    </div>

                    <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {persona.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {persona.features.map((f, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom: Live Metric Highlight */}
                  <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="text-[11px] font-mono text-pink-300 flex items-center justify-between">
                      <span className="truncate">{persona.previewHighlight}</span>
                      <ChevronRight className="w-4 h-4 shrink-0 text-pink-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. AI ASSISTANT SHOWCASE: "Akira" AI Preview */}
      <section id="ai-core" className={`py-24 border-b transition-colors relative overflow-hidden ${
        isDark ? 'bg-[#0A0E1A] border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Philosophical & Narrative Explanation */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold">
                <Bot className="w-4 h-4" />
                <span>AKIRA AI // INTELLIGENT COMPANION</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display">
                {isId ? (
                  <>
                    Menerjemahkan Kerumitan Pasar Menjadi{' '}
                    <span className="text-pink-400">
                      Wawasan Pasti
                    </span>
                  </>
                ) : (
                  <>
                    Translating Market Chaos Into{' '}
                    <span className="text-pink-400">
                      Actionable Clarity
                    </span>
                  </>
                )}
              </h2>

              <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {isId
                  ? 'Pasar kripto penuh dengan sinyal palsu, sentimen media yang menyesatkan, dan pergerakan agresif para pembuat pasar. Akira AI bekerja sebagai asisten kuantitatif 24/7 yang menyaring ribuan data tick, order book, dan berita dalam hitungan milidetik.'
                  : 'Crypto markets are flooded with false breakouts, deceptive social sentiment, and aggressive market-maker traps. Akira AI operates as your 24/7 quantitative companion, distilling thousands of ticks, order books, and news events into high-confidence execution plans.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-[2px] bg-pink-500/15 text-pink-400 flex items-center justify-center mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-mono font-bold text-white mb-1">
                    {isId ? 'Narasi Bebas Halusinasi' : 'Grounded AI Output'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isId ? 'Setiap rekomendasi berbasis fakta data on-chain dan indikator numerik terverifikasi.' : 'Every recommendation is strictly anchored to mathematical indicators and on-chain facts.'}
                  </p>
                </div>

                <div className={`p-4 rounded-[2px] border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-[2px] bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-mono font-bold text-white mb-1">
                    {isId ? 'Kerahasiaan Portofolio' : 'Zero-Data Leakage'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isId ? 'Strategi dan saldo pribadi Anda tidak pernah dibagikan atau dijadikan bahan latih model.' : 'Your strategies and balance stay strictly client-side with 1-click GDPR memory wipes.'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateToTerminal('output')}
                  className="px-6 py-3 rounded-[2px] bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/40 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{isId ? 'Coba AI Analysis di Terminal' : 'Try AI Analysis in Terminal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: AI Terminal Chat Preview */}
            <div className="lg:col-span-6">
              <div className={`rounded-[2px] border p-5 sm:p-6 relative overflow-hidden ${
                isDark 
                  ? 'bg-[#0E1424] border-pink-500/30 shadow-xl shadow-black/40' 
                  : 'bg-white border-pink-200 shadow-md shadow-slate-200/50'
              }`}>
                {/* AI Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[2px] bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-display text-white">AKIRA QUANT AGENT</div>
                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Online • Multimodal Model Connected</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-pink-500/15 text-pink-300 border border-pink-500/30 font-bold">
                    BTC ANALYSIS
                  </span>
                </div>

                {/* Simulated Conversation */}
                <div className="space-y-3.5 text-xs font-mono">
                  {/* User query */}
                  <div className={`p-3 rounded-[2px] border text-left ${
                    isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}>
                    <span className="text-pink-400 font-bold mr-1">Trader:</span>
                    {isId ? '"Bagaimana struktur likuiditas BTC/USDT saat ini untuk swing 4 jam?"' : '"What is the current BTC/USDT liquidity structure for a 4-hour swing?"'}
                  </div>

                  {/* AI response */}
                  <div className={`p-4 rounded-[2px] border text-left space-y-2 ${
                    isDark ? 'bg-pink-950/20 border-pink-500/30 text-slate-200' : 'bg-pink-50/70 border-pink-200 text-slate-900'
                  }`}>
                    <div className="flex items-center gap-1.5 text-pink-400 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AKIRA CYBORG SYNAPSE // INSIGHT</span>
                    </div>
                    <p className="leading-relaxed">
                      {isId
                        ? 'Terdeteksi akumulasi CVD positif (+318 BTC) di range $67,800 - $68,200. Indikator Confluence memberi skor 8.2/10 (Strong Bullish). Likuidasi short berada di $69,450.'
                        : 'Detected strong positive CVD accumulation (+318 BTC) in the $67,800 - $68,200 range. Confluence matrix scores 8.2/10 (Strong Bullish). Immediate short liquidation pool rests at $69,450.'}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-[2px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Stop-Loss: $67,400
                      </span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        Target 1: $69,400
                      </span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        R:R 1:3.4
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. THEME SELECTOR PREVIEW (5-Engine Themes: Glassnode, Light, Dark, Terminal, Custom) */}
      <section id="themes" className={`py-24 border-b transition-colors ${
        isDark ? 'bg-[#080C16] border-slate-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold mb-3">
              <Sliders className="w-3.5 h-3.5" />
              <span>{isId ? 'Arsitektur 5 Mesin Tema' : '5-Engine Visual Themes'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display">
              {isId ? 'Dirancang untuk Kenyamanan Mata Ekstrem' : 'Engineered for Optical Comfort'}
            </h2>
            <p className={`mt-4 text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isId
                ? 'Pilih estetika visual Anda dari Glassnode Research Console (#EDEFF2 + Soft Pink #F472B6), Light Theme (#F8FAFC), Dark Theme (#0B0F19), Terminal Theme (#030712), hingga kustomisasi Color Picker kustom.'
                : 'Choose your visual rhythm across Glassnode Research Console (Cloud Slate + Soft Pink), Light Theme, Dark Theme, Terminal Theme, or bespoke Custom Theme with color picker.'}
            </p>
          </div>

          {/* Theme Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {THEME_OPTIONS.map((th) => {
              const isSelected = selectedThemePreview === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => setSelectedThemePreview(th.id)}
                  className={`p-4 rounded-[2px] border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/5'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800 hover:border-pink-500/30'
                      : 'bg-slate-50 border-slate-200 hover:border-pink-300'
                  }`}
                  style={{
                    backgroundColor: isDark ? undefined : th.surfaceColor,
                  }}
                >
                  <div>
                    {/* Color Swatch Circle Preview */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                          style={{ backgroundColor: th.accentColor }} 
                        />
                        <span 
                          className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                          style={{ backgroundColor: th.bgColor }} 
                        />
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/30">
                        {th.badgeLabel}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold font-display mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isId ? th.nameId : th.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      {isId ? th.conceptId : th.concept}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[10px] font-mono text-pink-400 font-bold">
                    <span>{isSelected ? (isId ? 'Tema Aktif' : 'Active') : (isId ? 'Pilih' : 'Select')}</span>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12">
            <button
              onClick={() => handleProtectedAction()}
              className="px-8 py-4 rounded-[2px] bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-mono font-bold text-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>{isId ? 'Terapkan Tema & Buka Terminal' : 'Apply Theme & Open Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className={`py-12 border-t font-mono text-xs transition-colors ${
        isDark ? 'bg-[#05080F] border-slate-800/80 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            {/* Brand with Cyborg Soft Pink Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <AkiraQuLogo size={20} theme={isDark ? 'dark' : 'light'} variant="symbol" />
              </div>
              <div className="flex flex-col">
                <span className={`font-bold tracking-wider text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  AKIRAQU
                </span>
                <span className="text-[11px] text-slate-500">
                  Analytic Quantitative Crypto Tools
                </span>
              </div>
            </div>

            {/* Middle Nav Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
              <a href="#features" className="hover:text-pink-400 transition-colors">Features</a>
              <a href="#personas" className="hover:text-pink-400 transition-colors">Personas</a>
              <a href="#ai-core" className="hover:text-pink-400 transition-colors">Akira AI</a>
              <a href="#themes" className="hover:text-pink-400 transition-colors">Themes</a>
              <button onClick={() => handleProtectedAction()} className="hover:text-pink-400 transition-colors cursor-pointer">Terminal</button>
              <button onClick={onOpenDocs} className="hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-1 text-pink-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Doc</span>
              </button>
              <button onClick={onNavigateToLogin} className="hover:text-pink-400 transition-colors cursor-pointer">Login</button>
            </div>

            {/* Copyright & Cyborg Tagline */}
            <div className="text-[11px] text-slate-500">
              <p>© {new Date().getFullYear()} Akiraqu Analytics. All rights reserved.</p>
              <p className="text-pink-400/80 mt-0.5">Guided by Cybernetic Intelligence.</p>
            </div>
          </div>

          {/* Regulatory & Financial Disclaimer Notice */}
          <div className={`mt-8 pt-6 border-t text-[11px] font-mono leading-relaxed flex items-start gap-2.5 ${
            isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-400 font-semibold mr-1.5">Disclaimer: Penafian</strong>
              Segala informasi yang terdapat di halaman ini tidak boleh dianggap sebagai nasihat keuangan. Anda harus melakukan riset sendiri sebelum mengambil keputusan apa pun.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
