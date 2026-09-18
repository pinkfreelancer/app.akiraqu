import { executeResilientGeminiCall } from '../geminiService';
import {
  ConfluenceEvaluation,
  IndicatorsSnapshot,
  MarketBias,
  RiskManagementPlan,
  Timeframe,
} from '../../types/crypto.types';
import { formatCryptoPrice } from '../../utils/formatters';

interface WeightedIndicator {
  name: string;
  weight: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  summary: string;
}

export async function evaluateConfluence(params: {
  symbol: string;
  timeframe: Timeframe;
  indicators: IndicatorsSnapshot;
  riskPlan: RiskManagementPlan;
  idempotencyKey: string;
  useAI?: boolean;
  language?: 'id' | 'en';
}): Promise<ConfluenceEvaluation> {
  const startTime = Date.now();
  const { symbol, timeframe, indicators, riskPlan, idempotencyKey, useAI = true, language = 'id' } = params;

  const weights: WeightedIndicator[] = [
    { name: 'Price Action & S/R', weight: 0.12, signal: indicators.priceAction.signal, confidence: indicators.priceAction.confidence, summary: indicators.priceAction.summary },
    { name: 'Smart Money Concepts (SMC)', weight: 0.12, signal: indicators.smc.signal, confidence: indicators.smc.confidence, summary: indicators.smc.summary },
    { name: 'Order Flow (CVD & Delta)', weight: 0.11, signal: indicators.orderFlow.signal, confidence: indicators.orderFlow.confidence, summary: indicators.orderFlow.summary },
    { name: 'ICT (Inner Circle Trader)', weight: 0.10, signal: indicators.ict.signal, confidence: indicators.ict.confidence, summary: indicators.ict.summary },
    { name: 'Option Flow (PCR & Max Pain)', weight: 0.09, signal: indicators.optionFlow.signal, confidence: indicators.optionFlow.confidence, summary: indicators.optionFlow.summary },
    { name: 'RSI & Divergence', weight: 0.08, signal: indicators.rsi.signal, confidence: indicators.rsi.confidence, summary: indicators.rsi.summary },
    { name: 'VWAP & Deviation Bands', weight: 0.08, signal: indicators.vwap.signal, confidence: indicators.vwap.confidence, summary: indicators.vwap.summary },
    { name: 'Fibonacci Levels & OTE', weight: 0.08, signal: indicators.fibonacci.signal, confidence: indicators.fibonacci.confidence, summary: indicators.fibonacci.summary },
    { name: 'MACD Momentum', weight: 0.08, signal: indicators.macd.signal, confidence: indicators.macd.confidence, summary: indicators.macd.summary },
    { name: 'Ichimoku Cloud', weight: 0.06, signal: indicators.ichimoku.signal, confidence: indicators.ichimoku.confidence, summary: indicators.ichimoku.summary },
    { name: 'TD Sequential 9-13', weight: 0.04, signal: indicators.tdSequential.signal, confidence: indicators.tdSequential.confidence, summary: indicators.tdSequential.summary },
    { name: 'Elliott Wave Count', weight: 0.04, signal: indicators.elliottWave.signal, confidence: indicators.elliottWave.confidence, summary: indicators.elliottWave.summary },
  ];

  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;
  let weightedScoreSum = 0;

  for (const item of weights) {
    if (item.signal === 'BULLISH') {
      bullishCount++;
      weightedScoreSum += item.weight * (50 + (item.confidence / 100) * 50);
    } else if (item.signal === 'BEARISH') {
      bearishCount++;
      weightedScoreSum += item.weight * (50 - (item.confidence / 100) * 50);
    } else {
      neutralCount++;
      weightedScoreSum += item.weight * 50;
    }
  }

  const confluenceScore = Math.max(5, Math.min(96, Math.round(weightedScoreSum)));

  let marketBias: MarketBias = 'Neutral';
  if (confluenceScore >= 78) marketBias = 'Strong Bullish';
  else if (confluenceScore >= 58) marketBias = 'Bullish';
  else if (confluenceScore <= 22) marketBias = 'Strong Bearish';
  else if (confluenceScore <= 42) marketBias = 'Bearish';

  // Generate Narrative Commentary (via Gemini API or Quantitative Fallback)
  let executiveNarrative = '';
  let aiEngine = 'Deterministic Confluence Core v2.4';

  if (useAI) {
    const languageInstruction = language === 'id'
      ? `PENTING: Tulis seluruh analisis eksekutif dalam Bahasa Indonesia yang profesional, presisi, dan menggunakan istilah trading baku institusional (seperti Konfluensi, Likuiditas, Support/Resistensi, Rasio Risiko:Imbalan, Blok Pesanan / Order Block, Titik Pembatalan Struktural).`
      : `Keep tone objective, professional, institutional, and free of sales fluff or generic jargon.`;

    const prompt = `You are the lead quantitative risk and technical crypto analyst at IMASBTC Desk.
Analyze the following multi-indicator data for ${symbol} on the ${timeframe} timeframe:
- Confluence Score: ${confluenceScore}/100 (${marketBias})
- Bullish Indicators: ${bullishCount}/10, Bearish: ${bearishCount}/10, Neutral: ${neutralCount}/10
- Price Action: ${indicators.priceAction.summary}
- SMC / Order Blocks: ${indicators.smc.summary}
- ICT Structure: ${indicators.ict.summary}
- VWAP: ${indicators.vwap.summary}
- RSI: ${indicators.rsi.summary}
- Elliott Wave: ${indicators.elliottWave.summary}
- Risk Setup: Entry $${riskPlan.entryPrice}, Stop Loss $${riskPlan.stopLoss}, TP1 $${riskPlan.takeProfit1}, TP2 $${riskPlan.takeProfit2}, TP3 $${riskPlan.takeProfit3}, RRR ${riskPlan.riskRewardRatio}:1

Write a succinct, high-density institutional crypto executive summary (in Markdown format).
Include:
1. Executive Market Bias & Macro Confluence Thesis (${language === 'id' ? 'Tesis Bias Pasar & Konfluensi Makro' : 'Executive Bias'})
2. Key Structural Drivers (SMC/ICT/Price Action confluence)
3. Actionable Execution Plan (Entry, Invalidation, Target Take-Profits)
4. Failure Condition & Tail Risk Invalidation Trigger

${languageInstruction}`;

    const cacheKey = `confluence:${symbol}:${timeframe}:${confluenceScore}:${marketBias}:${bullishCount}:${language}`;
    const aiRes = await executeResilientGeminiCall({
      cacheKey,
      prompt,
      timeoutMs: 4500,
    });

    if (aiRes && aiRes.text) {
      executiveNarrative = aiRes.text;
      aiEngine = aiRes.engineName;
    }
  }

  if (!executiveNarrative) {
    executiveNarrative = generateInstitutionalFallbackNarrative({
      symbol,
      timeframe,
      confluenceScore,
      marketBias,
      bullishCount,
      bearishCount,
      neutralCount,
      indicators,
      riskPlan,
      language,
    });
  }

  const evaluation: ConfluenceEvaluation = {
    symbol,
    timeframe,
    evaluatedAt: new Date().toISOString(),
    confluenceScore,
    marketBias,
    bullishCount,
    bearishCount,
    neutralCount,
    indicators,
    riskPlan,
    executiveNarrative,
    machinePayloadJson: JSON.stringify(
      {
        symbol,
        timeframe,
        score: confluenceScore,
        bias: marketBias,
        counts: { bullish: bullishCount, bearish: bearishCount, neutral: neutralCount },
        tradeSetup: {
          entry: riskPlan.entryPrice,
          stopLoss: riskPlan.stopLoss,
          takeProfit1: riskPlan.takeProfit1,
          takeProfit2: riskPlan.takeProfit2,
          takeProfit3: riskPlan.takeProfit3,
          rrr: riskPlan.riskRewardRatio,
          recommendedLeverage: riskPlan.recommendedLeverage,
        },
        indicators: {
          priceAction: indicators.priceAction,
          vwap: indicators.vwap,
          rsi: indicators.rsi,
          smc: indicators.smc,
          ict: indicators.ict,
          fibonacci: indicators.fibonacci,
          macd: indicators.macd,
          ichimoku: indicators.ichimoku,
          elliottWave: indicators.elliottWave,
          tdSequential: indicators.tdSequential,
        },
      },
      null,
      2
    ),
    idempotencyKey,
    latencyMs: Date.now() - startTime,
    aiEngine,
  };

  return evaluation;
}

function generateInstitutionalFallbackNarrative(params: {
  symbol: string;
  timeframe: Timeframe;
  confluenceScore: number;
  marketBias: MarketBias;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  indicators: IndicatorsSnapshot;
  riskPlan: RiskManagementPlan;
  language?: 'id' | 'en';
}): string {
  const { symbol, timeframe, confluenceScore, marketBias, bullishCount, indicators, riskPlan, language = 'id' } = params;
  const isBull = marketBias.includes('Bullish');

  if (language === 'id') {
    const biasIdMap: Record<MarketBias, string> = {
      'Strong Bullish': 'Sangat Bullish (Tren Kuat)',
      'Bullish': 'Bullish (Konfirmasi Positif)',
      'Neutral': 'Netral (Konsolidasi)',
      'Bearish': 'Bearish (Tekanan Jual)',
      'Strong Bearish': 'Sangat Bearish (Distribusi Masif)',
    };

    return `### IMASBTC Analisis Institusional: ${symbol} (${timeframe})

#### 1. Tesis Bias Pasar & Konfluensi Makro
- **Indeks Konfluensi Gabungan**: **${confluenceScore}/100** (${biasIdMap[marketBias] || marketBias})
- **Penyelarasan Indikator**: **${bullishCount} dari 12** mesin modular mengonfirmasi arah konfluensi.
- **Posisi Struktur Makro**: Aset menunjukkan ${isBull ? 'perpindahan struktural positif di atas area nilai (value area)' : 'tekanan distribusi institusional dengan penyerapan likuiditas sisi bawah'} pada kerangka waktu ${timeframe}.

#### 2. Pendorong Utama Struktur Pasar (Konfluensi SMC & Multi-Indikator)
- **Struktur Pasar & SMC**: ${indicators.smc.summary}
- **Zona Likuiditas & Pola ICT**: ${indicators.ict.summary}
- **Profil Volume & VWAP**: ${indicators.vwap.summary}
- **Verifikasi Momentum**: ${indicators.rsi.summary} dan ${indicators.macd.summary}

#### 3. Matriks Eksekusi & Arsitektur Posisi
- **Harga Masuk Direkomendasikan (Entry)**: **$${formatCryptoPrice(riskPlan.entryPrice)}**
- **Stop Loss (Titik Pembatalan)**: **$${formatCryptoPrice(riskPlan.stopLoss)}** (Terproteksi penyangga ATR)
- **Target Take-Profit (Bertingkat)**:
  - **TP 1 (Ambil Untung 40%)**: $${formatCryptoPrice(riskPlan.takeProfit1)}
  - **TP 2 (Ambil Untung 30%)**: $${formatCryptoPrice(riskPlan.takeProfit2)}
  - **TP 3 (Posisi Runner 30%)**: $${formatCryptoPrice(riskPlan.takeProfit3)}
- **Rasio Risiko terhadap Imbalan (RRR)**: **${riskPlan.riskRewardRatio}:1**
- **Batas Risiko Portofolio**: ${riskPlan.riskPercentage}% ($${riskPlan.maxCapitalAtRisk < 0.01 ? riskPlan.maxCapitalAtRisk.toFixed(4) : riskPlan.maxCapitalAtRisk.toLocaleString()} dari ekuitas $${riskPlan.accountBalance.toLocaleString()})
- **Rekomendasi Leverage**: ${riskPlan.recommendedLeverage}x (Penyangga likuidasi aman pada $${formatCryptoPrice(riskPlan.estimatedLiquidationPrice)})

#### 4. Pemicu Pembatalan Risiko Ekor (Tail Risk Invalidation)
- **Kondisi Pembatalan Struktural**: ${riskPlan.invalidationTrigger}.
- Jika lilin (candle) ditutup melewati batas pembatalan, segera tutup posisi secara disiplin tanpa melakukan averaging down.`;
  }

  return `### IMASBTC Institutional Analysis: ${symbol} (${timeframe})

#### 1. Executive Market Bias & Confluence Thesis
- **Composite Confluence Index**: **${confluenceScore}/100** (${marketBias})
- **Indicator Alignment**: **${bullishCount} of 12** modular engines affirm directional confluence.
- **Macro Position**: Asset exhibits ${isBull ? 'positive structural displacement above value area' : 'downward institutional pressure with supply absorption'} on the ${timeframe} frame.

#### 2. Key Structural Drivers (SMC & Multi-Indicator Confluence)
- **Market Structure & SMC**: ${indicators.smc.summary}
- **Liquidity & ICT Zones**: ${indicators.ict.summary}
- **Volume Profile & VWAP**: ${indicators.vwap.summary}
- **Momentum Verification**: ${indicators.rsi.summary} and ${indicators.macd.summary}

#### 3. Execution Matrix & Position Architecture
- **Suggested Entry**: **$${formatCryptoPrice(riskPlan.entryPrice)}**
- **Stop Loss Invalidation**: **$${formatCryptoPrice(riskPlan.stopLoss)}** (Risk buffer protected)
- **Primary Targets**:
  - **TP 1 (40% scale)**: $${formatCryptoPrice(riskPlan.takeProfit1)}
  - **TP 2 (30% scale)**: $${formatCryptoPrice(riskPlan.takeProfit2)}
  - **TP 3 (Runner)**: $${formatCryptoPrice(riskPlan.takeProfit3)}
- **Risk-to-Reward Ratio**: **${riskPlan.riskRewardRatio}:1**
- **Max Account Risk**: ${riskPlan.riskPercentage}% ($${riskPlan.maxCapitalAtRisk < 0.01 ? riskPlan.maxCapitalAtRisk.toFixed(4) : riskPlan.maxCapitalAtRisk.toLocaleString()} on $${riskPlan.accountBalance.toLocaleString()} capital)
- **Optimal Leverage**: ${riskPlan.recommendedLeverage}x (Liquidation buffer at $${formatCryptoPrice(riskPlan.estimatedLiquidationPrice)})

#### 4. Tail Risk Invalidation & Failure Rules
- **Structural Invalidation**: ${riskPlan.invalidationTrigger}.
- If candle closes beyond invalidation, immediately cut exposure without averaging down.`;
}
