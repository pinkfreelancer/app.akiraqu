import crypto from 'crypto';

// AES-256-GCM Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derives a 32-byte master encryption key from environment variable or system secret
 */
function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_MASTER_KEY || process.env.GEMINI_API_KEY || 'AKIRAQU_FALLBACK_SECURE_VAULT_KEY_2026';
  // Use SHA-256 to ensure exactly 32 bytes key length
  return crypto.createHash('sha256').update(secret).digest();
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
