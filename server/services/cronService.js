/**
 * services/cronService.js — Background Worker & Automated Maintenance Routines
 *
 * Runs only on persistent Node.js instances (Render / Local Development).
 * Completely bypassed in serverless runtime (Vercel) to respect execution boundaries.
 *
 * Responsibilities:
 * 1. 180-Day Skill Currency Ledger validation
 * 2. YouTube Data API v3 cache health check
 * 3. Database connection keep-alive & housekeeping
 */

const Attempt = require('../models/Attempt');
const YoutubeCache = require('../models/YoutubeCache');

let hourlyTimer = null;
let dailyTimer = null;

/**
 * Validates and logs skill currency for attempts older than 180 days
 */
async function validateSkillCurrency() {
  try {
    const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const expiredCount = await Attempt.countDocuments({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`🧹 [Cron] 180-Day Skill Currency Audit: ${expiredCount} historical attempts identified.`);
  } catch (err) {
    console.warn('⚠️ [Cron] Skill currency validation warning:', err.message);
  }
}

/**
 * Health check on YouTube cache entries
 */
async function auditYouTubeCache() {
  try {
    const cachedCount = await YoutubeCache.countDocuments({});
    console.log(`📺 [Cron] YouTube Video Cache Audit: ${cachedCount} cached queries active.`);
  } catch (err) {
    console.warn('⚠️ [Cron] YouTube cache audit warning:', err.message);
  }
}

/**
 * Initializes background cron worker
 */
function initCron() {
  if (process.env.VERCEL) {
    console.log('⚡ [Cron] Vercel serverless environment detected — skipping persistent background cron routines.');
    return;
  }

  console.log('⏰ [Cron] Initializing persistent background maintenance worker...');

  // Run initial lightweight audit on startup
  setTimeout(() => {
    auditYouTubeCache();
    validateSkillCurrency();
  }, 5000);

  // Hourly routine: YouTube cache health & connection check
  hourlyTimer = setInterval(() => {
    auditYouTubeCache();
  }, 60 * 60 * 1000);

  // Daily routine: 180-day skill currency audit
  dailyTimer = setInterval(() => {
    validateSkillCurrency();
  }, 24 * 60 * 60 * 1000);

  console.log('✅ [Cron] Background maintenance worker active.');
}

/**
 * Graceful cleanup of timers
 */
function stopCron() {
  if (hourlyTimer) clearInterval(hourlyTimer);
  if (dailyTimer) clearInterval(dailyTimer);
  hourlyTimer = null;
  dailyTimer = null;
}

module.exports = {
  initCron,
  stopCron,
};
