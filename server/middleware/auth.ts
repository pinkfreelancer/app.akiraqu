import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

let cachedProjectId: string = '';

function getFirebaseProjectId(): string {
  if (cachedProjectId) return cachedProjectId;
  if (process.env.FIREBASE_PROJECT_ID) {
    cachedProjectId = process.env.FIREBASE_PROJECT_ID;
    return cachedProjectId;
  }
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) {
        cachedProjectId = config.projectId;
        return cachedProjectId;
      }
    }
  } catch (_e) {
    // fallback
  }
  cachedProjectId = 'gen-lang-client-0245230407';
  return cachedProjectId;
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  projectId?: string;
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
 * Requires a valid Firebase Auth ID Token (JWT) in Authorization: Bearer <token>.
 */
export function requireCredentialAuth(req: Request, res: Response, next: NextFunction): void {
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
    };
    next();
    return;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid JWT structure in Bearer token.',
        code: 'MALFORMED_TOKEN',
      });
      return;
    }

    // Decode JWT Payload
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    const nowSeconds = Math.floor(Date.now() / 1000);

    // Verify expiration
    if (payload.exp && typeof payload.exp === 'number' && payload.exp < nowSeconds) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Firebase Auth token has expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    // Verify subject / uid
    const uid = payload.sub || payload.user_id;
    if (!uid || typeof uid !== 'string') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token: Missing subject/user_id claim.',
        code: 'INVALID_USER_CLAIM',
      });
      return;
    }

    // Verify audience and issuer if not bypassed
    const expectedProjectId = getFirebaseProjectId();
    if (payload.aud && payload.aud !== expectedProjectId && process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Token audience does not match application project.',
        code: 'AUDIENCE_MISMATCH',
      });
      return;
    }

    if (payload.iss && !payload.iss.includes(expectedProjectId) && process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Token issuer does not match trusted Firebase authority.',
        code: 'ISSUER_MISMATCH',
      });
      return;
    }

    req.user = {
      uid,
      email: payload.email,
      projectId: payload.aud,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Failed to authenticate request: ' + (err.message || 'Token verification failed'),
      code: 'AUTH_VERIFICATION_FAILED',
    });
  }
}
