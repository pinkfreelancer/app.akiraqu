import React, { useState, useEffect, useMemo } from 'react';
import {
  SupportedExchange,
  MarketType,
  ManualOrderSide,
  ManualOrderType,
  PositionMarginMode,
  OpenPosition,
  ActiveOrder,
} from '../../types/crypto.types';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Sliders,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  Percent,
  DollarSign,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';
import { Language } from '../../i18n/translations';

interface ManualTradingViewProps {
  currentSymbol: string;
  currentPrice: number;
  currentScore?: number;
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  theme?: 'light' | 'dark';
  lang?: Language;
}

const INITIAL_POSITIONS: OpenPosition[] = [
  {
    id: 'pos-1',
    symbol: 'BTC/USDT',
    side: 'LONG',
    size: 0.15,
    sizeUsd: 11450,
    entryPrice: 75800,
    markPrice: 76391.6,
    liquidationPrice: 69200,
    margin: 1145,
    leverage: 10,
    marginMode: 'ISOLATED',
    unrealizedPnl: 88.74,
    unrealizedPnlPct: 7.75,
    takeProfit: 82000,
    stopLoss: 73500,
    exchange: 'BINANCE',
    marketType: 'FUTURES',
    timestamp: Date.now() - 3600000 * 4,
  },
  {
    id: 'pos-2',
    symbol: 'ETH/USDT',
    side: 'SHORT',
    size: 2.5,
    sizeUsd: 8450,
    entryPrice: 3420,
    markPrice: 3380,
    liquidationPrice: 3750,
    margin: 845,
    leverage: 10,
    marginMode: 'CROSS',
    unrealizedPnl: 100.0,
    unrealizedPnlPct: 11.83,
    takeProfit: 3200,
    stopLoss: 3550,
    exchange: 'OKX',
    marketType: 'FUTURES',
    timestamp: Date.now() - 3600000 * 12,
  },
];

const INITIAL_ACTIVE_ORDERS: ActiveOrder[] = [
  {
    id: 'ord-101',
    symbol: 'BTC/USDT',
    side: 'BUY',
    type: 'LIMIT',
    price: 74500,
    amount: 0.2,
    totalUsd: 14900,
    filled: 0,
    status: 'NEW',
    timestamp: Date.now() - 1800000,
    exchange: 'BINANCE',
  },
  {
    id: 'ord-102',
    symbol: 'SOL/USDT',
    side: 'BUY',
    type: 'LIMIT',
    price: 182.5,
    amount: 15,
    totalUsd: 2737.5,
    filled: 0,
    status: 'NEW',
    timestamp: Date.now() - 7200000,
    exchange: 'BYBIT',
  },
];

export const ManualTradingView: React.FC<ManualTradingViewProps> = ({
  currentSymbol,
  currentPrice,
  currentScore = 78,
  selectedExchange,
  selectedMarketType,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Account Mode: DEMO (Paper Trading) vs REAL (API Connected)
  const [accountMode, setAccountMode] = useState<'DEMO' | 'REAL'>(() => {
    try {
      return (localStorage.getItem('imasbtc_trading_account_mode') as 'DEMO' | 'REAL') || 'DEMO';
    } catch {
      return 'DEMO';
    }
  });

  const isSpot = selectedMarketType === 'SPOT';

  // Demo & Real Balances
  const [demoBalance, setDemoBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_demo_balance');
      return saved ? Number(saved) : 100000;
    } catch {
      return 100000;
    }
  });

  const [realBalance, setRealBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_real_balance');
      return saved ? Number(saved) : 12540.5;
    } catch {
      return 12540.5;
    }
  });

  const accountBalance = accountMode === 'DEMO' ? demoBalance : realBalance;

  const setAccountBalance = (updater: number | ((prev: number) => number)) => {
    if (accountMode === 'DEMO') {
      setDemoBalance((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        try {
          localStorage.setItem('imasbtc_demo_balance', String(next));
        } catch {}
        return next;
      });
    } else {
      setRealBalance((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        try {
          localStorage.setItem('imasbtc_real_balance', String(next));
        } catch {}
        return next;
      });
    }
  };

  const handleResetDemoBalance = () => {
    setDemoBalance(100000);
    try {
      localStorage.setItem('imasbtc_demo_balance', '100000');
    } catch {}
    setToastMessage(isId ? 'Saldo Akun Demo berhasil di-reset ke $100,000 USDT!' : 'Demo balance reset to $100,000 USDT!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleAccountMode = (mode: 'DEMO' | 'REAL') => {
    setAccountMode(mode);
    try {
      localStorage.setItem('imasbtc_trading_account_mode', mode);
    } catch {}
    setToastMessage(
      mode === 'DEMO'
        ? (isId ? 'Beralih ke Mode Akun Demo (Simulasi Paper Trading)' : 'Switched to Demo Account (Paper Trading)')
        : (isId ? 'Beralih ke Mode Akun Real (Koneksi API Bursa Terverifikasi)' : 'Switched to Real Account (Exchange API Connected)')
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Form State
  const [side, setSide] = useState<ManualOrderSide>('LONG');
  const [orderType, setOrderType] = useState<ManualOrderType>('LIMIT');
  const [marginMode, setMarginMode] = useState<PositionMarginMode>('ISOLATED');
  const [leverage, setLeverage] = useState<number>(10);
  const [priceInput, setPriceInput] = useState<number>(currentPrice || 76391.6);
  const [amountUsd, setAmountUsd] = useState<number>(1000);
  const [percentSlider, setPercentSlider] = useState<number>(25);
  const [enableTpSl, setEnableTpSl] = useState<boolean>(true);
  const [tpPrice, setTpPrice] = useState<number>(currentPrice * 1.05);
  const [slPrice, setSlPrice] = useState<number>(currentPrice * 0.97);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab State for lower panel
  const [activeBottomTab, setActiveBottomTab] = useState<'POSITIONS' | 'ORDERS' | 'HISTORY'>('POSITIONS');

  // Positions & Orders State (LocalStorage synced)
  const [positions, setPositions] = useState<OpenPosition[]>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_manual_positions');
      return saved ? JSON.parse(saved) : INITIAL_POSITIONS;
    } catch {
      return INITIAL_POSITIONS;
    }
  });

  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_manual_orders');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVE_ORDERS;
    } catch {
      return INITIAL_ACTIVE_ORDERS;
    }
  });

  const effectiveLeverage = isSpot ? 1 : leverage;

  // Sync Price when symbol changes
  useEffect(() => {
    if (currentPrice > 0) {
      setPriceInput(currentPrice);
      setTpPrice(side === 'LONG' || side === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95);
      setSlPrice(side === 'LONG' || side === 'BUY' ? currentPrice * 0.97 : currentPrice * 1.03);
    }
  }, [currentPrice, currentSymbol, side]);

  const savePositions = (newPos: OpenPosition[]) => {
    setPositions(newPos);
    try {
      localStorage.setItem('imasbtc_manual_positions', JSON.stringify(newPos));
    } catch {}
  };

  const saveOrders = (newOrds: ActiveOrder[]) => {
    setActiveOrders(newOrds);
    try {
      localStorage.setItem('imasbtc_manual_orders', JSON.stringify(newOrds));
    } catch {}
  };

  // Calculations
  const cryptoAmount = priceInput > 0 ? (amountUsd * effectiveLeverage) / priceInput : 0;
  const initialMargin = amountUsd;
  const estimatedLiqPrice = useMemo(() => {
    if (isSpot || priceInput <= 0 || effectiveLeverage <= 1) return 0;
    const maintenanceMarginPct = 0.005; // 0.5%
    if (side === 'LONG' || side === 'BUY') {
      return Math.max(0, priceInput * (1 - 1 / effectiveLeverage + maintenanceMarginPct));
    } else {
      return priceInput * (1 + 1 / effectiveLeverage - maintenanceMarginPct);
    }
  }, [priceInput, effectiveLeverage, side, isSpot]);

  const estimatedProfit = useMemo(() => {
    if (!enableTpSl || !tpPrice || priceInput <= 0) return 0;
    const diff = Math.abs(tpPrice - priceInput);
    return (diff / priceInput) * amountUsd * effectiveLeverage;
  }, [enableTpSl, tpPrice, priceInput, amountUsd, effectiveLeverage]);

  const estimatedLoss = useMemo(() => {
    if (!enableTpSl || !slPrice || priceInput <= 0) return 0;
    const diff = Math.abs(priceInput - slPrice);
    return (diff / priceInput) * amountUsd * effectiveLeverage;
  }, [enableTpSl, slPrice, priceInput, amountUsd, effectiveLeverage]);

  const riskRewardRatio = estimatedLoss > 0 ? (estimatedProfit / estimatedLoss).toFixed(2) : '1.00';

  // Handle Order Submit
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountUsd <= 0 || amountUsd > accountBalance) {
      setToastMessage(isId ? 'Saldo akun tidak mencukupi untuk pesanan ini!' : 'Insufficient balance for this order!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (orderType === 'MARKET') {
      // Direct open position / spot execution
      const newPos: OpenPosition = {
        id: `pos-${Date.now()}`,
        symbol: currentSymbol,
        side: isSpot ? (side === 'LONG' || side === 'BUY' ? 'BUY' as any : 'SELL' as any) : (side === 'BUY' || side === 'LONG' ? 'LONG' : 'SHORT'),
        size: Number(cryptoAmount.toFixed(4)),
        sizeUsd: amountUsd * effectiveLeverage,
        entryPrice: currentPrice || priceInput,
        markPrice: currentPrice || priceInput,
        liquidationPrice: isSpot ? 0 : estimatedLiqPrice,
        margin: amountUsd,
        leverage: effectiveLeverage,
        marginMode: isSpot ? 'ISOLATED' : marginMode,
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        takeProfit: enableTpSl ? tpPrice : undefined,
        stopLoss: enableTpSl ? slPrice : undefined,
        exchange: selectedExchange,
        marketType: selectedMarketType,
        timestamp: Date.now(),
      };

      const updated = [newPos, ...positions];
      savePositions(updated);
      setAccountBalance((prev) => prev - amountUsd);
      setToastMessage(
        isId
          ? `${accountMode === 'DEMO' ? '[DEMO] ' : '[REAL] '}Eksekusi ${isSpot ? (side === 'LONG' || side === 'BUY' ? 'BELI SPOT' : 'JUAL SPOT') : side} ${currentSymbol} berhasil!`
          : `${accountMode === 'DEMO' ? '[DEMO] ' : '[REAL] '}${isSpot ? (side === 'LONG' || side === 'BUY' ? 'SPOT BUY' : 'SPOT SELL') : side} for ${currentSymbol} executed successfully!`
      );
    } else {
      // Place limit order
      const newOrd: ActiveOrder = {
        id: `ord-${Date.now()}`,
        symbol: currentSymbol,
        side: isSpot ? (side === 'LONG' || side === 'BUY' ? 'BUY' : 'SELL') : (side === 'BUY' || side === 'LONG' ? 'BUY' : 'SELL'),
        type: orderType,
        price: priceInput,
        amount: Number(cryptoAmount.toFixed(4)),
        totalUsd: amountUsd * effectiveLeverage,
        filled: 0,
        status: 'NEW',
        timestamp: Date.now(),
        exchange: selectedExchange,
      };

      const updated = [newOrd, ...activeOrders];
      saveOrders(updated);
      setToastMessage(
        isId
          ? `${accountMode === 'DEMO' ? '[DEMO] ' : '[REAL] '}Order Limit ${side} @ $${formatCryptoPrice(priceInput)} terpasang!`
          : `${accountMode === 'DEMO' ? '[DEMO] ' : '[REAL] '}Limit ${side} Order placed @ $${formatCryptoPrice(priceInput)}!`
      );
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClosePosition = (id: string) => {
    const pos = positions.find((p) => p.id === id);
    if (!pos) return;
    const remaining = positions.filter((p) => p.id !== id);
    savePositions(remaining);
    setAccountBalance((prev) => prev + pos.margin + pos.unrealizedPnl);
    setToastMessage(
      isId
        ? `Posisi ${pos.symbol} ditutup dengan PnL $${pos.unrealizedPnl.toFixed(2)}`
        : `Position ${pos.symbol} closed with PnL $${pos.unrealizedPnl.toFixed(2)}`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelOrder = (id: string) => {
    const remaining = activeOrders.filter((o) => o.id !== id);
    saveOrders(remaining);
    setToastMessage(isId ? 'Order berhasil dibatalkan' : 'Order canceled successfully');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Mock Order Book Bids & Asks
  const orderBookData = useMemo(() => {
    const mid = currentPrice || 76391.6;
    const asks = [
      { price: mid * 1.0025, size: 1.45, total: 4.85 },
      { price: mid * 1.002, size: 0.82, total: 3.4 },
      { price: mid * 1.0015, size: 2.15, total: 2.58 },
      { price: mid * 1.001, size: 0.43, total: 0.43 },
    ];
    const bids = [
      { price: mid * 0.999, size: 0.95, total: 0.95 },
      { price: mid * 0.9985, size: 1.84, total: 2.79 },
      { price: mid * 0.998, size: 0.65, total: 3.44 },
      { price: mid * 0.9975, size: 2.3, total: 5.74 },
    ];
    return { asks, bids };
  }, [currentPrice]);

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 bg-cyan-950/90 border border-cyan-400 rounded-xl text-cyan-200 font-mono text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Asset & Execution Header Summary with Account Mode & Spot/Futures Selector */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#0f172a]/90 border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{currentSymbol}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg sm:text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ${formatCryptoPrice(currentPrice)}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                +2.45%
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>Exchange: <strong className="text-slate-200">{selectedExchange}</strong></span>
              <span>•</span>
              <span>
                Pasar: <strong className={isSpot ? 'text-emerald-400' : 'text-cyan-400'}>{selectedMarketType}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Account Mode Switcher (DEMO vs REAL) & Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Demo / Real Account Switcher */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-800 bg-[#090d16]">
            <button
              type="button"
              onClick={() => handleToggleAccountMode('DEMO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                accountMode === 'DEMO'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isId ? 'Akun DEMO (Paper)' : 'DEMO (Paper)'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleAccountMode('REAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                accountMode === 'REAL'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isId ? 'Akun REAL (Live API)' : 'REAL (Live API)'}</span>
            </button>
          </div>

          <div className="text-right pl-1">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-end gap-1">
              <span>{accountMode === 'DEMO' ? 'Saldo Demo USDT' : 'Saldo Real USDT'}</span>
              {accountMode === 'DEMO' && (
                <button
                  type="button"
                  onClick={handleResetDemoBalance}
                  title={isId ? 'Reset saldo demo ke $100,000' : 'Reset demo balance to $100,000'}
                  className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer text-[9px]"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="font-bold text-cyan-400 text-sm">
              ${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase">
              {isSpot ? 'Biaya Pendanaan' : 'Funding Rate'}
            </div>
            <div className={`font-bold ${isSpot ? 'text-slate-400' : 'text-emerald-400'}`}>
              {isSpot ? '0.00% (Spot Bebas Fee)' : '+0.0100% in 3h'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Trading Layout: Left Order Ticket Form | Right Order Book & Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Form: Order Entry Ticket (7 Cols on desktop) */}
        <div
          className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          {/* Order Side Selector: Long / Short OR Buy / Sell for Spot */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('LONG')}
              className={`py-2.5 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                side === 'LONG' || side === 'BUY'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400'
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-emerald-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isSpot ? (isId ? 'Beli Spot (BUY)' : 'Buy Spot') : (isId ? 'Buka LONG' : 'Open LONG')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSide('SHORT')}
              className={`py-2.5 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                side === 'SHORT' || side === 'SELL'
                  ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                  : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400'
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-rose-600'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>{isSpot ? (isId ? 'Jual Spot (SELL)' : 'Sell Spot') : (isId ? 'Buka SHORT' : 'Open SHORT')}</span>
            </button>
          </div>

          {/* Margin Mode & Order Type Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            {!isSpot ? (
              <div className="flex items-center gap-1 p-0.5 rounded-lg border border-slate-800 bg-[#090d16]">
                {(['ISOLATED', 'CROSS'] as PositionMarginMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMarginMode(mode)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                      marginMode === mode
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
                {isId ? 'Dompet Spot (Kas Langsung)' : 'Spot Cash Wallet'}
              </div>
            )}

            <div className="flex items-center gap-1 p-0.5 rounded-lg border border-slate-800 bg-[#090d16]">
              {(['LIMIT', 'MARKET', 'STOP_LIMIT'] as ManualOrderType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                    orderType === type
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Leverage Slider (Futures only or Spot Cash info) */}
          {!isSpot ? (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  {isId ? 'Leverage Margin Futures' : 'Futures Leverage Ratio'}
                </span>
                <span className="font-bold text-cyan-400 text-sm">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 pt-1">
                {[1, 5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLeverage(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      leverage === preset
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <span>{isId ? 'Trading Spot: 1x Tanpa Hutang / Tanpa Leverage' : 'Spot Trading: 1x Real Assets, No Leverage'}</span>
              <span className="font-bold text-emerald-400">1x (Spot)</span>
            </div>
          )}

          {/* Form Inputs: Price & Size */}
          <form onSubmit={handlePlaceOrder} className="space-y-3">
            {orderType !== 'MARKET' && (
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>{isId ? 'Harga Eksekusi (Limit Price)' : 'Order Price (Limit)'}</span>
                  <button
                    type="button"
                    onClick={() => setPriceInput(currentPrice)}
                    className="text-cyan-400 hover:underline text-[10px] cursor-pointer"
                  >
                    {isId ? 'Gunakan Harga Terkini' : 'Use Market Price'}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-cyan-400"
                    placeholder="76391.6"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">USDT</span>
                </div>
              </div>
            )}

            {/* Margin Amount Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{isId ? 'Margin Modal (USDT)' : 'Margin Allocation (USDT)'}</span>
                <span>Max: ${accountBalance.toFixed(2)}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amountUsd}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAmountUsd(val);
                    setPercentSlider(Math.min(100, Math.round((val / accountBalance) * 100)));
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-cyan-400"
                  placeholder="1000"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-cyan-400 font-bold">
                  ≈ {(cryptoAmount).toFixed(4)} {currentSymbol.split('/')[0]}
                </span>
              </div>

              {/* Quick % Balance Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setPercentSlider(pct);
                      setAmountUsd(Number(((accountBalance * pct) / 100).toFixed(2)));
                    }}
                    className={`py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      percentSlider === pct
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* TP / SL Toggle & Inputs */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTpSl}
                    onChange={(e) => setEnableTpSl(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span>Take Profit / Stop Loss (Otomatis)</span>
                </label>
                {enableTpSl && (
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    Risk/Reward: 1 : {riskRewardRatio}
                  </span>
                )}
              </div>

              {enableTpSl && (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div>
                    <span className="text-emerald-400 font-bold text-[11px]">TP Target (+5%)</span>
                    <input
                      type="number"
                      step="any"
                      value={tpPrice}
                      onChange={(e) => setTpPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 mt-0.5 bg-slate-900 border border-emerald-500/40 rounded-lg text-emerald-300 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Est: +${estimatedProfit.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-rose-400 font-bold text-[11px]">SL Protect (-3%)</span>
                    <input
                      type="number"
                      step="any"
                      value={slPrice}
                      onChange={(e) => setSlPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 mt-0.5 bg-slate-900 border border-rose-500/40 rounded-lg text-rose-300 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Est: -${estimatedLoss.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Position Summary Card */}
            <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/90 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Total Nilai Pesanan (Notional)</span>
                <span className="font-bold text-white">${(amountUsd * effectiveLeverage).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimasi Harga Likuidasi</span>
                <span className={`font-bold ${isSpot ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isSpot ? 'N/A (Bebas Likuidasi Spot)' : `$${formatCryptoPrice(estimatedLiqPrice)}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Biaya Maker / Taker (Est. 0.02%)</span>
                <span className="text-slate-300">${((amountUsd * effectiveLeverage * 0.0004)).toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99] ${
                side === 'LONG' || side === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                  : 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/25'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                {side === 'LONG' || side === 'BUY'
                  ? `${isSpot ? (isId ? 'Beli Kas Spot' : 'Spot Buy') : (isId ? 'Buka Posisi LONG' : 'Open LONG Position')} ${currentSymbol}`
                  : `${isSpot ? (isId ? 'Jual Kas Spot' : 'Spot Sell') : (isId ? 'Buka Posisi SHORT' : 'Open SHORT Position')} ${currentSymbol}`}
              </span>
            </button>
          </form>
        </div>

        {/* Right Form: Live DOM Order Book Depth (5 Cols on desktop) */}
        <div
          className={`lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                {isId ? 'Buku Order (Live Order Book)' : 'Live Order Book'}
              </span>
              <span className="text-[10px] text-slate-500">0.1 USDT Precision</span>
            </div>

            {/* Asks (Sell Orders) */}
            <div className="space-y-1 pt-2 font-mono text-xs">
              {orderBookData.asks.reverse().map((ask, idx) => (
                <div
                  key={idx}
                  onClick={() => setPriceInput(Number(ask.price.toFixed(2)))}
                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-rose-500/10 cursor-pointer relative overflow-hidden"
                >
                  <span className="text-rose-400 font-bold z-10">${formatCryptoPrice(ask.price)}</span>
                  <span className="text-slate-300 z-10">{ask.size}</span>
                  <span className="text-slate-500 text-[10px] z-10">{ask.total}</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 rounded"
                    style={{ width: `${(ask.total / 6) * 100}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Middle Current Mark Price */}
            <div className="my-2 py-1.5 px-3 rounded-lg bg-[#090d16] border border-cyan-500/30 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-bold text-sm">${formatCryptoPrice(currentPrice)}</span>
              </div>
              <span className="text-slate-400 text-[10px]">Spread: $1.20 (0.001%)</span>
            </div>

            {/* Bids (Buy Orders) */}
            <div className="space-y-1 font-mono text-xs">
              {orderBookData.bids.map((bid, idx) => (
                <div
                  key={idx}
                  onClick={() => setPriceInput(Number(bid.price.toFixed(2)))}
                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-emerald-500/10 cursor-pointer relative overflow-hidden"
                >
                  <span className="text-emerald-400 font-bold z-10">${formatCryptoPrice(bid.price)}</span>
                  <span className="text-slate-300 z-10">{bid.size}</span>
                  <span className="text-slate-500 text-[10px] z-10">{bid.total}</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded"
                    style={{ width: `${(bid.total / 6) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Trade Tips / Risk Notice */}
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 font-mono text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              {isId
                ? 'Gunakan stop-loss ketat saat trading futures dengan leverage di atas 10x untuk melindungi modal akun.'
                : 'Maintain strict stop-loss orders when trading futures with leverage above 10x to protect margin equity.'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Open Positions & Orders Table */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveBottomTab('POSITIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'POSITIONS'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{isId ? 'Posisi Terbuka' : 'Open Positions'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
                {positions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBottomTab('ORDERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'ORDERS'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{isId ? 'Order Aktif' : 'Open Orders'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
                {activeOrders.length}
              </span>
            </button>
          </div>

          {activeBottomTab === 'ORDERS' && activeOrders.length > 0 && (
            <button
              type="button"
              onClick={() => saveOrders([])}
              className="text-xs font-mono text-rose-400 hover:underline cursor-pointer"
            >
              {isId ? 'Batalkan Semua Order' : 'Cancel All Orders'}
            </button>
          )}
        </div>

        {/* Positions Table */}
        {activeBottomTab === 'POSITIONS' && (
          <div className="overflow-x-auto">
            {positions.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-slate-400">
                {isId ? 'Tidak ada posisi terbuka saat ini.' : 'No active open positions.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="pb-2">{isId ? 'Pasangan' : 'Symbol'}</th>
                    <th className="pb-2">{isId ? 'Ukuran / Margin' : 'Size / Margin'}</th>
                    <th className="pb-2">{isId ? 'Entry / Mark' : 'Entry / Mark'}</th>
                    <th className="pb-2">{isId ? 'Harga Likuidasi' : 'Liq Price'}</th>
                    <th className="pb-2">TP / SL</th>
                    <th className="pb-2">{isId ? 'PnL (ROE %)' : 'Unrealized PnL'}</th>
                    <th className="pb-2 text-right">{isId ? 'Aksi' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {positions.map((pos) => {
                    const isProfitable = pos.unrealizedPnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{pos.symbol}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                pos.side === 'LONG' || (pos.side as any) === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {pos.marketType === 'SPOT' || pos.leverage === 1 ? `SPOT ${pos.side}` : `${pos.side} ${pos.leverage}x`}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">{pos.exchange} • {pos.marketType === 'SPOT' ? 'SPOT' : pos.marginMode}</div>
                        </td>
                        <td className="py-2.5">
                          <div className="text-slate-200 font-bold">${pos.sizeUsd.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{pos.size} {pos.symbol.split('/')[0]} (Margin: ${pos.margin})</div>
                        </td>
                        <td className="py-2.5">
                          <div className="text-slate-200">${formatCryptoPrice(pos.entryPrice)}</div>
                          <div className="text-[10px] text-cyan-400">${formatCryptoPrice(pos.markPrice)}</div>
                        </td>
                        <td className="py-2.5 font-bold">
                          {pos.marketType === 'SPOT' || pos.liquidationPrice === 0 ? (
                            <span className="text-emerald-400 text-[11px]">Bebas Liq (Spot)</span>
                          ) : (
                            <span className="text-amber-400">${formatCryptoPrice(pos.liquidationPrice)}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="text-emerald-400 text-[11px]">TP: {pos.takeProfit ? `$${pos.takeProfit}` : '-'}</div>
                          <div className="text-rose-400 text-[11px]">SL: {pos.stopLoss ? `$${pos.stopLoss}` : '-'}</div>
                        </td>
                        <td className="py-2.5">
                          <div
                            className={`font-bold text-sm ${
                              isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isProfitable ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                          </div>
                          <div
                            className={`text-[10px] ${
                              isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ({isProfitable ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleClosePosition(pos.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition cursor-pointer"
                          >
                            {isId ? 'Tutup Market' : 'Market Close'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Orders Table */}
        {activeBottomTab === 'ORDERS' && (
          <div className="overflow-x-auto">
            {activeOrders.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-slate-400">
                {isId ? 'Tidak ada order aktif yang pending.' : 'No pending active orders.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="pb-2">Waktu</th>
                    <th className="pb-2">Pasangan</th>
                    <th className="pb-2">Tipe / Sisi</th>
                    <th className="pb-2">Harga Order</th>
                    <th className="pb-2">Jumlah</th>
                    <th className="pb-2">Terisi</th>
                    <th className="pb-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {activeOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {new Date(ord.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 font-bold text-white">{ord.symbol}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            ord.side === 'BUY' || ord.side === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {ord.type} {ord.side}
                        </span>
                      </td>
                      <td className="py-2.5 text-cyan-300 font-bold">${formatCryptoPrice(ord.price)}</td>
                      <td className="py-2.5 text-slate-200">{ord.amount} (${ord.totalUsd})</td>
                      <td className="py-2.5 text-slate-400">{ord.filled}%</td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(ord.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Batalkan Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
