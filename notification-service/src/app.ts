import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { runMigrations } from './db';
import { verifyEmailConnection } from './channels/email.provider';
import { initQueue, closeQueue } from './queue';
import { requestLogger } from './middleware/requestLogger.middleware';
import notifyRouter from './routes/notify.route';
import healthRouter from './routes/health.route';

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

app.use(helmet());
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(requestLogger);

app.use('/health', healthRouter);
app.use('/notify', notifyRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  try {
    runMigrations();
    await initQueue();
    await verifyEmailConnection();

    app.listen(env.PORT, () => {
      logger.info('Notification service started', {
        port: env.PORT,
        env: env.NODE_ENV,
        db: env.SQLITE_PATH,
        channels: ['email'],
      });
    });
  } catch (err) {
    logger.error('Startup failed', { error: err instanceof Error ? err.message : err });
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} — shutting down gracefully`);
  try {
    await closeQueue();
    logger.info('Queue closed');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { error: err });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

start();

export default app;
