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
      console.warn('[Chat] External AI engines offline or keys invalid. Using instant high-speed Mentor Fallback.');
      const name = userContext?.name || 'Student';
      const skillsStr = userContext?.skills?.length ? ` your skills in **${userContext.skills.slice(0, 3).join(', ')}**` : ' your technical foundation';
      const targetStr = userContext?.targetCareer ? ` for **${userContext.targetCareer}**` : '';

      reply = `Hello ${name}! 👋 

I am your CareerPath AI Mentor. Here is my strategic advice${targetStr} based on${skillsStr}:

1. **Focus on Hands-on Projects**: Build end-to-end full-stack or data applications and deploy them publicly (e.g. Vercel, Render, or GitHub Pages).
2. **Follow Your Milestone Roadmap**: Check off your weekly tasks in the **Roadmap** section to steadily eliminate skill gaps.
3. **Master Modern Tech**: Employers look for practical experience with tools like TypeScript, Docker, and RESTful APIs.

Keep building, and feel free to ask any questions about specific tools or career paths!`;
      engineUsed = 'CareerPath AI Knowledge Engine';
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
