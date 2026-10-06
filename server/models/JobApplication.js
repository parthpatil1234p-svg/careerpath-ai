/**
 * models/JobApplication.js — Mongoose Job Application Schema
 *
 * Defines candidate job applications on CareerPath AI.
 * Stores match score percentages, verified skill snapshots, candidate resume links,
 * and recruiter decision states.
 *
 * CareerPath AI · Enterprise Backend Service
 */

const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: [true, 'Job Opening ID is required'],
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student User ID is required'],
      index: true,
    },

    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter User ID is required'],
      index: true,
    },

    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    readinessTier: {
      type: String,
      default: 'Foundational Learner',
    },

    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },

    builtResumeSnapshot: {
      type: Object,
      default: () => ({}),
    },

    coverNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Cover note cannot exceed 1000 characters'],
    },

    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'interview_scheduled'],
      default: 'applied',
      index: true,
    },

    recruiterNotes: {
      type: String,
      trim: true,
      default: '',
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications by the same student for the same job opening
JobApplicationSchema.index({ job: 1, student: 1 }, { unique: true });
JobApplicationSchema.index({ recruiter: 1, status: 1 });
JobApplicationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
