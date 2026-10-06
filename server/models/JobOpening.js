/**
 * models/JobOpening.js — Mongoose Job Opening Schema
 *
 * Defines recruiter-created job postings on CareerPath AI.
 * Stores role requirements, required skill verifications, salary ranges,
 * and live application metrics.
 *
 * CareerPath AI · Enterprise Backend Service
 */

const mongoose = require('mongoose');

const RequiredSkillSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    minimumProficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    requiresVerification: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const JobOpeningSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter ID is required'],
      index: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },

    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },

    companyLogo: {
      type: String,
      trim: true,
      default: '',
    },

    companyWebsite: {
      type: String,
      trim: true,
      default: '',
    },

    isCompanyVerified: {
      type: Boolean,
      default: true,
    },

    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Job title must be at least 3 characters'],
      maxlength: [120, 'Job title cannot exceed 120 characters'],
    },

    careerSlug: {
      type: String,
      trim: true,
      default: 'front-end-developer',
      index: true,
    },

    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract'],
      default: 'full-time',
    },

    workplace: {
      type: String,
      enum: ['remote', 'hybrid', 'on-site'],
      default: 'remote',
    },

    location: {
      type: String,
      trim: true,
      default: 'Bengaluru, India',
    },

    experienceLevel: {
      type: String,
      enum: ['fresher', 'entry', 'mid', 'senior'],
      default: 'fresher',
    },

    salaryRange: {
      min: { type: Number, default: 400000 },
      max: { type: Number, default: 800000 },
      currency: { type: String, default: 'INR' },
      isDisclosed: { type: Boolean, default: true },
    },

    requiredSkills: {
      type: [RequiredSkillSchema],
      default: [],
    },

    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },

    responsibilities: {
      type: [String],
      default: [],
    },

    requirements: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
      index: true,
    },

    applicantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deadline: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick active career queries
JobOpeningSchema.index({ status: 1, careerSlug: 1 });
JobOpeningSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('JobOpening', JobOpeningSchema);
