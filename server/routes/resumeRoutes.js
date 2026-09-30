/**
 * routes/resumeRoutes.js — AI Resume ATS Evaluation Endpoints
 *
 * Mounted at: /api/resume
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { analyzeResume, getResumeAnalysis } = require('../controllers/resumeController');

router.post('/analyze', protect, analyzeResume);
router.get('/analysis', protect, getResumeAnalysis);

module.exports = router;
