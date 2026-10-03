import fs from 'fs';
import path from 'path';

/**
 * Universal Server Entry Point for AKIRAQU Full-Stack Architecture
 *
 * 1. Cloud Run Deployment: Executed via `node server.ts` (or `npm start`).
 *    Loads pre-bundled production server `dist/server.cjs` which serves static assets
 *    and API proxy on process.env.PORT (8080).
 * 2. AI Studio Development: Executed via `tsx server.ts` (`npm run dev`).
 *    Loads `server/dev.ts` with Vite middlewares on port 3000.
 */
const isDev = process.env.npm_lifecycle_event === 'dev' || process.env.VITE_DEV === 'true';
const distServer = path.join(process.cwd(), 'dist', 'server.cjs');

if (!isDev && fs.existsSync(distServer)) {
  await import('./dist/server.cjs');
} else {
  const { startDevServer } = await import('./server/dev.ts');
  await startDevServer();
}
