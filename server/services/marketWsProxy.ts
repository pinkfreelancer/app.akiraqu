import { WebSocketServer, WebSocket as WsClient } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

const SPOT_UPSTREAM_ENDPOINTS = [
  'wss://data-stream.binance.vision/stream',
  'wss://stream.binance.com:9443/stream',
  'wss://stream.binance.com:443/stream',
];

const FUTURES_UPSTREAM_ENDPOINTS = [
  'wss://fstream.binance.com/stream',
];

function computeBackoffWithJitter(attempt: number, baseMs = 1000, maxMs = 20_000): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, Math.min(10, attempt))));
  const jitter = 0.75 + 0.5 * Math.random();
  return Math.max(400, Math.min(maxMs, Math.round(exp * jitter)));
}

/**
 * Server-Side WebSocket Market Data Proxy
 *
 * Uses Binance combined `/stream` endpoints with automatic endpoint rotation,
 * exponential backoff + jitter, upstream silence watchdog, per-client topic isolation,
 * and reference-counted SUBSCRIBE / UNSUBSCRIBE hygiene.
 */
export class MarketWsProxy {
  private wss: WebSocketServer;

  // Upstream connections
  private spotWs: WsClient | null = null;
  private futuresWs: WsClient | null = null;
  private isConnectingSpot = false;
  private isConnectingFutures = false;
  private spotEndpointIdx = 0;
  private futuresEndpointIdx = 0;
  private spotReconnectAttempt = 0;
  private futuresReconnectAttempt = 0;
  private spotReconnectTimer: NodeJS.Timeout | null = null;
  private futuresReconnectTimer: NodeJS.Timeout | null = null;
  private lastSpotMessageAt = 0;
  private lastFuturesMessageAt = 0;

  // Subscription management
  private clientSubscriptions = new Map<WsClient, Set<string>>();
  private topicRefCount = new Map<string, number>();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupClientListeners();
  }

  // --------------------------------------------------------------------------
  // Upstream Binance Spot Connection (Combined /stream)
  // --------------------------------------------------------------------------
  private connectSpotUpstream() {
    if (this.isConnectingSpot || this.spotWs?.readyState === WsClient.OPEN) {
      return;
    }

    this.isConnectingSpot = true;
    const url = SPOT_UPSTREAM_ENDPOINTS[this.spotEndpointIdx % SPOT_UPSTREAM_ENDPOINTS.length];

    try {
      const ws = new WsClient(url, { handshakeTimeout: 8000 });
      this.spotWs = ws;

      ws.on('open', () => {
        this.isConnectingSpot = false;
        this.spotReconnectAttempt = 0;
        this.lastSpotMessageAt = Date.now();
        console.log(`[MarketWsProxy] Upstream Spot WS connected (${url})`);

        const spotTopics = Array.from(this.topicRefCount.keys()).filter((t) => !t.includes('!futures'));
        if (spotTopics.length > 0 && ws.readyState === WsClient.OPEN) {
          ws.send(
            JSON.stringify({
              method: 'SUBSCRIBE',
              params: spotTopics,
              id: Date.now(),
            })
          );
        }
      });

      ws.on('message', (data: any) => {
        this.lastSpotMessageAt = Date.now();
        this.routeUpstreamMessage(data, false);
      });

      ws.on('pong', () => {
        this.lastSpotMessageAt = Date.now();
      });

      ws.on('error', (err) => {
        console.warn(`[MarketWsProxy] Spot upstream error (${url}):`, err.message);
      });

      ws.on('close', () => {
        this.isConnectingSpot = false;
        if (this.spotWs === ws) {
          this.spotWs = null;
        }
        if (this.hasActiveSpotSubscriptions()) {
          this.spotEndpointIdx = (this.spotEndpointIdx + 1) % SPOT_UPSTREAM_ENDPOINTS.length;
          this.scheduleSpotReconnect();
        }
      });
    } catch (_err) {
      this.isConnectingSpot = false;
      this.spotEndpointIdx = (this.spotEndpointIdx + 1) % SPOT_UPSTREAM_ENDPOINTS.length;
      this.scheduleSpotReconnect();
    }
  }

  // --------------------------------------------------------------------------
  // Upstream Binance Futures Connection (Combined /stream)
  // --------------------------------------------------------------------------
  private connectFuturesUpstream() {
    if (this.isConnectingFutures || this.futuresWs?.readyState === WsClient.OPEN) {
      return;
    }

    this.isConnectingFutures = true;
    const url = FUTURES_UPSTREAM_ENDPOINTS[this.futuresEndpointIdx % FUTURES_UPSTREAM_ENDPOINTS.length];

    try {
      const ws = new WsClient(url, { handshakeTimeout: 8000 });
      this.futuresWs = ws;

      ws.on('open', () => {
        this.isConnectingFutures = false;
        this.futuresReconnectAttempt = 0;
        this.lastFuturesMessageAt = Date.now();
        console.log(`[MarketWsProxy] Upstream Futures WS connected (${url})`);

        const futTopics = Array.from(this.topicRefCount.keys())
          .filter((t) => t.includes('!futures'))
          .map((t) => t.replace('!futures', ''));
        if (futTopics.length > 0 && ws.readyState === WsClient.OPEN) {
          ws.send(
            JSON.stringify({
              method: 'SUBSCRIBE',
              params: futTopics,
              id: Date.now(),
            })
          );
        }
      });

      ws.on('message', (data: any) => {
        this.lastFuturesMessageAt = Date.now();
        this.routeUpstreamMessage(data, true);
      });

      ws.on('pong', () => {
        this.lastFuturesMessageAt = Date.now();
      });

      ws.on('error', (err) => {
        console.warn(`[MarketWsProxy] Futures upstream error (${url}):`, err.message);
      });

      ws.on('close', () => {
        this.isConnectingFutures = false;
        if (this.futuresWs === ws) {
          this.futuresWs = null;
        }
        if (this.hasActiveFuturesSubscriptions()) {
          this.futuresEndpointIdx = (this.futuresEndpointIdx + 1) % FUTURES_UPSTREAM_ENDPOINTS.length;
          this.scheduleFuturesReconnect();
        }
      });
    } catch (_err) {
      this.isConnectingFutures = false;
      this.futuresEndpointIdx = (this.futuresEndpointIdx + 1) % FUTURES_UPSTREAM_ENDPOINTS.length;
      this.scheduleFuturesReconnect();
    }
  }

  private hasActiveSpotSubscriptions(): boolean {
    for (const key of this.topicRefCount.keys()) {
      if (!key.includes('!futures')) return true;
    }
    return false;
  }

  private hasActiveFuturesSubscriptions(): boolean {
    for (const key of this.topicRefCount.keys()) {
      if (key.includes('!futures')) return true;
    }
    return false;
  }

  private scheduleSpotReconnect() {
    if (this.spotReconnectTimer) return;
    const delay = computeBackoffWithJitter(this.spotReconnectAttempt++);
    this.spotReconnectTimer = setTimeout(() => {
      this.spotReconnectTimer = null;
      this.connectSpotUpstream();
    }, delay);
  }

  private scheduleFuturesReconnect() {
    if (this.futuresReconnectTimer) return;
    const delay = computeBackoffWithJitter(this.futuresReconnectAttempt++);
    this.futuresReconnectTimer = setTimeout(() => {
      this.futuresReconnectTimer = null;
      this.connectFuturesUpstream();
    }, delay);
  }

  // --------------------------------------------------------------------------
  // Message Routing & Targeted Dispatch
  // --------------------------------------------------------------------------
  private routeUpstreamMessage(data: any, isFromFutures: boolean) {
    const rawStr = typeof data === 'string' ? data : data.toString();
    let packet: any;
    try {
      packet = JSON.parse(rawStr);
    } catch (_e) {
      return;
    }

    // Ignore command acknowledgements like {"result":null,"id":123}
    if (packet && packet.result === null && packet.id !== undefined) {
      return;
    }

    const streamName: string = (packet.stream || '').toLowerCase();
    const inner = packet.data || packet;
    const eventType: string = (inner?.e || '').toLowerCase();
    const symbol: string = (inner?.s || (streamName ? streamName.split('@')[0] : '')).toLowerCase();

    for (const [client, subs] of this.clientSubscriptions.entries()) {
      if (client.readyState !== WsClient.OPEN) continue;

      let isInterested = false;

      // Match 1: Exact combined stream name match (primary path for /stream)
      if (streamName) {
        const expectedTopic = isFromFutures ? `${streamName}!futures` : streamName;
        if (subs.has(expectedTopic)) {
          isInterested = true;
        }
      }

      // Match 2: Fallback symbol + event matching with strict Spot / Futures isolation
      if (!isInterested && symbol) {
        for (const sub of subs) {
          const clientIsFutures = sub.includes('!futures');
          if (clientIsFutures !== isFromFutures) continue;

          const cleanSub = sub.replace('!futures', '').toLowerCase();
          const subSymbol = cleanSub.split('@')[0];
          if (subSymbol === symbol) {
            if (
              (eventType === 'aggtrade' && cleanSub.includes('@aggtrade')) ||
              (eventType === 'trade' && cleanSub.includes('@trade')) ||
              (eventType === '24hrticker' && cleanSub.includes('@ticker')) ||
              (eventType === '24hrminiticker' && cleanSub.includes('@ticker')) ||
              (eventType === 'kline' && cleanSub.includes('@kline')) ||
              (eventType === 'depthupdate' && cleanSub.includes('@depth')) ||
              ((inner?.bids || inner?.b) && cleanSub.includes('@depth'))
            ) {
              isInterested = true;
              break;
            }
          }
        }
      }

      if (isInterested) {
        try {
          client.send(rawStr);
        } catch (_sendErr) {}
      }
    }
  }

  // --------------------------------------------------------------------------
  // Browser Client Lifecycle & Heartbeat Watchdog
  // --------------------------------------------------------------------------
  private setupClientListeners() {
    setInterval(() => {
      const now = Date.now();

      for (const client of this.wss.clients) {
        if (client.readyState === WsClient.OPEN) {
          try {
            client.ping();
          } catch (_e) {}
        }
      }

      if (this.spotWs && this.spotWs.readyState === WsClient.OPEN) {
        if (this.hasActiveSpotSubscriptions() && this.lastSpotMessageAt > 0 && now - this.lastSpotMessageAt > 30_000) {
          console.warn('[MarketWsProxy] Spot upstream silent >30s, rotating endpoint');
          try {
            this.spotWs.terminate();
          } catch (_e) {}
        } else {
          try {
            this.spotWs.ping();
          } catch (_e) {}
        }
      }

      if (this.futuresWs && this.futuresWs.readyState === WsClient.OPEN) {
        if (
          this.hasActiveFuturesSubscriptions() &&
          this.lastFuturesMessageAt > 0 &&
          now - this.lastFuturesMessageAt > 30_000
        ) {
          console.warn('[MarketWsProxy] Futures upstream silent >30s, reconnecting');
          try {
            this.futuresWs.terminate();
          } catch (_e) {}
        } else {
          try {
            this.futuresWs.ping();
          } catch (_e) {}
        }
      }
    }, 15_000);

    this.wss.on('connection', (clientWs: WsClient) => {
      this.clientSubscriptions.set(clientWs, new Set());

      clientWs.send(
        JSON.stringify({
          type: 'PROXY_CONNECTED',
          latencyMs: 8,
          engine: 'AKIRAQU Server-Side Multiplexed WS Proxy',
          serverTime: Date.now(),
        })
      );

      clientWs.on('message', (message: any) => {
        try {
          const raw = typeof message === 'string' ? message : message.toString();
          if (raw === 'ping' || raw.includes('"ping"')) {
            clientWs.send(JSON.stringify({ type: 'pong', pong: Date.now() }));
            return;
          }

          const parsed = JSON.parse(raw);
          const isFutures = parsed.marketType === 'FUTURES' || parsed.isFutures === true;

          if (parsed.method === 'SUBSCRIBE' && Array.isArray(parsed.params)) {
            const newlyAddedUpstream: string[] = [];
            for (const rawItem of parsed.params) {
              if (typeof rawItem !== 'string' || !rawItem.trim()) continue;
              const rawParam = rawItem.trim().toLowerCase();
              const topicKey = isFutures ? `${rawParam}!futures` : rawParam;
              const clientSubs = this.clientSubscriptions.get(clientWs);

              if (clientSubs && !clientSubs.has(topicKey)) {
                clientSubs.add(topicKey);
                const currentCount = this.topicRefCount.get(topicKey) || 0;
                this.topicRefCount.set(topicKey, currentCount + 1);

                if (currentCount === 0) {
                  newlyAddedUpstream.push(rawParam);
                }
              }
            }
            if (newlyAddedUpstream.length > 0) {
              this.subscribeUpstreamBatch(newlyAddedUpstream, isFutures);
            }
          } else if (parsed.method === 'UNSUBSCRIBE' && Array.isArray(parsed.params)) {
            const removedUpstream: string[] = [];
            for (const rawItem of parsed.params) {
              if (typeof rawItem !== 'string' || !rawItem.trim()) continue;
              const rawParam = rawItem.trim().toLowerCase();
              const topicKey = isFutures ? `${rawParam}!futures` : rawParam;
              const clientSubs = this.clientSubscriptions.get(clientWs);

              if (clientSubs && clientSubs.has(topicKey)) {
                clientSubs.delete(topicKey);
                const currentCount = this.topicRefCount.get(topicKey) || 1;
                const newCount = currentCount - 1;

                if (newCount <= 0) {
                  this.topicRefCount.delete(topicKey);
                  removedUpstream.push(rawParam);
                } else {
                  this.topicRefCount.set(topicKey, newCount);
                }
              }
            }
            if (removedUpstream.length > 0) {
              this.unsubscribeUpstreamBatch(removedUpstream, isFutures);
            }
          }
        } catch (_err) {
          // Ignore malformed frames
        }
      });

      clientWs.on('close', () => {
        const clientSubs = this.clientSubscriptions.get(clientWs);
        if (clientSubs) {
          const spotRemove: string[] = [];
          const futRemove: string[] = [];
          for (const topicKey of clientSubs) {
            const isFutures = topicKey.includes('!futures');
            const rawParam = topicKey.replace('!futures', '');
            const currentCount = this.topicRefCount.get(topicKey) || 1;
            const newCount = currentCount - 1;

            if (newCount <= 0) {
              this.topicRefCount.delete(topicKey);
              if (isFutures) futRemove.push(rawParam);
              else spotRemove.push(rawParam);
            } else {
              this.topicRefCount.set(topicKey, newCount);
            }
          }
          if (spotRemove.length > 0) this.unsubscribeUpstreamBatch(spotRemove, false);
          if (futRemove.length > 0) this.unsubscribeUpstreamBatch(futRemove, true);
          this.clientSubscriptions.delete(clientWs);
        }
      });

      clientWs.on('error', (_err) => {
        // Handled on close
      });
    });
  }

  private subscribeUpstreamBatch(streamParams: string[], isFutures: boolean) {
    if (streamParams.length === 0) return;
    const ws = isFutures ? this.futuresWs : this.spotWs;
    if (ws && ws.readyState === WsClient.OPEN) {
      ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: streamParams,
          id: Date.now(),
        })
      );
    } else {
      if (isFutures) this.connectFuturesUpstream();
      else this.connectSpotUpstream();
    }
  }

  private unsubscribeUpstreamBatch(streamParams: string[], isFutures: boolean) {
    if (streamParams.length === 0) return;
    const ws = isFutures ? this.futuresWs : this.spotWs;
    if (ws && ws.readyState === WsClient.OPEN) {
      ws.send(
        JSON.stringify({
          method: 'UNSUBSCRIBE',
          params: streamParams,
          id: Date.now(),
        })
      );
    }
  }

  public handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }

  public getStats() {
    return {
      connectedClients: this.wss.clients.size,
      spotUpstreamConnected: this.spotWs?.readyState === WsClient.OPEN,
      futuresUpstreamConnected: this.futuresWs?.readyState === WsClient.OPEN,
      activeSubscriptionsCount: this.topicRefCount.size,
    };
  }
}

export const marketWsProxy = new MarketWsProxy();
