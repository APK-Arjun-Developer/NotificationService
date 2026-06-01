import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { NotificationPayload, NotificationResult } from '../types/notification.types';
import { sendEmail } from '../channels/email.provider';
// Future: import { sendSms } from '../channels/sms.provider';
// Future: import { sendPush } from '../channels/push.provider';
// Future: import { sendWhatsApp } from '../channels/whatsapp.provider';
import { updateLog } from '../db';
import { logger } from '../utils/logger';

// ─── Redis connection ─────────────────────────────────────────────────────────

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
});

redisConnection.on('connect', () => logger.info('Redis connected'));
redisConnection.on('error', (err) => logger.error('Redis error', { error: err.message }));

// ─── Priority map (lower number = higher priority in Bull) ────────────────────

const PRIORITY: Record<string, number> = { high: 1, normal: 5, low: 10 };

// ─── Queue ────────────────────────────────────────────────────────────────────

export const notificationQueue = new Queue<NotificationPayload>('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,                             // retry 3 times on failure
    backoff: { type: 'exponential', delay: 3000 }, // 3s → 9s → 27s
    removeOnComplete: { count: 200 },        // keep last 200 completed
    removeOnFail: { count: 500 },            // keep last 500 failed
  },
});

// ─── Worker (processes jobs) ──────────────────────────────────────────────────

export const notificationWorker = new Worker<NotificationPayload, NotificationResult>(
  'notifications',
  async (job: Job<NotificationPayload>): Promise<NotificationResult> => {
    logger.debug(`Processing job ${job.id}`, {
      channel: job.data.channel,
      attempt: job.attemptsMade + 1,
    });

    let result: NotificationResult;

    switch (job.data.channel) {
      case 'email':
        result = await sendEmail(job.data);
        break;
      // case 'sms':
      //   result = await sendSms(job.data);
      //   break;
      // case 'push':
      //   result = await sendPush(job.data);
      //   break;
      // case 'whatsapp':
      //   result = await sendWhatsApp(job.data);
      //   break;
      default:
        throw new Error(`Unsupported channel: ${(job.data as NotificationPayload).channel}`);
    }

    // Update audit log
    if (job.id) {
      await updateLog(
        job.id,
        result.success ? 'sent' : 'failed',
        result.messageId,
        result.error
      );
    }

    if (!result.success) {
      // Throw so Bull marks this attempt as failed and schedules retry
      throw new Error(result.error ?? 'Send failed');
    }

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 5,        // process 5 jobs simultaneously
    limiter: {
      max: 10,             // max 10 jobs per...
      duration: 1000,      // ...per second (respect Gmail rate limits)
    },
  }
);

// ─── Worker events ────────────────────────────────────────────────────────────

notificationWorker.on('completed', (job, result) => {
  logger.info(`Job completed`, {
    jobId: job.id,
    channel: job.data.channel,
    messageId: result.messageId,
  });
});

notificationWorker.on('failed', (job, err) => {
  const isLastAttempt = job ? job.attemptsMade >= (job.opts.attempts ?? 3) : true;
  const level = isLastAttempt ? 'error' : 'warn';
  logger[level](`Job ${isLastAttempt ? 'permanently failed' : 'attempt failed'}`, {
    jobId: job?.id,
    channel: job?.data.channel,
    attempt: job?.attemptsMade,
    error: err.message,
  });
});

notificationWorker.on('error', (err) => {
  logger.error('Worker error', { error: err.message });
});

// ─── Queue events (for monitoring) ───────────────────────────────────────────

export const queueEvents = new QueueEvents('notifications', {
  connection: new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }),
});
