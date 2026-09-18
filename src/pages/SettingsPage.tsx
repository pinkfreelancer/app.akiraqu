import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Lock,
  Globe,
  Clock,
  DollarSign,
  Palette,
  Maximize,
  Minimize,
  StretchHorizontal,
  LayoutGrid,
  Bell,
  Mail,
  Send,
  MessageSquare,
  Key,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Terminal as TerminalIcon,
  Sliders,
  Volume2,
  VolumeX,
  Smartphone,
  Check,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';
import {
  MasterUserSettings,
  DisplayThemeMode,
  AccentColor,
  TimezoneOption,
  NumberFormatOption,
  CurrencySymbolOption,
  AIModelConfig,
} from '../types/settings.types';
import {
  loadMasterUserSettings,
  saveMasterUserSettings,
  exportAllAppDataAsJson,
  clearAllAppData,
  DEFAULT_AI_MODELS,
} from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';
import { MyExchangesSettings } from '../components/MyExchangesSettings';
import { ExchangeApiCredential, SupportedExchange, MarketType } from '../types/crypto.types';
import { INITIAL_EXCHANGE_CREDENTIALS } from '../services/terminalExtensionService';

interface SettingsPageProps {
  lang: Language;
  onToggleLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isFullWidth: boolean;
  onToggleFullWidth: () => void;
  workspaceMode: 'classic' | 'launchpad';
  onToggleWorkspaceMode: () => void;
  exchangeCredentials?: ExchangeApiCredential[];
  onSaveExchangeCredentials?: (creds: ExchangeApiCredential[]) => void;
  onNavigateToStage?: (stage: any) => void;
}

type SettingsTab = 'PROFILE' | 'REGIONAL' | 'DISPLAY' | 'NOTIFICATIONS' | 'API_INTEGRATIONS';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  isFullWidth,
  onToggleFullWidth,
  workspaceMode,
  onToggleWorkspaceMode,
  exchangeCredentials = [],
  onSaveExchangeCredentials,
  onNavigateToStage,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const t = getTranslation(lang);
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Master Settings State
  const [settings, setSettings] = useState<MasterUserSettings>(() =>
    loadMasterUserSettings(user?.email || undefined, user?.displayName || undefined)
  );

  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [testAlertFeedback, setTestAlertFeedback] = useState<{ channel: string; message: string; success: boolean } | null>(null);
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Local Exchange Credentials State
  const [localCredentials, setLocalCredentials] = useState<ExchangeApiCredential[]>(() => {
    if (exchangeCredentials && exchangeCredentials.length > 0) return exchangeCredentials;
    try {
      const saved = localStorage.getItem('imasbtc_exchange_credentials');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_EXCHANGE_CREDENTIALS;
  });

  const handleSaveCreds = (newCreds: ExchangeApiCredential[]) => {
    setLocalCredentials(newCreds);
    try {
      localStorage.setItem('imasbtc_exchange_credentials', JSON.stringify(newCreds));
    } catch {}
    if (onSaveExchangeCredentials) {
      onSaveExchangeCredentials(newCreds);
    }
    setSaveSuccessNotice(isId ? 'Kunci API bursa berhasil diperbarui!' : 'Exchange API credentials updated!');
    setTimeout(() => setSaveSuccessNotice(null), 2500);
  };

  // Sync Auth User if changes
  useEffect(() => {
    if (user?.email) {
      setSettings((prev) => ({
        ...prev,
        account: {
          ...prev.account,
          email: user.email || prev.account.email,
          displayName: user.displayName || prev.account.displayName,
          photoURL: user.photoURL || prev.account.photoURL,
        },
      }));
    }
  }, [user]);

  // Save changes handler with auto-feedback
  const handleUpdateSettings = (updated: Partial<MasterUserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      saveMasterUserSettings(next);
      return next;
    });
    setSaveSuccessNotice(isId ? 'Perubahan berhasil disimpan!' : 'Settings saved successfully!');
    setTimeout(() => setSaveSuccessNotice(null), 2500);
  };

  // Test Notification Alert Simulation
  const handleTestAlert = (channel: 'email' | 'telegram' | 'whatsapp') => {
    setIsTestingAlert(true);
    setTestAlertFeedback(null);

    setTimeout(() => {
      setIsTestingAlert(false);
      const target =
        channel === 'email'
          ? settings.notifications.email.target
          : channel === 'telegram'
          ? settings.notifications.telegram.target
          : settings.notifications.whatsapp.target;

      setTestAlertFeedback({
        channel,
        success: true,
        message: isId
          ? `Ping sinyal uji coba berhasil dikirim ke ${target}! Periksa notifikasi Anda.`
          : `Test signal ping sent successfully to ${target}! Check your notifications.`,
      });

      setTimeout(() => setTestAlertFeedback(null), 5000);
    }, 1200);
  };

  // Export Data JSON
  const handleExportData = () => {
    const dataStr = exportAllAppDataAsJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IMASBTC_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear App Data
  const handleClearAllData = () => {
    clearAllAppData();
    setShowClearConfirm(false);
    setSaveSuccessNotice(isId ? 'Semua data dan preferensi lokal telah direset.' : 'All local cache and data have been reset.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Sample Price & Date Demo Formatter
  const getSamplePrice = () => {
    const p = 87450.25;
    if (settings.regional.numberFormat === 'ID') return '87.450,25';
    if (settings.regional.numberFormat === 'EU') return '87 450,25';
    return '87,450.25';
  };

  const getCurrencyPrefix = () => {
    switch (settings.regional.currencySymbol) {
      case 'IDR': return 'Rp ';
      case 'EUR': return '€ ';
      case 'USDT': return '₮ ';
      default: return '$';
    }
  };

  return (
    <div id="page-settings-master" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-[#0b1329] via-[#0f172a] to-[#070b14] border-[#1e293b]'
            : 'bg-gradient-to-r from-cyan-50 via-white to-blue-50 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span className={isDark ? 'text-white' : 'text-slate-900'}>
                  {isId ? 'Pengaturan Terminal & Keamanan' : 'Terminal Settings & Security'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold font-mono">
                  v2.5 Pro
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isId
                  ? 'Konfigurasi Profil Pengguna, Preferensi Regional, Kustomisasi Tampilan, Kanal Notifikasi Sinyal, dan Integrasi API.'
                  : 'Manage User Profile, Regional Formatting, Display Theming, Signal Alert Channels, and API Integrations.'}
              </p>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2.5">
            {saveSuccessNotice && (
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessNotice}</span>
              </span>
            )}

            <button
              onClick={handleExportData}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isId ? 'Ekspor Backup Pengaturan & Jurnal ke JSON' : 'Export Settings & Journal Backup'}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isId ? 'Ekspor Data' : 'Export Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className={`flex items-center gap-1.5 p-1 rounded-2xl border overflow-x-auto scrollbar-none ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {[
          { id: 'PROFILE', label: isId ? 'Profil & Keamanan' : 'Profile & Security', icon: User },
          { id: 'REGIONAL', label: isId ? 'Bahasa & Waktu' : 'Regional & Format', icon: Globe },
          { id: 'DISPLAY', label: isId ? 'Tampilan & Tema' : 'Display & Theme', icon: Palette },
          { id: 'NOTIFICATIONS', label: isId ? 'Notifikasi Sinyal' : 'Signal Alerts', icon: Bell },
          { id: 'API_INTEGRATIONS', label: isId ? 'Integrasi API' : 'API Integrations', icon: Key },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : isDark
                  ? 'bg-[#070b14] text-slate-400 border-[#1e293b] hover:text-slate-200 hover:bg-slate-800/60'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-950'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROFIL & KEAMANAN (USER PROFILE, ACCOUNT, PRIVACY) */}
      {/* ========================================================= */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-base font-bold font-mono text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Profil Pengguna & Status Akun' : 'User Profile & Account Status'}</span>
            </h3>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-700/30">
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={settings.account.displayName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-slate-950 text-2xl font-bold flex items-center justify-center font-mono shadow-md">
                    {settings.account.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-white">{settings.account.displayName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                      {settings.account.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono block">{settings.account.email}</span>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    User ID: <code className="text-cyan-400">{settings.account.userId}</code> • Terdaftar: {settings.account.memberSince}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAuthenticated && user ? (
                  <button
                    onClick={() => logout()}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50'
                        : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    <span>{isId ? 'Keluar Akun' : 'Sign Out'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-mono italic">
                    {isId ? 'Masuk via Google Gmail untuk sinkronisasi cloud' : 'Sign in with Google for Cloud Sync'}
                  </span>
                )}
              </div>
            </div>

            {/* Editable Profile Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-slate-400 font-bold">{isId ? 'Nama Tampilan' : 'Display Name'}</label>
                <input
                  type="text"
                  value={settings.account.displayName}
                  onChange={(e) =>
                    handleUpdateSettings({
                      account: { ...settings.account, displayName: e.target.value },
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-slate-400 font-bold">{isId ? 'Tingkat Akun Trader' : 'Account Tier'}</label>
                <select
                  value={settings.account.role}
                  onChange={(e) =>
                    handleUpdateSettings({
                      account: { ...settings.account, role: e.target.value as any },
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="PRO_TRADER">PRO TRADER (Multi-Exchange & Bot)</option>
                  <option value="INSTITUTIONAL">INSTITUTIONAL (Full Model & Orderflow)</option>
                  <option value="VIP_QUANT">VIP QUANT (Direct API Arbitrage)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security & Access Protection */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-base font-bold font-mono text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>{isId ? 'Keamanan & Perlindungan Akses' : 'Security & Session Protection'}</span>
            </h3>

            <div className="space-y-4">
              {/* 2FA Protection Toggle */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-0.5">
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    {isId ? 'Autentikasi Dua Faktor (2FA Sim)' : 'Two-Factor Authentication (2FA)'}
                  </span>
                  <p className="text-xs text-slate-400">
                    {isId ? 'Meminta verifikasi kode sebelum mengeksekusi order riil di bursa.' : 'Require 2FA verification before placing live orders.'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleUpdateSettings({
                      account: { ...settings.account, twoFactorEnabled: !settings.account.twoFactorEnabled },
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    settings.account.twoFactorEnabled
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.account.twoFactorEnabled ? 'AKTIF' : 'NONAKTIF'}
                </button>
              </div>

              {/* Auto Lock Session */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-0.5">
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    {isId ? 'Kunci Otomatis Terminal (Auto-Lock)' : 'Terminal Auto-Lock Timeout'}
                  </span>
                  <p className="text-xs text-slate-400">
                    {isId ? 'Mengunci layar terminal otomatis saat tidak ada aktivitas.' : 'Automatically lock terminal upon inactivity.'}
                  </p>
                </div>

                <select
                  value={settings.account.autoLockMinutes}
                  onChange={(e) =>
                    handleUpdateSettings({
                      account: { ...settings.account, autoLockMinutes: Number(e.target.value) },
                    })
                  }
                  className={`px-3 py-2 rounded-lg border font-mono text-xs ${
                    isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value={15}>15 Menit</option>
                  <option value={30}>30 Menit (Direkomendasikan)</option>
                  <option value={60}>1 Jam</option>
                  <option value={120}>2 Jam</option>
                  <option value={0}>Tidak Pernah</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Data Management */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-base font-bold font-mono text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>{isId ? 'Privasi & Kedaulatan Data Lokal' : 'Privacy & Data Sovereignty'}</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              {isId
                ? 'Terminal IMASBTC beroperasi dengan arsitektur Local-First. API Key bursa, riwayat transaksi, dan jurnal analisis disimpan terlindungi di perangkat lokal pengguna atau Firestore terenkripsi milik Anda.'
                : 'IMASBTC operates on a Local-First architecture. Exchange API keys, trade histories, and journal entries are securely stored on your local browser instance or private Firestore.'}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{isId ? 'Download Cadangan Data Lengkap (.JSON)' : 'Download Full Data Backup (.JSON)'}</span>
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>{isId ? 'Reset Cache & Data Lokal' : 'Clear Local Cache & Reset'}</span>
              </button>
            </div>

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
              <div className="mt-4 p-4 rounded-xl border border-rose-500/50 bg-rose-950/40 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-300 font-mono font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{isId ? 'Konfirmasi Reset Data Lokal' : 'Confirm Local Reset'}</span>
                </div>
                <p className="text-xs text-rose-200/80">
                  {isId
                    ? 'Tindakan ini akan menghapus riwayat jurnal trading, backtest, dan preferensi yang tersimpan di browser Anda.'
                    : 'This action will wipe all stored trading journals, backtest runs, and preferences stored in your browser cache.'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearAllData}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-lg cursor-pointer"
                  >
                    {isId ? 'Ya, Hapus Semua' : 'Yes, Wipe Everything'}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-lg cursor-pointer"
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BAHASA, WAKTU & FORMAT ANGKA (REGIONAL & FORMAT)   */}
      {/* ========================================================= */}
      {activeTab === 'REGIONAL' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-base font-bold font-mono text-white mb-5 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Bahasa, Zona Waktu & Format Angka' : 'Language, Timezone & Number Formatting'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Bahasa Pengantar (Language)' : 'Interface Language'}
                </label>
                <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() => {
                      onToggleLang('id');
                      handleUpdateSettings({ regional: { ...settings.regional, language: 'id' } });
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      lang === 'id'
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🇮🇩 Bahasa Indonesia (ID)
                  </button>
                  <button
                    onClick={() => {
                      onToggleLang('en');
                      handleUpdateSettings({ regional: { ...settings.regional, language: 'en' } });
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      lang === 'en'
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🇺🇸 English (EN)
                  </button>
                </div>
              </div>

              {/* Timezone Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Zona Waktu Pasar (Timezone)' : 'Market Timezone'}
                </label>
                <select
                  value={settings.regional.timezone}
                  onChange={(e) =>
                    handleUpdateSettings({
                      regional: { ...settings.regional, timezone: e.target.value as TimezoneOption },
                    })
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="WIB">WIB (UTC+7) - Jakarta / Bangkok</option>
                  <option value="WITA">WITA (UTC+8) - Bali / Singapore / Hong Kong</option>
                  <option value="WIT">WIT (UTC+9) - Tokyo / Jayapura</option>
                  <option value="UTC">UTC (GMT+0) - London Standard</option>
                  <option value="EST">EST (UTC-5) - New York / Wall Street</option>
                  <option value="SGT">SGT (UTC+8) - Singapore Exchange</option>
                </select>
              </div>

              {/* Number Format Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Format Pemisah Desimal & Ribuan' : 'Number & Decimal Format'}
                </label>
                <select
                  value={settings.regional.numberFormat}
                  onChange={(e) =>
                    handleUpdateSettings({
                      regional: { ...settings.regional, numberFormat: e.target.value as NumberFormatOption },
                    })
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="US">Format Internasional: 1,234.56</option>
                  <option value="ID">Format Indonesia: 1.234,56</option>
                  <option value="EU">Format Eropa: 1 234,56</option>
                </select>
              </div>

              {/* Currency Symbol */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Mata Uang Acuan' : 'Reference Currency'}
                </label>
                <select
                  value={settings.regional.currencySymbol}
                  onChange={(e) =>
                    handleUpdateSettings({
                      regional: { ...settings.regional, currencySymbol: e.target.value as CurrencySymbolOption },
                    })
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="USDT">USDT (₮) - Tether USD</option>
                  <option value="IDR">IDR (Rp) - Indonesian Rupiah</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Format Tanggal' : 'Date Format'}
                </label>
                <select
                  value={settings.regional.dateFormat}
                  onChange={(e) =>
                    handleUpdateSettings({
                      regional: { ...settings.regional, dateFormat: e.target.value as any },
                    })
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 17/09/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-09-17)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (Contoh: 09/17/2026)</option>
                </select>
              </div>

              {/* Time Format */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Format Jam (Waktu)' : 'Time Format'}
                </label>
                <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() =>
                      handleUpdateSettings({ regional: { ...settings.regional, timeFormat: '24h' } })
                    }
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      settings.regional.timeFormat === '24h'
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    24 Jam (14:30:00)
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateSettings({ regional: { ...settings.regional, timeFormat: '12h' } })
                    }
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      settings.regional.timeFormat === '12h'
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    12 Jam (02:30:00 PM)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Format Preview Strip */}
            <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase block mb-2">
                {isId ? 'Pratinjau Format Langsung (Live Preview)' : 'Live Format Preview'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Harga Contoh:</span>
                  <span className="text-white font-bold">{getCurrencyPrefix()}{getSamplePrice()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Waktu Pasar ({settings.regional.timezone}):</span>
                  <span className="text-cyan-300 font-bold">17/09/2026, 15:45:20 WIB</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Volume 24 Jam:</span>
                  <span className="text-emerald-400 font-bold">{getCurrencyPrefix()}1.42B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TAMPILAN & TEMA (DISPLAY & THEME ENGINE)            */}
      {/* ========================================================= */}
      {activeTab === 'DISPLAY' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-base font-bold font-mono text-white mb-5 flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Kustomisasi Tampilan & Tema Engine' : 'Display Customization & Engine Theme'}</span>
            </h3>

            {/* Theme Engine Selection: Light, Dark, Classic, Custom */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                {isId ? 'Pilihan Tema Engine Visual' : 'Visual Engine Theme'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Dark Theme */}
                <button
                  onClick={() => {
                    if (!isDark) onToggleTheme();
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'dark' } });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isDark && settings.display.themeMode === 'dark'
                      ? 'bg-[#0b0f19] border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                      : 'bg-[#070b14] border-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Moon className="w-5 h-5 text-cyan-400" />
                    {isDark && settings.display.themeMode === 'dark' && (
                      <Check className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <span className="text-sm font-bold font-mono text-white block">Dark Mode</span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Default Obsidian #090d16 dengan aksen cyan neon.
                  </span>
                </button>

                {/* Light Theme */}
                <button
                  onClick={() => {
                    if (isDark) onToggleTheme();
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'light' } });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    !isDark || settings.display.themeMode === 'light'
                      ? 'bg-white border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                      : 'bg-[#070b14] border-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    {(!isDark || settings.display.themeMode === 'light') && (
                      <Check className="w-4 h-4 text-cyan-600" />
                    )}
                  </div>
                  <span className="text-sm font-bold font-mono text-slate-900 block">Light Mode</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Bersih, terang & kontras tajam untuk trading siang hari.
                  </span>
                </button>

                {/* Classic Terminal Theme */}
                <button
                  onClick={() => {
                    if (!isDark) onToggleTheme();
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'classic', accentColor: 'amber' } });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.display.themeMode === 'classic'
                      ? 'bg-black border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                      : 'bg-[#070b14] border-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <TerminalIcon className="w-5 h-5 text-amber-400" />
                    {settings.display.themeMode === 'classic' && (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <span className="text-sm font-bold font-mono text-amber-400 block">Classic Terminal</span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Gaya Retro Bloomberg dengan aksen amber monospaced.
                  </span>
                </button>

                {/* Custom Palette Theme */}
                <button
                  onClick={() => {
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'custom' } });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.display.themeMode === 'custom'
                      ? 'bg-[#0f172a] border-purple-500 ring-2 ring-purple-500/30 shadow-md'
                      : 'bg-[#070b14] border-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    {settings.display.themeMode === 'custom' && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <span className="text-sm font-bold font-mono text-white block">Custom Palette</span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Pilih aksen warna kustom kesukaan Anda.
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Accent Palette Picker */}
            {settings.display.themeMode === 'custom' && (
              <div className={`p-4 rounded-xl border mb-6 animate-fade-in ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-xs font-mono font-bold text-slate-400 block mb-2">
                  {isId ? 'Pilih Warna Aksen Utama:' : 'Select Accent Color:'}
                </span>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'cyan', name: 'Cyan Neon', color: 'bg-cyan-500' },
                    { id: 'emerald', name: 'Emerald Bull', color: 'bg-emerald-500' },
                    { id: 'amber', name: 'Amber Classic', color: 'bg-amber-500' },
                    { id: 'violet', name: 'Violet Quant', color: 'bg-purple-500' },
                    { id: 'rose', name: 'Rose Bear', color: 'bg-rose-500' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        handleUpdateSettings({
                          display: { ...settings.display, accentColor: c.id as AccentColor },
                        })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                        settings.display.accentColor === c.id
                          ? 'border-white text-white bg-slate-800'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.color}`} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ergonomic Display Layout Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/30">
              {/* Fullscreen Toggle */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-1 mb-3">
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-cyan-400" />
                    {isId ? 'Layar Penuh (Fullscreen)' : 'Fullscreen Mode'}
                  </span>
                  <p className="text-xs text-slate-400">
                    {isId ? 'Maksimalkan tampilan ke seluruh layar monitor.' : 'Expand viewport across your entire monitor.'}
                  </p>
                </div>
                <button
                  onClick={onToggleFullscreen}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition cursor-pointer"
                >
                  {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? (isId ? 'Keluar Layar Penuh' : 'Exit Fullscreen') : (isId ? 'Masuk Layar Penuh' : 'Enter Fullscreen')}</span>
                </button>
              </div>

              {/* Full Width Layout */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-1 mb-3">
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <StretchHorizontal className="w-4 h-4 text-cyan-400" />
                    {isId ? 'Lebar Layar Ultra-Wide' : 'Full-Width Layout'}
                  </span>
                  <p className="text-xs text-slate-400">
                    {isId ? 'Menyesuaikan grid grafik ke monitor ultra-wide tanpa batas tepi.' : 'Fit trading cards across ultra-wide monitors.'}
                  </p>
                </div>
                <button
                  onClick={onToggleFullWidth}
                  className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                    isFullWidth
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {isFullWidth ? (isId ? 'Mode: Full-Width Aktif' : 'Mode: Full-Width Active') : (isId ? 'Mode: Centered Grid' : 'Mode: Centered Grid')}
                </button>
              </div>

              {/* Workspace Layout Switcher */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-1 mb-3">
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-cyan-400" />
                    {isId ? 'Mode Meja Kerja' : 'Workspace Layout'}
                  </span>
                  <p className="text-xs text-slate-400">
                    {isId ? 'Beralih antara Quad-Grid Launchpad atau Alur Bertahap.' : 'Toggle between Multi-Panel Quad-Grid and Stepper.'}
                  </p>
                </div>
                <button
                  onClick={onToggleWorkspaceMode}
                  className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                    workspaceMode === 'launchpad'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {workspaceMode === 'launchpad' ? 'Multi-Panel Quad-Grid' : 'Alur Bertahap (Step-by-Step)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: NOTIFIKASI KANAL & SINYAL (SIGNAL ALERTS & CHANNELS)*/}
      {/* ========================================================= */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-6">
          {/* Status Feedback Notification */}
          {testAlertFeedback && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 animate-fade-in ${
                testAlertFeedback.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{testAlertFeedback.message}</span>
            </div>
          )}

          {/* Master Signal Alert Rules Header */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-base font-bold font-mono text-white mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Kanal Pengiriman Sinyal & Notifikasi Otomatis' : 'Signal Alert Channels & Automated Notifications'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {isId
                ? 'Hubungkan Email, Bot Telegram, dan WhatsApp untuk menerima sinyal konfluensi tinggi (Score >= 80), order flow squeeze, dan eksekusi TP/SL secara instan di mana pun Anda berada.'
                : 'Connect Email, Telegram Bot, and WhatsApp to receive high conviction confluence alerts, order flow squeezes, and trade executions instantly.'}
            </p>

            <div className="space-y-6">
              {/* 1. EMAIL NOTIFICATION CHANNEL */}
              <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold font-mono text-white block">Email Dispatch</span>
                      <span className="text-xs text-slate-400">Pengiriman laporan ringkasan sinyal ke inbox email</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            email: { ...settings.notifications.email, enabled: !settings.notifications.email.enabled },
                          },
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        settings.notifications.email.enabled
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.notifications.email.enabled ? 'TERHUBUNG' : 'NONAKTIF'}
                    </button>

                    <button
                      onClick={() => handleTestAlert('email')}
                      disabled={isTestingAlert || !settings.notifications.email.enabled}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isTestingAlert ? 'Mengirim...' : 'Tes Email'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400">Alamat Email Tujuan:</label>
                    <input
                      type="email"
                      value={settings.notifications.email.target}
                      onChange={(e) =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            email: { ...settings.notifications.email, target: e.target.value },
                          },
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Batas Minimal Skor Konfluensi:</label>
                    <select
                      value={settings.notifications.email.minConfluenceScore}
                      onChange={(e) =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            email: { ...settings.notifications.email, minConfluenceScore: Number(e.target.value) },
                          },
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value={75}>Skor &ge; 75 (Moderate to High)</option>
                      <option value={80}>Skor &ge; 80 (High Conviction Only)</option>
                      <option value={90}>Skor &ge; 90 (Ultra High Conviction)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. TELEGRAM BOT CHANNEL */}
              <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold font-mono text-white block">Telegram Channel / Bot</span>
                      <span className="text-xs text-slate-400">Kirim sinyal langsung ke Grup Telegram atau Chat Pribadi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            telegram: {
                              ...settings.notifications.telegram,
                              enabled: !settings.notifications.telegram.enabled,
                            },
                          },
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        settings.notifications.telegram.enabled
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.notifications.telegram.enabled ? 'TERHUBUNG' : 'NONAKTIF'}
                    </button>

                    <button
                      onClick={() => handleTestAlert('telegram')}
                      disabled={isTestingAlert || !settings.notifications.telegram.enabled}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isTestingAlert ? 'Mengirim...' : 'Tes Telegram'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400">Channel / Chat ID:</label>
                    <input
                      type="text"
                      placeholder="@channel_name atau -100xxx"
                      value={settings.notifications.telegram.chatId || settings.notifications.telegram.target}
                      onChange={(e) =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            telegram: {
                              ...settings.notifications.telegram,
                              chatId: e.target.value,
                              target: e.target.value,
                            },
                          },
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-slate-400">Telegram Bot Token (Opsional / Custom Bot):</label>
                    <input
                      type="password"
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={settings.notifications.telegram.botToken || ''}
                      onChange={(e) =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            telegram: {
                              ...settings.notifications.telegram,
                              botToken: e.target.value,
                            },
                          },
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 3. WHATSAPP ALERT CHANNEL */}
              <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold font-mono text-white block">WhatsApp Signal Alerts</span>
                      <span className="text-xs text-slate-400">Kirim notifikasi instan langsung ke nomor WhatsApp</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            whatsapp: {
                              ...settings.notifications.whatsapp,
                              enabled: !settings.notifications.whatsapp.enabled,
                            },
                          },
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        settings.notifications.whatsapp.enabled
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.notifications.whatsapp.enabled ? 'TERHUBUNG' : 'NONAKTIF'}
                    </button>

                    <button
                      onClick={() => handleTestAlert('whatsapp')}
                      disabled={isTestingAlert || !settings.notifications.whatsapp.enabled}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{isTestingAlert ? 'Mengirim...' : 'Tes WhatsApp'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400">Nomor WhatsApp (+62...):</label>
                    <input
                      type="tel"
                      placeholder="+6281234567890"
                      value={settings.notifications.whatsapp.target}
                      onChange={(e) =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            whatsapp: { ...settings.notifications.whatsapp, target: e.target.value },
                          },
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Kunci API Gateway (Twilio / Green-API):</label>
                    <input
                      type="password"
                      placeholder="API_KEY_SECURE_TOKEN"
                      value={settings.notifications.whatsapp.apiKey || ''}
                      onChange={(e) =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            whatsapp: { ...settings.notifications.whatsapp, apiKey: e.target.value },
                          },
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: INTEGRASI API (EXCHANGE SOURCES & AI MODELS)        */}
      {/* ========================================================= */}
      {activeTab === 'API_INTEGRATIONS' && (
        <div className="space-y-8">
          {/* Section 1: AI Model Engine Configuration */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>{isId ? 'Pilihan Model AI Kuantitatif (Gemini Engine & Segera)' : 'Quantitative AI Models'}</span>
              </h3>
              <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                Google DeepMind GenAI
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              {isId
                ? 'Pilih model kecerdasan buatan untuk mengevaluasi 12 indikator, sintesis narasi order flow, dan deduksi batas risiko invalidasi.'
                : 'Select inference AI models to evaluate indicators, order flow liquidity, and institutional risk plans.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {DEFAULT_AI_MODELS.map((model) => {
                const isSelected = settings.aiIntegrations.selectedAIModel === model.id;
                const isActive = model.status === 'ACTIVE';

                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      if (isActive) {
                        handleUpdateSettings({
                          aiIntegrations: { ...settings.aiIntegrations, selectedAIModel: model.id },
                        });
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all relative ${
                      isActive ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'
                    } ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/40 to-[#070b14] border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                        : isDark
                        ? 'bg-[#070b14] border-[#1e293b] hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          model.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {model.status === 'ACTIVE' ? (isId ? 'AKTIF' : 'ACTIVE') : (isId ? 'SEGERA HADIR' : 'COMING SOON')}
                      </span>

                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>

                    <span className="text-sm font-bold font-mono text-white block">{model.name}</span>
                    <span className="text-[11px] font-mono text-cyan-400 block mb-2">{model.provider}</span>

                    <p className="text-[11px] text-slate-400 leading-tight mb-3 line-clamp-2">
                      {model.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800 text-[10px] font-mono flex items-center justify-between text-slate-400">
                      <span>Speed: <strong className="text-white">{model.speed}</strong></span>
                      <span>Depth: <strong className="text-cyan-300">{model.reasoningDepth.split(' ')[0]}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Reasoning Parameters Slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-700/30 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Tingkat Penalaran (Reasoning Effort):</span>
                  <span className="text-cyan-400 font-bold uppercase">{settings.aiIntegrations.reasoningEffort}</span>
                </div>
                <select
                  value={settings.aiIntegrations.reasoningEffort}
                  onChange={(e) =>
                    handleUpdateSettings({
                      aiIntegrations: { ...settings.aiIntegrations, reasoningEffort: e.target.value as any },
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="low">Low (Fast Scalping Inference)</option>
                  <option value="medium">Medium (Balanced Analysis)</option>
                  <option value="high">High (Full Institutional Deduction)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Temperature (Presisi Kuantitatif):</span>
                  <span className="text-cyan-400 font-bold">{settings.aiIntegrations.aiTemperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.aiIntegrations.aiTemperature}
                  onChange={(e) =>
                    handleUpdateSettings({
                      aiIntegrations: { ...settings.aiIntegrations, aiTemperature: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Exchange API Sources & Sandbox Accounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>{isId ? 'Sumber Bursa & Kunci API (Exchange Integrations)' : 'Exchange API Sources'}</span>
              </h3>
            </div>

            <MyExchangesSettings
              credentials={localCredentials}
              onSaveCredentials={handleSaveCreds}
              theme={theme}
            />
          </div>
        </div>
      )}
    </div>
  );
};
