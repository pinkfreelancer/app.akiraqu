import { Request, Response, NextFunction } from 'express';

/**
 * ARCHITECTURE NOTICE: Rate Limiting Store
 * Current Implementation: Single-Instance In-Memory Map.
 * 
 * In a single-container or local preview environment, this in-memory store
 * tracks request counters by client IP with window resets.
 * 
 * For multi-instance horizontal scaling (e.g., multiple Cloud Run container replicas),
 * persistent state across instances requires an external Redis store using REDIS_URL
 * (as specified in .env.example). When scaling out, point rateLimitMiddleware to
 * a Redis-backed distributed counter (ioredis / redis cluster).
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const isDistributedRedisConfigured = Boolean(process.env.REDIS_URL && process.env.REDIS_URL.trim().length > 0);

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Exclude static assets, bundles, and health check from rate limiting
  if (!req.path.startsWith('/api') || req.path === '/api/v1/health') {
    return next();
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 600;

  // Track rate limiting mode in response headers for infrastructure observability
  res.setHeader('X-RateLimit-Scope', isDistributedRedisConfigured ? 'distributed-redis-ready' : 'single-instance-in-memory');
  res.setHeader('X-RateLimit-Limit', String(maxRequests));

  const currentRate = rateLimitMap.get(clientIp);
  if (!currentRate || now > currentRate.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - 1));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
  } else {
    currentRate.count++;
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - currentRate.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(currentRate.resetTime / 1000)));

    if (currentRate.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded: ${maxRequests} requests per minute`,
        retryAfter: Math.ceil((currentRate.resetTime - now) / 1000),
        storeScope: isDistributedRedisConfigured ? 'distributed-redis-ready' : 'single-instance-in-memory',
      });
      return;
    }
  }

  next();
}

export function errorHandlerMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  const structuredError = {
    severity: 'ERROR',
    service: 'akiraqu-backend-express',
    type: 'SERVER_UNHANDLED_EXCEPTION',
    message: err.message || 'An unexpected server error occurred',
    stack: err.stack || null,
    path: req.path,
    method: req.method,
    clientIp: req.ip || req.headers['x-forwarded-for'],
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(structuredError));

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
}
