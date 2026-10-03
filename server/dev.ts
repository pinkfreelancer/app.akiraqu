import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import {
  securityHeadersMiddleware,
  rateLimitMiddleware,
  errorHandlerMiddleware,
} from './middleware/security';
import { apiRouter } from './routes';
import { marketWsProxy } from './services/marketWsProxy';

dotenv.config();

export async function startDevServer() {
  const app = express();
  const PORT = Number(process.env.DEFAULT_APP_PORT || 3000);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(securityHeadersMiddleware);
  app.use(rateLimitMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: Number(process.uptime().toFixed(1)),
      timestamp: new Date().toISOString(),
      environment: 'development',
      port: PORT,
    });
  });

  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  app.use(errorHandlerMiddleware);

  // Mount Vite middleware in development mode
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const server = http.createServer(app);

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/market' || url.pathname === '/ws/binance') {
        marketWsProxy.handleUpgrade(request, socket, head);
      }
    } catch (_err) {
      // Ignore
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AKIRAQU Quantitative AI] Dev server listening on 0.0.0.0:${PORT}`);
  });
}
