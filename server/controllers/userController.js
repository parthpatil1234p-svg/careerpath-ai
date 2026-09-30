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
  deleteResource,
} = require('../services/cloudinaryService');
const { getSkillEvidence } = require('../services/evidenceService');

/**
 * Strict MIME Type and Size Validator for Base64 Data URIs
 * @param {string} dataUri - e.g. "data:image/png;base64,..."
 * @param {string[]} allowedMimes - e.g. ['image/jpeg', 'image/png']
 * @param {number} maxBytes - max allowed file size in bytes
 * @param {string} fieldName - e.g. "Avatar" or "Resume"
 */
function validateBase64Upload(dataUri, allowedMimes, maxBytes, fieldName) {
  if (!dataUri || typeof dataUri !== 'string') {
    const err = new Error(`${fieldName} data is required.`);
    err.statusCode = 400;
    throw err;
  }

  // 1. Extract MIME from data URI: data:<mime>;base64,<data>
  const match = dataUri.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/s);
  if (!match) {
    const err = new Error(`Invalid ${fieldName} format. Must be a valid base64 Data URI (data:<mime>;base64,...).`);
    err.statusCode = 400;
    throw err;
  }

  const mime = match[1].toLowerCase();
  const base64Data = match[2].trim();

  if (!allowedMimes.includes(mime)) {
    const err = new Error(`Unsupported ${fieldName} file format (${mime}). Allowed formats: ${allowedMimes.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // 2. Calculate approximate byte size: (base64 length * 3) / 4
  const sizeBytes = Math.ceil((base64Data.length * 3) / 4);
  if (sizeBytes > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (sizeBytes / (1024 * 1024)).toFixed(2);
    const err = new Error(`${fieldName} file size (${actualMb}MB) exceeds the maximum allowed limit of ${maxMb}MB.`);
    err.statusCode = 400;
    throw err;
  }

  return { mime, sizeBytes, base64Data };
}

/**
 * POST /api/users/avatar
 * Body: { fileData: "data:image/...;base64,..." }
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const { fileData } = req.body;
    validateBase64Upload(
      fileData,
      ['image/jpeg', 'image/png', 'image/webp'],
      2 * 1024 * 1024,
      'Avatar'
    );

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
    res.status(error.statusCode || 500).json({
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
    const { fileData, fileName } = req.body;

    // 1. Server Unlock Rule: Verify at least one skill before unlocking resume upload
    const evidence = await getSkillEvidence(req.user._id);
    if (!evidence || evidence.verifiedCount === 0) {
      return res.status(403).json({
        success: false,
        code: 'VERIFICATION_REQUIRED',
        message: 'Verify one skill to unlock resume upload.',
      });
    }

    const uploadInfo = validateBase64Upload(
      fileData,
      [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      5 * 1024 * 1024,
      'Resume'
    );

    // Fetch existing user to get old publicId for safe replacement
    const existingUser = await User.findById(req.user._id);
    const oldPublicId = existingUser?.resumeRecord?.publicId;

    const uploadRes = await uploadResumeToCloudinary(fileData, req.user._id);
    const resumeUrl = uploadRes.secure_url;

    // 2. Attempt extracting text from base64 PDF
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

    // 3. Automatically trigger ATS Analysis if text extracted or using candidate data
    let resumeAnalysis = null;
    try {
      const { analyzeResumeText } = require('../services/resumeAnalyzerService');
      const Roadmap = require('../models/Roadmap');
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      const targetCareer = activeRoadmap?.career?.title || 'Full-Stack Developer';

      const candidate = existingUser || await User.findById(req.user._id);
      const textToGrade = (extractedText && extractedText.length > 50) ? extractedText : (
        `Candidate Name: ${candidate.name}
Technical Skills: ${(candidate.skills || []).map(s => s.name).join(', ')}
Target Role: ${targetCareer}`
      );

      resumeAnalysis = await analyzeResumeText(textToGrade, targetCareer, candidate?.skills || []);
    } catch (atsErr) {
      console.warn('[userController.uploadResume] ATS analysis note:', atsErr.message);
    }

    // 4. Update user in DB with resumeRecord
    const now = new Date();
    const resumeRecord = {
      fileLocation: resumeUrl,
      fileName: fileName || req.body.fileName || 'Resume.pdf',
      fileSize: uploadInfo.sizeBytes,
      firstUploadedDate: existingUser?.resumeRecord?.firstUploadedDate || now,
      lastUpdatedDate: now,
      publicId: uploadRes.public_id,
    };

    const updateFields = {
      resumeUrl,
      resumeRecord,
    };
    if (resumeAnalysis) {
      updateFields.resumeAnalysis = resumeAnalysis;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    // 5. Delete old asset from Cloudinary only after new file is committed to DB
    if (oldPublicId && oldPublicId !== uploadRes.public_id) {
      deleteResource(oldPublicId).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully.',
      data: {
        resumeUrl,
        resume: updatedUser.resumeRecord,
        resumeRecord: updatedUser.resumeRecord,
        extractedText,
        resumeAnalysis,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(error.statusCode || 500).json({
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

/**
 * PUT /api/users/profile-status
 * Body: { status: 'learning' | 'job_seeking' | 'working', currentRole: String }
 */
const updateProfileStatus = async (req, res, next) => {
  try {
    const { status, currentRole } = req.body;
    const validStatuses = ['learning', 'job_seeking', 'working'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be learning, job_seeking, or working.',
      });
    }

    const updates = {};
    if (status) updates['profileStatus.status'] = status;
    if (currentRole !== undefined) updates['profileStatus.currentRole'] = currentRole;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile status updated successfully',
      data: {
        profileStatus: user.profileStatus,
      },
    });
  } catch (error) {
    next(error);
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
  updateProfileStatus,
};

