/**
 * controllers/assessmentController.js — Student Profile Assessment Endpoints
 *
 * updateAssessment  PUT /api/assessment  (protected)
 *
 * Saves student academics, interests, current skills (with proficiency levels),
 * and career goals.
 * Computes profileCompleted = true when minimum requirements are satisfied.
 */

const User = require('../models/User');

const ALLOWED_ASSESSMENT_FIELDS = ['education', 'interests', 'skills', 'careerGoals'];

// ── updateAssessment ───────────────────────────────────────────
/**
 * PUT /api/assessment
 * Updates user assessment data and sets profileCompleted flag.
 */
const updateAssessment = async (req, res, next) => {
  try {
    const updates = {};
    ALLOWED_ASSESSMENT_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No assessment data provided to update',
      });
    }

    // Standardize skills casing and preserve verification status
    if (Array.isArray(updates.skills)) {
      updates.skills = updates.skills.map((s) => ({
        name: typeof s.name === 'string' ? s.name.trim().toLowerCase() : '',
        displayName: typeof s.displayName === 'string' && s.displayName.trim() ? s.displayName.trim() : (s.name || '').trim(),
        proficiency: typeof s.proficiency === 'string' ? s.proficiency.trim().toLowerCase() : 'beginner',
        isCodeVerified: Boolean(s.isCodeVerified),
        verifiedSource: typeof s.verifiedSource === 'string' ? s.verifiedSource : '',
        selfRatedProficiency: s.selfRatedProficiency || null,
        isQuizVerified: Boolean(s.isQuizVerified),
        verifiedProficiency: s.verifiedProficiency || null,
        quizScore: typeof s.quizScore === 'number' ? s.quizScore : 0,
        quizGaps: Array.isArray(s.quizGaps) ? s.quizGaps : [],
        quizVerifiedAt: s.quizVerifiedAt ? new Date(s.quizVerifiedAt) : (s.isQuizVerified ? new Date() : null),
      }));
    }

    // Standardize interests casing
    if (Array.isArray(updates.interests)) {
      updates.interests = updates.interests.map((i) =>
        typeof i === 'string' ? i.trim().toLowerCase() : ''
      ).filter(Boolean);
    }

    // Determine profileCompleted status
    const hasEducation =
      updates.education &&
      updates.education.course &&
      typeof updates.education.course === 'string' &&
      updates.education.course.trim() !== '';

    const hasInterest = Array.isArray(updates.interests) && updates.interests.length > 0;
    const hasSkill = Array.isArray(updates.skills) && updates.skills.length > 0;

    updates.profileCompleted = Boolean(hasEducation && hasInterest && hasSkill);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assessment saved successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateAssessment,
};
