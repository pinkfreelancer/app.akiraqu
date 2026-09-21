import { Router, Request, Response } from 'express';
import { fetchOHLCVOnDemandCCXT, generateDeterministicCandles } from '../../src/services/ccxtService';
import { runBacktest } from '../../src/services/backtest/backtestEngine';
import { extractStatisticalPatterns } from '../../src/services/backtest/aiPatternLearner';
import { executeResilientGeminiCall } from '../../src/services/geminiService';
import { BacktestDataSourceType } from '../../src/types/crypto.types';

export const backtestRouter = Router();

// 1. Quantitative Multi-Indicator Backtest Engine
backtestRouter.post('/backtest', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      symbol = 'BTC/USDT',
      timeframe = '1H',
      indicatorKey = 'confluence',
      parameters,
      config,
      candleCount = 200,
      customCandles,
      dataSource = 'api',
    } = req.body || {};

    let candles = customCandles;
    let resolvedSource: BacktestDataSourceType = dataSource as BacktestDataSourceType;

    if (!Array.isArray(candles) || candles.length < 20) {
      resolvedSource = 'api';
      const limit = Math.min(Math.max(Number(candleCount) || 200, 30), 1000);
      try {
        candles = await fetchOHLCVOnDemandCCXT(symbol, timeframe, limit);
      } catch (_fetchErr) {
        candles = generateDeterministicCandles(symbol, timeframe, limit);
      }
    }

    const result = runBacktest(
      candles,
      symbol,
      timeframe,
      indicatorKey,
      parameters,
      config,
      resolvedSource
    );

    res.json({
      status: 'success',
      data: result,
      meta: {
        latencyMs: Date.now() - startTime,
        candleCount: candles.length,
        dataSource: resolvedSource,
        isVerifiedDefault: result.isVerifiedDefault,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Backtest Execution Failure',
      message: err.message || 'Error executing backtest simulation',
    });
  }
});

// 2. AI Pattern Learning Engine
backtestRouter.post('/backtest/ai-learn', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { backtestResult, language = 'id' } = req.body || {};
    if (!backtestResult || !backtestResult.trades) {
      res.status(400).json({ error: 'Missing backtestResult data' });
      return;
    }

    const isId = language === 'id';
    const baseInsight = extractStatisticalPatterns(backtestResult, isId ? 'id' : 'en');

    const cacheKey = `ai_learn:${backtestResult.symbol}:${backtestResult.timeframe}:${backtestResult.indicatorName}:${backtestResult.totalTrades}:${backtestResult.winRate}:${backtestResult.netProfitPercent}:${language}`;
    const prompt = `You are the Head Quantitative Research and Machine Learning Trader at an institutional crypto hedge fund.
Analyze this backtest performance for ${backtestResult.symbol} (${backtestResult.timeframe}):
- Strategy / Indicator: ${backtestResult.indicatorName}
- Total Trades: ${backtestResult.totalTrades} (Win Rate: ${backtestResult.winRate}%)
- Profit Factor: ${backtestResult.profitFactor} | Net Profit: ${backtestResult.netProfitPercent}% ($${backtestResult.netProfitUsd})
- Max Drawdown: ${backtestResult.maxDrawdownPercent}% ($${backtestResult.maxDrawdownUsd})
- Expectancy: $${backtestResult.expectancyUsd} per trade (R-Multiple: ${backtestResult.expectancyR}R)
- Sharpe Ratio: ${backtestResult.sharpeRatio} | Sortino: ${backtestResult.sortinoRatio || 'N/A'}
- Max Consecutive Wins: ${backtestResult.maxConsecutiveWins || 0}, Losses: ${backtestResult.maxConsecutiveLosses || 0}
- Sample Trade Exit Breakdown: ${backtestResult.winningTrades} wins, ${backtestResult.losingTrades} losses, ${backtestResult.breakevenTrades || 0} breakeven.

Please output structured JSON ONLY (no markdown fences, raw JSON string) matching this exact TypeScript structure:
{
  "summary": "2-3 dense sentences in ${isId ? 'Indonesian' : 'English'} describing the strategic market regime and core pattern behavior.",
  "marketRegimeDetected": "A precise classification (e.g. Strong Momentum, Whipsaw Chop, Liquidation Cascade)",
  "learnedRules": [
    {
      "id": "RULE-1",
      "title": "Short title",
      "condition": "Specific trigger condition",
      "action": "Execution action to take",
      "confidence": 85,
      "winRateImpact": "+12% Win Rate",
      "type": "ENTRY_FILTER"
    }
  ],
  "edgeDiscovery": ["Key discovery 1", "Key discovery 2"],
  "riskLeaks": ["Root cause for losing trades 1", "Root cause 2"],
  "optimizedParameters": {
    "recommendedIndicator": "confluence",
    "stopLossPercent": 1.5,
    "takeProfitRRR": 2.2,
    "slippagePercent": 0.05,
    "minConfluenceScore": 65,
    "explanation": "Why these parameters are mathematically optimal based on this dataset"
  }
}
${isId ? 'PENTING: Tulis seluruh narasi dalam Bahasa Indonesia trading institusional baku.' : ''}`;

    const aiRes = await executeResilientGeminiCall({
      cacheKey,
      prompt,
      timeoutMs: 5000,
    });

    if (aiRes && aiRes.text) {
      try {
        const cleanJson = aiRes.text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        const parsedAI = JSON.parse(cleanJson);

        res.json({
          status: 'success',
          data: {
            ...baseInsight,
            ...parsedAI,
            synergyMatrix: baseInsight.synergyMatrix,
            aiEngine: aiRes.engineName,
            generatedAt: new Date().toISOString(),
          },
          meta: { latencyMs: Date.now() - startTime, engine: aiRes.engineName },
        });
        return;
      } catch (_parseErr) {
        // Fall through to deterministic fallback if JSON parsing failed
      }
    }

    res.json({
      status: 'success',
      data: baseInsight,
      meta: { latencyMs: Date.now() - startTime, engine: 'AKIRAQU Quant Pattern Learner v3.2' },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'AI Pattern Learning Failure',
      message: err.message || 'Error processing AI pattern analysis',
    });
  }
});
