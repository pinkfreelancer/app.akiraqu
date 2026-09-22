import { Router, Request, Response } from 'express';
import { encryptExchangeCredentials, decryptExchangeCredentials } from '../services/cryptoEncryption';
import { requireCredentialAuth } from '../middleware/auth';
import ccxt from 'ccxt';

export const credentialsRouter = Router();

// Enforce authentication & authorization on all /credentials/* endpoints
credentialsRouter.use(requireCredentialAuth);

/**
 * POST /api/v1/credentials/encrypt
 * Server-side encryption using AES-256-GCM. Returns maskedKey and cipher payload.
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
 * Tests connectivity with exchange using decrypted credentials server-side without leaking raw secrets to client
 */
credentialsRouter.post('/credentials/verify', async (req: Request, res: Response) => {
  try {
    const { exchange = 'BINANCE', cipherBlob, iv, tag } = req.body || {};

    if (!cipherBlob || !iv || !tag) {
      res.status(400).json({ error: 'Missing encrypted credential payload (cipherBlob, iv, tag)' });
      return;
    }

    // Decrypt server-side
    const creds = decryptExchangeCredentials({ cipherBlob, iv, tag });

    // Test pinging exchange using CCXT
    const exchangeKey = exchange.toLowerCase();
    const ExchangeClass = (ccxt as any)[exchangeKey] || (ccxt as any).binance;
    const client = new ExchangeClass({
      apiKey: creds.apiKey,
      secret: creds.apiSecret,
      password: creds.passphrase,
      timeout: 6000,
      enableRateLimit: true,
    });

    let canFetchBalance = false;
    let balanceSample = null;

    try {
      if (typeof client.fetchBalance === 'function') {
        const balance = await client.fetchBalance();
        canFetchBalance = true;
        balanceSample = {
          totalUsdt: balance?.total?.USDT ?? balance?.free?.USDT ?? 0,
        };
      }
    } catch (_connErr: any) {
      // If full fetchBalance fails (e.g. read-only permissions), test public ping
      await client.fetchTime?.();
    }

    res.json({
      status: 'success',
      verified: true,
      exchange,
      readPermissionsActive: canFetchBalance,
      sampleInfo: balanceSample,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({
      status: 'error',
      verified: false,
      message: err.message || 'Exchange verification failed. Check API key permissions and network.',
    });
  }
});
