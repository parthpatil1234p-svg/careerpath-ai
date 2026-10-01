/**
 * routes/readinessRoutes.js — Job Readiness Index & Certificate Routes
 *
 * Mounted at: /api/readiness
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const { getReadinessStatus, getCertificate, getJobReadyCheck } = require('../controllers/readinessController');

router.use(protect, requireStudent);

router.get('/status', getReadinessStatus);
router.get('/certificate', getCertificate);
router.get('/job-ready-check', getJobReadyCheck);

module.exports = router;
