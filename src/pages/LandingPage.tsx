import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AkiraQuLogo } from '../components/AkiraQuLogo';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Flame, 
  Activity, 
  BookOpen, 
  Sliders, 
  Radio, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Cpu, 
  Lock, 
  Database, 
  Bot, 
  Newspaper,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface LandingPageProps {
  lang: Language;
  theme: 'light' | 'dark';
  onSetLang: (lang: Language) => void;
  onToggleTheme: () => void;
  onNavigateToTerminal: (stage?: string) => void;
  onNavigateToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  theme,
  onSetLang,
  onToggleTheme,
  onNavigateToTerminal,
  onNavigateToLogin,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const isDark = theme === 'dark';

  // Interactive Live Teaser State
  const [selectedDemoPair, setSelectedDemoPair] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [demoPrice, setDemoPrice] = useState<number>(68450);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  // Live price simulation pulse on landing page
  useEffect(() => {
    const basePrices = { BTC: 68450, ETH: 3520, SOL: 154 };
    setDemoPrice(basePrices[selectedDemoPair]);

    const interval = setInterval(() => {
      setDemoPrice(prev => {
        const delta = (Math.random() - 0.48) * (selectedDemoPair === 'BTC' ? 45 : selectedDemoPair === 'ETH' ? 4 : 0.8);
        const nextPrice = +(prev + delta).toFixed(2);
        setPriceFlash(delta >= 0 ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 300);
        return nextPrice;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedDemoPair]);

  const liveTickers = [
    { symbol: 'BTC/USDT', price: 68450, change: 3.42, high: 69200, low: 66100 },
    { symbol: 'ETH/USDT', price: 3520.4, change: 2.18, high: 3590, low: 3410 },
    { symbol: 'SOL/USDT', price: 154.85, change: 6.84, high: 158.2, low: 142.5 },
    { symbol: 'BNB/USDT', price: 594.1, change: -0.45, high: 602, low: 588 },
    { symbol: 'XRP/USDT', price: 0.584, change: 1.12, high: 0.601, low: 0.572 },
    { symbol: 'DOGE/USDT', price: 0.142, change: 4.55, high: 0.148, low: 0.133 },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#2d2d2d] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs py-1.5 px-4 text-center font-mono font-bold flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span>
          {lang === 'id' 
            ? 'IMASBTC v2.4 Live • Matriks Konfluensi Multi-Indikator & Realtime WebSocket Scanner' 
            : 'IMASBTC v2.4 Live • Multi-Indicator Confluence Matrix & Realtime WebSocket Scanner'}
        </span>
      </div>

      {/* 2. LANDING NAVBAR */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#242424]/90 border-[#484848]' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigateToTerminal()}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <AkiraQuLogo size={36} theme={isDark ? 'dark' : 'light'} variant="squircle" />
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-base tracking-wider font-display transition-colors ${
                  isDark ? 'text-[#F89DB5]' : 'text-[#21242B]'
                }`}>
                  AKIRAQU
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                  isDark ? 'bg-[#F89DB5]/15 text-[#F89DB5] border-[#F89DB5]/30' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  PRO
                </span>
              </div>
              <span className={`text-[11px] font-sans block -mt-0.5 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Analytic Quantitative Crypto Tools
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-semibold">
            <button 
              onClick={() => onNavigateToTerminal('ticker')} 
              className={`transition-colors cursor-pointer ${isDark ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'}`}
            >
              {lang === 'id' ? 'Live Ticker' : 'Live Ticker'}
            </button>
            <button 
              onClick={() => onNavigateToTerminal('scanner')} 
              className={`transition-colors cursor-pointer ${isDark ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'}`}
            >
              Scanner
            </button>
            <button 
              onClick={() => onNavigateToTerminal('confluence')} 
              className={`transition-colors cursor-pointer ${isDark ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'}`}
            >
              {lang === 'id' ? 'Konfluensi' : 'Confluence'}
            </button>
            <button 
              onClick={() => onNavigateToTerminal('risk')} 
              className={`transition-colors cursor-pointer ${isDark ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'}`}
            >
              {lang === 'id' ? 'Kalkulator Risiko' : 'Risk Engine'}
            </button>
            <button 
              onClick={() => onNavigateToTerminal('journal')} 
              className={`transition-colors cursor-pointer ${isDark ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'}`}
            >
              {lang === 'id' ? 'Jurnal Trading' : 'Trading Journal'}
            </button>
          </nav>

          {/* Right Action Tools & Auth Button */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => onSetLang(lang === 'id' ? 'en' : 'id')}
              className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Ganti Bahasa / Switch Language"
            >
              {lang.toUpperCase()}
            </button>

            {/* Theme Switcher */}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Ganti Tema / Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* User Account / Google Sign In CTA */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToLogin}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    isDark ? 'bg-[#0b101f] border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'U'} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                      {user.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName?.split(' ')[0]}</span>
                </button>

                <button
                  onClick={() => onNavigateToTerminal()}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
                >
                  <span>Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToLogin}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200 hover:border-slate-600' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {/* Google mini icon */}
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="hidden sm:inline">{lang === 'id' ? 'Masuk Gmail' : 'Sign In'}</span>
                </button>

                <button
                  onClick={() => onNavigateToTerminal()}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>{lang === 'id' ? 'Buka Terminal' : 'Launch Terminal'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. REALTIME MARQUEE TICKER TAPE */}
      <div className={`py-2 px-4 border-b overflow-x-auto scrollbar-none font-mono text-xs ${
        isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>STREAM LIVE 24H:</span>
          </div>
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            {liveTickers.map((tick) => (
              <div 
                key={tick.symbol} 
                onClick={() => onNavigateToTerminal('ticker')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tick.symbol}</span>
                <span className="tabular-nums font-semibold">${formatCryptoPrice(tick.price)}</span>
                <span className={`tabular-nums font-bold ${tick.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tick.change >= 0 ? '+' : ''}{tick.change}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Futuristic Grid & Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'id' ? 'Terminal Kripto Kuantitatif & Matriks Konfluensi' : 'Quantitative Crypto Confluence Terminal'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.15]">
                {lang === 'id' ? (
                  <>
                    Presisi Analitik Kripto dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">Matriks Konfluensi</span> & Order Flow.
                  </>
                ) : (
                  <>
                    Precision Crypto Analytics with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">Confluence Matrix</span> & Order Flow.
                  </>
                )}
              </h1>

              <p className={`text-base sm:text-lg font-mono leading-relaxed max-w-2xl ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {lang === 'id'
                  ? 'Singkirkan tebak-tebakan dalam trading. IMASBTC menggabungkan 10 indikator kuantitatif, heatmap likuiditas mendalam, scanner multi-exchange (Binance, Bybit, OKX), serta manajemen risiko institusional dalam satu antarmuka berkinerja tinggi.'
                  : 'Eliminate guesswork in your trading. IMASBTC integrates 10 quantitative indicators, deep liquidity orderflow heatmaps, multi-exchange scanners, and institutional risk engines into a unified high-performance terminal.'}
              </p>

              {/* Action Button Row */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigateToTerminal()}
                  className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-xl shadow-cyan-500/25 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>{lang === 'id' ? 'Buka Terminal Trading' : 'Launch Trading Terminal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onNavigateToLogin}
                  className={`px-5 py-3.5 rounded-xl border text-sm font-mono font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#0f172a] hover:bg-[#131b2e] border-slate-700 text-slate-200'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                  }`}
                >
                  {/* Google 'G' Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{lang === 'id' ? 'Masuk dengan Akun Gmail' : 'Sign in with Google'}</span>
                </button>
              </div>

              {/* Trust Metric Chips */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>100% Non-Custodial</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Activity className="w-4 h-4" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Sub-100ms WebSocket Feeds</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Database className="w-4 h-4" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Cloud Sync Firebase Firestore</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Teaser Widget */}
            <div className="lg:col-span-5">
              <div className={`p-5 rounded-2xl border shadow-2xl backdrop-blur-md relative overflow-hidden ${
                isDark ? 'bg-[#0b101f]/90 border-[#1e293b] shadow-cyan-950/20' : 'bg-white/95 border-slate-200 shadow-slate-200/60'
              }`}>
                {/* Teaser Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Interactive Live Preview
                    </span>
                  </div>
                  {/* Pair selector */}
                  <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
                    isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {(['BTC', 'ETH', 'SOL'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedDemoPair(p)}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          selectedDemoPair === p 
                            ? 'bg-cyan-500 text-slate-950' 
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="py-4">
                  <span className={`text-[10px] font-mono uppercase font-bold tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Realtime {selectedDemoPair}/USDT Price
                  </span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className={`text-2xl sm:text-3xl font-black font-mono tabular-nums transition-colors duration-200 ${
                      priceFlash === 'up' ? 'text-emerald-400' : priceFlash === 'down' ? 'text-rose-400' : (isDark ? 'text-white' : 'text-slate-900')
                    }`}>
                      ${formatCryptoPrice(demoPrice)}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      CONFLUENCE: 88/100 (STRONG BUY)
                    </span>
                  </div>
                </div>

                {/* 4 Quantitative Snapshot Tiles */}
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>RSI Multi-TF (14)</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-cyan-400">58.4 (Bullish)</span>
                      <span className="text-[10px] text-emerald-400">▲ Zone</span>
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>CVD Delta Volume</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-emerald-400">+$14.2M Inflow</span>
                      <span className="text-[10px] text-cyan-400">Buyers</span>
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Orderbook Depth</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-emerald-400">Bids 64% / Asks 36%</span>
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Funding Rate (8h)</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-amber-400">+0.0100% (Healthy)</span>
                    </div>
                  </div>
                </div>

                {/* Instant CTA to jump to terminal */}
                <button
                  onClick={() => onNavigateToTerminal('confluence')}
                  className="w-full mt-4 py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <span>{lang === 'id' ? 'Buka Analisis Lengkap Pasangan Ini →' : 'Explore Full Analysis in Terminal →'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 6 CORE PILLARS & CAPABILITIES BENTO GRID */}
      <section className={`py-16 px-4 sm:px-6 border-t ${isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              {lang === 'id' ? 'Arsitektur & Fitur Unggulan' : 'Core Architecture & Features'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight">
              {lang === 'id' 
                ? 'Semua Tools Kuantitatif Kripto dalam Satu Layar' 
                : 'All Quantitative Crypto Tools in a Single Screen'}
            </h2>
            <p className={`text-xs sm:text-sm font-mono leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {lang === 'id'
                ? 'Didesain untuk trader profesional yang membutuhkan kecepatan, validasi sinyal matematis, dan proteksi modal terstruktur.'
                : 'Engineered for professional traders requiring speed, mathematical signal validation, and structured capital preservation.'}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: 10 Quantitative Indicators */}
            <div 
              onClick={() => onNavigateToTerminal('indicators')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                isDark ? 'bg-[#0b101f] border-[#1e293b] hover:border-cyan-500/50 hover:shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                10 Indikator Kuantitatif Terkalibrasi
              </h3>
              <p className={`text-xs font-mono leading-relaxed mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                RSI Multi-TF, MACD Histogram, Order Flow CVD, Heatmap Likuiditas, EMA Confluence, Funding Rate, dan Bollinger Bands dengan kalkulasi bobot otomatis.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-cyan-400">
                <span>Pelajari Indikator</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Realtime Multi-Exchange Scanner */}
            <div 
              onClick={() => onNavigateToTerminal('scanner')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                isDark ? 'bg-[#0b101f] border-[#1e293b] hover:border-cyan-500/50 hover:shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Scanner Realtime Multi-Exchange
              </h3>
              <p className={`text-xs font-mono leading-relaxed mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Scanning puluhan aset kripto secara paralel di Binance, Bybit, OKX, dan Tokocrypto untuk menemukan setup 9/9 kriteria konfluensi tertinggi.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                <span>Buka Scanner Pasar</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Precision Risk & DCA Ladder */}
            <div 
              onClick={() => onNavigateToTerminal('risk')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                isDark ? 'bg-[#0b101f] border-[#1e293b] hover:border-cyan-500/50 hover:shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Kalkulator Risiko & DCA Institusional
              </h3>
              <p className={`text-xs font-mono leading-relaxed mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Kalkulasi ukuran posisi (Lot sizing), harga likuidasi aman, rasio Risk-Reward (RRR), dan pembagian 3 limit ladder order otomatis.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                <span>Hitung Risiko Trade</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Cloud Trading Journal */}
            <div 
              onClick={() => onNavigateToTerminal('journal')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                isDark ? 'bg-[#0b101f] border-[#1e293b] hover:border-cyan-500/50 hover:shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Jurnal Trading & Firebase Cloud Sync
              </h3>
              <p className={`text-xs font-mono leading-relaxed mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Pencatatan eksekusi posisi otomatis terhubung ke akun Gmail via Firebase Firestore. Analisis win-rate, PnL curve, dan evaluasi psikologi trading.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-blue-400">
                <span>Akses Jurnal Cloud</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 5: Automated Bot Hub & Webhooks */}
            <div 
              onClick={() => onNavigateToTerminal('bot')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                isDark ? 'bg-[#0b101f] border-[#1e293b] hover:border-cyan-500/50 hover:shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Automated Bot Trading Hub
              </h3>
              <p className={`text-xs font-mono leading-relaxed mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Integrasi sinyal terkonfirmasi ke webhook Telegram, TradingView Alerts, atau bot eksekusi kuantitatif dengan payload JSON terstandardisasi.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-indigo-400">
                <span>Konfigurasi Bot Hub</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 6: News & Market Sentiment */}
            <div 
              onClick={() => onNavigateToTerminal('sentiment')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                isDark ? 'bg-[#0b101f] border-[#1e293b] hover:border-cyan-500/50 hover:shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30 group-hover:scale-105 transition-transform">
                <Newspaper className="w-5 h-5" />
              </div>
              <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sentimen On-Chain & Agregasi Berita
              </h3>
              <p className={`text-xs font-mono leading-relaxed mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Fear & Greed Index realtime, pergerakan whale on-chain, likuidasi futures, dan agregasi berita penggerak pasar kripto global.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono font-bold text-rose-400">
                <span>Cek Sentimen Pasar</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS 3-STEP FLOW */}
      <section className="py-16 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              {lang === 'id' ? 'Alur Kerja Eksekusi Kuantitatif' : 'Execution Workflow'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              {lang === 'id' ? '3 Langkah Mengambil Setup Probabilitas Tinggi' : '3 Steps to High-Probability Execution'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            {/* Step 1 */}
            <div className={`p-6 rounded-2xl border relative ${
              isDark ? 'bg-[#0b101f] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              <div className="text-3xl font-black text-cyan-500/30 mb-2">01</div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {lang === 'id' ? 'Scan & Filter Peluang' : 'Scan & Filter Setups'}
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'id'
                  ? 'Gunakan Scanner Realtime untuk memfilter koin dengan momentum volume tertinggi dan kriteria breakout 9/9.'
                  : 'Use the Realtime Scanner to filter high volume momentum coins matching our 9/9 breakout criteria.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className={`p-6 rounded-2xl border relative ${
              isDark ? 'bg-[#0b101f] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              <div className="text-3xl font-black text-emerald-500/30 mb-2">02</div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {lang === 'id' ? 'Validasi Matriks Konfluensi' : 'Validate Confluence'}
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'id'
                  ? 'Periksa skor konfluensi (0-100), delta CVD, dan heatmap likuiditas untuk memastikan tidak melawan bandar/institusi.'
                  : 'Inspect the confluence score (0-100), CVD delta, and liquidity heatmap to align with institutional order flow.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className={`p-6 rounded-2xl border relative ${
              isDark ? 'bg-[#0b101f] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              <div className="text-3xl font-black text-amber-500/30 mb-2">03</div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {lang === 'id' ? 'Kalkulasi Risiko & Catat' : 'Calculate Risk & Log'}
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'id'
                  ? 'Tentukan lot kontrak di Kalkulator Risiko, pasang stop loss invalidasi, lalu simpan ke Jurnal Cloud Firebase.'
                  : 'Size your position in the Risk Engine, define invalidation stop, and sync execution to your Cloud Journal.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION (CTA) */}
      <section className="py-16 px-4 sm:px-6">
        <div className={`max-w-5xl mx-auto p-8 sm:p-12 rounded-3xl border shadow-2xl relative overflow-hidden text-center space-y-6 ${
          isDark 
            ? 'bg-gradient-to-b from-[#0f172a] to-[#070b14] border-cyan-500/30 shadow-cyan-950/30' 
            : 'bg-gradient-to-b from-cyan-50 to-white border-cyan-200 shadow-slate-200'
        }`}>
          <div className="inline-flex p-3 rounded-2xl mb-2 transition-transform">
            <AkiraQuLogo size={56} theme={isDark ? 'dark' : 'light'} variant="squircle" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight">
            {lang === 'id' ? 'Siap Meningkatkan Edge Trading Anda?' : 'Ready to Elevate Your Trading Edge?'}
          </h2>

          <p className={`text-xs sm:text-sm font-mono max-w-xl mx-auto leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {lang === 'id'
              ? 'Masuk dengan akun Google Anda untuk mengaktifkan sinkronisasi jurnal cloud, atau langsung buka terminal trading instan.'
              : 'Sign in with your Google account to enable cloud journal syncing, or launch the terminal instantly.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigateToTerminal()}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-xl shadow-cyan-500/30 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>{lang === 'id' ? 'Buka Terminal Trading' : 'Launch Trading Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToLogin}
              className={`px-6 py-4 rounded-xl border text-sm font-mono font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                  : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-md'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{lang === 'id' ? 'Masuk dengan Gmail' : 'Sign in with Gmail'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className={`mt-auto py-8 px-4 sm:px-6 border-t font-mono text-xs ${
        isDark ? 'bg-[#242424] border-[#484848] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AkiraQuLogo size={24} theme={isDark ? 'dark' : 'light'} variant="symbol" />
            <span className={`font-bold tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>AKIRAQU</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Analytic Quantitative Crypto Tools</span>
            <span>© 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onNavigateToTerminal('ticker')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Terminal
            </button>
            <button onClick={onNavigateToLogin} className="hover:text-cyan-400 transition-colors cursor-pointer">
              {lang === 'id' ? 'Akun Google' : 'Google Auth'}
            </button>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              System Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
