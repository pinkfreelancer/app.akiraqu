import { calculateAllIndicators } from '../indicators/indicatorEngine';
import { IndicatorsSnapshot } from '../../types/crypto.types';
import { MarketBias, OHLCVCandle } from '../../types/market.types';

export type MtfCellSignal = 'BULL' | 'BEAR' | 'NEUTRAL';

export interface ConsensusSnapshot {
  score: number;
  marketBias: MarketBias;
  mtfSignal: MtfCellSignal;
  rsi14: number;
  macdStatus: 'Bullish Cross' | 'Bearish Cross' | 'Expanding' | 'Converging';
  supertrend: 'UPTREND' | 'DOWNTREND';
  closePrice: number;
  indicators: IndicatorsSnapshot;
}

export function biasToMtfSignal(bias: MarketBias | string, score?: number): MtfCellSignal {
  if (bias === 'Strong Bullish' || bias === 'Bullish') return 'BULL';
  if (bias === 'Strong Bearish' || bias === 'Bearish') return 'BEAR';
  if (typeof score === 'number') {
    if (score >= 58) return 'BULL';
    if (score <= 42) return 'BEAR';
  }
  return 'NEUTRAL';
}

export function computeIndicatorConsensus(
  indicators: IndicatorsSnapshot,
  closePrice: number
): Omit<ConsensusSnapshot, 'indicators'> {
  const weights = [
    { weight: 0.12, signal: indicators.priceAction.signal, confidence: indicators.priceAction.confidence },
    { weight: 0.12, signal: indicators.smc.signal, confidence: indicators.smc.confidence },
    { weight: 0.11, signal: indicators.orderFlow.signal, confidence: indicators.orderFlow.confidence },
    { weight: 0.10, signal: indicators.ict.signal, confidence: indicators.ict.confidence },
    { weight: 0.09, signal: indicators.optionFlow.signal, confidence: indicators.optionFlow.confidence },
    { weight: 0.08, signal: indicators.rsi.signal, confidence: indicators.rsi.confidence },
    { weight: 0.08, signal: indicators.vwap.signal, confidence: indicators.vwap.confidence },
    { weight: 0.08, signal: indicators.fibonacci.signal, confidence: indicators.fibonacci.confidence },
    { weight: 0.08, signal: indicators.macd.signal, confidence: indicators.macd.confidence },
    { weight: 0.06, signal: indicators.ichimoku.signal, confidence: indicators.ichimoku.confidence },
    { weight: 0.04, signal: indicators.tdSequential.signal, confidence: indicators.tdSequential.confidence },
    { weight: 0.04, signal: indicators.elliottWave.signal, confidence: indicators.elliottWave.confidence },
  ];

  let weightedScoreSum = 0;
  for (const item of weights) {
    if (item.signal === 'BULLISH') {
      weightedScoreSum += item.weight * (50 + (item.confidence / 100) * 50);
    } else if (item.signal === 'BEARISH') {
      weightedScoreSum += item.weight * (50 - (item.confidence / 100) * 50);
    } else {
      weightedScoreSum += item.weight * 50;
    }
  }

  const score = Math.max(5, Math.min(96, Math.round(weightedScoreSum)));
  let marketBias: MarketBias = 'Neutral';
  if (score >= 78) marketBias = 'Strong Bullish';
  else if (score >= 58) marketBias = 'Bullish';
  else if (score <= 22) marketBias = 'Strong Bearish';
  else if (score <= 42) marketBias = 'Bearish';

  const mtfSignal = biasToMtfSignal(marketBias, score);

  let macdStatus: ConsensusSnapshot['macdStatus'] = 'Converging';
  if (indicators.macd.crossover === 'BULLISH_CROSS' || indicators.macd.status === 'BULLISH_CROSS') {
    macdStatus = 'Bullish Cross';
  } else if (indicators.macd.crossover === 'BEARISH_CROSS' || indicators.macd.status === 'BEARISH_CROSS') {
    macdStatus = 'Bearish Cross';
  } else if (
    indicators.macd.status === 'BULLISH_EXPANSION' ||
    indicators.macd.status === 'BEARISH_EXPANSION' ||
    indicators.macd.trend === 'EXPANDING_BULLISH' ||
    indicators.macd.trend === 'EXPANDING_BEARISH'
  ) {
    macdStatus = 'Expanding';
  }

  const supertrend: ConsensusSnapshot['supertrend'] =
    score >= 50 && indicators.vwap.relation !== 'BELOW_VWAP'
      ? 'UPTREND'
      : score < 50
        ? 'DOWNTREND'
        : indicators.priceAction.signal === 'BEARISH'
          ? 'DOWNTREND'
          : 'UPTREND';

  return {
    score,
    marketBias,
    mtfSignal,
    rsi14: Number.isFinite(indicators.rsi.rsi14) ? Number(indicators.rsi.rsi14.toFixed(1)) : 50,
    macdStatus,
    supertrend,
    closePrice,
  };
}

export function computeCandleConsensus(candles: OHLCVCandle[]): ConsensusSnapshot | null {
  if (!Array.isArray(candles) || candles.length < 20) {
    return null;
  }
  const indicators = calculateAllIndicators(candles);
  const closePrice = candles[candles.length - 1]?.close ?? 0;
  const consensus = computeIndicatorConsensus(indicators, closePrice);
  return {
    ...consensus,
    indicators,
  };
}
