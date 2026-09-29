/**
 * routes/quizRoutes.js — API Routes for Adaptive Skill Reality-Check Quiz
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

// All quiz endpoints require JWT authentication
router.use(protect);

router.get('/status', quizController.getQuizStatus);
router.get('/providers', quizController.getQuizProviders);
router.post('/start', quizController.startQuiz);
router.post('/answer', quizController.submitAnswer);

module.exports = router;
