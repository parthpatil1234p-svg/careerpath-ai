/**
 * routes/interviewRoutes.js — AI Mock Technical Interview Endpoints
 *
 * Mounted at: /api/interview
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const {
  startInterview,
  evaluateAnswer,
  finalizeInterview,
  getInterviewStatus
} = require('../controllers/interviewController');

router.use(protect, requireStudent);

router.post('/start', startInterview);
router.post('/evaluate', evaluateAnswer);
router.post('/finalize', finalizeInterview);
router.get('/status', getInterviewStatus);

module.exports = router;
