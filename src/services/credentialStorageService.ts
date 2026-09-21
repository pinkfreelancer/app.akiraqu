import { useState, useEffect } from 'react';
import { ExchangeApiCredential } from '../types/crypto.types';
import { INITIAL_EXCHANGE_CREDENTIALS } from './terminalExtensionService';

/**
 * Unified Exchange Credentials Storage Engine for AKIRAQU Terminal
 * 
 * Harmonizes storage across Settings, Bot Hub, and Manual Trading views:
 * - Unified Key: 'akiraqu_exchange_credentials'
 * - Graceful migration: reads from legacy 'imasbtc_exchange_credentials' or 'nexus_exchange_credentials'
 * - Real-time cross-component sync via CustomEvent & storage events
 */

export const CREDENTIALS_STORAGE_KEY = 'akiraqu_exchange_credentials';
const LEGACY_KEY_IMAS = 'imasbtc_exchange_credentials';
const LEGACY_KEY_NEXUS = 'nexus_exchange_credentials';
const EVENT_NAME = 'akiraqu_credentials_updated';

let inMemoryCredentialsCache: ExchangeApiCredential[] | null = null;

export function loadExchangeCredentials(): ExchangeApiCredential[] {
  if (inMemoryCredentialsCache) {
    return inMemoryCredentialsCache;
  }

  if (typeof window === 'undefined') {
    return INITIAL_EXCHANGE_CREDENTIALS;
  }

  try {
    // 1. Primary key
    const primary = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (primary) {
      const parsed = JSON.parse(primary);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCredentialsCache = parsed;
        return parsed;
      }
    }

    // 2. Migration from legacy IMASBTC key
    const legacyImas = localStorage.getItem(LEGACY_KEY_IMAS);
    if (legacyImas) {
      const parsed = JSON.parse(legacyImas);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate to unified key
        localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(parsed));
        inMemoryCredentialsCache = parsed;
        return parsed;
      }
    }

    // 3. Migration from legacy Nexus key
    const legacyNexus = localStorage.getItem(LEGACY_KEY_NEXUS);
    if (legacyNexus) {
      const parsed = JSON.parse(legacyNexus);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate to unified key
        localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(parsed));
        inMemoryCredentialsCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AKIRAQU Credentials] Error loading exchange credentials from storage:', err);
  }

  inMemoryCredentialsCache = INITIAL_EXCHANGE_CREDENTIALS;
  return INITIAL_EXCHANGE_CREDENTIALS;
}

export function saveExchangeCredentials(credentials: ExchangeApiCredential[]): void {
  inMemoryCredentialsCache = credentials;
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(credentials);
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, serialized);
    // Keep legacy keys in sync for backward compatibility during transitions
    localStorage.setItem(LEGACY_KEY_IMAS, serialized);
    localStorage.setItem(LEGACY_KEY_NEXUS, serialized);

    // Broadcast update across the application
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: credentials }));
  } catch (err) {
    console.error('[AKIRAQU Credentials] Failed to save exchange credentials:', err);
  }
}

/**
 * Encrypts API credentials via Server-Side AES-256-GCM
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
    const res = await fetch('/api/v1/credentials/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.error('[AKIRAQU Credentials] Server-side encryption error:', err);
  }
  return null;
}

/**
 * Tests connection via Server-side Decryption without client ever seeing raw secrets
 */
export async function verifyCredentialsServerSide(params: {
  exchange: string;
  cipherBlob: string;
  iv: string;
  tag: string;
}): Promise<{ verified: boolean; message?: string }> {
  try {
    const res = await fetch('/api/v1/credentials/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
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
 * React hook to read and listen to exchange credentials updates in real time
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
