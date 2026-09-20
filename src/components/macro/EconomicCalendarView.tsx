import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Sparkles, Filter, ChevronRight, Bell } from 'lucide-react';

interface EconomicCalendarViewProps {
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

interface CalendarEvent {
  id: string;
  title: string;
  category: 'MACRO_FED' | 'CRYPTO_UNLOCK' | 'CPI_INFLATION' | 'TECH_UPGRADE';
  date: string;
  time: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  consensus?: string;
  previous?: string;
  countdown: string;
  description: string;
}

export const EconomicCalendarView: React.FC<EconomicCalendarViewProps> = ({
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HIGH' | 'MACRO' | 'CRYPTO'>('ALL');

  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'US Consumer Price Index (CPI) YoY',
      category: 'CPI_INFLATION',
      date: '2026-09-24',
      time: '19:30 WIB / 12:30 UTC',
      impact: 'HIGH',
      consensus: '2.4%',
      previous: '2.6%',
      countdown: '3 Hari 14 Jam',
      description: isId ? 'Data inflasi AS penting penentu arah suku bunga The Fed.' : 'US Inflation print directly impacting Fed rate decisions and risk assets.',
    },
    {
      id: '2',
      title: 'FOMC Interest Rate Decision & Press Conference',
      category: 'MACRO_FED',
      date: '2026-09-28',
      time: '01:00 WIB / 18:00 UTC',
      impact: 'HIGH',
      consensus: '4.25% (-25 bps cut)',
      previous: '4.50%',
      countdown: '7 Hari 18 Jam',
      description: isId ? 'Keputusan suku bunga acuan The Fed dan pidato proyeksi Jerome Powell.' : 'Federal Reserve benchmark rate cut decision and monetary policy speech.',
    },
    {
      id: '3',
      title: 'Solana (SOL) Mainnet Performance Upgrade v2.1',
      category: 'TECH_UPGRADE',
      date: '2026-09-25',
      time: '15:00 WIB / 08:00 UTC',
      impact: 'MEDIUM',
      consensus: 'N/A',
      previous: 'N/A',
      countdown: '4 Hari 9 Jam',
      description: isId ? 'Hardfork optimasi throughput Firedancer validator client.' : 'Consensus protocol update introducing validator scheduling optimizations.',
    },
    {
      id: '4',
      title: 'Celestia (TIA) Major Cliff Token Unlock ($140M)',
      category: 'CRYPTO_UNLOCK',
      date: '2026-09-30',
      time: '07:00 WIB / 00:00 UTC',
      impact: 'HIGH',
      consensus: '8.4% Circulating',
      previous: 'N/A',
      countdown: '9 Hari 21 Jam',
      description: isId ? 'Pelepasan token tim dan investor awal berpotensi menambah tekanan jual jangka pendek.' : 'Scheduled token unlock introducing potential supply volatility.',
    },
    {
      id: '5',
      title: 'US Non-Farm Payrolls (NFP) Employment',
      category: 'MACRO_FED',
      date: '2026-10-02',
      time: '19:30 WIB / 12:30 UTC',
      impact: 'HIGH',
      consensus: '155K',
      previous: '142K',
      countdown: '12 Hari',
      description: isId ? 'Kesehatan pasar tenaga kerja AS yang menjadi indikator ketahanan ekonomi makro.' : 'US jobs creation report determining liquidity policy easing speed.',
    },
  ];

  const filteredEvents = events.filter((ev) => {
    if (activeFilter === 'HIGH') return ev.impact === 'HIGH';
    if (activeFilter === 'MACRO') return ev.category === 'MACRO_FED' || ev.category === 'CPI_INFLATION';
    if (activeFilter === 'CRYPTO') return ev.category === 'CRYPTO_UNLOCK' || ev.category === 'TECH_UPGRADE';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Kalender Ekonomi & Event Kripto' : 'Economic & Crypto Catalysts'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">HIGH IMPACT</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Jadwal rilis data makro ekonomi (CPI, FOMC, NFP) dan event kunci blockchain (Token Unlock, Hardfork).' : 'High-impact macro economic prints and crypto protocol catalysts.'}
              </p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'HIGH', 'MACRO', 'CRYPTO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFilter === f
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    ev.impact === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {ev.impact} IMPACT
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80">
                    {ev.category.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-mono">{ev.title}</h3>
                <p className="text-xs text-slate-400 max-w-2xl">{ev.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                {ev.consensus && (
                  <div className="text-left font-mono">
                    <div className="text-[10px] text-slate-500 uppercase">Konsensus / Est</div>
                    <div className="text-xs font-bold text-cyan-400">{ev.consensus}</div>
                  </div>
                )}
                {ev.previous && (
                  <div className="text-left font-mono">
                    <div className="text-[10px] text-slate-500 uppercase">Sebelumnya</div>
                    <div className="text-xs font-bold text-slate-300">{ev.previous}</div>
                  </div>
                )}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-right min-w-[140px]">
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{ev.countdown}</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">{ev.time}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
