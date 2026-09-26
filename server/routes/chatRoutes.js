/**
 * routes/chatRoutes.js — AI Career Mentor Chat Endpoints
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const express = require('express');
const router = express.Router();
const { handleChatMessage } = require('../controllers/chatController');

// POST /api/chat/message and POST /api/chat (public with optional JWT context)
router.post('/message', handleChatMessage);
router.post('/', handleChatMessage);

module.exports = router;
