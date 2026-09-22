import {
  BacktestConfig,
  BacktestDataSourceType,
  BacktestResult,
  BacktestTrade,
  EquityPoint,
  IndicatorKey,
  OHLCVCandle,
  SignalType,
  Timeframe,
  VerifiedParameters,
} from '../../types/crypto.types';
import { DEFAULT_VERIFIED_PARAMETERS, INDICATORS_CATALOG } from './verifiedParameters';

export const CONFLUENCE_12_INDICATORS: IndicatorKey[] = [
  'priceAction',
  'smc',
  'orderFlow',
  'ict',
  'optionFlow',
  'rsi',
  'vwap',
  'fibonacci',
  'macd',
  'ichimoku',
  'tdSequential',
  'elliottWave',
];

// Alias for backward compatibility
export const CONFLUENCE_10_INDICATORS = CONFLUENCE_12_INDICATORS;

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapital: 10000,
  riskPerTradePercent: 2.0,
  takeProfitRRR: 2.0, // 2:1 Risk/Reward Ratio
  stopLossPercent: 1.5, // 1.5% SL
  feePercent: 0.05, // 0.05% Taker Fee
  slippagePercent: 0.05, // 0.05% realistic execution slippage
  allowShorting: true,
  usePartialTakeProfit: false,
  useTrailingStop: false,
};

/**
 * Executes a high-fidelity quantitative backtest on historical OHLCV candles
 * using verified institutional parameters for any of the 10 indicators or full confluence.
 */
export function runBacktest(
  candles: OHLCVCandle[],
  symbol: string,
  timeframe: Timeframe,
  indicatorKey: IndicatorKey = 'confluence',
  customParameters?: Partial<VerifiedParameters>,
  customConfig?: Partial<BacktestConfig>,
  dataSource: BacktestDataSourceType = 'api'
): BacktestResult {
  const config: BacktestConfig = { ...DEFAULT_BACKTEST_CONFIG, ...customConfig };
  const params: VerifiedParameters = {
    ...DEFAULT_VERIFIED_PARAMETERS,
    ...customParameters,
    priceAction: { ...DEFAULT_VERIFIED_PARAMETERS.priceAction, ...customParameters?.priceAction },
    vwap: { ...DEFAULT_VERIFIED_PARAMETERS.vwap, ...customParameters?.vwap },
    rsi: { ...DEFAULT_VERIFIED_PARAMETERS.rsi, ...customParameters?.rsi },
    ichimoku: { ...DEFAULT_VERIFIED_PARAMETERS.ichimoku, ...customParameters?.ichimoku },
    fibonacci: { ...DEFAULT_VERIFIED_PARAMETERS.fibonacci, ...customParameters?.fibonacci },
    macd: { ...DEFAULT_VERIFIED_PARAMETERS.macd, ...customParameters?.macd },
    smc: { ...DEFAULT_VERIFIED_PARAMETERS.smc, ...customParameters?.smc },
    ict: { ...DEFAULT_VERIFIED_PARAMETERS.ict, ...customParameters?.ict },
    elliottWave: { ...DEFAULT_VERIFIED_PARAMETERS.elliottWave, ...customParameters?.elliottWave },
    tdSequential: { ...DEFAULT_VERIFIED_PARAMETERS.tdSequential, ...customParameters?.tdSequential },
    orderFlow: { ...DEFAULT_VERIFIED_PARAMETERS.orderFlow, ...customParameters?.orderFlow },
    optionFlow: { ...DEFAULT_VERIFIED_PARAMETERS.optionFlow, ...customParameters?.optionFlow },
    confluence: { ...DEFAULT_VERIFIED_PARAMETERS.confluence, ...customParameters?.confluence },
  };

  const indicatorMeta = INDICATORS_CATALOG.find((i) => i.key === indicatorKey) || INDICATORS_CATALOG[0];

  if (!candles || candles.length < 30) {
    return createEmptyResult(symbol, timeframe, indicatorKey, indicatorMeta.name, config.initialCapital, candles?.length || 0, dataSource);
  }

  let capital = config.initialCapital;
  let peakCapital = capital;
  let maxDrawdownUsd = 0;
  let maxDrawdownPercent = 0;

  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [
    {
      time: candles[0].time,
      date: new Date(candles[0].time).toLocaleDateString(),
      equity: capital,
      drawdownPercent: 0,
    },
  ];

  let currentTrade: {
    entryBar: number;
    entryTime: number;
    entryPrice: number;
    direction: 'LONG' | 'SHORT';
    stopLoss: number;
    takeProfit: number;
    originalStopLoss: number;
    positionSizeUsd: number;
    units: number;
    tp1Hit: boolean;
    highestPriceSinceEntry: number;
    lowestPriceSinceEntry: number;
    confluenceScoreAtEntry: number;
  } | null = null;

  const slippageRate = (config.slippagePercent || 0.05) / 100;
  const feeRate = (config.feePercent || 0.05) / 100;
  const minLookback = 25;

  for (let i = minLookback; i < candles.length; i++) {
    const candle = candles[i];

    // 1. Position Management & Exit Rules
    if (currentTrade) {
      if (currentTrade.direction === 'LONG') {
        currentTrade.highestPriceSinceEntry = Math.max(currentTrade.highestPriceSinceEntry, candle.high);
      } else {
        currentTrade.lowestPriceSinceEntry = Math.min(currentTrade.lowestPriceSinceEntry, candle.low);
      }

      // Dynamic Trailing Stop
      if (config.useTrailingStop) {
        const slDist = Math.abs(currentTrade.entryPrice - currentTrade.originalStopLoss);
        if (currentTrade.direction === 'LONG') {
          const trailSL = currentTrade.highestPriceSinceEntry - slDist * 1.2;
          if (trailSL > currentTrade.stopLoss) {
            currentTrade.stopLoss = trailSL;
          }
        } else {
          const trailSL = currentTrade.lowestPriceSinceEntry + slDist * 1.2;
          if (trailSL < currentTrade.stopLoss) {
            currentTrade.stopLoss = trailSL;
          }
        }
      }

      // Partial Take Profit (Scaling out 50% at TP1 + Move SL to Breakeven)
      if (config.usePartialTakeProfit && !currentTrade.tp1Hit) {
        const tp1Level =
          currentTrade.direction === 'LONG'
            ? currentTrade.entryPrice + Math.abs(currentTrade.entryPrice - currentTrade.originalStopLoss) * 1.5
            : currentTrade.entryPrice - Math.abs(currentTrade.entryPrice - currentTrade.originalStopLoss) * 1.5;

        const isTp1Triggered =
          currentTrade.direction === 'LONG' ? candle.high >= tp1Level : candle.low <= tp1Level;

        if (isTp1Triggered) {
          currentTrade.tp1Hit = true;
          // Move SL to Breakeven (+0.1% buffer to secure fees)
          currentTrade.stopLoss =
            currentTrade.direction === 'LONG'
              ? currentTrade.entryPrice * 1.001
              : currentTrade.entryPrice * 0.999;

          // Partial close 50%
          const partialUnits = currentTrade.units * 0.5;
          const partialSizeUsd = currentTrade.positionSizeUsd * 0.5;
          const partialExitPrice = tp1Level * (1 - (currentTrade.direction === 'LONG' ? slippageRate : -slippageRate));
          const rawReturn =
            currentTrade.direction === 'LONG'
              ? (partialExitPrice - currentTrade.entryPrice) / currentTrade.entryPrice
              : (currentTrade.entryPrice - partialExitPrice) / currentTrade.entryPrice;

          const feeDeductionUsd = partialSizeUsd * (feeRate * 2);
          const pnlUsd = partialSizeUsd * rawReturn - feeDeductionUsd;

          capital += pnlUsd;
          if (capital > peakCapital) peakCapital = capital;

          currentTrade.units -= partialUnits;
          currentTrade.positionSizeUsd -= partialSizeUsd;

          trades.push({
            id: `BT-${trades.length + 1}-P1`,
            entryBar: currentTrade.entryBar,
            entryTime: currentTrade.entryTime,
            entryPrice: Number(currentTrade.entryPrice.toFixed(currentTrade.entryPrice < 2 ? 6 : 2)),
            direction: currentTrade.direction,
            exitBar: i,
            exitTime: candle.time,
            exitPrice: Number(partialExitPrice.toFixed(partialExitPrice < 2 ? 6 : 2)),
            pnlUsd: Number(pnlUsd.toFixed(2)),
            pnlPercent: Number((rawReturn * 100).toFixed(2)),
            result: 'WIN',
            exitReason: 'PARTIAL_TP',
            holdingBars: i - currentTrade.entryBar,
            indicatorSignal: indicatorMeta.shortName,
            slippageDeductionUsd: Number((partialSizeUsd * slippageRate * 2).toFixed(2)),
            feeDeductionUsd: Number(feeDeductionUsd.toFixed(2)),
            confluenceScoreAtEntry: currentTrade.confluenceScoreAtEntry,
          });
        }
      }

      let exitPrice = 0;
      let exitReason: BacktestTrade['exitReason'] | null = null;

      if (currentTrade.direction === 'LONG') {
        if (candle.low <= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss * (1 - slippageRate);
          exitReason = 'STOP_LOSS';
        } else if (candle.high >= currentTrade.takeProfit) {
          exitPrice = currentTrade.takeProfit * (1 - slippageRate);
          exitReason = 'TAKE_PROFIT';
        }
      } else {
        if (candle.high >= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss * (1 + slippageRate);
          exitReason = 'STOP_LOSS';
        } else if (candle.low <= currentTrade.takeProfit) {
          exitPrice = currentTrade.takeProfit * (1 + slippageRate);
          exitReason = 'TAKE_PROFIT';
        }
      }

      // Opposing signal check
      if (!exitReason) {
        const opposingSignal = evaluateSignalAtBar(candles, i, indicatorKey, params);
        if (
          (currentTrade.direction === 'LONG' && opposingSignal === 'BEARISH') ||
          (currentTrade.direction === 'SHORT' && opposingSignal === 'BULLISH')
        ) {
          exitPrice = candle.close * (1 - (currentTrade.direction === 'LONG' ? slippageRate : -slippageRate));
          exitReason = 'SIGNAL_REVERSAL';
        }
      }

      // Close remaining trade if exited
      if (exitReason) {
        const rawReturn =
          currentTrade.direction === 'LONG'
            ? (exitPrice - currentTrade.entryPrice) / currentTrade.entryPrice
            : (currentTrade.entryPrice - exitPrice) / currentTrade.entryPrice;

        const feeDeductionUsd = currentTrade.positionSizeUsd * (feeRate * 2);
        const slippageDeductionUsd = currentTrade.positionSizeUsd * (slippageRate * 2);
        const pnlUsd = currentTrade.positionSizeUsd * rawReturn - feeDeductionUsd;

        capital += pnlUsd;
        if (capital > peakCapital) peakCapital = capital;

        const currentDrawdown = ((peakCapital - capital) / peakCapital) * 100;
        if (currentDrawdown > maxDrawdownPercent) {
          maxDrawdownPercent = currentDrawdown;
          maxDrawdownUsd = peakCapital - capital;
        }

        const holdingBars = i - currentTrade.entryBar;
        const resultType: 'WIN' | 'LOSS' | 'BREAKEVEN' =
          pnlUsd > 1.0 ? 'WIN' : pnlUsd < -1.0 ? 'LOSS' : 'BREAKEVEN';

        trades.push({
          id: `BT-${trades.length + 1}`,
          entryBar: currentTrade.entryBar,
          entryTime: currentTrade.entryTime,
          entryPrice: Number(currentTrade.entryPrice.toFixed(currentTrade.entryPrice < 2 ? 6 : 2)),
          direction: currentTrade.direction,
          exitBar: i,
          exitTime: candle.time,
          exitPrice: Number(exitPrice.toFixed(exitPrice < 2 ? 6 : 2)),
          pnlUsd: Number(pnlUsd.toFixed(2)),
          pnlPercent: Number((rawReturn * 100).toFixed(2)),
          result: resultType,
          exitReason,
          holdingBars,
          indicatorSignal: indicatorMeta.shortName,
          slippageDeductionUsd: Number(slippageDeductionUsd.toFixed(2)),
          feeDeductionUsd: Number(feeDeductionUsd.toFixed(2)),
          confluenceScoreAtEntry: currentTrade.confluenceScoreAtEntry,
        });

        equityCurve.push({
          time: candle.time,
          date: new Date(candle.time).toLocaleDateString(),
          equity: Number(capital.toFixed(2)),
          drawdownPercent: Number(currentDrawdown.toFixed(2)),
          tradeIndex: trades.length,
        });

        currentTrade = null;
      }
    }

    // 2. Signal Evaluation at bar i (Open New Trade)
    if (!currentTrade && i < candles.length - 1) {
      const signal = evaluateSignalAtBar(candles, i, indicatorKey, params);

      if (signal === 'BULLISH' || (signal === 'BEARISH' && config.allowShorting)) {
        const direction = signal === 'BULLISH' ? 'LONG' : 'SHORT';
        const entryPrice =
          direction === 'LONG'
            ? candle.close * (1 + slippageRate)
            : candle.close * (1 - slippageRate);

        const riskAmountUsd = capital * (config.riskPerTradePercent / 100);
        const slDistPercent = config.stopLossPercent / 100;
        const positionSizeUsd = Math.min(capital * 3.0, riskAmountUsd / slDistPercent);
        const units = positionSizeUsd / entryPrice;

        const stopLoss =
          direction === 'LONG'
            ? entryPrice * (1 - slDistPercent)
            : entryPrice * (1 + slDistPercent);

        const takeProfit =
          direction === 'LONG'
            ? entryPrice * (1 + slDistPercent * config.takeProfitRRR)
            : entryPrice * (1 - slDistPercent * config.takeProfitRRR);

        let confluenceScore = 50;
        if (indicatorKey === 'confluence') {
          const indKeys = CONFLUENCE_12_INDICATORS;
          const bullVotes = indKeys.filter((k) => evaluateSignalAtBar(candles, i, k, params) === 'BULLISH').length;
          confluenceScore = Math.round((bullVotes / indKeys.length) * 100);
        }

        currentTrade = {
          entryBar: i,
          entryTime: candle.time,
          entryPrice,
          direction,
          stopLoss,
          takeProfit,
          originalStopLoss: stopLoss,
          positionSizeUsd,
          units,
          tp1Hit: false,
          highestPriceSinceEntry: candle.high,
          lowestPriceSinceEntry: candle.low,
          confluenceScoreAtEntry: confluenceScore,
        };
      }
    }
  }

  // If in position at the end of backtest, mark as open/end-of-data
  if (currentTrade) {
    const lastCandle = candles[candles.length - 1];
    const exitPrice = lastCandle.close;
    const rawReturn =
      currentTrade.direction === 'LONG'
        ? (exitPrice - currentTrade.entryPrice) / currentTrade.entryPrice
        : (currentTrade.entryPrice - exitPrice) / currentTrade.entryPrice;
    const pnlUsd = currentTrade.positionSizeUsd * rawReturn;
    capital += pnlUsd;

    trades.push({
      id: `BT-${trades.length + 1}`,
      entryBar: currentTrade.entryBar,
      entryTime: currentTrade.entryTime,
      entryPrice: Number(currentTrade.entryPrice.toFixed(currentTrade.entryPrice < 2 ? 6 : 2)),
      direction: currentTrade.direction,
      exitBar: candles.length - 1,
      exitTime: lastCandle.time,
      exitPrice: Number(exitPrice.toFixed(exitPrice < 2 ? 6 : 2)),
      pnlUsd: Number(pnlUsd.toFixed(2)),
      pnlPercent: Number((rawReturn * 100).toFixed(2)),
      result: pnlUsd > 1.0 ? 'WIN' : pnlUsd < -1.0 ? 'LOSS' : 'BREAKEVEN',
      exitReason: 'END_OF_DATA',
      holdingBars: candles.length - 1 - currentTrade.entryBar,
      indicatorSignal: indicatorMeta.shortName,
      confluenceScoreAtEntry: currentTrade.confluenceScoreAtEntry,
    });
  }

  // 3. Compute Institutional Performance Metrics
  const winningTrades = trades.filter((t) => t.result === 'WIN');
  const losingTrades = trades.filter((t) => t.result === 'LOSS');
  const breakevenTrades = trades.filter((t) => t.result === 'BREAKEVEN');
  const winRate = trades.length > 0 ? Number(((winningTrades.length / trades.length) * 100).toFixed(1)) : 0;

  const grossProfit = winningTrades.reduce((sum, t) => sum + Math.max(0, t.pnlUsd), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + Math.min(0, t.pnlUsd), 0));
  const profitFactor =
    grossLoss === 0
      ? grossProfit > 0
        ? 99.9
        : 1.0
      : Number((grossProfit / grossLoss).toFixed(2));

  const netProfitUsd = Number((capital - config.initialCapital).toFixed(2));
  const netProfitPercent = Number((((capital - config.initialCapital) / config.initialCapital) * 100).toFixed(2));

  // Average trade metrics
  const avgTradePercent =
    trades.length > 0
      ? Number((trades.reduce((sum, t) => sum + t.pnlPercent, 0) / trades.length).toFixed(2))
      : 0;

  const avgWinPercent =
    winningTrades.length > 0
      ? Number((winningTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / winningTrades.length).toFixed(2))
      : 0;

  const avgLossPercent =
    losingTrades.length > 0
      ? Number((Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlPercent, 0)) / losingTrades.length).toFixed(2))
      : 0;

  // Expectancy Calculations
  const expectancyUsd = trades.length > 0 ? Number((netProfitUsd / trades.length).toFixed(2)) : 0;
  const avgWinR = avgLossPercent > 0 ? avgWinPercent / avgLossPercent : config.takeProfitRRR;
  const winFraction = winRate / 100;
  const lossFraction = 1 - winFraction;
  const expectancyR = Number((winFraction * avgWinR - lossFraction * 1.0).toFixed(2));

  // Consecutive Wins & Losses
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currWins = 0;
  let currLosses = 0;

  for (const tr of trades) {
    if (tr.result === 'WIN') {
      currWins++;
      currLosses = 0;
      if (currWins > maxConsecutiveWins) maxConsecutiveWins = currWins;
    } else if (tr.result === 'LOSS') {
      currLosses++;
      currWins = 0;
      if (currLosses > maxConsecutiveLosses) maxConsecutiveLosses = currLosses;
    } else {
      currWins = 0;
      currLosses = 0;
    }
  }

  // Sharpe & Sortino Ratio Calculations
  let sharpeRatio = 0;
  let sortinoRatio = 0;
  if (trades.length > 2) {
    const mean = avgTradePercent;
    const variance =
      trades.reduce((acc, t) => acc + Math.pow(t.pnlPercent - mean, 2), 0) / trades.length;
    const stdDev = Math.sqrt(variance);
    sharpeRatio = stdDev > 0 ? Number(((mean / stdDev) * Math.sqrt(trades.length)).toFixed(2)) : 0;

    const downsideReturns = trades.filter((t) => t.pnlPercent < 0);
    if (downsideReturns.length > 0) {
      const downsideVariance =
        downsideReturns.reduce((acc, t) => acc + Math.pow(t.pnlPercent, 2), 0) / trades.length;
      const downsideStdDev = Math.sqrt(downsideVariance);
      sortinoRatio = downsideStdDev > 0 ? Number(((mean / downsideStdDev) * Math.sqrt(trades.length)).toFixed(2)) : 0;
    }
  }

  // Calmar Ratio
  const calmarRatio =
    maxDrawdownPercent > 0
      ? Number((netProfitPercent / maxDrawdownPercent).toFixed(2))
      : netProfitPercent > 0
      ? 10.0
      : 0;

  return {
    symbol,
    timeframe,
    indicatorKey,
    indicatorName: indicatorMeta.name,
    dataSource,
    totalCandles: candles.length,
    initialBalance: config.initialCapital,
    finalBalance: Number(capital.toFixed(2)),
    netProfitUsd,
    netProfitPercent,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakevenTrades: breakevenTrades.length,
    winRate,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    maxDrawdownUsd: Number(maxDrawdownUsd.toFixed(2)),
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    expectancyUsd,
    expectancyR,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    averageTradePnlPercent: avgTradePercent,
    averageWinPercent: avgWinPercent,
    averageLossPercent: avgLossPercent,
    trades: trades.reverse(), // most recent first for display
    equityCurve,
    parametersUsed: (params as any)[indicatorKey] || {},
    isVerifiedDefault: !customParameters,
  };
}

/**
 * Signal Evaluator for historical bar i across any of the 10 indicators or full confluence
 */
function evaluateSignalAtBar(
  candles: OHLCVCandle[],
  barIndex: number,
  indicatorKey: IndicatorKey,
  params: VerifiedParameters
): SignalType {
  const slice = candles.slice(0, barIndex + 1);
  const current = slice[slice.length - 1];
  const len = slice.length;

  if (len < 20) return 'NEUTRAL';

  switch (indicatorKey) {
    case 'rsi': {
      const p = params.rsi.period;
      if (len <= p + 1) return 'NEUTRAL';
      const rsiValue = computeRSI(slice, p);
      if (rsiValue <= params.rsi.oversold) return 'BULLISH';
      if (rsiValue >= params.rsi.overbought) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'macd': {
      const { fastPeriod, slowPeriod, signalPeriod } = params.macd;
      if (len <= slowPeriod + signalPeriod) return 'NEUTRAL';
      const { macd, signal, prevMacd, prevSignal } = computeMACD(slice, fastPeriod, slowPeriod, signalPeriod);
      // Bullish crossover
      if (prevMacd <= prevSignal && macd > signal) return 'BULLISH';
      // Bearish crossover
      if (prevMacd >= prevSignal && macd < signal) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'ichimoku': {
      const { tenkan: tLen, kijun: kLen, senkouB: bLen } = params.ichimoku;
      if (len < bLen) return 'NEUTRAL';
      const getMid = (sub: OHLCVCandle[]) => {
        const h = Math.max(...sub.map((c) => c.high));
        const l = Math.min(...sub.map((c) => c.low));
        return (h + l) / 2;
      };
      const tenkan = getMid(slice.slice(-tLen));
      const kijun = getMid(slice.slice(-kLen));
      const spanA = (tenkan + kijun) / 2;
      const spanB = getMid(slice.slice(-bLen));

      if (current.close > Math.max(spanA, spanB) && tenkan > kijun) return 'BULLISH';
      if (current.close < Math.min(spanA, spanB) && tenkan < kijun) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'priceAction': {
      const lookback = params.priceAction.swingLookback;
      const recent = slice.slice(-lookback);
      const prev = slice[slice.length - 2];

      const bodySize = Math.abs(current.close - current.open);
      const lowerWick = Math.min(current.open, current.close) - current.low;
      const upperWick = current.high - Math.max(current.open, current.close);

      const isPinBarBullish = lowerWick > bodySize * params.priceAction.pinBarRatio && upperWick < bodySize;
      const isPinBarBearish = upperWick > bodySize * params.priceAction.pinBarRatio && lowerWick < bodySize;
      const isBullishEngulfing = prev.close < prev.open && current.close > current.open && current.close > prev.open;
      const isBearishEngulfing = prev.close > prev.open && current.close < current.open && current.close < prev.open;

      if (isPinBarBullish || isBullishEngulfing) return 'BULLISH';
      if (isPinBarBearish || isBearishEngulfing) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'vwap': {
      let cumVol = 0;
      let cumTypicalVol = 0;
      const window = Math.min(len, 48);
      const sub = slice.slice(-window);

      for (const c of sub) {
        const tp = (c.high + c.low + c.close) / 3;
        cumTypicalVol += tp * c.volume;
        cumVol += c.volume;
      }
      const vwap = cumTypicalVol / (cumVol || 1);

      let varSum = 0;
      for (const c of sub) {
        const tp = (c.high + c.low + c.close) / 3;
        varSum += Math.pow(tp - vwap, 2) * c.volume;
      }
      const stdDev = Math.sqrt(varSum / (cumVol || 1));

      const lowerBand2 = vwap - params.vwap.band2StdDev * stdDev;
      const upperBand2 = vwap + params.vwap.band2StdDev * stdDev;

      if (current.close < lowerBand2) return 'BULLISH'; // Institutional Mean Reversion
      if (current.close > upperBand2) return 'BEARISH'; // Overextended
      return 'NEUTRAL';
    }

    case 'fibonacci': {
      const lookback = params.fibonacci.swingLookback;
      const sub = slice.slice(-lookback);
      const swingHigh = Math.max(...sub.map((c) => c.high));
      const swingLow = Math.min(...sub.map((c) => c.low));
      const diff = swingHigh - swingLow;

      const gpMin = swingLow + diff * params.fibonacci.goldenPocketMin;
      const gpMax = swingLow + diff * params.fibonacci.goldenPocketMax;

      if (current.close >= gpMin && current.close <= gpMax && current.close > current.open) {
        return 'BULLISH';
      }
      if (current.close < swingLow + diff * 0.382) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'smc': {
      const recent = slice.slice(-params.smc.orderBlockLookback);
      const swingHigh = Math.max(...recent.slice(0, -2).map((c) => c.high));
      const swingLow = Math.min(...recent.slice(0, -2).map((c) => c.low));

      // Break of structure
      if (current.close > swingHigh) return 'BULLISH';
      if (current.close < swingLow) return 'BEARISH';

      // Fair Value Gap check
      if (slice.length >= 3) {
        const c1 = slice[slice.length - 3];
        const c3 = slice[slice.length - 1];
        const gapPct = ((c3.low - c1.high) / c1.high) * 100;
        if (gapPct >= params.smc.minFvgGapPct) return 'BULLISH';
        const bearGapPct = ((c1.low - c3.high) / c1.low) * 100;
        if (bearGapPct >= params.smc.minFvgGapPct) return 'BEARISH';
      }
      return 'NEUTRAL';
    }

    case 'ict': {
      const sub = slice.slice(-30);
      const bsl = Math.max(...sub.map((c) => c.high));
      const ssl = Math.min(...sub.map((c) => c.low));
      const range = bsl - ssl;
      const oteMin = ssl + range * params.ict.oteMin;
      const oteMax = ssl + range * params.ict.oteMax;

      if (current.close >= oteMin && current.close <= oteMax && current.close > current.open) {
        return 'BULLISH';
      }
      if (current.close > bsl * 0.998) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'elliottWave': {
      const lookback = params.elliottWave.trendLookback;
      const startPrice = slice[Math.max(0, len - lookback)].close;
      const isUptrend = current.close > startPrice;
      const prev = slice[slice.length - 2];

      if (isUptrend && current.close > prev.high) return 'BULLISH';
      if (!isUptrend && current.close < prev.low) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'tdSequential': {
      const setupLen = params.tdSequential.setupLength;
      let buyCount = 0;
      let sellCount = 0;

      for (let j = len - 1; j >= Math.max(4, len - setupLen); j--) {
        if (slice[j].close < slice[j - 4].close) buyCount++;
        else break;
      }
      for (let j = len - 1; j >= Math.max(4, len - setupLen); j--) {
        if (slice[j].close > slice[j - 4].close) sellCount++;
        else break;
      }

      if (buyCount >= setupLen) return 'BULLISH'; // Buy Setup 9 Completed (Reversal)
      if (sellCount >= setupLen) return 'BEARISH'; // Sell Setup 9 Completed (Reversal)
      return 'NEUTRAL';
    }

    case 'orderFlow': {
      const lookback = params.orderFlow?.cvdLookback || 20;
      const recent = slice.slice(-lookback);
      let buyVol = 0;
      let sellVol = 0;
      for (const c of recent) {
        const range = (c.high - c.low) || (c.close * 0.001);
        const buyFraction = Math.max(0.08, Math.min(0.92, 0.5 + 0.5 * ((c.close - c.open) / range)));
        buyVol += c.volume * buyFraction;
        sellVol += c.volume * (1 - buyFraction);
      }
      const ratio = buyVol / (sellVol || 1);
      const threshold = params.orderFlow?.deltaThresholdRatio || 1.25;
      if (ratio >= threshold) return 'BULLISH';
      if (ratio <= 1 / threshold) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'optionFlow': {
      const len = slice.length;
      const recent = slice.slice(-20);
      const sma = recent.reduce((a, b) => a + b.close, 0) / recent.length;
      const curr = slice[len - 1].close;
      const trendRatio = curr / sma;
      let pcr = 0.85;
      if (trendRatio > 1.02) pcr = 0.65;
      else if (trendRatio < 0.98) pcr = 1.25;

      if (pcr <= (params.optionFlow?.pcrBullishThreshold || 0.75)) return 'BULLISH';
      if (pcr >= (params.optionFlow?.pcrBearishThreshold || 1.15)) return 'BEARISH';
      return 'NEUTRAL';
    }

    case 'confluence':
    default: {
      const mode = params.confluence?.strategyMode ?? 'weighted';

      if (mode === 'majority_vote') {
        // Majority Voting Consensus Model
        const indKeys = CONFLUENCE_12_INDICATORS;
        let bullishVotes = 0;
        let bearishVotes = 0;

        for (const key of indKeys) {
          const sig = evaluateSignalAtBar(candles, barIndex, key, params);
          if (sig === 'BULLISH') bullishVotes++;
          else if (sig === 'BEARISH') bearishVotes++;
        }

        const bullScore = Math.round((bullishVotes / indKeys.length) * 100);
        const bearScore = Math.round((bearishVotes / indKeys.length) * 100);

        const minAgreed = params.confluence?.minAgreedIndicators ?? 7;
        const minScore = params.confluence?.minScoreThreshold ?? 60;

        if (bullishVotes >= minAgreed && bullScore >= minScore) {
          return 'BULLISH';
        }
        if (bearishVotes >= minAgreed && bearScore >= minScore) {
          return 'BEARISH';
        }
        return 'NEUTRAL';
      }

      // Default: Institutional Weighted Continuous Scoring Model (100% Identical with Live Confluence Engine)
      const weights: Record<IndicatorKey, number> = {
        priceAction: 0.12,
        smc: 0.12,
        orderFlow: 0.11,
        ict: 0.10,
        optionFlow: 0.09,
        rsi: 0.08,
        vwap: 0.08,
        fibonacci: 0.08,
        macd: 0.08,
        ichimoku: 0.06,
        tdSequential: 0.04,
        elliottWave: 0.04,
        confluence: 0,
      };

      let weightedBullScore = 0;
      let weightedBearScore = 0;

      for (const key of CONFLUENCE_12_INDICATORS) {
        const sig = evaluateSignalAtBar(candles, barIndex, key, params);
        const weight = weights[key] || (1 / 12);
        if (sig === 'BULLISH') {
          weightedBullScore += weight * 100;
        } else if (sig === 'BEARISH') {
          weightedBearScore += weight * 100;
        }
      }

      const minScore = params.confluence?.minScoreThreshold ?? 60;

      if (weightedBullScore >= minScore && weightedBullScore > weightedBearScore + 10) {
        return 'BULLISH';
      }
      if (weightedBearScore >= minScore && weightedBearScore > weightedBullScore + 10) {
        return 'BEARISH';
      }
      return 'NEUTRAL';
    }
  }
}

function computeRSI(candles: OHLCVCandle[], period: number): number {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeMACD(
  candles: OHLCVCandle[],
  fast: number,
  slow: number,
  signal: number
): { macd: number; signal: number; prevMacd: number; prevSignal: number } {
  const calcEMA = (data: number[], span: number): number[] => {
    const k = 2 / (span + 1);
    const ema: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  };

  const closes = candles.map((c) => c.close);
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);

  const macdSeries: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdSeries.push(emaFast[i] - emaSlow[i]);
  }

  const signalSeries = calcEMA(macdSeries, signal);
  const n = macdSeries.length;

  return {
    macd: macdSeries[n - 1],
    signal: signalSeries[signalSeries.length - 1],
    prevMacd: macdSeries[n - 2] || macdSeries[n - 1],
    prevSignal: signalSeries[signalSeries.length - 2] || signalSeries[signalSeries.length - 1],
  };
}

function createEmptyResult(
  symbol: string,
  timeframe: Timeframe,
  indicatorKey: IndicatorKey,
  indicatorName: string,
  initialCapital: number,
  totalCandles: number,
  dataSource: BacktestDataSourceType = 'api'
): BacktestResult {
  return {
    symbol,
    timeframe,
    indicatorKey,
    indicatorName,
    dataSource,
    totalCandles,
    initialBalance: initialCapital,
    finalBalance: initialCapital,
    netProfitUsd: 0,
    netProfitPercent: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    breakevenTrades: 0,
    winRate: 0,
    profitFactor: 0,
    maxDrawdownPercent: 0,
    maxDrawdownUsd: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    calmarRatio: 0,
    expectancyUsd: 0,
    expectancyR: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    averageTradePnlPercent: 0,
    averageWinPercent: 0,
    averageLossPercent: 0,
    trades: [],
    equityCurve: [],
    parametersUsed: {},
    isVerifiedDefault: true,
  };
}
