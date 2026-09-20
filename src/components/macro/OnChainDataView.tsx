import React, { useState } from 'react';
import { Database, Activity, ArrowDownRight, ArrowUpRight, ShieldAlert, Cpu, HardDrive, Filter, CheckCircle2 } from 'lucide-react';

interface OnChainDataViewProps {
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

export const OnChainDataView: React.FC<OnChainDataViewProps> = ({
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [selectedAsset, setSelectedAsset] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');

  const onchainMetrics = [
    {
      name: 'MVRV Z-Score',
      value: '2.14',
      status: 'Fair Valuation',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: isId ? 'Rasio Market Value terhadap Realized Value. Zona atas > 5 (Overheated), zona bawah < 0.1 (Undervalued).' : 'Market-to-realized value ratio assessing overall market cycle tops/bottoms.',
    },
    {
      name: 'Exchange Netflow (24j)',
      value: '-14,280 BTC',
      status: 'Net Outflow (Bullish Accumulation)',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: isId ? 'Arus keluar koin dari bursa terpusat ke cold storage (indikasi akumulasi whale).' : 'Coins leaving centralized exchanges to private custody indicating accumulation.',
    },
    {
      name: 'NVT Signal Ratio',
      value: '46.8',
      status: 'Healthy Velocity',
      statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description: isId ? 'Network Value to Transactions Signal mengukur throughput transaksi on-chain terhadap kapitalisasi pasar.' : 'Measures on-chain economic transaction volume against market cap.',
    },
    {
      name: 'Active Addresses (24j)',
      value: '1,048,290',
      status: '+5.4% YoY Growth',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: isId ? 'Jumlah alamat unik yang aktif bertransaksi di ledger desentralisasi dalam 24 jam.' : 'Unique daily active addresses initiating transactions on the blockchain.',
    },
    {
      name: 'Miner Reserve Balance',
      value: '1.81M BTC',
      status: 'Neutral / No Miner Dump',
      statusColor: 'text-slate-300 bg-slate-800 border-slate-700',
      description: isId ? 'Cadangan koin milik mining pool terverifikasi tetap stabil pasca halving.' : 'Verified miner pool treasury balances showing capitulation or hodling behavior.',
    },
    {
      name: 'SOPR (Spent Output Profit)',
      value: '1.024',
      status: 'Profitable Realization',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: isId ? 'SOPR > 1.0 menandakan pelaku pasar merealisasikan profit saat transaksi.' : 'SOPR > 1.0 indicates market participants selling at a net profit.',
    },
  ];

  const whaleTransfers = [
    { hash: '0x8f2...b419', from: 'Unknown Whale', to: 'Binance Cold Storage', amount: '2,500 BTC ($221M)', time: '14 mins ago', type: 'INTERNAL' },
    { hash: '0x3c1...91a2', from: 'Coinbase Prime', to: 'Institutional Custody', amount: '4,100 BTC ($362M)', time: '42 mins ago', type: 'OUTFLOW' },
    { hash: '0x7e8...11f0', from: 'Kraken Exchange', to: 'Unknown Wallet', amount: '1,800 BTC ($159M)', time: '1 hr ago', type: 'OUTFLOW' },
    { hash: '0x2a9...d38c', from: 'Whale 0x981...', to: 'OKX Deposit', amount: '950 BTC ($84M)', time: '2 hrs ago', type: 'INFLOW' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Analitik Data On-Chain & Whale Tracker' : 'On-Chain Metrics & Whale Activity'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">NODE SYNC</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Telemetri ledger langsung: aliran bursa, metrik valuasi fundamental MVRV/NVT, dan aktivitas whale.' : 'Direct ledger telemetry: exchange net flows, MVRV/NVT valuation models, and whale wallets.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(['BTC', 'ETH', 'SOL'] as const).map((coin) => (
              <button
                key={coin}
                onClick={() => setSelectedAsset(coin)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedAsset === coin
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {coin}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of On-Chain Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {onchainMetrics.map((item) => (
          <div
            key={item.name}
            className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">{item.name}</span>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                {item.status}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-2">
              {item.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Live Whale Transfer Log */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>{isId ? 'Peringatan Transaksi Whale Terbesar (Whale Alert Feed)' : 'High-Value Whale Transactions (> $50M)'}</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 px-3">Tx Hash</th>
                <th className="py-2.5 px-3">Pengirim (From)</th>
                <th className="py-2.5 px-3">Penerima (To)</th>
                <th className="py-2.5 px-3">Jumlah Aset</th>
                <th className="py-2.5 px-3">Tipe</th>
                <th className="py-2.5 px-3 text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {whaleTransfers.map((tx) => (
                <tr key={tx.hash} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-cyan-400 font-bold">{tx.hash}</td>
                  <td className="py-3 px-3 text-slate-300">{tx.from}</td>
                  <td className="py-3 px-3 text-slate-300">{tx.to}</td>
                  <td className="py-3 px-3 font-bold text-white">{tx.amount}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'OUTFLOW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : tx.type === 'INFLOW'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
