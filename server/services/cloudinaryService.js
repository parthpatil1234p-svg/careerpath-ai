/**
 * services/cloudinaryService.js — Cloudinary Media Storage Service
 *
 * Provides optimized cloud asset management for student profile photos and resumes.
 * Uses authenticated signed uploads with automatic face-detection cropping.
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'npuijcvt',
  api_key: process.env.CLOUDINARY_API_KEY || '959864665934574',
  api_secret: process.env.CLOUDINARY_API_SECRET || '0qEx5HzCZLLVLBjklRHu-HrKRLc',
  secure: true,
});

/**
 * Upload an image (avatar) to Cloudinary with automatic face-focus square cropping.
 * @param {string} fileData - Base64 Data URI (data:image/...) or remote URL
 * @param {string} userId - ID of the uploading user
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadAvatar = async (fileData, userId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileData,
      {
        folder: 'careerpath-ai/avatars',
        public_id: `avatar_${userId || 'user'}_${Date.now()}`,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

/**
 * Upload a document (resume PDF/DOC) to Cloudinary.
 * @param {string} fileData - Base64 Data URI (data:application/...)
 * @param {string} userId - ID of the uploading user
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadResume = async (fileData, userId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileData,
      {
        folder: 'careerpath-ai/resumes',
        public_id: `resume_${userId || 'user'}_${Date.now()}`,
        resource_type: 'auto',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadResume,
};
