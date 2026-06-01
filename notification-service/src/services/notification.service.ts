import { notificationQueue } from '../queue/notification.queue';
import {
  NotificationPayload,
  NotificationResult,
  BatchNotificationResult,
  NotificationPriority,
} from '../types/notification.types';
import { createLog } from '../db';
import { logger } from '../utils/logger';

const PRIORITY_VALUE: Record<NotificationPriority, number> = {
  high: 1,
  normal: 5,
  low: 10,
};

function getRecipient(payload: NotificationPayload): string {
  switch (payload.channel) {
    case 'email':
      return Array.isArray(payload.to) ? payload.to[0] : payload.to;
    // case 'sms': return payload.to;
    // case 'push': return payload.deviceToken;
    // case 'whatsapp': return payload.to;
  }
}

function getSubject(payload: NotificationPayload): string | undefined {
  if (payload.channel === 'email') return payload.subject;
  return undefined;
}

export class NotificationService {
  /**
   * Queue a single notification.
   * Returns immediately with a jobId — delivery is async.
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const priority = PRIORITY_VALUE[payload.priority ?? 'normal'];

    const job = await notificationQueue.add(payload.channel, payload, { priority });

    // Create audit record
    await createLog({
      jobId: job.id,
      channel: payload.channel,
      recipient: getRecipient(payload),
      subject: getSubject(payload),
      metadata: payload.metadata,
    });

    logger.info('Notification queued', {
      jobId: job.id,
      channel: payload.channel,
      priority: payload.priority ?? 'normal',
    });

    return {
      success: true,
      jobId: job.id!,
      channel: payload.channel,
      timestamp: new Date(),
    };
  }

  /**
   * Queue multiple notifications in a single call.
   * Useful for batch emails (e.g. newsletter send).
   */
  async sendBatch(payloads: NotificationPayload[]): Promise<BatchNotificationResult> {
    if (payloads.length === 0) {
      return { total: 0, queued: 0, jobIds: [] };
    }

    if (payloads.length > 1000) {
      throw new Error('Batch size limit is 1000 per request');
    }

    const jobs = await notificationQueue.addBulk(
      payloads.map((p) => ({
        name: p.channel,
        data: p,
        opts: { priority: PRIORITY_VALUE[p.priority ?? 'normal'] },
      }))
    );

    const jobIds = jobs.map((j) => j.id!);

    // Audit log for each
    await Promise.allSettled(
      payloads.map((p, i) =>
        createLog({
          jobId: jobIds[i],
          channel: p.channel,
          recipient: getRecipient(p),
          subject: getSubject(p),
          metadata: p.metadata,
        })
      )
    );

    logger.info('Batch notifications queued', {
      total: payloads.length,
      jobIds: jobIds.slice(0, 5), // log first 5 only
    });

    return { total: payloads.length, queued: jobs.length, jobIds };
  }

  /**
   * Get queue health stats.
   */
  async getStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      notificationQueue.getWaitingCount(),
      notificationQueue.getActiveCount(),
      notificationQueue.getCompletedCount(),
      notificationQueue.getFailedCount(),
      notificationQueue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }
}

export const notificationService = new NotificationService();
