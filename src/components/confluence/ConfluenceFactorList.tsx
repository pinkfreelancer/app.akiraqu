import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { SignalType } from '../../types/crypto.types';

export interface ConfluenceFactorItem {
  key: string;
  name: string;
  signal: SignalType;
  summary: string;
}

interface ConfluenceFactorListProps {
  items: ConfluenceFactorItem[];
  theme?: 'light' | 'dark';
}

export const ConfluenceFactorList: React.FC<ConfluenceFactorListProps> = ({
  items,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
      {items.map((ind) => {
        const isIndBullish = ind.signal === 'BULLISH';
        const isIndBearish = ind.signal === 'BEARISH';

        return (
          <div
            key={ind.key}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
              isDark
                ? 'bg-[#0b0f19] border-[#1e293b] hover:border-slate-700'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            {isIndBullish ? (
              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : isIndBearish ? (
              <CheckSquare className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div className="font-mono text-xs leading-tight">
              <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {ind.name}
              </span>
              <span
                className={`text-[10px] truncate block max-w-[200px] mt-0.5 ${
                  isIndBullish
                    ? 'text-emerald-400 font-semibold'
                    : isIndBearish
                    ? 'text-rose-400 font-semibold'
                    : isDark
                    ? 'text-slate-400'
                    : 'text-slate-600'
                }`}
              >
                {ind.summary}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
