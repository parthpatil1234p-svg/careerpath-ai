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
const { normalizeSkillKey } = require('../data/quizQuestions');

const ALLOWED_ASSESSMENT_FIELDS = ['education', 'interests', 'skills', 'careerGoals', 'hasCompletedSkillVerification'];

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

    // Standardize skills casing and preserve verification status with canonical deduplication
    if (Array.isArray(updates.skills)) {
      const skillsMap = new Map();
      updates.skills.forEach((s) => {
        const rawName = typeof s.name === 'string' ? s.name.trim().toLowerCase() : '';
        if (!rawName || rawName.includes('@') || rawName.includes('.com') || rawName.length > 30) return;
        const canonicalKey = normalizeSkillKey(rawName);

        const formatted = {
          name: canonicalKey,
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
          verificationTier: s.verificationTier || (s.isCodeVerified ? 'project_verified' : s.isQuizVerified ? 'quiz_verified' : 'self_rated'),
          verificationStatus: s.verificationStatus || (s.isQuizVerified || s.isCodeVerified ? 'verified' : 'unverified'),
          integrityScore: typeof s.integrityScore === 'number' ? s.integrityScore : 100,
          nextRetakeAvailableAt: s.nextRetakeAvailableAt ? new Date(s.nextRetakeAvailableAt) : null,
          quizAttemptsCount: typeof s.quizAttemptsCount === 'number' ? s.quizAttemptsCount : 0,
          lastQuizAttemptAt: s.lastQuizAttemptAt ? new Date(s.lastQuizAttemptAt) : null,
          tabSwitchCount: typeof s.tabSwitchCount === 'number' ? s.tabSwitchCount : 0,
          velocityAnomalyCount: typeof s.velocityAnomalyCount === 'number' ? s.velocityAnomalyCount : 0,
        };

        if (!skillsMap.has(canonicalKey)) {
          skillsMap.set(canonicalKey, formatted);
        } else {
          // Merge: keep verified status if any is verified
          const existing = skillsMap.get(canonicalKey);
          if (formatted.isQuizVerified) existing.isQuizVerified = true;
          if (formatted.isCodeVerified) existing.isCodeVerified = true;
          if (formatted.verifiedProficiency) existing.verifiedProficiency = formatted.verifiedProficiency;
          if (formatted.verificationTier) existing.verificationTier = formatted.verificationTier;
          if (formatted.verificationStatus) existing.verificationStatus = formatted.verificationStatus;
          if (formatted.integrityScore) existing.integrityScore = formatted.integrityScore;
          if (formatted.nextRetakeAvailableAt) existing.nextRetakeAvailableAt = formatted.nextRetakeAvailableAt;
          if (formatted.proficiency === 'advanced' || (!existing.proficiency && formatted.proficiency)) {
            existing.proficiency = formatted.proficiency;
          }
        }
      });
      updates.skills = Array.from(skillsMap.values());
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

    // Persist one-time skill verification completion for account
    if (req.body.hasCompletedSkillVerification || (Array.isArray(updates.skills) && updates.skills.some((s) => s.isQuizVerified || s.isCodeVerified))) {
      updates.hasCompletedSkillVerification = true;
    }

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
