import { Router } from 'express';
import { healthRouter } from './health';
import { marketRouter } from './market';
import { analysisRouter } from './analysis';
import { backtestRouter } from './backtest';
import { privacyRouter } from './privacy';
import { credentialsRouter } from './credentials';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(marketRouter);
apiRouter.use(analysisRouter);
apiRouter.use(backtestRouter);
apiRouter.use(privacyRouter);
apiRouter.use(credentialsRouter);
