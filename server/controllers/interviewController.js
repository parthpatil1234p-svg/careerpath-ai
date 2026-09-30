/**
 * controllers/interviewController.js — AI Mock Interview Controller
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { generateInterviewQuestions, evaluateInterviewAnswer } = require('../services/mockInterviewService');

/**
 * POST /api/interview/start
 * Generates 3 interview questions for candidate.
 */
exports.startInterview = async (req, res, next) => {
  try {
    const { targetRole } = req.body;
    const user = await User.findById(req.user._id);

    let role = targetRole;
    if (!role) {
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      role = activeRoadmap?.career?.title || (user?.interests && user.interests[0]) || 'Full-Stack Developer';
    }

    const questions = await generateInterviewQuestions(role, user?.skills || []);

    return res.status(200).json({
      success: true,
      message: `Interview session generated for ${role}.`,
      data: {
        targetRole: role,
        totalQuestions: questions.length,
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/evaluate
 * Evaluates a single answer.
 */
exports.evaluateAnswer = async (req, res, next) => {
  try {
    const { question, answer, questionType, targetRole } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required.'
      });
    }

    const evaluation = await evaluateInterviewAnswer(question, answer, questionType, targetRole);

    return res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/finalize
 * Finalizes the interview session and updates user readiness profile.
 */
exports.finalizeInterview = async (req, res, next) => {
  try {
    const { targetRole, history, scores } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const overallScore = Math.round(Number(scores?.overallScore || 75));
    const technicalScore = Math.round(Number(scores?.technicalScore || overallScore));
    const communicationScore = Math.round(Number(scores?.communicationScore || overallScore));
    const practicalScore = Math.round(Number(scores?.practicalScore || overallScore));

    user.mockInterview = {
      overallScore,
      technicalScore,
      communicationScore,
      practicalScore,
      targetRole: targetRole || 'Software Engineer',
      completedAt: new Date(),
      history: Array.isArray(history) ? history.slice(0, 5) : []
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Mock interview successfully recorded! Score added to Job Readiness Index.',
      data: user.mockInterview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview/status
 * Returns existing interview record.
 */
exports.getInterviewStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: user.mockInterview || null
    });
  } catch (error) {
    next(error);
  }
};
