/**
 * services/cloudinaryService.js — Cloudinary Media Storage Service
 *
 * Provides optimized cloud asset management for student profile photos and resumes.
 * Uses authenticated signed uploads with automatic face-detection cropping.
 */

const cloudinary = require('cloudinary').v2;

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('⚠️  [WARN] Cloudinary credentials missing from environment. Media upload features are disabled.');
}

/**
 * Upload an image (avatar) to Cloudinary with automatic face-focus square cropping.
 * @param {string} fileData - Base64 Data URI (data:image/...) or remote URL
 * @param {string} userId - ID of the uploading user
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadAvatar = async (fileData, userId) => {
  if (!isConfigured) {
    throw new Error('Cloudinary media service is not configured on this server.');
  }
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

const AdmZip = require('adm-zip');

/**
 * Extracts Cloudinary public_id from a full Cloudinary URL
 * @param {string} url - Full Cloudinary asset URL
 * @returns {string|null} public_id
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
};

/**
 * Generates a high-resolution PNG preview URL for a PDF resume (page 1)
 * Cloudinary can always deliver rendered image representations of PDFs (200 OK)
 * @param {string} publicIdOrUrl - Cloudinary publicId or URL
 * @param {number} [page=1] - Page number to render
 * @returns {string} High-res preview image URL
 */
const getResumePreviewUrl = (publicIdOrUrl, page = 1) => {
  const publicId = getPublicIdFromUrl(publicIdOrUrl) || publicIdOrUrl;
  if (!publicId) return null;
  return cloudinary.url(`${publicId}.png`, {
    page,
    secure: true,
    resource_type: 'image',
    quality: 'auto',
    density: 150,
  });
};

/**
 * Downloads and extracts the original uncompressed PDF buffer from Cloudinary archive.
 * Bypasses Cloudinary's default account-level PDF delivery ACL restrictions.
 * @param {string} publicIdOrUrl - Cloudinary publicId or URL
 * @returns {Promise<{ filename: string, data: Buffer, size: number }>}
 */
const downloadResumeBuffer = async (publicIdOrUrl) => {
  if (!isConfigured) {
    throw new Error('Cloudinary media service is not configured on this server.');
  }
  const publicId = getPublicIdFromUrl(publicIdOrUrl) || publicIdOrUrl;
  if (!publicId) throw new Error('Invalid resume identifier or URL');

  const zipUrl = cloudinary.utils.download_zip_url({
    public_ids: [publicId],
    resource_type: 'image',
    target_format: 'zip',
  });

  const res = await fetch(zipUrl);
  if (!res.ok) {
    throw new Error(`Cloudinary archive fetch failed with status ${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  if (!entries || entries.length === 0) {
    throw new Error('No document files found in Cloudinary resume archive');
  }

  const fileEntry = entries[0];
  return {
    filename: fileEntry.name.split('/').pop() || 'Student_Resume.pdf',
    data: fileEntry.getData(),
    size: fileEntry.header.size,
  };
};

/**
 * Upload a document (resume PDF/DOC) to Cloudinary.
 * @param {string} fileData - Base64 Data URI (data:application/...)
 * @param {string} userId - ID of the uploading user
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadResume = async (fileData, userId) => {
  if (!isConfigured) {
    throw new Error('Cloudinary media service is not configured on this server.');
  }
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
        const previewUrl = getResumePreviewUrl(result.public_id, 1);
        resolve({
          ...result,
          previewUrl,
        });
      }
    );
  });
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadResume,
  getPublicIdFromUrl,
  getResumePreviewUrl,
  downloadResumeBuffer,
};
