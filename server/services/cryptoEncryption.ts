import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// AES-256-GCM Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

let runtimeKeyCache: Buffer | null = null;

/**
 * Derives a 32-byte master encryption key.
 * 1. Checks process.env.ENCRYPTION_MASTER_KEY.
 * 2. If not set, checks for local secure runtime key file (.server-vault.key).
 * 3. If neither exists, generates a high-entropy 256-bit cryptographically random key
 *    using crypto.randomBytes(32), persists it with 0o600 permissions if possible,
 *    and caches it in memory.
 * 
 * STRICT ZERO-HARDCODED-SECRET GUARANTEE: Never falls back to any static string in source code.
 */
function getMasterKey(): Buffer {
  if (runtimeKeyCache) return runtimeKeyCache;

  const envKey = process.env.ENCRYPTION_MASTER_KEY?.trim();
  if (envKey) {
    runtimeKeyCache = crypto.createHash('sha256').update(envKey).digest();
    return runtimeKeyCache;
  }

  // Check persistent runtime key file
  const keyFilePath = path.join(process.cwd(), '.server-vault.key');
  try {
    if (fs.existsSync(keyFilePath)) {
      const fileContent = fs.readFileSync(keyFilePath, 'utf8').trim();
      if (fileContent.length >= 32) {
        runtimeKeyCache = crypto.createHash('sha256').update(fileContent).digest();
        return runtimeKeyCache;
      }
    }
  } catch (_readErr) {
    // Continue to generation
  }

  // Generate a cryptographically secure 256-bit random key
  const randomSecret = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(keyFilePath, randomSecret, { encoding: 'utf8', mode: 0o600 });
  } catch (_writeErr) {
    // Read-only filesystem fallback: random key remains in memory
  }

  runtimeKeyCache = crypto.createHash('sha256').update(randomSecret).digest();
  return runtimeKeyCache;
}

export interface EncryptedPayload {
  cipherBlob: string;
  iv: string;
  tag: string;
  salt?: string;
  maskedKey: string;
  version: number;
}

/**
 * Encrypts sensitive exchange API credentials using AES-256-GCM
 */
export function encryptExchangeCredentials(rawCredentials: {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
}): EncryptedPayload {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const rawJson = JSON.stringify(rawCredentials);
  let encrypted = cipher.update(rawJson, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  // Mask API key for safe UI display (e.g., ak_***1234)
  const keyStr = rawCredentials.apiKey.trim();
  const maskedKey = keyStr.length > 8
    ? `${keyStr.substring(0, 4)}***${keyStr.substring(keyStr.length - 4)}`
    : '***MASKED***';

  return {
    cipherBlob: encrypted,
    iv: iv.toString('hex'),
    tag,
    maskedKey,
    version: 1,
  };
}

/**
 * Decrypts exchange API credentials strictly on the server-side
 */
export function decryptExchangeCredentials(payload: {
  cipherBlob: string;
  iv: string;
  tag: string;
}): { apiKey: string; apiSecret: string; passphrase?: string } {
  const masterKey = getMasterKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.cipherBlob, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
