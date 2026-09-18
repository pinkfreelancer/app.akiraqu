import { BacktestTrade } from '../../types/crypto.types';

export interface MonteCarloSimulationResult {
  simulationsCount: number;
  confidenceInterval95: { minEndingCapital: number; maxEndingCapital: number; medianEndingCapital: number };
  maxDrawdownDistribution: { p10: number; p50: number; p90: number; p99: number };
  probabilityOfRuinPercent: number; // probability of hitting 50% drawdown
  simulatedPaths: number[][]; // sampled 8-10 curve paths for visual overlay
}

/**
 * Runs a bootstrap reshuffle Monte Carlo simulation (500 to 1,000 iterations)
 * on executed historical trades to measure risk of ruin, extreme drawdown tail-risk,
 * and 95% confidence intervals under random execution sequence variations.
 */
export function runMonteCarloBootstrap(
  trades: BacktestTrade[],
  initialCapital: number = 10000,
  iterations: number = 500
): MonteCarloSimulationResult {
  if (!trades || trades.length < 5) {
    return {
      simulationsCount: 0,
      confidenceInterval95: {
        minEndingCapital: initialCapital,
        maxEndingCapital: initialCapital,
        medianEndingCapital: initialCapital,
      },
      maxDrawdownDistribution: { p10: 0, p50: 0, p90: 0, p99: 0 },
      probabilityOfRuinPercent: 0,
      simulatedPaths: [],
    };
  }

  const pnlList = trades.map((t) => t.pnlUsd);
  const endingCapitals: number[] = [];
  const maxDrawdowns: number[] = [];
  let ruinHits = 0;
  const samplePaths: number[][] = [];

  for (let i = 0; i < iterations; i++) {
    let currentEquity = initialCapital;
    let peak = initialCapital;
    let maxDd = 0;
    const path: number[] = [initialCapital];

    // Bootstrap resample with replacement
    for (let step = 0; step < pnlList.length; step++) {
      const randomIndex = Math.floor(Math.random() * pnlList.length);
      const tradePnl = pnlList[randomIndex];
      currentEquity += tradePnl;
      if (currentEquity > peak) {
        peak = currentEquity;
      }
      const dd = ((peak - currentEquity) / peak) * 100;
      if (dd > maxDd) {
        maxDd = dd;
      }
      if (currentEquity <= initialCapital * 0.5) {
        // Hit 50% account drawdown (ruin condition)
        ruinHits++;
      }
      path.push(Math.round(currentEquity));
    }

    endingCapitals.push(currentEquity);
    maxDrawdowns.push(maxDd);

    if (samplePaths.length < 12) {
      samplePaths.push(path);
    }
  }

  endingCapitals.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);

  const p5Index = Math.floor(iterations * 0.05);
  const p50Index = Math.floor(iterations * 0.5);
  const p95Index = Math.floor(iterations * 0.95);

  const p10Index = Math.floor(iterations * 0.1);
  const p90Index = Math.floor(iterations * 0.9);
  const p99Index = Math.floor(iterations * 0.99);

  return {
    simulationsCount: iterations,
    confidenceInterval95: {
      minEndingCapital: Math.round(endingCapitals[p5Index]),
      medianEndingCapital: Math.round(endingCapitals[p50Index]),
      maxEndingCapital: Math.round(endingCapitals[p95Index]),
    },
    maxDrawdownDistribution: {
      p10: Number(maxDrawdowns[p10Index].toFixed(1)),
      p50: Number(maxDrawdowns[p50Index].toFixed(1)),
      p90: Number(maxDrawdowns[p90Index].toFixed(1)),
      p99: Number(maxDrawdowns[p99Index].toFixed(1)),
    },
    probabilityOfRuinPercent: Number(((ruinHits / (iterations * pnlList.length)) * 100).toFixed(2)),
    simulatedPaths: samplePaths,
  };
}
