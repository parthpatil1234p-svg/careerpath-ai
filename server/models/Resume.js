/**
 * models/Resume.js — Dedicated Single-Resume Mongoose Model
 *
 * Enforces strict, database-level single-resume per user invariant:
 * { user: { type: ObjectId, ref: 'User', unique: true, index: true } }
 *
 * Guarantees zero duplicate resume documents even across concurrent requests.
 */

const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true, // Database engine level unique index: 1 resume per user
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'Filename exceeds 255 characters'],
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ],
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: [1, 'File cannot be empty'],
      max: [5 * 1024 * 1024, 'Resume size exceeds 5MB limit'],
    },
    fileLocation: {
      type: String, // Cloudinary secure_url
      required: true,
      trim: true,
    },
    publicId: {
      type: String, // Cloudinary public_id
      required: true,
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    extractedText: {
      type: String,
      default: '',
    },
    atsScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    firstUploadedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly ensure unique index on user
ResumeSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Resume', ResumeSchema);
