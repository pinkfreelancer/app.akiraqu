import React, { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Zap, Coins, ArrowUpRight, ArrowDownRight, Sparkles, Clock, Flame, ArrowUpDown, PlusCircle } from 'lucide-react';
import { CryptoSymbolInfo } from '../types/crypto.types';
import { Language, getTranslation } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

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
    if (!listContainerRef.current) return;
    const items = listContainerRef.current.querySelectorAll('[data-coin-item]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

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
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Layer 2':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'DeFi':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'AI / Data':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Meme':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'RWA / Infra':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Gaming':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto bg-[#090d16] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-black/95 flex flex-col max-h-[84vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                <span>{lang === 'id' ? 'Katalog Pasangan Koin & Pencarian Pasar' : 'Coin Pairs Catalog & Market Search'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {symbols.length}+ Pairs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'id'
                  ? 'Ketik simbol atau nama koin. Dukungan input bebas untuk seluruh aset kripto Binance.'
                  : 'Type symbol or coin name. Full on-demand support for any Binance crypto asset.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar & Controls */}
        <div className="p-4 border-b border-[#1e293b] bg-[#0b0f19] space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'id' ? 'Ketik koin apa saja: "SOL", "ENA", "PEPE", "AAVE", "ONDO", "KAS", "DEGEN"...' : 'Search any coin: "SOL", "ENA", "PEPE", "AAVE", "ONDO", "KAS", "DEGEN"...'}
              className="w-full pl-10 pr-16 py-2.5 bg-[#0f172a] border border-[#1e293b] focus:border-cyan-500 rounded-lg text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded border border-slate-800 bg-[#090d16]">
                ESC
              </span>
            )}
          </div>

          {/* Quick Access Popular Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 shrink-0 mr-1">
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
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer shrink-0 ${
                    isCurr
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500 font-bold'
                      : 'bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-cyan-500/50'
                  }`}
                >
                  {base}
                </button>
              );
            })}
          </div>

          {/* Recent Pairs Chips (if any) */}
          {recentPairs.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0 mr-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{lang === 'id' ? 'Terakhir:' : 'Recent:'}</span>
              </span>
              {recentPairs.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/30 border border-blue-800/50 text-blue-300 hover:text-white hover:border-blue-400 transition cursor-pointer shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Category Filter Pills & Sort Dropdown/Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? (lang === 'id' ? 'Semua' : 'All') : cat}
                </button>
              ))}
            </div>

            {/* Sort Toggle Controls */}
            <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
              <span className="text-slate-500 hidden sm:inline flex items-center gap-0.5">
                <ArrowUpDown className="w-3 h-3" />
              </span>
              <button
                type="button"
                onClick={() => setSortOption('relevance')}
                className={`px-2 py-0.5 rounded transition ${
                  sortOption === 'relevance'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'id' ? 'Relevan' : 'Relevance'}
              </button>
              <button
                type="button"
                onClick={() => setSortOption('volume')}
                className={`px-2 py-0.5 rounded transition ${
                  sortOption === 'volume'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vol
              </button>
              <button
                type="button"
                onClick={() => setSortOption('gainers')}
                className={`px-2 py-0.5 rounded transition ${
                  sortOption === 'gainers'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                +Gainers
              </button>
            </div>
          </div>
        </div>

        {/* Speed & Dynamic Pair Notice Banner */}
        <div className="px-4 py-2 bg-emerald-950/20 border-b border-emerald-500/20 flex items-center justify-between text-[11px] font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {lang === 'id'
                ? 'Pencarian Cepat & Fleksibel: 90+ aset kripto terindeks + Dukungan instan untuk pair koin kustom.'
                : 'Fast & Flexible Search: 90+ indexed assets + Instant support for custom crypto pairs.'}
            </span>
          </div>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold">
            Live Feed
          </span>
        </div>

        {/* Coin List & Custom Candidate */}
        <div
          ref={listContainerRef}
          className="p-3 overflow-y-auto flex-1 min-h-[160px] divide-y divide-[#1e293b]/50"
        >
          {/* Custom Dynamic Pair Prompt Card (if user typed a valid ticker not at the top) */}
          {customPairCandidate && (
            <div className="mb-2 p-3 rounded-lg bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {customPairCandidate}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      {lang === 'id' ? 'Aset Bebas On-Demand' : 'On-Demand Asset'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {lang === 'id'
                      ? 'Analisis instan pair ini langsung dari mesin CCXT bursa'
                      : 'Instantly analyze this pair directly from CCXT exchange engine'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelect(customPairCandidate)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition shadow-sm cursor-pointer shrink-0"
              >
                {lang === 'id' ? 'Buka Pair ➔' : 'Open Pair ➔'}
              </button>
            </div>
          )}

          {filteredCoins.length === 0 && !customPairCandidate ? (
            <div className="py-12 text-center text-slate-400 text-sm font-mono space-y-2">
              <div>{lang === 'id' ? 'Tidak ada pasangan kripto yang cocok dengan pencarian Anda.' : 'No crypto pairs match your search.'}</div>
              <div className="text-xs text-slate-500">
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
                      ? 'bg-cyan-500/15 border border-cyan-500/50 shadow-xs'
                      : isHighlighted
                      ? 'bg-slate-800/80 border border-slate-700'
                      : 'hover:bg-[#0f172a] hover:border-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-[#0b0f19] border border-[#1e293b] text-cyan-400'
                      }`}
                    >
                      {coin.symbol.split('/')[0].slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {renderHighlightedText(coin.symbol, searchQuery)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getCategoryColor(coin.category)}`}>
                          {coin.category}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/40">
                            ✓ Aktif
                          </span>
                        )}
                        {isHighlighted && !isSelected && (
                          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                            [Enter ↵]
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {renderHighlightedText(coin.name, searchQuery)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-white text-sm">
                      ${formatPrice(coin.basePrice)}
                    </div>
                    <div
                      className={`text-xs flex items-center justify-end gap-0.5 ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{isPositive ? '+' : ''}{coin.change24h}%</span>
                      <span className="text-slate-500 text-[10px] ml-1.5 hidden sm:inline">
                        Vol: {coin.volume24h}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#0b0f19] border-t border-[#1e293b] flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Navigasi: [↑/↓] jelajah, [Enter] pilih, [ESC] tutup</span>
            <span className="sm:hidden">CCXT Live Catalog</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            {filteredCoins.length} / {symbols.length} Pilihan Aset
          </span>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

