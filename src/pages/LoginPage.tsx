import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AkiraQuLogo } from '../components/AkiraQuLogo';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Database, 
  TrendingUp, 
  Zap, 
  User, 
  LogOut, 
  AlertTriangle,
  Layers
} from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';

interface LoginPageProps {
  lang: Language;
  theme: 'light' | 'dark';
  onNavigateToTerminal: () => void;
  onNavigateToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  lang,
  theme,
  onNavigateToTerminal,
  onNavigateToLanding,
}) => {
  const { user, loginWithGoogle, loginAsGuest, logout, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoEmailInput, setDemoEmailInput] = useState('');
  const [showDemoForm, setShowDemoForm] = useState(false);

  const isDark = theme === 'dark';

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onNavigateToTerminal();
    } catch (err: any) {
      console.error('Google login error in page:', err);
      if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup')) {
        setError(
          lang === 'id'
            ? 'Popup Google diblokir oleh peramban/iframe. Anda dapat mengaktifkan popup atau menggunakan Mode Akses Cepat di bawah.'
            : 'Google login popup was blocked by browser. You can enable popups or use Quick Access Demo mode below.'
        );
      } else {
        setError(
          err?.message || (lang === 'id' ? 'Gagal masuk dengan Google. Coba lagi.' : 'Failed to sign in with Google. Please try again.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsGuest(demoEmailInput || 'nintynine.coin@gmail.com');
    onNavigateToTerminal();
  };

  return (
    <div className={`min-h-[calc(100vh-60px)] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden ${
      isDark ? 'bg-[#070b14] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="w-full max-w-xl relative z-10">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between mb-4 text-xs font-mono">
          <button
            onClick={onNavigateToLanding}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-pink-400' : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            ← {lang === 'id' ? 'Kembali ke Landing Page' : 'Back to Landing Page'}
          </button>
          <span className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold border ${
            isDark ? 'bg-pink-950/40 border-pink-500/30 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-800'
          }`}>
            Firebase Auth Cloud Sync
          </span>
        </div>

        {/* Main Card */}
        <div className={`p-6 sm:p-8 rounded-[2px] border shadow-xl backdrop-blur-md ${
          isDark 
            ? 'bg-[#0b101f]/90 border-slate-800 shadow-black/40' 
            : 'bg-white/95 border-slate-200 shadow-slate-200/50'
        }`}>
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-2 cursor-pointer transition-transform hover:scale-105" onClick={onNavigateToLanding}>
              <AkiraQuLogo size={64} theme={isDark ? 'dark' : 'light'} variant="full" />
            </div>
            <p className={`text-xs font-mono mt-2 max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {lang === 'id'
                ? 'Autentikasi Akun Google untuk Akses Cloud Sync & Jurnal Trading'
                : 'Google Account Authentication for Cloud Sync & Trading Journal'}
            </p>
          </div>

          {/* If already authenticated */}
          {isAuthenticated && user ? (
            <div className="space-y-5">
              <div className={`p-4 rounded-[2px] border flex items-center gap-3.5 ${
                isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-12 h-12 avatar-circle border-2 border-emerald-500/40 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 avatar-circle bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/40 shrink-0">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === 'id' ? 'Sedang Masuk' : 'Signed In'}
                    </span>
                    {user.isAnonymous && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-amber-500/20 text-amber-400 font-mono font-bold">
                        DEMO / GUEST
                      </span>
                    )}
                  </div>
                  <h3 className={`text-sm font-bold truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user.displayName}
                  </h3>
                  <p className={`text-xs font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {user.email || 'Akun Gmail Terhubung'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onNavigateToTerminal}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-[2px] font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span>{lang === 'id' ? 'Lanjut ke Terminal' : 'Proceed to Terminal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  className={`py-3 px-4 rounded-[2px] font-semibold font-mono text-xs flex items-center justify-center gap-2 border cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>{lang === 'id' ? 'Keluar' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form / Options */
            <div className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-[2px] bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{lang === 'id' ? 'Pemberitahuan Login' : 'Login Notice'}</span>
                    <p className="mt-0.5 text-[11px] leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Primary Google Login Button */}
              <button
                id="btn-google-login"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-[2px] font-bold text-xs font-mono flex items-center justify-center gap-3 border shadow-md transition-all cursor-pointer active:scale-[0.99] ${
                  isDark
                    ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                    : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-slate-200'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isLoading
                    ? (lang === 'id' ? 'Menghubungkan ke Google...' : 'Connecting to Google...')
                    : (lang === 'id' ? 'Masuk dengan Akun Google (Gmail)' : 'Sign in with Google (Gmail)')}
                </span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
                <span className={`absolute px-3 text-[10px] font-mono uppercase tracking-wider ${
                  isDark ? 'bg-[#0b101f] text-slate-500' : 'bg-white text-slate-400'
                }`}>
                  {lang === 'id' ? 'atau akses instan' : 'or instant access'}
                </span>
              </div>

              {/* Guest / Demo Fast Login */}
              {!showDemoForm ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      loginAsGuest('nintynine.coin@gmail.com');
                      onNavigateToTerminal();
                    }}
                    className={`w-full py-2.5 px-4 rounded-[2px] text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-pink-400'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-pink-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'id' ? 'Masuk Cepat Demo (nintynine.coin@gmail.com)' : 'Quick Demo Access'}</span>
                  </button>

                  <button
                    onClick={() => setShowDemoForm(true)}
                    className={`w-full text-center text-[11px] font-mono transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {lang === 'id' ? 'Ketik alamat Gmail khusus →' : 'Enter custom Gmail address →'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDemoSignIn} className="space-y-3">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {lang === 'id' ? 'Email Gmail Anda' : 'Your Gmail Email'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contoh: nama.trader@gmail.com"
                      value={demoEmailInput}
                      onChange={(e) => setDemoEmailInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-[2px] text-xs font-mono border outline-none focus:ring-1 focus:ring-pink-500 ${
                        isDark ? 'bg-[#090d16] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold font-mono text-xs rounded-[2px] cursor-pointer transition-colors"
                    >
                      {lang === 'id' ? 'Lanjut Masuk' : 'Continue'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDemoForm(false)}
                      className={`px-3 py-2 rounded-[2px] text-xs font-mono border cursor-pointer ${
                        isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Benefits Feature Checklist */}
          <div className={`mt-6 pt-5 border-t space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider block ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {lang === 'id' ? 'Keuntungan Akun Terverifikasi:' : 'Verified Account Privileges:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Database className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>Cloud Sync Jurnal Trading</span>
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Privasi Data Aman Firebase</span>
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <TrendingUp className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Preset Risiko & DCA Simpanan</span>
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Webhook Bot Trading Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Disclaimer Footer */}
        <div className={`mt-4 text-center text-[10px] font-mono leading-relaxed ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit SSL & Google OAuth 2.0 Protocol</span>
          </div>
          <p>
            {lang === 'id'
              ? 'Akiraqu tidak pernah meminta private key atau dana Anda. Kami hanya mengakses profil publik Google untuk sinkronisasi preferensi analitik.'
              : 'Akiraqu never requests private keys or funds. We only request basic Google public profile for preferences synchronization.'}
          </p>
        </div>
      </div>
    </div>
  );
};
