/**
 * routes/campusRoutes.js - Routes for College Placement Cell (TPO) Partnerships & Campus OS
 *
 * CareerPath AI · Enterprise Backend Service
 */

const express = require('express');
const router = express.Router();
const {
  submitDemoRequest,
  voiceAiWebhook,
  getCampusLeads,
  getCampusStats,
  getTpoCohortAnalytics,
} = require('../controllers/campusController');

// ── Public Routes ─────────────────────────────────────────────
router.post('/demo-request', submitDemoRequest);
router.post('/voice-ai-webhook', voiceAiWebhook);
router.get('/stats', getCampusStats);
router.get('/tpo-analytics', getTpoCohortAnalytics);

// ── Pipeline Review Routes ────────────────────────────────────
router.get('/leads', getCampusLeads);

module.exports = router;
