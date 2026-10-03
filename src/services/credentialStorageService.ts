import { useState, useEffect } from 'react';
import { doc, setDoc, getDocs, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ExchangeApiCredential } from '../types/crypto.types';
import { INITIAL_EXCHANGE_CREDENTIALS } from './terminalExtensionService';

/**
 * Unified Exchange Credentials Storage Engine for AKIRAQU Terminal
 * 
 * Security Directives:
 * 1. Zero Raw Secrets in LocalStorage: All real API secrets are stripped before writing to local storage.
 * 2. Mandatory Server-Side AES-256-GCM Encryption: Raw keys are sent exclusively to /api/v1/credentials/encrypt.
 * 3. Firestore Vault Compliance: Encrypted blobs (maskedKey, cipherBlob, iv, tag) are stored in Firestore
 *    under /users/{userId}/credentials/{credId} strictly honoring doesNotContainRawSecrets() firestore.rules.
 * 4. Authenticated API Tunnel: Requests to /credentials/* require a valid Firebase Auth Bearer token.
 */

export const CREDENTIALS_STORAGE_KEY = 'akiraqu_exchange_credentials';
const LEGACY_KEY_IMAS = 'imasbtc_exchange_credentials';
const LEGACY_KEY_NEXUS = 'nexus_exchange_credentials';
const EVENT_NAME = 'akiraqu_credentials_updated';

let inMemoryCredentialsCache: ExchangeApiCredential[] | null = null;

/**
 * Sanitizes credentials before writing to localStorage or memory state.
 * Real credentials MUST NOT retain raw apiSecret or raw apiKey.
 */
export function sanitizeCredentialsForClient(creds: ExchangeApiCredential[]): ExchangeApiCredential[] {
  return creds.map((cred) => {
    if (cred.isDemo) {
      // Demo sandbox accounts are purely virtual/mock
      return cred;
    }

    // Real Account: Scrub raw secrets
    const masked = cred.maskedKey || (cred.apiKey && cred.apiKey.length > 8
      ? `${cred.apiKey.substring(0, 4)}***${cred.apiKey.substring(cred.apiKey.length - 4)}`
      : '***MASKED***');

    return {
      ...cred,
      apiKey: masked,
      apiSecret: '***ENCRYPTED_VAULT***',
      passphrase: cred.passphrase ? '***ENCRYPTED***' : undefined,
      maskedKey: masked,
      isEncrypted: Boolean(cred.cipherBlob && cred.iv && cred.tag),
    };
  });
}

/**
 * Loads exchange credentials, automatically scrubbing any legacy unencrypted secrets from local storage.
 */
export function loadExchangeCredentials(): ExchangeApiCredential[] {
  if (inMemoryCredentialsCache) {
    return inMemoryCredentialsCache;
  }

  if (typeof window === 'undefined') {
    return INITIAL_EXCHANGE_CREDENTIALS;
  }

  try {
    let rawList: any[] | null = null;

    // 1. Primary key
    const primary = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (primary) {
      const parsed = JSON.parse(primary);
      if (Array.isArray(parsed) && parsed.length > 0) {
        rawList = parsed;
      }
    }

    // 2. Migration from legacy IMASBTC key
    if (!rawList) {
      const legacyImas = localStorage.getItem(LEGACY_KEY_IMAS);
      if (legacyImas) {
        const parsed = JSON.parse(legacyImas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawList = parsed;
        }
      }
    }

    // 3. Migration from legacy Nexus key
    if (!rawList) {
      const legacyNexus = localStorage.getItem(LEGACY_KEY_NEXUS);
      if (legacyNexus) {
        const parsed = JSON.parse(legacyNexus);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawList = parsed;
        }
      }
    }

    if (rawList) {
      // Sanitize immediately to scrub any historical plaintext secrets from storage
      const sanitized = sanitizeCredentialsForClient(rawList);
      const sanitizedJson = JSON.stringify(sanitized);

      // Re-save sanitized data back to localStorage to wipe any historical raw secrets
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, sanitizedJson);
      localStorage.setItem(LEGACY_KEY_IMAS, sanitizedJson);
      localStorage.setItem(LEGACY_KEY_NEXUS, sanitizedJson);

      inMemoryCredentialsCache = sanitized;
      return sanitized;
    }
  } catch (err) {
    console.warn('[AKIRAQU Credentials] Error loading exchange credentials from storage:', err);
  }

  inMemoryCredentialsCache = INITIAL_EXCHANGE_CREDENTIALS;
  return INITIAL_EXCHANGE_CREDENTIALS;
}

/**
 * Persists credentials to local storage, strictly sanitizing out raw secrets first.
 */
export function saveExchangeCredentials(credentials: ExchangeApiCredential[]): void {
  const sanitized = sanitizeCredentialsForClient(credentials);
  inMemoryCredentialsCache = sanitized;

  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(sanitized);
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, serialized);
    // Keep legacy keys scrubbed in sync
    localStorage.setItem(LEGACY_KEY_IMAS, serialized);
    localStorage.setItem(LEGACY_KEY_NEXUS, serialized);

    // Broadcast update across the application
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: sanitized }));
  } catch (err) {
    console.error('[AKIRAQU Credentials] Failed to save exchange credentials:', err);
  }
}

/**
 * Helper to retrieve current Firebase Auth token for authenticated backend API calls.
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (auth?.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (_e) {
    // ignore
  }
  return null;
}

/**
 * Encrypts API credentials via Server-Side AES-256-GCM using authenticated tunnel.
 */
export async function encryptCredentialsServerSide(params: {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
}): Promise<{
  maskedKey: string;
  cipherBlob: string;
  iv: string;
  tag: string;
  version: number;
} | null> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/v1/credentials/encrypt', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const json = await res.json();
      return json.data;
    } else {
      const errJson = await res.json().catch(() => ({}));
      console.error('[AKIRAQU Credentials] Server encryption request failed:', res.status, errJson);
    }
  } catch (err) {
    console.error('[AKIRAQU Credentials] Server-side encryption error:', err);
  }
  return null;
}

/**
 * Tests connection via Server-side Decryption strictly after validating user ownership in Firestore vault.
 * Protects against decryption oracle attacks by querying Firestore by credId under the verified user's uid.
 */
export async function verifyCredentialsServerSide(params: {
  credId: string;
  exchange?: string;
}): Promise<{ verified: boolean; message?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        verified: false,
        message: 'Pengguna belum terautentikasi dengan Firebase Auth.',
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const res = await fetch('/api/v1/credentials/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        credId: params.credId,
        exchange: params.exchange,
      }),
    });
    const json = await res.json();
    return {
      verified: json.verified === true,
      message: json.message,
    };
  } catch (err: any) {
    return {
      verified: false,
      message: err.message || 'Network error during exchange credential check',
    };
  }
}

/**
 * Validates whether the user is properly authenticated in Firebase Auth for Firestore operations.
 * If the user is running in guest/demo mode or auth is not initialized, returns false so that
 * local storage fallback is used cleanly without triggering Firestore permission errors.
 */
export function isUserAuthenticatedForFirestore(userId?: string | null): boolean {
  if (!db || !userId) return false;
  if (userId.startsWith('demo_')) return false;
  if (!auth?.currentUser) return false;
  if (auth.currentUser.isAnonymous) return false;
  return auth.currentUser.uid === userId;
}

/**
 * Saves encrypted exchange credential metadata to Firestore under /users/{userId}/credentials/{credId}.
 * Strictly complies with firestore.rules doesNotContainRawSecrets() and required keys constraint:
 * ['exchange', 'maskedKey', 'cipherBlob', 'iv', 'tag', 'updatedAt'].
 */
export async function saveEncryptedCredentialToFirestore(
  userId: string,
  cred: ExchangeApiCredential
): Promise<void> {
  if (!db || !userId) {
    throw new Error('Firestore database instance or userId is not available.');
  }

  // Skip remote cloud save if running in demo mode or not authenticated with Firebase Auth
  if (!isUserAuthenticatedForFirestore(userId)) {
    return;
  }

  if (!cred.cipherBlob || !cred.iv || !cred.tag) {
    throw new Error('Cannot save to Firestore: Credential must be encrypted with AES-256-GCM cipher payload first.');
  }

  const masked = cred.maskedKey || (cred.apiKey ? `${cred.apiKey.slice(0, 4)}***${cred.apiKey.slice(-4)}` : '***MASKED***');
  const credDocRef = doc(db, 'users', userId, 'credentials', cred.id);

  // Payload strictly contains zero raw secrets (no apiKey, no apiSecret, no passphrase, no secret)
  const firestoreData = {
    id: cred.id,
    name: cred.name,
    exchange: cred.exchange,
    marketType: cred.marketType,
    isTestnet: Boolean(cred.isTestnet),
    isDemo: Boolean(cred.isDemo),
    status: cred.status,
    maskedKey: masked,
    cipherBlob: cred.cipherBlob,
    iv: cred.iv,
    tag: cred.tag,
    version: cred.version || 1,
    latencyMs: cred.latencyMs || 0,
    accountBalanceUsd: cred.accountBalanceUsd || 0,
    permissions: cred.permissions,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(credDocRef, firestoreData, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
      console.warn('[AKIRAQU Credentials] Cloud vault save skipped: insufficient permissions for user', userId);
      return;
    }
    console.error('[AKIRAQU Credentials] Error saving encrypted credential to Firestore:', err);
  }
}

/**
 * Removes an encrypted credential document from Firestore.
 */
export async function deleteEncryptedCredentialFromFirestore(
  userId: string,
  credId: string
): Promise<void> {
  if (!db || !userId || !credId) return;
  if (!isUserAuthenticatedForFirestore(userId)) return;

  try {
    const credDocRef = doc(db, 'users', userId, 'credentials', credId);
    await deleteDoc(credDocRef);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
      console.warn('[AKIRAQU Credentials] Cloud vault delete skipped: insufficient permissions.');
      return;
    }
    console.warn('[AKIRAQU Credentials] Delete from Firestore error:', err);
  }
}

/**
 * Loads all encrypted credentials stored in Firestore for the authenticated user.
 */
export async function loadEncryptedCredentialsFromFirestore(
  userId: string
): Promise<ExchangeApiCredential[]> {
  // If not authenticated in Firebase Auth (e.g. guest/demo session or pending auth init), return empty list safely
  if (!isUserAuthenticatedForFirestore(userId)) {
    return [];
  }

  try {
    const credsColRef = collection(db, 'users', userId, 'credentials');
    const snapshot = await getDocs(credsColRef);
    const loaded: ExchangeApiCredential[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      loaded.push({
        id: data.id || d.id,
        name: data.name || `${data.exchange} Account`,
        exchange: data.exchange,
        marketType: data.marketType || 'SPOT',
        apiKey: data.maskedKey || '***MASKED***',
        apiSecret: '***ENCRYPTED_VAULT***',
        isTestnet: Boolean(data.isTestnet),
        isDemo: Boolean(data.isDemo),
        status: data.status || 'CONNECTED',
        permissions: data.permissions || {
          readOnly: true,
          spotTrading: data.marketType === 'SPOT',
          futuresTrading: data.marketType === 'FUTURES',
          withdrawEnabled: false,
        },
        maskedKey: data.maskedKey,
        cipherBlob: data.cipherBlob,
        iv: data.iv,
        tag: data.tag,
        version: data.version || 1,
        latencyMs: data.latencyMs,
        accountBalanceUsd: data.accountBalanceUsd,
        createdTime: Date.now(),
        isEncrypted: true,
      });
    });

    return loaded;
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err?.message && err.message.includes('insufficient permissions'))) {
      console.warn('[AKIRAQU Credentials] Cloud vault read notice: access deferred (user not authorized or pending session):', err?.message);
      return [];
    }
    console.error('[AKIRAQU Credentials] Error loading encrypted credentials from Firestore:', err);
    return [];
  }
}

/**
 * Syncs Firestore credentials with local state, preserving local demo sandbox accounts.
 */
export async function syncCredentialsWithFirestore(userId: string): Promise<ExchangeApiCredential[]> {
  if (!isUserAuthenticatedForFirestore(userId)) {
    return loadExchangeCredentials();
  }

  try {
    const firestoreCreds = await loadEncryptedCredentialsFromFirestore(userId);
    if (firestoreCreds.length === 0) {
      return loadExchangeCredentials();
    }

    const currentLocal = loadExchangeCredentials();
    const demoAccounts = currentLocal.filter((c) => c.isDemo);

    // Merge Firestore real encrypted accounts with existing demo sandbox accounts
    const merged = [...demoAccounts, ...firestoreCreds];
    saveExchangeCredentials(merged);
    return merged;
  } catch (err) {
    console.warn('[AKIRAQU Credentials] Sync with Firestore notice:', err);
    return loadExchangeCredentials();
  }
}

/**
 * React hook to read and listen to exchange credentials updates in real time.
 */
export function useExchangeCredentials(): [ExchangeApiCredential[], (newCreds: ExchangeApiCredential[]) => void] {
  const [credentials, setCredentials] = useState<ExchangeApiCredential[]>(() => loadExchangeCredentials());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setCredentials(e.detail);
      } else {
        setCredentials(loadExchangeCredentials());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CREDENTIALS_STORAGE_KEY || e.key === LEGACY_KEY_IMAS || e.key === LEGACY_KEY_NEXUS) {
        inMemoryCredentialsCache = null;
        setCredentials(loadExchangeCredentials());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateCredentials = (newCreds: ExchangeApiCredential[]) => {
    saveExchangeCredentials(newCreds);
    setCredentials(newCreds);
  };

  return [credentials, updateCredentials];
}
