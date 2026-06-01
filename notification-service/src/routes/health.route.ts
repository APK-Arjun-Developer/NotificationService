import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { checkDbHealth } from '../db';
import { env } from '../config/env';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [queueStats] = await Promise.allSettled([notificationService.getStats()]);

    const queue = queueStats.status === 'fulfilled' ? queueStats.value : null;
    const db = checkDbHealth() ? 'ok' : 'error';

    res.json({
      status: 'ok',
      env: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      queue,
      db,
      dbPath: env.SQLITE_PATH,
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
