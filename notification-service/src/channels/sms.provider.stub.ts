/**
 * SMS Provider — Twilio
 *
 * TO ACTIVATE:
 *   1. npm install twilio
 *   2. npm install -D @types/twilio  (if needed)
 *   3. Add to .env:
 *        TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *        TWILIO_AUTH_TOKEN=your_auth_token
 *        TWILIO_FROM_NUMBER=+1xxxxxxxxxx
 *   4. Add 'sms' to NotificationChannel type in notification.types.ts
 *   5. Uncomment SmsNotification interface and add to NotificationPayload union
 *   6. Uncomment SmsSchema in validate.middleware.ts
 *   7. Uncomment sms case in notification.queue.ts worker switch
 *   8. Add TWILIO_ACCOUNT_SID etc. to env.ts EnvSchema
 *
 * COST: ~$0.008 per SMS (India: check Twilio pricing page)
 * FREE ALTERNATIVE: Vonage / MSG91 (India-focused, cheaper rates)
 */

// import twilio from 'twilio';
// import { env } from '../config/env';
// import { SmsNotification, NotificationResult } from '../types/notification.types';
// import { logger } from '../utils/logger';
//
// const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
//
// export async function sendSms(payload: SmsNotification): Promise<NotificationResult> {
//   try {
//     const message = await client.messages.create({
//       body: payload.message,
//       from: env.TWILIO_FROM_NUMBER,
//       to: payload.to,
//     });
//     logger.info('SMS sent', { sid: message.sid, to: payload.to });
//     return { success: true, messageId: message.sid, channel: 'sms', timestamp: new Date() };
//   } catch (err) {
//     const msg = err instanceof Error ? err.message : 'Unknown error';
//     logger.error('SMS failed', { error: msg, to: payload.to });
//     return { success: false, error: msg, channel: 'sms', timestamp: new Date() };
//   }
// }

export {};
