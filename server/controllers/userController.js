/**
 * controllers/userController.js — Profile Read & Update
 *
 * getMyProfile    GET  /api/users/me   (protected)
 * updateMyProfile PUT  /api/users/me   (protected)
 *
 * Rules:
 *  - Email, password, and role CANNOT be changed through these routes.
 *  - Only name, education, interests, skills, careerGoals are updatable.
 *  - profileCompleted is set to true automatically once the minimum
 *    profile requirements are met (education.course + ≥1 interest + ≥1 skill).
 *  - Password is never returned in any response.
 */

const User = require('../models/User');

// ── Permitted update fields whitelist ─────────────────────────
// Only these fields can be changed via PUT /api/users/me.
const ALLOWED_UPDATE_FIELDS = [
  'name',
  'education',
  'interests',
  'skills',
  'careerGoals',
  'avatarUrl',
  'resumeUrl',
];

// ── getMyProfile ───────────────────────────────────────────────
/**
 * GET /api/users/me
 * Returns the authenticated user's profile (password excluded by default).
 */
const getMyProfile = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware (already loaded from DB)
    // Re-fetch to ensure we always return fresh data
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ── updateMyProfile ────────────────────────────────────────────
/**
 * PUT /api/users/me
 * Body: any subset of { name, education, interests, skills, careerGoals }
 *
 * Ignores any non-whitelisted fields from the request body.
 * Calculates profileCompleted automatically after update.
 */
const updateMyProfile = async (req, res, next) => {
  try {
    // 1. Extract only the permitted fields from the body
    const updates = {};
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    // 2. Apply updates using findByIdAndUpdate
    //    { new: true }        → returns the updated document
    //    { runValidators: true } → runs Mongoose schema validators on updated fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 3. Auto-calculate profileCompleted
    //    Requirements: education.course filled + at least 1 interest + at least 1 skill
    const hasEducation = updatedUser.education && updatedUser.education.course &&
                         updatedUser.education.course.trim() !== '';
    const hasInterest  = updatedUser.interests  && updatedUser.interests.length  > 0;
    const hasSkill     = updatedUser.skills     && updatedUser.skills.length     > 0;

    const shouldBeCompleted = hasEducation && hasInterest && hasSkill;

    // Only update profileCompleted if the value needs to change (avoids an extra DB write otherwise)
    if (updatedUser.profileCompleted !== shouldBeCompleted) {
      updatedUser.profileCompleted = shouldBeCompleted;
      await updatedUser.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

const { uploadAvatar: uploadAvatarToCloudinary, uploadResume: uploadResumeToCloudinary } = require('../services/cloudinaryService');

/**
 * POST /api/users/avatar
 * Body: { fileData: "data:image/...;base64,..." }
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const { fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    const uploadRes = await uploadAvatarToCloudinary(fileData, req.user._id);
    const avatarUrl = uploadRes.secure_url;

    // Update user in DB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatarUrl } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded and saved successfully',
      data: {
        avatarUrl,
        user,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload avatar',
    });
  }
};

/**
 * POST /api/users/resume
 * Body: { fileData: "data:application/pdf;base64,..." }
 */
const uploadResume = async (req, res, next) => {
  try {
    const { fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({
        success: false,
        message: 'No resume document provided',
      });
    }

    const uploadRes = await uploadResumeToCloudinary(fileData, req.user._id);
    const resumeUrl = uploadRes.secure_url;

    // Update user in DB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { resumeUrl } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and attached to profile successfully',
      data: {
        resumeUrl,
        user,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload resume',
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  uploadResume,
};

