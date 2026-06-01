import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// ─── Channel schemas ──────────────────────────────────────────────────────────

const PrioritySchema = z.enum(['low', 'normal', 'high']).optional().default('normal');

export const EmailSchema = z.object({
  channel: z.literal('email'),
  to: z.union([
    z.string().email('Invalid email address'),
    z
      .array(z.string().email('Invalid email in array'))
      .min(1, 'At least one recipient required')
      .max(50, 'Max 50 recipients per request'),
  ]),
  subject: z.string().min(1, 'Subject is required').max(998, 'Subject too long'),
  html: z.string().min(1, 'HTML body is required'),
  text: z.string().optional(),
  from: z.string().email('Invalid from address').optional(),
  replyTo: z.string().email('Invalid replyTo address').optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string().min(1),
        content: z.string().min(1, 'Base64 or text content required'),
        contentType: z.string().optional(),
      })
    )
    .max(5, 'Max 5 attachments')
    .optional(),
  priority: PrioritySchema,
  metadata: z.record(z.unknown()).optional(),
});

// Future channel schemas (uncomment when implementing):
//
// export const SmsSchema = z.object({
//   channel: z.literal('sms'),
//   to: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Must be E.164 format e.g. +919876543210'),
//   message: z.string().min(1).max(1600),
//   priority: PrioritySchema,
//   metadata: z.record(z.unknown()).optional(),
// });
//
// export const PushSchema = z.object({
//   channel: z.literal('push'),
//   deviceToken: z.string().min(1),
//   title: z.string().min(1).max(100),
//   body: z.string().min(1).max(500),
//   data: z.record(z.string()).optional(),
//   priority: PrioritySchema,
//   metadata: z.record(z.unknown()).optional(),
// });
//
// export const WhatsAppSchema = z.object({
//   channel: z.literal('whatsapp'),
//   to: z.string().regex(/^\+[1-9]\d{7,14}$/),
//   templateName: z.string().min(1),
//   templateParams: z.array(z.string()).optional(),
//   priority: PrioritySchema,
//   metadata: z.record(z.unknown()).optional(),
// });

// ─── Union (extend as channels are added) ────────────────────────────────────

export const NotifySchema = z.discriminatedUnion('channel', [
  EmailSchema,
  // SmsSchema,
  // PushSchema,
  // WhatsAppSchema,
]);

export const BatchNotifySchema = z
  .array(NotifySchema)
  .min(1, 'At least one notification required')
  .max(1000, 'Max 1000 per batch');

// ─── Middleware factory ───────────────────────────────────────────────────────

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
