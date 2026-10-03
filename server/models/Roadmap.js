/**
 * models/Roadmap.js — Mongoose Roadmap Schema
 *
 * Represents a student's personalized learning roadmap for a specific career path.
 * Tracks week duration, active status, completion metrics, and snapshot data.
 */

const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    career: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Career',
      required: [true, 'Career reference is required'],
    },
    careerSnapshot: {
      title: { type: String, required: true },
      slug: { type: String, required: true },
      shortDescription: { type: String, default: '' },
    },
    durationWeeks: {
      type: Number,
      required: [true, 'Duration in weeks is required'],
      enum: {
        values: [4, 8, 12],
        message: 'Duration must be 4, 8, or 12 weeks',
      },
      default: 4,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'abandoned', 'archived'],
        message: 'Status must be active, completed, abandoned, or archived',
      },
      default: 'active',
    },
    abandonedAt: {
      type: Date,
      default: null,
    },
    generatedFrom: {
      missingSkills: { type: [String], default: [] },
      weakSkills: { type: [String], default: [] },
      userInterests: { type: [String], default: [] },
      userSkillNames: { type: [String], default: [] },
    },
    totalTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    // Server-authoritative weekly milestone gating & test progression
    weekProgress: [
      {
        weekNumber: { type: Number, required: true },
        title: { type: String, default: '' },
        status: {
          type: String,
          enum: ['locked', 'in_progress', 'awaiting_test', 'passed'],
          default: 'locked',
        },
        attemptsCount: { type: Number, default: 0 },
        passedAt: { type: Date, default: null },
        testScore: { type: Number, default: 0 },
        testPercent: { type: Number, default: 0 },
        cooldownUntil: { type: Date, default: null },
        lastDisqualifiedAt: { type: Date, default: null },
        disqualifiedReason: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Database-level guarantee: at most ONE active roadmap per user PER CAREER
RoadmapSchema.index(
  { user: 1, career: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
  }
);

// Compound index for querying user's roadmaps by status efficiently
RoadmapSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Roadmap', RoadmapSchema);
