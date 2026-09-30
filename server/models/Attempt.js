/**
 * models/Attempt.js — Central Ledger for Assessment & Weekly Testing Events
 *
 * Implements server-authoritative audit records for both:
 *  1. Adaptive Skill Checks (type: 'skill_check')
 *  2. Weekly Roadmap Milestones (type: 'weekly_test')
 *
 * Records user, questions asked, answers, score, server countdown deadline,
 * passed status (>=70% for weekly tests), and missed topic tags.
 */

const mongoose = require('mongoose');

const QuestionRecordSchema = new mongoose.Schema(
  {
    questionId: { type: String, default: '' },
    prompt: { type: String, required: true },
    topic: { type: String, default: '' },
    difficulty: { type: String, default: 'intermediate' },
    options: { type: [String], default: [] },
    selectedIndex: { type: Number, default: null },
    correctIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, default: false },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['skill_check', 'weekly_test'],
      required: [true, 'Attempt type is required'],
      index: true,
    },
    skill: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      default: null,
      index: true,
    },
    roadmapWeek: {
      type: Number,
      default: null,
    },
    topicTags: {
      type: [String],
      default: [],
    },
    questionsAsked: {
      type: [QuestionRecordSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    percent: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: true,
    },
    submitTime: {
      type: Date,
      default: null,
    },
    missedTopics: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's latest completed attempts
AttemptSchema.index({ user: 1, type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Attempt', AttemptSchema);
