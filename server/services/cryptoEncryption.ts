import crypto from 'crypto';

// AES-256-GCM Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derives a 32-byte master encryption key from environment variable or system secret.
 * Fails fast with an immediate exception if ENCRYPTION_MASTER_KEY is not configured in production.
 */
function getMasterKey(): Buffer {
  const isProduction = process.env.NODE_ENV === 'production';
  const masterKey = process.env.ENCRYPTION_MASTER_KEY?.trim();

  if (isProduction && !masterKey) {
    throw new Error(
      'CRITICAL SECURITY ERROR: ENCRYPTION_MASTER_KEY is not defined in production environment. Refusing to operate with unconfigured or insecure encryption key.'
    );
  }

  const keyToUse = masterKey || process.env.GEMINI_API_KEY?.trim();
  if (!keyToUse) {
    throw new Error(
      'CRITICAL SECURITY ERROR: No encryption master key found. ENCRYPTION_MASTER_KEY or GEMINI_API_KEY must be provided.'
    );
  }

  // Use SHA-256 to ensure exactly 32 bytes key length
  return crypto.createHash('sha256').update(keyToUse).digest();
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
