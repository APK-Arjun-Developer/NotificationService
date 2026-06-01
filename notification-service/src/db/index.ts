import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { NotificationChannel, NotificationStatus } from '../types/notification.types';

export const pool = new Pool({ connectionString: env.DATABASE_URL });

pool.on('error', (err) => {
  logger.error('Postgres pool error', { error: err.message });
});

// ─── Migrations (run on startup) ────────────────────────────────────────────

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id        TEXT,
      channel       TEXT NOT NULL,
      recipient     TEXT NOT NULL,
      subject       TEXT,
      status        TEXT NOT NULL DEFAULT 'queued',
      message_id    TEXT,
      error_message TEXT,
      metadata      JSONB,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notification_logs_status
      ON notification_logs(status);

    CREATE INDEX IF NOT EXISTS idx_notification_logs_channel
      ON notification_logs(channel);

    CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at
      ON notification_logs(created_at DESC);
  `);
  logger.info('DB migrations complete');
}

// ─── Audit helpers ───────────────────────────────────────────────────────────

export interface CreateLogParams {
  jobId?: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  metadata?: Record<string, unknown>;
}

export async function createLog(params: CreateLogParams): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO notification_logs (job_id, channel, recipient, subject, status, metadata)
     VALUES ($1, $2, $3, $4, 'queued', $5)
     RETURNING id`,
    [params.jobId ?? null, params.channel, params.recipient, params.subject ?? null,
     params.metadata ? JSON.stringify(params.metadata) : null]
  );
  return rows[0].id;
}

export async function updateLog(
  jobId: string,
  status: NotificationStatus,
  messageId?: string,
  errorMessage?: string
): Promise<void> {
  await pool.query(
    `UPDATE notification_logs
     SET status = $1, message_id = $2, error_message = $3, updated_at = NOW()
     WHERE job_id = $4`,
    [status, messageId ?? null, errorMessage ?? null, jobId]
  );
}
