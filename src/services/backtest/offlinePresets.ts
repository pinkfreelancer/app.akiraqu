import { OHLCVCandle, OfflinePresetScenario, Timeframe } from '../../types/crypto.types';

export const OFFLINE_PRESETS: OfflinePresetScenario[] = [
  {
    id: 'bull_breakout',
    name: 'BTC ETF Breakout & All-Time-High (2024)',
    nameId: 'BTC ETF Breakout & Reli All-Time-High (2024)',
    description: 'Strong macro uptrend ($42K to $73K) with shallow pullbacks, testing momentum continuation and trailing stops.',
    descriptionId: 'Tren naik makro yang kuat ($42K ke $73K) dengan koreksi teratur, menguji strategi breakout dan trailing stop.',
    symbol: 'BTC/USDT',
    timeframe: '4H',
    regime: 'Bullish Trend',
    candleCount: 220,
  },
  {
    id: 'flash_crash_recovery',
    name: 'ETH Liquidation Cascade & V-Shape Rebound',
    nameId: 'ETH Flash Crash Likuidasi & V-Shape Rebound',
    description: 'Sharp waterfall dump ($3.5K to $2.1K) with extreme oversold RSI, testing mean reversion & liquidation absorption.',
    descriptionId: 'Penurunan tajam likuidasi ($3.5K ke $2.1K) dengan RSI oversold ekstrem, menguji penangkapan pantulan mean reversion.',
    symbol: 'ETH/USDT',
    timeframe: '1H',
    regime: 'High Volatility',
    candleCount: 200,
  },
  {
    id: 'range_chop',
    name: 'SOL Sideways Range & False Breakout Consolidation',
    nameId: 'SOL Konsolidasi Sideways & Whipsaw Palsu',
    description: 'Range-bound market between $120 and $155 with repeated fakeouts, testing risk filtering and neutrality discipline.',
    descriptionId: 'Pasar konsolidasi horizontal antara $120-$155 dengan banyak false breakout, menguji filter sinyal palsu dan aturan WAIT.',
    symbol: 'SOL/USDT',
    timeframe: '1H',
    regime: 'Range-Bound',
    candleCount: 180,
  },
  {
    id: 'bear_waterfall',
    name: 'BTC Macro Bearish Capitulation',
    nameId: 'BTC Kapitulasi Bearish Makro',
    description: 'Sustained downtrend with death crosses and lower highs, testing short-selling profitability and capital preservation.',
    descriptionId: 'Tren turun struktural dengan death cross dan lower high, menguji performa shorting dan proteksi modal.',
    symbol: 'BTC/USDT',
    timeframe: '1D',
    regime: 'Bearish Downtrend',
    candleCount: 160,
  },
  {
    id: 'alt_momentum',
    name: 'SEI Explosive Expansion & Micro-Cap Volatility',
    nameId: 'SEI Ekspansi Parabolik & Volatilitas Tinggi',
    description: 'High-beta explosive altcoin expansion cycle with massive volume spikes and dynamic pullback entries.',
    descriptionId: 'Siklus lonjakan agresif altcoin beta tinggi dengan spike volume masif dan peluang entry pullback terukur.',
    symbol: 'SEI/USDT',
    timeframe: '1H',
    regime: 'Altcoin Momentum',
    candleCount: 210,
  },
];

/**
 * Generates realistic deterministic historical candle datasets for offline scenario backtesting.
 */
export function getOfflinePresetCandles(presetId: string): OHLCVCandle[] {
  const now = Date.now();
  const stepMs = 3600 * 1000; // 1 hour step

  switch (presetId) {
    case 'bull_breakout': {
      // BTC $42,000 -> $73,500 with realistic zig-zag bull trend
      const count = 220;
      let price = 42200;
      const candles: OHLCVCandle[] = [];
      for (let i = 0; i < count; i++) {
        const time = now - (count - i) * stepMs * 4;
        const trend = (i / count) * 31300;
        const wave = Math.sin(i * 0.14) * 1200 + Math.cos(i * 0.05) * 800;
        const noise = Math.sin(i * 1.7) * 450;
        const open = price;
        const targetClose = 42200 + trend + wave + noise;
        const close = targetClose;
        const high = Math.max(open, close) + Math.abs(Math.sin(i * 3)) * 600 + 150;
        const low = Math.min(open, close) - Math.abs(Math.cos(i * 2.3)) * 500 - 120;
        const volume = 2500 + Math.abs(Math.sin(i * 0.3)) * 4000 + (close > open ? 1500 : 800);

        candles.push({ time, open, high, low, close, volume });
        price = close;
      }
      return candles;
    }

    case 'flash_crash_recovery': {
      // ETH $3,450 -> $2,120 dump -> $2,980 recovery
      const count = 200;
      let price = 3450;
      const candles: OHLCVCandle[] = [];
      for (let i = 0; i < count; i++) {
        const time = now - (count - i) * stepMs;
        let delta = 0;
        if (i < 40) {
          // pre-dump range
          delta = Math.sin(i * 0.2) * 25;
        } else if (i < 80) {
          // sharp cascade dump
          const progress = (i - 40) / 40;
          delta = -progress * 1300 + Math.sin(i * 0.5) * 40;
        } else {
          // V-shape recovery
          const progress = (i - 80) / 120;
          delta = -1300 + progress * 860 + Math.sin(i * 0.25) * 50;
        }

        const open = price;
        const close = 3450 + delta;
        const high = Math.max(open, close) + Math.abs(Math.sin(i * 2)) * 35 + 8;
        const low = Math.min(open, close) - Math.abs(Math.cos(i * 1.5)) * 35 - 8;
        const volume = 15000 + (i >= 70 && i <= 90 ? 45000 : Math.abs(Math.sin(i * 0.4)) * 12000);

        candles.push({ time, open, high, low, close, volume });
        price = close;
      }
      return candles;
    }

    case 'range_chop': {
      // SOL $125 - $155 range-bound consolidation
      const count = 180;
      let price = 138;
      const candles: OHLCVCandle[] = [];
      for (let i = 0; i < count; i++) {
        const time = now - (count - i) * stepMs;
        const center = 139;
        const cycle = Math.sin(i * 0.18) * 14 + Math.cos(i * 0.45) * 4;
        const open = price;
        const close = center + cycle;
        const high = Math.max(open, close) + Math.abs(Math.sin(i * 1.2)) * 2.8 + 0.5;
        const low = Math.min(open, close) - Math.abs(Math.cos(i * 1.4)) * 2.8 - 0.5;
        const volume = 80000 + Math.abs(Math.sin(i * 0.2)) * 40000;

        candles.push({ time, open, high, low, close, volume });
        price = close;
      }
      return candles;
    }

    case 'bear_waterfall': {
      // BTC $68,000 down to $34,000 bear trend
      const count = 160;
      let price = 68000;
      const candles: OHLCVCandle[] = [];
      for (let i = 0; i < count; i++) {
        const time = now - (count - i) * stepMs * 24; // daily
        const trend = (i / count) * -34000;
        const bearWave = Math.sin(i * 0.15) * 1800;
        const open = price;
        const close = 68000 + trend + bearWave;
        const high = Math.max(open, close) + Math.abs(Math.sin(i * 2.5)) * 900 + 200;
        const low = Math.min(open, close) - Math.abs(Math.cos(i * 2.1)) * 1100 - 300;
        const volume = 3500 + Math.abs(Math.cos(i * 0.2)) * 3000;

        candles.push({ time, open, high, low, close, volume });
        price = close;
      }
      return candles;
    }

    case 'alt_momentum':
    default: {
      // SEI $0.12 -> $0.48 parabolic expansion
      const count = 210;
      let price = 0.125;
      const candles: OHLCVCandle[] = [];
      for (let i = 0; i < count; i++) {
        const time = now - (count - i) * stepMs;
        const surge = Math.pow(i / count, 1.6) * 0.35;
        const wiggle = Math.sin(i * 0.22) * 0.015;
        const open = price;
        const close = 0.125 + surge + wiggle;
        const high = Math.max(open, close) + Math.abs(Math.sin(i * 3)) * 0.008 + 0.002;
        const low = Math.min(open, close) - Math.abs(Math.cos(i * 2.5)) * 0.007 - 0.002;
        const volume = 400000 + Math.abs(Math.sin(i * 0.3)) * 900000;

        candles.push({ time, open, high, low, close, volume });
        price = close;
      }
      return candles;
    }
  }
}

/**
 * Parses user-uploaded CSV or JSON historical candle files.
 */
export function parseCustomCandleUpload(
  fileContent: string,
  fileName: string
): { success: boolean; candles?: OHLCVCandle[]; error?: string } {
  try {
    const trimmed = fileContent.trim();
    if (!trimmed) {
      return { success: false, error: 'File is empty' };
    }

    // 1. Check if JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : parsed.candles || parsed.data || [];
      if (!Array.isArray(list) || list.length < 20) {
        return { success: false, error: 'JSON must contain an array of at least 20 OHLCV candle objects' };
      }

      const candles: OHLCVCandle[] = [];
      for (let idx = 0; idx < list.length; idx++) {
        const item = list[idx];
        const time = Number(item.time || item.timestamp || item.t || Date.parse(item.date || item.datetime || ''));
        const open = parseFloat(item.open || item.o);
        const high = parseFloat(item.high || item.h);
        const low = parseFloat(item.low || item.l);
        const close = parseFloat(item.close || item.c);
        const volume = parseFloat(item.volume || item.v || 0);

        if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
          continue;
        }

        candles.push({
          time: isNaN(time) ? Date.now() - (list.length - idx) * 3600000 : time,
          open,
          high,
          low,
          close,
          volume: isNaN(volume) ? 1000 : volume,
        });
      }

      if (candles.length < 20) {
        return { success: false, error: 'Could not extract at least 20 valid OHLCV candles from JSON' };
      }

      candles.sort((a, b) => a.time - b.time);
      return { success: true, candles };
    }

    // 2. Parse CSV format
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 21) {
      return { success: false, error: 'CSV must contain a header and at least 20 rows of candle data' };
    }

    const header = lines[0].toLowerCase().split(/[,\t;|]/).map((h) => h.trim());
    const openIdx = header.findIndex((h) => h === 'open' || h === 'o');
    const highIdx = header.findIndex((h) => h === 'high' || h === 'h');
    const lowIdx = header.findIndex((h) => h === 'low' || h === 'l');
    const closeIdx = header.findIndex((h) => h === 'close' || h === 'c');
    const volIdx = header.findIndex((h) => h === 'volume' || h === 'vol' || h === 'v');
    const timeIdx = header.findIndex((h) => h === 'time' || h === 'timestamp' || h === 'date' || h === 'datetime' || h === 't');

    if (openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1) {
      return {
        success: false,
        error: 'CSV header must include open, high, low, close columns. Found: ' + header.join(', '),
      };
    }

    const candles: OHLCVCandle[] = [];
    const now = Date.now();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,\t;|]/).map((c) => c.trim());
      if (cols.length <= Math.max(openIdx, highIdx, lowIdx, closeIdx)) continue;

      const open = parseFloat(cols[openIdx]);
      const high = parseFloat(cols[highIdx]);
      const low = parseFloat(cols[lowIdx]);
      const close = parseFloat(cols[closeIdx]);
      const volume = volIdx !== -1 ? parseFloat(cols[volIdx]) : 1000;

      let time = now - (lines.length - i) * 3600000;
      if (timeIdx !== -1 && cols[timeIdx]) {
        const rawTime = cols[timeIdx];
        const parsedEpoch = Number(rawTime);
        if (!isNaN(parsedEpoch) && parsedEpoch > 1000000000) {
          time = parsedEpoch > 100000000000 ? parsedEpoch : parsedEpoch * 1000;
        } else {
          const parsedDate = Date.parse(rawTime);
          if (!isNaN(parsedDate)) time = parsedDate;
        }
      }

      if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
        candles.push({
          time,
          open,
          high,
          low,
          close,
          volume: isNaN(volume) ? 1000 : volume,
        });
      }
    }

    if (candles.length < 20) {
      return { success: false, error: 'Fewer than 20 valid numeric rows parsed from CSV' };
    }

    candles.sort((a, b) => a.time - b.time);
    return { success: true, candles };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to parse file format' };
  }
}
