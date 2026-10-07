/**
 * models/CampusLead.js — Mongoose Schema for University & College Placement Cell (TPO) Leads
 *
 * Stores institutional demo requests, TPO consultations, and Voice AI outreach leads.
 * Tracks batch sizes, accreditation readiness, and partnership status.
 *
 * CareerPath AI · Enterprise Backend Service
 */

const mongoose = require('mongoose');

const CampusLeadSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      required: [true, 'College or Institution name is required'],
      trim: true,
      maxlength: [150, 'College name cannot exceed 150 characters'],
    },

    cityState: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'City and State cannot exceed 100 characters'],
    },

    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    },

    designation: {
      type: String,
      enum: ['TPO', 'HOD', 'Principal', 'Dean', 'Professor', 'Other'],
      default: 'TPO',
    },

    email: {
      type: String,
      required: [true, 'Official institutional email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone or WhatsApp number is required'],
      trim: true,
      maxlength: [25, 'Phone number cannot exceed 25 characters'],
    },

    batchSize: {
      type: String,
      enum: ['100-300', '300-800', '800-2000', '2000+'],
      default: '300-800',
    },

    preferredDemoDate: {
      type: Date,
      default: null,
    },

    source: {
      type: String,
      enum: ['website_modal', 'voice_ai_call', 'inbound_referral', 'campaign'],
      default: 'website_modal',
    },

    voiceAiCallId: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ['new', 'contacted', 'demo_scheduled', 'pilot_active', 'closed_won', 'closed_lost'],
      default: 'new',
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for fast lead sorting by creation date
CampusLeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CampusLead', CampusLeadSchema);
