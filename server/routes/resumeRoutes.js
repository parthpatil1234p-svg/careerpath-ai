/**
 * routes/resumeRoutes.js — AI Resume ATS Evaluation Endpoints
 *
 * Mounted at: /api/resume
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  analyzeResume,
  getResumeAnalysis,
  getBuiltResume,
  saveBuiltResume,
  improveResumeText,
  matchResumeToJob,
} = require('../controllers/resumeController');

// ATS Analysis Endpoints
router.post('/analyze', protect, analyzeResume);
router.get('/analysis', protect, getResumeAnalysis);

// Resume Builder Draft & AI Endpoints
router.get('/builder', protect, getBuiltResume);
router.post('/builder', protect, saveBuiltResume);
router.post('/improve-text', protect, improveResumeText);
router.post('/match-job', protect, matchResumeToJob);

module.exports = router;
