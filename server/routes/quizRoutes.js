/**
 * routes/quizRoutes.js — API Routes for Adaptive Skill Reality-Check Quiz
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { verifyToken } = require('../middleware/auth');

// All quiz endpoints require JWT authentication
router.use(verifyToken);

router.get('/status', quizController.getQuizStatus);
router.post('/start', quizController.startQuiz);
router.post('/answer', quizController.submitAnswer);

module.exports = router;
