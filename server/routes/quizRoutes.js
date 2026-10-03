/**
 * routes/quizRoutes.js — API Routes for Adaptive Skill Reality-Check Quiz
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, requireStudent } = require('../middleware/authMiddleware');

// All quiz endpoints require JWT authentication and student access
router.use(protect, requireStudent);

router.get('/status', quizController.getQuizStatus);
router.get('/providers', quizController.getQuizProviders);
router.get('/active-session', quizController.getActiveSession);
router.post('/start', quizController.startQuiz);
router.post('/answer', quizController.submitAnswer);
router.post('/violation', quizController.recordViolation);
router.post('/disqualify', quizController.disqualifyUser);

module.exports = router;
