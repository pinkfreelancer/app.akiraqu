import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  securityHeadersMiddleware,
  rateLimitMiddleware,
  errorHandlerMiddleware,
} from './server/middleware/security';
import { apiRouter } from './server/routes';

dotenv.config();

const app = express();

// Determine whether running in development (npm run dev via tsx) or production (Cloud Run / npm start)
const isDev = process.env.NODE_ENV === 'development' || process.env.npm_lifecycle_event === 'dev';
const isProduction = process.env.NODE_ENV === 'production' || !isDev;

// In AI Studio development container, NGINX is on 8080 and reverse-proxies to 3000,
// so Vite / Express dev server MUST listen on port 3000.
// In Cloud Run deployment (production), Cloud Run requires listening on process.env.PORT (defaults to 8080).
const PORT = isProduction
  ? Number(process.env.PORT || 8080)
  : Number(process.env.DEFAULT_APP_PORT || 3000);

// Trust reverse proxy (e.g. Cloud Run, nginx) so client IP is accurately forwarded
app.set('trust proxy', 1);

// 1. Basic Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. Security & Rate Limiting Middleware
app.use(securityHeadersMiddleware);
app.use(rateLimitMiddleware);

// 3. Health Check Endpoints (for Cloud Run startup/liveness health probes)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Number(process.uptime().toFixed(1)),
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    port: PORT,
  });
});

// 4. Centralized API Routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter); // Backward compatibility fallback

// 5. Global Error Handler Middleware
app.use(errorHandlerMiddleware);

// 6. Start Express + Vite Dev or Production Server
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><title>AKIRAQU</title></head><body>AKIRAQU Quantitative AI - System Initialized</body></html>');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AKIRAQU Quantitative AI] Server listening on 0.0.0.0:${PORT} (mode=${isProduction ? 'production' : 'development'})`);
  });

  process.on('SIGTERM', () => {
    console.log('[AKIRAQU Quantitative AI] SIGTERM received, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('[AKIRAQU Quantitative AI] SIGINT received, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('[AKIRAQU Quantitative AI] Startup failure:', err);
});
