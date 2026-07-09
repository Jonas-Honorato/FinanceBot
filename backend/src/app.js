import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { requireAuth } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { accountRoutes } from './routes/accountRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { budgetsRoutes } from './routes/budgetsRoutes.js';
import { reportsRoutes } from './routes/reportsRoutes.js';
import { summaryRoutes } from './routes/summaryRoutes.js';
import { transactionsRoutes } from './routes/transactionsRoutes.js';
import { webhookRoutes } from './routes/webhookRoutes.js';
import { goalsRoutes } from './routes/goalsRoutes.js';
import { openApiSpec } from './docs/openapi.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === 'test' ? 'tiny' : 'dev'));

  app.get('/', (_req, res) => res.redirect('/docs'));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api', (_req, res) =>
    res.json({
      name: 'FinanceBot API',
      status: 'ok',
      docs: '/docs',
      health: '/health',
    }),
  );
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use('/api/auth', authRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/account', requireAuth, accountRoutes);
  app.use('/api/transactions', requireAuth, transactionsRoutes);
  app.use('/api/summary', requireAuth, summaryRoutes);
  app.use('/api/budgets', requireAuth, budgetsRoutes);
  app.use('/api/goals', requireAuth, goalsRoutes);
  app.use('/api/reports', requireAuth, reportsRoutes);

  app.use(errorHandler);

  return app;
}
