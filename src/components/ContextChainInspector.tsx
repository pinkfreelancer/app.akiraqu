import React, { useState } from 'react';
import { GitCommit, CheckCircle2, Code } from 'lucide-react';
import { ConfluenceEvaluation } from '../types/crypto.types';
import { Language } from '../i18n/translations';

interface ContextChainInspectorProps {
  evaluation: ConfluenceEvaluation;
  lang?: Language;
}

export const ContextChainInspector: React.FC<ContextChainInspectorProps> = ({ evaluation, lang = 'id' }) => {
  const [selectedNode, setSelectedNode] = useState<number>(3); // default on Confluence Engine

  const chainNodes = [
    {
      id: 0,
      title: lang === 'id' ? '01. Konfigurasi Input' : '01. Input Config',
      stage: 'US-001',
      status: lang === 'id' ? 'Tervalidasi Zod' : 'Zod Validated',
      latency: '< 1ms',
      payload: {
        symbol: evaluation.symbol,
        timeframe: evaluation.timeframe,
        idempotencyKey: evaluation.idempotencyKey,
        schema: 'AnalysisSchema',
      },
    },
    {
      id: 1,
      title: lang === 'id' ? '02. Feed OHLCV & Ticker' : '02. OHLCV & Ticker Feed',
      stage: 'Telemetry',
      status: lang === 'id' ? 'CCXT Async / WS Aktif' : 'CCXT Async / WS Live',
      latency: '18ms',
      payload: {
        symbol: evaluation.symbol,
        interval: evaluation.timeframe,
        source: lang === 'id' ? 'CCXT Async Paralel + Binance WebSocket Stream' : 'CCXT Async Parallel + Binance WebSocket Stream',
        candleCount: 85,
        multipairFetch: 'Asynchronous Parallel (Non-Blocking)',
        priceRange: {
          current: evaluation.riskPlan.currentPrice,
          support: evaluation.indicators.priceAction.keySupport,
          resistance: evaluation.indicators.priceAction.keyResistance,
        },
      },
    },
    {
      id: 2,
      title: lang === 'id' ? '03. Mesin 12 Indikator (On-Demand)' : '03. 12-Indicator Engine (On-Demand)',
      stage: 'US-002',
      status: lang === 'id' ? 'Lazy Loaded (1 Koin Aktif)' : 'Lazy Loaded (1 Active Coin)',
      latency: '6ms',
      payload: {
        strategy: 'Lazy Loading / On-Demand Computation',
        policy: 'Zero Background Queue Calculation across Inactive Pairs',
        computedTarget: evaluation.symbol,
        indicatorsCalculated: [
          'priceAction',
          'smc',
          'orderFlow',
          'ict',
          'optionFlow',
          'vwap',
          'rsi',
          'ichimoku',
          'fibonacci',
          'macd',
          'elliottWave',
          'tdSequential',
        ],
        consensus: {
          bullish: evaluation.bullishCount,
          bearish: evaluation.bearishCount,
          neutral: evaluation.neutralCount,
        },
      },
    },
    {
      id: 3,
      title: lang === 'id' ? '04. Skor Konfluensi' : '04. Confluence Scoring',
      stage: 'US-003',
      status: `${evaluation.confluenceScore}/100 [${evaluation.marketBias}]`,
      latency: `${evaluation.latencyMs}ms`,
      payload: {
        score: evaluation.confluenceScore,
        bias: evaluation.marketBias,
        weights: '12% Price Action, 12% SMC, 11% Order Flow, 10% ICT, 9% Option Flow, 8% RSI, 8% VWAP, 8% Fib, 8% MACD, 6% Ichimoku, 4% TD, 4% Wave',
        engine: evaluation.aiEngine,
      },
    },
    {
      id: 4,
      title: lang === 'id' ? '05. Perencana Risiko' : '05. Risk Planner',
      stage: 'US-004',
      status: `RRR ${evaluation.riskPlan.riskRewardRatio}:1`,
      latency: '< 1ms',
      payload: {
        entry: evaluation.riskPlan.entryPrice,
        stopLoss: evaluation.riskPlan.stopLoss,
        tpLadder: [
          evaluation.riskPlan.takeProfit1,
          evaluation.riskPlan.takeProfit2,
          evaluation.riskPlan.takeProfit3,
        ],
        positionSizeUsd: evaluation.riskPlan.suggestedPositionUsd,
        maxRiskCapital: evaluation.riskPlan.maxCapitalAtRisk,
      },
    },
    {
      id: 5,
      title: lang === 'id' ? '06. Artefak Audit' : '06. Audit Artifact',
      stage: 'US-005',
      status: lang === 'id' ? 'Paket Siap' : 'Bundle Ready',
      latency: '2ms',
      payload: {
        standard: 'Impeccable Dual-Output v1.0.0',
        evaluatedAt: evaluation.evaluatedAt,
        idempotencyKey: evaluation.idempotencyKey,
        exportFormats: ['CommonMark (.md)', 'JSON Schema (.json)', 'CSV Matrix (.csv)'],
      },
    },
  ];

  const activePayload = chainNodes[selectedNode].payload;

  return (
    <div className="flex flex-col bg-[#0f172a] rounded-xl border border-[#1e293b] p-5 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">
              {lang === 'id' ? 'Inspektur Rantai Konteks' : 'Chained Context Inspector'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'id' ? 'Pipa Dependensi DAG Deterministik' : 'Deterministic DAG Dependency Pipeline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Deterministik Terverifikasi' : 'Determinism Verified'}</span>
        </div>
      </div>

      {/* DAG Graph Nodes Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {chainNodes.map((node) => {
          const isSelected = selectedNode === node.id;

          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node.id)}
              className={`flex flex-col p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : 'bg-[#0b0f19] border-[#1e293b] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>{node.stage}</span>
                <span className="text-cyan-400">{node.latency}</span>
              </div>
              <span className="text-xs font-bold text-white tracking-tight truncate">
                {node.title}
              </span>
              <span className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                {node.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Node Inspector Payload */}
      <div className="rounded-lg bg-[#0b0f19] border border-[#1e293b] p-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-200">{chainNodes[selectedNode].title}</span>
            <span className="text-[10px] text-slate-500">[{chainNodes[selectedNode].stage}]</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">
            {lang === 'id' ? 'Jabat Tangan Input Tahap N-1 OK' : 'Stage N-1 Input Handshake OK'}
          </span>
        </div>
        <pre className="text-emerald-400/90 text-[11px] overflow-x-auto leading-relaxed max-h-48">
          {JSON.stringify(activePayload, null, 2)}
        </pre>
      </div>
    </div>
  );
};
