/**
 * controllers/readinessController.js — Job Readiness Index & Certificate Controller
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const User = require('../models/User');
const { computeStudentReadiness } = require('../services/readinessService');

/**
 * GET /api/readiness/status
 * Returns live Job Readiness breakdown and tier status.
 */
exports.getReadinessStatus = async (req, res, next) => {
  try {
    const readiness = await computeStudentReadiness(req.user._id);
    return res.status(200).json({
      success: true,
      data: readiness
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/readiness/certificate
 * Returns the official digital certificate credential payload if unlocked (>=85%).
 */
exports.getCertificate = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const readiness = await computeStudentReadiness(req.user._id);

    if (readiness.readinessScore < 85 && !readiness.certificateId) {
      return res.status(403).json({
        success: false,
        isLocked: true,
        currentScore: readiness.readinessScore,
        requiredScore: 85,
        message: `Your Job Readiness score is ${readiness.readinessScore}%. Achieve 85% or higher across verified skills, roadmap completion, resume ATS, and mock interviews to unlock your official certificate.`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        certificateId: readiness.certificateId,
        studentName: user.name,
        targetRole: readiness.targetRole,
        readinessScore: readiness.readinessScore,
        issueDate: readiness.certifiedAt || new Date(),
        issuer: 'CareerPath AI Credential Authority',
        team: '404 Brain Not Found',
        hackathon: 'Hack2Ignite 2026–27',
        verifiedSkills: (user.skills || [])
          .filter(s => s.isCodeVerified || s.isQuizVerified)
          .map(s => s.displayName || s.name),
        validationUrl: `${req.protocol}://${req.get('host')}/verify-cert.html?id=${readiness.certificateId}`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/readiness/job-ready-check
 * Evaluates the decoupled 4-Rule Job Ready Certification.
 */
exports.getJobReadyCheck = async (req, res, next) => {
  try {
    const { evaluateJobReadyCertification } = require('../services/readinessService');
    const result = await evaluateJobReadyCertification(req.user._id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
