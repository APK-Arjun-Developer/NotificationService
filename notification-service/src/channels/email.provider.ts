import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { env } from '../config/env';
import { EmailNotification, NotificationResult } from '../types/notification.types';
import { logger } from '../utils/logger';

// ─── Transporter (singleton, connection pool) ────────────────────────────────

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,      // false for port 587 (STARTTLS), true for 465
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_APP_PASSWORD, // Gmail App Password (16 chars)
    },
    pool: true,           // reuse connections — important for production
    maxConnections: 5,    // max simultaneous SMTP connections
    maxMessages: 100,     // messages per connection before recycling
    rateDelta: 1000,      // 1 second window
    rateLimit: 5,         // max 5 messages per second (Gmail limit)
    tls: {
      rejectUnauthorized: env.NODE_ENV === 'production',
    },
  });

  return _transporter;
}

// ─── Verify connection (called once at startup) ──────────────────────────────

export async function verifyEmailConnection(): Promise<void> {
  try {
    await getTransporter().verify();
    logger.info('SMTP connection verified', {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown SMTP error';
    logger.error('SMTP connection failed — check SMTP_USER and SMTP_APP_PASSWORD', {
      error: message,
    });
    // Don't crash — service still starts, will fail on first send attempt
  }
}

// ─── Strip HTML to plain text (simple fallback) ──────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendEmail(payload: EmailNotification): Promise<NotificationResult> {
  const fromAddress = payload.from ?? env.EMAIL_FROM_ADDRESS;
  const fromFormatted = `"${env.EMAIL_FROM_NAME}" <${fromAddress}>`;

  const mailOptions: SendMailOptions = {
    from: fromFormatted,
    to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text ?? htmlToText(payload.html),
    replyTo: payload.replyTo,
    attachments: payload.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
    priority: payload.priority === 'high' ? 'high' : 'normal',
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);

    logger.info('Email sent', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: payload.subject,
      response: info.response,
    });

    return {
      success: true,
      messageId: info.messageId,
      channel: 'email',
      timestamp: new Date(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Email send failed', {
      error: message,
      to: mailOptions.to,
      subject: payload.subject,
    });
    return {
      success: false,
      error: message,
      channel: 'email',
      timestamp: new Date(),
    };
  }
}
