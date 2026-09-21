import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const start = Date.now();
  res.json({
    status: 'ok',
    uptime: Number(process.uptime().toFixed(1)),
    latency: Date.now() - start + 0.8,
    version: '1.0.0-MVP',
    tier: 'Business + Privacy Overlay',
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});
