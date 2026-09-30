/**
 * routes/readinessRoutes.js — Job Readiness Index & Certificate Routes
 *
 * Mounted at: /api/readiness
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getReadinessStatus, getCertificate } = require('../controllers/readinessController');

router.get('/status', protect, getReadinessStatus);
router.get('/certificate', protect, getCertificate);

module.exports = router;
