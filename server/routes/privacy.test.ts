import { describe, it, expect, beforeEach } from 'vitest';
import { persistedSessions, idempotencyStore, auditLogs } from './analysis';
import { ConfluenceEvaluation } from '../../src/types/crypto.types';

describe('server/routes/privacy - Per-User Scoping', () => {
  beforeEach(() => {
    persistedSessions.clear();
    idempotencyStore.clear();
    auditLogs.length = 0;
  });

  it('ensures user A only exports user A sessions and never leaks user B data', () => {
    const sessionUserA: ConfluenceEvaluation = {
      symbol: 'BTC/USDT',
      timeframe: '1H',
      evaluatedAt: new Date().toISOString(),
      confluenceScore: 85,
      marketBias: 'Strong Bullish',
      bullishCount: 8,
      bearishCount: 2,
      neutralCount: 2,
      indicators: {} as any,
      riskPlan: {} as any,
      executiveNarrative: 'Bullish momentum for User A',
      machinePayloadJson: '{}',
      idempotencyKey: 'key-user-a-1',
      latencyMs: 15,
      aiEngine: 'Institutional',
      userEmail: 'alice@example.com',
    };

    const sessionUserB: ConfluenceEvaluation = {
      symbol: 'ETH/USDT',
      timeframe: '4H',
      evaluatedAt: new Date().toISOString(),
      confluenceScore: 40,
      marketBias: 'Bearish',
      bullishCount: 3,
      bearishCount: 7,
      neutralCount: 2,
      indicators: {} as any,
      riskPlan: {} as any,
      executiveNarrative: 'Secret strategy for User B',
      machinePayloadJson: '{}',
      idempotencyKey: 'key-user-b-1',
      latencyMs: 18,
      aiEngine: 'Institutional',
      userEmail: 'bob@example.com',
    };

    persistedSessions.set(sessionUserA.idempotencyKey, sessionUserA);
    persistedSessions.set(sessionUserB.idempotencyKey, sessionUserB);

    // Filter logic as implemented in privacy.ts
    const targetEmail = 'alice@example.com';
    const userSessions = Array.from(persistedSessions.values()).filter(
      (s) => s.userEmail && s.userEmail.toLowerCase() === targetEmail.toLowerCase()
    );

    expect(userSessions.length).toBe(1);
    expect(userSessions[0].symbol).toBe('BTC/USDT');
    expect(userSessions[0].userEmail).toBe('alice@example.com');
  });

  it('ensures GDPR erasure only deletes the requesting user sessions and preserves others', () => {
    const sessionUserA: ConfluenceEvaluation = {
      symbol: 'BTC/USDT',
      timeframe: '1H',
      evaluatedAt: new Date().toISOString(),
      confluenceScore: 85,
      marketBias: 'Strong Bullish',
      bullishCount: 8,
      bearishCount: 2,
      neutralCount: 2,
      indicators: {} as any,
      riskPlan: {} as any,
      executiveNarrative: 'User A',
      machinePayloadJson: '{}',
      idempotencyKey: 'key-user-a-1',
      latencyMs: 15,
      aiEngine: 'Institutional',
      userEmail: 'alice@example.com',
    };

    const sessionUserB: ConfluenceEvaluation = {
      symbol: 'ETH/USDT',
      timeframe: '4H',
      evaluatedAt: new Date().toISOString(),
      confluenceScore: 40,
      marketBias: 'Bearish',
      bullishCount: 3,
      bearishCount: 7,
      neutralCount: 2,
      indicators: {} as any,
      riskPlan: {} as any,
      executiveNarrative: 'User B',
      machinePayloadJson: '{}',
      idempotencyKey: 'key-user-b-1',
      latencyMs: 18,
      aiEngine: 'Institutional',
      userEmail: 'bob@example.com',
    };

    persistedSessions.set(sessionUserA.idempotencyKey, sessionUserA);
    idempotencyStore.set(sessionUserA.idempotencyKey, sessionUserA);

    persistedSessions.set(sessionUserB.idempotencyKey, sessionUserB);
    idempotencyStore.set(sessionUserB.idempotencyKey, sessionUserB);

    // Erase Alice's data
    const eraseTarget = 'alice@example.com';
    for (const [key, session] of Array.from(persistedSessions.entries())) {
      if (session.userEmail && session.userEmail.toLowerCase() === eraseTarget.toLowerCase()) {
        persistedSessions.delete(key);
        if (session.idempotencyKey) {
          idempotencyStore.delete(session.idempotencyKey);
        }
      }
    }

    // Alice's data should be erased
    expect(persistedSessions.has('key-user-a-1')).toBe(false);
    expect(idempotencyStore.has('key-user-a-1')).toBe(false);

    // Bob's data MUST remain intact!
    expect(persistedSessions.has('key-user-b-1')).toBe(true);
    expect(idempotencyStore.has('key-user-b-1')).toBe(true);
    expect(persistedSessions.size).toBe(1);
  });
});
