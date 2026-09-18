import React, { useState, useMemo } from 'react';
import {
  WatchlistFolder,
  WatchlistItem,
  SupportedExchange,
} from '../types/crypto.types';
import {
  Star,
  Plus,
  Folder,
  FolderPlus,
  Bell,
  BellRing,
  Trash2,
  Edit3,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Search,
  CheckCircle2,
  Download,
  Upload,
  AlertCircle,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { Language } from '../i18n/translations';

interface WatchlistPageProps {
  currentSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  selectedExchange?: SupportedExchange;
  theme?: 'light' | 'dark';
  lang?: Language;
}

const INITIAL_FOLDERS: WatchlistFolder[] = [
  {
    id: 'fav-core',
    name: 'Favorit Utama',
    icon: '⭐',
    description: 'Aset inti kapitalisasi pasar tinggi dan likuiditas teratas',
    color: 'text-amber-400',
  },
  {
    id: 'momentum-hot',
    name: 'High Momentum',
    icon: '🚀',
    description: 'Koin yang sedang mengalami lonjakan volume dan breakout tren',
    color: 'text-cyan-400',
  },
  {
    id: 'defi-ai',
    name: 'DeFi & AI Gems',
    icon: '💎',
    description: 'Proyek berfundamental kuat sektor Artificial Intelligence dan DeFi',
    color: 'text-purple-400',
  },
  {
    id: 'futures-scalp',
    name: 'Futures Scalping',
    icon: '🔥',
    description: 'Pasangan dengan spread tipis untuk eksekusi intraday dan leverage',
    color: 'text-rose-400',
  },
];

const INITIAL_ITEMS: WatchlistItem[] = [
  {
    id: 'w-1',
    folderId: 'fav-core',
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Layer 1',
    currentPrice: 88450.0,
    change24h: 3.45,
    high24h: 89200.0,
    low24h: 85200.0,
    volume24h: 38450000000,
    marketCap: 1740000000000,
    confluenceScore: 94,
    sparkline: [82000, 83500, 84200, 86000, 85400, 87200, 88450],
    alertPriceHigh: 90000.0,
    alertPriceLow: 86500.0,
    notes: 'Tunggu konfirmasi penutupan candle 4H di atas $89k untuk retest ATH.',
    addedAt: '2026-06-10',
  },
  {
    id: 'w-2',
    folderId: 'fav-core',
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Layer 1',
    currentPrice: 3380.0,
    change24h: -1.25,
    high24h: 3450.0,
    low24h: 3340.0,
    volume24h: 18450000000,
    marketCap: 408000000000,
    confluenceScore: 78,
    sparkline: [3250, 3310, 3420, 3390, 3450, 3410, 3380],
    alertPriceHigh: 3500.0,
    alertPriceLow: 3300.0,
    notes: 'Support kuat di $3,300. Siap akumulasi jika retest FVG support.',
    addedAt: '2026-06-11',
  },
  {
    id: 'w-3',
    folderId: 'momentum-hot',
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Layer 1',
    currentPrice: 185.4,
    change24h: 6.82,
    high24h: 188.0,
    low24h: 172.5,
    volume24h: 7820000000,
    marketCap: 86400000000,
    confluenceScore: 91,
    sparkline: [156, 162, 168, 172, 175, 179, 185.4],
    alertPriceHigh: 195.0,
    alertPriceLow: 178.0,
    notes: 'Short squeeze aktif. Target TP1 $192 tercapai.',
    addedAt: '2026-06-12',
  },
  {
    id: 'w-4',
    folderId: 'momentum-hot',
    symbol: 'SUI/USDT',
    name: 'Sui Network',
    category: 'Layer 1',
    currentPrice: 3.42,
    change24h: 11.45,
    high24h: 3.55,
    low24h: 3.02,
    volume24h: 1850000000,
    marketCap: 9800000000,
    confluenceScore: 89,
    sparkline: [2.65, 2.78, 2.92, 3.1, 3.05, 3.28, 3.42],
    alertPriceHigh: 3.80,
    alertPriceLow: 3.15,
    notes: 'Momentum breakout ATH lokal, pasang stop loss trailing di BEP.',
    addedAt: '2026-06-12',
  },
  {
    id: 'w-5',
    folderId: 'defi-ai',
    symbol: 'NEAR/USDT',
    name: 'NEAR Protocol',
    category: 'AI & Big Data',
    currentPrice: 6.85,
    change24h: 8.92,
    high24h: 7.05,
    low24h: 6.22,
    volume24h: 980000000,
    marketCap: 8200000000,
    confluenceScore: 92,
    sparkline: [5.6, 5.85, 6.1, 6.05, 6.4, 6.65, 6.85],
    alertPriceHigh: 7.50,
    alertPriceLow: 6.40,
    notes: 'Model AI Confluence 92/100, rasio RRR 1:3.45.',
    addedAt: '2026-06-13',
  },
  {
    id: 'w-6',
    folderId: 'defi-ai',
    symbol: 'FET/USDT',
    name: 'Artificial Superintelligence',
    category: 'AI & Big Data',
    currentPrice: 1.48,
    change24h: 9.85,
    high24h: 1.54,
    low24h: 1.32,
    volume24h: 380000000,
    marketCap: 3800000000,
    confluenceScore: 90,
    sparkline: [1.18, 1.24, 1.31, 1.28, 1.38, 1.42, 1.48],
    alertPriceHigh: 1.65,
    alertPriceLow: 1.35,
    notes: 'Katalis pengumuman model ASI V2.',
    addedAt: '2026-06-13',
  },
  {
    id: 'w-7',
    folderId: 'futures-scalp',
    symbol: 'PEPE/USDT',
    name: 'Pepe',
    category: 'Meme',
    currentPrice: 0.0000108,
    change24h: 14.8,
    high24h: 0.0000114,
    low24h: 0.0000092,
    volume24h: 1450000000,
    marketCap: 4540000000,
    confluenceScore: 83,
    sparkline: [0.000008, 0.0000085, 0.0000092, 0.000009, 0.0000098, 0.0000102, 0.0000108],
    alertPriceHigh: 0.0000120,
    alertPriceLow: 0.0000098,
    notes: 'Volatilitas tinggi untuk scalping cepat 15m.',
    addedAt: '2026-06-14',
  },
];

const AVAILABLE_ADD_COINS = [
  { symbol: 'BNB/USDT', name: 'BNB Chain', category: 'Layer 1', price: 658.0, change24h: 2.15, confluence: 85 },
  { symbol: 'AVAX/USDT', name: 'Avalanche', category: 'Layer 1', price: 36.4, change24h: -2.85, confluence: 71 },
  { symbol: 'LINK/USDT', name: 'Chainlink', category: 'DeFi', price: 15.2, change24h: 4.65, confluence: 86 },
  { symbol: 'TON/USDT', name: 'Toncoin', category: 'Layer 1', price: 5.65, change24h: 1.15, confluence: 81 },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', category: 'Meme', price: 0.185, change24h: 5.42, confluence: 82 },
  { symbol: 'APT/USDT', name: 'Aptos', category: 'Layer 1', price: 11.2, change24h: 4.12, confluence: 80 },
  { symbol: 'RENDER/USDT', name: 'Render', category: 'AI & Big Data', price: 7.45, change24h: 6.80, confluence: 88 },
  { symbol: 'INJ/USDT', name: 'Injective', category: 'DeFi', price: 28.5, change24h: 5.20, confluence: 84 },
];

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  currentSymbol,
  onSelectSymbol,
  onNavigateToTrade,
  selectedExchange = 'BINANCE',
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [folders, setFolders] = useState<WatchlistFolder[]>(INITIAL_FOLDERS);
  const [items, setItems] = useState<WatchlistItem[]>(INITIAL_ITEMS);
  const [activeFolderId, setActiveFolderId] = useState<string>('fav-core');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderIcon, setNewFolderIcon] = useState<string>('📁');
  const [editingNotesItem, setEditingNotesItem] = useState<WatchlistItem | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Active items
  const currentFolder = folders.find((f) => f.id === activeFolderId) || folders[0];
  const activeItems = useMemo(() => {
    return items.filter((item) => {
      if (item.folderId !== activeFolderId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.symbol.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [items, activeFolderId, searchQuery]);

  // Average return for active folder
  const avg24hReturn =
    activeItems.length > 0
      ? (activeItems.reduce((acc, i) => acc + i.change24h, 0) / activeItems.length).toFixed(2)
      : '0.00';

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: WatchlistFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      icon: newFolderIcon || '📁',
      description: 'Folder watchlist kustom pengguna',
      color: 'text-cyan-400',
    };
    setFolders([...folders, newFolder]);
    setActiveFolderId(newFolder.id);
    setNewFolderName('');
    setShowNewFolderModal(false);
    setActionNotice(`Folder "${newFolder.name}" berhasil dibuat!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleAddCoinToFolder = (coin: (typeof AVAILABLE_ADD_COINS)[0]) => {
    // Check if already in folder
    const exists = items.some((i) => i.folderId === activeFolderId && i.symbol === coin.symbol);
    if (exists) {
      setActionNotice(`${coin.symbol} sudah ada di folder ini!`);
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    const newItem: WatchlistItem = {
      id: `w-${Date.now()}`,
      folderId: activeFolderId,
      symbol: coin.symbol,
      name: coin.name,
      category: coin.category,
      currentPrice: coin.price,
      change24h: coin.change24h,
      high24h: coin.price * 1.05,
      low24h: coin.price * 0.95,
      volume24h: 500000000,
      marketCap: 5000000000,
      confluenceScore: coin.confluence,
      sparkline: [coin.price * 0.94, coin.price * 0.96, coin.price * 0.98, coin.price * 0.97, coin.price],
      alertPriceHigh: Number((coin.price * 1.1).toFixed(2)),
      alertPriceLow: Number((coin.price * 0.9).toFixed(2)),
      notes: 'Ditambahkan dari penyaring koin',
      addedAt: new Date().toISOString().slice(0, 10),
    };

    setItems([...items, newItem]);
    setShowAddModal(false);
    setActionNotice(`${coin.symbol} berhasil ditambahkan ke "${currentFolder.name}"!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRemoveItem = (id: string, symbol: string) => {
    setItems(items.filter((i) => i.id !== id));
    setActionNotice(`${symbol} dihapus dari watchlist.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSaveNotes = () => {
    if (!editingNotesItem) return;
    setItems(
      items.map((i) => (i.id === editingNotesItem.id ? { ...i, notes: notesText } : i))
    );
    setEditingNotesItem(null);
    setActionNotice(`Catatan untuk ${editingNotesItem.symbol} berhasil diperbarui!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExportWatchlist = () => {
    const dataStr = JSON.stringify({ folders, items }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMASBTC_Watchlist_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionNotice('Watchlist berhasil diekspor ke file JSON!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <h1 className={`font-mono font-bold text-lg sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isId ? 'Watchlist & Daftar Pantau Kripto' : 'Crypto Watchlist & Favorites'}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {isId
                ? 'Kelola multi-folder daftar pantau, pasang price alerts, dan pantau skor konfluensi aset favorit'
                : 'Organized folders, custom price alerts & real-time technical scoring for your favorite tokens'}
            </p>
          </div>
        </div>

        {/* Actions: Add Coin, Create Folder, Export */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isId ? 'Tambah Koin' : 'Add Coin'}</span>
          </button>

          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono font-bold text-xs transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>{isId ? 'Folder Baru' : 'New Folder'}</span>
          </button>

          <button
            onClick={handleExportWatchlist}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title="Ekspor Watchlist (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Watchlist Folders Navigation Bar */}
      <div
        className={`p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {folders.map((folder) => {
            const count = items.filter((i) => i.folderId === folder.id).length;
            const isActive = activeFolderId === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span>{folder.icon}</span>
                <span>{folder.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-black/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Folder Stats Pill */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
          <span>Rata-Rata 24h: <strong className={Number(avg24hReturn) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{Number(avg24hReturn) >= 0 ? '+' : ''}{avg24hReturn}%</strong></span>
          <span>•</span>
          <span>{activeItems.length} Aset Terdaftar</span>
        </div>
      </div>

      {/* Search within active folder */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari di folder ${currentFolder.name}...`}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Watchlist Table */}
      <div
        className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">Koin / Aset</th>
                <th className="pb-3">Harga Terkini</th>
                <th className="pb-3">24h Change</th>
                <th className="pb-3">Rentang 24h (Low - High)</th>
                <th className="pb-3">Skor Konfluensi</th>
                <th className="pb-3">Price Alert</th>
                <th className="pb-3">Catatan Trader</th>
                <th className="pb-3">Trend 7D</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada koin di folder <strong>{currentFolder.name}</strong>. Klik <strong>"Tambah Koin"</strong> untuk menambahkan.
                  </td>
                </tr>
              ) : (
                activeItems.map((item) => {
                  const isBullish = item.change24h >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Asset & Name */}
                      <td className="py-3">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{item.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.name}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3 text-white font-bold text-sm">
                        ${formatCryptoPrice(item.currentPrice)}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] inline-flex items-center gap-0.5 ${
                            isBullish
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isBullish ? '+' : ''}{item.change24h}%
                        </span>
                      </td>

                      {/* 24h Range */}
                      <td className="py-3 text-slate-300">
                        <div>H: ${formatCryptoPrice(item.high24h)}</div>
                        <div className="text-slate-400 text-[10px]">L: ${formatCryptoPrice(item.low24h)}</div>
                      </td>

                      {/* Confluence */}
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="font-bold text-cyan-400">{item.confluenceScore}/100</span>
                        </div>
                      </td>

                      {/* Price Alerts */}
                      <td className="py-3">
                        <div className="text-[11px] space-y-0.5">
                          {item.alertPriceHigh && (
                            <div className="text-emerald-400 font-bold flex items-center gap-1">
                              <BellRing className="w-3 h-3" />
                              <span>&gt; ${formatCryptoPrice(item.alertPriceHigh)}</span>
                            </div>
                          )}
                          {item.alertPriceLow && (
                            <div className="text-rose-400 font-bold flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              <span>&lt; ${formatCryptoPrice(item.alertPriceLow)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 max-w-xs">
                        <div className="flex items-center gap-1">
                          <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                            {item.notes || 'Belum ada catatan...'}
                          </p>
                          <button
                            onClick={() => {
                              setEditingNotesItem(item);
                              setNotesText(item.notes || '');
                            }}
                            className="p-1 text-slate-500 hover:text-cyan-400 cursor-pointer"
                            title="Edit Catatan"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Sparkline */}
                      <td className="py-3">
                        <svg className="w-16 h-5 overflow-visible" viewBox="0 0 100 30">
                          <polyline
                            fill="none"
                            stroke={isBullish ? '#34d399' : '#f87171'}
                            strokeWidth="2"
                            points={item.sparkline
                              .map((val, idx) => {
                                const min = Math.min(...item.sparkline);
                                const max = Math.max(...item.sparkline);
                                const range = max - min || 1;
                                const x = (idx / (item.sparkline.length - 1)) * 100;
                                const y = 30 - ((val - min) / range) * 26;
                                return `${x},${y}`;
                              })
                              .join(' ')}
                          />
                        </svg>
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (onSelectSymbol) onSelectSymbol(item.symbol);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                            title="Buka Analisis"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (onSelectSymbol) onSelectSymbol(item.symbol);
                              if (onNavigateToTrade) onNavigateToTrade(item.symbol);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition cursor-pointer"
                          >
                            Trade
                          </button>

                          <button
                            onClick={() => handleRemoveItem(item.id, item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Hapus dari Folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coin to Watchlist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 font-mono space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Tambah Koin ke {currentFolder.name}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {AVAILABLE_ADD_COINS.map((c) => (
                <div
                  key={c.symbol}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{c.symbol}</div>
                    <div className="text-[10px] text-slate-400">{c.name} • {c.category}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">${formatCryptoPrice(c.price)}</div>
                      <div className={`text-[10px] font-bold ${c.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.change24h >= 0 ? '+' : ''}{c.change24h}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCoinToFolder(c)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 font-mono space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <span>Buat Folder Watchlist Baru</span>
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nama Folder</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Contoh: Koin AI Pilihan, HODL 2026..."
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Pilih Ikon Emoji</label>
                <div className="flex gap-2">
                  {['⭐', '🚀', '💎', '🔥', '🛡️', '🎯', '⚡', '📊'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewFolderIcon(emoji)}
                      className={`p-2 rounded-xl text-lg border cursor-pointer ${
                        newFolderIcon === emoji
                          ? 'bg-cyan-500/20 border-cyan-400'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateFolder}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Buat Folder Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 font-mono space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Catatan Strategi: {editingNotesItem.symbol}</span>
              </h3>
              <button
                onClick={() => setEditingNotesItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={4}
                placeholder="Tulis rencana trading, target akumulasi, atau pengingat psikologi..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleSaveNotes}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Simpan Catatan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
