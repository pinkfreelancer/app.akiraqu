import { Request, Response, NextFunction } from 'express';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

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
  const maxRequests = 600;

  const currentRate = rateLimitMap.get(clientIp);
  if (!currentRate || now > currentRate.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
  } else {
    currentRate.count++;
    if (currentRate.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded: 600 requests per minute',
        retryAfter: Math.ceil((currentRate.resetTime - now) / 1000),
      });
      return;
    }
  }

  next();
}

export function errorHandlerMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[AKIRAQU Server Error]:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
}
