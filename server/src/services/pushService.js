/**
 * Web Push Notification service using the `web-push` package.
 * Requires VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.
 * Generate them once with: npx web-push generate-vapid-keys
 */
let webpush = null;

try {
  webpush = require('web-push');
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${process.env.EMAIL_FROM || 'admin@zeal.com'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } else {
    webpush = null;
  }
} catch {
  // web-push not installed â€” push notifications disabled
}

const sendPush = async (subscription, payload) => {
  if (!webpush || !subscription) return;
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    // 410 Gone = subscription expired, caller should delete it
    if (err.statusCode === 410) return 'expired';
    // Non-fatal â€” log and continue
    const logger = require('../config/logger');
    logger.warn(`Push send failed: ${err.message}`);
  }
};

module.exports = { sendPush, isEnabled: !!webpush };
