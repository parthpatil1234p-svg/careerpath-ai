/**
 * controllers/quizController.js — Controller for Adaptive Skill Reality-Check Quiz
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 */

const quizService = require('../services/quizService');
const aiQuizGeneratorService = require('../services/aiQuizGeneratorService');
const User = require('../models/User');
const { AVAILABLE_QUIZ_SKILLS } = require('../data/quizQuestions');

/**
 * POST /api/quiz/start
 * Initializes an adaptive quiz session with optional multi-model AI provider or custom API key
 */
exports.startQuiz = async (req, res) => {
  try {
    const { skill, provider, userApiKey, displayName, forceAI } = req.body;
    if (!skill) {
      return res.status(400).json({ success: false, message: 'Skill parameter is required' });
    }

    const session = await quizService.startQuizSession(req.user.id, skill, {
      provider,
      userApiKey: userApiKey || req.headers['x-user-api-key'] || null,
      displayName,
      forceAI: Boolean(forceAI)
    });
    return res.status(200).json({ success: true, data: session });
  } catch (err) {
    console.error('[QuizController.startQuiz] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/quiz/answer
 * Submits an answer choice and receives immediate explanation + next question or summary
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { skill, questionId, selectedIndex, selectedOption, sessionId } = req.body;
    const choice = selectedIndex !== undefined ? selectedIndex : selectedOption;

    let targetSkill = skill;
    if (!targetSkill && sessionId && sessionId.includes('_')) {
      targetSkill = sessionId.split('_').slice(1).join('_');
    }

    const session = quizService.getActiveSessionForUser(req.user.id, targetSkill);
    if (!targetSkill && session) {
      targetSkill = session.skill;
    }

    let targetQuestionId = questionId || session?.currentQuestionId;

    if (!targetSkill || !targetQuestionId || choice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'skill (or sessionId), questionId, and selectedIndex (or selectedOption) are required'
      });
    }

    const result = await quizService.submitAnswer(req.user.id, targetSkill, targetQuestionId, choice);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[QuizController.submitAnswer] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/quiz/status
 * Returns user skills eligible for quiz and their current verification status
 */
exports.getQuizStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const baseSkills = AVAILABLE_QUIZ_SKILLS || ['javascript', 'python', 'sql', 'react', 'node.js', 'html', 'css'];
    const userSkills = user.skills || [];

    // Combine banked skills with any custom skills claimed by the user
    const claimedSkillNames = userSkills.map((s) => (s.name || '').toLowerCase()).filter(Boolean);
    const allSkillNames = Array.from(new Set([...baseSkills, ...claimedSkillNames]));

    const statusList = allSkillNames.map((name) => {
      const match = userSkills.find((s) => (s.name || '').toLowerCase() === name);
      return {
        skill: name,
        displayName: match?.displayName || (name === 'sql' ? 'SQL' : name === 'html' ? 'HTML' : name === 'css' ? 'CSS' : name === 'node.js' ? 'Node.js' : name.charAt(0).toUpperCase() + name.slice(1)),
        isClaimed: !!match,
        selfRated: match?.selfRatedProficiency || match?.proficiency || null,
        isQuizVerified: !!match?.isQuizVerified,
        verifiedProficiency: match?.verifiedProficiency || null,
        quizScore: match?.quizScore || 0,
        quizGaps: match?.quizGaps || [],
        quizVerifiedAt: match?.quizVerifiedAt || null
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        skills: statusList,
        availableQuizSkills: allSkillNames,
        totalVerified: statusList.filter((s) => s.isQuizVerified).length
      }
    });
  } catch (err) {
    console.error('[QuizController.getQuizStatus] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving quiz status' });
  }
};

/**
 * GET /api/quiz/providers
 * Returns supported AI quiz generation engines & availability
 */
exports.getQuizProviders = async (req, res) => {
  try {
    const providers = aiQuizGeneratorService.getAvailableProviders();
    return res.status(200).json({ success: true, data: providers });
  } catch (err) {
    console.error('[QuizController.getQuizProviders] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving quiz providers' });
  }
};
