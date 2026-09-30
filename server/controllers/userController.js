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
const Resume = require('../models/Resume');

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
  deleteResumeFromCloudinary,
} = require('../services/cloudinaryService');
const { getSkillEvidence } = require('../services/evidenceService');

/**
 * Validates resume binary buffer, magic bytes, and file size.
 * Enforces magic-byte file signature validation:
 * - PDF: %PDF- (hex 25 50 44 46)
 * - DOCX: PK\x03\x04 (hex 50 4b 03 04)
 * - DOC: \xd0\xcf\x11\xe0 (hex d0 cf 11 e0)
 * Max size: 5MB
 * @param {string} fileData - Base64 data URI or raw base64 string
 * @param {string} declaredName - File name submitted by client
 * @returns {{ buffer: Buffer, mimeType: string, sizeBytes: number, sanitizedName: string }}
 */
function validateResumeBuffer(fileData, declaredName = 'Resume.pdf') {
  if (!fileData || typeof fileData !== 'string') {
    const err = new Error('Resume file data is required.');
    err.statusCode = 400;
    throw err;
  }

  const match = fileData.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/s);
  const base64Payload = match ? match[2].trim() : fileData.trim();

  let buffer;
  try {
    buffer = Buffer.from(base64Payload, 'base64');
  } catch (e) {
    const err = new Error('Invalid base64 encoding for resume file.');
    err.statusCode = 400;
    throw err;
  }

  const sizeBytes = buffer.length;
  if (sizeBytes === 0) {
    const err = new Error('Resume file cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (sizeBytes > maxBytes) {
    const actualMb = (sizeBytes / (1024 * 1024)).toFixed(2);
    const err = new Error(`Resume size (${actualMb} MB) exceeds maximum allowed limit of 5.0 MB.`);
    err.statusCode = 400;
    throw err;
  }

  // Inspect first 4 bytes
  const headerHex = buffer.subarray(0, 4).toString('hex').toLowerCase();
  const headerAscii = buffer.subarray(0, 4).toString('ascii');

  let mimeType = '';
  if (headerAscii.startsWith('%PDF')) {
    mimeType = 'application/pdf';
  } else if (headerHex === '504b0304') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (headerHex === 'd0cf11e0') {
    mimeType = 'application/msword';
  } else {
    const err = new Error('Invalid file format. Resume must be a valid PDF, DOCX, or DOC document.');
    err.statusCode = 400;
    throw err;
  }

  let sanitizedName = (declaredName || 'Student_Resume.pdf')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
  if (!sanitizedName.includes('.')) {
    sanitizedName += (mimeType === 'application/pdf' ? '.pdf' : '.docx');
  }

  return { buffer, mimeType, sizeBytes, sanitizedName };
}


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
 * GET /api/users/resume
 * Returns current resume status, file details, ATS score, and locked state.
 */
const getMyResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const evidence = await getSkillEvidence(req.user._id);
    const verifiedCount = evidence?.verifiedCount || 0;

    const resume = await Resume.findOne({ user: req.user._id });
    const hasResume = Boolean(resume?.fileLocation || user.resumeUrl);
    const isLocked = verifiedCount === 0 && !hasResume;

    let targetRole = user.careerGoals?.primaryTrack || 'Software Engineer';
    try {
      const Roadmap = require('../models/Roadmap');
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      if (activeRoadmap?.career?.title) {
        targetRole = activeRoadmap.career.title;
      }
    } catch (e) {}

    let resumeData = null;
    if (resume) {
      resumeData = {
        fileName: resume.originalName,
        fileType: resume.fileType,
        sizeBytes: resume.sizeBytes,
        fileLocation: resume.fileLocation,
        version: resume.version,
        atsScore: resume.atsScore !== null ? resume.atsScore : (user.resumeAnalysis?.atsScore ?? null),
        firstUploadedAt: resume.firstUploadedAt,
        lastUpdatedAt: resume.lastUpdatedAt,
      };
    } else if (user.resumeUrl) {
      resumeData = {
        fileName: user.resumeRecord?.fileName || 'Student_Resume.pdf',
        fileType: 'application/pdf',
        sizeBytes: user.resumeRecord?.fileSize || 0,
        fileLocation: user.resumeUrl,
        version: 1,
        atsScore: user.resumeAnalysis?.atsScore ?? null,
        firstUploadedAt: user.resumeRecord?.firstUploadedDate || user.createdAt,
        lastUpdatedAt: user.resumeRecord?.lastUpdatedDate || user.updatedAt,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        hasResume,
        isLocked,
        verifiedSkillsCount: verifiedCount,
        targetRole,
        resume: resumeData,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/resume
 * Body: { fileData: "data:application/pdf;base64,...", fileName?: "resume.pdf" }
 *
 * Strict Single-Resume Pipeline:
 * 1. Skill Lock Gate: 0 verified skills blocks initial upload (updating existing resume is allowed).
 * 2. Deep binary validation: magic-byte signature check for PDF, DOCX, DOC and size <= 5MB.
 * 3. Safe in-place replacement: old Cloudinary asset destroyed ONLY after new DB record commits.
 * 4. Database-level invariant: Resume.findOneAndUpdate with upsert enforces unique user constraint.
 */
const uploadResume = async (req, res, next) => {
  try {
    const { fileData, fileName } = req.body;

    // 1. Check existing resume
    const existingResume = await Resume.findOne({ user: req.user._id });
    const existingUser = await User.findById(req.user._id);
    const hasExistingResume = Boolean(existingResume?.fileLocation || existingUser?.resumeUrl);

    // 2. Verified skill lock gate (Accounts with 0 verified skills cannot upload INITIAL resume)
    if (!hasExistingResume) {
      const evidence = await getSkillEvidence(req.user._id);
      if (!evidence || evidence.verifiedCount === 0) {
        return res.status(403).json({
          success: false,
          code: 'RESUME_LOCKED',
          message: 'Verify one skill to unlock resume upload.',
        });
      }
    }

    // 3. Deep binary buffer & magic-byte validation
    const validated = validateResumeBuffer(fileData, fileName);

    // 4. Save old public_id for safe cleanup after DB commit
    const oldPublicId = existingResume?.publicId || existingUser?.resumeRecord?.publicId;

    // 5. Upload new asset to Cloudinary
    const uploadRes = await uploadResumeToCloudinary(fileData, req.user._id);
    const resumeUrl = uploadRes.secure_url;
    const newPublicId = uploadRes.public_id;

    // 6. Extract text from PDF if applicable
    let extractedText = '';
    try {
      if (validated.mimeType === 'application/pdf') {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: validated.buffer });
        await parser.load();
        const parseResult = await parser.getText();
        if (parseResult && typeof parseResult.text === 'string') {
          extractedText = parseResult.text.trim();
        }
      }
    } catch (parseErr) {
      console.warn('[userController.uploadResume] Text extraction note:', parseErr.message);
    }

    // 7. Auto-trigger ATS analysis
    let resumeAnalysis = null;
    try {
      const { analyzeResumeText } = require('../services/resumeAnalyzerService');
      const Roadmap = require('../models/Roadmap');
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      const targetCareer = activeRoadmap?.career?.title || existingUser?.careerGoals?.primaryTrack || 'Full-Stack Developer';

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

    // 8. Atomic database-level upsert in Resume model (enforces unique user index)
    const now = new Date();
    const updatedResume = await Resume.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          originalName: validated.sanitizedName,
          fileType: validated.mimeType,
          sizeBytes: validated.sizeBytes,
          fileLocation: resumeUrl,
          publicId: newPublicId,
          extractedText,
          atsScore: resumeAnalysis?.atsScore ?? null,
          lastUpdatedAt: now,
        },
        $setOnInsert: {
          firstUploadedAt: now,
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 9. Sync User document
    const resumeRecord = {
      fileLocation: resumeUrl,
      fileName: validated.sanitizedName,
      fileSize: validated.sizeBytes,
      firstUploadedDate: existingResume?.firstUploadedAt || existingUser?.resumeRecord?.firstUploadedDate || now,
      lastUpdatedDate: now,
      publicId: newPublicId,
    };

    const userUpdateFields = {
      resumeUrl,
      resumeRecord,
    };
    if (resumeAnalysis) {
      userUpdateFields.resumeAnalysis = resumeAnalysis;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: userUpdateFields },
      { new: true, runValidators: false }
    );

    // 10. Safe Cleanup: Old asset is destroyed ONLY after new asset successfully committed to DB
    if (oldPublicId && oldPublicId !== newPublicId) {
      deleteResumeFromCloudinary(oldPublicId).catch((delErr) => {
        console.warn('[userController.uploadResume] Old asset cleanup note:', delErr.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume updated successfully.',
      data: {
        resumeUrl,
        resume: {
          fileName: updatedResume.originalName,
          fileType: updatedResume.fileType,
          sizeBytes: updatedResume.sizeBytes,
          fileLocation: updatedResume.fileLocation,
          version: updatedResume.version,
          atsScore: updatedResume.atsScore,
          firstUploadedAt: updatedResume.firstUploadedAt,
          lastUpdatedAt: updatedResume.lastUpdatedAt,
        },
        resumeRecord: updatedUser.resumeRecord,
        extractedText,
        resumeAnalysis,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload resume',
    });
  }
};

/**
 * DELETE /api/users/resume
 * Deletes user's resume from Cloudinary, drops Resume document, and resets User model pointers.
 */
const deleteMyResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!resume && !user?.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this account.',
      });
    }

    const publicId = resume?.publicId || user?.resumeRecord?.publicId;
    if (publicId) {
      await deleteResumeFromCloudinary(publicId);
    }

    if (resume) {
      await Resume.findOneAndDelete({ user: req.user._id });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { resumeUrl: '' },
      $unset: { resumeRecord: 1, resumeAnalysis: 1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete resume',
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
  getMyResume,
  uploadResume,
  deleteMyResume,
  viewResume,
  downloadResume,
  getResumePreview,
  updateProfileStatus,
};


