export interface ServerUptimeInfo {
  seconds: number;
  formatted: string;
  startedAt: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
}

export interface V8HeapMemoryInfo {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  arrayBuffersMb?: number;
  heapLimitMb: number;
  totalAvailableMb: number;
  usedHeapPercentage: number;
  allocatedPercentage: number;
}

export interface WsProxyStats {
  connectedClients: number;
  upstreamConnected: boolean;
  activeSubscriptionsCount: number;
}

export interface MarketPipelineInfo {
  asyncEngine: string;
  indicatorCalculationStrategy: string;
  backgroundQueueCalculation: boolean;
  onDemandIndicatorRuns: number;
  totalParallelTickersFetched: number;
  supportedPairsCount: number;
  activeSubscription: string;
  architectureCompliance: string;
  activeMemoryUsage: string;
  lazyLoadPolicy: string;
  serverUptime?: ServerUptimeInfo;
  v8HeapMemory?: V8HeapMemoryInfo;
  wsProxy?: WsProxyStats;
  timestamp?: string;
}

export interface SystemHealthPoint {
  timestamp: string;
  uptimeSeconds: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb?: number;
  status: 'operational' | 'degraded' | 'warning';
  latencyMs: number;
}
