/**
 * Push Notification Provider — Firebase Cloud Messaging (FCM)
 *
 * TO ACTIVATE:
 *   1. npm install firebase-admin
 *   2. Create project at console.firebase.google.com
 *   3. Project Settings → Service accounts → Generate new private key → download JSON
 *   4. Add to .env:
 *        FIREBASE_PROJECT_ID=your-project-id
 *        FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
 *        FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
 *   5. Follow same pattern as sms.provider.stub.ts to wire into types/queue/routes
 *
 * COST: Free (Firebase free tier is very generous for push)
 */

// import admin from 'firebase-admin';
// import { env } from '../config/env';
// import { PushNotification, NotificationResult } from '../types/notification.types';
// import { logger } from '../utils/logger';
//
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: env.FIREBASE_PROJECT_ID,
//       clientEmail: env.FIREBASE_CLIENT_EMAIL,
//       privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//     }),
//   });
// }
//
// export async function sendPush(payload: PushNotification): Promise<NotificationResult> {
//   try {
//     const messageId = await admin.messaging().send({
//       token: payload.deviceToken,
//       notification: { title: payload.title, body: payload.body },
//       data: payload.data,
//     });
//     logger.info('Push sent', { messageId });
//     return { success: true, messageId, channel: 'push', timestamp: new Date() };
//   } catch (err) {
//     const msg = err instanceof Error ? err.message : 'Unknown error';
//     logger.error('Push failed', { error: msg });
//     return { success: false, error: msg, channel: 'push', timestamp: new Date() };
//   }
// }

export {};
