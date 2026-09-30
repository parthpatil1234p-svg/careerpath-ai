/**
 * routes/interviewRoutes.js — AI Mock Technical Interview Endpoints
 *
 * Mounted at: /api/interview
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  startInterview,
  evaluateAnswer,
  finalizeInterview,
  getInterviewStatus
} = require('../controllers/interviewController');

router.post('/start', protect, startInterview);
router.post('/evaluate', protect, evaluateAnswer);
router.post('/finalize', protect, finalizeInterview);
router.get('/status', protect, getInterviewStatus);

module.exports = router;
