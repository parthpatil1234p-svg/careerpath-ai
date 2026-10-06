/**
 * models/Company.js — Mongoose Company Schema
 *
 * Defines corporate entities registered on CareerPath AI.
 * Stores domain verification metadata, DNS status, AI legitimacy scores,
 * and associated authorized recruiters.
 *
 * CareerPath AI · Enterprise Backend Service
 */

const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },

    domain: {
      type: String,
      required: [true, 'Company domain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    website: {
      type: String,
      trim: true,
      default: '',
    },

    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },

    industry: {
      type: String,
      trim: true,
      default: 'Technology & Software',
    },

    headquarters: {
      type: String,
      trim: true,
      default: '',
    },

    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      default: '51-200',
    },

    cinNumber: {
      type: String,
      trim: true,
      default: '',
    },

    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    verificationDetails: {
      dnsValid: { type: Boolean, default: false },
      websiteLive: { type: Boolean, default: false },
      domainMatch: { type: Boolean, default: false },
      aiSummary: { type: String, default: '' },
      verifiedAt: { type: Date, default: null },
    },

    recruiters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Company', CompanySchema);
