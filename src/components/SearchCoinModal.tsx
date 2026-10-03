import React, { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { Search, X, Zap, Coins, ArrowUpRight, ArrowDownRight, Sparkles, Clock, Flame, ArrowUpDown, PlusCircle } from 'lucide-react';
import { CryptoSymbolInfo } from '../types/crypto.types';
import { Language, getTranslation } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';
import { CryptoIcon } from './ui/CryptoIcon';

interface SearchCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: CryptoSymbolInfo[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  lang: Language;
}

const POPULAR_TICKERS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'SUI/USDT',
  'DOGE/USDT',
  'PEPE/USDT',
  'TAO/USDT',
  'ONDO/USDT',
  'WIF/USDT',
  'AAVE/USDT',
  'PENDLE/USDT',
  'NEAR/USDT',
  'FET/USDT',
  'TON/USDT',
  'XRP/USDT',
  'BNB/USDT',
];

const PREFERRED_CATEGORIES = [
  'ALL',
  'Layer 1',
  'Layer 2',
  'DeFi',
  'AI / Data',
  'Meme',
  'RWA / Infra',
  'Gaming',
];

const RECENT_STORAGE_KEY = 'nexustrade_recent_pairs_v1';

type SortOption = 'relevance' | 'volume' | 'gainers' | 'losers';

export const SearchCoinModal: React.FC<SearchCoinModalProps> = ({
  isOpen,
  onClose,
  symbols,
  selectedSymbol,
  onSelectSymbol,
  lang,
}) => {
  const t = getTranslation(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [recentPairs, setRecentPairs] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside & Escape listener for dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        const triggerBtn = document.getElementById('btn-open-pair-search');
        if (triggerBtn && triggerBtn.contains(e.target as Node)) {
          return;
        }
        onClose();
      }
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [isOpen, onClose]);

  // Load recent pairs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentPairs(parsed.slice(0, 6));
        }
      }
    } catch (_err) {}
  }, [isOpen]);

  const saveRecentPair = (sym: string) => {
    try {
      const updated = [sym, ...recentPairs.filter((p) => p !== sym)].slice(0, 6);
      setRecentPairs(updated);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch (_err) {}
  };

  // Reset highlight & focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Extract unique categories preserving preferred order
  const categories = useMemo(() => {
    const presentCategories = new Set<string>();
    symbols.forEach((s) => {
      if (s.category) presentCategories.add(s.category);
    });

    const ordered = PREFERRED_CATEGORIES.filter(
      (cat) => cat === 'ALL' || presentCategories.has(cat)
    );

    // Add any remaining unlisted categories
    presentCategories.forEach((cat) => {
      if (!ordered.includes(cat)) {
        ordered.push(cat);
      }
    });

    return ordered;
  }, [symbols]);

  // Parse volume string to number for sorting: '$38.5B' -> 38500000000
  const parseVolumeToNumber = (volStr: string): number => {
    if (!volStr) return 0;
    const clean = volStr.replace('$', '').trim();
    if (clean.endsWith('B')) return parseFloat(clean) * 1e9;
    if (clean.endsWith('M')) return parseFloat(clean) * 1e6;
    if (clean.endsWith('K')) return parseFloat(clean) * 1e3;
    return parseFloat(clean) || 0;
  };

  // Enhanced search algorithm with symbol normalization and relevance scoring
  const filteredCoins = useMemo(() => {
    const qRaw = deferredQuery.trim().toLowerCase();
    const qClean = qRaw.replace(/[^a-z0-9]/g, ''); // strip slashes, hyphens, spaces

    let pool = symbols;
    if (selectedCategory !== 'ALL') {
      pool = symbols.filter((coin) => coin.category === selectedCategory);
    }

    if (!qRaw) {
      const list = [...pool];
      if (sortOption === 'volume') {
        list.sort((a, b) => parseVolumeToNumber(b.volume24h) - parseVolumeToNumber(a.volume24h));
      } else if (sortOption === 'gainers') {
        list.sort((a, b) => b.change24h - a.change24h);
      } else if (sortOption === 'losers') {
        list.sort((a, b) => a.change24h - b.change24h);
      }
      return list;
    }

    interface ScoredCoin {
      coin: CryptoSymbolInfo;
      score: number;
    }

    const scored: ScoredCoin[] = [];

    for (const coin of pool) {
      const symRaw = coin.symbol.toLowerCase(); // 'btc/usdt'
      const symClean = symRaw.replace(/[^a-z0-9]/g, ''); // 'btcusdt'
      const baseRaw = symRaw.split('/')[0]; // 'btc'
      const nameRaw = coin.name.toLowerCase(); // 'bitcoin'
      const catRaw = (coin.category || '').toLowerCase();

      let score = 0;

      // 1. Exact Base Symbol Match (e.g. 'btc' -> 'BTC/USDT')
      if (baseRaw === qRaw || baseRaw === qClean) {
        score = 1000;
      }
      // 2. Exact Clean Symbol Match (e.g. 'btcusdt' -> 'BTC/USDT')
      else if (symClean === qClean) {
        score = 900;
      }
      // 3. Base Symbol Starts With query (e.g. 'so' -> 'SOL/USDT')
      else if (baseRaw.startsWith(qRaw) || baseRaw.startsWith(qClean)) {
        score = 800;
      }
      // 4. Name Starts With query (e.g. 'bit' -> 'Bitcoin')
      else if (nameRaw.startsWith(qRaw)) {
        score = 700;
      }
      // 5. Clean Symbol Starts With query (e.g. 'btcu' -> 'BTC/USDT')
      else if (symClean.startsWith(qClean)) {
        score = 600;
      }
      // 6. Base Symbol contains query
      else if (baseRaw.includes(qRaw) || baseRaw.includes(qClean)) {
        score = 500;
      }
      // 7. Full symbol or clean contains query
      else if (symClean.includes(qClean) || symRaw.includes(qRaw)) {
        if (qClean === 'usdt') {
          score = 100;
        } else {
          score = 400;
        }
      }
      // 8. Name contains query
      else if (nameRaw.includes(qRaw)) {
        score = 300;
      }
      // 9. Category contains query
      else if (catRaw.includes(qRaw)) {
        score = 200;
      }

      if (score > 0) {
        scored.push({ coin, score });
      }
    }

    // Apply sorting
    if (sortOption === 'volume') {
      scored.sort((a, b) => parseVolumeToNumber(b.coin.volume24h) - parseVolumeToNumber(a.coin.volume24h));
    } else if (sortOption === 'gainers') {
      scored.sort((a, b) => b.coin.change24h - a.coin.change24h);
    } else if (sortOption === 'losers') {
      scored.sort((a, b) => a.coin.change24h - b.coin.change24h);
    } else {
      // Relevance descending, then by volume
      scored.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return parseVolumeToNumber(b.coin.volume24h) - parseVolumeToNumber(a.coin.volume24h);
      });
    }

    return scored.map((s) => s.coin);
  }, [symbols, deferredQuery, selectedCategory, sortOption]);

  // Detect custom on-demand symbol input from user query
  const customPairCandidate = useMemo(() => {
    const raw = searchQuery.trim().toUpperCase();
    if (!raw) return null;
    const clean = raw.replace('/USDT', '').replace(/[^A-Z0-9]/g, '');
    if (clean.length >= 2 && clean.length <= 12 && clean !== 'USDT') {
      const candidateSymbol = `${clean}/USDT`;
      // If candidate is already exact match at top of list, no need for separate custom prompt
      const isAlreadyTopExact =
        filteredCoins.length > 0 &&
        filteredCoins[0].symbol.toUpperCase() === candidateSymbol;
      if (!isAlreadyTopExact) {
        return candidateSymbol;
      }
    }
    return null;
  }, [searchQuery, filteredCoins]);

  // Keep highlighted index in bounds
  useEffect(() => {
    setHighlightedIndex(0);
  }, [deferredQuery, selectedCategory, sortOption]);

  const handleSelect = (sym: string) => {
    saveRecentPair(sym);
    onSelectSymbol(sym);
    onClose();
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCoins.length - 1 ? prev + 1 : 0));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredCoins.length - 1));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCoins.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredCoins.length) {
        handleSelect(filteredCoins[highlightedIndex].symbol);
      } else if (customPairCandidate) {
        handleSelect(customPairCandidate);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    const container = listContainerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>('[data-coin-item]');
    const item = items[index];
    if (!item) return;

    const itemTop = item.offsetTop - container.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    if (itemTop < containerTop) {
      container.scrollTop = itemTop;
    } else if (itemBottom > containerBottom) {
      container.scrollTop = itemBottom - container.clientHeight;
    }
  };

  if (!isOpen) return null;

  const formatPrice = (p: number) => {
    return formatCryptoPrice(p);
  };

  // Highlight matched search letters
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!q) return text;

    const regex = new RegExp(`(${q})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-cyan-300 font-extrabold bg-cyan-950/80 px-0.5 rounded border border-cyan-500/30">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'Layer 1':
        return 'text-blue-300 bg-blue-500/20 border-blue-500/40';
      case 'Layer 2':
        return 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40';
      case 'DeFi':
        return 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40';
      case 'AI / Data':
        return 'text-purple-300 bg-purple-500/20 border-purple-500/40';
      case 'Meme':
        return 'text-amber-300 bg-amber-500/20 border-amber-500/40';
      case 'RWA / Infra':
        return 'text-sky-300 bg-sky-500/20 border-sky-500/40';
      case 'Gaming':
        return 'text-rose-300 bg-rose-500/20 border-rose-500/40';
      default:
        return 'text-slate-300 bg-slate-700/30 border-slate-600/50';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 sm:hidden backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Dropdown attached right beneath the button */}
      <div
        ref={dropdownRef}
        role="dialog"
        aria-modal="false"
        id="coin-search-dropdown"
        aria-label={lang === 'id' ? 'Katalog Pasangan Koin & Pencarian Pasar' : 'Coin Pairs Catalog & Market Search'}
        className="absolute left-0 top-full mt-1.5 z-50 w-[95vw] sm:w-[540px] md:w-[620px] max-w-[calc(100vw-1rem)] max-h-[75vh] flex flex-col rounded-xl border border-pink-500/40 bg-[#090d16] text-slate-100 shadow-2xl shadow-black/95 ring-1 ring-pink-500/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Dropdown Compact Header */}
        <div className="shrink-0 px-4 py-2.5 bg-[#0c1322] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold font-mono tracking-wider text-white uppercase">
              {lang === 'id' ? 'Katalog Pasangan Koin & Pasar' : 'Coin Pairs Catalog & Market'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold">
              {symbols.length}+ Pairs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
              {filteredCoins.length} {lang === 'id' ? 'aset' : 'assets'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
              aria-label="Tutup"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Search Input Bar & Controls */}
        <div className="shrink-0 p-3 bg-[#0c1322]/80 border-b border-[#1e293b] space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'id' ? 'Ketik koin apa saja: "SOL", "ENA", "PEPE", "AAVE", "ONDO", "KAS", "DEGEN"...' : 'Search any coin: "SOL", "ENA", "PEPE", "AAVE", "ONDO", "KAS", "DEGEN"...'}
              className="w-full pl-10 pr-20 py-2.5 bg-[#080d18] border border-pink-500/30 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-lg text-sm font-sans font-medium text-white placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800">
                ESC
              </span>
            )}
          </div>

          {/* Quick Access Popular Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 shrink-0 mr-1">
              <Flame className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Tren Hot:' : 'Hot:'}</span>
            </span>
            {POPULAR_TICKERS.map((ticker) => {
              const base = ticker.split('/')[0];
              const isCurr = ticker === selectedSymbol;
              return (
                <button
                  key={ticker}
                  type="button"
                  onClick={() => handleSelect(ticker)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                    isCurr
                      ? 'bg-pink-600 text-white font-bold border border-pink-500 shadow-xs'
                      : 'bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-pink-500/60 hover:bg-slate-800'
                  }`}
                >
                  <CryptoIcon symbol={ticker} size="xs" />
                  <span>{base}</span>
                </button>
              );
            })}
          </div>

          {/* Recent Pairs Chips (if any) */}
          {recentPairs.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-300 shrink-0 mr-1">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                <span>{lang === 'id' ? 'Terakhir:' : 'Recent:'}</span>
              </span>
              {recentPairs.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-pink-950/40 border border-pink-700/60 text-pink-200 hover:text-white hover:border-pink-400 transition cursor-pointer shrink-0 font-medium"
                >
                  <CryptoIcon symbol={p} size="xs" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          )}

          {/* Category Filter Pills & Sort Dropdown/Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-pink-600 text-white font-bold shadow-xs'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat === 'ALL' ? (lang === 'id' ? 'Semua' : 'All') : cat}
                </button>
              ))}
            </div>

            {/* Sort Toggle Controls */}
            <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
              <span className="text-slate-400 hidden sm:inline flex items-center gap-0.5">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </span>
              <button
                type="button"
                onClick={() => setSortOption('relevance')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortOption === 'relevance'
                    ? 'bg-pink-500/25 text-pink-300 font-bold border border-pink-500/60 shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'id' ? 'Relevan' : 'Relevance'}
              </button>
              <button
                type="button"
                onClick={() => setSortOption('volume')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortOption === 'volume'
                    ? 'bg-pink-500/25 text-pink-300 font-bold border border-pink-500/60 shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Vol
              </button>
              <button
                type="button"
                onClick={() => setSortOption('gainers')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortOption === 'gainers'
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/60 shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                +Gainers
              </button>
            </div>
          </div>
        </div>

        {/* Speed & Dynamic Pair Notice Banner */}
        <div className="shrink-0 px-4 py-2 bg-emerald-950/30 border-b border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {lang === 'id'
                ? 'Pencarian Cepat & Fleksibel: 90+ aset kripto terindeks + Dukungan instan untuk pair koin kustom.'
                : 'Fast & Flexible Search: 90+ indexed assets + Instant support for custom crypto pairs.'}
            </span>
          </div>
          <span className="hidden sm:inline px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold border border-emerald-500/30">
            Live CCXT Feed
          </span>
        </div>

        {/* Coin List & Custom Candidate */}
        <div
          ref={listContainerRef}
          className="p-3 overflow-y-auto flex-1 min-h-0 divide-y divide-slate-800/60 font-mono space-y-1"
        >
          {/* Custom Dynamic Pair Prompt Card (if user typed a valid ticker not at the top) */}
          {customPairCandidate && (
            <div className="mb-2 p-3 rounded-lg bg-gradient-to-r from-pink-950/50 via-rose-950/40 to-slate-900 border border-pink-500/50 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-pink-500/20 text-pink-400 border border-pink-500/40">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {customPairCandidate}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold">
                      {lang === 'id' ? 'Aset Bebas On-Demand' : 'On-Demand Asset'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {lang === 'id'
                      ? 'Analisis instan pair ini langsung dari mesin CCXT bursa'
                      : 'Instantly analyze this pair directly from CCXT exchange engine'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelect(customPairCandidate)}
                className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold font-mono text-xs transition shadow-sm cursor-pointer shrink-0"
              >
                {lang === 'id' ? 'Buka Pair ➔' : 'Open Pair ➔'}
              </button>
            </div>
          )}

          {filteredCoins.length === 0 && !customPairCandidate ? (
            <div className="py-12 text-center text-slate-400 text-sm font-mono space-y-2">
              <div className="text-white font-semibold">{lang === 'id' ? 'Tidak ada pasangan kripto yang cocok dengan pencarian Anda.' : 'No crypto pairs match your search.'}</div>
              <div className="text-xs text-slate-400">
                {lang === 'id' ? 'Coba cari simbol lain seperti "SUI", "ENA", "ONDO", "AAVE", "TAO", dll.' : 'Try searching "SUI", "ENA", "ONDO", "AAVE", "TAO", etc.'}
              </div>
            </div>
          ) : (
            filteredCoins.map((coin, index) => {
              const isSelected = coin.symbol === selectedSymbol;
              const isHighlighted = index === highlightedIndex;
              const isPositive = coin.change24h >= 0;

              return (
                <button
                  key={coin.symbol}
                  data-coin-item
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(coin.symbol)}
                  className={`w-full p-3 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-500/20 border border-pink-400/60 shadow-sm text-white'
                      : isHighlighted
                      ? 'bg-slate-800/90 border border-slate-600 shadow-xs text-white'
                      : 'bg-[#080d18]/60 border border-slate-800/80 text-slate-200 hover:bg-slate-800/60 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CryptoIcon symbol={coin.symbol} size="lg" className="rounded-lg shadow-xs shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-white text-sm">
                          {renderHighlightedText(coin.symbol, searchQuery)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold ${getCategoryColor(coin.category)}`}>
                          {coin.category}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono text-pink-300 font-bold bg-pink-950/80 px-2 py-0.5 rounded border border-pink-400/50 shadow-xs">
                            ✓ Aktif
                          </span>
                        )}
                        {isHighlighted && !isSelected && (
                          <span className="text-[10px] font-mono text-pink-400 font-semibold hidden sm:inline">
                            [Enter ↵]
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-300 block truncate mt-0.5 font-sans">
                        {renderHighlightedText(coin.name, searchQuery)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0 ml-3">
                    <div className="font-bold text-white text-sm">
                      ${formatPrice(coin.basePrice)}
                    </div>
                    <div
                      className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isPositive ? '+' : ''}{coin.change24h}%</span>
                      <span className="text-slate-400 text-[10px] ml-1.5 hidden sm:inline font-normal">
                        Vol: {coin.volume24h}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Dropdown Footer */}
        <div className="shrink-0 px-3.5 py-2 border-t border-[#1e293b] bg-[#0c1322] flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded mr-1">↑↓</kbd> Jelajah
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded mr-1">↵</kbd> Pilih
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded mr-1">ESC</kbd> Tutup
            </span>
          </div>
          <span className="text-pink-400 font-bold hidden sm:inline">
            CCXT Live Feed
          </span>
        </div>
      </div>
    </>
  );
};

