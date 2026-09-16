/**
 * controllers/chatController.js — Dual-Engine AI Career Mentor Controller
 * Primary: Groq Cloud (Ultra-Fast <100ms Inference)
 * Secondary Fallback: Google Gemini 3.6 Flash
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { getGroqMentorReply } = require('../services/groqService');
const { getChatMentorReply } = require('../services/geminiService');

/**
 * POST /api/chat/message
 * Handles real-time student questions with dual-engine AI (Groq + Gemini)
 */
const handleChatMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    // VALIDATION: Strict limit on message length and history size
    if (!message || typeof message !== 'string' || message.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 5000 chars) or missing.',
      });
    }

    if (Array.isArray(history) && history.length > 10) {
       return res.status(400).json({
        success: false,
        message: 'History too long (max 10 turns).',
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required.',
      });
    }

    // Optional user contextual enrichment if JWT token is supplied
    let userContext = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id).select('name education skills interests');
          if (user) {
            const activeRoadmap = await Roadmap.findOne({ user: user._id, status: 'active' });
            userContext = {
              name: user.name,
              degree: user.education?.course || '',
              skills: Array.isArray(user.skills) ? user.skills.map(s => s.name || s) : [],
              targetCareer: activeRoadmap?.careerSnapshot?.title || '',
            };
          }
        }
      } catch (err) {
        // Token verification failed or expired; continue without personalized context
        userContext = null;
      }
    }

    let reply = null;
    let engineUsed = 'Groq Cloud';
    let lastErrorReason = null;

    // 1. Try Groq first for ultra-fast response (<100ms)
    if (process.env.GROQ_API_KEY) {
      try {
        reply = await getGroqMentorReply(message.trim(), history || [], userContext);
      } catch (groqErr) {
        lastErrorReason = groqErr.message;
        console.warn('Groq failed, falling back to Google Gemini:', groqErr.message);
      }
    }

    // 2. Fallback to Gemini if Groq failed or not configured
    if (!reply && process.env.GEMINI_API_KEY) {
      try {
        reply = await getChatMentorReply(message.trim(), history || [], userContext);
        engineUsed = 'Google Gemini';
      } catch (geminiErr) {
        lastErrorReason = geminiErr.message;
        console.error('Gemini fallback also failed:', geminiErr.message);
      }
    }

    if (!reply) {
      console.error('[Chat] Both AI engines failed or keys are missing. Last error reason:', lastErrorReason);

      return res.status(503).json({
        success: false,
        message: 'AI Career Mentor is currently unavailable. Please try again soon.',
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      engine: engineUsed,
    });
  } catch (error) {
    console.error('Chat Error in AI controller:', error);
    return res.status(500).json({
      success: false,
      message: 'AI Mentor could not process your message right now.',
    });
  }
};

module.exports = {
  handleChatMessage,
};
