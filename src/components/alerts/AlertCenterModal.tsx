import React, { useState, useMemo, useEffect } from 'react';
import { useAlerts } from '../../contexts/AlertContext';
import { AlertCategory, MarketAlertItem } from '../../types/alert.types';
import {
  Zap,
  SlidersHorizontal,
  Newspaper,
  X,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Settings,
  RefreshCw,
  Copy,
  Check,
  Flame,
  Radio,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Language } from '../../i18n/translations';
import { formatCryptoPrice } from '../../utils/formatters';
import { resolveSignalMetrics } from '../../utils/alertUtils';

interface AlertCenterModalProps {
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const AlertCenterModal: React.FC<AlertCenterModalProps> = ({
  lang = 'id',
  theme = 'dark',
}) => {
  const {
    alerts,
    unreadCount,
    unreadCountByCategory,
    isAlertCenterOpen,
    closeAlertCenter,
    selectedCategoryTab,
    setSelectedCategoryTab,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    clearAllAlerts,
    preferences,
    updatePreferences,
    triggerSimulatedUpdate,
    navigateToAlertTarget,
  } = useAlerts();

  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [searchQuery, setSearchQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [activeView, setActiveView] = useState<'ALERTS' | 'SETTINGS'>('ALERTS');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  // Filter alerts by category, search, and unread status
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Category filter
      if (selectedCategoryTab !== 'ALL' && alert.category !== selectedCategoryTab) {
        return false;
      }
      // Unread filter
      if (onlyUnread && alert.isRead) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSymbol = alert.symbol?.toLowerCase().includes(q);
        const matchesTitle = alert.title.toLowerCase().includes(q);
        const matchesMsg = alert.message.toLowerCase().includes(q);
        const matchesSub = alert.subtitle?.toLowerCase().includes(q);
        return matchesSymbol || matchesTitle || matchesMsg || matchesSub;
      }
      return true;
    });
  }, [alerts, selectedCategoryTab, onlyUnread, searchQuery]);

  const handleCopyAlert = (alert: MarketAlertItem) => {
    const text = `[ALERT ${alert.category}] ${alert.title}\n${alert.subtitle || ''}\n${alert.message}\nTimestamp: ${alert.timestamp}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAlertCenterOpen) {
        closeAlertCenter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlertCenterOpen, closeAlertCenter]);

  if (!isAlertCenterOpen) return null;

  return (
    <>
      {/* Dim overlay: allows clicking outside to close sidebar */}
      <div
        id="backdrop-alert-sidebar"
        onClick={closeAlertCenter}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Right Sidebar Drawer: Full height (top-0 to bottom-0) */}
      <aside
        id="sidebar-alert-center"
        aria-label={isId ? 'Pusat Alert & Notifikasi' : 'Market Alert Center'}
        className={`fixed inset-y-0 right-0 w-full sm:w-[460px] md:w-[500px] lg:w-[520px] z-50 flex flex-col border-l shadow-2xl transition-all duration-300 ease-out animate-in slide-in-from-right ${
          isDark
            ? 'bg-[#090d16] border-[#1e293b] text-slate-100 shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
        }`}
      >
        {/* Sidebar Header: Reaches all the way to top edge */}
        <div
          className={`flex items-center justify-between px-3.5 sm:px-4 py-3 border-b shrink-0 min-h-[52px] ${
            isDark ? 'border-[#1e293b] bg-[#0b0f19]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Top Alert Button: provides identical active alert control at top edge */}
            <button
              onClick={closeAlertCenter}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-mono font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-pink-600/25 border-pink-500 text-pink-300 ring-1 ring-pink-500/50 hover:bg-pink-600/35'
                  : 'bg-pink-50 border-pink-400 text-pink-700 ring-1 ring-pink-400/50 hover:bg-pink-100'
              }`}
              title={isId ? 'Klik untuk menutup sidebar alert' : 'Click to close alert sidebar'}
            >
              <div className="relative flex items-center justify-center">
                {unreadCount > 0 ? (
                  <BellRing className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-pink-400" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] px-0.5 rounded-full bg-pink-600 text-white text-[9px] font-bold font-mono items-center justify-center shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="font-bold">Alert</span>
            </button>

            <div className="min-w-0 pl-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold font-mono tracking-tight truncate">
                  {isId ? 'Pusat Notifikasi' : 'Alert Center'}
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate hidden sm:block">
                {isId
                  ? 'Sinyal Trading • Screener • Sentimen'
                  : 'Trading Signals • Screener • Sentiment'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
              className={`p-1.5 rounded-[2px] border transition-colors cursor-pointer ${
                preferences.soundEnabled
                  ? isDark
                    ? 'bg-pink-500/20 border-pink-500/40 text-pink-400'
                    : 'bg-pink-100 border-pink-300 text-pink-700'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-500'
              }`}
              title={preferences.soundEnabled ? (isId ? 'Suara Aktif' : 'Sound On') : (isId ? 'Suara Hening' : 'Sound Off')}
            >
              {preferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Toggle View: Alerts vs Settings */}
            <button
              onClick={() => setActiveView(activeView === 'ALERTS' ? 'SETTINGS' : 'ALERTS')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-[2px] border text-xs font-mono transition-colors cursor-pointer ${
                activeView === 'SETTINGS'
                  ? 'bg-pink-600 text-white border-pink-500'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-pink-400'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-pink-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeView === 'SETTINGS' ? (isId ? 'Feed' : 'Feed') : (isId ? 'Opsi' : 'Prefs')}</span>
            </button>

            {/* Close Sidebar */}
            <button
              id="btn-close-alert-sidebar"
              onClick={closeAlertCenter}
              className={`p-1.5 rounded-[2px] border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-black'
              }`}
              title={isId ? 'Tutup Sidebar Alert' : 'Close Alert Sidebar'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeView === 'ALERTS' ? (
          <>
            {/* Category Tabs */}
            <div
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b overflow-x-auto shrink-0 scrollbar-none ${
                isDark ? 'border-[#1e293b] bg-[#090d16]' : 'border-slate-200 bg-white'
              }`}
            >
              {/* Tab: Semua */}
              <button
                onClick={() => setSelectedCategoryTab('ALL')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 border ${
                  selectedCategoryTab === 'ALL'
                    ? 'bg-slate-700 text-white border-slate-600 shadow-xs'
                    : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{isId ? 'Semua Alert' : 'All Alerts'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700">
                  {alerts.length}
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Tab: Sinyal Trading */}
              <button
                onClick={() => setSelectedCategoryTab('SIGNAL')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 border ${
                  selectedCategoryTab === 'SIGNAL'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-emerald-500/40 hover:text-emerald-400'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isId ? 'Sinyal Trading' : 'Trading Signals'}</span>
                {unreadCountByCategory.SIGNAL > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
                    {unreadCountByCategory.SIGNAL}
                  </span>
                )}
              </button>

              {/* Tab: Penyaring Koin */}
              <button
                onClick={() => setSelectedCategoryTab('SCREENER')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 border ${
                  selectedCategoryTab === 'SCREENER'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-amber-500/40 hover:text-amber-400'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isId ? 'Penyaring Koin' : 'Coin Screener'}</span>
                {unreadCountByCategory.SCREENER > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {unreadCountByCategory.SCREENER}
                  </span>
                )}
              </button>

              {/* Tab: Berita Sentimen */}
              <button
                onClick={() => setSelectedCategoryTab('SENTIMENT')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 border ${
                  selectedCategoryTab === 'SENTIMENT'
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-cyan-300 hover:text-cyan-700'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>{isId ? 'Berita Sentimen' : 'Sentiment News'}</span>
                {unreadCountByCategory.SENTIMENT > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500 text-white font-bold">
                    {unreadCountByCategory.SENTIMENT}
                  </span>
                )}
              </button>
            </div>

            {/* Filter & Action Sub-Bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b text-xs ${
                isDark ? 'border-slate-800 bg-[#0F172A]/50' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isId ? 'Cari koin atau kata kunci (cth: BTC, RSI, ETF)...' : 'Search symbol or keyword...'}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs font-mono outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-500'
                      : 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Unread Only Toggle */}
                <button
                  onClick={() => setOnlyUnread(!onlyUnread)}
                  className={`px-2.5 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                    onlyUnread
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-semibold'
                      : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>{isId ? 'Hanya Belum Dibaca' : 'Unread Only'}</span>
                </button>

                {/* Mark All Read */}
                <button
                  onClick={() => markAllAsRead(selectedCategoryTab === 'ALL' ? undefined : selectedCategoryTab)}
                  disabled={unreadCount === 0}
                  className={`px-2.5 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-emerald-400'
                      : 'bg-white border-slate-300 text-slate-700 hover:text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isId ? 'Tandai Semua Dibaca' : 'Mark All Read'}</span>
                </button>

                {/* Simulate New Update Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                    className="px-2.5 py-1.5 rounded-lg font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-xs"
                    title={isId ? 'Uji coba penerimaan alert baru secara real-time' : 'Simulate incoming real-time alert'}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isId ? 'Simulasi Update' : 'Simulate Update'}</span>
                  </button>

                  {showSimulateMenu && (
                    <div
                      className={`absolute right-0 top-full mt-1.5 w-52 rounded-xl shadow-xl border p-1.5 z-50 ${
                        isDark ? 'bg-[#0F172A] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => {
                          triggerSimulatedUpdate('SIGNAL');
                          setShowSimulateMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+ Sinyal Trading Baru</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerSimulatedUpdate('SCREENER');
                          setShowSimulateMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 hover:bg-amber-500/20 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Update Penyaring Koin</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerSimulatedUpdate('SENTIMENT');
                          setShowSimulateMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
                        <span>+ Berita Sentimen Terkini</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Clear All */}
                <button
                  onClick={clearAllAlerts}
                  disabled={alerts.length === 0}
                  className={`p-1.5 rounded-lg border font-mono transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-rose-400'
                      : 'bg-white border-slate-300 text-slate-500 hover:text-rose-600'
                  }`}
                  title={isId ? 'Hapus Semua Alert' : 'Clear All'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Alert List Container */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5 min-h-0">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <div className="p-4 rounded-full bg-slate-800/50 mb-3 text-slate-500">
                    <Bell className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold font-mono text-slate-300 mb-1">
                    {isId ? 'Tidak Ada Alert yang Cocok' : 'No Alerts Found'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    {isId
                      ? 'Belum ada notifikasi baru pada kategori ini atau filter pencarian Anda tidak menghasilkan data.'
                      : 'No new alerts available matching your current filter criteria.'}
                  </p>
                  <button
                    onClick={() => triggerSimulatedUpdate(selectedCategoryTab === 'ALL' ? undefined : selectedCategoryTab)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isId ? 'Hasilkan Contoh Alert Sekarang' : 'Generate Sample Alert Now'}</span>
                  </button>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSignal = alert.category === 'SIGNAL' || alert.actionStage === 'signal';
                  const isScreener = alert.category === 'SCREENER' || alert.actionStage === 'screening';
                  const isSentiment = alert.category === 'SENTIMENT' || alert.actionStage === 'sentiment';
                  const signalMetrics = isSignal ? resolveSignalMetrics(alert) : null;

                  return (
                    <div
                      key={alert.id}
                      className={`relative p-4 rounded-xl border transition-all ${
                        !alert.isRead
                          ? isDark
                            ? 'bg-[#0F172A] border-amber-500/40 shadow-xs'
                            : 'bg-amber-50/40 border-amber-200'
                          : isDark
                          ? 'bg-[#0B0F19] border-slate-800/80 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Category Pill, Symbol, Unread Indicator, Timestamp, Actions */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category Badge */}
                          {isSignal && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <Zap className="w-3 h-3" />
                              {isId ? 'Sinyal Trading' : 'Signal'}
                            </span>
                          )}
                          {isScreener && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <SlidersHorizontal className="w-3 h-3" />
                              {isId ? 'Penyaring Koin' : 'Screener'}
                            </span>
                          )}
                          {isSentiment && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                              <Newspaper className="w-3 h-3" />
                              {isId ? 'Berita Sentimen' : 'Sentiment'}
                            </span>
                          )}

                          {/* Symbol */}
                          {alert.symbol && (
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-800 text-amber-400 border border-slate-700">
                              {alert.symbol}
                            </span>
                          )}

                          {/* Signal Direction Pill */}
                          {isSignal && alert.data?.direction && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                alert.data.direction === 'LONG'
                                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {alert.data.direction}
                            </span>
                          )}

                          {/* Confluence / Impact Pill */}
                          {isSignal && alert.data?.confluenceScore && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                              Skor {alert.data.confluenceScore}/100
                            </span>
                          )}

                          {isSentiment && alert.data?.sentimentImpact && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                alert.data.sentimentImpact === 'BULLISH'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : alert.data.sentimentImpact === 'BEARISH'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {alert.data.sentimentImpact}
                            </span>
                          )}

                          {/* Unread dot */}
                          {!alert.isRead && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              {isId ? 'BARU' : 'NEW'}
                            </span>
                          )}
                        </div>

                        {/* Timestamp & Tool Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {alert.timestamp}
                          </span>

                          <button
                            onClick={() => handleCopyAlert(alert)}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Salin Detail"
                          >
                            {copiedId === alert.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Hapus Alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <h4 className="text-sm font-semibold text-slate-100 mb-1">
                        {alert.title}
                      </h4>
                      {alert.subtitle && (
                        <p className="text-xs font-mono text-amber-400/90 mb-2">
                          {alert.subtitle}
                        </p>
                      )}

                      {/* Message Content */}
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {alert.message}
                      </p>

                      {/* Domain-specific Detailed Metric Strip */}
                      {isSignal && signalMetrics && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono mb-3">
                          <div>
                            <span className="text-slate-500 block">Entry Valid</span>
                            <span className="text-slate-200 font-bold">
                              ${formatCryptoPrice(signalMetrics.entryPrice)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Target TP1</span>
                            <span className="text-emerald-400 font-bold">
                              ${formatCryptoPrice(signalMetrics.targetPrice)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Proteksi SL</span>
                            <span className="text-rose-400 font-bold">
                              ${formatCryptoPrice(signalMetrics.stopLoss)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Timeframe</span>
                            <span className="text-slate-300 font-bold">
                              {signalMetrics.timeframe}
                              {signalMetrics.riskRewardRatio ? (
                                <span className="text-slate-500 text-[10px] ml-1 font-normal">
                                  (1:{signalMetrics.riskRewardRatio})
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                      )}

                      {isScreener && alert.data && (
                        <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono mb-3">
                          {alert.data.screenerMetricText && (
                            <span className="text-amber-300 font-bold">
                              {alert.data.screenerMetricText}
                            </span>
                          )}
                          {alert.data.change24h !== undefined && (
                            <span className={alert.data.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              24h: {alert.data.change24h >= 0 ? '+' : ''}{alert.data.change24h}%
                            </span>
                          )}
                          {alert.data.rsi14 && (
                            <span className="text-slate-300">
                              RSI(14): <strong className="text-white">{alert.data.rsi14}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {isSentiment && alert.data && (
                        <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono mb-3">
                          {alert.data.newsSource && (
                            <span className="text-slate-400">
                              Sumber: <strong className="text-slate-200">{alert.data.newsSource}</strong>
                            </span>
                          )}
                          {alert.data.sentimentScore && (
                            <span className="text-cyan-400">
                              Skor Sentimen: <strong>{alert.data.sentimentScore}/100</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                        <div>
                          {!alert.isRead ? (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              {isId ? 'Tandai sudah dibaca' : 'Mark as read'}
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-slate-500" />
                              {isId ? 'Sudah dibaca' : 'Read'}
                            </span>
                          )}
                        </div>

                        {/* Navigation CTA */}
                        <button
                          onClick={() => navigateToAlertTarget(alert)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            isSignal
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              : isScreener
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                          }`}
                        >
                          <span>
                            {isSignal
                              ? isId ? 'Buka di Modul Sinyal' : 'View in Signals'
                              : isScreener
                              ? isId ? 'Buka di Penyaring Koin' : 'View in Screener'
                              : isId ? 'Buka Berita & Sentimen' : 'View in Sentiment'}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Preferences / Settings View */
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[65vh]">
            <div>
              <h4 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider mb-1">
                {isId ? 'Konfigurasi Notifikasi & Alert Real-Time' : 'Alert & Notification Preferences'}
              </h4>
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Sesuaikan jenis sinyal, filter penyaring, dan kabar berita yang memicu notifikasi visual & suara.'
                  : 'Customize alert categories, sound chimes, and automatic toast notifications.'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Sinyal Trading Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">
                      {isId ? 'Alert Sinyal Trading' : 'Trading Signal Alerts'}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {isId
                        ? 'Dapatkan notifikasi tiap ada setup baru (Long/Short), TP tercapai, dan penyesuaian SL.'
                        : 'Alert on new institutional signals, TP executions, and SL updates.'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableSignalAlerts}
                  onChange={(e) => updatePreferences({ enableSignalAlerts: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Penyaring Koin Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">
                      {isId ? 'Alert Penyaring Koin (Screener)' : 'Coin Screener Alerts'}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {isId
                        ? 'Notifikasi saat koin memicu lonjakan volume, RSI extreme oversold/overbought, atau Golden Cross.'
                        : 'Alert when coins meet technical filter anomalies (Volume surges, RSI extremes, MACD).'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableScreenerAlerts}
                  onChange={(e) => updatePreferences({ enableScreenerAlerts: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Berita Sentimen Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">
                      {isId ? 'Alert Berita Sentimen & Breaking News' : 'Sentiment News Alerts'}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {isId
                        ? 'Notifikasi peristiwa penting, arus keluar-masuk ETF, transfer whale besar, dan rilis makro.'
                        : 'Alert on high-impact headlines, ETF flows, whale shifts, and macro catalysts.'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableSentimentAlerts}
                  onChange={(e) => updatePreferences({ enableSentimentAlerts: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Sound Audio Chime Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">
                      {isId ? 'Efek Suara Audio Chime' : 'Notification Audio Chimes'}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {isId
                        ? 'Mainkan nada sintetis frekuensi unik untuk tiap kategori update terbaru.'
                        : 'Play synthesized tone chime when a new alert is received.'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Auto Toast Floating HUD Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">
                      {isId ? 'Floating HUD Toast Otomatis' : 'Automatic Floating Toast Banner'}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {isId
                        ? 'Tampilkan popup melayang di sudut layar tiap kali ada pembaruan data terbaru.'
                        : 'Display floating toast popup on screen whenever a fresh update arrives.'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoShowToast}
                  onChange={(e) => updatePreferences({ autoShowToast: e.target.checked })}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div
          className={`flex items-center justify-between px-3.5 sm:px-4 py-2.5 border-t text-xs font-mono shrink-0 ${
            isDark ? 'border-[#1e293b] bg-[#0b0f19]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[180px] sm:max-w-none">
              {isId ? 'CCXT & MarketOwl Stream' : 'CCXT & Confluence'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead(selectedCategoryTab === 'ALL' ? undefined : selectedCategoryTab)}
                className="text-[11px] text-pink-400 hover:text-pink-300 transition-colors cursor-pointer font-semibold"
              >
                {isId ? 'Baca Semua' : 'Read All'}
              </button>
            )}
            <button
              onClick={closeAlertCenter}
              className={`px-3 py-1 rounded-[2px] border text-xs font-mono font-semibold cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#0f172a] hover:bg-slate-800 text-slate-300 border-[#1e293b]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isId ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
