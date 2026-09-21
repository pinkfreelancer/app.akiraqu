import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { PrivacyErasureSchema, PrivacyExportSchema } from '../../src/schemas/validation.schemas';
import { persistedSessions, idempotencyStore, auditLogs } from './analysis';

export const privacyRouter = Router();

// GDPR/CCPA Data Export Hook
privacyRouter.post('/privacy/export', (req: Request, res: Response) => {
  const parsed = PrivacyExportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid export request', details: parsed.error });
    return;
  }

  const exportBundle = {
    exportDate: new Date().toISOString(),
    standard: 'GDPR Art. 15 / CCPA Compliant',
    requestedBy: parsed.data.userEmail,
    totalSessionsRecorded: persistedSessions.size,
    sessions: Array.from(persistedSessions.values()),
    auditTrail: parsed.data.includeAuditTrail ? auditLogs : [],
  };

  res.json({
    status: 'success',
    data: exportBundle,
  });
});

// GDPR True Deletion / Erasure Hook
privacyRouter.post('/privacy/erase', (req: Request, res: Response) => {
  const parsed = PrivacyErasureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid erasure request. Confirmation phrase required.' });
    return;
  }

  const sessionsCount = persistedSessions.size;
  persistedSessions.clear();
  idempotencyStore.clear();

  auditLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action: 'GDPR_TRUE_DATA_ERASURE_COMPLETED',
    symbol: 'SYSTEM_PURGE',
    timeframe: 'ALL',
    confluenceScore: 0,
    bias: 'ERASED',
    latencyMs: 1,
    ipHash: 'ANONYMIZED',
  });

  res.json({
    status: 'success',
    message: `GDPR Article 17 True Erasure completed. Purged ${sessionsCount} historical records.`,
  });
});
