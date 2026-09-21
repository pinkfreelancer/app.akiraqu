export type RealtimeChannel = 'ticker' | 'depth' | 'trades' | 'kline';

export type RealtimeConnectionStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

export interface SubscriptionTopic {
  exchange: string;
  channel: RealtimeChannel;
  symbol: string;
  interval?: string;
}

export interface RealtimeMessage {
  topic: SubscriptionTopic;
  data: any;
  timestamp: number;
}

export type MessageHandler = (message: RealtimeMessage) => void;
export type StatusHandler = (status: RealtimeConnectionStatus, latencyMs?: number) => void;

export interface ReconnectConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: boolean;
  maxRetries: number;
}
