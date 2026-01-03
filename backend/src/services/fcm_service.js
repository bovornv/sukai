/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles sending push notifications via FCM
 * 
 * Setup Required:
 * 1. Firebase project with FCM enabled
 * 2. Server key from Firebase Console
 * 3. Install: npm install firebase-admin
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let fcmInitialized = false;

function initializeFCM() {
  if (fcmInitialized) {
    return;
  }

  try {
    // Get Firebase credentials from environment variables
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.warn('⚠️  FCM not configured: FIREBASE_SERVICE_ACCOUNT not set');
      return;
    }

    // Parse service account JSON
    const serviceAccountJson = JSON.parse(serviceAccount);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson),
    });

    fcmInitialized = true;
    console.log('✅ FCM initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize FCM:', error.message);
    console.warn('⚠️  Push notifications will not be sent');
  }
}

/**
 * Send push notification to a device
 * 
 * @param {string} deviceToken - FCM device token
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {Promise<boolean>} Success status
 */
export async function sendPushNotification(deviceToken, notification, data = {}) {
  if (!fcmInitialized) {
    initializeFCM();
  }

  if (!fcmInitialized) {
    console.warn('⚠️  FCM not initialized, skipping push notification');
    return false;
  }

  try {
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        // Convert all data values to strings (FCM requirement)
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'sukai_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Push notification sent: ${response}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.warn(`⚠️  Invalid device token: ${deviceToken}`);
      // Could mark token as invalid in database here
    }
    
    return false;
  }
}

/**
 * Send push notification to multiple devices
 * 
 * @param {Array<string>} deviceTokens - Array of FCM device tokens
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} Results with success/failure counts
 */
export async function sendPushNotificationToMultiple(deviceTokens, notification, data = {}) {
  if (!fcmInitialized) {
    initializeFCM();
  }

  if (!fcmInitialized || !deviceTokens || deviceTokens.length === 0) {
    return { success: 0, failure: 0 };
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'sukai_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: deviceTokens,
      ...message,
    });

    console.log(`✅ Push notifications sent: ${response.successCount} success, ${response.failureCount} failure`);
    
    return {
      success: response.successCount,
      failure: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error('❌ Error sending multicast push notifications:', error);
    return { success: 0, failure: deviceTokens.length };
  }
}

/**
 * Format notification message for follow-up notification
 * 
 * @param {object} notification - Notification data from database
 * @param {string} userName - User's name
 * @param {string} language - Language code ('th' or 'en')
 * @returns {object} Formatted notification payload
 */
export function formatFollowupNotification(notification, userName, language = 'th') {
  const name = userName || (language === 'th' ? 'คุณ' : 'User');
  const symptom = notification.symptom || (language === 'th' ? 'อาการของคุณ' : 'your symptoms');
  
  let title, body;
  
  switch (notification.notification_type) {
    case '24h':
      if (language === 'th') {
        title = `สวัสดีค่ะ ${name} 😊`;
        body = `เมื่อวานคุณตรวจอาการ ${symptom} กับ Suk AI ไป ตอนนี้อาการเป็นอย่างไรบ้างคะ? แค่ตอบสั้น ๆ ก็ได้ค่ะ`;
      } else {
        title = `Hi ${name} 😊`;
        body = `You checked your ${symptom} with Suk AI yesterday. How are you feeling now? Just a quick update is fine.`;
      }
      break;
      
    case '48h':
      if (language === 'th') {
        title = `สวัสดีค่ะ ${name} 💚`;
        body = `ผ่านไป 2 วันแล้วนะคะ หลังจากที่คุณตรวจอาการ ${symptom} กับ Suk AI ไป ตอนนี้อาการเป็นอย่างไรบ้างคะ? ถ้ายังไม่ดีขึ้น หรือมีคำถามเพิ่มเติม Suk AI พร้อมช่วยเสมอนะคะ`;
      } else {
        title = `Hi ${name} 💚`;
        body = `It's been 2 days since you checked your ${symptom} with Suk AI. How are you feeling now? If you're not feeling better or have questions, Suk AI is here to help.`;
      }
      break;
      
    case 'safety':
      if (language === 'th') {
        title = `สวัสดีค่ะ ${name} 🩺`;
        body = `เมื่อวานคุณตรวจอาการ ${symptom} กับ Suk AI ไป และมีสัญญาณบางอย่างที่ควรติดตาม ตอนนี้อาการเป็นอย่างไรบ้างคะ? ถ้ายังไม่ดีขึ้น หรือมีอาการใหม่ ควรพบแพทย์นะคะ`;
      } else {
        title = `Hi ${name} 🩺`;
        body = `Yesterday you checked your ${symptom} with Suk AI, and there were some signs worth monitoring. How are you feeling now? If you're not feeling better or have new symptoms, please see a doctor.`;
      }
      break;
      
    default:
      if (language === 'th') {
        title = `สวัสดีค่ะ ${name}`;
        body = `อาการ ${symptom} เป็นอย่างไรบ้างคะ?`;
      } else {
        title = `Hi ${name}`;
        body = `How is your ${symptom} feeling?`;
      }
  }
  
  return {
    title,
    body,
    data: {
      notification_id: notification.id,
      session_id: notification.session_id,
      notification_type: notification.notification_type,
      type: 'followup',
    },
  };
}

// Initialize on module load
initializeFCM();

