import { getNotificationQueue } from '../queue';
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

    const job = await getNotificationQueue().add(payload.channel, payload, { priority });

    createLog({
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

    const jobs = await getNotificationQueue().addBulk(
      payloads.map((p) => ({
        name: p.channel,
        data: p,
        opts: { priority: PRIORITY_VALUE[p.priority ?? 'normal'] },
      }))
    );

    const jobIds = jobs.map((j) => j.id!);

    for (let i = 0; i < payloads.length; i++) {
      createLog({
        jobId: jobIds[i],
        channel: payloads[i].channel,
        recipient: getRecipient(payloads[i]),
        subject: getSubject(payloads[i]),
        metadata: payloads[i].metadata,
      });
    }

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
    const queue = getNotificationQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }
}

export const notificationService = new NotificationService();
