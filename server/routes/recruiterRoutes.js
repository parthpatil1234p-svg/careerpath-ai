/**
 * routes/recruiterRoutes.js — Corporate Recruiter & Job Management Routes
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const express = require('express');
const router = express.Router();
const {
  verifyCompanyPrecheck,
  registerRecruiter,
  getRecruiterProfile,
  createJob,
  getMyJobs,
  getJobDetails,
  updateJob,
  deleteJob,
  getJobApplicants,
  updateApplicationStatus,
} = require('../controllers/recruiterController');
const { protect, authorize, requireVerifiedRecruiter } = require('../middleware/authMiddleware');

// ── Public Routes (Onboarding & Company Verification) ─────────
router.post('/verify-company-precheck', verifyCompanyPrecheck);
router.post('/register', registerRecruiter);

// ── Protected Recruiter Routes ────────────────────────────────
router.get('/profile', protect, getRecruiterProfile);

// Job Openings Management
router.post('/jobs', protect, requireVerifiedRecruiter, createJob);
router.get('/jobs', protect, getMyJobs);
router.get('/jobs/:id', protect, getJobDetails);
router.patch('/jobs/:id', protect, updateJob);
router.delete('/jobs/:id', protect, deleteJob);

// Candidate Applications & Hiring Stages
router.get('/jobs/:id/applicants', protect, getJobApplicants);
router.patch('/applications/:appId/status', protect, updateApplicationStatus);

module.exports = router;
