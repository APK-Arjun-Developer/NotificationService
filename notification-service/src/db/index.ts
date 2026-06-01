import Database, { Database as SqliteDatabase } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { NotificationChannel, NotificationStatus } from '../types/notification.types';

const dbDir = path.dirname(path.resolve(process.cwd(), env.SQLITE_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: SqliteDatabase = new Database(path.resolve(process.cwd(), env.SQLITE_PATH));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Migrations (run on startup) ────────────────────────────────────────────

export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id            TEXT PRIMARY KEY,
      job_id        TEXT,
      channel       TEXT NOT NULL,
      recipient     TEXT NOT NULL,
      subject       TEXT,
      status        TEXT NOT NULL DEFAULT 'queued',
      message_id    TEXT,
      error_message TEXT,
      metadata      TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notification_logs_status
      ON notification_logs(status);

    CREATE INDEX IF NOT EXISTS idx_notification_logs_channel
      ON notification_logs(channel);

    CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at
      ON notification_logs(created_at DESC);
  `);
  logger.info('DB migrations complete', { path: env.SQLITE_PATH });
}

export function checkDbHealth(): boolean {
  try {
    db.prepare('SELECT 1').get();
    return true;
  } catch {
    return false;
  }
}

// ─── Audit helpers ───────────────────────────────────────────────────────────

export interface CreateLogParams {
  jobId?: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  metadata?: Record<string, unknown>;
}

export function createLog(params: CreateLogParams): string {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO notification_logs (id, job_id, channel, recipient, subject, status, metadata)
     VALUES (@id, @jobId, @channel, @recipient, @subject, 'queued', @metadata)`
  ).run({
    id,
    jobId: params.jobId ?? null,
    channel: params.channel,
    recipient: params.recipient,
    subject: params.subject ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
  return id;
}

export function updateLog(
  jobId: string,
  status: NotificationStatus,
  messageId?: string,
  errorMessage?: string
): void {
  db.prepare(
    `UPDATE notification_logs
     SET status = @status, message_id = @messageId, error_message = @errorMessage,
         updated_at = datetime('now')
     WHERE job_id = @jobId`
  ).run({
    status,
    messageId: messageId ?? null,
    errorMessage: errorMessage ?? null,
    jobId,
  });
}
