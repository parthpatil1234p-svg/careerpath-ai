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

const {
  uploadAvatar: uploadAvatarToCloudinary,
  uploadResume: uploadResumeToCloudinary,
  getResumePreviewUrl,
  downloadResumeBuffer,
} = require('../services/cloudinaryService');

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

    // 1. Attempt extracting text from base64 PDF
    let extractedText = '';
    try {
      if (fileData.startsWith('data:application/pdf') || fileData.includes('JVBERi0')) {
        const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: pdfBuffer });
        await parser.load();
        const parseResult = await parser.getText();
        if (parseResult && typeof parseResult.text === 'string') {
          extractedText = parseResult.text.trim();
        }
      }
    } catch (parseErr) {
      console.warn('[userController.uploadResume] PDF text extraction note:', parseErr.message);
    }

    // 2. Automatically trigger ATS Analysis if text extracted or using candidate data
    let resumeAnalysis = null;
    try {
      const { analyzeResumeText } = require('../services/resumeAnalyzerService');
      const Roadmap = require('../models/Roadmap');
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      const targetCareer = activeRoadmap?.career?.title || 'Full-Stack Developer';

      const candidate = await User.findById(req.user._id);
      const textToGrade = (extractedText && extractedText.length > 50) ? extractedText : (
        `Candidate Name: ${candidate.name}
Technical Skills: ${(candidate.skills || []).map(s => s.name).join(', ')}
Target Role: ${targetCareer}`
      );

      resumeAnalysis = await analyzeResumeText(textToGrade, targetCareer, candidate?.skills || []);
    } catch (atsErr) {
      console.warn('[userController.uploadResume] ATS analysis note:', atsErr.message);
    }

    // 3. Update user in DB
    const updateFields = { resumeUrl };
    if (resumeAnalysis) {
      updateFields.resumeAnalysis = resumeAnalysis;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      data: {
        resumeUrl,
        extractedText,
        resumeAnalysis,
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

/**
 * GET /api/users/resume/view
 * Streams the user's uploaded resume as an inline PDF.
 * Opens natively in the browser's PDF reader without 401 ACL errors!
 */
const viewResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resumeUrl) {
      return res.status(404).send('<!DOCTYPE html><html><head><title>Resume Not Found</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>No resume found</h2><p>Please upload a resume on your student dashboard.</p></body></html>');
    }

    const { data, filename } = await downloadResumeBuffer(user.resumeUrl);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename || 'Student_Resume.pdf'}"`);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.send(data);
  } catch (error) {
    console.error('Error streaming resume inline:', error);
    try {
      const user = await User.findById(req.user._id);
      const previewUrl = getResumePreviewUrl(user?.resumeUrl);
      if (previewUrl) return res.redirect(previewUrl);
    } catch (e) {}
    return res.status(500).send('Error retrieving resume document.');
  }
};

/**
 * GET /api/users/resume/download
 * Triggers direct browser download of the uncompressed PDF document
 */
const downloadResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resumeUrl) {
      return res.status(404).json({ success: false, message: 'No resume found for this user.' });
    }

    const { data, filename } = await downloadResumeBuffer(user.resumeUrl);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'Student_Resume.pdf'}"`);
    res.setHeader('Content-Length', data.length);
    return res.send(data);
  } catch (error) {
    console.error('Error downloading resume:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error downloading resume' });
  }
};

/**
 * GET /api/users/resume/preview
 * Returns the high-res page 1 image preview URL and metadata
 */
const getResumePreview = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resumeUrl) {
      return res.status(200).json({
        success: true,
        data: {
          hasResume: false,
          previewUrl: null,
          resumeUrl: null,
        },
      });
    }

    const previewUrl = getResumePreviewUrl(user.resumeUrl, 1);
    return res.status(200).json({
      success: true,
      data: {
        hasResume: true,
        previewUrl,
        resumeUrl: user.resumeUrl,
        downloadUrl: `/api/users/resume/download`,
        viewUrl: `/api/users/resume/view`,
      },
    });
  } catch (error) {
    console.error('Error generating resume preview:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate preview' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  uploadResume,
  viewResume,
  downloadResume,
  getResumePreview,
};

