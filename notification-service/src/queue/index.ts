import { v4 as uuidv4 } from 'uuid';
import { NotificationPayload } from '../types/notification.types';
import { processNotification } from './notification.processor';
import { logger } from '../utils/logger';

const MAX_ATTEMPTS = 3;
const CONCURRENCY = 5;

interface QueueJob {
  id: string;
  name: string;
  data: NotificationPayload;
  priority: number;
  attemptsMade: number;
}

class InlineNotificationQueue {
  private waiting: QueueJob[] = [];
  private active = 0;
  private completed = 0;
  private failed = 0;
  private shutdown = false;
  private drainResolvers: Array<() => void> = [];

  async add(
    name: string,
    data: NotificationPayload,
    opts?: { priority?: number }
  ): Promise<{ id: string }> {
    const job: QueueJob = {
      id: uuidv4(),
      name,
      data,
      priority: opts?.priority ?? 5,
      attemptsMade: 0,
    };
    this.waiting.push(job);
    this.waiting.sort((a, b) => a.priority - b.priority);
    this.pump();
    return { id: job.id };
  }

  async addBulk(
    items: Array<{ name: string; data: NotificationPayload; opts?: { priority?: number } }>
  ): Promise<Array<{ id: string }>> {
    return Promise.all(
      items.map((item) => this.add(item.name, item.data, item.opts))
    );
  }

  getWaitingCount(): Promise<number> {
    return Promise.resolve(this.waiting.length);
  }

  getActiveCount(): Promise<number> {
    return Promise.resolve(this.active);
  }

  getCompletedCount(): Promise<number> {
    return Promise.resolve(this.completed);
  }

  getFailedCount(): Promise<number> {
    return Promise.resolve(this.failed);
  }

  getDelayedCount(): Promise<number> {
    return Promise.resolve(0);
  }

  async drain(): Promise<void> {
    if (this.active === 0 && this.waiting.length === 0) return;
    return new Promise((resolve) => {
      this.drainResolvers.push(resolve);
      this.tryResolveDrain();
    });
  }

  requestShutdown(): void {
    this.shutdown = true;
    this.tryResolveDrain();
  }

  private tryResolveDrain(): void {
    if (this.active === 0 && this.waiting.length === 0) {
      const resolvers = this.drainResolvers.splice(0);
      resolvers.forEach((r) => r());
    }
  }

  private pump(): void {
    if (this.shutdown) return;

    while (this.active < CONCURRENCY && this.waiting.length > 0) {
      const job = this.waiting.shift()!;
      this.active++;
      void this.runJob(job);
    }
  }

  private async runJob(job: QueueJob): Promise<void> {
    try {
      await processNotification(job.id, job.data);
      this.completed++;
    } catch (err) {
      job.attemptsMade++;
      const message = err instanceof Error ? err.message : String(err);

      if (job.attemptsMade < MAX_ATTEMPTS) {
        logger.warn('Notification job retry scheduled', {
          jobId: job.id,
          attempt: job.attemptsMade,
          error: message,
        });
        const delayMs = 3000 * Math.pow(2, job.attemptsMade - 1);
        setTimeout(() => {
          this.waiting.push(job);
          this.waiting.sort((a, b) => a.priority - b.priority);
          this.pump();
        }, delayMs);
      } else {
        this.failed++;
        logger.error('Notification job permanently failed', {
          jobId: job.id,
          error: message,
        });
      }
    } finally {
      this.active--;
      this.pump();
      this.tryResolveDrain();
    }
  }
}

let queue: InlineNotificationQueue | null = null;

export async function initQueue(): Promise<void> {
  queue = new InlineNotificationQueue();
  logger.info('Inline notification queue ready');
}

export async function closeQueue(): Promise<void> {
  if (!queue) return;
  queue.requestShutdown();
  await queue.drain();
  queue = null;
}

export function getNotificationQueue(): InlineNotificationQueue {
  if (!queue) {
    throw new Error('Notification queue not initialized — call initQueue() at startup');
  }
  return queue;
}
