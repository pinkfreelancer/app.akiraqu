import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  securityHeadersMiddleware,
  rateLimitMiddleware,
  errorHandlerMiddleware,
} from './server/middleware/security';
import { apiRouter } from './server/routes';

dotenv.config();

const app = express();
const PORT = 3000;

// Trust reverse proxy (e.g. Cloud Run, nginx) so client IP is accurately forwarded
app.set('trust proxy', 1);

// 1. Basic Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. Security & Rate Limiting Middleware
app.use(securityHeadersMiddleware);
app.use(rateLimitMiddleware);

// 3. Centralized API Routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter); // Backward compatibility fallback

// 4. Global Error Handler Middleware
app.use(errorHandlerMiddleware);

// 5. Start Express + Vite Dev or Production Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AKIRAQU Quantitative AI] Modular Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AKIRAQU Quantitative AI] Startup failure:', err);
});
