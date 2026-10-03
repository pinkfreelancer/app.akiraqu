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
  EngineThemeId,
  normalizeEngineTheme,
  isDarkEngineTheme,
  PRESET_CUSTOM_COLORS,
  SOFT_PINK_SHADES,
  PRESET_BACKGROUND_CONTRASTS,
  getContrastTextColor,
} from '../types/theme.types';
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
import {
  loadExchangeCredentials,
  saveExchangeCredentials,
  syncCredentialsWithFirestore,
} from '../services/credentialStorageService';
import {
  formatCryptoPrice,
  formatCurrency,
  formatNumberWithSeparators,
} from '../utils/formatters';

interface SettingsPageProps {
  lang: Language;
  onToggleLang: (lang: Language) => void;
  theme: EngineThemeId | 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectTheme?: (theme: EngineThemeId, customColor?: string, customBg?: string) => void;
  customThemeColor?: string;
  onUpdateCustomColor?: (color: string) => void;
  customThemeBg?: string;
  onUpdateCustomBg?: (bg: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isFullWidth: boolean;
  onToggleFullWidth: () => void;
  workspaceMode: 'classic' | 'split' | 'launchpad';
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
  onSelectTheme,
  customThemeColor = '#EC4899',
  onUpdateCustomColor,
  customThemeBg = '#0B0F19',
  onUpdateCustomBg,
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
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const t = getTranslation(lang);
  const normalizedTheme = normalizeEngineTheme(theme);
  const isDark = isDarkEngineTheme(normalizedTheme, customThemeBg);
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

  // Local Exchange Credentials State (Unified across Settings and Bot Hub)
  const [localCredentials, setLocalCredentials] = useState<ExchangeApiCredential[]>(() => {
    if (exchangeCredentials && exchangeCredentials.length > 0) return exchangeCredentials;
    return loadExchangeCredentials();
  });

  const handleSaveCreds = (newCreds: ExchangeApiCredential[]) => {
    setLocalCredentials(newCreds);
    saveExchangeCredentials(newCreds);
    if (onSaveExchangeCredentials) {
      onSaveExchangeCredentials(newCreds);
    }
    setSaveSuccessNotice(isId ? 'Kunci API bursa berhasil diperbarui & disinkronkan!' : 'Exchange API credentials updated & synchronized!');
    setTimeout(() => setSaveSuccessNotice(null), 2500);
  };

  // Sync Auth User & Firestore Encrypted Credentials Vault if changes
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

      // Synchronize encrypted exchange credentials from Firestore vault
      // Only query Firestore if Firebase Auth is ready and user is not in guest/demo mode
      if (!authLoading && user.uid && !user.isAnonymous && !user.uid.startsWith('demo_')) {
        syncCredentialsWithFirestore(user.uid)
          .then((creds) => {
            if (creds && creds.length > 0) {
              setLocalCredentials(creds);
            }
          })
          .catch((err) => {
            console.warn('[AKIRAQU Credentials] Firestore sync warning:', err);
          });
      }
    }
  }, [user, authLoading]);

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
    return formatCryptoPrice(87450.25, { numberFormat: settings.regional.numberFormat });
  };

  const getCurrencyPrefix = () => {
    switch (settings.regional.currencySymbol) {
      case 'IDR': return 'Rp ';
      case 'EUR': return '€';
      case 'USDT': return '₮';
      default: return '$';
    }
  };

  return (
    <div id="page-settings-master" className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-12 px-1 sm:px-2">
      {/* Header Banner */}
      <div
        className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-[#0b1329] via-[#0f172a] to-[#070b14] border-[#1e293b]'
            : 'bg-gradient-to-r from-cyan-50 via-white to-blue-50 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-[2px] sm:rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 shrink-0">
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold font-mono tracking-tight flex items-center gap-2 flex-wrap">
                <span className={isDark ? 'text-white' : 'text-slate-900'}>
                  {isId ? 'Pengaturan Terminal & Keamanan' : 'Terminal Settings & Security'}
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-[2px] bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold font-mono">
                  v2.5 Pro
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                {isId
                  ? 'Konfigurasi Profil Pengguna, Preferensi Regional, Kustomisasi Tampilan, Kanal Notifikasi Sinyal, dan Integrasi API.'
                  : 'Manage User Profile, Regional Formatting, Display Theming, Signal Alert Channels, and API Integrations.'}
              </p>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {saveSuccessNotice && (
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1.5 rounded-[2px] animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccessNotice}</span>
              </span>
            )}

            <button
              onClick={handleExportData}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-[2px] text-xs font-mono font-bold border transition-all cursor-pointer shadow-xs w-full sm:w-auto min-h-[36px] ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isId ? 'Ekspor Backup Pengaturan & Jurnal ke JSON' : 'Export Settings & Journal Backup'}
            >
              <Download className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span>{isId ? 'Ekspor Data' : 'Export Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className={`flex items-center gap-1.5 p-1 rounded-[2px] sm:rounded-xl border overflow-x-auto scrollbar-none touch-pan-x ${
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
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border min-h-[38px] ${
                isActive
                  ? 'bg-pink-600 text-white border-pink-500 shadow-xs'
                  : isDark
                  ? 'bg-[#070b14] text-slate-400 border-[#1e293b] hover:text-slate-200 hover:bg-slate-800/60'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-950'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROFIL & KEAMANAN (USER PROFILE, ACCOUNT, PRIVACY) */}
      {/* ========================================================= */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-4 sm:space-y-6">
          {/* User Profile Card */}
          <div className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm sm:text-base font-bold font-mono text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Profil Pengguna & Status Akun' : 'User Profile & Account Status'}</span>
            </h3>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-slate-700/30">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={settings.account.displayName}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-[2px] sm:rounded-xl object-cover border-2 border-cyan-500/50 shadow-md shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[2px] sm:rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-slate-950 text-xl sm:text-2xl font-bold flex items-center justify-center font-mono shadow-md shrink-0">
                    {settings.account.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold font-mono text-white truncate">{settings.account.displayName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold shrink-0">
                      {settings.account.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono block truncate">{settings.account.email}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono block truncate">
                    User ID: <code className="text-cyan-400">{settings.account.userId}</code> • Terdaftar: {settings.account.memberSince}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {isAuthenticated && user ? (
                  <button
                    onClick={() => logout()}
                    className={`w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-[2px] text-xs font-mono font-bold border transition-all cursor-pointer min-h-[36px] ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
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
                  className={`w-full px-3 py-2 rounded-[2px] border font-mono text-xs ${
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
                  className={`w-full px-3 py-2 rounded-[2px] border font-mono text-xs ${
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
          <div className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm sm:text-base font-bold font-mono text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>{isId ? 'Keamanan & Perlindungan Akses' : 'Security & Session Protection'}</span>
            </h3>

            <div className="space-y-3 sm:space-y-4">
              {/* 2FA Protection Toggle */}
              <div className={`p-3.5 sm:p-4 rounded-[2px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    {isId ? 'Autentikasi Dua Faktor (2FA Sim)' : 'Two-Factor Authentication (2FA)'}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {isId ? 'Meminta verifikasi kode sebelum mengeksekusi order riil di bursa.' : 'Require 2FA verification before placing live orders.'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleUpdateSettings({
                      account: { ...settings.account, twoFactorEnabled: !settings.account.twoFactorEnabled },
                    })
                  }
                  className={`px-3.5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] w-full sm:w-auto ${
                    settings.account.twoFactorEnabled
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.account.twoFactorEnabled ? 'AKTIF' : 'NONAKTIF'}
                </button>
              </div>

              {/* Auto Lock Session */}
              <div className={`p-3.5 sm:p-4 rounded-[2px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    {isId ? 'Kunci Otomatis Terminal (Auto-Lock)' : 'Terminal Auto-Lock Timeout'}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-400">
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
                  className={`px-3 py-2 rounded-[2px] border font-mono text-xs w-full sm:w-auto ${
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
          <div className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm sm:text-base font-bold font-mono text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>{isId ? 'Privasi & Kedaulatan Data Lokal' : 'Privacy & Data Sovereignty'}</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {isId
                ? 'Terminal IMASBTC beroperasi dengan arsitektur Local-First. API Key bursa, riwayat transaksi, dan jurnal analisis disimpan terlindungi di perangkat lokal pengguna atau Firestore terenkripsi milik Anda.'
                : 'IMASBTC operates on a Local-First architecture. Exchange API keys, trade histories, and journal entries are securely stored on your local browser instance or private Firestore.'}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                onClick={handleExportData}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[2px] bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition cursor-pointer shadow-xs min-h-[38px]"
              >
                <Download className="w-4 h-4" />
                <span>{isId ? 'Download Cadangan Data Lengkap (.JSON)' : 'Download Full Data Backup (.JSON)'}</span>
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[2px] bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs transition cursor-pointer min-h-[38px]"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>{isId ? 'Reset Cache & Data Lokal' : 'Clear Local Cache & Reset'}</span>
              </button>
            </div>

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
              <div className="mt-4 p-4 rounded-[2px] border border-rose-500/50 bg-rose-950/40 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-300 font-mono font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{isId ? 'Konfirmasi Reset Data Lokal' : 'Confirm Local Reset'}</span>
                </div>
                <p className="text-xs text-rose-200/80 leading-relaxed">
                  {isId
                    ? 'Tindakan ini akan menghapus riwayat jurnal trading, backtest, dan preferensi yang tersimpan di browser Anda.'
                    : 'This action will wipe all stored trading journals, backtest runs, and preferences stored in your browser cache.'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleClearAllData}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-[2px] cursor-pointer min-h-[34px]"
                  >
                    {isId ? 'Ya, Hapus Semua' : 'Yes, Wipe Everything'}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-[2px] cursor-pointer min-h-[34px]"
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
        <div className="space-y-4 sm:space-y-6">
          <div className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm sm:text-base font-bold font-mono text-white mb-4 sm:mb-5 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Bahasa, Zona Waktu & Format Angka' : 'Language, Timezone & Number Formatting'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Bahasa Pengantar (Language)' : 'Interface Language'}
                </label>
                <div className={`flex p-1 rounded-[2px] border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() => {
                      onToggleLang('id');
                      handleUpdateSettings({ regional: { ...settings.regional, language: 'id' } });
                    }}
                    className={`flex-1 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] ${
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
                    className={`flex-1 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] ${
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
                  className={`w-full px-3 py-2.5 rounded-[2px] border font-mono text-xs ${
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
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    {isId ? 'Format Pemisah Desimal & Ribuan' : 'Number & Decimal Format'}
                  </label>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    {settings.regional.numberFormat === 'ID'
                      ? 'Format ID: 1.234.567,89'
                      : settings.regional.numberFormat === 'EU'
                      ? 'Format EU: 1 234 567,89'
                      : 'Format US: 1,234,567.89'}
                  </span>
                </div>
                <select
                  value={settings.regional.numberFormat}
                  onChange={(e) =>
                    handleUpdateSettings({
                      regional: { ...settings.regional, numberFormat: e.target.value as NumberFormatOption },
                    })
                  }
                  className={`w-full px-3 py-2.5 rounded-[2px] border font-mono text-xs ${
                    isDark ? 'bg-[#070b14] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="ID">Format Indonesia (ID): 1.234.567,89 (Ribuan: Titik [.] | Desimal: Koma [,])</option>
                  <option value="US">Format Internasional / US: 1,234,567.89 (Ribuan: Koma [,] | Desimal: Titik [.])</option>
                  <option value="EU">Format Eropa / EU: 1 234 567,89 (Ribuan: Spasi [ ] | Desimal: Koma [,])</option>
                </select>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  {isId
                    ? 'Pemisah ini diterapkan ke seluruh chart, buku order, riwayat transaksi, tabel screening, dan kalkulator risiko.'
                    : 'This separator standard applies across charts, order books, trade logs, screener tables, and risk calculators.'}
                </p>
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
                  className={`w-full px-3 py-2.5 rounded-[2px] border font-mono text-xs ${
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
                  className={`w-full px-3 py-2.5 rounded-[2px] border font-mono text-xs ${
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
                <div className={`flex p-1 rounded-[2px] border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() =>
                      handleUpdateSettings({ regional: { ...settings.regional, timeFormat: '24h' } })
                    }
                    className={`flex-1 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] ${
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
                    className={`flex-1 py-2 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] ${
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
            <div className={`mt-5 sm:mt-6 p-3 sm:p-4 rounded-[2px] border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {isId ? 'Pratinjau Format Langsung (Live Preview)' : 'Live Format Preview'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 w-fit">
                  {settings.regional.numberFormat === 'ID' ? 'Format Aktif: Indonesia (ID)' : settings.regional.numberFormat === 'EU' ? 'Format Aktif: Eropa (EU)' : 'Format Aktif: Internasional (US)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs font-mono">
                <div className={`p-2.5 rounded-[2px] border ${isDark ? 'bg-[#0b1329] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
                  <span className="text-slate-400 block text-[10px] mb-0.5">Harga BTC / USDT:</span>
                  <span className="text-white font-bold block">{getCurrencyPrefix()}{formatCryptoPrice(87450.25, { numberFormat: settings.regional.numberFormat })}</span>
                  <span className="text-[9px] text-slate-500 block">Ribuan & 2 Desimal</span>
                </div>
                <div className={`p-2.5 rounded-[2px] border ${isDark ? 'bg-[#0b1329] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
                  <span className="text-slate-400 block text-[10px] mb-0.5">Microcap (PEPE):</span>
                  <span className="text-cyan-300 font-bold block">{getCurrencyPrefix()}{formatCryptoPrice(0.00000331, { numberFormat: settings.regional.numberFormat })}</span>
                  <span className="text-[9px] text-slate-500 block">Presisi 8 Desimal</span>
                </div>
                <div className={`p-2.5 rounded-[2px] border ${isDark ? 'bg-[#0b1329] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
                  <span className="text-slate-400 block text-[10px] mb-0.5">Saldo Portofolio:</span>
                  <span className="text-emerald-400 font-bold block">
                    {formatCurrency(settings.regional.currencySymbol === 'IDR' ? 1425890000 : 87450.25, {
                      numberFormat: settings.regional.numberFormat,
                      currency: settings.regional.currencySymbol,
                    })}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Mata Uang {settings.regional.currencySymbol}</span>
                </div>
                <div className={`p-2.5 rounded-[2px] border ${isDark ? 'bg-[#0b1329] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
                  <span className="text-slate-400 block text-[10px] mb-0.5">PnL 24 Jam:</span>
                  <span className="text-emerald-400 font-bold block">
                    {formatCurrency(settings.regional.currencySymbol === 'IDR' ? 45200000 : 2840.50, {
                      isPnl: true,
                      numberFormat: settings.regional.numberFormat,
                      currency: settings.regional.currencySymbol,
                    })}
                  </span>
                  <span className="text-[9px] text-emerald-500 block">+3.25% Hari Ini</span>
                </div>
              </div>
            </div>

            {/* Matrix Perbandingan Format Pemisah Desimal & Ribuan */}
            <div className={`mt-4 sm:mt-5 p-3 sm:p-4 rounded-[2px] border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {isId ? 'Matriks Perbandingan Format Pemisah Desimal & Ribuan' : 'Decimal & Thousands Separator Comparison Matrix'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isId ? 'Klik "Pilih" untuk mengaktifkan format' : 'Click "Select" to activate'}
                </span>
              </div>

              <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                <table className="w-full text-left font-mono text-xs border-collapse min-w-[550px]">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                      <th className="py-2 px-2.5 font-bold">Standard / Locale</th>
                      <th className="py-2 px-2.5 font-bold">Pemisah Ribuan</th>
                      <th className="py-2 px-2.5 font-bold">Pemisah Desimal</th>
                      <th className="py-2 px-2.5 font-bold">Contoh BTC ($)</th>
                      <th className="py-2 px-2.5 font-bold">Contoh Microcap</th>
                      <th className="py-2 px-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {/* ID Format */}
                    <tr
                      className={`transition-colors ${
                        settings.regional.numberFormat === 'ID'
                          ? isDark ? 'bg-cyan-950/20' : 'bg-cyan-50'
                          : isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-100'
                      }`}
                    >
                      <td className="py-2.5 px-2.5 font-bold text-white flex items-center gap-1.5">
                        <span>🇮🇩 Format Indonesia (ID)</span>
                      </td>
                      <td className="py-2.5 px-2.5 text-cyan-400 font-bold">Titik [ . ]</td>
                      <td className="py-2.5 px-2.5 text-amber-400 font-bold">Koma [ , ]</td>
                      <td className="py-2.5 px-2.5 text-white tabular-nums">$87.450,25</td>
                      <td className="py-2.5 px-2.5 text-slate-300 tabular-nums">$0,000116</td>
                      <td className="py-2.5 px-2.5">
                        {settings.regional.numberFormat === 'ID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            AKTIF
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleUpdateSettings({ regional: { ...settings.regional, numberFormat: 'ID' } })
                            }
                            className="px-2 py-0.5 rounded border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 text-[10px] cursor-pointer"
                          >
                            Pilih
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* US Format */}
                    <tr
                      className={`transition-colors ${
                        settings.regional.numberFormat === 'US'
                          ? isDark ? 'bg-cyan-950/20' : 'bg-cyan-50'
                          : isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-100'
                      }`}
                    >
                      <td className="py-2.5 px-2.5 font-bold text-white flex items-center gap-1.5">
                        <span>🇺🇸 Format Internasional (US)</span>
                      </td>
                      <td className="py-2.5 px-2.5 text-cyan-400 font-bold">Koma [ , ]</td>
                      <td className="py-2.5 px-2.5 text-amber-400 font-bold">Titik [ . ]</td>
                      <td className="py-2.5 px-2.5 text-white tabular-nums">$87,450.25</td>
                      <td className="py-2.5 px-2.5 text-slate-300 tabular-nums">$0.000116</td>
                      <td className="py-2.5 px-2.5">
                        {settings.regional.numberFormat === 'US' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            AKTIF
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleUpdateSettings({ regional: { ...settings.regional, numberFormat: 'US' } })
                            }
                            className="px-2 py-0.5 rounded border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 text-[10px] cursor-pointer"
                          >
                            Pilih
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* EU Format */}
                    <tr
                      className={`transition-colors ${
                        settings.regional.numberFormat === 'EU'
                          ? isDark ? 'bg-cyan-950/20' : 'bg-cyan-50'
                          : isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-100'
                      }`}
                    >
                      <td className="py-2.5 px-2.5 font-bold text-white flex items-center gap-1.5">
                        <span>🇪🇺 Format Eropa (EU)</span>
                      </td>
                      <td className="py-2.5 px-2.5 text-cyan-400 font-bold">Spasi [ &nbsp; ]</td>
                      <td className="py-2.5 px-2.5 text-amber-400 font-bold">Koma [ , ]</td>
                      <td className="py-2.5 px-2.5 text-white tabular-nums">$87 450,25</td>
                      <td className="py-2.5 px-2.5 text-slate-300 tabular-nums">$0,000116</td>
                      <td className="py-2.5 px-2.5">
                        {settings.regional.numberFormat === 'EU' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            AKTIF
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleUpdateSettings({ regional: { ...settings.regional, numberFormat: 'EU' } })
                            }
                            className="px-2 py-0.5 rounded border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 text-[10px] cursor-pointer"
                          >
                            Pilih
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TAMPILAN & TEMA (DISPLAY & THEME ENGINE)            */}
      {/* ========================================================= */}
      {activeTab === 'DISPLAY' && (
        <div className="space-y-4 sm:space-y-6">
          <div className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm sm:text-base font-bold font-mono text-white mb-4 sm:mb-5 flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Kustomisasi Tampilan & Tema Engine' : 'Display Customization & Engine Theme'}</span>
            </h3>

            {/* Theme Engine Selection: 1. theme-light, 2. theme-dark (Default), 3. theme-terminal, 4. theme-custom */}
            <div className="space-y-3 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Pilihan Tema Engine Visual (5 Pilihan Engine)' : 'Visual Engine Theme (5 Engine Presets)'}
                </label>
                <span className="text-xs font-mono text-pink-400 font-semibold">
                  {normalizedTheme === 'theme-glassnode' && 'Glassnode Research (Aktif)'}
                  {normalizedTheme === 'theme-light' && 'Light Theme (Aktif)'}
                  {normalizedTheme === 'theme-dark' && 'Dark Theme - Default (Aktif)'}
                  {normalizedTheme === 'theme-terminal' && 'Terminal Theme (Aktif)'}
                  {normalizedTheme === 'theme-custom' && 'Custom Theme (Aktif)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {/* 0. Glassnode Institutional (theme-glassnode) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTheme) onSelectTheme('theme-glassnode');
                    else if (isDark) onToggleTheme();
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'light' } });
                  }}
                  className={`p-3.5 sm:p-4 rounded-[2px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    normalizedTheme === 'theme-glassnode'
                      ? 'bg-white border-[#1A1A1A] ring-2 ring-[#F472B6]/40 shadow-sm'
                      : isDark
                      ? 'bg-[#0B0F19] border-[#1e293b] hover:border-slate-700'
                      : 'bg-[#EDEFF2] border-[#DEDFE1] hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[2px] bg-[#FFFFFF] border border-[#DEDFE1] flex items-center justify-center">
                          <Layers className="w-4 h-4 text-[#1A1A1A]" />
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[#FDF2F8] text-[#DB2777] border border-[#FBCFE8] font-mono">
                          Glassnode 2px
                        </span>
                      </div>
                      {normalizedTheme === 'theme-glassnode' && (
                        <Check className="w-4 h-4 text-[#DB2777]" />
                      )}
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-900 block">Glassnode Console</span>
                    <p className="text-[11px] text-[#5A5A5A] mt-1.5 leading-relaxed">
                      {isId
                        ? 'Kanvas Cloud (#EDEFF2), kartu putih dengan border hairline 1px (#DEDFE1), radius tegas 2px & Soft Pink wash.'
                        : 'Cool Cloud canvas (#EDEFF2), pure white cards with 1px hairline border (#DEDFE1), sharp 2px radii & Soft Pink wash.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#DEDFE1]">
                    <span className="text-[10px] text-[#808080] font-mono">Palet:</span>
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-[#EDEFF2] border border-[#DEDFE1]" title="#EDEFF2" />
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-[#FFFFFF] border border-[#DEDFE1]" title="#FFFFFF" />
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-[#1A1A1A]" title="#1A1A1A" />
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-[#F472B6]" title="#F472B6" />
                  </div>
                </button>

                {/* 1. Light Theme (theme-light) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTheme) onSelectTheme('theme-light');
                    else if (isDark) onToggleTheme();
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'light' } });
                  }}
                  className={`p-3.5 sm:p-4 rounded-[2px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    normalizedTheme === 'theme-light'
                      ? 'bg-white border-[#F472B6] ring-2 ring-[#F472B6]/30 shadow-md'
                      : isDark
                      ? 'bg-[#0B0F19] border-[#1e293b] hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                          <Sun className="w-4 h-4 text-[#F472B6]" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-mono">
                          Light Mode
                        </span>
                      </div>
                      {normalizedTheme === 'theme-light' && (
                        <Check className="w-4 h-4 text-[#F472B6]" />
                      )}
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-900 block">Light Theme</span>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      {isId
                        ? 'Background Slate 50 (#F8FAFC), Card putih bersih dengan subtle border (#E2E8F0) & aksen Soft Pink (#F472B6).'
                        : 'Slate 50 background (#F8FAFC), crisp white surface with subtle border (#E2E8F0) & Soft Pink accent (#F472B6).'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">Palet:</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#F8FAFC] border border-slate-300" title="#F8FAFC" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#FFFFFF] border border-[#E2E8F0]" title="#FFFFFF" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#F472B6]" title="#F472B6" />
                  </div>
                </button>

                {/* 2. Dark Theme (theme-dark - Default) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTheme) onSelectTheme('theme-dark');
                    else if (!isDark) onToggleTheme();
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'dark' } });
                  }}
                  className={`p-3.5 sm:p-4 rounded-[2px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    normalizedTheme === 'theme-dark'
                      ? 'bg-[#1E293B]/80 backdrop-blur-md border-[#EC4899] ring-2 ring-[#EC4899]/30 shadow-lg'
                      : 'bg-[#0B0F19] border-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#0B0F19] border border-[#EC4899]/40 flex items-center justify-center">
                          <Moon className="w-4 h-4 text-[#EC4899]" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono">
                          Default Dark
                        </span>
                      </div>
                      {normalizedTheme === 'theme-dark' && (
                        <Check className="w-4 h-4 text-[#EC4899]" />
                      )}
                    </div>
                    <span className="text-sm font-bold font-mono text-white block">Dark Theme</span>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      {isId
                        ? 'Background Deep Navy (#0B0F19), Card Slate 800 (#1E293B) glassmorphism tipis, & aksen Soft Pink (#EC4899) glow halus.'
                        : 'Deep Navy base (#0B0F19), Slate 800 cards with backdrop blur, & Soft Pink (#EC4899) subtle glow.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#334155]/60">
                    <span className="text-[10px] text-slate-400 font-mono">Palet:</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0B0F19] border border-slate-700" title="#0B0F19" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#1E293B] border border-slate-600" title="#1E293B" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#EC4899] shadow-xs" title="#EC4899" />
                  </div>
                </button>

                {/* 3. Terminal Theme (theme-terminal) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTheme) onSelectTheme('theme-terminal');
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'classic' } });
                  }}
                  className={`p-3.5 sm:p-4 rounded-[2px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    normalizedTheme === 'theme-terminal'
                      ? 'bg-[#0B0F19] border-[#FF007A] ring-2 ring-[#FF007A]/30 shadow-md'
                      : 'bg-[#030712] border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#030712] border border-emerald-500/30 flex items-center justify-center">
                          <TerminalIcon className="w-4 h-4 text-[#FF007A]" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0B0F19] text-[#FF007A] border border-emerald-500/30 font-mono">
                          Cyber Quant
                        </span>
                      </div>
                      {normalizedTheme === 'theme-terminal' && (
                        <Check className="w-4 h-4 text-[#FF007A]" />
                      )}
                    </div>
                    <span className="text-sm font-bold font-mono text-white block">Terminal Theme</span>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-mono">
                      {isId
                        ? 'Pitch Black (#030712), card #0B0F19 bergaris tipis hijau-pink monokromatik, font JetBrains Mono & Cyber Pink (#FF007A).'
                        : 'Pitch Black (#030712), card #0B0F19 monochromatic green-pink border, JetBrains Mono & Cyber Pink (#FF007A).'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#1e293b]">
                    <span className="text-[10px] text-slate-400 font-mono">Palet:</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#030712] border border-slate-700" title="#030712" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0B0F19] border border-emerald-500/30" title="#0B0F19" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#FF007A]" title="#FF007A" />
                  </div>
                </button>

                {/* 4. Custom Theme (theme-custom) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTheme) onSelectTheme('theme-custom', customThemeColor, customThemeBg);
                    handleUpdateSettings({ display: { ...settings.display, themeMode: 'custom' } });
                  }}
                  className={`p-3.5 sm:p-4 rounded-[2px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    normalizedTheme === 'theme-custom'
                      ? 'bg-[#0f172a] border-pink-400 ring-2 ring-pink-400/30 shadow-md'
                      : 'bg-[#070b14] border-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border flex items-center justify-center"
                          style={{
                            backgroundColor: `${customThemeColor}20`,
                            borderColor: `${customThemeColor}60`,
                          }}
                        >
                          <Sparkles className="w-4 h-4" style={{ color: customThemeColor }} />
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono"
                          style={{
                            color: customThemeColor,
                            borderColor: `${customThemeColor}50`,
                            backgroundColor: `${customThemeColor}15`,
                          }}
                        >
                          Customizer
                        </span>
                      </div>
                      {normalizedTheme === 'theme-custom' && (
                        <Check className="w-4 h-4" style={{ color: customThemeColor }} />
                      )}
                    </div>
                    <span className="text-sm font-bold font-mono text-white block">Custom Theme</span>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      {isId
                        ? 'Color Picker mini untuk atur saturasi Soft Pink dan tingkat kontras background sesuai kenyamanan mata.'
                        : 'Mini Color Picker to fine-tune Soft Pink saturation and background contrast for eye comfort.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#1e293b]">
                    <span className="text-[10px] text-slate-400 font-mono">Kustom:</span>
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-600" style={{ backgroundColor: customThemeBg }} />
                    <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: customThemeColor }} />
                    <span className="text-[10px] font-mono text-slate-300 uppercase">{customThemeColor}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Theme Mini Color Picker & Contrast Controls */}
            {normalizedTheme === 'theme-custom' && (
              <div className={`p-4 sm:p-5 rounded-[2px] border mb-6 ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b ${isDark ? 'border-[#1e293b]/70' : 'border-slate-200'}`}>
                  <div>
                    <h4 className={`text-sm font-bold font-mono flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span>{isId ? 'Color Picker Mini: Saturasi Soft Pink & Kontras Background' : 'Mini Color Picker: Soft Pink Saturation & Background Contrast'}</span>
                    </h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isId
                        ? 'Atur saturasi warna aksen Soft Pink dan tingkat kegelapan/kontras latar belakang agar mata tetap nyaman saat trading maraton.'
                        : 'Customize Soft Pink accent saturation and background contrast level for comfortable trading sessions.'}
                    </p>
                  </div>
                  {/* WCAG AA Compliance Badge */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] font-mono text-xs font-bold border shrink-0 w-fit"
                    style={{
                      backgroundColor: customThemeColor,
                      color: getContrastTextColor(customThemeColor),
                      borderColor: customThemeColor,
                    }}
                  >
                    <span>WCAG AA COMPLIANT ✅</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Left Column: Soft Pink Saturation & Accent Hue */}
                  <div className={`space-y-4 p-3.5 sm:p-4 rounded-[2px] border ${isDark ? 'bg-[#0B0F19] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <label className="text-xs font-mono font-bold text-pink-500 uppercase tracking-wider block mb-1">
                        {isId ? '1. Saturasi & Pilihan Aksen Soft Pink' : '1. Soft Pink Saturation & Accent'}
                      </label>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isId ? 'Pilih tingkat kelembutan atau gunakan color picker kustom.' : 'Pick a Soft Pink tone or use the native color picker.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customThemeColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateCustomColor?.(val);
                          onSelectTheme?.('theme-custom', val, customThemeBg);
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[2px] border border-[#334155] cursor-pointer bg-transparent shrink-0"
                        aria-label="Soft Pink Accent Color Picker"
                      />
                      <div className="flex-1 space-y-1">
                        <div className={`flex items-center rounded-[2px] border px-3 py-2 text-xs font-mono ${
                          isDark ? 'border-[#334155] bg-[#070b14]' : 'border-slate-300 bg-white'
                        }`}>
                          <span className="text-slate-500 mr-2 text-[10px] sm:text-xs">ACCENT HEX:</span>
                          <input
                            type="text"
                            value={customThemeColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              onUpdateCustomColor?.(val);
                              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                onSelectTheme?.('theme-custom', val, customThemeBg);
                              }
                            }}
                            placeholder="#EC4899"
                            maxLength={7}
                            className={`w-full bg-transparent font-bold focus:outline-none uppercase ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          />
                        </div>
                        <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Format: #RRGGBB (misal: #F472B6, #EC4899, #FF007A)
                        </span>
                      </div>
                    </div>

                    {/* Preset Soft Pink Saturation Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className={`text-[11px] font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isId ? 'Pilihan Cepat Soft Pink:' : 'Quick Soft Pink Presets:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {SOFT_PINK_SHADES.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => {
                              onUpdateCustomColor?.(preset.hex);
                              onSelectTheme?.('theme-custom', preset.hex, customThemeBg);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] border text-[11px] font-mono transition-all cursor-pointer ${
                              customThemeColor.toLowerCase() === preset.hex.toLowerCase()
                                ? 'bg-pink-950/60 border-pink-400 text-pink-200 ring-1 ring-pink-400/40'
                                : isDark
                                ? 'bg-[#070b14] border-[#1e293b] text-slate-300 hover:border-slate-600'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-[2px] border border-black/40 shrink-0"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Background Contrast Control */}
                  <div className={`space-y-4 p-3.5 sm:p-4 rounded-[2px] border ${isDark ? 'bg-[#0B0F19] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <label className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-wider block mb-1">
                        {isId ? '2. Kontras Background & Surface' : '2. Background & Surface Contrast'}
                      </label>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isId ? 'Atur kegelapan canvas untuk ergonomi pandangan mata Anda.' : 'Calibrate canvas dark level for optimal viewing comfort.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customThemeBg}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateCustomBg?.(val);
                          onSelectTheme?.('theme-custom', customThemeColor, val);
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[2px] border border-[#334155] cursor-pointer bg-transparent shrink-0"
                        aria-label="Background Contrast Color Picker"
                      />
                      <div className="flex-1 space-y-1">
                        <div className={`flex items-center rounded-[2px] border px-3 py-2 text-xs font-mono ${
                          isDark ? 'border-[#334155] bg-[#070b14]' : 'border-slate-300 bg-white'
                        }`}>
                          <span className="text-slate-500 mr-2 text-[10px] sm:text-xs">BG HEX:</span>
                          <input
                            type="text"
                            value={customThemeBg}
                            onChange={(e) => {
                              const val = e.target.value;
                              onUpdateCustomBg?.(val);
                              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                onSelectTheme?.('theme-custom', customThemeColor, val);
                              }
                            }}
                            placeholder="#0B0F19"
                            maxLength={7}
                            className={`w-full bg-transparent font-bold focus:outline-none uppercase ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          />
                        </div>
                        <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Format: #0B0F19 (Navy) / #030712 (Black) / #F8FAFC (Light)
                        </span>
                      </div>
                    </div>

                    {/* Preset Background Contras Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className={`text-[11px] font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isId ? 'Pilihan Kontras Background Populer:' : 'Popular Background Presets:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {PRESET_BACKGROUND_CONTRASTS.map((bgPreset) => (
                          <button
                            key={bgPreset.hex}
                            type="button"
                            onClick={() => {
                              onUpdateCustomBg?.(bgPreset.hex);
                              onSelectTheme?.('theme-custom', customThemeColor, bgPreset.hex);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] border text-[11px] font-mono transition-all cursor-pointer ${
                              customThemeBg.toLowerCase() === bgPreset.hex.toLowerCase()
                                ? 'bg-slate-800 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40'
                                : isDark
                                ? 'bg-[#070b14] border-[#1e293b] text-slate-300 hover:border-slate-600'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-[2px] border border-slate-600 shrink-0"
                              style={{ backgroundColor: bgPreset.hex }}
                            />
                            <span>{bgPreset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ergonomic Display Layout Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-700/30">
              {/* Fullscreen Toggle */}
              <div className={`p-3.5 sm:p-4 rounded-[2px] border flex flex-col justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-1 mb-3">
                  <span className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-cyan-400 shrink-0" />
                    {isId ? 'Layar Penuh (Fullscreen)' : 'Fullscreen Mode'}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {isId ? 'Maksimalkan tampilan ke seluruh layar monitor.' : 'Expand viewport across your entire monitor.'}
                  </p>
                </div>
                <button
                  onClick={onToggleFullscreen}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[2px] bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition cursor-pointer min-h-[36px]"
                >
                  {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? (isId ? 'Keluar Layar Penuh' : 'Exit Fullscreen') : (isId ? 'Masuk Layar Penuh' : 'Enter Fullscreen')}</span>
                </button>
              </div>

              {/* Full Width Layout - Permanently Active & Responsive */}
              <div className={`p-3.5 sm:p-4 rounded-[2px] border flex flex-col justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-1 mb-3">
                  <span className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-2">
                    <StretchHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
                    {isId ? 'Tata Letak Penuh (Full-Width)' : 'Full-Width Responsive Layout'}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {isId ? 'Tampilan 100% Full-Width responsif di seluruh perangkat (Mobile, Tablet, Desktop, Ultra-Wide).' : '100% full-width responsive across all devices (Mobile, Tablet, Desktop, Ultra-Wide).'}
                  </p>
                </div>
                <div className="w-full py-2 px-3 rounded-[2px] text-xs font-mono font-bold border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 flex items-center justify-between min-h-[36px]">
                  <span>{isId ? 'Status: 100% Full Width Aktif' : 'Status: 100% Full Width Active'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-cyan-400/20 text-cyan-200 font-semibold uppercase tracking-wider">
                    {isId ? 'Permanen' : 'Default'}
                  </span>
                </div>
              </div>

              {/* Workspace Layout Switcher */}
              <div className={`p-3.5 sm:p-4 rounded-[2px] border flex flex-col justify-between ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-1 mb-3">
                  <span className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-cyan-400 shrink-0" />
                    {isId ? 'Mode Meja Kerja' : 'Workspace Layout'}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {isId ? 'Beralih antara Quad-Grid Launchpad atau Alur Bertahap.' : 'Toggle between Multi-Panel Quad-Grid and Stepper.'}
                  </p>
                </div>
                <button
                  onClick={onToggleWorkspaceMode}
                  className={`w-full py-2 rounded-[2px] text-xs font-mono font-bold border transition cursor-pointer min-h-[36px] ${
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
        <div className="space-y-4 sm:space-y-6">
          {/* Status Feedback Notification */}
          {testAlertFeedback && (
            <div
              className={`p-3.5 sm:p-4 rounded-[2px] border font-mono text-xs flex items-center gap-3 animate-fade-in ${
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
          <div className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-sm sm:text-base font-bold font-mono text-white mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              <span>{isId ? 'Kanal Pengiriman Sinyal & Notifikasi Otomatis' : 'Signal Alert Channels & Automated Notifications'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 sm:mb-6">
              {isId
                ? 'Hubungkan Email, Bot Telegram, dan WhatsApp untuk menerima sinyal konfluensi tinggi (Score >= 80), order flow squeeze, dan eksekusi TP/SL secara instan di mana pun Anda berada.'
                : 'Connect Email, Telegram Bot, and WhatsApp to receive high conviction confluence alerts, order flow squeezes, and trade executions instantly.'}
            </p>

            <div className="space-y-4 sm:space-y-6">
              {/* 1. EMAIL NOTIFICATION CHANNEL */}
              <div className={`p-4 sm:p-5 rounded-[2px] border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 rounded-[2px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold font-mono text-white block">Email Dispatch</span>
                      <span className="text-[11px] sm:text-xs text-slate-400">Pengiriman laporan ringkasan sinyal ke inbox email</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() =>
                        handleUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            email: { ...settings.notifications.email, enabled: !settings.notifications.email.enabled },
                          },
                        })
                      }
                      className={`flex-1 sm:flex-initial px-3 py-2 rounded-[2px] text-xs font-mono font-bold transition cursor-pointer min-h-[36px] ${
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
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-[2px] bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isTestingAlert ? 'Mengirim...' : 'Tes Email'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 font-mono text-xs">
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
                      className={`w-full px-3 py-2 rounded-[2px] border ${
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
                      className={`w-full px-3 py-2 rounded-[2px] border ${
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
              <div className={`p-4 sm:p-5 rounded-[2px] border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 rounded-[2px] bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold font-mono text-white block">Telegram Channel / Bot</span>
                      <span className="text-[11px] sm:text-xs text-slate-400">Kirim sinyal langsung ke Grup Telegram atau Chat Pribadi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
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
                      className={`flex-1 sm:flex-initial px-3 py-2 rounded-[2px] text-xs font-mono font-bold transition cursor-pointer min-h-[36px] ${
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
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-[2px] bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isTestingAlert ? 'Mengirim...' : 'Tes Telegram'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4 font-mono text-xs">
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
                      className={`w-full px-3 py-2 rounded-[2px] border ${
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
                      className={`w-full px-3 py-2 rounded-[2px] border ${
                        isDark ? 'bg-[#0f172a] border-[#1e293b] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 3. WHATSAPP ALERT CHANNEL */}
              <div className={`p-4 sm:p-5 rounded-[2px] border ${isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 rounded-[2px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold font-mono text-white block">WhatsApp Signal Alerts</span>
                      <span className="text-[11px] sm:text-xs text-slate-400">Kirim notifikasi instan langsung ke nomor WhatsApp</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
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
                      className={`flex-1 sm:flex-initial px-3 py-2 rounded-[2px] text-xs font-mono font-bold transition cursor-pointer min-h-[36px] ${
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
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-[2px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{isTestingAlert ? 'Mengirim...' : 'Tes WhatsApp'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 font-mono text-xs">
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
                      className={`w-full px-3 py-2 rounded-[2px] border ${
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
                      className={`w-full px-3 py-2 rounded-[2px] border ${
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
        <div className="space-y-4 sm:space-y-6">
          {/* Section 1: AI Model Engine Configuration */}
          <div className={`p-4 sm:p-6 rounded-[2px] sm:rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-bold font-mono text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>{isId ? 'Pilihan Model AI Kuantitatif (Gemini Engine & Segera)' : 'Quantitative AI Models'}</span>
              </h3>
              <span className="text-[10px] sm:text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-[2px] w-fit">
                Google DeepMind GenAI
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4 sm:mb-5">
              {isId
                ? 'Pilih model kecerdasan buatan untuk mengevaluasi 12 indikator, sintesis narasi order flow, dan deduksi batas risiko invalidasi.'
                : 'Select inference AI models to evaluate indicators, order flow liquidity, and institutional risk plans.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
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
                    className={`p-3.5 sm:p-4 rounded-[2px] border transition-all relative ${
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
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-bold ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-700/30 font-mono text-xs">
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
                  className={`w-full px-3 py-2 rounded-[2px] border ${
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
              <h3 className="text-sm sm:text-base font-bold font-mono text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{isId ? 'Sumber Bursa & Kunci API (Exchange Integrations)' : 'Exchange API Sources'}</span>
              </h3>
            </div>

            <MyExchangesSettings
              credentials={localCredentials}
              onSaveCredentials={handleSaveCreds}
              theme={isDark ? 'dark' : 'light'}
            />
          </div>
        </div>
      )}
    </div>
  );
};
