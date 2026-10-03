/**
 * models/YoutubeCache.js — Mongoose YouTube Search & Metadata Cache Schema
 *
 * Implements a 30-day auto-expiring TTL cache for Google YouTube Data API v3 responses.
 * Reduces external API quota consumption to 0 for subsequent queries and ensures instant
 * offline-safe fallback for the CareerPath AI Focus Video Chamber.
 */

const mongoose = require('mongoose');

const VideoItemSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: [true, 'YouTube videoId is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
    },
    channelTitle: {
      type: String,
      default: '',
      trim: true,
    },
    channelId: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    durationCategory: {
      type: String,
      enum: ['medium', 'long', 'short', 'any'],
      default: 'medium',
    },
    embedUrl: {
      type: String,
      default: '',
      trim: true,
    },
    watchUrl: {
      type: String,
      default: '',
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const YoutubeCacheSchema = new mongoose.Schema(
  {
    queryKey: {
      type: String,
      required: [true, 'Query cache key is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    skillName: {
      type: String,
      index: true,
      default: '',
      trim: true,
      lowercase: true,
    },
    videos: {
      type: [VideoItemSchema],
      default: [],
    },
    source: {
      type: String,
      enum: ['youtube_api_v3', 'curated_registry'],
      default: 'curated_registry',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000, // 30 days in seconds
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('YoutubeCache', YoutubeCacheSchema);
