import { RealtimeConnectionStatus, ReconnectConfig, StatusHandler } from './types';

export class ConnectionManager {
  private ws: WebSocket | null = null;
  private url: string;
  private status: RealtimeConnectionStatus = 'closed';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private lastPingSent = 0;
  private latencyMs = 24;
  private statusListeners = new Set<StatusHandler>();

  private readonly config: ReconnectConfig = {
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    factor: 1.5,
    jitter: true,
    maxRetries: 20,
  };

  private onMessageCallback?: (data: string) => void;

  constructor(url: string, onMessage?: (data: string) => void, customConfig?: Partial<ReconnectConfig>) {
    this.url = url;
    this.onMessageCallback = onMessage;
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  public setUrl(url: string) {
    if (this.url !== url) {
      this.url = url;
      if (this.status === 'open' || this.status === 'connecting') {
        this.reconnect();
      }
    }
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.status === 'open' || this.status === 'connecting') return;

    this.setStatus('connecting');
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('open');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          if (event.data.includes('pong')) {
            this.latencyMs = Math.max(1, Date.now() - this.lastPingSent);
            this.notifyStatus(this.status, this.latencyMs);
            return;
          }
          this.onMessageCallback?.(event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[Realtime WS Error]:', err);
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus('closed');
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn('[Realtime WS Connect Exception]:', err);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  public send(payload: string | object): boolean {
    if (this.status !== 'open' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.ws.send(data);
    return true;
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.setStatus('closing');
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('closed');
  }

  public reconnect(): void {
    this.disconnect();
    this.connect();
  }

  public subscribeStatus(handler: StatusHandler): () => void {
    this.statusListeners.add(handler);
    handler(this.status, this.latencyMs);
    return () => this.statusListeners.delete(handler);
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  private setStatus(status: RealtimeConnectionStatus) {
    this.status = status;
    this.notifyStatus(status, this.latencyMs);
  }

  private notifyStatus(status: RealtimeConnectionStatus, latency: number) {
    for (const listener of this.statusListeners) {
      try {
        listener(status, latency);
      } catch (err) {
        console.error('[Realtime WS Listener error]:', err);
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxRetries) {
      console.warn('[Realtime WS] Max reconnect attempts reached.');
      return;
    }

    const baseDelay = Math.min(
      this.config.initialDelayMs * Math.pow(this.config.factor, this.reconnectAttempts),
      this.config.maxDelayMs
    );
    const delay = this.config.jitter ? baseDelay * (0.8 + Math.random() * 0.4) : baseDelay;

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.status === 'open' && this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingSent = Date.now();
        try {
          this.ws.send(JSON.stringify({ method: 'ping' }));
        } catch (_err) {
          // ignore
        }
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
