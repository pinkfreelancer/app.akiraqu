import { Router, Request, Response } from 'express';
import { encryptExchangeCredentials, decryptExchangeCredentials } from '../services/cryptoEncryption';
import { requireCredentialAuth, getFirebaseConfig } from '../middleware/auth';
import ccxt from 'ccxt';

export const credentialsRouter = Router();

// Enforce authentication & authorization on all /credentials/* endpoints
credentialsRouter.use('/credentials', requireCredentialAuth);

/**
 * Helper to parse typed fields from Firestore REST document JSON format into standard JavaScript values.
 */
function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields || {})) {
    if (!val || typeof val !== 'object') continue;
    if ('stringValue' in val) result[key] = val.stringValue;
    else if ('integerValue' in val) result[key] = parseInt(val.integerValue, 10);
    else if ('doubleValue' in val) result[key] = parseFloat(val.doubleValue);
    else if ('booleanValue' in val) result[key] = val.booleanValue;
    else if ('timestampValue' in val) result[key] = val.timestampValue;
    else if ('mapValue' in val) result[key] = parseFirestoreFields(val.mapValue?.fields);
  }
  return result;
}

/**
 * POST /api/v1/credentials/encrypt
 * Server-side encryption using AES-256-GCM. Returns maskedKey and cipher payload.
 * Protected by requireCredentialAuth.
 */
credentialsRouter.post('/credentials/encrypt', (req: Request, res: Response) => {
  try {
    const { apiKey, apiSecret, passphrase, exchange } = req.body || {};

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid apiKey' });
      return;
    }
    if (!apiSecret || typeof apiSecret !== 'string' || apiSecret.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid apiSecret' });
      return;
    }

    const encrypted = encryptExchangeCredentials({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      passphrase: passphrase ? passphrase.trim() : undefined,
    });

    res.json({
      status: 'success',
      exchange: exchange || 'BINANCE',
      data: {
        maskedKey: encrypted.maskedKey,
        cipherBlob: encrypted.cipherBlob,
        iv: encrypted.iv,
        tag: encrypted.tag,
        version: encrypted.version,
        encryptedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Encryption Failed',
      message: err.message || 'Error executing server AES-256-GCM encryption',
    });
  }
});

/**
 * POST /api/v1/credentials/verify
 * Tests connectivity with exchange by looking up the authenticated user's credential in Firestore.
 * 
 * SECURITY HARDENING:
 * 1. Requires verified credId belonging to req.user.uid.
 * 2. Fetches ciphertext directly from Firestore under /users/{req.user.uid}/credentials/{credId}.
 * 3. Never accepts caller-supplied arbitrary cipherBlob/iv/tag (eliminates Decryption Oracle vulnerability).
 * 4. Never exposes or returns raw exchange balance numbers (prevents financial reconnaissance).
 */
credentialsRouter.post('/credentials/verify', async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.uid || !user.rawToken) {
      res.status(401).json({
        status: 'error',
        verified: false,
        message: 'Unauthorized: User authentication required.',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const { credId, exchange: reqExchange } = req.body || {};

    if (!credId || typeof credId !== 'string' || credId.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        verified: false,
        message: 'Missing or invalid credId: Credential ID is required to verify stored vault credentials.',
        code: 'MISSING_CRED_ID',
      });
      return;
    }

    const { projectId, databaseId } = getFirebaseConfig();

    // Query Firestore REST API under the authenticated user's exact document path
    // Firestore security rules enforce: request.auth.uid == userId
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/${encodeURIComponent(databaseId)}/documents/users/${encodeURIComponent(
      user.uid
    )}/credentials/${encodeURIComponent(credId.trim())}`;

    const firestoreRes = await fetch(firestoreUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user.rawToken}`,
        Accept: 'application/json',
      },
    });

    if (firestoreRes.status === 404) {
      res.status(404).json({
        status: 'error',
        verified: false,
        message: 'Credential record not found in user vault.',
        code: 'CREDENTIAL_NOT_FOUND',
      });
      return;
    }

    if (!firestoreRes.ok) {
      const errText = await firestoreRes.text().catch(() => '');
      res.status(403).json({
        status: 'error',
        verified: false,
        message: 'Access denied: Unable to access user credential vault in Firestore.',
        code: 'FIRESTORE_ACCESS_DENIED',
        detail: errText,
      });
      return;
    }

    const docJson = await firestoreRes.json();
    const docData = parseFirestoreFields(docJson.fields);

    const cipherBlob = docData.cipherBlob;
    const iv = docData.iv;
    const tag = docData.tag;
    const exchange = docData.exchange || reqExchange || 'BINANCE';

    if (!cipherBlob || !iv || !tag) {
      res.status(400).json({
        status: 'error',
        verified: false,
        message: 'Vault credential document is missing required encrypted parameters (cipherBlob, iv, tag).',
        code: 'INVALID_CREDENTIAL_DATA',
      });
      return;
    }

    // Decrypt server-side using verified ciphertext from user's vault
    const creds = decryptExchangeCredentials({ cipherBlob, iv, tag });

    // Test pinging exchange using CCXT
    const exchangeKey = String(exchange).toLowerCase();
    const ExchangeClass = (ccxt as any)[exchangeKey] || (ccxt as any).binance;
    const client = new ExchangeClass({
      apiKey: creds.apiKey,
      secret: creds.apiSecret,
      password: creds.passphrase,
      timeout: 6000,
      enableRateLimit: true,
    });

    let hasReadPermission = false;
    const startTime = Date.now();

    try {
      // Test authenticated read permission without returning balance amount to caller
      if (typeof client.fetchBalance === 'function') {
        await client.fetchBalance();
        hasReadPermission = true;
      } else if (typeof client.fetchTime === 'function') {
        await client.fetchTime();
      }
    } catch (connErr: any) {
      // If fetchBalance throws (e.g. read-only without trade permissions or transient timeout), attempt public ping
      try {
        await client.fetchTime?.();
      } catch (_pingErr) {
        throw connErr;
      }
    }

    const latencyMs = Math.max(1, Date.now() - startTime);

    res.json({
      status: 'success',
      verified: true,
      exchange,
      hasReadPermission,
      latencyMs,
      testedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({
      status: 'error',
      verified: false,
      message: err.message || 'Exchange verification failed. Check API key permissions and network.',
    });
  }
});
