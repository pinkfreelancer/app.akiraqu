import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  securityHeadersMiddleware,
  rateLimitMiddleware,
  errorHandlerMiddleware,
} from './middleware/security';
import { apiRouter } from './routes';
import { marketWsProxy } from './services/marketWsProxy';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8080);

// Trust proxy for Cloud Run
app.set('trust proxy', 1);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security & Rate Limiting
app.use(securityHeadersMiddleware);
app.use(rateLimitMiddleware);

// Health check endpoint for Cloud Run startup/liveness probes
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Number(process.uptime().toFixed(1)),
    timestamp: new Date().toISOString(),
    environment: 'production',
    port: PORT,
  });
});

// Centralized API Routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandlerMiddleware);

// Static frontend serving from dist/
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

const server = http.createServer(app);

// Mount Server-Side WebSocket Proxy on /ws/market and /ws/binance
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/ws/market' || url.pathname === '/ws/binance') {
      marketWsProxy.handleUpgrade(request, socket, head);
    }
  } catch (_err) {
    // Ignore invalid upgrade frames
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[AKIRAQU Quantitative AI] Production server listening on 0.0.0.0:${PORT}`);
  console.log(`[AKIRAQU Quantitative AI] Real-time WS Proxy mounted on 0.0.0.0:${PORT}/ws/market`);
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
