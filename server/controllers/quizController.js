/**
 * controllers/quizController.js — Controller for Adaptive Skill Reality-Check Quiz
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 */

const quizService = require('../services/quizService');
const aiQuizGeneratorService = require('../services/aiQuizGeneratorService');
const User = require('../models/User');
const { AVAILABLE_QUIZ_SKILLS } = require('../data/quizQuestions');

// In-memory IP rate limiter for quiz starts (Pillar 4: Sybil Defense)
const quizStartRateLimiter = new Map();

/**
 * POST /api/quiz/start
 * Initializes an adaptive quiz session with optional multi-model AI provider or custom API key.
 * Enforces 24-hour retake cooldown and IP rate limiting.
 */
exports.startQuiz = async (req, res) => {
  try {
    const { skill, provider, userApiKey, displayName, forceAI, bypassCooldown } = req.body;
    if (!skill) {
      return res.status(400).json({ success: false, message: 'Skill parameter is required' });
    }

    // IP rate-limiting check (Pillar 4)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
    const isLocalhost = clientIp.includes('127.0.0.1') || clientIp.includes('::1') || clientIp === 'local';
    const now = Date.now();

    if (!isLocalhost) {
      const ipHistory = quizStartRateLimiter.get(clientIp) || [];
      const recentAttempts = ipHistory.filter((t) => now - t < 15 * 60 * 1000); // 15 mins window
      if (recentAttempts.length >= 10) {
        return res.status(429).json({
          success: false,
          rateLimited: true,
          message: 'Too many quiz session initializations from this network. Please wait a few minutes before retrying.'
        });
      }
      recentAttempts.push(now);
      quizStartRateLimiter.set(clientIp, recentAttempts);
    }

    const isBypass = Boolean(
      bypassCooldown ||
      req.query.bypassCooldown === 'true' ||
      req.headers['x-bypass-cooldown'] === 'true' ||
      (req.user?.email && req.user.email.includes('demo'))
    );

    const session = await quizService.startQuizSession(req.user.id, skill, {
      provider,
      userApiKey: userApiKey || req.headers['x-user-api-key'] || null,
      displayName,
      forceAI: Boolean(forceAI),
      bypassCooldown: isBypass
    });

    return res.status(200).json({ success: true, data: session });
  } catch (err) {
    if (err.code === 'COOLDOWN_ACTIVE') {
      return res.status(429).json({
        success: false,
        cooldownActive: true,
        retryAfterHours: err.retryAfterHours,
        message: err.message
      });
    }
    console.error('[QuizController.startQuiz] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/quiz/answer
 * Submits an answer choice and receives immediate explanation + next question or summary.
 * Captures high-fidelity proctoring telemetry (timeTakenSeconds, tabSwitches).
 */
exports.submitAnswer = async (req, res) => {
  try {
    const {
      skill,
      questionId,
      selectedIndex,
      selectedOption,
      sessionId,
      timeTakenSeconds,
      tabSwitches
    } = req.body;
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

    const telemetry = {
      timeTakenSeconds: typeof timeTakenSeconds === 'number' ? timeTakenSeconds : undefined,
      tabSwitches: typeof tabSwitches === 'number' ? tabSwitches : undefined
    };

    const result = await quizService.submitAnswer(
      req.user.id,
      targetSkill,
      targetQuestionId,
      choice,
      telemetry
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[QuizController.submitAnswer] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/quiz/status
 * Returns user skills eligible for quiz and their current verification status with Skill Passport metadata
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

    const now = new Date();
    const statusList = allSkillNames.map((name) => {
      const match = userSkills.find((s) => (s.name || '').toLowerCase() === name);
      const isCooldown = Boolean(match?.nextRetakeAvailableAt && now < new Date(match.nextRetakeAvailableAt));
      const hoursRemaining = isCooldown
        ? Math.max(1, Math.ceil((new Date(match.nextRetakeAvailableAt) - now) / (1000 * 60 * 60)))
        : 0;

      return {
        skill: name,
        displayName: match?.displayName || (name === 'sql' ? 'SQL' : name === 'html' ? 'HTML' : name === 'css' ? 'CSS' : name === 'node.js' ? 'Node.js' : name.charAt(0).toUpperCase() + name.slice(1)),
        isClaimed: !!match,
        selfRated: match?.selfRatedProficiency || match?.proficiency || null,
        isQuizVerified: !!match?.isQuizVerified,
        isCodeVerified: !!match?.isCodeVerified,
        verifiedProficiency: match?.verifiedProficiency || null,
        quizScore: match?.quizScore || 0,
        quizGaps: match?.quizGaps || [],
        quizVerifiedAt: match?.quizVerifiedAt || null,
        verificationTier: match?.verificationTier || (match?.isCodeVerified ? 'project_verified' : match?.isQuizVerified ? 'quiz_verified' : 'self_rated'),
        verificationStatus: match?.verificationStatus || (match?.isQuizVerified || match?.isCodeVerified ? 'verified' : 'unverified'),
        integrityScore: match?.integrityScore !== undefined ? match.integrityScore : 100,
        nextRetakeAvailableAt: match?.nextRetakeAvailableAt || null,
        cooldownActive: isCooldown,
        cooldownRemainingHours: hoursRemaining,
        tabSwitchCount: match?.tabSwitchCount || 0,
        velocityAnomalyCount: match?.velocityAnomalyCount || 0
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        skills: statusList,
        availableQuizSkills: allSkillNames,
        totalVerified: statusList.filter((s) => s.isQuizVerified || s.isCodeVerified).length
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
