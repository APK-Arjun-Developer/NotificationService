import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { notificationService } from '../services/notification.service';
import { validate, NotifySchema, BatchNotifySchema } from '../middleware/validate.middleware';
import { apiKeyAuth } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiter: 120 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests — limit is 120/min' },
});

// All notify routes require API key + rate limiting
router.use(apiKeyAuth);
router.use(limiter);

// ─── POST /notify  — send a single notification ───────────────────────────────
router.post('/', validate(NotifySchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await notificationService.send(req.body);
    res.status(202).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    logger.error('POST /notify failed', { error: message });
    res.status(500).json({ success: false, error: message });
  }
});

// ─── POST /notify/batch  — send up to 1000 notifications ─────────────────────
router.post('/batch', validate(BatchNotifySchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await notificationService.sendBatch(req.body);
    res.status(202).json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    logger.error('POST /notify/batch failed', { error: message });
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
