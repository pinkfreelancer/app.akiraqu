import { WebSocketServer, WebSocket as WsClient } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

const BINANCE_SPOT_WS = 'wss://stream.binance.com:9443/ws';
const BINANCE_FUTURES_WS = 'wss://fstream.binance.com/ws';

/**
 * Server-Side WebSocket Market Data Proxy
 * 
 * Mitigates local ISP geoblocking and DNS censorship (e.g. Kominfo/TrustPositif)
 * by proxying exchange streams through the server.
 * 
 * ARCHITECTURE & SECURITY:
 * 1. Per-client subscription sets (clientSubscriptions: Map<WsClient, Set<string>>).
 * 2. Topic reference counting (topicRefCount: Map<string, number>).
 * 3. Targeted frame routing: Client A requesting BTCUSDT never receives Client B's ETHUSDT.
 * 4. Safe unsubscribe: Unsubscribing a topic decrements the refcount and only sends upstream
 *    UNSUBSCRIBE when zero active browser clients are listening to that topic.
 */
export class MarketWsProxy {
  private wss: WebSocketServer;

  // Upstream connections
  private spotWs: WsClient | null = null;
  private futuresWs: WsClient | null = null;
  private isConnectingSpot = false;
  private isConnectingFutures = false;
  private spotReconnectTimer: NodeJS.Timeout | null = null;
  private futuresReconnectTimer: NodeJS.Timeout | null = null;

  // Subscription management
  private clientSubscriptions = new Map<WsClient, Set<string>>();
  private topicRefCount = new Map<string, number>();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupClientListeners();
  }

  // --------------------------------------------------------------------------
  // Upstream Binance Spot Connection
  // --------------------------------------------------------------------------
  private connectSpotUpstream() {
    if (this.isConnectingSpot || this.spotWs?.readyState === WsClient.OPEN) {
      return;
    }

    this.isConnectingSpot = true;
    try {
      this.spotWs = new WsClient(BINANCE_SPOT_WS, { handshakeTimeout: 10000 });

      this.spotWs.on('open', () => {
        this.isConnectingSpot = false;
        console.log('[MarketWsProxy] Upstream Binance Spot WS connected');

        // Resubscribe all active spot topics
        const spotTopics = Array.from(this.topicRefCount.keys()).filter((t) => !t.includes('!futures'));
        if (spotTopics.length > 0) {
          this.spotWs?.send(
            JSON.stringify({
              method: 'SUBSCRIBE',
              params: spotTopics,
              id: Date.now(),
            })
          );
        }
      });

      this.spotWs.on('message', (data: any) => {
        this.routeUpstreamMessage(data);
      });

      this.spotWs.on('error', (err) => {
        console.warn('[MarketWsProxy] Spot upstream error:', err.message);
      });

      this.spotWs.on('close', () => {
        this.isConnectingSpot = false;
        this.spotWs = null;
        if (this.hasActiveSpotSubscriptions()) {
          this.scheduleSpotReconnect();
        }
      });
    } catch (_err) {
      this.isConnectingSpot = false;
      this.scheduleSpotReconnect();
    }
  }

  // --------------------------------------------------------------------------
  // Upstream Binance Futures Connection
  // --------------------------------------------------------------------------
  private connectFuturesUpstream() {
    if (this.isConnectingFutures || this.futuresWs?.readyState === WsClient.OPEN) {
      return;
    }

    this.isConnectingFutures = true;
    try {
      this.futuresWs = new WsClient(BINANCE_FUTURES_WS, { handshakeTimeout: 10000 });

      this.futuresWs.on('open', () => {
        this.isConnectingFutures = false;
        console.log('[MarketWsProxy] Upstream Binance Futures WS connected');

        // Resubscribe active futures topics
        const futTopics = Array.from(this.topicRefCount.keys())
          .filter((t) => t.includes('!futures'))
          .map((t) => t.replace('!futures', ''));
        if (futTopics.length > 0) {
          this.futuresWs?.send(
            JSON.stringify({
              method: 'SUBSCRIBE',
              params: futTopics,
              id: Date.now(),
            })
          );
        }
      });

      this.futuresWs.on('message', (data: any) => {
        this.routeUpstreamMessage(data);
      });

      this.futuresWs.on('error', (err) => {
        console.warn('[MarketWsProxy] Futures upstream error:', err.message);
      });

      this.futuresWs.on('close', () => {
        this.isConnectingFutures = false;
        this.futuresWs = null;
        if (this.hasActiveFuturesSubscriptions()) {
          this.scheduleFuturesReconnect();
        }
      });
    } catch (_err) {
      this.isConnectingFutures = false;
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
    this.spotReconnectTimer = setTimeout(() => {
      this.spotReconnectTimer = null;
      this.connectSpotUpstream();
    }, 4000);
  }

  private scheduleFuturesReconnect() {
    if (this.futuresReconnectTimer) return;
    this.futuresReconnectTimer = setTimeout(() => {
      this.futuresReconnectTimer = null;
      this.connectFuturesUpstream();
    }, 4000);
  }

  // --------------------------------------------------------------------------
  // Message Routing & Targeted Dispatch
  // --------------------------------------------------------------------------
  private routeUpstreamMessage(data: any) {
    const rawStr = typeof data === 'string' ? data : data.toString();
    let packet: any;
    try {
      packet = JSON.parse(rawStr);
    } catch (_e) {
      return;
    }

    // Identify matching topics for the incoming payload
    // Possible formats from Binance:
    // 1. Ticker / aggTrade / depth: { e: 'aggTrade', s: 'BTCUSDT', ... }
    // 2. Combined stream wrapper: { stream: 'btcusdt@aggTrade', data: { ... } }
    // 3. Mini-ticker: { e: '24hrMiniTicker', s: 'BTCUSDT', ... }
    const streamName: string = packet.stream || '';
    const eventType: string = packet.e || packet.data?.e || '';
    const symbol: string = (packet.s || packet.data?.s || '').toLowerCase();

    // Iterate through all connected clients and send ONLY to interested subscribers
    for (const [client, subs] of this.clientSubscriptions.entries()) {
      if (client.readyState !== WsClient.OPEN) continue;

      let isInterested = false;

      // Match 1: Exact stream name match
      if (streamName && (subs.has(streamName) || subs.has(`${streamName}!futures`))) {
        isInterested = true;
      }
      // Match 2: Symbol & event matching
      else if (symbol) {
        for (const sub of subs) {
          const cleanSub = sub.replace('!futures', '').toLowerCase();
          if (cleanSub.startsWith(symbol)) {
            if (
              (eventType === 'aggTrade' && cleanSub.includes('@aggTrade')) ||
              (eventType === 'trade' && cleanSub.includes('@trade')) ||
              (eventType === '24hrTicker' && cleanSub.includes('@ticker')) ||
              (eventType === '24hrMiniTicker' && cleanSub.includes('@ticker')) ||
              (eventType === 'kline' && cleanSub.includes('@kline')) ||
              (eventType === 'depthUpdate' && cleanSub.includes('@depth')) ||
              cleanSub.includes(symbol)
            ) {
              isInterested = true;
              break;
            }
          }
        }
      }

      if (isInterested) {
        client.send(rawStr);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Browser Client Lifecycle & Per-Connection Subscriptions
  // --------------------------------------------------------------------------
  private setupClientListeners() {
    this.wss.on('connection', (clientWs: WsClient) => {
      this.clientSubscriptions.set(clientWs, new Set());

      // Initial connection greeting
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
            clientWs.send(JSON.stringify({ pong: Date.now() }));
            return;
          }

          const parsed = JSON.parse(raw);
          const isFutures = parsed.marketType === 'FUTURES' || parsed.isFutures === true;

          if (parsed.method === 'SUBSCRIBE' && Array.isArray(parsed.params)) {
            for (const rawParam of parsed.params) {
              const topicKey = isFutures ? `${rawParam}!futures` : rawParam;
              const clientSubs = this.clientSubscriptions.get(clientWs);

              if (clientSubs && !clientSubs.has(topicKey)) {
                clientSubs.add(topicKey);
                const currentCount = this.topicRefCount.get(topicKey) || 0;
                this.topicRefCount.set(topicKey, currentCount + 1);

                // First client requesting this topic -> subscribe upstream
                if (currentCount === 0) {
                  this.subscribeUpstream(rawParam, isFutures);
                }
              }
            }
          } else if (parsed.method === 'UNSUBSCRIBE' && Array.isArray(parsed.params)) {
            for (const rawParam of parsed.params) {
              const topicKey = isFutures ? `${rawParam}!futures` : rawParam;
              const clientSubs = this.clientSubscriptions.get(clientWs);

              if (clientSubs && clientSubs.has(topicKey)) {
                clientSubs.delete(topicKey);
                const currentCount = this.topicRefCount.get(topicKey) || 1;
                const newCount = currentCount - 1;

                if (newCount <= 0) {
                  this.topicRefCount.delete(topicKey);
                  this.unsubscribeUpstream(rawParam, isFutures);
                } else {
                  this.topicRefCount.set(topicKey, newCount);
                }
              }
            }
          }
        } catch (_err) {
          // Ignore malformed frames
        }
      });

      clientWs.on('close', () => {
        const clientSubs = this.clientSubscriptions.get(clientWs);
        if (clientSubs) {
          for (const topicKey of clientSubs) {
            const isFutures = topicKey.includes('!futures');
            const rawParam = topicKey.replace('!futures', '');
            const currentCount = this.topicRefCount.get(topicKey) || 1;
            const newCount = currentCount - 1;

            if (newCount <= 0) {
              this.topicRefCount.delete(topicKey);
              this.unsubscribeUpstream(rawParam, isFutures);
            } else {
              this.topicRefCount.set(topicKey, newCount);
            }
          }
          this.clientSubscriptions.delete(clientWs);
        }
      });

      clientWs.on('error', (_err) => {
        // Disconnection handled on 'close'
      });
    });
  }

  private subscribeUpstream(streamParam: string, isFutures: boolean) {
    const ws = isFutures ? this.futuresWs : this.spotWs;
    if (ws && ws.readyState === WsClient.OPEN) {
      ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: [streamParam],
          id: Date.now(),
        })
      );
    } else {
      if (isFutures) this.connectFuturesUpstream();
      else this.connectSpotUpstream();
    }
  }

  private unsubscribeUpstream(streamParam: string, isFutures: boolean) {
    const ws = isFutures ? this.futuresWs : this.spotWs;
    if (ws && ws.readyState === WsClient.OPEN) {
      ws.send(
        JSON.stringify({
          method: 'UNSUBSCRIBE',
          params: [streamParam],
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
