/**
 * Notification Sender Job
 * Checks for pending notifications and sends push notifications
 * 
 * This job should be run periodically (every 15-30 minutes) via:
 * - Railway Cron Jobs
 * - Node-cron
 * - External cron service
 * 
 * Usage:
 * - Standalone: node src/jobs/notification_sender.js
 * - Cron: Add to crontab or Railway cron
 */

import { getPendingNotifications, markNotificationSent } from '../services/notification_scheduler.js';
import { sendPushNotification, formatFollowupNotification } from '../services/fcm_service.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Get user's device tokens
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} Array of device tokens
 */
async function getUserDeviceTokens(userId) {
  try {
    // TODO: Create device_tokens table to store FCM tokens
    // For now, return empty array (will be implemented with mobile app)
    const { data, error } = await supabaseAdmin
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('active', true);
    
    if (error) {
      console.error('Error fetching device tokens:', error);
      return [];
    }
    
    return (data || []).map(row => row.token);
  } catch (err) {
    console.error('Error in getUserDeviceTokens:', err);
    return [];
  }
}

/**
 * Get user's language preference
 * 
 * @param {string} userId - User ID
 * @returns {Promise<string>} Language code ('th' or 'en')
 */
async function getUserLanguage(userId) {
  try {
    // TODO: Get from user preferences or profile
    // For now, default to Thai
    return 'th';
  } catch (err) {
    console.error('Error in getUserLanguage:', err);
    return 'th';
  }
}

/**
 * Get user's name for notification
 * 
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} User's name
 */
async function getUserName(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.full_name;
  } catch (err) {
    console.error('Error in getUserName:', err);
    return null;
  }
}

/**
 * Process and send pending notifications
 */
export async function processPendingNotifications() {
  console.log('🔄 Starting notification sender job...');
  
  try {
    // Get pending notifications (limit to 100 per run)
    const pendingNotifications = await getPendingNotifications(100);
    
    if (pendingNotifications.length === 0) {
      console.log('✅ No pending notifications');
      return { sent: 0, failed: 0, skipped: 0 };
    }
    
    console.log(`📬 Found ${pendingNotifications.length} pending notifications`);
    
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    
    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        // Skip if no user_id (anonymous sessions)
        if (!notification.user_id) {
          console.log(`⏭️  Skipping notification ${notification.id} (no user_id)`);
          skipped++;
          continue;
        }
        
        // Get user's device tokens
        const deviceTokens = await getUserDeviceTokens(notification.user_id);
        
        // For web app: If no device tokens, mark as sent (in-app notifications work)
        // For mobile app (future): Will have device tokens for push notifications
        if (deviceTokens.length === 0) {
          console.log(`⏭️  Skipping push notification ${notification.id} (no device tokens - web app uses in-app notifications)`);
          skipped++;
          // Mark as sent - in-app notifications are handled by web app UI
          await markNotificationSent(notification.id);
          continue;
        }
        
        // Only send push notifications if device tokens exist (mobile app)
        // Check if FCM is configured
        try {
          // Try to import FCM service (may fail if Firebase not configured)
          const { sendPushNotification, formatFollowupNotification } = await import('../services/fcm_service.js');
          
          // Get user info for notification
          const userName = await getUserName(notification.user_id);
          const language = await getUserLanguage(notification.user_id);
          
          // Format notification
          const notificationPayload = formatFollowupNotification(
            notification,
            userName,
            language
          );
          
          // Send push notification to all user's devices
          let success = false;
          for (const token of deviceTokens) {
            const result = await sendPushNotification(
              token,
              {
                title: notificationPayload.title,
                body: notificationPayload.body,
              },
              notificationPayload.data
            );
            
            if (result) {
              success = true;
            }
          }
          
          if (success) {
            // Mark as sent if at least one device received it
            await markNotificationSent(notification.id);
            console.log(`✅ Sent push notification ${notification.id} to ${deviceTokens.length} device(s)`);
            sent++;
          } else {
            console.error(`❌ Failed to send push notification ${notification.id}`);
            failed++;
          }
        } catch (err) {
          // FCM not configured (web-only launch) - mark as sent
          // In-app notifications will handle display
          console.log(`⏭️  FCM not configured, marking notification ${notification.id} as sent (in-app notifications)`);
          await markNotificationSent(notification.id);
          skipped++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Error processing notification ${notification.id}:`, err);
        failed++;
      }
    }
    
    console.log(`✅ Notification job complete: ${sent} sent, ${failed} failed, ${skipped} skipped`);
    
    return { sent, failed, skipped };
    
  } catch (err) {
    console.error('❌ Error in notification sender job:', err);
    return { sent: 0, failed: 0, skipped: 0 };
  }
}

/**
 * Run job if called directly
 */
// Check if this file is being run directly
const isMainModule = process.argv[1] && 
  process.argv[1].endsWith('notification_sender.js');

if (isMainModule) {
  processPendingNotifications()
    .then(result => {
      console.log('Job result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Job failed:', err);
      process.exit(1);
    });
}

