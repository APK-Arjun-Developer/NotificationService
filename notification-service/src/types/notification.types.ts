// ─────────────────────────────────────────────────────────────────────────────
// Notification types
// Add new channels here when SMS / Push / WhatsApp are implemented.
// The discriminated union keeps the compiler honest — every handler must
// cover every case.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationChannel = 'email'; // | 'sms' | 'push' | 'whatsapp'

export type NotificationPriority = 'low' | 'normal' | 'high';

export type NotificationStatus = 'queued' | 'sent' | 'failed';

// ── Email ────────────────────────────────────────────────────────────────────

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailNotification {
  channel: 'email';
  to: string | string[];
  subject: string;
  /** Full HTML body */
  html: string;
  /** Plain-text fallback — auto-generated from html if omitted */
  text?: string;
  /** Override the default FROM address */
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  priority?: NotificationPriority;
  /** Arbitrary key-value bag for your own tracking */
  metadata?: Record<string, unknown>;
}

// ── Future channels (stubs) ────────────────────────────────────────────────

// export interface SmsNotification { channel: 'sms'; ... }
// export interface PushNotification { channel: 'push'; ... }
// export interface WhatsAppNotification { channel: 'whatsapp'; ... }

// ── Union ─────────────────────────────────────────────────────────────────

export type NotificationPayload = EmailNotification;
// When new channels arrive:
// export type NotificationPayload = EmailNotification | SmsNotification | ...;

// ── Result ────────────────────────────────────────────────────────────────

export interface NotificationResult {
  success: boolean;
  jobId?: string;
  messageId?: string;
  channel: NotificationChannel;
  error?: string;
  timestamp: Date;
}

export interface BatchNotificationResult {
  total: number;
  queued: number;
  jobIds: string[];
}

// ── Audit record (stored in Postgres) ────────────────────────────────────

export interface NotificationAuditRecord {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  status: NotificationStatus;
  messageId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
