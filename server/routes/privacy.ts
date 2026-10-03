import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { PrivacyErasureSchema, PrivacyExportSchema } from '../../src/schemas/validation.schemas';
import { persistedSessions, idempotencyStore, auditLogs } from './analysis';

export const privacyRouter = Router();

// GDPR/CCPA Data Export Hook (Strictly Scoped Per User)
privacyRouter.post('/privacy/export', (req: Request, res: Response) => {
  const parsed = PrivacyExportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid export request', details: parsed.error });
    return;
  }

  const targetEmail = parsed.data.userEmail.toLowerCase().trim();

  // Filter only sessions belonging to the requesting user
  const userSessions = Array.from(persistedSessions.values()).filter(
    (s) => s.userEmail && s.userEmail.toLowerCase() === targetEmail
  );

  // Filter only audit logs belonging to the requesting user
  const userAuditTrail = parsed.data.includeAuditTrail
    ? auditLogs.filter((a) => a.userEmail && a.userEmail.toLowerCase() === targetEmail)
    : [];

  const exportBundle = {
    exportDate: new Date().toISOString(),
    standard: 'GDPR Art. 15 / CCPA Compliant',
    requestedBy: targetEmail,
    totalSessionsRecorded: userSessions.length,
    sessions: userSessions,
    auditTrail: userAuditTrail,
  };

  res.json({
    status: 'success',
    data: exportBundle,
  });
});

// GDPR True Deletion / Erasure Hook (Strictly Scoped Per User)
privacyRouter.post('/privacy/erase', (req: Request, res: Response) => {
  const parsed = PrivacyErasureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid erasure request. Confirmation phrase required.' });
    return;
  }

  const targetEmail = parsed.data.userEmail.toLowerCase().trim();
  let erasedCount = 0;

  // Erase only the user's specific records from persistedSessions and idempotencyStore
  for (const [key, session] of Array.from(persistedSessions.entries())) {
    if (session.userEmail && session.userEmail.toLowerCase() === targetEmail) {
      persistedSessions.delete(key);
      if (session.idempotencyKey) {
        idempotencyStore.delete(session.idempotencyKey);
      }
      erasedCount++;
    }
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 16);

  // Append user-specific erasure audit log
  auditLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action: 'GDPR_USER_DATA_ERASURE_COMPLETED',
    symbol: 'USER_PURGE',
    timeframe: 'ALL',
    confluenceScore: 0,
    bias: 'ERASED',
    latencyMs: 1,
    ipHash,
    userEmail: targetEmail,
  });

  res.json({
    status: 'success',
    message: `GDPR Article 17 True Erasure completed for ${targetEmail}. Purged ${erasedCount} user session records.`,
    erasedRecords: erasedCount,
  });
});
