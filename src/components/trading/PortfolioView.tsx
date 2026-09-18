import React, { useState, useMemo } from 'react';
import {
  PortfolioAsset,
  ExchangeBalance,
  SupportedExchange,
} from '../../types/crypto.types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';
import { Language } from '../../i18n/translations';

interface PortfolioViewProps {
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToTrade?: () => void;
  theme?: 'light' | 'dark';
  lang?: Language;
}

const INITIAL_HOLDINGS: PortfolioAsset[] = [
  {
    asset: 'BTC',
    name: 'Bitcoin',
    total: 0.85,
    available: 0.70,
    inOrders: 0.15,
    avgBuyPrice: 62450.0,
    currentPrice: 76391.6,
    valueUsd: 64932.86,
    pnl24h: 1540.2,
    pnl24hPct: 2.45,
    unrealizedPnl: 11850.36,
    unrealizedPnlPct: 22.32,
    allocationPct: 52.4,
  },
  {
    asset: 'ETH',
    name: 'Ethereum',
    total: 8.5,
    available: 6.0,
    inOrders: 2.5,
    avgBuyPrice: 2890.0,
    currentPrice: 3380.0,
    valueUsd: 28730.0,
    pnl24h: -420.5,
    pnl24hPct: -1.45,
    unrealizedPnl: 4165.0,
    unrealizedPnlPct: 16.95,
    allocationPct: 23.2,
  },
  {
    asset: 'SOL',
    name: 'Solana',
    total: 85.0,
    available: 70.0,
    inOrders: 15.0,
    avgBuyPrice: 142.0,
    currentPrice: 185.4,
    valueUsd: 15759.0,
    pnl24h: 890.1,
    pnl24hPct: 5.98,
    unrealizedPnl: 3689.0,
    unrealizedPnlPct: 30.56,
    allocationPct: 12.7,
  },
  {
    asset: 'USDT',
    name: 'Tether USD',
    total: 12540.5,
    available: 12540.5,
    inOrders: 0,
    avgBuyPrice: 1.0,
    currentPrice: 1.0,
    valueUsd: 12540.5,
    pnl24h: 0,
    pnl24hPct: 0,
    unrealizedPnl: 0,
    unrealizedPnlPct: 0,
    allocationPct: 10.1,
  },
  {
    asset: 'PEPE',
    name: 'Pepe',
    total: 185000000,
    available: 185000000,
    inOrders: 0,
    avgBuyPrice: 0.0000085,
    currentPrice: 0.0000108,
    valueUsd: 1998.0,
    pnl24h: 180.2,
    pnl24hPct: 9.85,
    unrealizedPnl: 425.5,
    unrealizedPnlPct: 27.06,
    allocationPct: 1.6,
  },
];

const INITIAL_EXCHANGES: ExchangeBalance[] = [
  {
    exchange: 'BINANCE',
    name: 'Binance Global',
    totalUsd: 78540.36,
    spotUsd: 45000.0,
    futuresUsd: 33540.36,
    unrealizedPnlUsd: 12450.0,
    connected: true,
  },
  {
    exchange: 'OKX',
    name: 'OKX Exchange',
    totalUsd: 32420.0,
    spotUsd: 18000.0,
    futuresUsd: 14420.0,
    unrealizedPnlUsd: 4850.0,
    connected: true,
  },
  {
    exchange: 'BYBIT',
    name: 'Bybit Unified',
    totalUsd: 13000.0,
    spotUsd: 5000.0,
    futuresUsd: 8000.0,
    unrealizedPnlUsd: 2829.86,
    connected: true,
  },
];

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  onSelectSymbol,
  onNavigateToTrade,
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

  const [marketFilter, setMarketFilter] = useState<'ALL' | 'SPOT' | 'FUTURES'>('ALL');
  const [activeRange, setActiveRange] = useState<'7D' | '30D' | '90D' | '1Y' | 'ALL'>('30D');
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferType, setTransferType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Demo Balance vs Real Balance
  const [demoUsdt, setDemoUsdt] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_demo_balance');
      return saved ? Number(saved) : 100000;
    } catch {
      return 100000;
    }
  });

  const [realUsdt, setRealUsdt] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_real_balance');
      return saved ? Number(saved) : 12540.5;
    } catch {
      return 12540.5;
    }
  });

  const currentUsdtBalance = accountMode === 'DEMO' ? demoUsdt : realUsdt;

  const handleToggleAccountMode = (mode: 'DEMO' | 'REAL') => {
    setAccountMode(mode);
    try {
      localStorage.setItem('imasbtc_trading_account_mode', mode);
    } catch {}
    setToastMsg(
      mode === 'DEMO'
        ? (isId ? 'Portofolio beralih ke Mode Akun Demo (Simulasi Paper Trading)' : 'Portfolio switched to Demo Mode (Paper Trading)')
        : (isId ? 'Portofolio beralih ke Mode Akun Real (Bursa Live API)' : 'Portfolio switched to Real Mode (Live API Connected)')
    );
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExecuteTransfer = () => {
    if (transferAmount <= 0) return;
    if (accountMode === 'DEMO') {
      const updated = transferType === 'DEPOSIT' ? demoUsdt + transferAmount : Math.max(0, demoUsdt - transferAmount);
      setDemoUsdt(updated);
      try {
        localStorage.setItem('imasbtc_demo_balance', String(updated));
      } catch {}
    } else {
      const updated = transferType === 'DEPOSIT' ? realUsdt + transferAmount : Math.max(0, realUsdt - transferAmount);
      setRealUsdt(updated);
      try {
        localStorage.setItem('imasbtc_real_balance', String(updated));
      } catch {}
    }
    setShowTransferModal(false);
    setToastMsg(
      isId
        ? `${transferType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} sebesar $${transferAmount.toLocaleString()} USDT berhasil!`
        : `${transferType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} of $${transferAmount.toLocaleString()} USDT processed successfully!`
    );
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Synchronize holdings with active balance
  const holdings = useMemo(() => {
    if (accountMode === 'DEMO') {
      return [
        {
          asset: 'USDT',
          name: 'Tether USD (Demo Cash)',
          total: demoUsdt,
          available: demoUsdt,
          inOrders: 0,
          avgBuyPrice: 1.0,
          currentPrice: 1.0,
          valueUsd: demoUsdt,
          pnl24h: 0,
          pnl24hPct: 0,
          unrealizedPnl: 0,
          unrealizedPnlPct: 0,
          allocationPct: 60.5,
        },
        {
          asset: 'BTC',
          name: 'Bitcoin (Paper)',
          total: 0.5,
          available: 0.5,
          inOrders: 0,
          avgBuyPrice: 65200.0,
          currentPrice: 76391.6,
          valueUsd: 38195.8,
          pnl24h: 934.5,
          pnl24hPct: 2.45,
          unrealizedPnl: 5595.8,
          unrealizedPnlPct: 17.16,
          allocationPct: 27.2,
        },
        {
          asset: 'ETH',
          name: 'Ethereum (Paper)',
          total: 5.0,
          available: 5.0,
          inOrders: 0,
          avgBuyPrice: 3100.0,
          currentPrice: 3380.0,
          valueUsd: 16900.0,
          pnl24h: -247.3,
          pnl24hPct: -1.45,
          unrealizedPnl: 1400.0,
          unrealizedPnlPct: 9.03,
          allocationPct: 12.0,
        },
      ];
    }

    return INITIAL_HOLDINGS.map((h) =>
      h.asset === 'USDT' ? { ...h, total: realUsdt, available: realUsdt, valueUsd: realUsdt } : h
    );
  }, [accountMode, demoUsdt, realUsdt]);

  const [exchanges] = useState<ExchangeBalance[]>(INITIAL_EXCHANGES);

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.valueUsd, 0);
  const totalUnrealizedPnl = holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0);
  const total24hPnl = holdings.reduce((sum, h) => sum + h.pnl24h, 0);
  const total24hPnlPct = (total24hPnl / (Math.max(1, totalPortfolioValue - total24hPnl))) * 100;

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="p-3 bg-cyan-950/90 border border-cyan-400 rounded-xl text-cyan-200 font-mono text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Account Mode Switcher & Market Filter Top Header */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <span>{isId ? 'Manajemen Portofolio Terintegrasi' : 'Unified Portfolio Management'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {accountMode}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {accountMode === 'DEMO'
                ? (isId ? 'Saldo Simulasi Paper Trading • $100k USDT Awal' : 'Simulated Paper Trading • $100k Initial')
                : (isId ? 'Akun Live API • Multi-Exchange Aggregated' : 'Live API Account • Multi-Exchange Aggregated')}
            </div>
          </div>
        </div>

        {/* Demo / Real Account Switcher & Market Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Account Mode Buttons */}
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
              <span>{isId ? 'Akun DEMO' : 'DEMO Mode'}</span>
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isId ? 'Akun REAL (API)' : 'REAL (Live)'}</span>
            </button>
          </div>

          {/* Market Filter: All / Spot / Futures */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-800 bg-[#090d16]">
            {(['ALL', 'SPOT', 'FUTURES'] as const).map((mf) => (
              <button
                key={mf}
                onClick={() => setMarketFilter(mf)}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition cursor-pointer ${
                  marketFilter === mf
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mf}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Top Portfolio Equity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Net Worth Card */}
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              {isId ? 'Total Nilai Portofolio' : 'Total Portfolio Value'}
            </span>
            <span className="text-[10px] text-cyan-400 font-bold">USD</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            ≈ Rp {(totalPortfolioValue * 16200).toLocaleString('id-ID')}
          </div>
        </div>

        {/* 24h PnL Card */}
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
            <span>{isId ? 'PnL Hari Ini (24 Jam)' : '24h Daily PnL'}</span>
            <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
          </div>
          <div
            className={`text-2xl font-bold font-mono mt-1 flex items-center gap-1.5 ${
              total24hPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {total24hPnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span>{total24hPnl >= 0 ? '+' : ''}${total24hPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div
            className={`text-xs font-mono mt-0.5 ${
              total24hPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {total24hPnlPct >= 0 ? '+' : ''}{total24hPnlPct.toFixed(2)}% vs kemarin
          </div>
        </div>

        {/* Total Unrealized Profit */}
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
            <span>{isId ? 'Keuntungan Belum Terealisasi' : 'Total Unrealized PnL'}</span>
            <span className="text-[10px] text-cyan-400 font-bold">ROE</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            +${totalUnrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-mono text-emerald-400 mt-0.5">
            +{( (totalUnrealizedPnl / (totalPortfolioValue - totalUnrealizedPnl)) * 100 ).toFixed(2)}% ROI Keseluruhan
          </div>
        </div>

        {/* Quick Deposit / Withdraw Action Card */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="text-xs font-mono text-slate-400">{isId ? 'Aksi Cepat Saldo' : 'Quick Actions'}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => {
                setTransferType('DEPOSIT');
                setShowTransferModal(true);
              }}
              className="py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => {
                setTransferType('WITHDRAW');
                setShowTransferModal(true);
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Asset Allocation & Exchange Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Asset Allocation Chart & Breakdown (7 Cols) */}
        <div
          className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              {isId ? 'Distribusi Alokasi Aset' : 'Asset Allocation Distribution'}
            </span>
            <span className="text-slate-400">{holdings.length} Aset Terpantau</span>
          </div>

          {/* Allocation Visual Bar */}
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
            <div style={{ width: '52.4%' }} className="bg-amber-400" title="BTC: 52.4%" />
            <div style={{ width: '23.2%' }} className="bg-blue-400" title="ETH: 23.2%" />
            <div style={{ width: '12.7%' }} className="bg-purple-400" title="SOL: 12.7%" />
            <div style={{ width: '10.1%' }} className="bg-emerald-400" title="USDT: 10.1%" />
            <div style={{ width: '1.6%' }} className="bg-rose-400" title="PEPE: 1.6%" />
          </div>

          {/* Asset Allocation Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs pt-1">
            {holdings.map((asset) => (
              <div key={asset.asset} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{asset.asset}</span>
                  <span className="text-cyan-400 font-bold">{asset.allocationPct}%</span>
                </div>
                <div className="text-slate-300 font-bold">${asset.valueUsd.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">{asset.total} {asset.asset}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Exchange Aggregation (5 Cols) */}
        <div
          className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              {isId ? 'Saldo Multi-Exchange Terkoneksi' : 'Connected Multi-Exchanges'}
            </span>
            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              API Active
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {exchanges.map((ex) => (
              <div key={ex.exchange} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {ex.name}
                  </span>
                  <span className="text-cyan-400 font-bold">${ex.totalUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Spot: ${ex.spotUsd.toLocaleString()}</span>
                  <span>Futures: ${ex.futuresUsd.toLocaleString()}</span>
                  <span className="text-emerald-400">+${ex.unrealizedPnlUsd.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Detailed Asset Holdings */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
          <span className="font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            {isId ? 'Daftar Kepemilikan Kripto (Spot & Margin)' : 'Crypto Asset Holdings'}
          </span>
          <span className="text-slate-400 text-[11px]">Real-Time Price Updates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400">
                <th className="pb-2">Aset</th>
                <th className="pb-2">Total Jumlah</th>
                <th className="pb-2">Harga Beli Rata-Rata</th>
                <th className="pb-2">Harga Pasar Terkini</th>
                <th className="pb-2">Total Nilai (USD)</th>
                <th className="pb-2">24h Change</th>
                <th className="pb-2">Keuntungan (PnL)</th>
                <th className="pb-2 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {holdings.map((h) => {
                const isProfitable = h.unrealizedPnl >= 0;
                return (
                  <tr key={h.asset} className="hover:bg-slate-800/30">
                    <td className="py-3">
                      <div className="font-bold text-white text-sm">{h.asset}</div>
                      <div className="text-[10px] text-slate-400">{h.name}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-slate-200 font-bold">{h.total} {h.asset}</div>
                      <div className="text-[10px] text-slate-400">Tersedia: {h.available}</div>
                    </td>
                    <td className="py-3 text-slate-300">
                      ${formatCryptoPrice(h.avgBuyPrice)}
                    </td>
                    <td className="py-3 text-cyan-300 font-bold">
                      ${formatCryptoPrice(h.currentPrice)}
                    </td>
                    <td className="py-3 text-white font-bold">
                      ${h.valueUsd.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          h.pnl24hPct >= 0
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {h.pnl24hPct >= 0 ? '+' : ''}{h.pnl24hPct}%
                      </span>
                    </td>
                    <td className="py-3">
                      <div className={`font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfitable ? '+' : ''}${h.unrealizedPnl.toLocaleString()}
                      </div>
                      <div className={`text-[10px] ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({isProfitable ? '+' : ''}{h.unrealizedPnlPct}%)
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          if (onSelectSymbol) onSelectSymbol(`${h.asset}/USDT`);
                          if (onNavigateToTrade) onNavigateToTrade();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition cursor-pointer"
                      >
                        Trade {h.asset}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Deposit / Withdraw Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 font-mono space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span>{transferType === 'DEPOSIT' ? 'Deposit Kripto / Fiat' : 'Penarikan Saldo (Withdraw)'}</span>
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Pilih Aset</label>
                <select className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white">
                  <option value="USDT">USDT (Tether - TRC20 / Arbitrum / Solana)</option>
                  <option value="BTC">BTC (Bitcoin Mainnet / Lightning)</option>
                  <option value="ETH">ETH (Ethereum ERC20 / Base / Arbitrum)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400">
                  {transferType === 'DEPOSIT' ? 'Jumlah Deposit (USDT)' : 'Jumlah Penarikan (USDT)'}
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="Min 10 USDT"
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              {transferType === 'DEPOSIT' ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-center">
                  <div className="text-[11px] text-slate-400">
                    {accountMode === 'DEMO'
                      ? 'Simulasi Deposit Instan ke Saldo Akun Demo'
                      : 'Alamat Deposit USDT (TRC-20):'}
                  </div>
                  {accountMode === 'REAL' && (
                    <div className="p-2 bg-black/40 rounded border border-slate-700 text-cyan-300 font-bold break-all select-all">
                      TX982NmK1QpX89sLoP3vRtZ71mB4
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-slate-400">Alamat Tujuan Withdraw</label>
                  <input
                    type="text"
                    defaultValue="0x71C...b29F (White-listed Wallet)"
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleExecuteTransfer}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              {transferType === 'DEPOSIT' ? `Konfirmasi Deposit $${transferAmount.toLocaleString()} USDT` : `Konfirmasi Penarikan $${transferAmount.toLocaleString()} USDT`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
