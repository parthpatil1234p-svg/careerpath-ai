/**
 * routes/authRoutes.js — Authentication Endpoints
 *
 * Mounted at: /api/auth  (in server.js)
 *
 * Routes:
 *   POST /api/auth/register     → validateRegister → registerUser
 *   POST /api/auth/verify-otp   → verifyOtp
 *   POST /api/auth/resend-otp   → resendOtp
 *   POST /api/auth/login        → validateLogin    → loginUser
 */

const express = require('express');

const {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  googleAuth,
  getGoogleConfig,
  githubAuth,
  connectGitHub,
  getGitHubConfig,
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, registerUser);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOtp);

// POST /api/auth/login
router.post('/login', validateLogin, loginUser);

// POST /api/auth/google — Google OAuth2 Sign-In & Sign-Up
router.post('/google', googleAuth);

// GET /api/auth/google/config — Public Google Client ID
router.get('/google/config', getGoogleConfig);

// POST /api/auth/github — GitHub OAuth Sign-In & Sign-Up
router.post('/github', githubAuth);

// POST /api/auth/github/connect — Connect & analyze GitHub study repos for logged-in user
router.post('/github/connect', protect, connectGitHub);

// GET /api/auth/github/config — Public GitHub Client ID
router.get('/github/config', getGitHubConfig);

module.exports = router;
