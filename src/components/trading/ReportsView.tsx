import React, { useState } from 'react';
import { TradingReportSummary } from '../../types/crypto.types';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  ShieldAlert,
  BarChart2,
  Percent,
  Layers,
  Printer,
  CheckCircle2,
  Filter,
  DollarSign,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface ReportsViewProps {
  theme?: 'light' | 'dark';
  lang?: Language;
}

const INITIAL_REPORT_DATA: TradingReportSummary = {
  netProfitUsd: 18450.75,
  netProfitPct: 34.2,
  totalTrades: 142,
  winningTrades: 98,
  losingTrades: 44,
  winRate: 69.01,
  profitFactor: 2.38,
  sharpeRatio: 2.14,
  sortinoRatio: 3.42,
  maxDrawdown: 6.85,
  maxDrawdownUsd: 2150.0,
  avgWinUsd: 310.5,
  avgLossUsd: -145.2,
  avgRiskReward: 2.14,
  avgTradeDuration: '4j 28m',
  totalVolumeUsd: 842500.0,
  totalFeesPaid: 420.5,
  longWinRate: 72.4,
  shortWinRate: 64.2,
  monthlyPnl: [
    { month: 'Jan 2026', pnl: 2850.0, trades: 24, winRate: 70.8 },
    { month: 'Feb 2026', pnl: 3420.5, trades: 28, winRate: 71.4 },
    { month: 'Mar 2026', pnl: 1980.0, trades: 22, winRate: 63.6 },
    { month: 'Apr 2026', pnl: -650.0, trades: 18, winRate: 50.0 },
    { month: 'Mei 2026', pnl: 4120.0, trades: 31, winRate: 74.2 },
    { month: 'Jun 2026', pnl: 6730.25, trades: 19, winRate: 73.7 },
  ],
  dailyHeatmap: [
    { date: '2026-06-01', pnl: 420, count: 2 },
    { date: '2026-06-02', pnl: 890, count: 3 },
    { date: '2026-06-03', pnl: -150, count: 1 },
    { date: '2026-06-04', pnl: 1200, count: 4 },
    { date: '2026-06-05', pnl: 340, count: 2 },
    { date: '2026-06-06', pnl: 0, count: 0 },
    { date: '2026-06-07', pnl: 750, count: 2 },
    { date: '2026-06-08', pnl: -220, count: 1 },
    { date: '2026-06-09', pnl: 610, count: 3 },
    { date: '2026-06-10', pnl: 980, count: 2 },
    { date: '2026-06-11', pnl: 1450, count: 5 },
    { date: '2026-06-12', pnl: 310, count: 1 },
    { date: '2026-06-13', pnl: -80, count: 1 },
    { date: '2026-06-14', pnl: 520, count: 2 },
  ],
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [report] = useState<TradingReportSummary>(INITIAL_REPORT_DATA);
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | 'YTD' | 'MONTH' | 'WEEK'>('YTD');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleExportCsv = () => {
    const csvRows = [
      ['Date/Month', 'PnL USD', 'Trades', 'Win Rate %'].join(','),
      ...report.monthlyPnl.map((m) => [m.month, m.pnl, m.trades, `${m.winRate}%`].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMASBTC_Trading_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`font-mono font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isId ? 'Laporan Kinerja & Audit Trading' : 'Trading Performance & Audit Statement'}
            </h2>
            <p className="text-xs font-mono text-slate-400">
              {isId ? 'Statistik kuantitatif, analisis resiko, dan log pembukuan PnL' : 'Institutional analytics, risk metrics & PnL audits'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-800 bg-[#090d16]">
            {(['WEEK', 'MONTH', 'YTD', 'ALL'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                  selectedPeriod === p ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isId ? 'Unduh CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Laporan trading CSV berhasil diunduh ke komputer Anda!</span>
        </div>
      )}

      {/* KPI Key Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Net Profit */}
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Net Profit Total</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            +${report.netProfitUsd.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-0.5">+{report.netProfitPct}% ROI</div>
        </div>

        {/* Win Rate */}
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Win Rate %</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {report.winRate}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{report.winningTrades} Menang / {report.losingTrades} Kalah</div>
        </div>

        {/* Profit Factor */}
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Profit Factor</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {report.profitFactor}x
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Institutional Benchmark &gt; 1.8</div>
        </div>

        {/* Sharpe Ratio */}
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Sharpe Ratio</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">
            {report.sharpeRatio}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Sortino: {report.sortinoRatio}</div>
        </div>

        {/* Max Drawdown */}
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Max Drawdown</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            -{report.maxDrawdown}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">-${report.maxDrawdownUsd}</div>
        </div>

        {/* Avg Risk/Reward */}
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Rata-Rata R:R</div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">
            1 : {report.avgRiskReward}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Durasi: {report.avgTradeDuration}</div>
        </div>
      </div>

      {/* Monthly Performance Breakdown & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly PnL Table (7 Cols) */}
        <div
          className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {isId ? 'Rincian PnL Bulanan (Monthly Audit)' : 'Monthly PnL Breakdown'}
            </span>
            <span className="text-slate-400">{report.monthlyPnl.length} Bulan Terakhir</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Bulan</th>
                  <th className="pb-2">Jumlah Trade</th>
                  <th className="pb-2">Win Rate</th>
                  <th className="pb-2 text-right">Hasil PnL (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {report.monthlyPnl.map((m) => {
                  const isProfit = m.pnl >= 0;
                  return (
                    <tr key={m.month} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-bold text-white">{m.month}</td>
                      <td className="py-2.5 text-slate-300">{m.trades} trades</td>
                      <td className="py-2.5">
                        <span className="text-cyan-400 font-bold">{m.winRate}%</span>
                      </td>
                      <td className={`py-2.5 text-right font-bold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${m.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Risk & Execution Metrics (5 Cols) */}
        <div
          className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              {isId ? 'Analisis Sisi & Efisiensi Biaya' : 'Side & Fee Efficiency'}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Win Rate Long:</span>
                <span className="text-emerald-400 font-bold">{report.longWinRate}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${report.longWinRate}%` }} className="bg-emerald-500 h-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Win Rate Short:</span>
                <span className="text-rose-400 font-bold">{report.shortWinRate}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${report.shortWinRate}%` }} className="bg-rose-500 h-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Rata-Rata Win:</span>
                <span className="text-emerald-400 font-bold">+${report.avgWinUsd}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rata-Rata Loss:</span>
                <span className="text-rose-400 font-bold">${report.avgLossUsd}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Total Fee Bursa:</span>
                <span className="text-amber-400 font-bold">${report.totalFeesPaid}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
