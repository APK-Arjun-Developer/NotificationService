import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { pool } from '../db';
import { env } from '../config/env';

const router = Router();

// Public health check — no auth required
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [queueStats, dbResult] = await Promise.allSettled([
      notificationService.getStats(),
      pool.query('SELECT 1'),
    ]);

    const queue = queueStats.status === 'fulfilled' ? queueStats.value : null;
    const db = dbResult.status === 'fulfilled' ? 'ok' : 'error';

    res.json({
      status: 'ok',
      env: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      queue,
      db,
      channels: {
        email: 'active',
        sms: 'not_implemented',
        push: 'not_implemented',
        whatsapp: 'not_implemented',
      },
    });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});

export default router;
