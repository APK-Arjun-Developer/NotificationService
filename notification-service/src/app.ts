import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { runMigrations } from './db';
import { verifyEmailConnection } from './channels/email.provider';
import { notificationWorker } from './queue/notification.queue';
import { requestLogger } from './middleware/requestLogger.middleware';
import notifyRouter from './routes/notify.route';
import healthRouter from './routes/health.route';

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

// Security headers
app.use(helmet());

// Trust proxy (important when behind nginx / docker)
app.set('trust proxy', 1);

// Parse JSON — max 2MB
app.use(express.json({ limit: '2mb' }));

// Request logging
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/health', healthRouter);
app.use('/notify', notifyRouter);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  try {
    // 1. Run DB migrations
    await runMigrations();

    // 2. Verify SMTP connection (non-blocking — logs warning if fails)
    await verifyEmailConnection();

    // 3. Start server
    app.listen(env.PORT, () => {
      logger.info(`Notification service started`, {
        port: env.PORT,
        env: env.NODE_ENV,
        channels: ['email'],
      });
    });
  } catch (err) {
    logger.error('Startup failed', { error: err instanceof Error ? err.message : err });
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} — shutting down gracefully`);
  try {
    await notificationWorker.close();
    logger.info('Worker closed');
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
