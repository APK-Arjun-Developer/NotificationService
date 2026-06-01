/**
 * WhatsApp Provider — Meta WhatsApp Business API (Cloud API)
 *
 * TO ACTIVATE:
 *   1. Create app at developers.facebook.com
 *   2. Add WhatsApp product → get a test phone number
 *   3. Create message templates in Meta Business Manager (required for first message)
 *   4. Add to .env:
 *        WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
 *        WHATSAPP_PHONE_NUMBER_ID=1234567890
 *   5. Wire into types/queue/routes following the same pattern
 *
 * COST: 1000 free conversations/month, then ~$0.005–$0.08 per conversation (varies by country)
 */

// import { env } from '../config/env';
// import { WhatsAppNotification, NotificationResult } from '../types/notification.types';
// import { logger } from '../utils/logger';
//
// const BASE_URL = 'https://graph.facebook.com/v19.0';
//
// export async function sendWhatsApp(payload: WhatsAppNotification): Promise<NotificationResult> {
//   try {
//     const response = await fetch(
//       `${BASE_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
//         },
//         body: JSON.stringify({
//           messaging_product: 'whatsapp',
//           to: payload.to,
//           type: 'template',
//           template: {
//             name: payload.templateName,
//             language: { code: 'en_US' },
//             components: payload.templateParams?.map((p, i) => ({
//               type: 'body',
//               parameters: [{ type: 'text', text: p }],
//             })) ?? [],
//           },
//         }),
//       }
//     );
//
//     if (!response.ok) {
//       const error = await response.text();
//       throw new Error(error);
//     }
//
//     const data = await response.json() as { messages: [{ id: string }] };
//     const messageId = data.messages[0].id;
//     logger.info('WhatsApp sent', { messageId, to: payload.to });
//     return { success: true, messageId, channel: 'whatsapp', timestamp: new Date() };
//   } catch (err) {
//     const msg = err instanceof Error ? err.message : 'Unknown error';
//     logger.error('WhatsApp failed', { error: msg, to: payload.to });
//     return { success: false, error: msg, channel: 'whatsapp', timestamp: new Date() };
//   }
// }

export {};
