import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface FirebaseServerConfig {
  projectId: string;
  databaseId: string;
}

let cachedConfig: FirebaseServerConfig | null = null;

export function getFirebaseConfig(): FirebaseServerConfig {
  if (cachedConfig) return cachedConfig;
  let projectId = process.env.FIREBASE_PROJECT_ID || '';
  let databaseId = process.env.FIRESTORE_DATABASE_ID || '';

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) projectId = config.projectId;
      if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
    }
  } catch (_e) {
    // fallback
  }

  cachedConfig = {
    projectId: projectId || 'gen-lang-client-0245230407',
    databaseId: databaseId || 'ai-studio-imasbtc-54789b85-d10f-4089-8e14-2b5841322a2e',
  };
  return cachedConfig;
}

// Official Google Public JWKS key set for Firebase Auth ID Tokens
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  projectId: string;
  rawToken: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication and authorization middleware for credentials vault endpoints.
 * Cryptographically verifies Firebase Auth ID Token (JWT) using Google's public JWKS keys.
 * Strictly enforces RS256 signature verification, issuer, audience, and expiration.
 */
export async function requireCredentialAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied: Valid Authorization Bearer token is required to access credential vault.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Empty Bearer token provided.',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  // Allow simulated tokens in test environment only
  if (process.env.NODE_ENV === 'test' && token.startsWith('test-uid-')) {
    req.user = {
      uid: token.replace('test-uid-', ''),
      email: 'test@example.com',
      projectId: 'test-project',
      rawToken: token,
    };
    next();
    return;
  }

  try {
    const config = getFirebaseConfig();
    const expectedProjectId = config.projectId;

    // Cryptographic verification against Google official JWKS:
    // 1. Signature must match an RS256 public key issued by Google
    // 2. Issuer MUST be https://securetoken.google.com/<projectId>
    // 3. Audience MUST be <projectId>
    // 4. Token must not be expired (exp > now)
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${expectedProjectId}`,
      audience: expectedProjectId,
      algorithms: ['RS256'],
    });

    const uid = payload.sub;
    if (!uid || typeof uid !== 'string') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token: Missing subject claim (user UID).',
        code: 'INVALID_USER_CLAIM',
      });
      return;
    }

    req.user = {
      uid,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      projectId: expectedProjectId,
      rawToken: token,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Cryptographic token verification failed: ' + (err.message || 'Signature or claims invalid'),
      code: 'AUTH_VERIFICATION_FAILED',
    });
  }
}
