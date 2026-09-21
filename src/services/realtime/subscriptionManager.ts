import { ConnectionManager } from './connectionManager';
import { SubscriptionTopic, RealtimeMessage, MessageHandler } from './types';

export class SubscriptionManager {
  private connection: ConnectionManager;
  private subscriptions = new Map<string, { topic: SubscriptionTopic; refCount: number; handlers: Set<MessageHandler> }>();

  constructor(connection: ConnectionManager) {
    this.connection = connection;
    // Auto re-subscribe when connection opens or reconnects
    this.connection.subscribeStatus((status) => {
      if (status === 'open') {
        this.resubscribeAll();
      }
    });
  }

  private getTopicKey(topic: SubscriptionTopic): string {
    return `${topic.exchange}:${topic.channel}:${topic.symbol.toUpperCase()}:${topic.interval || ''}`;
  }

  public subscribe(topic: SubscriptionTopic, handler: MessageHandler): () => void {
    const key = this.getTopicKey(topic);
    let sub = this.subscriptions.get(key);

    if (!sub) {
      sub = {
        topic,
        refCount: 0,
        handlers: new Set(),
      };
      this.subscriptions.set(key, sub);
    }

    sub.refCount++;
    sub.handlers.add(handler);

    // If first subscriber, send subscription frame over WebSocket
    if (sub.refCount === 1) {
      this.sendSubscriptionFrame(topic, true);
    }

    // Return un-subscribe disposer
    return () => {
      const current = this.subscriptions.get(key);
      if (!current) return;

      current.handlers.delete(handler);
      current.refCount = Math.max(0, current.refCount - 1);

      if (current.refCount === 0) {
        this.sendSubscriptionFrame(topic, false);
        this.subscriptions.delete(key);
      }
    };
  }

  public dispatchMessage(topic: SubscriptionTopic, data: any) {
    const key = this.getTopicKey(topic);
    const sub = this.subscriptions.get(key);
    if (!sub) return;

    const msg: RealtimeMessage = {
      topic,
      data,
      timestamp: Date.now(),
    };

    for (const handler of sub.handlers) {
      try {
        handler(msg);
      } catch (err) {
        console.error('[SubscriptionManager] Handler error:', err);
      }
    }
  }

  private sendSubscriptionFrame(topic: SubscriptionTopic, isSubscribe: boolean) {
    const rawSymbol = topic.symbol.replace('/', '').toLowerCase();
    let stream = '';

    if (topic.channel === 'ticker') {
      stream = `${rawSymbol}@ticker`;
    } else if (topic.channel === 'depth') {
      stream = `${rawSymbol}@depth20@100ms`;
    } else if (topic.channel === 'trades') {
      stream = `${rawSymbol}@trade`;
    } else if (topic.channel === 'kline') {
      stream = `${rawSymbol}@kline_${topic.interval || '1h'}`;
    }

    if (!stream) return;

    const payload = {
      method: isSubscribe ? 'SUBSCRIBE' : 'UNSUBSCRIBE',
      params: [stream],
      id: Date.now(),
    };

    this.connection.send(payload);
  }

  private resubscribeAll() {
    for (const sub of this.subscriptions.values()) {
      if (sub.refCount > 0) {
        this.sendSubscriptionFrame(sub.topic, true);
      }
    }
  }
}
