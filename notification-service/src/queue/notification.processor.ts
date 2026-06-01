import { NotificationPayload, NotificationResult } from '../types/notification.types';
import { sendEmail } from '../channels/email.provider';
import { updateLog } from '../db';
import { logger } from '../utils/logger';

export async function processNotification(
  jobId: string,
  payload: NotificationPayload
): Promise<NotificationResult> {
  switch (payload.channel) {
    case 'email': {
      const result = await sendEmail(payload);
      updateLog(
        jobId,
        result.success ? 'sent' : 'failed',
        result.messageId,
        result.error
      );
      return { ...result, jobId };
    }
    default: {
      const channel = (payload as { channel: string }).channel;
      logger.error('Unsupported notification channel', { channel, jobId });
      updateLog(jobId, 'failed', undefined, `Unsupported channel: ${channel}`);
      throw new Error(`Unsupported channel: ${channel}`);
    }
  }
}
