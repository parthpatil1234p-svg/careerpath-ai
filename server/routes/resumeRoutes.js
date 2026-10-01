/**
 * routes/resumeRoutes.js — AI Resume ATS Evaluation Endpoints
 *
 * Mounted at: /api/resume
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const {
  analyzeResume,
  getResumeAnalysis,
  getBuiltResume,
  saveBuiltResume,
  improveResumeText,
  matchResumeToJob,
} = require('../controllers/resumeController');

router.use(protect, requireStudent);

// ATS Analysis Endpoints
router.post('/analyze', analyzeResume);
router.get('/analysis', getResumeAnalysis);

// Resume Builder Draft & AI Endpoints
router.get('/builder', getBuiltResume);
router.post('/builder', saveBuiltResume);
router.post('/improve-text', improveResumeText);
router.post('/match-job', matchResumeToJob);

module.exports = router;
