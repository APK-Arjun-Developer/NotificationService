import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];

  if (!key) {
    logger.warn('Request missing API key', { ip: req.ip, path: req.path });
    res.status(401).json({ success: false, error: 'Missing x-api-key header' });
    return;
  }

  if (key !== env.API_KEY) {
    logger.warn('Invalid API key', { ip: req.ip, path: req.path });
    res.status(401).json({ success: false, error: 'Invalid API key' });
    return;
  }

  next();
}
